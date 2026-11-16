import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { DatePicker } from '@/components/ui/date-picker';
import { Field } from '@/components/ui/field';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const ARABIC_INDIC = /[٠-٩۰-۹]/;

async function openPicker(name: string | RegExp = /Select a date|Choose/) {
  const trigger = screen.getByRole('button', { name });
  await userEvent.click(trigger);
  await screen.findByRole('dialog');
  return trigger;
}

describe('DatePicker', () => {
  it('shows the placeholder and opens a calendar dialog', async () => {
    renderWithLocale(<DatePicker defaultMonth="2026-11-01" aria-label="Start date" />);
    const trigger = screen.getByRole('button', { name: /Start date/ });
    expect(trigger).toHaveTextContent('Select a date');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Choose a date' });
    expect(dialog.querySelector('[role="grid"]')).not.toBeNull();
  });

  it('selects a day, formats it, closes and reports an ISO value', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DatePicker aria-label="Date" defaultMonth="2026-11-01" onValueChange={onValueChange} />,
    );
    const trigger = await openPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Wednesday, November 18, 2026' }));
    expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent('November 18, 2026');
    expect(trigger).toHaveFocus();
  });

  it('reflects a controlled value and ignores malformed ones', () => {
    const { rerender } = renderWithLocale(<DatePicker aria-label="Date" value="2026-03-05" />);
    expect(screen.getByRole('button', { name: /Date/ })).toHaveTextContent('March 5, 2026');
    rerender(<DatePicker aria-label="Date" value="not-a-date" />);
    expect(screen.getByRole('button', { name: /Date/ })).toHaveTextContent('Select a date');
  });

  it('supports a shorter date style', () => {
    renderWithLocale(<DatePicker aria-label="Date" value="2026-03-05" dateStyle="medium" />);
    expect(screen.getByRole('button', { name: /Date/ })).toHaveTextContent('Mar 5, 2026');
  });

  it('opens on the selected month and moves focus to the selected day', async () => {
    renderWithLocale(<DatePicker aria-label="Date" defaultValue="2027-02-14" />);
    await openPicker(/Date/);
    expect(screen.getByRole('grid', { name: 'February 2027' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sunday, February 14, 2027' })).toHaveFocus(),
    );
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    renderWithLocale(<DatePicker aria-label="Date" defaultMonth="2026-11-01" />);
    const trigger = await openPicker();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('selects from the keyboard', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DatePicker aria-label="Date" defaultValue="2026-11-18" onValueChange={onValueChange} />,
    );
    await openPicker(/Date/);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Wednesday, November 18, 2026' })).toHaveFocus(),
    );
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('2026-11-19');
  });

  it('respects min and max', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DatePicker
        aria-label="Date"
        defaultMonth="2026-11-01"
        min="2026-11-10"
        max="2026-11-20"
        onValueChange={onValueChange}
      />,
    );
    await openPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Sunday, November 8, 2026' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  describe('clearable', () => {
    it('clears the value and keeps focus on the trigger', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <DatePicker
          aria-label="Date"
          clearable
          defaultValue="2026-11-18"
          onValueChange={onValueChange}
        />,
      );
      const trigger = screen.getByRole('button', { name: /Date/ });
      await userEvent.click(screen.getByRole('button', { name: 'Clear date' }));
      expect(onValueChange).toHaveBeenCalledWith(null);
      expect(trigger).toHaveTextContent('Select a date');
      expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it('hides the clear button when empty, disabled or read-only', () => {
      const { rerender } = renderWithLocale(<DatePicker aria-label="Date" clearable />);
      expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument();
      rerender(<DatePicker aria-label="Date" clearable disabled defaultValue="2026-11-18" />);
      expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument();
      rerender(<DatePicker aria-label="Date" clearable readOnly defaultValue="2026-11-18" />);
      expect(screen.queryByRole('button', { name: 'Clear date' })).not.toBeInTheDocument();
    });
  });

  describe('states', () => {
    it('does not open when disabled', async () => {
      renderWithLocale(<DatePicker aria-label="Date" disabled />);
      const trigger = screen.getByRole('button', { name: /Date/ });
      expect(trigger).toBeDisabled();
      await userEvent.click(trigger);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('stays focusable but does not open when read-only', async () => {
      renderWithLocale(<DatePicker aria-label="Date" readOnly defaultValue="2026-11-18" />);
      const trigger = screen.getByRole('button', { name: /Date/ });
      await userEvent.click(trigger);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveTextContent('November 18, 2026');
    });

    it('shows invalid styling hooks', () => {
      renderWithLocale(<DatePicker aria-label="Date" invalid />);
      expect(screen.getByRole('button', { name: /Date/ })).toHaveAttribute('aria-invalid', 'true');
    });

    it('marks required', () => {
      renderWithLocale(<DatePicker aria-label="Date" required />);
      expect(screen.getByRole('button', { name: /Date/ })).toHaveAttribute('aria-required', 'true');
    });

    it('can be opened and observed from outside', async () => {
      const onOpenChange = vi.fn();
      renderWithLocale(<DatePicker aria-label="Date" onOpenChange={onOpenChange} />);
      await openPicker();
      expect(onOpenChange).toHaveBeenCalledWith(true);
      renderWithLocale(<DatePicker aria-label="Other" defaultOpen />);
      expect(await screen.findAllByRole('dialog')).not.toHaveLength(0);
    });
  });

  describe('forms', () => {
    it('forwards ref, onBlur and writes a hidden input for native forms', async () => {
      const ref = createRef<HTMLButtonElement>();
      const onBlur = vi.fn();
      const { container } = renderWithLocale(
        <DatePicker
          ref={ref}
          name="start"
          aria-label="Date"
          defaultValue="2026-11-18"
          onBlur={onBlur}
        />,
      );
      expect(ref.current).toBe(screen.getByRole('button', { name: /Date/ }));
      expect(container.querySelector<HTMLInputElement>('input[name="start"]')?.value).toBe(
        '2026-11-18',
      );
      ref.current?.focus();
      ref.current?.blur();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('labels the trigger through Field and announces errors', () => {
      renderWithLocale(
        <Field label="Birth date" description="As on your ID" error="Required">
          <DatePicker value="2026-11-18" />
        </Field>,
      );
      const trigger = screen.getByRole('button', { name: /Birth date/ });
      expect(trigger).toHaveAccessibleName('Birth date November 18, 2026');
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(trigger).toHaveAccessibleDescription('As on your ID Required');
      expect(screen.getByRole('alert')).toHaveTextContent('Required');
    });

    it('works with react-hook-form', async () => {
      const seen: unknown[] = [];
      function Form() {
        const { control, watch } = useForm<{ when: string | null }>({
          defaultValues: { when: null },
        });
        seen.push(watch('when'));
        return (
          <Controller
            control={control}
            name="when"
            render={({ field, fieldState }) => (
              <Field label="When" error={fieldState.error?.message}>
                <DatePicker
                  ref={field.ref}
                  name={field.name}
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  defaultMonth="2026-11-01"
                />
              </Field>
            )}
          />
        );
      }
      render(<Form />);
      await userEvent.click(screen.getByRole('button', { name: /When/ }));
      await userEvent.click(
        await screen.findByRole('button', {
          name: 'Wednesday, November 18, 2026',
        }),
      );
      await waitFor(() => expect(seen.at(-1)).toBe('2026-11-18'));
      expect(screen.getByRole('button', { name: /When/ })).toHaveTextContent('November 18, 2026');
    });
  });

  describe('Arabic / RTL', () => {
    it('shows an Arabic placeholder and an Arabic date with Latin digits', () => {
      const { unmount } = renderWithLocale(<DatePicker aria-label="التاريخ" />, { locale: 'ar' });
      expect(screen.getByRole('button', { name: /التاريخ/ })).toHaveTextContent('اختر تاريخاً');
      unmount();
      renderWithLocale(<DatePicker aria-label="التاريخ" value="2026-11-18" />, {
        locale: 'ar',
      });
      const text = screen.getByRole('button', { name: /التاريخ/ }).textContent ?? '';
      expect(text).toContain('تشرين الثاني');
      expect(text).toContain('18');
      expect(text).toContain('2026');
      expect(ARABIC_INDIC.test(text)).toBe(false);
    });

    it('uses Arabic-Indic digits only on request', () => {
      renderWithLocale(<DatePicker aria-label="التاريخ" value="2026-11-18" numerals="locale" />, {
        locale: 'ar',
      });
      expect(
        ARABIC_INDIC.test(screen.getByRole('button', { name: /التاريخ/ }).textContent ?? ''),
      ).toBe(true);
    });

    it('opens an Arabic calendar that starts on Saturday', async () => {
      renderWithLocale(
        <DatePicker aria-label="التاريخ" defaultMonth="2026-11-01" clearable value="2026-11-18" />,
        { locale: 'ar' },
      );
      expect(screen.getByRole('button', { name: 'مسح التاريخ' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /^التاريخ/ }));
      const dialog = await screen.findByRole('dialog', {
        name: 'اختيار التاريخ',
      });
      expect(dialog.querySelectorAll('th')[0]).toHaveAttribute('aria-label', 'السبت');
      expect(screen.getByRole('button', { name: 'الشهر التالي' })).toBeInTheDocument();
    });
  });

  it('has no axe violations (closed, open, in a Field)', async () => {
    const { container, unmount } = renderWithLocale(
      <Field label="Date" description="Pick one">
        <DatePicker defaultValue="2026-11-18" clearable />
      </Field>,
    );
    await expectNoA11yViolations(container);
    unmount();
    renderWithLocale(<DatePicker aria-label="Date" defaultMonth="2026-11-01" />);
    await openPicker();
    await expectNoA11yViolations(document.body);
  });
});

describe('DatePicker with Hijri and dropdowns', () => {
  it('formats the trigger in the Hijri calendar while the value stays Gregorian ISO', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DatePicker
        aria-label="Date"
        calendarSystem="islamic-umalqura"
        defaultMonth="2026-11-16"
        onValueChange={onValueChange}
        name="when"
      />,
    );
    const trigger = await openPicker();
    expect(screen.getByRole('grid', { name: 'Jumada II 1448 AH' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Monday, Jumada II 6, 1448 AH' }));
    expect(onValueChange).toHaveBeenCalledWith('2026-11-16');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent('Jumada II 6, 1448 AH');
    expect(document.querySelector('input[type="hidden"][name="when"]')).toHaveValue('2026-11-16');
  });

  it('reads a controlled Gregorian value in Hijri and in the short style', () => {
    renderWithLocale(
      <DatePicker
        aria-label="Date"
        calendarSystem="islamic-umalqura"
        value="2026-11-16"
        dateStyle="medium"
      />,
    );
    expect(screen.getByRole('button', { name: /Date/ })).toHaveTextContent('Jum. II 6, 1448 AH');
  });

  it('passes the secondary calendar and caption layout to the calendar', async () => {
    renderWithLocale(
      <DatePicker
        aria-label="Date"
        calendarSystem="islamic-umalqura"
        secondaryCalendar="gregory"
        captionLayout="dropdowns"
        defaultValue="2026-11-16"
      />,
    );
    await openPicker(/Date/);
    expect(document.querySelectorAll('[data-slot="calendar-secondary-day"]')).toHaveLength(29);
    expect(screen.getByRole('combobox', { name: 'Month' })).toHaveValue('6');
    expect(screen.getByRole('combobox', { name: 'Year' })).toHaveValue('1448');
    // Choosing from a native select inside the popover does not close it.
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Month' }), 'Ramadan');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Ramadan 1448 AH' })).toBeInTheDocument();
  });

  it('shows Arabic Hijri text with Latin digits, and locale digits on request', () => {
    const { unmount } = renderWithLocale(
      <DatePicker aria-label="التاريخ" calendarSystem="islamic-umalqura" value="2026-11-16" />,
      { locale: 'ar' },
    );
    const text = screen.getByRole('button', { name: /التاريخ/ }).textContent ?? '';
    expect(text).toContain('6 جمادى الآخرة 1448');
    expect(ARABIC_INDIC.test(text)).toBe(false);
    unmount();
    renderWithLocale(
      <DatePicker
        aria-label="التاريخ"
        calendarSystem="islamic-umalqura"
        value="2026-11-16"
        numerals="locale"
      />,
      { locale: 'ar' },
    );
    expect(screen.getByRole('button', { name: /التاريخ/ })).toHaveTextContent('٦ جمادى الآخرة ١٤٤٨');
  });

  it('opens an Arabic Hijri calendar with dropdowns and no axe violations', async () => {
    renderWithLocale(
      <DatePicker
        aria-label="التاريخ"
        calendarSystem="islamic-umalqura"
        secondaryCalendar="gregory"
        captionLayout="dropdowns"
        value="2026-11-16"
      />,
      { locale: 'ar' },
    );
    await userEvent.click(screen.getByRole('button', { name: /^التاريخ/ }));
    await screen.findByRole('dialog', { name: 'اختيار التاريخ' });
    expect(screen.getByRole('combobox', { name: 'السنة' })).toHaveValue('1448');
    expect(screen.getByRole('grid', { name: 'جمادى الآخرة 1448 هـ' })).toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });
});
