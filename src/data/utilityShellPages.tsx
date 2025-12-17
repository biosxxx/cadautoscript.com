import type {ReactNode} from 'react';

export type UtilityPageSlug =
  | 'pipe-cutter'
  | 'cylindrical-shell-rolling'
  | 'metal-bending'
  | 'interactive-thread'
  | 'pdf-number-extractor'
  | 'pdf-batch-signer'
  | 'qr-nameplate'
  | 'dxf-editor'
  | 'pdf-master'
  | 'qr-master'
  | 'pdf-bom-extractor'
  | 'file-renamer'
  | 'folder-structure-builder'
  | 'magnetic-level-gauge-configurator';

export type UtilityPageConfig = {
  slug: UtilityPageSlug;
  title: string;
  subtitle: string;
  description: string;
  about: ReactNode;
  tags: string[];
  note?: ReactNode;
  features?: string[];
  scriptType?: 'module' | 'defer';
  reactionSlug?: string;
};

export const utilityPageConfigs: Record<UtilityPageSlug, UtilityPageConfig> = {
  'pipe-cutter': {
    slug: 'pipe-cutter',
    title: 'Pipe Cutter Visualizer',
    subtitle: 'Web utility — 3D joint preview for tube cutting',
    description:
      'Preview saddle intersections, adjust offsets, and export DXF templates ready for CNC plasma or waterjet tables.',
    about:
      'Visualize saddle cuts for pipe-to-pipe intersections, tweak wall thickness, angles, and offsets, and export the developed contour for CNC plasma or handheld cutting.',
    tags: ['Piping', '3D preview', 'Fabrication'],
    note: 'The embedded Three.js scene stays local. Use screenshots or exported DXF files for shop travellers.',
    scriptType: 'module',
  },
  'cylindrical-shell-rolling': {
    slug: 'cylindrical-shell-rolling',
    title: 'Cylindrical Shell Rolling Calculator',
    subtitle: 'Web utility — Plate rolling setup helper',
    description:
      'Estimate roll spacing, bending allowance, and developed length for cylindrical shells with EN 13445 / ASME VIII presets.',
    about:
      'Estimate roll positions, bending allowance, and developed length for cylindrical shells. Use it to prep CNC roll data for EN 13445 / ASME VIII pressure shell jobs and export the parameters for documentation.',
    tags: ['Plate rolling', 'Pressure vessels', 'EN 13445'],
    note: 'Runs entirely in the browser. Numbers stay on your device until you save them manually.',
    scriptType: 'module',
  },
  'metal-bending': {
    slug: 'metal-bending',
    title: 'Metal Bending Prototype',
    subtitle: 'Web utility — K-factor playground',
    description:
      'Model flange lengths, neutral axis positions, and bend deductions for sheet metal before locking CAM or tooling.',
    about:
      'Model flange lengths, neutral axis positions, and bend deductions for sheet-metal jobs. Adjust tooling data to keep fabrication in sync with ISO 2768 / ANSI Y14.5 tolerance blocks.',
    tags: ['Sheet metal', 'K-factor', 'Bend deduction'],
    note:
      'Export the calculated allowances to spreadsheets or copy the summary into SolidWorks configurations to keep downstream teams aligned.',
    scriptType: 'module',
  },
  'interactive-thread': {
    slug: 'interactive-thread',
    title: 'Interactive Thread Cheat Sheet',
    subtitle: 'Web utility — ISO/UNC/UNF visual lookup',
    description:
      'Filter ISO, UNC, and UNF series, reference drill diameters, and copy callouts for drawings directly from the browser.',
    about:
      'Quickly compare metric and imperial thread forms, pull recommended drill sizes, and copy callouts for CAD drawings or manufacturing travellers.',
    tags: ['ISO 965', 'UNC / UNF', 'Fasteners'],
    note: 'Use search and filters inside the utility to jump between coarse, fine, or custom pitch values.',
    scriptType: 'module',
  },
  'pdf-number-extractor': {
    slug: 'pdf-number-extractor',
    title: 'PDF Number Extractor',
    subtitle: 'Web utility — Pull IDs directly from PDFs',
    description:
      'Highlight QA serials, BOM IDs, and inspection numbers locally with WASM-powered parsing. No uploads, no queues.',
    about:
      'Drop production PDFs or test reports, highlight numeric strings, and export BOM IDs or drawing references without uploading documents to external services.',
    tags: ['PDF parsing', 'Quality records', 'Offline'],
    note: 'Files never leave your browser. Close the tab to clear the buffer or save the extracted list as CSV.',
    scriptType: 'module',
  },
  'qr-nameplate': {
    slug: 'qr-nameplate',
    title: 'QR Nameplate Generator',
    subtitle: 'Web utility — Serialize equipment tags',
    description:
      'Model serialized QR-enabled equipment tags with adjustable materials, engraving depths, and branding layers.',
    about:
      'Create QR-enabled nameplates with logos, asset metadata, and safety messaging. Export high-resolution PNG/SVG graphics ready for laser marking or UV printing.',
    tags: ['Traceability', 'QR codes', 'Branding'],
    note:
      'Supports Latin and Cyrillic character sets. Update contents on the fly and send the image directly to documentation systems.',
    scriptType: 'module',
  },
  'pdf-batch-signer': {
    slug: 'pdf-batch-signer',
    title: 'PDF Batch Signer',
    subtitle: 'Stamp a reusable signature across multiple PDFs at once.',
    description:
      'Upload drawings, design one signature, drag its placement, and export a ZIP of signed PDFs without leaving the browser.',
    about:
      'Build a signature by sketching, typing, or uploading a scan, position it on a live PDF preview, and apply it to every page in your stack. Optional Gemini analysis can read title blocks to prefill metadata when you provide your own API key.',
    tags: ['PDF', 'Signatures', 'Offline'],
    note: 'Signing runs locally with pdf-lib and JSZip. Gemini title-block extraction is opt-in and uses your key client-side.',
    features: [
      'Multi-file upload with per-file metadata',
      'Drag + resize placement synced to every page',
      'ZIP export of signed PDFs',
      'Optional Gemini title-block extraction',
    ],
    scriptType: 'module',
  },
  'dxf-editor': {
    slug: 'dxf-editor',
    title: 'WebDXF Editor',
    subtitle: 'Browser CAD — Trim, annotate, and export DXF geometry',
    description:
      'Trim geometry, annotate lengths, and resave DXF files directly in the browser for quick QA or macro testing.',
    about:
      'Upload DXF drawings, perform trim or measurement edits, and save changes back to DXF without leaving the browser. Gimbal-style zoom, crossing selection, and snapping mirror the desktop workflow.',
    tags: ['DXF', 'Trim', 'Measurement'],
    note:
      'Works entirely client-side. Use it for quick edits, QA markups, or to test snippets generated by CAD macros.',
    scriptType: 'module',
  },
  'pdf-master': {
    slug: 'pdf-master',
    title: 'PDF Master',
    subtitle: 'Mix, merge, rotate, and reorganize PDF pages in the browser.',
    description:
      'Organize drawing packs, reorder or rotate individual sheets, and export a clean merged PDF before shop release.',
    about:
      'PDF Master is a drag-and-drop command center for wrangling drawing packages before shop release. Blend multiple source files, reorder or rotate single sheets, and create a clean package without leaving the browser.',
    tags: ['PDF curation', 'Offline', 'QA packs'],
    note: (
      <>
        Processing happens locally through <abbr title="WebAssembly">WASM</abbr> powered libraries—
        no uploads, no queue times, and no vendor lock-in.
      </>
    ),
    features: [
      'Drag & drop reordering',
      'Merge multiple PDFs',
      'Rotate individual pages',
      'View pages inside their original file',
    ],
    scriptType: 'defer',
  },
  'qr-master': {
    slug: 'qr-master',
    title: 'QR Master',
    subtitle: 'Scan QR, barcodes, or generate Wi-Fi/link codes locally.',
    description:
      'Scan QR codes and barcodes instantly, generate custom codes for links or WiFi, and manage your scan history locally.',
    about:
      'QR Master pairs live camera scanning with paste/upload workflows, so you can read QR codes and barcodes, generate Wi-Fi or contact codes, and keep everything in a local history with import/export.',
    tags: ['QR', 'Barcode', 'Offline'],
    note: 'Camera, paste, and file scans run locally. History stays in your browser and can be exported as JSON.',
    features: [
      'Live QR + barcode scan with camera',
      'Paste or image upload scanning',
      'Generate Wi-Fi, link, or contact codes',
      'Local history with import/export',
    ],
    scriptType: 'module',
  },
  'pdf-bom-extractor': {
    slug: 'pdf-bom-extractor',
    title: 'PDF BOM Extractor',
    subtitle: 'Web utility - Pull BOM and spec tables into CSV',
    description:
      'Extract BOM and specification tables from vector PDFs into clean CSVs, batch-downloadable locally.',
    about:
      'Drop CAD-generated PDFs (SolidWorks, AutoCAD, etc.) and automatically detect headers/columns, trim revision/footer noise, review rows, and export either per-file CSVs or a merged master report.',
    tags: ['PDF', 'BOM', 'CSV'],
    note: 'Runs 100% in the browser with PDF.js. Drawings and extracted data stay on your device.',
    features: [
      'Smart header + column detection (no OCR)',
      'Auto-trim revision tables and footer notes',
      'Batch upload with per-file CSV or master report export',
    ],
    scriptType: 'module',
  },
  'file-renamer': {
    slug: 'file-renamer',
    title: 'Batch File Renamer',
    subtitle: 'Web utility - Bulk rename and export as ZIP',
    description:
      'Rename files in bulk with find/replace, prefixes, casing, numbering, and instant ZIP download-all locally.',
    about:
      'Upload multiple files, preview automatic renames with regex or literal find/replace, add prefixes/suffixes, change casing, apply numbering, and download the renamed set as a ZIP without sending files anywhere.',
    tags: ['Files', 'Rename', 'Offline'],
    note: 'Runs fully client-side. ZIP creation and name conflict handling stay in your browser.',
    features: ['Regex or literal find/replace', 'Prefix/suffix + numbering', 'ZIP download with conflict handling'],
    scriptType: 'module',
  },
  'folder-structure-builder': {
    slug: 'folder-structure-builder',
    title: 'Folder Structure Builder',
    subtitle: 'Web utility - Plan a scaffold, export scripts, and download ZIPs',
    description:
      'Design folder trees from scratch or imports, then export ready-to-run bash/PowerShell scripts, JSON presets, or a ZIP scaffold.',
    about:
      'Map out project folder structures quickly, import an existing layout from JSON or ZIP, and export bash or PowerShell scripts that recreate the same scaffold on any machine. Everything runs locally in the browser.',
    tags: ['Folders', 'Scaffold', 'Offline'],
    note: 'Imports stay on your device. Download JSON or ZIP outputs to share presets with your team.',
    features: ['Add folders/files inline', 'Import JSON or ZIP trees', 'Export bash/PowerShell scripts', 'Download ZIP scaffold or JSON preset'],
    scriptType: 'module',
  },
  'magnetic-level-gauge-configurator': {
    slug: 'magnetic-level-gauge-configurator',
    title: 'Magnetic Level Gauge Configurator',
    subtitle: 'Web utility - Configure MLG specs and export datasheets',
    description:
      'Configure magnetic level gauge dimensions, connections, and options with a live sketch and PDF datasheet export.',
    about:
      'Set process connections, vent/drain options, materials, and project data, then export a PDF technical datasheet with a preliminary sketch.',
    tags: ['Instrumentation', 'Datasheets', 'Piping'],
    note: 'Runs entirely in the browser. The PDF is generated locally when you export the data sheet.',
    features: [
      'Process connection presets (DIN, ANSI, weld/thread)',
      'Live SVG preview for key dimensions',
      'PDF export with specs and sketch',
    ],
    scriptType: 'module',
  },
};
