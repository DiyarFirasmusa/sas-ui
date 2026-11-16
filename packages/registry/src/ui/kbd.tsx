import { cn } from '@/lib/utils';

interface KbdProps extends React.ComponentProps<'kbd'> {
  /** Render one cap per key, e.g. `['Ctrl', 'K']`, instead of `children`. */
  keys?: string[];
}

const capClasses =
  'inline-flex h-5 min-w-5 items-center justify-center rounded-[var(--radius-kbd,6px)] bg-kbd px-1 text-label text-text-secondary select-none';

/**
 * Keyboard key cap. Key names are Latin symbols, so the cap is always
 * `dir="ltr"` even inside Arabic text; the order of `keys` is the order typed.
 */
function Kbd({ className, keys, children, ...props }: KbdProps) {
  if (keys) {
    return (
      <KbdGroup className={className} {...props}>
        {keys.map((key, index) => (
          <Kbd key={`${key}-${index}`}>{key}</Kbd>
        ))}
      </KbdGroup>
    );
  }
  return (
    <kbd data-slot="kbd" dir="ltr" className={cn(capClasses, className)} {...props}>
      {children}
    </kbd>
  );
}

/** Groups several caps into one shortcut, e.g. Ctrl + K. */
function KbdGroup({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd-group"
      dir="ltr"
      className={cn('inline-flex items-center gap-1', className)}
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
export type { KbdProps };
