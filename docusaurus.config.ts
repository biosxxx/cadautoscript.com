import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'CAD AutoScript',
  tagline: 'SolidWorks macros, web calculators, and QA generators',
  favicon: 'img/favicon.png',
  future: {
    v4: true,
  },
  url: 'https://cadautoscript.com',
  baseUrl: '/',
  organizationName: 'biosxxx',
  projectName: 'cadautoscript.com',
  onBrokenLinks: 'ignore',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'ignore',
    },
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/biosxxx/cadautoscript.com/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/biosxxx/cadautoscript.com/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: ['./src/css/custom.css', './src/css/light-theme.css'],
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'CAD AutoScript',
      logo: {
        alt: 'CAD AutoScript logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Updates', position: 'left'},
        {href: '/utilities/pipe-cutter/', label: 'Launch Pipe Cutter', position: 'right'},
        {
          href: 'https://github.com/biosxxx/cadautoscript.com',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Automation overview', to: '/docs/intro'},
            {label: 'Utility catalog', to: '/docs/utilities/overview'},
          ],
        },
        {
          title: 'Utilities',
          items: [
            {label: 'Pipe Cutter', href: '/utilities/pipe-cutter/'},
            {label: 'Shell Rolling', href: '/utilities/cylindrical-shell-rolling/'},
            {label: 'Thread Atlas', href: '/utilities/interactive-thread/'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Blog', to: '/blog'},
            {label: 'GitHub', href: 'https://github.com/biosxxx/cadautoscript.com'},
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} CAD AutoScript. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
