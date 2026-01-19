import type {GeneratorParams, Point} from '../types';

export const normalizeZero = (value: number) => (Math.abs(value) < 1e-6 ? 0 : value);

export const createPointKey = (point: Point) =>
  `${normalizeZero(point.x).toFixed(4)}:${normalizeZero(point.y).toFixed(4)}`;

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const validateLayoutParams = (params: GeneratorParams) => {
  if (!isFiniteNumber(params.boardDiameter) || params.boardDiameter <= 0) return false;
  if (!isFiniteNumber(params.tubeDiameter) || params.tubeDiameter <= 0) return false;
  if (!isFiniteNumber(params.tubePitch) || params.tubePitch <= 0) return false;
  if (!isFiniteNumber(params.edgeMargin) || params.edgeMargin < 0) return false;
  return true;
};

export const getSafeRadius = (params: GeneratorParams) =>
  params.boardDiameter / 2 - params.edgeMargin - params.tubeDiameter / 2;

export const isWithinRadius = (point: Point, radius: number) =>
  Math.sqrt(point.x * point.x + point.y * point.y) <= radius;

export const createPointCollector = (safeRadius: number) => {
  const points: Point[] = [];
  const set = new Set<string>();

  const addPoint = (x: number, y: number) => {
    const normalizedX = normalizeZero(x);
    const normalizedY = normalizeZero(y);
    const point = {x: normalizedX, y: normalizedY};

    if (!isWithinRadius(point, safeRadius)) {
      return;
    }

    const key = `${normalizedX.toFixed(4)}:${normalizedY.toFixed(4)}`;
    if (set.has(key)) {
      return;
    }
    set.add(key);
    points.push(point);
  };

  return {points, addPoint};
};
