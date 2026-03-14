import { SceneManager } from "./scene-manager.js";
import { UiController } from "./ui-controller.js";
import { EngravingMapGenerator } from "./engraving-map.js";
import { buildDrawingSvg, computeLayout } from "./drawing-preview.js";
import { downloadPdfReport } from "./pdf-report.js";

function bootstrap() {
  const ui = new UiController();

  const plaqueCanvas = ui.refs.plaqueCanvas;
  const engravingCanvas = ui.refs.engravingCanvas;
  if (!plaqueCanvas || !engravingCanvas) return;

  const sceneManager = new SceneManager(plaqueCanvas);
  const engravingGenerator = new EngravingMapGenerator(engravingCanvas);

  let is3dBusy = false;

  const validate = (state) => {
    const d = state.dimensions;
    if (d.widthMm < 20 || d.heightMm < 20) return "Width/height must be at least 20 mm.";
    if (d.depthMm < 1) return "Thickness must be at least 1 mm.";
    if (d.radiusMm < 0) return "Corner radius cannot be negative.";
    if (d.radiusMm > Math.min(d.widthMm, d.heightMm) / 2) return "Corner radius is too large for the given size.";
    if (!/^https?:\/\//i.test(state.engraving.url)) return "QR link must start with http:// or https://";
    return "";
  };

  const enrichState = (base) => {
    const layout = computeLayout({
      widthMm: base.dimensions.widthMm,
      heightMm: base.dimensions.heightMm,
    });
    return { ...base, layout };
  };

  const updateDrawingPreview = (state) => {
    const svg = buildDrawingSvg(state);
    ui.setDrawingPreview(svg);
    return svg;
  };

  const generatePreview = async () => {
    if (is3dBusy) return;
    is3dBusy = true;

    try {
      ui.setButtonState({ isLoading3d: true });

      const base = ui.getFormState();
      const state = enrichState(base);

      const err = validate(state);
      ui.setValidationMessage(err);
      updateDrawingPreview(state);

      if (err) return;

      // 3D scene units are centimeters in this prototype
      sceneManager.updateGeometry({
        w: state.dimensions.widthMm / 10,
        h: state.dimensions.heightMm / 10,
        d: state.dimensions.depthMm / 10,
        radius: state.dimensions.radiusMm / 10,
      });

      const engravingMap = await engravingGenerator.createMap({
        ...state.engraving,
      });

      await sceneManager.applyMaterial({
        materialType: state.material,
        engravingCanvas: engravingMap,
      });
    } finally {
      ui.setButtonState({ isLoading3d: false });
      is3dBusy = false;
    }
  };

  const generatePdf = async () => {
    try {
      ui.setButtonState({ isLoadingPdf: true });

      const base = ui.getFormState();
      const state = enrichState(base);

      const err = validate(state);
      ui.setValidationMessage(err);
      const qrDataUrl = await engravingGenerator.getQrPngDataUrl(state.engraving.url, 320);

      // Inject QR data into state so buildDrawingSvg can use it
      const pdfState = { ...state, qrDataUrl };
      const svg = updateDrawingPreview(pdfState);

      await downloadPdfReport(pdfState, { drawingSvg: svg, qrDataUrl });
    } finally {
      ui.setButtonState({ isLoadingPdf: false });
    }
  };

  ui.onGenerate(generatePreview);
  ui.onPdf(generatePdf);

  ui.handleResize(() => sceneManager.resize());

  sceneManager.loadEnvironment().then(() => {
    // initial render
    generatePreview();
  });
}

document.addEventListener("DOMContentLoaded", bootstrap);
