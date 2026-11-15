import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LocaleProvider, useLabels, useLocale, type Messages } from '@/lib/locale';

const messages: Messages<'hello' | 'bye'> = {
  en: { hello: 'Hello', bye: 'Bye' },
  ar: { hello: 'مرحبا', bye: 'وداعا' },
};

function Probe({ override }: { override?: { bye: string } }) {
  const labels = useLabels(messages, override);
  const { direction } = useLocale();
  return (
    <p>
      {labels.hello}|{labels.bye}|{direction}
    </p>
  );
}

describe('locale', () => {
  it('resolves english labels', () => {
    render(
      <LocaleProvider locale="en">
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByText('Hello|Bye|ltr')).toBeInTheDocument();
  });

  it('resolves arabic labels with rtl direction', () => {
    render(
      <LocaleProvider locale="ar">
        <Probe />
      </LocaleProvider>,
    );
    expect(screen.getByText('مرحبا|وداعا|rtl')).toBeInTheDocument();
  });

  it('lets props override single labels', () => {
    render(
      <LocaleProvider locale="en">
        <Probe override={{ bye: 'See you' }} />
      </LocaleProvider>,
    );
    expect(screen.getByText('Hello|See you|ltr')).toBeInTheDocument();
  });

  it('falls back to <html lang> without a provider', () => {
    document.documentElement.lang = 'ar';
    render(<Probe />);
    expect(screen.getByText('مرحبا|وداعا|rtl')).toBeInTheDocument();
  });
});
