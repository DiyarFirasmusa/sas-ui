import { useState } from 'react';
import { StatusBar, type StatusBarStage } from '@/components/ui/status-bar';
import { LocaleProvider } from '@/lib/locale';
import type { Example } from '../example-types';

const pipeline: StatusBarStage[] = [
  { id: 'draft', label: 'Draft' },
  { id: 'review', label: 'In review' },
  { id: 'approved', label: 'Approved' },
  { id: 'paid', label: 'Paid' },
];

const terminal: StatusBarStage[] = [
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
];

const arabicPipeline: StatusBarStage[] = [
  { id: 'draft', label: 'مسودة' },
  { id: 'review', label: 'قيد المراجعة' },
  { id: 'approved', label: 'معتمدة' },
  { id: 'paid', label: 'مدفوعة' },
];

const arabicTerminal: StatusBarStage[] = [
  { id: 'rejected', label: 'مرفوضة' },
  { id: 'cancelled', label: 'ملغاة' },
];

const longPipeline: StatusBarStage[] = [
  { id: 'request', label: 'Purchase request' },
  { id: 'quotation', label: 'Supplier quotation' },
  { id: 'comparison', label: 'Quotation comparison' },
  { id: 'approval', label: 'Management approval' },
  { id: 'order', label: 'Purchase order' },
  { id: 'receipt', label: 'Goods receipt' },
  { id: 'invoice', label: 'Supplier invoice' },
  { id: 'payment', label: 'Payment' },
];

function Interactive() {
  const [current, setCurrent] = useState('review');
  return (
    <div className="gap-row flex w-full max-w-2xl flex-col">
      <StatusBar
        stages={pipeline}
        terminal={terminal}
        current={current}
        onStageChange={setCurrent}
      />
      <p className="text-b2 text-text-muted">Current stage: {current}</p>
    </div>
  );
}

function Confirmed() {
  const [current, setCurrent] = useState('draft');
  return (
    <div className="gap-row flex w-full max-w-2xl flex-col">
      <StatusBar
        stages={pipeline}
        terminal={terminal}
        current={current}
        onStageChange={setCurrent}
        confirmChange={(id) =>
          new Promise<boolean>((resolve) => {
            // Stands in for a server call; "Cancelled" is refused to show the cancel path.
            setTimeout(() => resolve(id !== 'cancelled'), 800);
          })
        }
      />
      <p className="text-b2 text-text-muted">
        Each change takes a moment to confirm. Choosing Cancelled is refused.
      </p>
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Pipeline',
    wide: true,
    render: () => (
      <div className="w-full max-w-2xl">
        <StatusBar stages={pipeline} current="approved" />
      </div>
    ),
  },
  {
    title: 'With step numbers',
    wide: true,
    render: () => (
      <div className="w-full max-w-2xl">
        <StatusBar stages={pipeline} current="review" showNumbers />
      </div>
    ),
  },
  {
    title: 'Clickable stages',
    description: 'Every stage except the current one is a button. Below sm it becomes a select.',
    wide: true,
    render: () => <Interactive />,
  },
  {
    title: 'Async confirmation',
    description: 'confirmChange can await a server call or a dialog; the bar is busy meanwhile.',
    wide: true,
    render: () => <Confirmed />,
  },
  {
    title: 'Rejected (terminal stage)',
    wide: true,
    render: () => (
      <div className="w-full max-w-2xl">
        <StatusBar
          stages={[
            { id: 'draft', label: 'Draft', state: 'complete' },
            { id: 'review', label: 'In review', state: 'complete' },
            { id: 'approved', label: 'Approved' },
            { id: 'paid', label: 'Paid' },
          ]}
          terminal={terminal}
          current="rejected"
        />
      </div>
    ),
  },
  {
    title: 'Error and skipped stages',
    wide: true,
    render: () => (
      <div className="w-full max-w-2xl">
        <StatusBar
          stages={[
            { id: 'draft', label: 'Draft' },
            { id: 'review', label: 'In review', state: 'skipped' },
            { id: 'approved', label: 'Approved', state: 'error' },
            { id: 'paid', label: 'Paid' },
          ]}
          current="approved"
        />
      </div>
    ),
  },
  {
    title: 'Long pipeline',
    description: 'Scrolls sideways when it does not fit, with the current stage kept in view.',
    wide: true,
    render: () => (
      <div className="w-full max-w-xl">
        <StatusBar stages={longPipeline} current="receipt" showNumbers />
      </div>
    ),
  },
  {
    title: 'Arabic (right to left)',
    description: 'Always Arabic here: the arrows point left and the state words are Arabic.',
    wide: true,
    render: () => (
      <LocaleProvider locale="ar">
        <div className="w-full max-w-2xl">
          <StatusBar
            stages={arabicPipeline}
            terminal={arabicTerminal}
            current="review"
            showNumbers
            onStageChange={() => {}}
          />
        </div>
      </LocaleProvider>
    ),
  },
];
