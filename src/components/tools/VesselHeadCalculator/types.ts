export type HeadStandard = 'DIN28011' | 'DIN28013' | 'SS895';

export type EdgePrep = 'None' | 'V-Bevel';

export type EdgePrepSide = 'single' | 'double';

export type NozzleSize =
  | 'DN15'
  | 'DN25'
  | 'DN40'
  | 'DN50'
  | 'DN80'
  | 'DN100'
  | 'DN150'
  | 'DN200'
  | 'DN300'
  | 'DN400'
  | 'DN500';

export type HeadConfig = {
  standard: HeadStandard;
  diameterOuter: number;
  thickness: number;
  straightFlange: number;
  material: string;
  pressure: number;
  temp: number;
  corrosionAllowance: number;
  edgePrep: EdgePrep;
  edgePrepSide: EdgePrepSide;
  bevelAngle: number;
  rootFace: number;
};

export type Nozzle = {
  id: string;
  size: NozzleSize;
  offset: number;
  type: string;
};

export type Tolerances = {
  daPlus: number;
  daMinus: number;
  hPlus: number;
  hMinus: number;
  ovality: number;
  thicknessMin: number;
};

export type GeometryResult = {
  R: number;
  r: number;
  h2: number;
  totalHeight: number;
  weight: number;
  blankDiameter: number;
  tolerances: Tolerances;
};
