export const UTILITIES_PUBLIC_ACCESS_KEY = 'utilities_public_access';
export const DEFAULT_UTILITIES_PUBLIC_ACCESS = true;

export const parseBooleanSetting = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  }
  return null;
};

export const serializeBooleanSetting = (value: boolean): string => (value ? 'true' : 'false');
