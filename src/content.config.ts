// Schéma des content collections : Astro vérifie chaque fichier au build.
// Un champ manquant ou invalide fait échouer le build avec un message clair.
// Chaque champ ici doit correspondre à la config de l'admin (keystatic.config.tsx).
// Convention : un champ `xxx_en` est la version anglaise facultative de `xxx`
// (si elle est vide, le site affiche le français).
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { travaux, typesRessources } from './data/projets';

// Champ optionnel : un texte vide ou null (ce que Keystatic enregistre quand
// le champ est laissé vide) est traité comme "pas de valeur".
const optionnel = <T extends z.ZodType>(schema: T) =>
  z.preprocess((valeur) => (valeur === '' || valeur === null ? undefined : valeur), schema.optional());

const projets = defineCollection({
  // Un fichier .mdoc par projet ; son nom de fichier devient l'adresse de la page
  // (seulement le premier niveau : les sous-dossiers contiennent la version anglaise)
  loader: glob({ pattern: '*.mdoc', base: './src/content/projets' }),

  // `image` est fourni par Astro pour valider et optimiser les images
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      domaine: z.string(), // ex. "Assurance" : filtre, et zone haute de la carte sans image
      domaine_en: optionnel(z.string()),
      contexte: optionnel(z.string()), // ex. "Projet de cours · M1 · 2026"
      contexte_en: optionnel(z.string()),
      date: z.coerce.date(), // sert à trier les projets (du plus récent au plus ancien)
      resume: z.string().max(160, 'Le résumé doit faire 160 caractères maximum.'),
      // Bandeau "En bref" de la page projet, toujours affiché
      enBref: z.object({
        probleme: z.string(),
        methode: z.string(),
        resultat: z.string(),
      }),
      image: optionnel(image()), // couverture facultative, chemin relatif au fichier .mdoc
      // Liens et fichiers de la colonne "Ressources" : un lien OU un fichier (dans public/fichiers/)
      ressources: z
        .array(
          z.object({
            libelle: z.string(),
            libelle_en: optionnel(z.string()),
            type: z.enum(typesRessources),
            source: z.object({
              discriminant: z.enum(['lien', 'fichier']),
              value: z.string().nullable(), // vide : la ressource est ignorée
            }),
          }),
        )
        .default([]),
      coursOrigine: optionnel(reference('cours')), // cours dans lequel le projet a été fait
      travail: z.enum(travaux).default('solo'),
      outils: z.array(z.string()).default([]),
      brouillon: z.boolean().default(false), // masqué du site (ex. le projet modèle)

      // Version anglaise (le contenu anglais est dans la collection projetsEn)
      titre_en: optionnel(z.string()),
      resume_en: optionnel(z.string().max(160)),
      enBref_en: z
        .object({
          probleme: optionnel(z.string()),
          methode: optionnel(z.string()),
          resultat: optionnel(z.string()),
        })
        .default({}),
      // Coché : la version anglaise a été relue, la traduction automatique ne l'écrase plus
      traductionRelue: z.boolean().default(false),
    }),
});

// Contenu anglais des pages projet (champ "contenu_en" de Keystatic) :
// src/content/projets/<projet>/contenu_en.mdoc. L'identifiant est le nom du projet.
// Si le fichier n'existe pas, la page anglaise affiche le contenu français.
const projetsEn = defineCollection({
  loader: glob({
    pattern: '*/contenu_en.mdoc',
    base: './src/content/projets',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({}), // pas de métadonnées : seulement du contenu
});

// Formations de la section Parcours : un fichier JSON par diplôme
const formations = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/formations' }),
  schema: z.object({
    intitule: z.string(),
    intitule_en: optionnel(z.string()),
    etablissement: z.string(),
    etablissement_en: optionnel(z.string()),
    dates: z.string(), // ex. "2026 – 2027"
    niveau: optionnel(z.string()), // nom court, ex. "M1" : « Cours de M1 » dans Compétences
    niveau_en: optionnel(z.string()),
    ordre: z.number().int(), // 1 = affichée en premier
  }),
});

// Cours suivis : un fichier JSON par cours, rattaché à une formation
const cours = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/cours' }),
  schema: z.object({
    nom: z.string(),
    nom_en: optionnel(z.string()),
    formation: reference('formations'),
    notions: optionnel(z.string()),
    notions_en: optionnel(z.string()),
    langue: z.enum(['fr', 'en']), // langue d'enseignement
    classement: optionnel(z.string()), // ex. "4e sur 67 (17,35/20)"
    classement_en: optionnel(z.string()),
    ordre: z.number().int(), // position dans la liste de sa formation
  }),
});

// Compétences : une seule liste (page "Compétences" de l'admin), dans l'ordre d'affichage.
// Chaque ligne reçoit un identifiant à partir de sa position : "01", "02"...
const competences = defineCollection({
  loader: file('src/content/pages/competences.json', {
    parser: (texte) =>
      (JSON.parse(texte).competences ?? []).map((ligne: object, i: number) => ({
        id: String(i + 1).padStart(2, '0'),
        ...ligne,
      })),
  }),
  schema: z.object({
    nom: z.string(),
    nom_en: optionnel(z.string()),
    projets: z.array(z.string()).default([]), // projets où la compétence a été pratiquée
    cours: z.array(z.string()).default([]), // cours où elle a été apprise
  }),
});

export const collections = { projets, projetsEn, formations, cours, competences };
