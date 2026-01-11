import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { LineSegments, Mesh, Raycaster, Vector2, Vector3 } from 'three';
import type { Camera } from 'three';
import { v4 as uuidv4 } from 'uuid';
import TrashItem from './TrashItem';
import { BIN_CONFIG, TRASH_TYPES } from '../constants';
import { useEcoSortStore } from '../store';
import type { SpawnedTrash, TrashTypeId } from '../types';

type TrashRuntime = {
  id: string;
  type: TrashTypeId;
  body: RapierRigidBody;
  mesh: Mesh | null;
  radius: number;
  position: [number, number, number];
  velocity: [number, number, number];
  status: 'belt' | 'held' | 'thrown';
  onFloor: boolean;
  scored: boolean;
};

const SPAWN_INTERVAL = 2;
const CONVEYOR_SPEED = 4.5;
const CONVEYOR_Z = 2.5;
const CONVEYOR_Y = 0.5;
const CONVEYOR_START_X = -16;
const CONVEYOR_END_X = 5;
const PICKUP_DISTANCE = 6.0;
const FLOOR_Y = 0.2;
const CLEANUP_COST = 5000;
const BIN_HALF_SIZE = 0.65;
const BIN_TOP_Y = 1.05;
const CONVEYOR_WIDTH = 1.8;

