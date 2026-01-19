import {
  MATERIALS,
  STANDARD_THICKNESSES,
  getFastenerCatalogEntry,
  getFastenerEffectiveProps,
  getFastenerLabel,
  getMinStandardBoltCircle,
  isFastenerPlaceholder,
} from './data';
import {getAllowableStress, getHydroTestPressure} from './allowables';
import {
  calcRequiredBoltLoads,
  calcBoltAreaChecks,
  calcBoltTorque,
  getFastenerGeometry,
  getBoltHoleDiameter,
} from './bolting';
import {getGasketGeometry, type GasketGeometry} from './gasket';
import type {
  BoltTorqueResult,
  BoltingSummary,
  CalculationInput,
  CalculationResult,
  En1092Dimensions,
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  GasketFacing,
  GasketMaterial,
} from './bfTypes';

export type CustomPreference = 'min_weight' | 'min_bolts';

export interface CustomSizingConfig {
  fastenerStandard: FastenerStandard;
  fastenerType: FastenerType;
  fastenerGradeId: FastenerGradeId;
  preference: CustomPreference;
}

export interface CustomSizingDebug {
  boltAllowableStress: number;
  requiredBoltArea: number;
  providedBoltArea: number;
  requiredAreaSeating: number;
  requiredAreaOper: number;
  requiredAreaHydro: number;
  governingCase: 'seating' | 'operating' | 'hydrotest';
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
  governingCode: 'ASME' | 'EN';
  boltTorque?: BoltTorqueResult;
  boltingSummary?: BoltingSummary;
}

export interface CustomSizingResult {
  result: CalculationResult;
  debug: CustomSizingDebug;
}

type FailureReason = NonNullable<BoltingSummary['failureReason']>;

const buildFailureReason = (areaCheck: {
  governingCase: 'seating' | 'operating' | 'hydrotest';
  requiredAreaSeating: number;
  requiredAreaOper: number;
  requiredAreaHydro: number;
  provided: number;
  pass: boolean;
}): FailureReason | undefined => {
  if (areaCheck.pass) return undefined;
  const requiredArea =
    areaCheck.governingCase === 'seating'
      ? areaCheck.requiredAreaSeating
      : areaCheck.governingCase === 'hydrotest'
        ? areaCheck.requiredAreaHydro
        : areaCheck.requiredAreaOper;
  return {
    case: areaCheck.governingCase,
    requiredArea,
    providedArea: areaCheck.provided,
    deltaArea: requiredArea - areaCheck.provided,
  };
};

const DEFAULT_BOLT_SIZES = [
  'M16',
  'M20',
  'M24',
  'M27',
  'M30',
  'M33',
  'M36',
  'M39',
  'M42',
  'M45',
  'M48',
  'M52',
  'M56',
  'M60',
  'M64',
] as const;

const DEFAULT_BOLT_COUNTS = [4, 8, 12, 16, 20, 24, 28, 32, 36] as const;

const computeForces = (gasket: GasketGeometry, pressureOp: number, pressureTest: number) => {
  const diameterForPressure = gasket.id ?? gasket.effectiveDiameter;
  const area = Math.PI * Math.pow(diameterForPressure / 2, 2);
  const forceOperating = area * pressureOp * 0.1;
  const forceTest = area * pressureTest * 0.1;
  return {forceOperating, forceTest};
};

const calcBoltCircle = (boltCount: number, holeDiameter: number, boltDiameter: number): number => {
  const ligament = Math.max(8, boltDiameter * 0.35);
  const requiredChord = holeDiameter + ligament;
  const r = requiredChord / (2 * Math.sin(Math.PI / boltCount));
  return 2 * r;
};

const calcOuterDiameter = (boltCircle: number, holeDiameter: number, boltDiameter: number): number => {
  const edgeMargin = boltDiameter * 1.5;
  return boltCircle + 2 * (edgeMargin + holeDiameter / 2);
};

const calcThicknessUG34 = (
  gasketDiameter: number,
  leverArm: number,
  forceOperating: number,
  forceTest: number,
  allowableOp: number,
  allowableTest: number,
) => {
  // ASME VIII-1 UG-34 (bolted cover / flat head) edge moment case:
  // M = W * h_G, t = sqrt(6 * M / (pi * G * S))
  const momentOp = forceOperating * leverArm;
  const momentTest = forceTest * leverArm;
  const thicknessOp = Math.sqrt((6 * momentOp) / (Math.PI * gasketDiameter * allowableOp));
  const thicknessTest = Math.sqrt((6 * momentTest) / (Math.PI * gasketDiameter * allowableTest));
  return {thicknessOp, thicknessTest};
};

