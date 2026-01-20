import type {
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  FrictionPreset,
  GasketFacing,
  GasketMaterial,
  TighteningMethod,
} from './bfTypes';
import type {BoltTorqueResult} from './bfTypes';

export type ManualMode = 'auto' | 'manual';

export interface ManualCheckInput {
  boltCircle: number; // k, mm
  boltCount: number;
  boltHoleDiameter: number; // d2, mm
  outerDiameter: number; // OD, mm
  thickness: number; // plate thickness incl. CA, mm
  boltSize: string; // e.g. M24
  corrosionAllowance?: number;
  fastenerStandard: FastenerStandard;
  fastenerType: FastenerType;
  fastenerGradeId: FastenerGradeId;
  frictionPreset: FrictionPreset;
  tighteningMethod?: TighteningMethod;
  gasketId?: number;
  gasketOd?: number;
  gasketMaterial?: GasketMaterial;
  gasketFacing?: GasketFacing;
  gasketThickness?: number;
}

export interface ManualThicknessSummary {
  requiredAsmeOp: number;
  requiredAsmeTest: number;
  requiredEnOp: number;
  requiredEnTest: number;
  requiredPlasticity: number; // New: prevents permanent deformation
  requiredStiffness: number;  // New: prevents excessive bowing
  governingCode: 'ASME' | 'EN' | 'Plasticity' | 'Stiffness';
  requiredWithCA: number;
  provided: number;
  utilization: number;
  pass: boolean;
}

export interface ManualBoltSummary {
  loads: {Wm1: number; Wm2_op: number; Wm2_hydro: number};
  areas: {
    requiredAreaSeating: number;
    requiredAreaOper: number;
    requiredAreaHydro: number;
    provided: number;
    utilizationSeating: number;
    utilizationOper: number;
    utilizationHydro: number;
  };
  governingCase: 'seating' | 'operating' | 'hydrotest';
  pass: boolean;
  failureReason?: {
    case: 'seating' | 'operating' | 'hydrotest';
    requiredArea: number;
    providedArea: number;
    deltaArea: number;
  };
  torque?: BoltTorqueResult;
  fastenerLabel?: string;
  fastenerNotes?: string;
  fastenerIsPlaceholder?: boolean;
  geometryAssumption?: string;
}

export interface ManualGasketSummary {
  gasketMeanDiameter: number;
  gasketWidth: number;
  gasketId?: number;
  gasketOd?: number;
  m: number;
  y: number;
  facing?: GasketFacing;
  material?: GasketMaterial;
  thickness?: number;
  Wm1: number;
  Wm2_op: number;
  Wm2_hydro: number;
}

export interface ManualGeometryCheck {
  edgeOk: boolean;
  spacingOk: boolean;
  gasketOk: boolean;
  notes: string[];
}

export interface ManualStressCheck {
  stressTestMPa: number;
  yieldAtTestMPa: number;
  pass: boolean;
}

export interface ManualDeflectionCheck {
  deflectionOpMm: number;
  limitMm: number;
  pass: boolean;
}

export interface ManualCheckResult {
  pass: boolean;
  errors: string[];
  geometry: ManualGeometryCheck;
  manualInput?: ManualCheckInput;
  boltSummary?: ManualBoltSummary;
  thicknessSummary?: ManualThicknessSummary;
  gasketSummary?: ManualGasketSummary;
  stressCheck?: ManualStressCheck;
  deflectionCheck?: ManualDeflectionCheck;
  governingCase?: 'seating' | 'operating' | 'hydrotest';
  governingCode?: 'ASME' | 'EN' | 'Plasticity' | 'Stiffness';
  pressureTestUsed?: number;
  pressureTestAuto?: number;
  pressureTestBasis?: string;
  pressureTestRatio?: number;
  pressureTestClamped?: boolean;
}
