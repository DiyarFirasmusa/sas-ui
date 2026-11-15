import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, AvatarGroup, getInitials, hueIndexForName } from '@/components/ui/avatar';
import { renderWithLocale } from '@/test/render';
import { expectNoA11yViolations } from '@/test/a11y';

describe('getInitials', () => {
  it('takes the first letter of the first two words', () => {
    expect(getInitials('ada lovelace byron')).toBe('AL');
    expect(getInitials('  Grace   Hopper ')).toBe('GH');
  });

  it('handles a single word and an empty name', () => {
    expect(getInitials('Madonna')).toBe('M');
    expect(getInitials('   ')).toBe('');
  });

  it('works for Arabic names', () => {
    expect(getInitials('محمد علي الحسن')).toBe('مع');
    expect(getInitials('فاطمة')).toBe('ف');
  });

  it('keeps a letter with its combining marks together', () => {
    expect(getInitials('émile zola')).toBe('ÉZ');
    expect(getInitials('بِسْم الله')).toBe('بِا');
  });

  it('does not split an emoji', () => {
    expect(getInitials('👩🏽‍💻 Dev')).toBe('👩🏽‍💻D');
  });
});

describe('hueIndexForName', () => {
  it('is deterministic and ignores surrounding whitespace', () => {
    expect(hueIndexForName('Layla Hassan')).toBe(hueIndexForName('  Layla Hassan '));
  });

  it('spreads different names over several hues', () => {
    const names = ['Ada', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'علي', 'سارة', 'نور'];
    expect(new Set(names.map(hueIndexForName)).size).toBeGreaterThan(2);
  });
});

describe('Avatar', () => {
  it('shows initials and is named after the person', () => {
    render(<Avatar name="Layla Hassan" />);
    const avatar = screen.getByRole('img', { name: 'Layla Hassan' });
    expect(avatar).toHaveTextContent('LH');
  });

  it('colours the fallback from the name', () => {
    const { container } = render(<Avatar name="Layla Hassan" />);
    expect(container.querySelector('[class*="bg-tag-"]')).toBeInTheDocument();
  });

  it('shows Arabic initials', () => {
    renderWithLocale(<Avatar name="محمد علي" />, { locale: 'ar' });
    expect(screen.getByRole('img', { name: 'محمد علي' })).toHaveTextContent('مع');
  });

  it('falls back to the user glyph without a name', () => {
    const { container } = render(<Avatar />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders a custom fallback', () => {
    render(<Avatar fallback={<span>?</span>} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('keeps the initials while an image has not loaded', () => {
    render(<Avatar name="Layla Hassan" src="/missing.png" />);
    expect(screen.getByRole('img', { name: 'Layla Hassan' })).toHaveTextContent('LH');
  });

  it.each([
    ['xs', 'size-6'],
    ['sm', 'size-8'],
    ['md', 'size-10'],
    ['lg', 'size-12'],
    ['xl', 'size-16'],
  ] as const)('supports the %s size', (size, className) => {
    render(<Avatar name="A B" size={size} />);
    expect(screen.getByRole('img')).toHaveClass(className);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Avatar name="Layla Hassan" />);
    await expectNoA11yViolations(container);
  });
});

const people = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Ken Thompson', 'Dennis Ritchie', 'Margaret Hamilton'].map(
  (name) => ({ name }),
);

describe('AvatarGroup', () => {
  it('collapses the overflow into a +N tile with an accessible count', () => {
    render(<AvatarGroup people={people} max={3} label="Team" />);
    expect(screen.getByRole('group', { name: 'Team' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /^[A-Z][a-z]+ / })).toHaveLength(3);
    expect(screen.getByRole('img', { name: '3 more' })).toHaveTextContent('+3');
  });

  it('shows everyone when they fit', () => {
    render(<AvatarGroup people={people.slice(0, 2)} max={4} />);
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });

  it('overlaps with a logical margin so it mirrors in RTL', () => {
    renderWithLocale(<AvatarGroup people={people} max={2} />, { locale: 'ar' });
    expect(screen.getByRole('img', { name: '4 آخرين' })).toHaveClass('-ms-2');
    expect(screen.getByText('+4')).toHaveAttribute('dir', 'ltr');
  });

  it('has no axe violations', async () => {
    const { container } = render(<AvatarGroup people={people} max={3} label="Team" />);
    await expectNoA11yViolations(container);
  });
});
