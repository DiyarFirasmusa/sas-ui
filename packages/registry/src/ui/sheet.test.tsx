import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  resolveSheetSide,
  type SheetSide,
  type SheetSideInput,
} from '@/components/ui/sheet';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example({ side, closeLabel }: { side?: SheetSideInput; closeLabel?: string }) {
  return (
    <Sheet>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent side={side} closeLabel={closeLabel}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Narrow the results</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <input aria-label="Name" />
        </SheetBody>
        <SheetFooter>
          <button type="button">Apply</button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

describe('Sheet', () => {
  it('opens with an accessible name and description', async () => {
    render(<Example />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Filters' });
    expect(dialog).toHaveAccessibleDescription('Narrow the results');
  });

  it('closes with the close button and with Escape', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('uses logical placement classes for every side', async () => {
    const expected: Record<SheetSide, string[]> = {
      start: ['start-0', 'inset-y-0'],
      end: ['end-0', 'inset-y-0'],
      top: ['top-0', 'inset-x-0'],
      bottom: ['bottom-0', 'inset-x-0'],
    };
    for (const side of Object.keys(expected) as SheetSide[]) {
      const { unmount } = render(<Example side={side} />);
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveClass(...(expected[side] ?? []));
      expect(dialog).toHaveAttribute('data-side', side);
      unmount();
    }
  });

  it('slides from the correct edge in each direction', async () => {
    render(<Example side="end" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveClass(
      'data-[starting-style]:ltr:translate-x-full',
      'data-[starting-style]:rtl:-translate-x-full',
      'motion-reduce:transition-none',
    );
  });

  it('labels the close button in Arabic and honours a custom label', async () => {
    const { unmount } = renderWithLocale(<Example />, { locale: 'ar' });
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('button', { name: 'إغلاق' })).toBeInTheDocument();
    unmount();

    render(<Example closeLabel="Dismiss" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('resolves the physical left/right aliases against the direction', () => {
    expect(resolveSheetSide('left', 'ltr')).toBe('start');
    expect(resolveSheetSide('right', 'ltr')).toBe('end');
    expect(resolveSheetSide('left', 'rtl')).toBe('end');
    expect(resolveSheetSide('right', 'rtl')).toBe('start');
    expect(resolveSheetSide('inline-start', 'rtl')).toBe('start');
    expect(resolveSheetSide('inline-end', 'ltr')).toBe('end');
    expect(resolveSheetSide('top', 'rtl')).toBe('top');
  });

  it('mirrors start/end and left/right in Arabic', async () => {
    const cases: Array<[SheetSideInput, string, string]> = [
      ['right', 'start-0', 'start'],
      ['left', 'end-0', 'end'],
      ['start', 'start-0', 'start'],
      ['inline-end', 'end-0', 'end'],
    ];
    for (const [side, edgeClass, logical] of cases) {
      const { unmount } = renderWithLocale(<Example side={side} />, { locale: 'ar' });
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveClass(edgeClass);
      expect(dialog).toHaveAttribute('data-side', logical);
      expect(dialog.className).not.toMatch(/(?:^|\s)(?:left|right)-/);
      unmount();
    }
  });

  it('puts physical right at the end edge in English', async () => {
    renderWithLocale(<Example side="right" />, { locale: 'en' });
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('dialog')).toHaveAttribute('data-side', 'end');
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('dialog');
    await expectNoA11yViolations();
  });
});

describe('Sheet look', () => {
  it('uses the elevated dialog surface with a strong stroke and a blurred scrim', async () => {
    render(
      <Sheet>
        <SheetTrigger>Open</SheetTrigger>
        <SheetContent>
          <SheetTitle>Filters</SheetTitle>
          <SheetFooter>
            <button type="button">Apply</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const sheet = await screen.findByRole('dialog');
    expect(sheet).toHaveClass('bg-surface-elevated', 'border-stroke-strong');
    expect(document.querySelector('[data-slot="sheet-backdrop"]')).toHaveClass(
      'backdrop-blur-[12px]',
    );
    // The primary action sits first, at the start edge.
    expect(document.querySelector('[data-slot="sheet-footer"]')).toHaveClass('sm:justify-start');
  });
});
