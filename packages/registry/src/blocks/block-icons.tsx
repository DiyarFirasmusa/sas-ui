import type { ReactNode } from 'react';
import type { IconProps } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

/**
 * Glyphs the blocks need that `ui/icons` does not ship. They follow the same
 * contract: decorative unless given an `aria-label`, 24px stroke, mirrored in
 * RTL when the shape points somewhere (`mirror`).
 */
function glyph(displayName: string, paths: ReactNode, mirror = false) {
  function Glyph({ className, ...props }: IconProps) {
    const labelled = props['aria-label'] !== undefined;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={labelled ? undefined : true}
        role={labelled ? 'img' : undefined}
        focusable="false"
        className={cn('size-4 shrink-0', mirror && 'rtl:-scale-x-100', className)}
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Glyph.displayName = displayName;
  return Glyph;
}

export const BellIcon = glyph(
  'BellIcon',
  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />,
);
export const LogOutIcon = glyph(
  'LogOutIcon',
  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />,
  true,
);
export const LanguagesIcon = glyph(
  'LanguagesIcon',
  <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1m14 20-5-10-5 10m2-4h6" />,
);
export const TrendingUpIcon = glyph('TrendingUpIcon', <path d="M16 7h6v6m0-6-8.5 8.5-5-5L2 17" />);
export const TrendingDownIcon = glyph(
  'TrendingDownIcon',
  <path d="M16 17h6v-6m0 6-8.5-8.5-5 5L2 7" />,
);
