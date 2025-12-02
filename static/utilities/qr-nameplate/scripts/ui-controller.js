import {applyTranslations, getLocale} from './translations.js';

export class UiController {
  constructor() {
    this.refs = {
      plaqueTextEl: document.getElementById('plaque-text'),
      qrUrlEl: document.getElementById('qr-url'),
      plaqueWidthEl: document.getElementById('plaque-width'),
      plaqueHeightEl: document.getElementById('plaque-height'),
      plaqueDepthEl: document.getElementById('plaque-depth'),
      plaqueRadiusEl: document.getElementById('plaque-radius'),
      addBorderEl: document.getElementById('add-border'),
      addBorderLabel: document.getElementById('add-border-label'),
      materialOptionsEl: document.getElementById('material-options'),
      generateBtn: document.getElementById('generate-btn'),
      langButtons: document.querySelectorAll('.lang-btn'),
      plaqueCanvas: document.getElementById('plaque-canvas'),
      engravingCanvas: document.getElementById('engraving-map-canvas'),
    };

    this.i18nCtx = {
      textNodes: document.querySelectorAll('[data-i18n]'),
      placeholderNodes: document.querySelectorAll('[data-i18n-placeholder]'),
      valueNodes: document.querySelectorAll('[data-i18n-value]'),
      titleEl: document.querySelector('title'),
      generateBtn: this.refs.generateBtn,
    };

    this.currentLang = 'ru';
    this.generateHandler = null;
    this.langChangeHandler = null;

    this.initValueTracking();
    this.initMaterialSelector();
    this.initLangButtons();
    this.initBorderToggle();
  }

  initValueTracking() {
    this.i18nCtx.valueNodes.forEach((el) => {
      el.addEventListener('input', () => {
        el.dataset.userEdited = 'true';
      });
    });
  }

  initMaterialSelector() {
    const {materialOptionsEl} = this.refs;
    materialOptionsEl?.addEventListener('click', (event) => {
      if (!(event.target instanceof HTMLButtonElement)) return;
      materialOptionsEl.querySelectorAll('.option-btn').forEach((btn) => btn.classList.remove('active'));
      event.target.classList.add('active');
    });
  }

  initLangButtons() {
    this.refs.langButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang || 'ru';
        this.setLanguage(lang);
        if (this.langChangeHandler) {
          this.langChangeHandler(lang);
        }
      });
    });
  }

  initBorderToggle() {
    const {addBorderEl, addBorderLabel} = this.refs;
    if (!addBorderEl || !addBorderLabel) return;
    addBorderEl.addEventListener('change', () => {
      addBorderLabel.classList.toggle('active', addBorderEl.checked);
    });
  }

  setLanguage(lang) {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    this.refs.langButtons.forEach((btn) => {
      const isActive = btn.dataset.lang === lang;
      btn.classList.toggle('active', isActive);
    });
    applyTranslations(lang, this.i18nCtx, {isLoading: this.refs.generateBtn?.disabled});
  }

  onLanguageChange(callback) {
    this.langChangeHandler = callback;
  }

  onGenerate(callback) {
    this.generateHandler = callback;
    this.refs.generateBtn?.addEventListener('click', () => this.generateHandler?.());
  }

  setButtonState(isLoading) {
    const locale = getLocale(this.currentLang);
    if (!this.refs.generateBtn) return;
    this.refs.generateBtn.disabled = isLoading;
    this.refs.generateBtn.textContent = isLoading ? locale.generateBtnLoading : locale.generateBtn;
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

    const size = {
      w: parseFloat(plaqueWidthEl?.value || '150') / 10 || 15,
      h: parseFloat(plaqueHeightEl?.value || '150') / 10 || 15,
      d: parseFloat(plaqueDepthEl?.value || '5') / 10 || 0.5,
      radius: parseFloat(plaqueRadiusEl?.value || '5') / 10 || 0.5,
    };

    const activeMaterial = materialOptionsEl?.querySelector('.option-btn.active');
    const material = activeMaterial?.dataset.material || 'steel';

    return {
      size,
      engraving: {
        text: plaqueTextEl?.value || getLocale(this.currentLang).plaqueTextValue,
        url: qrUrlEl?.value || getLocale(this.currentLang).qrUrlValue,
        border: addBorderEl?.checked || false,
      },
      material,
      lang: this.currentLang,
    };
  }

  handleResize(rendererCallback) {
    window.addEventListener('resize', rendererCallback);
  }
}
