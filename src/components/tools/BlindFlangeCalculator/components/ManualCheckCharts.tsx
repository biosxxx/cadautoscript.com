import type {ManualBoltSummary, ManualThicknessSummary} from '../manualCheckTypes';

type Props = {
  boltSummary?: ManualBoltSummary;
  thicknessSummary?: ManualThicknessSummary;
};

const Bar = ({label, value}: {label: string; value: number}) => {
  const pct = Math.min(Math.max(value * 100, 0), 300);
  const color =
    pct < 90 ? 'bg-green-500' : pct < 110 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-semibold text-slate-200">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{width: `${Math.min(pct, 150)}%`}}
        />
      </div>
    </div>
  );
};

export default function ManualCheckCharts({boltSummary, thicknessSummary}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
        <h4 className="text-sm font-semibold text-slate-100">Bolt utilization</h4>
        <div className="mt-3 space-y-2">
          <Bar label="Seating" value={boltSummary?.areas.utilizationSeating ?? 0} />
          <Bar label="Operating" value={boltSummary?.areas.utilizationOper ?? 0} />
          <Bar label="Hydrotest" value={boltSummary?.areas.utilizationHydro ?? 0} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
        <h4 className="text-sm font-semibold text-slate-100">Thickness utilization</h4>
        <div className="mt-3 space-y-2">
          <Bar
            label="ASME (op)"
            value={(thicknessSummary?.requiredAsmeOp ?? 0) / (thicknessSummary?.provided ?? 1)}
          />
          <Bar
            label="ASME (hydro)"
            value={(thicknessSummary?.requiredAsmeTest ?? 0) / (thicknessSummary?.provided ?? 1)}
          />
          <Bar
            label="EN (op)"
            value={(thicknessSummary?.requiredEnOp ?? 0) / (thicknessSummary?.provided ?? 1)}
          />
          <Bar
            label="EN (hydro)"
            value={(thicknessSummary?.requiredEnTest ?? 0) / (thicknessSummary?.provided ?? 1)}
          />
          <Bar label="Combined (with CA)" value={thicknessSummary?.utilization ?? 0} />
        </div>
      </div>
    </div>
  );
}
