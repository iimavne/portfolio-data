// Traduction automatique FR -> EN du contenu géré par Keystatic (src/content/).
// Lancé par la GitHub Action .github/workflows/traduction.yml, en deux temps :
//
//   node scripts/traduction/traduire.mjs preparer [--tout] [--essai]
//     Repère les textes à traduire et les traduit avec Gemini. Ce que Gemini n'a pas
//     pu traduire est mis de côté pour le moteur de secours (Argos, voir argos.py).
//   node scripts/traduction/traduire.mjs appliquer
//     Écrit les traductions. S'il en manque une seule, n'écrit RIEN et échoue
//     (le site garde le français en attendant).
//
// Options : --tout  = retraduire tous les textes, même ceux déjà traduits
//           --essai = afficher ce qui serait traduit, sans appeler Gemini ni rien écrire
//
// PRINCIPE : l'Action n'écrit JAMAIS dans les fiches de l'admin (src/content/). Elle a ses
// propres fichiers, dans src/i18n/auto/ :
//   - textes.json : dictionnaire « texte français -> traduction » de tous les champs courts.
//       Rangé par texte et non par position : réordonner ou déplacer un élément dans l'admin
//       ne mélange jamais les traductions. Un texte français nouveau ou modifié n'y est pas
//       encore : il est traduit au passage suivant (en attendant, le site affiche le français).
//   - projets/<projet>.mdoc : contenu anglais de chaque page projet. Son champ `source` est
//       l'empreinte du contenu français traduit : s'il ne correspond plus, on retraduit.
//   - manuels.json : les versions anglaises écrites À LA MAIN par l'étudiant (sections
//       « Version anglaise » de l'admin). Pour chacune (repérée par son empreinte) : les
//       empreintes du français pour lequel elle a été écrite. Si ce français change ensuite,
//       le site met la version manuelle de côté et affiche la traduction automatique
//       (src/lib/traduction.ts), jusqu'à ce que l'étudiant la mette à jour.
// L'admin et l'Action n'écrivant jamais dans les mêmes fichiers, Keystatic ne trouve jamais
// une fiche « modifiée depuis son ouverture » (pas de demande de nouvelle branche), et un
// formulaire resté ouvert ne peut pas écraser une traduction.
//
// Variables d'environnement : GEMINI_API_KEY (secret GitHub), MODELE (nom du modèle Gemini),
// GITHUB_OUTPUT et GITHUB_STEP_SUMMARY (fournies par GitHub Actions).

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { cleAccent, cleTexte, empreinte } from '../../src/lib/empreinte.mjs';

// ----- Réglages -----
const AUTO = 'src/i18n/auto'; // fichiers écrits par l'Action
const TEXTES = `${AUTO}/textes.json`;
const MANUELS = `${AUTO}/manuels.json`;
const CONTENUS = `${AUTO}/projets`;
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

// Objet aux clés triées : fichiers JSON stables, donc des commits lisibles
const trier = (objet) => Object.fromEntries(Object.entries(objet).sort(([a], [b]) => a.localeCompare(b)));

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

// ===========================================================================
// 2. Repérage des textes à traduire
// ===========================================================================

