import {
  EN1092_DB,
  MATERIALS,
  STANDARD_THICKNESSES,
  getFastenerCatalogEntry,
  getFastenerEffectiveProps,
  isFastenerPlaceholder,
  resolveFastenerSelection,
} from './data';
import {getAllowableStress, getHydroTestPressure} from './allowables';
import {
  calcBoltAreaChecks,
  calcBoltTorque,
  calcRequiredBoltLoads,
  getFastenerGeometry,
} from './bolting';
import {getGasketGeometry} from './gasket';
import type {CalculationInput, CalculationResult, En1092Dimensions} from './bfTypes';

const BAR_TO_MPA = 0.1;

// --- Physics Formulas (Added to Standard Logic) ---

// 1. Calculate max deflection at center
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
  if (limitStressMPa <= 0 || radiusMm <= 0 || pressureMPa < 0) return 0;
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
  const res = Math.cbrt(num / den);
  return isNaN(res) ? 0 : res;
};

// --- Standard Helpers ---

export function getCalculatedPN(pressureBar: number): number {
  if (pressureBar <= 10) return 10;
  if (pressureBar <= 16) return 16;
  if (pressureBar <= 25) return 25;
  if (pressureBar <= 40) return 40;
  if (pressureBar <= 63) return 63;
  if (pressureBar <= 100) return 100;
  if (pressureBar <= 160) return 160;
  if (pressureBar <= 250) return 250;
  if (pressureBar <= 320) return 320;
  return 400;
}

export const getMaxAvailablePN = (dn: number): number | undefined => {
  const pnOptions = EN1092_DB[dn];
  if (!pnOptions) return undefined;
  const availablePNs = Object.keys(pnOptions)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  return availablePNs.at(-1);
};

const pickPNClass = (
  dn: number,
  targetPN: number,
): {dims: En1092Dimensions; selectedPN: number} | null => {
  const pnOptions = EN1092_DB[dn];
  if (!pnOptions) return null;
  const availablePNs = Object.keys(pnOptions)
    .map((value) => Number(value))
    .sort((a, b) => a - b);
  if (availablePNs.length === 0) return null;
  const selectedPN = availablePNs.find((pn) => pn >= targetPN);
  if (!selectedPN) return null;
  const dims = pnOptions[selectedPN];
  if (!dims) return null;
  return {dims, selectedPN};
};

