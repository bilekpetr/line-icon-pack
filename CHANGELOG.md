# Changelog

## 0.1.0 (2026-11-11)

First release, installed from GitHub (`github:bilekpetr/line-icon-pack#v0.1.0`).

- 406 icons in five sets: `original`, `rounded`, `sharp` (outline) and `fill`, `fill-sharp` (solid).
- Static SVGs (`svg/<set>/`) and sprites (`sprite/<set>.svg`), optimised with svgo and checked
  against the runtime render.
- Icon fonts for every set (woff2 + ttf + css, classes `lip-<set> lip-<name>`), codepoints from U+E000
  in `font/codepoints.json`.
- JS API: `toSvg`, `toDataUri`, `iconBody`; any preset, radius 0–4 px and stroke width; keyline fit so
  sharp points never run out of the icon.
- One module per icon (`line-icon-pack/icons`, tree-shakeable) and `line-icon-pack/all` for lookups by name.
- React components (`Icon`, and one component per icon in `line-icon-pack/react/icons`), SSR-safe.
- CLI (`get`, `search`, `list`, `categories`, `presets`) and an MCP server (`mcp`) for AI agents.
