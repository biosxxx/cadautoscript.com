import type {EdgePrep, EdgePrepSide, HeadConfig, HeadStandard, NozzleSize} from './types';

export const APP_VERSION = '0.1.3b';

export const STANDARDS: HeadStandard[] = ['DIN28011', 'DIN28013', 'SS895'];

export const MATERIALS = [
  'P265GH (1.0425)',
  'P295GH (1.0481)',
  '16Mo3 (1.5415)',
  'P355NH (1.0565)',
  'Stainless 304L (1.4307)',
  'Stainless 316L (1.4404)',
  'Duplex 2205 (1.4462)',
  'Titanium Gr.2',
];

export const NOZZLE_SIZES: NozzleSize[] = [
  'DN15',
  'DN25',
  'DN40',
  'DN50',
  'DN80',
  'DN100',
  'DN150',
  'DN200',
  'DN300',
  'DN400',
  'DN500',
];

export const EDGE_PREP_OPTIONS: Array<{value: EdgePrep; label: string}> = [
  {value: 'None', label: 'None (Square Cut)'},
  {value: 'V-Bevel', label: 'V-Bevel (Outside)'},
];

export const EDGE_PREP_SIDES: Array<{value: EdgePrepSide; label: string}> = [
  {value: 'single', label: 'Single side'},
  {value: 'double', label: 'Double side'},
];

export const DEFAULT_CONFIG: HeadConfig = {
  standard: 'DIN28011',
  diameterOuter: 1000,
  thickness: 8,
  straightFlange: 40,
  material: 'P265GH (1.0425)',
  pressure: 10,
  temp: 20,
  corrosionAllowance: 1,
  edgePrep: 'None',
  edgePrepSide: 'single',
  bevelAngle: 30,
  rootFace: 2,
};
