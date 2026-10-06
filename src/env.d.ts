// Types des variables d'environnement (valeurs dans .env en local, dans Vercel en ligne).
// Voir .env.example pour la liste et leur rôle.
interface ImportMetaEnv {
  readonly PUBLIC_WEB3FORMS_KEY?: string;
  readonly PUBLIC_KEYSTATIC_STORAGE?: 'github' | 'local';
  readonly PUBLIC_KEYSTATIC_GITHUB_APP_SLUG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
