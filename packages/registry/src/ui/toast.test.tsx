import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { notify, resolvePosition, Toaster } from '@/components/ui/toast';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

afterEach(() => {
  act(() => {
    notify.dismiss();
  });
});

describe('resolvePosition', () => {
  it('maps logical sides to physical ones per direction', () => {
    expect(resolvePosition('bottom-end', 'ltr')).toBe('bottom-right');
    expect(resolvePosition('bottom-end', 'rtl')).toBe('bottom-left');
    expect(resolvePosition('top-start', 'ltr')).toBe('top-left');
    expect(resolvePosition('top-start', 'rtl')).toBe('top-right');
  });

  it('leaves centred positions alone', () => {
    expect(resolvePosition('top-center', 'rtl')).toBe('top-center');
    expect(resolvePosition('bottom-center', 'ltr')).toBe('bottom-center');
  });
});

describe('Toaster', () => {
  it('shows a toast for each notify helper', async () => {
    render(<Toaster />);
    act(() => {
      notify.success('Saved');
      notify.error('Failed');
      notify.warning('Careful');
      notify.info('FYI');
    });
    for (const text of ['Saved', 'Failed', 'Careful', 'FYI']) {
      expect(await screen.findByText(text)).toBeInTheDocument();
    }
  });

  it('shows the description beside the title', async () => {
    render(<Toaster />);
    act(() => {
      notify.success('Saved', { description: 'Invoice 12 is up to date' });
    });
    expect(await screen.findByText('Invoice 12 is up to date')).toBeInTheDocument();
  });

  it('places the toaster at the end edge in LTR', async () => {
    const { container } = render(<Toaster />);
    act(() => {
      notify.info('Placed');
    });
    await screen.findByText('Placed');
    const toaster = container.querySelector('[data-sonner-toaster]');
    expect(toaster).toHaveAttribute('data-x-position', 'right');
    expect(toaster).toHaveAttribute('data-y-position', 'bottom');
    expect(toaster).toHaveAttribute('dir', 'ltr');
  });

  it('flips to the left edge in RTL and names the region in Arabic', async () => {
    const { container } = renderWithLocale(<Toaster />, { locale: 'ar' });
    act(() => {
      notify.success('تم الحفظ');
    });
    await screen.findByText('تم الحفظ');
    const toaster = container.querySelector('[data-sonner-toaster]');
    expect(toaster).toHaveAttribute('data-x-position', 'left');
    expect(toaster).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('region', { name: /الإشعارات/ })).toBeInTheDocument();
  });

  it('accepts a custom position and region label', async () => {
    const { container } = render(<Toaster position="top-start" label="Alerts" />);
    act(() => {
      notify.info('Top');
    });
    await screen.findByText('Top');
    expect(container.querySelector('[data-sonner-toaster]')).toHaveAttribute('data-y-position', 'top');
    expect(screen.getByRole('region', { name: /Alerts/ })).toBeInTheDocument();
  });

  it('themes the toast surface with tokens', async () => {
    const { container } = render(<Toaster />);
    act(() => {
      notify.info('Themed');
    });
    await screen.findByText('Themed');
    const toaster = container.querySelector<HTMLElement>('[data-sonner-toaster]');
    expect(toaster?.style.getPropertyValue('--normal-bg')).toBe('var(--surface-elevated)');
    expect(toaster?.style.getPropertyValue('--normal-border')).toBe('var(--stroke)');
  });

  it('dismisses a toast by id', async () => {
    render(<Toaster />);
    let id: string | number = '';
    act(() => {
      id = notify.info('Temporary');
    });
    await screen.findByText('Temporary');
    act(() => {
      notify.dismiss(id);
    });
    await waitFor(() => {
      expect(screen.queryByText('Temporary')).not.toBeInTheDocument();
    });
  });

  it('turns a promise into loading, then success', async () => {
    render(<Toaster />);
    let resolve: (value: string) => void = () => {};
    const pending = new Promise<string>((done) => {
      resolve = done;
    });
    act(() => {
      void notify.promise(pending, {
        loading: 'Saving…',
        success: (value) => `Saved ${value}`,
        error: 'Could not save',
      });
    });
    expect(await screen.findByText('Saving…')).toBeInTheDocument();
    await act(async () => {
      resolve('draft');
      await pending;
    });
    expect(await screen.findByText('Saved draft')).toBeInTheDocument();
  });

  it('turns a rejected promise into an error and still rejects for the caller', async () => {
    render(<Toaster />);
    const failing = Promise.reject(new Error('boom'));
    let caught: unknown;
    await act(async () => {
      await notify
        .promise(failing, {
          loading: 'Saving…',
          success: 'Saved',
          error: (error) => (error instanceof Error ? `Failed: ${error.message}` : 'Failed'),
        })
        .catch((error: unknown) => {
          caught = error;
        });
    });
    expect(await screen.findByText('Failed: boom')).toBeInTheDocument();
    expect(caught).toBeInstanceOf(Error);
  });

  it('has no axe violations with a toast showing', async () => {
    render(<Toaster />);
    act(() => {
      notify.success('Saved');
    });
    await screen.findByText('Saved');
    await expectNoA11yViolations();
  });
});
