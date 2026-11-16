import { screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_VALUES,
  messages,
  type FormPage01Values,
} from '@/components/blocks/form-page-01-model';
import { FormPage01Sections } from '@/components/blocks/form-page-01-sections';
import type { Locale } from '@/lib/locale';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Harness({ locale }: { locale: Locale }) {
  const form = useForm<FormPage01Values>({ defaultValues: EMPTY_VALUES });
  return (
    <form>
      <FormPage01Sections control={form.control} labels={messages[locale]} locale={locale} />
    </form>
  );
}

describe('FormPage01Sections', () => {
  it('renders the six sections as headings with their fields', () => {
    renderWithLocale(<Harness locale="en" />);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
    for (const name of ['Full name', 'National ID', 'Email', 'Mobile phone']) {
      expect(screen.getByLabelText(new RegExp(name))).toBeInTheDocument();
    }
    expect(screen.getByRole('combobox', { name: /Governorate/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes/)).toBeInTheDocument();
    expect(screen.getByText('Supporting documents')).toBeInTheDocument();
  });

  it('renders Arabic section titles', () => {
    renderWithLocale(<Harness locale="ar" />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'المرفقات' })).toBeInTheDocument();
    expect(screen.getByLabelText(/الرقم الوطني/)).toHaveAttribute('dir', 'ltr');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Harness locale="en" />);
    await expectNoA11yViolations(container);
  });
});
