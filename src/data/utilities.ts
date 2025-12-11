export type UtilityDescriptor = {
  id: string;
  name: string;
  description: string;
  tech: string;
  standards: string;
  features: string[];
  href: string;
};

export const utilities: UtilityDescriptor[] = [
  {
    id: 'pipe-cutter',
    name: 'Pipe Cutter Visualizer',
    description:
      'Preview saddle intersections, adjust offsets, and export DXF templates ready for CNC plasma or waterjet tables.',
    tech: 'WebGL',
    standards: 'ASME B31.3 · ISO 9606',
    features: ['Realtime 3D preview', 'DXF saddle export', 'Offset + bevel controls'],
    href: '/utilities/pipe-cutter/',
  },
  {
    id: 'shell-rolling',
    name: 'Cylindrical Shell Rolling',
    description:
      'Calculate roll spacing, bending allowance, and developed lengths with EN 13445 / ASME VIII presets.',
    tech: 'Calc',
    standards: 'EN 13445 · ASME VIII',
    features: ['Roll spacing hints', 'Printable offsets', 'Tolerance guidance'],
    href: '/utilities/cylindrical-shell-rolling/',
  },
  {
    id: 'metal-bending',
    name: 'Sheet-metal bending sandbox',
    description:
      'Simulate K-factors, reliefs, and bend deductions before locking in CAM programs or tooling.',
    tech: 'Canvas',
    standards: 'ISO 2768 · EN 10149',
    features: ['K-factor tuning', 'Press brake presets', 'Metric + inch'],
    href: '/utilities/metal-bending/',
  },
  {
    id: 'thread-atlas',
    name: 'Interactive thread atlas',
    description:
      'Filter ISO, UNC, and UNF series, reference drill diameters, and copy callouts for drawings.',
    tech: 'Data',
    standards: 'ISO 965 · UNC/UNF',
    features: ['Filterable tables', 'Drill lookup', 'Copy-ready callouts'],
    href: '/utilities/interactive-thread/',
  },
  {
    id: 'doc-parser',
    name: 'PDF number extractor',
    description:
      'Highlight QA serials, BOM IDs, and inspection numbers locally with WASM-powered parsing.',
    tech: 'WASM',
    standards: 'Offline parsing',
    features: ['Regex filters', 'CSV export', 'Works offline'],
    href: '/utilities/pdf-number-extractor/',
  },
  {
    id: 'qr-nameplate',
    name: '3D QR nameplate generator',
    description:
      'Model serialized equipment tags with QR codes, then preview thickness, materials, and engraving depth in real time.',
    tech: 'WebGL + QR',
    standards: 'Traceability - ISO 3864',
    features: ['Three.js preview', 'Material presets', 'QR + engraving texture'],
    href: '/utilities/qr-nameplate/',
  },
  {
    id: 'dxf-editor',
    name: 'WebDXF editor',
    description:
      'Trim geometry, annotate lengths, and resave DXF files directly in the browser for quick QA or macro testing.',
    tech: 'Canvas',
    standards: 'DXF R12',
    features: ['Crossing selection', 'Trim + measure', 'Offline DXF I/O'],
    href: '/utilities/dxf-editor/',
  },
  {
    id: 'pdf-master',
    name: 'PDF Master',
    description:
      'Organize drawing packs, reorder or rotate single sheets, and export a clean merged PDF locally.',
    tech: 'PDF toolkit',
    standards: 'Offline processing',
    features: [
      'Drag & drop reordering',
      'Merge multiple PDFs',
      'Rotate individual pages',
      'View pages in original file',
    ],
    href: '/utilities/pdf-master/',
  },
  {
    id: 'pdf-batch-signer',
    name: 'PDF Batch Signer',
    description:
      'Stamp a reusable signature across every page in multiple PDFs with one placement preview.',
    tech: 'PDF-lib + JSZip',
    standards: 'Local signing',
    features: ['Draw or upload signature', 'Drag placement once', 'ZIP export'],
    href: '/utilities/pdf-batch-signer/',
  },
  {
    id: 'qr-master',
    name: 'QR Master',
    description:
      'Scan QR codes and barcodes instantly, generate custom codes for links or WiFi, and manage your scan history locally.',
    tech: 'Camera + QR',
    standards: 'Offline',
    features: ['Scan QR & barcodes', 'Generate Wi-Fi/link codes', 'History with import/export', 'Smart paste & image scan'],
    href: '/utilities/qr-master/',
  },
  {
    id: 'pdf-bom-extractor',
    name: 'PDF BOM Extractor',
    description:
      'Extract BOM and specification tables from CAD PDFs into clean CSVs with optional master report export.',
    tech: 'React + PDF.js',
    standards: 'Client-side parsing',
    features: ['Smart table detection', 'Auto-trim footers/revisions', 'Per-file CSV + master report'],
    href: '/utilities/pdf-bom-extractor/',
  },
  {
    id: 'file-renamer',
    name: 'Batch File Renamer',
    description: 'Bulk rename files with find/replace, prefixes, numbering, and instant ZIP export.',
    tech: 'React',
    standards: 'Local-only',
    features: ['Regex or literal find/replace', 'Prefix/suffix + numbering', 'ZIP download with conflicts handled'],
    href: '/utilities/file-renamer/',
  },
];


