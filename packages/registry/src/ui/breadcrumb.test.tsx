import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbTrail,
  type BreadcrumbTrailItem,
} from '@/components/ui/breadcrumb';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const longTrail: BreadcrumbTrailItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Archive', href: '/projects/archive' },
  { label: '2025', href: '/projects/archive/2025' },
  { label: 'Report' },
];

describe('Breadcrumb', () => {
  it('renders a named nav with an ordered list and the current page', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(nav).getByRole('list').tagName).toBe('OL');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('Settings')).toHaveAttribute('aria-current', 'page');
  });

  it('hides separators from assistive tech', () => {
    const { container } = render(
      <BreadcrumbTrail items={[{ label: 'A', href: '/a' }, { label: 'B' }]} />,
    );
    const separator = container.querySelector('[data-slot="breadcrumb-separator"]');
    expect(separator).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('lets a custom link renderer take over the anchor', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<button type="button" />}>Home</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute(
      'data-slot',
      'breadcrumb-link',
    );
  });

  it('collapses the middle of a long trail into an ellipsis menu', async () => {
    render(<BreadcrumbTrail items={longTrail} />);
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '2025' })).toBeInTheDocument();
    expect(screen.getByText('Report')).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('button', { name: 'More pages' }));
    const menu = await screen.findByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Projects' })).toHaveAttribute(
      'href',
      '/projects',
    );
    expect(within(menu).getByRole('menuitem', { name: 'Archive' })).toBeInTheDocument();
  });

  it('shows short trails in full', () => {
    render(<BreadcrumbTrail items={longTrail.slice(0, 3)} />);
    expect(screen.queryByRole('button', { name: 'More pages' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
  });

  it('honours custom maxItems and before/after counts', () => {
    render(<BreadcrumbTrail items={longTrail} maxItems={5} />);
    expect(screen.queryByRole('button', { name: 'More pages' })).not.toBeInTheDocument();
  });

  it('opens the ellipsis menu from the keyboard', async () => {
    render(<BreadcrumbTrail items={longTrail} />);
    screen.getByRole('button', { name: 'More pages' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(await screen.findByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
  });

  it('labels the landmark and ellipsis in Arabic and mirrors the separator', () => {
    const { container } = renderWithLocale(
      <BreadcrumbTrail items={[{ label: 'الرئيسية', href: '/' }, { label: 'التقارير' }]} />,
      { locale: 'ar' },
    );
    expect(screen.getByRole('navigation', { name: 'مسار التنقل' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="breadcrumb-separator"] svg')).toHaveClass(
      'rtl:-scale-x-100',
    );
  });

  it('names the ellipsis button in Arabic', () => {
    renderWithLocale(<BreadcrumbTrail items={longTrail} />, { locale: 'ar' });
    expect(screen.getByRole('button', { name: 'المزيد من الصفحات' })).toBeInTheDocument();
  });

  it('accepts custom labels', () => {
    render(<BreadcrumbTrail items={longTrail} label="You are here" moreLabel="Hidden" />);
    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hidden' })).toBeInTheDocument();
  });

  it('has no axe violations (collapsed and open)', async () => {
    render(<BreadcrumbTrail items={longTrail} />);
    await expectNoA11yViolations();
    await userEvent.click(screen.getByRole('button', { name: 'More pages' }));
    await screen.findByRole('menu');
    await expectNoA11yViolations();
  });
});
