import type { CSSProperties } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { useSmashBottlesStore } from './store';

// World
import Environment from './world/Environment';
import Lighting from './world/Lighting';
import Terrain from './world/Terrain';
import Tracks from './world/Tracks';
import River from './world/River';
import Road from './world/Road';
import Flora from './world/Flora';
import WorldGenerator from './world/WorldGenerator';

// Entities
import GameManager from './entities/GameManager';

// UI
import HUD from './ui/HUD';
import AimMarker from './ui/AimMarker';
import CameraController from './ui/CameraController';

export default function SmashBottlesGame() {
    const isBrowser = useIsBrowser();
    const resetToken = useSmashBottlesStore((state) => state.resetToken);

    if (!isBrowser) {
        return null;
    }

    return (
        <div style={styles.wrapper}>
            <Canvas
                shadows
                camera={{ position: [0, 4, 10], fov: 45 }}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => {
                    gl.toneMapping = ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.0;
                    gl.outputColorSpace = SRGBColorSpace;
                }}
            >
                <group key={resetToken}>
                    <Physics gravity={[0, -9.81, 0]}>
                        <Environment />
                        <Lighting />
                        <WorldGenerator />
                        <Terrain />
                        <Tracks />
                        <River />
                        <Road />
                        <Flora />
                        <GameManager />
                        <AimMarker />
                    </Physics>
                </group>
                <CameraController />
            </Canvas>
            <HUD />
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    wrapper: {
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000',
        touchAction: 'none',
    },
};
