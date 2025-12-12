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
    subtitle: 'Mini game - Find defects and raise NCRs',
    description: 'Practice blueprint QA by spotting issues and raising NCRs before the clock runs out.',
    about:
      'Test your blueprint QA instincts. Scan sheets, spot issues, and raise NCRs in a timed mini-game inspired by real-world CAD review workflows.',
    tags: ['Mini game', 'Blueprints', 'QA'],
    note: 'Runs locally in your browser. No sign-in or uploads required.',
    features: ['Timed blueprint review', 'NCR scoring', 'Lightweight HTML5 build'],
    scriptType: 'defer',
  },
};
