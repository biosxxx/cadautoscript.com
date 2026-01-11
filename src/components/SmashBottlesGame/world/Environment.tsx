import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Color, Fog } from 'three';
import { useSeasonConfig } from '../store';

export default function Environment() {
    const { scene } = useThree();
    const seasonConfig = useSeasonConfig();

    useEffect(() => {
        scene.background = new Color(seasonConfig.sky);
        scene.fog = new Fog(seasonConfig.sky, seasonConfig.fogNear, seasonConfig.fogFar);
    }, [scene, seasonConfig]);

    return null;
}
