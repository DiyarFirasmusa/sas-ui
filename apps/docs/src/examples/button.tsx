import { Button } from '@/components/ui/button';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import type { Example } from '../example-types';

export const examples: Example[] = [
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
        <Button size="icon" aria-label="Add" variant="outline">
          <PlusIcon />
        </Button>
        <Button size="icon-sm" aria-label="Delete" variant="destructive-soft">
          <TrashIcon />
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
      </>
    ),
  },
  {
    title: 'As a link',
    render: () => (
      <a
        href="#/components/button"
        className="rounded-control bg-primary px-row text-button-1 text-primary-foreground inline-flex h-9.5 items-center"
      >
        Link styled as a button
      </a>
    ),
  },
];
