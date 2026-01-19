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
  const forceOp = Math.PI * Math.pow(pressureDiameter / 2, 2) * input.pressureOp * 0.1;
  const forceTest = Math.PI * Math.pow(pressureDiameter / 2, 2) * pressureTest * 0.1;
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

  const thicknessOp = Math.sqrt((6 * momentOp) / (Math.PI * gasketDiameter * allowableOp));
  const thicknessTest = Math.sqrt((6 * momentTest) / (Math.PI * gasketDiameter * allowableTest));

  const minThickness = Math.max(thicknessOp, thicknessTest);
  const finalThickness = minThickness + input.corrosionAllowance;
  const recommendedThickness =
    STANDARD_THICKNESSES.find((value) => value >= finalThickness) ?? Math.ceil(finalThickness);

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
  };
}
