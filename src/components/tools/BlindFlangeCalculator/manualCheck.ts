import {getFastenerCatalogEntry, getFastenerEffectiveProps, getFastenerLabel, isFastenerPlaceholder} from './data';
import {getAllowableStress, getHydroTestPressure} from './allowables';
import {
  EDGE_CLEARANCE_MIN_MM,
  FASTENER_GAP_MIN_MM,
  calcRequiredBoltLoads,
  calcBoltAreaChecks,
  calcBoltTorque,
  getFastenerFeatureOD,
  getFastenerGeometry,
} from './bolting';
import {getGasketGeometry} from './gasket';
import {getCalculatedPN} from './utils';
import type {CalculationInput} from './bfTypes';
import type {
  ManualBoltSummary,
  ManualCheckInput,
  ManualCheckResult,
  ManualGeometryCheck,
  ManualGasketSummary,
  ManualThicknessSummary,
} from './manualCheckTypes';

const calcGeometryChecks = (params: {
  boltCircle: number;
  outerD: number;
  boltCount: number;
  standard: 'EN' | 'ASME';
  boltSize: string;
}) => {
  const {boltCircle, outerD, boltCount, standard, boltSize} = params;
  const feature = getFastenerFeatureOD(standard, boltSize);
  const approxLabel = feature.approximated ? ' (approximated)' : '';

  const radius = boltCircle / 2;
  const outerRadius = outerD / 2;

  const edgeNeed = radius + feature.featureOD / 2 + EDGE_CLEARANCE_MIN_MM;
  const edgeOk = edgeNeed <= outerRadius;

  const pitch = (Math.PI * boltCircle) / Math.max(1, boltCount);
  const pitchNeed = feature.featureOD + FASTENER_GAP_MIN_MM;
  const spacingOk = pitch >= pitchNeed;

  const notes: string[] = [];
  if (!edgeOk) {
    notes.push(
      `Edge check (${feature.sourceLabel}${approxLabel}): k/2 + featureOD/2 + edgeClearanceMin = ${edgeNeed.toFixed(1)} mm > OD/2 = ${outerRadius.toFixed(1)} mm (featureOD=${feature.featureOD.toFixed(1)} mm, edgeClearanceMin=${EDGE_CLEARANCE_MIN_MM} mm)`,
    );
  }
  if (!spacingOk) {
    notes.push(
      `Insufficient spacing (${feature.sourceLabel}${approxLabel}): pitch s=π·k/n = ${pitch.toFixed(1)} mm, need ≥ featureOD+gapMin = ${pitchNeed.toFixed(1)} mm (featureOD=${feature.featureOD.toFixed(1)} mm, gapMin=${FASTENER_GAP_MIN_MM} mm)`,
    );
  }

  if (feature.approximated && notes.length > 0) {
    notes.push(`FeatureOD approximated: ${feature.featureOD.toFixed(1)} mm via ${feature.sourceLabel}.`);
  }

  return {edgeOk, spacingOk, notes};
};

const computeThicknessAsme = (
  gasketDiameter: number,
  leverArm: number,
  forceOp: number,
  forceTest: number,
  allowableOp: number,
  allowableTest: number,
) => {
  const momentOp = forceOp * leverArm;
  const momentTest = forceTest * leverArm;
  const tOp = Math.sqrt((6 * momentOp) / (Math.PI * gasketDiameter * allowableOp));
  const tTest = Math.sqrt((6 * momentTest) / (Math.PI * gasketDiameter * allowableTest));
  return {tOp, tTest};
};

const computeThicknessEn = (
  gasketDiameter: number,
  leverArm: number,
  forceOp: number,
  forceTest: number,
  allowableOp: number,
  allowableTest: number,
) => {
  const C_en = 0.95;
  const momentOp = forceOp * leverArm * C_en;
  const momentTest = forceTest * leverArm * C_en;
  const tOp = Math.sqrt((6 * momentOp) / (Math.PI * gasketDiameter * allowableOp));
  const tTest = Math.sqrt((6 * momentTest) / (Math.PI * gasketDiameter * allowableTest));
  return {tOp, tTest};
};

