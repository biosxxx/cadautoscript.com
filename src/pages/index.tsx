import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

type UtilityCard = {
  title: string;
  summary: string;
  href: string;
  badge: string;
  tech: string;
  standard: string;
  tags: string[];
};

const utilities: UtilityCard[] = [
  {
    title: 'Pipe Cutter Visualizer',
    summary:
      'Preview saddle intersections, tweak offsets, and export DXF templates ready for CNC plasma or waterjet tables.',
    href: '/utilities/pipe-cutter/',
    badge: 'Pipe Cutter',
    tech: 'WebGL',
    standard: 'ASME B31.3 · ISO 9606',
    tags: ['3D preview', 'DXF export', 'Offsets'],
  },
  {
    title: 'Cylindrical Shell Rolling',
    summary:
      'Determine roll spacing, bending allowance, and developed lengths with EN 13445 / ASME VIII presets.',
    href: '/utilities/cylindrical-shell-rolling/',
    badge: 'Shell Rolling',
    tech: 'Calc',
    standard: 'EN 13445 · ASME VIII',
    tags: ['Roll offsets', 'Tolerances', 'Printable'],
  },
  {
    title: 'Sheet-metal bending sandbox',
    summary: 'Simulate K-factors, reliefs, and bend deductions before committing tooling or CAM time.',
    href: '/utilities/metal-bending/',
    badge: 'Bend Sandbox',
    tech: 'Canvas',
    standard: 'ISO 2768 · EN 10149',
    tags: ['K-factor', 'Press brake', 'Metric & inch'],
  },
  {
    title: 'Interactive thread atlas',
    summary: 'Filter ISO, UNC, and UNF series, get drill diameters, and copy callouts directly into drawings.',
    href: '/utilities/interactive-thread/',
    badge: 'Thread Atlas',
    tech: 'Data',
    standard: 'ISO 965 · UNC/UNF',
    tags: ['Lookup', 'Callouts', 'Drill charts'],
  },
  {
    title: 'PDF number extractor',
    summary: 'Highlight serials, QA IDs, and BOM references locally with WASM-powered parsing and CSV export.',
    href: '/utilities/pdf-number-extractor/',
    badge: 'Doc Parser',
    tech: 'WASM',
    standard: 'Offline parsing',
    tags: ['Regex', 'CSV', 'Offline'],
  },
  {
    title: 'QR nameplate generator',
    summary:
      'Create serialized equipment tags with logos, QR codes, and safety icons. Export SVG or PNG instantly.',
    href: '/utilities/qr-nameplate/',
    badge: 'QR Nameplates',
    tech: 'SVG',
    standard: 'ISO 3864 · Traceability',
    tags: ['Branding', 'Auto serial', 'QR codes'],
  },
];

const heroStats = [
  {label: 'Live tools', value: '6', detail: 'Piping, bending, QA, traceability'},
  {label: 'Runtime', value: 'Chromium only', detail: 'WebGL 2 · WASM · offline cache'},
  {label: 'Export formats', value: 'DXF · SVG · CSV', detail: 'Generated directly in the browser'},
];

const heroHighlights = [
  'MDX-driven docs with embedded calculators',
  'Dark UI tuned for shop floors and offices',
  'Telemetry friendly layout for kiosks',
];

function UtilityCardItem({utility}: {utility: UtilityCard}) {
  return (
    <article className={styles.utilityCard}>
      <div className={styles.utilityHead}>
        <span className={styles.badge}>{utility.badge}</span>
        <span className={styles.pill}>{utility.tech}</span>
      </div>
      <h3>{utility.title}</h3>
      <p>{utility.summary}</p>
      <ul className={styles.tagList}>
        {utility.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <div className={styles.utilityFooter}>
        <span>{utility.standard}</span>
        <Link className="button button--primary" href={utility.href}>
          Launch
        </Link>
      </div>
    </article>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="CAD AutoScript · SolidWorks macros, interactive calculators, and QA generators">
      <main className={styles.main}>
        <header className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Web-native</p>
            <h1>Dynamic toolkit for piping, bending, QA, and traceability</h1>
            <p>
              CAD AutoScript packages SolidWorks macros, Chromium utilities, and DXF/CSV/SVG generators into
              a single wiki-like hub. Everything runs client-side with GPU acceleration and offline cache.
            </p>
            <div className={styles.heroHighlights}>
              {heroHighlights.map((item) => (
                <span key={item} className={styles.pill}>
                  {item}
                </span>
              ))}
            </div>
            <div className={styles.heroActions}>
              <Link className="button button--primary button--lg" href="/docs/intro">
                Browse documentation
              </Link>
              <Link className="button button--secondary button--lg" href="/blog">
                Read release notes
              </Link>
            </div>
          </div>
          <div className={styles.heroPanel}>
            {heroStats.map((stat) => (
              <div key={stat.label} className={styles.heroStat}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </div>
            ))}
            <div className={styles.heroSignal}>
              <span className={styles.pill}>Live telemetry</span>
              <div className={styles.signalBars} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </header>

        <section className={styles.utilitySection}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Utility stack</p>
              <h2>Launch any companion instantly</h2>
            </div>
            <p className={styles.sectionLead}>
              Each calculator ships as a standalone React component. Drop it into MDX, link it from docs, or
              run it as a kiosk app.
            </p>
          </div>
          <div className={styles.utilityGrid}>
            {utilities.map((utility) => (
              <UtilityCardItem key={utility.title} utility={utility} />
            ))}
          </div>
        </section>

        <section className={styles.docsSection}>
          <div>
            <p className={styles.eyebrow}>Docs + MDX</p>
            <h2>Document workflows right next to the tools</h2>
            <p>
              Use Docusaurus MDX to mix Markdown, component embeds, and release notes. Every macro or
              generator can document itself with live props, screenshots, and telemetry.
            </p>
          </div>
          <div className={styles.docsLinks}>
            <Link className="button button--primary button--lg" href="/docs/utilities/overview">
              Explore catalog docs
            </Link>
            <Link className="button button--secondary button--lg" href="/utilities/pdf-number-extractor/">
              Try Doc Parser
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}