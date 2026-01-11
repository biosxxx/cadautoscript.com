import type { SeasonConfig, SeasonId } from './types';

// Track dimensions
export const SLEEPER_HEIGHT = 0.1;
export const RAIL_HEIGHT = 0.15;
export const TRACK_Y_OFFSET = 0.02;
export const RAIL_TOP_Y = SLEEPER_HEIGHT + RAIL_HEIGHT + TRACK_Y_OFFSET;

// World dimensions
export const WORLD_LENGTH = 400;
export const GROUND_LEVEL = -1.5;

// Gameplay
export const INITIAL_STONES = 20;
export const BOTTLE_COUNT_MIN = 5;
export const BOTTLE_COUNT_MAX = 8;
export const STONE_THROW_SPEED = 35;
export const BREAK_THRESHOLD = 12.0;

// Seasons configuration
export const SEASONS: Record<SeasonId, SeasonConfig> = {
    SUMMER: {
        name: 'Summer',
        sky: 0x87ceeb,
        fogNear: 20,
        fogFar: 120,
        ground: 0x3a5f0b,
        leaves: [0x2e7d32, 0x43a047],
        wood: 0x5d4037,
        gravel: 0x555555,
        lightInt: 1.5,
        hdr: 'kloofendal_48d_partly_cloudy_puresky_1k.hdr',
    },
    AUTUMN: {
        name: 'Autumn',
        sky: 0xffdab9,
        fogNear: 15,
        fogFar: 90,
        ground: 0x8b4513,
        leaves: [0xff4500, 0xffa500, 0xd2691e, 0x8b0000],
        wood: 0x4d3328,
        gravel: 0x4a4a4a,
        lightInt: 1.2,
        hdr: 'autumn_field_puresky_1k.hdr',
    },
    WINTER: {
        name: 'Winter',
        sky: 0xd3d3d3,
        fogNear: 10,
        fogFar: 80,
        ground: 0xffffff,
        leaves: [0xffffff, 0xeeeeee],
        wood: 0x2f4f4f,
        gravel: 0xdddddd,
        lightInt: 1.0,
        hdr: 'snowy_park_01_1k.hdr',
    },
    SPRING: {
        name: 'Spring',
        sky: 0xb0e0e6,
        fogNear: 20,
        fogFar: 110,
        ground: 0x66cdaa,
        leaves: [0xff69b4, 0xffb6c1, 0x32cd32],
        wood: 0x6d4c41,
        gravel: 0x666666,
        lightInt: 1.3,
        hdr: 'memorial_1k.hdr',
    },
};

export const SEASON_KEYS: SeasonId[] = ['SUMMER', 'AUTUMN', 'WINTER', 'SPRING'];
