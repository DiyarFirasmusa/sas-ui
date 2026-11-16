import { useEffect } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { blocks, items } from '../catalog';
import { DOC_SLUGS } from '../use-hash-route';

function go(hash: string) {
  window.location.hash = hash;
}

/** ⌘K / Ctrl+K palette over every page, doc, component and block. */
export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  function choose(hash: string) {
    onOpenChange(false);
    go(hash);
  }
  const components = items.filter((item) => item.type === 'ui');
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search documentation">
      <CommandInput placeholder="Search components, blocks and docs…" />
      <CommandList>
        <CommandEmpty />
        <CommandGroup heading="Pages">
          {[
            ['Components', '#/components'],
            ['Blocks', '#/blocks'],
            ['Charts', '#/charts'],
            ['Themes', '#/themes'],
            ['Tokens', '#/tokens'],
          ].map(([label, hash]) => (
            <CommandItem key={hash} value={`page ${label}`} onSelect={() => choose(hash ?? '#/')}>
              {label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Docs">
          {DOC_SLUGS.map((slug) => (
            <CommandItem
              key={slug}
              value={`docs ${slug}`}
              onSelect={() => choose(`#/docs/${slug}`)}
            >
              <span className="capitalize">{slug}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Components">
          {components.map((item) => (
            <CommandItem
              key={item.name}
              value={`component ${item.title} ${item.name}`}
              keywords={[item.description]}
              onSelect={() => choose(`#/components/${item.name}`)}
            >
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Blocks">
          {blocks.map((block) => (
            <CommandItem
              key={block.name}
              value={`block ${block.title} ${block.name}`}
              onSelect={() => choose(`#/blocks/${block.name}`)}
            >
              {block.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
