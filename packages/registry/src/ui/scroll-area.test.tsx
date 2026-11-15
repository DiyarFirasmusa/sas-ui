import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { ScrollArea } from '@/components/ui/scroll-area';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

// jsdom has no Web Animations API; Base UI's scroll viewport asks for it.
beforeAll(() => {
  Element.prototype.getAnimations ??= () => [];
});

function Content() {
  return (
    <ul>
      {Array.from({ length: 30 }, (_, index) => (
        <li key={index}>Row {index}</li>
      ))}
    </ul>
  );
}

describe('ScrollArea', () => {
  it('renders its content inside a named viewport', () => {
    render(
      <ScrollArea className="h-40" viewportProps={{ 'aria-label': 'Results' }}>
        <Content />
      </ScrollArea>,
    );
    const viewport = screen.getByLabelText('Results');
    expect(viewport).toHaveAttribute('data-slot', 'scroll-area-viewport');
    // Base UI makes it focusable (tabindex 0) only while content overflows; jsdom has no layout.
    expect(viewport).toHaveAttribute('tabindex');
    expect(screen.getByText('Row 3')).toBeInTheDocument();
  });

  it('merges className on the root and the viewport', () => {
    const { container } = render(
      <ScrollArea className="h-40" viewportProps={{ className: 'p-2' }}>
        <Content />
      </ScrollArea>,
    );
    expect(container.querySelector('[data-slot="scroll-area"]')).toHaveClass('h-40', 'relative');
    expect(container.querySelector('[data-slot="scroll-area-viewport"]')).toHaveClass(
      'p-2',
      'size-full',
    );
  });

  it('follows the Arabic locale direction', () => {
    const { container } = renderWithLocale(
      <ScrollArea orientation="both">
        <Content />
      </ScrollArea>,
      { locale: 'ar' },
    );
    expect(container.querySelector('[data-slot="scroll-area"]')).toHaveAttribute('dir', 'rtl');
  });

  it('lets dir override the locale', () => {
    const { container } = renderWithLocale(
      <ScrollArea dir="ltr">
        <Content />
      </ScrollArea>,
      { locale: 'ar' },
    );
    expect(container.querySelector('[data-slot="scroll-area"]')).toHaveAttribute('dir', 'ltr');
  });

  it('has no axe violations', async () => {
    render(
      <ScrollArea className="h-40" viewportProps={{ 'aria-label': 'Results' }}>
        <Content />
      </ScrollArea>,
    );
    await expectNoA11yViolations();
  });
});
