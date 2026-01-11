export type TrashTypeId = 'paper' | 'plastic' | 'glass' | 'organic';

export type WeatherType = 'CLEAR' | 'RAIN' | 'SNOW';

export type FeedbackMessage = {
  text: string;
  color: string;
};

export type TrashTypeConfig = {
  id: TrashTypeId;
  label: string;
  color: number;
};

export type BinConfig = {
  type: TrashTypeId;
  position: [number, number, number];
};

export type SpawnedTrash = {
  id: string;
  type: TrashTypeId;
  position: [number, number, number];
};
