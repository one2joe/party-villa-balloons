import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://party-villa-balloons.pages.dev',
  output: 'static',
  integrations: [sitemap()],
});
