import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_VALUES, messages, type Wizard01Values } from '@/components/blocks/wizard-01-model';
import { Wizard01Step } from '@/components/blocks/wizard-01-steps';
import type { Locale } from '@/lib/locale';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const filled: Wizard01Values = {
  ...EMPTY_VALUES,
  fullName: 'Layla Hassan',
  email: 'layla@example.com',
  orgName: 'Tigris',
  orgType: 'public',
  governorate: 'najaf',
  plan: 'enterprise',
  newsletter: false,
};

function Harness({
  step,
  locale = 'en',
  onEdit = () => {},
}: {
  step: number;
  locale?: Locale;
  onEdit?: (step: number) => void;
}) {
  const form = useForm<Wizard01Values>({ defaultValues: filled });
  return (
    <form>
      <Wizard01Step
        step={step}
        control={form.control}
        values={filled}
        labels={messages[locale]}
        locale={locale}
        onEdit={onEdit}
      />
    </form>
  );
}

describe('Wizard01Step', () => {
  it('renders the account fields', () => {
    renderWithLocale(<Harness step={0} />);
    expect(screen.getByLabelText(/Full name/)).toHaveValue('Layla Hassan');
    expect(screen.getByLabelText(/Work email/)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/Mobile phone/)).toHaveAttribute('dir', 'ltr');
  });

  it('renders the organisation fields', () => {
    renderWithLocale(<Harness step={1} />);
    expect(screen.getByLabelText(/Organisation name/)).toHaveValue('Tigris');
    expect(screen.getByRole('combobox', { name: /Governorate/ })).toBeInTheDocument();
  });

  it('renders the plan radios with the saved choice and the switch', async () => {
    renderWithLocale(<Harness step={2} />);
    expect(screen.getByRole('radio', { name: /Enterprise/ })).toBeChecked();
    expect(screen.getByRole('switch', { name: /Product updates/ })).not.toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: /Starter/ }));
    expect(screen.getByRole('radio', { name: /Starter/ })).toBeChecked();
  });

  it('summarises on the review step and reports which group to edit', async () => {
    const onEdit = vi.fn();
    renderWithLocale(<Harness step={3} onEdit={onEdit} />);
    expect(screen.getByText('Public body')).toBeInTheDocument();
    expect(screen.getByText('Najaf')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit Plan' }));
    expect(onEdit).toHaveBeenCalledWith(2);
  });

  it('uses Arabic wording on the review step', () => {
    renderWithLocale(<Harness step={3} locale="ar" />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: 'تعديل الحساب' })).toBeInTheDocument();
    expect(screen.getByText('جهة حكومية')).toBeInTheDocument();
  });

  it('has no axe violations on any step', async () => {
    for (const step of [0, 1, 2, 3]) {
      const { container, unmount } = renderWithLocale(<Harness step={step} />);
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});
