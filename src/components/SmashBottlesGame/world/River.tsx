import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { DoubleSide, Mesh, Shape, ExtrudeGeometry } from 'three';
import { useSmashBottlesStore, useSeasonConfig } from '../store';
import { GROUND_LEVEL, TRACK_Y_OFFSET } from '../constants';

export default function River() {
    const river = useSmashBottlesStore((state) => state.river);
    const seasonConfig = useSeasonConfig();
    const waterRef = useRef<Mesh>(null);

    // Dimensions
    const RIVER_DEPTH = 4;
    const waterLevel = GROUND_LEVEL - 1.5;
    const bedLevel = GROUND_LEVEL - RIVER_DEPTH;

    // Animate water
    useFrame((state) => {
        if (waterRef.current && river) {
            waterRef.current.position.y = waterLevel + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
        }
    });

    // Rocks
    const rocks = useMemo(() => {
        if (!river) return [];
        const result: { x: number; z: number; scale: number; rotation: number }[] = [];
        for (let i = 0; i < 20; i++) {
            result.push({
                x: (Math.random() - 0.5) * 30,
                z: river.z + (Math.random() - 0.5) * (river.width * 0.7),
                scale: 0.15 + Math.random() * 0.25,
                rotation: Math.random() * Math.PI,
            });
        }
        return result;
    }, [river]);

    const { bridgeGeometry, bridgeLength } = useMemo(() => {
        if (!river) return { bridgeGeometry: null, bridgeLength: 0 };

        const width = river.width;
        const length = width + 6;
        const bridgeTopY = TRACK_Y_OFFSET - 0.03;
        const h = Math.abs(bridgeTopY - bedLevel);

        // Create bridge profile shape (side view from tracks)
        const shape = new Shape();
        const halfL = length / 2;

        // Main block
        shape.moveTo(-halfL, 0);
        shape.lineTo(halfL, 0);
        shape.lineTo(halfL, h);
        shape.lineTo(-halfL, h);
        shape.closePath();

        // Opening (Arch)
        const hole = new Shape();
        const holeW = width * 1.3;
        const holeH = h * 0.75;

        const segments = 24;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = (t - 0.5) * holeW;
            const y = Math.sin(t * Math.PI) * holeH;
            if (i === 0) hole.moveTo(x, y);
            else hole.lineTo(x, y);
        }
        hole.lineTo(holeW / 2, 0);
        hole.lineTo(-holeW / 2, 0);
        hole.closePath();
        shape.holes.push(hole);

        const extrudeSettings = {
            steps: 1,
            depth: 3.0, // Width across tracks
            bevelEnabled: false
        };

        const geo = new ExtrudeGeometry(shape, extrudeSettings);

        // Align geometry:
        // Local X (bridge length) -> World Z
        // Local Y (bridge height) -> World Y
        // Local Z (bridge depth/width) -> World X
        geo.rotateY(Math.PI / 2);
        geo.translate(-1.5, 0, 0); // Center the 3.0 depth on world X

        return { bridgeGeometry: geo, bridgeLength: length };
    }, [river, bedLevel]);

    if (!river) return null;

    const { z, width } = river;
    const isWinter = seasonConfig.name === 'Winter';
    const waterColor = isWinter ? 0x87ceeb : 0x2980b9;
    const deepColor = isWinter ? 0x5dade2 : 0x1a5276;

    const bridgeTopY = TRACK_Y_OFFSET - 0.03;

    return (
        <>
            {/* ===== RIVER BED ===== */}
            <mesh position={[0, bedLevel, z]} receiveShadow>
                <boxGeometry args={[80, 0.5, width]} />
                <meshStandardMaterial color={0x1a1a1a} roughness={1} />
            </mesh>

            {/* ===== RIVER BANK WALLS ===== */}
            {[-1, 1].map((side) => (
                <mesh
                    key={`wall-${side}`}
                    position={[0, (GROUND_LEVEL + bedLevel) / 2, z + side * (width / 2 + 1)]}
                    receiveShadow
                    castShadow
                >
                    <boxGeometry args={[80, RIVER_DEPTH, 2]} />
                    <meshStandardMaterial color={0x5d4037} roughness={0.9} />
                </mesh>
            ))}

            {/* ===== WATER ===== */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, bedLevel + 0.6, z]}>
                <planeGeometry args={[80, width]} />
                <meshStandardMaterial color={deepColor} transparent opacity={0.9} side={DoubleSide} />
            </mesh>
            <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, waterLevel, z]}>
                <planeGeometry args={[80, width - 0.5]} />
                <meshPhysicalMaterial color={waterColor} metalness={0.2} roughness={0.05} transparent opacity={0.6} side={DoubleSide} />
            </mesh>

            {/* ===== ROCKS ===== */}
            {rocks.map((rock, idx) => (
                <mesh key={idx} position={[rock.x, bedLevel + 0.35, rock.z]} rotation={[0, rock.rotation, 0]} scale={rock.scale} castShadow>
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={0x444444} roughness={0.85} />
                </mesh>
            ))}

            {/* River bed physics */}
            <RigidBody type="fixed" position={[0, bedLevel, z]}>
                <CuboidCollider args={[40, 0.25, width / 2]} />
            </RigidBody>

            {/* ===== BRIDGE ===== */}
            {bridgeGeometry && (
                <mesh geometry={bridgeGeometry} position={[0, bedLevel, z]} receiveShadow castShadow>
                    <meshStandardMaterial color={0x6a6a6a} roughness={0.8} />
                </mesh>
            )}

            {/* Concrete abutment connectors - to ensure no gaps with embankment */}
            {[-1, 1].map((side) => {
                const abutZ = z + side * (bridgeLength / 2 - 0.5);
                return (
                    <mesh key={`abut-${side}`} position={[0, (bridgeTopY + bedLevel) / 2, abutZ]} receiveShadow>
                        <boxGeometry args={[3.2, bridgeTopY - bedLevel, 1.2]} />
                        <meshStandardMaterial color={0x5a5a5a} roughness={0.9} />
                    </mesh>
                );
            })}

            {/* Bridge physics */}
            <RigidBody type="fixed" position={[0, bridgeTopY, z]}>
                <CuboidCollider args={[1.5, 0.1, bridgeLength / 2]} />
            </RigidBody>
        </>
    );
}
