import type { ReactNode } from 'react';
import { CodeBlock } from '../code-block';
import type { DocSlug } from '../use-hash-route';

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-card border-stroke-subtle text-h3 text-text-primary scroll-mt-24 border-b pb-2"
    >
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-b1 text-text-secondary leading-7">{children}</p>;
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code dir="ltr" className="bg-kbd text-b2 text-text-primary rounded px-1.5 py-0.5 font-mono">
      {children}
    </code>
  );
}

function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="text-b1 text-text-secondary flex list-disc flex-col gap-1.5 ps-6">{children}</ul>
  );
}

export interface DocPage {
  title: string;
  description: string;
  body: ReactNode;
}

export const DOCS: Record<DocSlug, DocPage> = {
  introduction: {
    title: 'Introduction',
    description:
      'An own-the-code React component library for dashboards that are right-to-left first.',
    body: (
      <>
        <P>
          SAS UI is not a package you install and import from. It is a set of components, blocks and
          design tokens you copy into your project as plain TypeScript, then own: read every line,
          change what you need, keep your own version. The idea is the same as shadcn/ui; the
          audience is back-office dashboards in Arabic and English.
        </P>
        <H2 id="principles">Principles</H2>
        <Ul>
          <li>
            <strong>Open code.</strong> No runtime dependency on SAS UI. <Code>sas-ui diff</Code>{' '}
            shows how your copy drifted from the registry.
          </li>
          <li>
            <strong>Accessible primitives.</strong> Behaviour comes from Base UI; every component
            ships with a Testing Library + axe test.
          </li>
          <li>
            <strong>RTL first.</strong> Logical CSS only (enforced by a test), mirrored icons,
            inputs that follow the typed language, Latin digits by default, Hijri calendar, Arabic
            search normalisation.
          </li>
          <li>
            <strong>Theme as data.</strong> About 78 colour tokens, four presets, WCAG AA checked in
            light and dark.
          </li>
          <li>
            <strong>Wider than the basics.</strong> Data table with virtualisation, filter builder,
            tree picker, status bar, date pickers, charts, rich text, app shell and 16 page blocks.
          </li>
        </Ul>
        <H2 id="what-is-inside">What is inside</H2>
        <Ul>
          <li>
            <a className="text-primary-text hover:underline" href="#/components">
              Components
            </a>{' '}
            — forms, overlays, navigation, data, feedback.
          </li>
          <li>
            <a className="text-primary-text hover:underline" href="#/blocks">
              Blocks
            </a>{' '}
            — whole pages: sign-in, shells, dashboard, list, detail, wizard, settings.
          </li>
          <li>
            <a className="text-primary-text hover:underline" href="#/charts">
              Charts
            </a>{' '}
            — Recharts cards that read right-to-left.
          </li>
          <li>
            <a className="text-primary-text hover:underline" href="#/themes">
              Themes
            </a>{' '}
            — presets you can switch at runtime or install by CLI.
          </li>
        </Ul>
      </>
    ),
  },
  installation: {
    title: 'Installation',
    description: 'Set up a Vite + React 19 + Tailwind v4 project in two commands.',
    body: (
      <>
        <H2 id="requirements">Requirements</H2>
        <Ul>
          <li>
            React 19, TypeScript, Vite 7+ and Tailwind CSS v4 (CSS-first,{' '}
            <Code>@import &apos;tailwindcss&apos;</Code>).
          </li>
          <li>Node 20.19 or newer.</li>
        </Ul>
        <H2 id="init">Initialise</H2>
        <P>
          Run <Code>init</Code> in your project. It finds your Tailwind entry stylesheet, writes the
          token CSS and a<Code> sas-ui.json</Code>, configures the <Code>@/</Code> alias in tsconfig
          and Vite, and adds <Code>cn()</Code>.
        </P>
        <CodeBlock code={'npx sas-ui init --preset wine-lapis --all-presets'} />
        <H2 id="add">Add components</H2>
        <CodeBlock
          code={
            'npx sas-ui add button input select dialog data-table\nnpx sas-ui add dashboard-01 list-page-01'
          }
        />
        <P>
          Dependencies between components are resolved for you, in install order, and the npm
          packages they need are installed with your package manager.
        </P>
        <H2 id="html">Set language and theme</H2>
        <CodeBlock code={'<html lang="ar" dir="rtl" data-preset="wine-lapis" class="dark">'} />
        <P>
          <Code>data-preset</Code> picks the palette (all-presets mode), the <Code>dark</Code> class
          picks the mode. Base UI reads direction from its own provider: wrap your app in{' '}
          <Code>LocaleProvider</Code> (or the theme provider) so popups and arrow keys mirror
          correctly.
        </P>
        <H2 id="manual">Manual installation</H2>
        <P>
          Every component page has a Manual tab with its files. Copy them, keep the{' '}
          <Code>@/components/ui</Code>, <Code>@/lib</Code> and <Code>@/hooks</Code> aliases (or
          change the imports), install the listed packages.
        </P>
      </>
    ),
  },
  theming: {
    title: 'Theming',
    description: 'A token contract, four presets, and runtime switching.',
    body: (
      <>
        <P>
          A preset is data: a light and a dark map of about 78 tokens. The generator turns it into
          CSS variables and a Tailwind <Code>@theme inline</Code> mapping, so utilities such as{' '}
          <Code>bg-surface</Code>, <Code>text-text-muted</Code> and <Code>border-stroke</Code> read
          live variables — switching needs no rebuild.
        </P>
        <H2 id="presets">Presets</H2>
        <Ul>
          <li>
            <Code>neutral</Code> — zinc greys, the default.
          </li>
          <li>
            <Code>wine-lapis</Code> — burgundy and lapis navy with gold.
          </li>
          <li>
            <Code>inventory</Code> — warm burgundy on charcoal.
          </li>
          <li>
            <Code>hr</Code> — plum with gold and a deep plum sidebar.
          </li>
        </Ul>
        <P>
          See them side by side on the{' '}
          <a className="text-primary-text hover:underline" href="#/themes">
            Themes
          </a>{' '}
          page, and every token on the{' '}
          <a className="text-primary-text hover:underline" href="#/tokens">
            Tokens
          </a>{' '}
          page.
        </P>
        <H2 id="switching">Switching</H2>
        <CodeBlock
          code={`import { applyPreset, applyMode, applyDirection } from '@sas-ui/tokens/apply-preset';

applyPreset('inventory');   // <html data-preset="inventory">
applyMode('dark');          // <html class="dark">
applyDirection('rtl', 'ar'); // <html dir="rtl" lang="ar">`}
        />
        <H2 id="cli">By CLI</H2>
        <CodeBlock code={'npx sas-ui theme list\nnpx sas-ui theme set hr'} />
        <H2 id="contrast">Contrast</H2>
        <P>
          Every shipped preset is tested: all text on canvas and surfaces at 4.5:1, text on fills
          and tints, tag text on its own container, sidebar pairs, and the focus ring at 3:1 — in
          light and dark.
        </P>
      </>
    ),
  },
  cli: {
    title: 'CLI',
    description: 'init, add, diff, list and theme.',
    body: (
      <>
        <H2 id="init">init</H2>
        <CodeBlock
          code={
            'sas-ui init [--preset <name>] [--all-presets] [--css <file>] [--src-dir src] [--alias @]\n          [--force] [--no-install] [--no-alias-setup]'
          }
        />
        <H2 id="add">add</H2>
        <CodeBlock
          code={'sas-ui add <item...> [--all] [--overwrite] [--tests] [--dry-run] [--no-install]'}
        />
        <P>
          Copies each item and what it depends on. A file you changed is never overwritten without{' '}
          <Code>--overwrite</Code>. <Code>--tests</Code> also copies the Vitest tests and the test
          utilities.
        </P>
        <H2 id="diff">diff</H2>
        <CodeBlock code={'sas-ui diff [item...] [--verbose]'} />
        <P>
          Compares your copy with the registry (imports rewritten to your aliases first, so only
          real edits show) and exits with 1 when something differs.
        </P>
        <H2 id="upstream">upstream</H2>
        <CodeBlock
          code={'sas-ui upstream <item...> --to <library>/packages/registry/src [--dry-run]'}
        />
        <P>
          Sends a component you improved in your project back to a checkout of the library, with
          your aliases turned back into the registry&apos;s, so the improvement can be reviewed and
          committed there.
        </P>
        <H2 id="list">list</H2>
        <CodeBlock code={'sas-ui list [--category <name>] [--installed] [--json]'} />
        <H2 id="theme">theme</H2>
        <CodeBlock code={'sas-ui theme list\nsas-ui theme set <preset> [--all-presets]'} />
        <H2 id="registry">Registry location</H2>
        <P>
          By default the registry bundled with the CLI is used (offline, reproducible). Point
          elsewhere with <Code>--registry &lt;dir|url&gt;</Code> or <Code>SAS_UI_REGISTRY</Code>.
        </P>
      </>
    ),
  },
  rtl: {
    title: 'RTL & Arabic',
    description: 'What "right-to-left first" means in practice.',
    body: (
      <>
        <H2 id="layout">Logical layout</H2>
        <P>
          Components use logical utilities only — <Code>ps-*</Code>, <Code>me-*</Code>,{' '}
          <Code>start-*</Code>, <Code>text-start</Code>, <Code>border-s</Code>. A registry test
          fails on <Code>ml-</Code>, <Code>pr-</Code>, <Code>left-</Code> and friends, so a
          direction bug cannot ship.
        </P>
        <H2 id="direction">Direction and Base UI</H2>
        <P>
          Base UI reads direction from its own provider, not from <Code>&lt;html dir&gt;</Code>.{' '}
          <Code>LocaleProvider</Code> sets it for every component, so slider thumbs, menu sub-arrows
          and keyboard navigation mirror.
        </P>
        <H2 id="text">Text and numbers</H2>
        <Ul>
          <li>
            Free-text inputs follow the typed language; emails, codes and phone numbers stay
            left-to-right.
          </li>
          <li>
            Numbers are Latin digits by default; pass <Code>numerals=&quot;locale&quot;</Code> for
            Arabic-Indic.
          </li>
          <li>
            <Code>arabic-normalize</Code> makes search ignore diacritics, alef/ya forms and digit
            styles.
          </li>
        </Ul>
        <H2 id="calendars">Calendars</H2>
        <P>
          Calendar and the date pickers support Gregorian, Hijri (Umm al-Qura and civil) and a small
          secondary calendar under each day. Values stay Gregorian ISO strings, so forms and
          backends do not change.
        </P>
        <H2 id="tables">Tables and charts</H2>
        <P>
          The first column sits at the start, numeric columns align to the end with tabular figures,
          the data grid maps arrow keys to logical direction, and chart axes mirror.
        </P>
      </>
    ),
  },
  migration: {
    title: 'Migration',
    description: 'Moving an existing dashboard to SAS UI.',
    body: (
      <>
        <P>
          The three SAS dashboards share their token names and primitive APIs with this library, so
          most of the work is deleting a local file, running <Code>sas-ui add</Code> and fixing
          imports.
        </P>
        <H2 id="steps">Steps</H2>
        <Ul>
          <li>
            <Code>sas-ui init --preset …</Code>, then delete the app&apos;s own{' '}
            <Code>tokens-colors.css</Code> and <Code>@theme</Code> block once it builds.
          </li>
          <li>
            Replace <Code>src/components/ui/*</Code> file by file with <Code>sas-ui add</Code>.
          </li>
          <li>
            Keep react-hook-form field adapters; use <Code>form-fields</Code> for the same prop
            names.
          </li>
          <li>
            Replace tables and filters with <Code>data-table</Code>, <Code>filter-bar</Code> and{' '}
            <Code>filter-builder</Code>.
          </li>
          <li>
            Run <Code>sas-ui diff</Code> and your own tests after every step.
          </li>
        </Ul>
        <P>
          The full mapping of each existing component lives in <Code>docs/MIGRATION.md</Code> in the
          repository.
        </P>
      </>
    ),
  },
};
