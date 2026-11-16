import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SavedViews, type SavedViewsProps } from '@/components/ui/saved-views';
import {
  createLocalStorageAdapter,
  type SavedView,
  type SavedViewSnapshot,
} from '@/lib/saved-views';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const current: SavedViewSnapshot = {
  filters: { status: 'open' },
  sorting: [{ id: 'total', desc: true }],
  columnVisibility: { city: false },
  pageSize: 25,
};

function view(id: string, name: string, extra: Partial<SavedViewSnapshot> = {}): SavedView {
  return { id, name, ...current, ...extra };
}

const stored = [view('a', 'Open bookings'), view('b', 'الحجوزات المغلقة', { pageSize: 50 })];

afterEach(() => window.localStorage.clear());

function setup(props: Partial<SavedViewsProps> = {}, locale: 'en' | 'ar' = 'en') {
  return renderWithLocale(<SavedViews current={current} {...props} />, { locale });
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(document.querySelector<HTMLElement>('[data-slot="saved-views"]') as HTMLElement);
  return screen.findByRole('menu');
}

describe('SavedViews menu', () => {
  it('lists the views and marks the active and default ones', async () => {
    const user = userEvent.setup();
    setup({ views: stored, activeViewId: 'a', defaultViewId: 'b' });
    expect(screen.getByRole('button', { name: /Open bookings/ })).toBeInTheDocument();
    const menu = await openMenu(user);
    const radios = within(menu).getAllByRole('menuitemradio');
    expect(radios.map((radio) => radio.textContent)).toEqual([
      'Open bookings',
      'الحجوزات المغلقةDefault',
    ]);
    expect(radios[0]).toBeChecked();
    expect(radios[1]).not.toBeChecked();
  });

  it('shows an empty message and the save item when there are no views', async () => {
    const user = userEvent.setup();
    setup({ views: [] });
    expect(screen.getByRole('button', { name: /Views/ })).toBeInTheDocument();
    const menu = await openMenu(user);
    expect(within(menu).getByText('No saved views yet.')).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Save current view…' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Rename…' })).not.toBeInTheDocument();
  });

  it('applies a view and reports it', async () => {
    const user = userEvent.setup();
    const onApplyView = vi.fn();
    const onActiveViewChange = vi.fn();
    setup({ views: stored, onApplyView, onActiveViewChange });
    await openMenu(user);
    await user.click(screen.getByRole('menuitemradio', { name: 'الحجوزات المغلقة' }));
    expect(onApplyView).toHaveBeenCalledWith(stored[1]);
    expect(onActiveViewChange).toHaveBeenCalledWith('b');
    // Uncontrolled active state: the trigger now names the view.
    expect(await screen.findByRole('button', { name: /الحجوزات المغلقة/ })).toBeInTheDocument();
  });

  it('flags the active view as modified once the list state differs from it', () => {
    setup({ views: stored, activeViewId: 'a', current: { ...current, pageSize: 100 } });
    expect(screen.getByRole('button', { name: /Open bookings \(modified\)/ })).toBeInTheDocument();
  });

  it('does not flag it when the state matches', () => {
    setup({ views: stored, activeViewId: 'a' });
    expect(screen.queryByText('(modified)')).not.toBeInTheDocument();
  });
});

describe('SavedViews save, rename, default and delete', () => {
  it('saves the current state under a new name and activates it', async () => {
    const user = userEvent.setup();
    const onSaveView = vi.fn();
    const onActiveViewChange = vi.fn();
    setup({ views: stored, onSaveView, onActiveViewChange });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Save current view…' }));
    const dialog = await screen.findByRole('dialog', { name: 'Save current view' });
    await user.type(within(dialog).getByRole('textbox', { name: /View name/ }), '  My   view ');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onSaveView).toHaveBeenCalledTimes(1);
    const saved: SavedView = onSaveView.mock.calls[0]?.[0];
    expect(saved).toMatchObject({ name: 'My view', ...current });
    expect(stored.map((entry) => entry.id)).not.toContain(saved.id);
    expect(onActiveViewChange).toHaveBeenCalledWith(saved.id);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('refuses an empty or duplicate name and keeps the dialog open', async () => {
    const user = userEvent.setup();
    const onSaveView = vi.fn();
    setup({ views: stored, onSaveView });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Save current view…' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('Enter a name for the view.')).toBeInTheDocument();
    await user.type(within(dialog).getByRole('textbox'), 'open BOOKINGS');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(
      await within(dialog).findByText('A view with this name already exists.'),
    ).toBeInTheDocument();
    expect(onSaveView).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('renames the active view and may keep its own name', async () => {
    const user = userEvent.setup();
    const onRenameView = vi.fn();
    setup({ views: stored, activeViewId: 'a', onRenameView });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Rename…' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename view' });
    const input = within(dialog).getByRole('textbox');
    expect(input).toHaveValue('Open bookings');
    await user.clear(input);
    await user.type(input, 'Open');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(onRenameView).toHaveBeenCalledWith('a', 'Open');
  });

  it('sets and clears the default', async () => {
    const user = userEvent.setup();
    const onSetDefaultView = vi.fn();
    const { rerender } = setup({ views: stored, activeViewId: 'a', onSetDefaultView });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Set as default' }));
    expect(onSetDefaultView).toHaveBeenLastCalledWith('a');
    rerender(
      <SavedViews
        current={current}
        views={stored}
        activeViewId="a"
        defaultViewId="a"
        onSetDefaultView={onSetDefaultView}
      />,
    );
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Remove as default' }));
    expect(onSetDefaultView).toHaveBeenLastCalledWith(null);
  });

  it('deletes the active view only after confirmation', async () => {
    const user = userEvent.setup();
    const onDeleteView = vi.fn();
    const onActiveViewChange = vi.fn();
    setup({ views: stored, activeViewId: 'a', onDeleteView, onActiveViewChange });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Delete…' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this view?' });
    expect(within(dialog).getByText(/Open bookings/)).toBeInTheDocument();
    expect(onDeleteView).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDeleteView).toHaveBeenCalledWith('a'));
  });
});

