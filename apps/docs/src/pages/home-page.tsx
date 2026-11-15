import { Badge } from '@/components/ui/badge';
import { PRESETS } from '@sas-ui/tokens/all-presets';
import { items } from '../catalog';
import { useDocsSettings } from '../docs-settings';

function Code({ children }: { children: string }) {
  return (
    <pre dir="ltr" className="overflow-x-auto rounded-lg border border-stroke bg-surface-dim p-inline font-mono text-b2 text-text-primary">
      <code>{children}</code>
    </pre>
  );
}

export function HomePage() {
  const { preset, setPreset } = useDocsSettings();
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-card">
      <header className="flex flex-col gap-field">
        <h1 className="text-h1 text-text-primary">SAS UI</h1>
        <p className="text-b1 text-text-secondary">
          An own-the-code React component library: Base UI primitives, Tailwind v4, tokens-first theming and Arabic RTL as a
          first-class direction. Components are copied into your project as plain source, so you can read and change every line.
        </p>
        <div className="flex flex-wrap gap-field">
          <Badge tone="primary">{items.length} registry items</Badge>
          <Badge tone="green">{PRESETS.length} presets</Badge>
          <Badge tone="blue">Light · Dark</Badge>
          <Badge tone="purple">RTL · LTR</Badge>
        </div>
      </header>

      <section className="flex flex-col gap-field">
        <h2 className="text-h3">Start</h2>
        <Code>{`npx sas-ui init --preset wine-lapis --all-presets
npx sas-ui add button input select dialog
npx sas-ui diff            # what changed vs the registry
npx sas-ui theme set hr    # switch palette`}</Code>
        <p className="text-b2 text-text-secondary">
          Needs a Vite + React 19 + TypeScript + Tailwind v4 project. <code dir="ltr">init</code> writes the token CSS, the
          alias setup and <code dir="ltr">cn()</code>; <code dir="ltr">add</code> copies components with their dependencies.
        </p>
      </section>

      <section className="flex flex-col gap-field">
        <h2 className="text-h3">Presets</h2>
        <p className="text-b2 text-text-secondary">Switch at runtime from the toolbar, or click one:</p>
        <ul className="grid gap-field sm:grid-cols-2">
          {PRESETS.map((entry) => (
            <li key={entry.name}>
              <button
                type="button"
                onClick={() => setPreset(entry.name)}
                aria-pressed={entry.name === preset}
                className="flex w-full flex-col gap-1 rounded-lg border border-stroke bg-surface p-inline text-start hover:bg-hover-row aria-pressed:border-primary-highlight aria-pressed:bg-primary-tint"
              >
                <span className="text-h5">
                  {entry.label.en} <span className="text-text-muted">· {entry.label.ar}</span>
                </span>
                <span className="text-b3 text-text-secondary">{entry.description}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
