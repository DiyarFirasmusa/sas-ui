import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, TabsContent, TabsList, TabsTrigger, type TabsProps } from '@/components/ui/tabs';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example({
  variant,
  onValueChange,
}: {
  variant?: TabsProps['variant'];
  onValueChange?: (value: unknown) => void;
}) {
  return (
    <Tabs defaultValue="account" variant={variant} onValueChange={onValueChange}>
      <TabsList aria-label="Settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="team" disabled>
          Team
        </TabsTrigger>
        <TabsTrigger value="api">API</TabsTrigger>
      </TabsList>
      <TabsContent value="account">Account panel</TabsContent>
      <TabsContent value="billing">Billing panel</TabsContent>
      <TabsContent value="api">API panel</TabsContent>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('shows the default panel and switches on click', async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Account panel');
    await userEvent.click(screen.getByRole('tab', { name: 'Billing' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Billing panel');
    expect(onValueChange).toHaveBeenCalledWith('billing', expect.anything());
  });

  it('moves between tabs with the arrow keys; disabled tabs stay focusable but inert', async () => {
    render(<Example />);
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Billing' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Team' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'API' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'API' })).toHaveFocus();
  });

  it('mirrors arrow keys in Arabic', async () => {
    renderWithLocale(<Example />, { locale: 'ar' });
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Billing' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveFocus();
  });

  it('lets dir override the locale for keys and layout', async () => {
    render(
      <Tabs defaultValue="a" dir="rtl">
        <TabsList aria-label="x">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b">B</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveFocus();
    expect(screen.getByRole('tablist').parentElement).toHaveAttribute('dir', 'rtl');
  });

  it('does not select a disabled tab', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('tab', { name: 'Team' }));
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('aria-selected', 'true');
  });

  it('marks the active tab for both variants and keeps the list scrollable', () => {
    const { rerender } = render(<Example variant="underline" />);
    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('overflow-x-auto');
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveClass('border-b-2');
    rerender(<Example variant="pill" />);
    expect(screen.getByRole('tablist')).toHaveClass('rounded-pill', 'border', 'bg-surface');
    expect(screen.getByRole('tab', { name: 'Account' })).toHaveAttribute('data-active');
  });

  it('uses a logical-border indicator, so it needs no RTL special case', () => {
    renderWithLocale(<Example variant="underline" />, { locale: 'ar' });
    const tab = screen.getByRole('tab', { name: 'Account' });
    expect(tab.className).not.toMatch(/(?:^|\s)(?:left|right|border-l|border-r)-/);
  });

  it('has no axe violations in either variant', async () => {
    const { rerender } = render(<Example />);
    await expectNoA11yViolations();
    rerender(<Example variant="pill" />);
    await expectNoA11yViolations();
  });
});
