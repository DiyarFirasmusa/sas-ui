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

describe('AttachmentCard with a preview', () => {
  it('draws the grid card: preview, type tag, size and hover actions', async () => {
    const onView = vi.fn();
    const onRemove = vi.fn();
    const { container } = renderWithLocale(
      <AttachmentCard
        name="id.jpg"
        size={2048}
        typeLabel="ID card"
        preview={<img alt="" src="data:," />}
        onView={onView}
        onRemove={onRemove}
      />,
    );
    const card = container.querySelector('[data-slot="attachment-card"]');
    expect(card).toHaveAttribute('data-variant', 'preview');
    expect(screen.getByText('ID card')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'View: id.jpg' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove: id.jpg' }));
    expect(onView).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('makes the preview a pressed toggle when selectable', async () => {
    const onSelect = vi.fn();
    const { container } = renderWithLocale(
      <AttachmentCard name="id.jpg" preview={<span />} selectable selected onSelect={onSelect} />,
    );
    const toggle = screen.getByRole('button', { name: 'id.jpg' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelector('[data-slot="attachment-card"]')).toHaveAttribute(
      'data-selected',
    );
    await userEvent.click(toggle);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('labels the view action in Arabic and has no axe violations', async () => {
    const { container } = renderWithLocale(
      <AttachmentCard name="هوية.jpg" typeLabel="هوية" preview={<span />} onView={() => {}} />,
      { locale: 'ar' },
    );
    expect(screen.getByRole('button', { name: 'عرض: هوية.jpg' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
