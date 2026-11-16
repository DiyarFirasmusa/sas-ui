import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Calendar, type DateRangeValue } from '@/components/ui/calendar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const ARABIC_INDIC = /[٠-٩۰-۹]/;

function day(iso: string) {
  const [year, month, date] = iso.split('-').map(Number);
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const weekday = new Date(year ?? 0, (month ?? 1) - 1, date).toLocaleDateString('en-US', {
    weekday: 'long',
  });
  return screen.getByRole('button', {
    name: `${weekday}, ${names[(month ?? 1) - 1]} ${date}, ${year}`,
  });
}

function cellOf(button: HTMLElement) {
  const cell = button.closest('td');
  if (!cell) {
    throw new Error('day button has no cell');
  }
  return cell;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('Calendar', () => {
  it('renders a labelled month grid starting on Sunday in English', () => {
    renderWithLocale(<Calendar defaultMonth="2026-11-10" />);
    const grid = screen.getByRole('grid', { name: 'November 2026' });
    const headers = within(grid).getAllByRole('columnheader');
    expect(headers.map((header) => header.getAttribute('aria-label'))).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
    expect(within(grid).getAllByRole('button')).toHaveLength(30);
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next month' })).toBeInTheDocument();
  });

  it('selects a single day and reports an ISO string', async () => {
    const onValueChange = vi.fn();
    renderWithLocale(<Calendar defaultMonth="2026-11-01" onValueChange={onValueChange} />);
    await userEvent.click(day('2026-11-18'));
    expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
    expect(cellOf(day('2026-11-18'))).toHaveAttribute('aria-selected', 'true');
    expect(cellOf(day('2026-11-19'))).toHaveAttribute('aria-selected', 'false');
  });

  it('shows a controlled value and opens on its month', () => {
    renderWithLocale(<Calendar value="2027-02-14" />);
    expect(screen.getByRole('grid', { name: 'February 2027' })).toBeInTheDocument();
    expect(cellOf(day('2027-02-14'))).toHaveAttribute('aria-selected', 'true');
  });

  it('marks today with aria-current', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 12));
    renderWithLocale(<Calendar />);
    expect(day('2026-11-16')).toHaveAttribute('aria-current', 'date');
    expect(day('2026-11-17')).not.toHaveAttribute('aria-current');
  });

  it('navigates months with the header buttons and reports them', async () => {
    const onMonthChange = vi.fn();
    renderWithLocale(<Calendar defaultMonth="2026-11-10" onMonthChange={onMonthChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-12-01');
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-10-01');
  });

  it('follows a controlled month', () => {
    const { rerender } = renderWithLocale(<Calendar month="2026-03-15" />);
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    rerender(<Calendar month="2026-04-02" />);
    expect(screen.getByRole('grid', { name: 'April 2026' })).toBeInTheDocument();
  });

  it('can start the week on another day', () => {
    renderWithLocale(<Calendar defaultMonth="2026-11-01" weekStartsOn={1} />);
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveAttribute('aria-label', 'Monday');
    expect(headers[6]).toHaveAttribute('aria-label', 'Sunday');
  });

  describe('bounds and disabled days', () => {
    it('ignores clicks outside min/max and disables the matching month buttons', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <Calendar
          defaultMonth="2026-11-01"
          min="2026-11-10"
          max="2026-11-20"
          onValueChange={onValueChange}
        />,
      );
      expect(day('2026-11-09')).toHaveAttribute('aria-disabled', 'true');
      expect(day('2026-11-21')).toHaveAttribute('aria-disabled', 'true');
      expect(day('2026-11-10')).not.toHaveAttribute('aria-disabled');
      await userEvent.click(day('2026-11-09'));
      await userEvent.click(day('2026-11-21'));
      expect(onValueChange).not.toHaveBeenCalled();
      await userEvent.click(day('2026-11-20'));
      expect(onValueChange).toHaveBeenCalledWith('2026-11-20');
      expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    });

    it('applies a custom predicate', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <Calendar
          defaultMonth="2026-11-01"
          isDateDisabled={(date) => date.getDay() === 5}
          onValueChange={onValueChange}
        />,
      );
      expect(day('2026-11-20')).toHaveAttribute('aria-disabled', 'true'); // a Friday
      await userEvent.click(day('2026-11-20'));
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('does nothing when disabled', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <Calendar defaultMonth="2026-11-01" disabled onValueChange={onValueChange} />,
      );
      await userEvent.click(day('2026-11-18'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
    });

    it('lets a read-only calendar navigate but not select', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <Calendar
          defaultMonth="2026-11-01"
          value="2026-11-05"
          readOnly
          onValueChange={onValueChange}
        />,
      );
      await userEvent.click(day('2026-11-18'));
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole('grid')).toHaveAttribute('aria-readonly', 'true');
      await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
      expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
    });
  });

  describe('multiple mode', () => {
    it('toggles days and keeps them sorted', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <Calendar mode="multiple" defaultMonth="2026-11-01" onValueChange={onValueChange} />,
      );
      await userEvent.click(day('2026-11-20'));
      await userEvent.click(day('2026-11-05'));
      expect(onValueChange).toHaveBeenLastCalledWith(['2026-11-05', '2026-11-20']);
      expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
      await userEvent.click(day('2026-11-20'));
      expect(onValueChange).toHaveBeenLastCalledWith(['2026-11-05']);
      expect(cellOf(day('2026-11-20'))).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('range mode', () => {
    function Harness({ onValueChange }: { onValueChange?: (value: DateRangeValue) => void }) {
      const [value, setValue] = useState<DateRangeValue>({
        from: null,
        to: null,
      });
      return (
        <Calendar
          mode="range"
          defaultMonth="2026-11-01"
          value={value}
          onValueChange={(next) => {
            setValue(next);
            onValueChange?.(next);
          }}
        />
      );
    }

    it('picks a start then an end and paints the band', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(<Harness onValueChange={onValueChange} />);
      await userEvent.click(day('2026-11-10'));
      expect(onValueChange).toHaveBeenLastCalledWith({
        from: '2026-11-10',
        to: null,
      });
      await userEvent.click(day('2026-11-14'));
      expect(onValueChange).toHaveBeenLastCalledWith({
        from: '2026-11-10',
        to: '2026-11-14',
      });
      expect(day('2026-11-10')).toHaveAttribute('data-range-start');
      expect(day('2026-11-14')).toHaveAttribute('data-range-end');
      expect(day('2026-11-12')).toHaveAttribute('data-range-middle');
      expect(cellOf(day('2026-11-12'))).toHaveAttribute('aria-selected', 'true');
      expect(cellOf(day('2026-11-15'))).toHaveAttribute('aria-selected', 'false');
    });

    it('accepts the end date first and restarts after a complete range', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(<Harness onValueChange={onValueChange} />);
      await userEvent.click(day('2026-11-20'));
      await userEvent.click(day('2026-11-12'));
      expect(onValueChange).toHaveBeenLastCalledWith({
        from: '2026-11-12',
        to: '2026-11-20',
      });
      await userEvent.click(day('2026-11-25'));
      expect(onValueChange).toHaveBeenLastCalledWith({
        from: '2026-11-25',
        to: null,
      });
    });

    it('draws a backwards controlled value in order', () => {
      renderWithLocale(<Calendar mode="range" value={{ from: '2026-11-14', to: '2026-11-10' }} />);
      expect(day('2026-11-10')).toHaveAttribute('data-range-start');
      expect(day('2026-11-14')).toHaveAttribute('data-range-end');
    });

    it('renders two months side by side', () => {
      renderWithLocale(<Calendar mode="range" defaultMonth="2026-11-01" numberOfMonths={2} />);
      expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
      expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
    });
  });

  describe('keyboard (APG grid)', () => {
    it('has a single tab stop on the selected day', () => {
      renderWithLocale(<Calendar defaultMonth="2026-11-01" value="2026-11-18" />);
      const stops = screen
        .getAllByRole('button')
        .filter((button) => button.getAttribute('tabindex') === '0' && button.dataset.date);
      expect(stops.map((button) => button.dataset.date)).toEqual(['2026-11-18']);
    });

    it('moves by day and week with the arrow keys', async () => {
      renderWithLocale(<Calendar defaultMonth="2026-11-01" value="2026-11-18" />);
      day('2026-11-18').focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(day('2026-11-19')).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
      expect(day('2026-11-17')).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(day('2026-11-24')).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      expect(day('2026-11-10')).toHaveFocus();
    });

    it('goes to the first and last day of the week with Home and End', async () => {
      renderWithLocale(<Calendar defaultMonth="2026-11-01" value="2026-11-18" />);
      day('2026-11-18').focus();
      await userEvent.keyboard('{Home}');
      expect(day('2026-11-15')).toHaveFocus(); // Sunday
      await userEvent.keyboard('{End}');
      expect(day('2026-11-21')).toHaveFocus(); // Saturday
    });

    it('crosses month boundaries and updates the visible month', async () => {
      renderWithLocale(<Calendar defaultMonth="2026-11-01" value="2026-11-30" />);
      day('2026-11-30').focus();
      await userEvent.keyboard('{ArrowRight}');
      expect(screen.getByRole('grid', { name: 'December 2026' })).toBeInTheDocument();
      expect(day('2026-12-01')).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
      expect(day('2026-11-30')).toHaveFocus();
    });

    it('changes month with PageDown/PageUp and year with Shift', async () => {
      renderWithLocale(<Calendar defaultMonth="2026-01-01" value="2026-01-31" />);
      day('2026-01-31').focus();
      await userEvent.keyboard('{PageDown}');
      expect(screen.getByRole('grid', { name: 'February 2026' })).toBeInTheDocument();
      expect(day('2026-02-28')).toHaveFocus(); // 31 clamps to month end
      await userEvent.keyboard('{PageUp}');
      expect(screen.getByRole('grid', { name: 'January 2026' })).toBeInTheDocument();
      await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
      expect(screen.getByRole('grid', { name: 'January 2027' })).toBeInTheDocument();
    });

    it('never moves focus outside min/max', async () => {
      renderWithLocale(
        <Calendar defaultMonth="2026-11-01" value="2026-11-11" min="2026-11-10" max="2026-11-12" />,
      );
      day('2026-11-11').focus();
      await userEvent.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}');
      expect(day('2026-11-10')).toHaveFocus();
      await userEvent.keyboard('{ArrowDown}');
      expect(day('2026-11-12')).toHaveFocus();
    });

    it('selects the focused day with Enter and Space', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <Calendar defaultMonth="2026-11-01" value="2026-11-18" onValueChange={onValueChange} />,
      );
      day('2026-11-18').focus();
      await userEvent.keyboard('{ArrowRight}{Enter}');
      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-19');
      await userEvent.keyboard('{ArrowRight} ');
      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-20');
    });
  });

  describe('Arabic / RTL', () => {
    it('uses Arabic month and weekday names with Saturday first', () => {
      renderWithLocale(<Calendar defaultMonth="2026-11-01" />, {
        locale: 'ar',
      });
      expect(screen.getByRole('grid', { name: 'تشرين الثاني 2026' })).toBeInTheDocument();
      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveAttribute('aria-label', 'السبت');
      expect(headers[1]).toHaveAttribute('aria-label', 'الأحد');
      expect(headers[6]).toHaveAttribute('aria-label', 'الجمعة');
    });

    it('renders Latin digits by default and Arabic-Indic digits on request', () => {
      const { unmount } = renderWithLocale(<Calendar defaultMonth="2026-11-01" />, {
        locale: 'ar',
      });
      const grid = screen.getByRole('grid');
      expect(grid.textContent).toContain('30');
      expect(ARABIC_INDIC.test(document.body.textContent ?? '')).toBe(false);
      unmount();
      renderWithLocale(<Calendar defaultMonth="2026-11-01" numerals="locale" />, { locale: 'ar' });
      expect(screen.getByRole('grid').textContent).toContain('٣٠');
      expect(ARABIC_INDIC.test(screen.getByRole('grid').textContent ?? '')).toBe(true);
    });

    it('localises the month buttons and mirrors their chevrons', () => {
      renderWithLocale(<Calendar defaultMonth="2026-11-01" />, {
        locale: 'ar',
      });
      const previous = screen.getByRole('button', { name: 'الشهر السابق' });
      const next = screen.getByRole('button', { name: 'الشهر التالي' });
      expect(previous.querySelector('svg')).toHaveClass('rtl:-scale-x-100');
      expect(next.querySelector('svg')).toHaveClass('rtl:-scale-x-100');
    });

    it('lets labels be overridden', () => {
      renderWithLocale(
        <Calendar
          defaultMonth="2026-11-01"
          labels={{ nextMonth: 'Later', previousMonth: 'Earlier' }}
        />,
      );
      expect(screen.getByRole('button', { name: 'Later' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Earlier' })).toBeInTheDocument();
    });

    it('mirrors the horizontal arrow keys', async () => {
      renderWithLocale(<Calendar defaultMonth="2026-11-01" value="2026-11-18" />, { locale: 'ar' });
      const focusDay = (date: number) =>
        screen.getByRole('button', {
          name: new RegExp(`${date} تشرين الثاني 2026`),
        });
      focusDay(18).focus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(focusDay(19)).toHaveFocus(); // visually left = later day in RTL
      await userEvent.keyboard('{ArrowRight}{ArrowRight}');
      expect(focusDay(17)).toHaveFocus();
    });

    it('selects with Arabic labels and an ISO value', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(<Calendar defaultMonth="2026-11-01" onValueChange={onValueChange} />, {
        locale: 'ar',
      });
      await userEvent.click(screen.getByRole('button', { name: /18 تشرين الثاني 2026/ }));
      expect(onValueChange).toHaveBeenCalledWith('2026-11-18');
    });
  });

  it('forwards DOM props to the root', () => {
    render(<Calendar defaultMonth="2026-11-01" data-testid="cal" className="custom" />);
    expect(screen.getByTestId('cal')).toHaveClass('custom');
  });

  it('has no axe violations (single, range, Arabic)', async () => {
    const { container, unmount } = renderWithLocale(
      <Calendar defaultMonth="2026-11-01" value="2026-11-18" />,
    );
    await expectNoA11yViolations(container);
    unmount();
    const range = renderWithLocale(
      <Calendar
        mode="range"
        numberOfMonths={2}
        defaultMonth="2026-11-01"
        value={{ from: '2026-11-10', to: '2026-11-14' }}
      />,
      { locale: 'ar' },
    );
    await expectNoA11yViolations(range.container);
  });
});

