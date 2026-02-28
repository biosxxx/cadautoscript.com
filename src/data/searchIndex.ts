import {utilities} from './utilities';

export type SearchRecord = {
  title: string;
  description: string;
  href: string;
  tags: string[];
};

const utilityRecords: SearchRecord[] = utilities.map((utility) => ({
  title: utility.name,
  description: utility.description,
  href: utility.href,
  tags: ['utility', utility.tech, utility.standards]
    .concat(utility.features.slice(0, 2))
    .map((value) => value.toLowerCase()),
}));

const blogRecords: SearchRecord[] = [
  {
    title: 'Beyond Chatbots: LLMs in the Engineering Workflow (Expanded)',
    description:
      'Expanded practical guide for integrating LLMs across CAD, electrical, automation, project, and hardware workflows.',
    href: '/blog/llm-engineering-workflow-expanded',
    tags: ['blog', 'llm', 'ai', 'cad', 'automation', 'python'],
  },
  {
    title: 'Headless CAD via Chromium',
    description: 'Generate flat patterns and DXF files using Puppeteer, Maker.js, and automation tooling.',
    href: '/blog/headless-cad-chromium',
    tags: ['blog', 'chromium', 'dxf', 'node.js'],
  },
  {
    title: 'Excalidraw: a virtual napkin for engineers',
    description:
      'Use Excalidraw for rapid engineering diagrams, logic sketches, and collaborative drafts without heavyweight tooling.',
    href: '/blog/excalidraw-virtual-napkin',
    tags: ['blog', 'automation', 'cad', 'diagrams'],
  },
  {
    title: 'FreeCAD 1.x: the "king" of open-source CAD',
    description:
      'Assessment of FreeCAD 1.x strengths, limits, and where it approaches commercial CAD in practical workflows.',
    href: '/blog/freecad-1x-open-source-cad',
    tags: ['blog', 'cad', 'automation', 'release'],
  },
  {
    title: 'LLMs in Mechanical Engineering workflow',
    description: 'Use GPT, Claude, or Llama to control CAD APIs, parse drawings, and build prompt templates.',
    href: '/blog/ai-engineering-workflow',
    tags: ['blog', 'llm', 'solidworks', 'automation'],
  },
];

export const searchIndex: SearchRecord[] = [...utilityRecords, ...blogRecords];
