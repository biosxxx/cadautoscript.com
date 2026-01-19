import UtilityShellPage from '@site/src/components/Utilities/UtilityShellPage';
import VesselHeadCalculator from '@site/src/components/tools/VesselHeadCalculator';
import {utilityPageConfigs} from '@site/src/data/utilityShellPages';

export default function PressureVesselDishedEndCalcPage() {
  const config = utilityPageConfigs['pressure-vessel-dished-end-calc'];
  if (!config) {
    throw new Error('Utility page configuration missing for slug \"pressure-vessel-dished-end-calc\"');
  }

  return <UtilityShellPage {...config} tool={<VesselHeadCalculator />} />;
}
