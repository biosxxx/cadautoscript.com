import React from 'react';
import clsx from 'clsx';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import {useColorMode} from '@docusaurus/theme-common';
import type {UtilityPageConfig} from '@site/src/data/utilityShellPages';

type HeroLink = {label: string; href: string; variant?: 'primary' | 'ghost'; external?: boolean};

const defaultHeroLinks: HeroLink[] = [
  {label: 'Back to Web utilities', href: '/docs/utilities/overview', variant: 'ghost'},
  {label: 'Macro catalog', href: '/', variant: 'primary'},
];

export default function UtilityShellPage(config: UtilityPageConfig) {
  const {
    slug,
    title,
    subtitle,
    description,
    about,
    tags,
    note,
    features,
    scriptType = 'module',
  } = config;

  const iframeSrc = useBaseUrl(`/utilities/${slug}/app.html`);
  const stylesHref = useBaseUrl('/styles.css');
  const shellCssHref = useBaseUrl('/utilities/util-shell.css');
  const shellLightHref = useBaseUrl('/utilities/util-shell.light.css');
  const shellScriptSrc = useBaseUrl('/utilities/util-shell.js');

  const heroLinks = defaultHeroLinks;
  const {colorMode} = useColorMode();
  const shellClassName = clsx('utility-shell', {
    'light-theme': colorMode !== 'dark',
  });

  return (
    <Layout title={title} description={description}>
      <Head>
        <link rel="stylesheet" href={stylesHref} />
        <link rel="stylesheet" href={shellCssHref} />
        <link rel="stylesheet" href={shellLightHref} />
        {scriptType === 'module' ? (
          <script type="module" src={shellScriptSrc}></script>
        ) : (
          <script defer src={shellScriptSrc}></script>
        )}
      </Head>
      <main className={shellClassName}>
        <header className="utility-header">
          <div>
            <Link className="utility-logo" to="/">
              CAD AutoScript
            </Link>
            <h1>{title}</h1>
            <p className="utility-subtitle">{subtitle}</p>
          </div>
          <div className="utility-actions">
            {heroLinks.map(({label, href, variant = 'ghost', external}) => (
              <Link
                key={label}
                className={`button ${variant}`}
                to={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
              >
                {label}
              </Link>
            ))}
          </div>
        </header>
        <section className="utility-main">
          <div className="utility-stage">
            <button className="utility-toggle" type="button" aria-expanded="false">
              Show panel
            </button>
            <aside className="utility-about" data-collapsible>
              <h2>About this tool</h2>
              <p>{about}</p>
              <div className="utility-tags">
                {tags.map((tag) => (
                  <span key={tag} className="utility-tag">
                    {tag}
                  </span>
                ))}
              </div>
              {note ? <p className="utility-note">{note}</p> : null}
              {features && features.length > 0 ? (
                <div className="utility-card">
                  <h2>Key actions</h2>
                  <ul>
                    {features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </aside>
            <iframe
              className="tool-frame"
              src={iframeSrc}
              title={title}
              loading="lazy"
              data-noBrokenLinkCheck
            ></iframe>
          </div>
        </section>
      </main>
    </Layout>
  );
}
