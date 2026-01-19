import {useEffect, useState} from 'react';
import {AlertTriangle, CheckCircle2, Play, Target, Wrench} from 'lucide-react';
import {getFastenerCatalogEntry, getFastenerEffectiveProps, getFastenerOptionsFor} from '../data';
import type {CalculationInput, FastenerGradeId, FastenerStandard, FastenerType} from '../bfTypes';
import {runManualCheck} from '../manualCheck';
import type {ManualCheckInput, ManualCheckResult} from '../manualCheckTypes';
import ManualCheckCharts from './ManualCheckCharts';
import FlangeVisualizer from './FlangeVisualizer';

type Props = {
  input: CalculationInput;
  targetPN: number;
  onManualResultChange?: (result: ManualCheckResult | null) => void;
};

const inputClass =
  'w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400';

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      {hint ? <span className="text-[11px] text-slate-500">{hint}</span> : null}
    </div>
    {children}
  </div>
);

const numberVal = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const BOLT_SIZES = ['M16', 'M20', 'M24', 'M27', 'M30', 'M33', 'M36', 'M39', 'M42', 'M45', 'M48', 'M52'];

export default function ManualCheckPanel({input, targetPN, onManualResultChange}: Props) {
  const [manual, setManual] = useState<ManualCheckInput>({
    boltCircle: Math.max(input.dn + 120, 300),
    boltCount: 12,
    boltHoleDiameter: 26,
    outerDiameter: Math.max(input.dn + 180, 400),
    thickness: 40,
    boltSize: 'M24',
    corrosionAllowance: input.corrosionAllowance,
    fastenerStandard: input.fastenerStandard ?? 'EN',
    fastenerType: input.fastenerType ?? 'BOLT',
    fastenerGradeId: input.fastenerGradeId ?? 'EN_8.8',
    frictionPreset: input.frictionPreset,
    tighteningMethod: input.tighteningMethod ?? 'k_factor',
    gasketFacing: input.gasketFacing,
    gasketMaterial: input.gasketMaterial,
    gasketThickness: input.gasketThickness,
  });
  const [result, setResult] = useState<ManualCheckResult | null>(null);

  const fastenerOptions = getFastenerOptionsFor(manual.fastenerStandard, manual.fastenerType);
  const selectedFastener = getFastenerCatalogEntry(manual.fastenerGradeId);
  const effectiveFastener = getFastenerEffectiveProps(manual.fastenerGradeId, Number(manual.boltSize.replace('M', '')));

  useEffect(() => {
    const hasCurrent = fastenerOptions.some((opt) => opt.id === manual.fastenerGradeId);
    if (!hasCurrent && fastenerOptions.length > 0) {
      setManual((prev) => ({...prev, fastenerGradeId: fastenerOptions[0].id}));
    }
  }, [manual.fastenerGradeId, fastenerOptions]);

  useEffect(() => {
    setManual((prev) => ({
      ...prev,
      frictionPreset: input.frictionPreset,
      tighteningMethod: input.tighteningMethod ?? 'k_factor',
      gasketFacing: input.gasketFacing,
      gasketMaterial: input.gasketMaterial,
      gasketThickness: input.gasketThickness,
      corrosionAllowance: input.corrosionAllowance,
    }));
  }, [input.frictionPreset, input.tighteningMethod, input.gasketFacing, input.gasketMaterial, input.gasketThickness, input.corrosionAllowance]);

  const handleRun = () => {
    const res = runManualCheck(input, manual, targetPN);
    setResult(res);
    onManualResultChange?.(res);
  };

  const canRun =
    manual.boltCircle > 0 &&
    manual.boltCount > 1 &&
    manual.boltHoleDiameter > 0 &&
    manual.outerDiameter > 0 &&
    manual.thickness > 0 &&
    manual.boltSize.length > 0;

  const pass = result?.pass ?? false;
  const statusIcon = pass ? <CheckCircle2 className="text-emerald-400" size={18} /> : <AlertTriangle className="text-amber-400" size={18} />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <Wrench size={14} />
              Manual check
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">Manual geometry & bolting verification</h3>
            <p className="text-sm text-slate-400">
              Enter your own flange geometry and bolting, then run verification for seating / operating / hydro.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500"
            onClick={handleRun}
            disabled={!canRun}
          >
            <Play size={16} />
            Check
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Geometry</p>
            <Field label="Bolt circle k" hint="mm">
              <input
                className={inputClass}
                type="number"
                value={manual.boltCircle}
                onChange={(e) => setManual((prev) => ({...prev, boltCircle: numberVal(e.target.value)}))}
                placeholder="e.g. 300"
              />
            </Field>
            <Field label="Bolt count" hint="qty">
              <input
                className={inputClass}
                type="number"
                value={manual.boltCount}
                onChange={(e) => setManual((prev) => ({...prev, boltCount: numberVal(e.target.value)}))}
                placeholder="e.g. 12"
                min={2}
              />
            </Field>
            <Field label="Bolt hole diameter d2" hint="mm">
              <input
                className={inputClass}
                type="number"
                value={manual.boltHoleDiameter}
                onChange={(e) => setManual((prev) => ({...prev, boltHoleDiameter: numberVal(e.target.value)}))}
                placeholder="e.g. 26"
              />
            </Field>
            <Field label="Outer diameter D" hint="mm">
              <input
                className={inputClass}
                type="number"
                value={manual.outerDiameter}
                onChange={(e) => setManual((prev) => ({...prev, outerDiameter: numberVal(e.target.value)}))}
                placeholder="e.g. 400"
              />
            </Field>
            <Field label="Thickness (incl. CA)" hint="mm">
              <input
                className={inputClass}
                type="number"
                value={manual.thickness}
                onChange={(e) => setManual((prev) => ({...prev, thickness: numberVal(e.target.value)}))}
                placeholder="e.g. 40"
              />
            </Field>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Bolting</p>
            <Field label="Fastener standard">
              <select
                className={`${inputClass} appearance-none`}
                value={manual.fastenerStandard}
                onChange={(e) =>
                  setManual((prev) => ({
                    ...prev,
                    fastenerStandard: e.target.value as FastenerStandard,
                  }))
                }
              >
                <option value="EN">EN</option>
                <option value="ASME">ASME</option>
              </select>
            </Field>
            <Field label="Fastener type">
              <select
                className={`${inputClass} appearance-none`}
                value={manual.fastenerType}
                onChange={(e) =>
                  setManual((prev) => ({
                    ...prev,
                    fastenerType: e.target.value as FastenerType,
                  }))
                }
              >
                <option value="BOLT">Bolt</option>
                <option value="STUD">Stud</option>
              </select>
            </Field>
            <Field label="Grade / material">
              <select
                className={`${inputClass} appearance-none`}
                value={manual.fastenerGradeId}
                onChange={(e) =>
                  setManual((prev) => ({
                    ...prev,
                    fastenerGradeId: e.target.value as FastenerGradeId,
                  }))
                }
              >
                {fastenerOptions.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bolt size" hint="metric thread">
              <select
                className={`${inputClass} appearance-none`}
                value={manual.boltSize}
                onChange={(e) => setManual((prev) => ({...prev, boltSize: e.target.value}))}
              >
                {BOLT_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Corrosion allowance" hint="mm">
              <input
                className={inputClass}
                type="number"
                value={manual.corrosionAllowance ?? 0}
                onChange={(e) => setManual((prev) => ({...prev, corrosionAllowance: numberVal(e.target.value)}))}
                placeholder="e.g. 1"
                min={0}
              />
            </Field>
            <p className="text-xs text-slate-500">
              {effectiveFastener.proof > 1
                ? `Proof/Yield: ${effectiveFastener.proof}/${effectiveFastener.yield} MPa`
                : 'Proof/Yield: n/a'}{' '}
              {selectedFastener.isPlaceholder ? '· Placeholder values' : ''}
            </p>
          </div>
        </div>
      </div>

      {result ? (
        <div className="space-y-4">
          <div
            className={`rounded-2xl border p-4 ${
              pass
                ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {statusIcon}
              <span>{pass ? 'Pass' : 'Check failed'}</span>
            </div>
            {result.errors.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {result.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Summary</div>
              <div className="mt-2 space-y-1 text-sm text-slate-200">
                <div>
                  Bolt circle k: <strong>{manual.boltCircle}</strong> mm — OD: <strong>{manual.outerDiameter}</strong>{' '}
                  mm — t: <strong>{manual.thickness}</strong> mm
                </div>
                <div>
                  Bolts: <strong>{manual.boltCount}</strong> × {manual.boltSize} · Grade{' '}
                  {selectedFastener.label}
                </div>
                <div>
                  Gasket: {input.gasketFacing} / {input.gasketMaterial} / {input.gasketThickness} mm
                </div>
                <div>
                  Governing case: <strong>{result.governingCase ?? 'n/a'}</strong> · Governing code:{' '}
                  <strong>{result.governingCode ?? 'n/a'}</strong>
                </div>
              </div>
            </div>
            {result.boltSummary ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-400">Bolting checks</div>
                <div className="mt-2 text-sm text-slate-200">
                  A_req (seat/op/hydro):{' '}
                  {result.boltSummary.areas.requiredAreaSeating.toFixed(0)} /{' '}
                  {result.boltSummary.areas.requiredAreaOper.toFixed(0)} /{' '}
                  {result.boltSummary.areas.requiredAreaHydro.toFixed(0)} mm²
                  <br />
                  A_provided: {result.boltSummary.areas.provided.toFixed(0)} mm²
                  {result.boltSummary.torque ? (
                    <>
                      <br />
                      Torque: {result.boltSummary.torque.torqueMinNm?.toFixed(0) ?? result.boltSummary.torque.torqueNm.toFixed(0)}
                      –{result.boltSummary.torque.torqueMaxNm?.toFixed(0) ?? result.boltSummary.torque.torqueNm.toFixed(0)}{' '}
                      N·m ({result.boltSummary.torque.governingCaseUsed})
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <ManualCheckCharts boltSummary={result.boltSummary} thicknessSummary={result.thicknessSummary} />

          <FlangeVisualizer
            dn={input.dn}
            dims={{
              D: manual.outerDiameter,
              k: manual.boltCircle,
              bolts: manual.boltCount,
              size: manual.boltSize,
              d2: manual.boltHoleDiameter,
            }}
            selectedPN={targetPN}
            recommendedThickness={manual.thickness}
            gasketMeanDiameter={result.gasketSummary?.gasketMeanDiameter}
            gasketId={result.gasketSummary?.gasketId}
            gasketOd={result.gasketSummary?.gasketOd}
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-400">Thickness checks</div>
            {result.thicknessSummary ? (
              <div className="mt-2 text-sm text-slate-200 space-y-1">
                <div>
                  ASME t_op/t_test: {result.thicknessSummary.requiredAsmeOp.toFixed(2)} /{' '}
                  {result.thicknessSummary.requiredAsmeTest.toFixed(2)} mm
                </div>
                <div>
                  EN t_op/t_test: {result.thicknessSummary.requiredEnOp.toFixed(2)} /{' '}
                  {result.thicknessSummary.requiredEnTest.toFixed(2)} mm
                </div>
                <div>
                  Required + CA: {result.thicknessSummary.requiredWithCA.toFixed(2)} mm · Provided:{' '}
                  {result.thicknessSummary.provided.toFixed(2)} mm
                </div>
                <div>
                  Utilization: {(result.thicknessSummary.utilization * 100).toFixed(0)}% (
                  {result.thicknessSummary.pass ? 'pass' : 'fail'})
                </div>
              </div>
            ) : null}
          </div>

          {result.gasketSummary ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-400">Gasket loads</div>
              <div className="mt-2 text-sm text-slate-200 space-y-1">
                <div>
                  G_eff {result.gasketSummary.gasketMeanDiameter.toFixed(1)} mm · b_eff{' '}
                  {result.gasketSummary.gasketWidth.toFixed(1)} mm
                </div>
                <div>
                  Wm1 / Wm2_op / Wm2_hydro:{' '}
                  {result.gasketSummary.Wm1.toFixed(0)} / {result.gasketSummary.Wm2_op.toFixed(0)} /{' '}
                  {result.gasketSummary.Wm2_hydro.toFixed(0)} N
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
          <Target size={16} className="text-slate-400" />
          <span>Enter geometry and press Check to run manual verification.</span>
        </div>
      )}
    </div>
  );
}
