import { create } from 'zustand';
import type { FeedbackMessage, TrashTypeId, WeatherType } from './types';
import { Language, TRANSLATIONS, TranslationKey } from './i18n/translations';

let pointerLockPendingTimeout: ReturnType<typeof setTimeout> | null = null;

type EcoSortState = {
  score: number;
  weather: WeatherType;
  isPlaying: boolean;
  pointerLockTarget: HTMLElement | null;
  pointerLockPending: boolean;
  currentTrashType: TrashTypeId | null;
  moveSpeedMultiplier: number;
  floorCount: number;
  cleanupReady: boolean;
  crosshairActive: boolean;
  interactionHint: string | null;
  feedback: FeedbackMessage | null;
  throwToken: number;
  cleanupToken: number;
  resetToken: number;
  language: Language;
  restartGame: () => void;
  mobileMove: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
  };
  setScore: (next: number) => void;
  setWeather: (next: WeatherType) => void;
  setPlaying: (next: boolean) => void;
  setPointerLockTarget: (target: HTMLElement | null) => void;
  setPointerLockPending: (next: boolean) => void;
  requestPointerLock: () => 'requested' | 'unsupported' | 'pending' | 'locked';
  setCurrentTrashType: (next: TrashTypeId | null) => void;
  incrementScore: (delta: number) => void;
  setFeedback: (next: FeedbackMessage | null) => void;
  requestThrow: () => void;
  requestCleanup: () => void;
  setMoveSpeedMultiplier: (next: number) => void;
  setFloorCount: (next: number) => void;
  setCleanupReady: (next: boolean) => void;
  setCrosshairActive: (next: boolean) => void;
  setInteractionHint: (next: string | null) => void;
  setMobileMove: (dir: keyof EcoSortState['mobileMove'], active: boolean) => void;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
};

export const useEcoSortStore = create<EcoSortState>((set, get) => ({
  score: 0,
  weather: 'CLEAR',
  isPlaying: false,
  pointerLockTarget: null,
  pointerLockPending: false,
  currentTrashType: null,
  moveSpeedMultiplier: 1,
  floorCount: 0,
  cleanupReady: false,
  crosshairActive: false,
  interactionHint: null,
  feedback: null,
  throwToken: 0,
  cleanupToken: 0,
  resetToken: 0,
  language: 'en',
  mobileMove: { forward: false, backward: false, left: false, right: false },
  setScore: (next) => set({ score: next }),
  setWeather: (next) => set({ weather: next }),
  setPlaying: (next) => set({ isPlaying: next }),
  setPointerLockTarget: (target) => set({ pointerLockTarget: target }),
  setPointerLockPending: (next) => {
    if (!next && pointerLockPendingTimeout) {
      clearTimeout(pointerLockPendingTimeout);
      pointerLockPendingTimeout = null;
    }
    set({ pointerLockPending: next });
  },
  requestPointerLock: () => {
    if (typeof window !== 'undefined') {
      const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
      if (coarse) {
        return 'unsupported';
      }
    }
    const target = get().pointerLockTarget;
    if (!target) {
      return 'pending';
    }
    if (typeof target.requestPointerLock !== 'function') {
      return 'unsupported';
    }
    if (get().pointerLockPending) {
      return 'pending';
    }
    const doc = target.ownerDocument;
    if (doc.pointerLockElement) {
      return 'locked';
    }
    set({ pointerLockPending: true });
    if (pointerLockPendingTimeout) {
      clearTimeout(pointerLockPendingTimeout);
    }
    pointerLockPendingTimeout = setTimeout(() => {
      const nextTarget = get().pointerLockTarget;
      const nextDoc = nextTarget?.ownerDocument;
      if (get().pointerLockPending && !nextDoc?.pointerLockElement) {
        set({ pointerLockPending: false });
      }
    }, 1200);
    try {
      target.focus?.();
      const result = target.requestPointerLock();
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch(() => set({ pointerLockPending: false }));
      }
      return 'requested';
    } catch {
      set({ pointerLockPending: false });
      return 'unsupported';
    }
  },
  setCurrentTrashType: (next) => set({ currentTrashType: next }),
  incrementScore: (delta) => set((state) => ({ score: state.score + delta })),
  setFeedback: (next) => set({ feedback: next }),
  requestThrow: () => set((state) => ({ throwToken: state.throwToken + 1 })),
  requestCleanup: () => set((state) => ({ cleanupToken: state.cleanupToken + 1 })),
  restartGame: () => set((state) => {
    const lang = state.language;
    // Helper to get text inside the restart action?
    // We can't use 'get().t' easily here if we are inside set callback of previous state?
    // Actually we can access state.
    const feedbackText = TRANSLATIONS[lang]['restart'];
    // Wait, the "RESTART!" feedback text also needs translation.
    // I will just use 'RESTART!' hardcoded or try to fetch it.
    // Let's use hardcoded or simple.
    return {
      score: 0,
      resetToken: state.resetToken + 1,
      floorCount: 0,
      cleanupReady: false,
      feedback: { text: TRANSLATIONS[lang]?.restart ?? 'RESTART!', color: '#fff' }
    };
  }),
  setMoveSpeedMultiplier: (next) => set({ moveSpeedMultiplier: next }),
  setFloorCount: (next) => set({ floorCount: next }),
  setCleanupReady: (next) => set({ cleanupReady: next }),
  setCrosshairActive: (next) => set({ crosshairActive: next }),
  setInteractionHint: (next) => set({ interactionHint: next }),
  setMobileMove: (dir, active) =>
    set((state) => ({
      mobileMove: {
        ...state.mobileMove,
        [dir]: active,
      },
    })),
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const lang = get().language;
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en'][key] ?? key;
  },
}));
