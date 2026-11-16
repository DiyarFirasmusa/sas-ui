import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DetailPage01 } from '@/components/blocks/detail-page-01';
import { sampleApplication } from '@/components/blocks/detail-page-01-data';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('DetailPage01', () => {
  it('shows the header with breadcrumb, status and the workflow position', () => {
    renderWithLocale(<DetailPage01 />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Al Noor Trading Co.' }),
    ).toBeInTheDocument();
    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(trail).getByText('APP-2026-0412')).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByText('In review').length).toBeGreaterThan(0);
    const steps = within(screen.getByRole('list', { name: 'Workflow stage' })).getAllByRole(
      'listitem',
    );
    expect(steps).toHaveLength(5);
    expect(steps[2]).toHaveAttribute('aria-current', 'step');
  });

  it('marks the failed stage when the application is rejected', () => {
    renderWithLocale(
      <DetailPage01
        state={{ status: 'success', data: { ...sampleApplication, status: 'rejected' } }}
      />,
    );
    const steps = within(screen.getByRole('list', { name: 'Workflow stage' })).getAllByRole(
      'listitem',
    );
    expect(steps[2]).toHaveAttribute('data-state', 'error');
  });

  it('completes every stage when approved', () => {
    renderWithLocale(
      <DetailPage01
        state={{ status: 'success', data: { ...sampleApplication, status: 'approved' } }}
      />,
    );
    const steps = within(screen.getByRole('list', { name: 'Workflow stage' })).getAllByRole(
      'listitem',
    );
    expect(steps.every((step) => step.getAttribute('data-state') === 'complete')).toBe(true);
  });

  it('switches between overview, documents and activity', async () => {
    renderWithLocale(<DetailPage01 />);
    expect(screen.getByRole('heading', { name: 'Applicant' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Documents' }));
    expect(await screen.findByText('commercial-registration.pdf')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(
      await screen.findByText('Application submitted · Al Noor Trading Co.'),
    ).toBeInTheDocument();
  });

  it('moves between tabs with the arrow keys', async () => {
    renderWithLocale(<DetailPage01 />);
    screen.getByRole('tab', { name: 'Overview' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Documents' })).toHaveFocus();
  });

  it('shows only the actions that have handlers', () => {
    renderWithLocale(<DetailPage01 />);
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });

  it('edits through its handler', async () => {
    const onEdit = vi.fn();
    renderWithLocale(<DetailPage01 onEdit={onEdit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(sampleApplication);
  });

  it('asks before deleting and runs the delete once', async () => {
    let finish: () => void = () => {};
    const onDelete = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithLocale(<DetailPage01 onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    expect(onDelete).not.toHaveBeenCalled();
    const confirm = within(dialog).getByRole('button', { name: 'Delete application' });
    await userEvent.click(confirm);
    await userEvent.click(confirm);
    expect(onDelete).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('keeps the delete dialog open with the error when deleting fails', async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error('Server refused'));
    renderWithLocale(<DetailPage01 onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete application' }));
    expect(await within(dialog).findByText('Server refused')).toBeInTheDocument();
  });

  it('shows a loading skeleton', () => {
    renderWithLocale(<DetailPage01 state={{ status: 'loading' }} />);
    expect(screen.getByRole('status', { name: 'Loading application' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('shows the error with a retry', async () => {
    const onRetry = vi.fn();
    renderWithLocale(
      <DetailPage01 state={{ status: 'error', message: 'Network down' }} onRetry={onRetry} />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders Arabic with the stepper and header in the page direction', () => {
    renderWithLocale(<DetailPage01 />, { locale: 'ar' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'شركة النور للتجارة' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'نظرة عامة' })).toBeInTheDocument();
    expect(screen.getAllByText('قيد المراجعة').length).toBeGreaterThan(0);
    expect(screen.getByRole('list', { name: 'مرحلة سير العمل' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(
      <DetailPage01 onEdit={() => {}} onDelete={() => {}} onUpload={() => {}} />,
    );
    await expectNoA11yViolations(container);
  });

  it('has no axe violations while loading or failed', async () => {
    const loading = renderWithLocale(<DetailPage01 state={{ status: 'loading' }} />);
    await expectNoA11yViolations(loading.container);
    loading.unmount();
    const failed = renderWithLocale(
      <DetailPage01 state={{ status: 'error' }} onRetry={() => {}} />,
    );
    await expectNoA11yViolations(failed.container);
  });
});
