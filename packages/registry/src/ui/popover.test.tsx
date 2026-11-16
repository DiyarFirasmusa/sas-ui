import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  popoverMotion,
} from '@/components/ui/popover';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example() {
  return (
    <Popover>
      <PopoverTrigger>Filters</PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Filter rows</PopoverTitle>
        <PopoverDescription>Choose a status</PopoverDescription>
        <input aria-label="Status" />
      </PopoverContent>
    </Popover>
  );
}

describe('Popover', () => {
  it('opens on click with a name and description', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    const dialog = await screen.findByRole('dialog', { name: 'Filter rows' });
    expect(dialog).toHaveAccessibleDescription('Choose a status');
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('passes the positioner props through and styles the positioner', async () => {
    function Anchored() {
      const anchorRef = useRef<HTMLDivElement>(null);
      return (
        <>
          <div ref={anchorRef}>Anchor</div>
          <Popover>
            <PopoverTrigger>Open</PopoverTrigger>
            <PopoverContent
              anchor={anchorRef}
              positionMethod="fixed"
              collisionPadding={8}
              collisionAvoidance={{ side: 'none', align: 'shift', fallbackAxisSide: 'none' }}
              sticky
              alignOffset={4}
              positionerClassName="w-(--anchor-width)"
            >
              <PopoverTitle>Anchored</PopoverTitle>
            </PopoverContent>
          </Popover>
        </>
      );
    }
    render(<Anchored />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Anchored' });
    const positioner = dialog.parentElement;
    expect(positioner).toHaveClass('w-(--anchor-width)', 'z-50');
    expect(positioner).toHaveStyle({ position: 'fixed' });
  });

  it('exports the motion classes it uses', async () => {
    expect(popoverMotion).toContain('data-[starting-style]:opacity-0');
    expect(popoverMotion).toContain('motion-reduce:transition-none');
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    expect(await screen.findByRole('dialog')).toHaveClass('duration-150');
  });

  it('opens in Arabic with an inline-end placement and no axe violations', async () => {
    renderWithLocale(
      <Popover>
        <PopoverTrigger>مرشحات</PopoverTrigger>
        <PopoverContent side="inline-end">
          <PopoverTitle>تصفية</PopoverTitle>
        </PopoverContent>
      </Popover>,
      { locale: 'ar' },
    );
    await userEvent.click(screen.getByRole('button', { name: 'مرشحات' }));
    expect(await screen.findByRole('dialog', { name: 'تصفية' })).toBeInTheDocument();
    await expectNoA11yViolations();
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await screen.findByRole('dialog');
    await expectNoA11yViolations();
  });
});
