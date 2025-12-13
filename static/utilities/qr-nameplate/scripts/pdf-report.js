import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js";

export async function downloadPdfReport(state, { drawingSvg, qrDataUrl } = {}) {
  // Compression = true is crucial for small file sizes
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;

  const title = "QR Nameplate - Report Drawing";
  const subtitle = `Generated: ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, margin + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, margin, margin + 13);

  // Footer link (as requested)
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.textWithLink("cadautoscript.com", pageW - margin, pageH - 8, { url: "https://cadautoscript.com", align: "right" });
  doc.setTextColor(0, 0, 0);

  // Table - parameters
  const tableTop = margin + 20;
  const rowH = 7;
  const col1W = 52;
  const col2W = pageW - margin * 2 - col1W;

  const rows = buildRows(state);
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);

  let y = tableTop;

  // Header row
  drawCell(doc, margin, y, col1W, rowH, "Parameter", true);
  drawCell(doc, margin + col1W, y, col2W, rowH, "Value", true);
  y += rowH;

  rows.forEach(([k, v]) => {
    drawCell(doc, margin, y, col1W, rowH, k);
    drawCell(doc, margin + col1W, y, col2W, rowH, v);
    y += rowH;
  });

  // Drawing preview block
  const drawingTop = y + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Drawing preview", margin, drawingTop);

  const boxTop = drawingTop + 4;
  const boxH = pageH - boxTop - 18;
  const boxW = pageW - margin * 2;

  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, boxTop, boxW, boxH);

  // Put drawing SVG as raster image (PNG)
  // To keep size small: use moderate resolution and compression
  if (drawingSvg) {
    // 1400x900 is ~1.2MP, with compression it should be small enough.
    const png = await svgToPngDataUrl(drawingSvg, 1400, 900);
    // Fit to box with padding
    const pad = 4;
    const imgW = boxW - pad * 2;
    const imgH = boxH - pad * 2;
    // Use 'FAST' compression for images (zlib) or 'SLOW' for better compression but slower speed. 
    // 'FAST' is usually good balance. 'SLOW' is smallest file.
    doc.addImage(png, "PNG", margin + pad, boxTop + pad, imgW, imgH, undefined, "FAST");
  }

  // QR image in corner (optional)
  if (qrDataUrl) {
    const qrSize = 24;
    doc.addImage(qrDataUrl, "PNG", pageW - margin - qrSize, margin + 4, qrSize, qrSize, undefined, "FAST");
  }

  doc.save(buildFileName(state));
}

function buildRows(state) {
  const d = state.dimensions;
  const e = state.engraving;
  return [
    ["Engraving text", safe(e.text)],
    ["QR link", safe(e.url)],
    ["Width (mm)", String(d.widthMm)],
    ["Height (mm)", String(d.heightMm)],
    ["Thickness (mm)", String(d.depthMm)],
    ["Corner radius (mm)", String(d.radiusMm)],
    ["Border", e.border ? "Yes" : "No"],
    ["Material", prettyMaterial(state.material)],
    ["QR size (mm)", String(state.layout.qrSizeMm.toFixed(0))],
    ["Margin (mm)", String(state.layout.marginMm.toFixed(0))],
  ];
}

function prettyMaterial(m) {
  switch (m) {
    case "steel": return "Stainless steel";
    case "copper": return "Copper";
    case "black-granite": return "Black granite";
    default: return m || "steel";
  }
}

function safe(v) { return (v ?? "").toString().trim() || "-"; }

function buildFileName(state) {
  const w = state.dimensions.widthMm;
  const h = state.dimensions.heightMm;
  return `qr-nameplate_${w}x${h}mm.pdf`;
}

function drawCell(doc, x, y, w, h, text, header = false) {
  if (header) {
    doc.setFont("helvetica", "bold");
    doc.setFillColor(241, 245, 249);
    doc.rect(x, y, w, h, "F");
  } else {
    doc.setFont("helvetica", "normal");
  }
  doc.rect(x, y, w, h);
  doc.setFontSize(10);
  doc.text(String(text), x + 2.5, y + 4.8, { maxWidth: w - 5 });
}

async function svgToPngDataUrl(svgString, widthPx, heightPx) {
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, widthPx, heightPx);

    // contain
    const scale = Math.min(widthPx / img.width, heightPx / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = (widthPx - dw) / 2;
    const dy = (heightPx - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
