import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { matchesText, normalizeArabic, type TextMatchMode } from '@/lib/arabic-normalize';
import type { Example } from '../example-types';

const names = [
  'مُحَمَّد أحمد',
  'إبراهيم علي',
  'آمنة حسن',
  'مصطفى كمال',
  'مدرسة النور',
  'سؤال وجواب',
  'فاتورة رقم ١٢٣',
  'Invoice 123',
  'Café Müller',
  'Äcme Trading',
];

function Search({ mode }: { mode: TextMatchMode }) {
  const [query, setQuery] = useState('احمد');
  const [taMarbuta, setTaMarbuta] = useState(false);
  const [hamza, setHamza] = useState(false);
  const options = { foldTaMarbuta: taMarbuta, foldHamzaCarriers: hamza };
  const found = names.filter((name) => matchesText(name, query, mode, options));
  return (
    <div className="gap-row flex w-full max-w-md flex-col">
      <Field label="Search" description={`Match mode: ${mode}`}>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} />
      </Field>
      <div className="gap-field flex flex-col">
        <Switch
          checked={taMarbuta}
          onCheckedChange={setTaMarbuta}
          label="Fold ة into ه"
          description="Lossy: off by default"
        />
        <Switch
          checked={hamza}
          onCheckedChange={setHamza}
          label="Fold ؤ ئ ء"
          description="Lossy: off by default"
        />
      </div>
      <p className="text-b2 text-text-muted">
        Normalised query: <bdi>{normalizeArabic(query, options) || '—'}</bdi>
      </p>
      <ul className="gap-field text-b1 flex flex-col">
        {found.length === 0 ? (
          <li className="text-text-muted">No matches</li>
        ) : (
          found.map((name) => <li key={name}>{name}</li>)
        )}
      </ul>
    </div>
  );
}

function Normalised() {
  const [text, setText] = useState('مُحَمَّدٌ أَحْمَدُ — ٢٠٢٤ — Café');
  return (
    <div className="gap-row flex w-full max-w-md flex-col">
      <Field label="Text">
        <Input value={text} onChange={(event) => setText(event.target.value)} />
      </Field>
      <p className="text-b1">
        <bdi>{normalizeArabic(text)}</bdi>
      </p>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'What the normaliser leaves',
    description:
      'Tashkeel, tatweel, alef forms, ى, Arabic-Indic digits and Latin accents are folded.',
    render: () => <Normalised />,
  },
  { title: 'Contains', render: () => <Search mode="contains" /> },
  { title: 'Starts with', render: () => <Search mode="startsWith" /> },
  { title: 'Equals', render: () => <Search mode="equals" /> },
];
