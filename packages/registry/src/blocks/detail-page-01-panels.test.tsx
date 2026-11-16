import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sampleApplication } from '@/components/blocks/detail-page-01-data';
import { messages } from '@/components/blocks/detail-page-01-messages';
import {
  ActivityPanel,
  DocumentsPanel,
  OverviewPanel,
} from '@/components/blocks/detail-page-01-panels';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('OverviewPanel', () => {
  it('groups the fields into sections beside a summary', () => {
    renderWithLocale(
      <OverviewPanel application={sampleApplication} labels={messages.en} locale="en" />,
    );
    expect(screen.getByRole('heading', { name: 'Applicant' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Business' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument();
    expect(screen.getByText('info@alnoor.example')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('450,000 IQD')).toBeInTheDocument();
  });

  it('renders Arabic values and has no axe violations', async () => {
    const { container } = renderWithLocale(
      <OverviewPanel application={sampleApplication} labels={messages.ar} locale="ar" />,
      { locale: 'ar' },
    );
    expect(screen.getAllByText('شركة النور للتجارة')[0]).toHaveAttribute('dir', 'auto');
    await expectNoA11yViolations(container);
  });
});

describe('DocumentsPanel', () => {
  it('lists documents with download and remove actions', async () => {
    const onDownload = vi.fn();
    const onRemove = vi.fn();
    renderWithLocale(
      <DocumentsPanel
        application={sampleApplication}
        labels={messages.en}
        locale="en"
        onDownload={onDownload}
        onRemove={onRemove}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Download: commercial-registration.pdf' }),
    );
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc-1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove: site-photos.zip' }));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc-3' }));
  });

  it('shows an empty state when there are no documents', () => {
    renderWithLocale(
      <DocumentsPanel
        application={{ ...sampleApplication, documents: [] }}
        labels={messages.en}
        locale="en"
        onUpload={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No documents yet' })).toBeInTheDocument();
  });

  it('uploads the queued files once, however often the button is pressed', async () => {
    let finish: () => void = () => {};
    const onUpload = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const { container } = renderWithLocale(
      <DocumentsPanel
        application={sampleApplication}
        labels={messages.en}
        locale="en"
        onUpload={onUpload}
      />,
    );
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('file input missing');
    }
    const file = new File(['x'], 'fire-certificate.pdf', { type: 'application/pdf' });
    await userEvent.upload(input, file);
    const button = await screen.findByRole('button', { name: 'Upload 1 file(s)' });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(onUpload).toHaveBeenCalledOnce();
    expect(onUpload).toHaveBeenCalledWith([file]);
    finish();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Upload 1 file(s)' })).toBeNull(),
    );
  });

  it('keeps the queue and shows an error when the upload fails', async () => {
    const onUpload = vi.fn().mockRejectedValue(new Error('boom'));
    const { container } = renderWithLocale(
      <DocumentsPanel
        application={sampleApplication}
        labels={messages.en}
        locale="en"
        onUpload={onUpload}
      />,
    );
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('file input missing');
    }
    await userEvent.upload(input, new File(['x'], 'a.pdf', { type: 'application/pdf' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Upload 1 file(s)' }));
    expect(await screen.findByText('The upload failed. Try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload 1 file(s)' })).toBeInTheDocument();
  });

  it('has no axe violations in Arabic', async () => {
    const { container } = renderWithLocale(
      <DocumentsPanel
        application={sampleApplication}
        labels={messages.ar}
        locale="ar"
        onUpload={() => {}}
        onDownload={() => {}}
      />,
      { locale: 'ar' },
    );
    expect(screen.getByText('عقد الإيجار.pdf')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('ActivityPanel', () => {
  it('lists events with machine-readable times', () => {
    renderWithLocale(
      <ActivityPanel application={sampleApplication} labels={messages.en} locale="en" />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(sampleApplication.activity.length);
    expect(items[0]).toHaveTextContent(/Comment/);
    expect(items[0]?.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-05T11:02:00Z');
  });

  it('shows an empty state without events', () => {
    renderWithLocale(
      <ActivityPanel
        application={{ ...sampleApplication, activity: [] }}
        labels={messages.en}
        locale="en"
      />,
    );
    expect(screen.getByRole('heading', { name: 'No activity yet' })).toBeInTheDocument();
  });

  it('has no axe violations in Arabic', async () => {
    const { container } = renderWithLocale(
      <ActivityPanel application={sampleApplication} labels={messages.ar} locale="ar" />,
      { locale: 'ar' },
    );
    await expectNoA11yViolations(container);
  });
});
