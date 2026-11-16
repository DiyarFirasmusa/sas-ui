import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { Example } from '../example-types';

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
];

/** One design system, drawn by scoping a preset to a subtree (`data-preset-scope`). */
function System({ preset, title }: { preset: 'inventory' | 'hr'; title: string }) {
  return (
    <div
      data-preset-scope={preset}
      className="gap-row rounded-modal border-stroke bg-background p-card text-text-primary grid border"
    >
      <p className="text-label text-text-secondary">{title}</p>
      <Input aria-label="Name" placeholder="Input" />
      <Input aria-label="Name with a value" defaultValue="With a value" />
      <Input aria-label="Invalid" aria-invalid defaultValue="Invalid" />
      <Input aria-label="Disabled" disabled defaultValue="Disabled" />
      <Select aria-label="Status" placeholder="Select" options={statuses} />
      <Textarea aria-label="Notes" placeholder="Textarea" />
      <label className="gap-field text-control-input flex items-center">
        <Checkbox defaultChecked /> Checkbox
      </label>
      <Switch label="Switch" defaultChecked />
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Geometry: compact and comfortable',
    description:
      'Inputs, selects and textareas under two presets: 42px tall, 10px radius, 13px text in the compact system (inventory, tourism); 44px, 12px, 14px in the comfortable one (hr). Hover darkens the stroke, focus draws the highlight border and a 3px glow, invalid swaps both to danger.',
    wide: true,
    render: () => (
      <div className="gap-row grid w-full md:grid-cols-2">
        <System preset="inventory" title="Compact (inventory, tourism)" />
        <System preset="hr" title="Comfortable (hr)" />
      </div>
    ),
  },
  {
    title: 'Direction follows the typed language',
    description:
      'Empty: the UI direction. Type Arabic or English: it switches to dir=auto. Latin-only fields stay left-to-right.',
    render: () => (
      <div className="gap-row grid w-full max-w-md">
        <Input aria-label="Title" placeholder="Title" />
        <Input aria-label="Reference" kind="latin" placeholder="TB-2026-0001" />
        <Input aria-label="Email" type="email" placeholder="name@company.com" />
        <Input aria-label="Disabled" disabled defaultValue="Disabled" />
        <Input aria-label="Invalid" aria-invalid defaultValue="Invalid value" />
      </div>
    ),
  },
  {
    title: 'Sizes',
    description:
      'The default is the preset input height (42px compact). size="sm" is 2px shorter (a toolbar or table cell), size="lg" is as tall as a large button (44px compact).',
    render: () => (
      <div className="gap-row grid w-full max-w-md">
        <Input aria-label="Small size" size="sm" placeholder="Small (40px)" />
        <Input aria-label="Default size" placeholder="Default (42px)" />
        <Input aria-label="Large size" size="lg" placeholder="Large (44px)" />
      </div>
    ),
  },
  {
    title: 'Fixed direction',
    description:
      'autoDirection={false} keeps the UI direction even when the typed language differs.',
    render: () => (
      <div className="gap-row grid w-full max-w-md">
        <Input aria-label="Fixed direction" autoDirection={false} defaultValue="Fixed" />
      </div>
    ),
  },
];
