import type {ReactNode} from 'react';

export type MiniGameSlug = 'engineering-blueprint-ncr';

export type MiniGamePageConfig = {
  slug: MiniGameSlug;
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

export const miniGamePageConfigs: Record<MiniGameSlug, MiniGamePageConfig> = {
  'engineering-blueprint-ncr': {
    slug: 'engineering-blueprint-ncr',
    title: 'Engineering Blueprint NCR',
    subtitle: 'Mini game - CAD Minesweeper: NCR Avoidance Protocol',
    description:
      'DWG NO: MS-2024-ENG · REV: 0.1 — Clear the drafting grid without triggering NCRs in this blueprint-themed Minesweeper.',
    about: (
      <>
        <strong>Operational Directive:</strong> Execute a design review of the schematic. Clear all sectors of the
        millimeter drafting grid without tripping a Non-Conformance Report.
        <br />
        <br />
        <strong>Technical Specs:</strong> High-contrast blueprint UI with ISO-style type; hazards are critical design
        flaws (NCRs); use HOLD markers (flags) based on proximity counts; pass only with 100% clearance and zero NCRs.
        <br />
        <br />
        <strong>Warning:</strong> Touching a hidden defect triggers immediate rejection and a Critical Failure Report.
      </>
    ),
    tags: ['Mini game', 'Blueprints', 'QA'],
    note: 'Runs locally in your browser. No sign-in or uploads required.',
    features: [
      'Blueprint grid with NCR hazards',
      'HOLD markers (flags) and proximity counts',
      'Instant fail on defect contact',
    ],
    scriptType: 'defer',
  },
};
