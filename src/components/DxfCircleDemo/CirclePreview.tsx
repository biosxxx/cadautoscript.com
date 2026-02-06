import {useEffect, useRef} from 'react';

type Props = {
  diameter: number;
  innerDiameter?: number;
  background: string;
  border: string;
  textColor: string;
};

export function CirclePreview({
  diameter,
  innerDiameter = 0,
  background,
  border,
  textColor,
}: Props): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const size = 240;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);

    const padding = 24;
    const maxRadius = (size - padding * 2) / 2;
    const outerRadius = Math.max(4, Math.min(maxRadius, (diameter / 2) * 2));
    const innerRadius = innerDiameter > 0 ? Math.max(2, Math.min(outerRadius - 4, (innerDiameter / 2) * 2)) : 0;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, outerRadius, 0, Math.PI * 2);
    ctx.stroke();

    if (innerRadius > 0) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, innerRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = textColor;
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Ø ${diameter.toFixed(1)} mm`, size / 2, size / 2 + outerRadius + 20);
  }, [diameter, innerDiameter]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        maxWidth: 260,
        height: 260,
        borderRadius: 12,
        border: `1px solid ${border}`,
        background,
      }}
      aria-label="DXF circle preview"
    />
  );
}