const HIJRI = 'islamic-umalqura';

/** Day button by its Gregorian ISO date, whatever calendar the labels use. */
function byDate(iso: string) {
  const button = document.querySelector<HTMLElement>(`[data-date="${iso}"]`);
  if (!button) {
    throw new Error(`no day ${iso}`);
  }
  return button;
}

describe('Calendar with the Hijri system', () => {
  it('shows the Hijri month, Hijri day numbers and Hijri names (English)', () => {
    renderWithLocale(<Calendar calendarSystem={HIJRI} defaultMonth="2026-11-16" />);
    // Jumada II 1448 runs 2026-11-11 .. 2026-12-09 in the Umm al-Qura table.
    const grid = screen.getByRole('grid', { name: 'Jumada II 1448 AH' });
    const buttons = within(grid).getAllByRole('button');
    expect(buttons).toHaveLength(29);
    expect(buttons[0]).toHaveAttribute('data-date', '2026-11-11');
    expect(buttons[0]).toHaveTextContent('1');
    expect(buttons[28]).toHaveAttribute('data-date', '2026-12-09');
    expect(buttons[28]).toHaveTextContent('29');
    expect(byDate('2026-11-16')).toHaveAccessibleName('Monday, Jumada II 6, 1448 AH');
  });

  it('keeps values, callbacks and month events as Gregorian ISO strings', async () => {
    const onValueChange = vi.fn();
    const onMonthChange = vi.fn();
    renderWithLocale(
      <Calendar
        calendarSystem={HIJRI}
        defaultMonth="2026-11-16"
        onValueChange={onValueChange}
        onMonthChange={onMonthChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Monday, Jumada II 6, 1448 AH' }));
    expect(onValueChange).toHaveBeenCalledWith('2026-11-16');
    expect(cellOf(byDate('2026-11-16'))).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('grid', { name: 'Rajab 1448 AH' })).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-12-10');
    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-11-11');
  });

  it('opens on the month of a controlled Gregorian value', () => {
    renderWithLocale(<Calendar calendarSystem={HIJRI} value="2026-06-16" />);
    expect(screen.getByRole('grid', { name: 'Muharram 1448 AH' })).toBeInTheDocument();
    expect(cellOf(byDate('2026-06-16'))).toHaveAttribute('aria-selected', 'true');
  });

  it('follows a controlled month and re-reads it when the system changes', () => {
    const { rerender } = renderWithLocale(<Calendar month="2026-11-16" />);
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    rerender(<Calendar month="2026-11-16" calendarSystem={HIJRI} />);
    expect(screen.getByRole('grid', { name: 'Jumada II 1448 AH' })).toBeInTheDocument();
  });

  it('moves PageUp/PageDown by Hijri month and Shift by Hijri year', async () => {
    renderWithLocale(
      <Calendar calendarSystem={HIJRI} defaultMonth="2026-11-16" value="2026-11-16" />,
    );
    byDate('2026-11-16').focus();
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: 'Rajab 1448 AH' })).toBeInTheDocument();
    expect(byDate('2026-12-15')).toHaveFocus(); // 6 Rajab, the Rajab 1st is 2026-12-10
    await userEvent.keyboard('{PageUp}{PageUp}');
    expect(screen.getByRole('grid', { name: 'Jumada I 1448 AH' })).toBeInTheDocument();
    expect(byDate('2026-10-17')).toHaveFocus(); // 6 Jumada I
    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(screen.getByRole('grid', { name: 'Jumada I 1449 AH' })).toBeInTheDocument();
  });

  it('crosses the Hijri month boundary with the arrow keys', async () => {
    renderWithLocale(
      <Calendar calendarSystem={HIJRI} defaultMonth="2026-11-16" value="2026-12-09" />,
    );
    byDate('2026-12-09').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('grid', { name: 'Rajab 1448 AH' })).toBeInTheDocument();
    expect(byDate('2026-12-10')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('grid', { name: 'Jumada II 1448 AH' })).toBeInTheDocument();
    expect(byDate('2026-12-09')).toHaveFocus();
  });

  it('clamps a month move to a shorter Hijri month', async () => {
    // 30 Dhu al-Qa'dah 1447 is 2026-05-17; Dhu al-Hijjah 1447 has 29 days.
    renderWithLocale(<Calendar calendarSystem={HIJRI} value="2026-05-17" />);
    byDate('2026-05-17').focus();
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: 'Dhuʻl-Hijjah 1447 AH' })).toBeInTheDocument();
    expect(byDate('2026-06-15')).toHaveFocus(); // 29 Dhu al-Hijjah
  });

  it('honours min and max with Hijri navigation', async () => {
    renderWithLocale(
      <Calendar
        calendarSystem={HIJRI}
        defaultMonth="2026-11-16"
        min="2026-11-14"
        max="2026-12-12"
      />,
    );
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
    expect(byDate('2026-11-13')).toHaveAttribute('aria-disabled', 'true');
    expect(byDate('2026-11-14')).not.toHaveAttribute('aria-disabled');
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(byDate('2026-12-12')).not.toHaveAttribute('aria-disabled');
    expect(byDate('2026-12-13')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('selects ranges and multiple days across a Hijri month', async () => {
    const onRange = vi.fn();
    const { unmount } = renderWithLocale(
      <Calendar
        mode="range"
        calendarSystem={HIJRI}
        defaultMonth="2026-11-16"
        numberOfMonths={2}
        onValueChange={onRange}
      />,
    );
    expect(screen.getByRole('grid', { name: 'Jumada II 1448 AH' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Rajab 1448 AH' })).toBeInTheDocument();
    await userEvent.click(byDate('2026-11-20'));
    await userEvent.click(byDate('2026-12-14'));
    expect(onRange).toHaveBeenLastCalledWith({ from: '2026-11-20', to: '2026-12-14' });
    expect(byDate('2026-11-20')).toHaveAttribute('data-range-start');
    expect(byDate('2026-12-14')).toHaveAttribute('data-range-end');
    expect(byDate('2026-12-01')).toHaveAttribute('data-range-middle');
    unmount();
    const onMultiple = vi.fn();
    renderWithLocale(
      <Calendar
        mode="multiple"
        calendarSystem={HIJRI}
        defaultMonth="2026-11-16"
        onValueChange={onMultiple}
      />,
    );
    await userEvent.click(byDate('2026-11-20'));
    await userEvent.click(byDate('2026-11-12'));
    expect(onMultiple).toHaveBeenLastCalledWith(['2026-11-12', '2026-11-20']);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('starts the Hijri month on the right weekday column', () => {
    // 1 Jumada II 1448 is a Wednesday; Saturday-first puts it in the 5th column.
    renderWithLocale(
      <Calendar calendarSystem={HIJRI} defaultMonth="2026-11-16" weekStartsOn={6} />,
    );
    const firstRow = screen.getAllByRole('row')[1];
    const cells = firstRow ? Array.from(firstRow.querySelectorAll('td')) : [];
    expect(cells.map((cell) => cell.querySelector('button')?.dataset.date ?? null)).toEqual([
      null,
      null,
      null,
      null,
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
    ]);
  });

  it('supports the civil Hijri calendar, which can differ by a day', () => {
    renderWithLocale(<Calendar calendarSystem="islamic-civil" defaultMonth="2026-06-17" />);
    expect(screen.getByRole('grid', { name: 'Muharram 1448 AH' })).toBeInTheDocument();
    expect(
      screen.getAllByRole('button').filter((button) => button.dataset.date)[0],
    ).toHaveAttribute('data-date', '2026-06-17');
  });

  describe('Arabic / RTL', () => {
    it('shows Arabic Hijri names with Latin digits by default', () => {
      renderWithLocale(<Calendar calendarSystem={HIJRI} defaultMonth="2026-11-16" />, {
        locale: 'ar',
      });
      const grid = screen.getByRole('grid', { name: 'جمادى الآخرة 1448 هـ' });
      expect(grid.textContent).toContain('29');
      expect(ARABIC_INDIC.test(grid.textContent ?? '')).toBe(false);
      expect(byDate('2026-11-16')).toHaveAccessibleName('الاثنين، 6 جمادى الآخرة 1448 هـ');
      expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('aria-label', 'السبت');
    });

    it('uses Arabic-Indic day numbers on request', () => {
      renderWithLocale(
        <Calendar calendarSystem={HIJRI} defaultMonth="2026-11-16" numerals="locale" />,
        {
          locale: 'ar',
        },
      );
      expect(byDate('2026-11-16')).toHaveTextContent('٦');
      expect(byDate('2026-12-09')).toHaveTextContent('٢٩');
    });

    it('mirrors the arrow keys and selects with an ISO value', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <Calendar
          calendarSystem={HIJRI}
          defaultMonth="2026-11-16"
          value="2026-11-16"
          onValueChange={onValueChange}
        />,
        { locale: 'ar' },
      );
      byDate('2026-11-16').focus();
      await userEvent.keyboard('{ArrowLeft}'); // visually left = later day in RTL
      expect(byDate('2026-11-17')).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}{ArrowRight}');
      expect(byDate('2026-11-15')).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      expect(onValueChange).toHaveBeenLastCalledWith('2026-11-15');
    });
  });
});

describe('Calendar with a secondary calendar', () => {
  it('prints the Gregorian day under each Hijri day', () => {
    renderWithLocale(
      <Calendar calendarSystem={HIJRI} secondaryCalendar="gregory" defaultMonth="2026-11-16" />,
    );
    const secondary = document.querySelectorAll('[data-slot="calendar-secondary-day"]');
    expect(secondary).toHaveLength(29);
    expect(secondary[0]).toHaveTextContent('11');
    expect(secondary[0]).toHaveAttribute('aria-hidden', 'true');
    expect(byDate('2026-11-16')).toHaveTextContent('616');
    // The accessible name carries both calendars, the secondary in brackets.
    expect(byDate('2026-11-16')).toHaveAccessibleName(
      'Monday, Jumada II 6, 1448 AH (Monday, November 16, 2026)',
    );
  });

  it('prints the Hijri day under Gregorian days too', () => {
    renderWithLocale(<Calendar secondaryCalendar={HIJRI} defaultMonth="2026-11-01" />);
    expect(byDate('2026-11-16')).toHaveTextContent('166');
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
  });

  it('ignores a secondary calendar equal to the primary or null', () => {
    const { unmount } = renderWithLocale(
      <Calendar calendarSystem={HIJRI} secondaryCalendar={HIJRI} defaultMonth="2026-11-16" />,
    );
    expect(document.querySelector('[data-slot="calendar-secondary-day"]')).toBeNull();
    unmount();
    renderWithLocale(<Calendar secondaryCalendar={null} defaultMonth="2026-11-16" />);
    expect(document.querySelector('[data-slot="calendar-secondary-day"]')).toBeNull();
  });

  it('keeps Latin digits for both numbers in Arabic and honours numerals="locale"', () => {
    const { unmount } = renderWithLocale(
      <Calendar calendarSystem={HIJRI} secondaryCalendar="gregory" defaultMonth="2026-11-16" />,
      { locale: 'ar' },
    );
    expect(ARABIC_INDIC.test(screen.getByRole('grid').textContent ?? '')).toBe(false);
    unmount();
    renderWithLocale(
      <Calendar
        calendarSystem={HIJRI}
        secondaryCalendar="gregory"
        defaultMonth="2026-11-16"
        numerals="locale"
      />,
      { locale: 'ar' },
    );
    expect(byDate('2026-11-16')).toHaveTextContent('٦١٦');
  });
});

describe('Calendar with dropdown captions', () => {
  it('shows a month and a year select that follow the navigation', async () => {
    renderWithLocale(<Calendar captionLayout="dropdowns" defaultMonth="2026-11-10" />);
    const month = screen.getByRole('combobox', { name: 'Month' });
    const year = screen.getByRole('combobox', { name: 'Year' });
    expect(month).toHaveValue('11');
    expect(year).toHaveValue('2026');
    expect(within(month).getAllByRole('option')).toHaveLength(12);
    expect(within(year).getAllByRole('option')).toHaveLength(201); // +-100 years
    // The grid keeps its accessible name through a screen-reader-only caption.
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByRole('combobox', { name: 'Month' })).toHaveValue('12');
  });

  it('changes month and year from the selects and reports the month', async () => {
    const onMonthChange = vi.fn();
    renderWithLocale(
      <Calendar
        captionLayout="dropdowns"
        defaultMonth="2026-11-10"
        onMonthChange={onMonthChange}
      />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Month' }), 'March');
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-03-01');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '2030');
    expect(screen.getByRole('grid', { name: 'March 2030' })).toBeInTheDocument();
    expect(onMonthChange).toHaveBeenLastCalledWith('2030-03-01');
    // The new month is reachable by keyboard: one tab stop on its first day.
    expect(byDate('2030-03-01')).toHaveAttribute('tabindex', '0');
  });

  it('limits the years to min/max and disables months outside them', async () => {
    renderWithLocale(
      <Calendar
        captionLayout="dropdowns"
        defaultMonth="2026-11-10"
        min="2025-09-15"
        max="2027-02-01"
      />,
    );
    const year = screen.getByRole('combobox', { name: 'Year' });
    expect(
      within(year)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['2025', '2026', '2027']);
    const month = screen.getByRole('combobox', { name: 'Month' });
    expect(
      within(month)
        .getAllByRole('option')
        .filter((option) => !(option as HTMLOptionElement).disabled),
    ).toHaveLength(12);
    await userEvent.selectOptions(year, '2025');
    const options2025 = within(screen.getByRole('combobox', { name: 'Month' })).getAllByRole(
      'option',
    );
    expect(
      options2025
        .filter((option) => (option as HTMLOptionElement).disabled)
        .map((option) => option.textContent),
    ).toEqual(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August']);
    // November is kept, and choosing a year before the minimum month clamps to it.
    expect(screen.getByRole('grid', { name: 'November 2025' })).toBeInTheDocument();
  });

  it('clamps a choice that falls outside the bounds', async () => {
    renderWithLocale(
      <Calendar
        captionLayout="dropdowns"
        defaultMonth="2026-11-10"
        min="2026-09-15"
        max="2027-02-01"
      />,
    );
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '2027');
    // November 2027 is past the max month, so February 2027 is shown.
    expect(screen.getByRole('grid', { name: 'February 2027' })).toBeInTheDocument();
  });

  it('works with Hijri months and years', async () => {
    renderWithLocale(
      <Calendar captionLayout="dropdowns" calendarSystem={HIJRI} defaultMonth="2026-11-16" />,
    );
    expect(screen.getByRole('combobox', { name: 'Year' })).toHaveValue('1448');
    expect(screen.getByRole('combobox', { name: 'Month' })).toHaveValue('6');
    const names = within(screen.getByRole('combobox', { name: 'Month' }))
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(names[0]).toBe('Muharram');
    expect(names[8]).toBe('Ramadan');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Month' }), 'Ramadan');
    expect(screen.getByRole('grid', { name: 'Ramadan 1448 AH' })).toBeInTheDocument();
    expect(byDate('2027-02-08')).toHaveTextContent('1');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Year' }), '1447');
    expect(screen.getByRole('grid', { name: 'Ramadan 1447 AH' })).toBeInTheDocument();
    expect(byDate('2026-02-18')).toBeInTheDocument();
  });

  it('puts a dropdown caption above each of two months', async () => {
    renderWithLocale(
      <Calendar
        mode="range"
        numberOfMonths={2}
        captionLayout="dropdowns"
        defaultMonth="2026-11-10"
      />,
    );
    const months = screen.getAllByRole('combobox', { name: 'Month' });
    expect(months).toHaveLength(2);
    expect(months[1]).toHaveValue('12');
    // Choosing the second month's value keeps it second: the first becomes the month before.
    await userEvent.selectOptions(months[1] ?? months[0] ?? document.body, 'March');
    expect(screen.getByRole('grid', { name: 'February 2026' })).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
  });

  it('disables the selects when the calendar is disabled', () => {
    renderWithLocale(<Calendar captionLayout="dropdowns" defaultMonth="2026-11-10" disabled />);
    expect(screen.getByRole('combobox', { name: 'Month' })).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Year' })).toBeDisabled();
  });

  it('does not steal PageUp/PageDown from the selects', async () => {
    renderWithLocale(<Calendar captionLayout="dropdowns" defaultMonth="2026-11-10" />);
    screen.getByRole('combobox', { name: 'Month' }).focus();
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: 'November 2026' })).toBeInTheDocument();
  });

  it('localises the selects and mirrors for Arabic', () => {
    renderWithLocale(
      <Calendar captionLayout="dropdowns" calendarSystem={HIJRI} defaultMonth="2026-11-16" />,
      {
        locale: 'ar',
      },
    );
    const month = screen.getByRole('combobox', { name: 'الشهر' });
    expect(screen.getByRole('combobox', { name: 'السنة' })).toHaveValue('1448');
    expect(within(month).getAllByRole('option')[8]).toHaveTextContent('رمضان');
    expect(screen.getByRole('grid', { name: 'جمادى الآخرة 1448 هـ' })).toBeInTheDocument();
    expect(
      ARABIC_INDIC.test(screen.getByRole('combobox', { name: 'السنة' }).textContent ?? ''),
    ).toBe(false);
  });

  it('shows Arabic-Indic years on request and lets labels be overridden', () => {
    renderWithLocale(
      <Calendar
        captionLayout="dropdowns"
        calendarSystem={HIJRI}
        defaultMonth="2026-11-16"
        numerals="locale"
        labels={{ month: 'Mon', year: 'Yr' }}
      />,
      { locale: 'ar' },
    );
    const year = screen.getByRole('combobox', { name: 'Yr' });
    expect(within(year).getByRole('option', { name: '١٤٤٨' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Mon' })).toBeInTheDocument();
  });
});

describe('Calendar accessibility across systems', () => {
  it('has no axe violations for Hijri, secondary and dropdown layouts (English and Arabic)', async () => {
    const english = renderWithLocale(
      <Calendar
        calendarSystem={HIJRI}
        secondaryCalendar="gregory"
        captionLayout="dropdowns"
        defaultMonth="2026-11-16"
        value="2026-11-16"
      />,
    );
    await expectNoA11yViolations(english.container);
    english.unmount();
    const arabic = renderWithLocale(
      <Calendar
        mode="range"
        numberOfMonths={2}
        calendarSystem={HIJRI}
        secondaryCalendar="gregory"
        captionLayout="dropdowns"
        defaultMonth="2026-11-16"
        value={{ from: '2026-11-12', to: '2026-11-20' }}
      />,
      { locale: 'ar' },
    );
    await expectNoA11yViolations(arabic.container);
  });
});
