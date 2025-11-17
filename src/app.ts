interface Utility {
  id: string;
  title: string;
  description: string;
  category: UtilityCategory;
  badge: string;
  technology: string;
  tags: string[];
  features: string[];
  standard: string;
  href: string;
}

type UtilityCategory =
  | "fabrication"
  | "calculation"
  | "qa"
  | "documentation"
  | "traceability";

const utilities: Utility[] = [
  {
    id: "pipe-cutter",
    title: "Pipe Cutter Visualizer",
    description:
      "Preview saddle intersections, tweak offsets, and export DXF templates ready for CNC plasma or waterjet tables.",
    category: "fabrication",
    badge: "Pipe Cutter",
    technology: "WebGL",
    tags: ["GPU", "3D", "DXF"],
    features: ["Realtime 3D viewport", "DXF template export", "Angle + offset controls"],
    standard: "ASME B31.3 / ISO 9606",
    href: "utilities/pipe-cutter/",
  },
  {
    id: "shell-rolling",
    title: "Cylindrical Shell Rolling",
    description:
      "Calculate roll spacing, bending allowance, and developed lengths for EN 13445 / ASME VIII shells.",
    category: "calculation",
    badge: "Shell Rolling",
    technology: "Calc",
    tags: ["EN 13445", "ASME", "Rolling"],
    features: ["EN & ASME presets", "Export printable offsets", "Live tolerance hints"],
    standard: "EN 13445 / ASME VIII",
    href: "utilities/cylindrical-shell-rolling/",
  },
  {
    id: "bending",
    title: "Sheet-metal bending sandbox",
    description: "Simulate K-factors, reliefs, and bend deductions before sending toolpaths to CAM.",
    category: "fabrication",
    badge: "Bend Sandbox",
    technology: "Canvas",
    tags: ["K-factor", "Press brake", "CAM"],
    features: ["K-factor control", "Press brake presets", "Metric & inch"],
    standard: "ISO 2768 / EN 10149",
    href: "utilities/metal-bending/",
  },
  {
    id: "threads",
    title: "Interactive thread reference",
    description:
      "Browse ISO metric, UNC, and UNF threads, check drill diameters, and copy callouts for drawings.",
    category: "documentation",
    badge: "Thread Atlas",
    technology: "Data",
    tags: ["ISO", "UNC", "UNF"],
    features: ["Metric + imperial tables", "Instant drill lookups", "Copy-ready callouts"],
    standard: "ISO 965 / UNC / UNF",
    href: "utilities/interactive-thread/",
  },
  {
    id: "doc-parser",
    title: "PDF number extractor",
    description: "Highlight and export serials, BOM IDs, and QA data without uploading drawings anywhere.",
    category: "qa",
    badge: "Doc Parser",
    technology: "WASM",
    tags: ["Regex", "Offline", "CSV"],
    features: ["Local regex filters", "CSV export", "Offline friendly"],
    standard: "Offline parsing",
    href: "utilities/pdf-number-extractor/",
  },
  {
    id: "qr",
    title: "QR nameplate generator",
    description:
      "Create serialized tags with logos, safety icons, QR codes, and export polished SVG/PNG plates for printing.",
    category: "traceability",
    badge: "QR Nameplates",
    technology: "SVG",
    tags: ["QR", "Branding", "Traceability"],
    features: ["Brand palettes", "Auto serial & QR", "SVG/PNG export"],
    standard: "ISO 3864 / Traceability",
    href: "utilities/qr-nameplate/",
  },
];

const state: { filter: UtilityCategory | "all"; search: string } = {
  filter: "all",
  search: "",
};

const grid = document.querySelector<HTMLDivElement>("#utility-grid");
const searchInput = document.querySelector<HTMLInputElement>("#utility-search");
const filterGroup = document.querySelector<HTMLDivElement>("#filter-group");

const formatLabel = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

