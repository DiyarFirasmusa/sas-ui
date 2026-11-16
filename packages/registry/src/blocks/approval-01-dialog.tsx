import { useEffect, useRef, useState } from 'react';
import type { ApprovalAction } from '@/components/blocks/approval-01-data';
import { actionCopy, type Approval01Labels } from '@/components/blocks/approval-01-messages';
import { Field } from '@/components/ui/field';
import { FormDialog } from '@/components/ui/form-dialog';
import { Textarea } from '@/components/ui/textarea';
import { fillTemplate } from '@/lib/format-message';

interface DecisionDialogProps {
  /** The action being confirmed; the dialog is open while this is set. */
  action: ApprovalAction | null;
  labels: Approval01Labels;
  /** Names the stage in the description; comes from the request. */
  stageName: string;
  /** Actions that cannot be confirmed without a comment. */
  requireComment: readonly ApprovalAction[];
  /** Resolve to close; reject (or throw) to stay open and show the error. */
  onSubmit: (action: ApprovalAction, comment: string) => void | Promise<void>;
  onClose: () => void;
}

function failureMessage(thrown: unknown, fallback: string): string {
  return thrown instanceof Error && thrown.message ? thrown.message : fallback;
}

/**
 * The comment dialog behind Approve / Reject / Return. The comment is checked
 * before anything is sent, submitting is single-flight, and a failed save
 * keeps the dialog open with the comment the user already typed.
 */
function DecisionDialog({
  action,
  labels,
  stageName,
  requireComment,
  onSubmit,
  onClose,
}: DecisionDialogProps) {
  const [comment, setComment] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const inFlight = useRef(false);
  // The close animation still shows the copy, after `action` went back to null.
  const lastAction = useRef<ApprovalAction>('approve');
  if (action !== null) {
    lastAction.current = action;
  }
  const copy = actionCopy(labels, action ?? lastAction.current);

  useEffect(() => {
    if (action !== null) {
      setComment('');
      setAttempted(false);
      setFailure(null);
    }
  }, [action]);

  const required = action !== null && requireComment.includes(action);
  const missing = required && comment.trim() === '';

  async function submit() {
    if (action === null || inFlight.current) {
      return;
    }
    setAttempted(true);
    if (missing) {
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setFailure(null);
    try {
      await onSubmit(action, comment.trim());
      onClose();
    } catch (thrown) {
      setFailure(failureMessage(thrown, labels.submitFailed));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <FormDialog
      open={action !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      size="sm"
      title={copy.title}
      description={copy.description}
      submitLabel={copy.button}
      cancelLabel={labels.cancel}
      isSubmitting={submitting}
      error={failure}
      onSubmit={submit}
    >
      <p className="text-b2 text-text-secondary">
        {fillTemplate(labels.dialogStage, { stage: stageName })}
      </p>
      <Field
        label={labels.commentLabel}
        required={required}
        description={required ? undefined : labels.commentOptional}
        error={attempted && missing ? labels.commentRequired : undefined}
      >
        <Textarea
          value={comment}
          placeholder={labels.commentPlaceholder}
          rows={4}
          onChange={(event) => setComment(event.target.value)}
        />
      </Field>
    </FormDialog>
  );
}

export { DecisionDialog };
export type { DecisionDialogProps };
