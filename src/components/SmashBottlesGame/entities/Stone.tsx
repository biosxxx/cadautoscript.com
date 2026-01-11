import { useRef, useEffect } from 'react';
import { RigidBody, BallCollider, RapierRigidBody } from '@react-three/rapier';
import { Mesh } from 'three';
import type { StoneData } from '../types';

interface StoneProps {
    data: StoneData;
    onRegister: (id: string, body: RapierRigidBody, mesh: Mesh) => void;
}

const STONE_RADIUS = 0.08;

export default function Stone({ data, onRegister }: StoneProps) {
    const bodyRef = useRef<RapierRigidBody>(null);
    const meshRef = useRef<Mesh>(null);

    useEffect(() => {
        if (bodyRef.current && meshRef.current) {
            onRegister(data.id, bodyRef.current, meshRef.current);
        }
    }, [data.id, onRegister]);

    return (
        <RigidBody
            ref={bodyRef}
            type="dynamic"
            position={data.startPosition}
            linearVelocity={data.velocity}
            linearDamping={0.8}
            angularDamping={2.0}
            ccd
            colliders={false}
        >
            <BallCollider args={[STONE_RADIUS]} density={4.0} restitution={0.1} friction={1.5} />
            <mesh ref={meshRef} castShadow>
                <dodecahedronGeometry args={[STONE_RADIUS, 0]} />
                <meshStandardMaterial color={0x888888} roughness={0.8} />
            </mesh>
        </RigidBody>
    );
}
