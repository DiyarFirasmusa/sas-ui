import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('Switch', () => {
  it('toggles on click and reports the change', async () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Notifications" onCheckedChange={onCheckedChange} />);
    const toggle = screen.getByRole('switch', { name: 'Notifications' });
    expect(toggle).not.toBeChecked();
    await userEvent.click(screen.getByText('Notifications'));
    expect(toggle).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('toggles with Space from the keyboard', async () => {
    render(<Switch aria-label="Dark mode" />);
    await userEvent.tab();
    expect(screen.getByRole('switch')).toHaveFocus();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('switch')).toBeChecked();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('cannot be toggled when disabled', async () => {
    render(<Switch label="Locked" disabled />);
    await userEvent.click(screen.getByText('Locked'));
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('forwards ref, name and onBlur', async () => {
    const ref = createRef<HTMLElement>();
    const onBlur = vi.fn();
    const { container } = render(
      <>
        <Switch aria-label="Alerts" ref={ref} name="alerts" defaultChecked onBlur={onBlur} />
        <button type="button">next</button>
      </>,
    );
    expect(ref.current).toBe(screen.getByRole('switch'));
    expect(container.querySelector('input[name="alerts"]')).not.toBeNull();
    await userEvent.tab();
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('works inside Field and shows the invalid state', () => {
    render(
      <Field label="Terms" description="Required to continue" error="You must agree">
        <Switch />
      </Field>,
    );
    const toggle = screen.getByRole('switch', { name: 'Terms' });
    expect(toggle).toHaveAccessibleDescription(/You must agree/);
    expect(toggle).toHaveAttribute('data-invalid');
    expect(toggle).toBeInvalid();
  });

  it('keeps its own label inside a Field', () => {
    render(
      <Field label="Preferences">
        <Switch label="Email me" />
      </Field>,
    );
    expect(screen.getByRole('switch', { name: 'Email me' })).toBeInTheDocument();
  });

  it('positions the thumb with logical offsets so it mirrors in Arabic', async () => {
    renderWithLocale(<Switch label="الإشعارات" mirror />, { locale: 'ar' });
    const toggle = screen.getByRole('switch', { name: 'الإشعارات' });
    const thumb = toggle.querySelector('[data-slot="switch-thumb"]');
    expect(thumb).not.toBeNull();
    expect(thumb?.className).toContain('start-0');
    expect(thumb?.className).toContain('data-[checked]:start-[calc(100%-1rem)]');
    expect(thumb?.className).not.toMatch(/(?:^|\s)(?:left|right|translate-x)/);
    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('is the dashboards 32x18.4 switch with a 16px thumb, and offers an opt-in sm size', () => {
    render(
      <>
        <Switch aria-label="Regular" />
        <Switch aria-label="Small" size="sm" />
      </>,
    );
    const regular = screen.getByRole('switch', { name: 'Regular' });
    const small = screen.getByRole('switch', { name: 'Small' });
    expect(regular).toHaveAttribute('data-size', 'default');
    expect(regular).toHaveClass('h-[18.4px]', 'w-8');
    expect(small).toHaveAttribute('data-size', 'sm');
    expect(small.className).toContain('data-[size=sm]:h-3.5');
    expect(small.querySelector('[data-slot="switch-thumb"]')?.className).toContain(
      'group-data-[size=sm]/switch:size-3',
    );
  });

  it('pins the track left-to-right by default, as the dashboards draw it; mirror opts back in', async () => {
    renderWithLocale(
      <>
        <Switch aria-label="ثابت" />
        <Switch aria-label="مرآة" mirror />
      </>,
      { locale: 'ar' },
    );
    expect(screen.getByRole('switch', { name: 'مرآة' })).not.toHaveAttribute('dir');
    const pinned = screen.getByRole('switch', { name: 'ثابت' });
    expect(pinned).toHaveAttribute('dir', 'ltr');
    await userEvent.click(pinned);
    expect(pinned).toBeChecked();
  });

  it('renders the label and description together with no axe violations', async () => {
    const { container } = render(
      <Switch size="sm" label="Alerts" description="Sent each morning" />,
    );
    expect(screen.getByRole('switch', { name: 'Alerts' })).toBeInTheDocument();
    expect(screen.getByText('Sent each morning')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Field label="Terms" error="Required">
        <Switch />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });
});
