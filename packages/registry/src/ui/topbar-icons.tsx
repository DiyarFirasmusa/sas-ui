import type { ReactNode } from 'react';
import type { IconProps } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

/** Glyphs the top bar needs that `icons` does not ship; same contract: decorative unless labelled. */
function glyph(displayName: string, paths: ReactNode) {
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
        className={cn('size-4 shrink-0', className)}
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Glyph.displayName = displayName;
  return Glyph;
}

const BellIcon = glyph(
  'BellIcon',
  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />,
);

const GlobeIcon = glyph(
  'GlobeIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
  </>,
);

export { BellIcon, GlobeIcon };