export function calculateBlindFlange(input: CalculationInput): CalculationResult | null {
  const targetPN = getCalculatedPN(input.pressureOp);
  const selection = pickPNClass(input.dn, targetPN);
  if (!selection) return null;

  const fastener = resolveFastenerSelection(input);
  const material = MATERIALS[input.material];
  
  // Material Properties for Physics Checks
  const yieldAt20 = material.yieldByTemp[20] ?? 200;
  const modulusElasticity = material.modulusElasticity ?? 200000;
  const nu = 0.3;
  const deflectionLimitMm = 1.0;

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
  const pressureTest = Math.max(input.pressureTest > 0 ? input.pressureTest : hydro.P_test_bar, input.pressureOp);

  const {dims, selectedPN} = selection;
  const gasket = getGasketGeometry(
    input.dn,
    selectedPN,
    input.gasketFacing,
    input.gasketThickness,
    input.gasketMaterial,
  );
  const gasketDiameter = gasket.effectiveDiameter;
  const leverArm = Math.max((dims.k - gasketDiameter) / 2, 4);

  const pressureDiameter = gasket.id ?? gasketDiameter;
  const forceOp = Math.PI * Math.pow(pressureDiameter / 2, 2) * input.pressureOp * BAR_TO_MPA;
  const forceTest = Math.PI * Math.pow(pressureDiameter / 2, 2) * pressureTest * BAR_TO_MPA;
  const loads = calcRequiredBoltLoads({
    effectiveDiameter: gasket.effectiveDiameter,
    effectiveWidth: gasket.effectiveWidth,
    m: gasket.m,
    y: gasket.y,
    pressureOp: input.pressureOp,
    pressureTest,
  });
  const boltGeom = getFastenerGeometry(dims.size, fastener.standard, fastener.type);
  const fastenerEntry = getFastenerCatalogEntry(fastener.gradeId);
  const effectiveFastener = getFastenerEffectiveProps(fastener.gradeId, boltGeom.d);
  const boltAllowable = effectiveFastener.allowableOp;
  const isPlaceholderFastener = isFastenerPlaceholder(fastenerEntry);
  const areaCheck = isPlaceholderFastener
    ? {
        requiredAreaSeating: 0,
        requiredAreaOper: 0,
        requiredAreaHydro: 0,
        requiredBoltArea: 0,
        governingCase: 'seating' as const,
        provided: dims.bolts * (boltGeom.As ?? 0),
        pass: false,
      }
    : calcBoltAreaChecks({
        loads,
        allowableBolt: boltAllowable,
        boltCount: dims.bolts,
        stressArea: boltGeom.As,
      });

  const requiredArea =
    areaCheck.governingCase === 'seating'
      ? areaCheck.requiredAreaSeating
      : areaCheck.governingCase === 'hydrotest'
        ? areaCheck.requiredAreaHydro
        : areaCheck.requiredAreaOper;
  const deltaArea = requiredArea - areaCheck.provided;
  const failureReason = areaCheck.pass || isPlaceholderFastener
    ? undefined
    : {
        case: areaCheck.governingCase,
        requiredArea,
        providedArea: areaCheck.provided,
        deltaArea,
      };

  const governingForce =
    areaCheck.governingCase === 'seating'
      ? loads.Wm1
      : areaCheck.governingCase === 'hydrotest'
        ? loads.Wm2_hydro
        : loads.Wm2_op;
  const requiredPerBolt = dims.bolts > 0 ? governingForce / dims.bolts : 0;

  const momentOp = forceOp * leverArm;
  const momentTest = forceTest * leverArm;

  // 1. Standard Code Calculation (Strength)
  const thicknessOp = Math.sqrt((6 * momentOp) / (Math.PI * gasketDiameter * allowableOp));
  const thicknessTest = Math.sqrt((6 * momentTest) / (Math.PI * gasketDiameter * allowableTest));

  // 2. Physics Calculation (Deflection & Plasticity)
  const radius = gasketDiameter / 2;
  const tPlasticity = calcThickForStress(
    Number(pressureTest) * BAR_TO_MPA,
    radius,
    yieldAt20,
    nu
  );
  const tStiffness = calcThickForDeflection(
    Number(input.pressureOp) * BAR_TO_MPA,
    radius,
    deflectionLimitMm,
    modulusElasticity,
    nu
  );

  // Take the governing thickness of ALL criteria
  const minThickness = Math.max(thicknessOp, thicknessTest, tPlasticity, tStiffness);
  
  const finalThickness = minThickness + input.corrosionAllowance;
  const recommendedThickness =
    STANDARD_THICKNESSES.find((value) => value >= finalThickness) ?? Math.ceil(finalThickness);

  // Recalculate actual stats for the recommended thickness
  const stressTestVal = calcPlateStress(
    Number(pressureTest) * BAR_TO_MPA,
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
    Math.PI * Math.pow(dims.D / 2000, 2) * (recommendedThickness / 1000) * material.density * 1000;

  const boltTorque =
    areaCheck.pass && !isPlaceholderFastener && dims.bolts && dims.size
      ? calcBoltTorque({
          boltDiameterMm: boltGeom.d,
          boltSize: dims.size,
          boltStressArea: boltGeom.As,
          fastenerStandard: fastener.standard,
          fastenerType: fastener.type,
          fastenerGradeId: fastener.gradeId,
          frictionPreset: input.frictionPreset,
          method: input.tighteningMethod ?? 'k_factor',
          governingCase: areaCheck.governingCase,
          requiredPreloadPerBolt: requiredPerBolt,
        })
      : undefined;

  return {
    dims,
    selectedPN,
    source: 'en1092',
    pressureTestUsed: pressureTest,
    pressureTestAuto: hydro.P_test_bar,
    pressureTestBasis: hydro.basis,
    pressureTestRatio: hydro.ratioUsed,
    pressureTestClamped: hydro.clampedToOp,
    boltTorque,
    boltingSummary: {
      loads,
      areas: {
        requiredAreaSeating: areaCheck.requiredAreaSeating,
        requiredAreaOper: areaCheck.requiredAreaOper,
        requiredAreaHydro: areaCheck.requiredAreaHydro,
        provided: areaCheck.provided,
      },
      governingCase: areaCheck.governingCase,
      boltTorque,
      fastenerStandard: fastener.standard,
      fastenerType: fastener.type,
      fastenerGradeId: fastener.gradeId,
      fastenerLabel: fastener.entry.label,
      proofStressMPa: effectiveFastener.proof,
      yieldStressMPa: effectiveFastener.yield,
      geometryAssumption: boltGeom.geometryAssumption,
      fastenerIsPlaceholder: isPlaceholderFastener,
      fastenerNotes: effectiveFastener.notes ?? fastener.entry.notes,
      frictionPreset: input.frictionPreset,
      pass: areaCheck.pass,
      failureReason,
    },
    gasketDiameter: gasket.effectiveDiameter,
    gasketWidth: gasket.effectiveWidth,
    gasketId: gasket.id,
    gasketOd: gasket.od,
    allowableStressOp: allowableOp,
    allowableStressTest: allowableTest,
    minThickness,
    finalThickness,
    recommendedThickness,
    weight,
    gasketMeanDiameter: gasket.effectiveDiameter,
    // Add physics results to output
    deflectionMm,
    stressTestMPa: stressTestVal,
    yieldAtTestMPa: yieldAt20,
    isPlasticStable: stressTestVal <= yieldAt20,
  };
}