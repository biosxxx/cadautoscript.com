import { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { CanvasTexture, LinearFilter } from 'three';
import { BIN_CONFIG, TRASH_TYPES } from '../constants';
import { useEcoSortStore } from '../store';
import { TranslationKey } from '../i18n/translations';

const BIN_SIZE: [number, number, number] = [1.7, 1.1, 1.7];
const WALL_THICKNESS = 0.12;
const BASE_THICKNESS = 0.12;
const SIGN_SIZE: [number, number] = [0.85, 0.85];
const SENSOR_SIZE: [number, number, number] = [1.2, 0.2, 1.2];

export default function Bins() {
  return (
    <>
      {BIN_CONFIG.map((bin) => (
        <Bin key={bin.type} position={bin.position} color={getTrashColor(bin.type)} type={bin.type} />
      ))}
    </>
  );
}

function Bin({
  position,
  color,
  type,
}: {
  position: [number, number, number];
  color: number;
  type: string;
}) {
  const t = useEcoSortStore((state) => state.t);
  const innerWidth = BIN_SIZE[0] - WALL_THICKNESS * 2;
  const innerDepth = BIN_SIZE[2] - WALL_THICKNESS * 2;
  const halfHeight = BIN_SIZE[1] / 2;

  // Use translation key for label
  const label = t(`trash_${type}` as TranslationKey);
  const signTexture = useMemo(() => createBinSignTexture(type, label, color), [type, label, color]);
  const innerColor = darken(color, 0.25);

  return (
    <>
      <RigidBody type="fixed" colliders={false} position={position} userData={{ binType: type }}>
        <CuboidCollider
          args={[innerWidth / 2, BASE_THICKNESS / 2, innerDepth / 2]}
          position={[0, -halfHeight + BASE_THICKNESS / 2, 0]}
          friction={0.7}
        />
        <CuboidCollider
          args={[BIN_SIZE[0] / 2, BIN_SIZE[1] / 2, WALL_THICKNESS / 2]}
          position={[0, 0, BIN_SIZE[2] / 2 - WALL_THICKNESS / 2]}
          friction={0.7}
        />
        <CuboidCollider
          args={[BIN_SIZE[0] / 2, BIN_SIZE[1] / 2, WALL_THICKNESS / 2]}
          position={[0, 0, -BIN_SIZE[2] / 2 + WALL_THICKNESS / 2]}
          friction={0.7}
        />
        <CuboidCollider
          args={[WALL_THICKNESS / 2, BIN_SIZE[1] / 2, BIN_SIZE[2] / 2]}
          position={[-BIN_SIZE[0] / 2 + WALL_THICKNESS / 2, 0, 0]}
          friction={0.7}
        />
        <CuboidCollider
          args={[WALL_THICKNESS / 2, BIN_SIZE[1] / 2, BIN_SIZE[2] / 2]}
          position={[BIN_SIZE[0] / 2 - WALL_THICKNESS / 2, 0, 0]}
          friction={0.7}
        />
        <CuboidCollider
          sensor
          args={[SENSOR_SIZE[0] / 2, SENSOR_SIZE[1] / 2, SENSOR_SIZE[2] / 2]}
          position={[0, -halfHeight + BASE_THICKNESS + SENSOR_SIZE[1] / 2, 0]}
        />
      </RigidBody>

      <group position={position}>
        <mesh receiveShadow>
          <boxGeometry args={[innerWidth, BASE_THICKNESS, innerDepth]} />
          <meshStandardMaterial color={innerColor} roughness={0.6} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0, BIN_SIZE[2] / 2 - WALL_THICKNESS / 2]}>
          <boxGeometry args={[BIN_SIZE[0], BIN_SIZE[1], WALL_THICKNESS]} />
          <meshStandardMaterial color={color} roughness={0.5} />
          <mesh position={[0, 0.05, WALL_THICKNESS / 2 + 0.02]}>
            <planeGeometry args={SIGN_SIZE} />
            <meshStandardMaterial map={signTexture} transparent />
          </mesh>
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0, -BIN_SIZE[2] / 2 + WALL_THICKNESS / 2]}>
          <boxGeometry args={[BIN_SIZE[0], BIN_SIZE[1], WALL_THICKNESS]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh castShadow receiveShadow position={[-BIN_SIZE[0] / 2 + WALL_THICKNESS / 2, 0, 0]}>
          <boxGeometry args={[WALL_THICKNESS, BIN_SIZE[1], BIN_SIZE[2]]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh castShadow receiveShadow position={[BIN_SIZE[0] / 2 - WALL_THICKNESS / 2, 0, 0]}>
          <boxGeometry args={[WALL_THICKNESS, BIN_SIZE[1], BIN_SIZE[2]]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>
      {/* Fence Background */}
      <RigidBody type="fixed" colliders="hull" position={[0, 0, -3.5]}>
        {/* Posts */}
        {[-6, -3, 0, 3, 6].map((x, i) => (
          <mesh key={i} position={[x, 1, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.2, 2, 0.2]} />
            <meshStandardMaterial color="#8d6e63" />
          </mesh>
        ))}
        {/* Rails */}
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[12.5, 0.15, 0.05]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
        <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[12.5, 0.15, 0.05]} />
          <meshStandardMaterial color="#6d4c41" />
        </mesh>
      </RigidBody>
    </>
  );
}

function getTrashColor(type: string) {
  return TRASH_TYPES.find((item) => item.id === type)?.color ?? 0xffffff;
}

function createBinSignTexture(type: string, label: string, color: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new CanvasTexture(canvas);
  }

  const primary = toHexColor(color);
  ctx.fillStyle = '#fdfdfd';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 10;
  ctx.strokeStyle = primary;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  drawIcon(ctx, type, primary);

  ctx.fillStyle = '#111111';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label.toUpperCase(), 128, 224);

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function drawIcon(ctx: CanvasRenderingContext2D, type: string, color: string) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineJoin = 'round';

  switch (type) {
    case 'paper': {
      ctx.beginPath();
      ctx.rect(70, 45, 110, 140);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(155, 45);
      ctx.lineTo(180, 70);
      ctx.lineTo(155, 70);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }
    case 'plastic': {
      ctx.beginPath();
      ctx.moveTo(116, 50);
      ctx.lineTo(140, 50);
      ctx.lineTo(140, 70);
      ctx.lineTo(152, 82);
      ctx.lineTo(152, 178);
      ctx.quadraticCurveTo(152, 200, 132, 200);
      ctx.lineTo(124, 200);
      ctx.quadraticCurveTo(104, 200, 104, 178);
      ctx.lineTo(104, 82);
      ctx.lineTo(116, 70);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'glass': {
      ctx.beginPath();
      ctx.moveTo(120, 40);
      ctx.lineTo(136, 40);
      ctx.lineTo(136, 70);
      ctx.lineTo(150, 90);
      ctx.lineTo(150, 178);
      ctx.quadraticCurveTo(150, 200, 128, 200);
      ctx.quadraticCurveTo(106, 200, 106, 178);
      ctx.lineTo(106, 90);
      ctx.lineTo(120, 70);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: {
      ctx.beginPath();
      ctx.ellipse(128, 120, 60, 85, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(110, 160);
      ctx.lineTo(150, 80);
      ctx.stroke();
      break;
    }
  }
}

function toHexColor(value: number) {
  return `#${value.toString(16).padStart(6, '0')}`;
}

function darken(value: number, amount: number) {
  const r = Math.max(0, ((value >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((value >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (value & 0xff) * (1 - amount));
  return (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b);
}
