export type Point = {x: number; y: number};

export type LayoutType = 'triangular' | 'square';
export type PartitionOrientation = 'horizontal' | 'vertical';

export type GeneratorParams = {
  boardDiameter: number;
  thickness: number;
  tubeDiameter: number;
  tubeLayout: LayoutType;
  tubePitch: number;
  edgeMargin: number;
  passCount: number;
  partitionWidth: number;
  partitionOrientation: PartitionOrientation;
};

export type HoleState = 'normal' | 'removed' | 'spacer';

export type ModifiedHole = {
  hidden?: boolean;
  diameter?: number;
};
