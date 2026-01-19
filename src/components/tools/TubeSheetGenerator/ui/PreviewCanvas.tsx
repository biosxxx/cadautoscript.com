import React, {useCallback, useEffect, useRef} from 'react';
import type {GeneratorParams, ModifiedHole, Point} from '../types';
import {createPointKey} from '../core/geometry-utils';

export type PreviewCanvasProps = {
  points: Point[];
  params: Pick<
    GeneratorParams,
    | 'boardDiameter'
    | 'tubeDiameter'
    | 'passCount'
    | 'partitionWidth'
    | 'partitionOrientation'
  >;
  modifiedHoles: Map<string, ModifiedHole>;
  onToggleHole: (point: Point) => void;
  className?: string;
  style?: React.CSSProperties;
};

export default function PreviewCanvas({
  points,
  params,
  modifiedHoles,
  onToggleHole,
  className,
  style,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getHitPoint = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(rect.width, rect.height) / (params.boardDiameter * 1.1);
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const localX = event.clientX - rect.left - centerX;
      const localY = event.clientY - rect.top - centerY;
      const worldX = localX / scale;
      const worldY = -localY / scale;
      const hitRadius = params.tubeDiameter / 2;

      for (const point of points) {
        const modified = modifiedHoles.get(createPointKey(point));
        const diameter = modified?.diameter ?? params.tubeDiameter;
        const radius = diameter / 2;
        const dx = point.x - worldX;
        const dy = point.y - worldY;
        if (Math.sqrt(dx * dx + dy * dy) <= radius) {
          return point;
        }
      }
      return null;
    },
    [points, params.boardDiameter, params.tubeDiameter, modifiedHoles],
  );

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const hit = getHitPoint(event);
      if (hit) {
        onToggleHole(hit);
      }
    },
    [getHitPoint, onToggleHole],
  );

  const handleMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const hit = getHitPoint(event);
      canvas.style.cursor = hit ? 'pointer' : 'default';
    },
    [getHitPoint],
  );

  const handleLeave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.cursor = 'default';
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const scale = Math.min(rect.width, rect.height) / (params.boardDiameter * 1.1);
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.beginPath();
    ctx.arc(0, 0, (params.boardDiameter / 2) * scale, 0, 2 * Math.PI);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    const baseRadius = params.tubeDiameter / 2;
    points.forEach((coord) => {
      const modified = modifiedHoles.get(createPointKey(coord));
      const isHidden = modified?.hidden === true;
      const isSpacer = modified?.diameter !== undefined;
      const radius = (modified?.diameter ?? params.tubeDiameter) / 2;
      const drawX = coord.x * scale;
      const drawY = -coord.y * scale;

      ctx.beginPath();
      ctx.arc(drawX, drawY, radius * scale, 0, 2 * Math.PI);

      if (isHidden) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        const crossSize = radius * scale * 0.85;
        ctx.beginPath();
        ctx.moveTo(drawX - crossSize, drawY - crossSize);
        ctx.lineTo(drawX + crossSize, drawY + crossSize);
        ctx.moveTo(drawX - crossSize, drawY + crossSize);
        ctx.lineTo(drawX + crossSize, drawY - crossSize);
        ctx.stroke();
      } else if (isSpacer) {
        ctx.fillStyle = '#f97316';
        ctx.fill();
      } else {
        ctx.fillStyle = '#0ea5e9';
        ctx.fill();
      }
    });

    if (params.passCount > 1) {
      const boardRadius = params.boardDiameter / 2;
      const halfPartition = params.partitionWidth / 2;
      const numPartitions = params.passCount - 1;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;

      if (params.partitionOrientation === 'horizontal') {
        const totalHeight = boardRadius * 2;
        const sectionHeight = totalHeight / params.passCount;
        for (let i = 1; i <= numPartitions; i++) {
          const yPos = boardRadius - i * sectionHeight;
          const halfWidth = Math.sqrt(Math.abs(boardRadius * boardRadius - yPos * yPos));

          ctx.beginPath();
          ctx.moveTo(-halfWidth * scale, -(yPos - halfPartition) * scale);
          ctx.lineTo(halfWidth * scale, -(yPos - halfPartition) * scale);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(-halfWidth * scale, -(yPos + halfPartition) * scale);
          ctx.lineTo(halfWidth * scale, -(yPos + halfPartition) * scale);
          ctx.stroke();
        }
      } else {
        const totalWidth = boardRadius * 2;
        const sectionWidth = totalWidth / params.passCount;
        for (let i = 1; i <= numPartitions; i++) {
          const xPos = boardRadius - i * sectionWidth;
          const halfHeight = Math.sqrt(Math.abs(boardRadius * boardRadius - xPos * xPos));

          ctx.beginPath();
          ctx.moveTo((xPos - halfPartition) * scale, -halfHeight * scale);
          ctx.lineTo((xPos - halfPartition) * scale, halfHeight * scale);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo((xPos + halfPartition) * scale, -halfHeight * scale);
          ctx.lineTo((xPos + halfPartition) * scale, halfHeight * scale);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }, [points, params, modifiedHoles]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={style}
      onClick={handleClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    />
  );
}
