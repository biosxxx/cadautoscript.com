import { useCallback, useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Plane, Raycaster, Group, Mesh } from 'three';
import { RapierRigidBody } from '@react-three/rapier';
import { v4 as uuidv4 } from 'uuid';
import { useSmashBottlesStore } from '../store';
import {
    RAIL_TOP_Y,
    BOTTLE_COUNT_MIN,
    BOTTLE_COUNT_MAX,
    STONE_THROW_SPEED,
    BREAK_THRESHOLD,
} from '../constants';
import type { BottleData, StoneData, ShardData, GameObjectRuntime } from '../types';
import Bottle from './Bottle';
import Stone from './Stone';
import Shard from './Shard';

export default function GameManager() {
    const { camera } = useThree();
    const [bottles, setBottles] = useState<BottleData[]>([]);
    const [stones, setStones] = useState<StoneData[]>([]);
    const [shards, setShards] = useState<ShardData[]>([]);

    const bottleMapRef = useRef<Map<string, GameObjectRuntime>>(new Map());
    const stoneMapRef = useRef<Map<string, GameObjectRuntime>>(new Map());

    const resetToken = useSmashBottlesStore((state) => state.resetToken);
    const stonesLeft = useSmashBottlesStore((state) => state.stonesLeft);
    const decrementStones = useSmashBottlesStore((state) => state.decrementStones);
    const setBottleCount = useSmashBottlesStore((state) => state.setBottleCount);
    const incrementScore = useSmashBottlesStore((state) => state.incrementScore);
    const river = useSmashBottlesStore((state) => state.river);

    const raycaster = useRef(new Raycaster());
    const plane = useRef(new Plane(new Vector3(0, 1, 0), 0));
    const mousePos = useRef(new Vector3());

    // Spawn bottles on reset
    useEffect(() => {
        const count = BOTTLE_COUNT_MIN + Math.floor(Math.random() * (BOTTLE_COUNT_MAX - BOTTLE_COUNT_MIN + 1));
        const newBottles: BottleData[] = [];

        for (let i = 0; i < count; i++) {
            const z = (i - count / 2) * 1.5 + (Math.random() - 0.5) * 0.5;
            const x = Math.random() > 0.5 ? 0.4 : -0.4;
            newBottles.push({
                id: uuidv4(),
                position: [x, RAIL_TOP_Y + 0.05, z],
            });
        }

        setBottles(newBottles);
        setStones([]);
        setShards([]);
        bottleMapRef.current.clear();
        stoneMapRef.current.clear();
        setBottleCount(count);
    }, [resetToken, setBottleCount]);

    // Update bottle count when bottles change
    useEffect(() => {
        setBottleCount(bottles.length);
    }, [bottles.length, setBottleCount]);

    // Mouse/touch handlers
    useEffect(() => {
        const mouse = { x: 0, y: 0 };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            raycaster.current.setFromCamera(mouse as any, camera);
            raycaster.current.ray.intersectPlane(plane.current, mousePos.current);
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button !== 0 || (e.target as HTMLElement).tagName === 'BUTTON') return;
            throwStone();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
        };
    }, [camera, stonesLeft]);

    const throwStone = useCallback(() => {
        if (stonesLeft <= 0) return;
        decrementStones();

        const startPos = camera.position.clone();
        startPos.y -= 0.5;

        const dir = mousePos.current.clone().sub(startPos).normalize();
        const vel = dir.multiplyScalar(STONE_THROW_SPEED);

        const stone: StoneData = {
            id: uuidv4(),
            startPosition: [startPos.x, startPos.y, startPos.z],
            velocity: [vel.x, vel.y + 2, vel.z],
        };

        setStones((prev) => [...prev, stone]);
    }, [camera, stonesLeft, decrementStones]);

    // Register bottle
    const registerBottle = useCallback((id: string, body: RapierRigidBody, mesh: Group) => {
        bottleMapRef.current.set(id, { id, body, mesh, type: 'bottle' });
    }, []);

    // Register stone
    const registerStone = useCallback((id: string, body: RapierRigidBody, mesh: Mesh) => {
        stoneMapRef.current.set(id, { id, body, mesh, type: 'stone' });
    }, []);

    // Break bottle and spawn shards
    const breakBottle = useCallback(
        (bottleId: string, impactPos: Vector3, impactVel: Vector3) => {
            const bottle = bottleMapRef.current.get(bottleId);
            if (!bottle || !bottle.body) return;

            const pos = bottle.body.translation();
            const bottlePos = new Vector3(pos.x, pos.y, pos.z);

            // Get bottle color from mesh
            const meshGroup = bottle.mesh as Group;
            const bodyMesh = meshGroup?.children[0] as Mesh;
            const color = (bodyMesh?.material as any)?.color?.getHex() || 0x2e8b57;

            // Create shards
            const shardCount = 25;
            const newShards: ShardData[] = [];

            for (let i = 0; i < shardCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * 0.12;
                const yOffset = (Math.random() - 0.5) * 0.7;

                const sx = bottlePos.x + Math.cos(angle) * r;
                const sy = bottlePos.y + yOffset;
                const sz = bottlePos.z + Math.sin(angle) * r;

                let dirX = sx - impactPos.x;
                let dirY = sy - impactPos.y;
                let dirZ = sz - impactPos.z;
                const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ) || 1;
                dirX /= len;
                dirY /= len;
                dirZ /= len;

                const impactFactor = 0.4;
                const explodeFactor = 5 + Math.random() * 8;
                const scale = 0.5 + Math.random() * 0.8;

                newShards.push({
                    id: uuidv4(),
                    position: [sx, sy, sz],
                    velocity: [
                        dirX * explodeFactor + impactVel.x * impactFactor,
                        dirY * explodeFactor + impactVel.y * impactFactor,
                        dirZ * explodeFactor + impactVel.z * impactFactor,
                    ],
                    angularVelocity: [
                        (Math.random() - 0.5) * 20,
                        (Math.random() - 0.5) * 20,
                        (Math.random() - 0.5) * 20,
                    ],
                    scale,
                    material: color,
                    life: 300,
                });
            }

            // Remove bottle
            bottleMapRef.current.delete(bottleId);
            setBottles((prev) => prev.filter((b) => b.id !== bottleId));

            // Add shards
            setShards((prev) => [...prev, ...newShards]);

            // Increment score
            incrementScore();
        },
        [incrementScore]
    );

    // Check collisions and water physics
    useFrame(() => {
        // Check for bottle-stone collisions
        bottleMapRef.current.forEach((bottle) => {
            if (!bottle.body) return;
            const bottlePos = bottle.body.translation();
            const bottleVel = bottle.body.linvel();

            stoneMapRef.current.forEach((stone) => {
                if (!stone.body) return;
                const stonePos = stone.body.translation();
                const stoneVel = stone.body.linvel();

                // Simple distance check
                const dx = bottlePos.x - stonePos.x;
                const dy = bottlePos.y - stonePos.y;
                const dz = bottlePos.z - stonePos.z;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < 0.3) {
                    // Check impact speed
                    const velDx = stoneVel.x - bottleVel.x;
                    const velDy = stoneVel.y - bottleVel.y;
                    const velDz = stoneVel.z - bottleVel.z;
                    const impactSpeed = Math.sqrt(velDx * velDx + velDy * velDy + velDz * velDz);

                    if (impactSpeed > BREAK_THRESHOLD) {
                        // Slow down stone
                        stone.body.setLinvel(
                            { x: stoneVel.x * 0.3, y: stoneVel.y * 0.3, z: stoneVel.z * 0.3 },
                            true
                        );

                        breakBottle(
                            bottle.id,
                            new Vector3(stonePos.x, stonePos.y, stonePos.z),
                            new Vector3(velDx, velDy, velDz)
                        );
                    }
                }
            });
        });

        // Water physics - improved with buoyancy
        if (river) {
            const { z, width } = river;
            const halfW = width / 2;
            // Water level matches River.tsx: GROUND_LEVEL (-1.5) - 1.5 = -3
            const waterLevel = -3;

            const applyWaterPhysics = (obj: GameObjectRuntime) => {
                if (!obj.body) return;
                const pos = obj.body.translation();
                const vel = obj.body.linvel();

                // Check if in river area
                if (pos.z > z - halfW && pos.z < z + halfW) {
                    const waterDepth = waterLevel - pos.y;

                    if (waterDepth > 0) {
                        // Object is underwater
                        const submergedRatio = Math.min(waterDepth / 0.5, 1); // How deep

                        // Apply water drag (increases with depth)
                        const dragForce = 8 + submergedRatio * 12;
                        obj.body.setLinearDamping(dragForce);
                        obj.body.setAngularDamping(dragForce * 0.5);

                        // Buoyancy - gentle upward force when submerged
                        if (waterDepth > 0.1 && waterDepth < 1.5) {
                            const buoyancy = submergedRatio * 3;
                            obj.body.applyImpulse(
                                { x: 0, y: buoyancy * 0.01, z: 0 },
                                true
                            );
                        }

                        // Slow horizontal movement in water
                        if (Math.abs(vel.x) > 0.5 || Math.abs(vel.z) > 0.5) {
                            obj.body.setLinvel(
                                { x: vel.x * 0.95, y: vel.y, z: vel.z * 0.95 },
                                true
                            );
                        }
                    } else {
                        // Above water, reset damping
                        obj.body.setLinearDamping(0.5);
                        obj.body.setAngularDamping(0.5);
                    }
                }
            };

            bottleMapRef.current.forEach(applyWaterPhysics);
            stoneMapRef.current.forEach(applyWaterPhysics);
        }

        // Remove fallen objects
        bottleMapRef.current.forEach((bottle) => {
            if (!bottle.body) return;
            const pos = bottle.body.translation();
            if (pos.y < -10) {
                bottleMapRef.current.delete(bottle.id);
                setBottles((prev) => prev.filter((b) => b.id !== bottle.id));
            }
        });

        stoneMapRef.current.forEach((stone) => {
            if (!stone.body) return;
            const pos = stone.body.translation();
            if (pos.y < -10) {
                stoneMapRef.current.delete(stone.id);
                setStones((prev) => prev.filter((s) => s.id !== stone.id));
            }
        });
    });

    const handleShardExpire = useCallback((id: string) => {
        setShards((prev) => prev.filter((s) => s.id !== id));
    }, []);

    return (
        <>
            {bottles.map((bottle) => (
                <Bottle key={bottle.id} data={bottle} onRegister={registerBottle} />
            ))}
            {stones.map((stone) => (
                <Stone key={stone.id} data={stone} onRegister={registerStone} />
            ))}
            {shards.map((shard) => (
                <Shard key={shard.id} data={shard} onExpire={handleShardExpire} />
            ))}
        </>
    );
}
