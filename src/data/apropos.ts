// Contenu de la section "À propos" : présentation, formation, expériences et langues.
// Il se modifie dans l'admin : Pages > À propos (fichier src/content/pages/apropos.json).
// Si une version anglaise est vide, on reprend la version française.
import donnees from '../content/pages/apropos.json';

// Keystatic retire du fichier les champs facultatifs laissés vides :
// on précise donc qu'ils peuvent manquer.
type Texte = string | null | undefined;
type APropos = typeof donnees & {
  experiences?: {
    annees?: Texte;
    poste: string;
    poste_en?: Texte;
    structure?: Texte;
    description?: Texte;
    description_en?: Texte;
  }[];
  langues?: { langue: string; langue_en?: Texte; niveau?: Texte; niveau_en?: Texte }[];
};
const apropos: APropos = donnees;

/** Un texte en FR / EN (le français si la version anglaise manque). */
const bilingue = (fr: Texte, en: Texte) => ({ fr: fr ?? '', en: en || fr || '' });

export const presentation = bilingue(apropos.presentation, apropos.presentation_en);

// Formation, de la plus récente à la plus ancienne
export const formation = apropos.formation.map((ligne) => ({
  annees: ligne.annees,
  diplome: bilingue(ligne.diplome, ligne.diplome_en),
  etablissement: ligne.etablissement,
}));

// Expériences, de la plus récente à la plus ancienne (liste vide = bloc masqué)
export const experiences = (apropos.experiences ?? []).map((ligne) => ({
  annees: ligne.annees ?? '',
  poste: bilingue(ligne.poste, ligne.poste_en),
  structure: ligne.structure ?? '',
  description: bilingue(ligne.description, ligne.description_en),
}));

// Langues et niveaux (liste vide = bloc masqué)
export const langues = (apropos.langues ?? []).map((ligne) => ({
  langue: bilingue(ligne.langue, ligne.langue_en),
  niveau: bilingue(ligne.niveau, ligne.niveau_en),
}));
