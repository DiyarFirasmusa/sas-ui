import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { blocks, findItem, loadRegistrySource } from '../catalog';

const WIDTHS = [
  { id: 'desktop', label: 'Desktop', width: '100%' },
  { id: 'tablet', label: 'Tablet', width: '768px' },
  { id: 'mobile', label: 'Mobile', width: '390px' },
] as const;

function SourceFiles({ files }: { files: string[] }) {
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
    <section className="gap-field flex flex-col">
      <h2 className="text-h4">Source</h2>
      {files.map((file) => (
        <details key={file} className="border-stroke bg-surface rounded-lg border">
          <summary dir="ltr" className="p-inline text-b2 cursor-pointer font-mono">
            {file}
          </summary>
          <pre
            dir="ltr"
            className="border-stroke bg-surface-dim p-inline text-b3 max-h-128 overflow-auto border-t font-mono"
          >
            <code>{sources[file] ?? 'Loading…'}</code>
          </pre>
        </details>
      ))}
    </section>
  );
}

/** A block in a real iframe: media queries (sm:, lg:) react to the frame width, like a browser would. */
export function BlockPage({ name }: { name: string }) {
  const item = findItem(name);
  const [width, setWidth] = useState<(typeof WIDTHS)[number]['id']>('desktop');
  if (!item) {
    return <p className="text-b1">No block called “{name}”.</p>;
  }
  const frame = WIDTHS.find((entry) => entry.id === width) ?? WIDTHS[0];
  return (
    <article className="gap-card mx-auto flex max-w-6xl flex-col">
      <header className="gap-field flex flex-col">
        <div className="gap-field flex flex-wrap items-center">
          <h1 dir="auto" className="text-h1 text-text-primary">
            {item.title}
          </h1>
          <Badge tone="purple">block</Badge>
        </div>
        <p className="text-b1 text-text-secondary">{item.description}</p>
        <pre
          dir="ltr"
          className="border-stroke bg-surface-dim p-inline text-b2 overflow-x-auto rounded-lg border font-mono"
        >
          <code>{`npx sas-ui add ${item.name}`}</code>
        </pre>
      </header>

      <div className="gap-field flex flex-wrap items-center">
        {WIDTHS.map((entry) => (
          <Button
            key={entry.id}
            size="sm"
            variant={width === entry.id ? 'default' : 'outline'}
            aria-pressed={width === entry.id}
            onClick={() => setWidth(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
        <a
          href={`#/preview/${item.name}`}
          target="_blank"
          rel="noreferrer"
          className="text-b2 text-primary-text ms-auto underline-offset-4 hover:underline"
        >
          Open in a new tab
        </a>
      </div>

      <div className="border-stroke bg-surface-dim overflow-x-auto rounded-xl border p-2">
        <iframe
          title={`${item.title} preview`}
          src={`#/preview/${item.name}`}
          style={{ width: frame.width }}
          className={cn(
            'mx-auto block h-[720px] max-w-full rounded-lg border border-stroke bg-background',
          )}
        />
      </div>

      <SourceFiles files={item.files} />
    </article>
  );
}

export function BlocksPage() {
  return (
    <article className="gap-card mx-auto flex max-w-5xl flex-col">
      <header className="gap-field flex flex-col">
        <h1 className="text-h1">Blocks</h1>
        <p className="text-b1 text-text-secondary">
          Whole pages and sections built from the components: sign-in, dashboards, list, detail and
          form pages, error pages. Install one and edit it — blocks are ordinary source files in
          your project.
        </p>
        <pre
          dir="ltr"
          className="border-stroke bg-surface-dim p-inline text-b2 overflow-x-auto rounded-lg border font-mono"
        >
          <code>npx sas-ui add login-01 dashboard-01</code>
        </pre>
      </header>
      {blocks.length === 0 ? <p className="text-b2 text-text-muted">No blocks yet.</p> : null}
      <ul className="gap-row grid sm:grid-cols-2">
        {blocks.map((block) => (
          <li key={block.name}>
            <a
              href={`#/blocks/${block.name}`}
              className="border-stroke bg-surface p-row hover:bg-hover-row flex h-full flex-col gap-1 rounded-lg border"
            >
              <span dir="auto" className="text-h5 text-text-primary">
                {block.title}
              </span>
              <span className="text-b3 text-text-secondary">{block.description}</span>
              <span dir="ltr" className="mt-field text-b3 text-text-muted font-mono">
                {block.name}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}
