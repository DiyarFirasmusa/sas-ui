import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDownIcon,
  FolderIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@/components/ui/icons';
import {
  SavedViewsNameDialog,
  type SavedViewsNameLabels,
} from '@/components/ui/saved-views-name-dialog';
import { useSavedViews } from '@/hooks/use-saved-views';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import {
  createView,
  findView,
  snapshotsEqual,
  type SavedView,
  type SavedViewSnapshot,
  type SavedViewsStorage,
} from '@/lib/saved-views';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'views'
  | 'empty'
  | 'saveCurrent'
  | 'rename'
  | 'setDefault'
  | 'clearDefault'
  | 'delete'
  | 'defaultBadge'
  | 'modified'
  | 'manage'
  | 'deleteTitle'
  | 'deleteDescription'
  | 'deleteConfirm'
  | 'deleteCancel'
> = {
  en: {
    views: 'Views',
    empty: 'No saved views yet.',
    saveCurrent: 'Save current view…',
    rename: 'Rename…',
    setDefault: 'Set as default',
    clearDefault: 'Remove as default',
    delete: 'Delete…',
    defaultBadge: 'Default',
    modified: 'modified',
    manage: 'View: {name}',
    deleteTitle: 'Delete this view?',
    deleteDescription: 'The view "{name}" will be deleted. Your data is not affected.',
    deleteConfirm: 'Delete',
    deleteCancel: 'Cancel',
  },
  ar: {
    views: 'العروض',
    empty: 'لا توجد عروض محفوظة بعد.',
    saveCurrent: 'حفظ العرض الحالي…',
    rename: 'إعادة تسمية…',
    setDefault: 'تعيين كافتراضي',
    clearDefault: 'إزالة كافتراضي',
    delete: 'حذف…',
    defaultBadge: 'افتراضي',
    modified: 'معدّل',
    manage: 'العرض: {name}',
    deleteTitle: 'حذف هذا العرض؟',
    deleteDescription: 'سيتم حذف العرض "{name}". لن تتأثر بياناتك.',
    deleteConfirm: 'حذف',
    deleteCancel: 'إلغاء',
  },
};

type SavedViewsLabels = Partial<Record<keyof (typeof messages)['en'], string>> &
  SavedViewsNameLabels;

interface SavedViewsProps {
  /** The list's state right now (filters, sorting, column visibility, page size); "Save current view" stores it. */
  current: SavedViewSnapshot;
  /** Controlled views. Leave out to let the component keep them (see `storageKey`). */
  views?: SavedView[];
  /** Controlled default view, used with `views`. */
  defaultViewId?: string | null;
  /** The applied view. Leave out and the component tracks it. */
  activeViewId?: string | null;
  /** Keeps the views in `localStorage` under this key when `views` is not controlled. */
  storageKey?: string;
  /** Your own storage (server, IndexedDB…), instead of `storageKey`. */
  storage?: SavedViewsStorage;
  /** A view was chosen: set your filters, sorting, column visibility and page size from it. */
  onApplyView?: (view: SavedView) => void;
  onActiveViewChange?: (id: string | null) => void;
  /** A view was created from `current`. With controlled `views`, add it to your list. */
  onSaveView?: (view: SavedView) => void;
  onRenameView?: (id: string, name: string) => void;
  onDeleteView?: (id: string) => void;
  onSetDefaultView?: (id: string | null) => void;
  /** Apply the default view once when the component first shows. Default true. */
  applyDefaultOnMount?: boolean;
  labels?: SavedViewsLabels;
  className?: string;
}

type DialogState =
  | { type: 'save' }
  | { type: 'rename'; id: string }
  | { type: 'delete'; id: string };

/**
 * Menu of saved list views: apply one, save the current state as a new view,
 * and rename, delete or mark as default the applied one. Controlled
 * (`views`, `activeViewId` and the `on…` callbacks) or self-contained with
 * `storageKey`. Pairs with `DataTable` and `FilterBar`: you own their state,
 * a view is a snapshot of it.
 */
