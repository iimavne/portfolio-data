// Contenu de la section "À propos" : présentation et formation.
// Il se modifie dans l'admin : Pages > À propos (fichier src/content/pages/apropos.json).
// Si une version anglaise est vide, on reprend la version française.
import apropos from '../content/pages/apropos.json';

export const presentation = {
  fr: apropos.presentation,
  en: apropos.presentation_en || apropos.presentation,
};

// Formation, de la plus récente à la plus ancienne
export const formation = apropos.formation.map((ligne) => ({
  annees: ligne.annees,
  diplome: { fr: ligne.diplome, en: ligne.diplome_en || ligne.diplome },
  etablissement: ligne.etablissement,
}));
