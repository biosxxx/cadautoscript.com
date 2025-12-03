import React from 'react';
import UtilityShellPage from './UtilityShellPage';
import {
  utilityPageConfigs,
  type UtilityPageSlug,
} from '@site/src/data/utilityShellPages';

export function createUtilityPage(slug: UtilityPageSlug) {
  return function UtilityPage() {
    const config = utilityPageConfigs[slug];
    if (!config) {
      throw new Error(`Utility page configuration missing for slug "${slug}"`);
    }
    return <UtilityShellPage {...config} />;
  };
}
