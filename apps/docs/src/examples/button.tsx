import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import type { Example } from '../example-types';

/** One design system, drawn by scoping a preset to a subtree (`data-preset-scope`). */
function System({ preset, title }: { preset: 'inventory' | 'hr'; title: string }) {
  return (
    <div
      data-preset-scope={preset}
      className="rounded-modal border-stroke bg-background p-card text-text-primary border"
    >
      <p className="mb-row text-label text-text-secondary">{title}</p>
      <div className="gap-inline flex flex-wrap items-center">
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>
          <PlusIcon /> Add item
        </Button>
        <Button size="lg">Large</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="outline-primary">Outline primary</Button>
        <Button variant="destructive-soft">Soft delete</Button>
        <Button size="icon" aria-label="Add" variant="outline">
          <PlusIcon />
        </Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Geometry: compact and comfortable',
    description:
      'The same component under two presets. Heights, padding, radius and label type come from geometry tokens: 38px / 16px / 10px / 600 13px in the compact system (inventory, tourism), 44px / 20px / 12px / 500 16px in the comfortable one (hr).',
    wide: true,
    render: () => (
      <div className="gap-row grid w-full">
        <System
          preset="inventory"
          title="Compact (inventory, tourism): 38px, lg 44, sm 32, xs 28"
        />
        <System preset="hr" title="Comfortable (hr): 44px, lg 52, sm 40, xs 32" />
      </div>
    ),
  },
  {
    title: 'Variants',
    render: () => (
      <>
        <Button>Save</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="outline-primary">Outline primary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="destructive-soft">Soft delete</Button>
        <Button variant="navy">Navy</Button>
        <Button variant="link">Link</Button>
      </>
    ),
  },
  {
    title: 'Sizes and icons',
    render: () => (
      <>
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button>
          <PlusIcon /> Add item
        </Button>
        <Button size="lg">Large</Button>
        <Button size="pill">Pill</Button>
        <Button size="pill" variant="navy">
          Navy pill
        </Button>
        <Button size="icon" aria-label="Add" variant="outline">
          <PlusIcon />
        </Button>
        <Button size="icon-xs" aria-label="Remove" variant="outline">
          <TrashIcon />
        </Button>
        <Button size="icon-sm" aria-label="Delete" variant="destructive-soft">
          <TrashIcon />
        </Button>
        <Button size="icon-lg" aria-label="Add more" variant="navy">
          <PlusIcon />
        </Button>
      </>
    ),
  },
  {
    title: 'States',
    description: 'Loading keeps focus and blocks a second click (single-flight).',
    render: () => (
      <>
        <Button loading>Saving</Button>
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>
          Disabled outline
        </Button>
        <Button variant="destructive-soft" disabled>
          Disabled soft delete
        </Button>
      </>
    ),
  },
  {
    title: 'As a link',
    description: 'asChild renders your own link (or a router Link) with the button styling.',
    render: () => (
      <>
        <Button asChild variant="outline">
          <a href="#/components/button">Anchor as a button</a>
        </Button>
        <Button asChild variant="link" size="lg">
          <a href="#/components/button">Link variant (no box at any size)</a>
        </Button>
      </>
    ),
  },
];
