# Line Icon Pack

406 line icons on a 24 px grid. The outline icons have an adjustable corner radius and come in
three presets – **Original** (the designed radii), **Rounded** (2 px corners) and **Sharp** (square
line ends, mitred corners) – and every icon also has a solid version, **Fill** and **Fill Sharp**.

Browse and customise them on the website: https://lineiconpack.com

## Install

The package is installed straight from GitHub (it is not on the npm registry):

```sh
npm install github:bilekpetr/line-icon-pack
pnpm add github:bilekpetr/line-icon-pack
yarn add line-icon-pack@github:bilekpetr/line-icon-pack
```

Pin a version with its tag: `github:bilekpetr/line-icon-pack#v0.1.0` (versions: the repository's tags
and `CHANGELOG.md`). Update by installing the newer tag. You import it as `line-icon-pack` either way.
Without a package manager, download the ZIP from the website or from the GitHub release.

| You use | Import |
| --- | --- |
| Plain SVG files | `line-icon-pack/svg/<set>/<name>.svg` |
| An SVG sprite | `line-icon-pack/sprite/<set>.svg` |
| An icon font | `line-icon-pack/font/<set>/line-icon-pack-<set>.css` |
| JavaScript | `line-icon-pack` + `line-icon-pack/icons` |
| React | `line-icon-pack/react` + `line-icon-pack/react/icons` |
| The command line | `npx line-icon-pack get users-add` (installed) |
| An AI agent (MCP) | `npx -y github:bilekpetr/line-icon-pack mcp` |

Sets: `original`, `rounded`, `sharp`, `fill`, `fill-sharp`. Every icon uses `currentColor`, so it takes
the text colour of where you put it.

## HTML

```html
<img src="/node_modules/line-icon-pack/svg/original/users-add.svg" alt="Add user" width="24" height="24">

<!-- sprite: one request for all icons -->
<svg width="24" height="24"><use href="/sprite/original.svg#users-add"/></svg>

<!-- icon font -->
<link rel="stylesheet" href="/node_modules/line-icon-pack/font/rounded/line-icon-pack-rounded.css">
<i class="lip-rounded lip-users-add" aria-hidden="true"></i>
```

The font classes are `lip-<set>` (which font) plus `lip-<icon name>`. Codepoints are listed in
`font/codepoints.json` (Private Use Area from U+E000) and never change between versions.

## JavaScript

```js
import { toSvg } from 'line-icon-pack';
import { usersAdd, ecommerceCart } from 'line-icon-pack/icons';   // only these two end up in your bundle

toSvg(usersAdd);                                      // Original, 24 px
toSvg(usersAdd, { preset: 'rounded', size: 20 });
toSvg(ecommerceCart, { radius: 3, strokeWidth: 2 });  // any radius 0–4 px, any stroke width
toSvg(ecommerceCart, { variant: 'fill' });            // the solid version
toSvg(ecommerceCart, { title: 'Cart' });              // with an accessible name (role="img")
```

Options: `preset` (`original` | `rounded` | `sharp`), `radius` (0–4, overrides the preset), `style`
(`round` | `sharp` line ends and joins), `strokeWidth` (default 1.5), `size` (default 24), `color`
(default `currentColor`), `variant` (`outline` | `fill`; with the sharp preset the fill is Fill Sharp),
`title`, `className`. `toDataUri()` takes the same options; `iconBody()` returns only the elements
inside `<svg>`.

Icon names are kebab-case (`users-add`); the JavaScript exports are camelCase (`usersAdd`).

To look icons up by name at runtime (a CMS picker, a search box), use `line-icon-pack/all` – it loads
every icon:

```js
import { getIcon, search, listIcons, listCategories } from 'line-icon-pack/all';

getIcon('users-add');
search('shopping cart', { limit: 10 });   // names, tags and aliases, best first
listIcons({ category: 'weather' });
```

## React

```jsx
import { Icon } from 'line-icon-pack/react';
import { usersAdd } from 'line-icon-pack/icons';
import { UsersAddIcon } from 'line-icon-pack/react/icons';

<Icon icon={usersAdd} preset="rounded" size={20} />
<UsersAddIcon lineStyle="sharp" className="text-blue-600" />
<UsersAddIcon variant="fill" title="Add user" />
```

The components take the same options as `toSvg` (`lineStyle` instead of `style`, which stays React's
CSS prop), pass every other prop to `<svg>`, forward refs and render on the server. Without `title`
the icon is decorative (`aria-hidden`).

## Command line

In a project that has the package installed, `npx line-icon-pack …`; anywhere else
`npx -y github:bilekpetr/line-icon-pack …` (downloads it first).

```sh
npx line-icon-pack search "add user"
npx line-icon-pack get users-add --preset rounded --size 32 > users-add.svg
npx line-icon-pack get users-add --jsx            # a React component
npx line-icon-pack get users-add --fill --data-uri
npx line-icon-pack list --category weather
npx line-icon-pack categories
npx line-icon-pack presets
```

## AI agents (MCP)

`npx -y github:bilekpetr/line-icon-pack mcp` starts an MCP server on stdio with four tools: `search_icons`, `get_icon`
(SVG, JSX or a data URI in any preset), `list_categories` and `list_presets`.

Claude Code:

```sh
claude mcp add line-icon-pack -- npx -y github:bilekpetr/line-icon-pack mcp
```

Claude Desktop, Cursor and other clients (`mcpServers` in their config):

```json
{ "mcpServers": { "line-icon-pack": { "command": "npx", "args": ["-y", "github:bilekpetr/line-icon-pack", "mcp"] } } }
```

`AGENTS.md` and `llms.txt` in the package tell coding agents how to find and insert icons.

## Outline or fill

Use the outline icons by default and the fill version for a selected or active state (the current
tab, a liked item). Don't recolour parts of an icon.

## License

Free for personal and commercial projects, with a credit and a link to https://lineiconpack.com somewhere people
using your project can find it. Not for redistribution as an icon set. See `LICENSE.md`.
