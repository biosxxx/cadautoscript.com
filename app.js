const storageKey = "cadAutoScript:scripts:v2";

const defaultScripts = [
  {
    id: "bom-pdf",
    title: "BOM to PDF with branding",
    description:
      "Builds a bill of materials from an assembly, applies department branding, and exports a PDF packet aligned with EN ISO 16792 and ASME Y14.100 drawing practices.",
    category: "Reports",
    tags: ["BOM", "PDF", "report"],
    version: "SolidWorks 2023",
    status: "stable",
    link: "https://example.com/bom-pdf",
    doc: "https://example.com/bom-doc",
    complexity: "VBA • 40 lines",
    updated: "March 2024",
  },
  {
    id: "sheet-metal",
    title: "Sheet-metal DXF export",
    description:
      "Automates flat pattern export to DXF with filenames based on project ID and thickness while following ISO 9013 tolerances for laser/plasma cutting.",
    category: "Manufacturing",
    tags: ["DXF", "sheet metal", "CAM"],
    version: "SolidWorks 2022",
    status: "stable",
    link: "https://example.com/sheet-metal",
    doc: "https://example.com/sheet-manual",
    complexity: "C# Add-in",
    updated: "January 2024",
  },
  {
    id: "drawing-check",
    title: "Drawing compliance checker",
    description:
      "Verifies title blocks, fonts, and revision tables against ISO 7200 / ASME Y14.35 workflows, highlighting anything that breaks company CAD governance.",
    category: "Drawings",
    tags: ["QC", "ISO 7200", "drafting"],
    version: "SolidWorks 2024",
    status: "beta",
    link: "https://example.com/drawing-check",
    doc: "https://example.com/iso-guide",
    complexity: "VSTA • 60 lines",
    updated: "April 2024",
  },
  {
    id: "configurator",
    title: "Configuration builder",
    description:
      "Generates configurations from Excel tables, drives equations, and publishes STEP bundles so purchasing can reference EN 10204 and ASTM certificates.",
    category: "Automation",
    tags: ["config", "excel", "step"],
    version: "SolidWorks 2021",
    status: "stable",
    link: "https://example.com/configurator",
    doc: "https://example.com/config-doc",
    complexity: "VBA • 55 lines",
    updated: "September 2023",
  },
  {
    id: "sim-report",
    title: "Simulation summary report",
    description:
      "Collects stress plots and creates a PDF summary referencing EN 13445 and ASME VIII design check sections for management review.",
    category: "Analytics",
    tags: ["simulation", "stress", "pdf"],
    version: "SolidWorks 2023",
    status: "stable",
    link: "https://example.com/sim-report",
    doc: "https://example.com/sim-doc",
    complexity: "C# + API",
    updated: "February 2024",
  },
  {
    id: "revision-pack",
    title: "Revision deliverable pack",
    description:
      "Renumbers revisions, updates stamps, and generates PDF/DXF/STEP deliverables for suppliers with EN 1090 traceability metadata.",
    category: "Manufacturing",
    tags: ["revision", "pdf", "step"],
    version: "SolidWorks 2020",
    status: "stable",
    link: "https://example.com/revision-pack",
    doc: "https://example.com/revision-guide",
    complexity: "VBA • 35 lines",
    updated: "December 2023",
  },
  {
    id: "part-library",
    title: "Standard part library builder",
    description:
      "Imports fastener lists from PLM, builds parametric libraries with filters for DIN/ISO/ANSI codes, and syncs to shared vaults.",
    category: "Automation",
    tags: ["library", "PLM", "CSV"],
    version: "SolidWorks 2024",
    status: "beta",
    link: "https://example.com/part-library",
    doc: "https://example.com/library-doc",
    complexity: "Python API",
    updated: "May 2024",
  },
  {
    id: "eco-dashboard",
    title: "Environmental impact dashboard",
    description:
      "Calculates material mass, generates Excel reports aligned with ISO 14040, and links to REACH/RoHS compliance sheets.",
    category: "Reports",
    tags: ["eco", "excel", "ISO"],
    version: "SolidWorks 2022",
    status: "stable",
    link: "https://example.com/eco",
    doc: "https://example.com/eco-doc",
    complexity: "Excel + VBA",
    updated: "November 2023",
  },
];

const webTools = [
  {
    title: "Tolerance report generator",
    description:
      "Builds PDF inspection sheets with key characteristics, tolerances per ISO 286 / ASME Y14.5, and QR codes that link to 3D models.",
    badge: "Tolerance Lab",
    link: "https://example.com/tolerance",
    metrics: ["5 min release", "ISO 286"],
  },
  {
    title: "Welded frame mass calculator",
    description:
      "Estimates weight, center of gravity, and machining budgets for frames based on EN 1090 and AWS D1.1 load cases.",
    badge: "Fabrix Tool",
    link: "https://example.com/frame-mass",
    metrics: ["Structural steel", "CSV export"],
  },
  {
    title: "ERP specification validator",
    description:
      "Compares BOM data with ERP, flags duplicates, and exports purchase plans while mapping UNSPSCs and ECCN attributes.",
    badge: "ERP Sync",
    link: "https://example.com/erp-sync",
    metrics: ["XML/JSON", "REST API"],
  },
  {
    title: "Test report generator",
    description:
      "Fills Word templates, attaches charts, and publishes findings to Confluence with EN ISO 7500-1 compliant traceability.",
    badge: "Test Pilot",
    link: "https://example.com/test-report",
    metrics: ["Word DOCX", "Atlassian API"],
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
    console.warn("LocalStorage read error", error);
    return [];
  }
};

const persistScripts = (items) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch (error) {
    console.warn("LocalStorage write error", error);
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
  filtersEl.appendChild(createChip("All disciplines", null));
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
      ? `<a class="button ghost" href="${script.doc}" target="_blank" rel="noopener">Docs</a>`
      : "";
  const actionLink =
    script.link && script.link.length
      ? `<a class="button primary" href="${script.link}" target="_blank" rel="noopener">Open</a>`
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
        <p>No macros for the selected filters.</p>
        <small>Try another discipline or add your macro through the form.</small>
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
          <a class="button primary" href="${tool.link}" target="_blank" rel="noopener">Open</a>
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
    category: (formData.get("category") || "").trim() || "General",
    tags,
    version: (formData.get("version") || "SolidWorks").trim(),
    status: "beta",
    link: (formData.get("link") || "").trim(),
    doc: (formData.get("doc") || "").trim(),
    complexity: "Custom",
    updated: new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date()),
  };

  scripts = [newScript, ...scripts];
  persistScripts(scripts);
  updateStatCount();
  renderFilters();
  renderScripts();
  formEl.reset();
  showSnackbar("Macro stored locally");
});

renderFilters();
renderScripts();
renderTools();
updateStatCount();
