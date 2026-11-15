import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe on a rendered container and fails with a readable list of
 * violations. jsdom cannot compute colour contrast or layout, so those rules
 * are off here; contrast is covered by the preset tests in @sas-ui/tokens.
 */
export async function expectNoA11yViolations(
  container: Element = document.body,
): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  const summary = results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} → ${violation.nodes
        .map((node) => node.target.join(' '))
        .join(', ')}`,
  );
  expect(summary).toEqual([]);
}
