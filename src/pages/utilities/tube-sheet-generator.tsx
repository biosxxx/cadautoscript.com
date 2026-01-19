import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import TubeSheetGenerator from '@site/src/components/tools/TubeSheetGenerator';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

export default function TubeSheetGeneratorPage() {
  const config = utilityPageConfigs['tube-sheet-generator'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug "tube-sheet-generator"');
  }

  return <UtilityShellPage {...config} tool={<TubeSheetGenerator />} />;
}
