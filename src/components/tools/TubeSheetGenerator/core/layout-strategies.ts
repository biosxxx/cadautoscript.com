import type {GeneratorParams, LayoutType, Point} from '../types';
import {createPointCollector, getSafeRadius, validateLayoutParams} from './geometry-utils';

export interface LayoutStrategy {
  calculatePoints(params: GeneratorParams): Point[];
}

const addSymmetricPoints = (addPoint: (x: number, y: number) => void, x: number, y: number) => {
  addPoint(x, y);
  if (x !== 0) addPoint(-x, y);
  if (y !== 0) addPoint(x, -y);
  if (x !== 0 && y !== 0) addPoint(-x, -y);
};

export class SquareLayout implements LayoutStrategy {
  calculatePoints(params: GeneratorParams): Point[] {
    if (!validateLayoutParams(params)) {
      return [];
    }

    const safeRadius = getSafeRadius(params);
    if (safeRadius <= 0) {
      return [];
    }

    const {points, addPoint} = createPointCollector(safeRadius);
    const boardRadius = params.boardDiameter / 2;
    const endX = boardRadius;
    const endY = boardRadius;

    for (let y = 0; y < endY; y += params.tubePitch) {
      for (let x = 0; x < endX; x += params.tubePitch) {
        if (x === 0 && y === 0) continue;
        addSymmetricPoints(addPoint, x, y);
      }
    }

    addPoint(0, 0);
    return points;
  }
}

export class TriangularLayout implements LayoutStrategy {
  calculatePoints(params: GeneratorParams): Point[] {
    if (!validateLayoutParams(params)) {
      return [];
    }

    const safeRadius = getSafeRadius(params);
    if (safeRadius <= 0) {
      return [];
    }

    const {points, addPoint} = createPointCollector(safeRadius);
    const boardRadius = params.boardDiameter / 2;
    const endX = boardRadius;
    const endY = boardRadius;
    const dy = (params.tubePitch * Math.sqrt(3)) / 2;

    for (let y = 0, row = 0; y < endY; y += dy, row++) {
      const xOffset = row % 2 === 1 ? params.tubePitch / 2 : 0;
      for (let x = xOffset; x < endX; x += params.tubePitch) {
        if (x === 0 && y === 0) continue;
        addSymmetricPoints(addPoint, x, y);
      }
    }

    addPoint(0, 0);
    return points;
  }
}

const strategies: Record<LayoutType, LayoutStrategy> = {
  square: new SquareLayout(),
  triangular: new TriangularLayout(),
};

export const getLayoutStrategy = (layout: LayoutType) => strategies[layout];

