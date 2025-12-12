export type MiniGameDescriptor = {
  id: string;
  name: string;
  description: string;
  tech: string;
  tags: string[];
  href: string;
};

export const miniGames: MiniGameDescriptor[] = [
  {
    id: 'engineering-blueprint-ncr',
    name: 'Engineering Blueprint NCR',
    description:
      'Clear a blueprint grid without triggering NCRs—millimeter-grid Minesweeper with CAD QA stakes.',
    tech: 'HTML5',
    tags: ['QA', 'Blueprints', 'Mini game'],
    href: '/mini-games/engineering-blueprint-ncr/',
  },
];
