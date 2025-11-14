const storageKey = "cadAutoScript:scripts";

const defaultScripts = [
  {
    id: "bom-pdf",
    title: "BOM в PDF + логотип",
    description:
      "Собирает спецификацию из сборки, добавляет логотип отдела и публикует PDF отчёт с подписью инженера.",
    category: "Отчеты",
    tags: ["BOM", "PDF", "report"],
    version: "SolidWorks 2023",
    status: "stable",
    link: "https://example.com/bom-pdf",
    doc: "https://example.com/bom-doc",
    complexity: "VBA • 40 строк",
    updated: "Март 2024",
  },
  {
    id: "sheet-metal",
    title: "Листовые развертки DXF",
    description:
      "Автоматизирует экспорт разверток листовых деталей в DXF, именует файлы по номеру проекта и толщине.",
    category: "Производство",
    tags: ["DXF", "листовой металл", "CAM"],
    version: "SolidWorks 2022",
    status: "stable",
    link: "https://example.com/sheet-metal",
    doc: "https://example.com/sheet-manual",
    complexity: "C# Add-in",
    updated: "Январь 2024",
  },
  {
    id: "drawing-check",
    title: "Проверка оформления чертежа",
    description:
      "Сверяет оформление с ГОСТ: шрифты, размеры, заполнение основной надписи и наличие штампа изменений.",
    category: "Чертежи",
    tags: ["QC", "ГОСТ", "drafting"],
    version: "SolidWorks 2024",
    status: "beta",
    link: "https://example.com/drawing-check",
    doc: "https://example.com/gost-guide",
    complexity: "VSTA • 60 строк",
    updated: "Апрель 2024",
  },
  {
    id: "configurator",
    title: "Конфигуратор вариантов",
    description:
      "Формирует набор конфигураций по таблице Excel, создает выражения и экспортирует STEP комплекты.",
    category: "Автоматизация",
    tags: ["config", "excel", "step"],
    version: "SolidWorks 2021",
    status: "stable",
    link: "https://example.com/configurator",
    doc: "https://example.com/config-doc",
    complexity: "VBA • 55 строк",
    updated: "Сентябрь 2023",
  },
  {
    id: "sim-report",
    title: "Рапорт расчета Simulation",
    description:
      "Собирает результаты расчета прочности, графики напряжений и формирует PDF рапорт для руководителя.",
    category: "Аналитика",
    tags: ["simulation", "прочность", "pdf"],
    version: "SolidWorks 2023",
    status: "stable",
    link: "https://example.com/sim-report",
    doc: "https://example.com/sim-doc",
    complexity: "C# + API",
    updated: "Февраль 2024",
  },
  {
    id: "revision-pack",
    title: "Пакет обновления ревизий",
    description:
      "Перенумерует ревизии, обновляет штампы и собирает пакет PDF, DXF и STEP для выдачи технологам.",
    category: "Производство",
    tags: ["revision", "pdf", "step"],
    version: "SolidWorks 2020",
    status: "stable",
    link: "https://example.com/revision-pack",
    doc: "https://example.com/revision-guide",
    complexity: "VBA • 35 строк",
    updated: "Декабрь 2023",
  },
  {
    id: "part-library",
    title: "Создание библиотеки стандартных деталей",
    description:
      "Загружает перечни крепежа из PLM и создает параметрические библиотеки с фильтром по стандарту.",
    category: "Автоматизация",
    tags: ["library", "PLM", "CSV"],
    version: "SolidWorks 2024",
    status: "beta",
    link: "https://example.com/part-library",
    doc: "https://example.com/library-doc",
    complexity: "Python API",
    updated: "Май 2024",
  },
  {
    id: "eco-dashboard",
    title: "Экологический отчет изделия",
    description:
      "Вычисляет массу материалов, формирует Excel отчет по ISO 14040 и прикладывает ссылки на паспорта.",
    category: "Отчеты",
    tags: ["eco", "excel", "ISO"],
    version: "SolidWorks 2022",
    status: "stable",
    link: "https://example.com/eco",
    doc: "https://example.com/eco-doc",
    complexity: "Excel + VBA",
    updated: "Ноябрь 2023",
  },
];

const webTools = [
  {
    title: "Генератор отчета по толерансам",
    description:
      "Строит PDF с контрольными размерами, допусками и QR-ссылкой на 3D модель.",
    badge: "Tolerance Lab",
    link: "https://example.com/tolerance",
    metrics: ["5 мин на выпуск", "ГОСТ 25346"],
  },
  {
    title: "Калькулятор массы сварных рам",
    description:
      "Онлайн расчет веса, см. центра масс и стоимости обработки для рам.",
    badge: "Fabrix Tool",
    link: "https://example.com/frame-mass",
    metrics: ["Металл БСТ3", "CSV export"],
  },
  {
    title: "Валидатор спецификаций ERP",
    description:
      "Сверяет позиции c ERP, подсвечивает дубликаты и выгружает план закупок.",
    badge: "ERP Sync",
    link: "https://example.com/erp-sync",
    metrics: ["XML/JSON", "REST API"],
  },
  {
    title: "Генератор рапортов испытаний",
    description:
      "Заполняет шаблон Word, прикрепляет графики и публикует в Confluence.",
    badge: "Test Pilot",
    link: "https://example.com/test-report",
    metrics: ["Word DOCX", "API Atlassian"],
  },
];

