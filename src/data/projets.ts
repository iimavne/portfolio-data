// Catégories de projets.
// Les projets eux-mêmes sont dans la collection src/content/projets/ (voir src/content.config.ts).

// Les catégories : identifiant (stocké dans les fichiers projets) + libellés affichés
export const categories = {
  excel: { fr: 'Excel', en: 'Excel' },
  python: { fr: 'Python', en: 'Python' },
  sql: { fr: 'SQL', en: 'SQL' },
  statistiques: { fr: 'Statistiques', en: 'Statistics' },
  'machine-learning': { fr: 'Machine learning', en: 'Machine learning' },
} as const;

export type Categorie = keyof typeof categories;
