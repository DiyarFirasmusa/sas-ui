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
  type SheetSide,
} from '@/components/ui/sheet';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

function Example({ side, closeLabel }: { side?: SheetSide; closeLabel?: string }) {
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

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('dialog');
    await expectNoA11yViolations();
  });
});
