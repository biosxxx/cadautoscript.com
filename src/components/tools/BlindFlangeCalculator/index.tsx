import {useCallback, useEffect, useMemo, useState} from 'react';
import {Gauge, Layers} from 'lucide-react';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import ExportActions from './components/ExportActions';
import {AVAILABLE_DNS, DEFAULT_FASTENER_ID, MATERIALS, getFastenerOptionsFor} from './data';
import {getHydroTestPressure} from './allowables';
import type {CustomSizingResult} from './custom';
import {calculateBlindFlange, getCalculatedPN, getMaxAvailablePN} from './utils';
import type {
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  FrictionPreset,
  GasketFacing,
  GasketMaterial,
  MaterialId,
  TighteningMethod,
} from './bfTypes';
import type {ManualCheckResult} from './manualCheckTypes';

const MAX_STANDARD_PN = 400;

export default function BlindFlangeCalculator() {
  const [dn, setDn] = useState(100);
  const [pressureOp, setPressureOp] = useState(10);
  const [pressureTest, setPressureTest] = useState(15);
  const [temperature, setTemperature] = useState(20);
  const [material, setMaterial] = useState<MaterialId>('P265GH');
  const [corrosionAllowance, setCorrosionAllowance] = useState(1);
  const [gasketMaterial, setGasketMaterial] = useState<GasketMaterial>('graphite');
  const [gasketThickness, setGasketThickness] = useState(2);
  const [gasketFacing, setGasketFacing] = useState<GasketFacing>('RF');
  const [frictionPreset, setFrictionPreset] = useState<FrictionPreset>('dry');
  const [tighteningMethod, setTighteningMethod] = useState<TighteningMethod>('k_factor');
  const [fastenerStandard, setFastenerStandard] = useState<FastenerStandard>('EN');
  const [fastenerType, setFastenerType] = useState<FastenerType>('BOLT');
  const [fastenerGradeId, setFastenerGradeId] = useState<FastenerGradeId>(DEFAULT_FASTENER_ID);
  const [manualTestPressure, setManualTestPressure] = useState(false);
  const [customResult, setCustomResult] = useState<CustomSizingResult | null>(null);
  const [manualCheckResult, setManualCheckResult] = useState<ManualCheckResult | null>(null);

  const calculatedPn = useMemo(() => getCalculatedPN(pressureOp), [pressureOp]);
  const maxAvailablePn = useMemo(() => getMaxAvailablePN(dn), [dn]);
  const exceedsPnCap = pressureOp > MAX_STANDARD_PN || pressureTest > MAX_STANDARD_PN;
  const forceCustom = exceedsPnCap || (maxAvailablePn !== undefined && calculatedPn > maxAvailablePn);

  const hydroAuto = useMemo(
    () =>
      getHydroTestPressure({
        code: 'EN13445',
        P_design_bar: pressureOp,
        P_op_bar: pressureOp,
        T_design_C: temperature,
        T_test_C: 20,
        materialId: material,
      }),
    [pressureOp, temperature, material],
  );

  const hydroAutoRounded = Number.parseFloat(hydroAuto.P_test_bar.toFixed(1));
  const isTestBelowAuto = manualTestPressure && pressureTest < hydroAutoRounded;

  useEffect(() => {
    const available = getFastenerOptionsFor(fastenerStandard, fastenerType);
    const hasCurrent = available.some((entry) => entry.id === fastenerGradeId);
    if (!hasCurrent && available.length > 0) {
      setFastenerGradeId(available[0].id);
    }
  }, [fastenerStandard, fastenerType, fastenerGradeId]);

  useEffect(() => {
    if (!manualTestPressure) {
      setPressureTest(Math.max(hydroAutoRounded, pressureOp));
    }
  }, [manualTestPressure, hydroAutoRounded, pressureOp]);

  const input = useMemo(
    () => ({
      dn,
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
    }),
    [
      dn,
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
    ],
  );

  const result = useMemo(() => calculateBlindFlange(input), [input]);

  useEffect(() => {
    if (result) {
      if (forceCustom) {
      } else {
        setCustomResult(null);
        setManualCheckResult(null);
      }
    }
  }, [result, forceCustom]);

  const selectedPn = result?.selectedPN;

  const handleCustomResultChange = useCallback((value: CustomSizingResult | null) => {
    setCustomResult(value);
    setManualCheckResult(null);
  }, []);

  const handleManualResultChange = useCallback((value: ManualCheckResult | null) => {
    setManualCheckResult(value);
    setCustomResult(null);
  }, []);

  const exportResult = customResult?.result ?? result;

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <Layers size={14} />
              EN 13445-3 / EN 1092-1
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Blind Flange Calculator</h1>
              <p className="text-sm text-slate-400">
                Automatic PN selection and thickness sizing with a quick weight estimate.
              </p>
            </div>
          </div>
          <ExportActions
            input={input}
            result={exportResult}
            manualCheckResult={manualCheckResult}
            targetPN={calculatedPn}
            customDebug={customResult?.debug}
          />
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <InputForm
              dn={dn}
              pressureOp={pressureOp}
              pressureTest={pressureTest}
              temperature={temperature}
              material={material}
              corrosionAllowance={corrosionAllowance}
              gasketMaterial={gasketMaterial}
              gasketThickness={gasketThickness}
              gasketFacing={gasketFacing}
              frictionPreset={frictionPreset}
              tighteningMethod={tighteningMethod}
              fastenerStandard={fastenerStandard}
              fastenerType={fastenerType}
              fastenerGradeId={fastenerGradeId}
              autoTestPressure={hydroAutoRounded}
              autoTestBasis={hydroAuto.basis}
              autoTestRatio={hydroAuto.ratioUsed}
              autoTestClampedToOp={hydroAuto.clampedToOp}
              showTestPressureWarning={isTestBelowAuto}
              availableDns={AVAILABLE_DNS}
              materials={MATERIALS}
              onDnChange={setDn}
              onPressureOpChange={(value) => {
                setPressureOp(value);
                setManualTestPressure(false);
              }}
              onPressureTestChange={(value) => {
                setPressureTest(Math.max(value, pressureOp));
                setManualTestPressure(true);
              }}
              onTemperatureChange={setTemperature}
              onMaterialChange={setMaterial}
              onCorrosionAllowanceChange={setCorrosionAllowance}
              onGasketMaterialChange={setGasketMaterial}
              onGasketThicknessChange={setGasketThickness}
              onGasketFacingChange={setGasketFacing}
              onFrictionPresetChange={setFrictionPreset}
              onTighteningMethodChange={setTighteningMethod}
              onFastenerStandardChange={setFastenerStandard}
              onFastenerTypeChange={setFastenerType}
              onFastenerGradeChange={setFastenerGradeId}
            />

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-cyan-300">
                  <Gauge size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">PN selection</p>
                  {!forceCustom ? (
                    <p className="mt-1">
                      Operating pressure {pressureOp} bar maps to PN {calculatedPn}. Selected class:
                      <span className="ml-1 font-semibold text-slate-100">
                        {selectedPn ? `PN ${selectedPn}` : 'No match'}
                      </span>
                      .
                    </p>
                  ) : (
                    <p className="mt-1 text-amber-200">
                      Operating pressure {pressureOp} bar exceeds standard PN {MAX_STANDARD_PN}. Switching to custom sizing.
                    </p>
                  )}
                  {maxAvailablePn && maxAvailablePn < calculatedPn ? (
                    <p className="mt-2 text-xs text-amber-200">
                      This build only includes EN 1092-1 bolt patterns up to PN {maxAvailablePn} for DN {dn}. Add PN{' '}
                      {calculatedPn} data to enable high-pressure sizing.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ResultsPanel
             result={forceCustom ? null : result}
             customResult={customResult}
             manualCheckResult={manualCheckResult}
             dn={dn}
             pressureOp={pressureOp}
             targetPN={calculatedPn}
             maxAvailablePN={maxAvailablePn}
             input={input}
             onCustomResultChange={handleCustomResultChange}
             onManualResultChange={handleManualResultChange}
           />
          </div>
        </div>
      </div>
    </div>
  );
}
