import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodeBlock } from '../code-block';
import { ChartAreaBlock } from './charts-demos';

const KINDS = [
  { id: 'area', label: 'Area', block: 'chart-area-01' },
  { id: 'bar', label: 'Bar', block: 'chart-bar-01' },
  { id: 'line', label: 'Line', block: 'chart-line-01' },
  { id: 'pie', label: 'Pie / Donut', block: 'chart-pie-01' },
] as const;

/** Charts gallery: hero, a tab per chart type, the live card and its install command. */
export function ChartsPage() {
  const [kind, setKind] = useState<string>('area');
  return (
    <div className="gap-card mx-auto flex max-w-5xl flex-col">
      <header className="gap-field py-card flex flex-col items-center text-center">
        <h1 className="text-h1 text-text-primary text-balance md:text-[2.75rem] md:leading-tight">
          Charts that read right-to-left
        </h1>
        <p className="text-b1 text-text-secondary max-w-2xl">
          Recharts cards with token colours, Latin digits, accessible summaries and mirrored axes
          for Arabic. Copy and paste into your app.
        </p>
      </header>
      <Tabs value={kind} onValueChange={setKind} variant="underline">
        <TabsList aria-label="Chart types">
          {KINDS.map((entry) => (
            <TabsTrigger key={entry.id} value={entry.id}>
              {entry.label}
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