const createCard = (utility: Utility): HTMLElement => {
  const card = document.createElement("article");
  card.className = "utility-card";
  card.dataset.category = utility.category;

  const head = document.createElement("div");
  head.className = "utility-card__head";
  head.innerHTML = `<span class="badge">${utility.badge}</span><span class="chip">${utility.technology}</span>`;

  const title = document.createElement("h3");
  title.textContent = utility.title;

  const description = document.createElement("p");
  description.textContent = utility.description;

  const featureList = document.createElement("ul");
  utility.features.forEach((feature) => {
    const item = document.createElement("li");
    item.textContent = feature;
    featureList.appendChild(item);
  });

  const tagGrid = document.createElement("div");
  tagGrid.className = "tag-grid";
  utility.tags.forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    tagGrid.appendChild(span);
  });

  const footer = document.createElement("div");
  footer.className = "utility-card__footer";
  const standard = document.createElement("span");
  standard.textContent = utility.standard;
  const link = document.createElement("a");
  link.className = "button primary";
  link.href = utility.href;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Launch";
  footer.append(standard, link);

  card.append(head, title, description, featureList, tagGrid, footer);
  return card;
};

const applyFilters = () => {
  const normalizedSearch = state.search.trim().toLowerCase();
  return utilities.filter((utility) => {
    const matchesFilter = state.filter === "all" || utility.category === state.filter;
    if (!matchesFilter) {
      return false;
    }
    if (!normalizedSearch) {
      return true;
    }
    const haystack = [
      utility.title,
      utility.description,
      utility.tags.join(" "),
      utility.standard,
      utility.badge,
      utility.technology,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedSearch);
  });
};

const renderUtilities = () => {
  if (!grid) {
    return;
  }
  const visible = applyFilters();
  if (!visible.length) {
    grid.innerHTML =
      '<div class="empty-state"><p>No utilities found.</p><small>Try another filter or search.</small></div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  visible.forEach((utility) => fragment.appendChild(createCard(utility)));
  grid.replaceChildren(fragment);
};

const renderFilterGroup = () => {
  if (!filterGroup) {
    return;
  }
  filterGroup.replaceChildren();
  const categories: Array<UtilityCategory | "all"> = ["all", ...new Set(utilities.map((item) => item.category))];
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category === "all" ? "All" : formatLabel(category);
    button.setAttribute("aria-pressed", String(state.filter === category));
    button.addEventListener("click", () => {
      state.filter = category === state.filter ? "all" : category;
      renderFilterGroup();
      renderUtilities();
    });
    filterGroup.appendChild(button);
  });
};

const bindSearch = () => {
  searchInput?.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    state.search = target.value;
    renderUtilities();
  });
};

const updateStats = () => {
  const statEl = document.querySelector<HTMLElement>('[data-stat="live-tools"]');
  if (statEl) {
    statEl.textContent = String(utilities.length);
  }
};

const initGridCanvas = () => {
  const canvas = document.getElementById("grid-canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    return;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  let animationFrame = 0;
  const step = 60;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw(0);
  };

  const draw = (time: number) => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 1;
    const drift = (time / 40) % step;
    for (let x = -step; x < canvas.width + step; x += step) {
      const pos = x + drift;
      context.beginPath();
      context.moveTo(pos, 0);
      context.lineTo(pos, canvas.height);
      context.stroke();
    }
    for (let y = -step; y < canvas.height + step; y += step) {
      const pos = y + drift;
      context.beginPath();
      context.moveTo(0, pos);
      context.lineTo(canvas.width, pos);
      context.stroke();
    }
  };

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const loop = (time: number) => {
    draw(time);
    animationFrame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (prefersReducedMotion.matches) {
      draw(0);
      return;
    }
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(loop);
    }
  };

  const stop = () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  };

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  prefersReducedMotion.addEventListener("change", () => {
    stop();
    start();
  });

  resize();
  start();
};

const bootstrap = () => {
  renderFilterGroup();
  renderUtilities();
  bindSearch();
  updateStats();
  initGridCanvas();
};

bootstrap();