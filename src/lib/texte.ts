// Petits outils pour les textes saisis dans l'admin.
// Règle du site : un champ vide ou resté entre crochets n'est jamais affiché.
import type { Lang } from '../i18n/ui';

export type Texte = string | null | undefined;

/** Le texte s'il peut s'afficher, sinon undefined : vide, ou entièrement entre
 *  crochets (texte d'exemple pas encore remplacé, ex. « [Nom de l'UE] »). */
export function affichable(texte: Texte): string | undefined {
  const propre = texte?.trim();
  if (!propre || /^\[[^\]]*\]$/.test(propre)) return undefined;
  return propre;
}

/** Texte dans la bonne langue : l'anglais s'il est rempli (en EN), sinon le français.
 *  undefined si aucun des deux n'est affichable. */
export function texte(fr: Texte, en: Texte, lang: Lang): string | undefined {
  return (lang === 'en' && affichable(en)) || affichable(fr);
}
