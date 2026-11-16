import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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

  // Base UI mounts a scrollbar only while the content overflows, which jsdom
  // never reports; keepMounted lets us assert the classes the component adds.
  it('fades a scrollbar in on hover by default', () => {
    render(
      <ScrollAreaPrimitive.Root>
        <ScrollBar keepMounted />
      </ScrollAreaPrimitive.Root>,
    );
    const bar = document.querySelector('[data-slot="scroll-area-scrollbar"]');
    expect(bar).toHaveAttribute('data-visibility', 'hover');
    expect(bar).toHaveClass('opacity-0', 'data-[hovering]:opacity-100');
  });

  it('alwaysVisible keeps the scrollbar visible', () => {
    render(
      <ScrollAreaPrimitive.Root>
        <ScrollBar keepMounted alwaysVisible orientation="horizontal" />
      </ScrollAreaPrimitive.Root>,
    );
    const bar = document.querySelector('[data-slot="scroll-area-scrollbar"]');
    expect(bar).toHaveAttribute('data-visibility', 'always');
    expect(bar).toHaveClass('opacity-100', 'h-2.5');
    expect(bar).not.toHaveClass('opacity-0');
  });

  it('accepts scrollbars="always" and "hover" on the ScrollArea', () => {
    const { rerender } = render(
      <ScrollArea scrollbars="always" orientation="both" className="h-40">
        <Content />
      </ScrollArea>,
    );
    expect(screen.getByText('Row 3')).toBeInTheDocument();
    rerender(
      <ScrollArea scrollbars="hover" className="h-40">
        <Content />
      </ScrollArea>,
    );
    expect(screen.getByText('Row 3')).toBeInTheDocument();
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
