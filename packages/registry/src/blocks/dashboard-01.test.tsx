import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard01 } from '@/components/blocks/dashboard-01';
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

describe('Dashboard01', () => {
  it('renders the sample: KPIs, both charts, activity and the records table', () => {
    renderWithLocale(<Dashboard01 />);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
    expect(screen.getAllByText(/^(Revenue|Orders|New customers|Refund rate)$/)).not.toHaveLength(0);
    const stats = document.querySelectorAll('[data-slot="stat-card"]');
    expect(stats).toHaveLength(4);
    expect(screen.getByText('$48,250')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Revenue' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sales by category' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Latest orders' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Revenue' })).toBeInTheDocument();
  });

  it('switches the revenue range and reports it', async () => {
    const onRangeChange = vi.fn();
    renderWithLocale(<Dashboard01 onRangeChange={onRangeChange} />);
    const tabs = screen.getByRole('tablist', { name: 'Time range' });
    expect(within(tabs).getByRole('tab', { name: '30 days' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Daily revenue over the last 30 days')).toBeInTheDocument();
    await userEvent.click(within(tabs).getByRole('tab', { name: '7 days' }));
    expect(onRangeChange).toHaveBeenCalledWith('7d');
    expect(screen.getByText('Daily revenue over the last 7 days')).toBeInTheDocument();
    // Hidden chart tables: revenue (header + 7 days) and categories (header + 5).
    const rows = screen
      .getAllByRole('table', { name: 'Chart data' })
      .flatMap((table) => within(table).getAllByRole('row'));
    expect(rows).toHaveLength(8 + 6);
  });

  it('can be controlled and keeps the selected range', async () => {
    renderWithLocale(<Dashboard01 range="90d" />);
    expect(screen.getByRole('tab', { name: '90 days' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/^Up .*% on the previous 90 days$/)).toBeInTheDocument();
  });

  it('shows skeletons in every section while loading', () => {
    renderWithLocale(<Dashboard01 loading />);
    expect(document.querySelectorAll('[data-slot="stat-card"][aria-busy="true"]')).toHaveLength(4);
    expect(screen.getAllByRole('status', { name: 'Loading chart' })).toHaveLength(2);
    expect(screen.queryByRole('table', { name: 'Latest orders' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('status', { name: 'Loading' }).length).toBeGreaterThan(0);
  });

  it('shows the empty state of each section for empty data', () => {
    renderWithLocale(
      <Dashboard01 stats={[]} revenue={[]} categories={[]} activity={[]} records={[]} />,
    );
    expect(document.querySelectorAll('[data-slot="stat-card"]')).toHaveLength(0);
    expect(screen.getAllByText('No data to display')).toHaveLength(2);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(screen.getByText('No orders yet')).toBeInTheDocument();
  });

  it('replaces the sections with a retryable error', async () => {
    const onRetry = vi.fn();
    renderWithLocale(<Dashboard01 error="HTTP 503" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByText('HTTP 503')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('passes record clicks through', async () => {
    const onRecordClick = vi.fn();
    renderWithLocale(<Dashboard01 onRecordClick={onRecordClick} />);
    await userEvent.click(screen.getByRole('button', { name: '#4821' }));
    expect(onRecordClick).toHaveBeenCalledWith(expect.objectContaining({ id: '#4821' }));
  });

  it('renders Arabic labels, mirrored for right-to-left, with Latin digits', () => {
    renderWithLocale(<Dashboard01 />, { locale: 'ar' });
    expect(screen.getByRole('heading', { level: 1, name: 'نظرة عامة' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'المدى الزمني' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '30 يوماً' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'أحدث الطلبات' })).toBeInTheDocument();
    expect(screen.getByText('$48,250')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'المبيعات حسب الفئة' })).toBeInTheDocument();
  });

  it('has no axe violations in any state', async () => {
    const { container, rerender } = renderWithLocale(<Dashboard01 />);
    await expectNoA11yViolations(container);
    rerender(<Dashboard01 loading />);
    await expectNoA11yViolations(container);
    rerender(<Dashboard01 stats={[]} revenue={[]} categories={[]} activity={[]} records={[]} />);
    await expectNoA11yViolations(container);
    rerender(<Dashboard01 error />);
    await expectNoA11yViolations(container);
  });
});
