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
    title: 'Headless CAD via Chromium',
    description: 'Generate flat patterns and DXF files using Puppeteer, Maker.js, and automation tooling.',
    href: '/blog/headless-cad-chromium',
    tags: ['blog', 'chromium', 'dxf', 'node.js'],
  },
  {
    title: 'LLMs in Mechanical Engineering workflow',
    description: 'Use GPT, Claude, or Llama to control CAD APIs, parse drawings, and build prompt templates.',
    href: '/blog/2025/12/02/LLM%20in%20Mechanical%20Engineering%20Workflow-blog-post',
    tags: ['blog', 'llm', 'solidworks', 'automation'],
  },
];

export const searchIndex: SearchRecord[] = [...utilityRecords, ...blogRecords];
