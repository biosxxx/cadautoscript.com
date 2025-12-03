import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';


const UtilityPage = createUtilityPage('qr-nameplate');

export default function QrNameplatePage() {
  return (
    <>
      <UtilityPage />
      <div className="utility-reactions">
        <ReactionsBar slug="tool-qr-nameplate" />
      </div>
    </>
  );
}
