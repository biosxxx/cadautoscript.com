import React from 'react';
import Link from '@docusaurus/Link';
import {utilities} from '@site/src/data/utilities';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useUtilitiesAccess} from '@site/src/hooks/useUtilitiesAccess';
import styles from './UtilityAccessTable.module.css';

export default function UtilityAccessTable(): React.JSX.Element {
  const {isAuthenticated, authChecked} = useAuthStatus();
  const {openLoginModal} = useAuthModal();
  const {utilitiesPublicAccess} = useUtilitiesAccess();

  const handleLaunch = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    isLocked: boolean,
  ) => {
    if (!isLocked) {
      return;
    }
    event.preventDefault();
    openLoginModal();
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.notice}>
        {utilitiesPublicAccess
          ? 'All utilities are currently open. Sign-in is optional.'
          : 'Guests can launch the first three tools. Sign in to unlock the rest of the catalog.'}
      </p>
      <table className="utilityTable">
        <thead>
          <tr>
            <th>Utility</th>
            <th>Description</th>
            <th>Standards</th>
            <th>Launch</th>
          </tr>
        </thead>
        <tbody>
          {utilities.map((utility, index) => {
            const isLocked = !utilitiesPublicAccess && authChecked && !isAuthenticated && index >= 3;
            return (
              <tr key={utility.id}>
                <td>{utility.name}</td>
                <td>{utility.description}</td>
                <td>{utility.standards}</td>
                <td className={styles.launchCell}>
                  <Link
                    to={utility.href}
                    data-nobrokenlinkcheck
                    onClick={(event) => handleLaunch(event, isLocked)}
                    className={isLocked ? styles.lockedLink : undefined}
                  >
                    {isLocked ? 'Sign in to open' : 'Open'}
                  </Link>
                  {isLocked ? <span className={styles.lockPill}>Locked</span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
