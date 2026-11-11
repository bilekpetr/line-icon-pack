/** Parametric geometry of one icon (data/icons.json → icons[].geometry). */
export type Geometry = unknown[];

export interface BuildOptions {
  /** Corner radius in px on the 24 grid (0–4); undefined = the designed radii. */
  radius?: number;
  /** Never make a corner less round than drawn (the Rounded preset). */
  keepLarger?: boolean;
  /** 'round' = round caps and joins; 'sharp' = square caps, miter joins (limit 2). */
  style?: 'round' | 'sharp';
  strokeWidth?: number;
  /** Keyline fit (default true): a body that would run out of the icon (a sharp star's points) is
   *  scaled down around the centre until it fits; the stroke keeps its width. */
  fit?: boolean;
  size?: number;
  color?: string;
  title?: string;
  className?: string;
}

/** SVG body (the elements inside <svg>) of an icon. */
/** style 'sharp' pulls attached stroke ends back by strokeWidth / 2, so square caps stay inside the outline they meet. */
export function buildBody(data: Geometry, opts?: Pick<BuildOptions, 'radius' | 'keepLarger' | 'style' | 'strokeWidth' | 'fit'>): string;
/** The keyline fit buildBody applies: scale around the icon's centre (1 = none). */
export function fitScale(data: Geometry, opts?: Pick<BuildOptions, 'radius' | 'keepLarger' | 'style' | 'strokeWidth'>): number;
/** Root attributes of an outline icon. */
export function svgAttrs(opts?: Pick<BuildOptions, 'size' | 'strokeWidth' | 'style'>): string;
/** A complete <svg> document. */
export function buildSvg(data: Geometry, opts?: BuildOptions): string;
