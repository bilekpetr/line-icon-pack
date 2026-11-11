// line-icon-pack – SVG from icon data. Dependency-free; the data comes from 'line-icon-pack/icons'
// (one module per icon, tree-shakeable) or 'line-icon-pack/all' (everything, for lookups by name).
//
//   import { toSvg } from 'line-icon-pack';
//   import { usersAdd } from 'line-icon-pack/icons';
//   toSvg(usersAdd, { preset: 'rounded', size: 32 });
import { buildBody, svgAttrs } from './runtime.js';
import { presetOptions, PRESETS, DEFAULT_PRESET } from './presets.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Runtime options for a preset plus explicit radius / style / stroke width. */
export function resolveOptions({ preset = DEFAULT_PRESET, radius, style, strokeWidth } = {}) {
  if (!PRESETS[preset]) throw new Error(`line-icon-pack: unknown preset "${preset}" (${Object.keys(PRESETS).join(', ')})`);
  const o = presetOptions(preset);
  if (radius !== undefined) o.radius = radius === null ? null : Math.max(0, Number(radius) || 0);
  if (style) o.style = style;
  if (strokeWidth !== undefined) o.strokeWidth = Number(strokeWidth);
  return o;
}

/** The fill body to use: Fill Sharp goes with the sharp style, the designed fill with the others. */
const fillBody = (icon, o) => (o.style === 'sharp' && icon.fillSharp ? icon.fillSharp : icon.fill);

/**
 * The elements inside <svg> and the root attributes of one icon.
 * @returns {{ body: string, attrs: string }}
 */
export function iconParts(icon, opts = {}) {
  if (!icon || !icon.geometry) throw new Error('line-icon-pack: pass an icon object, e.g. import { usersAdd } from "line-icon-pack/icons"');
  const o = resolveOptions(opts);
  const size = opts.size ?? 24;
  if (opts.variant === 'fill') {
    return { body: fillBody(icon, o), attrs: `xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"` };
  }
  return { body: buildBody(icon.geometry, o), attrs: svgAttrs({ size, strokeWidth: o.strokeWidth, style: o.style }) };
}

/** Only the elements inside <svg> (for frameworks that render the root themselves). */
export function iconBody(icon, opts = {}) {
  return iconParts(icon, opts).body;
}

/**
 * A complete <svg> string.
 * opts: preset ('original' | 'rounded' | 'sharp'), radius (0–4, overrides the preset), style ('round' |
 * 'sharp'), strokeWidth (default 1.5), size (default 24), color (default currentColor), variant
 * ('outline' | 'fill'), title (accessible name; without it the icon is aria-hidden), className.
 */
export function toSvg(icon, opts = {}) {
  const { body, attrs } = iconParts(icon, opts);
  let root = attrs;
  if (opts.color) root = root.replace(/currentColor/g, esc(opts.color));
  if (opts.className) root += ` class="${esc(opts.className)}"`;
  root += opts.title ? ' role="img"' : ' aria-hidden="true"';
  const title = opts.title ? `<title>${esc(opts.title)}</title>` : '';
  return `<svg ${root}>${title}${body}</svg>`;
}

/** The same SVG as a data: URI (CSS backgrounds, <img src>). */
export function toDataUri(icon, opts = {}) {
  return `data:image/svg+xml,${encodeURIComponent(toSvg(icon, opts))}`;
}

/** camelCase export name of an icon ('users-add' → 'usersAdd'). */
export const exportName = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
