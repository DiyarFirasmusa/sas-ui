import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Class names for the SAS type ramp and the role-named spacing steps. Without
 * this, tailwind-merge reads `text-h1` as a colour and silently drops it when
 * `text-primary` follows (and the reverse), because it cannot know these
 * utilities are font sizes. Keep in sync with the `@utility text-*` and
 * `--spacing-*` definitions in theme.css.
 */
const TYPE_RAMP = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'b1',
  'b2',
  'b3',
  'button-1',
  'button-2',
  'label',
  'table-header',
  'table-id',
  'kpi',
  'metric',
  'display',
];
const SPACING_ROLES = ['field', 'inline', 'row', 'panel', 'card', 'page'];

const twMerge = extendTailwindMerge({
  extend: {
    theme: { spacing: SPACING_ROLES },
    classGroups: {
      'font-size': [{ text: TYPE_RAMP }],
      shadow: [{ shadow: ['small', 'mid', 'large', 'xlarge', 'primary'] }],
      rounded: [{ rounded: ['control', 'modal', 'pill', 'nav', 'kpi', 'pagination', 'kbd'] }],
    },
    conflictingClassGroups: {
      // A ramp utility sets size, line-height and weight together.
      'font-size': ['leading', 'font-weight'],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
