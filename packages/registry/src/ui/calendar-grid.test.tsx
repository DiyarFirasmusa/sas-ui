import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CalendarGrid, type CalendarGridProps } from '@/components/ui/calendar-grid';
import type { Selection } from '@/hooks/use-calendar-selection';
import type { CalendarSystem } from '@/lib/calendar-systems';
import { getWeekdays, toISODate, type DateNumerals, type WeekStart } from '@/lib/date-utils';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const ARABIC_INDIC = /[٠-٩]/;

function selectionOf(selectedIso: string | null): Selection {
  return {
    anchor: null,
    multiple: false,
    select: vi.fn(),
    stateOf: (date) => ({ selected: toISODate(date) === selectedIso }),
  };
}

interface HarnessProps extends Partial<CalendarGridProps> {
  locale?: 'ar' | 'en';
  system?: CalendarSystem;
  numerals?: DateNumerals;
  weekStartsOn?: WeekStart;
}

/** The grid needs a caption element to name it; the real calendar provides one. */
function Harness({
  locale = 'en',
  system = 'gregory',
  numerals = 'latn',
  weekStartsOn = 0,
  ...props
}: HarnessProps) {
  const format = { locale, numerals };
  return (
    <div>
      <div id="caption">Caption</div>
      <CalendarGrid
        monthIso="2026-11-10"
        captionId="caption"
        system={system}
        secondary={null}
        format={format}
        weekStartsOn={weekStartsOn}
        weekdays={getWeekdays(weekStartsOn, format)}
        fixedWeeks={false}
        selection={selectionOf('2026-11-18')}
        todayIso="2026-11-16"
        tabbableIso="2026-11-18"
        readOnly={false}
        disabled={false}
        isUnavailable={() => false}
        onChoose={() => {}}
        onFocusDay={() => {}}
        {...props}
      />
    </div>
  );
}

function dayButtons() {
  return screen.getAllByRole('button');
}

