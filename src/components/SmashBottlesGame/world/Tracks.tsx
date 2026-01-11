import { useEffect, useRef } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { InstancedMesh, Object3D } from 'three';
import { useSmashBottlesStore, useSeasonConfig } from '../store';
import { SLEEPER_HEIGHT, RAIL_HEIGHT, TRACK_Y_OFFSET, WORLD_LENGTH } from '../constants';

const GAUGE = 0.8;
const RAIL_W = 0.1;
const SLEEPER_SPACING = 0.8;

export default function Tracks() {
    const seasonConfig = useSeasonConfig();
    const river = useSmashBottlesStore((state) => state.river);
    const resetToken = useSmashBottlesStore((state) => state.resetToken);
    const sleepersRef = useRef<InstancedMesh>(null);

    const sleeperCount = Math.floor(WORLD_LENGTH / SLEEPER_SPACING);

    // Generate sleeper matrices using useEffect to ensure ref is ready
    useEffect(() => {
        if (!sleepersRef.current) return;
        const dummy = new Object3D();
        let idx = 0;
        for (let z = -WORLD_LENGTH / 2; z <= WORLD_LENGTH / 2; z += SLEEPER_SPACING) {
            if (idx >= sleeperCount) break;
            dummy.position.set(0, TRACK_Y_OFFSET + SLEEPER_HEIGHT / 2, z);
            dummy.updateMatrix();
            sleepersRef.current.setMatrixAt(idx++, dummy.matrix);
        }
        sleepersRef.current.instanceMatrix.needsUpdate = true;
    }, [sleeperCount, resetToken]);

    // Determine which sleepers need physics (center area + bridge)
    const sleepersWithPhysics: number[] = [];
    for (let z = -WORLD_LENGTH / 2; z <= WORLD_LENGTH / 2; z += SLEEPER_SPACING) {
        const isCenter = Math.abs(z) < 40;
        const isBridge = river && Math.abs(z - river.z) < river.width / 2 + 2;
        if (isCenter || isBridge) {
            sleepersWithPhysics.push(z);
        }
    }

    return (
        <>
            {/* Sleepers (Instanced) - render BEFORE rails so they appear underneath */}
            <instancedMesh
                ref={sleepersRef}
                args={[undefined, undefined, sleeperCount]}
                receiveShadow
                castShadow
                frustumCulled={false}
            >
                <boxGeometry args={[1.6, SLEEPER_HEIGHT, 0.3]} />
                <meshStandardMaterial color={seasonConfig.wood} roughness={0.9} />
            </instancedMesh>

            {/* Rails */}
            {[-1, 1].map((dir) => {
                const x = (dir * GAUGE) / 2;
                return (
                    <RigidBody key={`rail-${dir}`} type="fixed" position={[x, TRACK_Y_OFFSET + SLEEPER_HEIGHT + RAIL_HEIGHT / 2, 0]}>
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[RAIL_W, RAIL_HEIGHT, WORLD_LENGTH]} />
                            <meshStandardMaterial color={0x333333} metalness={0.8} roughness={0.4} />
                        </mesh>
                        <CuboidCollider args={[0.2, RAIL_HEIGHT / 2, WORLD_LENGTH / 2]} />
                    </RigidBody>
                );
            })}

            {/* Sleeper Physics (only important areas) */}
            {sleepersWithPhysics.map((z) => (
                <RigidBody key={`sleeper-phys-${z}`} type="fixed" position={[0, TRACK_Y_OFFSET + SLEEPER_HEIGHT / 2, z]}>
                    <CuboidCollider args={[0.8, SLEEPER_HEIGHT / 2, 0.15]} />
                </RigidBody>
            ))}
        </>
    );
}
