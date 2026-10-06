// Informations personnelles utilisées dans la nav, le footer et la section Contact.
// Elles se modifient dans l'admin : Pages > Paramètres du site
// (fichier src/content/pages/parametres.json).
import donnees from '../content/pages/parametres.json';

// Keystatic retire du fichier les champs facultatifs laissés vides :
// on précise donc qu'ils peuvent manquer.
type Parametres = typeof donnees & {
  cv?: string | null;
  github?: string | null;
  linkedin?: string | null;
  kaggle?: string | null;
};
const parametres: Parametres = donnees;

export const site = {
  // Affiché en mono dans la nav, ex. "jean.dupont"
  handle: parametres.pseudo,
  // Affiché dans le footer et le titre des onglets
  name: parametres.nom,
  email: parametres.email,
  // Chemin du CV (PDF) déposé depuis l'admin ; absent = bouton "CV" masqué
  cv: parametres.cv || undefined,
  // Profils : absents = boutons masqués dans la section Contact
  links: {
    github: parametres.github || undefined,
    linkedin: parametres.linkedin || undefined,
    kaggle: parametres.kaggle || undefined,
  },
};
