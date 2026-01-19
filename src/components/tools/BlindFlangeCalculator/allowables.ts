import {MATERIALS} from './data';
import type {MaterialDefinition, MaterialId} from './bfTypes';

export type DesignCode = 'EN' | 'ASME';
export type AllowableUsage = 'operating' | 'test';
export type HydroTestCode = 'EN13445' | 'ASMEVIII';

const interpolateYield = (material: MaterialDefinition, temperature: number): number => {
  const temps = Object.keys(material.yieldByTemp)
    .map((value) => Number(value))
    .sort((a, b) => a - b);
  if (temps.length === 0) return 150;
  let selected = temps[0];
  for (const value of temps) {
    if (value <= temperature) {
      selected = value;
    }
  }
  return material.yieldByTemp[selected] ?? material.yieldByTemp[temps[0] ?? 20] ?? 150;
};

const getSafetyFactor = (code: DesignCode, usage: AllowableUsage): number => {
  if (usage === 'test') {
    return code === 'ASME' ? 1.1 : 1.05;
  }
  return code === 'ASME' ? 1.5 : 1.5;
};

export const getAllowableStress = (
  materialIdOrDef: MaterialId | MaterialDefinition,
  temperature: number,
  code: DesignCode,
  usage: AllowableUsage = 'operating',
): number => {
  const material =
    typeof materialIdOrDef === 'string' ? MATERIALS[materialIdOrDef] : (materialIdOrDef as MaterialDefinition);
  if (!material) return 150;
  const yieldStrength = interpolateYield(material, temperature);
  const gamma = getSafetyFactor(code, usage);
  return yieldStrength / gamma;
};

export const getTestPressure = (
  designPressure: number,
  designTemp: number,
  testTemp: number,
  code: DesignCode,
  materialIdOrDef: MaterialId | MaterialDefinition,
): number => {
  const material =
    typeof materialIdOrDef === 'string' ? MATERIALS[materialIdOrDef] : (materialIdOrDef as MaterialDefinition);
  if (!material || designPressure <= 0) return 0;
  const allowableDesign = getAllowableStress(material, designTemp, code, 'operating');
  const allowableTest = getAllowableStress(material, testTemp, code, 'test');
  const baseFactor = code === 'ASME' ? 1.3 : 1.25;
  const ratio = allowableDesign > 0 ? allowableTest / allowableDesign : 1;
  return designPressure * baseFactor * ratio;
};

export const getHydroTestPressure = (input: {
  code: HydroTestCode;
  P_design_bar: number;
  P_op_bar: number;
  T_design_C: number;
  T_test_C: number;
  materialId: MaterialId;
}): {P_test_bar: number; basis: string; ratioUsed: number; clampedToOp: boolean} => {
  const material = MATERIALS[input.materialId];
  if (!material) {
    return {P_test_bar: Math.max(input.P_op_bar, 0), basis: 'Material not found', ratioUsed: 1, clampedToOp: true};
  }
  const designPressure = Math.max(input.P_design_bar, 0);
  const opPressure = Math.max(input.P_op_bar, 0);
  const codeForAllowable: DesignCode = input.code === 'ASMEVIII' ? 'ASME' : 'EN';
  const allowableDesign = getAllowableStress(material, input.T_design_C, codeForAllowable, 'operating');
  const allowableTest = getAllowableStress(material, input.T_test_C, codeForAllowable, 'test');
  const rawRatio = allowableDesign > 0 ? allowableTest / allowableDesign : 1;
  const ratioUsed = Number.isFinite(rawRatio) && rawRatio > 0 ? rawRatio : 1;

  let basis = '';
  let pTest = 0;
  if (input.code === 'ASMEVIII') {
    pTest = 1.3 * designPressure * ratioUsed;
    basis = 'ASME VIII-1 UG-99: 1.3·P·ratio';
  } else {
    const p1 = 1.25 * designPressure * ratioUsed;
    const p2 = 1.43 * designPressure;
    pTest = Math.max(p1, p2);
    basis = 'EN 13445-5: max(1.25·P·ratio, 1.43·P)';
  }

  pTest = Math.max(pTest, 0);
  const clampedToOp = opPressure > 0 && pTest < opPressure;
  const finalTest = clampedToOp ? opPressure : pTest;
  return {P_test_bar: finalTest, basis, ratioUsed, clampedToOp};
};
