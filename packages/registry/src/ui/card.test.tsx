import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example({ title = 'Invoices' }: { title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Last 30 days</CardDescription>
        <CardAction>
          <button type="button">Edit</button>
        </CardAction>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>Footer</CardFooter>
    </Card>
  );
}

describe('Card', () => {
  it('renders every slot with token surface classes', () => {
    const { container } = render(<Example />);
    expect(container.querySelector('[data-slot="card"]')).toHaveClass(
      'bg-surface',
      'border-stroke',
    );
    for (const slot of [
      'card-header',
      'card-title',
      'card-description',
      'card-action',
      'card-content',
      'card-footer',
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
    }
  });

  it('renders the title as a heading by default and lets the caller pick the level', () => {
    const { rerender } = render(<Example />);
    expect(screen.getByRole('heading', { level: 3, name: 'Invoices' })).toBeInTheDocument();
    rerender(
      <Card>
        <CardTitle as="h2">Section</CardTitle>
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('can render a non-heading title', () => {
    render(
      <Card>
        <CardTitle as="div">Plain</CardTitle>
      </Card>,
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('places the action in the end column and merges class names', () => {
    const { container } = render(
      <Card className="max-w-sm">
        <CardHeader>
          <CardAction className="self-center">x</CardAction>
        </CardHeader>
      </Card>,
    );
    expect(container.querySelector('[data-slot="card"]')).toHaveClass('max-w-sm');
    expect(container.querySelector('[data-slot="card-action"]')).toHaveClass(
      'col-start-2',
      'justify-self-end',
      'self-center',
    );
  });

  it('renders Arabic content', () => {
    renderWithLocale(<Example title="الفواتير" />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'الفواتير' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    await expectNoA11yViolations(container);
  });
});
