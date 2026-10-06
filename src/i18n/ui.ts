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
