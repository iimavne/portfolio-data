// Traduction automatique FR -> EN du contenu géré par Keystatic (src/content/).
// Lancé par la GitHub Action .github/workflows/traduction.yml, en deux temps :
//
//   node scripts/traduction/traduire.mjs preparer [--tout] [--essai]
//     Repère les textes à traduire et les traduit avec Gemini. Ce que Gemini n'a pas
//     pu traduire est mis de côté pour le moteur de secours (Argos, voir argos.py).
//   node scripts/traduction/traduire.mjs appliquer
//     Écrit les traductions dans les fichiers. S'il en manque une seule, n'écrit RIEN
//     et échoue (le site garde le français en attendant).
//
// Options : --tout  = retraduire aussi les textes déjà traduits automatiquement
//                     (jamais ceux écrits ou retouchés par l'étudiant)
//           --essai = afficher ce qui serait traduit, sans appeler Gemini ni rien écrire
//
// Quand un texte est-il traduit ? Le fichier src/i18n/traductions.json garde, pour chaque
// champ, une empreinte du texte FR traduit et du texte EN produit. Un champ EN est :
//   - vide                               -> traduit ;
//   - identique à ce que l'Action a écrit -> retraduit seulement si le FR a changé (ou --tout) ;
//   - différent                          -> écrit ou retouché par l'étudiant : jamais modifié,
//                                           et le projet passe en "Traduction anglaise relue".
// Un projet coché "Traduction anglaise relue" ne reçoit plus que ses champs EN vides.
//
// Variables d'environnement : GEMINI_API_KEY (secret GitHub), MODELE (nom du modèle Gemini),
// GITHUB_OUTPUT et GITHUB_STEP_SUMMARY (fournies par GitHub Actions).

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

// ----- Réglages -----
const ETAT = 'src/i18n/traductions.json';
const GLOSSAIRE = 'src/i18n/glossaire.json';
const TRAVAIL = '.traduction'; // fichiers temporaires entre les étapes (ignorés par Git)
const MODELE = process.env.MODELE || 'gemini-3.5-flash-lite';
const TAILLE_MAX = 15000; // caractères envoyés par requête : un contenu plus long est découpé
const PAUSE_ENTRE_REQUETES = 4000; // millisecondes, pour rester sous la limite par minute
const RESUME_MAX = 160; // même limite que le résumé FR (src/content.config.ts)

const [etape = 'preparer', ...options] = process.argv.slice(2);
const TOUT = options.includes('--tout');
const ESSAI = options.includes('--essai');

// ===========================================================================
// 1. Petits outils
// ===========================================================================

const lireJson = (fichier, defaut) =>
  fs.existsSync(fichier) ? JSON.parse(fs.readFileSync(fichier, 'utf8')) : defaut;

function ecrireJson(fichier, donnees) {
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  fs.writeFileSync(fichier, `${JSON.stringify(donnees, null, 2)}\n`);
}

const empreinte = (texte) => createHash('sha256').update(String(texte).trim()).digest('hex').slice(0, 16);
const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
const contientDesLettres = (texte) => /\p{L}/u.test(texte);

// Même règle que le site (src/lib/texte.ts) : vide ou entièrement entre crochets = rien à traduire
const affichable = (texte) => typeof texte === 'string' && texte.trim() !== '' && !/^\[[^\]]*\]$/.test(texte.trim());

const lister = (dossier, extension) =>
  fs.existsSync(dossier)
    ? fs.readdirSync(dossier).filter((f) => f.endsWith(extension)).sort().map((f) => `${dossier}/${f}`)
    : [];

// Fichier .mdoc : en-tête YAML + contenu. CORE_SCHEMA garde les dates telles quelles (texte).
function lireMdoc(fichier) {
  const texte = fs.readFileSync(fichier, 'utf8').replace(/\r\n/g, '\n');
  const morceaux = texte.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!morceaux) throw new Error(`En-tête YAML introuvable dans ${fichier}`);
  return { donnees: yaml.load(morceaux[1], { schema: yaml.CORE_SCHEMA }) ?? {}, corps: morceaux[2] };
}