export default function TrashSpawner() {
  const [items, setItems] = useState<SpawnedTrash[]>([]);
  const { camera } = useThree();
  const raycaster = useRef(new Raycaster());
  const centerScreen = useMemo(() => new Vector2(0, 0), []);
  const lineRef = useRef<LineSegments>(null);
  const trashMapRef = useRef<Map<string, TrashRuntime>>(new Map());
  const heldIdRef = useRef<string | null>(null);
  const pickCandidateRef = useRef<TrashRuntime | null>(null);
  const lastSpawnRef = useRef(0);
  const crosshairActiveRef = useRef(false);
  const interactionHintRef = useRef<string | null>(null);

  const score = useEcoSortStore((state) => state.score);
  const isPlaying = useEcoSortStore((state) => state.isPlaying);
  const throwToken = useEcoSortStore((state) => state.throwToken);
  const cleanupToken = useEcoSortStore((state) => state.cleanupToken);
  const incrementScore = useEcoSortStore((state) => state.incrementScore);
  const setScore = useEcoSortStore((state) => state.setScore);
  const setCurrentTrashType = useEcoSortStore((state) => state.setCurrentTrashType);
  const setFeedback = useEcoSortStore((state) => state.setFeedback);
  const setFloorCount = useEcoSortStore((state) => state.setFloorCount);
  const setMoveSpeedMultiplier = useEcoSortStore((state) => state.setMoveSpeedMultiplier);

  const setCleanupReady = useEcoSortStore((state) => state.setCleanupReady);
  const setCrosshairActive = useEcoSortStore((state) => state.setCrosshairActive);
  const setInteractionHint = useEcoSortStore((state) => state.setInteractionHint);
  const t = useEcoSortStore((state) => state.t);

  useEffect(() => {
    setCleanupReady(score >= CLEANUP_COST);
  }, [score, setCleanupReady]);

  useEffect(() => {
    if (!isPlaying) {
      updateCrosshair(false, null);
      return;
    }
    handleAction();
  }, [throwToken, isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    handleCleanup();
  }, [cleanupToken, isPlaying]);

  useFrame((state) => {
    if (!camera?.position) return;

    if (isPlaying) {
      const time = state.clock.getElapsedTime();
      if (time - lastSpawnRef.current > SPAWN_INTERVAL) {
        spawnTrash();
        lastSpawnRef.current = time;
      }
    }

    let lineShown = false;
    trashMapRef.current.forEach((item) => {
      if (!item.body) return;
      const translation = item.body.translation();
      const velocity = item.body.linvel();
      item.position = [translation.x, translation.y, translation.z];
      item.velocity = [velocity.x, velocity.y, velocity.z];

      if (item.status === 'held') {
        const { startPos, velocityDir } = getThrowVectors(camera);
        item.body.setGravityScale(0, true);
        item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
        item.body.setTranslation({ x: startPos.x, y: startPos.y, z: startPos.z }, true);
        if (lineRef.current) {
          const points = buildTrajectory(startPos, velocityDir);
          lineRef.current.geometry.setFromPoints(points);
          lineRef.current.visible = true;
        }
        lineShown = true;
        return;
      }

      if (!item.onFloor && item.position[1] < FLOOR_Y) {
        handleFloorPenalty(item);
      }

      if (
        item.status === 'belt' &&
        !item.onFloor &&
        item.position[1] < CONVEYOR_Y + 2.0 &&
        item.position[0] < CONVEYOR_END_X
      ) {
        // Apply conveyor force (X-axis only)
        // We read the current velocity to preserve falling (Y) and bouncing (Z/Y)
        // But we enforce a strong forward velocity
        item.body.setLinvel({ x: CONVEYOR_SPEED, y: velocity.y, z: velocity.z }, true);
        item.body.wakeUp();
      }

      if (item.status !== 'belt' && !item.scored && item.position[1] < BIN_TOP_Y) {
        const bin = findBinHit(item.position);
        if (bin) {
          handleBinScore(item, bin);
        }
      }
    });

    if (lineRef.current && !lineShown) {
      lineRef.current.visible = false;
    }

    updateCrosshairState(camera);
  });

  const spawnTrash = () => {
    const type = pickTrashType();
    const id = uuidv4();
    const startZ = CONVEYOR_Z + (Math.random() - 0.5) * 1.4;
    // Add small random offset in X to prevent perfect vertical stacking if they spawn fast
    const startX = CONVEYOR_START_X + (Math.random() - 0.5) * 0.5;
    const item: SpawnedTrash = {
      id,
      type,
      position: [startX, CONVEYOR_Y + 0.8, startZ],
    };

    // Pre-populate runtime to pass type to register without dependency issues
    trashMapRef.current.set(id, {
      id,
      type,
      body: null as any, // Will be set in onRegister
      mesh: null,
      radius: 0.15,
      position: item.position,
      velocity: [0, 0, 0],
      status: 'belt',
      onFloor: false,
      scored: false
    });

    setItems((prev) => [...prev, item]);
  };

  const handleAction = () => {
    if (!isPlaying) return;

    const heldId = heldIdRef.current;
    if (heldId) {
      const heldItem = trashMapRef.current.get(heldId);
      if (heldItem) {
        throwTrash(heldItem);
      }
      return;
    }

    const candidate = pickCandidateRef.current;
    if (candidate) {
      pickUp(candidate);
    }
  };

  const pickUp = (item: TrashRuntime) => {
    if (item.scored) return;

    heldIdRef.current = item.id;
    item.status = 'held';
    item.body.setGravityScale(0, true);
    item.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    item.body.setAngvel({ x: 0, y: 0, z: 0 }, true);

    if (item.onFloor) {
      item.onFloor = false;
      updateFloorCount();
    }

    setCurrentTrashType(item.type);
  };

  const throwTrash = (item: TrashRuntime) => {
    if (!camera?.position) return;

    heldIdRef.current = null;
    item.status = 'thrown';
    item.body.setGravityScale(1, true);
    const { startPos, velocityDir } = getThrowVectors(camera);
    item.body.setTranslation({ x: startPos.x, y: startPos.y, z: startPos.z }, true);
    const force = 12;
    item.body.setLinvel(
      { x: velocityDir.x * force, y: velocityDir.y * force + 2, z: velocityDir.z * force },
      true
    );
    item.body.setAngvel({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }, true);
    item.body.wakeUp();
    setCurrentTrashType(null);
  };

  const handleBinScore = (item: TrashRuntime, binType: TrashTypeId) => {
    if (item.scored) return;
    item.scored = true;


    if (item.type === binType) {
      incrementScore(100);
      setFeedback({ text: t('feedback_correct'), color: '#4CAF50' });
    } else {
      incrementScore(-50);
      setFeedback({ text: t('feedback_wrong'), color: '#F44336' });
    }

    window.setTimeout(() => setFeedback(null), 1000);

    // User requested trash stays in the bin. 
    // We disable physics activity to save perf? No, let it pile up!
    // But we must ensure it doesn't trigger hitting bin again.
    // 'scored' flag prevents re-scoring.

    // Optional: Remove only if too many items?
    // items.length could grow.
    if (items.length > 50) {
      // Remove the oldest SCIORED item
      const oldest = items.find(i => {
        const rt = trashMapRef.current.get(i.id);
        return rt && rt.scored;
      });
      if (oldest) {
        removeItem(oldest.id);
      }
    }
  };

  const handleFloorPenalty = (item: TrashRuntime) => {
    if (item.onFloor || item.scored) return;
    item.onFloor = true;
    incrementScore(-50);
    setFeedback({ text: t('feedback_dropped'), color: '#FFC107' });
    window.setTimeout(() => setFeedback(null), 1000);
    updateFloorCount();
  };

  const handleCleanup = () => {
    if (score < CLEANUP_COST) return;
    const floorIds = Array.from(trashMapRef.current.values()).filter((item) => item.onFloor).map((item) => item.id);
    if (floorIds.length === 0) return;

    setScore(score - CLEANUP_COST);
    floorIds.forEach((id) => removeItem(id));
    setFeedback({ text: t('feedback_clean'), color: '#00E676' });
    window.setTimeout(() => setFeedback(null), 1000);
  };

  const updateFloorCount = () => {
    const count = Array.from(trashMapRef.current.values()).filter((item) => item.onFloor).length;
    setFloorCount(count);
    const multiplier = Math.max(0.3, 1 - count * 0.05);
    setMoveSpeedMultiplier(multiplier);
  };

  const removeItem = (id: string) => {
    const item = trashMapRef.current.get(id);
    const wasOnFloor = item?.onFloor ?? false;
    if (heldIdRef.current === id) {
      heldIdRef.current = null;
      setCurrentTrashType(null);
      if (lineRef.current) {
        lineRef.current.visible = false;
      }
    }
    trashMapRef.current.delete(id);
    setItems((prev) => prev.filter((entry) => entry.id !== id));
    if (wasOnFloor) {
      updateFloorCount();
    }
  };

  const updateCrosshairState = (activeCamera: Camera) => {
    if (!isPlaying) {
      updateCrosshair(false, null);
      pickCandidateRef.current = null;
      return;
    }

    if (heldIdRef.current) {
      updateCrosshair(true, t('action_throw'));
      pickCandidateRef.current = null;
      return;
    }

    const candidate = getPickCandidate(activeCamera);
    pickCandidateRef.current = candidate;
    if (candidate) {
      updateCrosshair(true, t('action_take'));
    } else {
      updateCrosshair(false, null);
    }
  };

  const updateCrosshair = (active: boolean, hint: string | null) => {
    if (crosshairActiveRef.current !== active) {
      crosshairActiveRef.current = active;
      setCrosshairActive(active);
    }
    if (interactionHintRef.current !== hint) {
      interactionHintRef.current = hint;
      setInteractionHint(hint);
    }
  };

  const getPickCandidate = (activeCamera: Camera) => {
    if (!activeCamera.position) return null;

    // Cone Cast Settings
    const MAX_DIST = 8.0;
    const MAX_ANGLE = 0.5; // Radians (~28 degrees)

    const cameraPos = activeCamera.position;
    const cameraDir = new Vector3();
    activeCamera.getWorldDirection(cameraDir);

    let bestCandidate: TrashRuntime | null = null;
    let minScore = Infinity; // Lower score is better

    trashMapRef.current.forEach((item) => {
      // Prevent picking up held, scored, invalid, OR in-flight items
      if (
        item.status === 'held' ||
        item.scored ||
        !item.body ||
        (item.status === 'thrown' && !item.onFloor)
      ) return;

      const t = item.body.translation();
      const itemPos = new Vector3(t.x, t.y, t.z);

      const toItem = itemPos.clone().sub(cameraPos);
      const dist = toItem.length();

      if (dist > MAX_DIST) return;

      toItem.normalize();
      const dot = cameraDir.dot(toItem);
      // Determine angle
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

      if (angle < MAX_ANGLE) {
        // Score based on distance and angle centering
        const score = dist + (angle * 10); // Penalty for being off-center

        if (score < minScore) {
          minScore = score;
          bestCandidate = item;
        }
      }
    });

    return bestCandidate;
  };

  const findBinHit = (position: [number, number, number]) => {
    for (const bin of BIN_CONFIG) {
      const dx = Math.abs(position[0] - bin.position[0]);
      const dz = Math.abs(position[2] - bin.position[2]);
      if (dx < BIN_HALF_SIZE && dz < BIN_HALF_SIZE) {
        return bin.type;
      }
    }
    return null;
  };

  const handleRegister = useCallback(
    (
      id: string,
      body: RapierRigidBody,
      spawnPos: [number, number, number],
      mesh: Mesh | null,
      radius: number
    ) => {
      const entry = trashMapRef.current.get(id);
      if (entry) {
        entry.body = body;
        entry.mesh = mesh;
        entry.radius = radius;
        entry.position = spawnPos;
        entry.body.setTranslation({ x: spawnPos[0], y: spawnPos[1], z: spawnPos[2] }, true);
        entry.body.setLinvel({ x: CONVEYOR_SPEED, y: 0, z: 0 }, true);
        entry.body.wakeUp();
      }

      return () => {
        trashMapRef.current.delete(id);
      };
    },
    []
  );

  return (
    <>
      {items.map((item) => (
        <TrashItem
          key={item.id}
          id={item.id}
          type={item.type}
          position={item.position}
          onRegister={handleRegister}
          onHitBin={(binType) => {
            const runtime = trashMapRef.current.get(item.id);
            if (runtime) {
              handleBinScore(runtime, binType);
            }
          }}
        />
      ))}
      <lineSegments ref={lineRef} visible={false}>
        <bufferGeometry />
        <lineBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </lineSegments>
    </>
  );
}

