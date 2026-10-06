// Outils de la section "Boîte à outils", rangés en 3 groupes.
// Pour faire progresser un outil, il suffit de le déplacer d'une liste à l'autre.

export const outils = {
  // Déjà utilisé dans au moins un projet
  utilise: ['Excel', 'Python', 'pandas'],
  // En cours d'apprentissage
  apprentissage: ['SQL', 'Git'],
  // Prévu plus tard dans le master
  programme: ['R', 'statsmodels', 'scikit-learn'],
};

export type GroupeOutils = keyof typeof outils;
