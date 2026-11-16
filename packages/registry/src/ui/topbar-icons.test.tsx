import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BellIcon, GlobeIcon } from '@/components/ui/topbar-icons';
import { expectNoA11yViolations } from '@/test/a11y';

describe('topbar icons', () => {
  it.each([
    ['BellIcon', BellIcon],
    ['GlobeIcon', GlobeIcon],
  ])('%s is decorative by default and follows the icon size contract', (_name, Icon) => {
    const { container } = render(<Icon className="size-5" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveClass('size-5', 'shrink-0');
  });

  it('can carry a name when labelled', async () => {
    render(<BellIcon aria-label="Alerts" />);
    expect(screen.getByRole('img', { name: 'Alerts' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });
});
