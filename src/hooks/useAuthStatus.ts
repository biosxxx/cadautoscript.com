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
    let handledRedirect = false;

    const maybeExchangeCode = async () => {
      if (typeof window === 'undefined') return;

      // Handle implicit flow fragments (e.g., #access_token=... after logout/login)
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      if (accessToken && refreshToken) {
        try {
          handledRedirect = true;
          const {data, error} = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error && !shouldSilence(error.message)) {
            console.error('[Supabase Auth] Unable to set session from hash', error.message);
          }
          if (isMounted) {
            setUser(data?.session?.user ?? null);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unable to set session from hash.';
          if (!shouldSilence(message)) {
            console.error('[Supabase Auth] Hash handling failed', message);
          }
        } finally {
          window.location.hash = '';
        }
      }

      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const errorDescription = url.searchParams.get('error_description');

      if (errorDescription && !shouldSilence(errorDescription)) {
        console.error('[Supabase Auth] Redirect error', errorDescription);
      }

      if (!code) return;

      try {
        handledRedirect = true;
        const {data, error} = await supabase.auth.exchangeCodeForSession({code});
        if (error && !shouldSilence(error.message)) {
          console.error('[Supabase Auth] Unable to exchange code for session', error.message);
        }
        if (isMounted) {
          setUser(data?.session?.user ?? null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to complete auth redirect.';
        if (!shouldSilence(message)) {
          console.error('[Supabase Auth] Redirect handling failed', message);
        }
      } finally {
        // Clean URL to avoid re-processing the code param on navigation
        url.searchParams.delete('code');
        url.searchParams.delete('state');
        url.searchParams.delete('scope');
        url.searchParams.delete('auth_type');
        url.searchParams.delete('provider');
        url.searchParams.delete('error_description');
        const cleaned = url.toString();
        window.history.replaceState({}, '', cleaned);
      }
    };

    const resolveSession = async () => {
      try {
        if (!handledRedirect) {
          await maybeExchangeCode();
        }
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
