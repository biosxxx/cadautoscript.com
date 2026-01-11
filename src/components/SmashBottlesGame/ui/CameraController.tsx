import { OrbitControls } from '@react-three/drei';

export default function CameraController() {
    return (
        <OrbitControls
            enableDamping
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={3}
            maxDistance={30}
            target={[0, 1, -5]}
        />
    );
}
