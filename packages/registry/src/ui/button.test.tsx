import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button, buttonVariants } from '@/components/ui/button';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

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
    expect(button).toHaveClass('h-control-sm', 'text-danger-foreground', 'bg-info');
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

  it('does not submit its form again while loading', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Send
        </Button>
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
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

  it('exposes data-variant and data-size with their defaults', () => {
    render(
      <>
        <Button>Plain</Button>
        <Button variant="navy" size="pill">
          Pill
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Plain' })).toHaveAttribute(
      'data-variant',
      'default',
    );
    expect(screen.getByRole('button', { name: 'Plain' })).toHaveAttribute('data-size', 'default');
    const pill = screen.getByRole('button', { name: 'Pill' });
    expect(pill).toHaveAttribute('data-variant', 'navy');
    expect(pill).toHaveAttribute('data-size', 'pill');
  });

  it('sizes every button from the geometry tokens, never from pixels', () => {
    render(
      <>
        <Button>Default</Button>
        <Button size="xs">Xs</Button>
        <Button size="sm">Sm</Button>
        <Button size="lg">Lg</Button>
        <Button size="icon" aria-label="Icon" />
        <Button size="icon-xs" aria-label="Icon xs" />
        <Button size="icon-sm" aria-label="Icon sm" />
        <Button size="icon-lg" aria-label="Icon lg" />
      </>,
    );
    const get = (name: string) => screen.getByRole('button', { name });
    expect(get('Default')).toHaveClass(
      'h-control',
      'px-control-x',
      'rounded-control',
      'text-control',
    );
    expect(get('Xs')).toHaveClass('h-control-xs', 'px-inline', 'text-label');
    expect(get('Sm')).toHaveClass('h-control-sm', 'px-row', 'text-button-2');
    expect(get('Lg')).toHaveClass('h-control-lg');
    expect(get('Lg').className).toContain('px-[calc(var(--control-px,16px)+4px)]');
    expect(get('Icon').className).toContain('size-[min(calc(var(--control-h,38px)+2px)');
    expect(get('Icon xs')).toHaveClass('size-control-xs', 'px-0');
    expect(get('Icon sm')).toHaveClass('size-control-sm', 'px-0');
    expect(get('Icon lg')).toHaveClass('size-control-lg', 'px-0');
  });

  it("carries the app's states: 1px border, focus outline, 150ms transition, disabled fill", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(
      'border',
      'border-transparent',
      'duration-150',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2',
      'focus-visible:outline-primary-highlight',
      'disabled:bg-disabled-container',
      'disabled:text-text-inactive',
      'disabled:shadow-none',
      'aria-disabled:bg-disabled-container',
      'shadow-primary',
      'hover:bg-primary-hover',
    );
  });

  it.each([
    ['default', ['bg-primary', 'text-primary-foreground']],
    ['navy', ['bg-primary-container', 'text-primary-foreground']],
    ['outline', ['border-stroke', 'bg-text-primary/6', 'text-text-primary', 'hover:bg-hover-row']],
    [
      'outline-primary',
      ['border-primary-highlight', 'bg-transparent', 'text-primary-text', 'hover:bg-primary-light'],
    ],
    ['secondary', ['bg-primary-light', 'text-primary-text']],
    ['destructive', ['bg-danger', 'text-danger-foreground']],
    ['destructive-soft', ['bg-tag-red-container', 'text-tag-red', 'hover:bg-tag-red/12']],
    ['link', ['text-primary-text', 'hover:underline']],
  ] as const)('keeps the %s variant on the app tones', (variant, classes) => {
    render(<Button variant={variant}>Tone</Button>);
    expect(screen.getByRole('button', { name: 'Tone' })).toHaveClass(...classes);
  });

  it('keeps a disabled link transparent instead of the grey chip', () => {
    render(
      <Button variant="link" disabled>
        More
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'More' })).toHaveClass(
      'disabled:bg-transparent',
      'aria-disabled:bg-transparent',
    );
  });

  it('adds a navy variant and a 40px pill size', () => {
    render(
      <Button variant="navy" size="pill">
        Go
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Go' })).toHaveClass(
      'bg-primary-container',
      'text-primary-foreground',
      'rounded-pill',
      'h-10',
    );
  });

  it.each(['xs', 'sm', 'default', 'lg', 'pill'] as const)(
    'link forces h-auto p-0 at size %s',
    (size) => {
      render(
        <Button variant="link" size={size}>
          More
        </Button>,
      );
      const link = screen.getByRole('button', { name: 'More' });
      expect(link).toHaveClass('h-auto', 'p-0');
      expect(link).not.toHaveClass(
        'h-10',
        'h-control',
        'h-control-lg',
        'h-control-sm',
        'h-control-xs',
      );
    },
  );

  it('asChild lends the look to a link without a button element', async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <Button asChild variant="outline" className="extra" onClick={onClick}>
        <a href="/users">Users</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Users' });
    expect(screen.queryByRole('button')).toBeNull();
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link).toHaveAttribute('data-variant', 'outline');
    expect(link).toHaveClass('border', 'extra');
    await userEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders in Arabic with no axe violations', async () => {
    const { container } = renderWithLocale(
      <div>
        <Button variant="navy">حفظ</Button>
        <Button asChild variant="link">
          <a href="/ar">المزيد</a>
        </Button>
      </div>,
      { locale: 'ar' },
    );
    expect(screen.getByRole('button', { name: 'حفظ' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
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
