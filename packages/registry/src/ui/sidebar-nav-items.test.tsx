import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  containsActive,
  CountBadge,
  NavNode,
  type NavContext,
} from '@/components/ui/sidebar-nav-items';
import type { NavItem } from '@/lib/nav-utils';
import { expectNoA11yViolations } from '@/test/a11y';

function context(overrides: Partial<NavContext> = {}): NavContext {
  return {
    layout: 'default',
    activeId: null,
    exactActive: true,
    expanded: [],
    renderLink: ({ children, ...props }) => <a {...props}>{children}</a>,
    onToggle: vi.fn(),
    onOpen: vi.fn(),
    onNavigate: vi.fn(),
    toggleLabel: 'Toggle',
    ...overrides,
  };
}

const group: NavItem = {
  id: 'sales',
  label: 'Sales',
  href: '/sales',
  badge: 1,
  children: [{ id: 'orders', label: 'Orders', href: '/sales/orders', badge: 4 }],
};

describe('sidebar nav rows', () => {
  it('finds an active page below a group', () => {
    expect(containsActive(group, 'orders')).toBe(true);
    expect(containsActive(group, 'other')).toBe(false);
    expect(containsActive(group, null)).toBe(false);
  });

  it('draws a count pill that caps at 99+ and hides at zero', () => {
    const { rerender } = render(<CountBadge count={120} />);
    expect(screen.getByText('99+')).toHaveClass(
      'bg-primary',
      'text-primary-foreground',
      'rounded-pill',
    );
    rerender(<CountBadge count={0} />);
    expect(document.querySelector('[data-slot="sidebar-badge"]')).toBeNull();
  });

  it('splits a group that is also a link into its link and a labelled toggle', async () => {
    const ctx = context({ expanded: ['sales'] });
    render(
      <ul>
        <NavNode item={group} depth={0} context={ctx} />
      </ul>,
    );
    expect(screen.getByRole('link', { name: /Sales/ })).toHaveAttribute('href', '/sales');
    const toggle = screen.getByRole('button', { name: 'Toggle Sales' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.parentElement).toHaveClass('bg-sidebar-accent');
    await userEvent.click(toggle);
    expect(ctx.onToggle).toHaveBeenCalledWith('sales');
    expect(screen.getByRole('link', { name: /Orders/ })).toBeInTheDocument();
  });

  it('shows the group total on a closed group and its own badge when open', () => {
    const closed = render(
      <ul>
        <NavNode item={group} depth={0} context={context()} />
      </ul>,
    );
    expect(screen.getByRole('link', { name: /Sales/ })).toHaveTextContent('5');
    closed.unmount();
    render(
      <ul>
        <NavNode item={group} depth={0} context={context({ expanded: ['sales'] })} />
      </ul>,
    );
    expect(screen.getByRole('link', { name: /Sales/ })).toHaveTextContent('1');
  });

  it('renders an item without a link as non-interactive text', () => {
    render(
      <ul>
        <NavNode item={{ id: 'x', label: 'Soon' }} depth={0} context={context()} />
      </ul>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Soon')).toBeInTheDocument();
  });

  it('marks the current location rather than page when the match is not exact', () => {
    render(
      <ul>
        <NavNode
          item={{ id: 'orders', label: 'Orders', href: '/sales/orders' }}
          depth={1}
          context={context({ activeId: 'orders', exactActive: false })}
        />
      </ul>,
    );
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('has no axe violations', async () => {
    render(
      <ul>
        <NavNode
          item={group}
          depth={0}
          context={context({ expanded: ['sales'], activeId: 'orders' })}
        />
      </ul>,
    );
    await expectNoA11yViolations();
  });
});