const scriptListEl = document.getElementById("script-list");
const filtersEl = document.getElementById("category-filters");
const searchInput = document.getElementById("search");
const resetBtn = document.getElementById("reset-filter");
const statCountEl = document.getElementById("stat-count");
const formEl = document.getElementById("script-form");
const toolsEl = document.getElementById("tool-list");
const snackbar = document.getElementById("snackbar");

const loadScripts = () => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Ошибка чтения localStorage", error);
    return [];
  }
};

const persistScripts = (items) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (error) {
    console.warn("Ошибка записи localStorage", error);
  }
};

let scripts = loadScripts();
if (!scripts.length) {
  scripts = defaultScripts;
  persistScripts(scripts);
}

let activeCategory = null;
let searchTerm = "";

const updateStatCount = () => {
  statCountEl.textContent = scripts.length.toString().padStart(2, "0");
};

const getCategories = () => {
  const set = new Set(scripts.map((item) => item.category));
  return Array.from(set).sort();
};

const createChip = (label, value) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.dataset.value = value ?? "";
  button.textContent = label;

  if (!value && !activeCategory) {
    button.classList.add("is-active");
  }
  if (value && value === activeCategory) {
    button.classList.add("is-active");
  }

  button.addEventListener("click", () => {
    activeCategory = value === activeCategory ? null : value;
    renderFilters();
    renderScripts();
  });

  return button;
};

const renderFilters = () => {
  filtersEl.innerHTML = "";
  filtersEl.appendChild(createChip("Все разделы", null));
  getCategories().forEach((category) => {
    filtersEl.appendChild(createChip(category, category));
  });
};

const formatTags = (tags = []) =>
  tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => `<span class="tag">#${tag}</span>`)
    .join("");

const createCardMarkup = (script) => {
  const statusClass = script.status === "beta" ? "status--beta" : "status--stable";
  const docLink =
    script.doc && script.doc.length
      ? `<a class="button ghost" href="${script.doc}" target="_blank" rel="noopener">Документация</a>`
      : "";
  const actionLink =
    script.link && script.link.length
      ? `<a class="button primary" href="${script.link}" target="_blank" rel="noopener">Открыть</a>`
      : "";

  return `
    <article class="script-card" data-category="${script.category}">
      <div class="card-top">
        <span class="badge">${script.category}</span>
        <span class="status ${statusClass}">${script.status === "beta" ? "beta" : "stable"}</span>
      </div>
      <h3>${script.title}</h3>
      <p>${script.description}</p>
      <div class="meta">
        <span>${script.version || "SolidWorks"}</span>
        <span>${script.complexity || "Macro"}</span>
        <span>${script.updated || "2024"}</span>
      </div>
      <div class="tags">
        ${formatTags(script.tags || [])}
      </div>
      <div class="card-actions">
        ${actionLink}
        ${docLink}
      </div>
    </article>
  `;
};

const renderScripts = () => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = scripts.filter((item) => {
    const matchesCategory = activeCategory ? item.category === activeCategory : true;
    const matchesSearch = normalizedSearch
      ? [item.title, item.description, item.tags?.join(" "), item.category]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      : true;
    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    scriptListEl.innerHTML = `
      <div class="empty-state">
        <p>Нет макросов по выбранным фильтрам.</p>
        <small>Попробуйте другой раздел или добавьте решение через форму.</small>
      </div>
    `;
  } else {
    scriptListEl.innerHTML = filtered.map(createCardMarkup).join("");
  }
};

const renderTools = () => {
  toolsEl.innerHTML = webTools
    .map(
      (tool) => `
        <article class="tool-card">
          <span class="badge">${tool.badge}</span>
          <strong>${tool.title}</strong>
          <p>${tool.description}</p>
          <div class="tool-meta">
            ${tool.metrics.map((metric) => `<span class="tag">${metric}</span>`).join("")}
          </div>
          <a class="button primary" href="${tool.link}" target="_blank" rel="noopener">Открыть</a>
        </article>
      `
    )
    .join("");
};

const showSnackbar = (message) => {
  if (!snackbar) return;
  snackbar.textContent = message;
  snackbar.classList.add("is-visible");
  setTimeout(() => snackbar.classList.remove("is-visible"), 2200);
};

searchInput?.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderScripts();
});

resetBtn?.addEventListener("click", () => {
  activeCategory = null;
  searchTerm = "";
  if (searchInput) searchInput.value = "";
  renderFilters();
  renderScripts();
});

formEl?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(formEl);
  const tags = (formData.get("tags") || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const newScript = {
    id: crypto.randomUUID ? crypto.randomUUID() : `macro-${Date.now()}`,
    title: (formData.get("title") || "").trim(),
    description: (formData.get("description") || "").trim(),
    category: (formData.get("category") || "").trim() || "Прочее",
    tags,
    version: (formData.get("version") || "SolidWorks").trim(),
    status: "beta",
    link: (formData.get("link") || "").trim(),
    doc: (formData.get("doc") || "").trim(),
    complexity: "Custom",
    updated: new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date()),
  };

  scripts = [newScript, ...scripts];
  persistScripts(scripts);
  updateStatCount();
  renderFilters();
  renderScripts();
  formEl.reset();
  showSnackbar("Макрос сохранен локально");
});

renderFilters();
renderScripts();
renderTools();
updateStatCount();
