import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionProps,
} from '@/components/ui/accordion';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example(props: Partial<AccordionProps>) {
  return (
    <Accordion {...props}>
      <AccordionItem value="a">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>Ships in two days</AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Thirty day returns</AccordionContent>
      </AccordionItem>
      <AccordionItem value="c" disabled>
        <AccordionTrigger>Warranty</AccordionTrigger>
        <AccordionContent>One year</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('starts collapsed and toggles a panel with click', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Shipping' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Ships in two days')).toBeVisible();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the open item when another opens (single mode)', async () => {
    render(<Example defaultValue={['a']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getByRole('button', { name: 'Returns' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('keeps several items open with multiple', async () => {
    render(<Example multiple defaultValue={['a']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Returns' }));
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Returns' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('toggles with Enter and Space from the keyboard', async () => {
    render(<Example />);
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await userEvent.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Shipping' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('does not open a disabled item', async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole('button', { name: 'Warranty' }));
    expect(screen.getByRole('button', { name: 'Warranty' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('wires the chevron rotation and motion-safe height transition', () => {
    const { container } = render(<Example defaultValue={['a']} />);
    expect(container.querySelector('[data-slot="accordion-trigger"] svg')).toHaveClass(
      'group-data-[panel-open]/accordion-trigger:rotate-180',
      'motion-reduce:transition-none',
    );
    expect(container.querySelector('[data-slot="accordion-content"]')).toHaveClass(
      'transition-[height]',
      'motion-reduce:transition-none',
    );
  });

  it('renders the sidebar variant', () => {
    const { container } = render(<Example variant="sidebar" />);
    expect(container.querySelector('[data-slot="accordion"]')).toHaveClass('gap-1');
    expect(container.querySelector('[data-slot="accordion-item"]')).not.toHaveClass('border-b');
  });

  it('works in Arabic', async () => {
    renderWithLocale(
      <Accordion defaultValue={['a']}>
        <AccordionItem value="a">
          <AccordionTrigger>الشحن</AccordionTrigger>
          <AccordionContent>يصل خلال يومين</AccordionContent>
        </AccordionItem>
      </Accordion>,
      { locale: 'ar' },
    );
    expect(screen.getByRole('button', { name: 'الشحن' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('يصل خلال يومين')).toBeVisible();
  });

  it('has no axe violations (default and sidebar, open)', async () => {
    const { rerender } = render(<Example defaultValue={['a']} />);
    await expectNoA11yViolations();
    rerender(<Example variant="sidebar" defaultValue={['a']} />);
    await expectNoA11yViolations();
  });
});
