import { useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { BufferGeometry, Float32BufferAttribute, MathUtils } from 'three';
import { useSmashBottlesStore, useSeasonConfig } from '../store';
import { TRACK_Y_OFFSET, GROUND_LEVEL, SLEEPER_HEIGHT } from '../constants';

const ROAD_WIDTH = 8;
const ROAD_LENGTH = 100;
const CROSSING_WIDTH = 3;

export default function Road() {
    const roadZ = useSmashBottlesStore((state) => state.roadZ);
    const seasonConfig = useSeasonConfig();

    // Crossing plate height (level with sleepers)
    const crossingY = TRACK_Y_OFFSET + SLEEPER_HEIGHT + 0.02;

    // Create road geometry with smooth transition to crossing
    const { leftRoad, rightRoad } = useMemo(() => {
        const createRoadSegment = (xStart: number, xEnd: number) => {
            const segmentsX = 32;
            const segmentsZ = 4;
            const vertices: number[] = [];
            const indices: number[] = [];
            const normals: number[] = [];
            const uvs: number[] = [];

            const width = Math.abs(xEnd - xStart);
            const xMin = Math.min(xStart, xEnd);

            for (let zi = 0; zi <= segmentsZ; zi++) {
                for (let xi = 0; xi <= segmentsX; xi++) {
                    const u = xi / segmentsX;
                    const v = zi / segmentsZ;

                    const x = xMin + u * width;
                    const z = (v - 0.5) * ROAD_WIDTH;

                    // Calculate height based on distance from track center
                    const ax = Math.abs(x);
                    let y: number;

                    if (ax < CROSSING_WIDTH) {
                        // At crossing level
                        y = crossingY;
                    } else if (ax < CROSSING_WIDTH + 3) {
                        // Smooth ramp transition
                        const t = (ax - CROSSING_WIDTH) / 3;
                        const smooth = t * t * (3 - 2 * t); // smoothstep
                        y = MathUtils.lerp(crossingY, GROUND_LEVEL + 0.02, smooth);
                    } else {
                        // At ground level
                        y = GROUND_LEVEL + 0.02;
                    }

                    vertices.push(x, y, z);
                    normals.push(0, 1, 0);
                    uvs.push(u, v);
                }
            }

            // Create indices
            for (let zi = 0; zi < segmentsZ; zi++) {
                for (let xi = 0; xi < segmentsX; xi++) {
                    const a = zi * (segmentsX + 1) + xi;
                    const b = a + 1;
                    const c = a + (segmentsX + 1);
                    const d = c + 1;

                    indices.push(a, c, b);
                    indices.push(b, c, d);
                }
            }

            const geo = new BufferGeometry();
            geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
            geo.setAttribute('normal', new Float32BufferAttribute(normals, 3));
            geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
            geo.setIndex(indices);
            geo.computeVertexNormals();
            return geo;
        };

        return {
            leftRoad: createRoadSegment(-ROAD_LENGTH / 2, -CROSSING_WIDTH),
            rightRoad: createRoadSegment(CROSSING_WIDTH, ROAD_LENGTH / 2),
        };
    }, [crossingY]);

    return (
        <>
            {/* Foundation block under crossing */}
            <RigidBody type="fixed" position={[0, -0.5, roadZ]}>
                <mesh receiveShadow>
                    <boxGeometry args={[CROSSING_WIDTH * 2 + 1, 1.5, ROAD_WIDTH + 2]} />
                    <meshStandardMaterial color={seasonConfig.gravel} roughness={0.9} />
                </mesh>
                <CuboidCollider args={[(CROSSING_WIDTH * 2 + 1) / 2, 0.75, (ROAD_WIDTH + 2) / 2]} />
            </RigidBody>

            {/* Crossing plates (wooden planks) */}
            <mesh position={[0, crossingY, roadZ]} receiveShadow castShadow>
                <boxGeometry args={[CROSSING_WIDTH * 2, 0.08, ROAD_WIDTH]} />
                <meshStandardMaterial color={0x5d4037} roughness={0.85} />
            </mesh>

            {/* Road markings / edges */}
            {[-1, 1].map((side) => (
                <mesh
                    key={side}
                    position={[0, crossingY + 0.01, roadZ + side * (ROAD_WIDTH / 2 - 0.1)]}
                    receiveShadow
                >
                    <boxGeometry args={[CROSSING_WIDTH * 2, 0.02, 0.15]} />
                    <meshStandardMaterial color={0xffffff} roughness={0.5} />
                </mesh>
            ))}

            {/* Left road segment */}
            <mesh geometry={leftRoad} position={[0, 0, roadZ]} receiveShadow>
                <meshStandardMaterial color={0x2a2a2a} roughness={0.9} />
            </mesh>

            {/* Right road segment */}
            <mesh geometry={rightRoad} position={[0, 0, roadZ]} receiveShadow>
                <meshStandardMaterial color={0x2a2a2a} roughness={0.9} />
            </mesh>

            {/* Road edge grass strips */}
            {[-1, 1].map((side) => (
                <mesh
                    key={`grass-${side}`}
                    position={[0, GROUND_LEVEL - 0.01, roadZ + side * (ROAD_WIDTH / 2 + 1)]}
                    receiveShadow
                >
                    <boxGeometry args={[ROAD_LENGTH, 0.1, 2]} />
                    <meshStandardMaterial color={seasonConfig.ground} roughness={1} />
                </mesh>
            ))}

            {/* Physics colliders for road surface */}
            <RigidBody type="fixed" position={[0, crossingY - 0.04, roadZ]}>
                <CuboidCollider args={[CROSSING_WIDTH, 0.04, ROAD_WIDTH / 2]} />
            </RigidBody>

            {/* Ramp physics - left side */}
            <RigidBody
                type="fixed"
                position={[-(CROSSING_WIDTH + 1.5), (crossingY + GROUND_LEVEL) / 2, roadZ]}
                rotation={[0, 0, 0.15]}
            >
                <CuboidCollider args={[1.5, 0.05, ROAD_WIDTH / 2]} />
            </RigidBody>

            {/* Ramp physics - right side */}
            <RigidBody
                type="fixed"
                position={[CROSSING_WIDTH + 1.5, (crossingY + GROUND_LEVEL) / 2, roadZ]}
                rotation={[0, 0, -0.15]}
            >
                <CuboidCollider args={[1.5, 0.05, ROAD_WIDTH / 2]} />
            </RigidBody>

            {/* Ground level road physics */}
            {[-1, 1].map((side) => (
                <RigidBody
                    key={`road-phys-${side}`}
                    type="fixed"
                    position={[side * (ROAD_LENGTH / 4 + CROSSING_WIDTH + 2), GROUND_LEVEL, roadZ]}
                >
                    <CuboidCollider args={[ROAD_LENGTH / 4, 0.1, ROAD_WIDTH / 2]} />
                </RigidBody>
            ))}
        </>
    );
}
