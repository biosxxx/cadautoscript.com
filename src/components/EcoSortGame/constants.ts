import type {BinConfig, TrashTypeConfig, WeatherType} from './types';

export const TRASH_TYPES: TrashTypeConfig[] = [
  {id: 'paper', label: 'Бумага', color: 0x2196f3},
  {id: 'plastic', label: 'Пластик', color: 0xffeb3b},
  {id: 'glass', label: 'Стекло', color: 0x4caf50},
  {id: 'organic', label: 'Органика', color: 0x795548},
];

export const TRASH_TYPE_MAP = TRASH_TYPES.reduce<Record<string, TrashTypeConfig>>((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

export const BIN_CONFIG: BinConfig[] = [
  {type: 'paper', position: [-4.5, 0.55, -2]},
  {type: 'plastic', position: [-1.5, 0.55, -2]},
  {type: 'glass', position: [1.5, 0.55, -2]},
  {type: 'organic', position: [4.5, 0.55, -2]},
];

export const WEATHER_OPTIONS: WeatherType[] = ['CLEAR', 'RAIN', 'SNOW'];

export const GAME_BOUNDS = {
  x: 10,
  zMin: 0,
  zMax: 20,
};
