import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Example } from '../example-types';

const invoices = [
  { id: 'INV-1001', customer: 'Al Noor Travel', status: 'Paid', amount: 12450 },
  {
    id: 'INV-1002',
    customer: 'شركة الأفق للسياحة',
    status: 'Due',
    amount: 3200.5,
  },
  {
    id: 'INV-1003',
    customer: 'Desert Rose Tours',
    status: 'Overdue',
    amount: 870,
  },
  { id: 'INV-1004', customer: 'مكتب الواحة', status: 'Paid', amount: 15900 },
] as const;

const tone = { Paid: 'green', Due: 'yellow', Overdue: 'red' } as const;
const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 });

function InvoiceRows({ selectedId }: { selectedId?: string }) {
  return (
    <>
      {invoices.map((invoice) => (
        <TableRow key={invoice.id} selected={invoice.id === selectedId}>
          <TableCell className="font-mono" dir="ltr">
            {invoice.id}
          </TableCell>
          <TableCell dir="auto">{invoice.customer}</TableCell>
          <TableCell>
            <Badge tone={tone[invoice.status]}>{invoice.status}</Badge>
          </TableCell>
          <TableCell numeric>{money.format(invoice.amount)}</TableCell>
        </TableRow>
      ))}
    </>
  );
}

function Header() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Invoice</TableHead>
        <TableHead>Customer</TableHead>
        <TableHead>Status</TableHead>
        <TableHead numeric>Amount</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export const examples: Example[] = [
  {
    title: 'Default',
    description:
      'Semantic table with a caption, hover rows and a numeric column that stays end-aligned in both directions.',
    wide: true,
    render: () => (
      <Table>
        <TableCaption>Latest invoices</TableCaption>
        <Header />
        <TableBody>
          <InvoiceRows />
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell numeric>
              {money.format(invoices.reduce((sum, invoice) => sum + invoice.amount, 0))}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    ),
  },
  {
    title: 'Selected row',
    wide: true,
    render: () => (
      <Table>
        <Header />
        <TableBody>
          <InvoiceRows selectedId="INV-1002" />
        </TableBody>
      </Table>
    ),
  },
  {
    title: 'Sticky header and first column',
    description: 'The container scrolls, not the page: give it a height with containerClassName.',
    wide: true,
    render: () => (
      <Table stickyHeader containerClassName="max-h-48 max-w-md">
        <TableHeader>
          <TableRow>
            <TableHead sticky="start">Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead numeric>Amount</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...invoices, ...invoices].map((invoice, index) => (
            <TableRow key={`${invoice.id}-${index}`}>
              <TableCell sticky="start" className="font-mono" dir="ltr">
                {invoice.id}
              </TableCell>
              <TableCell dir="auto" className="whitespace-nowrap">
                {invoice.customer}
              </TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell numeric>{money.format(invoice.amount)}</TableCell>
              <TableCell>2025-01-12</TableCell>
              <TableCell>2025-02-11</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
  },
];
