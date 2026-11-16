import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DialogHeading, DialogIcon, DialogIconTile } from '@/components/ui/dialog-heading';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Open({ children }: { children: React.ReactNode }) {
  return (
    <Dialog open>
      <DialogContent showCloseButton={false}>{children}</DialogContent>
    </Dialog>
  );
}

describe('DialogHeading', () => {
  it('names and describes the dialog', async () => {
    render(
      <Open>
        <DialogHeading title="Delete trip" description="This cannot be undone" />
      </Open>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Delete trip' });
    expect(dialog).toHaveAccessibleDescription('This cannot be undone');
  });

  it('puts the glyph beside the title by default and above it when stacked', async () => {
    const { rerender } = render(
      <Open>
        <DialogHeading title="Saved" icon={<svg data-testid="glyph" />} />
      </Open>,
    );
    await screen.findByRole('dialog');
    const header = document.querySelector('[data-slot="dialog-header"]');
    expect(header).toHaveAttribute('data-icon-layout', 'inline');
    expect(header).toHaveClass('flex-row');
    rerender(
      <Open>
        <DialogHeading title="Saved" icon={<svg data-testid="glyph" />} iconLayout="stacked" />
      </Open>,
    );
    expect(document.querySelector('[data-slot="dialog-header"]')).toHaveAttribute(
      'data-icon-layout',
      'stacked',
    );
  });

  it('tints the glyph by tone and hides it from assistive tech', async () => {
    render(
      <Open>
        <DialogHeading title="Delete" icon={<svg />} iconTone="danger" />
      </Open>,
    );
    await screen.findByRole('dialog');
    const glyph = document.querySelector('[data-slot="dialog-icon"]');
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph).toHaveAttribute('data-tone', 'danger');
    expect(glyph).toHaveClass('text-danger');
  });

  it('renders the icon tile with the tag container for its tone', () => {
    render(<DialogIconTile icon={<svg />} tone="warning" />);
    expect(document.querySelector('[data-slot="dialog-icon-tile"]')).toHaveClass(
      'bg-tag-orange-container',
    );
  });

  it('keeps the glyph first in Arabic and has no axe violations', async () => {
    const { baseElement } = renderWithLocale(
      <Open>
        <DialogHeading title="حذف الرحلة" description="لا يمكن التراجع" icon={<svg />} />
      </Open>,
      { locale: 'ar' },
    );
    await screen.findByRole('dialog', { name: 'حذف الرحلة' });
    expect(document.querySelector('[data-slot="dialog-icon"]')).toBeInTheDocument();
    await expectNoA11yViolations(baseElement);
  });

  it('exports the bare glyph on its own', () => {
    render(<DialogIcon icon={<svg />} tone="success" />);
    expect(document.querySelector('[data-slot="dialog-icon"]')).toHaveClass('text-success');
  });
});
