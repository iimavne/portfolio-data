// Compétences de la section "Compétences", rangées en 4 groupes.
// Elles se modifient dans l'admin : Pages > Compétences (fichier src/content/pages/outils.json).
import listes from '../content/pages/outils.json';
import type { Lang } from '../i18n/ui';

// Keystatic retire du fichier les champs facultatifs laissés vides :
// on précise donc qu'ils peuvent manquer.
type Listes = typeof listes & {
  fondamentaux?: { nom: string; nom_en?: string | null }[];
};
const donnees: Listes = listes;

// Chaque élément a un libellé par langue. Les noms d'outils (Python, SQL...)
// sont les mêmes dans les deux langues.
type Libelle = Record<Lang, string>;
const memeNom = (nom: string): Libelle => ({ fr: nom, en: nom });

export const outils: Record<GroupeOutils, Libelle[]> = {
  // Bases mathématiques (acquis de la licence), en FR / EN
  fondamentaux: (donnees.fondamentaux ?? []).map((c) => ({ fr: c.nom, en: c.nom_en || c.nom })),
  utilise: donnees.utilise.map(memeNom), // déjà utilisé dans au moins un projet
  apprentissage: donnees.apprentissage.map(memeNom), // en cours d'apprentissage
  programme: donnees.programme.map(memeNom), // prévu plus tard dans le master
};

export type GroupeOutils = 'fondamentaux' | 'utilise' | 'apprentissage' | 'programme';
