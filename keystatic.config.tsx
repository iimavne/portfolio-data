// Configuration de l'admin Keystatic (/keystatic).
// Chaque champ ici doit correspondre au schéma Astro de src/content.config.ts.
// Règles UX (l'étudiant ne sait pas coder) : libellés en français, une aide sous
// chaque champ, des menus déroulants dès que possible.
import { collection, config, fields, singleton } from '@keystatic/core';
import { block, wrapper } from '@keystatic/core/content-components';
import { site } from './src/data/site';

// Aide répétée sous chaque champ anglais
const aideEn = 'Facultatif. Si vide, le site affiche la version FR.';

// Champ texte anglais facultatif, avec l'aide standard (ou une aide précise)
const texteEn = (label: string, description = aideEn, multiline = false) =>
  fields.text({ label: `${label} (EN)`, description, multiline });

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
    // Barre latérale : les listes, puis les pages uniques
    navigation: {
      Collections: ['projets', 'formations', 'cours'],
      Pages: ['competences', 'parametres'],
    },
  },

  // ----- Pages uniques (un seul fichier JSON chacune, dans src/content/pages/) -----
  singletons: {
    parametres: singleton({
      label: 'Paramètres du site',
      path: 'src/content/pages/parametres',
      format: { data: 'json' },
      schema: {
        nom: fields.text({
          label: 'Prénom et nom',
          description: 'Affiché en haut à gauche, dans le pied de page et le titre des onglets.',
          validation: { isRequired: true },
        }),

        // ----- Haut de l'accueil -----
        labelFormation: fields.text({
          label: 'Formation actuelle (FR)',
          description: 'Petit texte au-dessus du grand titre. Ex. « M1 Data Science · Aix-Marseille Université ».',
        }),
        labelFormation_en: texteEn('Formation actuelle', 'Ex. « MSc Data Science, Year 1 · Aix-Marseille University ». Si vide : version FR.'),
        positionnement: fields.text({
          label: 'Positionnement (FR)',
          description:
            'Le grand titre de l’accueil : qui tu es et ce que tu fais, en une phrase. Ex. « Mathématicien de formation, je construis des modèles statistiques et de machine learning. »',
          multiline: true,
          validation: { isRequired: true },
        }),
        positionnementAccent: fields.text({
          label: 'Partie en couleur (FR)',
          description:
            'Un morceau du positionnement à mettre en bleu, recopié à l’identique. Ex. « statistiques et de machine learning ». Si vide ou introuvable : tout le titre reste en noir.',
        }),
        positionnement_en: texteEn('Positionnement', aideEn, true),
        positionnementAccent_en: texteEn('Partie en couleur', 'Un morceau du positionnement EN, recopié à l’identique. Facultatif.'),
        domainesVises: fields.array(
          fields.object({
            domaine: fields.text({ label: 'Domaine (FR)', description: 'Ex. « Assurance et risque ».', validation: { isRequired: true } }),
            domaine_en: texteEn('Domaine', 'Ex. « Insurance and risk ». Si vide : version FR.'),
          }),
          {
            label: 'Domaines visés',
            description: 'Les secteurs qui t’intéressent, affichés en pastilles sous le titre. Si la liste est vide, la ligne est masquée.',
            itemLabel: (props) => props.fields.domaine.value || 'Nouveau domaine',
          },
        ),
        langues: fields.array(
          fields.object({
            langue: fields.text({ label: 'Langue (FR)', description: 'Ex. « Anglais ».', validation: { isRequired: true } }),
            langue_en: texteEn('Langue', 'Ex. « English ». Si vide : version FR.'),
            precision: fields.text({
              label: 'Précision (FR)',
              description: 'Facultatif. Ex. « cours de M1 suivis en anglais ». Affichée après le nom de la langue.',
            }),
            precision_en: texteEn('Précision'),
            miseEnAvant: fields.checkbox({
              label: 'Mettre en avant',
              description: 'Encadrée en bleu. À réserver à une langue, ex. l’anglais puisque tes cours sont en anglais.',
              defaultValue: false,
            }),
          }),
          {
            label: 'Langues',
            description: 'Affichées en pastilles sous le titre. Si la liste est vide, la ligne est masquée.',
            itemLabel: (props) =>
              [props.fields.langue.value, props.fields.precision.value].filter(Boolean).join(' : ') || 'Nouvelle langue',
          },
        ),
        recherches: fields.array(
          fields.object({
            type: fields.select({
              label: 'Type',
              options: [
                { label: 'Stage', value: 'stage' },
                { label: 'Alternance', value: 'alternance' },
                { label: 'Emploi', value: 'emploi' },
              ],
              defaultValue: 'stage',
            }),
            debut: fields.text({ label: 'À partir de (FR)', description: 'Ex. « dès mai 2027 ».' }),
            debut_en: texteEn('À partir de', 'Ex. « from May 2027 ». Si vide : version FR.'),
            details: fields.text({
              label: 'Détails (FR)',
              description: 'Durée, rythme, lieu. Ex. « 4 mois, durée flexible · Marseille ou télétravail ».',
            }),
            details_en: texteEn('Détails'),
            afficher: fields.checkbox({
              label: 'Afficher sur le site',
              description: 'Décoche pour masquer cette recherche sans la supprimer (ex. une fois le stage trouvé).',
              defaultValue: true,
            }),
          }),
          {
            label: 'Je recherche',
            description:
              'Encadré en haut à droite de l’accueil, et phrase de la section Contact. Si aucune recherche n’est affichée, l’encadré est masqué.',
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
          description:
            'Ton CV en PDF : bouton « CV (PDF) » en haut du site. Tant qu’il n’y en a pas, le bouton est masqué. Attention : il est public, téléchargeable par tous.',
          directory: 'public/documents',
          publicPath: '/documents/',
        }),
        linkedin: fields.url({ label: 'Profil LinkedIn', description: 'Ex. https://www.linkedin.com/in/ton-profil' }),
        github: fields.url({ label: 'Profil GitHub', description: 'Ex. https://github.com/ton-pseudo' }),
      },
    }),

    competences: singleton({
      label: 'Compétences',
      path: 'src/content/pages/competences',
      format: { data: 'json' },
      schema: {
        competences: fields.array(
          fields.object({
            nom: fields.text({
              label: 'Compétence (FR)',
              description: 'Ex. « SQL », « Python · pandas », « Modèle linéaire · régularisation ».',
              validation: { isRequired: true },
            }),
            nom_en: texteEn('Compétence'),
            projets: fields.multiRelationship({
              label: 'Pratiquée dans les projets',
              description: 'Facultatif. Le projet s’affiche à droite de la compétence, avec un lien.',
              collection: 'projets',
            }),
            cours: fields.multiRelationship({
              label: 'Apprise dans les cours',
              description: 'Facultatif. Utilisé si aucun projet n’est choisi.',
              collection: 'cours',
            }),
          }),
          {
            label: 'Compétences',
            description:
              'Une ligne par compétence, dans l’ordre d’affichage (glisse les lignes pour les réordonner). Affichées à droite de la section Parcours.',
            itemLabel: (props) => props.fields.nom.value || 'Nouvelle compétence',
          },
        ),
      },
    }),
  },

  collections: {
    // ----- Projets (un fichier .mdoc par projet) -----
    projets: collection({
      label: 'Projets',
      path: 'src/content/projets/*',
      slugField: 'titre',
      format: { contentField: 'contenu' }, // métadonnées + contenu dans un seul fichier .mdoc
      entryLayout: 'content',
      columns: ['domaine', 'date'],
      schema: {
        // ----- Carte de l'accueil -----
        titre: fields.slug({
          name: {
            label: 'Titre (FR)',
            description: 'Le nom du projet, ex. « Base de données d’un cabinet de courtage en assurance ».',
            validation: { length: { min: 1 } },
          },
          slug: {
            label: 'Adresse de la page',
            description: 'Créée à partir du titre (raccourcis-la si besoin). Le projet sera visible sur /projets/<adresse>.',
          },
        }),
        domaine: fields.text({
          label: 'Domaine (FR)',
          description:
            'Le secteur ou le thème, ex. « Assurance », « Transport aérien », « Climat ». Écrit en grand sur la carte quand il n’y a pas d’image. Garde la même orthographe d’un projet à l’autre : il sert aussi au filtre.',
          validation: { isRequired: true },
        }),
        contexte: fields.text({
          label: 'Contexte (FR)',
          description: 'Une ligne au-dessus du titre. Ex. « Projet de cours · M1 · 2026 », « Projet de licence · en binôme · 2026 ».',
        }),
        date: fields.date({
          label: 'Date du projet',
          description: 'Sert à classer les projets : le plus récent est affiché en premier.',
          defaultValue: { kind: 'today' },
          validation: { isRequired: true },
        }),
        resume: fields.text({
          label: 'Résumé (FR)',
          description: 'Une ou deux phrases affichées sur la carte de l’accueil. 160 caractères maximum.',
          multiline: true,
          validation: { isRequired: true, length: { max: 160 } },
        }),
        image: fields.image({
          label: 'Image de couverture',
          description:
            'Recommandée mais facultative : capture d’un graphique, du schéma, du dashboard… Format paysage. Sans image, la carte affiche le domaine.',
          ...imagesProjets,
        }),
        outils: fields.array(fields.text({ label: 'Outil' }), {
          label: 'Outils',
          description: 'Un outil par ligne, ex. « SQL », « pandas ». Affichés en pastilles sur la carte et la page.',
          itemLabel: (props) => props.value || 'Nouvel outil',
        }),

        // ----- Haut de la page projet -----
        enBref: fields.object(
          {
            probleme: fields.text({
              label: 'Le problème',
              description: 'Ex. « Organiser les données d’un cabinet de courtage : contrats, sinistres, expertises… ».',
              multiline: true,
              validation: { isRequired: true },
            }),
            methode: fields.text({
              label: 'La méthode',
              description: 'Ex. « Modélisation Merise, schéma relationnel de 8 tables, contraintes d’intégrité testées ».',
              multiline: true,
              validation: { isRequired: true },
            }),
            resultat: fields.text({
              label: 'Le résultat',
              description: 'Ex. « Une base fiable et des requêtes qui mesurent la sinistralité par type de risque ».',
              multiline: true,
              validation: { isRequired: true },
            }),
          },
          {
            label: 'En bref (FR)',
            description: 'Trois cases en haut de la page projet, toujours affichées : une ou deux phrases chacune.',
          },
        ),

        // ----- Contenu de la page projet -----
        contenu: fields.markdoc({
          label: 'Contenu de la page projet (FR)',
          description:
            'Des titres « Titre 2 » pour les parties : Contexte, Données, Méthode, Résultats, Ce que j’ai appris. Une partie sans texte est masquée sur le site, tout comme un paragraphe resté entre [crochets].',
          options: {
            heading: [2, 3],
            image: imagesProjets,
          },
          components: blocsContenu,
        }),

        // ----- Colonne de droite de la page projet -----
        ressources: fields.array(
          fields.object({
            libelle: fields.text({
              label: 'Libellé (FR)',
              description: 'Ex. « Code sur GitHub », « Schéma de la base », « Rapport du projet ».',
              validation: { isRequired: true },
            }),
            libelle_en: texteEn('Libellé'),
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
                  description: 'Ex. un .pdf, .sql, .ipynb ou .xlsx. Il sera téléchargeable depuis la page.',
                  directory: 'public/fichiers',
                  publicPath: '/fichiers/',
                }),
              },
            ),
          }),
          {
            label: 'Ressources',
            description:
              'Liens et fichiers du projet (code, notebook, rapport…). Si la liste est vide, le bloc est masqué. ' +
              'Pour un lien GitHub, soigne le README du dépôt : c’est la première chose qu’un recruteur ouvre. ' +
              'Squelette conseillé : « # Titre du projet », « > En une phrase : le problème et le résultat principal. », ' +
              'puis les parties « ## Contexte », « ## Données », « ## Méthode », « ## Résultats », ' +
              '« ## Lancer le projet », « ## Ce que j’ai appris ».',
            itemLabel: (props) => props.fields.libelle.value || 'Nouvelle ressource',
          },
        ),
        coursOrigine: fields.relationship({
          label: 'Cours d’origine',
          description: 'Facultatif. Le cours dans lequel le projet a été fait (à créer d’abord dans « Cours »).',
          collection: 'cours',
        }),
        travail: fields.select({
          label: 'Travail',
          options: [
            { label: 'Solo', value: 'solo' },
            { label: 'Binôme', value: 'binome' },
            { label: 'Groupe', value: 'groupe' },
          ],
          defaultValue: 'solo',
        }),

        // ----- Publication -----
        brouillon: fields.checkbox({
          label: 'Brouillon (masqué du site)',
          description: 'Coché : le projet n’apparaît pas sur le site. Pense à décocher pour le publier.',
          defaultValue: false,
        }),

        // ----- Version anglaise -----
        titre_en: texteEn('Titre'),
        domaine_en: texteEn('Domaine', 'Ex. « Insurance », « Air transport ». Si vide : version FR.'),
        contexte_en: texteEn('Contexte', 'Ex. « Course project · MSc Year 1 · 2026 ». Si vide : version FR.'),
        resume_en: fields.text({
          label: 'Résumé (EN)',
          description: 'Facultatif, 160 caractères maximum. Si vide, le site affiche le résumé FR.',
          multiline: true,
          validation: { length: { max: 160 } },
        }),
        enBref_en: fields.object(
          {
            probleme: texteEn('Le problème', aideEn, true),
            methode: texteEn('La méthode', aideEn, true),
            resultat: texteEn('Le résultat', aideEn, true),
          },
          { label: 'En bref (EN)' },
        ),
        contenu_en: fields.markdoc({
          label: 'Contenu de la page projet (EN)',
          description: 'Facultatif : la traduction du contenu FR. Si vide, la page anglaise affiche le contenu FR avec un petit message.',
          options: {
            heading: [2, 3],
            image: imagesProjetsEn,
          },
          components: blocsContenu,
        }),
        traductionRelue: fields.checkbox({
          label: 'Traduction anglaise relue',
          description:
            'Coche-la quand tu as relu ou corrigé les textes EN : la traduction automatique ne les modifiera plus. Laisse-la décochée pour qu’ils soient retraduits quand tu changes le FR.',
          defaultValue: false,
        }),
      },
    }),

    // ----- Formations (un fichier JSON par diplôme) -----
    formations: collection({
      label: 'Formations',
      path: 'src/content/formations/*',
      slugField: 'intitule',
      format: { data: 'json' },
      columns: ['dates', 'ordre'],
      schema: {
        intitule: fields.slug({
          name: {
            label: 'Intitulé (FR)',
            description: 'Ex. « Master 1 Mathématiques appliquées, statistique · parcours Data Science ».',
            validation: { length: { min: 1 } },
          },
          slug: {
            label: 'Identifiant',
            description: 'Créé à partir de l’intitulé, sert seulement à relier les cours. Ex. « master-1-data-science ».',
          },
        }),
        intitule_en: texteEn('Intitulé'),
        etablissement: fields.text({
          label: 'Établissement (FR)',
          description: 'Ex. « Aix-Marseille Université ».',
          validation: { isRequired: true },
        }),
        etablissement_en: texteEn('Établissement', 'Ex. « Aix-Marseille University ». Si vide : version FR.'),
        dates: fields.text({
          label: 'Dates',
          description: 'Ex. « 2026 – 2027 » ou « 2026 ».',
          validation: { isRequired: true },
        }),
        niveau: fields.text({
          label: 'Niveau (FR)',
          description:
            'Facultatif. Un nom court, ex. « M1 » ou « L3 ». Sert dans la liste des compétences : « Cours de M1 ». Si vide, le nom du cours est affiché.',
        }),
        niveau_en: texteEn('Niveau', 'Ex. « MSc Year 1 ». Si vide : version FR.'),
        ordre: fields.integer({
          label: 'Ordre',
          description: 'Position dans la section Parcours : 1 pour la plus récente (affichée en premier), puis 2…',
          validation: { isRequired: true, min: 1 },
        }),
      },
    }),

    // ----- Cours (un fichier JSON par cours, rattaché à une formation) -----
    cours: collection({
      label: 'Cours',
      path: 'src/content/cours/*',
      slugField: 'nom',
      format: { data: 'json' },
      columns: ['formation', 'ordre'],
      schema: {
        nom: fields.slug({
          name: {
            label: 'Nom du cours (FR)',
            description: 'Ex. « Modèle linéaire ».',
            validation: { length: { min: 1 } },
          },
          slug: {
            label: 'Identifiant',
            description: 'Créé à partir du nom, sert à relier le cours aux projets et aux compétences.',
          },
        }),
        nom_en: texteEn('Nom du cours'),
        formation: fields.relationship({
          label: 'Formation',
          description: 'Le diplôme auquel appartient ce cours.',
          collection: 'formations',
          validation: { isRequired: true },
        }),
        notions: fields.text({
          label: 'Notions clés (FR)',
          description: 'Quelques mots séparés par des virgules. Ex. « Inférence, régularisation (ridge, Lasso), validation croisée ». Facultatif.',
        }),
        notions_en: texteEn('Notions clés'),
        langue: fields.select({
          label: 'Langue du cours',
          description: 'Un cours en anglais est signalé en bleu : c’est un atout.',
          options: [
            { label: 'Français', value: 'fr' },
            { label: 'Anglais', value: 'en' },
          ],
          defaultValue: 'fr',
        }),
        classement: fields.text({
          label: 'Classement (FR)',
          description: 'Facultatif. Ex. « 4e sur 67 (17,35/20) ». Affiché « Classement : 4e sur 67 (17,35/20) ».',
        }),
        classement_en: texteEn('Classement', 'Ex. « 4th out of 67 (17.35/20) ». Si vide : version FR.'),
        ordre: fields.integer({
          label: 'Ordre',
          description: 'Position du cours dans la liste de sa formation : 1, 2, 3…',
          validation: { isRequired: true, min: 1 },
        }),
      },
    }),
  },
});
