import { describe, expect, it } from 'vitest';
import { addCssImports, cssImportPath } from './css-entry.ts';

describe('css entry', () => {
  it('inserts imports right after the tailwind import, once', () => {
    const css = `@import 'tailwindcss';\n\nbody { color: red; }\n`;
    const next = addCssImports(css, ['./styles/sas-ui/theme.css']);
    expect(next).toBe(
      `@import 'tailwindcss';\n@import './styles/sas-ui/theme.css';\n\nbody { color: red; }\n`,
    );
    expect(addCssImports(next ?? '', ['./styles/sas-ui/theme.css'])).toBeUndefined();
  });

  it('prepends when there is no tailwind import', () => {
    expect(addCssImports('a{}', ['./x.css'])).toBe(`@import './x.css';\na{}`);
  });

  it('computes relative css import paths', () => {
    expect(cssImportPath('src/index.css', 'src/styles/sas-ui/theme.css')).toBe(
      './styles/sas-ui/theme.css',
    );
    expect(cssImportPath('src/style/styles.css', 'src/styles/sas-ui/theme.css')).toBe(
      '../styles/sas-ui/theme.css',
    );
  });
});
