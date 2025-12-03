import {createUtilityPage} from '@site/src/components/Utilities/createUtilityPage';
import ReactionsBar from '@site/src/components/Reactions/ReactionsBar';


const UtilityPage = createUtilityPage('cylindrical-shell-rolling');

export default function CylindricalShellRollingPage() {
  return (
    <>
      <UtilityPage />
      <div className="utility-reactions">
        <ReactionsBar slug="tool-cylindrical-shell-rolling" />
      </div>
    </>
  );
}
