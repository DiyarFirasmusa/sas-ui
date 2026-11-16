import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '@/lib/locale';
import { ShellDemoPage } from './shell-demo-page';

describe('ShellDemoPage', () => {
  it('composes a page header, KPI tiles and a table panel in English', () => {
    render(
      <LocaleProvider locale="en">
        <ShellDemoPage locale="en" />
      </LocaleProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Items' }).textContent).toBe('Items');
    expect(screen.getByRole('button', { name: 'Add item' }).textContent).toContain('Add item');
    expect(document.querySelectorAll('[data-slot="stat-card"]')).toHaveLength(4);
    expect(screen.getByRole('table').tagName).toBe('TABLE');
    expect(screen.getAllByRole('row')).toHaveLength(6);
  });

  it('is fully translated in Arabic', () => {
    render(
      <LocaleProvider locale="ar">
        <ShellDemoPage locale="ar" />
      </LocaleProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'المواد' }).textContent).toBe('المواد');
    expect(screen.getByRole('button', { name: 'إضافة مادة' }).textContent).toContain('إضافة مادة');
    expect(screen.getByText('ITM-1042').getAttribute('dir')).toBe('ltr');
  });
});
