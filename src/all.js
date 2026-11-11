// line-icon-pack/all – every icon at once, for lookups by name (CLI, MCP server, CMS pickers).
// In an app bundle prefer 'line-icon-pack/icons', which keeps only the icons you import.
import * as modules from '../icons/index.js';
import { CATEGORIES } from '../icons/categories.js';
import { searchIcons } from './search.js';

/** All icons, sorted by name. */
export const icons = Object.values(modules).sort((a, b) => a.name.localeCompare(b.name, 'en'));
const byName = new Map(icons.map((i) => [i.name, i]));
for (const i of icons) for (const a of i.aliases ?? []) if (!byName.has(a)) byName.set(a, i);

/** An icon by its name (or an alias); undefined when there is none. */
export const getIcon = (name) => byName.get(String(name).trim().toLowerCase());

/** Icons, optionally of one category. */
export const listIcons = ({ category } = {}) => (category ? icons.filter((i) => i.category === category) : icons);

/** Categories with their labels and icon counts. */
export const listCategories = () => CATEGORIES;

/** Icons matching every word of the query (name, tags, aliases), best first. */
export const search = (query, opts = {}) => searchIcons(icons, query, opts);
