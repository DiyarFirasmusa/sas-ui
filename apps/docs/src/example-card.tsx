import { Component, useId, type ErrorInfo, type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CodeBlock } from './code-block';
import type { Example } from './example-types';
import { useT } from './i18n/use-t';

function Crashed({ message }: { message: string }) {
  const t = useT();
  return (
    <p role="alert" className="bg-tag-red-container p-inline text-b2 text-tag-red rounded-md">
      {t('example.crashed', { message })}
    </p>
  );
}

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
      return <Crashed message={this.state.failed.message} />;
    }
    return this.props.children;
  }
}

/**
 * The source of one example out of an examples file: from the `{` that holds
 * its `title` to the matching closing brace. Falls back to the whole file when
 * the layout is not the expected two-space array-of-objects shape.
 */
export function exampleSnippet(source: string | undefined, title: string): string | undefined {
  if (!source) {
    return undefined;
  }
  const titleAt = source.search(
    new RegExp(`title:\\s*['"\`]${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`),
  );
  if (titleAt === -1) {
    return source;
  }
  const start = source.lastIndexOf('\n  {', titleAt);
  const endMatch = /\n {2}\},?\n/.exec(source.slice(titleAt));
  if (start === -1 || !endMatch) {
    return source;
  }
  const end = titleAt + endMatch.index + endMatch[0].length;
  return source
    .slice(start + 1, end)
    .split('\n')
    .map((line) => line.replace(/^ {2}/, ''))
    .join('\n')
    .trimEnd();
}

/** shadcn-style example: a bordered preview with Preview / Code tabs underneath its title. */
export function ExampleCard({ example, source }: { example: Example; source?: string }) {
  const id = useId();
  const t = useT();
  const slug = example.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const snippet = exampleSnippet(source, example.title);
  return (
    <section className="gap-field flex flex-col" aria-labelledby={`${id}-title`}>
      <div>
        <h3 id={slug || id} className="text-h4 text-text-primary scroll-mt-24">
          <span id={`${id}-title`}>{example.title}</span>
        </h3>
        {example.description ? (
          <p className="text-b2 text-text-secondary">{example.description}</p>
        ) : null}
      </div>
      <Tabs defaultValue="preview" variant="pill">
        <TabsList>
          <TabsTrigger value="preview">{t('example.preview')}</TabsTrigger>
          <TabsTrigger value="code" disabled={!snippet}>
            {t('example.code')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-field">
          <div
            className={cn(
              'rounded-xl border border-stroke bg-surface p-card',
              example.wide ? 'overflow-x-auto' : 'flex min-h-40 flex-wrap items-start gap-inline',
            )}
          >
            <ExampleBoundary>{example.render()}</ExampleBoundary>
          </div>
        </TabsContent>
        <TabsContent value="code" className="mt-field">
          {snippet ? <CodeBlock code={snippet} maxHeight /> : null}
        </TabsContent>
      </Tabs>
    </section>
  );
}
