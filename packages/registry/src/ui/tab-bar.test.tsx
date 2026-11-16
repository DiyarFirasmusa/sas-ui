import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CheckIcon } from '@/components/ui/icons';
import {
  TabBar,
  TabBarProvider,
  TabPanel,
  type TabBarItem,
  type TabBarProps,
} from '@/components/ui/tab-bar';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

type Id = 'a' | 'b' | 'c';

const items: TabBarItem<Id>[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta', disabled: true },
  { id: 'c', label: 'Gamma' },
];

function Harness({
  onChange,
  initial = 'a',
  barProps,
  inner = false,
}: {
  onChange?: (id: Id) => void;
  initial?: Id;
  barProps?: Partial<TabBarProps<Id>>;
  /** Render the panels inside a wrapper component, away from the bar. */
  inner?: boolean;
}) {
  const [value, setValue] = useState<Id>(initial);
  const panels = (
    <section>
      <TabPanel active={value === 'a'} value="a">
        Alpha body
      </TabPanel>
      <TabPanel active={value === 'c'} value="c">
        Gamma body
      </TabPanel>
    </section>
  );
  return (
    <>
      <TabBar
        items={items}
        value={value}
        onValueChange={(id) => {
          setValue(id);
          onChange?.(id);
        }}
        aria-label="Sections"
        {...barProps}
      />
      {inner ? <div>{panels}</div> : panels}
    </>
  );
}

describe('TabBar', () => {
  it('renders a labelled tablist with the active tab selected', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'false');
  });

  it('selects a tab on click and reports the id', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Gamma' }));
    expect(onChange).toHaveBeenCalledWith('c');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gamma body');
  });

  it('never selects a disabled tab', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const beta = screen.getByRole('tab', { name: 'Beta' });
    expect(beta).toBeDisabled();
    await userEvent.click(beta);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a count badge and an icon', () => {
    const { container } = render(
      <TabBar
        items={[{ id: 'a', label: 'Pending', count: 8, icon: CheckIcon }]}
        value="a"
        onValueChange={vi.fn()}
        aria-label="Inbox"
      />,
    );
    expect(screen.getByRole('tab', { name: /Pending/ })).toHaveTextContent('8');
    expect(container.querySelector('[data-slot="tab-bar-count"]')).toHaveTextContent('8');
    expect(container.querySelector('[role="tab"] > svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows a zero count (not hidden like a missing one)', () => {
    const { container } = render(
      <TabBar
        items={[{ id: 'a', label: 'Done', count: 0 }]}
        value="a"
        onValueChange={vi.fn()}
        aria-label="Inbox"
      />,
    );
    expect(container.querySelector('[data-slot="tab-bar-count"]')).toHaveTextContent('0');
  });
});

