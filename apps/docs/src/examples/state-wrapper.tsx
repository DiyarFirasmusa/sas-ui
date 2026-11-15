import { StateWrapper } from '@/components/ui/state-wrapper';
import type { Example } from '../example-types';

export const examples: Example[] = [
  {
    title: 'All four states',
    wide: true,
    render: () => (
      <div className="grid w-full gap-row md:grid-cols-2">
        <StateWrapper state={{ status: 'loading' }}>{() => null}</StateWrapper>
        <StateWrapper state={{ status: 'error', message: 'The server did not respond.' }} error={{ onRetry: () => {} }}>
          {() => null}
        </StateWrapper>
        <StateWrapper<string[]> state={{ status: 'success', data: [] }} isEmpty={(rows) => rows.length === 0}>
          {() => null}
        </StateWrapper>
        <StateWrapper state={{ status: 'success', data: 'Loaded content' }}>{(text) => <p className="text-b1">{text}</p>}</StateWrapper>
      </div>
    ),
  },
];
