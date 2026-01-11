import { useRef, useEffect } from 'react';
import { RigidBody, CylinderCollider, RapierRigidBody } from '@react-three/rapier';
import { Group } from 'three';
import type { BottleData } from '../types';

interface BottleProps {
    data: BottleData;
    onRegister: (id: string, body: RapierRigidBody, mesh: Group) => void;
}

const BOTTLE_HEIGHT = 0.7;
const BOTTLE_RADIUS = 0.12;

export default function Bottle({ data, onRegister }: BottleProps) {
    const bodyRef = useRef<RapierRigidBody>(null);
    const meshRef = useRef<Group>(null);
    const color = Math.random() > 0.5 ? 0x2e8b57 : 0xa0522d;

    useEffect(() => {
        if (bodyRef.current && meshRef.current) {
            onRegister(data.id, bodyRef.current, meshRef.current);
        }
    }, [data.id, onRegister]);

    return (
        <RigidBody
            ref={bodyRef}
            type="dynamic"
            position={[data.position[0], data.position[1] + BOTTLE_HEIGHT / 2, data.position[2]]}
            linearDamping={2.0}
            angularDamping={2.0}
            colliders={false}
        >
            <CylinderCollider
                args={[BOTTLE_HEIGHT / 2, BOTTLE_RADIUS]}
                density={5.0}
                restitution={0.1}
                friction={1.0}
            />
            <group ref={meshRef}>
                {/* Body */}
                <mesh castShadow>
                    <cylinderGeometry args={[BOTTLE_RADIUS, BOTTLE_RADIUS, BOTTLE_HEIGHT, 16]} />
                    <meshPhysicalMaterial
                        color={color}
                        transmission={0.95}
                        roughness={0.1}
                        thickness={0.1}
                        transparent
                    />
                </mesh>
                {/* Neck */}
                <mesh position={[0, BOTTLE_HEIGHT / 2 + BOTTLE_HEIGHT * 0.2, 0]} castShadow>
                    <cylinderGeometry args={[BOTTLE_RADIUS * 0.4, BOTTLE_RADIUS * 0.4, BOTTLE_HEIGHT * 0.4, 16]} />
                    <meshPhysicalMaterial
                        color={color}
                        transmission={0.95}
                        roughness={0.1}
                        thickness={0.1}
                        transparent
                    />
                </mesh>
            </group>
        </RigidBody>
    );
}
