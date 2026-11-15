import { useId } from 'react';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { DateRangeValue, FilterDefinition, NumberRangeValue } from '@/lib/filter-state';

interface FilterFieldLabels {
  any: string;
  yes: string;
  no: string;
  min: string;
  max: string;
  from: string;
  to: string;
}

interface FilterFieldProps {
  definition: FilterDefinition;
  /** The draft value as the user has edited it so far; any shape, it is checked here. */
  value: unknown;
  onChange: (value: unknown) => void;
  labels: FilterFieldLabels;
}

const labelClasses = 'text-label text-text-secondary';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asRange(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : {};
}

function rangeText(value: unknown): string {
  return typeof value === 'number' || typeof value === 'string' ? String(value) : '';
}

/** Two native inputs under one group label, used for number and date ranges. */
function RangeField({
  definition,
  value,
  onChange,
  type,
  startKey,
  endKey,
  startLabel,
  endLabel,
}: {
  definition: FilterDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  type: 'number' | 'date';
  startKey: 'min' | 'from';
  endKey: 'max' | 'to';
  startLabel: string;
  endLabel: string;
}) {
  const range = asRange(value);
  const update = (key: string, next: string) => {
    const merged = { ...range, [key]: next };
    onChange(merged);
  };
  const limits = definition.type === 'number-range' ? { min: definition.min, max: definition.max } : {};
  return (
    <fieldset data-slot="filter-range" className="flex min-w-0 flex-col gap-field">
      <legend className={labelClasses}>{definition.label}</legend>
      <div className="grid grid-cols-2 gap-field">
        <Field label={startLabel}>
          <Input
            kind="latin"
            type={type}
            inputMode={type === 'number' ? 'decimal' : undefined}
            {...limits}
            value={rangeText(range[startKey])}
            onChange={(event) => update(startKey, event.target.value)}
          />
        </Field>
        <Field label={endLabel}>
          <Input
            kind="latin"
            type={type}
            inputMode={type === 'number' ? 'decimal' : undefined}
            {...limits}
            value={rangeText(range[endKey])}
            onChange={(event) => update(endKey, event.target.value)}
          />
        </Field>
      </div>
    </fieldset>
  );
}

/**
 * One control for one filter definition. Dates and numbers are native inputs
 * (always left-to-right, Latin digits for the value) so the bar works without
 * a calendar component; swap them for your own date picker if you have one.
 */
function FilterField({ definition, value, onChange, labels }: FilterFieldProps) {
  const choiceLabelId = useId();

  switch (definition.type) {
    case 'text':
      return (
        <Field label={definition.label}>
          <Input
            value={asString(value)}
            placeholder={definition.placeholder}
            onChange={(event) => onChange(event.target.value)}
          />
        </Field>
      );
    case 'select':
    case 'boolean': {
      const options =
        definition.type === 'select'
          ? [{ value: '', label: labels.any }, ...definition.options]
          : [
              { value: '', label: labels.any },
              { value: 'true', label: labels.yes },
              { value: 'false', label: labels.no },
            ];
      const current = definition.type === 'boolean' && typeof value === 'boolean' ? String(value) : asString(value);
      return (
        <div className="flex min-w-0 flex-col gap-field">
          <span id={choiceLabelId} className={labelClasses}>
            {definition.label}
          </span>
          <Select
            aria-label={definition.label}
            value={current}
            options={options}
            onValueChange={(next) => {
              if (definition.type === 'boolean') {
                onChange(next === 'true' ? true : next === 'false' ? false : undefined);
              } else {
                onChange(next ?? '');
              }
            }}
          />
        </div>
      );
    }
    case 'multi-select': {
      const selected = asStringList(value);
      return (
        <fieldset data-slot="filter-multi-select" className="flex min-w-0 flex-col gap-field">
          <legend className={labelClasses}>{definition.label}</legend>
          <div className="flex max-h-40 flex-col overflow-y-auto">
            {definition.options.map((option) => (
              <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-field rounded-md px-field text-b1 hover:bg-hover-row sm:min-h-9">
                <input
                  type="checkbox"
                  className="size-4 shrink-0 cursor-pointer accent-primary"
                  checked={selected.includes(option.value)}
                  onChange={(event) =>
                    onChange(
                      event.target.checked
                        ? [...selected, option.value]
                        : selected.filter((item) => item !== option.value),
                    )
                  }
                />
                <span className="min-w-0 truncate">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    case 'date':
      return (
        <Field label={definition.label}>
          <Input kind="latin" type="date" value={asString(value)} onChange={(event) => onChange(event.target.value)} />
        </Field>
      );
    case 'number-range':
      return (
        <RangeField
          definition={definition}
          value={value satisfies NumberRangeValue | unknown}
          onChange={onChange}
          type="number"
          startKey="min"
          endKey="max"
          startLabel={labels.min}
          endLabel={labels.max}
        />
      );
    case 'date-range':
      return (
        <RangeField
          definition={definition}
          value={value satisfies DateRangeValue | unknown}
          onChange={onChange}
          type="date"
          startKey="from"
          endKey="to"
          startLabel={labels.from}
          endLabel={labels.to}
        />
      );
  }
}

export { FilterField };
export type { FilterFieldLabels, FilterFieldProps };
