import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ActivityItem, RecordRow } from '@/components/blocks/dashboard-01-data';
import { ActivityCard, RecordsCard } from '@/components/blocks/dashboard-01-panels';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const activity: ActivityItem[] = [
  { id: 'a', title: 'Order paid', description: 'Northwind', time: '10:30', tone: 'success' },
  { id: 'b', title: 'Plain event', time: 'Yesterday' },
];

const records: RecordRow[] = [
  { id: '#1', customer: 'Northwind', amount: 1240, status: 'paid', date: 'Nov 16' },
  { id: '#2', customer: 'Blue Harbor', amount: 860.5, status: 'failed', date: 'Nov 15' },
];

describe('ActivityCard', () => {
  it('lists events in order with a spoken status for toned ones', () => {
    renderWithLocale(<ActivityCard items={activity} />);
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Success: Order paid');
    expect(items[1]).not.toHaveTextContent('Success');
  });

  it('shows an empty state and a loading skeleton', () => {
    const { rerender } = renderWithLocale(<ActivityCard items={[]} />);
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    rerender(<ActivityCard items={activity} loading />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('Order paid')).not.toBeInTheDocument();
  });

  it('renders Arabic', () => {
    renderWithLocale(<ActivityCard items={[]} />, { locale: 'ar' });
    expect(screen.getByRole('heading', { name: 'آخر النشاطات' })).toBeInTheDocument();
    expect(screen.getByText('لا يوجد نشاط بعد')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(<ActivityCard items={activity} />);
    await expectNoA11yViolations(container);
  });
});

describe('RecordsCard', () => {
  it('renders a table with Latin-digit amounts and status badges', () => {
    renderWithLocale(<RecordsCard records={records} />);
    const table = screen.getByRole('table', { name: 'Latest orders' });
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByText('$1,240.00')).toBeInTheDocument();
    expect(within(table).getByText('Paid')).toBeInTheDocument();
    expect(within(table).getByText('Failed')).toBeInTheDocument();
  });

  it('formats amounts with the caller formatter', () => {
    renderWithLocale(<RecordsCard records={records} formatAmount={(value) => `${value} SAR`} />);
    expect(screen.getByText('1240 SAR')).toBeInTheDocument();
  });

  it('makes the order id a button only when a handler is given', async () => {
    const onRecordClick = vi.fn();
    const { rerender } = renderWithLocale(<RecordsCard records={records} />);
    expect(screen.queryByRole('button', { name: '#1' })).not.toBeInTheDocument();
    rerender(<RecordsCard records={records} onRecordClick={onRecordClick} />);
    await userEvent.click(screen.getByRole('button', { name: '#1' }));
    expect(onRecordClick).toHaveBeenCalledWith(records[0]);
  });

  it('shows an empty state and a loading skeleton', () => {
    const { rerender } = renderWithLocale(<RecordsCard records={[]} />);
    expect(screen.getByText('No orders yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    rerender(<RecordsCard records={records} loading />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders Arabic headings, statuses and left-to-right figures', () => {
    renderWithLocale(<RecordsCard records={records} />, { locale: 'ar' });
    expect(screen.getByRole('columnheader', { name: 'المبلغ' })).toBeInTheDocument();
    expect(screen.getByText('مدفوع')).toBeInTheDocument();
    expect(screen.getByText('$1,240.00')).toHaveAttribute('dir', 'ltr');
  });

  it('has no axe violations', async () => {
    const { container } = renderWithLocale(
      <RecordsCard records={records} onRecordClick={() => {}} />,
    );
    await expectNoA11yViolations(container);
  });
});
