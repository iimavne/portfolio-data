# Portfolio data science : contexte du projet

## Le projet
Portfolio personnel d'un étudiant en **M1 Économétrie et data science** à Aix-Marseille Université (AMSE, Marseille, cours en anglais).
Il débute : pour l'instant un dashboard Excel, un script Python (jointures et contrôles), puis un projet SQL en cours (modélisation de tables et requêtes). Le machine learning viendra plus tard.

**Rôles :**
- Je (la développeuse) code tout le site.
- L'étudiant **ne sait pas coder**. Il doit seulement pouvoir ajouter et modifier ses projets via l'admin Keystatic, sans jamais toucher au code.

## Stack
- **Astro** (TypeScript), site statique
- **Keystatic** pour l'admin (`/keystatic`) : mode `local` en développement, mode `github` en production
- Contenu en **content collections** Markdown/Markdoc dans `src/content/`
- Déploiement **Vercel** depuis la branche `main` : https://portfolio-data-tawny.vercel.app/
- Repo GitHub **pour l'instant sur mon compte** (`iimavne/portfolio-data`). Il sera transféré sur le compte de l'étudiant en fin de projet (voir « Transfert du dépôt » plus bas), moi en collaboratrice.

## Design (thème sombre)
Variables CSS globales dans `src/styles/` :
- Fond `#0D0F12`, cartes `#15181D`, bordures `#262A31`
- Texte `#ECEAE4`, texte secondaire `#B8BDC4`, texte discret `#8A9099`
- Accent vert citron `#C8F169` (variable `--accent`, texte foncé `#0D0F12` posé dessus)
- Typos Google Fonts : **Bricolage Grotesque** (titres), **DM Sans** (texte), **JetBrains Mono** (labels, code)
- Coins arrondis (cartes 16 à 18px, boutons en pilule), petits labels mono du type `// 01` au-dessus des titres de section
- Responsive mobile obligatoire, contrastes accessibles, vrais `<button>` et `<a>`

## Pages
1. **Accueil** `/`
   - Hero : badge "M1 Économétrie et data science · AMU Marseille", titre "J'apprends à faire parler les données.", 2 boutons, carte de code SQL décorative
   - **Progression** : roadmap en 6 étapes (Excel, Python, SQL, Statistiques, Économétrie, Machine learning), chacune avec un statut terminé / en cours / à venir et une barre de progression
   - **Projets** : grille de cartes filtrable par catégorie (filtre en JS léger), plus une carte en pointillés "Bientôt"
   - **Boîte à outils** : 3 groupes, "Utilisé en projet", "En apprentissage", "Au programme"
   - **À propos** + formation
   - **Contact** : email, GitHub, LinkedIn, Kaggle
2. **Page projet** `/projets/[slug]`
   - En-tête (catégorie, statut, titre, résumé, boutons de liens), métadonnées (cours, période, outils, solo ou binôme), sommaire, puis contenu libre (texte, images, blocs de code SQL, tableaux), lien vers le projet suivant ou précédent
3. **Admin** `/keystatic` (géré par Keystatic)

## Collection "projets" (schéma Keystatic + Astro)
Champs : `titre`, `slug` (généré depuis le titre), `resume` (160 caractères max), `categorie` (liste : Excel, Python, SQL, Statistiques, Économétrie, Machine learning), `statut` (en cours / terminé), `cours` (nom de l'UE), `periode`, `outils` (liste), `travail` (solo / binôme), `image` (couverture), `lienGithub`, `fichier` (optionnel), `ordre` ou `date`, `miseEnAvant` (booléen), `contenu` (éditeur riche avec images, code, tableaux).

**Règles UX pour l'admin (l'étudiant ne sait pas coder) :**
- Libellés en français et une description d'aide sous chaque champ
- Menus déroulants plutôt que texte libre dès que possible
- Champs obligatoires : titre, résumé, catégorie, statut, image
- Un projet modèle déjà rempli qu'il peut dupliquer

## Multilingue
FR d'abord. EN ensuite : bouton FR/EN dans la nav, textes de l'interface traduits, champs `titre_en` / `resume_en` / `contenu_en` optionnels (si vides, on affiche la version FR). Structurer le code dès le départ pour faciliter l'ajout.

## Workflow Git
- Toujours `git pull` avant de coder : l'étudiant pousse du contenu via Keystatic.
- Ne pas modifier à la main les fichiers de `src/content/` (projets, étapes, pages) : ils sont gérés par Keystatic.
- Grosses modifications sur une branche, puis merge dans `main`.

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
   - si le domaine change : ajouter `https://<nouveau-domaine>/api/keystatic/github/oauth/callback` dans les « Callback URLs » de la GitHub App.
4. **En local** : mettre à jour `.env` si nouvelle app, et `git remote set-url origin https://github.com/<pseudo-etudiant>/portfolio-data.git`.
5. **Accès** : l'étudiant m'ajoute en collaboratrice ; vérifier qu'il se connecte à `/keystatic` en ligne et qu'un enregistrement crée bien un commit.

## Ordre de développement
1. [x] Projet Astro créé + poussé sur GitHub
2. [x] Styles globaux + layout (nav, footer)
3. [x] Accueil en statique d'après la maquette
4. [x] Collection "projets" + page `/projets/[slug]` + 3 projets d'exemple
5. [x] Déploiement Vercel
6. [ ] Keystatic (local puis GitHub) : mode local fait, mode GitHub à faire
7. [ ] FR / EN
8. [ ] Test avec l'étudiant + mémo d'utilisation

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
