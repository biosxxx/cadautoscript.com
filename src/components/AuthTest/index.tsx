import React, {useEffect, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@site/src/lib/supabaseClient';

const AuthTest = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({data, error: getUserError}) => {
        if (!isMounted) {
          return;
        }

        if (getUserError) {
          setError(getUserError.message);
        }

        setUser(data.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      const redirectTo =
        typeof window !== 'undefined' ? window.location.origin : undefined;
      const {error: signInError} = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login.');
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      const {error: signOutError} = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to logout.');
    }
  };

  if (loading) {
    return <p>Checking auth status…</p>;
  }

  return (
    <div>
      {user ? (
        <div>
          <p>Signed in as {user.email}</p>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <button type="button" onClick={handleLogin}>
          Login with Google
        </button>
      )}
      {error ? <p style={{color: 'red'}}>{error}</p> : null}
    </div>
  );
};

export default AuthTest;
