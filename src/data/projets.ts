// Catégories de projets et données PROVISOIRES des projets.
// TODO étape 4 : les projets viendront de la collection "projets" (src/content/projets/),
// gérée par Keystatic. Les noms de champs sont déjà ceux du futur schéma.
import type { Statut } from './progression';

// Les 6 catégories : identifiant (stocké dans les données) + libellés affichés
export const categories = {
  excel: { fr: 'Excel', en: 'Excel' },
  python: { fr: 'Python', en: 'Python' },
  sql: { fr: 'SQL', en: 'SQL' },
  statistiques: { fr: 'Statistiques', en: 'Statistics' },
  econometrie: { fr: 'Économétrie', en: 'Econometrics' },
  'machine-learning': { fr: 'Machine learning', en: 'Machine learning' },
} as const;

export type Categorie = keyof typeof categories;

export interface Projet {
  slug: string;
  titre: string;
  resume: string; // 160 caractères max
  categorie: Categorie;
  statut: Exclude<Statut, 'a-venir'>; // un projet est "terminé" ou "en cours"
  outils: string[];
}

export const projets: Projet[] = [
  {
    slug: 'tableau-de-bord-excel',
    titre: 'Tableau de bord Excel',
    resume: '[Sujet] : indicateurs clés, tableaux croisés dynamiques et graphiques.',
    categorie: 'excel',
    statut: 'termine',
    outils: ['Excel', 'TCD'],
  },
  {
    slug: 'nettoyage-et-jointures-en-python',
    titre: 'Nettoyage et jointures en Python',
    resume: 'Fusion de plusieurs sources, contrôles de cohérence et préparation des données.',
    categorie: 'python',
    statut: 'termine',
    outils: ['Python', 'pandas'],
  },
  {
    slug: 'base-de-donnees-relationnelle',
    titre: 'Base de données relationnelle',
    resume:
      "Conception des tables et des attributs à partir d'un énoncé, puis requêtes SQL d'analyse.",
    categorie: 'sql',
    statut: 'en-cours',
    outils: ['SQL', 'Modélisation'],
  },
];

// Projet annoncé dans la carte en pointillés "Bientôt"
export const prochainProjet = {
  titre: { fr: 'Premier modèle de régression', en: 'First regression model' },
};
