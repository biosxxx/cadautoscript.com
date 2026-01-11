import type { RapierRigidBody } from '@react-three/rapier';
import type { Group, Mesh } from 'three';

export type SeasonId = 'SUMMER' | 'AUTUMN' | 'WINTER' | 'SPRING';

export interface SeasonConfig {
    name: string;
    sky: number;
    fogNear: number;
    fogFar: number;
    ground: number;
    leaves: number[];
    wood: number;
    gravel: number;
    lightInt: number;
    hdr: string;
}

export interface BottleData {
    id: string;
    position: [number, number, number];
}

export interface StoneData {
    id: string;
    startPosition: [number, number, number];
    velocity: [number, number, number];
}

export interface ShardData {
    id: string;
    position: [number, number, number];
    velocity: [number, number, number];
    angularVelocity: [number, number, number];
    scale: number;
    material: number; // color
    life: number;
}

export interface RiverConfig {
    z: number;
    width: number;
    level: number;
}

export interface GameObjectRuntime {
    id: string;
    body: RapierRigidBody | null;
    mesh: Mesh | Group | null;
    type: 'bottle' | 'stone' | 'shard';
}
