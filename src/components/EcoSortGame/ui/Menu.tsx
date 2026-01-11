import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import { useEcoSortStore } from '../store';
import { LANGUAGES, Language } from '../i18n/translations';

export default function Menu() {
  const isPlaying = useEcoSortStore((state) => state.isPlaying);
  const setPlaying = useEcoSortStore((state) => state.setPlaying);
  const requestPointerLock = useEcoSortStore((state) => state.requestPointerLock);
  const restartGame = useEcoSortStore((state) => state.restartGame);
  const pointerLockTarget = useEcoSortStore((state) => state.pointerLockTarget);
  const setPointerLockPending = useEcoSortStore((state) => state.setPointerLockPending);
  const language = useEcoSortStore((state) => state.language);
  const setLanguage = useEcoSortStore((state) => state.setLanguage);
  const t = useEcoSortStore((state) => state.t);
  const blockerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isPlaying) return;
    const doc = pointerLockTarget?.ownerDocument ?? document;
    if (doc.pointerLockElement) {
      doc.exitPointerLock();
    }
    setPointerLockPending(false);
    if (pointerLockTarget) {
      pointerLockTarget.style.cursor = 'auto';
    }
    if (typeof document !== 'undefined') {
      document.documentElement.style.cursor = 'auto';
      document.body.style.cursor = 'auto';
    }
    blockerRef.current?.focus();
  }, [isPlaying, pointerLockTarget, setPointerLockPending]);

  if (isPlaying) {
    return null;
  }

  const handleStart = () => {
    const status = requestPointerLock();
    if (status === 'unsupported' || status === 'locked') {
      setPlaying(true);
    }
  };

  return (
    <div
      className="eco-sort-lock"
      style={styles.blocker}
      onClick={handleStart}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleStart();
        }
      }}
      role="button"
      tabIndex={0}
      ref={blockerRef}
    >
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>{t('click_to_continue')}</div>

        <div style={styles.langSelector}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            style={styles.select}
            onClick={(e) => e.stopPropagation()} // Prevent click propagation
          >
            {LANGUAGES.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.text}>
          {t('controls_wasd')}
          <br />
          {t('controls_mouse')}
          <br />
          {t('controls_lmb_take')}
          <br />
          {t('controls_lmb_throw')}
          <br />
          {t('controls_floor_warning')}
          <br />{t('controls_cleanup')}
        </div>
        <div style={styles.actions}>
          <button
            style={styles.restartBtn}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(t('restart_confirm'))) {
                restartGame();
              }
            }}
          >
            {t('restart')}
          </button>
          <button
            style={styles.startBtn}
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
            type="button"
          >
            {t('start')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  blocker: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    zIndex: 5,
    cursor: 'pointer',
  },
  panel: {
    border: '2px solid #fff',
    padding: '20px 26px',
    background: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  text: {
    fontSize: '0.9rem',
    opacity: 0.9,
  },
  actions: {
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  restartBtn: {
    background: '#d32f2f',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  startBtn: {
    background: '#2e7d32',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  langSelector: {
    marginBottom: 15,
  },
  select: {
    padding: '5px 10px',
    fontSize: '1rem',
    borderRadius: 4,
    cursor: 'pointer',
    background: '#333',
    color: '#fff',
    border: '1px solid #555'
  }
};