describe('TabBar variants', () => {
  it.each(['pill', 'plain', 'underline'] as const)('renders the %s variant', (variant) => {
    render(<Harness barProps={{ variant }} />);
    const list = screen.getByRole('tablist');
    expect(list).toHaveAttribute('data-variant', variant);
  });

  it('defaults to the pill variant', () => {
    render(<Harness />);
    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'pill');
  });

  it('underline draws its indicator on the active tab as a bottom border', () => {
    render(<Harness barProps={{ variant: 'underline' }} />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveClass(
      'border-b-2',
      'aria-selected:border-primary',
    );
  });

  it('fill splits the pill tabs evenly, and leaves the other variants alone', () => {
    const { rerender } = render(<Harness barProps={{ fill: true }} />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveClass('flex-1');
    rerender(<Harness barProps={{ fill: true, variant: 'plain' }} />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).not.toHaveClass('flex-1');
  });

  it('keeps the logical-only classes (no physical sides)', () => {
    render(<Harness barProps={{ variant: 'underline' }} />);
    expect(screen.getByRole('tablist').className).not.toMatch(/\b(?:ml|mr|pl|pr|left|right)-/);
  });
});

describe('TabBar keyboard', () => {
  it('gives tabIndex 0 only to the active tab (roving tabindex)', () => {
    render(<Harness />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('tabindex', '-1');
  });

  it('falls back to the first enabled tab when the value is disabled or unknown', () => {
    render(
      <TabBar items={items} value={'b' satisfies Id} onValueChange={vi.fn()} aria-label="S" />,
    );
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves with ArrowRight in LTR, skipping disabled tabs, and focuses the new tab', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('c');
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
  });

  it('moves with ArrowLeft in LTR', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} initial="c" />);
    screen.getByRole('tab', { name: 'Gamma' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('flips the arrows in RTL: ArrowRight goes to the previous tab, ArrowLeft to the next', async () => {
    const onChange = vi.fn();
    renderWithLocale(<Harness onChange={onChange} initial="c" />, { locale: 'ar' });
    screen.getByRole('tab', { name: 'Gamma' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('a');
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('c');
  });

  it('follows the dir prop over the locale', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} barProps={{ dir: 'rtl' }} />);
    expect(screen.getByRole('tablist')).toHaveAttribute('dir', 'rtl');
    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('jumps to the first and last enabled tab with Home and End', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('c');
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('a');
  });

  it('leaves other keys alone', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await userEvent.keyboard('x{ArrowDown}');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('TabPanel and aria-controls', () => {
  it('links the active tab and its panel both ways', () => {
    render(<Harness />);
    const panel = screen.getByRole('tabpanel');
    const tab = screen.getByRole('tab', { name: 'Alpha' });
    expect(panel).toHaveTextContent('Alpha body');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
    expect(screen.getByRole('tab', { name: 'Gamma' })).not.toHaveAttribute('aria-controls');
  });

  it('moves aria-controls to the newly active tab', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('tab', { name: 'Gamma' }));
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute(
      'aria-controls',
      screen.getByRole('tabpanel').id,
    );
    expect(screen.getByRole('tab', { name: 'Alpha' })).not.toHaveAttribute('aria-controls');
  });

  it('omits aria-controls when the screen renders no panel (a bar used as a filter)', async () => {
    const { container } = render(
      <TabBar items={items} value="a" onValueChange={vi.fn()} aria-label="Filter" />,
    );
    expect(screen.getByRole('tab', { name: 'Alpha' })).not.toHaveAttribute('aria-controls');
    await expectNoA11yViolations(container);
  });

  it('works with panels rendered anywhere, not only beside the bar', () => {
    render(
      <>
        <header>
          <TabBar items={items} value="c" onValueChange={vi.fn()} aria-label="Sections" />
        </header>
        <main>
          <article>
            <TabPanel active value="c">
              Deep body
            </TabPanel>
          </article>
        </main>
      </>,
    );
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute(
      'aria-controls',
      screen.getByRole('tabpanel').id,
    );
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Gamma');
  });

  it('inside a nested component the link is still found after the first render', () => {
    render(<Harness inner />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
      'aria-controls',
      screen.getByRole('tabpanel').id,
    );
  });

  it('a TabBarProvider updates the bar when a panel mounts in a separate component', async () => {
    function LatePanel() {
      const [shown, setShown] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setShown(true)}>
            show panel
          </button>
          <TabPanel active={shown} value="a">
            Late body
          </TabPanel>
        </>
      );
    }
    render(
      <TabBarProvider>
        <TabBar items={items} value="a" onValueChange={vi.fn()} aria-label="S" />
        <LatePanel />
      </TabBarProvider>,
    );
    expect(screen.getByRole('tab', { name: 'Alpha' })).not.toHaveAttribute('aria-controls');
    await userEvent.click(screen.getByRole('button', { name: 'show panel' }));
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute(
      'aria-controls',
      screen.getByRole('tabpanel').id,
    );
  });

  it('scopes ids with idPrefix so two tab sets can share a page', () => {
    render(
      <>
        <TabBar items={items} value="a" onValueChange={vi.fn()} idPrefix="one" aria-label="One" />
        <TabPanel active value="a" idPrefix="one">
          One body
        </TabPanel>
        <TabBar items={items} value="a" onValueChange={vi.fn()} idPrefix="two" aria-label="Two" />
        <TabPanel active value="a" idPrefix="two">
          Two body
        </TabPanel>
      </>,
    );
    const panels = screen.getAllByRole('tabpanel');
    expect(panels.map((panel) => panel.id)).toEqual(['one-tabpanel-a', 'two-tabpanel-a']);
    for (const tab of screen.getAllByRole('tab', { name: 'Alpha' })) {
      expect(tab.getAttribute('aria-controls')).toMatch(/^(one|two)-tabpanel-a$/);
    }
  });

  it('renders nothing while inactive and passes extra props to the panel', () => {
    const { rerender } = render(
      <TabPanel active={false} value="a" data-testid="panel">
        hidden
      </TabPanel>,
    );
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    rerender(
      <TabPanel active value="a" data-testid="panel" className="p-card">
        shown
      </TabPanel>,
    );
    expect(screen.getByTestId('panel')).toHaveClass('p-card');
  });
});

describe('TabBar in Arabic', () => {
  it('renders Arabic labels and has no axe violations in any variant', async () => {
    const arabic: TabBarItem<Id>[] = [
      { id: 'a', label: 'الكل', count: 12 },
      { id: 'b', label: 'مؤجل', disabled: true },
      { id: 'c', label: 'مكتمل' },
    ];
    const { container } = renderWithLocale(
      <div>
        {(['pill', 'plain', 'underline'] as const).map((variant) => (
          <TabBar
            key={variant}
            items={arabic}
            value="a"
            variant={variant}
            idPrefix={variant}
            onValueChange={vi.fn()}
            aria-label={`التبويبات ${variant}`}
          />
        ))}
        <TabPanel active value="a" idPrefix="pill">
          المحتوى
        </TabPanel>
      </div>,
      { locale: 'ar' },
    );
    expect(screen.getAllByRole('tab', { name: /الكل/ })).toHaveLength(3);
    await expectNoA11yViolations(container);
  });
});
