import type {ReactNode} from 'react';
import type {ManualCheckResult} from './manualCheckTypes';

export type MaterialId =
  | 'P265GH'
  | 'P355GH'
  | '16Mo3'
  | '13CrMo4-5'
  | '1.4301'
  | '1.4307'
  | '1.4404'
  | '1.4571'
  | '1.4541'
  | '1.4462'
  | '1.4539'
  | '1.4547'
  | 'SA516-70'
  | 'SA240-304L'
  | 'SA240-316L';
export type GasketMaterial = 'graphite' | 'tesnitBA50' | 'ptfe';
export type GasketFacing = 'RF' | 'FF' | 'IBC';
export type FrictionPreset = 'dry' | 'lubricated';
export type TighteningMethod = 'k_factor' | 'detailed';
export type BoltGrade = '8.8' | '10.9' | 'A2-70';
export type FastenerStandard = 'EN' | 'ASME';
export type FastenerType = 'BOLT' | 'STUD';
export type FastenerGradeId = string;

export type YieldByTemperature = Record<number, number>;

export interface MaterialDefinition {
  name: string;
  yieldByTemp: YieldByTemperature;
  density: number;
  modulusElasticity?: number; // E, MPa (default 200,000 if undefined)
}

export type MaterialCatalog = Record<MaterialId, MaterialDefinition>;

export interface FastenerCatalogEntry {
  id: string;
  label: string;
  standard: FastenerStandard;
  type: FastenerType;
  proofStressMPa: number;
  yieldStressMPa: number;
  allowableOp: number;
  allowableTest: number;
  notes?: string;
  source?: string;
  isPlaceholder?: boolean;
}

export interface En1092Dimensions {
  D: number;
  k: number;
  bolts: number;
  size: string;
  d2: number;
}

export type En1092Database = Record<number, Record<number, En1092Dimensions>>;

export interface CalculationInput {
  dn: number;
  pressureOp: number;
  pressureTest: number;
  temperature: number;
  material: MaterialId;
  corrosionAllowance: number;
  gasketMaterial: GasketMaterial;
  gasketThickness: number;
  gasketFacing: GasketFacing;
  frictionPreset: FrictionPreset;
  tighteningMethod?: TighteningMethod;
  fastenerStandard?: FastenerStandard;
  fastenerType?: FastenerType;
  fastenerGradeId?: FastenerGradeId;
  boltGrade?: BoltGrade;
}

export interface CalculationResult {
  dims: En1092Dimensions;
  selectedPN: number;
  source: 'en1092' | 'custom';
  pressureTestUsed?: number;
  pressureTestAuto?: number;
  pressureTestBasis?: string;
  pressureTestRatio?: number;
  pressureTestClamped?: boolean;
  boltTorque?: BoltTorqueResult;
  boltingSummary?: BoltingSummary;
  gasketDiameter: number;
  gasketWidth?: number;
  gasketId?: number;
  gasketOd?: number;
  allowableStressOp: number;
  allowableStressTest: number;
  minThickness: number;
  finalThickness: number;
  recommendedThickness: number;
  weight: number;
  gasketMeanDiameter: number;
  
  // New checks
  deflectionMm?: number;
  stressTestMPa?: number;
  yieldAtTestMPa?: number;
  isPlasticStable?: boolean;
}

export interface InputFormProps {
  dn: number;
  pressureOp: number;
  pressureTest: number;
  temperature: number;
  material: MaterialId;
  corrosionAllowance: number;
  gasketMaterial: GasketMaterial;
  gasketThickness: number;
  gasketFacing: GasketFacing;
  frictionPreset: FrictionPreset;
  tighteningMethod?: TighteningMethod;
  fastenerStandard: FastenerStandard;
  fastenerType: FastenerType;
  fastenerGradeId: FastenerGradeId;
  autoTestPressure?: number;
  autoTestBasis?: string;
  autoTestRatio?: number;
  autoTestClampedToOp?: boolean;
  showTestPressureWarning?: boolean;
  availableDns: number[];
  materials: MaterialCatalog;
  onDnChange: (value: number) => void;
  onPressureOpChange: (value: number) => void;
  onPressureTestChange: (value: number) => void;
  onTemperatureChange: (value: number) => void;
  onMaterialChange: (value: MaterialId) => void;
  onCorrosionAllowanceChange: (value: number) => void;
  onGasketMaterialChange: (value: GasketMaterial) => void;
  onGasketThicknessChange: (value: number) => void;
  onGasketFacingChange: (value: GasketFacing) => void;
  onFrictionPresetChange: (value: FrictionPreset) => void;
  onTighteningMethodChange: (value: TighteningMethod) => void;
  onFastenerStandardChange: (value: FastenerStandard) => void;
  onFastenerTypeChange: (value: FastenerType) => void;
  onFastenerGradeChange: (value: FastenerGradeId) => void;
}

