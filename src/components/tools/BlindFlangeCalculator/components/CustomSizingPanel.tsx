import React, {useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {Bolt, Calculator, CircleDot, Gauge, Layers, Settings2, ShieldCheck, Weight} from 'lucide-react';
import {
  calculateCustomBlindFlange,
  getCustomSizingFailure,
  getFastenerGradeLabel,
  type CustomPreference,
  type CustomSizingResult,
} from '../custom';
import {isFastenerPlaceholder, resolveFastenerSelection} from '../data';
import FlangeVisualizer from './FlangeVisualizer';
import ManualCheckPanel from './ManualCheckPanel';
import type {CalculationInput} from '../bfTypes';
import type {ManualCheckResult, ManualMode} from '../manualCheckTypes';

type Props = {
  input: CalculationInput;
  targetPN: number;
  maxAvailablePN?: number;
  onResultChange?: (value: CustomSizingResult | null) => void;
  onManualResultChange?: (value: ManualCheckResult | null) => void;
};

const formatFixed = (value: number, digits = 1) => value.toFixed(digits);

const Radio = ({
  name,
  value,
  checked,
  label,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: (value: string) => void;
}) => (
  <label className="flex items-center gap-2 text-sm text-slate-200">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={(event) => onChange(event.target.value)}
      className="accent-cyan-400"
    />
    <span>{label}</span>
  </label>
);

const ResultCard = ({
  icon,
  label,
  value,
  unit,
  subtext,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  highlight?: boolean;
}) => (
  <div
    className={`rounded-2xl border p-4 ${
      highlight
        ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
        : 'border-slate-800 bg-slate-900/70 text-slate-100'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="mt-1 text-cyan-300">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold">
          {value} {unit ? <span className="text-sm font-normal text-slate-400">{unit}</span> : null}
        </p>
        {subtext ? <p className="mt-1 text-xs text-slate-400">{subtext}</p> : null}
      </div>
    </div>
  </div>
);

export default function CustomSizingPanel({
  input,
  targetPN,
  maxAvailablePN,
  onResultChange,
  onManualResultChange,
}: Props) {
  const [preference, setPreference] = useState<CustomPreference>('min_weight');
  const [mode, setMode] = useState<ManualMode>('auto');
  const fastenerSelection = useMemo(() => resolveFastenerSelection(input), [input]);
  const fastenerPlaceholder = isFastenerPlaceholder(fastenerSelection.entry);
  const fastenerPlaceholderNote = fastenerSelection.entry.notes ?? '';
  const custom = useMemo(() => {
    if (mode !== 'auto') return null;
    return calculateCustomBlindFlange(input, targetPN, {
      fastenerStandard: fastenerSelection.standard,
      fastenerType: fastenerSelection.type,
      fastenerGradeId: fastenerSelection.gradeId,
      preference,
    });
  }, [mode, input, targetPN, fastenerSelection.standard, fastenerSelection.type, fastenerSelection.gradeId, preference]);
  const failure = useMemo(
    () =>
      custom && mode === 'auto'
        ? null
        : getCustomSizingFailure(input, targetPN, {
            fastenerStandard: fastenerSelection.standard,
            fastenerType: fastenerSelection.type,
            fastenerGradeId: fastenerSelection.gradeId,
            preference,
          }),
    [custom, mode, input, targetPN, fastenerSelection.standard, fastenerSelection.type, fastenerSelection.gradeId, preference],
  );
  const fastenerLabel = getFastenerGradeLabel(fastenerSelection.gradeId);
  const fastenerLabelFull = `${fastenerSelection.standard} ${fastenerSelection.type} · ${fastenerLabel}`;
  const gasketId = custom?.result.gasketId ?? custom?.debug.gasketId ?? null;
  const gasketOd = custom?.result.gasketOd ?? custom?.debug.gasketOd ?? null;
  const boltCircleMinStandard = custom?.debug.boltCircleMinStandard ?? null;
  const boltCircleClamped = custom?.debug.boltCircleClamped ?? false;
  const gasketIdLabel = gasketId === null || gasketId === undefined ? '-' : formatFixed(gasketId, 0);
  const gasketOdLabel = gasketOd === null || gasketOd === undefined ? '-' : formatFixed(gasketOd, 0);
  const gasketMissingIdOd = gasketId === null || gasketId === undefined || gasketOd === null || gasketOd === undefined;
  const boltCircleComment =
    boltCircleClamped && boltCircleMinStandard
      ? `k clamped to EN1092 max-PN baseline: ${formatFixed(boltCircleMinStandard, 0)} mm`
      : 'From candidate set';

  useEffect(() => {
    if (mode === 'auto') {
      onResultChange?.(custom);
      onManualResultChange?.(null);
    } else {
      onResultChange?.(null);
    }
  }, [custom, mode, onResultChange, onManualResultChange]);

  const headerCopy =
    maxAvailablePN && maxAvailablePN < targetPN
      ? `For DN ${input.dn} this build has no EN 1092-1 standard dimensions for PN ${targetPN} (max: PN ${maxAvailablePN}).`
      : `For DN ${input.dn} there are no EN 1092-1 standard dimensions for PN ${targetPN}.`;

  const modeToggle = (
    <div className="inline-flex rounded-full border border-slate-800 bg-slate-950/60 p-1 text-xs">
      {(['auto', 'manual'] as ManualMode[]).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            setMode(value);
            if (value === 'manual') {
              onManualResultChange?.(null);
            }
          }}
          className={`rounded-full px-3 py-1 font-semibold transition ${
            mode === value ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-cyan-100'
          }`}
        >
          {value === 'auto' ? 'Auto sizing' : 'Manual check'}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <Calculator size={14} />
              Custom sizing (not EN 1092-1)
            </div>
            <h3 className="text-lg font-semibold text-slate-100">Blind flange sizing for non-standard PN</h3>
            <p className="text-sm text-slate-300">{headerCopy}</p>
            {fastenerPlaceholder ? (
              <p className="mt-2 text-sm text-amber-200">
                Fastener data missing for {fastenerLabelFull}. {fastenerPlaceholderNote}
              </p>
            ) : null}
            {failure && mode === 'auto' ? (
              <p className="mt-2 text-sm text-amber-200">
                Fail: {failure.case} A_req {formatFixed(failure.requiredArea, 0)} mm² &gt; A_provided{' '}
                {formatFixed(failure.providedArea, 0)} mm².
              </p>
            ) : null}
            <p className="text-xs text-slate-400">
              The script picks the minimum feasible thickness and a bolt pattern (count + size) from typical
              combinations. This is a preliminary estimate — verify against the project method before release.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            {modeToggle}
            <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                <Settings2 size={14} />
                Selection parameters
              </div>
              <div className="mt-3 space-y-3">
                <div className="text-xs uppercase tracking-wide text-slate-400">Fastener</div>
                <div className="mt-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-100">
                  {fastenerLabelFull}
                </div>
                <p className="text-xs text-slate-500">
                  Affects pass/fail and tightening torque. Change in the left panel (Bolting).
                </p>

                <div className="pt-1">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Priority</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <Radio
                      name="preference"
                      value="min_weight"
                      checked={preference === 'min_weight'}
                      label="Minimum weight (estimate)"
                      onChange={(value) => setPreference(value as CustomPreference)}
                    />
                    <Radio
                      name="preference"
                      value="min_bolts"
                      checked={preference === 'min_bolts'}
                      label="Minimum bolts"
                      onChange={(value) => setPreference(value as CustomPreference)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {mode === 'manual' ? (
        <ManualCheckPanel
          input={input}
          targetPN={targetPN}
          onManualResultChange={(value) => onManualResultChange?.(value)}
        />
      ) : null}

      <AnimatePresence mode="wait">
        {mode === 'auto' && custom ? (
          <motion.div
            key="custom-result"
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -8}}
            transition={{duration: 0.25}}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ResultCard
                highlight
                icon={<Layers size={20} />}
                label="Recommended thickness"
                value={formatFixed(custom.result.recommendedThickness, 0)}
                unit="mm"
                subtext={`Calculated: ${formatFixed(custom.result.finalThickness, 2)} mm`}
              />
              <ResultCard
                icon={<Weight size={20} />}
                label="Weight (estimate)"
                value={formatFixed(custom.result.weight, 1)}
                unit="kg"
                subtext="Based on D and thickness"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ResultCard
                icon={<Bolt size={20} />}
                label="Bolts"
                value={custom.result.dims.bolts.toString()}
                unit="qty"
                subtext={`Thread ${custom.result.dims.size}`}
              />
              <ResultCard
                icon={<CircleDot size={20} />}
                label="Gasket mean diameter"
                value={formatFixed(custom.result.gasketMeanDiameter, 0)}
                unit="mm"
                subtext="G_eff (EN 1514-1)"
              />
              <ResultCard
                icon={<Gauge size={20} />}
                label="Allowable stress"
                value={formatFixed(custom.result.allowableStressOp, 1)}
                unit="MPa"
                subtext="Operating"
              />
              <ResultCard
                icon={<ShieldCheck size={20} />}
                label="Allowable stress"
                value={formatFixed(custom.result.allowableStressTest, 1)}
                unit="MPa"
                subtext="Test"
              />
            </div>

            <FlangeVisualizer
              dn={input.dn}
              dims={custom.result.dims}
              selectedPN={custom.result.selectedPN}
              recommendedThickness={custom.result.recommendedThickness}
              gasketMeanDiameter={custom.result.gasketMeanDiameter}
              gasketId={gasketId ?? undefined}
              gasketOd={gasketOd ?? undefined}
            />

            <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-6">
              <h3 className="text-lg font-semibold text-slate-100">Calculation details</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-slate-300">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr>
                      <th className="py-2 text-left">Parameter</th>
                      <th className="py-2 text-left">Value</th>
                      <th className="py-2 text-left">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-800">
                      <td className="py-2 font-medium text-slate-200">PN (target)</td>
                      <td className="py-2">PN {targetPN}</td>
                      <td className="py-2 text-slate-400">From operating {input.pressureOp} bar</td>
                    </tr>
                    <tr className="border-t border-slate-800">
                      <td className="py-2 font-medium text-slate-200">Gasket geometry</td>
                      <td className="py-2">
                        ID {gasketIdLabel} / OD {gasketOdLabel} mm
                      </td>
                      <td className="py-2 text-slate-400">
                        G_eff {formatFixed(custom.result.gasketMeanDiameter, 1)} mm · {input.gasketFacing} · {input.gasketMaterial} ·{' '}
                        {input.gasketThickness} mm
                        {gasketMissingIdOd ? ' · ID/OD unavailable (using G_eff only)' : ''}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-800">
                      <td className="py-2 font-medium text-slate-200">Bolt circle (k)</td>
                      <td className="py-2">{custom.result.dims.k} mm</td>
                      <td className="py-2 text-slate-400">{boltCircleComment}</td>
                    </tr>
                    <tr className="border-t border-slate-800">
                      <td className="py-2 font-medium text-slate-200">Outer D</td>
                      <td className="py-2">{custom.result.dims.D} mm</td>
                      <td className="py-2 text-slate-400">From edge clearance</td>
                    </tr>
                    <tr className="border-t border-slate-800">
                      <td className="py-2 font-medium text-slate-200">Min. thickness</td>
                      <td className="py-2">{formatFixed(custom.result.minThickness, 2)} mm</td>
                      <td className="py-2 text-slate-400">Before corrosion allowance</td>
                    </tr>
                    <tr className="border-t border-slate-800">
                      <td className="py-2 font-medium text-slate-200">Thickness (ASME / EN)</td>
                      <td className="py-2">
                        {formatFixed(custom.debug.thicknessAsme, 2)} / {formatFixed(custom.debug.thicknessEn, 2)} mm
                      </td>
                      <td className="py-2 text-slate-400">
                        {custom.debug.governingCode === 'ASME' ? 'ASME governs' : 'EN 13445 governs'}
                      </td>
                    </tr>
                    <tr className="border-t border-slate-800">
                      <td className="py-2 font-medium text-slate-200">Bolt area</td>
                      <td className="py-2">
                        {formatFixed(custom.debug.providedBoltArea, 0)} / {formatFixed(custom.debug.requiredBoltArea, 0)} mm²
                      </td>
                      <td className="py-2 text-slate-400">Required / provided</td>
                    </tr>
                    {custom.result.boltTorque ? (
                      <tr className="border-t border-slate-800">
                        <td className="py-2 font-medium text-slate-200">Torque (bolt)</td>
                        <td className="py-2">
                          {formatFixed(custom.result.boltTorque.torqueMinNm ?? custom.result.boltTorque.torqueNm, 0)}-
                          {formatFixed(custom.result.boltTorque.torqueMaxNm ?? custom.result.boltTorque.torqueNm, 0)} N·m
                        </td>
                        <td className="py-2 text-slate-400">
                          {custom.result.boltTorque.governingCaseUsed}, util {formatFixed(custom.result.boltTorque.preloadUtilization * 100, 0)}%
                          {custom.result.boltTorque.cappedByProof ? ' (capped)' : ''}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="border-t border-slate-800">
                      <td className="py-2 font-medium text-slate-200">Wm1 / Wm2 (op/hydro)</td>
                      <td className="py-2">
                        {formatFixed(custom.debug.Wm1, 0)} / {formatFixed(custom.debug.Wm2_op, 0)} / {formatFixed(custom.debug.Wm2_hydro, 0)} N
                      </td>
                      <td className="py-2 text-slate-400">Seating / Operating / Hydro</td>
                    </tr>
                    <tr
                      className={`border-t border-slate-800 ${
                        custom.debug.providedBoltArea < custom.debug.requiredBoltArea ? 'text-amber-200' : ''
                      }`}
                    >
                      <td className="py-2 font-medium text-slate-200">A_req (seat/op/hydro)</td>
                      <td className="py-2">
                        {formatFixed(custom.debug.requiredAreaSeating, 0)} / {formatFixed(custom.debug.requiredAreaOper, 0)} /{' '}
                        {formatFixed(custom.debug.requiredAreaHydro, 0)} mm²
                      </td>
                      <td className="py-2 text-slate-400">
                        {custom.debug.providedBoltArea < custom.debug.requiredBoltArea
                          ? `Fail: ${custom.debug.governingCase} (A_req > A_provided)`
                          : `Governing: ${custom.debug.governingCase}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <details className="rounded-3xl border border-slate-800 bg-slate-950/40 p-6">
              <summary className="cursor-pointer select-none text-sm font-semibold text-slate-100">Method and formulas</summary>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 font-mono text-xs text-slate-200">
                  <div>1) Geometry: getGasketGeometry → ID/OD, G_eff=(ID+OD)/2, b_eff from EN 1514-1 tables.</div>
                  <div>2) Bolt circle: max(calc by bolt size, gasket OD + clearance, k clamp to EN1092 max PN).</div>
                  <div>3) Pressure footprint: F = π·(ID/2)^2·P.</div>
                  <div>4) Gasket loads: Wm1 = y·π·G·b; Wm2 = π·G²·P/4 + 2·π·b·G·m·P (op/hydro).</div>
                  <div>5) Bolt check: seating/oper/hydro A_req = W / σ_allow(bolt); need n·A_s ≥ each A_req.</div>
                  <div>6) Lever arm: a = (k - G_eff)/2 with minimum clearance.</div>
                  <div>7) Thickness ASME: t = √(6·W·a / (π·G·S_allow)).</div>
                  <div>8) Thickness EN: same form with EN factor for bolted flat end.</div>
                  <div>9) Final: max(ASME, EN, op/test) + corrosion; rounded to standard plate.</div>
                  <div>10) Allowables and P_test come from code layer (temperature dependent).</div>
                </div>
              </div>
            </details>
          </motion.div>
        ) : mode === 'auto' ? (
          <motion.div
            key="custom-fail"
            initial={{opacity: 0, y: 12}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0}}
            transition={{duration: 0.2}}
            className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-100"
          >
            <p className="text-sm uppercase tracking-wide text-amber-200">No combination found</p>
            <h3 className="mt-2 text-lg font-semibold">Could not pick a bolt pattern</h3>
            <p className="mt-2 text-sm text-amber-200">
              {fastenerPlaceholder
                ? `Fastener properties are missing for ${fastenerLabelFull}. Provide verified proof/yield/allowables to enable sizing.`
                : `For the selected fastener grade ${fastenerLabel} no combinations (count/size) from the typical set satisfied bolt area checks.`}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
