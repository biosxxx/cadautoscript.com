import React, {useEffect, useRef, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import Link from '@docusaurus/Link';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import styles from './NavbarAuth.module.css';

const shouldSilence = (message?: string | null) =>
  !message || message.toLowerCase().includes('auth session missing');

const reportError = (message?: string) => {
  if (!message || shouldSilence(message)) {
    return;
  }
  if (typeof console !== 'undefined') {
    console.error(`[Supabase Auth] ${message}`);
  }
};

export default function NavbarAuth(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const {openLoginModal, closeLoginModal} = useAuthModal();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        const {data, error} = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }

        if (error && !shouldSilence(error.message)) {
          reportError(error.message);
        }
        setUser(data?.session?.user ?? null);
      } catch (err) {
        if (!isMounted) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unable to fetch auth session.';
        reportError(message);
      }
    };

    resolveSession();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setMenuOpen(false);
      closeLoginModal();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [closeLoginModal]);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current || containerRef.current.contains(event.target as Node)) {
        return;
      }
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    const {error: signOutError} = await supabase.auth.signOut();
    if (signOutError && !shouldSilence(signOutError.message)) {
      reportError(signOutError.message);
    }
  };

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? undefined;
  const email = user?.email ?? (user?.user_metadata?.email as string | undefined);

  const renderSignedOut = () => (
    <button type="button" className={styles.signInButton} onClick={openLoginModal}>
      Sign In
    </button>
  );

  if (!isMounted) {
    return <div className={styles.container}>{renderSignedOut()}</div>;
  }

  return (
    <div className={styles.container} ref={containerRef}>
      {user ? (
        <>
          <button type="button" className={styles.avatarButton} onClick={() => setMenuOpen((value) => !value)}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className={styles.avatarImage} referrerPolicy="no-referrer" />
            ) : (
              <span className={styles.placeholderAvatar}>{initials}</span>
            )}
            {email ? <span>{email}</span> : null}
          </button>
          {menuOpen && (
            <div className={styles.dropdown}>
              {email ? <p className={styles.email}>{email}</p> : null}
              <Link
                to="/profile"
                className={styles.dropdownButton}
                onClick={() => setMenuOpen(false)}
              >
                My Profile
              </Link>
              <button type="button" className={styles.dropdownButton} onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}
        </>
      ) : (
        renderSignedOut()
      )}
    </div>
  );
}
