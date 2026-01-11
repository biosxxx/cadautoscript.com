import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Points } from 'three';
import { BufferGeometry, Float32BufferAttribute, PointsMaterial } from 'three';
import { useEcoSortStore } from '../store';

export default function Weather() {
    const weather = useEcoSortStore((state) => state.weather);
    const pointsRef = useRef<Points>(null);

    const { count, color, size, fallSpeed } = useMemo(() => {
        switch (weather) {
            case 'RAIN':
                return { count: 1500, color: 0xaaccff, size: 0.15, fallSpeed: 25 };
            case 'SNOW':
                return { count: 1500, color: 0xffffff, size: 0.12, fallSpeed: 4 };
            default:
                return { count: 0, color: 0x000000, size: 0, fallSpeed: 0 };
        }
    }, [weather]);

    const particles = useMemo(() => {
        if (count === 0) return null;
        const vertices = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            vertices[i * 3] = (Math.random() - 0.5) * 50; // x
            vertices[i * 3 + 1] = Math.random() * 30; // y
            vertices[i * 3 + 2] = (Math.random() - 0.5) * 50; // z
        }
        return vertices;
    }, [count]);

    useFrame((_, delta) => {
        if (!pointsRef.current || !particles) return;

        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < count; i++) {
            let y = positions[i * 3 + 1];
            y -= fallSpeed * delta;

            if (y < 0) {
                y = 30;
            }

            positions[i * 3 + 1] = y;
        }

        pointsRef.current.geometry.attributes.position.needsUpdate = true;
    });

    if (count === 0 || !particles) return null;

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particles}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                color={color}
                size={size}
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}
