import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChartPie01 } from '@/components/blocks/chart-pie-01';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

/** jsdom has no layout: report a fixed size the way a real ResizeObserver would. */
class SizedResizeObserver {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    const contentRect = new DOMRect(0, 0, 240, 240);
    this.callback(
      [
        {
          target,
          contentRect,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this,
    );
  }
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', SizedResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const slices = [
  { id: 'a', value: 30 },
  { id: 'b', value: 70 },
];

describe('ChartPie01', () => {
  it('renders the sample with the total in the centre and a legend list', () => {
    const { container } = renderWithLocale(<ChartPie01 />);
    expect(screen.getByRole('heading', { name: 'Traffic sources' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart-pie-center"]')).toHaveTextContent('10,840');
    expect(container.querySelector('[data-slot="chart-pie-center"]')).toHaveTextContent('Total');
    const list = screen.getByRole('list', { name: 'Breakdown' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(within(list).getByText('Search')).toBeInTheDocument();
    expect(within(list).getByText('40.1%')).toBeInTheDocument();
    // The slices animate in, so only assert that the donut itself is drawn.
    expect(container.querySelectorAll('.recharts-pie-sector').length).toBeGreaterThan(0);
  });

  it('gives screen readers a summary and a data table', () => {
    renderWithLocale(<ChartPie01 />);
    expect(screen.getByRole('img', { name: 'Traffic sources' })).toHaveAccessibleDescription(
      /^Total 10,840\. Search 4,350 \(40\.1%\)/,
    );
    const table = screen.getByRole('table', { name: 'Chart data' });
    expect(within(table).getByRole('rowheader', { name: 'Direct' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '2,890' })).toBeInTheDocument();
  });

  it('takes caller slices, names them from the config and allows a custom centre', () => {
    const { container } = renderWithLocale(
      <ChartPie01
        title="Plans"
        slices={slices}
        config={{ a: { label: 'Free' }, b: { label: 'Pro' } }}
        centerValue="$1.2k"
        centerLabel="Revenue"
      />,
    );
    expect(screen.getByRole('list', { name: 'Breakdown' })).toHaveTextContent('Free');
    expect(container.querySelector('[data-slot="chart-pie-center"]')).toHaveTextContent('$1.2k');
    expect(container.querySelector('[data-slot="chart-pie-center"]')).toHaveTextContent('Revenue');
    expect(screen.queryByText('Based on the last 30 days')).not.toBeInTheDocument();
  });

  it('falls back to the slice id as the name when no config is given', () => {
    renderWithLocale(<ChartPie01 title="Plans" slices={slices} />);
    expect(screen.getByRole('list', { name: 'Breakdown' })).toHaveTextContent('a');
  });

  it('shows a loading skeleton in place of the chart and the list', () => {
    const { container } = renderWithLocale(<ChartPie01 loading />);
    expect(screen.getByRole('status', { name: 'Loading chart' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart-pie-center"]')).toBeNull();
  });

  it('shows the empty state for no slices', () => {
    renderWithLocale(<ChartPie01 slices={[]} />);
    expect(screen.getByText('No data to display')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    const onRetry = vi.fn();
    renderWithLocale(<ChartPie01 error onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders Arabic labels with Latin digits', () => {
    const { container } = renderWithLocale(<ChartPie01 />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'مصادر الزيارات' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart-pie-center"]')).toHaveTextContent('10,840');
    expect(container.querySelector('[data-slot="chart-pie-center"]')).toHaveTextContent('الإجمالي');
    expect(screen.getByRole('list', { name: 'التفصيل' })).toHaveTextContent('البحث');
    expect(screen.getByRole('img', { name: 'مصادر الزيارات' })).toHaveAccessibleDescription(
      /^الإجمالي 10,840/,
    );
  });

  it('has no axe violations in any state', async () => {
    const { container, rerender } = renderWithLocale(<ChartPie01 />);
    await expectNoA11yViolations(container);
    rerender(<ChartPie01 loading />);
    await expectNoA11yViolations(container);
    rerender(<ChartPie01 slices={[]} />);
    await expectNoA11yViolations(container);
    rerender(<ChartPie01 error />);
    await expectNoA11yViolations(container);
  });
});
