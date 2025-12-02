import {useEffect, useRef} from 'react';

type Props = {
  diameter: number;
};

export function CirclePreview({diameter}: Props): JSX.Element {
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

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    const padding = 24;
    const maxRadius = (size - padding * 2) / 2;
    const radius = Math.max(4, Math.min(maxRadius, (diameter / 2) * 2));

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Ø ${diameter.toFixed(1)} mm`, size / 2, size / 2 + radius + 20);
  }, [diameter]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        maxWidth: 260,
        height: 260,
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.4)',
        background: '#0f172a',
      }}
      aria-label="DXF circle preview"
    />
  );
}
