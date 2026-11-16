import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilterBuilderRule } from '@/components/ui/filter-builder-rule';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import {
  addNode,
  createGroup,
  createRule,
  isFilterGroup,
  removeNode,
  setCombinator,
  updateRule,
  type FilterCombinator,
  type FilterField,
  type FilterGroup,
  type GroupPath,
} from '@/lib/filter-builder';
import { filterBuilderMessages, type FilterBuilderLabelKey } from '@/lib/filter-builder-messages';
import { validateGroup, type FilterRuleError } from '@/lib/filter-builder-validate';
import { fillTemplate } from '@/lib/format-message';
import { useLabels } from '@/lib/locale';
import { cn } from '@/lib/utils';

type Labels = Record<FilterBuilderLabelKey, string>;

interface FilterBuilderProps extends Omit<
  React.ComponentProps<'div'>,
  'children' | 'onChange' | 'defaultValue'
> {
  /** What can be filtered on. A rule whose field is missing from here is flagged. */
  fields: readonly FilterField[];
  /** The edited filter. Controlled: apply `onChange`'s result back. */
  value: FilterGroup;
  onChange: (value: FilterGroup) => void;
  /**
   * Shows an Apply button. Called with the filter only when every rule is
   * complete; otherwise the problems are shown and nothing is called.
   */
  onApply?: (value: FilterGroup) => void;
  /** Shows a Reset button. The filter is emptied through `onChange` first. */
  onReset?: () => void;
  /** Deepest level of nested groups, the root counting as 1. Default 3. */
  maxDepth?: number;
  labels?: Partial<Record<FilterBuilderLabelKey, string>>;
}

interface GroupEditorProps {
  root: FilterGroup;
  group: FilterGroup;
  path: GroupPath;
  fields: readonly FilterField[];
  labels: Labels;
  maxDepth: number;
  errors: Record<string, FilterRuleError>;
  onChange: (value: FilterGroup) => void;
}

const segmentClasses = cn(
  'inline-flex min-h-11 min-w-12 cursor-pointer items-center justify-center rounded-md px-inline text-button-2 text-text-secondary outline-none sm:min-h-8',
  'transition-colors motion-reduce:transition-none hover:text-text-primary',
  'focus-visible:ring-2 focus-visible:ring-ring',
  'data-[pressed]:bg-primary data-[pressed]:text-primary-foreground',
);

function GroupEditor({
  root,
  group,
  path,
  fields,
  labels,
  maxDepth,
  errors,
  onChange,
}: GroupEditorProps) {
  const depth = path.length + 1;
  const nested = path.length > 0;
  const firstField = fields[0];

  return (
    <div
      role="group"
      data-slot="filter-builder-group"
      data-depth={depth}
      aria-label={labels.group}
      className={cn(
        'gap-field flex flex-col',
        nested && 'rounded-lg border border-stroke bg-surface-dim p-field',
      )}
    >
      <div className="gap-field flex flex-wrap items-center justify-between">
        <ToggleGroup
          aria-label={labels.combinator}
          value={[group.combinator]}
          onValueChange={(next: FilterCombinator[]) => {
            const [combinator] = next;
            if (combinator !== undefined) {
              onChange(setCombinator(root, path, combinator));
            }
          }}
          className="rounded-control border-stroke-strong bg-surface inline-flex gap-0.5 border p-0.5"
        >
          <Toggle value="and" data-slot="filter-builder-combinator" className={segmentClasses}>
            {labels.and}
          </Toggle>
          <Toggle value="or" data-slot="filter-builder-combinator" className={segmentClasses}>
            {labels.or}
          </Toggle>
        </ToggleGroup>
        {nested ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(removeNode(root, path))}
            className="max-sm:min-h-11"
          >
            <TrashIcon />
            {labels.removeGroup}
          </Button>
        ) : null}
      </div>

      {group.rules.length === 0 ? (
        <p className="text-b2 text-text-muted">{labels.empty}</p>
      ) : (
        <ul className="gap-field flex flex-col">
          {group.rules.map((node, index) => {
            const childPath = [...path, index];
            return isFilterGroup(node) ? (
              <li key={`group-${index}`}>
                <GroupEditor
                  root={root}
                  group={node}
                  path={childPath}
                  fields={fields}
                  labels={labels}
                  maxDepth={maxDepth}
                  errors={errors}
                  onChange={onChange}
                />
              </li>
            ) : (
              <li key={node.id}>
                <FilterBuilderRule
                  rule={node}
                  position={index + 1}
                  fields={fields}
                  labels={labels}
                  error={errors[node.id]}
                  onChange={(next) => onChange(updateRule(root, node.id, () => next))}
                  onRemove={() => onChange(removeNode(root, childPath))}
                />
              </li>
            );
          })}
        </ul>
      )}

      <div className="gap-field flex flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={firstField === undefined}
          onClick={() => {
            if (firstField !== undefined) {
              onChange(addNode(root, path, createRule(firstField)));
            }
          }}
          className="max-sm:min-h-11"
        >
          <PlusIcon />
          {labels.addRule}
        </Button>
        {depth < maxDepth ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(addNode(root, path, createGroup()))}
            className="max-sm:min-h-11"
          >
            <PlusIcon />
            {labels.addGroup}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Advanced filter editor: rules that compare a field with a value, joined by
 * And / Or, in groups that can nest. The condition list follows the field's
 * type (text, number, date, select, yes/no) and a value that no longer fits
 * is cleared when the field or condition changes. Controlled through `value`
 * and `onChange`; `onApply` is called with the filter once every rule is
 * valid. Match rows client-side with `evaluate` or send the filter to your
 * API with `toSearchParams` from the filter-builder-model files.
 *
 * Rules stack on phones and sit in one row from `sm`. Text values keep the
 * typed language's direction; numbers and dates are always Latin and
 * left-to-right.
 */
function FilterBuilder({
  fields,
  value,
  onChange,
  onApply,
  onReset,
  maxDepth = 3,
  labels: labelOverrides,
  className,
  'aria-label': ariaLabel,
  ...props
}: FilterBuilderProps) {
  const labels = useLabels(filterBuilderMessages, labelOverrides);
  const [attempted, setAttempted] = useState(false);
  const problems = validateGroup(value, fields);
  const problemCount = Object.keys(problems).length;
  const shownErrors = attempted ? problems : {};

  function apply() {
    if (problemCount > 0) {
      setAttempted(true);
      return;
    }
    setAttempted(false);
    onApply?.(value);
  }

  function reset() {
    setAttempted(false);
    onChange(createGroup());
    onReset?.();
  }

  return (
    <div
      role="group"
      data-slot="filter-builder"
      aria-label={ariaLabel ?? labels.title}
      className={cn('gap-row flex w-full flex-col', className)}
      {...props}
    >
      <GroupEditor
        root={value}
        group={value}
        path={[]}
        fields={fields}
        labels={labels}
        maxDepth={maxDepth}
        errors={shownErrors}
        onChange={onChange}
      />
      {attempted && problemCount > 0 ? (
        <p role="alert" className="text-b2 text-danger">
          {fillTemplate(labels.invalidSummary, { n: problemCount })}
        </p>
      ) : null}
      {onApply || onReset ? (
        <div className="gap-field flex flex-wrap justify-end">
          {onReset ? (
            <Button type="button" variant="outline" onClick={reset} className="max-sm:min-h-11">
              {labels.reset}
            </Button>
          ) : null}
          {onApply ? (
            <Button type="button" onClick={apply} className="max-sm:min-h-11">
              {labels.apply}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { FilterBuilder };
export type { FilterBuilderProps };
