import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentCard, formatFileSize } from '@/components/ui/attachment-card';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1536, '1.5 KB'],
    [5 * 1024 * 1024, '5 MB'],
    [3 * 1024 ** 3, '3 GB'],
  ])('formats %d bytes as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });
});

describe('AttachmentCard', () => {
  it('shows name and size and fires actions', async () => {
    const onDownload = vi.fn();
    const onRemove = vi.fn();
    renderWithLocale(
      <AttachmentCard name="report.pdf" size={2048} onDownload={onDownload} onRemove={onRemove} />,
    );
    expect(screen.getByText('2 KB')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Download: report.pdf' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove: report.pdf' }));
    expect(onDownload).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('localises the action labels and keeps the size left-to-right', () => {
    renderWithLocale(<AttachmentCard name="تقرير.pdf" size={1024} onRemove={() => {}} />, {
      locale: 'ar',
    });
    expect(screen.getByRole('button', { name: 'إزالة: تقرير.pdf' })).toBeInTheDocument();
    expect(screen.getByText('1 KB')).toHaveAttribute('dir', 'ltr');
  });

  it('omits actions that have no handler', () => {
    renderWithLocale(<AttachmentCard name="a.txt" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(
      <AttachmentCard name="a.txt" size={10} onRemove={() => {}} />,
    );
    await expectNoA11yViolations(container);
  });
});