// Parcourt tout le contenu et renvoie :
//   - textes   : les textes français des champs courts (une fois chacun, même s'il revient
//                dans plusieurs champs), avec leur consigne éventuelle pour Gemini ;
//   - contenus : le contenu de chaque page projet ;
//   - manuels  : les versions anglaises écrites à la main, avec le français correspondant.
function collecter() {
  const textes = new Map(); // clé du dictionnaire -> unité
  const contenus = [];
  const manuels = [];

  const ajouterTexte = (fr, extra = {}) => {
    const cle = extra.cle ?? cleTexte(fr);
    if (!textes.has(cle)) textes.set(cle, { id: cle, fr: fr.trim(), ...extra, cle: undefined });
  };

  // Un champ : son texte français, et la version anglaise écrite à la main s'il y en a une
  const champ = (fr, enManuel, ou, extra) => {
    if (!affichable(fr)) return;
    ajouterTexte(fr, extra);
    if (affichable(enManuel)) manuels.push({ en: enManuel, fr, ou });
  };
  // Plusieurs champs d'un même objet : le français dans `objet[nom]`, l'anglais dans `objet.en[nom]`
  const champsDe = (objet, noms, ou, extras = {}) => {
    for (const nom of noms) champ(objet?.[nom], objet?.en?.[nom], `${ou} > ${nom}`, extras[nom]);
  };

  // Projets (les brouillons ne sont pas traduits)
  for (const fichier of lister('src/content/projets', '.mdoc')) {
    const { donnees, corps } = lireMdoc(fichier);
    if (donnees.brouillon) continue;
    const projet = path.basename(fichier, '.mdoc');

    champsDe(donnees, ['titre', 'domaine', 'contexte', 'resume'], projet, {
      domaine: { consigne: 'One to three words: the field or sector.' },
      contexte: { consigne: 'Keep the " · " separators.' },
      resume: { consigne: `At most ${RESUME_MAX} characters.`, max: RESUME_MAX },
    });
    // Seule exception à la règle `en` : l'« En bref » anglais est rangé dans en.enBref
    for (const c of ['probleme', 'methode', 'resultat']) {
      champ(donnees.enBref?.[c], donnees.en?.enBref?.[c], `${projet} > En bref > ${c}`);
    }
    (donnees.ressources ?? []).forEach((r, i) => champsDe(r, ['libelle'], `${projet} > ressource ${i + 1}`));

    // Contenu de la page
    if (affichable(corps)) {
      contenus.push({ id: `contenu:${projet}`, projet, fr: corps, contenu: true, fichier: `${CONTENUS}/${projet}.mdoc` });
      // Contenu anglais écrit à la main (champ « Contenu de la page (version anglaise) » de l'admin)
      const manuel = `src/content/projets/${projet}/contenu_en.mdoc`;
      const en = fs.existsSync(manuel) ? fs.readFileSync(manuel, 'utf8') : '';
      if (affichable(en)) manuels.push({ en, fr: corps, ou: `${projet} > contenu de la page` });
    }
  }

  // Fichiers JSON : formations (et leurs cours), compétences, paramètres
  const json = (fichier) => (fs.existsSync(fichier) ? lireJson(fichier) : undefined);

  for (const fichier of lister('src/content/formations', '.json')) {
    const d = json(fichier);
    const nom = path.basename(fichier, '.json');
    champsDe(d, ['intitule', 'etablissement', 'niveau'], nom);
    (d.cours ?? []).forEach((c, i) => champsDe(c, ['nom', 'notions', 'classement'], `${nom} > cours ${i + 1}`));
  }

  const competences = json('src/content/pages/competences.json');
  (competences?.competences ?? []).forEach((c, i) => champsDe(c, ['nom'], `compétence ${i + 1}`));

  const p = json('src/content/pages/parametres.json');
  if (p) {
    champsDe(p, ['labelFormation', 'positionnement'], 'paramètres');
    // La partie en couleur doit être un extrait exact du positionnement anglais
    if (affichable(p.positionnement)) {
      champ(p.positionnementAccent, p.en?.positionnementAccent, 'paramètres > positionnementAccent', {
        cle: cleAccent(p.positionnement, p.positionnementAccent ?? ''),
        accentDe: cleTexte(p.positionnement),
      });
    }
    (p.domainesVises ?? []).forEach((l, i) => champsDe(l, ['domaine'], `paramètres > domaine visé ${i + 1}`));
    (p.langues ?? []).forEach((l, i) => champsDe(l, ['langue', 'precision'], `paramètres > langue ${i + 1}`));
    (p.recherches ?? []).forEach((l, i) => champsDe(l, ['debut', 'details'], `paramètres > recherche ${i + 1}`));
  }

  return { textes, contenus, manuels };
}

// Empreinte du français dont un contenu anglais automatique est la traduction
const sourceDe = (fichier) => (fs.existsSync(fichier) ? String(lireMdoc(fichier).donnees.source ?? '') : '');

