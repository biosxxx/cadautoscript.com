import {useEffect, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@site/src/lib/supabaseClient';

const shouldSilence = (message?: string | null) =>
  !message || message.toLowerCase().includes('auth session missing');

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  authChecked: boolean;
};

export function useAuthStatus(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const resolveSession = async () => {
      try {
        const {data, error} = await supabase.auth.getSession();
        if (!isMounted) return;
        if (error && !shouldSilence(error.message)) {
          console.error('[Supabase Auth] Unable to fetch auth session', error.message);
        }
        setUser(data?.session?.user ?? null);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Unable to fetch auth session.';
        if (!shouldSilence(message)) {
          console.error('[Supabase Auth] Unable to fetch auth session', message);
        }
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    };

    void resolveSession();

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    authChecked,
  };
}
