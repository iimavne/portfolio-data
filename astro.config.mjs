// @ts-check
import { defineConfig } from 'astro/config';

import markdoc from '@astrojs/markdoc';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

// Keystatic (l'admin /keystatic) a besoin d'un serveur, alors que le site déployé
// est statique : on ne l'active que pendant `astro dev` (mode local).
function keystaticEnDev() {
  const integration = keystatic();
  return {
    name: 'keystatic-en-dev',
    hooks: {
      /** @param {any} options */
      'astro:config:setup': (options) => {
        if (options.command === 'dev') integration.hooks['astro:config:setup'](options);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  integrations: [markdoc(), react(), keystaticEnDev()],
});
