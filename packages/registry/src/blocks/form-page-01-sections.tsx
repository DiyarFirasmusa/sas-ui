import type { ReactNode } from 'react';
import type { Control } from 'react-hook-form';
import {
  GOVERNORATES,
  MAX_FILE_SIZE,
  type FormPage01Labels,
  type FormPage01Values,
} from '@/components/blocks/form-page-01-model';
import { Card, CardContent } from '@/components/ui/card';
import {
  ComboboxField,
  DateField,
  FileField,
  TextareaField,
  TextField,
} from '@/components/ui/form-fields';
import {
  BuildingIcon,
  CalendarIcon,
  FileIcon,
  InboxIcon,
  PencilIcon,
  UserIcon,
} from '@/components/ui/icons';
import { SectionTitle } from '@/components/ui/section-title';
import type { Locale } from '@/lib/locale';

interface FormPage01SectionsProps {
  control: Control<FormPage01Values>;
  labels: FormPage01Labels;
  locale: Locale;
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="gap-row flex flex-col">
        <SectionTitle icon={icon} title={title} description={description} />
        <div className="gap-row grid sm:grid-cols-2">{children}</div>
      </CardContent>
    </Card>
  );
}

/**
 * The six sections of the long form. Each field is bound through `control`, so
 * the page owns validation and submission and this file is only layout: move
 * a field between sections, or delete a section, without touching the logic.
 */
function FormPage01Sections({ control, labels, locale }: FormPage01SectionsProps) {
  return (
    <>
      <Section
        icon={<UserIcon />}
        title={labels.identityTitle}
        description={labels.identityDescription}
      >
        <TextField control={control} name="fullName" label={labels.fullName} required />
        <TextField
          control={control}
          name="nationalId"
          label={labels.nationalId}
          description={labels.nationalIdHint}
          kind="latin"
          inputMode="numeric"
          maxLength={12}
          required
        />
      </Section>

      <Section
        icon={<InboxIcon />}
        title={labels.contactTitle}
        description={labels.contactDescription}
      >
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
      </Section>

      <Section
        icon={<BuildingIcon />}
        title={labels.addressTitle}
        description={labels.addressDescription}
      >
        <ComboboxField
          control={control}
          name="governorate"
          label={labels.governorate}
          placeholder={labels.governoratePlaceholder}
          options={GOVERNORATES[locale]}
          required
        />
        <TextField
          control={control}
          name="addressLine"
          label={labels.addressLine}
          autoComplete="street-address"
          required
        />
      </Section>

      <Section
        icon={<CalendarIcon />}
        title={labels.datesTitle}
        description={labels.datesDescription}
      >
        <DateField control={control} name="birthDate" label={labels.birthDate} required />
        <DateField control={control} name="startDate" label={labels.startDate} required />
        <DateField control={control} name="endDate" label={labels.endDate} clearable />
      </Section>

      <Card>
        <CardContent className="gap-row flex flex-col">
          <SectionTitle
            icon={<FileIcon />}
            title={labels.attachmentsTitle}
            description={labels.attachmentsDescription}
          />
          <FileField
            control={control}
            name="attachments"
            label={labels.attachments}
            accept=".pdf,image/*"
            maxSize={MAX_FILE_SIZE}
            maxFiles={5}
            multiple
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="gap-row flex flex-col">
          <SectionTitle
            icon={<PencilIcon />}
            title={labels.notesTitle}
            description={labels.notesDescription}
          />
          <TextareaField
            control={control}
            name="notes"
            label={labels.notes}
            placeholder={labels.notesPlaceholder}
            rows={4}
          />
        </CardContent>
      </Card>
    </>
  );
}

export { FormPage01Sections };
export type { FormPage01SectionsProps };
