export class UiController {
  constructor() {
    this.refs = {
      plaqueTextEl: document.getElementById("plaque-text"),
      qrUrlEl: document.getElementById("qr-url"),
      plaqueWidthEl: document.getElementById("plaque-width"),
      plaqueHeightEl: document.getElementById("plaque-height"),
      plaqueDepthEl: document.getElementById("plaque-depth"),
      plaqueRadiusEl: document.getElementById("plaque-radius"),
      addBorderEl: document.getElementById("add-border"),
      autoUpdateEl: document.getElementById("auto-update"),
      validationEl: document.getElementById("validation"),
      materialOptionsEl: document.getElementById("material-options"),
      generateBtn: document.getElementById("generate-btn"),
      pdfBtn: document.getElementById("pdf-btn"),
      plaqueCanvas: document.getElementById("plaque-canvas"),
      engravingCanvas: document.getElementById("engraving-map-canvas"),
      drawingPreviewEl: document.getElementById("drawing-preview"),
      showDrawingBtn: document.getElementById("show-drawing-btn"),
      drawingModal: document.getElementById("drawing-modal"),
      closeModalBtn: document.getElementById("close-modal-btn"),
    };

    this.generateHandler = null;
    this.pdfHandler = null;

    this.initMaterialSelector();
    this.initBorderToggle();
    this.initButtons();
    this.initAutoUpdate();
    this.initModal();
  }

  initModal() {
    const { showDrawingBtn, drawingModal, closeModalBtn } = this.refs;
    if (!showDrawingBtn || !drawingModal) return;

    const openModal = () => drawingModal.classList.add("active");
    const closeModal = () => drawingModal.classList.remove("active");

    showDrawingBtn.addEventListener("click", openModal);
    closeModalBtn?.addEventListener("click", closeModal);

    drawingModal.addEventListener("click", (e) => {
      if (e.target === drawingModal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawingModal.classList.contains("active")) {
        closeModal();
      }
    });
  }

  initMaterialSelector() {
    const { materialOptionsEl } = this.refs;
    materialOptionsEl?.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLButtonElement)) return;
      materialOptionsEl.querySelectorAll(".option-btn").forEach((btn) => btn.classList.remove("active"));
      event.target.classList.add("active");
      this.emitAutoUpdate();
    });
  }

  initBorderToggle() {
    const { addBorderEl } = this.refs;
    if (!addBorderEl) return;
    addBorderEl.addEventListener("change", () => this.emitAutoUpdate());
  }

  initButtons() {
    this.refs.generateBtn?.addEventListener("click", () => this.generateHandler?.());
    this.refs.pdfBtn?.addEventListener("click", () => this.pdfHandler?.());
  }

  initAutoUpdate() {
    const inputs = [
      this.refs.plaqueTextEl,
      this.refs.qrUrlEl,
      this.refs.plaqueWidthEl,
      this.refs.plaqueHeightEl,
      this.refs.plaqueDepthEl,
      this.refs.plaqueRadiusEl,
    ].filter(Boolean);

    const debounced = debounce(() => this.emitAutoUpdate(), 250);
    inputs.forEach((el) => el.addEventListener("input", debounced));
    this.refs.autoUpdateEl?.addEventListener("change", () => this.emitAutoUpdate(true));
  }

  emitAutoUpdate(force = false) {
    const auto = this.refs.autoUpdateEl?.checked ?? true;
    if (auto || force) this.generateHandler?.();
  }

  onGenerate(callback) {
    this.generateHandler = callback;
  }

  onPdf(callback) {
    this.pdfHandler = callback;
  }

  setButtonState({ isLoading3d = false, isLoadingPdf = false } = {}) {
    if (this.refs.generateBtn) {
      this.refs.generateBtn.disabled = isLoading3d;
      this.refs.generateBtn.textContent = isLoading3d ? "Updating..." : "Update 3D preview";
    }
    if (this.refs.pdfBtn) {
      this.refs.pdfBtn.disabled = isLoadingPdf;
      this.refs.pdfBtn.textContent = isLoadingPdf ? "Generating..." : "Download PDF report";
    }
  }

  setValidationMessage(msg) {
    if (!this.refs.validationEl) return;
    this.refs.validationEl.textContent = msg || "";
  }

  setDrawingPreview(svgString) {
    if (!this.refs.drawingPreviewEl) return;
    this.refs.drawingPreviewEl.innerHTML = svgString;
  }

  getFormState() {
    const {
      plaqueWidthEl,
      plaqueHeightEl,
      plaqueDepthEl,
      plaqueRadiusEl,
      plaqueTextEl,
      qrUrlEl,
      addBorderEl,
      materialOptionsEl,
    } = this.refs;

    const widthMm = parseNumber(plaqueWidthEl?.value, 150);
    const heightMm = parseNumber(plaqueHeightEl?.value, 150);
    const depthMm = parseNumber(plaqueDepthEl?.value, 5);
    const radiusMm = parseNumber(plaqueRadiusEl?.value, 5);

    const activeMaterial = materialOptionsEl?.querySelector(".option-btn.active");
    const material = activeMaterial?.dataset.material || "steel";

    return {
      dimensions: { widthMm, heightMm, depthMm, radiusMm },
      engraving: {
        text: (plaqueTextEl?.value ?? "CAD AutoScript").trim(),
        url: (qrUrlEl?.value ?? "https://cadautoscript.com").trim() || "https://cadautoscript.com",
        border: addBorderEl?.checked || false,
      },
      material,
    };
  }

  handleResize(callback) {
    window.addEventListener("resize", callback);
  }
}

function parseNumber(value, fallback) {
  const n = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : fallback;
}

function debounce(fn, waitMs) {
  let t = null;
  return (...args) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), waitMs);
  };
}