describe('SavedViews built-in storage', () => {
  it('saves into localStorage, restores after a remount and applies the default view on mount', async () => {
    const user = userEvent.setup();
    const first = setup({ storageKey: 'views:test' });
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Save current view…' }));
    await user.type(await screen.findByRole('textbox'), 'الحجوزات المفتوحة');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(createLocalStorageAdapter('views:test').load().views).toHaveLength(1),
    );
    const savedId = createLocalStorageAdapter('views:test').load().views[0]?.id ?? '';
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Set as default' }));
    expect(createLocalStorageAdapter('views:test').load().defaultViewId).toBe(savedId);
    first.unmount();

    const onApplyView = vi.fn();
    setup({ storageKey: 'views:test', onApplyView });
    expect(onApplyView).toHaveBeenCalledTimes(1);
    expect(onApplyView).toHaveBeenCalledWith(
      expect.objectContaining({ id: savedId, name: 'الحجوزات المفتوحة' }),
    );
    expect(screen.getByRole('button', { name: /الحجوزات المفتوحة/ })).toBeInTheDocument();
  });

  it('does not apply the default when told not to or when a view is already active', () => {
    createLocalStorageAdapter('views:skip').save({ views: stored, defaultViewId: 'a' });
    const onApplyView = vi.fn();
    const { unmount } = setup({
      storageKey: 'views:skip',
      onApplyView,
      applyDefaultOnMount: false,
    });
    expect(onApplyView).not.toHaveBeenCalled();
    unmount();
    setup({ storageKey: 'views:skip', onApplyView, activeViewId: 'b' });
    expect(onApplyView).not.toHaveBeenCalled();
  });

  it('works inside a parent that owns the state', async () => {
    const user = userEvent.setup();
    function Parent() {
      const [views, setViews] = useState<SavedView[]>([]);
      return (
        <>
          <SavedViews
            current={current}
            views={views}
            onSaveView={(saved) => setViews((list) => [...list, saved])}
          />
          <output>{views.map((entry) => entry.name).join('|')}</output>
        </>
      );
    }
    renderWithLocale(<Parent />);
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Save current view…' }));
    await user.type(await screen.findByRole('textbox'), 'Mine');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Mine'));
  });
});

describe('SavedViews in Arabic', () => {
  it('uses Arabic labels and has no axe violations', async () => {
    const user = userEvent.setup();
    const { container } = setup({ views: stored, activeViewId: 'b', defaultViewId: 'b' }, 'ar');
    expect(document.documentElement.dir).toBe('rtl');
    const menu = await openMenu(user);
    expect(within(menu).getByRole('menuitem', { name: 'حفظ العرض الحالي…' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'إزالة كافتراضي' })).toBeInTheDocument();
    expect(within(menu).getByText('افتراضي')).toBeInTheDocument();
    await expectNoA11yViolations(container);
    await user.click(within(menu).getByRole('menuitem', { name: 'إعادة تسمية…' }));
    const dialog = await screen.findByRole('dialog', { name: 'إعادة تسمية العرض' });
    expect(within(dialog).getByRole('textbox', { name: /اسم العرض/ })).toHaveValue(
      'الحجوزات المغلقة',
    );
    await expectNoA11yViolations(dialog);
  });

  it('has no axe violations closed or with the English dialog open', async () => {
    const user = userEvent.setup();
    const { container } = setup({ views: stored, activeViewId: 'a' });
    await expectNoA11yViolations(container);
    await openMenu(user);
    await user.click(screen.getByRole('menuitem', { name: 'Save current view…' }));
    await expectNoA11yViolations(await screen.findByRole('dialog'));
  });
});
