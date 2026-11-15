import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination';
import type { Example } from '../example-types';

function Controlled({ total, initialPage = 1 }: { total: number; initialPage?: number }) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(20);
  return (
    <Pagination
      page={page}
      total={total}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
  );
}

function PageCountOnly() {
  const [page, setPage] = useState(3);
  return <Pagination page={page} pageCount={5} onPageChange={setPage} />;
}

export const examples: Example[] = [
  {
    title: 'With total and page size',
    description:
      'Shows "Showing a–b of N" with Latin digits and a page-size select; the page window collapses with ellipses.',
    wide: true,
    render: () => <Controlled total={1234} initialPage={7} />,
  },
  {
    title: 'Page count only',
    render: () => <PageCountOnly />,
  },
  {
    title: 'Empty and loading',
    description:
      'No rows leaves nothing to navigate; `disabled` locks the controls while a page loads.',
    wide: true,
    render: () => (
      <div className="gap-row flex flex-col">
        <Pagination page={1} total={0} pageSize={20} onPageChange={() => {}} />
        <Pagination page={2} total={100} pageSize={20} onPageChange={() => {}} disabled />
      </div>
    ),
  },
];
