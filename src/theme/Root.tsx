import React from 'react';
import Root from '@theme-original/Root';
import type {Props} from '@theme/Root';
import LoginModal from '@site/src/components/Auth/LoginModal';
import {AuthModalProvider} from '@site/src/contexts/AuthModalContext';

export default function RootWrapper(props: Props) {
  return (
    <AuthModalProvider>
      <Root {...props} />
      <LoginModal />
    </AuthModalProvider>
  );
}
