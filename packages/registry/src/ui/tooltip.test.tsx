import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

function Example({ showArrow = false }: { showArrow?: boolean }) {
  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger aria-label="Save draft">S</TooltipTrigger>
        <TooltipContent showArrow={showArrow}>Save as draft</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe('Tooltip', () => {
  it('opens on hover and closes when the pointer leaves', async () => {
    render(<Example />);
    expect(screen.queryByText('Save as draft')).not.toBeInTheDocument();
    await userEvent.hover(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByText('Save as draft')).toBeInTheDocument();
    await userEvent.unhover(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(screen.queryByText('Save as draft')).not.toBeInTheDocument());
  });

  it('opens on keyboard focus and closes with Escape', async () => {
    render(<Example />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Save draft' })).toHaveFocus();
    expect(await screen.findByText('Save as draft')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Save as draft')).not.toBeInTheDocument());
  });

  it('keeps the trigger name independent of the tooltip text', () => {
    render(<Example />);
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument();
  });

  it('renders the arrow when asked', async () => {
    render(<Example showArrow />);
    await userEvent.hover(screen.getByRole('button', { name: 'Save draft' }));
    await screen.findByText('Save as draft');
    expect(document.querySelector('[data-slot="tooltip-arrow"]')).toBeInTheDocument();
  });

  it('works in Arabic with an inline-start placement', async () => {
    renderWithLocale(
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger aria-label="حفظ">ح</TooltipTrigger>
          <TooltipContent side="inline-start">حفظ كمسودة</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
      { locale: 'ar' },
    );
    await userEvent.hover(screen.getByRole('button', { name: 'حفظ' }));
    expect(await screen.findByText('حفظ كمسودة')).toBeInTheDocument();
  });

  it('has no axe violations when open', async () => {
    render(<Example />);
    await userEvent.hover(screen.getByRole('button', { name: 'Save draft' }));
    await screen.findByText('Save as draft');
    await expectNoA11yViolations();
  });
});