// Ce qu'il faut traduire : les textes absents du dictionnaire et les contenus dont le
// français a changé (ou tout, avec --tout)
function decisions() {
  const { textes, contenus, manuels } = collecter();
  const dico = lireJson(TEXTES, {});

  const aTraduire = [...textes.values()].filter((t) => TOUT || typeof dico[t.id] !== 'string');
  for (const c of contenus) {
    c.source = empreinte(c.fr);
    if (TOUT || sourceDe(c.fichier) !== c.source) aTraduire.push(c);
  }

  // Consigne de la partie en couleur : extrait de la traduction du positionnement, qu'elle
  // soit faite dans la même requête ou déjà dans le dictionnaire
  for (const unite of aTraduire.filter((u) => u.accentDe)) {
    if (aTraduire.some((u) => u.id === unite.accentDe)) {
      unite.consigne = 'Must be an exact excerpt, copied character for character, of the translation of the "positionnement" item.';
    } else if (dico[unite.accentDe]) {
      unite.consigne = `Must be an exact excerpt, copied character for character, of this English sentence: "${dico[unite.accentDe]}"`;
    }
  }
  return { textes, contenus, manuels, dico, aTraduire };
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
      // Le fichier anglais (src/i18n/auto/projets/) est un dossier plus bas que le français
      // (src/content/projets/) : ses images remontent d'un niveau de plus
      .replace(/\]\(\.\.\/\.\.\/assets\//g, '](../../../assets/')
  );
}

const reperesDe = (texte) => (texte.match(/⟦A?\d+⟧/g) ?? []).sort().join(' ');

