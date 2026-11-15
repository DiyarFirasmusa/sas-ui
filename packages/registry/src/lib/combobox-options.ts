/** One selectable entry of a combobox or multi-select. */
export interface ComboboxOption {
  value: string;
  /** Plain text: it is matched against the typed query and shown in the input or chip. */
  label: string;
  disabled?: boolean;
}

/** Replaces `{name}` placeholders in a localised label, e.g. `+{count}`. */
export function fillLabel(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) => {
    const replacement = values[key];
    return replacement === undefined ? placeholder : String(replacement);
  });
}

/**
 * Remembers every option seen so far, by value. Async lists replace their
 * `options` on each search; the memory keeps the label of an already chosen
 * value available after it scrolls out of the current results.
 */
export function rememberOptions(
  memory: Map<string, ComboboxOption>,
  ...lists: readonly (readonly ComboboxOption[] | undefined)[]
): void {
  for (const list of lists) {
    for (const option of list ?? []) {
      memory.set(option.value, option);
    }
  }
}

/** Looks a value up in the memory; an unknown value is shown by its raw text. */
export function optionFor(memory: ReadonlyMap<string, ComboboxOption>, value: string): ComboboxOption {
  return memory.get(value) ?? { value, label: value };
}

/** `options` plus any selected option the current results do not contain. */
export function withSelected(
  options: readonly ComboboxOption[],
  selected: readonly ComboboxOption[],
): ComboboxOption[] {
  const present = new Set(options.map((option) => option.value));
  return [...options, ...selected.filter((option) => !present.has(option.value))];
}
