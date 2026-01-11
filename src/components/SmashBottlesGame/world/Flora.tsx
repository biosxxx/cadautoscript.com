import { useMemo } from 'react';
import { useSmashBottlesStore, useSeasonConfig } from '../store';
import { WORLD_LENGTH, GROUND_LEVEL } from '../constants';

const TREE_COUNT = 150;
const ROAD_WIDTH = 6;

interface TreeData {
    x: number;
    z: number;
    scale: number;
    trunkHeight: number;
    crownLayers: number;
    rotation: number;
}

export default function Flora() {
    const seasonConfig = useSeasonConfig();
    const river = useSmashBottlesStore((state) => state.river);
    const roadZ = useSmashBottlesStore((state) => state.roadZ);
    const resetToken = useSmashBottlesStore((state) => state.resetToken);

    const trees = useMemo(() => {
        const result: TreeData[] = [];

        for (let i = 0; i < TREE_COUNT; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const dist = 8 + Math.random() * 40;
            const x = side * dist;
            const z = (Math.random() - 0.5) * WORLD_LENGTH * 0.8;

            // Skip if too close to river
            if (river && Math.abs(z - river.z) < river.width / 2 + 4) continue;
            // Skip if too close to road
            if (Math.abs(z - roadZ) < ROAD_WIDTH / 2 + 4) continue;
            // Skip if too far
            if (Math.abs(z) > 180) continue;

            // Bigger and more varied trees
            const scale = 1.5 + Math.random() * 1.5;
            const trunkHeight = 2.5 + Math.random() * 2;
            const crownLayers = 2 + Math.floor(Math.random() * 3);
            const rotation = Math.random() * Math.PI * 2;

            result.push({ x, z, scale, trunkHeight, crownLayers, rotation });
        }

        return result;
    }, [river, roadZ, resetToken]);

    return (
        <>
            {trees.map((tree, idx) => (
                <group
                    key={idx}
                    position={[tree.x, GROUND_LEVEL, tree.z]}
                    scale={tree.scale}
                    rotation={[0, tree.rotation, 0]}
                >
                    {/* Trunk - taller and more detailed */}
                    <mesh position={[0, tree.trunkHeight / 2, 0]} castShadow receiveShadow>
                        <cylinderGeometry args={[0.15, 0.35, tree.trunkHeight, 8]} />
                        <meshStandardMaterial color={seasonConfig.wood} roughness={0.95} />
                    </mesh>

                    {/* Multiple crown layers for more realistic look */}
                    {Array.from({ length: tree.crownLayers }).map((_, layerIdx) => {
                        const layerY = tree.trunkHeight + 0.8 + layerIdx * 1.2;
                        const layerScale = 1 - layerIdx * 0.25;
                        const leafColor = seasonConfig.leaves[layerIdx % seasonConfig.leaves.length];

                        return (
                            <group key={layerIdx}>
                                {/* Main cone */}
                                <mesh
                                    position={[0, layerY, 0]}
                                    scale={[layerScale, layerScale, layerScale]}
                                    castShadow
                                    receiveShadow
                                >
                                    <coneGeometry args={[1.8, 2.5, 8]} />
                                    <meshStandardMaterial
                                        color={leafColor}
                                        flatShading
                                        roughness={0.8}
                                    />
                                </mesh>
                            </group>
                        );
                    })}

                    {/* Top spike */}
                    <mesh
                        position={[0, tree.trunkHeight + 0.8 + tree.crownLayers * 1.2, 0]}
                        castShadow
                    >
                        <coneGeometry args={[0.5, 1.5, 6]} />
                        <meshStandardMaterial
                            color={seasonConfig.leaves[0]}
                            flatShading
                            roughness={0.8}
                        />
                    </mesh>
                </group>
            ))}
        </>
    );
}
