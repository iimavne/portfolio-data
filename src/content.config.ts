// Schéma des content collections : Astro vérifie chaque fichier au build.
// Un champ manquant ou invalide fait échouer le build avec un message clair.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categories, type Categorie } from './data/projets';

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
      cours: z.string().optional(), // nom de l'UE
      periode: z.string().optional(), // ex. "Semestre 1, 2026"
      outils: z.array(z.string()).default([]),
      travail: z.enum(['solo', 'binome']).optional(),
      lienGithub: z.url().optional(),
      fichier: z.string().optional(), // fichier à télécharger, dans public/
      miseEnAvant: z.boolean().default(false),

      // Traductions anglaises (si vides, on affiche le français)
      titre_en: z.string().optional(),
      resume_en: z.string().max(160).optional(),
    }),
});

export const collections = { projets };
