---
sidebar_position: 3
title: Embedding calculators
---

Some calculators ship as standalone, same-origin bundles under
`static/utility-apps/<slug>/app.html`. For external sites (manufacturer pages,
supplier portals, engineering blogs) we provide **embed routes** with minimal
chrome: no navbar, no footer, just the tool plus a small "Powered by CAD
AutoScript" bar.

Currently available embeds:

| Calculator | Embed URL |
|---|---|
| Blind Flange Calculator | `https://cadautoscript.com/embed/blind-flange-calculator/` |
| Dished End (Vessel Head) Calculator | `https://cadautoscript.com/embed/pressure-vessel-dished-end-calc/` |

## Copy-paste snippet

```html
<iframe
  id="cad-blind-flange"
  src="https://cadautoscript.com/embed/blind-flange-calculator/"
  title="Blind Flange Calculator"
  style="width: 100%; height: 640px; border: 1px solid #e8ebf0; border-radius: 12px;"
  loading="lazy"
></iframe>

<script>
  // The embed reports its height via postMessage so the iframe can grow
  // and shrink with the calculator's content — no manual height tuning.
  window.addEventListener('message', (event) => {
    const data = event.data;
    if (
      data &&
      data.source === 'cadautoscript-embed' &&
      data.type === 'resize' &&
      document.getElementById('cad-blind-flange')
    ) {
      document.getElementById('cad-blind-flange').style.height = data.height + 'px';
    }
  });
</script>
```

Swap the `src` and the element id to embed the dished end calculator instead:

```html
<iframe
  id="cad-dished-end"
  src="https://cadautoscript.com/embed/pressure-vessel-dished-end-calc/"
  title="Dished End (Vessel Head) Calculator"
  style="width: 100%; height: 640px; border: 1px solid #e8ebf0; border-radius: 12px;"
  loading="lazy"
></iframe>
```

## How the embed works

- **postMessage-based resize handling** — the embed page measures the tool's
  real content height and posts
  `{source: 'cadautoscript-embed', type: 'resize', height, slug}` to the parent
  page. The parent snippet above just listens and updates the iframe height.
- **No third-party cookies** — the embed route sets none; the calculator itself
  runs entirely in the browser.
- **Powered-by backlink** — every embed renders a slim footer linking back to
  the full calculator page, which keeps the widget compliant with the
  integration guidelines and brings qualified visitors back to the site.
- **Noindex** — embed pages carry `meta name="robots" content="noindex"` so the
  main calculator pages keep their search visibility.

## Extending to more calculators

Embed routes live in `src/pages/embed/<slug>.tsx` and are three lines each:

```tsx
import {EmbedUtilityPage} from '@site/src/components/Utilities/EmbedUtilityPage';

export default EmbedUtilityPage('<slug>');
```

Add the slug to `UtilityPageSlug` configs as usual — the embed wrapper reuses
the same `appPath`, `title`, and `iframeAllow` values as the full shell page.

## Styling tips

- Keep containers fluid so the utilities work on kiosks, tablets, and laptops.
- Prefer dark UI to match the surrounding documentation theme.
- Store screenshots under `static/img` and reference them in MDX for quick visual context.
