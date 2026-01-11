import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { CanvasTexture, RepeatWrapping, NearestFilter } from 'three';
import type { MeshStandardMaterial } from 'three';

export default function Conveyor() {
  const beltSize: [number, number, number] = [25, 0.2, 1.8];
  const beltPosition: [number, number, number] = [-7.5, 0.5, 2.5];
  const materialRef = useRef<MeshStandardMaterial>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#444';
      // Draw arrows or stripes
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(32, 32);
      ctx.lineTo(0, 64);
      ctx.moveTo(32, 0);
      ctx.lineTo(64, 32);
      ctx.lineTo(32, 64);
      ctx.stroke();
      ctx.fillStyle = '#222';
      for (let i = 0; i < 64; i += 16) {
        ctx.fillRect(i, 0, 8, 64);
      }
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(beltSize[0] * 2, 1);
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    return tex;
  }, [beltSize]);

  useFrame((_, delta) => {
    if (materialRef.current && materialRef.current.map) {
      materialRef.current.map.offset.x -= 1.0 * delta;
    }
  });

  return (
    <>
      {/* Main Belt Collider */}
      <RigidBody type="fixed" colliders={false} position={beltPosition}>
        <CuboidCollider args={[beltSize[0] / 2, beltSize[1] / 2, beltSize[2] / 2]} friction={0.5} />
      </RigidBody>

      {/* Invisible Walls */}
      <RigidBody type="fixed" colliders={false} position={beltPosition}>
        {/* Far Side Wall */}
        <CuboidCollider
          args={[beltSize[0] / 2, 0.4, 0.1]}
          position={[0, 0.4, -beltSize[2] / 2]}
          friction={0.0}
        />
        {/* Near Side Wall */}
        <CuboidCollider
          args={[beltSize[0] / 2, 0.4, 0.1]}
          position={[0, 0.4, beltSize[2] / 2]}
          friction={0.0}
        />
      </RigidBody>

      <mesh receiveShadow position={beltPosition}>
        <boxGeometry args={beltSize} />
        <meshStandardMaterial ref={materialRef} map={texture} roughness={0.8} />
      </mesh>
    </>
  );
}
