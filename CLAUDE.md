# Portfolio data science : contexte du projet

## Le projet
Portfolio personnel d'un étudiant en **M1 du Master Mathématiques appliquées, statistique, parcours Data science**, à la Faculté des sciences d'Aix-Marseille Université (Marseille, une partie des cours en anglais), après une licence de mathématiques (parcours MApI3, Université de Toulouse).
C'est un **portfolio, pas un CV** : un recruteur doit comprendre en 30 secondes qui il est, ce qu'il cherche et quand, et ce qu'il sait faire (preuve : les projets).
Cahier des charges de la v2 : `REFONTE-V2.md` ; maquettes de référence : `docs/maquettes/Accueil v4.png` et `docs/maquettes/Page projet v2.png`.

**Rôles :**
- Je (la développeuse) code tout le site.
- L'étudiant **ne sait pas coder**. Il doit seulement pouvoir ajouter et modifier son contenu via l'admin Keystatic, sans jamais toucher au code.

## Stack
- **Astro** (TypeScript), site statique ; adaptateur Vercel (seules les routes de Keystatic sont des fonctions serveur), **Vercel Web Analytics** activé (sans cookie)
- **Keystatic** pour l'admin (`/keystatic`) : mode `local` en développement, mode `github` en production
- Contenu en **content collections** (Markdoc `.mdoc` et JSON) dans `src/content/`
- Déploiement **Vercel** depuis la branche `main` : https://portfolio-data-tawny.vercel.app/
- **Traduction automatique FR → EN** par une GitHub Action (voir plus bas)
- Repo GitHub **pour l'instant sur mon compte** (`iimavne/portfolio-data`). Il sera transféré sur le compte de l'étudiant en fin de projet (voir « Transfert du dépôt » plus bas), moi en collaboratrice.

