import React, { useMemo } from 'react';
import { useEcoSortStore } from '../store';

export default function TouchControls() {
  const isPlaying = useEcoSortStore((state) => state.isPlaying);
  const setPlaying = useEcoSortStore((state) => state.setPlaying);
  const setMobileMove = useEcoSortStore((state) => state.setMobileMove);
  const requestThrow = useEcoSortStore((state) => state.requestThrow);
  const requestCleanup = useEcoSortStore((state) => state.requestCleanup);

  const isTouch = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    return coarse;
  }, []);

  if (!isTouch) return null;

  const pressDir = (dir: 'forward' | 'backward' | 'left' | 'right') => (event: React.PointerEvent) => {
    event.preventDefault();
    if (!isPlaying) setPlaying(true);
    setMobileMove(dir, true);
  };

  const releaseDir = (dir: 'forward' | 'backward' | 'left' | 'right') => (event: React.PointerEvent) => {
    event.preventDefault();
    setMobileMove(dir, false);
  };

  const handleThrow = (event: React.PointerEvent) => {
    event.preventDefault();
    if (!isPlaying) setPlaying(true);
    requestThrow();
  };

  const handleCleanup = (event: React.PointerEvent) => {
    event.preventDefault();
    requestCleanup();
  };

  return (
    <div style={styles.layer} aria-hidden="false">
      <div style={styles.pad}>
        <div style={styles.row}>
          <PadButton label="" disabled />
          <PadButton label="UP" onPointerDown={pressDir('forward')} onPointerUp={releaseDir('forward')} />
          <PadButton label="" disabled />
        </div>
        <div style={styles.row}>
          <PadButton label="LT" onPointerDown={pressDir('left')} onPointerUp={releaseDir('left')} />
          <PadButton label="" disabled />
          <PadButton label="RT" onPointerDown={pressDir('right')} onPointerUp={releaseDir('right')} />
        </div>
        <div style={styles.row}>
          <PadButton label="" disabled />
          <PadButton label="DN" onPointerDown={pressDir('backward')} onPointerUp={releaseDir('backward')} />
          <PadButton label="" disabled />
        </div>
      </div>
      <div style={styles.actions}>
        <PadButton label="TAKE / THROW" onPointerDown={handleThrow} onPointerUp={(e) => e.preventDefault()} wide />
        <PadButton label="CLEAN (F)" onPointerDown={handleCleanup} onPointerUp={(e) => e.preventDefault()} />
      </div>
    </div>
  );
}

function PadButton({
  label,
  disabled,
  wide,
  onPointerDown,
  onPointerUp,
}: {
  label: string;
  disabled?: boolean;
  wide?: boolean;
  onPointerDown?: (event: React.PointerEvent) => void;
  onPointerUp?: (event: React.PointerEvent) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      style={{
        ...styles.button,
        ...(wide ? styles.buttonWide : null),
        opacity: disabled ? 0.35 : 0.9,
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerOut={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '14px',
    gap: '12px',
  },
  pad: {
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: 'rgba(0,0,0,0.35)',
    padding: 8,
    borderRadius: 12,
  },
  row: {
    display: 'flex',
    gap: 6,
  },
  actions: {
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
    background: 'rgba(0,0,0,0.35)',
    padding: 10,
    borderRadius: 12,
  },
  button: {
    minWidth: 56,
    minHeight: 56,
    background: 'rgba(255,255,255,0.14)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: 0.5,
    touchAction: 'none',
    backdropFilter: 'blur(4px)',
  },
  buttonWide: {
    minWidth: 140,
  },
};
