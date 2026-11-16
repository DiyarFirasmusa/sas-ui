import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Field } from '@/components/ui/field';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const ARABIC_INDIC = /[٠-٩۰-۹]/;
const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

function useWideViewport() {
  window.matchMedia = (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

function dayButton(label: string) {
  return screen.getByRole('button', { name: label });
}

async function open(name: string | RegExp = /Range/) {
  const trigger = screen.getByRole('button', { name });
  await userEvent.click(trigger);
  await screen.findByRole('dialog');
  return trigger;
}

describe('DateRangePicker', () => {
  it('shows a placeholder and opens a range calendar', async () => {
    renderWithLocale(<DateRangePicker aria-label="Range" defaultMonth="2026-11-01" />);
    const trigger = screen.getByRole('button', { name: /Range/ });
    expect(trigger).toHaveTextContent('Select a date range');
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', {
      name: 'Choose a date range',
    });
    expect(dialog.querySelector('[role="grid"]')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('commits only a complete range, then closes and shows it', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        defaultMonth="2026-11-01"
        onValueChange={onValueChange}
      />,
    );
    const trigger = await open();
    await userEvent.click(dayButton('Tuesday, November 10, 2026'));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(dayButton('Saturday, November 14, 2026'));
    expect(onValueChange).toHaveBeenCalledWith({
      from: '2026-11-10',
      to: '2026-11-14',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger.textContent).toMatch(/November 10\s*[–-]\s*14, 2026/);
    expect(trigger).toHaveFocus();
  });

  it('starts over from the saved value when reopened mid-selection', async () => {
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        defaultMonth="2026-11-01"
        defaultValue={{ from: '2026-11-02', to: '2026-11-04' }}
      />,
    );
    await open();
    await userEvent.click(dayButton('Tuesday, November 10, 2026'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await open();
    expect(dayButton('Monday, November 2, 2026')).toHaveAttribute('data-range-start');
    expect(dayButton('Wednesday, November 4, 2026')).toHaveAttribute('data-range-end');
    expect(dayButton('Tuesday, November 10, 2026')).not.toHaveAttribute('data-selected');
  });

  it('reflects a controlled value', () => {
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        dateStyle="medium"
        value={{ from: '2026-03-05', to: '2026-03-09' }}
      />,
    );
    expect(screen.getByRole('button', { name: /Range/ }).textContent).toMatch(
      /Mar 5\s*[–-]\s*9, 2026/,
    );
  });

  it('shows a half-open range with a trailing dash', () => {
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        value={{ from: '2026-03-05', to: null }}
        dateStyle="medium"
      />,
    );
    expect(screen.getByRole('button', { name: /Range/ })).toHaveTextContent('Mar 5, 2026 –');
  });

  it('shows two months on a wide viewport and one on a narrow one', async () => {
    const { unmount } = renderWithLocale(
      <DateRangePicker aria-label="Range" defaultMonth="2026-11-01" />,
    );
    await open();
    expect(screen.getAllByRole('grid')).toHaveLength(1);
    unmount();
    useWideViewport();
    renderWithLocale(<DateRangePicker aria-label="Range" defaultMonth="2026-11-01" />);
    await open();
    expect(screen.getAllByRole('grid')).toHaveLength(2);
    expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
  });

  it('applies a preset in one click', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        defaultMonth="2026-11-01"
        onValueChange={onValueChange}
        presets={[
          {
            label: 'First week',
            value: { from: '2026-11-01', to: '2026-11-07' },
          },
        ]}
      />,
    );
    await open();
    expect(screen.getByRole('group', { name: 'Quick ranges' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'First week' }));
    expect(onValueChange).toHaveBeenCalledWith({
      from: '2026-11-01',
      to: '2026-11-07',
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('clears to an empty range', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        clearable
        defaultValue={{ from: '2026-11-02', to: '2026-11-04' }}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Clear dates' }));
    expect(onValueChange).toHaveBeenCalledWith({ from: null, to: null });
    expect(screen.getByRole('button', { name: /Range/ })).toHaveTextContent('Select a date range');
  });

  it('respects min and max', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        defaultMonth="2026-11-01"
        min="2026-11-05"
        max="2026-11-25"
        onValueChange={onValueChange}
      />,
    );
    await open();
    await userEvent.click(dayButton('Sunday, November 1, 2026'));
    await userEvent.click(dayButton('Monday, November 2, 2026'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('does not open when disabled or read-only', async () => {
    const { unmount } = renderWithLocale(<DateRangePicker aria-label="Range" disabled />);
    await userEvent.click(screen.getByRole('button', { name: /Range/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        readOnly
        clearable
        defaultValue={{ from: '2026-11-02', to: '2026-11-04' }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Range/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear dates' })).not.toBeInTheDocument();
  });

  it('forwards ref/onBlur, marks invalid and writes hidden inputs', () => {
    const ref = createRef<HTMLButtonElement>();
    const onBlur = vi.fn();
    const { container } = renderWithLocale(
      <DateRangePicker
        ref={ref}
        name="stay"
        aria-label="Range"
        invalid
        onBlur={onBlur}
        defaultValue={{ from: '2026-11-02', to: '2026-11-04' }}
      />,
    );
    expect(ref.current).toBe(screen.getByRole('button', { name: /Range/ }));
    expect(ref.current).toHaveAttribute('aria-invalid', 'true');
    expect(container.querySelector<HTMLInputElement>('input[name="stay-from"]')?.value).toBe(
      '2026-11-02',
    );
    expect(container.querySelector<HTMLInputElement>('input[name="stay-to"]')?.value).toBe(
      '2026-11-04',
    );
    ref.current?.focus();
    ref.current?.blur();
    expect(onBlur).toHaveBeenCalled();
  });

  it('works inside Field', () => {
    renderWithLocale(
      <Field label="Stay" error="Pick dates">
        <DateRangePicker />
      </Field>,
    );
    const trigger = screen.getByRole('button', { name: /Stay/ });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAccessibleDescription('Pick dates');
  });

  describe('Arabic / RTL', () => {
    it('uses Arabic text, Latin digits and a Saturday-first calendar', async () => {
      renderWithLocale(
        <DateRangePicker
          aria-label="الفترة"
          defaultMonth="2026-11-01"
          clearable
          value={{ from: '2026-11-10', to: '2026-11-14' }}
        />,
        { locale: 'ar' },
      );
      const trigger = screen.getByRole('button', { name: /^الفترة/ });
      expect(trigger.textContent).toContain('تشرين الثاني');
      expect(trigger.textContent).toContain('2026');
      expect(ARABIC_INDIC.test(trigger.textContent ?? '')).toBe(false);
      expect(screen.getByRole('button', { name: 'مسح التواريخ' })).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await screen.findByRole('dialog', {
        name: 'اختيار فترة زمنية',
      });
      expect(dialog.querySelectorAll('th')[0]).toHaveAttribute('aria-label', 'السبت');
    });

    it('shows the Arabic placeholder', () => {
      renderWithLocale(<DateRangePicker aria-label="الفترة" />, {
        locale: 'ar',
      });
      expect(screen.getByRole('button', { name: /الفترة/ })).toHaveTextContent('اختر فترة زمنية');
    });
  });

  it('has no axe violations (closed and open)', async () => {
    const { container, unmount } = renderWithLocale(
      <Field label="Stay">
        <DateRangePicker clearable defaultValue={{ from: '2026-11-02', to: '2026-11-04' }} />
      </Field>,
    );
    await expectNoA11yViolations(container);
    unmount();
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        defaultMonth="2026-11-01"
        presets={[
          {
            label: 'First week',
            value: { from: '2026-11-01', to: '2026-11-07' },
          },
        ]}
      />,
    );
    await open();
    await expectNoA11yViolations(document.body);
  });
});

describe('DateRangePicker with Hijri and dropdowns', () => {
  it('formats the range in the Hijri calendar and commits Gregorian ISO values', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        calendarSystem="islamic-umalqura"
        defaultMonth="2026-11-16"
        numberOfMonths={1}
        onValueChange={onValueChange}
        name="period"
      />,
    );
    const trigger = await open();
    expect(screen.getByRole('grid', { name: 'Jumada II 1448 AH' })).toBeInTheDocument();
    await userEvent.click(dayButton('Wednesday, Jumada II 1, 1448 AH'));
    await userEvent.click(dayButton('Monday, Jumada II 6, 1448 AH'));
    expect(onValueChange).toHaveBeenCalledWith({ from: '2026-11-11', to: '2026-11-16' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger.textContent).toMatch(/Jumada II 1\s–\s6, 1448 AH/);
    expect(document.querySelector('input[name="period-from"]')).toHaveValue('2026-11-11');
    expect(document.querySelector('input[name="period-to"]')).toHaveValue('2026-11-16');
  });

  it('passes secondary calendar and dropdown captions through to both months', async () => {
    useWideViewport();
    renderWithLocale(
      <DateRangePicker
        aria-label="Range"
        calendarSystem="islamic-umalqura"
        secondaryCalendar="gregory"
        captionLayout="dropdowns"
        defaultMonth="2026-11-16"
      />,
    );
    await open();
    expect(screen.getAllByRole('combobox', { name: 'Month' })).toHaveLength(2);
    expect(screen.getByRole('grid', { name: 'Rajab 1448 AH' })).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-slot="calendar-secondary-day"]').length,
    ).toBeGreaterThan(50);
  });

  it('shows an Arabic Hijri range with Latin digits', async () => {
    renderWithLocale(
      <DateRangePicker
        aria-label="الفترة"
        calendarSystem="islamic-umalqura"
        captionLayout="dropdowns"
        value={{ from: '2026-11-11', to: '2026-11-16' }}
      />,
      { locale: 'ar' },
    );
    const trigger = screen.getByRole('button', { name: /^الفترة/ });
    expect(trigger.textContent).toContain('جمادى الآخرة 1448');
    expect(ARABIC_INDIC.test(trigger.textContent ?? '')).toBe(false);
    await userEvent.click(trigger);
    await screen.findByRole('dialog', { name: 'اختيار فترة زمنية' });
    expect(screen.getAllByRole('combobox', { name: 'السنة' })[0]).toHaveValue('1448');
    await expectNoA11yViolations(document.body);
  });
});
