import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '@/components/ui/field';
import { TimePicker } from '@/components/ui/time-picker';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const ARABIC_INDIC = /[٠-٩۰-۹]/;

const hour = () => screen.getByRole('spinbutton', { name: 'Hour' });
const minute = () => screen.getByRole('spinbutton', { name: 'Minute' });
const period = () => screen.getByRole('spinbutton', { name: 'AM/PM' });

describe('TimePicker', () => {
  it('renders hour and minute segments in a labelled group', () => {
    renderWithLocale(<TimePicker aria-label="Start time" />);
    expect(screen.getByRole('group', { name: 'Start time' })).toBeInTheDocument();
    expect(hour()).toHaveValue('');
    expect(hour()).toHaveAttribute('aria-valuetext', 'Empty');
    expect(minute()).toHaveAttribute('placeholder', '––');
    expect(screen.queryByRole('spinbutton', { name: 'AM/PM' })).not.toBeInTheDocument();
  });

  it('shows an initial 24h value with padding', () => {
    renderWithLocale(<TimePicker aria-label="Time" defaultValue="09:05" />);
    expect(hour()).toHaveValue('09');
    expect(minute()).toHaveValue('05');
    expect(hour()).toHaveAttribute('aria-valuenow', '9');
    expect(hour()).toHaveAttribute('aria-valuemax', '23');
    expect(minute()).toHaveAttribute('aria-valuemax', '59');
  });

  describe('typing', () => {
    it('types hh then mm, advancing between segments', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(<TimePicker aria-label="Time" onValueChange={onValueChange} />);
      await userEvent.click(hour());
      await userEvent.keyboard('09');
      expect(minute()).toHaveFocus();
      expect(onValueChange).not.toHaveBeenCalled(); // half-typed: no value yet
      await userEvent.keyboard('30');
      expect(onValueChange).toHaveBeenLastCalledWith('09:30');
      expect(hour()).toHaveValue('09');
      expect(minute()).toHaveValue('30');
    });

    it('advances immediately when the first digit cannot start a longer number', async () => {
      renderWithLocale(<TimePicker aria-label="Time" />);
      await userEvent.click(hour());
      await userEvent.keyboard('7');
      expect(hour()).toHaveValue('07');
      expect(minute()).toHaveFocus();
      await userEvent.keyboard('6');
      expect(minute()).toHaveValue('06');
    });

    it('waits for a second digit after 1 or 2 and restarts on an impossible number', async () => {
      renderWithLocale(<TimePicker aria-label="Time" />);
      await userEvent.click(hour());
      await userEvent.keyboard('2');
      expect(hour()).toHaveFocus();
      await userEvent.keyboard('5'); // 25 is not an hour: restart with 5
      expect(hour()).toHaveValue('05');
      expect(minute()).toHaveFocus();
    });

    it('ignores letters in numeric segments', async () => {
      renderWithLocale(<TimePicker aria-label="Time" />);
      await userEvent.click(hour());
      await userEvent.keyboard('ab');
      expect(hour()).toHaveValue('');
    });
  });

  describe('stepping', () => {
    it('steps with arrows and wraps', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <TimePicker aria-label="Time" defaultValue="23:59" onValueChange={onValueChange} />,
      );
      await userEvent.click(hour());
      await userEvent.keyboard('{ArrowUp}');
      expect(onValueChange).toHaveBeenLastCalledWith('00:59');
      await userEvent.keyboard('{ArrowDown}');
      expect(onValueChange).toHaveBeenLastCalledWith('23:59');
      await userEvent.click(minute());
      await userEvent.keyboard('{ArrowUp}');
      expect(onValueChange).toHaveBeenLastCalledWith('23:00');
    });

    it('starts from the limits when empty', async () => {
      renderWithLocale(<TimePicker aria-label="Time" />);
      await userEvent.click(hour());
      await userEvent.keyboard('{ArrowUp}');
      expect(hour()).toHaveValue('00');
      await userEvent.keyboard('{Backspace}{ArrowDown}');
      expect(hour()).toHaveValue('23');
    });

    it('snaps minutes to the step', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <TimePicker
          aria-label="Time"
          defaultValue="10:07"
          minuteStep={15}
          onValueChange={onValueChange}
        />,
      );
      await userEvent.click(minute());
      await userEvent.keyboard('{ArrowUp}');
      expect(onValueChange).toHaveBeenLastCalledWith('10:15');
      await userEvent.keyboard('{ArrowUp}{ArrowUp}');
      expect(onValueChange).toHaveBeenLastCalledWith('10:45');
      await userEvent.keyboard('{ArrowUp}');
      expect(onValueChange).toHaveBeenLastCalledWith('10:00');
      await userEvent.keyboard('{ArrowDown}');
      expect(onValueChange).toHaveBeenLastCalledWith('10:45');
    });

    it('jumps with Home, End and the Page keys', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <TimePicker aria-label="Time" defaultValue="10:30" onValueChange={onValueChange} />,
      );
      await userEvent.click(hour());
      await userEvent.keyboard('{End}');
      expect(onValueChange).toHaveBeenLastCalledWith('23:30');
      await userEvent.keyboard('{Home}');
      expect(onValueChange).toHaveBeenLastCalledWith('00:30');
      await userEvent.keyboard('{PageUp}');
      expect(onValueChange).toHaveBeenLastCalledWith('03:30');
      await userEvent.click(minute());
      await userEvent.keyboard('{PageDown}');
      expect(onValueChange).toHaveBeenLastCalledWith('03:20');
    });

    it('clears a segment with Backspace and reports no value', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <TimePicker aria-label="Time" defaultValue="10:30" onValueChange={onValueChange} />,
      );
      await userEvent.click(minute());
      await userEvent.keyboard('{Backspace}');
      expect(onValueChange).toHaveBeenLastCalledWith(null);
      expect(minute()).toHaveValue('');
    });

    it('moves between segments with the left and right arrows', async () => {
      renderWithLocale(<TimePicker aria-label="Time" defaultValue="10:30" />);
      await userEvent.click(hour());
      await userEvent.keyboard('{ArrowRight}');
      expect(minute()).toHaveFocus();
      await userEvent.keyboard('{ArrowLeft}');
      expect(hour()).toHaveFocus();
    });
  });

  describe('12-hour clock', () => {
    it('shows 12h parts for a 24h value', () => {
      renderWithLocale(<TimePicker aria-label="Time" hourCycle={12} defaultValue="15:30" />);
      expect(hour()).toHaveValue('03');
      expect(minute()).toHaveValue('30');
      expect(period()).toHaveValue('PM');
      expect(hour()).toHaveAttribute('aria-valuemax', '12');
    });

    it('maps midnight and noon', () => {
      const { unmount } = renderWithLocale(
        <TimePicker aria-label="Time" hourCycle={12} defaultValue="00:15" />,
      );
      expect(hour()).toHaveValue('12');
      expect(period()).toHaveValue('AM');
      unmount();
      renderWithLocale(<TimePicker aria-label="Time" hourCycle={12} defaultValue="12:15" />);
      expect(hour()).toHaveValue('12');
      expect(period()).toHaveValue('PM');
    });

    it('emits 24h values when the period or hour changes', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <TimePicker
          aria-label="Time"
          hourCycle={12}
          defaultValue="15:30"
          onValueChange={onValueChange}
        />,
      );
      await userEvent.click(period());
      await userEvent.keyboard('{ArrowUp}');
      expect(onValueChange).toHaveBeenLastCalledWith('03:30');
      await userEvent.keyboard('p');
      expect(onValueChange).toHaveBeenLastCalledWith('15:30');
      await userEvent.keyboard('a');
      expect(onValueChange).toHaveBeenLastCalledWith('03:30');
      await userEvent.click(hour());
      await userEvent.keyboard('{ArrowUp}'.repeat(10));
      expect(onValueChange).toHaveBeenLastCalledWith('01:30'); // 3 -> 12 -> 1, still AM
    });

    it('types 12h hours, including a leading zero', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <TimePicker
          aria-label="Time"
          hourCycle={12}
          defaultValue="00:00"
          onValueChange={onValueChange}
        />,
      );
      await userEvent.click(hour());
      await userEvent.keyboard('09');
      expect(hour()).toHaveValue('09');
      expect(minute()).toHaveFocus();
      await userEvent.click(hour());
      await userEvent.keyboard('12');
      expect(onValueChange).toHaveBeenLastCalledWith('00:00');
    });
  });

  describe('controlled', () => {
    it('follows the parent and resets half-typed input to the controlled value', async () => {
      function Harness() {
        const [value, setValue] = useState<string | null>('08:00');
        return (
          <>
            <TimePicker aria-label="Time" value={value} onValueChange={setValue} />
            <button type="button" onClick={() => setValue('21:45')}>
              Set evening
            </button>
          </>
        );
      }
      renderWithLocale(<Harness />);
      expect(hour()).toHaveValue('08');
      await userEvent.click(screen.getByRole('button', { name: 'Set evening' }));
      expect(hour()).toHaveValue('21');
      expect(minute()).toHaveValue('45');
      await userEvent.click(hour());
      await userEvent.keyboard('{ArrowUp}');
      expect(hour()).toHaveValue('22');
    });

    it('keeps a half-typed time while the parent stores an empty string', async () => {
      function Harness() {
        const [value, setValue] = useState('');
        return (
          <TimePicker
            aria-label="Time"
            value={value}
            onValueChange={(next) => setValue(next ?? '')}
          />
        );
      }
      renderWithLocale(<Harness />);
      await userEvent.click(hour());
      await userEvent.keyboard('14');
      expect(hour()).toHaveValue('14');
    });

    it('ignores changes the parent rejects', async () => {
      renderWithLocale(<TimePicker aria-label="Time" value="08:00" onValueChange={() => {}} />);
      await userEvent.click(hour());
      await userEvent.keyboard('{ArrowUp}');
      expect(hour()).toHaveValue('08');
    });
  });

  describe('states and forms', () => {
    it('is inert when disabled', () => {
      renderWithLocale(<TimePicker aria-label="Time" disabled defaultValue="10:30" />);
      expect(hour()).toBeDisabled();
      expect(minute()).toBeDisabled();
      expect(screen.getByRole('group')).toHaveAttribute('aria-disabled', 'true');
    });

    it('is focusable but not editable when read-only', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <TimePicker
          aria-label="Time"
          readOnly
          defaultValue="10:30"
          onValueChange={onValueChange}
        />,
      );
      await userEvent.click(hour());
      expect(hour()).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}1{Backspace}');
      expect(onValueChange).not.toHaveBeenCalled();
      expect(hour()).toHaveValue('10');
    });

    it('marks invalid and required', () => {
      renderWithLocale(<TimePicker aria-label="Time" invalid required />);
      expect(screen.getByRole('group')).toHaveAttribute('aria-invalid', 'true');
      expect(hour()).toHaveAttribute('aria-invalid', 'true');
      expect(hour()).toHaveAttribute('aria-required', 'true');
    });

    it('forwards ref to the hour segment and writes a hidden input', async () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = renderWithLocale(
        <TimePicker ref={ref} name="opens" aria-label="Time" defaultValue="07:15" />,
      );
      expect(ref.current).toBe(hour());
      const hidden = container.querySelector<HTMLInputElement>('input[name="opens"]');
      expect(hidden?.value).toBe('07:15');
      await userEvent.click(minute());
      await userEvent.keyboard('{ArrowUp}');
      expect(hidden?.value).toBe('07:16');
    });

    it('calls onBlur only when focus leaves the whole control', async () => {
      const onBlur = vi.fn();
      renderWithLocale(
        <>
          <TimePicker aria-label="Time" onBlur={onBlur} />
          <button type="button">after</button>
        </>,
      );
      await userEvent.click(hour());
      await userEvent.keyboard('{ArrowRight}');
      expect(onBlur).not.toHaveBeenCalled();
      await userEvent.tab();
      expect(screen.getByRole('button', { name: 'after' })).toHaveFocus();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('takes its name, description and error from Field', () => {
      renderWithLocale(
        <Field label="Opening time" description="Local time" error="Required">
          <TimePicker />
        </Field>,
      );
      const group = screen.getByRole('group', { name: 'Opening time' });
      expect(group).toHaveAttribute('aria-invalid', 'true');
      expect(group).toHaveAccessibleDescription('Local time Required');
    });

    it('works with react-hook-form', async () => {
      const seen: unknown[] = [];
      function Form() {
        const { control, watch } = useForm<{ at: string }>({
          defaultValues: { at: '' },
        });
        seen.push(watch('at'));
        return (
          <Controller
            control={control}
            name="at"
            render={({ field }) => (
              <TimePicker
                aria-label="At"
                ref={field.ref}
                name={field.name}
                value={field.value}
                onValueChange={(next) => field.onChange(next ?? '')}
                onBlur={field.onBlur}
              />
            )}
          />
        );
      }
      render(<Form />);
      await userEvent.click(hour());
      await userEvent.keyboard('1845');
      expect(seen.at(-1)).toBe('18:45');
    });
  });

  describe('Arabic / RTL', () => {
    it('localises the segment labels and stays left-to-right with Latin digits', () => {
      renderWithLocale(<TimePicker aria-label="الوقت" defaultValue="09:05" />, {
        locale: 'ar',
      });
      expect(screen.getByRole('group', { name: 'الوقت' })).toHaveAttribute('dir', 'ltr');
      expect(screen.getByRole('spinbutton', { name: 'الساعة' })).toHaveValue('09');
      expect(screen.getByRole('spinbutton', { name: 'الدقيقة' })).toHaveValue('05');
      expect(ARABIC_INDIC.test(document.body.innerHTML)).toBe(false);
    });

    it('uses Arabic AM/PM labels from Intl and accepts them by typing', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <TimePicker
          aria-label="الوقت"
          hourCycle={12}
          defaultValue="15:30"
          onValueChange={onValueChange}
        />,
        { locale: 'ar' },
      );
      const periodSegment = screen.getByRole('spinbutton', { name: 'ص/م' });
      expect(periodSegment).toHaveValue('م');
      await userEvent.click(periodSegment);
      await userEvent.keyboard('ص');
      expect(onValueChange).toHaveBeenLastCalledWith('03:30');
      expect(periodSegment).toHaveValue('ص');
    });

    it('shows the Arabic empty text', () => {
      renderWithLocale(<TimePicker aria-label="الوقت" />, { locale: 'ar' });
      expect(screen.getByRole('spinbutton', { name: 'الساعة' })).toHaveAttribute(
        'aria-valuetext',
        'فارغ',
      );
    });
  });

  it('has no axe violations (24h, 12h, in a Field)', async () => {
    const first = renderWithLocale(
      <Field label="Time">
        <TimePicker defaultValue="10:30" />
      </Field>,
    );
    await expectNoA11yViolations(first.container);
    first.unmount();
    const second = renderWithLocale(
      <TimePicker aria-label="Time" hourCycle={12} defaultValue="15:30" />,
    );
    await expectNoA11yViolations(second.container);
  });
});
