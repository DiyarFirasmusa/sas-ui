import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  exampleSource,
  findItem,
  items,
  isComponent,
  loadExamples,
  loadRegistrySource,
} from '../catalog';
import { CodeBlock } from '../code-block';
import { useDocsSettings } from '../docs-settings';
import { ExampleCard } from '../example-card';
import type { Example } from '../example-types';
import { localizeItem } from '../i18n/localize-item';
import { categoryTitle, useT } from '../i18n/use-t';

function ManualFiles({ files }: { files: string[] }) {
  const t = useT();
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
      <p className="text-b2 text-text-secondary">
        {files.length === 1 ? t('component.manualOne') : t('component.manualMany')}
      </p>
      {files.map((file) => (
        <details key={file} className="border-stroke bg-surface rounded-lg border">
          <summary dir="ltr" className="p-inline text-b2 cursor-pointer font-mono">
            {file}
          </summary>
          <CodeBlock code={sources[file] ?? t('common.loading')} maxHeight className="p-1" />
        </details>
      ))}
    </div>
  );
}

/** A component page in the shadcn layout: title + actions, install tabs, usage, examples. */
export function ComponentPage({ name }: { name: string }) {
  const { locale } = useDocsSettings();
  const t = useT();
  const found = findItem(name);
  const item = found ? localizeItem(found, locale) : undefined;
  const [examples, setExamples] = useState<Example[] | null>(null);

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

  const siblings = useMemo(
    () =>
      items
        .filter((entry) => (found ? isComponent(entry) === isComponent(found) : true))
        .map((entry) => localizeItem(entry, locale)),
    [found, locale],
  );
  if (!item) {
    return <p className="text-b1">{t('component.notFound', { name })}</p>;
  }
  const index = siblings.findIndex((entry) => entry.name === item.name);
  const previous = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 ? siblings[index + 1] : undefined;
  const source = exampleSource(name);

  return (
    <article className="gap-card flex min-w-0 flex-col">
      <header className="gap-field flex flex-col">
        <p className="text-b3 text-text-muted">
          <a href="#/components" className="hover:text-text-primary">
            {t('nav.components')}
          </a>
          {' / '}
          {categoryTitle(t, item.category)}
        </p>
        <div className="gap-field flex flex-wrap items-start justify-between">
          <div className="gap-field flex flex-wrap items-center">
            <h1 dir="auto" className="text-h1 text-text-primary">
              {item.title}
            </h1>
            {item.tier === 'extra' ? <Badge tone="orange">{t('component.extraDeps')}</Badge> : null}
          </div>
          <div className="flex gap-1">
            {previous ? (
              <Button
                variant="outline"
                size="icon"
                aria-label={t('component.previous', { title: previous.title })}
                render={<a href={`#/components/${previous.name}`} />}
                nativeButton={false}
              >
                <ArrowLeftIcon />
              </Button>
            ) : null}
            {next ? (
              <Button
                variant="outline"
                size="icon"
                aria-label={t('component.next', { title: next.title })}
                render={<a href={`#/components/${next.name}`} />}
                nativeButton={false}
              >
                <ArrowRightIcon />
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-b1 text-text-secondary">{item.description}</p>
      </header>

      {examples !== null && examples[0] ? (
        <ExampleCard example={examples[0]} source={source} />
      ) : null}

      <section className="gap-field flex flex-col">
        <h2 id="installation" className="text-h3 scroll-mt-24">
          {t('component.installation')}
        </h2>
        <Tabs defaultValue="cli" variant="underline">
          <TabsList>
            <TabsTrigger value="cli">CLI</TabsTrigger>
            <TabsTrigger value="manual">{t('component.manual')}</TabsTrigger>
          </TabsList>
          <TabsContent value="cli" className="mt-field">
            <CodeBlock code={`npx sas-ui add ${item.name}`} />
          </TabsContent>
          <TabsContent value="manual" className="mt-field">
            <ManualFiles files={item.files} />
          </TabsContent>
        </Tabs>
      </section>

      {examples === null ? (
        <p className="text-b2 text-text-muted">{t('component.loadingExamples')}</p>
      ) : null}
      {examples !== null && examples.length > 1 ? (
        <section className="gap-card flex flex-col">
          <h2 id="examples" className="text-h3 scroll-mt-24">
            {t('component.examples')}
          </h2>
          {examples.slice(1).map((example) => (
            <ExampleCard key={example.title} example={example} source={source} />
          ))}
        </section>
      ) : null}
      {examples !== null && examples.length === 0 && !isComponent(item) ? (
        <section className="gap-field flex flex-col">
          <h2 id="source" className="text-h3 scroll-mt-24">
            {t('component.source')}
          </h2>
          <p className="text-b2 text-text-secondary">{t('component.helperNote')}</p>
          <ManualFiles files={item.files} />
        </section>
      ) : null}
    </article>
  );
}
