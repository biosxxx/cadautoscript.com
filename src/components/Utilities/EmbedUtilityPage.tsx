import React from 'react';
import Head from '@docusaurus/Head';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  utilityPageConfigs,
  type UtilityPageSlug,
} from '@site/src/data/utilityShellPages';

export const EMBED_MESSAGE_SOURCE = 'cadautoscript-embed';

const FULL_PAGE_ORIGIN = 'https://cadautoscript.com';

/**
 * Minimal-chrome embed route for a utility calculator.
 *
 * - No navbar/footer: the page renders just the tool iframe plus a slim
 *   "Powered by" bar, so external sites can frame it cleanly.
 * - Auto-height: the wrapper measures the (same-origin) tool iframe content,
 *   sizes the iframe to it, and reports the final page height to the embedding
 *   parent via postMessage (`{source: 'cadautoscript-embed', type: 'resize',
 *   height, slug}`). No third-party cookies are set.
 */
export function EmbedUtilityPage(slug: UtilityPageSlug) {
  return function EmbedUtilityRoute() {
    const config = utilityPageConfigs[slug];
    if (!config) {
      throw new Error(`Utility page configuration missing for slug "${slug}"`);
    }
    const {title, appPath, iframeAllow = ''} = config;
    const iframeSrc = useBaseUrl(appPath ?? `/utility-apps/${slug}/app.html`);
    const fullPageUrl = `${FULL_PAGE_ORIGIN}/utilities/${slug}/`;

    const frameRef = React.useRef<HTMLIFrameElement>(null);
    const [frameHeight, setFrameHeight] = React.useState(640);

    // 1) Size the wrapper to the tool's real content height (same-origin).
    React.useEffect(() => {
      const measure = () => {
        const frame = frameRef.current;
        if (!frame) return;
        try {
          const doc = frame.contentDocument ?? frame.contentWindow?.document;
          if (!doc) return;
          const h = Math.max(
            doc.documentElement?.scrollHeight ?? 0,
            doc.body?.scrollHeight ?? 0,
          );
          if (h > 120) setFrameHeight(h);
        } catch {
          // Cross-origin fallback: keep the last measured height.
        }
      };
      measure();
      const interval = window.setInterval(measure, 800);
      const stop = window.setTimeout(() => window.clearInterval(interval), 15000);
      return () => {
        window.clearInterval(interval);
        window.clearTimeout(stop);
      };
    }, []);

    // 2) Report our total height to the embedding parent page.
    React.useEffect(() => {
      const report = () => {
        const height = Math.ceil(document.documentElement.scrollHeight);
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {source: EMBED_MESSAGE_SOURCE, type: 'resize', height, slug},
            '*',
          );
        }
      };
      report();
      const observer = new ResizeObserver(report);
      observer.observe(document.documentElement);
      window.addEventListener('load', report);
      const interval = window.setInterval(report, 600);
      const stop = window.setTimeout(() => window.clearInterval(interval), 15000);
      return () => {
        observer.disconnect();
        window.clearInterval(interval);
        window.clearTimeout(stop);
        window.removeEventListener('load', report);
      };
    }, [slug]);

    return (
      <>
        <Head>
          <title>{`${title} — Embed`}</title>
          <meta name="robots" content="noindex" />
        </Head>
        <main style={{margin: 0, padding: 0, background: '#ffffff'}}>
          <iframe
            ref={frameRef}
            src={iframeSrc}
            title={title}
            style={{
              width: '100%',
              height: `${frameHeight}px`,
              border: 'none',
              display: 'block',
            }}
            allow={iframeAllow}
            loading="eager"
          />
          <footer
            style={{
              padding: '10px 14px',
              textAlign: 'right',
              fontSize: '13px',
              lineHeight: 1.4,
              color: '#5b6472',
              background: '#f7f8fa',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              borderTop: '1px solid #e8ebf0',
            }}
          >
            Powered by{' '}
            <a
              href={fullPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{color: '#2f6feb', fontWeight: 600, textDecoration: 'none'}}
            >
              CAD AutoScript
            </a>
          </footer>
        </main>
      </>
    );
  };
}
