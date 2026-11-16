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
import { useDocsSettings } from '../docs-settings';
import { localizeItem } from '../i18n/localize-item';
import { DOC_TITLE_KEYS, type MessageKey } from '../i18n/messages';
import { allLocales, useT } from '../i18n/use-t';
import { DOC_SLUGS } from '../use-hash-route';

const PAGES: readonly [MessageKey, string][] = [
  ['nav.components', '#/components'],
  ['nav.blocks', '#/blocks'],
  ['nav.charts', '#/charts'],
  ['nav.themes', '#/themes'],
  ['nav.tokens', '#/tokens'],
];

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
  const { locale } = useDocsSettings();
  const t = useT();
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
  // What is shown follows the language; what is matched covers both, so Arabic
  // and English queries find the same entries.
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={t('search.title')}>
      <CommandInput placeholder={t('search.placeholder')} />
      <CommandList>
        <CommandEmpty />
        <CommandGroup heading={t('search.pages')}>
          {PAGES.map(([label, hash]) => (
            <CommandItem
              key={hash}
              value={`page ${allLocales(label)}`}
              onSelect={() => choose(hash)}
            >
              {t(label)}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t('search.docs')}>
          {DOC_SLUGS.map((slug) => (
            <CommandItem
              key={slug}
              value={`docs ${slug} ${allLocales(DOC_TITLE_KEYS[slug])}`}
              onSelect={() => choose(`#/docs/${slug}`)}
            >
              {t(DOC_TITLE_KEYS[slug])}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading={t('search.components')}>
          {components.map((item) => {
            const arabic = localizeItem(item, 'ar');
            return (
              <CommandItem
                key={item.name}
                value={`component ${item.title} ${arabic.title} ${item.name}`}
                keywords={[item.description, arabic.description]}
                onSelect={() => choose(`#/components/${item.name}`)}
              >
                {localizeItem(item, locale).title}
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandGroup heading={t('search.blocks')}>
          {blocks.map((block) => {
            const arabic = localizeItem(block, 'ar');
            return (
              <CommandItem
                key={block.name}
                value={`block ${block.title} ${arabic.title} ${block.name}`}
                keywords={[block.description, arabic.description]}
                onSelect={() => choose(`#/blocks/${block.name}`)}
              >
                {localizeItem(block, locale).title}
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
