import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SidebarRailTooltip } from '@/components/ui/sidebar-rail-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Rail() {
  return (
    <TooltipProvider delay={0}>
      <SidebarRailTooltip label="Inventory">
        <a href="/inventory" aria-label="Inventory">
          I
        </a>
      </SidebarRailTooltip>
    </TooltipProvider>
  );
}

describe('SidebarRailTooltip', () => {
  it('shows the name on hover and hides it again, leaving the link intact', async () => {
    render(<Rail />);
    const link = screen.getByRole('link', { name: 'Inventory' });
    expect(
      screen.queryByText('Inventory', { selector: '[data-slot="tooltip-content"]' }),
    ).toBeNull();
    await userEvent.hover(link);
    expect(
      await screen.findByText('Inventory', { selector: '[data-slot="tooltip-content"]' }),
    ).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/inventory');
    await userEvent.unhover(link);
    await waitFor(() =>
      expect(
        screen.queryByText('Inventory', { selector: '[data-slot="tooltip-content"]' }),
      ).toBeNull(),
    );
  });

  it('opens on keyboard focus', async () => {
    render(<Rail />);
    await userEvent.tab();
    expect(
      await screen.findByText('Inventory', { selector: '[data-slot="tooltip-content"]' }),
    ).toBeInTheDocument();
  });

  it('places the tooltip on the inline-end side and works in Arabic', async () => {
    renderWithLocale(
      <TooltipProvider delay={0}>
        <SidebarRailTooltip label="المخزون">
          <a href="/inventory" aria-label="المخزون">
            م
          </a>
        </SidebarRailTooltip>
      </TooltipProvider>,
      { locale: 'ar' },
    );
    await userEvent.hover(screen.getByRole('link', { name: 'المخزون' }));
    const tip = await screen.findByText('المخزون', { selector: '[data-slot="tooltip-content"]' });
    expect(tip.closest('[data-side]')).toHaveAttribute('data-side');
  });

  it('has no axe violations', async () => {
    render(<Rail />);
    await expectNoA11yViolations();
  });
});
