import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useNavbarSecondaryMenu} from '@docusaurus/theme-common/internal';
import type {Props} from '@theme/Navbar/MobileSidebar/Layout';

export default function NavbarMobileSidebarLayout({
  header,
  primaryMenu,
  secondaryMenu,
}: Props): ReactNode {
  const {shown: secondaryMenuShown, content: secondaryMenuContent} = useNavbarSecondaryMenu();
  const hasSecondaryMenu = Boolean(secondaryMenuContent);

  return (
    <div
      className={clsx(
        ThemeClassNames.layout.navbar.mobileSidebar.container,
        'navbar-sidebar',
      )}
    >
      {header}
      <div className={clsx('navbar-sidebar__items', 'navbar-sidebar__items--split')}>
        <div className={clsx('navbar-sidebar__item', 'menu', 'navbar-sidebar__primary-panel')}>
          {primaryMenu}
        </div>
        {hasSecondaryMenu && (
          <div
            className={clsx(
              'navbar-sidebar__item',
              'menu',
              'navbar-sidebar__secondary-panel',
              {'navbar-sidebar__secondary-panel--visible': secondaryMenuShown},
            )}
          >
            {secondaryMenu}
          </div>
        )}
      </div>
    </div>
  );
}
