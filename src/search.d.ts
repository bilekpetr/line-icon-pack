export interface SearchEntry {
  name: string;
  category: string;
  tags?: string[];
  aliases?: string[];
}

/** Icons matching every word of the query (name, tags, aliases), best first. */
export function searchIcons<T extends SearchEntry>(entries: T[], query: string, opts?: { category?: string; limit?: number }): T[];
