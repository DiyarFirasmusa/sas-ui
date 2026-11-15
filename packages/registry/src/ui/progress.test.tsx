import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from '@/components/ui/progress';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Progress', () => {
  it('exposes a named progressbar with its value', () => {
    render(<Progress value={45} label="Upload" />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveAttribute('aria-valuenow', '45');
    expect(bar).toHaveAttribute('aria-valuetext', '45%');
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('sizes the indicator from the value and clamps to max', () => {
    const { container, rerender } = render(<Progress value={30} label="x" />);
    const indicator = () => container.querySelector<HTMLElement>('[data-slot="progress-indicator"]');
    expect(indicator()?.style.width).toBe('30%');
    rerender(<Progress value={250} label="x" />);
    expect(indicator()?.style.width).toBe('100%');
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('is indeterminate when the value is null', () => {
    const { container } = render(<Progress value={null} label="Syncing" />);
    const bar = screen.getByRole('progressbar', { name: 'Syncing' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    const indicator = container.querySelector('[data-slot="progress-indicator"]');
    expect(indicator).toHaveClass('data-[indeterminate]:animate-pulse', 'motion-reduce:data-[indeterminate]:animate-none');
  });

  it.each([
    ['success', 'bg-success'],
    ['warning', 'bg-warning'],
    ['danger', 'bg-danger'],
    ['primary', 'bg-primary'],
  ] as const)('maps the %s tone to its token', (tone, className) => {
    const { container } = render(<Progress value={50} tone={tone} label="x" />);
    expect(container.querySelector(`.${className}`)).toBeInTheDocument();
  });

  it('can hide the value', () => {
    render(<Progress value={50} label="x" showValue={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('names an unlabelled bar in the active language', () => {
    renderWithLocale(<Progress value={10} />, { locale: 'ar' });
    expect(screen.getByRole('progressbar', { name: 'التقدّم' })).toBeInTheDocument();
  });

  it('keeps Latin digits in Arabic', () => {
    renderWithLocale(<Progress value={45} label="رفع الملف" />, { locale: 'ar' });
    expect(screen.getByText('45%')).toHaveAttribute('dir', 'ltr');
    expect(screen.getByRole('progressbar', { name: 'رفع الملف' })).toHaveAttribute('aria-valuetext', '45%');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Progress value={60} label="Storage" />
        <Progress value={null} aria-label="Syncing" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
