import type {MiniGameSlug} from '@site/src/data/miniGamePages';
import {miniGamePageConfigs} from '@site/src/data/miniGamePages';
import MiniGameShellPage from './MiniGameShellPage';

export const createMiniGamePage = (slug: MiniGameSlug) => () => {
  const config = miniGamePageConfigs[slug];
  return <MiniGameShellPage {...config} />;
};
