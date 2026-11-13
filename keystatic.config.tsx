// Configuration de l'admin Keystatic (/keystatic).
// Chaque champ ici doit correspondre au schéma Astro de src/content.config.ts.
// Règles UX (l'étudiant ne sait pas coder) : libellés en français, une aide d'une
// ligne sous chaque champ, des menus déroulants dès que possible, les champs dans
// l'ordre où ils apparaissent sur le site, et la version anglaise regroupée en bas.
import { collection, config, fields, singleton, type ComponentSchema } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';
import { site } from './src/data/site';

// Section « Version anglaise » : les mêmes champs que le français, dans un sous-objet `en`,
// remplis par la traduction automatique (scripts/traduction/traduire.mjs).
// `layout` : largeur de chaque champ sur 12 colonnes (ex. [6, 6] = deux champs côte à côte).
const versionAnglaise = <T extends Record<string, ComponentSchema>>(champs: T, layout?: number[]) =>
  fields.object(champs, {
    label: 'Version anglaise (remplie automatiquement)',
    description: 'Laisse vide : la traduction se fait toute seule. Si tu corriges un texte, il ne sera plus écrasé.',
    layout,
  });

// Champ texte anglais (sans aide : celle de la section suffit)
const en = (label: string, multiline = false) => fields.text({ label, multiline });

// Images et fichiers des projets : dossier + chemin écrit dans le fichier .mdoc
const imagesProjets = {
  directory: 'src/assets/projets',
  publicPath: '../../assets/projets/',
};

// Le contenu anglais est rangé un dossier plus bas (src/content/projets/<projet>/contenu_en.mdoc) :
// ses chemins d'images remontent donc d'un niveau de plus.
const imagesProjetsEn = {
  directory: 'src/assets/projets',
  publicPath: '../../../assets/projets/',
};

// Petits styles pour les aperçus des blocs dans l'éditeur
const apercu = {
  titre: { margin: '0 0 8px', fontWeight: 600 },
  discret: { margin: '8px 0 0', opacity: 0.7 },
  mono: { margin: 0, paddingLeft: 18, fontFamily: 'monospace', fontSize: 13 },
};

// Blocs sur mesure du contenu des pages projet (FR et EN), rendus par les balises
// Markdoc de markdoc.config.mjs et les composants de src/components/markdoc/
const blocsContenu = {
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
};

