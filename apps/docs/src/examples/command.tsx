import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { FileIcon, SettingsIcon, UserIcon } from '@/components/ui/icons';
import { Kbd } from '@/components/ui/kbd';
import type { Example } from '../example-types';

function Items({ onSelect }: { onSelect?: (value: string) => void }) {
  return (
    <CommandList>
      <CommandEmpty />
      <CommandGroup heading="Documents">
        <CommandItem onSelect={onSelect} shortcut={['Ctrl', 'N']}>
          <FileIcon />
          New document
        </CommandItem>
        <CommandItem onSelect={onSelect} shortcut={['Ctrl', 'O']}>
          <FileIcon />
          Open document
        </CommandItem>
        <CommandItem onSelect={onSelect} disabled>
          <FileIcon />
          Export (unavailable)
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Account">
        <CommandItem onSelect={onSelect} keywords={['profile', 'me']}>
          <UserIcon />
          Your account
        </CommandItem>
        <CommandItem
          onSelect={onSelect}
          keywords={['preferences', 'options']}
          shortcut={['Ctrl', ',']}
        >
          <SettingsIcon />
          Settings
        </CommandItem>
      </CommandGroup>
    </CommandList>
  );
}

function PaletteDialog() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open palette <Kbd keys={['Ctrl', 'K']} />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput />
        <Items onSelect={() => setOpen(false)} />
      </CommandDialog>
    </>
  );
}

export const examples: Example[] = [
  {
    title: 'Dialog',
    description:
      'Open with the button or Ctrl/Cmd+K. Arrow keys move, Home/End jump, Enter selects, Escape closes.',
    render: () => <PaletteDialog />,
  },
  {
    title: 'Inline',
    render: () => (
      <Command className="border-stroke w-96 rounded-lg border">
        <CommandInput />
        <Items />
      </Command>
    ),
  },
  {
    title: 'Custom filter',
    description: 'Only matches at the start of an item, ranked by your own score.',
    render: () => (
      <Command
        className="border-stroke w-96 rounded-lg border"
        filter={(value, search) => (value.toLowerCase().startsWith(search.toLowerCase()) ? 1 : 0)}
      >
        <CommandInput />
        <Items />
      </Command>
    ),
  },
  {
    title: 'Arabic (RTL)',
    description: 'Search ignores diacritics and alef variants.',
    render: () => (
      <div dir="rtl">
        <Command className="border-stroke w-96 rounded-lg border">
          <CommandInput />
          <CommandList>
            <CommandEmpty />
            <CommandGroup heading="المستندات">
              <CommandItem shortcut={['Ctrl', 'N']}>
                <FileIcon />
                إنشاء مستند
              </CommandItem>
              <CommandItem>
                <FileIcon />
                فتح مستند
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="الحساب">
              <CommandItem>
                <SettingsIcon />
                الإعدادات
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    ),
  },
];
