import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  CalendarCaption,
  CalendarNav,
  type CalendarCaptionProps,
} from '@/components/ui/calendar-header';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const ARABIC_INDIC = /[٠-٩]/;

function Caption(props: Partial<CalendarCaptionProps>) {
  return (
    <CalendarCaption
      id="caption"
      layout="dropdowns"
      monthIso="2026-11-10"
      system="gregory"
      format={{ locale: 'en', numerals: 'latn' }}
      disabled={false}
      monthLabel="Month"
      yearLabel="Year"
      onSelectMonth={() => {}}
      {...props}
    />
  );
}

function navProps(overrides: Partial<Parameters<typeof CalendarNav>[0]> = {}) {
  return {
    previousLabel: 'Previous month',
    nextLabel: 'Next month',
    previousDisabled: false,
    nextDisabled: false,
    onPrevious: () => {},
    onNext: () => {},
    ...overrides,
  };
}

describe('CalendarNav', () => {
  it('calls the handlers and can disable each direction', async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    const { rerender } = renderWithLocale(<CalendarNav {...navProps({ onPrevious, onNext })} />);
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    rerender(<CalendarNav {...navProps({ previousDisabled: true, nextDisabled: true })} />);
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('mirrors its chevrons in Arabic', () => {
    renderWithLocale(
      <CalendarNav {...navProps({ previousLabel: 'الشهر السابق', nextLabel: 'الشهر التالي' })} />,
      { locale: 'ar' },
    );
    expect(screen.getByRole('button', { name: 'الشهر السابق' }).querySelector('svg')).toHaveClass(
      'rtl:-scale-x-100',
    );
    expect(screen.getByRole('button', { name: 'الشهر التالي' }).querySelector('svg')).toHaveClass(
      'rtl:-scale-x-100',
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<CalendarNav {...navProps()} />);
    await expectNoA11yViolations(container);
  });
});

describe('CalendarCaption', () => {
  it('renders live text for the buttons layout', () => {
    renderWithLocale(<Caption layout="buttons" />);
    const caption = screen.getByText('November 2026');
    expect(caption).toHaveAttribute('id', 'caption');
    expect(caption).toHaveAttribute('aria-live', 'polite');
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('renders the Hijri title in the buttons layout', () => {
    renderWithLocale(<Caption layout="buttons" system="islamic-umalqura" monthIso="2026-11-16" />);
    expect(screen.getByText('Jumada II 1448 AH')).toBeInTheDocument();
  });

  it('renders month and year selects with the current values and a hidden title', () => {
    renderWithLocale(<Caption />);
    expect(screen.getByRole('combobox', { name: 'Month' })).toHaveValue('11');
    expect(screen.getByRole('combobox', { name: 'Year' })).toHaveValue('2026');
    const title = document.getElementById('caption');
    expect(title).toHaveTextContent('November 2026');
    expect(title).toHaveClass('sr-only');
  });

  it('reports the chosen year and month', async () => {
    const onSelectMonth = vi.fn();
    renderWithLocale(<Caption onSelectMonth={onSelectMonth} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Month' }), 'March');
    expect(onSelectMonth).toHaveBeenLastCalledWith(2026, 3);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '2030');
    expect(onSelectMonth).toHaveBeenLastCalledWith(2030, 11);
  });

  it('reports Hijri years and months, not Gregorian ones', async () => {
    const onSelectMonth = vi.fn();
    renderWithLocale(
      <Caption system="islamic-umalqura" monthIso="2026-11-16" onSelectMonth={onSelectMonth} />,
    );
    expect(screen.getByRole('combobox', { name: 'Year' })).toHaveValue('1448');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Month' }), 'Ramadan');
    expect(onSelectMonth).toHaveBeenLastCalledWith(1448, 9);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '1450');
    expect(onSelectMonth).toHaveBeenLastCalledWith(1450, 6);
  });

  it('offers only the years between min and max and disables months outside them', () => {
    renderWithLocale(<Caption monthIso="2026-02-10" min="2026-01-20" max="2026-04-05" />);
    const years = within(screen.getByRole('combobox', { name: 'Year' })).getAllByRole('option');
    expect(years.map((option) => option.textContent)).toEqual(['2026']);
    const months = within(screen.getByRole('combobox', { name: 'Month' })).getAllByRole('option');
    const enabled = months.filter(
      (option) => !(option instanceof HTMLOptionElement && option.disabled),
    );
    expect(enabled.map((option) => option.textContent)).toEqual([
      'January',
      'February',
      'March',
      'April',
    ]);
  });

  it('disables both selects', () => {
    renderWithLocale(<Caption disabled />);
    expect(screen.getByRole('combobox', { name: 'Month' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Year' })).toBeDisabled();
  });

  describe('Arabic / RTL', () => {
    const arabic = { locale: 'ar', numerals: 'latn' } as const;

    it('localises names with Latin digits', () => {
      renderWithLocale(
        <Caption
          system="islamic-umalqura"
          monthIso="2026-11-16"
          format={arabic}
          monthLabel="الشهر"
          yearLabel="السنة"
        />,
        { locale: 'ar' },
      );
      const month = screen.getByRole('combobox', { name: 'الشهر' });
      expect(within(month).getAllByRole('option')[0]).toHaveTextContent('محرم');
      expect(month).toHaveValue('6');
      expect(document.getElementById('caption')).toHaveTextContent('جمادى الآخرة 1448 هـ');
      expect(
        ARABIC_INDIC.test(screen.getByRole('combobox', { name: 'السنة' }).textContent ?? ''),
      ).toBe(false);
    });

    it('writes years with Arabic-Indic digits on request', () => {
      renderWithLocale(
        <Caption
          system="islamic-umalqura"
          monthIso="2026-11-16"
          format={{ locale: 'ar', numerals: 'locale' }}
        />,
        { locale: 'ar' },
      );
      expect(
        within(screen.getByRole('combobox', { name: 'Year' })).getByRole('option', {
          name: '١٤٤٨',
        }),
      ).toBeInTheDocument();
    });
  });

  it('has no axe violations (buttons, dropdowns, Arabic Hijri)', async () => {
    const buttons = renderWithLocale(
      <div>
        <Caption layout="buttons" />
        <table role="grid" aria-labelledby="caption" />
      </div>,
    );
    await expectNoA11yViolations(buttons.container);
    buttons.unmount();
    const dropdowns = renderWithLocale(<Caption />);
    await expectNoA11yViolations(dropdowns.container);
    dropdowns.unmount();
    const arabic = renderWithLocale(
      <Caption
        system="islamic-umalqura"
        monthIso="2026-11-16"
        format={{ locale: 'ar', numerals: 'latn' }}
        monthLabel="الشهر"
        yearLabel="السنة"
      />,
      { locale: 'ar' },
    );
    await expectNoA11yViolations(arabic.container);
  });
});
