// Textes de l'interface, en français et en anglais.
// Les composants n'écrivent jamais de texte "en dur" : ils appellent
// useTranslations(lang) puis t('cle'). Pour ajouter un texte, on ajoute
// la clé dans `fr` puis dans `en`.

export const languages = {
  fr: 'Français',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'fr';

export const ui = {
  fr: {
    'nav.label': 'Navigation principale',
    'nav.home': 'Accueil',
    'nav.projects': 'Projets',
    'nav.journey': 'Parcours',
    'nav.contact': 'Contact',
    'nav.cv': 'CV (PDF)',
    'nav.menu': 'Menu',
    'nav.lang': 'Choisir la langue',
    'footer.builtWith': 'Construit avec Astro + Keystatic',
    'site.description':
      "Portfolio data science : projets Excel, Python et SQL d'un étudiant en M1 Économétrie et data science à Aix-Marseille Université.",
    // Hero de l'accueil (le titre est coupé en deux : la 2e partie est en vert)
    'hero.badge': 'M1 Économétrie et data science · AMU Marseille',
    'hero.title': "J'apprends à faire",
    'hero.titleAccent': 'parler les données.',
    'hero.intro':
      "Étudiant en master à Aix-Marseille Université. Je documente ici chaque projet, du premier dashboard Excel jusqu'au machine learning.",
    'hero.ctaProjects': 'Voir les projets',
    'hero.ctaProgress': 'Ma progression',
    'hero.rows': '2 lignes',
    // Statuts (pastilles)
    'status.termine': 'Terminé',
    'status.en-cours': 'En cours',
    'status.a-venir': 'À venir',
    // Section Progression
    'progress.title': 'Progression',
    'progress.intro': 'Le programme du master, étape par étape.',
    'progress.done': 'terminés',
    'progress.inProgress': 'en cours',
    'progress.projects': 'projets',
    'progress.barLabel': 'Avancement du programme',
    // Section Projets
    'projects.title': 'Projets',
    'projects.filterLabel': 'Filtrer les projets par catégorie',
    'projects.all': 'Tous',
    'projects.shown': 'Projets affichés :',
    'projects.view': 'Voir le projet',
    'projects.soon': 'Bientôt',
    'projects.soonText': "Ajouté depuis l'espace admin dès qu'il est prêt.",
    // Section Boîte à outils
    'tools.title': 'Boîte à outils',
    'tools.utilise': 'Utilisé en projet',
    'tools.apprentissage': 'En apprentissage',
    'tools.programme': 'Au programme',
    // Section À propos
    'about.title': 'À propos',
    'about.formation': 'Formation',
    // Section Contact (titre en deux morceaux pour couper après la virgule)
    'contact.title': 'Un stage, une alternance,',
    'contact.titleEnd': 'un projet ?',
    'contact.newTab': '(nouvel onglet)',
    // Page projet
    'project.back': 'Tous les projets',
    'project.label': 'Projet',
    'project.github': 'Voir le code',
    'project.file': 'Télécharger le fichier',
    'project.course': 'Cours',
    'project.period': 'Période',
    'project.tools': 'Outils',
    'project.work': 'Travail',
    'project.toc': 'Sommaire',
    'project.next': 'Projet suivant',
    'project.prev': 'Projet précédent',
    'work.solo': 'Solo',
    'work.binome': 'Binôme',
  },
  en: {
    'nav.label': 'Main navigation',
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.journey': 'Journey',
    'nav.contact': 'Contact',
    'nav.cv': 'Résumé (PDF)',
    'nav.menu': 'Menu',
    'nav.lang': 'Choose language',
    'footer.builtWith': 'Built with Astro + Keystatic',
    'site.description':
      'Data science portfolio: Excel, Python and SQL projects by a first-year MSc student in Econometrics and Data Science at Aix-Marseille University.',
    'hero.badge': 'MSc Econometrics & Data Science · AMU Marseille',
    'hero.title': "I'm learning to make",
    'hero.titleAccent': 'data speak.',
    'hero.intro':
      "Master's student at Aix-Marseille University. I document every project here, from my first Excel dashboard all the way to machine learning.",
    'hero.ctaProjects': 'See projects',
    'hero.ctaProgress': 'My progress',
    'hero.rows': '2 rows',
    'status.termine': 'Done',
    'status.en-cours': 'In progress',
    'status.a-venir': 'Upcoming',
    'progress.title': 'Progress',
    'progress.intro': 'The master’s programme, step by step.',
    'progress.done': 'completed',
    'progress.inProgress': 'in progress',
    'progress.projects': 'projects',
    'progress.barLabel': 'Programme progress',
    'projects.title': 'Projects',
    'projects.filterLabel': 'Filter projects by category',
    'projects.all': 'All',
    'projects.shown': 'Projects shown:',
    'projects.view': 'View project',
    'projects.soon': 'Coming soon',
    'projects.soonText': 'Added from the admin panel as soon as it is ready.',
    'tools.title': 'Toolbox',
    'tools.utilise': 'Used in projects',
    'tools.apprentissage': 'Currently learning',
    'tools.programme': 'Coming up',
    'about.title': 'About',
    'about.formation': 'Education',
    'contact.title': 'An internship, a work-study,',
    'contact.titleEnd': 'a project?',
    'contact.newTab': '(opens in a new tab)',
    'project.back': 'All projects',
    'project.label': 'Project',
    'project.github': 'View the code',
    'project.file': 'Download the file',
    'project.course': 'Course',
    'project.period': 'Period',
    'project.tools': 'Tools',
    'project.work': 'Work',
    'project.toc': 'Contents',
    'project.next': 'Next project',
    'project.prev': 'Previous project',
    'work.solo': 'Solo',
    'work.binome': 'Pair work',
  },
} as const;

export type UiKey = keyof (typeof ui)['fr'];

/** Renvoie une fonction t('cle') qui donne le texte dans la bonne langue
 *  (et retombe sur le français si la traduction manque). */
export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/** Préfixe un chemin selon la langue : '/' en FR, '/en/' en EN. */
export function localizePath(path: string, lang: Lang): string {
  return lang === defaultLang ? path : `/${lang}${path}`;
}