function ecrireMdoc(fichier, donnees, corps) {
  const entete = yaml.dump(donnees, { schema: yaml.CORE_SCHEMA, lineWidth: 80, noRefs: true });
  fs.writeFileSync(fichier, `---\n${entete}---\n${corps}`);
}

// Lecture / écriture d'une valeur par son chemin, ex. ['enBref_en', 'probleme']
const lire = (objet, chemin) => chemin.reduce((o, cle) => o?.[cle], objet);

// Une clé nouvelle est placée juste après `apres` (même ordre que dans l'admin)
function ecrire(objet, chemin, valeur, apres) {
  const parent = chemin.slice(0, -1).reduce((o, cle) => (o[cle] ??= {}), objet);
  const cle = chemin.at(-1);
  if (cle in parent || !apres || !(apres in parent)) {
    parent[cle] = valeur;
    return;
  }
  const entrees = Object.entries(parent);
  for (const k of Object.keys(parent)) delete parent[k];
  for (const [k, v] of entrees) {
    parent[k] = v;
    if (k === apres) parent[cle] = valeur;
  }
}

// ===========================================================================
// 2. Repérage des textes à traduire
// ===========================================================================

// Une "unité" = un champ FR et son champ EN (ou le contenu d'une page projet).
function collecter() {
  const fichiers = new Map(); // chemin -> { type: 'json' | 'mdoc', donnees, corps }
  const unites = [];

  const ajouterChamps = (fichier, donnees, champs, commun = {}) => {
    for (const { fr, en, apres, consigne } of champs) {
      unites.push({
        id: `${fichier}#${en.join('.')}`,
        fichier,
        fr: lire(donnees, fr),
        en: lire(donnees, en),
        cheminEn: en,
        apres,
        consigne,
        ...commun,
      });
    }
  };
  const champ = (fr, en, extra = {}) => ({ fr, en, apres: fr.at(-1), ...extra });

  // Projets (les brouillons, comme le projet modèle, ne sont pas traduits)
  for (const fichier of lister('src/content/projets', '.mdoc')) {
    const { donnees, corps } = lireMdoc(fichier);
    if (donnees.brouillon) continue;
    fichiers.set(fichier, { type: 'mdoc', donnees, corps });
    const commun = { projet: fichier, relu: Boolean(donnees.traductionRelue) };

    // Les champs EN des projets sont regroupés en bas du formulaire : pas de placement "après"
    const enBas = (fr, en, consigne) => ({ fr, en, consigne });
    ajouterChamps(
      fichier,
      donnees,
      [
        enBas(['titre'], ['titre_en']),
        enBas(['domaine'], ['domaine_en'], 'One to three words: the field or sector.'),
        enBas(['contexte'], ['contexte_en'], 'Keep the " · " separators.'),
        enBas(['resume'], ['resume_en'], `At most ${RESUME_MAX} characters.`),
        ...['probleme', 'methode', 'resultat'].map((c) => enBas(['enBref', c], ['enBref_en', c])),
        ...(donnees.ressources ?? []).map((_, i) => champ(['ressources', i, 'libelle'], ['ressources', i, 'libelle_en'])),
      ],
      commun,
    );

    // Contenu de la page : traduit dans un fichier à part (champ "contenu_en" de l'admin)
    const fichierEn = `${fichier.replace(/\.mdoc$/, '')}/contenu_en.mdoc`;
    unites.push({
      id: fichierEn,
      fichier: fichierEn,
      fr: corps,
      en: fs.existsSync(fichierEn) ? fs.readFileSync(fichierEn, 'utf8') : '',
      contenu: true,
      ...commun,
    });
  }

  // Fichiers JSON : formations, cours, compétences, paramètres
  const json = (fichier, champs) => {
    if (!fs.existsSync(fichier)) return;
    const donnees = lireJson(fichier);
    fichiers.set(fichier, { type: 'json', donnees });
    ajouterChamps(fichier, donnees, champs(donnees));
  };

  for (const fichier of lister('src/content/formations', '.json')) {
    json(fichier, () => ['intitule', 'etablissement', 'niveau'].map((c) => champ([c], [`${c}_en`])));
  }
  for (const fichier of lister('src/content/cours', '.json')) {
    json(fichier, () => ['nom', 'notions', 'classement'].map((c) => champ([c], [`${c}_en`])));
  }
  json('src/content/pages/competences.json', (d) =>
    (d.competences ?? []).map((_, i) => champ(['competences', i, 'nom'], ['competences', i, 'nom_en'])),
  );
  json('src/content/pages/parametres.json', (d) => [
    champ(['labelFormation'], ['labelFormation_en']),
    champ(['positionnement'], ['positionnement_en']),
    champ(['positionnementAccent'], ['positionnementAccent_en'], {
      consigne: 'Must be an exact excerpt, copied character for character, of the translation of the "positionnement_en" item.',
    }),
    ...(d.domainesVises ?? []).map((_, i) => champ(['domainesVises', i, 'domaine'], ['domainesVises', i, 'domaine_en'])),
    ...(d.langues ?? []).flatMap((_, i) => [
      champ(['langues', i, 'langue'], ['langues', i, 'langue_en']),
      champ(['langues', i, 'precision'], ['langues', i, 'precision_en']),
    ]),
    ...(d.recherches ?? []).flatMap((_, i) => [
      champ(['recherches', i, 'debut'], ['recherches', i, 'debut_en']),
      champ(['recherches', i, 'details'], ['recherches', i, 'details_en']),
    ]),
  ]);

  return { fichiers, unites };
}

