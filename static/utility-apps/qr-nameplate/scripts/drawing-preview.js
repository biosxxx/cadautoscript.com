export function buildDrawingSvg(state) {
  const mmW = clamp(state.dimensions.widthMm, 20, 5000);
  const mmH = clamp(state.dimensions.heightMm, 20, 5000);
  const mmR = clamp(state.dimensions.radiusMm, 0, Math.min(mmW, mmH) / 2);

  // Canvas in px for preview (not 1:1). Keep aspect ratio.
  const maxPx = 760;
  const pad = 90;
  const aspect = mmW / mmH;
  let wPx = Math.min(maxPx, 520);
  let hPx = wPx / aspect;
  if (hPx > 420) {
    hPx = 420;
    wPx = hPx * aspect;
  }

  const svgW = wPx + pad * 2;
  const svgH = hPx + pad * 2;

  const plateX = pad;
  const plateY = pad;
  const rx = (mmR / mmW) * wPx;
  const ry = (mmR / mmH) * hPx;

  // Centered Layout
  const qrSizePx = Math.min(wPx, hPx) * 0.5;
  const qrX = plateX + (wPx - qrSizePx) / 2;
  const qrY = plateY + hPx * 0.35;

  const textAreaX = plateX + wPx / 2;
  const textAreaY = plateY + hPx * 0.2;

  const title = escapeXml(state.engraving.text || "CAD AutoScript");
  const url = escapeXml(state.engraving.url || "https://cadautoscript.com");

  const dimColor = "#334155";
  const stroke = "#0f172a";
  const border = state.engraving.border;

  const qrDataUrl = state.qrDataUrl;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">
  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
      <path d="M0,0 L8,4 L0,8 Z" fill="${dimColor}"/>
    </marker>
  </defs>

  <rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#ffffff"/>
  <text x="${pad}" y="28" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700" fill="${stroke}">
    REPORT DRAWING (PREVIEW)
  </text>
  <text x="${pad}" y="48" font-family="Inter, Arial, sans-serif" font-size="12" fill="${dimColor}">
    URL: ${url}
  </text>

  <rect x="${plateX}" y="${plateY}" width="${wPx}" height="${hPx}" rx="${rx}" ry="${ry}"
        fill="#f1f5f9" stroke="${stroke}" stroke-width="2"/>

  ${border ? `<rect x="${plateX + 10}" y="${plateY + 10}" width="${wPx - 20}" height="${hPx - 20}" rx="${Math.max(0, rx - 8)}" ry="${Math.max(0, ry - 8)}"
        fill="none" stroke="${stroke}" stroke-width="1.5" opacity="0.75"/>` : ""}

  <!-- Engraving text -->
  <text x="${textAreaX}" y="${textAreaY}" text-anchor="middle" dominant-baseline="middle" 
        font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" fill="${stroke}">
    ${title}
  </text>

  <!-- QR -->
  ${qrDataUrl
      ? `<image href="${qrDataUrl}" x="${qrX}" y="${qrY}" width="${qrSizePx}" height="${qrSizePx}" />`
      : `<rect x="${qrX}" y="${qrY}" width="${qrSizePx}" height="${qrSizePx}" fill="#ffffff" stroke="${stroke}" stroke-width="2"/>
       <text x="${qrX + qrSizePx / 2}" y="${qrY + qrSizePx / 2}" text-anchor="middle" dominant-baseline="middle"
             font-family="Inter, Arial, sans-serif" font-size="12" fill="${dimColor}">
         QR
       </text>`
    }

  <!-- Dimensions: width -->
  <line x1="${plateX}" y1="${plateY - 30}" x2="${plateX + wPx}" y2="${plateY - 30}" stroke="${dimColor}" stroke-width="2"
        marker-start="url(#arrow)" marker-end="url(#arrow)"/>
  <line x1="${plateX}" y1="${plateY}" x2="${plateX}" y2="${plateY - 24}" stroke="${dimColor}" stroke-width="1"/>
  <line x1="${plateX + wPx}" y1="${plateY}" x2="${plateX + wPx}" y2="${plateY - 24}" stroke="${dimColor}" stroke-width="1"/>
  <text x="${plateX + wPx / 2}" y="${plateY - 38}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" fill="${dimColor}">
    W = ${mmW.toFixed(0)} mm
  </text>

  <!-- Dimensions: height -->
  <line x1="${plateX + wPx + 30}" y1="${plateY}" x2="${plateX + wPx + 30}" y2="${plateY + hPx}" stroke="${dimColor}" stroke-width="2"
        marker-start="url(#arrow)" marker-end="url(#arrow)"/>
  <line x1="${plateX + wPx}" y1="${plateY}" x2="${plateX + wPx + 24}" y2="${plateY}" stroke="${dimColor}" stroke-width="1"/>
  <line x1="${plateX + wPx}" y1="${plateY + hPx}" x2="${plateX + wPx + 24}" y2="${plateY + hPx}" stroke="${dimColor}" stroke-width="1"/>
  <text x="${plateX + wPx + 40}" y="${plateY + hPx / 2}" font-family="Inter, Arial, sans-serif" font-size="12" fill="${dimColor}">
    H = ${mmH.toFixed(0)} mm
  </text>

  <text x="${pad}" y="${svgH - 18}" font-family="Inter, Arial, sans-serif" font-size="11" fill="${dimColor}">
    Footer: cadautoscript.com
  </text>
</svg>`;
}

export function computeLayout(dimensionsMm) {
  const w = clamp(dimensionsMm.widthMm, 20, 5000);
  const h = clamp(dimensionsMm.heightMm, 20, 5000);

  // Reuse logic or keep for compatibility?
  // Current drawing logic computes its own layout. 
  // But we still export this as it might be used by main.js enrichState.

  const minSide = Math.min(w, h);
  const qrSizeMm = clamp(minSide * 0.35, 18, Math.min(60, minSide * 0.6));
  const marginMm = clamp(minSide * 0.08, 8, 20);

  return { qrSizeMm, marginMm };
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function escapeXml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
