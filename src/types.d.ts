import type { Geometry } from './runtime';

/** One icon (a module of 'line-icon-pack/icons'). */
export interface IconData {
  name: string;
  category: string;
  tags: string[];
  aliases: string[];
  /** The base icon of a variant (users-add → actions-user), or null. */
  variantOf: string | null;
  /** Parametric outline geometry for the runtime (any preset, radius and stroke width). */
  geometry: Geometry;
  /** The solid version (elements inside <svg>, fill="currentColor"). */
  fill: string;
  /** The solid version with sharp corners. */
  fillSharp: string;
}
