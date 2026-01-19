import {getFastenerCatalogEntry, getFastenerEffectiveProps} from './data';
import type {
  BoltTorqueInput,
  BoltTorqueResult,
  FastenerStandard,
  FastenerType,
  FrictionPreset,
} from './bfTypes';

// --- Bolt geometry & catalog ---
export const BOLT_STRESS_AREA: Record<string, number> = {
  M12: 84.3,
  M16: 157,
  M20: 245,
  M24: 353,
  M27: 459,
  M30: 561,
  M33: 694,
  M36: 817,
  M39: 976,
  M42: 1120,
  M45: 1310,
  M48: 1470,
  M52: 1750,
  M56: 2030,
  M60: 2400,
  M64: 2670,
};

// --- Fastener installation geometry (washers / nuts) ---
export const EDGE_CLEARANCE_MIN_MM = 3;
export const FASTENER_GAP_MIN_MM = 2;

export type FastenerFeature = {
  featureOD: number; // mm
  sourceLabel: string;
  approximated?: boolean;
};

// EN / ISO 7089 (normal series) - approximate OD values in mm
const WASHER_OD_ISO7089: Record<string, number> = {
  M12: 24,
  M16: 30,
  M20: 37,
  M24: 44,
  M27: 50,
  M30: 56,
  M33: 60,
  M36: 66,
  M39: 72,
  M42: 78,
  M45: 85,
  M48: 92,
  M52: 98,
  M56: 105,
  M60: 110,
  M64: 115,
};

// EN / ISO 4032 (hex nuts) across flats (s) in mm
const NUT_AF_ISO4032: Record<string, number> = {
  M12: 19,
  M16: 24,
  M20: 30,
  M24: 36,
  M27: 41,
  M30: 46,
  M33: 50,
  M36: 55,
  M39: 60,
  M42: 65,
  M45: 70,
  M48: 75,
  M52: 80,
  M56: 85,
  M60: 90,
  M64: 95,
};

const nutAcrossCornersFromAF = (acrossFlats: number) => acrossFlats / Math.cos(Math.PI / 6);

export function getWasherOD(standard: FastenerStandard, boltSize: string): FastenerFeature | null {
  const od = WASHER_OD_ISO7089[boltSize];
  if (!od) return null;
  if (standard === 'ASME') {
    // Metric washer dimensions used as a conservative approximation until USS/SAE tables are added.
    return {featureOD: od * 1.1, sourceLabel: 'washer OD (metric, approx for ASME)', approximated: true};
  }
  return {featureOD: od, sourceLabel: 'washer OD (ISO 7089)', approximated: false};
}

export function getNutAcrossCorners(standard: FastenerStandard, boltSize: string): FastenerFeature | null {
  const af = NUT_AF_ISO4032[boltSize];
  if (!af) return null;
  const corners = nutAcrossCornersFromAF(af);
  if (standard === 'ASME') {
    return {featureOD: corners, sourceLabel: 'nut across corners (metric, approx for ASME)', approximated: true};
  }
  return {featureOD: corners, sourceLabel: 'nut across corners (ISO 4032, from AF)', approximated: false};
}

export function getFastenerFeatureOD(standard: FastenerStandard, boltSize: string): FastenerFeature {
  const washer = getWasherOD(standard, boltSize);
  if (washer) return washer;

  const nut = getNutAcrossCorners(standard, boltSize);
  if (nut) return nut;

  const d = Number(boltSize.replace('M', ''));
  if (Number.isFinite(d) && d > 0) {
    return {featureOD: d * 2.1, sourceLabel: 'featureOD (approx from bolt diameter)', approximated: true};
  }

  return {featureOD: 0, sourceLabel: 'featureOD unknown', approximated: true};
}

const BOLT_HOLE_DIAMETER: Record<string, number> = {
  M12: 14,
  M16: 18,
  M20: 22,
  M24: 26,
  M27: 30,
  M30: 33,
  M33: 36,
  M36: 39,
  M39: 42,
  M42: 45,
  M45: 48,
  M48: 52,
  M52: 56,
  M56: 62,
  M60: 66,
  M64: 70,
};

const METRIC_PITCH: Record<string, number> = {
  M12: 1.75,
  M16: 2.0,
  M20: 2.5,
  M24: 3.0,
  M27: 3.0,
  M30: 3.5,
  M33: 3.5,
  M36: 4.0,
  M39: 4.0,
  M42: 4.5,
  M45: 4.5,
  M48: 5.0,
  M52: 5.0,
  M56: 5.5,
  M60: 5.5,
  M64: 6.0,
};

export function getFastenerGeometry(size?: string, standard: FastenerStandard = 'EN', _type: FastenerType = 'BOLT') {
  if (!size) return {d: 0, As: 0, pitch: 0, geometryAssumption: undefined as string | undefined};
  const d = Number(size.replace('M', ''));
  const As = BOLT_STRESS_AREA[size] ?? 0;
  const pitch = METRIC_PITCH[size] ?? 0;
  const geometryAssumption = standard === 'ASME' ? 'metric thread' : undefined;
  return {d, As, pitch, geometryAssumption};
}

export function getBoltGeometry(size?: string) {
  return getFastenerGeometry(size, 'EN', 'BOLT');
}

export function getBoltHoleDiameter(size?: string): number {
  if (!size) return 0;
  return BOLT_HOLE_DIAMETER[size] ?? 0;
}

