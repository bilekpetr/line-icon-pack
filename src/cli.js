#!/usr/bin/env node
// line-icon-pack CLI – plain SVG / JSON on stdout, so it pipes into files and AI agents.
import fs from 'node:fs';
import { getIcon, search, listIcons, listCategories } from './all.js';
import { toSvg, toDataUri } from './api.js';
import { PRESETS } from './presets.js';
import { jsxComponent } from './jsx.js';

const version = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const HELP = `line-icon-pack ${version} – 406 line icons

  line-icon-pack get <name> [--preset original|rounded|sharp] [--radius 0-4] [--style round|sharp]
                            [--stroke 1.5] [--size 24] [--color #111] [--fill] [--title "…"]
                            [--jsx | --data-uri]
  line-icon-pack search <words> [--category <id>] [--limit 20] [--json]
  line-icon-pack list [--category <id>] [--json]
  line-icon-pack categories [--json]
  line-icon-pack presets [--json]
  line-icon-pack mcp            MCP server on stdio (search_icons, get_icon, list_categories, list_presets)
`;

const argv = process.argv.slice(2);
const flags = {}, words = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) { words.push(a); continue; }
  const k = a.slice(2);
  if (['fill', 'jsx', 'data-uri', 'json', 'help', 'version'].includes(k)) flags[k] = true;
  else flags[k] = argv[++i];
}
const [cmd, ...rest] = words;
const out = (s) => process.stdout.write(s.endsWith('\n') ? s : s + '\n');
const fail = (s) => { process.stderr.write(s + '\n'); process.exit(1); };

if (flags.version) out(version);
else if (!cmd || flags.help) out(HELP);
else if (cmd === 'get') {
  const name = rest.join(' ');
  const icon = getIcon(name);
  if (!icon) {
    const near = search(name, { limit: 5 }).map((i) => i.name);
    fail(`No icon named "${name}".${near.length ? ` Did you mean: ${near.join(', ')}?` : ''}`);
  }
  const opts = { preset: flags.preset, radius: flags.radius, style: flags.style, strokeWidth: flags.stroke, size: flags.size, color: flags.color, title: flags.title, variant: flags.fill ? 'fill' : 'outline' };
  try {
    if (flags['data-uri']) out(toDataUri(icon, opts));
    else { const svg = toSvg(icon, opts); out(flags.jsx ? jsxComponent(icon.name, svg) : svg); }
  } catch (e) { fail(String(e.message ?? e)); }
} else if (cmd === 'search') {
  const hits = search(rest.join(' '), { category: flags.category, limit: Number(flags.limit ?? 20) });
  if (flags.json) out(JSON.stringify(hits.map((i) => ({ name: i.name, category: i.category, tags: i.tags }))));
  else out(hits.map((i) => `${i.name.padEnd(32)}${i.tags.slice(0, 5).join(', ')}`).join('\n') || 'Nothing found.');
} else if (cmd === 'list') {
  const all = listIcons({ category: flags.category });
  out(flags.json ? JSON.stringify(all.map((i) => i.name)) : all.map((i) => i.name).join('\n'));
} else if (cmd === 'categories') {
  const c = listCategories();
  out(flags.json ? JSON.stringify(c) : c.map((x) => `${x.id.padEnd(16)}${String(x.count).padStart(4)}  ${x.label}`).join('\n'));
} else if (cmd === 'presets') {
  const p = Object.entries(PRESETS).map(([id, x]) => ({ id, label: x.label, description: x.description }));
  out(flags.json ? JSON.stringify(p) : p.map((x) => `${x.id.padEnd(10)}${x.description}`).join('\n'));
} else if (cmd === 'mcp') {
  (await import('./mcp.js')).serve(version);
} else fail(`Unknown command "${cmd}".\n\n${HELP}`);
