import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {DEFAULT_PARAMS} from '../constants';
import {getLayoutStrategy} from '../core/layout-strategies';
import type {GeneratorParams, ModifiedHole, Point} from '../types';
import {generateStepInWorker, warmupCadWorker} from '../services/cad-worker-client';
import type {CadWorkerProgressMessage} from '../services/cad-worker-protocol';

type WorkerStatus = 'idle' | 'warming' | 'ready' | 'error';

const clampPositive = (value: number, min = 0) => (Number.isFinite(value) ? Math.max(min, value) : min);
const toSafeNumber = (value: string, fallback: number) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export type UseGeneratorStateResult = {
  params: GeneratorParams;
  setParams: React.Dispatch<React.SetStateAction<GeneratorParams>>;
  tubeCoords: Point[];
  handleChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  workerStatus: WorkerStatus;
  workerError: string | null;
  warmupWorker: () => Promise<void>;
  generateStep: (options?: {
    onProgress?: (message: CadWorkerProgressMessage) => void;
    modifiedHoles?: Map<string, ModifiedHole>;
  }) => Promise<ArrayBuffer>;
};

export default function useGeneratorState(): UseGeneratorStateResult {
  const [params, setParams] = useState<GeneratorParams>(DEFAULT_PARAMS);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>('idle');
  const [workerError, setWorkerError] = useState<string | null>(null);
  const warmupStarted = useRef(false);

  const tubeCoords = useMemo<Point[]>(
    () => getLayoutStrategy(params.tubeLayout).calculatePoints(params),
    [params],
  );

  const warmupWorker = useCallback(async () => {
    if (workerStatus === 'ready') return;
    if (workerStatus === 'warming') return;
    setWorkerStatus('warming');
    setWorkerError(null);
    try {
      await warmupCadWorker();
      setWorkerStatus('ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setWorkerError(message);
      setWorkerStatus('error');
      throw error;
    }
  }, [workerStatus]);

  useEffect(() => {
    if (warmupStarted.current) return;
    warmupStarted.current = true;
    void warmupWorker();
  }, [warmupWorker]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {name, value, type} = event.target;
    setParams((prev) => {
      const key = name as keyof GeneratorParams;
      if (type !== 'number') {
        return {...prev, [key]: value} as GeneratorParams;
      }

      const fallback = prev[key] as number;
      const parsed = toSafeNumber(value, fallback);

      if (name === 'passCount') {
        return {...prev, [key]: Math.max(1, Math.round(parsed))} as GeneratorParams;
      }

      return {...prev, [key]: clampPositive(parsed)} as GeneratorParams;
    });
  }, []);

  const generateStep = useCallback(
    async (options?: {
      onProgress?: (message: CadWorkerProgressMessage) => void;
      modifiedHoles?: Map<string, ModifiedHole>;
    }) => {
      if (workerStatus !== 'ready') {
        await warmupWorker();
      }
      return generateStepInWorker(params, tubeCoords, options?.modifiedHoles, {onProgress: options?.onProgress});
    },
    [params, tubeCoords, warmupWorker, workerStatus],
  );

  return {
    params,
    setParams,
    tubeCoords,
    handleChange,
    workerStatus,
    workerError,
    warmupWorker,
    generateStep,
  };
}
