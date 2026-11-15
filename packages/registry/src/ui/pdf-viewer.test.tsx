import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PdfViewer } from '@/components/ui/pdf-viewer';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const SRC = 'https://files.example.test/report.pdf';

function frame(): HTMLIFrameElement {
  const element = screen.getByTitle('Quarterly report');
  if (!(element instanceof HTMLIFrameElement)) {
    throw new Error('expected an iframe');
  }
  return element;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('PdfViewer', () => {
  it('frames the document with a required accessible title', () => {
    render(<PdfViewer src={SRC} title="Quarterly report" />);
    expect(frame()).toHaveAttribute('src', SRC);
    expect(frame()).toHaveAttribute('referrerpolicy', 'no-referrer');
  });

  it('shows a skeleton until the frame loads', () => {
    const onLoad = vi.fn();
    render(<PdfViewer src={SRC} title="Quarterly report" onLoad={onLoad} />);
    expect(screen.getByRole('status', { name: 'Loading document' })).toBeInTheDocument();
    fireEvent.load(frame());
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(onLoad).toHaveBeenCalledOnce();
  });

  it('offers download and open in new tab as real links', () => {
    render(<PdfViewer src={SRC} title="Quarterly report" downloadName="q3.pdf" />);
    const download = screen.getByRole('link', { name: 'Download' });
    expect(download).toHaveAttribute('href', SRC);
    expect(download).toHaveAttribute('download', 'q3.pdf');
    const open = screen.getByRole('link', { name: 'Open in new tab' });
    expect(open).toHaveAttribute('target', '_blank');
    expect(open).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('toggles full screen with the button and leaves it with Escape', async () => {
    const { container } = render(<PdfViewer src={SRC} title="Quarterly report" />);
    const root = container.querySelector('[data-slot=pdf-viewer]');
    const toggle = screen.getByRole('button', { name: 'Full screen' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(root).toHaveAttribute('data-expanded');
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.keyboard('{Escape}');
    expect(root).not.toHaveAttribute('data-expanded');
    expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument();
  });

  it('uses the Fullscreen API when the browser provides it', async () => {
    const request = vi.fn(() => Promise.resolve());
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: request,
    });
    try {
      render(<PdfViewer src={SRC} title="Quarterly report" />);
      await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
      expect(request).toHaveBeenCalledOnce();
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen');
    }
  });

  it('applies a fixed height or an aspect ratio to the frame area', () => {
    const { container, rerender } = render(
      <PdfViewer src={SRC} title="Quarterly report" height={480} />,
    );
    const area = () =>
      container.querySelector<HTMLElement>('[data-slot=pdf-viewer] > div:last-child');
    expect(area()).toHaveStyle({ height: '480px' });
    rerender(<PdfViewer src={SRC} title="Quarterly report" aspectRatio={0.75} />);
    expect(area()).toHaveStyle({ aspectRatio: '0.75' });
  });

  it('can hide the toolbar', () => {
    render(<PdfViewer src={SRC} title="Quarterly report" hideToolbar />);
    expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
    expect(frame()).toBeInTheDocument();
  });

  describe('error state', () => {
    it('shows retry and a download fallback when told the file failed', () => {
      render(<PdfViewer src={SRC} title="Quarterly report" error />);
      expect(screen.getByRole('alert')).toHaveTextContent('The document could not be loaded');
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: 'Download' })).toHaveLength(2);
      expect(screen.queryByTitle('Quarterly report')).not.toBeInTheDocument();
    });

    it('retries with a fresh frame and the loading state', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const onRetry = vi.fn();
      render(<PdfViewer src={SRC} title="Quarterly report" loadTimeout={1000} onRetry={onRetry} />);
      const first = frame();
      act(() => {
        vi.advanceTimersByTime(1001);
      });
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(onRetry).toHaveBeenCalledOnce();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Loading document' })).toBeInTheDocument();
      expect(frame()).not.toBe(first);
    });

    it('fails when the frame never loads within the timeout', () => {
      vi.useFakeTimers();
      const onError = vi.fn();
      render(<PdfViewer src={SRC} title="Quarterly report" loadTimeout={1000} onError={onError} />);
      act(() => {
        vi.advanceTimersByTime(1001);
      });
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(onError).toHaveBeenCalledOnce();
    });

    it('does not time out once loaded', () => {
      vi.useFakeTimers();
      render(<PdfViewer src={SRC} title="Quarterly report" loadTimeout={1000} />);
      fireEvent.load(frame());
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:x'])(
      'refuses to frame %s',
      (src) => {
        render(<PdfViewer src={src} title="Quarterly report" />);
        expect(screen.queryByTitle('Quarterly report')).not.toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
      },
    );

    it('allows blob, PDF data and relative addresses', () => {
      const { rerender } = render(
        <PdfViewer src="blob:https://app.test/abc" title="Quarterly report" />,
      );
      expect(frame()).toBeInTheDocument();
      rerender(<PdfViewer src="data:application/pdf;base64,AAAA" title="Quarterly report" />);
      expect(frame()).toBeInTheDocument();
      rerender(<PdfViewer src="/files/report.pdf" title="Quarterly report" />);
      expect(frame()).toBeInTheDocument();
    });
  });

  it('is operable from the keyboard', async () => {
    render(<PdfViewer src={SRC} title="Quarterly report" />);
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Download' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Open in new tab' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Full screen' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument();
  });

  it('is localised in Arabic', () => {
    renderWithLocale(<PdfViewer src={SRC} title="تقرير" />, { locale: 'ar' });
    expect(screen.getByRole('link', { name: 'تنزيل' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'فتح في تبويب جديد' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ملء الشاشة' })).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'جارٍ تحميل المستند' })).toBeInTheDocument();
  });

  it('localises the error state in Arabic', () => {
    renderWithLocale(<PdfViewer src={SRC} title="تقرير" error />, {
      locale: 'ar',
    });
    expect(screen.getByRole('alert')).toHaveTextContent('تعذر تحميل المستند');
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeInTheDocument();
  });

  it('accepts label overrides', () => {
    render(<PdfViewer src={SRC} title="Quarterly report" labels={{ download: 'Save copy' }} />);
    expect(screen.getByRole('link', { name: 'Save copy' })).toBeInTheDocument();
  });

  it('has no axe violations in the toolbar, skeleton and error state', async () => {
    // axe cannot message into an unloaded iframe in jsdom, so check the parts around it.
    const { container, rerender } = render(<PdfViewer src={SRC} title="Quarterly report" />);
    const toolbar = container.querySelector('[data-slot=pdf-viewer-toolbar]');
    const skeleton = container.querySelector('[data-slot=pdf-viewer-skeleton]');
    expect(toolbar).not.toBeNull();
    expect(skeleton).not.toBeNull();
    if (toolbar && skeleton) {
      await expectNoA11yViolations(toolbar);
      await expectNoA11yViolations(skeleton);
    }
    rerender(<PdfViewer src={SRC} title="Quarterly report" error />);
    const failed = container.querySelector('[data-slot=pdf-viewer-error]');
    expect(failed).not.toBeNull();
    if (failed) {
      await expectNoA11yViolations(failed);
    }
  });
});
