import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChartBar01 } from '@/components/blocks/chart-bar-01';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

/** jsdom has no layout: report a fixed size the way a real ResizeObserver would. */
class SizedResizeObserver {
  private readonly callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    const contentRect = new DOMRect(0, 0, 400, 240);
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

const data = [
  { month: 'Jan', web: 100, app: 40 },
  { month: 'Feb', web: 300, app: 90 },
  { month: 'Mar', web: 200, app: 60 },
];

describe('ChartBar01', () => {
  it('renders the sample with title, trend, summary and data table', () => {
    const { container } = renderWithLocale(<ChartBar01 />);
    expect(screen.getByRole('heading', { name: 'Sessions by device' })).toBeInTheDocument();
    expect(screen.getByText('Up 5.2% this month')).toBeInTheDocument();
    const chart = screen.getByRole('img', { name: 'Sessions by device' });
    expect(chart).toHaveAccessibleDescription(/Desktop: from 186 in Jan/);
    const table = screen.getByRole('table', { name: 'Chart data' });
    expect(within(table).getByRole('cell', { name: '314' })).toBeInTheDocument();
    expect(container.querySelector('.recharts-bar-rectangle')).toBeInTheDocument();
  });

  it('plots caller data and derives the series from it', () => {
    renderWithLocale(<ChartBar01 title="Signups" data={data} />);
    expect(screen.getByRole('heading', { name: 'Signups' })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Chart data' });
    expect(within(table).getByRole('columnheader', { name: 'web' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument();
    expect(screen.queryByText('Up 5.2% this month')).not.toBeInTheDocument();
  });

  it('accepts a custom category key, summary and series labels', () => {
    renderWithLocale(
      <ChartBar01
        title="Signups"
        data={[{ day: 'Mon', web: 5 }]}
        xKey="day"
        config={{ web: { label: 'Website' } }}
        summary="Five signups on Monday."
      />,
    );
    expect(screen.getByRole('img', { name: 'Signups' })).toHaveAccessibleDescription(
      'Five signups on Monday.',
    );
    expect(screen.getByRole('columnheader', { name: 'Website' })).toBeInTheDocument();
  });

  it('shows a loading skeleton', () => {
    renderWithLocale(<ChartBar01 loading />);
    expect(screen.getByRole('status', { name: 'Loading chart' })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the empty state for no rows', () => {
    renderWithLocale(<ChartBar01 data={[]} />);
    expect(screen.getByText('No data to display')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows an error with retry', async () => {
    const onRetry = vi.fn();
    renderWithLocale(<ChartBar01 error="HTTP 500" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('draws a bar per series and category, grouped or stacked', () => {
    const { container, rerender } = renderWithLocale(<ChartBar01 />);
    expect(container.querySelectorAll('.recharts-bar-rectangle').length).toBe(12);
    rerender(<ChartBar01 stacked />);
    expect(container.querySelectorAll('.recharts-bar-rectangle').length).toBe(12);
  });

  it('renders the Arabic sample with Latin digits and a right-to-left summary', () => {
    renderWithLocale(<ChartBar01 />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'الجلسات حسب الجهاز' })).toBeInTheDocument();
    expect(screen.getByText('ارتفاع بنسبة 5.2% هذا الشهر')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'الجلسات حسب الجهاز' })).toHaveAccessibleDescription(
      /من 186 في يناير/,
    );
  });

  it('has no axe violations in any state', async () => {
    const { container, rerender } = renderWithLocale(<ChartBar01 />);
    await expectNoA11yViolations(container);
    rerender(<ChartBar01 loading />);
    await expectNoA11yViolations(container);
    rerender(<ChartBar01 data={[]} />);
    await expectNoA11yViolations(container);
    rerender(<ChartBar01 error />);
    await expectNoA11yViolations(container);
  });
});
