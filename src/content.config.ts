// Schéma des content collections : Astro vérifie chaque fichier au build.
// Un champ manquant ou invalide fait échouer le build avec un message clair.
// Chaque champ ici doit correspondre à la config de l'admin (keystatic.config.tsx).
// Convention : les versions anglaises ÉCRITES À LA MAIN sont rangées dans un sous-objet `en`,
// avec les mêmes noms de champs (`titre` -> `en.titre`). Facultatives : vides, le site affiche
// la traduction automatique, rangée à part dans src/i18n/auto/ (scripts/traduction/traduire.mjs),
// sinon le français. Ordre de choix : src/lib/texte.ts.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { travaux, typesRessources } from './data/projets';

// Champ optionnel : un texte vide ou null (ce que Keystatic enregistre quand
// le champ est laissé vide) est traité comme "pas de valeur".
const optionnel = <T extends z.ZodType>(schema: T) =>
  z.preprocess((valeur) => (valeur === '' || valeur === null ? undefined : valeur), schema.optional());

// Sous-objet `en` : des textes anglais facultatifs (objet vide si rien n'est traduit)
const enDe = <T extends z.ZodRawShape>(champs: T) => z.object(champs).default({} as z.infer<z.ZodObject<T>>);
const texteEn = () => optionnel(z.string());

const projets = defineCollection({
  // Un fichier .mdoc par projet ; son nom de fichier devient l'adresse de la page
  // (seulement le premier niveau : les sous-dossiers contiennent la version anglaise)
  loader: glob({ pattern: '*.mdoc', base: './src/content/projets' }),

  // `image` est fourni par Astro pour valider et optimiser les images
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      domaine: z.string(), // ex. "Assurance" : filtre, et zone haute de la carte sans image
      date: z.coerce.date(), // sert à trier les projets (du plus récent au plus ancien)
      contexte: optionnel(z.string()), // ex. "Projet de cours · M1 · 2026"
      resume: z.string().max(160, 'Le résumé doit faire 160 caractères maximum.'),
      image: optionnel(image()), // couverture facultative, chemin relatif au fichier .mdoc
      outils: z.array(z.string()).default([]),
      // Bandeau "En bref" de la page projet, toujours affiché
      enBref: z.object({
        probleme: z.string(),
        methode: z.string(),
        resultat: z.string(),
      }),
      // Liens et fichiers de la colonne "Ressources" : un lien OU un fichier (dans public/fichiers/)
      ressources: z
        .array(
          z.object({
            libelle: z.string(),
            type: z.enum(typesRessources),
            source: z.object({
              discriminant: z.enum(['lien', 'fichier']),
              value: z.string().nullable(), // vide : la ressource est ignorée
            }),
            en: enDe({ libelle: texteEn() }),
          }),
        )
        .default([]),
      travail: z.enum(travaux).default('solo'),
      brouillon: z.boolean().default(false), // masqué du site

      // Version anglaise écrite à la main (le contenu anglais est dans projetsEn / projetsAuto)
      en: enDe({
        titre: texteEn(),
        domaine: texteEn(),
        contexte: texteEn(),
        resume: optionnel(z.string().max(160)),
        enBref: enDe({ probleme: texteEn(), methode: texteEn(), resultat: texteEn() }),
      }),
    }),
});

// Contenu anglais des pages projet ÉCRIT À LA MAIN (champ "contenu_en" de Keystatic) :
// src/content/projets/<projet>/contenu_en.mdoc. L'identifiant est le nom du projet.
// Facultatif : il remplace la traduction automatique (choix dans src/lib/projets.ts).
const projetsEn = defineCollection({
  loader: glob({
    pattern: '*/contenu_en.mdoc',
    base: './src/content/projets',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: z.object({}), // pas de métadonnées : seulement du contenu
});

// Contenu anglais des pages projet TRADUIT AUTOMATIQUEMENT (scripts/traduction/traduire.mjs) :
// src/i18n/auto/projets/<projet>.mdoc. `source` = empreinte du contenu français traduit :
// s'il ne correspond plus (le français a changé), la page anglaise ne l'utilise pas.
const projetsAuto = defineCollection({
  loader: glob({ pattern: '*.mdoc', base: './src/i18n/auto/projets' }),
  schema: z.object({ source: z.string() }),
});

// Formations de la section Parcours : un fichier JSON par diplôme, avec ses cours
const formations = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/formations' }),
  schema: z.object({
    intitule: z.string(),
    etablissement: z.string(),
    dates: z.string(), // ex. "2026 – 2027"
    niveau: optionnel(z.string()), // nom court, ex. "M1" : « Cours de M1 » dans Compétences
    ordre: z.number().int(), // 1 = affichée en premier
    // Cours, dans l'ordre d'affichage (glisser-déposer dans l'admin)
    cours: z
      .array(
        z.object({
          nom: z.string(),
          notions: optionnel(z.string()),
          langue: z.enum(['fr', 'en']), // langue d'enseignement
          classement: optionnel(z.string()), // ex. "4e sur 67 (17,35/20)"
          projets: z.array(z.string()).default([]), // projets réalisés dans ce cours
          en: enDe({ nom: texteEn(), notions: texteEn(), classement: texteEn() }),
        }),
      )
      .default([]),
    en: enDe({ intitule: texteEn(), etablissement: texteEn(), niveau: texteEn() }),
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
    projets: z.array(z.string()).default([]), // projets où la compétence a été pratiquée
    formations: z.array(z.string()).default([]), // formations où elle a été apprise (« Cours de M1 »)
    en: enDe({ nom: texteEn() }),
  }),
});

export const collections = { projets, projetsEn, projetsAuto, formations, competences };
