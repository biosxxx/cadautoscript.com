import {create} from 'zustand';
import {DEFAULT_CONFIG} from './constants';
import {createNozzle} from './utils';
import type {HeadConfig, HeadStandard, Nozzle} from './types';

type VesselHeadState = {
  config: HeadConfig;
  nozzles: Nozzle[];
  setConfig: (patch: Partial<HeadConfig>) => void;
  setStandard: (standard: HeadStandard) => void;
  addNozzle: () => void;
  removeNozzle: (id: string) => void;
  updateNozzle: (id: string, patch: Partial<Nozzle>) => void;
  clearNozzles: () => void;
};

export const useVesselHeadStore = create<VesselHeadState>((set) => ({
  config: DEFAULT_CONFIG,
  nozzles: [],
  setConfig: (patch) =>
    set((state) => ({
      config: {
        ...state.config,
        ...patch,
      },
    })),
  setStandard: (standard) =>
    set((state) => ({
      config: {
        ...state.config,
        standard,
      },
    })),
  addNozzle: () =>
    set((state) => ({
      nozzles: [...state.nozzles, createNozzle()],
    })),
  removeNozzle: (id) =>
    set((state) => ({
      nozzles: state.nozzles.filter((nozzle) => nozzle.id !== id),
    })),
  updateNozzle: (id, patch) =>
    set((state) => ({
      nozzles: state.nozzles.map((nozzle) =>
        nozzle.id === id
          ? {
              ...nozzle,
              ...patch,
            }
          : nozzle,
      ),
    })),
  clearNozzles: () => set({nozzles: []}),
}));
