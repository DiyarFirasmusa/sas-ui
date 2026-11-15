import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, buttonVariants } from '@/components/ui/button';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Button', () => {
  it('renders a button and handles clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies variant and size classes and lets className override', () => {
    render(
      <Button variant="destructive" size="sm" className="bg-info">
        Delete
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('h-8', 'text-danger-foreground', 'bg-info');
    expect(button).not.toHaveClass('bg-danger');
  });

  it('is single-flight while loading: busy, focusable, ignores clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Submit
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Nope' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('styles a real link through buttonVariants', () => {
    render(
      <a href="/users" className={buttonVariants({ variant: 'outline' })}>
        Users
      </a>,
    );
    expect(screen.getByRole('link', { name: 'Users' })).toHaveClass('border');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Button>One</Button>
        <Button variant="ghost" size="icon" aria-label="Menu" />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
