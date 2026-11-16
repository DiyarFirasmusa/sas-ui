import { Component, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { exampleSource, findItem, isComponent, loadExamples, loadRegistrySource } from '../catalog';
import type { Example } from '../example-types';

class ExampleBoundary extends Component<{ children: ReactNode }, { failed: Error | null }> {
  state = { failed: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { failed: error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Example failed to render', error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <p role="alert" className="bg-tag-red-container p-inline text-b2 text-tag-red rounded-md">
          This example crashed: {this.state.failed.message}
        </p>
      );
    }
    return this.props.children;
  }
}

function ExampleCard({ example }: { example: Example }) {
  return (
    <section className="gap-field flex flex-col">
      <div>
        <h3 className="text-h5 text-text-primary">{example.title}</h3>
        {example.description ? (
          <p className="text-b3 text-text-secondary">{example.description}</p>
        ) : null}
      </div>
      <div
        className={cn(
          'rounded-lg border border-stroke bg-surface p-card',
          example.wide ? 'overflow-x-auto' : 'flex flex-wrap items-start gap-inline',
        )}
      >
        <ExampleBoundary>{example.render()}</ExampleBoundary>
      </div>
    </section>
  );
}

function HelperSources({ files }: { files: string[] }) {
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
      <p className="text-b2 text-text-secondary">
        This is a helper, not a visual component, so there is no live demo. It is copied
        automatically when a component needs it.
      </p>
      {files.map((file) => (
        <details
          key={file}
          className="border-stroke bg-surface rounded-lg border"
          open={files.length === 1}
        >
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

export function ComponentPage({ name }: { name: string }) {
  const item = findItem(name);
  const [examples, setExamples] = useState<Example[] | null>(null);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadExamples(name).then((module) => {
      if (!cancelled) {
        setExamples(module?.examples ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (!item) {
    return <p className="text-b1">No component called “{name}”.</p>;
  }
  const source = exampleSource(name);
  return (
    <article className="gap-card mx-auto flex max-w-4xl flex-col">
      <header className="gap-field flex flex-col">
        <div className="gap-field flex flex-wrap items-center">
          <h1 dir="auto" className="text-h1 text-text-primary">
            {item.title}
          </h1>
          <Badge tone="primary">{item.category}</Badge>
          {item.tier === 'extra' ? <Badge tone="orange">extra</Badge> : null}
        </div>
        <p className="text-b1 text-text-secondary">{item.description}</p>
        <pre
          dir="ltr"
          className="border-stroke bg-surface-dim p-inline text-b2 overflow-x-auto rounded-lg border font-mono"
        >
          <code>{`npx sas-ui add ${item.name}`}</code>
        </pre>
        <p dir="ltr" className="text-b3 text-text-muted">
          {item.files.join(' · ')}
        </p>
      </header>

      <Suspense fallback={null}>
        {examples === null ? <p className="text-b2 text-text-muted">Loading examples…</p> : null}
        {examples !== null && examples.length === 0 && !isComponent(item) ? (
          <HelperSources files={item.files} />
        ) : null}
        {examples !== null && examples.length === 0 && isComponent(item) ? (
          <p className="text-b2 text-text-muted">No live examples yet for this component.</p>
        ) : null}
        {examples?.map((example) => (
          <ExampleCard key={example.title} example={example} />
        ))}
      </Suspense>

      {source ? (
        <section className="gap-field flex flex-col">
          <Button
            variant="outline"
            className="self-start"
            aria-expanded={showSource}
            onClick={() => setShowSource((open) => !open)}
          >
            {showSource ? 'Hide example source' : 'Show example source'}
          </Button>
          {showSource ? (
            <pre
              dir="ltr"
              className="border-stroke bg-surface-dim p-inline text-b3 max-h-128 overflow-auto rounded-lg border font-mono"
            >
              <code>{source}</code>
            </pre>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
