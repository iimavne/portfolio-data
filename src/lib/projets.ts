// Fonctions utilitaires pour lire les projets de la collection.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Projet = CollectionEntry<'projets'>;

/** Tous les projets, du plus ancien au plus récent (l'ordre des numéros 01, 02...). */
export async function getProjets(): Promise<Projet[]> {
  const projets = await getCollection('projets');
  return projets.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

/** Numéro sur deux chiffres à partir de la position : 0 -> "01". */
export function numero(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/** Titre dans la bonne langue (le français si la traduction manque). */
export function titre(projet: Projet, lang: Lang): string {
  return (lang === 'en' && projet.data.titre_en) || projet.data.titre;
}

/** Résumé dans la bonne langue (le français si la traduction manque). */
export function resume(projet: Projet, lang: Lang): string {
  return (lang === 'en' && projet.data.resume_en) || projet.data.resume;
}
