import React, {useMemo} from 'react';
import type {EdgePrep, EdgePrepSide} from '../types';

type EdgePrepPreviewProps = {
  edgePrep: EdgePrep;
  edgePrepSide: EdgePrepSide;
  thickness: number;
  rootFace: number;
  bevelAngle: number;
  orientation?: 'head' | 'default';
  variant?: 'detail' | 'report';
};

export default function EdgePrepPreview({
  edgePrep,
  edgePrepSide,
  thickness,
  rootFace,
  bevelAngle,
  orientation = 'head',
  variant = 'detail',
}: EdgePrepPreviewProps) {
  const geometry = useMemo(() => {
    const safeThickness = Math.max(0.1, thickness);
    const safeRootFace = edgePrep === 'None' ? safeThickness : Math.min(rootFace, safeThickness);
    const bevelAngleRad = (bevelAngle * Math.PI) / 180;

    const isDouble = edgePrepSide === 'double';
    const bevelHeight = edgePrep === 'V-Bevel'
      ? Math.max(0, isDouble ? (safeThickness - safeRootFace) / 2 : safeThickness - safeRootFace)
      : 0;
    const bevelWidth = edgePrep === 'V-Bevel' ? Math.tan(bevelAngleRad) * bevelHeight : 0;

    const maxVisualHeight = variant === 'detail' ? 140 : 90;
    const scale = Math.min(6, maxVisualHeight / safeThickness);

    const tVisual = safeThickness * scale;
    const cVisual = safeRootFace * scale;
    const bVisual = bevelWidth * scale;

    const x0 = 120;
    const y0 = variant === 'detail' ? 70 : 55;
    const plateWidth = Math.max(260, 260 + bVisual);
    const x1 = x0 + plateWidth;

    const bevelHeightVisual = bevelHeight * scale;

    return {
      safeThickness,
      safeRootFace,
      bevelWidth,
      bevelHeight,
      bevelAngle,
      tVisual,
      cVisual,
      bVisual,
      bevelHeightVisual,
      x0,
      y0,
      x1,
    };
  }, [bevelAngle, edgePrep, edgePrepSide, rootFace, thickness, variant]);

  const fontSize = variant === 'detail' ? 14 : 11;
  const strokeWidth = variant === 'detail' ? 1.2 : 0.9;
  const isBevel = edgePrep === 'V-Bevel';
  const isDouble = edgePrepSide === 'double';
  const flip = orientation === 'head';

  const mapX = (x: number) => (flip ? geometry.x0 + geometry.x1 - x : x);

  const bevelStartX = geometry.x1 - geometry.bVisual;
  const bevelTopY = geometry.y0 + geometry.bevelHeightVisual;
  const bevelBottomY = geometry.y0 + geometry.tVisual - geometry.bevelHeightVisual;

  const rootFaceTopY = isDouble ? bevelTopY : geometry.y0 + geometry.tVisual - geometry.cVisual;
  const rootFaceBottomY = isDouble ? bevelBottomY : geometry.y0 + geometry.tVisual;

  const path = isBevel
    ? isDouble
      ? `M ${mapX(geometry.x0)} ${geometry.y0}
         L ${mapX(bevelStartX)} ${geometry.y0}
         L ${mapX(geometry.x1)} ${rootFaceTopY}
         L ${mapX(geometry.x1)} ${rootFaceBottomY}
         L ${mapX(bevelStartX)} ${geometry.y0 + geometry.tVisual}
         L ${mapX(geometry.x0)} ${geometry.y0 + geometry.tVisual}
         Z`
      : `M ${mapX(geometry.x0)} ${geometry.y0}
         L ${mapX(bevelStartX)} ${geometry.y0}
         L ${mapX(geometry.x1)} ${rootFaceTopY}
         L ${mapX(geometry.x1)} ${geometry.y0 + geometry.tVisual}
         L ${mapX(geometry.x0)} ${geometry.y0 + geometry.tVisual}
         Z`
    : `M ${mapX(geometry.x0)} ${geometry.y0}
         L ${mapX(geometry.x1)} ${geometry.y0}
         L ${mapX(geometry.x1)} ${geometry.y0 + geometry.tVisual}
         L ${mapX(geometry.x0)} ${geometry.y0 + geometry.tVisual}
         Z`;

  const sLineX = mapX(geometry.x0 - 30);
  const bLineStart = mapX(bevelStartX);
  const bLineEnd = mapX(geometry.x1);
  const bLineMid = (bLineStart + bLineEnd) / 2;

  const cLineX = mapX(geometry.x1 + 24);
  const sTextAnchor = flip ? 'start' : 'end';
  const sTextX = flip ? sLineX + 10 : sLineX - 10;
  const cTextAnchor = flip ? 'end' : 'start';
  const cTextX = flip ? cLineX - 10 : cLineX + 10;

  return (
    <svg
      viewBox="0 0 520 220"
      className="w-full h-auto"
      aria-label="Weld edge preparation preview"
    >
      <rect x="20" y="20" width="480" height="180" rx="20" fill="#f8fafc" stroke="#e2e8f0" />

      <path d={path} fill="#0f172a" opacity="0.85" />

      <line
        x1={sLineX}
        y1={geometry.y0}
        x2={sLineX}
        y2={geometry.y0 + geometry.tVisual}
        stroke="#111827"
        strokeWidth={strokeWidth}
      />
      <line
        x1={sLineX - 6}
        y1={geometry.y0}
        x2={sLineX + 6}
        y2={geometry.y0}
        stroke="#111827"
        strokeWidth={strokeWidth}
      />
      <line
        x1={sLineX - 6}
        y1={geometry.y0 + geometry.tVisual}
        x2={sLineX + 6}
        y2={geometry.y0 + geometry.tVisual}
        stroke="#111827"
        strokeWidth={strokeWidth}
      />
      <text
        x={sTextX}
        y={geometry.y0 + geometry.tVisual / 2 + fontSize / 2}
        fill="#111827"
        fontSize={fontSize}
        textAnchor={sTextAnchor}
      >
        s = {geometry.safeThickness.toFixed(1)} mm
      </text>

      {isBevel ? (
        <>
          <line
            x1={bLineStart}
            y1={geometry.y0 - 18}
            x2={bLineEnd}
            y2={geometry.y0 - 18}
            stroke="#111827"
            strokeWidth={strokeWidth}
          />
          <line
            x1={bLineStart}
            y1={geometry.y0 - 24}
            x2={bLineStart}
            y2={geometry.y0 - 12}
            stroke="#111827"
            strokeWidth={strokeWidth}
          />
          <line
            x1={bLineEnd}
            y1={geometry.y0 - 24}
            x2={bLineEnd}
            y2={geometry.y0 - 12}
            stroke="#111827"
            strokeWidth={strokeWidth}
          />
          <text x={bLineMid} y={geometry.y0 - 26} fill="#111827" fontSize={fontSize} textAnchor="middle">
            b = {geometry.bevelWidth.toFixed(1)} mm
          </text>

          <line
            x1={cLineX}
            y1={rootFaceTopY}
            x2={cLineX}
            y2={rootFaceBottomY}
            stroke="#111827"
            strokeWidth={strokeWidth}
          />
          <line
            x1={cLineX - 6}
            y1={rootFaceTopY}
            x2={cLineX + 6}
            y2={rootFaceTopY}
            stroke="#111827"
            strokeWidth={strokeWidth}
          />
          <line
            x1={cLineX - 6}
            y1={rootFaceBottomY}
            x2={cLineX + 6}
            y2={rootFaceBottomY}
            stroke="#111827"
            strokeWidth={strokeWidth}
          />
          <text
            x={cTextX}
            y={(rootFaceTopY + rootFaceBottomY) / 2 + fontSize / 2}
            fill="#111827"
            fontSize={fontSize}
            textAnchor={cTextAnchor}
          >
            c = {geometry.safeRootFace.toFixed(1)} mm
          </text>

          <text
            x={mapX(geometry.x1 - geometry.bVisual + 14)}
            y={rootFaceTopY - 10}
            fill="#111827"
            fontSize={fontSize}
          >
            {isDouble ? 'u1/u2' : 'u'} = {geometry.bevelAngle.toFixed(0)} deg
          </text>
        </>
      ) : (
        <text
          x={mapX(geometry.x1 - 10)}
          y={geometry.y0 - 16}
          fill="#111827"
          fontSize={fontSize}
          textAnchor={flip ? 'start' : 'end'}
        >
          Square cut
        </text>
      )}
    </svg>
  );
}
