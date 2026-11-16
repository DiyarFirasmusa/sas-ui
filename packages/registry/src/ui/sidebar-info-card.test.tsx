import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SidebarInfoCard } from '@/components/ui/sidebar-info-card';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('SidebarInfoCard', () => {
  it('shows the subtitle above the title on the light brand tint', () => {
    render(<SidebarInfoCard title="Head office" subtitle="Current entity · Erbil" />);
    const element = document.querySelector('[data-slot="sidebar-info-card"]');
    expect(element).toHaveClass('bg-primary-light', 'text-text-primary', 'rounded-xl');
    expect(screen.getByText('Current entity · Erbil')).toBeInTheDocument();
    expect(screen.getByText('Head office')).toHaveClass('text-h5');
  });

  it('omits the subtitle when there is none', () => {
    render(<SidebarInfoCard title="Head office" />);
    expect(card()?.querySelectorAll('p')).toHaveLength(1);
  });

  it('lets Arabic text pick its own direction and truncates long names', () => {
    renderWithLocale(<SidebarInfoCard title="المكتب الرئيسي" subtitle="الكيان الحالي" />, {
      locale: 'ar',
    });
    expect(screen.getByText('المكتب الرئيسي')).toHaveAttribute('dir', 'auto');
    expect(screen.getByText('المكتب الرئيسي')).toHaveClass('truncate');
  });

  it('has no axe violations', async () => {
    render(<SidebarInfoCard title="Head office" subtitle="Current entity" />);
    await expectNoA11yViolations();
  });
});

function card() {
  return document.querySelector('[data-slot="sidebar-info-card"]');
}
