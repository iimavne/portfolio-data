// Les 6 étapes de la roadmap "Progression" de l'accueil.
// Pour faire avancer une étape, il suffit de changer son `statut`.

// Statuts possibles (réutilisés par la pastille StatusBadge)
export type Statut = 'termine' | 'en-cours' | 'a-venir';

export interface Etape {
  titre: { fr: string; en: string };
  description: { fr: string; en: string };
  statut: Statut;
}

export const etapes: Etape[] = [
  {
    titre: { fr: 'Excel', en: 'Excel' },
    description: { fr: 'Dashboard et tableaux croisés', en: 'Dashboards and pivot tables' },
    statut: 'termine',
  },
  {
    titre: { fr: 'Python', en: 'Python' },
    description: { fr: 'Nettoyage, jointures et contrôles', en: 'Cleaning, joins and checks' },
    statut: 'termine',
  },
  {
    titre: { fr: 'SQL', en: 'SQL' },
    description: { fr: 'Modélisation et requêtes', en: 'Data modelling and queries' },
    statut: 'en-cours',
  },
  {
    titre: { fr: 'Statistiques', en: 'Statistics' },
    description: { fr: 'Régression et prédiction', en: 'Regression and prediction' },
    statut: 'a-venir',
  },
  {
    titre: { fr: 'Économétrie', en: 'Econometrics' },
    description: { fr: 'Inférence causale, séries temporelles', en: 'Causal inference, time series' },
    statut: 'a-venir',
  },
  {
    titre: { fr: 'Machine learning', en: 'Machine learning' },
    description: { fr: 'Modèles prédictifs', en: 'Predictive models' },
    statut: 'a-venir',
  },
];
