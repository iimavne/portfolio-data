// Fonctions utilitaires pour la section Parcours : formations, leurs cours, et compétences.
import { getCollection, type CollectionEntry } from 'astro:content';
import { localizePath, type Lang } from '../i18n/ui';
import { getProjets, lienProjet, type Projet } from './projets';
import { texte } from './texte';

export type Formation = CollectionEntry<'formations'>;

const parOrdre = (a: Formation, b: Formation) => a.data.ordre - b.data.ordre;

/** Identifiant d'un cours, calculé à partir de sa formation et de son nom (sans accents) :
 *  « Modèle linéaire » du M1 -> "master-1-data-science--modele-lineaire". Il ne sert qu'aux
 *  ancres de la page : renommer un cours ne casse donc aucun lien enregistré. */
export function idCours(formationId: string, nom: string): string {
  const simple = nom
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${formationId}--${simple}`;
}

/** Ancre d'un cours dans la section Parcours de l'accueil (ex. /#cours-master-1-data-science--modele-lineaire). */
export function lienCours(id: string, lang: Lang): string {
  return `${localizePath('/', lang)}#cours-${id}`;
}

/** Ancre d'une formation dans la section Parcours (ex. /#formation-master-1-data-science). */
export function lienFormation(id: string, lang: Lang): string {
  return `${localizePath('/', lang)}#formation-${id}`;
}

/** Nom court d'une formation (ex. "M1"), dans la bonne langue, s'il est renseigné. */
export function niveau(formation: Formation, lang: Lang): string | undefined {
  return texte(formation.data.niveau, formation.data.en.niveau, lang);
}

/** Les formations dans l'ordre, chacune avec ses cours (dans l'ordre de l'admin) et leur identifiant. */
export async function getFormations() {
  const formations = await getCollection('formations');
  return formations.sort(parOrdre).map((formation) => ({
    formation,
    cours: formation.data.cours.map((cours) => ({ ...cours, id: idCours(formation.id, cours.nom) })),
  }));
}

/** Cours d'origine d'un projet : le cours dont la liste « Projets réalisés dans ce cours »
 *  contient ce projet (le premier trouvé). undefined si aucun cours ne le cite. */
export async function coursOrigine(projet: Projet, lang: Lang) {
  for (const { formation, cours } of await getFormations()) {
    const trouve = cours.find((c) => c.projets.includes(projet.id));
    if (trouve) {
      return {
        nom: texte(trouve.nom, trouve.en.nom, lang) ?? trouve.nom,
        niveau: niveau(formation, lang),
        href: lienCours(trouve.id, lang),
      };
    }
  }
  return undefined;
}

/** Compétences dans l'ordre, avec où elles ont été pratiquées : les projets choisis,
 *  ou à défaut les formations (« Cours de M1 »). Les liens vers un élément supprimé
 *  ou en brouillon sont ignorés. */
export async function getCompetences(lang: Lang) {
  const [competences, projets, formations] = await Promise.all([
    getCollection('competences'),
    getProjets(),
    getCollection('formations'),
  ]);

  return competences
    .sort((a, b) => a.id.localeCompare(b.id))
    .flatMap((competence) => {
      const nom = texte(competence.data.nom, competence.data.en.nom, lang);
      if (!nom) return [];

      const dansProjets = competence.data.projets.flatMap((id) => {
        const projet = projets.find((p) => p.id === id);
        return projet ? [{ type: 'projet' as const, projet, href: lienProjet(id, lang) }] : [];
      });
      const dansFormations = competence.data.formations.flatMap((id) => {
        const formation = formations.find((f) => f.id === id);
        return formation ? [{ type: 'formation' as const, formation, href: lienFormation(id, lang) }] : [];
      });

      return [{ nom, pratiqueDans: dansProjets.length > 0 ? dansProjets : dansFormations }];
    });
}
