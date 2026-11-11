// line-icon-pack/react – React components. SSR-safe (pure render, no effects), forwardRef, props pass
// through to <svg>. Decorative by default (aria-hidden); a title makes it role="img" with <title>.
//
//   import { Icon } from 'line-icon-pack/react';
//   import { usersAdd } from 'line-icon-pack/icons';
//   <Icon icon={usersAdd} preset="rounded" size={20} />
//   import { UsersAddIcon } from 'line-icon-pack/react/icons';   // one component per icon
import { createElement, forwardRef } from 'react';
import { iconParts } from './api.js';

const ROOT = /(\S+)="([^"]*)"/g;
const camel = (k) => (k === 'class' ? 'className' : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// lineStyle = the 'style' option of toSvg ('round' | 'sharp'); style stays React's CSS prop
function render({ icon, preset, radius, lineStyle, strokeWidth, size = 24, variant, color, title, children, ...rest }, ref) {
  const { body, attrs } = iconParts(icon, { preset, radius, style: lineStyle, strokeWidth, size, variant });
  const props = {};
  for (const [, k, v] of attrs.matchAll(ROOT)) if (k !== 'xmlns') props[camel(k)] = v;
  if (color) for (const k of ['stroke', 'fill']) if (props[k] === 'currentColor') props[k] = color;
  if (title) props.role = 'img'; else props['aria-hidden'] = true;
  return createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg', ...props, ...rest, ref,
    dangerouslySetInnerHTML: { __html: (title ? `<title>${esc(title)}</title>` : '') + body },
  });
}

/** Any icon: pass its data as `icon`. */
export const Icon = forwardRef(render);
Icon.displayName = 'Icon';

/** A component for one icon (what 'line-icon-pack/react/icons' is made of). */
export function createIcon(icon, displayName) {
  const C = forwardRef((props, ref) => render({ ...props, icon }, ref));
  C.displayName = displayName;
  return C;
}
