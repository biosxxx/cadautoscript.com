import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';


const UtilityPage = createUtilityPage('metal-bending');

export default function MetalBendingPage() {
  return (
    <>
      <UtilityPage />
      <div className="utility-reactions">
        <ReactionsBar slug="tool-metal-bending" />
      </div>
    </>
  );
}
