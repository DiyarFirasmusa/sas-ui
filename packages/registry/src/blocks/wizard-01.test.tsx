import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Wizard01 } from '@/components/blocks/wizard-01';
import type { Wizard01Values } from '@/components/blocks/wizard-01-model';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const valid: Partial<Wizard01Values> = {
  fullName: 'Layla Hassan',
  email: 'layla@example.com',
  phone: '+964 770 123 4567',
  orgName: 'Tigris Logistics',
  orgType: 'private',
  governorate: 'basra',
};

async function next() {
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('Wizard01', () => {
  it('validates the current step only and stays on it', async () => {
    renderWithLocale(<Wizard01 />);
    await next();
    expect(await screen.findByText('Enter your full name')).toBeInTheDocument();
    expect(screen.getByText('Enter your work email')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Account' })).toBeInTheDocument();
    // The next steps' errors are not shown yet.
    expect(screen.queryByText('Enter the organisation name')).not.toBeInTheDocument();
  });

  it('moves forward and back and keeps the answers', async () => {
    renderWithLocale(<Wizard01 defaultValues={{ ...valid, orgName: '' }} />);
    await next();
    await userEvent.type(await screen.findByLabelText(/Organisation name/), 'Tigris');
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Layla Hassan');
    await next();
    expect(await screen.findByLabelText(/Organisation name/)).toHaveValue('Tigris');
  });

  it('marks the current step and only lets finished steps be clicked', async () => {
    renderWithLocale(<Wizard01 defaultValues={valid} />);
    const steps = screen.getByRole('list', { name: 'Setup steps' });
    expect(within(steps).queryAllByRole('button')).toHaveLength(0);
    await next();
    await next();
    const buttons = within(screen.getByRole('list', { name: 'Setup steps' })).getAllByRole(
      'button',
    );
    expect(buttons).toHaveLength(2);
    const [first] = buttons;
    if (!first) {
      throw new Error('no finished step to click');
    }
    await userEvent.click(first);
    expect(await screen.findByLabelText(/Full name/)).toHaveValue('Layla Hassan');
  });

  it('treats Enter in a field as Next before the review step', async () => {
    renderWithLocale(<Wizard01 defaultValues={valid} />);
    await userEvent.type(screen.getByLabelText(/Full name/), '{Enter}');
    expect(await screen.findByLabelText(/Organisation name/)).toBeInTheDocument();
  });

  it('reviews every answer and jumps back to edit one group', async () => {
    renderWithLocale(<Wizard01 defaultValues={valid} />);
    await next();
    await next();
    await next();
    expect(screen.getByRole('heading', { level: 2, name: 'Review' })).toBeInTheDocument();
    expect(screen.getByText('Layla Hassan')).toBeInTheDocument();
    expect(screen.getByText('layla@example.com')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByText('Private company')).toBeInTheDocument();
    expect(screen.getByText('Basra')).toBeInTheDocument();
    expect(screen.getByText('Starter')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit Organisation' }));
    expect(await screen.findByLabelText(/Organisation name/)).toHaveValue('Tigris Logistics');
  });

  it('needs the terms before submitting, then submits once with all values', async () => {
    const onSubmit = vi.fn();
    renderWithLocale(<Wizard01 defaultValues={valid} onSubmit={onSubmit} />);
    await next();
    await next();
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
    expect(
      await screen.findByText('Confirm the details and accept the terms to continue'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('checkbox', { name: /accept the terms/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      ...valid,
      plan: 'starter',
      newsletter: true,
      terms: true,
    });
    expect(await screen.findByRole('heading', { name: 'Workspace created' })).toBeInTheDocument();
    expect(screen.getByText('layla@example.com')).toHaveAttribute('dir', 'ltr');
  });

  it('is single-flight while the submit is pending', async () => {
    let finish: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithLocale(<Wizard01 defaultValues={{ ...valid, terms: true }} onSubmit={onSubmit} />);
    await next();
    await next();
    await next();
    const button = screen.getByRole('button', { name: 'Create workspace' });
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'true'));
    await userEvent.click(button);
    expect(onSubmit).toHaveBeenCalledOnce();
    finish();
    expect(await screen.findByRole('heading', { name: 'Workspace created' })).toBeInTheDocument();
  });

  it('sends a server field error back to the step that owns the field', async () => {
    const onSubmit = vi.fn(() => Promise.reject({ errors: { email: ['Already registered'] } }));
    renderWithLocale(<Wizard01 defaultValues={{ ...valid, terms: true }} onSubmit={onSubmit} />);
    await next();
    await next();
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
    expect(await screen.findByText('Already registered')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Account' })).toBeInTheDocument();
  });

  it('shows a form-level message for a failure without details', async () => {
    renderWithLocale(
      <Wizard01
        defaultValues={{ ...valid, terms: true }}
        onSubmit={() => Promise.reject(new Error(''))}
      />,
    );
    await next();
    await next();
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
    expect(
      await screen.findByText('We could not create the workspace. Try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Review' })).toBeInTheDocument();
  });

  it('starts over from the confirmation', async () => {
    const onRestart = vi.fn();
    renderWithLocale(
      <Wizard01
        defaultValues={{ ...valid, terms: true }}
        onSubmit={vi.fn()}
        onRestart={onRestart}
      />,
    );
    await next();
    await next();
    await next();
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Start over' }));
    expect(onRestart).toHaveBeenCalledOnce();
    expect(await screen.findByLabelText(/Full name/)).toHaveValue('Layla Hassan');
    expect(screen.getByRole('heading', { level: 2, name: 'Account' })).toBeInTheDocument();
  });

  it('chooses the organisation type from the dropdown', async () => {
    renderWithLocale(<Wizard01 defaultValues={{ ...valid, orgType: '' }} />);
    await next();
    await userEvent.click(await screen.findByRole('combobox', { name: /Organisation type/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Non-profit' }));
    await next();
    expect(await screen.findByRole('heading', { level: 2, name: 'Plan' })).toBeInTheDocument();
  });

  it('renders Arabic labels with a left-to-right phone', async () => {
    renderWithLocale(<Wizard01 defaultValues={valid} />, { locale: 'ar' });
    expect(screen.getByRole('heading', { level: 1, name: 'أنشئ مساحة العمل' })).toBeInTheDocument();
    expect(screen.getByLabelText(/رقم الهاتف المحمول/)).toHaveAttribute('dir', 'ltr');
    await userEvent.click(screen.getByRole('button', { name: 'التالي' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'الجهة' })).toBeInTheDocument();
  });

  it('has no axe violations on the form and the review', async () => {
    const { container } = renderWithLocale(<Wizard01 defaultValues={valid} />);
    await expectNoA11yViolations(container);
    await next();
    await next();
    await next();
    await expectNoA11yViolations(container);
  });
});
