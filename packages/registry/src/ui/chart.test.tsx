import { render, screen, within } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChartConfigProvider,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChartAxes,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/lib/chart';
import { LocaleProvider } from '@/lib/locale';
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
      [{ target, contentRect, borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] }],
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

const config: ChartConfig = {
  sales: { label: 'Sales' },
  cost: { label: 'Cost', color: 'var(--danger)' },
};

const data = [
  { month: 'Jan', sales: 1200, cost: 800 },
  { month: 'Feb', sales: 1800, cost: 950 },
];

function SalesChart(props: Partial<React.ComponentProps<typeof ChartContainer>>) {
  return (
    <ChartContainer
      config={config}
      label="Sales vs cost"
      initialDimension={{ width: 400, height: 240 }}
      {...props}
    >
      <BarChart data={data} accessibilityLayer={false}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="sales" fill="var(--color-sales)" />
        <Bar dataKey="cost" fill="var(--color-cost)" />
      </BarChart>
    </ChartContainer>
  );
}

describe('ChartContainer', () => {
  it('exposes the chart as a named image', () => {
    render(<SalesChart />);
    expect(screen.getByRole('img', { name: 'Sales vs cost' })).toBeInTheDocument();
  });

  it('renders the recharts surface at the initial size', () => {
    const { container } = render(<SalesChart />);
    expect(container.querySelector('svg.recharts-surface')).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-bar-rectangle').length).toBeGreaterThan(0);
  });

  it('injects one CSS variable per series, defaulting to the chart palette', () => {
    const { container } = render(<SalesChart id="sales" />);
    const style = container.querySelector('style');
    expect(style?.textContent).toContain('[data-chart=chart-sales]');
    expect(style?.textContent).toContain('--color-sales: var(--chart-1);');
    expect(style?.textContent).toContain('--color-cost: var(--danger);');
    expect(container.querySelector('[data-chart=chart-sales]')).toBeInTheDocument();
  });

  it('describes the chart with a summary for screen readers', () => {
    render(<SalesChart summary="Sales grew from 1,200 to 1,800." />);
    expect(screen.getByRole('img', { name: 'Sales vs cost' })).toHaveAccessibleDescription(
      'Sales grew from 1,200 to 1,800.',
    );
  });

  it('can add a hidden data table with formatted numbers', () => {
    render(<SalesChart dataTable={{ data, categoryKey: 'month', categoryLabel: 'Month' }} />);
    const table = screen.getByRole('table', { name: 'Chart data' });
    expect(within(table).getByRole('columnheader', { name: 'Month' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Sales' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '1,800' })).toBeInTheDocument();
    expect(within(table).getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument();
  });

  it('shows a loading skeleton instead of the chart', () => {
    render(<SalesChart loading />);
    const status = screen.getByRole('status', { name: 'Loading chart' });
    expect(status).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the empty state, with an overridable message', () => {
    const { rerender } = render(<SalesChart empty />);
    expect(screen.getByText('No data to display')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    rerender(<SalesChart empty emptyLabel="Nothing yet" />);
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });

  it('localises its strings in Arabic', () => {
    const { rerender } = renderWithLocale(<SalesChart label={undefined} loading />, { locale: 'ar' });
    expect(screen.getByRole('status', { name: 'جارٍ تحميل المخطط' })).toBeInTheDocument();
    rerender(<SalesChart label={undefined} empty />);
    expect(screen.getByText('لا توجد بيانات للعرض')).toBeInTheDocument();
  });

  it('has no axe violations in any state', async () => {
    const { rerender } = render(
      <SalesChart summary="Summary" dataTable={{ data, categoryKey: 'month' }} />,
    );
    await expectNoA11yViolations();
    rerender(<SalesChart loading />);
    await expectNoA11yViolations();
    rerender(<SalesChart empty />);
    await expectNoA11yViolations();
  });
});

describe('ChartContainer with the recharts keyboard layer', () => {
  it('has no axe violations when recharts adds its focusable accessibility layer', async () => {
    render(
      <ChartContainer config={config} initialDimension={{ width: 400, height: 240 }}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <Bar dataKey="sales" fill="var(--color-sales)" />
        </BarChart>
      </ChartContainer>,
    );
    await expectNoA11yViolations();
  });
});

describe('ChartTooltipContent', () => {
  const payload = [
    { name: 'sales', dataKey: 'sales', value: 1234567, color: 'var(--color-sales)' },
    { name: 'cost', dataKey: 'cost', value: 'n/a', color: 'var(--color-cost)' },
  ];

  it('renders nothing when inactive or empty', () => {
    const { container, rerender } = render(
      <ChartConfigProvider config={config}>
        <ChartTooltipContent active={false} payload={payload} />
      </ChartConfigProvider>,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(
      <ChartConfigProvider config={config}>
        <ChartTooltipContent active payload={[]} />
      </ChartConfigProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('labels rows from the config and formats numbers with Latin digits', () => {
    // recharts leaves a text-measurement span in <body>, so query within the render.
    const { container } = render(
      <ChartConfigProvider config={config}>
        <ChartTooltipContent active payload={payload} label="Jan" />
      </ChartConfigProvider>,
    );
    expect(within(container).getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
    expect(screen.getByText('Cost')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('keeps numbers left-to-right inside an RTL tooltip', () => {
    renderWithLocale(
      <ChartConfigProvider config={config}>
        <ChartTooltipContent active payload={payload} label="Jan" />
      </ChartConfigProvider>,
      { locale: 'ar' },
    );
    expect(screen.getByText('1,234,567')).toHaveAttribute('dir', 'ltr');
  });

  it('supports a custom label and value formatter, and hiding label and indicator', () => {
    const { container } = render(
      <ChartConfigProvider config={config}>
        <ChartTooltipContent
          active
          payload={payload.slice(0, 1)}
          label="Jan"
          labelFormatter={(label) => `Month: ${String(label)}`}
          valueFormatter={(value) => `${String(value)} SAR`}
          hideIndicator
        />
      </ChartConfigProvider>,
    );
    expect(screen.getByText('Month: Jan')).toBeInTheDocument();
    expect(screen.getByText('1234567 SAR')).toBeInTheDocument();
    expect(container.querySelector('[data-indicator]')).not.toBeInTheDocument();
  });

  it('draws the series colour on the indicator', () => {
    const { container } = render(
      <ChartConfigProvider config={config}>
        <ChartTooltipContent active payload={payload.slice(0, 1)} indicator="line" />
      </ChartConfigProvider>,
    );
    const indicator = container.querySelector('[data-indicator="line"]');
    expect(indicator).toHaveStyle({ backgroundColor: 'var(--color-sales)' });
  });

  it('works without a config using the item name', () => {
    render(<ChartTooltipContent active payload={[{ name: 'Visits', value: 5 }]} />);
    expect(screen.getByText('Visits')).toBeInTheDocument();
  });

  it('names rows from a payload field via nameKey', () => {
    const pie: ChartConfig = { chrome: { label: 'Chrome' } };
    render(
      <ChartConfigProvider config={pie}>
        <ChartTooltipContent
          active
          nameKey="browser"
          payload={[{ dataKey: 'visitors', value: 90, payload: { browser: 'chrome', fill: 'red' } }]}
        />
      </ChartConfigProvider>,
    );
    expect(screen.getByText('Chrome')).toBeInTheDocument();
  });
});

describe('ChartLegendContent', () => {
  const payload = [
    { value: 'sales', dataKey: 'sales', color: 'var(--color-sales)' },
    { value: 'cost', dataKey: 'cost', color: 'var(--color-cost)' },
  ];

  it('lists the configured series labels', () => {
    render(
      <ChartConfigProvider config={config}>
        <ChartLegendContent payload={payload} />
      </ChartConfigProvider>,
    );
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Sales', 'Cost']);
  });

  it('renders nothing for an empty payload', () => {
    const { container } = render(<ChartLegendContent payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('can hide the colour keys', () => {
    const { container } = render(
      <ChartConfigProvider config={config}>
        <ChartLegendContent payload={payload} hideIcon />
      </ChartConfigProvider>,
    );
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('uses a custom series icon', () => {
    const iconConfig: ChartConfig = {
      sales: { label: 'Sales', icon: () => <svg data-testid="icon" /> },
    };
    render(
      <ChartConfigProvider config={iconConfig}>
        <ChartLegendContent payload={payload.slice(0, 1)} />
      </ChartConfigProvider>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});

describe('useChartAxes', () => {
  it('follows the language direction', () => {
    const wrapper = (locale: 'en' | 'ar') =>
      function Wrapper({ children }: { children: React.ReactNode }) {
        return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
      };
    const en = renderHook(() => useChartAxes(), { wrapper: wrapper('en') });
    expect(en.result.current.yAxis.orientation).toBe('left');
    expect(en.result.current.xAxis.reversed).toBe(false);
    const ar = renderHook(() => useChartAxes(), { wrapper: wrapper('ar') });
    expect(ar.result.current.yAxis.orientation).toBe('right');
    expect(ar.result.current.xAxis.reversed).toBe(true);
    const arCategorical = renderHook(() => useChartAxes({ reverseTime: false }), {
      wrapper: wrapper('ar'),
    });
    expect(arCategorical.result.current.xAxis.reversed).toBe(false);
  });
});
