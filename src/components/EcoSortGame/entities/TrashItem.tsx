import { useEffect, useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import { IcosahedronGeometry, CylinderGeometry, DodecahedronGeometry } from 'three';
import { BallCollider, RigidBody } from '@react-three/rapier';
import type { RapierRigidBody } from '@react-three/rapier';
import { TRASH_TYPES } from '../constants';
import type { TrashTypeId } from '../types';

type TrashItemProps = {
  id: string;
  type: TrashTypeId;
  position: [number, number, number];
  onRegister: (
    id: string,
    api: RapierRigidBody,
    position: [number, number, number],
    mesh: Mesh | null,
    radius: number
  ) => void | (() => void);
  onHitBin: (binType: TrashTypeId) => void;
};

export default function TrashItem({ id, type, position, onRegister, onHitBin }: TrashItemProps) {
  const radius = useMemo(() => getRadius(type), [type]);
  const geometry = useMemo(() => getGeometry(type, radius), [type, radius]);
  const bodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    if (!bodyRef.current) return;
    if (meshRef.current && !meshRef.current.geometry.boundingSphere) {
      meshRef.current.geometry.computeBoundingSphere();
    }
    const computedRadius = meshRef.current?.geometry.boundingSphere?.radius ?? radius;

    // Pass ID explicitly so parent doesn't need to create a closure
    const cleanup = onRegister(id, bodyRef.current, position, meshRef.current, computedRadius);

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [onRegister, id, position, radius]);

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      linearDamping={0.1}
      angularDamping={0.1}
      friction={0.2}
      restitution={0.2}
      ccd
      position={position}
      canSleep={false}
    >
      <mesh ref={meshRef} castShadow>
        {geometry}
        <meshStandardMaterial color={getColor(type)} roughness={0.8} />
      </mesh>
      <BallCollider
        args={[radius]}
        onIntersectionEnter={(event) => {
          const binType = (event.other.rigidBodyObject?.userData?.binType ??
            event.other.colliderObject?.userData?.binType ??
            null) as TrashTypeId | null;
          if (binType) {
            onHitBin(binType);
          }
        }}
      />
    </RigidBody>
  );
}

function getColor(type: TrashTypeId) {
  return TRASH_TYPES.find((item) => item.id === type)?.color ?? 0xffffff;
}

function getGeometry(type: TrashTypeId, radius: number) {
  switch (type) {
    case 'paper':
      return <icosahedronGeometry args={[radius, 0]} />;
    case 'plastic':
      return <cylinderGeometry args={[radius * 0.9, radius * 0.9, radius * 2.2, 12]} />;
    case 'glass':
      return <cylinderGeometry args={[radius * 1.0, radius * 1.0, radius * 1.6, 12]} />;
    case 'organic':
      return <dodecahedronGeometry args={[radius * 1.05, 0]} />;
    default:
      return <icosahedronGeometry args={[radius, 0]} />;
  }
}

function getRadius(type: TrashTypeId) {
  switch (type) {
    case 'glass':
      return 0.18;
    case 'plastic':
      return 0.16;
    case 'organic':
      return 0.2;
    default:
      return 0.15;
  }
}
