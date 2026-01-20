import type {ReactNode} from 'react';
import {Droplet, Gauge, Sliders, Thermometer} from 'lucide-react';
import type {
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  FrictionPreset,
  GasketFacing,
  GasketMaterial,
  GeometryMode,
  InputFormProps,
  MaterialId,
  TighteningMethod,
} from '../bfTypes';
import {GASKET_OPTIONS, getFastenerCatalogEntry, getFastenerOptionsFor, isFastenerPlaceholder} from '../data';

const inputClassName =
  'w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400';

const Field = ({label, hint, children}: {label: string; hint?: string; children: ReactNode}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </div>
    {children}
  </div>
);

const toNumber = (value: string): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ModeToggle = ({value, onChange}: {value: GeometryMode; onChange: (value: GeometryMode) => void}) => (
  <div className="inline-flex rounded-full border border-slate-800 bg-slate-950/60 p-1 text-xs">
    {(['standard', 'custom'] as GeometryMode[]).map((mode) => (
      <button
        key={mode}
        type="button"
        onClick={() => onChange(mode)}
        className={`rounded-full px-3 py-1 font-semibold transition ${
          value === mode ? 'bg-cyan-500/20 text-cyan-100' : 'text-slate-400 hover:text-cyan-100'
        }`}
      >
        {mode === 'standard' ? 'Standard (DN)' : 'Custom geometry'}
      </button>
    ))}
  </div>
);