export default config({
  // Où sont enregistrées les modifications :
  // - en ligne (build de production) : mode GitHub, chaque "Sauvegarder" crée un commit
  //   sur le dépôt, puis Vercel redéploie le site ;
  // - en local (`npm run dev`) : mode local, écriture directe dans les fichiers du projet.
  // Pour tester le mode GitHub en local (ou créer la GitHub App), mettre
  // PUBLIC_KEYSTATIC_STORAGE=github dans .env.
  // ⚠️ Au transfert du dépôt sur le compte de l'étudiant : changer `owner` (voir CLAUDE.md).
  storage:
    import.meta.env.PROD || import.meta.env.PUBLIC_KEYSTATIC_STORAGE === 'github'
      ? { kind: 'github', repo: { owner: 'iimavne', name: 'portfolio-data' } }
      : { kind: 'local' },

  // Interface de l'admin en français
  locale: 'fr-FR',

  ui: {
    brand: {
      name: `${site.name} / admin`,
      // Point bleu, couleur d'accent du site
      mark: () => (
        <span
          style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#1D4ED8' }}
        />
      ),
    },
    // Barre latérale : le contenu du portfolio, puis les réglages
    navigation: {
      'Mon portfolio': ['projets', 'formations', 'competences'],
      Réglages: ['parametres'],
    },
  },

  collections: {
    // ----- Projets (un fichier .mdoc par projet) -----
    projets: collection({
      label: 'Projets',
      path: 'src/content/projets/*',
      slugField: 'titre',
      format: { contentField: 'contenu' }, // métadonnées + contenu dans un seul fichier .mdoc
      entryLayout: 'form', // une seule colonne large, dans l'ordre de la page projet
      // « Ajouter » ouvre un projet pré-rempli à partir de ce modèle (en brouillon)
      template: 'src/content/modeles/projet',
      // Bouton pour voir la page sur le site
      previewUrl: '/projets/{slug}/',
      columns: ['domaine', 'date'],
      schema: {
        titre: fields.slug({
          name: {
            label: 'Titre',
            description: 'Ex. « Base de données d’un cabinet de courtage en assurance ».',
            validation: { length: { min: 1 } },
          },
          slug: {
            label: 'Adresse de la page',
            description: 'Créée à partir du titre (bouton ↻). Raccourcis-la si elle est trop longue.',
          },
        }),
        domaine: fields.text({
          label: 'Domaine',
          description: 'Le secteur, ex. « Assurance » : même orthographe d’un projet à l’autre.',
          validation: { isRequired: true },
        }),
        date: fields.date({
          label: 'Date',
          description: 'Le projet le plus récent est affiché en premier.',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        contexte: fields.text({
          label: 'Contexte',
          description: 'Ex. « Projet de cours · M1 · 2026 ».',
        }),
        resume: fields.text({
          label: 'Résumé',
          description: 'Une ou deux phrases pour la carte de l’accueil (160 caractères maximum).',
          multiline: true,
          validation: { isRequired: true, length: { max: 160 } },
        }),
        image: fields.image({
          label: 'Image de couverture',
          description: 'Facultative : un graphique ou un schéma, au format paysage.',
          ...imagesProjets,
        }),
        outils: fields.array(fields.text({ label: 'Outil' }), {
          label: 'Outils',
          description: 'Ex. « SQL », « pandas ».',
          itemLabel: (props) => props.value || 'Nouvel outil',
        }),
        enBref: fields.object(
          {
            probleme: fields.text({ label: 'Le problème', multiline: true, validation: { isRequired: true } }),
            methode: fields.text({ label: 'La méthode', multiline: true, validation: { isRequired: true } }),
            resultat: fields.text({ label: 'Le résultat', multiline: true, validation: { isRequired: true } }),
          },
          {
            label: 'En bref',
            description: 'Les trois cases en haut de la page projet : une ou deux phrases chacune.',
            layout: [4, 4, 4],
          },
        ),
        contenu: fields.markdoc({
          label: 'Contenu de la page',
          description:
            'Parties en « Titre 2 » : Contexte, Données, Méthode, Résultats, Ce que j’ai appris. Une partie vide est masquée.',
          options: {
            heading: [2, 3],
            image: imagesProjets,
          },
          components: blocsContenu,
        }),
        ressources: fields.array(
          fields.object(
            {
              libelle: fields.text({
                label: 'Libellé',
                description: 'Ex. « Code sur GitHub ».',
                validation: { isRequired: true },
              }),
              type: fields.select({
                label: 'Type',
                options: [
                  { label: 'GitHub', value: 'github' },
                  { label: 'Notebook', value: 'notebook' },
                  { label: 'PDF', value: 'pdf' },
                  { label: 'Rapport', value: 'rapport' },
                  { label: 'Script', value: 'script' },
                  { label: 'Autre', value: 'autre' },
                ],
                defaultValue: 'github',
              }),
              source: fields.conditional(
                fields.select({
                  label: 'Lien ou fichier ?',
                  options: [
                    { label: 'Un lien (GitHub, Kaggle, Colab…)', value: 'lien' },
                    { label: 'Un fichier à déposer ici', value: 'fichier' },
                  ],
                  defaultValue: 'lien',
                }),
                {
                  lien: fields.url({ label: 'Adresse', description: 'Ex. https://github.com/ton-pseudo/nom-du-projet' }),
                  fichier: fields.file({
                    label: 'Fichier',
                    description: 'Ex. un .pdf, .sql ou .ipynb : il sera téléchargeable depuis la page.',
                    directory: 'public/fichiers',
                    publicPath: '/fichiers/',
                  }),
                },
              ),
              en: versionAnglaise({ libelle: en('Libellé') }),
            },
            { layout: [8, 4, 12, 12] },
          ),
          {
            label: 'Ressources',
            description:
              'Code, notebook, rapport… Pour GitHub, soigne le README : titre, une phrase de résumé, puis Contexte, Données, Méthode, Résultats, Lancer le projet, Ce que j’ai appris.',
            itemLabel: (props) => props.fields.libelle.value || 'Nouvelle ressource',
          },
        ),
        travail: fields.select({
          label: 'Travail',
          options: [
            { label: 'Solo', value: 'solo' },
            { label: 'Binôme', value: 'binome' },
            { label: 'Groupe', value: 'groupe' },
          ],
          defaultValue: 'solo',
        }),
        brouillon: fields.checkbox({
          label: 'Brouillon (caché du site)',
          description: 'Décoche-le quand le projet est prêt à être publié.',
          defaultValue: false,
        }),

        // ----- Version anglaise -----
        en: versionAnglaise(
          {
            relue: fields.checkbox({
              label: 'Traduction relue',
              description: 'Cochée : la traduction automatique ne modifie plus ce projet.',
              defaultValue: false,
            }),
            titre: en('Titre'),
            domaine: en('Domaine'),
            contexte: en('Contexte'),
            resume: fields.text({ label: 'Résumé', multiline: true, validation: { length: { max: 160 } } }),
            enBref: fields.object(
              { probleme: en('Le problème', true), methode: en('La méthode', true), resultat: en('Le résultat', true) },
              { label: 'En bref', layout: [4, 4, 4] },
            ),
          },
          [12, 12, 6, 6, 12, 12],
        ),
        contenu_en: fields.markdoc({
          label: 'Contenu de la page (version anglaise)',
          description: 'Rempli automatiquement. S’il est vide, la page anglaise affiche le contenu français.',
          options: {
            heading: [2, 3],
            image: imagesProjetsEn,
          },
          components: blocsContenu,
        }),
      },
    }),

    // ----- Formations (un fichier JSON par diplôme, avec ses cours) -----
    formations: collection({
      label: 'Formations',
      path: 'src/content/formations/*',
      slugField: 'intitule',
      format: { data: 'json' },
      previewUrl: '/#formation-{slug}',
      columns: ['dates', 'ordre'],
      schema: {
        intitule: fields.slug({
          name: {
            label: 'Intitulé',
            description: 'Ex. « Master 1 Mathématiques appliquées, statistique · parcours Data Science ».',
            validation: { length: { min: 1 } },
          },
          slug: {
            label: 'Identifiant',
            description: 'Créé à partir de l’intitulé. Ne le change plus ensuite : il relie les compétences.',
          },
        }),
        etablissement: fields.text({
          label: 'Établissement',
          description: 'Ex. « Aix-Marseille Université ».',
          validation: { isRequired: true },
        }),
        dates: fields.text({
          label: 'Dates',
          description: 'Ex. « 2026 – 2027 ».',
          validation: { isRequired: true },
        }),
        niveau: fields.text({
          label: 'Niveau (court)',
          description: 'Ex. « M1 » : affiché « Cours de M1 » dans les compétences.',
        }),
        ordre: fields.integer({
          label: 'Ordre d’affichage',
          description: '1 = affichée en premier (la plus récente), puis 2…',
          validation: { isRequired: true, min: 1 },
        }),
        cours: fields.array(
          fields.object(
            {
              nom: fields.text({ label: 'Nom du cours', validation: { isRequired: true } }),
              langue: fields.select({
                label: 'Langue',
                description: 'Un cours en anglais est signalé en bleu.',
                options: [
                  { label: 'Français', value: 'fr' },
                  { label: 'Anglais', value: 'en' },
                ],
                defaultValue: 'fr',
              }),
              notions: fields.text({
                label: 'Notions clés',
                description: 'Ex. « Inférence, régularisation (ridge, Lasso), validation croisée ».',
              }),
              classement: fields.text({
                label: 'Classement',
                description: 'Facultatif. Ex. « 4e sur 67 (17,35/20) ».',
              }),
              projets: fields.multiRelationship({
                label: 'Projets réalisés dans ce cours',
                description: 'La page de ces projets indiquera « Réalisé dans le cadre du cours ».',
                collection: 'projets',
              }),
              en: versionAnglaise({ nom: en('Nom du cours'), notions: en('Notions clés'), classement: en('Classement') }),
            },
            { layout: [8, 4, 12, 12, 12, 12] },
          ),
          {
            label: 'Cours',
            description: 'Clique sur un cours pour le modifier ; glisse-le pour changer l’ordre.',
            itemLabel: (props) =>
              `${props.fields.nom.value || 'Nouveau cours'}${props.fields.langue.value === 'en' ? ' · EN' : ''}`,
          },
        ),
        en: versionAnglaise(
          { intitule: en('Intitulé'), etablissement: en('Établissement'), niveau: en('Niveau (court)') },
          [12, 8, 4],
        ),
      },
    }),
  },

  // ----- Pages uniques (un seul fichier JSON chacune, dans src/content/pages/) -----
  singletons: {
    competences: singleton({
      label: 'Compétences',
      path: 'src/content/pages/competences',
      format: { data: 'json' },
      previewUrl: '/#parcours',
      schema: {
        competences: fields.array(
          fields.object({
            nom: fields.text({
              label: 'Compétence',
              description: 'Ex. « SQL », « Python · pandas ».',
              validation: { isRequired: true },
            }),
            projets: fields.multiRelationship({
              label: 'Pratiquée dans les projets',
              description: 'Affiché à droite avec un lien, ex. « Projet assurance ».',
              collection: 'projets',
            }),
            formations: fields.multiRelationship({
              label: 'Apprise en formation',
              description: 'Utilisé si aucun projet n’est choisi : « Cours de M1 ».',
              collection: 'formations',
            }),
            en: versionAnglaise({ nom: en('Compétence') }),
          }),
          {
            label: 'Compétences',
            description: 'Une ligne par compétence, dans l’ordre d’affichage (glisse pour réordonner).',
            itemLabel: (props) => props.fields.nom.value || 'Nouvelle compétence',
          },
        ),
      },
    }),

    parametres: singleton({
      label: 'Paramètres du site',
      path: 'src/content/pages/parametres',
      format: { data: 'json' },
      previewUrl: '/',
      schema: {
        nom: fields.text({
          label: 'Prénom et nom',
          description: 'Affiché en haut à gauche, dans le pied de page et le titre des onglets.',
          validation: { isRequired: true },
        }),

        // ----- Haut de l'accueil, dans l'ordre d'affichage -----
        labelFormation: fields.text({
          label: 'Formation actuelle',
          description: 'Petit texte au-dessus du grand titre. Ex. « M1 Data Science · Aix-Marseille Université ».',
        }),
        positionnement: fields.text({
          label: 'Positionnement',
          description: 'Le grand titre : qui tu es et ce que tu fais, en une phrase.',
          multiline: true,
          validation: { isRequired: true },
        }),
        positionnementAccent: fields.text({
          label: 'Partie en couleur',
          description: 'Un morceau du positionnement, recopié à l’identique. Ex. « statistiques et de machine learning ».',
        }),
        domainesVises: fields.array(
          fields.object({
            domaine: fields.text({ label: 'Domaine', description: 'Ex. « Assurance et risque ».', validation: { isRequired: true } }),
            en: versionAnglaise({ domaine: en('Domaine') }),
          }),
          {
            label: 'Domaines visés',
            description: 'Pastilles sous le titre. Liste vide : la ligne est masquée.',
            itemLabel: (props) => props.fields.domaine.value || 'Nouveau domaine',
          },
        ),
        langues: fields.array(
          fields.object(
            {
              langue: fields.text({ label: 'Langue', description: 'Ex. « Anglais ».', validation: { isRequired: true } }),
              precision: fields.text({ label: 'Précision', description: 'Facultatif. Ex. « cours de M1 suivis en anglais ».' }),
              miseEnAvant: fields.checkbox({
                label: 'Mettre en avant (encadrée en bleu)',
                defaultValue: false,
              }),
              en: versionAnglaise({ langue: en('Langue'), precision: en('Précision') }, [4, 8]),
            },
            { layout: [4, 8, 12, 12] },
          ),
          {
            label: 'Langues',
            description: 'Pastilles sous le titre. Liste vide : la ligne est masquée.',
            itemLabel: (props) =>
              [props.fields.langue.value, props.fields.precision.value].filter(Boolean).join(' : ') || 'Nouvelle langue',
          },
        ),

        // ----- Je recherche -----
        recherches: fields.array(
          fields.object(
            {
              type: fields.select({
                label: 'Type',
                options: [
                  { label: 'Stage', value: 'stage' },
                  { label: 'Alternance', value: 'alternance' },
                  { label: 'Emploi', value: 'emploi' },
                ],
                defaultValue: 'stage',
              }),
              debut: fields.text({ label: 'À partir de', description: 'Ex. « dès mai 2027 ».' }),
              details: fields.text({ label: 'Détails', description: 'Durée, rythme, lieu. Ex. « 4 mois · Marseille ou télétravail ».' }),
              afficher: fields.checkbox({
                label: 'Afficher sur le site',
                description: 'Décoche pour la masquer sans la supprimer (ex. une fois le stage trouvé).',
                defaultValue: true,
              }),
              en: versionAnglaise({ debut: en('À partir de'), details: en('Détails') }, [4, 8]),
            },
            { layout: [4, 8, 12, 12, 12] },
          ),
          {
            label: 'Je recherche',
            description: 'Encadré en haut de l’accueil et phrase de la section Contact.',
            itemLabel: (props) =>
              [
                { stage: 'Stage', alternance: 'Alternance', emploi: 'Emploi' }[props.fields.type.value],
                props.fields.debut.value,
                props.fields.afficher.value ? '' : '(masquée)',
              ]
                .filter(Boolean)
                .join(' · '),
          },
        ),

        // ----- CV et profils -----
        // Pas de champ email ni téléphone : le contact passe par le formulaire (Web3Forms).
        cv: fields.file({
          label: 'CV (PDF)',
          description: 'Bouton « CV (PDF) » en haut du site, téléchargeable par tous. Sans fichier, le bouton est masqué.',
          directory: 'public/documents',
          publicPath: '/documents/',
        }),
        linkedin: fields.url({ label: 'Profil LinkedIn', description: 'Ex. https://www.linkedin.com/in/ton-profil' }),
        github: fields.url({ label: 'Profil GitHub', description: 'Ex. https://github.com/ton-pseudo' }),

        // ----- Version anglaise -----
        en: versionAnglaise({
          labelFormation: en('Formation actuelle'),
          positionnement: en('Positionnement', true),
          positionnementAccent: en('Partie en couleur'),
        }),
      },
    }),
  },
});
