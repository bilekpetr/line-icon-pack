# Line Icon Pack – for AI coding agents

406 line icons on a 24 px grid, `currentColor`, in five sets: `original`, `rounded`, `sharp` (outline)
and `fill`, `fill-sharp` (solid).

## Install

From GitHub, not the npm registry: `npm install github:bilekpetr/line-icon-pack` (pin a tag with
`#v0.1.0`). Imports are `line-icon-pack/…` as usual. Outside a project that has it installed, run the CLI
as `npx -y github:bilekpetr/line-icon-pack …`.

## Find an icon

- Search first, then use the exact name. Names are `category-thing` in kebab-case: `users-add`,
  `ecommerce-cart`, `weather-cloud-upload`, `arrows-left`, `chevron-down`.
- `npx line-icon-pack search "<words>"` (or the MCP tool `search_icons`) matches names, tags and aliases.
- Categories: `npx line-icon-pack categories`. Some names are not self-explanatory (`statistics-2`…`7`,
  `actions-more-1/2`, `mobile-light` = brightness); trust the tags.
- Variants of a base icon end in a modifier: `-add`, `-remove`, `-check`, `-close`, `-time`, `-upload`,
  `-download` (`users-add`, `folder-check`).

## Insert it

- React: `import { UsersAddIcon } from 'line-icon-pack/react/icons'` → `<UsersAddIcon />`, or
  `import { Icon } from 'line-icon-pack/react'` with `import { usersAdd } from 'line-icon-pack/icons'`
  → `<Icon icon={usersAdd} />`. Import named icons, never the whole set, so bundles stay small.
- Any JS: `toSvg(usersAdd, { preset, size, variant, title })` from `line-icon-pack`.
- HTML without a build: copy the file from `svg/<set>/<name>.svg`, or `npx line-icon-pack get <name>`.
- Icon font: `font/<set>/line-icon-pack-<set>.css`, then `<i class="lip-<set> lip-<name>" aria-hidden="true"></i>`.

## Rules

- Presets: `original` (default, the designed radii), `rounded` (2 px corners), `sharp` (square ends,
  mitred corners). Use one preset across a product.
- Outline is the default state; the fill version means selected or active.
- Size with `size` (24 by default; 20 and 16 work), colour with CSS `color`. Don't recolour parts of
  an icon and don't change the stroke width per icon.
- Decorative icons stay `aria-hidden` (the default). An icon that is the only content of a button or
  link gets `title` (or an `aria-label` on the button).
- License: credit with a link to the website is required; don't redistribute the icons as a set.
