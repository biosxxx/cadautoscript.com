import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Link from '@docusaurus/Link';
import type {User} from '@supabase/supabase-js';
import {supabase} from '@site/src/lib/supabaseClient';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import RichCommentInput, {type RichCommentInputHandle} from './RichCommentInput';
import EmojiPickerBtn from './EmojiPickerBtn';
import styles from './Comments.module.css';

type Props = {
  slug: string;
};

type Profile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

type CommentRow = {
  id: string;
  user_id: string;
  post_slug: string;
  content: string;
  created_at: string;
  profiles: Profile | null;
};

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function Comments({slug}: Props): JSX.Element {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editorHtml, setEditorHtml] = useState('');
  const editorRef = useRef<RichCommentInputHandle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {openLoginModal} = useAuthModal();

  const hasProfileName = !!(profile?.full_name && profile.full_name.trim().length > 0);

  const authorDisplay = (value: Profile | null) =>
    value?.full_name?.trim() ||
    value?.username?.trim() ||
    'Anonymous';

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {data, error: fetchError} = await supabase
      .from('comments')
      .select(
        'id, user_id, post_slug, content, created_at, profiles:profiles (full_name, username, avatar_url)',
      )
      .eq('post_slug', slug)
      .order('created_at', {ascending: true});

    if (fetchError) {
      console.error('[Supabase] Failed to fetch comments', fetchError.message);
      setError('Unable to load comments. Please try again later.');
      setLoading(false);
      return;
    }

    setComments(data ?? []);
    setLoading(false);
  }, [slug]);

  const fetchSession = useCallback(async () => {
    const {data, error: sessionError} = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[Supabase] Unable to fetch auth session', sessionError.message);
    }
    setUser(data?.session?.user ?? null);
  }, []);

  useEffect(() => {
    void fetchSession();
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [fetchSession]);

  useEffect(() => {
    void fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const resolveProfile = async () => {
      const {data, error: profileError} = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[Supabase] Unable to fetch profile', profileError.message);
        return;
      }
      setProfile(data ?? null);
    };
    void resolveProfile();
  }, [user]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      openLoginModal();
      return;
    }

    const html = editorRef.current?.getHtml() ?? editorHtml ?? '';
    const text = (editorRef.current?.getHtml() ?? editorHtml ?? '').replace(/<[^>]+>/g, '');
    const hasImage = /<img/i.test(html);
    if (!hasImage && (!text || text.trim().length === 0)) {
      setError('Please enter a comment before sending.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const {error: insertError} = await supabase.from('comments').insert({
      user_id: user.id,
      post_slug: slug,
      content: html,
    });

    if (insertError) {
      console.error('[Supabase] Unable to post comment', insertError.message);
      setError('Unable to post your comment. Please try again.');
      setSubmitting(false);
      return;
    }

    editorRef.current?.clear();
    setEditorHtml('');
    setSubmitting(false);
    void fetchComments();
  };
  const handleEmojiSelect = (emojiCode: string) => {
    if (!editorRef.current) {
      return;
    }
    if (/^<img/i.test(emojiCode)) {
      const srcMatch = emojiCode.match(/src="([^"]+)"/i);
      const altMatch = emojiCode.match(/alt="([^"]*)"/i);
      const src = srcMatch?.[1];
      const alt = altMatch?.[1];
      if (src) {
        editorRef.current.insertCustomEmoji(src, alt);
      }
    } else {
      editorRef.current.insertText(emojiCode);
    }
  };

  const avatarFallback = (value: Profile | null) =>
    (value?.full_name || value?.username || 'U').charAt(0).toUpperCase();

  const notice = useMemo(() => {
    if (!user) {
      return null;
    }
    if (!hasProfileName) {
      return 'Please complete your profile to comment.';
    }
    return null;
  }, [hasProfileName, user]);

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Discussion</p>
          <h2 className={styles.title}>Comments</h2>
        </div>
        <span className={styles.badge}>{comments.length}</span>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      {loading ? (
        <p className={styles.muted}>Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className={styles.muted}>Be the first to share your thoughts.</p>
      ) : (
        <ul className={styles.list}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.comment}>
              <div className={styles.avatar}>
                {comment.profiles?.avatar_url ? (
                  <img
                    src={comment.profiles.avatar_url}
                    alt={`${authorDisplay(comment.profiles)} avatar`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{avatarFallback(comment.profiles)}</span>
                )}
              </div>
              <div className={styles.body}>
                <div className={styles.meta}>
                  <span className={styles.author}>{authorDisplay(comment.profiles)}</span>
                  <span className={styles.dot}>•</span>
                  <time dateTime={comment.created_at}>{formatTimestamp(comment.created_at)}</time>
                </div>
                <p
                  className={styles.content}
                  dangerouslySetInnerHTML={{__html: comment.content}}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.composer}>
        {user ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputStack}>
              <RichCommentInput
                ref={editorRef}
                placeholder="Share your feedback or ask a question..."
                disabled={submitting}
                onChange={(html) => setEditorHtml(html)}
              />
              <div className={styles.formFooter}>
                <EmojiPickerBtn onEmojiSelect={handleEmojiSelect} />
                <div className={styles.actions}>
                  <button
                    type="submit"
                    className="button button--primary"
                    disabled={submitting || !hasProfileName}
                  >
                    {submitting ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
            {notice ? (
              <p className={styles.notice}>
                {notice}{' '}
                <Link to="/profile" className={styles.link}>
                  Complete profile
                </Link>
              </p>
            ) : null}
          </form>
        ) : (
          <button type="button" className="button button--secondary" onClick={openLoginModal}>
            Log in to comment
          </button>
        )}
      </div>
    </section>
  );
}
