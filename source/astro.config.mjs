import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://managestate.app',
  output: 'static',
  integrations: [react(), sitemap(), tailwind({ applyBaseStyles: false }), mdx()],
  build: { format: 'directory' }
});
