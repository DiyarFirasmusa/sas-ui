/**
 * Fills `{name}` placeholders in a label template, so translators can reorder
 * the pieces (Arabic puts the count in a different place than English).
 * Unknown placeholders are left as written rather than becoming "undefined".
 */
export function fillTemplate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

const latinNumbers = new Intl.NumberFormat('en-US');

/**
 * Formats a count with Latin digits and thousands separators in every locale.
 * Dashboards keep digits Latin even in Arabic UIs so figures line up with
 * codes, phone numbers and exports.
 */
export function formatCount(value: number): string {
  return latinNumbers.format(value);
}
