import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  BellIcon,
  LanguagesIcon,
  LogOutIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from '@/components/blocks/block-icons';
import { expectNoA11yViolations } from '@/test/a11y';

const ICONS = [BellIcon, LanguagesIcon, LogOutIcon, TrendingDownIcon, TrendingUpIcon];

describe('block icons', () => {
  it('are decorative unless labelled', () => {
    const { container } = render(
      <>
        {ICONS.map((Icon, index) => (
          <Icon key={index} />
        ))}
      </>,
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(ICONS.length);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('expose a name when labelled', () => {
    render(<BellIcon aria-label="Notifications" />);
    expect(screen.getByRole('img', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('mirrors only the directional glyph in right-to-left', () => {
    const { container } = render(
      <>
        <LogOutIcon />
        <BellIcon />
      </>,
    );
    const [logout, bell] = Array.from(container.querySelectorAll('svg'));
    expect(logout?.getAttribute('class')).toContain('rtl:-scale-x-100');
    expect(bell?.getAttribute('class')).not.toContain('rtl:-scale-x-100');
  });

  it('has no axe violations', async () => {
    const { container } = render(<BellIcon aria-label="Notifications" />);
    await expectNoA11yViolations(container);
  });
});
