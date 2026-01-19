import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import BlindFlangeCalculator from '@site/src/components/tools/BlindFlangeCalculator';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

export default function BlindFlangeCalculatorPage() {
  const config = utilityPageConfigs['blind-flange-calculator'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug "blind-flange-calculator"');
  }

  return <UtilityShellPage {...config} tool={<BlindFlangeCalculator />} />;
}
