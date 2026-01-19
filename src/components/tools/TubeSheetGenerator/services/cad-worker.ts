/// <reference lib="webworker" />

import type {OpenCascadeInstance} from 'replicad-opencascadejs';
import type {CadWorkerMessage, CadWorkerRequest, CadWorkerResultMessage} from './cad-worker-protocol';
import type {ModifiedHole, Point} from '../types';
import {createPointKey} from '../core/geometry-utils';

type ReplicadModule = typeof import('replicad');

let replicadPromise: Promise<ReplicadModule> | null = null;
let ocInitPromise: Promise<OpenCascadeInstance> | null = null;

const loadReplicad = () => {
  if (!replicadPromise) {
    replicadPromise = import('replicad');
  }
  return replicadPromise;
};

const ensureOpenCascade = async () => {
  if (!ocInitPromise) {
    ocInitPromise = (async () => {
      const [replicadModule, ocModule] = await Promise.all([loadReplicad(), import('replicad-opencascadejs')]);
      const wasmUrl = new URL('replicad-opencascadejs/src/replicad_single.wasm', import.meta.url).toString();
      const ocFactory = ocModule.default as unknown as (options?: {
        locateFile?: (path: string, scriptDir: string) => string;
      }) => Promise<OpenCascadeInstance>;
      const oc = await ocFactory({
        locateFile: (path) => (path.endsWith('.wasm') ? wasmUrl : path),
      });
      replicadModule.setOC(oc);
      return oc;
    })();
  }

  try {
    return await ocInitPromise;
  } catch (error) {
    ocInitPromise = null;
    throw error;
  }
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;

const post = (message: CadWorkerMessage, transfer?: Transferable[]) => {
  ctx.postMessage(message, transfer ?? []);
};

const postError = (requestId: string, error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  const message: CadWorkerResultMessage = {
    type: 'result',
    requestId,
    ok: false,
    payload: {message: err.message, stack: err.stack},
  };
  post(message);
};

const chunkArray = <T,>(items: T[], chunkSize: number) => {
  if (chunkSize <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

// Функция для безопасного создания Compound из списка
const safeMakeCompound = (items: any[], makeCompoundFunc: Function) => {
    try {
        return makeCompoundFunc(items);
    } catch (e) {
        console.warn("Standard makeCompound failed, trying fallback...", e);
        return null;
    }
};

const createTubeSheetSolid = async (
  params: {boardDiameter: number; tubeDiameter: number; thickness: number},
  tubeCoords: Point[],
  modifiedHoles: Map<string, ModifiedHole>,
  onProgress: (done: number, total: number) => void,
) => {
  const replicadModule = await loadReplicad();

  // @ts-ignore
  const draw = replicadModule.draw || replicadModule.default?.draw;
  // @ts-ignore
  const makeCylinder = replicadModule.makeCylinder || replicadModule.default?.makeCylinder;
  // @ts-ignore
  const makeCompound = replicadModule.makeCompound || replicadModule.default?.makeCompound;

  const boardRadius = params.boardDiameter / 2;
  const holeRadius = params.tubeDiameter / 2;
  const thickness = params.thickness;
  const activeCoords = tubeCoords.filter(
    (coord) => !modifiedHoles.get(createPointKey(coord))?.hidden,
  );
  const total = activeCoords.length;

  console.time('[CAD-Worker] Geometry Gen');

  // ---------------------------------------------------------
  // ПОПЫТКА 1: ОПТИМИЗИРОВАННЫЙ 2D МЕТОД (Batched 2D)
  // ---------------------------------------------------------
  if (typeof draw === 'function') {
    try {
      console.log(`[CAD-Worker] Trying 2D Method for ${total} holes...`);
      let sketch = draw().circle(boardRadius);
      
      if (sketch && typeof sketch.cut === 'function') {
        const standardHoles = activeCoords
          .filter((coord) => modifiedHoles.get(createPointKey(coord))?.diameter === undefined)
          .map((coord) => draw().circle(holeRadius).translate(coord.x, coord.y));
        const customHoles = activeCoords
          .filter((coord) => modifiedHoles.get(createPointKey(coord))?.diameter !== undefined)
          .map((coord) => {
            const diameter = modifiedHoles.get(createPointKey(coord))?.diameter ?? params.tubeDiameter;
            return draw().circle(diameter / 2).translate(coord.x, coord.y);
          });

        // ????????? ?? ??????? ?????? ??? 2D (?? 1000 ????)
        // ??? ???????, ??? ?????? ?? ??????, ? ????????, ??? ??? ?????
        const BATCH_SIZE_2D = 1000;
        let processed = 0;

        const processBatches = (items: typeof standardHoles) => {
          const batches = chunkArray(items, BATCH_SIZE_2D);
          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            if (batch.length == 0) continue;
            // ???? ???????? makeCompound, ?????????? ???? ????? ??????? (??? ????????)
            if (typeof makeCompound === 'function') {
              try {
                // ????????? shape ??? compound (????????? 2D sketch ? replicad)
                const shapes = batch.map((s) => (s as any).shape || s);
                const compound = makeCompound(shapes);
                sketch = sketch.cut(compound);
              } catch (err) {
                // Fallback: ????? ????????
                sketch = sketch.cut(batch);
              }
            } else {
              sketch = sketch.cut(batch);
            }

            processed += batch.length;
            onProgress(processed, total);
          }
        };

        processBatches(standardHoles);
        processBatches(customHoles);

        const result = sketch.sketchOnPlane().extrude(thickness);
        console.timeEnd('[CAD-Worker] Geometry Gen');
        return result;
      }
    } catch (e) {
      console.warn("[CAD-Worker] 2D generation failed, falling back to 3D. Reason:", e);
    }
  }

  // ---------------------------------------------------------
  // ПОПЫТКА 2: ОПТИМИЗИРОВАННЫЙ 3D МЕТОД (Batched Compound)
  // ---------------------------------------------------------
  if (typeof makeCylinder !== 'function') {
    throw new Error('Replicad makeCylinder() export not found.');
  }

  console.log(`[CAD-Worker] Fallback to 3D Method for ${total} holes...`);
  let mainBody = makeCylinder(boardRadius, thickness);
  
  const standardCoords = activeCoords.filter(
    (coord) => modifiedHoles.get(createPointKey(coord))?.diameter === undefined,
  );
  const customCoords = activeCoords.filter(
    (coord) => modifiedHoles.get(createPointKey(coord))?.diameter !== undefined,
  );

  const standardHoles = standardCoords.map((coord) =>
    makeCylinder(holeRadius, thickness).translate(coord.x, coord.y, 0),
  );
  const customHoles = customCoords.map((coord) => {
    const diameter = modifiedHoles.get(createPointKey(coord))?.diameter ?? params.tubeDiameter;
    return makeCylinder(diameter / 2, thickness).translate(coord.x, coord.y, 0);
  });

  const BATCH_SIZE_3D = 200; 
  let processed = 0;

  const processBatches = (items: typeof standardHoles) => {
    const batches = chunkArray(items, BATCH_SIZE_3D);
    console.log(`[CAD-Worker] Processing in ${batches.length} batches...`);
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (batch.length === 0) continue;

      // ???????????: ?????????? ????? ? Compound ????? ???????
      if (typeof makeCompound === 'function') {
        try {
          const batchCompound = safeMakeCompound(batch, makeCompound);
          if (batchCompound) {
            mainBody = mainBody.cut(batchCompound);
          } else {
            mainBody = mainBody.cut(batch);
          }
        } catch (e) {
          console.warn(`[CAD-Worker] Batch ${i} failed optimization, cutting sequentially.`);
          for (const hole of batch) {
            mainBody = mainBody.cut(hole);
          }
        }
      } else {
        try {
          mainBody = mainBody.cut(batch);
        } catch (e) {
          for (const hole of batch) {
            mainBody = mainBody.cut(hole);
          }
        }
      }

      processed += batch.length;
      // ????????? ???????? ????? ?????? ?????
      onProgress(processed, total);
    }
  };

  processBatches(standardHoles);
  processBatches(customHoles);

  console.timeEnd('[CAD-Worker] Geometry Gen');
  return mainBody;
};

ctx.onmessage = async (event: MessageEvent<CadWorkerRequest>) => {
  const request = event.data;
  if (!request || typeof request !== 'object') return;

  const requestId = request.requestId;

  try {
    if (request.type === 'warmup') {
      post({type: 'progress', requestId, stage: 'init', done: 0, total: 1});
      await ensureOpenCascade();
      post({type: 'progress', requestId, stage: 'init', done: 1, total: 1});
      const ok: CadWorkerResultMessage = {type: 'result', requestId, ok: true, payload: {step: new ArrayBuffer(0)}};
      post(ok, [ok.payload.step]);
      return;
    }

    if (request.type !== 'generate-step') {
      throw new Error(`Unknown cad-worker request type: ${(request as any).type}`);
    }

    post({type: 'progress', requestId, stage: 'init', done: 0, total: 1});
    await ensureOpenCascade();
    post({type: 'progress', requestId, stage: 'init', done: 1, total: 1});

    const modifiedHoleMap = new Map<string, ModifiedHole>(request.modifiedHoles ?? []);
    const activeCount = request.tubeCoords.filter(
      (coord) => !modifiedHoleMap.get(createPointKey(coord))?.hidden,
    ).length;
    post({type: 'progress', requestId, stage: 'geometry', done: 0, total: activeCount});

    const solid = await createTubeSheetSolid(
      {
        boardDiameter: request.params.boardDiameter,
        tubeDiameter: request.params.tubeDiameter,
        thickness: request.params.thickness,
      },
      request.tubeCoords,
      modifiedHoleMap,
      (done, total) => post({type: 'progress', requestId, stage: 'geometry', done, total}),
    );

    post({type: 'progress', requestId, stage: 'export', done: 0, total: 1});
    console.time('[CAD-Worker] STEP Export');
    const blob: Blob = solid.blobSTEP();
    const buffer = await blob.arrayBuffer();
    console.timeEnd('[CAD-Worker] STEP Export');
    post({type: 'progress', requestId, stage: 'export', done: 1, total: 1});

    const ok: CadWorkerResultMessage = {type: 'result', requestId, ok: true, payload: {step: buffer}};
    post(ok, [buffer]);
  } catch (error) {
    postError(requestId, error);
  }
};
