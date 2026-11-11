// line-icon-pack presets – named looks of the outline set. A preset is a set of options for
// src/runtime.js (buildSvg / buildBody). The JS and React APIs accept any values; the font and
// static-SVG builds bake one font / one folder per preset. Dependency-free (shipped as is).
//
// radius: null = the designed corner radii; a number = every rounded corner gets that radius in px
//         on the 24 grid (the runtime limits it per corner – edge length, clearance to inner parts,
//         acute tips – and never changes design curves such as an eye or a bag handle).
// style:  'round' = round caps and joins; 'sharp' = square caps, miter joins (miter limit 2).

export const GRID = 24;
export const STROKE_WIDTH = 1.5; // fonts and static SVGs; the JS/React API takes any width (1–2.5 tested)

export const PRESETS = {
  original: {
    label: 'Original',
    radius: null,
    style: 'round',
    description: 'The designed corner radii with round caps and joins.',
  },
  rounded: {
    label: 'Rounded',
    radius: 2,
    keepLarger: true, // corners drawn from 3 px up (logo frames) keep their radius; the rest get 2 px
    style: 'round',
    description: 'Every corner rounded with 2 px (acute tips proportionally less), round caps and joins.',
  },
  sharp: {
    label: 'Sharp',
    radius: 0,
    style: 'sharp',
    description: 'Sharp corners, square line ends and mitred joins.',
  },
};

export const DEFAULT_PRESET = 'original';

// The fill (solid) set is static: designed radii only, no presets, no stroke width.
export const VARIANTS = ['outline', 'fill'];

/** Runtime options of a preset, merged with explicit overrides (radius, style, strokeWidth, size…). */
export function presetOptions(name = DEFAULT_PRESET, overrides = {}) {
  const p = PRESETS[name];
  if (!p) throw new Error(`Unknown preset "${name}" (use ${Object.keys(PRESETS).join(', ')})`);
  return { radius: p.radius ?? undefined, keepLarger: !!p.keepLarger, style: p.style, strokeWidth: STROKE_WIDTH, ...overrides };
}
