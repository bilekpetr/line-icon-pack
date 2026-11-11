// line-icon-pack MCP server (stdio): lets an AI agent find an icon and get its SVG or JSX.
// Start: npx line-icon-pack mcp. Protocol: JSON-RPC 2.0, one message per line (MCP stdio transport).
import { createInterface } from 'node:readline';
import { getIcon, search, listCategories } from './all.js';
import { toSvg, toDataUri } from './api.js';
import { PRESETS } from './presets.js';
import { jsxComponent } from './jsx.js';

const INSTRUCTIONS = 'Line Icon Pack: 406 line icons on a 24 px grid. Always search_icons first, then get_icon with the exact name from the results. Presets: original (designed radii), rounded (2 px corners), sharp (square ends, mitred corners). variant "fill" is the solid version – use it for a selected or active state. Do not recolour parts of an icon; it uses currentColor.';

const TOOLS = [
  {
    name: 'search_icons',
    description: 'Find icons by meaning. Matches every word against icon names, tags and aliases and returns the best first, each with its name, category and tags. Call this before get_icon and use an exact name from the results.',
    inputSchema: { type: 'object', properties: {
      query: { type: 'string', description: 'What the icon should show, e.g. "add user", "shopping cart", "warning".' },
      category: { type: 'string', description: 'Optional category id from list_categories.' },
      limit: { type: 'integer', minimum: 1, maximum: 100, description: 'Default 20.' },
    }, required: ['query'] },
  },
  {
    name: 'get_icon',
    description: 'The code of one icon by its exact name (from search_icons): an <svg>, a React component, or a data: URI. Uses currentColor.',
    inputSchema: { type: 'object', properties: {
      name: { type: 'string', description: 'Exact icon name, e.g. "users-add".' },
      preset: { type: 'string', enum: Object.keys(PRESETS), description: 'Default original.' },
      radius: { type: 'number', minimum: 0, maximum: 4, description: 'Corner radius in px; overrides the preset.' },
      style: { type: 'string', enum: ['round', 'sharp'], description: 'Line ends and joins; overrides the preset.' },
      stroke_width: { type: 'number', minimum: 0.5, maximum: 3, description: 'Default 1.5.' },
      variant: { type: 'string', enum: ['outline', 'fill'], description: 'Default outline; fill = selected or active state.' },
      size: { type: 'number', description: 'Width and height in px, default 24.' },
      title: { type: 'string', description: 'Accessible name; omit for a decorative icon.' },
      format: { type: 'string', enum: ['svg', 'jsx', 'data_uri'], description: 'Default svg.' },
    }, required: ['name'] },
  },
  { name: 'list_categories', description: 'Icon categories with their ids and icon counts.', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_presets', description: 'The three presets (original, rounded, sharp) and what each does.', inputSchema: { type: 'object', properties: {} } },
];

const text = (t, isError = false) => ({ content: [{ type: 'text', text: t }], ...(isError ? { isError: true } : {}) });

export function callTool(name, args = {}) {
  if (name === 'search_icons') {
    if (!args.query) return text('query is required', true);
    const hits = search(String(args.query), { category: args.category, limit: args.limit ?? 20 });
    if (!hits.length) return text(`No icon matches "${args.query}". Try fewer or more general words, or list_categories.`);
    return text(JSON.stringify(hits.map((i) => ({ name: i.name, category: i.category, tags: i.tags })), null, 1));
  }
  if (name === 'get_icon') {
    const icon = getIcon(String(args.name ?? ''));
    if (!icon) return text(`No icon named "${args.name}". Use search_icons to find the exact name.`, true);
    const opts = { preset: args.preset, radius: args.radius, style: args.style, strokeWidth: args.stroke_width, variant: args.variant, size: args.size, title: args.title };
    try {
      if (args.format === 'data_uri') return text(toDataUri(icon, opts));
      const svg = toSvg(icon, opts);
      return text(args.format === 'jsx' ? jsxComponent(icon.name, svg) : svg);
    } catch (e) { return text(String(e.message ?? e), true); }
  }
  if (name === 'list_categories') return text(JSON.stringify(listCategories(), null, 1));
  if (name === 'list_presets') return text(JSON.stringify(Object.entries(PRESETS).map(([id, p]) => ({ id, label: p.label, description: p.description })), null, 1));
  return text(`Unknown tool "${name}"`, true);
}

/** One JSON-RPC message → the response (or null for a notification). */
export function handle(msg, version) {
  const { id, method, params = {} } = msg;
  const ok = (result) => ({ jsonrpc: '2.0', id, result });
  if (method === 'initialize') return ok({ protocolVersion: params.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'line-icon-pack', version }, instructions: INSTRUCTIONS });
  if (id === undefined) return null; // notifications (initialized, cancelled …)
  if (method === 'ping') return ok({});
  if (method === 'tools/list') return ok({ tools: TOOLS });
  if (method === 'tools/call') return ok(callTool(params.name, params.arguments));
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

export function serve(version) {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let msg;
    try { msg = JSON.parse(line); } catch { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'); return; }
    const res = handle(msg, version);
    if (res) process.stdout.write(JSON.stringify(res) + '\n');
  });
}
