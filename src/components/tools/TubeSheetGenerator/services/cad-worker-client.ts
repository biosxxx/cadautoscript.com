import type {GeneratorParams, Point} from '../types';
import type {
  CadWorkerGenerateStepRequest,
  CadWorkerMessage,
  CadWorkerProgressMessage,
  CadWorkerWarmupRequest,
} from './cad-worker-protocol';

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
};

type PendingRequest = {
  resolve: (value: ArrayBuffer) => void;
  reject: (error: Error) => void;
  onProgress?: (message: CadWorkerProgressMessage) => void;
};

let worker: Worker | null = null;
const pending = new Map<string, PendingRequest>();

const getWorker = () => {
  if (worker) {
    return worker;
  }

  worker = new Worker(new URL('./cad-worker.ts', import.meta.url), {type: 'module'});
  worker.addEventListener('message', (event: MessageEvent<CadWorkerMessage>) => {
    const message = event.data;
    if (!message || typeof message !== 'object') {
      return;
    }

    if (message.type === 'progress') {
      const handler = pending.get(message.requestId);
      handler?.onProgress?.(message);
      return;
    }

    if (message.type === 'result') {
      const handler = pending.get(message.requestId);
      if (!handler) return;
      pending.delete(message.requestId);

      if (message.ok) {
        // TypeScript должен автоматически понять тип payload, если discriminated union настроен верно.
        // Если нет, принудительно кастуем, так как мы знаем логику.
        handler.resolve((message.payload as {step: ArrayBuffer}).step);
      } else {
        const payload = message.payload as {message: string; stack?: string};
        const err = new Error(payload.message);
        if (payload.stack) {
          err.stack = payload.stack;
        }
        handler.reject(err);
      }
    }
  });

  worker.addEventListener('error', (event) => {
    const error = event.error instanceof Error ? event.error : new Error(String(event.message));
    pending.forEach((handler) => handler.reject(error));
    pending.clear();
  });

  return worker;
};

export const warmupCadWorker = async () => {
  const requestId = createRequestId();
  const w = getWorker();
  await new Promise<ArrayBuffer>((resolve, reject) => {
    pending.set(requestId, {resolve, reject});
    const request: CadWorkerWarmupRequest = {type: 'warmup', requestId};
    w.postMessage(request);
  });
};

export const generateStepInWorker = async (
  params: GeneratorParams,
  tubeCoords: Point[],
  modifiedHoles?: Map<string, import('../types').ModifiedHole>,
  options?: {onProgress?: (message: CadWorkerProgressMessage) => void},
) => {
  const requestId = createRequestId();
  const w = getWorker();

  const step = await new Promise<ArrayBuffer>((resolve, reject) => {
    pending.set(requestId, {resolve, reject, onProgress: options?.onProgress});
    const request: CadWorkerGenerateStepRequest = {
      type: 'generate-step',
      requestId,
      params,
      tubeCoords,
      modifiedHoles: modifiedHoles ? Array.from(modifiedHoles.entries()) : undefined,
    };
    w.postMessage(request);
  });

  return step;
};
