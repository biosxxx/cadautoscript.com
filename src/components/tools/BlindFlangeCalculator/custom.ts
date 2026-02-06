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
  CustomSizingResult,
  En1092Dimensions,
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  GasketFacing,
  GasketMaterial,
  CustomSizingDebug,
} from './bfTypes';

export type CustomPreference = 'min_weight' | 'min_bolts';
export type {CustomSizingDebug, CustomSizingResult};

export interface CustomSizingConfig {
  fastenerStandard: FastenerStandard;
  fastenerType: FastenerType;
  fastenerGradeId: FastenerGradeId;
  preference: CustomPreference;
}

type FailureReason = NonNullable<BoltingSummary['failureReason']>;

const BAR_TO_MPA = 0.1;

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

// --- Physics Formulas (Cleaned up & Parameterized) ---

// 1. Calculate max deflection at center (Simply supported model for conservative check)
const calcPlateDeflection = (
  pressureMPa: number,
  radiusMm: number,
  thicknessMm: number,
  modulusMPa: number,
  nu: number = 0.3
): number => {
  if (thicknessMm <= 0 || radiusMm <= 0) return 999;
  // Rigidity D = (E * t^3) / (12 * (1 - nu^2))
  const D = (modulusMPa * Math.pow(thicknessMm, 3)) / (12 * (1 - Math.pow(nu, 2)));
  // w = ((5 + nu) * P * R^4) / (64 * D * (1 + nu))
  const num = (5 + nu) * pressureMPa * Math.pow(radiusMm, 4);
  const den = 64 * D * (1 + nu);
  return num / den;
};

// 2. Calculate bending stress at center
const calcPlateStress = (
  pressureMPa: number,
  radiusMm: number,
  thicknessMm: number,
  nu: number = 0.3
): number => {
  if (thicknessMm <= 0 || radiusMm <= 0) return 999;
  // Sigma = (3 * P * R^2 * (3 + nu)) / (8 * t^2)
  return (3 * pressureMPa * Math.pow(radiusMm, 2) * (3 + nu)) / (8 * Math.pow(thicknessMm, 2));
};

// 3. Inverse: Calculate required thickness to limit stress (Plasticity check)
const calcThickForStress = (
  pressureMPa: number,
  radiusMm: number,
  limitStressMPa: number,
  nu: number = 0.3
): number => {
  if (limitStressMPa <= 0 || radiusMm <= 0 || pressureMPa < 0) return 0; // Fixed: return 0 instead of 999 to avoid breaking Math.max if invalid
  // t = sqrt( (3 * P * R^2 * (3 + nu)) / (8 * Sigma_limit) )
  const res = Math.sqrt((3 * pressureMPa * Math.pow(radiusMm, 2) * (3 + nu)) / (8 * limitStressMPa));
  return isNaN(res) ? 0 : res;
};

// 4. Inverse: Calculate required thickness to limit deflection (Stiffness check)
const calcThickForDeflection = (
  pressureMPa: number,
  radiusMm: number,
  limitMm: number,
  modulusMPa: number,
  nu: number = 0.3
): number => {
  if (limitMm <= 0 || radiusMm <= 0 || pressureMPa < 0) return 0;
  // Formula derived from w = ... solving for t
  const num = (5 + nu) * pressureMPa * Math.pow(radiusMm, 4) * 12 * (1 - Math.pow(nu, 2));
  const den = 64 * modulusMPa * limitMm * (1 + nu);
  const res = Math.cbrt(num / den); // Use Math.cbrt for better precision/clarity
  return isNaN(res) ? 0 : res;
};

// --- Standard Calculation Helpers ---

