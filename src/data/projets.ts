// Catégories de projets et carte "Bientôt".
// Les projets eux-mêmes sont dans la collection src/content/projets/ (voir src/content.config.ts).

// Les 6 catégories : identifiant (stocké dans les fichiers projets) + libellés affichés
export const categories = {
  excel: { fr: 'Excel', en: 'Excel' },
  python: { fr: 'Python', en: 'Python' },
  sql: { fr: 'SQL', en: 'SQL' },
  statistiques: { fr: 'Statistiques', en: 'Statistics' },
  econometrie: { fr: 'Économétrie', en: 'Econometrics' },
  'machine-learning': { fr: 'Machine learning', en: 'Machine learning' },
} as const;

export type Categorie = keyof typeof categories;

// Projet annoncé dans la carte en pointillés "Bientôt"
export const prochainProjet = {
  titre: { fr: 'Premier modèle de régression', en: 'First regression model' },
};
