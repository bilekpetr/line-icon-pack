import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';
import type { IconData } from './types';
import type { IconOptions } from './api';

export interface IconProps extends Omit<IconOptions, 'style'>, Omit<SVGProps<SVGSVGElement>, 'ref' | 'radius' | 'strokeWidth'> {
  /** 'round' caps and joins, or 'sharp'; overrides the preset (toSvg's `style`). */
  lineStyle?: 'round' | 'sharp';
  /** Replaces currentColor. */
  color?: string;
  /** Accessible name; without it the icon is aria-hidden. */
  title?: string;
}
export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

export declare const Icon: ForwardRefExoticComponent<IconProps & { icon: IconData } & RefAttributes<SVGSVGElement>>;
export declare function createIcon(icon: IconData, displayName: string): IconComponent;
