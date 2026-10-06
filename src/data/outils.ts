// Outils de la section "Boîte à outils", rangés en 3 groupes.
// Ils se modifient dans l'admin : Pages > Boîte à outils (fichier src/content/pages/outils.json).
import listes from '../content/pages/outils.json';

export const outils = {
  utilise: listes.utilise, // déjà utilisé dans au moins un projet
  apprentissage: listes.apprentissage, // en cours d'apprentissage
  programme: listes.programme, // prévu plus tard dans le master
};

export type GroupeOutils = keyof typeof outils;
