import { Avatar as AvatarPrimitive } from '@base-ui/react/avatar';
import type { ReactNode } from 'react';
import { UserIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { variants, type VariantProps } from '@/lib/variants';

const messages: Messages<'more'> = {
  en: { more: 'more' },
  ar: { more: 'آخرين' },
};

/** Tag hues the avatar picks from; literal class names so Tailwind can see them. */
const HUE_CLASSES = [
  'bg-tag-green-container text-tag-green',
  'bg-tag-red-container text-tag-red',
  'bg-tag-yellow-container text-tag-yellow',
  'bg-tag-orange-container text-tag-orange',
  'bg-tag-cyan-container text-tag-cyan',
  'bg-tag-purple-container text-tag-purple',
  'bg-tag-blue-container text-tag-blue',
] as const;

/** Stable index for a name (same name, same colour, in every session and on every device). */
function hueIndexForName(name: string): number {
  let hash = 0;
  for (const character of name.trim().normalize('NFC')) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return hash % HUE_CLASSES.length;
}

function firstGrapheme(word: string): string {
  const first = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)[Symbol.iterator]().next();
  return first.done ? '' : first.value.segment;
}

/**
 * First letters of the first two words. Works on graphemes, so an Arabic
 * letter with its diacritics, or an emoji, is never cut in half.
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map(firstGrapheme)
    .join('')
    .toLocaleUpperCase();
}

const avatarVariants = variants(
  'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill align-middle select-none',
  {
    variants: {
      size: {
        xs: 'size-6 text-label [&_svg]:size-3.5',
        sm: 'size-8 text-label [&_svg]:size-4',
        md: 'size-10 text-b2 [&_svg]:size-5',
        lg: 'size-12 text-h5 [&_svg]:size-6',
        xl: 'size-16 text-h4 [&_svg]:size-8',
      },
    },
    defaultVariants: { size: 'md' },
  },
);

interface AvatarProps
  extends Omit<AvatarPrimitive.Root.Props, 'children'>,
    VariantProps<typeof avatarVariants> {
  /** Full name: gives the avatar its accessible name, its initials and its colour. */
  name?: string;
  /** Image URL; the initials show while it loads or if it fails. */
  src?: string;
  /** Shown instead of the initials/user glyph when there is no `name`. */
  fallback?: ReactNode;
}

function Avatar({ className, size, name, src, fallback, ...props }: AvatarProps) {
  const initials = name ? getInitials(name) : '';
  const hue = HUE_CLASSES[name ? hueIndexForName(name) : 0];
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      role={name ? 'img' : undefined}
      aria-label={name}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="aspect-square size-full object-cover"
        />
      ) : null}
      <AvatarPrimitive.Fallback
        className={cn('flex size-full items-center justify-center font-medium', name ? hue : 'bg-surface-dim text-text-muted')}
      >
        {initials ? <span aria-hidden="true">{initials}</span> : (fallback ?? <UserIcon />)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

interface AvatarGroupProps extends React.ComponentProps<'div'>, VariantProps<typeof avatarVariants> {
  /** People to show, in order. */
  people: { name: string; src?: string }[];
  /** Avatars shown before collapsing the rest into "+N". Default 4. */
  max?: number;
  /** Accessible name for the whole group, e.g. "Assignees". */
  label?: string;
}

/** Overlapping avatars with a "+N" tile for the overflow. Overlap flips with the direction. */
function AvatarGroup({ people, max = 4, size, label, className, ...props }: AvatarGroupProps) {
  const labels = useLabels(messages);
  const limit = Math.max(1, max);
  const shown = people.length > limit ? people.slice(0, limit) : people;
  const hidden = people.length - shown.length;
  return (
    <div
      data-slot="avatar-group"
      role="group"
      aria-label={label}
      className={cn('flex items-center', className)}
      {...props}
    >
      {shown.map((person, index) => (
        <Avatar
          key={`${person.name}-${index}`}
          name={person.name}
          src={person.src}
          size={size}
          className={cn('ring-2 ring-background', index > 0 && '-ms-2')}
        />
      ))}
      {hidden > 0 ? (
        <span
          data-slot="avatar-overflow"
          role="img"
          aria-label={`${hidden} ${labels.more}`}
          className={cn(
            avatarVariants({ size }),
            '-ms-2 bg-surface-dim font-medium text-text-secondary ring-2 ring-background',
          )}
        >
          <span aria-hidden="true" dir="ltr">
            +{hidden}
          </span>
        </span>
      ) : null}
    </div>
  );
}

export { Avatar, AvatarGroup, avatarVariants, getInitials, hueIndexForName };
export type { AvatarGroupProps, AvatarProps };
