// Petits outils pour les textes saisis dans l'admin.
// Règle du site : un champ vide ou resté entre crochets n'est jamais affiché.
//
// Version anglaise d'un texte, par ordre de priorité :
//   1. celle écrite À LA MAIN par l'étudiant (section « Version anglaise » de l'admin),
//      si elle a été écrite pour le texte français actuel ;
//   2. sinon la traduction automatique du texte français actuel (src/i18n/auto/textes.json,
//      rempli par scripts/traduction/traduire.mjs) ;
//   3. sinon le français.
// Une version écrite à la main dont le français a changé depuis est donc mise de côté :
// le site affiche la traduction automatique du nouveau français, jusqu'à ce que
// l'étudiant mette sa version à jour.
import manuels from '../i18n/auto/manuels.json';
import dictionnaire from '../i18n/auto/textes.json';
import type { Lang } from '../i18n/ui';
import { cleAccent, cleTexte, empreinte } from './empreinte.mjs';

export type Texte = string | null | undefined;

const traductions = dictionnaire as Record<string, string>;
const versionsManuelles = manuels as Record<string, string[]>;

/** Le texte s'il peut s'afficher, sinon undefined : vide, ou entièrement entre
 *  crochets (texte d'exemple pas encore remplacé, ex. « [Nom de l'UE] »). */
export function affichable(texte: Texte): string | undefined {
  const propre = texte?.trim();
  if (!propre || /^\[[^\]]*\]$/.test(propre)) return undefined;
  return propre;
}

/** Une version anglaise écrite à la main est-elle valable pour ce texte français ?
 *  Oui si l'Action ne l'a pas encore vue (elle vient d'être écrite), ou si elle a été
 *  écrite pour ce français-là (src/i18n/auto/manuels.json). */
export function manuelAJour(en: string, fr: Texte): boolean {
  const pourQuelFrancais = versionsManuelles[empreinte(en)];
  return !pourQuelFrancais || pourQuelFrancais.includes(empreinte(fr ?? ''));
}

/** Version anglaise valable d'un texte (voir l'ordre en tête du fichier), sinon undefined.
 *  `cle` : clé du dictionnaire, si ce n'est pas le texte français lui-même. */
export function anglais(fr: Texte, enManuel: Texte, cle?: string): string | undefined {
  const manuel = affichable(enManuel);
  if (manuel && manuelAJour(manuel, fr)) return manuel;
  return affichable(fr) ? affichable(traductions[cle ?? cleTexte(fr)]) : undefined;
}

/** Texte dans la bonne langue : en EN, la version anglaise valable, sinon le français.
 *  undefined si rien n'est affichable. */
export function texte(fr: Texte, enManuel: Texte, lang: Lang): string | undefined {
  return (lang === 'en' && anglais(fr, enManuel)) || affichable(fr);
}

/** Phrase de positionnement et sa partie en couleur, dans la bonne langue. Elles vont
 *  ensemble : la partie en couleur doit être un extrait exact de la phrase. */
export function positionnement(
  fr: { phrase: Texte; accent: Texte },
  enManuel: { phrase: Texte; accent: Texte } | undefined,
  lang: Lang,
): { phrase: string | undefined; accent: string | undefined } {
  if (lang === 'en') {
    // Phrase écrite à la main et à jour : on prend la paire écrite à la main
    const manuelle = affichable(enManuel?.phrase);
    if (manuelle && manuelAJour(manuelle, fr.phrase)) {
      return { phrase: manuelle, accent: affichable(enManuel?.accent) };
    }
    // Sinon la paire traduite automatiquement, si la phrase est traduite
    const auto = anglais(fr.phrase, undefined);
    if (auto) {
      const accent = affichable(fr.accent) && anglais(fr.accent, undefined, cleAccent(fr.phrase, fr.accent));
      return { phrase: auto, accent: accent || undefined };
    }
  }
  return { phrase: affichable(fr.phrase), accent: affichable(fr.accent) };
}
