import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';


const UtilityPage = createUtilityPage('pdf-master');

export default function PdfMasterPage() {
  return (
    <>
      <UtilityPage />
      <div className="utility-reactions">
        <ReactionsBar slug="tool-pdf-master" />
      </div>
    </>
  );
}