export {getFastenerCatalogEntry};

// --- Gasket loads ---
export type GasketLoadInput = {
  effectiveDiameter: number;
  effectiveWidth: number;
  m: number;
  y: number;
  pressureOp: number;
  pressureTest: number;
};

export function calcRequiredBoltLoads(input: GasketLoadInput) {
  const {effectiveDiameter: G, effectiveWidth: b, m, y, pressureOp, pressureTest} = input;
  const P_op = pressureOp * 0.1;
  const P_test = pressureTest * 0.1;
  const Wm1 = Math.PI * G * b * y;
  const Wm2_op = (Math.PI * Math.pow(G, 2) * P_op) / 4 + 2 * Math.PI * b * G * m * P_op;
  const Wm2_hydro = (Math.PI * Math.pow(G, 2) * P_test) / 4 + 2 * Math.PI * b * G * m * P_test;
  return {Wm1, Wm2_op, Wm2_hydro};
}

export type BoltAreaCheckInput = {
  loads: {Wm1: number; Wm2_op: number; Wm2_hydro: number};
  allowableBolt: number;
  boltCount: number;
  stressArea: number;
};

export type BoltingCase = 'seating' | 'operating' | 'hydrotest';

export type BoltAreaCheckResult = {
  requiredAreaSeating: number;
  requiredAreaOper: number;
  requiredAreaHydro: number;
  requiredBoltArea: number;
  governingCase: BoltingCase;
  provided: number;
  pass: boolean;
};

export function calcBoltAreaChecks(input: BoltAreaCheckInput): BoltAreaCheckResult {
  const {loads, allowableBolt, boltCount, stressArea} = input;
  const provided = boltCount * stressArea;
  const requiredAreaSeating = loads.Wm1 / allowableBolt;
  const requiredAreaOper = loads.Wm2_op / allowableBolt;
  const requiredAreaHydro = loads.Wm2_hydro / allowableBolt;
  const requiredBoltArea = Math.max(requiredAreaSeating, requiredAreaOper, requiredAreaHydro);
  const governingCase: BoltingCase =
    requiredBoltArea === requiredAreaSeating
      ? 'seating'
      : requiredBoltArea === requiredAreaHydro
        ? 'hydrotest'
        : 'operating';
  const pass =
    provided >= requiredAreaSeating && provided >= requiredAreaOper && provided >= requiredAreaHydro;
  return {requiredAreaSeating, requiredAreaOper, requiredAreaHydro, requiredBoltArea, governingCase, provided, pass};
}

// --- Torque calculation (K-factor) ---
const K_FACTORS: Record<FrictionPreset, {K: number; Kmin: number; Kmax: number; label: string}> = {
  dry: {K: 0.2, Kmin: 0.18, Kmax: 0.22, label: 'Dry'},
  lubricated: {K: 0.15, Kmin: 0.13, Kmax: 0.17, label: 'Lubricated'},
};

export function calcBoltTorque(input: BoltTorqueInput): BoltTorqueResult {
  const {
    boltDiameterMm,
    boltSize,
    boltStressArea,
    fastenerStandard,
    fastenerType,
    fastenerGradeId,
    frictionPreset,
    method,
    preloadLimitFactor = 0.7,
    governingCase,
    requiredPreloadPerBolt,
  } = input;

  const K = K_FACTORS[frictionPreset] ?? K_FACTORS.dry;
  const geometry = getFastenerGeometry(boltSize, fastenerStandard, fastenerType);
  const stressArea = boltStressArea ?? geometry.As ?? 0;
  const diameterMm = boltDiameterMm ?? geometry.d ?? 0;
  const eff = getFastenerEffectiveProps(fastenerGradeId, diameterMm);
  const proof = eff.proof;

  const proofLoadPerBolt = stressArea * proof; // N
  const preloadCap = proofLoadPerBolt * preloadLimitFactor;
  const cappedByProof = requiredPreloadPerBolt > preloadCap;
  const preloadPerBolt = Math.min(requiredPreloadPerBolt, preloadCap);
  const preloadUtilization = proofLoadPerBolt > 0 ? preloadPerBolt / proofLoadPerBolt : 0;

  const d_m = diameterMm / 1000;
  const torqueNm = K.K * preloadPerBolt * d_m;
  const torqueMinNm = K.Kmin * preloadPerBolt * d_m;
  const torqueMaxNm = K.Kmax * preloadPerBolt * d_m;

  const assumptions = [
    `Method: ${method === 'k_factor' ? 'K-factor' : method}`,
    `Friction: ${K.label} (K=${K.K.toFixed(2)} range ${K.Kmin.toFixed(2)}-${K.Kmax.toFixed(2)})`,
    `Preload cap: ${Math.round(preloadLimitFactor * 100)}% of proof`,
    `Governing case: ${governingCase}`,
  ];
  if (geometry.geometryAssumption) {
    assumptions.push(`Geometry: ${geometry.geometryAssumption}`);
  }
  if (cappedByProof) assumptions.push('Torque capped by proof load');

  return {
    method,
    frictionPreset,
    torqueNm,
    torqueMinNm,
    torqueMaxNm,
    preloadPerBoltN: preloadPerBolt,
    preloadUtilization,
    governingCaseUsed: governingCase,
    cappedByProof,
    assumptions,
  };
}
