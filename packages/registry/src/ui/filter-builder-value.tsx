import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { NumberInput } from '@/components/ui/number-input';
import { Select } from '@/components/ui/select';
import {
  isDateRange,
  isNumberRange,
  isStringList,
  valueKind,
  type FilterField,
  type FilterRule,
  type FilterValue,
} from '@/lib/filter-builder';
import type { FilterBuilderLabelKey } from '@/lib/filter-builder-messages';
import { cn } from '@/lib/utils';

interface RuleValueProps {
  rule: FilterRule;
  field: FilterField;
  labels: Record<FilterBuilderLabelKey, string>;
  invalid: boolean;
  /** Id of the element holding the error text. */
  describedBy: string | undefined;
  onChange: (value: FilterValue) => void;
}

function asText(value: FilterValue): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: FilterValue): number | null {
  return typeof value === 'number' ? value : null;
}

/**
 * The editor for a rule's value, picked by what its operator compares with.
 * Numbers go through `NumberInput` (Latin digits, steppers), dates through
 * the native date input, options through `Select` / `MultiSelect`. Operators
 * that need no value (is empty, is true) render nothing.
 */
function RuleValue({ rule, field, labels, invalid, describedBy, onChange }: RuleValueProps) {
  const { value } = rule;
  const aria = { 'aria-invalid': invalid || undefined, 'aria-describedby': describedBy };
  const options = (field.options ?? []).map((option) => ({
    value: option.value,
    label: option.label,
  }));

  switch (valueKind(rule.operator)) {
    case 'none':
      return null;
    case 'text':
      return (
        <Input
          aria-label={labels.value}
          value={asText(value)}
          onChange={(event) => onChange(event.target.value)}
          {...aria}
        />
      );
    case 'number':
      return (
        <NumberInput
          aria-label={labels.value}
          aria-invalid={invalid}
          value={asNumber(value)}
          onValueChange={(next) => onChange(next)}
        />
      );
    case 'days':
      return (
        <div className="gap-field flex items-center">
          <NumberInput
            aria-label={labels.value}
            aria-invalid={invalid}
            min={0}
            step={1}
            format={{ maximumFractionDigits: 0 }}
            value={asNumber(value)}
            onValueChange={(next) => onChange(next)}
            className="min-w-0 flex-1"
          />
          <span className="text-b1 text-text-secondary">{labels.days}</span>
        </div>
      );
    case 'date':
      return (
        <Input
          kind="latin"
          type="date"
          aria-label={labels.value}
          value={asText(value)}
          onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
          {...aria}
        />
      );
    case 'range':
      return field.type === 'number' ? (
        <div className="gap-field grid grid-cols-2">
          {(['from', 'to'] as const).map((end) => {
            const range = isNumberRange(value) ? value : { from: null, to: null };
            return (
              <NumberInput
                key={end}
                aria-label={labels[end]}
                aria-invalid={invalid}
                value={range[end]}
                onValueChange={(next) => onChange({ ...range, [end]: next })}
              />
            );
          })}
        </div>
      ) : (
        <div className="gap-field grid grid-cols-2">
          {(['from', 'to'] as const).map((end) => {
            const range = isDateRange(value) ? value : { from: null, to: null };
            return (
              <Input
                key={end}
                kind="latin"
                type="date"
                aria-label={labels[end]}
                value={range[end] ?? ''}
                onChange={(event) =>
                  onChange({
                    ...range,
                    [end]: event.target.value === '' ? null : event.target.value,
                  })
                }
                {...aria}
              />
            );
          })}
        </div>
      );
    case 'option':
      return (
        <Select
          aria-label={labels.value}
          placeholder={labels.choose}
          options={options}
          value={typeof value === 'string' && value !== '' ? value : null}
          onValueChange={(next) => onChange(next)}
          className={cn(invalid && 'border-danger')}
        />
      );
    case 'options':
      return (
        <MultiSelect
          aria-label={labels.value}
          aria-invalid={invalid}
          placeholder={labels.choose}
          options={options}
          value={isStringList(value) ? value : []}
          onValueChange={(next) => onChange(next)}
        />
      );
  }
}

export { RuleValue };
export type { RuleValueProps };
