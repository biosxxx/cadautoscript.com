import type {GeneratorParams, Point} from '../types';
import type {ModifiedHole} from '../types';

export type CadWorkerGenerateStepRequest = {
  type: 'generate-step';
  requestId: string;
  params: GeneratorParams;
  tubeCoords: Point[];
  modifiedHoles?: Array<[string, ModifiedHole]>;
};

export type CadWorkerWarmupRequest = {
  type: 'warmup';
  requestId: string;
};

export type CadWorkerRequest = CadWorkerGenerateStepRequest | CadWorkerWarmupRequest;

export type CadWorkerProgressMessage = {
  type: 'progress';
  requestId: string;
  stage: 'init' | 'geometry' | 'export';
  done: number;
  total: number;
};

export type CadWorkerResultMessage =
  | {
      type: 'result';
      requestId: string;
      ok: true;
      payload: {step: ArrayBuffer};
    }
  | {
      type: 'result';
      requestId: string;
      ok: false;
      payload: {message: string; stack?: string};
    };

export type CadWorkerMessage = CadWorkerProgressMessage | CadWorkerResultMessage;
