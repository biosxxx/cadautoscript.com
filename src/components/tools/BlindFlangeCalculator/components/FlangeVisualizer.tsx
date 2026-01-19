import {useMemo} from 'react';
import {Ruler} from 'lucide-react';
import type {FlangeVisualizerProps} from '../bfTypes';

export default function FlangeVisualizer({
  dn,
  dims,
  selectedPN,
  recommendedThickness,
  gasketMeanDiameter,
  gasketId,
  gasketOd,
}: FlangeVisualizerProps) {
  const boltPoints = useMemo(() => {
    if (!dims) return [];
    const radius = dims.k / 2;
    return Array.from({length: dims.bolts}, (_, index) => {
      const angle = (2 * Math.PI * index) / dims.bolts;
      return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
      };
    });
  }, [dims]);

  if (!dims) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
        No EN 1092-1 data available for DN {dn}.
      </div>
    );
  }

  const viewBoxSize = 320;
  const center = viewBoxSize / 2;
  const scale = 240 / dims.D;
  const outerRadius = (dims.D / 2) * scale;
  const boltCircleRadius = (dims.k / 2) * scale;
  const boltRadius = (dims.d2 / 2) * scale;
  const gasketOuterRadius = gasketOd ? (gasketOd / 2) * scale : null;
  const gasketInnerRadius = gasketId ? (gasketId / 2) * scale : null;
  const gasketMeanRadius = gasketMeanDiameter ? (gasketMeanDiameter / 2) * scale : null;
  const showUnknownGasket = !gasketOuterRadius && !gasketInnerRadius && !gasketMeanRadius;

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-6 shadow-lg shadow-slate-950/40">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>Sketch</span>
        <span>PN {selectedPN ?? '-'}</span>
      </div>
      <div className="mt-4 flex items-center justify-center">
        <svg width="320" height="320" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
          <rect
            x={1}
            y={1}
            width={viewBoxSize - 2}
            height={viewBoxSize - 2}
            rx={24}
            fill="transparent"
            stroke="rgba(148, 163, 184, 0.2)"
          />
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="rgba(34, 197, 94, 0.1)"
            stroke="rgba(34, 197, 94, 0.7)"
            strokeWidth={2}
          />
          {gasketOuterRadius ? (
            <circle
              cx={center}
              cy={center}
              r={gasketOuterRadius}
              fill="none"
              stroke="rgba(14, 165, 233, 0.6)"
              strokeDasharray="5 4"
              strokeWidth={1.2}
            />
          ) : null}
          {gasketInnerRadius ? (
            <circle
              cx={center}
              cy={center}
              r={gasketInnerRadius}
              fill="none"
              stroke="rgba(14, 165, 233, 0.35)"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          ) : null}
          {!gasketOuterRadius && !gasketInnerRadius && gasketMeanRadius ? (
            <circle
              cx={center}
              cy={center}
              r={gasketMeanRadius}
              fill="none"
              stroke="rgba(14, 165, 233, 0.6)"
              strokeDasharray="5 4"
              strokeWidth={1.2}
            />
          ) : null}
          <circle
            cx={center}
            cy={center}
            r={boltCircleRadius}
            fill="none"
            stroke="rgba(148, 163, 184, 0.5)"
            strokeWidth={1}
          />
          {boltPoints.map((point, index) => (
            <circle
              key={index}
              cx={center + point.x * scale}
              cy={center + point.y * scale}
              r={boltRadius}
              fill="rgba(15, 23, 42, 0.9)"
              stroke="rgba(148, 163, 184, 0.8)"
              strokeWidth={1}
            />
          ))}
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            fill="rgba(226, 232, 240, 0.9)"
            fontWeight="600"
          >
            DN{dn}
          </text>
          {showUnknownGasket ? (
            <text x={center} y={center + 22} textAnchor="middle" fontSize="10" fill="rgba(148, 163, 184, 0.8)">
              Gasket: unknown
            </text>
          ) : null}
        </svg>
      </div>
      <div className="mt-4 grid gap-2 text-xs text-slate-400 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <Ruler size={14} className="text-slate-500" />
          <span>Outer D: {dims.D} mm</span>
        </div>
        <div className="flex items-center gap-2">
          <Ruler size={14} className="text-slate-500" />
          <span>Bolt circle: {dims.k} mm</span>
        </div>
        <div className="flex items-center gap-2">
          <Ruler size={14} className="text-slate-500" />
          <span>Rec. thickness: {recommendedThickness ?? '-'} mm</span>
        </div>
      </div>
    </div>
  );
}
