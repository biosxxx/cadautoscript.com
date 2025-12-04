import React, {useEffect, useMemo, useState} from 'react';
import {useHistory} from '@docusaurus/router';
import type {User} from '@supabase/supabase-js';
import Layout from '@theme/Layout';
import {supabase} from '@site/src/lib/supabaseClient';
import styles from './index.module.css';

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  created_at: string | null;
};

type CommentRow = {
  id: string;
  user_id: string;
  post_slug: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

type TabKey = 'users' | 'comments';

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const initialState: {profiles: ProfileRow[]; comments: CommentRow[]} = {
  profiles: [],
  comments: [],
};

export default function AdminPage(): JSX.Element {
  const history = useHistory();
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [data, setData] = useState(initialState);
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Access control: fetch session + profile, redirect if not admin.
  useEffect(() => {
    let isMounted = true;

    const checkAccess = async () => {
      try {
        const {data: sessionData} = await supabase.auth.getSession();
        if (!isMounted) return;
        const user = sessionData?.session?.user ?? null;
        setSessionUser(user);
        if (!user) {
          history.replace('/');
          return;
        }

        const {data: profileData, error: profileError} = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, role, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;
        if (profileError) {
          console.error('[Admin] Unable to fetch profile', profileError.message);
          setError('Unable to verify permissions.');
          history.replace('/');
          return;
        }

        setProfile(profileData ?? null);
        const isAdmin = profileData?.role === 'admin';
        if (!isAdmin) {
          history.replace('/');
          return;
        }
      } finally {
        if (isMounted) {
          setLoadingAuth(false);
        }
      }
    };

    void checkAccess();
    return () => {
      isMounted = false;
    };
  }, [history]);

  // Fetch users
  useEffect(() => {
    if (loadingAuth || profile?.role !== 'admin') {
      return;
    }
    const loadProfiles = async () => {
      setLoadingUsers(true);
      setError(null);
      const {data: profiles, error: profilesError} = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, role, created_at')
        .order('created_at', {ascending: false});

      if (profilesError) {
        console.error('[Admin] Unable to fetch profiles', profilesError.message);
        setError('Unable to load users.');
        setLoadingUsers(false);
        return;
      }

      setData((prev) => ({...prev, profiles: profiles ?? []}));
      setLoadingUsers(false);
    };

    void loadProfiles();
  }, [loadingAuth, profile?.role]);

  // Fetch comments
  useEffect(() => {
    if (loadingAuth || profile?.role !== 'admin') {
      return;
    }
    const loadComments = async () => {
      setLoadingComments(true);
      setError(null);
      const {data: comments, error: commentsError} = await supabase
        .from('comments')
        .select('id, user_id, post_slug, content, created_at, profiles:profiles(full_name, username, avatar_url)')
        .order('created_at', {ascending: false})
        .limit(50);

      if (commentsError) {
        console.error('[Admin] Unable to fetch comments', commentsError.message);
        setError('Unable to load comments.');
        setLoadingComments(false);
        return;
      }

      setData((prev) => ({...prev, comments: comments ?? []}));
      setLoadingComments(false);
    };

    void loadComments();
  }, [loadingAuth, profile?.role]);

  const handleDeleteComment = async (commentId: string) => {
    if (!commentId) return;
    setDeletingId(commentId);
    const {error: deleteError} = await supabase.from('comments').delete().eq('id', commentId);
    if (deleteError) {
      console.error('[Admin] Unable to delete comment', deleteError.message);
      setError('Unable to delete comment. Check RLS or permissions.');
      setDeletingId(null);
      return;
    }
    setData((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c.id !== commentId),
    }));
    setDeletingId(null);
  };

  const displayName = useMemo(
    () => profile?.full_name || profile?.username || sessionUser?.email || 'Admin',
    [profile?.full_name, profile?.username, sessionUser?.email],
  );

  if (loadingAuth) {
    return (
      <Layout title="Admin">
        <main className={styles.main}>
          <p className={styles.muted}>Checking access...</p>
        </main>
      </Layout>
    );
  }

  // In case redirect failed for any reason.
  if (profile?.role !== 'admin') {
    return null;
  }

  return (
    <Layout title="Admin" description="Moderate users and comments.">
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <p className={styles.subtle}>Signed in as {displayName} (admin)</p>
            <h1 className={styles.title}>Admin Dashboard</h1>
          </div>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === 'comments' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
          </div>
        </div>

        {error ? <div className={styles.alert}>{error}</div> : null}

        {activeTab === 'users' ? (
          <section className={styles.panel}>
            <div className={styles.toolbar}>
              {loadingUsers ? 'Refreshing users...' : `${data.profiles.length} users`}
            </div>
            {data.profiles.length === 0 ? (
              <p className={styles.muted}>No users found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.profiles.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className={styles.avatar}>
                          {row.avatar_url ? (
                            <img src={row.avatar_url} alt="Avatar" referrerPolicy="no-referrer" />
                          ) : (
                            <span>{(row.full_name || row.username || 'U').charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </td>
                      <td>{row.full_name || '—'}</td>
                      <td>{row.username || '—'}</td>
                      <td>{row.role || 'user'}</td>
                      <td>{formatDate(row.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ) : null}

        {activeTab === 'comments' ? (
          <section className={styles.panel}>
            <div className={styles.toolbar}>
              {loadingComments ? 'Refreshing comments...' : `Showing ${data.comments.length} comments`}
            </div>
            {data.comments.length === 0 ? (
              <p className={styles.muted}>No comments found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Author</th>
                    <th>Content</th>
                    <th>Location</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.comments.map((row) => {
                    const author = row.profiles?.full_name || row.profiles?.username || 'Unknown';
                    const snippet = row.content.length > 120 ? `${row.content.slice(0, 117)}...` : row.content;
                    return (
                      <tr key={row.id}>
                        <td>
                          <div className={styles.avatar}>
                            {row.profiles?.avatar_url ? (
                              <img src={row.profiles.avatar_url} alt="Avatar" referrerPolicy="no-referrer" />
                            ) : (
                              <span>{(author || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </td>
                        <td>{snippet}</td>
                        <td>{row.post_slug}</td>
                        <td>{formatDate(row.created_at)}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteComment(row.id)}
                              disabled={deletingId === row.id}
                              title="Delete comment"
                            >
                              {deletingId === row.id ? 'Deleting...' : '🗑 Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        ) : null}
      </main>
    </Layout>
  );
}
