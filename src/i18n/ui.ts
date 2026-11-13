// Textes de l'interface, en français et en anglais.
// Les composants n'écrivent jamais de texte "en dur" : ils appellent
// useTranslations(lang) puis t('cle'). Pour ajouter un texte, on ajoute
// la clé dans `fr` puis dans `en`.
// (Les textes saisis dans l'admin, eux, sont dans src/content/.)

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
    'nav.otherLang': 'Read in English', // lien vers l'autre langue, écrit dans cette autre langue
    'footer.builtWith': 'Construit avec Astro + Keystatic',
    'site.description':
      'Portfolio data science : projets de statistique, de machine learning et de bases de données, de la question de départ au résultat.',
    // Hero de l'accueil
    'hero.domains': 'Domaines visés',
    'hero.languages': 'Langues',
    'hero.ctaProjects': 'Voir les projets',
    'hero.ctaContact': 'Me contacter',
    // Encadré "Je recherche" (hero) et types de recherche
    'search.title': 'Je recherche',
    'search.stage': 'Stage',
    'search.alternance': 'Alternance',
    'search.emploi': 'Emploi',
    // Section Projets
    'projects.title': 'Projets',
    'projects.intro': 'Ce que j’ai réalisé, de la question de départ au résultat.',
    'projects.filterLabel': 'Filtrer les projets par domaine',
    'projects.all': 'Tous',
    'projects.shown': 'Projets affichés :',
    'projects.view': 'Voir le projet',
    // Section Parcours
    'journey.title': 'Parcours',
    'journey.intro': 'Ce que j’ai appris, cours par cours.',
    'journey.showCourses': 'Voir les cours',
    'journey.hideCourses': 'Masquer les cours',
    'journey.ranking': 'Classement',
    'journey.taught.fr': 'Cours en français',
    'journey.taught.en': 'Cours en anglais',
    'skills.title': 'Compétences',
    'skills.practiced': 'Pratiquée dans :',
    'skills.inProject': 'Projet {domaine}', // ex. "Projet assurance"
    'skills.inCourse': 'Cours de {niveau}', // ex. "Cours de M1"
    // Section Contact : la phrase d'accroche reprend les recherches affichées,
    // ex. "Un stage ou une alternance en data science à proposer ?"
    'contact.title': 'Contact',
    'contact.offer.stage': 'un stage',
    'contact.offer.alternance': 'une alternance',
    'contact.offer.emploi': 'un emploi',
    'contact.or': 'ou',
    'contact.offerEnd': 'en data science à proposer ?',
    'contact.generic': 'Une question, une opportunité en data science ?',
    'contact.reply': 'Écrivez-moi, je réponds rapidement.',
    'contact.newTab': '(nouvel onglet)',
    // Formulaire de contact
    'form.name': 'Votre nom',
    'form.email': 'Votre email',
    'form.emailHelp': 'Pour pouvoir vous répondre. Il ne sera pas publié.',
    'form.message': 'Message',
    'form.send': 'Envoyer',
    'form.sending': 'Envoi…',
    'form.success': 'Merci, votre message a bien été envoyé. Je vous réponds au plus vite.',
    'form.error': "L'envoi a échoué. Réessayez dans un instant, ou contactez-moi via LinkedIn.",
    'form.unavailable': 'Le formulaire de contact sera bientôt disponible.',
    'form.subject': 'Nouveau message depuis le portfolio',
    // Page projet
    'project.back': 'Tous les projets',
    'project.tools': 'Outils',
    'project.work': 'Travail',
    'project.toc': 'Sommaire',
    'project.next': 'Projet suivant',
    'project.onlyFr': 'Cette page n’est disponible qu’en français pour l’instant.',
    'work.solo': 'Solo',
    'work.binome': 'Binôme',
    'work.groupe': 'Groupe',
  },
  en: {
    'nav.label': 'Main navigation',
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.journey': 'Background',
    'nav.contact': 'Contact',
    'nav.cv': 'Résumé (PDF)',
    'nav.menu': 'Menu',
    'nav.otherLang': 'Lire en français',
    'footer.builtWith': 'Built with Astro + Keystatic',
    'site.description':
      'Data science portfolio: statistics, machine learning and database projects, from the initial question to the result.',
    'hero.domains': 'Target fields',
    'hero.languages': 'Languages',
    'hero.ctaProjects': 'See projects',
    'hero.ctaContact': 'Contact me',
    'search.title': 'Looking for',
    'search.stage': 'Internship',
    'search.alternance': 'Work-study',
    'search.emploi': 'Job',
    'projects.title': 'Projects',
    'projects.intro': 'What I have built, from the initial question to the result.',
    'projects.filterLabel': 'Filter projects by field',
    'projects.all': 'All',
    'projects.shown': 'Projects shown:',
    'projects.view': 'View project',
    'journey.title': 'Background',
    'journey.intro': 'What I have learned, course by course.',
    'journey.showCourses': 'Show courses',
    'journey.hideCourses': 'Hide courses',
    'journey.ranking': 'Ranking',
    'journey.taught.fr': 'Taught in French',
    'journey.taught.en': 'Taught in English',
    'skills.title': 'Skills',
    'skills.practiced': 'Practiced in:',
    'skills.inProject': '{domaine} project',
    'skills.inCourse': '{niveau} course',
    'contact.title': 'Contact',
    'contact.offer.stage': 'an internship',
    'contact.offer.alternance': 'a work-study position',
    'contact.offer.emploi': 'a job',
    'contact.or': 'or',
    'contact.offerEnd': 'in data science to offer?',
    'contact.generic': 'A question or a data science opportunity?',
    'contact.reply': 'Write to me, I reply quickly.',
    'contact.newTab': '(opens in a new tab)',
    'form.name': 'Your name',
    'form.email': 'Your email',
    'form.emailHelp': 'So I can reply. It will not be published.',
    'form.message': 'Message',
    'form.send': 'Send',
    'form.sending': 'Sending…',
    'form.success': 'Thank you, your message has been sent. I will get back to you soon.',
    'form.error': 'Sending failed. Please try again in a moment, or reach me on LinkedIn.',
    'form.unavailable': 'The contact form will be available soon.',
    'form.subject': 'New message from the portfolio',
    'project.back': 'All projects',
    'project.tools': 'Tools',
    'project.work': 'Work',
    'project.toc': 'Contents',
    'project.next': 'Next project',
    'project.onlyFr': 'This project page is only available in French for now.',
    'work.solo': 'Solo',
    'work.binome': 'Pair work',
    'work.groupe': 'Group work',
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

/** Remplace les {repères} d'un texte : remplir('Projet {domaine}', { domaine: 'climat' }). */
export function remplir(texte: string, valeurs: Record<string, string>): string {
  return texte.replace(/\{(\w+)\}/g, (repere, cle) => valeurs[cle] ?? repere);
}

/** Chemin d'une page sans le préfixe de langue : '/en/projets/sql/' -> '/projets/sql/'.
 *  Sert à passer d'une langue à l'autre en restant sur la même page. */
export function cheminSansLangue(pathname: string): string {
  return pathname.replace(/^\/en(\/|$)/, '/');
}

/** Préfixe un chemin selon la langue : '/' en FR, '/en/' en EN. */
export function localizePath(path: string, lang: Lang): string {
  return lang === defaultLang ? path : `/${lang}${path}`;
}
