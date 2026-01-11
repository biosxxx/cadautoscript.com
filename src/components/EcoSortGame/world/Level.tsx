import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Instance, Instances, Lightformer, Sky } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { BufferAttribute, Color, Points } from 'three';
import { useEcoSortStore } from '../store';

const WEATHER_SKY: Record<string, { sky: number; fog: number; fogNear: number; fogFar: number }> = {
  CLEAR: { sky: 0x87ceeb, fog: 0x87ceeb, fogNear: 20, fogFar: 70 },
  RAIN: { sky: 0x4a5b6c, fog: 0x4a5b6c, fogNear: 5, fogFar: 30 },
  SNOW: { sky: 0xcadfe8, fog: 0xcadfe8, fogNear: 10, fogFar: 40 },
};

export default function Level() {
  const weather = useEcoSortStore((state) => state.weather);
  const palette = WEATHER_SKY[weather] ?? WEATHER_SKY.CLEAR;
  const particleRef = useRef<Points>(null);
  const { camera } = useThree();

  const groundSize = 120;
  const groundThickness = 0.2;

  const treePositions = useMemo(
    () => [
      [-10, 0, -8],
      [10, 0, -6],
      [-12, 0, 10],
      [12, 0, 12],
      [0, 0, 18],
    ],
    []
  );

  const particles = useMemo(() => {
    if (weather === 'CLEAR') return null;
    const count = weather === 'RAIN' ? 600 : 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return { positions, count };
  }, [weather]);

  useFrame((_, delta) => {
    const points = particleRef.current;
    if (!points || weather === 'CLEAR' || !camera?.position) return;

    const positionAttr = points.geometry.getAttribute('position') as BufferAttribute | undefined;
    if (!positionAttr) return;
    const positions = positionAttr.array as Float32Array;
    const fallSpeed = weather === 'RAIN' ? 35 : 3;
    const wind = weather === 'SNOW' ? 1 : 0;

    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= fallSpeed * delta;
      if (wind) {
        positions[i - 1] += Math.sin(performance.now() * 0.001 + i) * 0.02;
      }
      if (positions[i] < 0) {
        positions[i] = 30 + Math.random() * 20;
        positions[i - 1] = (Math.random() - 0.5) * 60 + camera.position.x;
        positions[i + 1] = (Math.random() - 0.5) * 60 + camera.position.z;
      }
    }

    positionAttr.needsUpdate = true;
  });

  /* Hills Data */
  const hills = useMemo(() => (
    <Instances range={20}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color={0x5d905d} />
      {Array.from({ length: 15 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const r = 55 + Math.random() * 30;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        // Keep the gameplay area (bins + conveyor) flat and clear.
        if (Math.abs(x) < 30 && Math.abs(z) < 30) return null;
        return (
          <Instance key={i} position={[x, -0.6, z]} scale={[10 + Math.random() * 12, 2 + Math.random() * 1.5, 10 + Math.random() * 12]} />
        );
      })}
    </Instances>
  ), []);

  /* Forest A: Pines */
  const forestA = useMemo(() => (
    <Instances range={50}>
      <cylinderGeometry args={[0.35, 0.55, 5.2, 8]} />
      <meshStandardMaterial color={0x7a4a2b} roughness={0.8} />
      {Array.from({ length: 25 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const r = 30 + Math.random() * 45;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const treeScale = 1.1 + Math.random() * 0.7;
        const trunkScaleY = 0.9 + Math.random() * 0.35;
        const trunkScaleXZ = 0.9 + Math.random() * 0.25;
        const trunkHeight = 5.2 * trunkScaleY;
        const foliageColor = weather === 'SNOW' ? 0xffffff : 0x2f6b2f;
        const cone1Height = 6.2 * treeScale;
        const cone2Height = 4.6 * treeScale;
        const cone3Height = 3.2 * treeScale;
        const cone1Radius = 2.6 * treeScale;
        const cone2Radius = 2.1 * treeScale;
        const cone3Radius = 1.4 * treeScale;
        return (
          <group key={`p-${i}`} position={[x, 0, z]} rotation={[0, Math.random() * Math.PI, 0]}>
            <Instance position={[0, trunkHeight / 2, 0]} scale={[trunkScaleXZ, trunkScaleY, trunkScaleXZ]} />
            <group position={[0, trunkHeight - 0.1, 0]}>
              <mesh position={[0, cone1Height * 0.5, 0]} castShadow>
                <coneGeometry args={[cone1Radius, cone1Height, 8]} />
                <meshStandardMaterial color={foliageColor} roughness={0.7} />
              </mesh>
              <mesh position={[0, cone1Height * 0.5 + cone2Height * 0.35, 0]} castShadow>
                <coneGeometry args={[cone2Radius, cone2Height, 8]} />
                <meshStandardMaterial color={foliageColor} roughness={0.7} />
              </mesh>
              <mesh position={[0, cone1Height * 0.5 + cone2Height * 0.35 + cone3Height * 0.35, 0]} castShadow>
                <coneGeometry args={[cone3Radius, cone3Height, 8]} />
                <meshStandardMaterial color={foliageColor} roughness={0.7} />
              </mesh>
            </group>
          </group>
        );
      })}
    </Instances>
  ), [weather]);

  /* Forest B: Oaks */
  const forestB = useMemo(() => (
    <Instances range={50}>
      <cylinderGeometry args={[0.6, 0.85, 6.2, 8]} />
      <meshStandardMaterial color={0x5a3d2b} roughness={0.85} />
      {Array.from({ length: 25 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const r = 34 + Math.random() * 40;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        if (Math.random() > 0.6) return null;
        const trunkScaleY = 0.9 + Math.random() * 0.35;
        const trunkScaleXZ = 0.9 + Math.random() * 0.25;
        const trunkHeight = 6.2 * trunkScaleY;
        const crownScale = 1.2 + Math.random() * 0.6;
        const crownColor = weather === 'SNOW' ? 0xffffff : 0x4f7a3f;
        const crownBaseY = trunkHeight + 1.6 * crownScale;
        return (
          <group key={`o-${i}`} position={[x, 0, z]} rotation={[0, Math.random() * Math.PI, 0]}>
            <Instance position={[0, trunkHeight / 2, 0]} scale={[trunkScaleXZ, trunkScaleY, trunkScaleXZ]} />
            <mesh position={[0, crownBaseY, 0]} castShadow>
              <sphereGeometry args={[2.8 * crownScale, 12, 12]} />
              <meshStandardMaterial color={crownColor} roughness={0.8} />
            </mesh>
            <mesh position={[1.6 * crownScale, crownBaseY - 0.6 * crownScale, 0.6 * crownScale]} castShadow>
              <sphereGeometry args={[2.1 * crownScale, 12, 12]} />
              <meshStandardMaterial color={crownColor} roughness={0.8} />
            </mesh>
            <mesh position={[-1.4 * crownScale, crownBaseY - 0.4 * crownScale, -0.8 * crownScale]} castShadow>
              <sphereGeometry args={[2.3 * crownScale, 12, 12]} />
              <meshStandardMaterial color={crownColor} roughness={0.8} />
            </mesh>
            <mesh position={[0.5 * crownScale, crownBaseY + 0.9 * crownScale, -1.2 * crownScale]} castShadow>
              <sphereGeometry args={[1.7 * crownScale, 12, 12]} />
              <meshStandardMaterial color={crownColor} roughness={0.8} />
            </mesh>
          </group>
        );
      })}
    </Instances>
  ), [weather]);

  /* Scattered Rocks */
  const rocks = useMemo(() => Array.from({ length: 15 }).map((_, i) => {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 60;
    if (Math.abs(x) < 12 && Math.abs(z) < 12) return null;
    return (
      <mesh key={`rock-${i}`} position={[x, 0.3, z]} rotation={[Math.random(), Math.random(), Math.random()]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5 + Math.random(), 0]} />
        <meshStandardMaterial color={0x777777} />
      </mesh>
    );
  }), []);

  return (
    <>
      <color attach="background" args={[new Color(palette.sky)]} />
      <fog attach="fog" args={[palette.fog, palette.fogNear, palette.fogFar]} />

      <ambientLight intensity={weather === 'CLEAR' ? 0.6 : 0.3} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={weather === 'CLEAR' ? 1.6 : 0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={5}
        shadow-camera-far={80}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0004}
      />

      <Environment resolution={256} background={false} blur={0.6}>
        <Lightformer intensity={2} color="#ffffff" position={[0, 6, 6]} scale={[12, 8, 1]} />
        <Lightformer intensity={1} color="#d7ecff" position={[-6, 2, -6]} scale={[6, 4, 1]} />
        <Lightformer intensity={0.8} color="#ffe0c7" position={[6, 2, -6]} scale={[6, 4, 1]} />
        <Lightformer intensity={0.6} color="#ffffff" position={[0, -4, 0]} scale={[18, 10, 1]} />
      </Environment>

      <RigidBody type="fixed" colliders={false} position={[0, -groundThickness / 2, 0]}>
        <CuboidCollider args={[groundSize / 2, groundThickness / 2, groundSize / 2]} friction={0.9} />
      </RigidBody>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color={0x6aa06a} roughness={1} />
      </mesh>

      {particles ? (
        <points ref={particleRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" array={particles.positions} itemSize={3} count={particles.count} />
          </bufferGeometry>
          <pointsMaterial
            color={weather === 'RAIN' ? 0xaaaaaa : 0xffffff}
            size={weather === 'RAIN' ? 0.6 : 0.2}
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      ) : null}

      {hills}
      {forestA}
      {forestB}
      {rocks}

      <Sky
        sunPosition={[100, 20, 100]}
        turbidity={weather === 'CLEAR' ? 0.6 : 8}
        rayleigh={weather === 'CLEAR' ? 0.5 : 0.1}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
    </>
  );
}
