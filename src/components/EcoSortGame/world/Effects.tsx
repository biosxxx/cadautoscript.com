import {Bloom, EffectComposer, FXAA, SSAO} from '@react-three/postprocessing';
import {Color} from 'three';

export default function EcoSortEffects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <SSAO samples={8} radius={0.15} intensity={20} luminanceInfluence={0.6} color={new Color(0x000000)} />
      <Bloom intensity={0.4} luminanceThreshold={0.75} luminanceSmoothing={0.15} />
      <FXAA />
    </EffectComposer>
  );
}
