import { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { ExtrudeGeometry, Shape } from 'three';
import { useSmashBottlesStore, useSeasonConfig } from '../store';
import { WORLD_LENGTH, GROUND_LEVEL } from '../constants';

const BANK_WIDTH = 4;
const BANK_BASE_WIDTH = 9;
const BANK_HEIGHT = 2;
const SLOPE_WIDTH = 80;
const ROAD_WIDTH = 8;

export default function Terrain() {
    const seasonConfig = useSeasonConfig();
    const river = useSmashBottlesStore((state) => state.river);
    const roadZ = useSmashBottlesStore((state) => state.roadZ);

    // Bridge length (must match River.tsx)
    const bridgeLength = river ? river.width + 6 : 0;

    // Calculate terrain segments (avoiding river bridge area and road)
    const segments = useMemo(() => {
        const holes: { s: number; e: number }[] = [];
        if (river) {
            // Gap exactly matches bridge length
            holes.push({
                s: river.z - bridgeLength / 2,
                e: river.z + bridgeLength / 2
            });
        }
        // Road gap
        const roadGap = ROAD_WIDTH / 2 + 1;
        holes.push({ s: roadZ - roadGap, e: roadZ + roadGap });
        holes.sort((a, b) => a.s - b.s);

        const result: { start: number; end: number }[] = [];
        let currentZ = -WORLD_LENGTH / 2;
        holes.forEach((h) => {
            if (h.s > currentZ) {
                result.push({ start: currentZ, end: h.s });
            }
            currentZ = Math.max(currentZ, h.e);
        });
        if (currentZ < WORLD_LENGTH / 2) {
            result.push({ start: currentZ, end: WORLD_LENGTH / 2 });
        }
        return result;
    }, [river, roadZ, bridgeLength]);

    // Create embankment shape
    const bankGeometry = useMemo(() => {
        const shape = new Shape();
        const topHalf = BANK_WIDTH / 2;
        const bottomHalf = BANK_BASE_WIDTH / 2;
        const h = BANK_HEIGHT;

        shape.moveTo(-topHalf, 0);
        shape.lineTo(topHalf, 0);
        shape.lineTo(bottomHalf, -h);
        shape.lineTo(-bottomHalf, -h);
        shape.lineTo(-topHalf, 0);

        return shape;
    }, []);

    // Create grass segments that avoid river area
    const grassSegments = useMemo(() => {
        if (!river) {
            return [{ start: -WORLD_LENGTH / 2, end: WORLD_LENGTH / 2 }];
        }
        // Grass gap matches river channel (bank walls)
        const riverGap = river.width / 2 + 2;
        return [
            { start: -WORLD_LENGTH / 2, end: river.z - riverGap },
            { start: river.z + riverGap, end: WORLD_LENGTH / 2 },
        ];
    }, [river]);

    return (
        <>
            {segments.map((seg, idx) => {
                const length = seg.end - seg.start;
                const zCenter = (seg.start + seg.end) / 2;

                const extrudeSettings = { steps: 1, depth: length, bevelEnabled: false };
                const bankGeo = new ExtrudeGeometry(bankGeometry, extrudeSettings);
                bankGeo.translate(0, 0, -length / 2);

                return (
                    <group key={idx}>
                        {/* Embankment */}
                        <mesh
                            geometry={bankGeo}
                            position={[0, 0, zCenter]}
                            receiveShadow
                            castShadow
                        >
                            <meshStandardMaterial color={seasonConfig.gravel} roughness={0.9} />
                        </mesh>

                        {/* Embankment Physics */}
                        <RigidBody type="fixed" position={[0, -BANK_HEIGHT / 2, zCenter]}>
                            <CuboidCollider args={[BANK_WIDTH / 2, BANK_HEIGHT / 2, length / 2]} />
                        </RigidBody>
                    </group>
                );
            })}

            {/* Grass planes that avoid river area */}
            {grassSegments.map((seg, idx) => {
                const length = seg.end - seg.start;
                const zCenter = (seg.start + seg.end) / 2;
                return (
                    <group key={`grass-${idx}`}>
                        {[-1, 1].map((dir) => (
                            <mesh
                                key={dir}
                                position={[dir * (BANK_BASE_WIDTH / 2 + SLOPE_WIDTH / 2 - 1), GROUND_LEVEL - 0.01, zCenter]}
                                receiveShadow
                            >
                                <boxGeometry args={[SLOPE_WIDTH, 0.5, length]} />
                                <meshStandardMaterial color={seasonConfig.ground} roughness={1.0} />
                            </mesh>
                        ))}
                    </group>
                );
            })}

            {/* Lower Ground Physics */}
            <RigidBody type="fixed" position={[0, GROUND_LEVEL - 0.1, 0]}>
                <CuboidCollider args={[100, 0.1, WORLD_LENGTH / 2]} />
            </RigidBody>
        </>
    );
}
