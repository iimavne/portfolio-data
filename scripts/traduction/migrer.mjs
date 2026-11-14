// Migration UNIQUE vers la traduction rangée à part (novembre 2026).
//
//   node scripts/traduction/migrer.mjs          -> migre
//   node scripts/traduction/migrer.mjs --essai  -> affiche seulement ce qui serait fait
//
// Avant : l'Action écrivait ses traductions dans les fiches de l'admin (sous-objets `en` et
// fichiers src/content/projets/<projet>/contenu_en.mdoc), avec une mémoire dans
// src/i18n/traductions.json. Après : les fiches ne gardent que les versions anglaises écrites à
// la main, et les traductions automatiques sont dans src/i18n/auto/ (voir traduire.mjs).
//
// Pour chaque texte anglais trouvé dans une fiche :
//   - traduction automatique À JOUR (d'après l'ancienne mémoire) : recopiée dans le dictionnaire
//     src/i18n/auto/textes.json (ou src/i18n/auto/projets/) : pas besoin de la redemander ;
//   - traduction périmée, ou texte que l'Action n'a pas écrit : non recopiée (listée à l'écran) ;
//   - dans tous les cas, retirée de la fiche (l'Action retraduira ce qui manque).
// La case `en.relue` des projets est retirée. Relancer le script ne fait rien de plus.
// Les traductions manquantes sont faites ensuite par l'Action (ou traduire.mjs en local).

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { cleAccent, cleTexte, empreinte } from '../../src/lib/empreinte.mjs';

const ESSAI = process.argv.includes('--essai');
const ANCIENNE_MEMOIRE = 'src/i18n/traductions.json';
const TEXTES = 'src/i18n/auto/textes.json';
const CONTENUS = 'src/i18n/auto/projets';

// Empreinte de l'ancienne mémoire (sha256), pour la relire
const ancienneEmpreinte = (texte) =>
  createHash('sha256').update(String(texte).replace(/\r\n/g, '\n').trim()).digest('hex').slice(0, 16);

const lireJson = (fichier, defaut) => (fs.existsSync(fichier) ? JSON.parse(fs.readFileSync(fichier, 'utf8')) : defaut);
const ecrireJson = (fichier, donnees) => {
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  fs.writeFileSync(fichier, `${JSON.stringify(donnees, null, 2)}\n`);
};
const lister = (dossier, extension) =>
  fs.existsSync(dossier) ? fs.readdirSync(dossier).filter((f) => f.endsWith(extension)).sort().map((f) => `${dossier}/${f}`) : [];
const estTexte = (v) => typeof v === 'string' && v.trim() !== '';

const memoire = lireJson(ANCIENNE_MEMOIRE, {});
const dictionnaire = lireJson(TEXTES, {});
const bilan = { recopies: 0, retires: 0, aRetraduire: [], pasDeLAction: [] };

// Une traduction de l'ancienne mémoire est-elle automatique et à jour ?
function etat(id, fr, en) {
  const memo = memoire[id];
  if (!memo || memo.en !== ancienneEmpreinte(en)) return 'pasDeLAction';
  return memo.fr === ancienneEmpreinte(fr) ? 'aJour' : 'perime';
}

// Parcourt un objet : chaque sous-objet `en` est vidé, ses traductions à jour vont au dictionnaire.
// `chemin` : position de l'objet dans le fichier (pour retrouver les clés de l'ancienne mémoire).
function migrerObjet(objet, chemin, fichier) {
  if (Array.isArray(objet)) {
    objet.forEach((element, i) => migrerObjet(element, [...chemin, i], fichier));
    return;
  }
  if (!objet || typeof objet !== 'object') return;

  for (const [cle, valeur] of Object.entries(objet)) if (cle !== 'en') migrerObjet(valeur, [...chemin, cle], fichier);
  if (!objet.en || typeof objet.en !== 'object') return;

  // Couples (texte français, texte anglais, chemin du champ anglais)
  const couples = [];
  for (const [cle, valeur] of Object.entries(objet.en)) {
    if (typeof valeur === 'string') couples.push({ fr: objet[cle], en: valeur, cheminEn: [...chemin, 'en', cle], cle });
    else if (valeur && typeof valeur === 'object') {
      // « En bref » des projets : en.enBref.probleme traduit enBref.probleme
      for (const [sousCle, sousValeur] of Object.entries(valeur)) {
        if (typeof sousValeur === 'string') {
          couples.push({ fr: objet[cle]?.[sousCle], en: sousValeur, cheminEn: [...chemin, 'en', cle, sousCle] });
        }
      }
    }
  }

  for (const { fr, en, cheminEn, cle } of couples) {
    if (!estTexte(en)) continue;
    const id = `${fichier}#${cheminEn.join('.')}`;
    const resultat = estTexte(fr) ? etat(id, fr, en) : 'pasDeLAction';
    if (resultat === 'aJour') {
      // La partie en couleur du positionnement a sa propre clé (elle dépend de la phrase)
      const cleDico = cle === 'positionnementAccent' ? cleAccent(objet.positionnement, fr) : cleTexte(fr);
      dictionnaire[cleDico] = en.trim();
      bilan.recopies++;
    } else {
      bilan[resultat === 'perime' ? 'aRetraduire' : 'pasDeLAction'].push(`${id}\n      EN : ${JSON.stringify(en.slice(0, 90))}`);
    }
    bilan.retires++;
  }

  // La fiche ne garde plus aucun texte anglais (ni la case « relue ») : `en` est retiré
  delete objet.en;
}

