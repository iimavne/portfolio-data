// Schéma des content collections : Astro vérifie chaque fichier au build.
// Un champ manquant ou invalide fait échouer le build avec un message clair.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categories, type Categorie } from './data/projets';

// Champ optionnel : un texte vide ou null (ce que Keystatic enregistre quand
// le champ est laissé vide) est traité comme "pas de valeur".
const optionnel = <T extends z.ZodType>(schema: T) =>
  z.preprocess((valeur) => (valeur === '' || valeur === null ? undefined : valeur), schema.optional());

const projets = defineCollection({
  // Un fichier .mdoc par projet ; son nom de fichier devient l'adresse /projets/<nom>
  loader: glob({ pattern: '**/*.mdoc', base: './src/content/projets' }),

  // `image` est fourni par Astro pour valider et optimiser les images
  schema: ({ image }) =>
    z.object({
      // Obligatoires
      titre: z.string(),
      resume: z.string().max(160, 'Le résumé doit faire 160 caractères maximum.'),
      categorie: z.enum(Object.keys(categories) as [Categorie, ...Categorie[]]),
      statut: z.enum(['en-cours', 'termine']),
      image: image(), // couverture, chemin relatif au fichier .mdoc
      date: z.coerce.date(), // sert à trier les projets (du plus ancien au plus récent)

      // Optionnels
      cours: optionnel(z.string()), // nom de l'UE
      periode: optionnel(z.string()), // ex. "Semestre 1, 2026"
      outils: z.array(z.string()).default([]),
      travail: optionnel(z.enum(['solo', 'binome'])),
      lienGithub: optionnel(z.url()),
      texteBouton: optionnel(z.string()), // libellé du bouton GitHub (sinon "Voir le code")
      fichier: optionnel(z.string()), // fichier à télécharger, dans public/
      miseEnAvant: z.boolean().default(false), // en premier sur l'accueil + badge "À la une"
      brouillon: z.boolean().default(false), // masqué du site (ex. le projet modèle)

      // Traductions anglaises (si vides, on affiche le français)
      titre_en: optionnel(z.string()),
      resume_en: optionnel(z.string().max(160)),
    }),
});

export const collections = { projets };
