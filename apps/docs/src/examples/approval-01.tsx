import { Approval01 } from '@/components/blocks/approval-01';
import { sampleApprovalRequest, type ApprovalRequest } from '@/components/blocks/approval-01-data';
import type { Example } from '../example-types';

const rejected: ApprovalRequest = {
  ...sampleApprovalRequest,
  stages: sampleApprovalRequest.stages.map((stage, index) =>
    index === 2
      ? {
          ...stage,
          decision: 'rejected',
          decidedAt: '2026-11-09T09:20:00Z',
          comment: {
            en: 'The annual fee does not match the fee schedule.',
            ar: 'الرسم السنوي لا يطابق جدول الرسوم.',
          },
        }
      : stage,
  ),
};

export const examples: Example[] = [
  {
    title: 'Waiting for your decision',
    description: 'Every action asks for a comment before it is sent.',
    wide: true,
    render: () => <Approval01 onDecision={async () => {}} />,
  },
  {
    title: 'Rejected',
    wide: true,
    render: () => <Approval01 state={{ status: 'success', data: rejected }} />,
  },
  {
    title: 'Not your stage',
    wide: true,
    render: () => <Approval01 canAct={false} />,
  },
  { title: 'Loading', wide: true, render: () => <Approval01 state={{ status: 'loading' }} /> },
  {
    title: 'Error',
    wide: true,
    render: () => <Approval01 state={{ status: 'error' }} onRetry={() => {}} />,
  },
];