const calcThicknessEN13445 = (
  gasketDiameter: number,
  leverArm: number,
  forceOperating: number,
  forceTest: number,
  allowableOp: number,
  allowableTest: number,
) => {
  // Simplified EN 13445 flat end (bolted) approximation using a stiffness factor C_en.
  // Uses edge moment like UG-34 but with a slightly higher bending factor.
  const C_en = 0.95;
  const momentOp = forceOperating * leverArm * C_en;
  const momentTest = forceTest * leverArm * C_en;
  const thicknessOp = Math.sqrt((6 * momentOp) / (Math.PI * gasketDiameter * allowableOp));
  const thicknessTest = Math.sqrt((6 * momentTest) / (Math.PI * gasketDiameter * allowableTest));
  return {thicknessOp, thicknessTest};
};

export function getFastenerGradeLabel(gradeId: FastenerGradeId) {
  return getFastenerLabel(gradeId);
}

export function getCustomSizingFailure(
  input: CalculationInput,
  targetPN: number,
  config: CustomSizingConfig,
): FailureReason | null {
  const fastenerEntry = getFastenerCatalogEntry(config.fastenerGradeId);
  if (isFastenerPlaceholder(fastenerEntry)) return null;
  const minStandardBoltCircle = getMinStandardBoltCircle(input.dn);
  const pressureTestUsed = Math.max(input.pressureTest, input.pressureOp);
  const gasket = getGasketGeometry(
    input.dn,
    targetPN,
    input.gasketFacing,
    input.gasketThickness,
    input.gasketMaterial,
  );

  let bestFailure: FailureReason | null = null;

  for (const boltCount of DEFAULT_BOLT_COUNTS) {
    for (const boltSize of DEFAULT_BOLT_SIZES) {
      const boltGeometry = getFastenerGeometry(boltSize, config.fastenerStandard, config.fastenerType);
      const boltDiameter = boltGeometry.d;
      const holeDiameter = getBoltHoleDiameter(boltSize);
      const stressArea = boltGeometry.As;
      if (!holeDiameter || !stressArea || boltDiameter <= 0) continue;
      const effectiveFastener = getFastenerEffectiveProps(config.fastenerGradeId, boltDiameter);
      const boltAllowableStress = effectiveFastener.allowableOp;

      const boltCircleByHoles = calcBoltCircle(boltCount, holeDiameter, boltDiameter);
      const rawBoltCircle = Math.max(boltCircleByHoles, gasket.od + 12);
      const boltCircle = Math.max(rawBoltCircle, minStandardBoltCircle ?? 0);
      const gasketDiameter = gasket.effectiveDiameter;
      const leverArm = Math.max((boltCircle - gasketDiameter) / 2, 4);
      if (leverArm <= 0) continue;

      const loads = calcRequiredBoltLoads({
        effectiveDiameter: gasket.effectiveDiameter,
        effectiveWidth: gasket.effectiveWidth,
        m: gasket.m,
        y: gasket.y,
        pressureOp: input.pressureOp,
        pressureTest: pressureTestUsed,
      });
      const areaCheck = calcBoltAreaChecks({
        loads,
        allowableBolt: boltAllowableStress,
        boltCount,
        stressArea: stressArea,
      });
      const failure = buildFailureReason(areaCheck);
      if (!failure) continue;
      if (!bestFailure || failure.deltaArea < bestFailure.deltaArea) {
        bestFailure = failure;
      }
    }
  }

  return bestFailure;
}

