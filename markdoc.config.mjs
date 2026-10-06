// Balises Markdoc sur mesure, utilisables dans le contenu des projets (.mdoc).
// Chaque balise est affichée par un composant Astro de src/components/markdoc/.
import { component, defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  nodes: {
    // Par défaut Markdoc enveloppe le contenu dans un <article> :
    // la page projet en a déjà un, on retire celui-ci.
    document: { ...nodes.document, render: null },
  },

  tags: {
    // Carte "requête" : question en en-tête, code SQL, résultat en pied.
    //   {% requete question="Quels clients habitent à Marseille ?" tags="SELECT · WHERE" resultat="..." %}
    //   ```sql
    //   SELECT ...
    //   ```
    //   {% /requete %}
    requete: {
      render: component('./src/components/markdoc/Requete.astro'),
      attributes: {
        question: { type: String, required: true },
        tags: { type: String }, // mots-clés SQL affichés à droite
        resultat: { type: String }, // texte sous le code
      },
    },

    // Grille de tables SQL, avec une légende optionnelle en dessous.
    //   {% tables legende="PK = clé primaire, FK = clé étrangère." %}
    //   {% table-sql nom="clients" colonnes=["PK id INT", "nom VARCHAR"] /%}
    //   {% /tables %}
    tables: {
      render: component('./src/components/markdoc/Tables.astro'),
      attributes: {
        legende: { type: String },
      },
    },

    // Une table : nom + colonnes au format "[PK|FK] nom TYPE"
    'table-sql': {
      render: component('./src/components/markdoc/TableSql.astro'),
      selfClosing: true,
      attributes: {
        nom: { type: String, required: true },
        colonnes: { type: Array, required: true },
      },
    },
  },
});
