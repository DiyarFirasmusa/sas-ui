import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from '@/components/ui/spinner';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Spinner', () => {
  it('announces itself as a status in the active language', () => {
    renderWithLocale(<Spinner />, { locale: 'ar' });
    expect(screen.getByRole('status', { name: 'جارٍ التحميل' })).toBeInTheDocument();
  });

  it('accepts a custom label', () => {
    renderWithLocale(<Spinner label="Saving" />);
    expect(screen.getByRole('status', { name: 'Saving' })).toBeInTheDocument();
  });

  it('stops spinning for reduced motion', () => {
    const { container } = renderWithLocale(<Spinner />);
    expect(container.querySelector('svg')).toHaveClass('motion-reduce:animate-none');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<Spinner />);
    await expectNoA11yViolations(container);
  });
});
