// Fonctions utilitaires pour lire les projets de la collection.
import { getCollection, type CollectionEntry } from 'astro:content';
import { localizePath, type Lang } from '../i18n/ui';
import { affichable, texte } from './texte';

export type Projet = CollectionEntry<'projets'>;

/** Les projets publiés (sans les brouillons), du plus récent au plus ancien. */
export async function getProjets(): Promise<Projet[]> {
  const projets = await getCollection('projets', (projet) => !projet.data.brouillon);
  return projets.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Adresse de la page d'un projet dans la bonne langue. */
export function lienProjet(id: string, lang: Lang): string {
  return localizePath(`/projets/${id}/`, lang);
}

/** Titre dans la bonne langue (le français si la traduction manque). */
export function titre(projet: Projet, lang: Lang): string {
  return (lang === 'en' && affichable(projet.data.titre_en)) || projet.data.titre;
}

/** Résumé dans la bonne langue (le français si la traduction manque). */
export function resume(projet: Projet, lang: Lang): string {
  return (lang === 'en' && affichable(projet.data.resume_en)) || projet.data.resume;
}

/** Domaine dans la bonne langue (ex. « Assurance » / « Insurance »). */
export function domaine(projet: Projet, lang: Lang): string {
  return texte(projet.data.domaine, projet.data.domaine_en, lang) ?? projet.data.domaine;
}

/** Contexte (ex. « Projet de cours · M1 · 2026 »), undefined s'il est vide. */
export function contexte(projet: Projet, lang: Lang): string | undefined {
  return texte(projet.data.contexte, projet.data.contexte_en, lang);
}

/** Les trois cases "En bref" dans la bonne langue (case par case). */
export function enBref(projet: Projet, lang: Lang) {
  const { enBref: fr, enBref_en: en } = projet.data;
  return {
    probleme: texte(fr.probleme, en.probleme, lang),
    methode: texte(fr.methode, en.methode, lang),
    resultat: texte(fr.resultat, en.resultat, lang),
  };
}

/** Ressources à afficher : seulement celles qui ont un lien ou un fichier. */
export function ressources(projet: Projet, lang: Lang) {
  return projet.data.ressources.flatMap((ressource) => {
    const href = affichable(ressource.source.value);
    const libelle = texte(ressource.libelle, ressource.libelle_en, lang);
    if (!href || !libelle) return [];
    return [{ libelle, href, type: ressource.type, fichier: ressource.source.discriminant === 'fichier' }];
  });
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

/** Pages projet à générer (une par projet), avec le projet suivant pour la navigation :
 *  après le dernier, on revient au premier. Partagé par les pages FR et EN. */
export async function cheminsProjets() {
  const projets = await getProjets();
  return projets.map((projet, index) => {
    const suivant = projets[(index + 1) % projets.length];
    return {
      params: { slug: projet.id },
      // Avec un seul projet, il n'y a pas de "suivant"
      props: { projet, suivant: suivant.id === projet.id ? undefined : suivant },
    };
  });
}
