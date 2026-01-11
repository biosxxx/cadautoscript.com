import * as Postprocessing from '@react-three/postprocessing';
import { Color } from 'three';

export default function EcoSortEffects() {
  const postprocessingDefault = (Postprocessing as { default?: typeof Postprocessing }).default;
  const EffectComposer = Postprocessing.EffectComposer ?? postprocessingDefault?.EffectComposer;
  const SSAO = Postprocessing.SSAO ?? postprocessingDefault?.SSAO;
  const Bloom = Postprocessing.Bloom ?? postprocessingDefault?.Bloom;
  const Vignette = Postprocessing.Vignette ?? postprocessingDefault?.Vignette;
  const FXAA = Postprocessing.FXAA ?? postprocessingDefault?.FXAA;

  if (!EffectComposer || !SSAO || !Bloom || !FXAA || !Vignette) {
    return null;
  }

  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <SSAO samples={8} radius={0.15} intensity={20} luminanceInfluence={0.6} color={new Color(0x000000)} />
      <Bloom intensity={0.4} luminanceThreshold={0.75} luminanceSmoothing={0.15} />
      <FXAA />
    </EffectComposer>
  );
}