export default function InputForm({
  geometryMode,
  dn,
  customOuterDiameter,
  customNozzleId,
  geometryMatchNote,
  pressureOp,
  pressureTest,
  temperature,
  material,
  corrosionAllowance,
  gasketMaterial,
  gasketThickness,
  gasketFacing,
  frictionPreset,
  tighteningMethod,
  fastenerStandard,
  fastenerType,
  fastenerGradeId,
  autoTestPressure,
  autoTestBasis,
  autoTestRatio,
  autoTestClampedToOp,
  showTestPressureWarning,
  availableDns,
  materials,
  onGeometryModeChange,
  onDnChange,
  onCustomOuterDiameterChange,
  onCustomNozzleIdChange,
  onPressureOpChange,
  onPressureTestChange,
  onTemperatureChange,
  onMaterialChange,
  onCorrosionAllowanceChange,
  onGasketMaterialChange,
  onGasketThicknessChange,
  onGasketFacingChange,
  onFrictionPresetChange,
  onTighteningMethodChange,
  onFastenerStandardChange,
  onFastenerTypeChange,
  onFastenerGradeChange,
}: InputFormProps) {
  const fastenerOptions = getFastenerOptionsFor(fastenerStandard, fastenerType);
  const selectedFastener = getFastenerCatalogEntry(fastenerGradeId);
  const fastenerNote = selectedFastener.notes ?? '';
  const fastenerIsPlaceholder = isFastenerPlaceholder(selectedFastener);
  const fastenerStrength =
    !fastenerIsPlaceholder && selectedFastener.proofStressMPa > 1
      ? `Proof/Yield: ${selectedFastener.proofStressMPa} / ${selectedFastener.yieldStressMPa} MPa`
      : 'Proof/Yield: n/a';

  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-slate-950/40">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
          <Sliders size={18} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Parameters</h2>
          <p className="text-xs text-slate-400">EN 13445-3 sizing inputs</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Geometry mode</div>
          <ModeToggle value={geometryMode} onChange={onGeometryModeChange} />
        </div>
        {geometryMatchNote ? (
          <p className="text-xs text-amber-200">{geometryMatchNote}</p>
        ) : null}

        {geometryMode === 'standard' ? (
          <Field label="Diameter (DN)">
            <select
              className={`${inputClassName} appearance-none`}
              value={dn}
              onChange={(event) => onDnChange(toNumber(event.target.value))}
            >
              {availableDns.map((value) => (
                <option key={value} value={value}>
                  DN {value}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Flange outer diameter D" hint="mm">
              <input
                className={inputClassName}
                type="number"
                inputMode="decimal"
                min={1}
                value={customOuterDiameter ?? ''}
                onChange={(event) => onCustomOuterDiameterChange(toNumber(event.target.value))}
              />
            </Field>
            <Field label="Nozzle / pipe inner diameter ID" hint="mm">
              <input
                className={inputClassName}
                type="number"
                inputMode="decimal"
                min={1}
                value={customNozzleId ?? ''}
                onChange={(event) => onCustomNozzleIdChange(toNumber(event.target.value))}
              />
            </Field>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Operating pressure (bar)">
            <div className="relative">
              <Gauge size={16} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                className={`${inputClassName} pl-9`}
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                value={pressureOp}
                onChange={(event) => onPressureOpChange(toNumber(event.target.value))}
              />
            </div>
          </Field>
          <Field label="Test pressure (bar)" hint="Auto until edited">
            <div className="relative">
              <Gauge size={16} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                className={`${inputClassName} pl-9`}
                type="number"
                inputMode="decimal"
                min={pressureOp}
                step={0.1}
                value={pressureTest}
                onChange={(event) => onPressureTestChange(toNumber(event.target.value))}
              />
            </div>
            {Number.isFinite(autoTestPressure) ? (
              <p className="mt-2 text-xs text-slate-500">
                Auto (EN/ASME): {autoTestPressure?.toFixed(1)} bar · {autoTestBasis ?? 'n/a'} · ratio{' '}
                {autoTestRatio?.toFixed(2) ?? 'n/a'}
                {autoTestClampedToOp ? ' · clamped to P_op' : ''}
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Auto (EN/ASME): n/a</p>
            )}
            {showTestPressureWarning ? (
              <p className="mt-1 text-xs text-amber-200">
                Test pressure is below the code auto value. Consider resetting to the auto value.
              </p>
            ) : null}
          </Field>
        </div>

        <Field label="Temperature (deg C)">
          <div className="relative">
            <Thermometer size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              className={`${inputClassName} pl-9`}
              type="number"
              inputMode="decimal"
              step={1}
              value={temperature}
              onChange={(event) => onTemperatureChange(toNumber(event.target.value))}
            />
          </div>
        </Field>

        <Field label="Material">
          <select
            className={`${inputClassName} appearance-none`}
            value={material}
            onChange={(event) => onMaterialChange(event.target.value as MaterialId)}
          >
            {Object.entries(materials).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Corrosion allowance (mm)">
          <div className="relative">
            <Droplet size={16} className="absolute left-3 top-2.5 text-slate-500" />
            <input
              className={`${inputClassName} pl-9`}
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              value={corrosionAllowance}
              onChange={(event) => onCorrosionAllowanceChange(toNumber(event.target.value))}
            />
          </div>
        </Field>

        <div className="pt-2 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gasket (EN 1514-1)</div>
          <Field label="Facing">
            <select
              className={`${inputClassName} appearance-none`}
              value={gasketFacing}
              onChange={(event) => onGasketFacingChange(event.target.value as GasketFacing)}
            >
              {GASKET_OPTIONS.facings.map((facing) => (
                <option key={facing.value} value={facing.value}>
                  {facing.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Gasket material">
            <select
              className={`${inputClassName} appearance-none`}
              value={gasketMaterial}
              onChange={(event) => onGasketMaterialChange(event.target.value as GasketMaterial)}
            >
              {Object.entries(GASKET_OPTIONS.materials).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Gasket thickness (mm)">
            <select
              className={`${inputClassName} appearance-none`}
              value={gasketThickness}
              onChange={(event) => onGasketThicknessChange(Number(event.target.value))}
            >
              {GASKET_OPTIONS.thicknesses.map((t) => (
                <option key={t} value={t}>
                  {t} mm
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="pt-2 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Bolting</div>
          <Field label="Fastener standard">
            <select
              className={`${inputClassName} appearance-none`}
              value={fastenerStandard}
              onChange={(event) => onFastenerStandardChange(event.target.value as FastenerStandard)}
            >
              <option value="EN">EN</option>
              <option value="ASME">ASME</option>
            </select>
          </Field>
          <Field label="Fastener type">
            <select
              className={`${inputClassName} appearance-none`}
              value={fastenerType}
              onChange={(event) => onFastenerTypeChange(event.target.value as FastenerType)}
            >
              <option value="BOLT">Bolt</option>
              <option value="STUD">Stud</option>
            </select>
          </Field>
          <Field label="Grade / Material">
            <select
              className={`${inputClassName} appearance-none`}
              value={fastenerGradeId}
              onChange={(event) => onFastenerGradeChange(event.target.value as FastenerGradeId)}
            >
              {fastenerOptions.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">
              {fastenerStrength}
              {fastenerIsPlaceholder ? ' · Placeholder values' : ''}
              {fastenerNote ? ` · ${fastenerNote}` : ''}
            </p>
          </Field>
          <Field label="Tightening condition">
            <select
              className={`${inputClassName} appearance-none`}
              value={frictionPreset}
              onChange={(event) => onFrictionPresetChange(event.target.value as FrictionPreset)}
            >
              <option value="dry">Dry</option>
              <option value="lubricated">Lubricated</option>
            </select>
          </Field>
          <Field label="Method">
            <select
              className={`${inputClassName} appearance-none`}
              value={tighteningMethod}
              onChange={(event) => onTighteningMethodChange(event.target.value as TighteningMethod)}
            >
              <option value="k_factor">K-factor (torque = K·F·d)</option>
              {/* Detailed method disabled until implemented */}
            </select>
          </Field>
        </div>
      </div>
    </section>
  );
}