// ----- Projets -----
for (const fichier of lister('src/content/projets', '.mdoc')) {
  const texte = fs.readFileSync(fichier, 'utf8').replace(/\r\n/g, '\n');
  const [, entete, corps] = texte.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const donnees = yaml.load(entete, { schema: yaml.CORE_SCHEMA }) ?? {};
  migrerObjet(donnees, [], fichier);

  // Contenu anglais : src/content/projets/<projet>/contenu_en.mdoc -> src/i18n/auto/projets/<projet>.mdoc
  const projet = path.basename(fichier, '.mdoc');
  const ancien = `src/content/projets/${projet}/contenu_en.mdoc`;
  if (fs.existsSync(ancien)) {
    const en = fs.readFileSync(ancien, 'utf8');
    const resultat = etat(ancien, corps, en);
    if (resultat === 'aJour' && !ESSAI) {
      fs.mkdirSync(CONTENUS, { recursive: true });
      // Même profondeur de dossier : les chemins d'images (../../../assets/) restent valables
      fs.writeFileSync(
        `${CONTENUS}/${projet}.mdoc`,
        `---\n# Traduction automatique de src/content/projets/${projet}.mdoc (ne pas modifier à la main)\nsource: ${empreinte(corps)}\n---\n${en.replace(/\r\n/g, '\n')}`,
      );
    }
    if (resultat === 'aJour') bilan.recopies++;
    else bilan[resultat === 'perime' ? 'aRetraduire' : 'pasDeLAction'].push(`${ancien} (contenu de la page)`);
    bilan.retires++;
    if (!ESSAI) {
      fs.rmSync(ancien);
      const dossier = path.dirname(ancien);
      if (fs.readdirSync(dossier).length === 0) fs.rmdirSync(dossier);
    }
  }

  if (!ESSAI) {
    const nouvelEntete = yaml.dump(donnees, { schema: yaml.CORE_SCHEMA, lineWidth: 80, noRefs: true });
    fs.writeFileSync(fichier, `---\n${nouvelEntete}---\n${corps}`);
  }
}

// ----- Fichiers JSON : formations, compétences, paramètres -----
for (const fichier of [
  ...lister('src/content/formations', '.json'),
  'src/content/pages/competences.json',
  'src/content/pages/parametres.json',
]) {
  if (!fs.existsSync(fichier)) continue;
  const donnees = lireJson(fichier);
  migrerObjet(donnees, [], fichier);
  if (!ESSAI) ecrireJson(fichier, donnees);
}

if (!ESSAI) {
  ecrireJson(TEXTES, Object.fromEntries(Object.entries(dictionnaire).sort(([a], [b]) => a.localeCompare(b))));
  if (fs.existsSync(ANCIENNE_MEMOIRE)) fs.rmSync(ANCIENNE_MEMOIRE);
}

console.log(`${ESSAI ? '(Essai : rien n’est écrit)\n' : ''}Textes anglais retirés des fiches : ${bilan.retires}`);
console.log(`Traductions à jour recopiées dans src/i18n/auto/ : ${bilan.recopies}`);
console.log(`\nTraductions périmées (l'Action les refera) : ${bilan.aRetraduire.length}`);
for (const ligne of bilan.aRetraduire) console.log(`  - ${ligne}`);
console.log(`\nTextes anglais que l'Action n'avait PAS écrits (à vérifier : écrits à la main ?) : ${bilan.pasDeLAction.length}`);
for (const ligne of bilan.pasDeLAction) console.log(`  - ${ligne}`);