export function calculateCustomBlindFlange(
  input: CalculationInput,
  targetPN: number,
  config: CustomSizingConfig,
): {result: CalculationResult; debug: CustomSizingDebug} | null {
  if (input.pressureOp <= 0 || input.pressureTest <= 0) return null;
  if (input.corrosionAllowance < 0) return null;

  const material = MATERIALS[input.material];
  const allowableOp = getAllowableStress(material, input.temperature, 'EN', 'operating');
  const allowableTest = getAllowableStress(material, 20, 'EN', 'test');
  const hydro = getHydroTestPressure({
    code: 'EN13445',
    P_design_bar: input.pressureOp,
    P_op_bar: input.pressureOp,
    T_design_C: input.temperature,
    T_test_C: 20,
    materialId: input.material,
  });
  const pressureTestUsed = Math.max(input.pressureTest > 0 ? input.pressureTest : hydro.P_test_bar, input.pressureOp);

  const fastenerEntry = getFastenerCatalogEntry(config.fastenerGradeId);
  if (isFastenerPlaceholder(fastenerEntry)) return null;
  const minStandardBoltCircle = getMinStandardBoltCircle(input.dn);
  const gasket = getGasketGeometry(
    input.dn,
    targetPN,
    input.gasketFacing,
    input.gasketThickness,
    input.gasketMaterial,
  );
  const gasketDiameterTarget = gasket.effectiveDiameter;

  const candidates: Array<{
    dims: En1092Dimensions;
    recommendedThickness: number;
    weight: number;
    minThickness: number;
    finalThickness: number;
    debug: CustomSizingDebug;
    boltingSummary: BoltingSummary;
    boltTorque: BoltTorqueResult | undefined;
  }> = [];

  for (const boltCount of DEFAULT_BOLT_COUNTS) {
    for (const boltSize of DEFAULT_BOLT_SIZES) {
      const boltGeometry = getFastenerGeometry(boltSize, config.fastenerStandard, config.fastenerType);
      const boltDiameter = boltGeometry.d;
      const holeDiameter = getBoltHoleDiameter(boltSize);
      const stressArea = boltGeometry.As;
      if (!holeDiameter || !stressArea || boltDiameter <= 0) continue;
      const effectiveFastener = getFastenerEffectiveProps(config.fastenerGradeId, boltDiameter);
      const boltAllowableStress = effectiveFastener.allowableOp;

      const boltCircleByHoles = calcBoltCircle(boltCount, holeDiameter, boltDiameter);
      const rawBoltCircle = Math.max(boltCircleByHoles, gasket.od + 12);
      const boltCircle = Math.max(rawBoltCircle, minStandardBoltCircle ?? 0);
      const boltCircleClamped =
        minStandardBoltCircle !== null && boltCircle === minStandardBoltCircle && minStandardBoltCircle > rawBoltCircle;
      const gasketDiameter = gasketDiameterTarget;
      const leverArm = Math.max((boltCircle - gasketDiameter) / 2, 4);

      const {forceOperating, forceTest} = computeForces(gasket, input.pressureOp, pressureTestUsed);
      const loads = calcRequiredBoltLoads({
        effectiveDiameter: gasket.effectiveDiameter,
        effectiveWidth: gasket.effectiveWidth,
        m: gasket.m,
        y: gasket.y,
        pressureOp: input.pressureOp,
        pressureTest: pressureTestUsed,
      });
      const areaCheck = calcBoltAreaChecks({
        loads,
        allowableBolt: boltAllowableStress,
        boltCount,
        stressArea: stressArea,
      });
      const {requiredAreaSeating, requiredAreaOper, requiredAreaHydro, requiredBoltArea, governingCase, provided, pass} =
        areaCheck;
      const providedBoltArea = provided;
      if (!pass) continue;

      const outerDiameter = Math.max(
        calcOuterDiameter(boltCircle, holeDiameter, boltDiameter),
        input.dn + 120,
        gasketDiameter + 100,
      );
      const {thicknessOp: tAsmeOp, thicknessTest: tAsmeTest} = calcThicknessUG34(
        gasketDiameter,
        leverArm,
        forceOperating,
        forceTest,
        allowableOp,
        allowableTest,
      );
      const {thicknessOp: tEnOp, thicknessTest: tEnTest} = calcThicknessEN13445(
        gasketDiameter,
        leverArm,
        forceOperating,
        forceTest,
        allowableOp,
        allowableTest,
      );

      const minThicknessAsme = Math.max(tAsmeOp, tAsmeTest);
      const minThicknessEn = Math.max(tEnOp, tEnTest);
      const minThickness = Math.max(minThicknessAsme, minThicknessEn);
      const governingCode = minThicknessAsme >= minThicknessEn ? 'ASME' : 'EN';

      const finalThickness = minThickness + input.corrosionAllowance;
      const recommendedThickness =
        STANDARD_THICKNESSES.find((value) => value >= finalThickness) ?? Math.ceil(finalThickness);

      const weight =
        Math.PI * Math.pow(outerDiameter / 2000, 2) * (recommendedThickness / 1000) * material.density * 1000;

      const requiredPreloadPerBolt =
        governingCase === 'seating'
          ? loads.Wm1 / boltCount
          : governingCase === 'hydrotest'
            ? loads.Wm2_hydro / boltCount
            : loads.Wm2_op / boltCount;
      const boltTorque = calcBoltTorque({
        boltDiameterMm: boltDiameter,
        boltSize,
        boltStressArea: stressArea,
        fastenerStandard: config.fastenerStandard,
        fastenerType: config.fastenerType,
        fastenerGradeId: config.fastenerGradeId,
        frictionPreset: input.frictionPreset,
        method: input.tighteningMethod ?? 'k_factor',
        governingCase,
        requiredPreloadPerBolt,
      });

      candidates.push({
        dims: {
          D: Math.round(outerDiameter),
          k: Math.round(boltCircle),
          bolts: boltCount,
          size: boltSize,
          d2: holeDiameter,
        },
        recommendedThickness,
        weight,
        minThickness,
        finalThickness,
        boltingSummary: {
          loads,
          areas: {
            requiredAreaSeating,
            requiredAreaOper,
            requiredAreaHydro,
            provided: providedBoltArea,
          },
          governingCase,
          boltTorque,
          fastenerStandard: config.fastenerStandard,
          fastenerType: config.fastenerType,
          fastenerGradeId: config.fastenerGradeId,
          fastenerLabel: fastenerEntry.label,
          proofStressMPa: effectiveFastener.proof,
          yieldStressMPa: effectiveFastener.yield,
          geometryAssumption: boltGeometry.geometryAssumption,
          fastenerIsPlaceholder: isFastenerPlaceholder(fastenerEntry),
          fastenerNotes: effectiveFastener.notes ?? fastenerEntry.notes,
          frictionPreset: input.frictionPreset,
          pass: true,
          failureReason: undefined,
        },
        debug: {
          boltAllowableStress,
          requiredBoltArea,
          requiredAreaSeating,
          requiredAreaOper,
          requiredAreaHydro,
          governingCase,
          providedBoltArea,
          gasketDiameter,
          gasketWidth: gasket.effectiveWidth,
          gasketId: gasket.id,
          gasketOd: gasket.od,
          gasketMaterial: gasket.material,
          gasketFacing: gasket.facing,
          gasketThickness: gasket.thickness,
          leverArm,
          boltCircleMinStandard: minStandardBoltCircle ?? undefined,
          boltCircleClamped,
          fastenerStandard: config.fastenerStandard,
          fastenerType: config.fastenerType,
          fastenerGradeId: config.fastenerGradeId,
          fastenerLabel: fastenerEntry.label,
          fastenerProofStressMPa: effectiveFastener.proof,
          fastenerYieldStressMPa: effectiveFastener.yield,
          geometryAssumption: boltGeometry.geometryAssumption,
          pressureTestAuto: hydro.P_test_bar,
          pressureTestBasis: hydro.basis,
          pressureTestRatio: hydro.ratioUsed,
          pressureTestClamped: hydro.clampedToOp,
          forceOperating,
          forceTest,
          Wm1: loads.Wm1,
          Wm2_op: loads.Wm2_op,
          Wm2_hydro: loads.Wm2_hydro,
          thicknessAsme: minThicknessAsme,
          thicknessEn: minThicknessEn,
          governingCode,
        },
        boltTorque,
      });
    }
  }

  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort((a, b) => {
    if (config.preference === 'min_bolts' && a.dims.bolts !== b.dims.bolts) {
      return a.dims.bolts - b.dims.bolts;
    }
    if (a.weight !== b.weight) return a.weight - b.weight;
    if (a.recommendedThickness !== b.recommendedThickness) return a.recommendedThickness - b.recommendedThickness;
    return a.dims.bolts - b.dims.bolts;
  });

  const chosen = sorted[0];
  const {dims, recommendedThickness, weight, debug, minThickness, finalThickness} = chosen;

  return {
    result: {
      dims,
      selectedPN: targetPN,
      source: 'custom',
      pressureTestUsed,
      pressureTestAuto: hydro.P_test_bar,
      pressureTestBasis: hydro.basis,
      pressureTestRatio: hydro.ratioUsed,
      pressureTestClamped: hydro.clampedToOp,
      boltTorque: chosen.boltTorque,
      boltingSummary: chosen.boltingSummary,
      gasketDiameter: gasket.effectiveDiameter,
      gasketId: gasket.id,
      gasketOd: gasket.od,
      gasketWidth: gasket.effectiveWidth,
      allowableStressOp: allowableOp,
      allowableStressTest: allowableTest,
      minThickness,
      finalThickness,
      recommendedThickness,
      weight,
      gasketMeanDiameter: gasket.effectiveDiameter,
    },
    debug: {
      ...debug,
      gasketWidth: gasket.effectiveWidth,
      gasketMaterial: gasket.material,
      gasketFacing: gasket.facing,
      gasketThickness: gasket.thickness,
      gasketId: gasket.id,
      gasketOd: gasket.od,
      thicknessAsme: debug.thicknessAsme,
      thicknessEn: debug.thicknessEn,
      governingCode: debug.governingCode,
      boltTorque: chosen.boltTorque,
      boltingSummary: chosen.boltingSummary,
    },
  };
}
