import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example() {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite</DialogTitle>
          <DialogDescription>Send an invitation</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button">Send</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('opens from the trigger with an accessible name and description', async () => {
    render(<Example />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = await screen.findByRole('dialog', { name: 'Invite' });
    expect(dialog).toHaveAccessibleDescription('Send an invitation');
  });

  it('closes with the close button and with Escape', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('dialog');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('labels the close button in Arabic', async () => {
    renderWithLocale(<Example />, { locale: 'ar' });
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('button', { name: 'إغلاق' })).toBeInTheDocument();
  });

  it('defaults to the 640px dialog and offers a size scale', async () => {
    const { unmount } = render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    const plain = await screen.findByRole('dialog');
    expect(plain).toHaveClass('max-w-[40rem]');
    expect(plain).toHaveAttribute('data-size', 'md');
    unmount();

    const widths = {
      sm: 'max-w-[26.25rem]',
      md: 'max-w-[40rem]',
      lg: 'max-w-[56.25rem]',
      xl: 'max-w-[68.75rem]',
    };
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      const { unmount: close } = render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent size={size}>
            <DialogTitle>Sized</DialogTitle>
          </DialogContent>
        </Dialog>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Open' }));
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveClass(widths[size]);
      expect(dialog).toHaveAttribute('data-size', size);
      close();
    }
  });

  it('honours a custom closeLabel', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent closeLabel="Dismiss">
          <DialogTitle>Custom</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(await screen.findByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('reserveClose controls the end padding of the header, logically', () => {
    render(
      <>
        <DialogHeader data-testid="reserved">x</DialogHeader>
        <DialogHeader data-testid="free" reserveClose={false}>
          x
        </DialogHeader>
        <DialogHeader data-testid="bare" padded={false}>
          x
        </DialogHeader>
      </>,
    );
    expect(screen.getByTestId('reserved')).toHaveClass('pe-14', 'p-card');
    expect(screen.getByTestId('free')).toHaveClass('pe-card');
    expect(screen.getByTestId('free')).not.toHaveClass('pe-14');
    expect(screen.getByTestId('bare')).toHaveClass('pe-14');
    expect(screen.getByTestId('bare')).not.toHaveClass('p-card');
  });

  it('body and footer can drop their padding', () => {
    render(
      <>
        <DialogBody data-testid="body">x</DialogBody>
        <DialogBody data-testid="flush" padded={false}>
          x
        </DialogBody>
        <DialogFooter data-testid="footer" padded={false}>
          x
        </DialogFooter>
      </>,
    );
    expect(screen.getByTestId('body')).toHaveClass('px-card');
    expect(screen.getByTestId('flush')).not.toHaveClass('px-card');
    expect(screen.getByTestId('footer')).not.toHaveClass('p-card');
  });

  it('opens in Arabic with the sized panel and no axe violations', async () => {
    renderWithLocale(
      <Dialog>
        <DialogTrigger>فتح</DialogTrigger>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>دعوة</DialogTitle>
            <DialogDescription>إرسال دعوة</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
      { locale: 'ar' },
    );
    await userEvent.click(screen.getByRole('button', { name: 'فتح' }));
    const dialog = await screen.findByRole('dialog', { name: 'دعوة' });
    expect(dialog).toHaveClass('rtl:translate-x-1/2', 'max-w-[26.25rem]');
    await expectNoA11yViolations();
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('dialog');
    await expectNoA11yViolations();
  });
});
