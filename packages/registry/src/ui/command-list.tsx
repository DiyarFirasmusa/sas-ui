import { useId } from 'react';
import { LoaderIcon } from '@/components/ui/icons';
import { GroupContext, useCommand } from '@/hooks/use-command';
import { commandMessages } from '@/lib/command-messages';
import { useLabels } from '@/lib/locale';
import { cn } from '@/lib/utils';

interface CommandListProps extends React.ComponentProps<'div'> {
  /** Accessible name of the results list; defaults to "Results" / "النتائج". */
  label?: string;
}

function CommandList({ className, label, ...props }: CommandListProps) {
  const command = useCommand();
  const labels = useLabels(commandMessages);
  // With nothing to choose from this is a plain container for the empty
  // message; a listbox with no options would be invalid.
  return (
    <div
      data-slot="command-list"
      id={command.listId}
      role={command.hasResults ? 'listbox' : undefined}
      aria-label={command.hasResults ? (label ?? labels.results) : undefined}
      className={cn(
        'max-h-80 min-h-0 flex-1 scroll-py-1 overflow-y-auto overflow-x-hidden p-1 outline-none',
        className,
      )}
      {...props}
    />
  );
}

/** Shown when no item matches. Put it inside `CommandList`. */
function CommandEmpty({ className, children, ...props }: React.ComponentProps<'div'>) {
  const command = useCommand();
  const labels = useLabels(commandMessages);
  if (!command.ready || command.hasResults) {
    return null;
  }
  return (
    <div
      data-slot="command-empty"
      role="status"
      className={cn('px-row py-panel text-center text-b1 text-text-muted', className)}
      {...props}
    >
      {children ?? labels.empty}
    </div>
  );
}

/** Spinner row for async results. Render it instead of the items while loading. */
function CommandLoading({ className, children, ...props }: React.ComponentProps<'div'>) {
  const labels = useLabels(commandMessages);
  return (
    <div
      data-slot="command-loading"
      role="status"
      className={cn(
        'flex items-center justify-center gap-field px-row py-panel text-b1 text-text-muted',
        className,
      )}
      {...props}
    >
      <LoaderIcon className="animate-spin motion-reduce:animate-none" />
      {children ?? labels.loading}
    </div>
  );
}

interface CommandGroupProps extends Omit<React.ComponentProps<'div'>, 'heading'> {
  heading?: React.ReactNode;
}

function CommandGroup({ heading, className, children, ...props }: CommandGroupProps) {
  const command = useCommand();
  const id = useId();
  const headingId = `${id}-heading`;
  return (
    <GroupContext value={id}>
      <div
        data-slot="command-group"
        role="group"
        aria-labelledby={heading ? headingId : undefined}
        hidden={!command.groupVisible(id)}
        className={cn('overflow-hidden', className)}
        {...props}
      >
        {heading ? (
          <div id={headingId} className="px-field text-table-header text-text-muted py-1.5">
            {heading}
          </div>
        ) : null}
        {children}
      </div>
    </GroupContext>
  );
}

function CommandSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="command-separator"
      aria-hidden="true"
      className={cn('-mx-1 my-1 h-px bg-stroke-subtle', className)}
      {...props}
    />
  );
}

export { CommandEmpty, CommandGroup, CommandList, CommandLoading, CommandSeparator };
export type { CommandListProps };
