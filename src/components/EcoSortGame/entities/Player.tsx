import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Euler, Vector3 } from 'three';
import { CapsuleCollider, RigidBody, RapierRigidBody } from '@react-three/rapier';
import type { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import { GAME_BOUNDS } from '../constants';
import { useEcoSortStore } from '../store';

export default function Player() {
  const orbitRef = useRef<PointerLockControlsImpl>(null);
  const bodyRef = useRef<RapierRigidBody>(null);
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const { camera } = useThree();
  const isPlaying = useEcoSortStore((state) => state.isPlaying);
  const setPointerLockPending = useEcoSortStore((state) => state.setPointerLockPending);
  const pointerLockTarget = useEcoSortStore((state) => state.pointerLockTarget);
  const requestThrow = useEcoSortStore((state) => state.requestThrow);
  const requestCleanup = useEcoSortStore((state) => state.requestCleanup);
  const moveSpeedMultiplier = useEcoSortStore((state) => state.moveSpeedMultiplier);
  const mobileMove = useEcoSortStore((state) => state.mobileMove);
  const dragState = useRef({
    active: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    yaw: 0,
    pitch: 0,
  });
  const isTouchDevice = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveState.current.forward = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          moveState.current.left = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          moveState.current.backward = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          moveState.current.right = true;
          break;
        case 'KeyF':
          requestCleanup();
          break;
        default:
          break;
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          moveState.current.forward = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          moveState.current.left = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          moveState.current.backward = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          moveState.current.right = false;
          break;
        default:
          break;
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement && e.button === 0) {
        requestThrow();
      }
    };

    const handleTouchStart = () => {
      if (!isPlaying) return;
      requestThrow();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isPlaying, requestCleanup, requestThrow]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    const maxTouch = navigator?.maxTouchPoints ?? 0;
    isTouchDevice.current = coarse || maxTouch > 0 || 'ontouchstart' in window;
  }, []);

  useEffect(() => {
    const target = pointerLockTarget;
    if (!target) return;
    const doc = target.ownerDocument;

    const handlePointerDown = (event: PointerEvent) => {
      if (!isPlaying || doc.pointerLockElement) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const euler = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      dragState.current = {
        active: true,
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        yaw: euler.y,
        pitch: euler.x,
      };

      try {
        target.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture errors on older browsers.
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState.current.active || doc.pointerLockElement) return;
      if (event.pointerId !== dragState.current.pointerId) return;

      const dx = event.clientX - dragState.current.lastX;
      const dy = event.clientY - dragState.current.lastY;
      dragState.current.lastX = event.clientX;
      dragState.current.lastY = event.clientY;

      const sensitivity = event.pointerType === 'touch' || isTouchDevice.current ? 0.004 : 0.002;
      dragState.current.yaw -= dx * sensitivity;
      dragState.current.pitch -= dy * sensitivity;

      const minPolar = 0.25;
      const maxPolar = Math.PI - 0.25;
      const minPitch = Math.PI / 2 - maxPolar;
      const maxPitch = Math.PI / 2 - minPolar;
      dragState.current.pitch = Math.max(minPitch, Math.min(maxPitch, dragState.current.pitch));

      const euler = new Euler(dragState.current.pitch, dragState.current.yaw, 0, 'YXZ');
      camera.quaternion.setFromEuler(euler);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragState.current.pointerId) return;
      dragState.current.active = false;
      dragState.current.pointerId = -1;
      try {
        target.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore capture errors on older browsers.
      }
    };

    target.addEventListener('pointerdown', handlePointerDown);
    target.addEventListener('pointermove', handlePointerMove);
    target.addEventListener('pointerup', handlePointerUp);
    target.addEventListener('pointercancel', handlePointerUp);

    return () => {
      target.removeEventListener('pointerdown', handlePointerDown);
      target.removeEventListener('pointermove', handlePointerMove);
      target.removeEventListener('pointerup', handlePointerUp);
      target.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [camera, isPlaying, pointerLockTarget]);

  useFrame((_, delta) => {
    if (!bodyRef.current || !isPlaying) return;

    const forwardActive = moveState.current.forward || mobileMove.forward;
    const backwardActive = moveState.current.backward || mobileMove.backward;
    const leftActive = moveState.current.left || mobileMove.left;
    const rightActive = moveState.current.right || mobileMove.right;

    // Get Camera Direction (ignoring Y)
    const forward = new Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new Vector3();
    right.crossVectors(forward, camera.up).normalize();

    // Calculate Desired Velocity Vector
    const moveDir = new Vector3();
    if (forwardActive) moveDir.add(forward);
    if (backwardActive) moveDir.sub(forward);
    if (leftActive) moveDir.sub(right);
    if (rightActive) moveDir.add(right);

    const speed = 5.0 * moveSpeedMultiplier; // Reduced speed for physics (5m/s is brisk walk) Not 15.

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().multiplyScalar(speed);
    }

    // Apply velocity to body
    // Preserve existing Y velocity (falling)
    const currentVel = bodyRef.current.linvel();
    bodyRef.current.setLinvel({ x: moveDir.x, y: currentVel.y, z: moveDir.z }, true);

    // Sync Camera Position to Body
    const t = bodyRef.current.translation();

    // Clamp Bounds (Physics does simple collisions, but we keep bounds for edge of world)
    let nx = t.x;
    let nz = t.z;
    if (nx < -GAME_BOUNDS.x) nx = -GAME_BOUNDS.x;
    if (nx > GAME_BOUNDS.x) nx = GAME_BOUNDS.x;
    if (nz < GAME_BOUNDS.zMin) nz = GAME_BOUNDS.zMin;
    if (nz > GAME_BOUNDS.zMax) nz = GAME_BOUNDS.zMax;

    if (nx !== t.x || nz !== t.z) {
      bodyRef.current.setTranslation({ x: nx, y: t.y, z: nz }, true);
    }

    camera.position.set(nx, t.y + 0.9, nz); // Eye height 0.9 above center (Capsule height 1.8 total approx)
  });

  useEffect(() => {
    const controls = orbitRef.current;
    if (!controls) return;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI - 0.25;
  }, [pointerLockTarget]);

  return (
    <>
      <RigidBody
        ref={bodyRef}
        position={[0, 2, 8]}
        enabledRotations={[false, false, false]}
        colliders={false}
        mass={1}
        lockRotations
      >
        <CapsuleCollider args={[0.9, 0.3]} />
      </RigidBody>
      {pointerLockTarget ? (
        <PointerLockControls
          key="eco-sort-pointer-lock"
          ref={orbitRef}
          domElement={pointerLockTarget}
          selector="#eco-sort-no-auto-lock"
          onUnlock={() => {
            setPointerLockPending(false);
            pointerLockTarget.style.cursor = 'auto';
          }}
          onLock={() => {
            setPointerLockPending(false);
            pointerLockTarget.style.cursor = 'none';
          }}
          pointerSpeed={0.3}
        />
      ) : null}
    </>
  );
}
