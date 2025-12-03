import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';


const UtilityPage = createUtilityPage('pdf-number-extractor');

export default function PdfNumberExtractorPage() {
  return (
    <>
      <UtilityPage />
      <div className="utility-reactions">
        <ReactionsBar slug="tool-pdf-number-extractor" />
      </div>
    </>
  );
}
