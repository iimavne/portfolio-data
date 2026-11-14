// Outils communs au site (src/lib/traduction.ts) et à la traduction automatique
// (scripts/traduction/traduire.mjs) : les deux doivent calculer exactement la même chose.
// JavaScript pur, sans dépendance : utilisable au build du site comme dans l'Action.

/** Texte « normalisé » : fins de ligne Windows, espaces en double et espaces en début
 *  ou fin de ligne ignorés. Deux textes qui ne diffèrent que par ça sont le même texte. */
export function normaliser(texte) {
  return String(texte ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .trim();
}

/** Empreinte courte d'un texte (14 caractères), pour savoir s'il a changé.
 *  Algorithme cyrb53 : rapide, sans dépendance (ce n'est pas un usage de sécurité). */
export function empreinte(texte) {
  const s = normaliser(texte);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** Clé du dictionnaire src/i18n/auto/textes.json pour un texte français : le texte lui-même. */
export const cleTexte = (fr) => normaliser(fr);

/** Clé de la partie en couleur du positionnement : sa traduction dépend de la phrase entière. */
export const cleAccent = (positionnement, accent) => `${normaliser(accent)} ⟨dans⟩ ${normaliser(positionnement)}`;