describe('CalendarGrid', () => {
  it('renders a labelled Gregorian grid with empty cells around the month', () => {
    renderWithLocale(<Harness />);
    const grid = screen.getByRole('grid', { name: 'Caption' });
    expect(within(grid).getAllByRole('columnheader')).toHaveLength(7);
    expect(dayButtons()).toHaveLength(30);
    // November 2026 starts on a Sunday: 5 rows of 7 cells, the last 5 empty.
    const cells = grid.querySelectorAll('tbody td');
    expect(cells).toHaveLength(35);
    expect(Array.from(cells).filter((cell) => !cell.querySelector('button'))).toHaveLength(5);
    expect(
      screen.getByRole('button', { name: 'Wednesday, November 18, 2026' }),
    ).toBeInTheDocument();
  });

  it('draws a Hijri month with Hijri numbers but Gregorian data-date values', () => {
    renderWithLocale(<Harness system="islamic-umalqura" monthIso="2026-11-16" />);
    const buttons = dayButtons();
    expect(buttons).toHaveLength(29);
    expect(buttons[0]).toHaveAttribute('data-date', '2026-11-11');
    expect(buttons[0]).toHaveTextContent('1');
    expect(buttons[0]).toHaveAccessibleName('Wednesday, Jumada II 1, 1448 AH');
    expect(buttons[28]).toHaveAttribute('data-date', '2026-12-09');
  });

  it('always draws six rows with fixedWeeks', () => {
    renderWithLocale(<Harness fixedWeeks />);
    expect(screen.getByRole('grid').querySelectorAll('tbody tr')).toHaveLength(6);
  });

  it('adds the secondary number and name, except when it equals the primary', () => {
    const { unmount } = renderWithLocale(
      <Harness system="islamic-umalqura" monthIso="2026-11-16" secondary="gregory" />,
    );
    const first = dayButtons()[0];
    expect(first?.querySelector('[data-slot="calendar-secondary-day"]')).toHaveTextContent('11');
    expect(first).toHaveAccessibleName(
      'Wednesday, Jumada II 1, 1448 AH (Wednesday, November 11, 2026)',
    );
    unmount();
    renderWithLocale(
      <Harness system="islamic-umalqura" monthIso="2026-11-16" secondary="islamic-umalqura" />,
    );
    expect(document.querySelector('[data-slot="calendar-secondary-day"]')).toBeNull();
  });

  it('marks today, the selection and the single tab stop', () => {
    renderWithLocale(<Harness />);
    const today = document.querySelector('[data-date="2026-11-16"]');
    const selected = document.querySelector('[data-date="2026-11-18"]');
    expect(today).toHaveAttribute('aria-current', 'date');
    expect(today).toHaveAttribute('data-today');
    expect(selected).toHaveAttribute('data-selected');
    expect(selected?.closest('td')).toHaveAttribute('aria-selected', 'true');
    expect(dayButtons().filter((button) => button.tabIndex === 0)).toEqual([selected]);
  });

  it('reflects readOnly, disabled and multiselect on the grid', () => {
    renderWithLocale(
      <Harness readOnly disabled selection={{ ...selectionOf(null), multiple: true }} />,
    );
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('aria-readonly', 'true');
    expect(grid).toHaveAttribute('aria-disabled', 'true');
    expect(grid).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('flags unavailable days and reports clicks and focus with the day', async () => {
    const onChoose = vi.fn();
    const onFocusDay = vi.fn();
    renderWithLocale(
      <Harness
        isUnavailable={(date) => date.getDate() === 20}
        onChoose={onChoose}
        onFocusDay={onFocusDay}
      />,
    );
    expect(document.querySelector('[data-date="2026-11-20"]')).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(document.querySelector('[data-date="2026-11-21"]')).not.toHaveAttribute('aria-disabled');
    await userEvent.click(screen.getByRole('button', { name: 'Thursday, November 12, 2026' }));
    expect(onFocusDay).toHaveBeenCalled();
    const chosen = onChoose.mock.calls[0]?.[0];
    expect(chosen instanceof Date && toISODate(chosen)).toBe('2026-11-12');
  });

  describe('Arabic / RTL', () => {
    it('uses Arabic names with Latin digits and Saturday first', () => {
      renderWithLocale(
        <Harness locale="ar" system="islamic-umalqura" monthIso="2026-11-16" weekStartsOn={6} />,
        { locale: 'ar' },
      );
      expect(screen.getAllByRole('columnheader')[0]).toHaveAttribute('aria-label', 'السبت');
      expect(dayButtons()[5]).toHaveAccessibleName('الاثنين، 6 جمادى الآخرة 1448 هـ');
      expect(ARABIC_INDIC.test(screen.getByRole('grid').textContent ?? '')).toBe(false);
    });

    it('uses Arabic-Indic digits for both numbers on request', () => {
      renderWithLocale(
        <Harness
          locale="ar"
          system="islamic-umalqura"
          monthIso="2026-11-16"
          secondary="gregory"
          numerals="locale"
        />,
        { locale: 'ar' },
      );
      expect(document.querySelector('[data-date="2026-11-16"]')).toHaveTextContent('٦١٦');
    });
  });

  it('has no axe violations (Gregorian, Hijri with secondary, Arabic)', async () => {
    const gregorian = renderWithLocale(<Harness />);
    await expectNoA11yViolations(gregorian.container);
    gregorian.unmount();
    const hijri = renderWithLocale(
      <Harness system="islamic-umalqura" monthIso="2026-11-16" secondary="gregory" />,
    );
    await expectNoA11yViolations(hijri.container);
    hijri.unmount();
    const arabic = renderWithLocale(
      <Harness locale="ar" system="islamic-umalqura" monthIso="2026-11-16" />,
      {
        locale: 'ar',
      },
    );
    await expectNoA11yViolations(arabic.container);
  });
});
