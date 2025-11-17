import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {utilities} from '@site/src/data/utilities';
import styles from './index.module.css';

const heroStats = [
  {label: 'Live utilities', value: utilities.length.toString()},
  {label: 'Runtime', value: 'Chromium + WASM'},
  {label: 'Formats', value: 'DXF / SVG / CSV'},
];

function UtilityCard({utility}: {utility: (typeof utilities)[number]}) {
  return (
    <article className={styles.utilityCard}>
      <div className={styles.utilityHead}>
        <span className={styles.badge}>{utility.tech}</span>
        <span className={styles.subtle}>{utility.standards}</span>
      </div>
      <h3>{utility.name}</h3>
      <p>{utility.description}</p>
      <ul className={styles.featureList}>
        {utility.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <div className={styles.utilityFooter}>
        <a className="button button--primary" href={utility.href} data-noBrokenLinkCheck>
          Open utility
        </a>
      </div>
    </article>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="CAD AutoScript — SolidWorks macros, calculators, and QA tools">
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>CAD AutoScript</p>
            <h1>Minimal hub for fabrication utilities</h1>
            <p>
              SolidWorks macros, DXF generators, and QA helpers live in one place. Open the calculator you
              need, keep docs nearby, and let Chromium do the heavy lifting.
            </p>
            <div className={styles.heroActions}>
              <Link className="button button--primary" href="/docs/utilities/overview">
                View all docs
              </Link>
              <Link className="button button--secondary" href="/blog">
                Release notes
              </Link>
            </div>
          </div>
          <div className={styles.heroStats}>
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.utilitySection}>
          <header>
            <p className={styles.eyebrow}>Utilities</p>
            <h2>Just the essentials</h2>
            <p>
              Each utility is a standalone static app hosted under <code>/utilities/*</code>. Launches open
              the same pages machinists already know.
            </p>
          </header>
          <div className={styles.utilityGrid}>
            {utilities.map((utility) => (
              <UtilityCard key={utility.id} utility={utility} />
            ))}
          </div>
        </section>

        <section className={styles.docsSection}>
          <div>
            <p className={styles.eyebrow}>Documentation</p>
            <h2>Embed and explain inside MDX</h2>
            <p>
              Drop calculators into MDX, capture screenshots, or write run-books. The docs and utilities ship
              together so the interface stays small and predictable.
            </p>
          </div>
          <div className={styles.docsLinks}>
            <Link className="button button--primary" href="/docs/utilities/embed-calculators">
              Embed utilities
            </Link>
            <a className="button button--secondary" href="/utilities/pdf-number-extractor/" data-noBrokenLinkCheck>
              Launch Doc Parser
            </a>
          </div>
        </section>
      </main>
    </Layout>
  );
}