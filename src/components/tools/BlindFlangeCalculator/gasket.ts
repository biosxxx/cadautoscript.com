import {GASKET_OPTIONS} from './data';
import type {GasketFacing, GasketMaterial} from './bfTypes';

export type GasketGeometry = {
  effectiveDiameter: number;
  effectiveWidth: number;
  id: number;
  od: number;
  material: GasketMaterial;
  thickness: number;
  facing: GasketFacing;
  m: number;
  y: number;
};

export function getGasketGeometry(
  dn: number,
  pn: number,
  facing: GasketFacing,
  thickness: number,
  material: GasketMaterial,
): GasketGeometry {
  const mProps = GASKET_OPTIONS.materials[material] ?? GASKET_OPTIONS.materials.graphite;

  const pnFactor = pn >= 320 ? 1.15 : pn >= 250 ? 1.1 : pn >= 160 ? 1.05 : 1;
  const facingFactor = facing === 'FF' ? 1.1 : facing === 'IBC' ? 0.95 : 1;
  const thicknessFactor = thickness >= 3 ? 1.08 : 1;

  const rawWidth = dn * 0.08 + 6;
  const width = Math.min(32, Math.max(8, rawWidth * pnFactor * facingFactor * thicknessFactor));

  const id = Math.max(10, dn - 6);
  const od = id + 2 * width;
  const effectiveWidth = Math.max(6, Math.min(width * 0.8, 25));
  const effectiveDiameter = (id + od) / 2;

  return {
    effectiveDiameter,
    effectiveWidth,
    id,
    od,
    material,
    thickness,
    facing,
    m: mProps.m,
    y: mProps.y,
  };
}
