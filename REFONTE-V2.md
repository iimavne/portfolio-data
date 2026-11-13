# Refonte v2 du portfolio : cahier des charges

Ce document décrit la nouvelle version du site. Il remplace les sections "Design" et "Pages" du CLAUDE.md pour tout ce qui est contradictoire.
Maquettes de référence : `docs/maquettes/Accueil v4.png` et `docs/maquettes/Page projet v2.png`.
(`docs/maquettes/Admin ajouter un projet.png` date de la v1 : elle n'est plus une référence.)

## Principe directeur

C'est un **portfolio**, pas un CV : on montre ce que Badr a réalisé et appris.
Un recruteur doit comprendre en 30 secondes : qui il est, ce qu'il cherche et quand, et ce qu'il sait faire (preuve : les projets).
Tout le reste est du détail consultable (dépliable), jamais imposé à l'œil.

Règles :
- Aucun texte entre crochets ou champ vide ne s'affiche sur le site public : un champ vide masque son bloc.
- Aucune donnée personnelle (email, téléphone, adresse) dans le dépôt.

## Ce qu'on supprime

- La section Progression (roadmap) et la barre de progression.
- La section Boîte à outils séparée (remplacée par Compétences dans Parcours).
- La section À propos séparée.
- La carte "Bientôt / Prochain projet".
- La carte de code SQL décorative du hero.
- Les statuts "Terminé / En cours" et la numérotation des projets.
- Les labels `// 01`, `// 02` au-dessus des titres.

## Design

**Thème clair par défaut.** Le thème sombre reste disponible en option (préférence système), mais la référence est le clair.

| Token | Clair | Sombre |
|---|---|---|
| `--bg` | `#F6F5F1` | `#0E1013` |
| `--surface` | `#FFFFFF` | `#16191E` |
| `--surface-2` | `#EFEDE7` | `#1C2026` |
| `--border` | `#E2DFD7` | `#2A2E35` |
| `--text` | `#15171B` | `#ECEAE4` |
| `--text-2` | `#454A52` | `#B8BDC4` |
| `--muted` | `#62676F` | `#959BA3` |
| `--accent` | `#1D4ED8` (bleu encre) | `#8AB4FF` |
| `--on-accent` | `#FFFFFF` | `#0E1013` |

- Typos inchangées : Bricolage Grotesque (titres), DM Sans (texte), JetBrains Mono (petits labels, code).
- **Un seul accent, utilisé avec parcimonie** : boutons principaux, liens, recherches actives, tag EN des cours.
- **Hiérarchie** : seul le titre du hero est grand (environ 3.75rem max). Les titres de section font environ 30px.
- Espacements verticaux réduits par rapport à la v1, pas de grands vides.
- Contrastes AA partout, responsive mobile, vrais `<button>` et `<a>`.

## Accueil (4 sections)

### 1. Hero
- Petit label : formation actuelle (ex. "M1 Data Science · Aix-Marseille Université").
- **Positionnement** en titre principal (phrase modifiable dans l'admin), avec une partie en couleur d'accent.
- Ligne "Domaines visés" : pastilles (liste modifiable).
- Ligne "Langues" : pastilles. Une langue peut être "mise en avant" (bordure + fond accent léger), utilisé pour l'anglais avec sa précision ("cours de M1 suivis en anglais").
- Boutons : Voir les projets / Me contacter. Bouton CV (PDF) dans la nav, masqué si aucun CV.
- À droite : encadré **"Je recherche"** qui liste toutes les recherches actives (voir Paramètres). Masqué si aucune recherche active.

### 2. Projets
- Titre "Projets" + sous-titre court.
- Cartes **toutes au même niveau**, triées par date (plus récent en premier). Pas de projet mis en avant.
- Contenu d'une carte : zone haute (image de couverture si fournie, sinon fond `--surface-2` avec le **domaine** écrit en grand), contexte (ex. "Projet de cours · M1 · 2026"), titre, résumé, outils, lien "Voir le projet".
- **Filtres par domaine seulement s'il y a plus de 6 projets.**

### 3. Parcours
- Gauche : les formations, une carte chacune (dates, intitulé, établissement).
  - Bouton "Voir les cours (N)" qui déplie la liste des cours (accessible : `aria-expanded`). Fonctionne sans framework, petit script ou `<details>`.
  - Chaque cours : nom, notions clés, tag de langue **FR** ou **EN** (EN en couleur d'accent), classement optionnel (ex. "Classement : 4e sur 67").
- Droite : **Compétences**, une ligne par compétence. Optionnel : "pratiqué dans" (lien vers un projet ou un cours). Si rien n'est renseigné, la compétence s'affiche seule.

### 4. Contact
- Titre "Contact", texte qui s'adapte aux recherches actives (ex. "Un stage ou une alternance en data science à proposer ?"), liens LinkedIn / GitHub, formulaire Web3Forms existant à côté.
- Footer : copyright + lien **Mentions légales**.

## Page projet

1. En-tête : retour "Tous les projets", nom, bouton EN.
2. Domaine (pastille) + contexte, puis titre.
3. **En bref** : bandeau en 3 colonnes, toujours affiché : Le problème / La méthode / Le résultat (1 à 2 phrases chacune).
4. Colonne principale, **sections facultatives** (masquées si vides) : Contexte, Données, Méthode, Résultats, Ce que j'ai appris. Contenu riche (texte, images avec légende, blocs de code, tableaux, blocs SQL existants).
5. Colonne latérale :
   - **Ressources** : liste libre de liens et fichiers (libellé + type : GitHub, notebook, PDF, rapport, script...). Masquée si vide.
   - Cours d'origine (lien vers le cours dans Parcours), type de travail (solo / binôme / groupe), outils.
6. Lien vers le projet suivant.
7. Visuel **recommandé mais pas obligatoire** : sans image, rien de cassé ni de placeholder visible.

## Page Mentions légales

Page `/mentions-legales` (FR et EN) : éditeur du site (nom de Badr, sans adresse ni téléphone, contact via le formulaire), hébergeur (Vercel Inc., adresse officielle de Vercel), absence de cookies (Vercel Analytics sans cookies si activé).

## Contenu Keystatic (ce que Badr modifie sans code)

### Paramètres du site (singleton)
- `nom`
- `labelFormation` (ex. "M1 Data Science · Aix-Marseille Université")
- `positionnement` (texte) + `positionnementAccent` (la partie à colorer)
- `domainesVises` : liste de textes
- `langues` : liste { langue, precision (optionnel), miseEnAvant (booléen) }
- `recherches` : liste { type (Stage / Alternance / Emploi), debut, details (durée, rythme, lieu), afficher (booléen) }
- `cv` (fichier PDF), `linkedin`, `github`

### Projets (collection)
- `titre`, `domaine`, `contexte`, `date`, `resume` (160 caractères max)
- `enBref` : { probleme, methode, resultat }
- `contenu` : éditeur riche (sections avec titres)
- `ressources` : liste { libelle, type (GitHub / Notebook / PDF / Rapport / Script / Autre), lien ou fichier }
- `coursOrigine` : relation optionnelle vers un cours
- `travail` (solo / binôme / groupe), `outils` (liste), `image` (optionnelle), `brouillon`
- Champs EN : `titre_en`, `resume_en`, `enBref_en`, `contenu_en` + case `traductionRelue`

### Formations (collection, triées par champ `ordre`)
- `dates`, `intitule`, `etablissement`
- `cours` : liste { nom, notions, langue (FR / EN), classement (optionnel) }
- Champs EN équivalents

### Compétences (collection ou liste dans un singleton)
- `nom`, `pratiqueDans` : liste optionnelle de relations vers des projets ou des cours

### Aide dans l'admin
Sur le formulaire Projet, une description d'aide rappelle de soigner le README du dépôt GitHub, avec ce squelette :

```md
# Titre du projet
> En une phrase : le problème et le résultat principal.
## Contexte
## Données
## Méthode
## Résultats
## Lancer le projet
## Ce que j'ai appris
```

## Traduction automatique FR → EN

- Une **GitHub Action** se déclenche à chaque push sur `main` touchant `src/content/`.
- Elle traduit les champs FR vers les champs EN **seulement si** le champ EN est vide **ou** si `traductionRelue` est décoché et que le texte FR a changé.
- Moteur principal : **Google Gemini**, offre gratuite (clé dans le secret GitHub `GEMINI_API_KEY`, modèle dans la variable `MODELE` du workflow). Consigne : portfolio data science, ton professionnel, respecter le glossaire, ne jamais traduire le code. *(Prévu au départ : GitHub Models, fermé le 30 juillet 2026.)*
- Moteur de secours si Gemini échoue (quota, erreur) : **Argos Translate** en local dans l'Action (installation mise en cache).
- **Glossaire** : fichier `src/i18n/glossaire.json` (ex. "sinistralité" → "loss ratio", "TCD" → "pivot table", "Merise" inchangé).
- Les blocs de code ne sont jamais envoyés à la traduction.
- L'Action commit le résultat avec un message clair. Éviter les boucles : ne pas se redéclencher sur ses propres commits.
- Dès que Badr modifie un texte EN dans l'admin, `traductionRelue` passe à vrai et l'Action ne l'écrase plus.

## Migration

- Reprendre les 3 projets existants avec les vraies infos du CV : base de données assurance (Assurance), retards des vols à New York (Transport aérien), modèle climatique (Climat, projet de licence en binôme).
- Créer les 2 formations et leurs cours (M1 et licence MApI3).
- Supprimer les anciens contenus devenus inutiles (étapes, boîte à outils, À propos).
- Mettre à jour le CLAUDE.md pour refléter cette v2.
