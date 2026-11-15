import type { ClassValue } from 'clsx';
import { cn } from '@/lib/utils';
type VariantMap = Record<string, Record<string, ClassValue>>;

/** A variant with `true`/`false` keys also accepts a real boolean. */
type Choice<Map> = keyof Map | ([keyof Map & ('true' | 'false')] extends [never] ? never : boolean);

type VariantSelection<V extends VariantMap> = {
  [K in keyof V]?: Choice<V[K]> | null;
};

type CompoundVariant<V extends VariantMap> = VariantSelection<V> & {
  class: ClassValue;
};

/**
 * Class builder with named variants, defaults and compound variants — the
 * subset of class-variance-authority these components need, in ~40 lines you
 * own. Later classes win via tailwind-merge, so `className` always overrides.
 */
export function variants<V extends VariantMap>(
  base: ClassValue,
  config: {
    variants: V;
    defaultVariants?: VariantSelection<V>;
    compoundVariants?: CompoundVariant<V>[];
  },
) {
  return function build(props?: VariantSelection<V> & { className?: string }): string {
    const keys = Object.keys(config.variants);
    const selected: Record<string, string | undefined> = {};
    const classes: ClassValue[] = [base];

    for (const key of keys) {
      const fromProps = props?.[key];
      const choice = fromProps === undefined ? config.defaultVariants?.[key] : fromProps;
      const picked = choice === null || choice === undefined ? undefined : String(choice);
      selected[key] = picked;
      if (picked !== undefined) {
        classes.push(config.variants[key]?.[picked]);
      }
    }

    for (const compound of config.compoundVariants ?? []) {
      const { class: compoundClass, ...conditions } = compound;
      const matches = Object.entries(conditions).every(
        ([key, expected]) => String(expected) === selected[key],
      );
      if (matches) {
        classes.push(compoundClass);
      }
    }

    classes.push(props?.className);
    return cn(...classes);
  };
}

/** The variant props a `variants()` builder accepts, minus `className`. */
export type VariantProps<T> = T extends (props?: infer P) => string
  ? Omit<NonNullable<P>, 'className'>
  : never;
