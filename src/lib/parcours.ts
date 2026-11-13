// Fonctions utilitaires pour la section Parcours : formations, cours et compétences.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { localizePath, type Lang } from '../i18n/ui';
import { getProjets, lienProjet, type Projet } from './projets';
import { texte } from './texte';

export type Cours = CollectionEntry<'cours'>;

const parOrdre = (a: { data: { ordre: number } }, b: { data: { ordre: number } }) => a.data.ordre - b.data.ordre;

/** Ancre d'un cours dans la section Parcours de l'accueil (ex. /#cours-modele-lineaire). */
export function lienCours(id: string, lang: Lang): string {
  return `${localizePath('/', lang)}#cours-${id}`;
}

/** Les formations dans l'ordre, chacune avec ses cours triés. */
export async function getFormations() {
  const [formations, cours] = await Promise.all([getCollection('formations'), getCollection('cours')]);

  // Un cours rattaché à une formation supprimée ne s'affiche nulle part : on prévient
  for (const c of cours) {
    if (!formations.some((f) => f.id === c.data.formation.id)) {
      console.warn(`[parcours] Le cours « ${c.data.nom} » est rattaché à une formation qui n'existe plus.`);
    }
  }

  return formations.sort(parOrdre).map((formation) => ({
    formation,
    cours: cours.filter((c) => c.data.formation.id === formation.id).sort(parOrdre),
  }));
}

/** Cours d'origine d'un projet, ou undefined (non renseigné, ou cours supprimé depuis). */
export async function coursOrigine(projet: Projet): Promise<Cours | undefined> {
  const reference = projet.data.coursOrigine;
  if (!reference) return undefined;
  const cours = await getEntry(reference);
  if (!cours) console.warn(`[parcours] Le projet « ${projet.data.titre} » pointe vers un cours qui n'existe plus.`);
  return cours;
}

/** Nom d'un cours, niveau de sa formation (ex. "M1") et lien vers lui dans Parcours. */
export async function infosCours(cours: Cours, lang: Lang) {
  const formation = await getEntry(cours.data.formation);
  return {
    nom: texte(cours.data.nom, cours.data.nom_en, lang) ?? cours.data.nom,
    niveau: formation && texte(formation.data.niveau, formation.data.niveau_en, lang),
    href: lienCours(cours.id, lang),
  };
}

/** Compétences dans l'ordre, avec où elles ont été pratiquées : les projets choisis,
 *  ou à défaut les cours. Les liens vers un élément supprimé ou en brouillon sont ignorés. */
export async function getCompetences(lang: Lang) {
  const [competences, projets, cours, formations] = await Promise.all([
    getCollection('competences'),
    getProjets(),
    getCollection('cours'),
    getCollection('formations'),
  ]);

  // Nom court de la formation d'un cours (ex. "M1"), s'il est renseigné
  const niveau = (c: Cours) => {
    const formation = formations.find((f) => f.id === c.data.formation.id);
    return formation && texte(formation.data.niveau, formation.data.niveau_en, lang);
  };

  return competences
    .sort((a, b) => a.id.localeCompare(b.id))
    .flatMap((competence) => {
      const nom = texte(competence.data.nom, competence.data.nom_en, lang);
      if (!nom) return [];

      const dansProjets = competence.data.projets.flatMap((id) => {
        const projet = projets.find((p) => p.id === id);
        return projet ? [{ type: 'projet' as const, projet, href: lienProjet(id, lang) }] : [];
      });
      const dansCours = competence.data.cours.flatMap((id) => {
        const c = cours.find((entree) => entree.id === id);
        return c ? [{ type: 'cours' as const, cours: c, niveau: niveau(c), href: lienCours(id, lang) }] : [];
      });

      return [{ nom, pratiqueDans: dansProjets.length > 0 ? dansProjets : dansCours }];
    });
}
