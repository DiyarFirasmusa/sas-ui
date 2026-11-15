import { Component, Suspense, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { exampleSource, findItem, loadExamples } from '../catalog';
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
        <p role="alert" className="rounded-md bg-tag-red-container p-inline text-b2 text-tag-red">
          This example crashed: {this.state.failed.message}
        </p>
      );
    }
    return this.props.children;
  }
}

function ExampleCard({ example }: { example: Example }) {
  return (
    <section className="flex flex-col gap-field">
      <div>
        <h3 className="text-h5 text-text-primary">{example.title}</h3>
        {example.description ? <p className="text-b3 text-text-secondary">{example.description}</p> : null}
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
    <article className="mx-auto flex max-w-4xl flex-col gap-card">
      <header className="flex flex-col gap-field">
        <div className="flex flex-wrap items-center gap-field">
          <h1 className="text-h1 text-text-primary">{item.title}</h1>
          <Badge tone="primary">{item.category}</Badge>
          {item.tier === 'extra' ? <Badge tone="orange">extra</Badge> : null}
        </div>
        <p className="text-b1 text-text-secondary">{item.description}</p>
        <pre dir="ltr" className="overflow-x-auto rounded-lg border border-stroke bg-surface-dim p-inline font-mono text-b2">
          <code>{`npx sas-ui add ${item.name}`}</code>
        </pre>
        <p dir="ltr" className="text-b3 text-text-muted">
          {item.files.join(' · ')}
        </p>
      </header>

      <Suspense fallback={null}>
        {examples === null ? <p className="text-b2 text-text-muted">Loading examples…</p> : null}
        {examples !== null && examples.length === 0 ? (
          <p className="text-b2 text-text-muted">No live examples yet for this item.</p>
        ) : null}
        {examples?.map((example) => <ExampleCard key={example.title} example={example} />)}
      </Suspense>

      {source ? (
        <section className="flex flex-col gap-field">
          <Button variant="outline" className="self-start" aria-expanded={showSource} onClick={() => setShowSource((open) => !open)}>
            {showSource ? 'Hide example source' : 'Show example source'}
          </Button>
          {showSource ? (
            <pre dir="ltr" className="max-h-128 overflow-auto rounded-lg border border-stroke bg-surface-dim p-inline font-mono text-b3">
              <code>{source}</code>
            </pre>
          ) : null}
        </section>
      ) : null}
    </article>
  );
}
