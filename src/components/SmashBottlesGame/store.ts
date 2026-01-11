import { create } from 'zustand';
import type { RiverConfig, SeasonId, ShardData, StoneData } from './types';
import { INITIAL_STONES, SEASONS, SEASON_KEYS } from './constants';

interface SmashBottlesState {
    // Game state
    score: number;
    stonesLeft: number;
    bottleCount: number;
    season: SeasonId;
    resetToken: number;

    // River configuration (null if no river)
    river: RiverConfig | null;

    // Road Z position
    roadZ: number;

    // Thrown stones queue
    pendingStones: StoneData[];

    // Shards to spawn
    pendingShards: ShardData[];

    // Actions
    incrementScore: () => void;
    decrementStones: () => void;
    setBottleCount: (count: number) => void;
    setSeason: (season: SeasonId) => void;
    setRiver: (river: RiverConfig | null) => void;
    setRoadZ: (z: number) => void;
    queueStone: (stone: StoneData) => void;
    dequeueStone: () => StoneData | undefined;
    queueShards: (shards: ShardData[]) => void;
    dequeueShards: () => ShardData[];
    restartGame: () => void;
}

export const useSmashBottlesStore = create<SmashBottlesState>((set, get) => ({
    score: 0,
    stonesLeft: INITIAL_STONES,
    bottleCount: 0,
    season: 'SUMMER',
    resetToken: 0,
    river: null,
    roadZ: -40,
    pendingStones: [],
    pendingShards: [],

    incrementScore: () => set((state) => ({ score: state.score + 1 })),

    decrementStones: () =>
        set((state) => ({ stonesLeft: Math.max(0, state.stonesLeft - 1) })),

    setBottleCount: (count) => set({ bottleCount: count }),

    setSeason: (season) => set({ season }),

    setRiver: (river) => set({ river }),

    setRoadZ: (z) => set({ roadZ: z }),

    queueStone: (stone) =>
        set((state) => ({ pendingStones: [...state.pendingStones, stone] })),

    dequeueStone: () => {
        const stones = get().pendingStones;
        if (stones.length === 0) return undefined;
        const [first, ...rest] = stones;
        set({ pendingStones: rest });
        return first;
    },

    queueShards: (shards) =>
        set((state) => ({ pendingShards: [...state.pendingShards, ...shards] })),

    dequeueShards: () => {
        const shards = get().pendingShards;
        set({ pendingShards: [] });
        return shards;
    },

    restartGame: () => {
        const randomSeason = SEASON_KEYS[Math.floor(Math.random() * SEASON_KEYS.length)];
        set((state) => ({
            score: 0,
            stonesLeft: INITIAL_STONES,
            bottleCount: 0,
            season: randomSeason,
            resetToken: state.resetToken + 1,
            river: null,
            pendingStones: [],
            pendingShards: [],
        }));
    },
}));

// Helper to get current season config
export const useSeasonConfig = () => {
    const season = useSmashBottlesStore((state) => state.season);
    return SEASONS[season];
};
