// Balises Markdoc sur mesure, utilisables dans le contenu des projets (.mdoc).
// Chaque balise est affichée par un composant Astro de src/components/markdoc/.
import { component, defineMarkdocConfig, nodes } from '@astrojs/markdoc/config';

// ----- Nettoyage du contenu avant affichage -----
// Règle du site : rien d'entre crochets ni de vide n'est visible.
// - un paragraphe (ou un élément de liste) entièrement entre crochets est retiré :
//   c'est une aide de l'admin pas encore remplacée, ex. « [Ce que j'ai appris…] » ;
// - un titre sans contenu jusqu'au titre suivant est retiré : la section est facultative.

const entreCrochets = (texte) => /^\[[^\]]*\]$/.test(texte.trim());

// Texte d'un bloc s'il ne contient que du texte (gras, italique compris), sinon null :
// une image, un lien, du code ou une balise comptent comme du vrai contenu.
const typesTexte = ['inline', 'paragraph', 'text', 'strong', 'em', 's', 'softbreak', 'hardbreak'];
function texteSeul(node) {
  let texte = '';
  for (const enfant of node.walk()) {
    if (!typesTexte.includes(enfant.type)) return null;
    if (enfant.type === 'text') texte += enfant.attributes.content;
  }
  return texte;
}
const aRetirer = (node) => {
  const texte = texteSeul(node);
  return texte !== null && entreCrochets(texte);
};

// L'image d'un paragraphe qui ne contient qu'elle, sinon null
function imageSeule(paragraphe) {
  const contenu = [...paragraphe.walk()].filter((n) => n.type !== 'inline');
  return contenu.length === 1 && contenu[0].type === 'image' ? contenu[0] : null;
}

function nettoyer(blocs) {
  // 1. Paragraphes et éléments de liste entièrement entre crochets. Au passage, une image
  //    seule dans son paragraphe en sort (une <figure> ne peut pas être dans un <p>).
  const sansCrochets = blocs.flatMap((node) => {
    if (node.type === 'paragraph') {
      const image = imageSeule(node);
      if (image) return [image];
      return aRetirer(node) ? [] : [node];
    }
    if (node.type === 'list') {
      node.children = node.children.filter((item) => !aRetirer(item));
      return node.children.length > 0 ? [node] : [];
    }
    return [node];
  });

  // 2. Titres vides : on parcourt à l'envers, en gardant les blocs déjà retenus.
  //    Un titre est gardé s'il y a au moins un bloc (autre qu'un titre) avant le
  //    prochain titre de même niveau ou de niveau supérieur.
  const gardes = [];
  for (const node of sansCrochets.reverse()) {
    if (node.type === 'heading') {
      const niveau = node.attributes.level;
      const fin = gardes.findIndex((n) => n.type === 'heading' && n.attributes.level <= niveau);
      const section = fin === -1 ? gardes : gardes.slice(0, fin);
      if (!section.some((n) => n.type !== 'heading')) continue;
    }
    gardes.unshift(node);
  }
  return gardes;
}

export default defineMarkdocConfig({
  nodes: {
    // Par défaut Markdoc enveloppe le contenu dans un <article> : la page projet en a
    // déjà un, on retire celui-ci (render: null). On nettoie le contenu au passage.
    document: {
      ...nodes.document,
      render: null,
      transform(node, config) {
        node.children = nettoyer(node.children);
        return node.transformChildren(config);
      },
    },

    // Image avec légende : le "titre" de l'image (champ Title dans l'admin) devient
    // la légende affichée dessous. Les images restent optimisées par Astro.
    image: {
      ...nodes.image,
      render: component('./src/components/markdoc/Figure.astro'),
    },
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
