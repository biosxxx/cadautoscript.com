import React, {useCallback, useEffect, useMemo, useState} from 'react';
import clsx from 'clsx';
import {useHistory} from '@docusaurus/router';
import type {User} from '@supabase/supabase-js';
import Layout from '@theme/Layout';
import {supabase} from '@site/src/lib/supabaseClient';
import styles from './index.module.css';

type RoleValue = 'user' | 'author' | 'admin';

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: RoleValue | null;
  created_at: string | null;
  email: string | null;
  last_seen_at?: string | null;
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
    : '-';

const initialState: {profiles: ProfileRow[]; comments: CommentRow[]} = {
  profiles: [],
  comments: [],
};

type ActionState =
  | {kind: 'idle'}
  | {kind: 'deleting'; targetId: string | null}
  | {kind: 'inviting'};

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
  const [actionState, setActionState] = useState<ActionState>({kind: 'idle'});
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoadingUsers(true);
    setError(null);

    const {data: rpcProfiles, error: profilesError} = await supabase
      .rpc('get_admin_users_list')
      .order('created_at', {ascending: false});

    let merged = rpcProfiles ?? [];

    // Fallback: fetch profiles directly to catch records that may not join with auth.users
    const {data: rawProfiles, error: profilesFallbackError} = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, role, created_at, last_seen_at, email')
      .order('created_at', {ascending: false});

    if (profilesFallbackError) {
      console.error('[Admin] Unable to load profiles fallback', profilesFallbackError.message);
    } else if (rawProfiles) {
      const existingIds = new Set(merged.map((p: ProfileRow) => p.id));
      const missing = rawProfiles.filter((p) => !existingIds.has(p.id));
      merged = [...merged, ...missing];
    }

    if (profilesError && !merged.length) {
      console.error('[Admin] Unable to fetch profiles', profilesError.message);
      setError('Unable to load users.');
    }

    setData((prev) => ({...prev, profiles: merged as ProfileRow[]}));
    setLoadingUsers(false);
  }, []);

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
    void loadProfiles();
  }, [loadProfiles, loadingAuth, profile?.role]);

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
    setActionState({kind: 'deleting', targetId: commentId});
    const {error: deleteError} = await supabase.from('comments').delete().eq('id', commentId);
    if (deleteError) {
      console.error('[Admin] Unable to delete comment', deleteError.message);
      setError('Unable to delete comment. Check RLS or permissions.');
      setActionState({kind: 'idle'});
      return;
    }
    setData((prev) => ({
      ...prev,
      comments: prev.comments.filter((c) => c.id !== commentId),
    }));
    setActionState({kind: 'idle'});
  };

  const displayName = useMemo(
    () => profile?.full_name || profile?.username || sessionUser?.email || 'Admin',
    [profile?.full_name, profile?.username, sessionUser?.email],
  );

  const formatRelative = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Online';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleString();
  };

  const handleRoleChange = async (userId: string, newRole: RoleValue) => {
    setRoleUpdating(userId);
    setToast(null);
    const {error: roleError} = await supabase.from('profiles').update({role: newRole}).eq('id', userId);
    if (roleError) {
      console.error('[Admin] Unable to update role', roleError.message);
      setError('Unable to update role.');
      setRoleUpdating(null);
      return;
    }
    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === userId ? {...p, role: newRole} : p)),
    }));
    setRoleUpdating(null);
    setToast('Role updated');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!userId) return;
    if (!window.confirm('Удалить пользователя? Это действие необратимо.')) return;
    setError(null);
    setToast(null);
    setActionState({kind: 'deleting', targetId: userId});
    const {error: fnError} = await supabase.functions.invoke('admin-actions', {
      body: {action: 'delete', targetUserId: userId},
    });
    if (fnError) {
      console.error('[Admin] Unable to delete user', fnError.message);
      setError('Не удалось удалить пользователя. Проверьте edge function или права.');
      setActionState({kind: 'idle'});
      return;
    }
    setData((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((p) => p.id !== userId),
    }));
    setToast('User deleted');
    setActionState({kind: 'idle'});
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      setError('Введите email для приглашения.');
      return;
    }
    setError(null);
    setToast(null);
    setActionState({kind: 'inviting'});
    const {data: result, error: fnError} = await supabase.functions.invoke('admin-actions', {
      body: {action: 'invite', email: inviteEmail},
    });
    if (fnError) {
      console.error('[Admin] Unable to invite user', fnError.message);
      setError('Не удалось отправить приглашение. Проверьте edge function или права.');
      setActionState({kind: 'idle'});
      return;
    }
    setToast(result?.message || 'Invitation sent');
    setInviteEmail('');
    setInviteOpen(false);
    setActionState({kind: 'idle'});
    void loadProfiles();
  };

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
        {toast ? <div className={clsx(styles.alert, styles.alertSuccess)}>{toast}</div> : null}

        {activeTab === 'users' ? (
          <section className={styles.panel}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                {loadingUsers ? 'Refreshing users...' : `${data.profiles.length} users`}
              </div>
              <div className={styles.toolbarRight}>
                <button type="button" className={styles.primaryBtn} onClick={() => setInviteOpen(true)}>
                  + Invite user
                </button>
              </div>
            </div>
            {data.profiles.length === 0 ? (
              <p className={styles.muted}>No users found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Last Seen</th>
                    <th>Created</th>
                    <th>Actions</th>
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
                      <td>{row.full_name || '-'}</td>
                      <td>{row.email || '-'}</td>
                      <td>{row.username || '-'}</td>
                      <td>
                        <select
                          value={row.role || 'user'}
                          onChange={(event) => handleRoleChange(row.id, event.target.value)}
                          disabled={roleUpdating === row.id}
                          className={styles.roleSelect}
                        >
                          <option value="user">user</option>
                          <option value="author">author</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>{formatRelative(row.last_seen_at)}</td>
                      <td>{formatDate(row.created_at)}</td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteUser(row.id)}
                            disabled={actionState.kind === 'deleting' && actionState.targetId === row.id}
                          >
                            {actionState.kind === 'deleting' && actionState.targetId === row.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </td>
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
                        <td>
                          <span dangerouslySetInnerHTML={{__html: row.content}} />
                        </td>
                        <td>{row.post_slug}</td>
                        <td>{formatDate(row.created_at)}</td>
                        <td>
                          <div className={styles.actions}>
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteComment(row.id)}
                              disabled={actionState.kind === 'deleting' && actionState.targetId === row.id}
                              title="Delete comment"
                            >
                              {actionState.kind === 'deleting' && actionState.targetId === row.id
                                ? 'Deleting...'
                                : '🗑 Delete'}
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

        {inviteOpen ? (
          <div className={styles.modalBackdrop}>
            <div className={styles.modal}>
              <h3>Invite user</h3>
              <p className={styles.muted}>Отправим приглашение через Supabase Auth.</p>
              <label className={styles.modalLabel}>
                Email
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className={styles.input}
                  placeholder="user@example.com"
                />
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setInviteOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleInviteUser}
                  disabled={actionState.kind === 'inviting'}
                >
                  {actionState.kind === 'inviting' ? 'Sending...' : 'Send invite'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </Layout>
  );
}
