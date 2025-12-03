import React, {useEffect, useRef, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import styles from './NavbarAuth.module.css';

const reportError = (message: string) => {
  if (typeof console !== 'undefined') {
    console.error(`[Supabase Auth] ${message}`);
  }
};

export default function NavbarAuth(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const {openLoginModal, closeLoginModal} = useAuthModal();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase.auth
      .getUser()
      .then(({data, error: getUserError}) => {
        if (!isMounted) {
          return;
        }
        if (getUserError) {
          reportError(getUserError.message);
        }
        setUser(data?.user ?? null);
      })
      .catch((err) => {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Unable to fetch user.';
          reportError(message);
        }
      });

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
  }, []);

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
    if (signOutError) {
      reportError(signOutError.message);
    }
  };

  const initials = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) ?? undefined;
  const email = user?.email ?? (user?.user_metadata?.email as string | undefined);

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
              <button type="button" className={styles.dropdownButton} onClick={handleSignOut}>
                Sign Out
              </button>
            </div>
          )}
        </>
      ) : (
        <button type="button" className={styles.signInButton} onClick={openLoginModal}>
          Sign In
        </button>
      )}
    </div>
  );
}