// Décision pour une unité : 'ignorer' | 'traduire' | 'garder' | 'humain'
function decider(unite, etat) {
  if (!affichable(unite.fr)) return 'ignorer';
  const en = typeof unite.en === 'string' ? unite.en.trim() : '';
  if (!en) return 'traduire';
  const memo = etat[unite.id];
  if (!memo || memo.en !== empreinte(en)) return 'humain'; // écrit ou retouché par l'étudiant
  if (unite.relu) return 'garder';
  return TOUT || memo.fr !== empreinte(unite.fr) ? 'traduire' : 'garder';
}

function decisions() {
  const { fichiers, unites } = collecter();
  const etat = lireJson(ETAT, {});
  for (const unite of unites) unite.decision = decider(unite, etat);

  // Le positionnement et sa partie en couleur vont ensemble : l'un retraduit, l'autre aussi
  const position = unites.find((u) => u.id.endsWith('#positionnement_en'));
  const accent = unites.find((u) => u.id.endsWith('#positionnementAccent_en'));
  if (position && accent && [position, accent].some((u) => u.decision === 'traduire')) {
    for (const u of [position, accent]) if (u.decision === 'garder') u.decision = 'traduire';
  }
  return { fichiers, unites, etat };
}

// ===========================================================================
// 3. Contenu des pages : le code et les balises ne partent jamais à la traduction
// ===========================================================================

