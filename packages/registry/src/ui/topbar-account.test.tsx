import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { TopbarContext, type TopbarVariant } from '@/components/ui/topbar';
import { TopbarAccount } from '@/components/ui/topbar-account';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function account(
  variant: TopbarVariant = 'sidebar',
  onSignOut = vi.fn(),
  locale: 'en' | 'ar' = 'en',
) {
  renderWithLocale(
    <TopbarContext value={variant}>
      <TopbarAccount
        name={locale === 'ar' ? 'ليلى حسن' : 'Layla Hassan'}
        role="Operations manager"
        detail="Operations manager • Main depot"
      >
        <DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
      </TopbarAccount>
    </TopbarContext>,
    { locale },
  );
  return onSignOut;
}

describe('TopbarAccount', () => {
  it('is a soft chip with the avatar, name and role; the name hides on phones', () => {
    account('sidebar');
    const trigger = screen.getByRole('button', { name: 'Account menu for Layla Hassan' });
    expect(trigger).toHaveClass('bg-sidebar-accent', 'min-h-11', 'rounded-lg');
    expect(screen.getByText('Layla Hassan').parentElement).toHaveClass('max-md:sr-only');
    expect(screen.getByText('Operations manager')).toBeInTheDocument();
  });

  it('opens a menu whose header repeats the name and detail above the entries', async () => {
    const onSignOut = account();
    await userEvent.click(screen.getByRole('button'));
    const menu = await screen.findByRole('menu');
    expect(menu).toHaveTextContent('Operations manager • Main depot');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('dresses to each bar variant', () => {
    account('surface');
    expect(screen.getByRole('button')).toHaveClass('bg-primary-light');
  });

  it('uses the 44px bordered chip with a square avatar in the hr bar', () => {
    account('hr');
    expect(screen.getByRole('button')).toHaveClass('h-11', 'border-stroke', 'bg-surface-dim');
  });

  it('works in Arabic', async () => {
    account('sidebar', vi.fn(), 'ar');
    expect(screen.getByRole('button', { name: 'قائمة حساب ليلى حسن' })).toBeInTheDocument();
    expect(screen.getByText('ليلى حسن')).toHaveAttribute('dir', 'auto');
  });

  it('has no axe violations closed and open', async () => {
    account();
    await expectNoA11yViolations();
    await userEvent.click(screen.getByRole('button'));
    await screen.findByRole('menu');
    await expectNoA11yViolations(document.body);
  });
});
