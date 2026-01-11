import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Plane, Raycaster, Mesh } from 'three';
import { RAIL_TOP_Y } from '../constants';

export default function AimMarker() {
    const { camera } = useThree();
    const markerRef = useRef<Mesh>(null);
    const raycaster = useRef(new Raycaster());
    const plane = useRef(new Plane(new Vector3(0, 1, 0), 0));
    const intersection = useRef(new Vector3());
    const mouse = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useFrame(() => {
        if (!markerRef.current) return;
        raycaster.current.setFromCamera(mouse.current, camera);
        if (raycaster.current.ray.intersectPlane(plane.current, intersection.current)) {
            markerRef.current.position.copy(intersection.current);
            markerRef.current.position.y = RAIL_TOP_Y;
        }
    });

    return (
        <mesh ref={markerRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.12, 32]} />
            <meshBasicMaterial color={0xff3333} transparent opacity={0.8} />
        </mesh>
    );
}
