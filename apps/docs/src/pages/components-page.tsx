import { CATEGORY_ORDER, items } from '../catalog';

const CATEGORY_TITLES: Record<string, string> = {
  foundation: 'Foundation',
  form: 'Forms',
  overlay: 'Overlays',
  navigation: 'Navigation',
  data: 'Data',
  feedback: 'Feedback',
  display: 'Display',
  layout: 'Layout',
};

/** Index of every component, grouped, like shadcn's /docs/components. */
export function ComponentsPage() {
  const components = items.filter((item) => item.type === 'ui');
  return (
    <div className="gap-card mx-auto flex max-w-5xl flex-col">
      <header className="gap-field flex flex-col">
        <h1 className="text-h1 text-text-primary">Components</h1>
        <p className="text-b1 text-text-secondary">
          {components.length} components, each readable source you copy into your project with{' '}
          <code dir="ltr" className="bg-kbd text-b2 rounded px-1 font-mono">
            npx sas-ui add &lt;name&gt;
          </code>
          . Built on Base UI, tested with axe, right-to-left first.
        </p>
      </header>
      {CATEGORY_ORDER.map((category) => {
        const group = components.filter((item) => item.category === category);
        if (group.length === 0) {
          return null;
        }
        return (
          <section key={category} className="gap-field flex flex-col">
            <h2 id={category} className="text-h3 scroll-mt-24">
              {CATEGORY_TITLES[category] ?? category}
            </h2>
            <ul className="gap-field grid sm:grid-cols-2 lg:grid-cols-3">
              {group.map((item) => (
                <li key={item.name}>
                  <a
                    href={`#/components/${item.name}`}
                    className="border-stroke bg-surface p-row hover:bg-hover-row flex h-full flex-col gap-1 rounded-lg border"
                  >
                    <span dir="auto" className="text-h5 text-text-primary">
                      {item.title}
                    </span>
                    <span className="text-b3 text-text-secondary line-clamp-2">
                      {item.description}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