export function runManualCheck(
  input: CalculationInput,
  manual: ManualCheckInput,
  targetPN?: number,
): ManualCheckResult {
  const errors: string[] = [];

  // Basic validation
  if (!manual.boltCircle || manual.boltCircle <= 0) errors.push('Bolt circle (k) is required.');
  if (!manual.boltCount || manual.boltCount < 2) errors.push('Bolt count must be at least 2.');
  if (!manual.boltHoleDiameter || manual.boltHoleDiameter <= 0) errors.push('Bolt hole diameter is required.');
  if (!manual.outerDiameter || manual.outerDiameter <= 0) errors.push('Outer diameter is required.');
  if (!manual.thickness || manual.thickness <= 0) errors.push('Thickness is required.');
  if (!manual.boltSize) errors.push('Bolt size is required.');

  const gasketFacing = manual.gasketFacing ?? input.gasketFacing;
  const gasketMaterial = manual.gasketMaterial ?? input.gasketMaterial;
  const gasketThickness = manual.gasketThickness ?? input.gasketThickness;
  const corrosionAllowance = manual.corrosionAllowance ?? input.corrosionAllowance ?? 0;

  const selectedPN = targetPN ?? getCalculatedPN(input.pressureOp);
  const gasket = getGasketGeometry(input.dn, selectedPN, gasketFacing, gasketThickness, gasketMaterial);

  const boltGeom = getFastenerGeometry(manual.boltSize, manual.fastenerStandard, manual.fastenerType);
  const geometryCheck: ManualGeometryCheck = calcGeometryChecks({
    boltCircle: manual.boltCircle,
    outerD: manual.outerDiameter,
    boltCount: manual.boltCount,
    standard: manual.fastenerStandard,
    boltSize: manual.boltSize,
  });

  const geometryErrors = [...errors, ...geometryCheck.notes];

  const fastenerEntry = getFastenerCatalogEntry(manual.fastenerGradeId);
  const fastenerEffective = getFastenerEffectiveProps(manual.fastenerGradeId, boltGeom.d);
  const fastenerPlaceholder = isFastenerPlaceholder(fastenerEntry) || fastenerEffective.isPlaceholder;
  if (fastenerPlaceholder) {
    geometryErrors.push(
      fastenerEntry.notes ??
        'Fastener data is placeholder. Provide proof/yield/allowables to enable manual check.',
    );
  }

  // Hydro test pressure (EN by default for now) - available even if geometry/bolts fail.
  const hydro = getHydroTestPressure({
    code: 'EN13445',
    P_design_bar: input.pressureOp,
    P_op_bar: input.pressureOp,
    T_design_C: input.temperature,
    T_test_C: 20,
    materialId: input.material,
  });
  const pressureTestUsed = Math.max(input.pressureTest > 0 ? input.pressureTest : hydro.P_test_bar, input.pressureOp);

  const gasketLoads = calcRequiredBoltLoads({
    effectiveDiameter: gasket.effectiveDiameter,
    effectiveWidth: gasket.effectiveWidth,
    m: gasket.m,
    y: gasket.y,
    pressureOp: input.pressureOp,
    pressureTest: pressureTestUsed,
  });

  const gasketSummaryBase: ManualGasketSummary = {
    gasketMeanDiameter: gasket.effectiveDiameter,
    gasketWidth: gasket.effectiveWidth,
    gasketId: gasket.id,
    gasketOd: gasket.od,
    m: gasket.m,
    y: gasket.y,
    facing: gasket.facing,
    material: gasket.material,
    thickness: gasket.thickness,
    Wm1: gasketLoads.Wm1,
    Wm2_op: gasketLoads.Wm2_op,
    Wm2_hydro: gasketLoads.Wm2_hydro,
  };

  if (geometryErrors.length > 0) {
    return {
      pass: false,
      errors: geometryErrors,
      geometry: geometryCheck,
      manualInput: manual,
      gasketSummary: gasketSummaryBase,
      governingCase: undefined,
      governingCode: undefined,
      pressureTestAuto: hydro.P_test_bar,
      pressureTestBasis: hydro.basis,
      pressureTestRatio: hydro.ratioUsed,
      pressureTestUsed,
      pressureTestClamped: hydro.clampedToOp,
    };
  }

  // Material allowables
  const material = input.material;
  const allowableOp = getAllowableStress(material, input.temperature, 'EN', 'operating');
  const allowableTest = getAllowableStress(material, 20, 'EN', 'test');

  // Forces and gasket loads
  const pressureDiameter = gasket.id ?? gasket.effectiveDiameter;
  const areaPressure = Math.PI * Math.pow(pressureDiameter / 2, 2);
  const forceOp = areaPressure * input.pressureOp * 0.1;
  const forceTest = areaPressure * pressureTestUsed * 0.1;
  const leverArm = Math.max((manual.boltCircle - gasket.effectiveDiameter) / 2, 4);

  // Bolting checks
  let boltSummary: ManualBoltSummary | undefined;
  if (boltGeom.As && manual.boltCount > 0) {
    const areaCheck = fastenerPlaceholder
      ? {
          requiredAreaSeating: 0,
          requiredAreaOper: 0,
          requiredAreaHydro: 0,
          requiredBoltArea: 0,
          governingCase: 'seating' as const,
          provided: manual.boltCount * boltGeom.As,
          pass: false,
        }
      : calcBoltAreaChecks({
          loads: gasketLoads,
          allowableBolt: fastenerEffective.allowableOp,
          boltCount: manual.boltCount,
          stressArea: boltGeom.As,
        });

    const failureReason =
      areaCheck.pass || fastenerPlaceholder
        ? undefined
        : {
            case: areaCheck.governingCase,
            requiredArea:
              areaCheck.governingCase === 'seating'
                ? areaCheck.requiredAreaSeating
                : areaCheck.governingCase === 'hydrotest'
                  ? areaCheck.requiredAreaHydro
                  : areaCheck.requiredAreaOper,
            providedArea: areaCheck.provided,
            deltaArea:
              (areaCheck.governingCase === 'seating'
                ? areaCheck.requiredAreaSeating
                : areaCheck.governingCase === 'hydrotest'
                  ? areaCheck.requiredAreaHydro
                  : areaCheck.requiredAreaOper) - areaCheck.provided,
          };

    const torque =
      areaCheck.pass && !fastenerPlaceholder
        ? calcBoltTorque({
            boltDiameterMm: boltGeom.d,
            boltSize: manual.boltSize,
            boltStressArea: boltGeom.As,
            fastenerStandard: manual.fastenerStandard,
            fastenerType: manual.fastenerType,
            fastenerGradeId: manual.fastenerGradeId,
            frictionPreset: manual.frictionPreset,
            method: manual.tighteningMethod ?? 'k_factor',
            governingCase: areaCheck.governingCase,
            requiredPreloadPerBolt:
              areaCheck.governingCase === 'seating'
                ? gasketLoads.Wm1 / manual.boltCount
                : areaCheck.governingCase === 'hydrotest'
                  ? gasketLoads.Wm2_hydro / manual.boltCount
                  : gasketLoads.Wm2_op / manual.boltCount,
          })
        : undefined;

    boltSummary = {
      loads: gasketLoads,
      areas: {
        requiredAreaSeating: areaCheck.requiredAreaSeating,
        requiredAreaOper: areaCheck.requiredAreaOper,
        requiredAreaHydro: areaCheck.requiredAreaHydro,
        provided: areaCheck.provided,
        utilizationSeating: areaCheck.provided > 0 ? areaCheck.requiredAreaSeating / areaCheck.provided : 0,
        utilizationOper: areaCheck.provided > 0 ? areaCheck.requiredAreaOper / areaCheck.provided : 0,
        utilizationHydro: areaCheck.provided > 0 ? areaCheck.requiredAreaHydro / areaCheck.provided : 0,
      },
      governingCase: areaCheck.governingCase,
      pass: areaCheck.pass && !fastenerPlaceholder,
      failureReason,
      torque,
      fastenerLabel: getFastenerLabel(manual.fastenerGradeId),
      fastenerNotes: fastenerEffective.notes ?? fastenerEntry.notes,
      fastenerIsPlaceholder: fastenerPlaceholder,
      geometryAssumption: boltGeom.geometryAssumption,
    };
  }

  // Thickness
  const {tOp: tAsmeOp, tTest: tAsmeTest} = computeThicknessAsme(
    gasket.effectiveDiameter,
    leverArm,
    forceOp,
    forceTest,
    allowableOp,
    allowableTest,
  );
  const {tOp: tEnOp, tTest: tEnTest} = computeThicknessEn(
    gasket.effectiveDiameter,
    leverArm,
    forceOp,
    forceTest,
    allowableOp,
    allowableTest,
  );
  const reqAsme = Math.max(tAsmeOp, tAsmeTest);
  const reqEn = Math.max(tEnOp, tEnTest);
  const governingCode = reqAsme >= reqEn ? 'ASME' : 'EN';
  const reqBase = Math.max(reqAsme, reqEn);
  const requiredWithCA = reqBase + corrosionAllowance;
  const thicknessSummary: ManualThicknessSummary = {
    requiredAsmeOp: tAsmeOp,
    requiredAsmeTest: tAsmeTest,
    requiredEnOp: tEnOp,
    requiredEnTest: tEnTest,
    governingCode,
    requiredWithCA,
    provided: manual.thickness,
    utilization: manual.thickness > 0 ? requiredWithCA / manual.thickness : 0,
    pass: manual.thickness >= requiredWithCA,
  };

  const gasketSummary: ManualGasketSummary = {
    gasketMeanDiameter: gasket.effectiveDiameter,
    gasketWidth: gasket.effectiveWidth,
    gasketId: gasket.id,
    gasketOd: gasket.od,
    m: gasket.m,
    y: gasket.y,
    facing: gasket.facing,
    material: gasket.material,
    thickness: gasket.thickness,
    Wm1: gasketLoads.Wm1,
    Wm2_op: gasketLoads.Wm2_op,
    Wm2_hydro: gasketLoads.Wm2_hydro,
  };

  const pass =
    geometryErrors.length === 0 &&
    geometryCheck.edgeOk &&
    geometryCheck.spacingOk &&
    (boltSummary?.pass ?? false) &&
    thicknessSummary.pass;

  const governingCase = boltSummary?.governingCase;

  return {
    pass,
    errors: geometryErrors,
    geometry: geometryCheck,
    manualInput: manual,
    boltSummary,
    thicknessSummary,
    gasketSummary,
    governingCase,
    governingCode,
    pressureTestAuto: hydro.P_test_bar,
    pressureTestBasis: hydro.basis,
    pressureTestRatio: hydro.ratioUsed,
    pressureTestUsed,
    pressureTestClamped: hydro.clampedToOp,
  };
}
