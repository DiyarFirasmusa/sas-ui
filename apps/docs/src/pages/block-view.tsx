import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ItemManifest } from '../../../../packages/registry/registry/schema';
import { loadRegistrySource } from '../catalog';
import { CodeBlock, CommandChip } from '../code-block';

const WIDTHS = [
  { id: 'desktop', label: 'Desktop', width: '100%' },
  { id: 'tablet', label: 'Tablet', width: '768px' },
  { id: 'mobile', label: 'Mobile', width: '390px' },
] as const;

function SourceTabs({ files }: { files: string[] }) {
  const [sources, setSources] = useState<Record<string, string>>({});
  useEffect(() => {
    let cancelled = false;
    Promise.all(files.map(async (file) => [file, await loadRegistrySource(file)] as const)).then(
      (entries) => {
        if (!cancelled) {
          setSources(
            Object.fromEntries(
              entries.flatMap(([file, source]) => (source === undefined ? [] : [[file, source]])),
            ),
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [files]);
  return (
    <div className="gap-field flex flex-col">
      {files.map((file) => (
        <details
          key={file}
          className="border-stroke bg-surface rounded-lg border"
          open={files.length === 1}
        >
          <summary dir="ltr" className="p-inline text-b2 cursor-pointer font-mono">
            {file}
          </summary>
          <CodeBlock code={sources[file] ?? 'Loading…'} maxHeight className="p-1" />
        </details>
      ))}
    </div>
  );
}

/**
 * One block as shadcn shows it: a toolbar (Preview / Code, viewport sizes, the
 * install command) over a real iframe, so media queries react to the frame width.
 */
export function BlockView({ block, height = 640 }: { block: ItemManifest; height?: number }) {
  const [width, setWidth] = useState<(typeof WIDTHS)[number]['id']>('desktop');
  const frame = WIDTHS.find((entry) => entry.id === width) ?? WIDTHS[0];
  return (
    <section id={block.name} className="gap-field flex scroll-mt-24 flex-col">
      <Tabs defaultValue="preview" variant="pill">
        <div className="gap-field flex flex-wrap items-center">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <a
            href={`#/blocks/${block.name}`}
            dir="auto"
            className="text-b1 text-text-primary hover:underline"
          >
            {block.title}
          </a>
          <div className="gap-field ms-auto flex flex-wrap items-center">
            <div className="flex gap-1 max-md:hidden" role="group" aria-label="Preview width">
              {WIDTHS.map((entry) => (
                <Button
                  key={entry.id}
                  size="sm"
                  variant={width === entry.id ? 'secondary' : 'ghost'}
                  aria-pressed={width === entry.id}
                  onClick={() => setWidth(entry.id)}
                >
                  {entry.label}
                </Button>
              ))}
            </div>
            <CommandChip command={`npx sas-ui add ${block.name}`} />
            <a
              href={`#/preview/${block.name}`}
              target="_blank"
              rel="noreferrer"
              className="text-b2 text-primary-text underline-offset-4 hover:underline"
            >
              Open
            </a>
          </div>
        </div>
        <p className="text-b2 text-text-secondary">{block.description}</p>
        <TabsContent value="preview" className="mt-field">
          <div className="border-stroke bg-surface-dim overflow-x-auto rounded-xl border p-2">
            <iframe
              title={`${block.title} preview`}
              src={`#/preview/${block.name}`}
              loading="lazy"
              style={{ width: frame.width, height }}
              className={cn(
                'mx-auto block max-w-full rounded-lg border border-stroke bg-background',
              )}
            />
          </div>
        </TabsContent>
        <TabsContent value="code" className="mt-field">
          <SourceTabs files={block.files} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
