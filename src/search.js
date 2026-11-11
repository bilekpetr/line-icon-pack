// line-icon-pack search – ranks icons for a query over name, tags and aliases. Dependency-free;
// shared by the JS API, the CLI/MCP server and the website, so every surface finds the same icons.
//
// entries: [{ name, category, tags, aliases }]   (data/index.json has exactly these fields)
// Every word of the query has to match (AND). Per word, the best of:
//   exact name 100 · name part (users-add → "add") 60 · name prefix 40 · exact tag 30 ·
//   alias 25 · tag prefix 15 · substring of the name 10
// Ties sort by name, so results are stable.

const words = (s) => String(s ?? '').toLowerCase().trim().split(/[\s,]+/).filter(Boolean);

function wordScore(entry, w) {
  const name = entry.name;
  if (name === w) return 100;
  const parts = name.split('-');
  if (parts.includes(w)) return 60;
  if (name.startsWith(w) || parts.some((p) => p.startsWith(w))) return 40;
  if (entry.tags?.includes(w)) return 30;
  if (entry.aliases?.some((a) => a === w || a.split('-').includes(w))) return 25;
  if (entry.tags?.some((t) => t.startsWith(w))) return 15;
  if (name.includes(w)) return 10;
  return 0;
}

/**
 * @param {Array<{name:string, category:string, tags?:string[], aliases?:string[]}>} entries
 * @param {string} query
 * @param {{category?:string, limit?:number}} [opts]
 * @returns the matching entries, best first (all entries in their order when the query is empty)
 */
export function searchIcons(entries, query, { category, limit } = {}) {
  const ws = words(query);
  let list = category ? entries.filter((e) => e.category === category) : entries;
  if (ws.length) {
    const scored = [];
    for (const e of list) {
      let total = 0;
      for (const w of ws) {
        const s = wordScore(e, w);
        if (!s) { total = 0; break; }
        total += s;
      }
      if (total) scored.push([total, e]);
    }
    scored.sort((a, b) => b[0] - a[0] || (a[1].name < b[1].name ? -1 : 1));
    list = scored.map((s) => s[1]);
  }
  return limit ? list.slice(0, limit) : list;
}
