import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useLabels, type Messages } from '@/lib/locale';
import { checkViewName, normalizeViewName, type SavedView } from '@/lib/saved-views';

const messages: Messages<
  | 'saveTitle'
  | 'renameTitle'
  | 'nameLabel'
  | 'save'
  | 'cancel'
  | 'errorEmpty'
  | 'errorTooLong'
  | 'errorDuplicate'
> = {
  en: {
    saveTitle: 'Save current view',
    renameTitle: 'Rename view',
    nameLabel: 'View name',
    save: 'Save',
    cancel: 'Cancel',
    errorEmpty: 'Enter a name for the view.',
    errorTooLong: 'Use 60 characters or fewer.',
    errorDuplicate: 'A view with this name already exists.',
  },
  ar: {
    saveTitle: 'حفظ العرض الحالي',
    renameTitle: 'إعادة تسمية العرض',
    nameLabel: 'اسم العرض',
    save: 'حفظ',
    cancel: 'إلغاء',
    errorEmpty: 'أدخل اسمًا للعرض.',
    errorTooLong: 'استخدم 60 حرفًا أو أقل.',
    errorDuplicate: 'يوجد عرض بهذا الاسم بالفعل.',
  },
};

type SavedViewsNameLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface SavedViewsNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `save` stores the current list state under a new name, `rename` changes an existing view's name. */
  mode: 'save' | 'rename';
  initialName?: string;
  /** All views, to reject a name that is taken. */
  views: readonly SavedView[];
  /** The view being renamed: it may keep its own name. */
  exceptId?: string;
  onSubmit: (name: string) => void;
  labels?: SavedViewsNameLabels;
}

interface NameFormProps extends Omit<SavedViewsNameDialogProps, 'open' | 'onOpenChange'> {
  onDone: () => void;
}

/** Mounted only while the dialog is open, so every opening starts with a fresh field and no error. */
function NameForm({
  mode,
  initialName = '',
  views,
  exceptId,
  onSubmit,
  onDone,
  labels: overrides,
}: NameFormProps) {
  const labels = useLabels(messages, overrides);
  const [name, setName] = useState(initialName);
  const [submitted, setSubmitted] = useState(false);
  const problem = checkViewName(name, views, exceptId);
  const errorText =
    problem === 'empty'
      ? labels.errorEmpty
      : problem === 'too-long'
        ? labels.errorTooLong
        : problem === 'duplicate'
          ? labels.errorDuplicate
          : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (problem === null) {
      onSubmit(normalizeViewName(name));
      onDone();
    }
  }

  return (
    <form
      data-slot="saved-views-name-form"
      onSubmit={submit}
      className="flex min-h-0 flex-1 flex-col"
    >
      <DialogHeader>
        <DialogTitle>{mode === 'save' ? labels.saveTitle : labels.renameTitle}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <Field label={labels.nameLabel} error={submitted ? errorText : undefined} required>
          <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
      </DialogBody>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          {labels.cancel}
        </DialogClose>
        <Button type="submit">{labels.save}</Button>
      </DialogFooter>
    </form>
  );
}

/** Small dialog that asks for a view's name, validating it against the existing views. */
function SavedViewsNameDialog({ open, onOpenChange, ...form }: SavedViewsNameDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <NameForm {...form} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

export { SavedViewsNameDialog };
export type { SavedViewsNameDialogProps, SavedViewsNameLabels };
