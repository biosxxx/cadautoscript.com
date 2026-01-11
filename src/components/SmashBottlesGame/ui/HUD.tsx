import type { CSSProperties } from 'react';
import { useSmashBottlesStore, useSeasonConfig } from '../store';

export default function HUD() {
    const score = useSmashBottlesStore((state) => state.score);
    const stonesLeft = useSmashBottlesStore((state) => state.stonesLeft);
    const bottleCount = useSmashBottlesStore((state) => state.bottleCount);
    const restartGame = useSmashBottlesStore((state) => state.restartGame);
    const seasonConfig = useSeasonConfig();

    return (
        <div style={styles.info}>
            <div style={styles.logo}>🔨 SMASH</div>

            <div style={styles.centerPanel}>
                <div style={styles.stats}>
                    HIT: <span style={styles.statVal}>{score}</span>
                    <span style={styles.divider}>|</span>
                    LEFT: <span style={styles.statVal}>{bottleCount}</span>
                    <span style={styles.divider}>|</span>
                    AMMO: <span style={styles.stonesVal}>{stonesLeft}</span>
                </div>
                <div style={styles.seasonInfo}>SEASON: {seasonConfig.name.toUpperCase()}</div>
            </div>

            <button style={styles.resetBtn} onClick={(e) => { e.stopPropagation(); restartGame(); }}>
                GENERATE
            </button>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    info: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 60,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 20px',
        boxSizing: 'border-box',
        zIndex: 100,
        userSelect: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    logo: {
        fontSize: '1.2rem',
        fontWeight: 800,
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 1,
        display: 'flex',
        alignItems: 'center',
        textShadow: '0 0 10px rgba(255,255,255,0.3)',
    },
    centerPanel: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stats: {
        fontSize: '1.0rem',
        color: '#eee',
        fontWeight: 600,
        fontFamily: 'monospace',
    },
    statVal: {
        color: '#4CAF50',
        margin: '0 2px',
    },
    stonesVal: {
        color: '#FFC107',
        margin: '0 2px',
    },
    divider: {
        color: '#555',
        margin: '0 8px',
    },
    seasonInfo: {
        fontSize: '0.7rem',
        color: '#aaa',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    resetBtn: {
        padding: '8px 20px',
        fontSize: '0.8rem',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #2196F3, #1976D2)',
        color: 'white',
        border: 'none',
        borderRadius: 20,
        fontWeight: 'bold',
        transition: 'transform 0.1s, box-shadow 0.2s',
        textTransform: 'uppercase',
        boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)',
    },
};
