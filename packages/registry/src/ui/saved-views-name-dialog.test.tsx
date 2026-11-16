import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  SavedViewsNameDialog,
  type SavedViewsNameDialogProps,
} from '@/components/ui/saved-views-name-dialog';
import type { SavedView } from '@/lib/saved-views';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const views: SavedView[] = [
  { id: 'a', name: 'Open', filters: {}, sorting: [], columnVisibility: {}, pageSize: 10 },
  { id: 'b', name: 'الحجوزات', filters: {}, sorting: [], columnVisibility: {}, pageSize: 10 },
];

function setup(props: Partial<SavedViewsNameDialogProps> = {}, locale: 'en' | 'ar' = 'en') {
  const onSubmit = vi.fn();
  const onOpenChange = vi.fn();
  renderWithLocale(
    <SavedViewsNameDialog
      open
      onOpenChange={onOpenChange}
      mode="save"
      views={views}
      onSubmit={onSubmit}
      {...props}
    />,
    { locale },
  );
  return { onSubmit, onOpenChange };
}

describe('SavedViewsNameDialog', () => {
  it('submits a trimmed name and closes', async () => {
    const user = userEvent.setup();
    const { onSubmit, onOpenChange } = setup();
    const dialog = screen.getByRole('dialog', { name: 'Save current view' });
    await user.type(
      within(dialog).getByRole('textbox', { name: /View name/ }),
      '  Weekly   report ',
    );
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Weekly report');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows no error until the first submit, then explains each problem', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();
    const input = screen.getByRole('textbox');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a name for the view.');
    await user.type(input, 'x'.repeat(61));
    expect(await screen.findByText('Use 60 characters or fewer.')).toBeInTheDocument();
    await user.clear(input);
    await user.type(input, 'الحجوزات');
    expect(await screen.findByText('A view with this name already exists.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('starts a rename from the current name and allows keeping it', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup({ mode: 'rename', initialName: 'Open', exceptId: 'a' });
    expect(screen.getByRole('dialog', { name: 'Rename view' })).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('Open');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith('Open');
  });

  it('closes with Cancel without submitting', async () => {
    const user = userEvent.setup();
    const { onSubmit, onOpenChange } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange.mock.calls[0]?.[0]).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('renders nothing while closed', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is in Arabic and accepts label overrides', async () => {
    setup({}, 'ar');
    expect(screen.getByRole('dialog', { name: 'حفظ العرض الحالي' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'حفظ' })).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('has no axe violations', async () => {
    setup();
    await expectNoA11yViolations(screen.getByRole('dialog'));
  });
});