function pickTrashType(): TrashTypeId {
  const index = Math.floor(Math.random() * TRASH_TYPES.length);
  return TRASH_TYPES[index].id;
}

function getThrowVectors(camera: Camera | undefined) {
  if (!camera?.position) {
    return {
      startPos: new Vector3(0, 1.8, 8),
      velocityDir: new Vector3(0, 0, -1),
    };
  }
  const direction = new Vector3();
  camera.getWorldDirection(direction);

  const right = new Vector3();
  right.crossVectors(direction, camera.up).normalize();

  const startPos = camera.position
    .clone()
    .add(direction.clone().multiplyScalar(0.5))
    .add(right.clone().multiplyScalar(0.2))
    .add(camera.up.clone().multiplyScalar(-0.1));

  const velocityDir = direction.clone();
  velocityDir.y += 0.15;
  velocityDir.normalize();

  return { startPos, velocityDir };
}

function buildTrajectory(startPos: Vector3, velocityDir: Vector3) {
  const force = 12;
  const velocity = velocityDir.clone().multiplyScalar(force);
  const gravity = new Vector3(0, -15, 0);

  const points: Vector3[] = [];
  const steps = 30;
  const timeStep = 0.05;

  for (let i = 0; i < steps; i++) {
    const t = i * timeStep;
    const pos = startPos
      .clone()
      .add(velocity.clone().multiplyScalar(t))
      .add(gravity.clone().multiplyScalar(0.5 * t * t));
    points.push(pos);
    if (pos.y < 0) break;
  }

  return points;
}
