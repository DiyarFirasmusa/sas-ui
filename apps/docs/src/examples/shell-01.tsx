import { useEffect, useState } from 'react';
import { Shell01, type Shell01Props } from '@/components/blocks/shell-01';
import type { RenderNavLink } from '@/components/ui/sidebar-nav';
import { directionOf, LocaleProvider, type Locale } from '@/lib/locale';
import type { ColorMode } from '@/lib/theme';
import type { Example } from '../example-types';
import { ShellDemoPage } from '../shell-demo-page';

/** Keeps the demo inside the preview: a real app hands `props` to its router's Link instead. */
const renderLink: RenderNavLink = ({ children, onClick, ...props }) => (
  <a
    {...props}
    onClick={(event) => {
      event.preventDefault();
      onClick?.(event);
    }}
  >
    {children}
  </a>
);

const TITLES: Record<Locale, string> = { en: 'Items', ar: 'المواد' };

interface DemoProps {
  locale: Locale;
  /** Preset painted on this subtree only, whatever the docs page uses. */
  preset: string;
  variant?: Shell01Props['variant'];
  userPlacement?: Shell01Props['userPlacement'];
  topbarVariant?: Shell01Props['topbarVariant'];
}

/**
 * One full-page shell: pinned to a language (so left-to-right and
 * right-to-left sit side by side) and painted by one preset through
 * `data-preset-scope`, so the HR sidebar can be shown beside the navy one.
 */
function ShellDemo({ locale, preset, variant, userPlacement, topbarVariant }: DemoProps) {
  const [path, setPath] = useState('/customers');
  const [mode, setMode] = useState<ColorMode>('light');
  const [lang, setLang] = useState<Locale>(locale);
  // Menus and popovers render in a portal under <body>, outside the scoped
  // wrapper, so the same scope is mirrored there while the demo is mounted.
  useEffect(() => {
    document.body.dataset.presetScope = preset;
    document.body.dataset.mode = mode === 'dark' ? 'dark' : 'light';
    return () => {
      delete document.body.dataset.presetScope;
      delete document.body.dataset.mode;
    };
  }, [preset, mode]);
  return (
    <LocaleProvider locale={lang}>
      <div
        dir={directionOf(lang)}
        lang={lang}
        data-preset-scope={preset}
        data-mode={mode === 'dark' ? 'dark' : 'light'}
        className="bg-background text-text-primary"
      >
        <Shell01
          variant={variant}
          userPlacement={userPlacement}
          topbarVariant={topbarVariant}
          title={TITLES[lang]}
          version="v1.4.0"
          currentPath={path}
          renderLink={renderLink}
          onNavigate={(item) => {
            if (item.href) {
              setPath(item.href);
            }
          }}
          mode={mode}
          onModeChange={(next) => setMode(next === 'dark' ? 'dark' : 'light')}
          onLocaleChange={setLang}
          onProfile={() => {}}
          onSignOut={() => {}}
        >
          <ShellDemoPage locale={lang} />
        </Shell01>
      </div>
    </LocaleProvider>
  );
}

export const examples: Example[] = [
  {
    fullBleed: true,
    title: 'Compact dashboard, LTR',
    description:
      'The tourism dashboard: navy sidebar with brand row and rail toggle, workspace card, grouped accordion navigation, status footer; the 72px bar with search, theme switch, language menu, notifications and the account chip. A page header, KPI tiles and a panel fill the content.',
    wide: true,
    render: () => <ShellDemo locale="en" preset="wine-lapis" />,
  },
  {
    fullBleed: true,
    title: 'Compact dashboard, RTL',
    description:
      'The same shell in Arabic: the sidebar moves to the right edge, rail tooltips open towards the page, icons mirror, nothing else changes.',
    wide: true,
    render: () => <ShellDemo locale="ar" preset="wine-lapis" />,
  },
  {
    fullBleed: true,
    title: 'Compact dashboard, inventory preset',
    description:
      'The inventory dashboard: a white sidebar with a wine selected item and the bar on the page surface (`topbarVariant="surface"`).',
    wide: true,
    render: () => <ShellDemo locale="en" preset="inventory" topbarVariant="surface" />,
  },
  {
    fullBleed: true,
    title: 'HR dashboard, hr preset',
    description:
      'The HR dashboard through `data-preset-scope="hr"` and `variant="hr"`: a fixed deep plum column with the logo, a tenant info card and flat sections with a gold current page, the blurred 62px bar with a title accent. The account sits in the top bar on desktop and in the drawer on phones.',
    wide: true,
    render: () => <ShellDemo locale="en" preset="hr" variant="hr" />,
  },
  {
    fullBleed: true,
    title: 'HR dashboard, RTL',
    description: 'The HR shell in Arabic, with the plum column on the right.',
    wide: true,
    render: () => <ShellDemo locale="ar" preset="hr" variant="hr" />,
  },
];
