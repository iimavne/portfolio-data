// Paramètres du site : nom, haut de l'accueil, recherches, CV et profils.
// Ils se modifient dans l'admin : Pages > Paramètres du site
// (fichier src/content/pages/parametres.json). Lu aussi par keystatic.config.tsx.
import donnees from '../content/pages/parametres.json';
import type { Lang } from '../i18n/ui';
import { affichable, texte, type Texte } from '../lib/texte';

export type TypeRecherche = 'stage' | 'alternance' | 'emploi';

// Keystatic retire du fichier les champs facultatifs laissés vides :
// on précise donc qu'ils peuvent manquer.
interface Parametres {
  nom: string;
  labelFormation?: Texte;
  labelFormation_en?: Texte;
  positionnement?: Texte;
  positionnement_en?: Texte;
  positionnementAccent?: Texte;
  positionnementAccent_en?: Texte;
  domainesVises?: { domaine: string; domaine_en?: Texte }[];
  langues?: { langue: string; langue_en?: Texte; precision?: Texte; precision_en?: Texte; miseEnAvant?: boolean }[];
  recherches?: {
    type: TypeRecherche;
    debut?: Texte;
    debut_en?: Texte;
    details?: Texte;
    details_en?: Texte;
    afficher?: boolean;
  }[];
  cv?: Texte;
  linkedin?: Texte;
  github?: Texte;
}
const parametres = donnees as Parametres;

export const site = {
  // Affiché dans la nav, le footer et le titre des onglets
  name: parametres.nom,
  // Chemin du CV (PDF) déposé depuis l'admin ; absent = bouton "CV" masqué
  cv: affichable(parametres.cv),
  // Profils : absents = boutons masqués
  links: {
    linkedin: affichable(parametres.linkedin),
    github: affichable(parametres.github),
  },
};

/** Textes du haut de l'accueil dans la bonne langue (les éléments vides sont retirés). */
export function profil(lang: Lang) {
  // Le positionnement et sa partie colorée vont ensemble : on prend la paire anglaise
  // si le positionnement anglais est rempli, sinon la paire française.
  const enAnglais = lang === 'en' && affichable(parametres.positionnement_en);
  const positionnement = enAnglais ? parametres.positionnement_en : parametres.positionnement;
  const accent = enAnglais ? parametres.positionnementAccent_en : parametres.positionnementAccent;

  return {
    labelFormation: texte(parametres.labelFormation, parametres.labelFormation_en, lang),
    positionnement: affichable(positionnement),
    accent: affichable(accent),
    domaines: (parametres.domainesVises ?? [])
      .map((ligne) => texte(ligne.domaine, ligne.domaine_en, lang))
      .filter((domaine): domaine is string => Boolean(domaine)),
    langues: (parametres.langues ?? [])
      .map((ligne) => ({
        langue: texte(ligne.langue, ligne.langue_en, lang),
        precision: texte(ligne.precision, ligne.precision_en, lang),
        miseEnAvant: Boolean(ligne.miseEnAvant),
      }))
      .filter((ligne) => ligne.langue),
  };
}

/** Recherches à afficher (case "Afficher sur le site" cochée), dans la bonne langue. */
export function recherches(lang: Lang) {
  return (parametres.recherches ?? [])
    .filter((ligne) => ligne.afficher !== false)
    .map((ligne) => ({
      type: ligne.type,
      debut: texte(ligne.debut, ligne.debut_en, lang),
      details: texte(ligne.details, ligne.details_en, lang),
    }));
}
