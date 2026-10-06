// Configuration de l'admin Keystatic (/keystatic).
// Chaque champ ici doit correspondre au schéma Astro de src/content.config.ts.
// Règles UX (l'étudiant ne sait pas coder) : libellés en français, une aide sous
// chaque champ, des menus déroulants dès que possible.
import { collection, config, fields } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';
import { categories } from './src/data/projets';
import { site } from './src/data/site';

// Menus déroulants des catégories, construits depuis la liste du site
const optionsCategories = Object.entries(categories).map(([value, libelles]) => ({
  label: libelles.fr,
  value,
}));

// Images et fichiers des projets : dossier + chemin écrit dans le fichier .mdoc
const imagesProjets = {
  directory: 'src/assets/projets',
  publicPath: '../../assets/projets/',
};

// Petits styles pour les aperçus des blocs dans l'éditeur
const apercu = {
  titre: { margin: '0 0 8px', fontWeight: 600 },
  discret: { margin: '8px 0 0', opacity: 0.7 },
  mono: { margin: 0, paddingLeft: 18, fontFamily: 'monospace', fontSize: 13 },
};

export default config({
  // Mode local : les modifications sont écrites directement dans les fichiers du projet
  storage: { kind: 'local' },

  // Interface de l'admin en français
  locale: 'fr-FR',

  ui: {
    brand: {
      name: `${site.handle} / admin`,
      // Point vert, comme dans la nav du site
      mark: () => (
        <span
          style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#C8F169' }}
        />
      ),
    },
    navigation: {
      Collections: ['projets'],
    },
  },

  collections: {
    projets: collection({
      label: 'Projets',
      path: 'src/content/projets/*',
      slugField: 'titre',
      format: { contentField: 'contenu' }, // métadonnées + contenu dans un seul fichier .mdoc
      entryLayout: 'content',
      columns: ['categorie', 'statut', 'date'],
      schema: {
        // ----- Obligatoires -----
        titre: fields.slug({
          name: {
            label: 'Titre (FR)',
            description: 'Le nom du projet, ex. « Base de données relationnelle ».',
            validation: { length: { min: 1 } },
          },
          slug: {
            label: 'Adresse de la page',
            description: 'Créée à partir du titre. Le projet sera visible sur /projets/<adresse>.',
          },
        }),
        resume: fields.text({
          label: 'Résumé (FR)',
          description: 'Une ou deux phrases affichées sur la carte de l’accueil. 160 caractères maximum.',
          multiline: true,
          validation: { isRequired: true, length: { max: 160 } },
        }),
        categorie: fields.select({
          label: 'Catégorie',
          description: 'Sert au filtre des projets sur l’accueil.',
          options: optionsCategories,
          defaultValue: 'excel',
        }),
        statut: fields.select({
          label: 'Statut',
          description: 'Affiché sous forme de pastille sur la carte et la page.',
          options: [
            { label: 'En cours', value: 'en-cours' },
            { label: 'Terminé', value: 'termine' },
          ],
          defaultValue: 'en-cours',
        }),
        cours: fields.text({
          label: 'Cours associé',
          description: 'Le nom de l’UE, ex. « Bases de données ». Facultatif.',
        }),
        periode: fields.text({
          label: 'Période',
          description: 'Ex. « Semestre 1, 2026 ». Facultatif.',
        }),
        date: fields.date({
          label: 'Date du projet',
          description: 'Sert à classer les projets : du plus ancien (01) au plus récent.',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        outils: fields.array(fields.text({ label: 'Outil' }), {
          label: 'Outils',
          description: 'Un outil par ligne, ex. « SQL », « pandas ». Affichés en pastilles sur la carte.',
          itemLabel: (props) => props.value || 'Nouvel outil',
        }),
        travail: fields.select({
          label: 'Travail',
          description: 'Projet réalisé seul ou à deux.',
          options: [
            { label: 'Solo', value: 'solo' },
            { label: 'Binôme', value: 'binome' },
          ],
          defaultValue: 'solo',
        }),
        image: fields.image({
          label: 'Image de couverture',
          description: 'Capture du dashboard, du schéma, d’un graphique… Format paysage conseillé.',
          ...imagesProjets,
          validation: { isRequired: true },
        }),

        // ----- Contenu de la page projet -----
        contenu: fields.markdoc({
          label: 'Contenu de la page projet',
          description:
            'Utilise des titres « Titre 2 » pour les grandes parties : ils forment le sommaire de la page.',
          options: {
            heading: [2, 3],
            image: imagesProjets,
          },
          components: {
            requete: wrapper({
              label: 'Requête SQL',
              description: 'Une question, la requête qui y répond (bloc de code) et le résultat.',
              schema: {
                question: fields.text({
                  label: 'Question',
                  description: 'Ex. « Quels clients habitent à Marseille ? »',
                  validation: { isRequired: true },
                }),
                tags: fields.text({
                  label: 'Mots-clés SQL',
                  description: 'Affichés à droite de la question, ex. « SELECT · WHERE ». Facultatif.',
                }),
                resultat: fields.text({
                  label: 'Résultat',
                  description: 'Texte sous la requête, ex. « Résultat : 12 clients ». Facultatif.',
                  multiline: true,
                }),
              },
              // Aperçu dans l'éditeur : question, code, résultat
              ContentView: ({ value, children }) => (
                <div>
                  <p style={apercu.titre}>
                    {value.question || 'Question à remplir (bouton Edit)'}
                    {value.tags && ` · ${value.tags}`}
                  </p>
                  {children}
                  {value.resultat && <p style={apercu.discret}>{value.resultat}</p>}
                </div>
              ),
            }),
            tables: wrapper({
              label: 'Grille de tables SQL',
              description: 'Contient un ou plusieurs blocs « Table SQL », affichés côte à côte.',
              schema: {
                legende: fields.text({
                  label: 'Légende',
                  description: 'Petit texte sous les tables, ex. « PK = clé primaire ». Facultatif.',
                }),
              },
              ContentView: ({ value, children }) => (
                <div>
                  {children}
                  {value.legende && <p style={apercu.discret}>{value.legende}</p>}
                </div>
              ),
            }),
            'table-sql': block({
              label: 'Table SQL',
              description: 'Une table et ses colonnes. À placer dans une « Grille de tables SQL ».',
              schema: {
                nom: fields.text({
                  label: 'Nom de la table',
                  description: 'Ex. « clients ».',
                  validation: { isRequired: true },
                }),
                colonnes: fields.array(
                  fields.text({
                    label: 'Colonne',
                    description: 'Format : « nom TYPE », précédé de PK ou FK si c’est une clé. Ex. « PK id INT ».',
                  }),
                  {
                    label: 'Colonnes',
                    itemLabel: (props) => props.value || 'Nouvelle colonne',
                  },
                ),
              },
              // Aperçu dans l'éditeur : nom de la table et ses colonnes
              ContentView: ({ value }) => (
                <div>
                  <p style={apercu.titre}>{value.nom || 'Table à remplir (bouton Edit)'}</p>
                  <ul style={apercu.mono}>
                    {value.colonnes.map((colonne, i) => (
                      <li key={i}>{colonne}</li>
                    ))}
                  </ul>
                </div>
              ),
            }),
          },
        }),

        // ----- Liens -----
        lienGithub: fields.url({
          label: 'Lien GitHub',
          description: 'Adresse du code, ex. https://github.com/… Affiche un bouton en haut de la page. Facultatif.',
        }),
        texteBouton: fields.text({
          label: 'Texte du bouton GitHub',
          description: 'Ex. « Voir le script SQL ». Si vide : « Voir le code ».',
        }),
        fichier: fields.file({
          label: 'Fichier à télécharger',
          description: 'Ex. un .xlsx, .sql ou .ipynb. Affiche un bouton « Télécharger le fichier ». Facultatif.',
          directory: 'public/fichiers',
          publicPath: '/fichiers/',
        }),

        // ----- Affichage -----
        miseEnAvant: fields.checkbox({
          label: 'À la une',
          description: 'Affiche ce projet en premier sur l’accueil, avec un badge « À la une ». Un seul à la fois.',
          defaultValue: false,
        }),
        brouillon: fields.checkbox({
          label: 'Brouillon (masqué du site)',
          description: 'Coché : le projet n’apparaît pas sur le site. Pense à décocher pour le publier.',
          defaultValue: false,
        }),

        // ----- Version anglaise -----
        titre_en: fields.text({
          label: 'Titre (EN)',
          description: 'Facultatif. Si la version EN est vide, le site affiche la version FR.',
        }),
        resume_en: fields.text({
          label: 'Résumé (EN)',
          description: 'Facultatif, 160 caractères maximum. Si vide, le site affiche le résumé FR.',
          multiline: true,
          validation: { length: { max: 160 } },
        }),
      },
    }),
  },
});
