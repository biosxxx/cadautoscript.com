import React, {Suspense, lazy} from 'react';
import Root from '@theme-original/Root';
import type {Props} from '@theme/Root';
import LoginModal from '@site/src/components/Auth/LoginModal';
import {AuthModalProvider} from '@site/src/contexts/AuthModalContext';

// Lazy load SpeedInsights component (client-side only)
const SpeedInsights = lazy(() =>
  import('@vercel/speed-insights/react').then((module) => ({
    default: module.SpeedInsights,
  }))
);

export default function RootWrapper(props: Props) {
  return (
    <AuthModalProvider>
      <Root {...props} />
      <LoginModal />
      <Suspense fallback={null}>
        <SpeedInsights />
      </Suspense>
    </AuthModalProvider>
  );
}
