// Paramètres du site : nom, haut de l'accueil, recherches, CV et profils.
// Ils se modifient dans l'admin : Pages > Paramètres du site
// (fichier src/content/pages/parametres.json). Lu aussi par keystatic.config.tsx.
import donnees from '../content/pages/parametres.json';
import type { Lang } from '../i18n/ui';
import { affichable, positionnement, texte, type Texte } from '../lib/texte';

export type TypeRecherche = 'stage' | 'alternance' | 'emploi';

// Keystatic retire du fichier les champs facultatifs laissés vides :
// on précise donc qu'ils peuvent manquer. Versions anglaises : sous-objet `en`.
interface Parametres {
  nom: string;
  labelFormation?: Texte;
  positionnement?: Texte;
  positionnementAccent?: Texte;
  domainesVises?: { domaine: string; en?: { domaine?: Texte } }[];
  langues?: { langue: string; precision?: Texte; miseEnAvant?: boolean; en?: { langue?: Texte; precision?: Texte } }[];
  recherches?: {
    type: TypeRecherche;
    debut?: Texte;
    details?: Texte;
    afficher?: boolean;
    en?: { debut?: Texte; details?: Texte };
  }[];
  cv?: Texte;
  linkedin?: Texte;
  github?: Texte;
  en?: { labelFormation?: Texte; positionnement?: Texte; positionnementAccent?: Texte };
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
  // Le positionnement et sa partie colorée vont ensemble (voir src/lib/texte.ts)
  const { phrase, accent } = positionnement(
    { phrase: parametres.positionnement, accent: parametres.positionnementAccent },
    { phrase: parametres.en?.positionnement, accent: parametres.en?.positionnementAccent },
    lang,
  );

  return {
    labelFormation: texte(parametres.labelFormation, parametres.en?.labelFormation, lang),
    positionnement: phrase,
    accent,
    domaines: (parametres.domainesVises ?? [])
      .map((ligne) => texte(ligne.domaine, ligne.en?.domaine, lang))
      .filter((domaine): domaine is string => Boolean(domaine)),
    langues: (parametres.langues ?? [])
      .map((ligne) => ({
        langue: texte(ligne.langue, ligne.en?.langue, lang),
        precision: texte(ligne.precision, ligne.en?.precision, lang),
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
      debut: texte(ligne.debut, ligne.en?.debut, lang),
      details: texte(ligne.details, ligne.en?.details, lang),
    }));
}
