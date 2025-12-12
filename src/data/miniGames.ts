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
    description: 'Spot blueprint defects and raise NCRs in a timed mini-game for CAD QA fans.',
    tech: 'HTML5',
    tags: ['QA', 'Blueprints', 'Mini game'],
    href: '/mini-games/engineering-blueprint-ncr/',
  },
];
