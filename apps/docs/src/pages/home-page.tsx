import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { blocks, items } from '../catalog';
import { CommandChip } from '../code-block';

const FEATURES = [
  [
    'Right-to-left first',
    'Logical CSS only, mirrored icons, Arabic labels, Latin digits, Hijri calendar and Arabic search.',
  ],
  [
    'Open code',
    'Components are copied into your project. Read them, change them, diff them against the registry.',
  ],
  [
    'Themes as data',
    'Four presets, about 78 tokens each, WCAG AA checked in light and dark, switchable at runtime.',
  ],
  [
    'Built for ERP',
    'Virtualised data table, filter builder, status bar, tree picker, wizards and approvals.',
  ],
  ['Accessible', 'Base UI primitives; every component has a Testing Library and axe test.'],
  ['One CLI', 'init, add, diff, list and theme — with dependency resolution and your own aliases.'],
] as const;

/** Landing page: headline, two calls to action, a live block and the feature grid. */
export function HomePage() {
  const components = items.filter((item) => item.type === 'ui').length;
  return (
    <div className="gap-card mx-auto flex max-w-6xl flex-col">
      <header className="gap-row py-page flex flex-col items-center text-center">
        <a
          href="#/blocks"
          className="rounded-pill bg-hover-row px-inline text-b3 text-text-secondary hover:text-text-primary py-1"
        >
          {blocks.length} blocks and Hijri calendar are in →
        </a>
        <h1 className="text-text-primary font-heading max-w-3xl text-[2.25rem] leading-tight font-bold text-balance md:text-[3.25rem]">
          The component library for Arabic-first dashboards
        </h1>
        <p className="text-b1 text-text-secondary md:text-h4 max-w-2xl md:font-normal">
          Accessible, themeable, right-to-left components and whole pages. Open source — copy it
          into your app and own the code.
        </p>
        <div className="gap-field flex flex-wrap justify-center">
          <Button size="lg" render={<a href="#/docs/installation" />} nativeButton={false}>
            Get started
          </Button>
          <Button size="lg" variant="outline" render={<a href="#/blocks" />} nativeButton={false}>
            Browse blocks
          </Button>
        </div>
        <CommandChip command="npx sas-ui init --preset wine-lapis" />
        <div className="gap-field text-b2 text-text-muted flex flex-wrap justify-center">
          <Badge tone="primary">{components} components</Badge>
          <Badge tone="purple">{blocks.length} blocks</Badge>
          <Badge tone="green">4 presets</Badge>
          <Badge tone="blue">RTL · LTR</Badge>
        </div>
      </header>

      <div className="border-stroke bg-surface-dim shadow-large overflow-hidden rounded-2xl border p-2">
        <iframe
          title="Dashboard block preview"
          src="#/preview/dashboard-01"
          loading="lazy"
          className="border-stroke bg-background block h-[640px] w-full rounded-xl border"
        />
      </div>

      <section className="gap-row pt-card grid sm:grid-cols-2 lg:grid-cols-3" aria-label="Features">
        {FEATURES.map(([title, text]) => (
          <div
            key={title}
            className="border-stroke bg-surface p-row flex flex-col gap-1 rounded-xl border"
          >
            <h2 className="text-h5 text-text-primary">{title}</h2>
            <p className="text-b2 text-text-secondary">{text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
