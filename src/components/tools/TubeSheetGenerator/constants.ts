import type {GeneratorParams} from './types';

export const DEFAULT_PARAMS: GeneratorParams = {
  boardDiameter: 500,
  thickness: 50,
  tubeDiameter: 25,
  tubeLayout: 'triangular',
  tubePitch: 32,
  edgeMargin: 15,
  passCount: 2,
  partitionWidth: 10,
  partitionOrientation: 'horizontal',
};

export const SPACER_SCALE = 1.15;
