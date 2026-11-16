import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { RuleValue } from '@/components/ui/filter-builder-value';
import { TrashIcon } from '@/components/ui/icons';
import { Select } from '@/components/ui/select';
import {
  changeRuleField,
  changeRuleOperator,
  operatorsFor,
  type FilterField,
  type FilterOperator,
  type FilterRule,
} from '@/lib/filter-builder';
import {
  errorLabel,
  operatorLabel,
  type FilterBuilderLabelKey,
} from '@/lib/filter-builder-messages';
import type { FilterRuleError } from '@/lib/filter-builder-validate';
import { cn } from '@/lib/utils';

interface FilterBuilderRuleProps {
  rule: FilterRule;
  /** 1-based position among its siblings, for the group's accessible name. */
  position: number;
  fields: readonly FilterField[];
  labels: Record<FilterBuilderLabelKey, string>;
  /** Shown under the row when set. */
  error: FilterRuleError | undefined;
  onChange: (rule: FilterRule) => void;
  onRemove: () => void;
}

function isOperator(field: FilterField, value: string): FilterOperator | undefined {
  return operatorsFor(field.type).find((operator) => operator === value);
}

/**
 * One condition: field, operator and value editors in a row on wide screens,
 * stacked on phones, with the remove button last. Choosing another field or
 * operator resets a value that no longer fits (see `changeRuleField`).
 */
function FilterBuilderRule({
  rule,
  position,
  fields,
  labels,
  error,
  onChange,
  onRemove,
}: FilterBuilderRuleProps) {
  const errorId = useId();
  const field = fields.find((candidate) => candidate.id === rule.field);
  const invalid = error !== undefined;

  return (
    <div
      role="group"
      data-slot="filter-builder-rule"
      aria-label={`${labels.rule} ${position}`}
      aria-describedby={invalid ? errorId : undefined}
      className="gap-field flex flex-col"
    >
      <div className="gap-field flex flex-col sm:flex-row sm:items-start">
        <Select
          aria-label={labels.field}
          placeholder={labels.chooseField}
          options={fields.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
          value={field === undefined ? null : field.id}
          onValueChange={(next) => {
            const target = fields.find((candidate) => candidate.id === next);
            if (target !== undefined) {
              onChange(changeRuleField(rule, target, field));
            }
          }}
          className={cn('sm:w-48 sm:shrink-0', error === 'unknown_field' && 'border-danger')}
        />
        {field === undefined ? null : (
          <>
            <Select
              aria-label={labels.operator}
              options={operatorsFor(field.type).map((operator) => ({
                value: operator,
                label: operatorLabel(labels, operator),
              }))}
              value={rule.operator}
              onValueChange={(next) => {
                const operator = next === null ? undefined : isOperator(field, next);
                if (operator !== undefined) {
                  onChange(changeRuleOperator(rule, operator));
                }
              }}
              className={cn('sm:w-48 sm:shrink-0', error === 'invalid_operator' && 'border-danger')}
            />
            <div className="min-w-0 sm:flex-1">
              <RuleValue
                rule={rule}
                field={field}
                labels={labels}
                invalid={invalid}
                describedBy={invalid ? errorId : undefined}
                onChange={(value) => onChange({ ...rule, value })}
              />
            </div>
          </>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={labels.removeRule}
          onClick={onRemove}
          className="max-sm:size-11 max-sm:self-end sm:shrink-0"
        >
          <TrashIcon />
        </Button>
      </div>
      {invalid ? (
        <p id={errorId} data-slot="filter-builder-error" className="text-b3 text-danger">
          {errorLabel(labels, error)}
        </p>
      ) : null}
    </div>
  );
}

export { FilterBuilderRule };
export type { FilterBuilderRuleProps };
