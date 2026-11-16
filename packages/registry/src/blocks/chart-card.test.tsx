import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChartCard } from '@/components/blocks/chart-card';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('ChartCard', () => {
  it('renders title, description, action, content and footer', () => {
    renderWithLocale(
      <ChartCard
        title="Visitors"
        description="Per month"
        action={<button type="button">Range</button>}
        trend={{ direction: 'up', text: 'Up 5.2% this month' }}
        footnote="Last 6 months"
      >
        <p>chart body</p>
      </ChartCard>,
    );
    expect(screen.getByRole('heading', { name: 'Visitors' })).toBeInTheDocument();
    expect(screen.getByText('Per month')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Range' })).toBeInTheDocument();
    expect(screen.getByText('chart body')).toBeInTheDocument();
    expect(screen.getByText('Up 5.2% this month')).toHaveAttribute('data-direction', 'up');
    expect(screen.getByText('Last 6 months')).toBeInTheDocument();
  });

  it('colours the trend by whether the change is good news', () => {
    const { rerender } = renderWithLocale(
      <ChartCard title="T" trend={{ direction: 'down', text: 'Down' }}>
        x
      </ChartCard>,
    );
    expect(screen.getByText('Down').className).toContain('text-danger');
    rerender(
      <ChartCard title="T" trend={{ direction: 'down', text: 'Down', tone: 'positive' }}>
        x
      </ChartCard>,
    );
    expect(screen.getByText('Down').className).toContain('text-success');
    rerender(
      <ChartCard title="T" trend={{ direction: 'flat', text: 'Flat' }}>
        x
      </ChartCard>,
    );
    expect(screen.getByText('Flat').querySelector('svg')).toBeNull();
  });

  it('shows an error with retry instead of the content', async () => {
    const onRetry = vi.fn();
    renderWithLocale(
      <ChartCard title="T" error="HTTP 500" onRetry={onRetry}>
        <p>chart body</p>
      </ChartCard>,
    );
    expect(screen.queryByText('chart body')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('HTTP 500')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders the Arabic error wording', () => {
    renderWithLocale(
      <ChartCard title="الزوّار" error>
        x
      </ChartCard>,
      { locale: 'ar' },
    );
    expect(screen.getByText('حدث خطأ ما')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(
      <ChartCard title="Visitors" trend={{ direction: 'up', text: 'Up' }} footnote="Note">
        <p>body</p>
      </ChartCard>,
    );
    await expectNoA11yViolations(container);
  });
});
