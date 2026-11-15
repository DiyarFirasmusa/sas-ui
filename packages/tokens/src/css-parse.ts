/**
 * Reads the custom properties out of a hand-written tokens file (a `:root`
 * block for light and a `.dark` block for dark), the format the SAS dashboards
 * use today. Used to import an existing palette as a preset.
 */

export type VariableMap = Map<string, string>;

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Collects `--name: value;` declarations from every block whose selector matches. */
function collectBlock(css: string, selector: RegExp): VariableMap {
  const variables: VariableMap = new Map();
  const blockPattern = /([^{}]+)\{([^{}]*)\}/g;
  for (const match of css.matchAll(blockPattern)) {
    const [, rawSelector, body] = match;
    if (!rawSelector || body === undefined || !rawSelector.split(',').some((part) => selector.test(part.trim()))) {
      continue;
    }
    for (const declaration of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
      const [, name, value] = declaration;
      if (name && value) {
        variables.set(name, value.trim());
      }
    }
  }
  return variables;
}

export function parseTokenCss(css: string): {
  light: VariableMap;
  dark: VariableMap;
} {
  const clean = stripComments(css);
  return {
    light: collectBlock(clean, /^:root$/),
    dark: collectBlock(clean, /^(\.dark|:root\.dark|html\.dark)$/),
  };
}

const VAR_REFERENCE = /^var\(--([\w-]+)\)$/;

/** Follows `var(--x)` chains inside one scope, falling back to `fallback`. */
export function resolveVariable(
  name: string,
  scope: VariableMap,
  fallback: VariableMap,
  depth = 0,
): string | undefined {
  if (depth > 8) {
    return undefined;
  }
  const value = scope.get(name) ?? fallback.get(name);
  if (value === undefined) {
    return undefined;
  }
  const reference = VAR_REFERENCE.exec(value);
  if (reference?.[1]) {
    return resolveVariable(reference[1], scope, fallback, depth + 1);
  }
  return value;
}
