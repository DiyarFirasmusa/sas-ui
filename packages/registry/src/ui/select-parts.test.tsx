import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  SelectContent,
  SelectEmpty,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-parts';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

interface HarnessProps {
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  size?: 'default' | 'sm';
  render?: (value: string | null) => string;
}

const currencies = [
  { value: 'iqd', label: 'Iraqi dinar' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro' },
];

function Harness({ defaultValue, onValueChange, size, render: renderValue }: HarnessProps) {
  return (
    <SelectRoot items={currencies} defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger aria-label="Currency" size={size}>
        <SelectValue placeholder="Pick a currency">{renderValue}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Local</SelectLabel>
          <SelectItem value="iqd">Iraqi dinar</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Foreign</SelectLabel>
          <SelectItem value="usd">US dollar</SelectItem>
          <SelectItem value="eur" disabled>
            Euro
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </SelectRoot>
  );
}

describe('SelectParts', () => {
  it('opens, picks an item and shows its label', async () => {
    const onValueChange = vi.fn();
    render(<Harness onValueChange={onValueChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    expect(trigger).toHaveTextContent('Pick a currency');
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'US dollar' }));
    expect(onValueChange).toHaveBeenCalledWith('usd', expect.anything());
    await waitFor(() => expect(trigger).toHaveTextContent('US dollar'));
  });

  it('opens with the keyboard, navigates and closes with Escape', async () => {
    render(<Harness defaultValue="iqd" />);
    await userEvent.tab();
    expect(screen.getByRole('combobox')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(screen.getByRole('combobox')).toHaveTextContent('US dollar');
  });

  it('closes with Escape without changing the value', async () => {
    render(<Harness defaultValue="iqd" />);
    await userEvent.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    expect(screen.getByRole('combobox')).toHaveTextContent('Iraqi dinar');
  });

  it('renders the selected value with a custom function', async () => {
    render(<Harness defaultValue="usd" render={(value) => (value ?? '').toUpperCase()} />);
    expect(screen.getByRole('combobox')).toHaveTextContent('USD');
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Iraqi dinar' }));
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveTextContent('IQD'));
  });

  it('groups items under named labels and marks disabled ones', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('combobox'));
    const groups = await screen.findAllByRole('group');
    expect(groups.map((group) => group.getAttribute('aria-labelledby'))).toHaveLength(2);
    expect(screen.getByRole('group', { name: 'Foreign' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Euro' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('gives plain-text items a title, overridable', async () => {
    render(
      <SelectRoot>
        <SelectTrigger aria-label="Item">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b" title="Beta, the second">
            Beta
          </SelectItem>
        </SelectContent>
      </SelectRoot>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('option', { name: 'Alpha' })).toHaveAttribute('title', 'Alpha');
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute(
      'title',
      'Beta, the second',
    );
  });

  it('has a default trigger and an sm trigger', () => {
    render(
      <>
        <Harness />
        <SelectRoot>
          <SelectTrigger aria-label="Small" size="sm">
            <SelectValue />
          </SelectTrigger>
        </SelectRoot>
      </>,
    );
    expect(screen.getByRole('combobox', { name: 'Currency' })).toHaveAttribute(
      'data-size',
      'default',
    );
    const small = screen.getByRole('combobox', { name: 'Small' });
    expect(small).toHaveAttribute('data-size', 'sm');
    expect(small).toHaveClass('h-9');
  });

  it('shows the empty row, localised', async () => {
    renderWithLocale(
      <>
        <SelectRoot>
          <SelectTrigger aria-label="قائمة">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectEmpty />
          </SelectContent>
        </SelectRoot>
      </>,
      { locale: 'ar' },
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByText('لا توجد خيارات')).toBeInTheDocument();
  });

  it('lets the empty text be replaced', async () => {
    render(
      <SelectRoot>
        <SelectTrigger aria-label="List">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectEmpty>Nothing here</SelectEmpty>
        </SelectContent>
      </SelectRoot>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(await screen.findByText('Nothing here')).toBeInTheDocument();
    await expectNoA11yViolations(document.body);
  });

  it('works in Arabic: RTL popup, Arabic labels, keyboard pick', async () => {
    renderWithLocale(
      <SelectRoot
        defaultValue="a"
        items={[
          { value: 'a', label: 'دينار عراقي' },
          { value: 'b', label: 'دولار أمريكي' },
        ]}
      >
        <SelectTrigger aria-label="العملة">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">دينار عراقي</SelectItem>
          <SelectItem value="b">دولار أمريكي</SelectItem>
        </SelectContent>
      </SelectRoot>,
      { locale: 'ar' },
    );
    const trigger = screen.getByRole('combobox', { name: 'العملة' });
    expect(trigger).toHaveTextContent('دينار عراقي');
    await userEvent.click(trigger);
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getAllByRole('option')).toHaveLength(2);
    await userEvent.click(within(listbox).getByRole('option', { name: 'دولار أمريكي' }));
    await waitFor(() => expect(trigger).toHaveTextContent('دولار أمريكي'));
  });

  it('has no axe violations closed and open', async () => {
    const { container } = render(<Harness defaultValue="iqd" />);
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('combobox'));
    await screen.findByRole('listbox');
    await expectNoA11yViolations(document.body);
  });
});