// Liste des morceaux à envoyer pour les unités à traduire (clé -> texte)
function morceaux(unites) {
  const liste = [];
  for (const unite of unites) {
    if (!unite.contenu) {
      liste.push({ cle: unite.id, texte: unite.fr, consigne: unite.consigne, lieA: unite.accentDe });
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
  // Une consigne qui renvoie à un autre élément (la partie en couleur du positionnement)
  // reçoit l'identifiant court de cet élément.
  const id = (i) => `t${i}`;
  const entree = {
    textes: Object.fromEntries(lot.map((m, i) => [id(i), m.texte])),
    consignes: Object.fromEntries(
      lot.flatMap((m, i) => {
        const consigne = m.consigne?.replace('"positionnement" item', `"${id(lot.findIndex((x) => x.cle === m.lieA))}" item`);
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
  const { textes, contenus, aTraduire } = decisions();

  console.log(`Modèle : ${MODELE}${TOUT ? ' · option « tout retraduire »' : ''}`);
  console.log(`Textes : ${textes.size} · contenus de pages : ${contenus.length} · à traduire : ${aTraduire.length}`);
  for (const u of aTraduire) console.log(`  + ${u.contenu ? u.id : JSON.stringify(u.fr.slice(0, 70))}`);

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
  const { textes, contenus, manuels, dico, aTraduire } = decisions();
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
  const prets = new Map(); // id de l'unité -> { unite, texte, moteurs }
  for (const unite of aTraduire) {
    if (!unite.contenu) {
      const t = traduction(unite.id, unite.fr);
      if (!t) manquants.push(unite.id);
      else prets.set(unite.id, { unite, texte: t.texte.trim(), moteurs: [t.moteur] });
      continue;
    }
    const sections = unite.plan.sections.map((s, i) => traduction(`${unite.id}§${i}`, s));
    const attributs = unite.plan.attributs.map((a, i) => traduction(`${unite.id}@${i}`, a));
    if ([...sections, ...attributs].some((t) => !t)) {
      manquants.push(unite.id);
      continue;
    }
    prets.set(unite.id, {
      unite,
      texte: recomposerContenu(unite.plan, sections.map((t) => t.texte), attributs.map((t) => t.texte)),
      moteurs: [...sections, ...attributs].map((t) => t.moteur),
    });
  }

  // Échec : on n'écrit rien, le site garde le français en attendant
  if (manquants.length) {
    bilan({ erreur: true, prets: [...prets.values()], manquants, obsoletes: [], messages: sortie.messages ?? [] });
    console.error(`\n${manquants.length} texte(s) non traduit(s) : aucun fichier modifié.`);
    process.exit(1);
  }

  // Petites vérifications avant d'écrire
  for (const pret of prets.values()) {
    const { unite } = pret;
    // Résumé : 160 caractères au plus
    if (unite.max && pret.texte.length > unite.max) {
      pret.texte = `${pret.texte.slice(0, unite.max - 1).replace(/\s+\S*$/, '')}…`;
    }
    // Partie en couleur : doit se retrouver telle quelle dans le positionnement anglais
    if (unite.accentDe) {
      const phrase = prets.get(unite.accentDe)?.texte ?? dico[unite.accentDe] ?? '';
      if (!phrase.includes(pret.texte)) {
        // Écart de majuscules seulement : on reprend le morceau exact du positionnement
        const debut = phrase.toLowerCase().indexOf(pret.texte.toLowerCase());
        if (debut >= 0) pret.texte = phrase.slice(debut, debut + pret.texte.length);
        else console.log('  La partie en couleur est introuvable dans le positionnement anglais : le titre EN restera sans couleur.');
      }
    }
  }

  // ----- Écriture -----
  // 1. Dictionnaire : les textes encore utilisés sur le site (les anciens sont retirés)
  const nouveauDico = {};
  for (const id of textes.keys()) nouveauDico[id] = prets.get(id)?.texte ?? dico[id];
  ecrireJson(TEXTES, trier(nouveauDico));

  // 2. Contenus des pages : les nouveaux, et suppression de ceux des projets disparus
  for (const c of contenus) {
    const pret = prets.get(c.id);
    if (!pret) continue;
    fs.mkdirSync(CONTENUS, { recursive: true });
    const corps = pret.texte.endsWith('\n') ? pret.texte : `${pret.texte}\n`;
    fs.writeFileSync(c.fichier, `---\n# Traduction automatique de src/content/projets/${c.projet}.mdoc (ne pas modifier à la main)\nsource: ${c.source}\n---\n${corps}`);
  }
  const attendus = new Set(contenus.map((c) => c.fichier));
  for (const fichier of lister(CONTENUS, '.mdoc')) if (!attendus.has(fichier)) fs.rmSync(fichier);

  // 3. Versions écrites à la main : une nouvelle est notée avec son français du moment ;
  //    une déjà connue garde son français d'origine (s'il a changé depuis, elle est mise de côté)
  const anciens = lireJson(MANUELS, {});
  const nouveaux = {};
  const obsoletes = [];
  for (const m of manuels) {
    const cle = empreinte(m.en);
    const fr = empreinte(m.fr);
    if (anciens[cle]) {
      nouveaux[cle] = anciens[cle];
      if (!anciens[cle].includes(fr)) obsoletes.push(m.ou);
    } else {
      nouveaux[cle] = [...new Set([...(nouveaux[cle] ?? []), fr])];
    }
  }
  ecrireJson(MANUELS, trier(nouveaux));

  for (const pret of prets.values()) for (const m of pret.moteurs) if (m) moteurs[m]++;
  bilan({ erreur: false, prets: [...prets.values()], manquants, obsoletes, messages: sortie.messages ?? [], moteurs });
  const message = prets.size
    ? `Traduction automatique FR → EN (${prets.size} texte${prets.size > 1 ? 's' : ''})`
    : 'Traduction automatique : fichiers de suivi à jour';
  ecrireJson(`${TRAVAIL}/bilan.json`, { message });
  console.log(prets.size ? message : 'Rien à traduire.');
}

// Résumé affiché sur la page de l'exécution (onglet Summary de GitHub Actions)
function bilan({ erreur, prets, manquants, obsoletes, messages, moteurs }) {
  const nom = (unite) => `\`${unite.contenu ? unite.id : unite.fr.slice(0, 80)}\``;
  const lignes = [`## Traduction automatique FR → EN`, '', `Modèle : \`${MODELE}\``, ''];
  if (erreur) {
    lignes.push('### ❌ Échec : aucun fichier modifié', '', 'Le site continue d’afficher le français pour ces textes :', '');
    lignes.push(...manquants.map((id) => `- \`${id.slice(0, 80)}\``));
  } else if (!prets.length) {
    lignes.push('Rien à traduire : tout est à jour.');
  } else {
    lignes.push(`### ✅ ${prets.length} texte(s) traduit(s) (Gemini : ${moteurs.Gemini} morceaux, Argos : ${moteurs.Argos})`, '');
    lignes.push(...prets.map((p) => `- ${nom(p.unite)}`));
  }
  if (obsoletes.length) {
    lignes.push('', '### Versions anglaises écrites à la main, mises de côté (le français a changé depuis)', '');
    lignes.push(...obsoletes.map((ou) => `- ${ou}`));
  }
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
