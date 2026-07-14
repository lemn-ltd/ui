import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ui.le-mn.com',
  integrations: [
    starlight({
      title: 'UI',
      description:
        'Documentation, release notes, and lifecycle guidance for Lemn UI (@lemn-ltd/ui).',
      disable404Route: true,
      head: [
        {
          tag: 'script',
          content:
            "try { if (localStorage.getItem('starlight-theme') === null) localStorage.setItem('starlight-theme', 'light'); } catch {}",
        },
      ],
      customCss: ['../../packages/ui/src/foundations/tokens.css', './src/styles/custom.css'],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        es: {
          label: 'Spanish',
          lang: 'es',
        },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/lemn-ltd/ui',
        },
      ],
      sidebar: [
        {
          label: 'Start',
          items: [
            { label: 'Overview', slug: 'index' },
            { label: 'Install and use', slug: 'getting-started' },
          ],
        },
        {
          label: 'Design System',
          collapsed: false,
          items: [
            { label: 'Component catalog', slug: 'component-catalog' },
            { label: 'Showcase', slug: 'showcase' },
          ],
        },
        {
          label: 'Release',
          collapsed: false,
          items: [
            { label: 'Lifecycle', slug: 'lifecycle' },
            { label: 'Changelog', slug: 'changelog' },
            { label: 'Deploy', slug: 'deploy' },
          ],
        },
      ],
    }),
  ],
});
