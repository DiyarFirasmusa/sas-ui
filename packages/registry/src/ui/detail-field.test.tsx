import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DetailField, DetailGrid } from '@/components/ui/detail-field';
import { expectNoA11yViolations } from '@/test/a11y';

describe('DetailField', () => {
  it('pairs the label with its value in a description list', () => {
    render(
      <DetailGrid>
        <DetailField label="Status" value="Approved" />
      </DetailGrid>,
    );
    expect(screen.getByText('Status').tagName).toBe('DT');
    expect(screen.getByText('Approved').tagName).toBe('DD');
  });

  it.each([undefined, null, ''])('shows a dash for an empty value (%s)', (value) => {
    render(
      <dl>
        <DetailField label="Phone" value={value} />
      </dl>,
    );
    expect(screen.getByLabelText('—')).toHaveTextContent('—');
  });

  it('keeps zero as a real value', () => {
    render(
      <dl>
        <DetailField label="Count" value={0} />
      </dl>,
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('supports the boxed tone and an icon', () => {
    const { container } = render(
      <dl>
        <DetailField label="Total" value="12" tone="boxed" icon={<svg data-testid="icon" />} />
      </dl>,
    );
    expect(screen.getByText('12')).toHaveClass('bg-surface-dim');
    expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <DetailGrid>
        <DetailField label="A" value="1" />
        <DetailField label="B" />
      </DetailGrid>,
    );
    await expectNoA11yViolations(container);
  });
});
