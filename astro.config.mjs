// @ts-check
import { defineConfig } from 'astro/config';

import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Adresse du site en ligne : sert aux liens complets (versions FR/EN pour Google).
  // ⚠️ À changer si le domaine change (voir « Transfert du dépôt » dans CLAUDE.md).
  site: 'https://portfolio-data-tawny.vercel.app',

  // Keystatic ajoute l'admin /keystatic et son API /api/keystatic.
  // Le mode (local ou GitHub) se choisit dans keystatic.config.tsx.
  integrations: [markdoc(), react(), keystatic()],

  // Adaptateur Vercel : les pages du site restent générées à l'avance (statiques) ;
  // seules les routes de Keystatic deviennent des fonctions serveur sur Vercel.
  adapter: vercel(),
});
