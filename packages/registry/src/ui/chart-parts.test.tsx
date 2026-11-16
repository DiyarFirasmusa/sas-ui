import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartDataTableView, ChartEmpty, ChartSkeleton } from '@/components/ui/chart-parts';
import type { ChartConfig } from '@/lib/chart';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const config: ChartConfig = { sales: { label: 'Sales' }, cost: { label: 'Cost' } };
const table = {
  data: [
    { month: 'Jan', sales: 1200, cost: 800 },
    { month: 'Feb', sales: 1800 },
  ],
  categoryKey: 'month',
};

describe('ChartSkeleton', () => {
  it('is a busy status region with the given name and decorative bars', () => {
    const { container } = render(<ChartSkeleton label="Loading chart" />);
    expect(screen.getByRole('status', { name: 'Loading chart' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0);
  });
});

describe('ChartEmpty', () => {
  it('shows the message', () => {
    render(<ChartEmpty label="No data to display" />);
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });
});

describe('ChartDataTableView', () => {
  it('lays out a caption, category and series headers and formatted cells', () => {
    render(
      <ChartDataTableView
        table={{ ...table, categoryLabel: 'Month', caption: 'Monthly' }}
        config={config}
        fallbackCaption="Chart data"
        fallbackCategory="Category"
      />,
    );
    const view = screen.getByRole('table', { name: 'Monthly' });
    expect(within(view).getByRole('columnheader', { name: 'Month' })).toBeInTheDocument();
    expect(within(view).getByRole('columnheader', { name: 'Cost' })).toBeInTheDocument();
    expect(within(view).getByRole('cell', { name: '1,200' })).toBeInTheDocument();
    expect(within(view).getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument();
  });

  it('falls back to the localised caption and category', () => {
    renderWithLocale(
      <ChartDataTableView
        table={table}
        config={config}
        fallbackCaption="بيانات المخطط"
        fallbackCategory="الفئة"
      />,
      { locale: 'ar' },
    );
    const view = screen.getByRole('table', { name: 'بيانات المخطط' });
    expect(within(view).getByRole('columnheader', { name: 'الفئة' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <ChartSkeleton label="Loading chart" />
        <ChartEmpty label="Nothing" />
        <ChartDataTableView
          table={table}
          config={config}
          fallbackCaption="Chart data"
          fallbackCategory="Category"
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
