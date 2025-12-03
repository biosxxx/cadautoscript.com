import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AuthModalContextValue = {
  isOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined,
);

export const AuthModalProvider = ({children}: {children: ReactNode}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginModal = useCallback(() => setIsOpen(true), []);
  const closeLoginModal = useCallback(() => setIsOpen(false), []);

  const value = useMemo<AuthModalContextValue>(
    () => ({
      isOpen,
      openLoginModal,
      closeLoginModal,
    }),
    [isOpen],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};
