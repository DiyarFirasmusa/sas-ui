import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '../code-block';
import type { MessageKey } from '../i18n/messages';
import { useT } from '../i18n/use-t';
import { ChartAreaBlock } from './charts-demos';

const KINDS = [
  { id: 'area', label: 'charts.area', block: 'chart-area-01' },
  { id: 'bar', label: 'charts.bar', block: 'chart-bar-01' },
  { id: 'line', label: 'charts.line', block: 'chart-line-01' },
  { id: 'pie', label: 'charts.pie', block: 'chart-pie-01' },
] as const satisfies readonly { id: string; label: MessageKey; block: string }[];

/** Charts gallery: hero, a tab per chart type, the live card and its install command. */
export function ChartsPage() {
  const t = useT();
  const [kind, setKind] = useState<string>('area');
  return (
    <div className="gap-card mx-auto flex max-w-5xl flex-col">
      <header className="gap-field py-card flex flex-col items-center text-center">
        <h1 className="text-h1 text-text-primary text-balance md:text-[2.75rem] md:leading-tight">
          {t('charts.title')}
        </h1>
        <p className="text-b1 text-text-secondary max-w-2xl">{t('charts.subtitle')}</p>
      </header>
      <Tabs value={kind} onValueChange={setKind} variant="underline">
        <TabsList aria-label={t('charts.typesLabel')}>
          {KINDS.map((entry) => (
            <TabsTrigger key={entry.id} value={entry.id}>
              {t(entry.label)}
            </TabsTrigger>
          ))}
        </TabsList>
        {KINDS.map((entry) => (
          <TabsContent key={entry.id} value={entry.id} className="mt-card gap-field flex flex-col">
            <ChartAreaBlock kind={entry.id} />
            <CodeBlock code={`npx sas-ui add ${entry.block}`} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
