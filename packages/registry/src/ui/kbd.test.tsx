import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Kbd', () => {
  it('renders a single key cap', () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText('Esc').tagName).toBe('KBD');
  });

  it('renders one cap per entry of keys, in order', () => {
    const { container } = render(<Kbd keys={['Ctrl', 'Shift', 'K']} />);
    const caps = container.querySelectorAll('[data-slot="kbd"]');
    expect([...caps].map((cap) => cap.textContent)).toEqual(['Ctrl', 'Shift', 'K']);
  });

  it('allows repeated keys', () => {
    const { container } = render(<Kbd keys={['G', 'G']} />);
    expect(container.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2);
  });

  it('stays left-to-right inside Arabic content', () => {
    const { container } = renderWithLocale(
      <p>
        اضغط <Kbd keys={['Ctrl', 'K']} /> للبحث
      </p>,
      { locale: 'ar' },
    );
    expect(container.querySelector('[data-slot="kbd-group"]')).toHaveAttribute('dir', 'ltr');
    expect(container.querySelector('[data-slot="kbd"]')).toHaveAttribute('dir', 'ltr');
  });

  it('merges className and supports KbdGroup with children', () => {
    render(
      <KbdGroup className="extra" data-testid="group">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    expect(screen.getByTestId('group')).toHaveClass('extra');
  });

  it('has no axe violations', async () => {
    render(<Kbd keys={['Ctrl', 'K']} />);
    await expectNoA11yViolations();
  });
});