function SavedViews({
  current,
  views: viewsProp,
  defaultViewId,
  activeViewId: activeProp,
  storageKey,
  storage,
  onApplyView,
  onActiveViewChange,
  onSaveView,
  onRenameView,
  onDeleteView,
  onSetDefaultView,
  applyDefaultOnMount = true,
  labels: overrides,
  className,
}: SavedViewsProps) {
  const labels = useLabels(messages, overrides);
  const saved = useSavedViews({ views: viewsProp, defaultViewId, storageKey, storage });
  const { state } = saved;
  const [innerActive, setInnerActive] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  // What the dialogs show while they fade out after `dialog` went back to null.
  const [shown, setShown] = useState<{ dialog: DialogState; name: string } | null>(null);
  const activeId = activeProp === undefined ? innerActive : activeProp;
  const active = findView(state, activeId);
  const modified = active !== undefined && !snapshotsEqual(active, current);

  function openDialog(next: DialogState) {
    setDialog(next);
    setShown({
      dialog: next,
      name: next.type === 'save' ? '' : (findView(state, next.id)?.name ?? ''),
    });
  }

  function setActive(id: string | null) {
    setInnerActive(id);
    onActiveViewChange?.(id);
  }

  function apply(view: SavedView) {
    setActive(view.id);
    onApplyView?.(view);
  }

  // The default view applies once when the list first opens, not again on later re-renders.
  const startedUp = useRef(false);
  useEffect(() => {
    if (startedUp.current) {
      return;
    }
    startedUp.current = true;
    const initial = findView(state, state.defaultViewId);
    if (applyDefaultOnMount && initial && activeProp == null) {
      apply(initial);
    }
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" className={cn('max-w-64', className)} />}
          data-slot="saved-views"
        >
          <FolderIcon />
          <span className="truncate" dir="auto">
            {active?.name ?? labels.views}
          </span>
          {modified ? (
            <>
              {' '}
              <span className="text-b3 text-text-muted">({labels.modified})</span>
            </>
          ) : null}
          <ChevronDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          {state.views.length === 0 ? (
            <p className="px-inline py-field text-b2 text-text-muted">{labels.empty}</p>
          ) : (
            <DropdownMenuRadioGroup
              value={activeId ?? ''}
              onValueChange={(id) => {
                const view = findView(state, String(id));
                if (view) {
                  apply(view);
                }
              }}
            >
              {state.views.map((view) => (
                <DropdownMenuRadioItem key={view.id} value={view.id}>
                  <span className="truncate" dir="auto">
                    {view.name}
                  </span>
                  {view.id === state.defaultViewId ? (
                    <span className="ps-inline text-b3 text-text-muted ms-auto">
                      {labels.defaultBadge}
                    </span>
                  ) : null}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openDialog({ type: 'save' })}>
            <PlusIcon />
            {labels.saveCurrent}
          </DropdownMenuItem>
          {active ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  {fillTemplate(labels.manage, { name: active.name })}
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openDialog({ type: 'rename', id: active.id })}>
                  <PencilIcon />
                  {labels.rename}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    const next = active.id === state.defaultViewId ? null : active.id;
                    saved.setDefault(next);
                    onSetDefaultView?.(next);
                  }}
                >
                  {active.id === state.defaultViewId ? labels.clearDefault : labels.setDefault}
                </DropdownMenuItem>
                <DropdownMenuItem
                  destructive
                  onClick={() => openDialog({ type: 'delete', id: active.id })}
                >
                  <TrashIcon />
                  {labels.delete}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <SavedViewsNameDialog
        open={dialog?.type === 'save' || dialog?.type === 'rename'}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        mode={shown?.dialog.type === 'rename' ? 'rename' : 'save'}
        initialName={shown?.name}
        views={state.views}
        exceptId={shown?.dialog.type === 'rename' ? shown.dialog.id : undefined}
        onSubmit={(name) => {
          if (dialog?.type === 'rename') {
            saved.rename(dialog.id, name);
            onRenameView?.(dialog.id, name);
            return;
          }
          const view = createView(name, current, state.views);
          saved.add(view);
          onSaveView?.(view);
          setActive(view.id);
        }}
        labels={overrides}
      />

      <ConfirmDialog
        open={dialog?.type === 'delete'}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
          }
        }}
        destructive
        title={labels.deleteTitle}
        description={fillTemplate(labels.deleteDescription, { name: shown?.name ?? '' })}
        confirmLabel={labels.deleteConfirm}
        cancelLabel={labels.deleteCancel}
        onConfirm={() => {
          if (dialog?.type !== 'delete') {
            return;
          }
          saved.remove(dialog.id);
          onDeleteView?.(dialog.id);
          if (activeId === dialog.id) {
            setActive(null);
          }
        }}
      />
    </>
  );
}

export { SavedViews };
export type { SavedViewsLabels, SavedViewsProps };
