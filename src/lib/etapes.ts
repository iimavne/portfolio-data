// Fonctions utilitaires pour lire les étapes de la roadmap (collection "etapes").
import { getCollection, type CollectionEntry } from 'astro:content';

// Statuts possibles (réutilisés par la pastille StatusBadge, aussi pour les projets)
export type Statut = 'termine' | 'en-cours' | 'a-venir';

export type Etape = CollectionEntry<'etapes'>;

/** Les étapes dans l'ordre de la roadmap (champ "ordre"). */
export async function getEtapes(): Promise<Etape[]> {
  const etapes = await getCollection('etapes');
  return etapes.sort((a, b) => a.data.ordre - b.data.ordre);
}
