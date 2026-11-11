import type { IconData } from './types';
import type { PresetName } from './presets';

export type { IconData };

export interface IconOptions {
  /** 'original' (default) | 'rounded' | 'sharp'. */
  preset?: PresetName;
  /** Corner radius 0–4 px on the 24 grid; overrides the preset (null = the designed radii). */
  radius?: number | null;
  /** 'round' caps and joins, or 'sharp' (square caps, mitred joins); overrides the preset. */
  style?: 'round' | 'sharp';
  /** Default 1.5. */
  strokeWidth?: number;
  /** Width and height in px, default 24. */
  size?: number | string;
  /** 'outline' (default) or 'fill' (the sharp preset gets the Fill Sharp set). */
  variant?: 'outline' | 'fill';
}

export interface SvgOptions extends IconOptions {
  /** Replaces currentColor. */
  color?: string;
  /** Accessible name: adds <title> and role="img"; without it the icon is aria-hidden. */
  title?: string;
  className?: string;
}

export function resolveOptions(opts?: IconOptions): { radius?: number | null; keepLarger?: boolean; style: 'round' | 'sharp'; strokeWidth: number };
export function iconParts(icon: IconData, opts?: IconOptions): { body: string; attrs: string };
export function iconBody(icon: IconData, opts?: IconOptions): string;
export function toSvg(icon: IconData, opts?: SvgOptions): string;
export function toDataUri(icon: IconData, opts?: SvgOptions): string;
/** 'users-add' → 'usersAdd'. */
export function exportName(name: string): string;