// Remplace par des repères ⟦n⟧ : blocs de code, balises Markdoc {% ... %}, code dans une
// phrase et adresses des liens / images. Les attributs lisibles des balises (question,
// résultat, légende) sont traduits à part (repères ⟦An⟧). Puis découpe par section (##).
function decouperContenu(corps) {
  const reperes = [];
  const attributs = [];
  const garder = (texte) => {
    reperes.push(texte);
    return `⟦${reperes.length - 1}⟧`;
  };

  const protege = corps
    .replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, garder)
    .replace(/\{%[\s\S]*?%\}/g, (balise) =>
      garder(
        balise.replace(/\b(question|resultat|legende)="((?:[^"\\]|\\.)*)"/g, (_, nom, valeur) => {
          attributs.push(valeur.replace(/\\"/g, '"'));
          return `${nom}="⟦A${attributs.length - 1}⟧"`;
        }),
      ),
    )
    .replace(/`[^`\n]+`/g, garder)
    .replace(/(\]\()([^)\s]+)/g, (_, debut, adresse) => debut + garder(adresse));

  const sections = protege.split(/\n(?=## )/);
  return { sections, reperes, attributs };
}

function recomposerContenu(plan, sectionsEn, attributsEn) {
  return (
    sectionsEn
      .join('\n')
      .replace(/⟦(\d+)⟧/g, (_, n) => plan.reperes[n])
      .replace(/⟦A(\d+)⟧/g, (_, n) => attributsEn[n].replace(/"/g, '\\"'))
      // Le fichier anglais est rangé un dossier plus bas : ses images remontent d'un niveau de plus
      .replace(/\]\(\.\.\/\.\.\/assets\//g, '](../../../assets/')
  );
}

const reperesDe = (texte) => (texte.match(/⟦A?\d+⟧/g) ?? []).sort().join(' ');

// Liste des morceaux à envoyer pour les unités à traduire (clé -> texte)
function morceaux(unites) {
  const liste = [];
  for (const unite of unites) {
    if (!unite.contenu) {
      liste.push({ cle: unite.id, texte: unite.fr.trim(), consigne: unite.consigne });
      continue;
    }
    unite.plan = decouperContenu(unite.fr);
    unite.plan.sections.forEach((texte, i) => {
      if (contientDesLettres(texte.replace(/⟦A?\d+⟧/g, ''))) liste.push({ cle: `${unite.id}§${i}`, texte });
    });
    unite.plan.attributs.forEach((texte, i) => {
      if (contientDesLettres(texte)) liste.push({ cle: `${unite.id}@${i}`, texte });
    });
  }
  return liste;
}

// ===========================================================================
// 4. Gemini
// ===========================================================================

function consigneGemini(glossaire) {
  const termes = Object.entries(glossaire.termes ?? {})
    .map(([fr, en]) => `- "${fr}" -> "${en}"`)
    .join('\n');
  return [
    'You translate the content of a data science portfolio from French to English.',
    'The author is a Master’s student in applied mathematics and data science; the readers are recruiters.',
    'Use a professional, plain and precise tone. Keep the first person when the French uses it.',
    'Always follow this glossary (French -> English):',
    termes,
    'Never translate code, file names, library or software names.',
    'Copy every marker like ⟦3⟧ or ⟦A0⟧ exactly, unchanged, at the matching place.',
    'Keep the Markdown formatting (## headings, lists, **bold**, line breaks).',
    'Use English number formatting (336,776 instead of 336 776; 17.35 instead of 17,35).',
    'The input is a JSON object: "textes" maps ids to French texts, "consignes" gives extra rules for some ids.',
    'Answer ONLY with a JSON object mapping exactly the same ids to their English translation.',
  ].join('\n');
}

class ErreurGemini extends Error {
  constructor(message, { statut = 0, tropGros = false, quotaJour = false, attente = 0 } = {}) {
    super(message);
    Object.assign(this, { statut, tropGros, quotaJour, attente });
  }

  // Clé refusée, modèle inconnu ou quota du jour épuisé : inutile de réessayer
  get definitive() {
    return this.quotaJour || [401, 403, 404].includes(this.statut) || /API key/i.test(this.message);
  }
}

async function appelGemini(lot, glossaire) {
  // Identifiants courts envoyés à Gemini (t0, t1...), remis en correspondance au retour.
  // Le nom de l'élément est joint aux consignes pour qu'il sache de quoi il s'agit.
  const id = (i) => `t${i}`;
  const entree = {
    textes: Object.fromEntries(lot.map((m, i) => [id(i), m.texte])),
    consignes: Object.fromEntries(
      lot.flatMap((m, i) => {
        const consigne = m.consigne?.replace('"positionnement_en" item', `"${id(lot.findIndex((x) => x.cle.endsWith('#positionnement_en')))}" item`);
        return consigne ? [[id(i), consigne]] : [];
      }),
    ),
  };

  const reponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODELE)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY ?? '' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: consigneGemini(glossaire) }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(entree) }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );

  if (!reponse.ok) {
    // Seul le message d'erreur de Gemini est affiché (jamais la requête ni la clé)
    const corps = await reponse.json().catch(() => ({}));
    const message = corps.error?.message ?? reponse.statusText;
    const infoAttente = (corps.error?.details ?? []).find((d) => String(d['@type']).includes('RetryInfo'));
    throw new ErreurGemini(`Gemini ${reponse.status} : ${message}`, {
      statut: reponse.status,
      tropGros: reponse.status === 413 || (reponse.status === 400 && /token|too (long|large)|exceed/i.test(message)),
      quotaJour: reponse.status === 429 && /per ?day|daily/i.test(message),
      attente: reponse.status === 429 || reponse.status >= 500 ? parseFloat(infoAttente?.retryDelay) || 20 : 0,
    });
  }

  const donnees = await reponse.json();
  const candidat = donnees.candidates?.[0];
  if (candidat?.finishReason === 'MAX_TOKENS') throw new ErreurGemini('Réponse coupée : trop longue', { tropGros: true });
  const texte = (candidat?.content?.parts ?? []).map((p) => p.text ?? '').join('');
  let traductions;
  try {
    traductions = JSON.parse(texte);
  } catch {
    throw new ErreurGemini('Réponse illisible (JSON invalide)', { tropGros: lot.length > 1 });
  }
  return Object.fromEntries(lot.map((m, i) => [m.cle, traductions[id(i)]]));
}

// Appel avec reprises : attente demandée par Gemini (quota par minute, erreur passagère)
async function appelAvecReprises(lot, glossaire) {
  for (let essai = 1; ; essai++) {
    try {
      return await appelGemini(lot, glossaire);
    } catch (erreur) {
      if (!(erreur instanceof ErreurGemini) || !erreur.attente || erreur.definitive || essai >= 3) throw erreur;
      const secondes = Math.min(erreur.attente, 60);
      console.log(`  ${erreur.message} -> nouvel essai dans ${secondes} s`);
      await pause(secondes * 1000);
    }
  }
}

// Traduit un lot ; s'il est trop gros, le coupe en deux, et un morceau trop gros à lui seul
// est découpé par paragraphes. Ce qui échoue quand même part au secours (Argos).
async function traduireLot(lot, contexte) {
  if (contexte.geminiIndisponible) {
    contexte.echecs.push(...lot);
    return;
  }
  try {
    const traductions = await appelAvecReprises(lot, contexte.glossaire);
    for (const morceau of lot) {
      const en = traductions[morceau.cle];
      if (typeof en === 'string' && en.trim() && reperesDe(en) === reperesDe(morceau.texte)) {
        contexte.resultats[morceau.cle] = en;
      } else {
        contexte.echecs.push(morceau); // traduction absente, vide, ou repères abîmés
      }
    }
  } catch (erreur) {
    if (erreur.tropGros && lot.length > 1) {
      const milieu = Math.ceil(lot.length / 2);
      await traduireLot(lot.slice(0, milieu), contexte);
      await traduireLot(lot.slice(milieu), contexte);
      return;
    }
    const paragraphes = lot.length === 1 ? lot[0].texte.split(/\n{2,}/) : [];
    if (erreur.tropGros && paragraphes.length > 1) {
      const sousLot = paragraphes.map((texte, i) => ({ cle: `${lot[0].cle}¶${i}`, texte }));
      const avant = contexte.echecs.length;
      await traduireLot(sousLot, contexte);
      if (contexte.echecs.length === avant) {
        contexte.resultats[lot[0].cle] = sousLot.map((m) => contexte.resultats[m.cle]).join('\n\n');
      } else {
        // Un paragraphe a échoué : tout le morceau part au secours
        contexte.echecs.splice(avant);
        contexte.echecs.push(lot[0]);
      }
      sousLot.forEach((m) => delete contexte.resultats[m.cle]);
      return;
    }
    console.log(`  Échec Gemini : ${erreur.message}`);
    contexte.messages.push(erreur.message);
    if (erreur.definitive) contexte.geminiIndisponible = true; // les lots suivants vont directement à Argos
    contexte.echecs.push(...lot);
  }
}

// Regroupe les morceaux en lots de TAILLE_MAX caractères au plus
function lots(liste) {
  const groupes = [];
  let courant = [];
  let taille = 0;
  for (const morceau of liste) {
    if (courant.length && taille + morceau.texte.length > TAILLE_MAX) {
      groupes.push(courant);
      courant = [];
      taille = 0;
    }
    courant.push(morceau);
    taille += morceau.texte.length;
  }
  if (courant.length) groupes.push(courant);
  return groupes;
}

// ===========================================================================
// 5. Secours Argos : textes découpés ligne par ligne, sans les repères ni le Markdown
// ===========================================================================

function appliquerGlossaire(texte, glossaire) {
  // Argos ne connaît pas le glossaire : on remplace d'avance les termes par leur traduction
  const termes = Object.entries(glossaire.termes ?? {}).sort((a, b) => b[0].length - a[0].length);
  return termes.reduce((t, [fr, en]) => {
    const motif = fr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return t.replace(new RegExp(`(?<![\\p{L}\\d])${motif}(?![\\p{L}\\d])`, 'giu'), en);
  }, texte);
}

// Plan d'un morceau pour Argos : suite de segments fixes (texte gardé) ou à traduire ({ cle })
function planArgos(morceau, glossaire, aTraduire) {
  let n = 0;
  return morceau.texte.split('\n').flatMap((ligne, numero) => {
    const [, prefixe, reste] = ligne.match(/^(\s*(?:#{1,6}\s+|[-*+]\s+|\d+\.\s+|>\s*)?)(.*)$/);
    const segments = [...(numero > 0 ? ['\n'] : []), prefixe];
    for (const partie of reste.split(/(⟦A?\d+⟧)/)) {
      if (!contientDesLettres(partie) || /^⟦A?\d+⟧$/.test(partie)) {
        segments.push(partie);
      } else {
        const cle = `${morceau.cle}~${n++}`;
        aTraduire[cle] = appliquerGlossaire(partie, glossaire);
        segments.push({ cle });
      }
    }
    return segments;
  });
}

// ===========================================================================
// 6. Étapes
// ===========================================================================

async function preparer() {
  const { unites } = decisions();
  const aTraduire = unites.filter((u) => u.decision === 'traduire');
  const relus = unites.filter((u) => u.decision === 'humain');

  console.log(`Modèle : ${MODELE}${TOUT ? ' · option « tout retraduire »' : ''}`);
  console.log(`À traduire : ${aTraduire.length} · gardés : ${unites.filter((u) => u.decision === 'garder').length} · écrits par l'étudiant : ${relus.length}`);
  for (const u of aTraduire) console.log(`  + ${u.id}`);

  const liste = morceaux(aTraduire);
  const contexte = { glossaire: lireJson(GLOSSAIRE, {}), resultats: {}, echecs: [], messages: [] };

  if (ESSAI) {
    console.log(`\n(Essai : ${liste.length} morceaux, ${lots(liste).length} requête(s) Gemini prévues. Rien n'est envoyé ni écrit.)`);
    return;
  }

  if (liste.length && !process.env.GEMINI_API_KEY) {
    console.log('Pas de clé GEMINI_API_KEY : tout passe au secours (Argos).');
    contexte.messages.push('Secret GEMINI_API_KEY absent');
    contexte.geminiIndisponible = true;
  }

  const groupes = lots(liste);
  for (const [i, lot] of groupes.entries()) {
    if (i > 0) await pause(PAUSE_ENTRE_REQUETES);
    console.log(`Requête Gemini ${i + 1}/${groupes.length} (${lot.length} morceaux)`);
    await traduireLot(lot, contexte);
  }

  // Ce qui a échoué est préparé pour Argos
  const pourArgos = {};
  const enAttente = Object.fromEntries(contexte.echecs.map((m) => [m.cle, planArgos(m, contexte.glossaire, pourArgos)]));

  ecrireJson(`${TRAVAIL}/resultats.json`, { modele: MODELE, gemini: contexte.resultats, enAttente, messages: contexte.messages });
  ecrireJson(`${TRAVAIL}/argos-entree.json`, pourArgos);

  const secours = Object.keys(pourArgos).length > 0;
  console.log(`Gemini : ${Object.keys(contexte.resultats).length} morceaux traduits · pour Argos : ${contexte.echecs.length}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `secours=${secours}\n`);
}

function appliquer() {
  const { fichiers, unites, etat } = decisions();
  const aTraduire = unites.filter((u) => u.decision === 'traduire');
  morceaux(aTraduire); // recalcule les plans des contenus (mêmes fichiers, mêmes résultats)

  const sortie = lireJson(`${TRAVAIL}/resultats.json`, { gemini: {}, enAttente: {}, messages: [] });
  const argos = lireJson(`${TRAVAIL}/argos-sortie.json`, {});
  const moteurs = { Gemini: 0, Argos: 0 };

  // Traduction d'un morceau : par Gemini, sinon reconstituée à partir des segments d'Argos
  const traduction = (cle, texteFr) => {
    if (typeof sortie.gemini[cle] === 'string') return { texte: sortie.gemini[cle], moteur: 'Gemini' };
    const plan = sortie.enAttente[cle];
    if (!plan) return contientDesLettres(texteFr ?? '') ? null : { texte: texteFr, moteur: null };
    if (plan.some((s) => typeof s !== 'string' && typeof argos[s.cle] !== 'string')) return null;
    return { texte: plan.map((s) => (typeof s === 'string' ? s : argos[s.cle])).join(''), moteur: 'Argos' };
  };

  const manquants = [];
  const prets = [];
  for (const unite of aTraduire) {
    if (!unite.contenu) {
      const t = traduction(unite.id, unite.fr);
      if (!t) manquants.push(unite.id);
      else prets.push({ unite, texte: t.texte.trim(), moteurs: [t.moteur] });
      continue;
    }
    const sections = unite.plan.sections.map((s, i) => traduction(`${unite.id}§${i}`, s));
    const attributs = unite.plan.attributs.map((a, i) => traduction(`${unite.id}@${i}`, a));
    if ([...sections, ...attributs].some((t) => !t)) {
      manquants.push(unite.id);
      continue;
    }
    prets.push({
      unite,
      texte: recomposerContenu(unite.plan, sections.map((t) => t.texte), attributs.map((t) => t.texte)),
      moteurs: [...sections, ...attributs].map((t) => t.moteur),
    });
  }

  // Échec : on n'écrit rien, le site garde le français en attendant
  if (manquants.length) {
    bilan({ erreur: true, prets, manquants, relus: [], messages: sortie.messages ?? [] });
    console.error(`\n${manquants.length} texte(s) non traduit(s) : aucun fichier modifié.`);
    process.exit(1);
  }

  // Petites vérifications avant d'écrire
  const valeur = (suffixe) => prets.find((p) => p.unite.id.endsWith(suffixe));
  for (const pret of prets) {
    if (pret.unite.id.endsWith('#resume_en') && pret.texte.length > RESUME_MAX) {
      pret.texte = `${pret.texte.slice(0, RESUME_MAX - 1).replace(/\s+\S*$/, '')}…`;
    }
  }
  const accent = valeur('#positionnementAccent_en');
  const position = valeur('#positionnement_en');
  if (accent && position && !position.texte.includes(accent.texte)) {
    // Écart de majuscules seulement : on reprend le morceau exact du positionnement
    const debut = position.texte.toLowerCase().indexOf(accent.texte.toLowerCase());
    if (debut >= 0) accent.texte = position.texte.slice(debut, debut + accent.texte.length);
    else console.log('  La partie en couleur est introuvable dans le positionnement anglais : le titre EN restera sans couleur.');
  }

  // Écriture
  for (const { unite, texte, moteurs: liste } of prets) {
    if (unite.contenu) {
      fs.mkdirSync(path.dirname(unite.fichier), { recursive: true });
      fs.writeFileSync(unite.fichier, texte.endsWith('\n') ? texte : `${texte}\n`);
    } else {
      ecrire(fichiers.get(unite.fichier).donnees, unite.cheminEn, texte, unite.apres);
      fichiers.get(unite.fichier).modifie = true;
    }
    etat[unite.id] = { fr: empreinte(unite.fr), en: empreinte(texte) };
    for (const m of liste) if (m) moteurs[m]++;
  }

  // Textes EN écrits ou retouchés par l'étudiant : le projet passe en "traduction relue"
  const relus = [...new Set(unites.filter((u) => u.decision === 'humain' && u.projet).map((u) => u.projet))].filter(
    (projet) => !fichiers.get(projet).donnees.traductionRelue,
  );
  for (const projet of relus) {
    fichiers.get(projet).donnees.traductionRelue = true;
    fichiers.get(projet).modifie = true;
  }

  for (const [fichier, f] of fichiers) {
    if (!f.modifie) continue;
    if (f.type === 'mdoc') ecrireMdoc(fichier, f.donnees, f.corps);
    else ecrireJson(fichier, f.donnees);
  }
  if (prets.length) ecrireJson(ETAT, Object.fromEntries(Object.entries(etat).sort()));

  bilan({ erreur: false, prets, manquants, relus, messages: sortie.messages ?? [], moteurs });
  const message = prets.length
    ? `Traduction automatique FR → EN (${prets.length} texte${prets.length > 1 ? 's' : ''})`
    : relus.length
      ? 'Traduction automatique : projets marqués « traduction relue »'
      : '';
  ecrireJson(`${TRAVAIL}/bilan.json`, { message });
  console.log(message || 'Rien à traduire.');
}

// Résumé affiché sur la page de l'exécution (onglet Summary de GitHub Actions)
function bilan({ erreur, prets, manquants, relus, messages, moteurs }) {
  const lignes = [`## Traduction automatique FR → EN`, '', `Modèle : \`${MODELE}\``, ''];
  if (erreur) {
    lignes.push('### ❌ Échec : aucun fichier modifié', '', 'Le site continue d’afficher le français pour ces textes :', '');
    lignes.push(...manquants.map((id) => `- \`${id}\``));
  } else if (!prets.length && !relus.length) {
    lignes.push('Rien à traduire : tout est à jour.');
  } else {
    lignes.push(`### ✅ ${prets.length} texte(s) traduit(s) (Gemini : ${moteurs.Gemini} morceaux, Argos : ${moteurs.Argos})`, '');
    lignes.push(...prets.map((p) => `- \`${p.unite.id}\``));
  }
  if (relus.length) lignes.push('', '### Projets passés en « traduction relue »', '', ...relus.map((p) => `- \`${p}\``));
  if (messages.length) lignes.push('', '### Messages de Gemini', '', ...[...new Set(messages)].map((m) => `- ${m}`));
  const texte = `${lignes.join('\n')}\n`;
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texte);
  else console.log(`\n${texte}`);
}

if (etape === 'preparer') await preparer();
else if (etape === 'appliquer') appliquer();
else {
  console.error('Étape inconnue : utiliser « preparer » ou « appliquer ».');
  process.exit(2);
}
