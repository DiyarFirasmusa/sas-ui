import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StateWrapper, asyncStateFromQuery } from '@/components/ui/state-wrapper';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

describe('asyncStateFromQuery', () => {
  it('maps query results to the union', () => {
    expect(asyncStateFromQuery({ isPending: true, isError: false, data: undefined })).toEqual({
      status: 'loading',
    });
    expect(asyncStateFromQuery({ isPending: false, isError: false, data: [1] })).toEqual({
      status: 'success',
      data: [1],
    });
    expect(
      asyncStateFromQuery(
        { isPending: false, isError: true, data: undefined, error: 'x' },
        (error) => `E:${String(error)}`,
      ),
    ).toEqual({ status: 'error', message: 'E:x' });
  });
});

describe('StateWrapper', () => {
  it('shows a loading status first', () => {
    renderWithLocale(
      <StateWrapper state={{ status: 'loading' }}>{() => <p>done</p>}</StateWrapper>,
    );
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('done')).not.toBeInTheDocument();
  });

  it('shows the error with a working retry', async () => {
    const onRetry = vi.fn();
    renderWithLocale(
      <StateWrapper state={{ status: 'error', message: 'Server said no' }} error={{ onRetry }}>
        {() => <p>done</p>}
      </StateWrapper>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Server said no');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows the empty state when the data is empty', () => {
    renderWithLocale(
      <StateWrapper<string[]>
        state={{ status: 'success', data: [] }}
        isEmpty={(rows) => rows.length === 0}
        empty={{ title: 'No rows' }}
      >
        {() => <p>done</p>}
      </StateWrapper>,
    );
    expect(screen.getByRole('heading', { name: 'No rows' })).toBeInTheDocument();
  });

  it('renders custom empty content as is', () => {
    renderWithLocale(
      <StateWrapper<number[]>
        state={{ status: 'success', data: [] }}
        isEmpty={() => true}
        empty={<p>Nothing yet</p>}
      >
        {() => <p>done</p>}
      </StateWrapper>,
    );
    expect(screen.getByText('Nothing yet')).toBeInTheDocument();
  });

  it('renders children with the data on success', () => {
    renderWithLocale(
      <StateWrapper state={{ status: 'success', data: { name: 'Layla' } }}>
        {(data) => <p>{data.name}</p>}
      </StateWrapper>,
    );
    expect(screen.getByText('Layla')).toBeInTheDocument();
  });

  it('uses Arabic wording in the Arabic locale', () => {
    renderWithLocale(<StateWrapper state={{ status: 'error' }}>{() => null}</StateWrapper>, {
      locale: 'ar',
    });
    expect(screen.getByRole('heading', { name: 'حدث خطأ ما' })).toBeInTheDocument();
  });

  it('has no axe violations in any state', async () => {
    const { container } = renderWithLocale(
      <StateWrapper state={{ status: 'loading' }}>{() => null}</StateWrapper>,
    );
    await expectNoA11yViolations(container);
  });
});
