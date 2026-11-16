import type {
  ApprovalAction,
  ApprovalDecision,
  ApprovalOutcome,
} from '@/components/blocks/approval-01-data';
import type { Messages } from '@/lib/locale';

const messages: Messages<
  | 'requestedBy'
  | 'timelineTitle'
  | 'timelineLabel'
  | 'emptyTitle'
  | 'emptyDescription'
  | 'loading'
  | 'decisionApproved'
  | 'decisionRejected'
  | 'decisionReturned'
  | 'decisionPending'
  | 'outcomePending'
  | 'outcomeApproved'
  | 'outcomeRejected'
  | 'outcomeReturned'
  | 'awaiting'
  | 'currentStage'
  | 'panelTitle'
  | 'panelDescription'
  | 'noPermission'
  | 'closedApproved'
  | 'closedRejected'
  | 'closedReturned'
  | 'approve'
  | 'reject'
  | 'return'
  | 'approveTitle'
  | 'rejectTitle'
  | 'returnTitle'
  | 'approveDescription'
  | 'rejectDescription'
  | 'returnDescription'
  | 'dialogStage'
  | 'commentLabel'
  | 'commentOptional'
  | 'commentPlaceholder'
  | 'commentRequired'
  | 'submitFailed'
  | 'cancel'
> = {
  en: {
    requestedBy: 'Requested by {name} on {date}',
    timelineTitle: 'Approval workflow',
    timelineLabel: 'Approval stages',
    emptyTitle: 'No approval stages',
    emptyDescription: 'This request has no workflow configured yet.',
    loading: 'Loading approval workflow',
    decisionApproved: 'Approved',
    decisionRejected: 'Rejected',
    decisionReturned: 'Returned for changes',
    decisionPending: 'Pending',
    outcomePending: 'In progress',
    outcomeApproved: 'Approved',
    outcomeRejected: 'Rejected',
    outcomeReturned: 'Returned for changes',
    awaiting: 'Awaiting decision',
    currentStage: 'Current stage',
    panelTitle: 'Your decision',
    panelDescription: '{stage} is waiting for your decision.',
    noPermission: 'You are not an approver for the current stage.',
    closedApproved: 'This request was approved. No further action is needed.',
    closedRejected: 'This request was rejected. No further action is needed.',
    closedReturned: 'This request was returned to the requester for changes.',
    approve: 'Approve',
    reject: 'Reject',
    return: 'Return',
    approveTitle: 'Approve this stage',
    rejectTitle: 'Reject this request',
    returnTitle: 'Return for changes',
    approveDescription: 'The request moves on to the next stage.',
    rejectDescription: 'The request is closed and the requester is notified.',
    returnDescription: 'The requester is asked to fix the issues and resubmit.',
    dialogStage: 'Stage: {stage}',
    commentLabel: 'Comment',
    commentOptional: 'Optional',
    commentPlaceholder: 'Explain your decision for the audit trail',
    commentRequired: 'Add a comment to continue',
    submitFailed: 'The decision was not saved. Try again.',
    cancel: 'Cancel',
  },
  ar: {
    requestedBy: 'قدّمه {name} في {date}',
    timelineTitle: 'مسار الموافقات',
    timelineLabel: 'مراحل الموافقة',
    emptyTitle: 'لا توجد مراحل موافقة',
    emptyDescription: 'لم يُضبط مسار عمل لهذا الطلب بعد.',
    loading: 'جارٍ تحميل مسار الموافقات',
    decisionApproved: 'تمت الموافقة',
    decisionRejected: 'مرفوض',
    decisionReturned: 'أُعيد للتعديل',
    decisionPending: 'قيد الانتظار',
    outcomePending: 'قيد المعالجة',
    outcomeApproved: 'معتمد',
    outcomeRejected: 'مرفوض',
    outcomeReturned: 'أُعيد للتعديل',
    awaiting: 'بانتظار القرار',
    currentStage: 'المرحلة الحالية',
    panelTitle: 'قرارك',
    panelDescription: 'مرحلة «{stage}» بانتظار قرارك.',
    noPermission: 'لست من المخوّلين بالمرحلة الحالية.',
    closedApproved: 'تمت الموافقة على هذا الطلب. لا حاجة لأي إجراء إضافي.',
    closedRejected: 'تم رفض هذا الطلب. لا حاجة لأي إجراء إضافي.',
    closedReturned: 'أُعيد هذا الطلب إلى مقدّمه للتعديل.',
    approve: 'موافقة',
    reject: 'رفض',
    return: 'إعادة',
    approveTitle: 'الموافقة على هذه المرحلة',
    rejectTitle: 'رفض هذا الطلب',
    returnTitle: 'إعادة الطلب للتعديل',
    approveDescription: 'ينتقل الطلب إلى المرحلة التالية.',
    rejectDescription: 'يُغلق الطلب ويُبلَّغ مقدّمه.',
    returnDescription: 'يُطلب من مقدّم الطلب معالجة الملاحظات وإعادة التقديم.',
    dialogStage: 'المرحلة: {stage}',
    commentLabel: 'التعليق',
    commentOptional: 'اختياري',
    commentPlaceholder: 'اشرح قرارك لسجل التدقيق',
    commentRequired: 'أضف تعليقًا للمتابعة',
    submitFailed: 'لم يُحفظ القرار. حاول مرة أخرى.',
    cancel: 'إلغاء',
  },
};

type Approval01Labels = Record<keyof (typeof messages)['en'], string>;

function decisionLabel(labels: Approval01Labels, decision: ApprovalDecision): string {
  switch (decision) {
    case 'approved':
      return labels.decisionApproved;
    case 'rejected':
      return labels.decisionRejected;
    case 'returned':
      return labels.decisionReturned;
    case 'pending':
      return labels.decisionPending;
  }
}

function outcomeLabel(labels: Approval01Labels, outcome: ApprovalOutcome): string {
  switch (outcome) {
    case 'pending':
      return labels.outcomePending;
    case 'approved':
      return labels.outcomeApproved;
    case 'rejected':
      return labels.outcomeRejected;
    case 'returned':
      return labels.outcomeReturned;
  }
}

function closedLabel(labels: Approval01Labels, outcome: ApprovalOutcome): string {
  switch (outcome) {
    case 'approved':
      return labels.closedApproved;
    case 'rejected':
      return labels.closedRejected;
    case 'returned':
      return labels.closedReturned;
    case 'pending':
      return labels.outcomePending;
  }
}

/** Dialog copy for one action. */
function actionCopy(labels: Approval01Labels, action: ApprovalAction) {
  switch (action) {
    case 'approve':
      return {
        button: labels.approve,
        title: labels.approveTitle,
        description: labels.approveDescription,
      };
    case 'reject':
      return {
        button: labels.reject,
        title: labels.rejectTitle,
        description: labels.rejectDescription,
      };
    case 'return':
      return {
        button: labels.return,
        title: labels.returnTitle,
        description: labels.returnDescription,
      };
  }
}

export { actionCopy, closedLabel, decisionLabel, messages, outcomeLabel };
export type { Approval01Labels };
