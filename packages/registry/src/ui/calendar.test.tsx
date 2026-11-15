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
