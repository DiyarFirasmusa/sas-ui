import { describe, expect, it } from 'vitest';
import { DEFAULT_DIRECTORIES } from './config.ts';
import { rewriteImports } from './rewrite-imports.ts';

const source = `import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { useX } from '@/hooks/use-x';
import { expectNoA11yViolations } from '@/test/a11y';
import { Base } from '@base-ui/react/button';`;

describe('rewriteImports', () => {
  it('is the identity with the default layout', () => {
    expect(rewriteImports(source, { alias: '@', directories: DEFAULT_DIRECTORIES })).toBe(source);
  });

  it('maps the alias and folders to the project layout', () => {
    const result = rewriteImports(source, {
      alias: '~',
      directories: { ui: 'shared/ui', lib: 'utils', hooks: 'hooks', test: 'testing' },
    });
    expect(result).toContain(`from '~/utils/utils'`);
    expect(result).toContain(`from "~/shared/ui/button"`);
    expect(result).toContain(`from '~/testing/a11y'`);
    expect(result).toContain(`from '@base-ui/react/button'`);
  });
});
