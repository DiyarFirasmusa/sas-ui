import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListPage01 } from '@/components/blocks/list-page-01';
import {
  DEFAULT_QUERY,
  sampleLicences,
  type ListPage01Query,
} from '@/components/blocks/list-page-01-data';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function table() {
  return within(screen.getByRole('table'));
}

function bodyRows() {
  return table().getAllByRole('row').slice(1);
}

describe('ListPage01', () => {
  it('shows the first page of the sample set under a page header', () => {
    renderWithLocale(<ListPage01 onCreate={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Licences' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New licence' })).toBeInTheDocument();
    expect(bodyRows()).toHaveLength(10);
    expect(screen.getByText('Showing 1–10 of 26')).toBeInTheDocument();
  });

  it('pages and sorts the browsable sample', async () => {
    renderWithLocale(<ListPage01 />);
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Showing 11–20 of 26')).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('table')).getByRole('button', { name: /Annual fee/ }),
    );
    const header = screen.getByRole('columnheader', { name: /Annual fee/ });
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByText('Showing 1–10 of 26')).toBeInTheDocument();
  });

  it('searches and shows a chip and a no-results state when nothing matches', async () => {
    renderWithLocale(<ListPage01 />);
    const search = screen.getByRole('searchbox', { name: 'Search' });
    await userEvent.type(search, 'LIC-1045{Enter}');
    await waitFor(() => expect(bodyRows()).toHaveLength(1));
    await userEvent.clear(search);
    await userEvent.type(search, 'zzz{Enter}');
    expect((await screen.findAllByText('No licences match')).length).toBeGreaterThan(0);
  });

  it('filters by status through the filters panel and shows a removable chip', async () => {
    renderWithLocale(<ListPage01 />);
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Expired' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    const chips = await screen.findByRole('list', { name: 'Active filters' });
    expect(within(chips).getByText('Expired')).toBeInTheDocument();
    expect(bodyRows().every((row) => within(row).queryByText('Expired') !== null)).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: /Remove filter Status/ }));
    expect(bodyRows()).toHaveLength(10);
  });

  it('is controlled by `query` and reports every change', async () => {
    const onQueryChange = vi.fn<(query: ListPage01Query) => void>();
    renderWithLocale(
      <ListPage01 query={{ ...DEFAULT_QUERY, page: 2 }} onQueryChange={onQueryChange} />,
    );
    expect(screen.getByText('Showing 11–20 of 26')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onQueryChange).toHaveBeenCalledWith({ ...DEFAULT_QUERY, page: 3 });
    // still page 2: the parent has not accepted the change
    expect(screen.getByText('Showing 11–20 of 26')).toBeInTheDocument();
  });

  it('renders server rows as given with the server total', () => {
    renderWithLocale(
      <ListPage01
        rows={sampleLicences.slice(0, 3)}
        total={120}
        query={{ ...DEFAULT_QUERY, pageSize: 3 }}
      />,
    );
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByText('Showing 1–3 of 120')).toBeInTheDocument();
  });

  it('selects rows, shows the bulk bar and exports them', async () => {
    const onExport = vi.fn();
    renderWithLocale(<ListPage01 onExport={onExport} />);
    await userEvent.click(table().getByRole('checkbox', { name: 'Select LIC-1040' }));
    await userEvent.click(table().getByRole('checkbox', { name: 'Select LIC-1041' }));
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(within(bar).getByText('2 selected on this page')).toBeInTheDocument();
    await userEvent.click(within(bar).getByRole('button', { name: 'Export' }));
    expect(onExport).toHaveBeenCalledOnce();
    expect(onExport.mock.calls[0]?.[0].map((row: { reference: string }) => row.reference)).toEqual([
      'LIC-1040',
      'LIC-1041',
    ]);
  });

  it('confirms a bulk suspend once, even when clicked repeatedly', async () => {
    let finish: () => void = () => {};
    const onSuspend = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithLocale(<ListPage01 onSuspend={onSuspend} />);
    await userEvent.click(table().getByRole('checkbox', { name: 'Select LIC-1040' }));
    const bar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    await userEvent.click(within(bar).getByRole('button', { name: 'Suspend' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('1 selected', { exact: false })).toBeInTheDocument();
    const confirm = within(dialog).getByRole('button', { name: 'Suspend' });
    await userEvent.click(confirm);
    await userEvent.click(confirm);
    expect(onSuspend).toHaveBeenCalledOnce();
    finish();
    await waitFor(() => expect(screen.queryByRole('toolbar', { name: 'Bulk actions' })).toBeNull());
  });

  it('offers row actions only for handlers that exist and runs them', async () => {
    const onView = vi.fn();
    renderWithLocale(<ListPage01 onView={onView} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Actions for LIC-1040' })[0]!);
    expect(await screen.findByRole('menuitem', { name: 'View' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Suspend' })).toBeNull();
    await userEvent.click(screen.getByRole('menuitem', { name: 'View' }));
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ reference: 'LIC-1040' }));
  });

  it('shows skeleton rows while loading', () => {
    renderWithLocale(<ListPage01 status="loading" />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });

  it('shows the error with a retry', async () => {
    const onRetry = vi.fn();
    renderWithLocale(<ListPage01 status="error" onRetry={onRetry} />);
    expect(screen.getAllByText('We could not load the licences.').length).toBeGreaterThan(0);
    await userEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]!);
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows the empty state with the create action when there is nothing yet', async () => {
    const onCreate = vi.fn();
    renderWithLocale(<ListPage01 rows={[]} total={0} onCreate={onCreate} />);
    expect(screen.getAllByText('No licences yet').length).toBeGreaterThan(0);
    const buttons = screen.getAllByRole('button', { name: 'New licence' });
    await userEvent.click(buttons[buttons.length - 1]!);
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('renders Arabic labels and holder names, and Latin digits', () => {
    renderWithLocale(<ListPage01 />, { locale: 'ar' });
    expect(screen.getByRole('heading', { level: 1, name: 'التراخيص' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('table')).getAllByText('شركة النور للتجارة').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('عرض 1–10 من 26')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByText('LIC-1040')[0]).toHaveAttribute(
      'dir',
      'ltr',
    );
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<ListPage01 onCreate={() => {}} onView={() => {}} />);
    await expectNoA11yViolations(container);
  });
});
