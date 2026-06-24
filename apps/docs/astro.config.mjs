import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ui.appranks.com',
  integrations: [
    starlight({
      title: 'Docs - UI',
      description:
        'Human-facing documentation, release notes, and lifecycle guidance for @appranks/ui.',
      disable404Route: true,
      logo: {
        src: './src/assets/agent-icon.svg',
        alt: 'UI agent icon',
      },
      head: [{ tag: 'title', content: 'Docs - UI' }],
      customCss: ['./src/styles/custom.css'],
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
          href: 'https://github.com/appranks/ui',
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
