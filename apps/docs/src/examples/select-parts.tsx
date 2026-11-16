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
import type { Example } from '../example-types';

const currencies = [
  { value: 'iqd', label: 'Iraqi dinar' },
  { value: 'usd', label: 'US dollar' },
  { value: 'eur', label: 'Euro' },
  { value: 'gbp', label: 'Pound sterling' },
];

const arabicCurrencies = [
  { value: 'a', label: 'دينار عراقي' },
  { value: 'b', label: 'دولار أمريكي' },
];

export const examples: Example[] = [
  {
    title: 'Groups',
    render: () => (
      <SelectRoot defaultValue="iqd" items={currencies}>
        <SelectTrigger aria-label="Currency" className="w-64">
          <SelectValue placeholder="Pick a currency" />
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
            <SelectItem value="eur">Euro</SelectItem>
            <SelectItem value="gbp" disabled>
              Pound sterling
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </SelectRoot>
    ),
  },
  {
    title: 'Custom value and small trigger',
    description:
      'The trigger shows the code, the list shows the full names. size="sm" is 2px shorter than the input height (40px compact). The popup lines the selected row up with the trigger by default; pass alignItemWithTrigger={false} to open it below instead.',
    render: () => (
      <SelectRoot defaultValue="usd">
        <SelectTrigger aria-label="Currency code" size="sm" className="w-32">
          <SelectValue>{(value) => value?.toUpperCase() ?? 'Pick'}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="iqd">Iraqi dinar</SelectItem>
          <SelectItem value="usd">US dollar</SelectItem>
        </SelectContent>
      </SelectRoot>
    ),
  },
  {
    title: 'Empty list',
    render: () => (
      <SelectRoot>
        <SelectTrigger aria-label="Branch" className="w-64">
          <SelectValue placeholder="No branches yet" />
        </SelectTrigger>
        <SelectContent>
          <SelectEmpty />
        </SelectContent>
      </SelectRoot>
    ),
  },
  {
    title: 'Arabic',
    render: () => (
      <SelectRoot defaultValue="a" items={arabicCurrencies}>
        <SelectTrigger aria-label="العملة" className="w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">دينار عراقي</SelectItem>
          <SelectItem value="b">دولار أمريكي</SelectItem>
        </SelectContent>
      </SelectRoot>
    ),
  },
];