const computeForces = (gasket: GasketGeometry, pressureOp: number, pressureTest: number) => {
  const diameterForPressure = gasket.id ?? gasket.effectiveDiameter;
  const area = Math.PI * Math.pow(diameterForPressure / 2, 2);
  const forceOperating = area * pressureOp * BAR_TO_MPA;
  const forceTest = area * pressureTest * BAR_TO_MPA;
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

// Used for "why it failed" tooltips in UI
export function getCustomSizingFailure(
  input: CalculationInput,
  targetPN: number,
  config: CustomSizingConfig,
): FailureReason | null {
  const fastenerEntry = getFastenerCatalogEntry(config.fastenerGradeId);
  if (isFastenerPlaceholder(fastenerEntry)) return null;
  const minStandardBoltCircle = getMinStandardBoltCircle(input.dn);
  const hydro = getHydroTestPressure({
    code: 'EN13445',
    P_design_bar: input.pressureOp,
    P_op_bar: input.pressureOp,
    T_design_C: input.temperature,
    T_test_C: 20,
    materialId: input.material,
  });
  const pressureTestUsed = Math.max(input.pressureTest > 0 ? input.pressureTest : hydro.P_test_bar, input.pressureOp);
  
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

  const materialDef = MATERIALS[input.material];
  const allowableOp = getAllowableStress(materialDef, input.temperature, 'EN', 'operating');
  const allowableTest = getAllowableStress(materialDef, 20, 'EN', 'test');
  
  // Plasticity & Stiffness Params (Default to standard values if missing)
  const yieldAt20 = materialDef.yieldByTemp[20] ?? 200;
  const modulusElasticity = materialDef.modulusElasticity ?? 200000;
  const nu = 0.3; // Poisson's ratio for steel (standard)
  const deflectionLimitMm = 1.0; // Hardcoded safety limit for auto-sizing

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

      // --- Thickness Calculations ---
      // 1. ASME & EN (Strength based on Allowable Stress)
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

      // 2. Plasticity & Stiffness (New Physics Checks)
      const radius = gasketDiameter / 2;
      
      // Plasticity: Thickness so stress at Test Pressure <= Yield (at 20C)
      // Note: Test pressure converted to MPa. Ensure Number() type.
      const tPlasticity = calcThickForStress(
        Number(pressureTestUsed) * BAR_TO_MPA, 
        radius, 
        yieldAt20, 
        nu
      );
      
      // Stiffness: Thickness so deflection at Operating Pressure <= Limit (1mm)
      const tStiffness = calcThickForDeflection(
        Number(input.pressureOp) * BAR_TO_MPA, 
        radius, 
        deflectionLimitMm, 
        modulusElasticity, 
        nu
      );

      // Select governing thickness
      const reqs = [
        {val: minThicknessAsme || 0, code: 'ASME'},
        {val: minThicknessEn || 0, code: 'EN'},
        {val: tPlasticity || 0, code: 'Plasticity'},
        {val: tStiffness || 0, code: 'Stiffness'},
      ];
      // Sort descending to find the largest requirement
      reqs.sort((a, b) => b.val - a.val);
      const minThickness = reqs[0].val;
      const governingCode = reqs[0].code as 'ASME' | 'EN' | 'Plasticity' | 'Stiffness';

      const finalThickness = minThickness + input.corrosionAllowance;
      const recommendedThickness =
        STANDARD_THICKNESSES.find((value) => value >= finalThickness) ?? Math.ceil(finalThickness);

      // Recalculate actual stats for debug (using recommended thickness)
      const stressTestVal = calcPlateStress(
        Number(pressureTestUsed) * BAR_TO_MPA, 
        radius, 
        recommendedThickness, 
        nu
      );
      const deflectionMm = calcPlateDeflection(
        Number(input.pressureOp) * BAR_TO_MPA, 
        radius, 
        Math.max(0, recommendedThickness - input.corrosionAllowance), 
        modulusElasticity,
        nu
      );

      const weight =
        Math.PI * Math.pow(outerDiameter / 2000, 2) * (recommendedThickness / 1000) * materialDef.density * 1000;

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
          thicknessPlasticity: tPlasticity,
          thicknessStiffness: tStiffness,
          governingCode,
          deflectionMm,
          stressTestMPa: stressTestVal,
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
      // New result fields
      deflectionMm: debug.deflectionMm,
      stressTestMPa: debug.stressTestMPa,
      yieldAtTestMPa: yieldAt20,
      isPlasticStable: debug.stressTestMPa <= yieldAt20,
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
