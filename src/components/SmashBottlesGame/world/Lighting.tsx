import { useSeasonConfig } from '../store';

export default function Lighting() {
    const seasonConfig = useSeasonConfig();

    return (
        <>
            <directionalLight
                name="sun"
                position={[20, 50, 20]}
                intensity={seasonConfig.lightInt}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.5}
                shadow-camera-far={100}
                shadow-camera-left={-30}
                shadow-camera-right={30}
                shadow-camera-top={30}
                shadow-camera-bottom={-30}
                shadow-bias={-0.0005}
            />
            <ambientLight intensity={0.3} />
        </>
    );
}
