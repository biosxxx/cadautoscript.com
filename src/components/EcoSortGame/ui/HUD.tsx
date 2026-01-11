import type { CSSProperties } from 'react';
import { TRASH_TYPE_MAP } from '../constants';
import { useEcoSortStore } from '../store';
import { TranslationKey } from '../i18n/translations';

const WEATHER_KEYS: Record<string, TranslationKey> = {
  CLEAR: 'weather_clear',
  RAIN: 'weather_rain',
  SNOW: 'weather_snow',
};

export default function HUD() {
  const score = useEcoSortStore((state) => state.score);
  const weather = useEcoSortStore((state) => state.weather);
  const currentTrashType = useEcoSortStore((state) => state.currentTrashType);
  const t = useEcoSortStore((state) => state.t);

  // Trash Labels need translation
  const currentLabel = currentTrashType ? t(`trash_${currentTrashType}` as TranslationKey) : null;
  const currentColor = currentTrashType ? toHexColor(TRASH_TYPE_MAP[currentTrashType]?.color) : '#ffffff';

  const feedback = useEcoSortStore((state) => state.feedback);
  const cleanupReady = useEcoSortStore((state) => state.cleanupReady);
  const crosshairActive = useEcoSortStore((state) => state.crosshairActive);
  const interactionHint = useEcoSortStore((state) => state.interactionHint);

  return (
    <div style={styles.layer}>
      <div style={styles.header}>
        <div style={styles.scoreBox}>
          {t('score')}: <span>{score}</span>
          <span style={styles.weather}>| {t(WEATHER_KEYS[weather] ?? 'weather_clear')}</span>
        </div>
        <div style={{ ...styles.currentItem, color: currentLabel ? currentColor : '#ffffff' }}>
          {currentLabel ? `${t('in_hand')}: ${currentLabel}` : t('status_waiting')}
        </div>
      </div>
      {feedback ? (
        <div style={{ ...styles.feedback, color: feedback.color }} role="status">
          {feedback.text}
        </div>
      ) : null}
      {cleanupReady ? (
        <div style={styles.cleanup} role="status">
          {t('cleanup_prompt')}
          <div style={styles.cleanupCost}>{t('cleanup_cost')}</div>
        </div>
      ) : null}
      {interactionHint ? <div style={styles.hint}>{interactionHint}</div> : null}
      <div style={styles.controlsHint}>{t('intro_hint')}</div>
      <div
        style={{
          ...styles.crosshair,
          ...(crosshairActive ? styles.crosshairActive : null),
        }}
        aria-hidden="true"
      >
        <span style={styles.crosshairDot} />
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  layer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  header: {
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBox: {
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  weather: {
    marginLeft: 12,
    color: '#ddd',
    textTransform: 'uppercase',
    fontSize: '0.85rem',
  },
  currentItem: {
    fontSize: '0.95rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  feedback: {
    position: 'absolute',
    left: '50%',
    top: '30%', // Moved up
    transform: 'translate(-50%, -50%)',
    fontSize: '2.4rem',
    fontWeight: 700,
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
  crosshair: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 18,
    height: 18,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'transform 0.1s, border-color 0.2s, background-color 0.2s',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crosshairDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#ffffff',
    boxShadow: '0 0 4px rgba(0,0,0,0.5)',
  },
  crosshairActive: {
    borderColor: '#4CAF50',
    transform: 'translate(-50%, -50%) scale(1.2)',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  cleanup: {
    position: 'absolute',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#00E676',
    textShadow: '0 0 10px #000',
    textAlign: 'center',
  },
  cleanupCost: {
    fontSize: '1rem',
    color: '#fff',
  },
  hint: {
    position: 'absolute',
    top: '20%', // Moved up
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#ffffff',
    background: 'rgba(0,0,0,0.5)',
    padding: '5px 10px',
    borderRadius: 5,
  },
  controlsHint: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.9rem',
    color: '#ffffff',
    opacity: 0.8,
    textShadow: '1px 1px 2px #000',
  },
};

function toHexColor(value: number | undefined) {
  if (typeof value !== 'number') return '#ffffff';
  return `#${value.toString(16).padStart(6, '0')}`;
}
