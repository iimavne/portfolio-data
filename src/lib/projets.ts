// Fonctions utilitaires pour lire les projets de la collection.
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Projet = CollectionEntry<'projets'>;

/** Les projets publiés (sans les brouillons), du plus ancien au plus récent
 *  (l'ordre des numéros 01, 02...). */
export async function getProjets(): Promise<Projet[]> {
  const projets = await getCollection('projets', (projet) => !projet.data.brouillon);
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

/** Contenu de la page à afficher : la version anglaise si elle existe (en EN),
 *  sinon la version française. `traduit` vaut false si on retombe sur le français. */
export async function contenu(projet: Projet, lang: Lang) {
  if (lang === 'en') {
    // On cherche dans la liste des traductions existantes (getEntry afficherait
    // un avertissement au build pour chaque projet pas encore traduit)
    const traductions = await getCollection('projetsEn');
    const anglais = traductions.find((traduction) => traduction.id === projet.id);
    if (anglais) return { source: anglais, traduit: true };
  }
  return { source: projet, traduit: lang === 'fr' };
}

/** Pages projet à générer (une par projet), avec leurs voisins pour la navigation.
 *  Partagé par /projets/[slug] et /en/projets/[slug]. */
export async function cheminsProjets() {
  const projets = await getProjets();
  return projets.map((projet, index) => ({
    params: { slug: projet.id },
    props: { projet, index, precedent: projets[index - 1], suivant: projets[index + 1] },
  }));
}
