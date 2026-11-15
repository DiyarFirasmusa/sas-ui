import { PRESETS, findPreset } from '@sas-ui/tokens/all-presets';
import { contrastRatio, resolveOver } from '@sas-ui/tokens/color';
import { checkPreset, contrastRules } from '@sas-ui/tokens/contrast-checks';
import { CORE_TOKEN_GROUPS, type CoreTokenName } from '@sas-ui/tokens/token-names';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useDocsSettings } from '../docs-settings';

function Swatch({ name, value }: { name: CoreTokenName; value: string }) {
  return (
    <li className="gap-inline border-stroke bg-surface flex items-center rounded-md border p-2">
      <span
        aria-hidden="true"
        className="border-stroke size-9 shrink-0 rounded-md border"
        style={{ background: `var(--${name})` }}
      />
      <span className="min-w-0">
        <span className="text-b3 text-text-primary block truncate font-semibold">{name}</span>
        <span dir="ltr" className="text-b3 text-text-muted block truncate font-mono">
          {value}
        </span>
      </span>
    </li>
  );
}

const RAMP = [
  'text-h1',
  'text-h2',
  'text-h3',
  'text-h4',
  'text-h5',
  'text-b1',
  'text-b2',
  'text-b3',
  'text-label',
  'text-kpi',
];
const SHADOWS = ['shadow-small', 'shadow-mid', 'shadow-large', 'shadow-xlarge'];
const RADII = [
  'rounded-sm',
  'rounded-md',
  'rounded-lg',
  'rounded-xl',
  'rounded-control',
  'rounded-modal',
  'rounded-pill',
];

export function TokensPage() {
  const { preset, mode } = useDocsSettings();
  const active = findPreset(preset) ?? PRESETS[0];
  const isDark =
    mode === 'dark' || (mode === 'system' && document.documentElement.classList.contains('dark'));
  const theme = active ? (isDark ? active.dark : active.light) : undefined;
  const violations = useMemo(() => (active ? checkPreset(active) : []), [active]);
  const rows = useMemo(() => {
    if (!theme) {
      return [];
    }
    const canvas = ['background', 'surface'] as const;
    return contrastRules()
      .filter(
        (rule) =>
          (canvas as readonly string[]).includes(rule.background) ||
          rule.reason !== 'text on canvas and surfaces',
      )
      .map((rule) => ({
        rule,
        ratio: contrastRatio(
          resolveOver(theme[rule.foreground], theme[rule.background]),
          theme[rule.background],
        ),
      }));
  }, [theme]);

  if (!active || !theme) {
    return null;
  }
  return (
    <article className="gap-card mx-auto flex max-w-5xl flex-col">
      <header className="gap-field flex flex-col">
        <h1 className="text-h1">Tokens & presets</h1>
        <p className="text-b1 text-text-secondary">
          Showing <strong>{active.label.en}</strong> in {isDark ? 'dark' : 'light'}. Every value
          below is a CSS variable; components never contain colours.
        </p>
        <div className="gap-field flex flex-wrap items-center">
          <Badge tone={violations.length === 0 ? 'green' : 'red'}>
            {violations.length === 0
              ? 'WCAG AA: all pairs pass (light + dark)'
              : `${violations.length} contrast failures`}
          </Badge>
          <Badge tone="neutral">radius {active.radius}</Badge>
        </div>
      </header>

      {Object.entries(CORE_TOKEN_GROUPS).map(([group, names]) => (
        <section key={group} className="gap-field flex flex-col">
          <h2 className="text-h4 capitalize">{group}</h2>
          <ul className="gap-field grid sm:grid-cols-2 lg:grid-cols-3">
            {names.map((name) => (
              <Swatch key={name} name={name} value={theme[name]} />
            ))}
          </ul>
        </section>
      ))}

      <section className="gap-field flex flex-col">
        <h2 className="text-h4">Type ramp</h2>
        <div className="border-stroke bg-surface p-row flex flex-col gap-2 rounded-lg border">
          {RAMP.map((className) => (
            <p key={className} className={className}>
              <span
                dir="ltr"
                className="me-inline text-b3 text-text-muted inline-block w-24 font-mono"
              >
                {className}
              </span>
              Sample text · نص تجريبي 1234
            </p>
          ))}
        </div>
      </section>

      <section className="gap-field flex flex-col">
        <h2 className="text-h4">Radii & elevation</h2>
        <div className="gap-row border-stroke bg-surface p-row flex flex-wrap rounded-lg border">
          {RADII.map((className) => (
            <div
              key={className}
              className={`border-stroke-strong bg-primary-tint text-b3 grid size-20 place-items-center border ${className}`}
            >
              {className.replace('rounded-', '')}
            </div>
          ))}
          {SHADOWS.map((className) => (
            <div
              key={className}
              className={`bg-surface text-b3 grid size-20 place-items-center rounded-lg ${className}`}
            >
              {className.replace('shadow-', '')}
            </div>
          ))}
        </div>
      </section>

      <section className="gap-field flex flex-col">
        <h2 className="text-h4">Contrast ({isDark ? 'dark' : 'light'})</h2>
        <div className="border-stroke bg-surface overflow-x-auto rounded-lg border">
          <table className="text-b2 w-full">
            <thead>
              <tr className="border-stroke text-text-muted border-b text-start">
                <th className="p-2">Text</th>
                <th className="p-2">On</th>
                <th className="p-2">Ratio</th>
                <th className="p-2">Needs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ rule, ratio }) => (
                <tr
                  key={`${rule.foreground}-${rule.background}`}
                  className="border-stroke-subtle border-b"
                >
                  <td className="p-2 font-mono">{rule.foreground}</td>
                  <td className="p-2 font-mono">{rule.background}</td>
                  <td className="p-2 tabular-nums" dir="ltr">
                    {ratio.toFixed(2)}:1
                  </td>
                  <td className="p-2">
                    <Badge tone={ratio >= rule.minimum ? 'green' : 'red'}>{rule.minimum}:1</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  );
}