## Design (thème clair, sombre selon le système)
Variables CSS dans `src/styles/global.css` (le sombre s'applique avec `prefers-color-scheme: dark`, sans bouton) :

| Token | Clair | Sombre |
|---|---|---|
| `--bg` | `#F6F5F1` | `#0E1013` |
| `--surface` | `#FFFFFF` | `#16191E` |
| `--surface-2` | `#EFEDE7` | `#1C2026` |
| `--border` | `#E2DFD7` | `#2A2E35` |
| `--text` / `--text-2` / `--muted` | `#15171B` / `#454A52` / `#62676F` | `#ECEAE4` / `#B8BDC4` / `#959BA3` |
| `--accent` / `--on-accent` | `#1D4ED8` (bleu encre) / `#FFFFFF` | `#8AB4FF` / `#0E1013` |

- Dérivées calculées : `--accent-hover`, `--accent-soft` (fond léger), `--danger`.
- Typos Google Fonts : **Bricolage Grotesque** (titres), **DM Sans** (texte), **JetBrains Mono** (petits labels, code).
- **Un seul accent, avec parcimonie** : boutons principaux, liens, recherches, tag EN des cours.
- Hiérarchie : seul le titre du hero est grand (`--fs-display`, 3.75rem max), titres de section ~30px (`--fs-section`). Pas de labels `// 01`.
- Responsive mobile obligatoire (vérifié à 390px), contrastes AA, vrais `<button>` et `<a>`.

## Pages
1. **Accueil** `/` et `/en/` (4 sections, `src/components/home/`)
   - **Hero** : label de la formation, positionnement (une partie en couleur), lignes « Domaines visés » et « Langues » en pastilles (une langue peut être mise en avant), boutons Voir les projets / Me contacter ; à droite, encadré **« Je recherche »** (recherches cochées « Afficher », masqué sinon). Bouton **CV (PDF)** dans la nav, masqué sans CV.
   - **Projets** : cartes au même niveau, du plus récent au plus ancien (couverture, sinon le domaine écrit en grand ; contexte, titre, résumé, outils). **Filtres par domaine seulement au-delà de 6 projets.**
   - **Parcours** : formations (cours dépliables en `<details>`, tag FR/EN, classement) ; à droite, **Compétences** avec « pratiquée dans » (lien vers un projet ou un cours). Un lien `/#cours-<id>` déplie la bonne liste.
   - **Contact** : phrase construite d'après les recherches affichées, LinkedIn / GitHub, formulaire Web3Forms (aucune adresse affichée).
2. **Page projet** `/projets/<slug>` et `/en/projects/<slug>` : domaine + contexte, titre, bandeau **En bref** (problème / méthode / résultat), contenu à gauche, colonne **Ressources** + cours d'origine + travail + outils à droite, puis **Projet suivant** (après le dernier : le premier).
3. **Mentions légales** `/mentions-legales` et `/en/legal-notice` (éditeur, hébergeur Vercel, cookies et Analytics, formulaire, polices). Lien dans le pied de page.
4. **Admin** `/keystatic` (géré par Keystatic).

**Règle d'affichage** : un champ vide ou entièrement entre crochets (`[texte d'aide]`) n'est jamais affiché, son bloc est masqué (`src/lib/texte.ts`). Dans le contenu des projets, `markdoc.config.mjs` retire les paragraphes entre crochets et les titres de section restés sans texte.

## Contenu (schéma Astro `src/content.config.ts` = config Keystatic `keystatic.config.tsx`)
Convention : chaque texte a sa version anglaise facultative `xxx_en` ; si elle est vide, le site affiche le français.
- **Paramètres du site** (singleton, `src/content/pages/parametres.json`) : `nom`, `labelFormation`, `positionnement` + `positionnementAccent`, `domainesVises`, `langues` {langue, precision, miseEnAvant}, `recherches` {type stage/alternance/emploi, debut, details, afficher}, `cv`, `linkedin`, `github`.
- **Projets** (`src/content/projets/*.mdoc`) : `titre`, `domaine`, `contexte`, `date`, `resume` (160 car. max), `enBref` {probleme, methode, resultat}, `image` (facultative), `outils`, `contenu` (sections Contexte / Données / Méthode / Résultats / Ce que j'ai appris, blocs SQL, images avec légende), `ressources` {libelle, type, lien ou fichier}, `coursOrigine` (relation vers un cours), `travail` (solo / binôme / groupe), `brouillon`, + `contenu_en` (fichier `<projet>/contenu_en.mdoc`) et `traductionRelue`. Un **projet modèle** en brouillon est à dupliquer.
- **Formations** (`src/content/formations/*.json`) : `intitule`, `etablissement`, `dates`, `niveau` (nom court, ex. « M1 »), `ordre`.
- **Cours** (`src/content/cours/*.json`) : `nom`, `formation` (relation), `notions`, `langue` (fr/en), `classement`, `ordre`.
- **Compétences** (singleton, `src/content/pages/competences.json`) : `nom`, `projets` et `cours` (relations).
- Listes partagées site/admin : `src/data/projets.ts` ; lecture des données : `src/data/site.ts`, `src/lib/projets.ts`, `src/lib/parcours.ts`.

**Règles UX pour l'admin (l'étudiant ne sait pas coder) :** libellés en français et une aide sous chaque champ, menus déroulants dès que possible, aide README sous « Ressources » d'un projet.

## Multilingue
- Textes de l'interface : `src/i18n/ui.ts` (`t('cle')`, FR puis EN).
- Adresses traduites : `cheminTraduit()` dans `ui.ts` (`/projets/…` ↔ `/en/projects/…`, `/mentions-legales` ↔ `/en/legal-notice`) ; le bouton de langue (rond « EN » / « FR ») relie chaque page à son équivalent.
- **Traduction automatique** : `.github/workflows/traduction.yml` + `scripts/traduction/traduire.mjs`.
  - Se lance à chaque push sur `main` qui touche `src/content/` (une sauvegarde dans l'admin), ou à la main (Actions > Run workflow, option « tout retraduire »).
  - Moteur : **Google Gemini**, modèle dans la variable `MODELE` en haut du workflow (`gemini-3.5-flash-lite`), clé dans le secret GitHub **`GEMINI_API_KEY`** (jamais dans le code). Secours : **Argos Translate**, installé et mis en cache dans l'Action seulement si besoin. (GitHub Models, prévu au départ, a été fermé le 30 juillet 2026.)
  - Glossaire : `src/i18n/glossaire.json`. Le code et les balises Markdoc ne sont jamais traduits.
  - Mémoire : `src/i18n/traductions.json` (empreintes). Un texte EN écrit ou retouché par l'étudiant n'est jamais écrasé et son projet passe en « traduction relue ».
  - Échec : rien n'est commité, le résumé de l'exécution liste ce qui n'est pas traduit. Pas de boucle (les commits de l'Action ne relancent rien).
  - Test en local : `$env:GEMINI_API_KEY = Read-Host "Clé Gemini"`, puis `node scripts/traduction/traduire.mjs preparer` et `appliquer` (`preparer --essai` pour voir sans rien envoyer).

## Workflow Git
- Toujours `git pull` avant de coder : l'étudiant pousse du contenu via Keystatic, et l'Action de traduction y ajoute ses commits.
- Ne pas modifier à la main les fichiers de `src/content/` : ils sont gérés par Keystatic (et par l'Action pour les champs `_en`).
- Grosses modifications sur une branche, puis merge dans `main`.
- **Aucune donnée personnelle dans le dépôt** (email, téléphone…) : ni dans le code, ni dans `src/content/`. Le contact passe par le formulaire Web3Forms. Les clés et adresses vont dans `.env` (jamais commité), dans les variables Vercel et les secrets GitHub ; la liste est dans `.env.example`. Seule exception acceptée : le CV publié dans `public/documents/`. Le CV source dans `docs/` est ignoré par Git.

## Transfert du dépôt vers le compte de l'étudiant (fin de projet)
État actuel : dépôt `iimavne/portfolio-data`, GitHub App Keystatic créée sur le compte `iimavne`, projet Vercel relié à ce dépôt.
Après le transfert (GitHub > Settings du dépôt > Danger Zone > Transfer ownership), modifier :

1. **Config Keystatic** : dans `keystatic.config.tsx`, `storage.repo` → `<pseudo-etudiant>/portfolio-data`.
2. **GitHub App** (elle appartient à mon compte) — au choix :
   - la transférer : GitHub > Settings > Developer settings > GitHub Apps > l'app > Advanced > Transfer ownership, vers le compte de l'étudiant ;
   - ou en recréer une depuis son compte (flux `/keystatic/setup`, voir les étapes du mode GitHub) : cela donne de nouvelles valeurs `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` (`KEYSTATIC_SECRET` peut rester).
   Dans les deux cas : l'installer sur le dépôt transféré (page de l'app > Install App > Only select repositories > `portfolio-data`).
3. **Vercel** :
   - reconnecter le projet au dépôt transféré (Settings > Git > Connected Git Repository), ou transférer le projet Vercel sur le compte de l'étudiant ;
   - si nouvelle GitHub App : mettre à jour les 4 variables d'environnement (Settings > Environment Variables), puis **redéployer** (la variable `PUBLIC_…` est lue au build) ;
   - si nouveau projet Vercel : réactiver **Analytics** (onglet Analytics > Enable) ;
   - si le domaine change : ajouter `https://<nouveau-domaine>/api/keystatic/github/oauth/callback` dans les « Callback URLs » de la GitHub App, et changer `site` dans `astro.config.mjs` (adresses des versions FR/EN pour Google).
4. **En local** : mettre à jour `.env` si nouvelle app, et `git remote set-url origin https://github.com/<pseudo-etudiant>/portfolio-data.git`.
5. **Formulaire de contact (Web3Forms)** : la clé appartient déjà à l'étudiant (créée avec son email), rien à changer. Si le domaine du site change, mettre à jour « Website URL » dans les réglages du formulaire sur web3forms.com, et recopier `PUBLIC_WEB3FORMS_KEY` dans le nouveau projet Vercel s'il y en a un (variable normale, pas « Sensitive »), puis redéployer.
6. **Traduction automatique** : vérifier que le secret `GEMINI_API_KEY` existe dans le dépôt transféré (Settings > Secrets and variables > Actions), sinon le recréer (idéalement avec une clé Gemini créée par l'étudiant), et que les Actions sont autorisées à écrire (Settings > Actions > General > Workflow permissions). Lancer la traduction à la main une fois pour vérifier.
7. **Accès** : l'étudiant m'ajoute en collaboratrice ; vérifier qu'il se connecte à `/keystatic` en ligne et qu'un enregistrement crée bien un commit (suivi d'un commit de traduction).

## Ordre de développement
1. [x] Projet Astro créé + poussé sur GitHub
2. [x] Styles globaux + layout (nav, footer)
3. [x] Accueil en statique d'après la maquette
4. [x] Collection "projets" + page `/projets/[slug]` + 3 projets d'exemple
5. [x] Déploiement Vercel
6. [x] Keystatic (local puis GitHub)
7. [x] FR / EN
8. [x] Refonte v2 (`REFONTE-V2.md`) : thème clair, accueil en 4 sections, page projet, nouveau modèle de contenu migré depuis le CV, mentions légales, Analytics
9. [x] Traduction automatique FR → EN (GitHub Action, Gemini, secours Argos)
10. [ ] Test avec l'étudiant + mémo d'utilisation de l'admin

## Consignes pour Claude
- Explique chaque étape avant de l'exécuter : je veux comprendre ce que je fais.
- Garde le code simple et commenté, sans dépendances inutiles.
- Coche les étapes ci-dessus au fur et à mesure.

## Astro : serveur de développement

Lancer le serveur en arrière-plan :

```
astro dev --background
```

Le gérer avec `astro dev stop`, `astro dev status` et `astro dev logs`.

Documentation : https://docs.astro.build ([routing](https://docs.astro.build/en/guides/routing/), [composants](https://docs.astro.build/en/basics/astro-components/), [content collections](https://docs.astro.build/en/guides/content-collections/), [styles](https://docs.astro.build/en/guides/styling/), [i18n](https://docs.astro.build/en/guides/internationalization/)).
