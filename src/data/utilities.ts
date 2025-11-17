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
    name: 'QR nameplate generator',
    description:
      'Create serialized equipment tags with branding, safety icons, and QR/serial automation.',
    tech: 'SVG',
    standards: 'ISO 3864 · Traceability',
    features: ['Custom palette', 'Auto serial + QR', 'SVG/PNG output'],
    href: '/utilities/qr-nameplate/',
  },
];