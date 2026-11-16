import type { Control } from 'react-hook-form';
import {
  GOVERNORATES,
  LANGUAGES,
  ORG_TYPES,
  PLANS,
  labelOf,
  type Wizard01Labels,
  type Wizard01Values,
} from '@/components/blocks/wizard-01-model';
import { Button } from '@/components/ui/button';
import { DetailField, DetailGrid } from '@/components/ui/detail-field';
import { FormField } from '@/components/ui/form';
import {
  CheckboxField,
  ComboboxField,
  SelectField,
  SwitchField,
  TextField,
} from '@/components/ui/form-fields';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Locale } from '@/lib/locale';

interface Wizard01StepProps {
  /** Zero-based step: 0 account, 1 organisation, 2 plan, 3 review. */
  step: number;
  control: Control<Wizard01Values>;
  /** Current values, for the review summary. */
  values: Wizard01Values;
  labels: Wizard01Labels;
  locale: Locale;
  /** Review only: jump back to a step to change its answers. */
  onEdit: (step: number) => void;
}

function Latin({ value }: { value: string }) {
  return value === '' ? null : <span dir="ltr">{value}</span>;
}

function ReviewGroup({
  title,
  editLabel,
  onEdit,
  children,
}: {
  title: string;
  editLabel: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="gap-row flex flex-col">
      <div className="gap-field flex items-center justify-between">
        <h3 className="text-h5 text-text-primary">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${editLabel} ${title}`}
          onClick={onEdit}
        >
          {editLabel}
        </Button>
      </div>
      <DetailGrid className="lg:grid-cols-2">{children}</DetailGrid>
    </section>
  );
}

/**
 * The fields of one wizard step, or the review summary. Fields stay in the
 * parent's form, so answers survive moving between steps.
 */
function Wizard01Step({ step, control, values, labels, locale, onEdit }: Wizard01StepProps) {
  if (step === 0) {
    return (
      <>
        <TextField
          control={control}
          name="fullName"
          label={labels.fullName}
          autoComplete="name"
          required
        />
        <TextField
          control={control}
          name="email"
          label={labels.email}
          type="email"
          autoComplete="email"
          required
        />
        <TextField
          control={control}
          name="phone"
          label={labels.phone}
          description={labels.phoneHint}
          type="tel"
          kind="latin"
          autoComplete="tel"
          required
        />
      </>
    );
  }

  if (step === 1) {
    return (
      <>
        <TextField
          control={control}
          name="orgName"
          label={labels.orgName}
          autoComplete="organization"
          required
        />
        <SelectField
          control={control}
          name="orgType"
          label={labels.orgType}
          placeholder={labels.orgTypePlaceholder}
          options={ORG_TYPES[locale]}
          required
        />
        <ComboboxField
          control={control}
          name="governorate"
          label={labels.governorate}
          placeholder={labels.governoratePlaceholder}
          options={GOVERNORATES[locale]}
          required
        />
      </>
    );
  }

  if (step === 2) {
    return (
      <>
        <FormField
          control={control}
          name="plan"
          label={labels.plan}
          render={({ field }) => (
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              aria-label={labels.plan}
            >
              {PLANS[locale].map((plan) => (
                <RadioGroupItem
                  key={plan.value}
                  value={plan.value}
                  label={plan.label}
                  description={plan.description}
                />
              ))}
            </RadioGroup>
          )}
        />
        <SelectField
          control={control}
          name="language"
          label={labels.language}
          options={LANGUAGES[locale]}
        />
        <SwitchField
          control={control}
          name="newsletter"
          label={labels.newsletter}
          description={labels.newsletterDescription}
        />
      </>
    );
  }

  return (
    <>
      <ReviewGroup title={labels.accountStep} editLabel={labels.edit} onEdit={() => onEdit(0)}>
        <DetailField label={labels.fullName} value={values.fullName} />
        <DetailField label={labels.email} value={<Latin value={values.email} />} />
        <DetailField label={labels.phone} value={<Latin value={values.phone.trim()} />} />
      </ReviewGroup>
      <ReviewGroup title={labels.organisationStep} editLabel={labels.edit} onEdit={() => onEdit(1)}>
        <DetailField label={labels.orgName} value={values.orgName} />
        <DetailField label={labels.orgType} value={labelOf(ORG_TYPES[locale], values.orgType)} />
        <DetailField
          label={labels.governorate}
          value={labelOf(GOVERNORATES[locale], values.governorate)}
        />
      </ReviewGroup>
      <ReviewGroup title={labels.planStep} editLabel={labels.edit} onEdit={() => onEdit(2)}>
        <DetailField label={labels.plan} value={labelOf(PLANS[locale], values.plan)} />
        <DetailField label={labels.language} value={labelOf(LANGUAGES[locale], values.language)} />
        <DetailField label={labels.newsletter} value={values.newsletter ? labels.yes : labels.no} />
      </ReviewGroup>
      <CheckboxField control={control} name="terms" label={labels.terms} required />
    </>
  );
}

export { Wizard01Step };
export type { Wizard01StepProps };
