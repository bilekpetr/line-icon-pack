import type { IconData } from './types';

export declare const icons: IconData[];
export declare function getIcon(name: string): IconData | undefined;
export declare function listIcons(opts?: { category?: string }): IconData[];
export declare function listCategories(): { id: string; label: string; count: number }[];
export declare function search(query: string, opts?: { category?: string; limit?: number }): IconData[];
