export const translations = {
  ru: {
    title: 'Генератор табличек с QR-кодом (UI-оболочка для прототипа)',
    headerTitle: '3D-табличка',
    headerSubtitle: 'Создайте табличку с QR-кодом и интерактивным предпросмотром',
    contentSectionTitle: 'Гравировка',
    plaqueTextLabel: 'Текст для гравировки',
    plaqueTextPlaceholder: 'Введите текст...',
    plaqueTextValue: 'Гравировка',
    qrUrlLabel: 'Ссылка для QR-кода',
    qrUrlPlaceholder: 'https://example.com/info',
    qrUrlValue: 'https://google.com/',
    dimensionsSectionTitle: 'Габариты',
    widthLabel: 'Ширина (мм)',
    heightLabel: 'Высота (мм)',
    depthLabel: 'Толщина (мм)',
    radiusLabel: 'Радиус скругления (мм)',
    addBorderLabel: 'Добавить рамку',
    materialLabel: 'Материал',
    materialSteel: 'Нержавеющая сталь',
    materialCopper: 'Медь',
    materialGranite: 'Черный гранит',
    generateBtn: 'Показать 3D модель',
    generateBtnLoading: 'Генерация...',
  },
  en: {
    title: 'QR Nameplate Generator (UI shell only)',
    headerTitle: '3D Nameplate Generator',
    headerSubtitle: 'Design a QR-enabled nameplate interactively',
    contentSectionTitle: 'Engraving',
    plaqueTextLabel: 'Text for engraving',
    plaqueTextPlaceholder: 'Enter engraving text...',
    plaqueTextValue: 'My nameplate',
    qrUrlLabel: 'Link for QR code',
    qrUrlPlaceholder: 'https://example.com/info',
    qrUrlValue: 'https://google.com/',
    dimensionsSectionTitle: 'Dimensions',
    widthLabel: 'Width (mm)',
    heightLabel: 'Height (mm)',
    depthLabel: 'Thickness (mm)',
    radiusLabel: 'Corner radius (mm)',
    addBorderLabel: 'Add border',
    materialLabel: 'Material',
    materialSteel: 'Stainless steel',
    materialCopper: 'Copper',
    materialGranite: 'Black granite',
    generateBtn: 'Generate 3D model',
    generateBtnLoading: 'Generating...',
  },
};

export function getLocale(lang) {
  return translations[lang] || translations.ru;
}

export function applyTranslations(lang, ctx, {isLoading = false} = {}) {
  const locale = getLocale(lang);
  ctx.textNodes.forEach((el) => {
    const key = el.dataset.i18n;
    if (key && locale[key]) {
      el.textContent = locale[key];
    }
  });

  ctx.placeholderNodes.forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key && locale[key]) {
      el.setAttribute('placeholder', locale[key]);
    }
  });

  ctx.valueNodes.forEach((el) => {
    const key = el.dataset.i18nValue;
    if (key && locale[key] && el.dataset.userEdited !== 'true') {
      el.value = locale[key];
    }
  });

  if (ctx.titleEl && locale.title) {
    ctx.titleEl.textContent = locale.title;
  }
  if (ctx.generateBtn) {
    ctx.generateBtn.textContent = isLoading ? locale.generateBtnLoading : locale.generateBtn;
  }
}
