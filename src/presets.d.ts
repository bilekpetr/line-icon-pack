import type { BuildOptions } from './runtime';

export type PresetName = 'original' | 'rounded' | 'sharp';
export interface Preset {
  label: string;
  /** null = the designed radii. */
  radius: number | null;
  keepLarger?: boolean;
  style: 'round' | 'sharp';
  description: string;
}

export const GRID: 24;
export const STROKE_WIDTH: 1.5;
export const PRESETS: Record<PresetName, Preset>;
export const DEFAULT_PRESET: 'original';
export const VARIANTS: ['outline', 'fill'];
/** Runtime options of a preset, merged with explicit overrides. */
export function presetOptions(name?: PresetName, overrides?: BuildOptions): BuildOptions & { strokeWidth: number; style: 'round' | 'sharp' };
