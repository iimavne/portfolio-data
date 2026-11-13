// Listes de valeurs des projets, partagées par le schéma Astro (src/content.config.ts),
// l'admin (keystatic.config.tsx) et l'affichage. Les libellés affichés sont dans src/i18n/ui.ts.

// Types de ressources (colonne "Ressources" de la page projet)
export const typesRessources = ['github', 'notebook', 'pdf', 'rapport', 'script', 'autre'] as const;
export type TypeRessource = (typeof typesRessources)[number];

// Type de travail
export const travaux = ['solo', 'binome', 'groupe'] as const;
export type Travail = (typeof travaux)[number];
