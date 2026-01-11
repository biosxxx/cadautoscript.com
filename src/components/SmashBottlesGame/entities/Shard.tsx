import { useRef, useEffect, useState } from 'react';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { useFrame } from '@react-three/fiber';
import type { ShardData } from '../types';

interface ShardProps {
    data: ShardData;
    onExpire: (id: string) => void;
}

export default function Shard({ data, onExpire }: ShardProps) {
    const bodyRef = useRef<RapierRigidBody>(null);
    const [life, setLife] = useState(data.life);

    useFrame(() => {
        setLife((prev) => {
            const next = prev - 1;
            if (next <= 0) {
                onExpire(data.id);
            }
            return next;
        });

        // Check if fallen too low
        if (bodyRef.current) {
            const pos = bodyRef.current.translation();
            if (pos.y < -10) {
                onExpire(data.id);
            }
        }
    });

    const halfSize = 0.03 * data.scale;

    return (
        <RigidBody
            ref={bodyRef}
            type="dynamic"
            position={data.position}
            linearVelocity={data.velocity}
            angularVelocity={data.angularVelocity}
            colliders={false}
        >
            <CuboidCollider args={[halfSize, halfSize, halfSize]} restitution={0.3} friction={0.6} />
            <mesh castShadow scale={data.scale}>
                <tetrahedronGeometry args={[0.06]} />
                <meshPhysicalMaterial
                    color={data.material}
                    transmission={0.95}
                    roughness={0.1}
                    transparent
                />
            </mesh>
        </RigidBody>
    );
}