export interface FlangeVisualizerProps {
  dn: number;
  dims?: En1092Dimensions;
  selectedPN?: number;
  recommendedThickness?: number;
  gasketMeanDiameter?: number;
  gasketId?: number;
  gasketOd?: number;
}

export interface ResultsPanelProps {
  result: CalculationResult | null;
  customResult?: CustomSizingResult | null;
  manualCheckResult?: ManualCheckResult | null;
  dn: number;
  pressureOp: number;
  targetPN: number;
  maxAvailablePN?: number;
  input: CalculationInput;
  onCustomResultChange?: (value: CustomSizingResult | null) => void;
  onManualResultChange?: (value: ManualCheckResult | null) => void;
}

export interface ResultCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  highlight?: boolean;
}

export interface CustomSizingDebug {
  boltAllowableStress: number;
  requiredBoltArea: number;
  requiredAreaSeating: number;
  requiredAreaOper: number;
  requiredAreaHydro: number;
  governingCase: 'seating' | 'operating' | 'hydrotest';
  providedBoltArea: number;
  gasketDiameter: number;
  gasketWidth: number;
  gasketId: number;
  gasketOd: number;
  gasketMaterial: GasketMaterial;
  gasketFacing: GasketFacing;
  gasketThickness: number;
  leverArm: number;
  boltCircleMinStandard?: number;
  boltCircleClamped?: boolean;
  fastenerStandard: FastenerStandard;
  fastenerType: FastenerType;
  fastenerGradeId: FastenerGradeId;
  fastenerLabel: string;
  fastenerProofStressMPa: number;
  fastenerYieldStressMPa: number;
  geometryAssumption?: string;
  pressureTestAuto?: number;
  pressureTestBasis?: string;
  pressureTestRatio?: number;
  pressureTestClamped?: boolean;
  forceOperating: number;
  forceTest: number;
  Wm1: number;
  Wm2_op: number;
  Wm2_hydro: number;
  thicknessAsme: number;
  thicknessEn: number;
  thicknessPlasticity: number;
  thicknessStiffness: number;
  governingCode: 'ASME' | 'EN' | 'Plasticity' | 'Stiffness';
  boltTorque?: BoltTorqueResult;
  boltingSummary?: BoltingSummary;
  deflectionMm: number;
  stressTestMPa: number;
}

export interface CustomSizingResult {
  result: CalculationResult;
  debug: CustomSizingDebug;
}

export interface BoltTorqueInput {
  boltDiameterMm?: number;
  boltSize?: string;
  boltStressArea?: number;
  fastenerStandard: FastenerStandard;
  fastenerType: FastenerType;
  fastenerGradeId: FastenerGradeId;
  frictionPreset: FrictionPreset;
  method: TighteningMethod;
  preloadLimitFactor?: number;
  governingCase: 'seating' | 'operating' | 'hydrotest';
  requiredPreloadPerBolt: number;
}

export interface BoltTorqueResult {
  method: TighteningMethod;
  frictionPreset: FrictionPreset;
  torqueNm: number;
  torqueMinNm?: number;
  torqueMaxNm?: number;
  preloadPerBoltN: number;
  preloadUtilization: number;
  governingCaseUsed: 'seating' | 'operating' | 'hydrotest';
  cappedByProof: boolean;
  assumptions: string[];
}

export interface BoltingSummary {
  loads: {Wm1: number; Wm2_op: number; Wm2_hydro: number};
  areas: {requiredAreaSeating: number; requiredAreaOper: number; requiredAreaHydro: number; provided: number};
  governingCase: 'seating' | 'operating' | 'hydrotest';
  boltTorque?: BoltTorqueResult;
  fastenerStandard: FastenerStandard;
  fastenerType: FastenerType;
  fastenerGradeId: FastenerGradeId;
  fastenerLabel?: string;
  proofStressMPa?: number;
  yieldStressMPa?: number;
  geometryAssumption?: string;
  fastenerIsPlaceholder?: boolean;
  fastenerNotes?: string;
  frictionPreset: FrictionPreset;
  pass: boolean;
  failureReason?: {
    case: 'seating' | 'operating' | 'hydrotest';
    requiredArea: number;
    providedArea: number;
    deltaArea: number;
  };
}