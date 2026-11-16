import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Separator } from '@/components/ui/separator';
import { useLabels, type Messages } from '@/lib/locale';

const messages: Messages<
  | 'title'
  | 'description'
  | 'signOutTitle'
  | 'signOutDescription'
  | 'signOutButton'
  | 'signOutConfirm'
  | 'deleteTitle'
  | 'deleteDescription'
  | 'deleteButton'
  | 'deleteDialogTitle'
  | 'deleteDialogDescription'
  | 'deleteConfirm'
> = {
  en: {
    title: 'Danger zone',
    description: 'These actions affect your whole account.',
    signOutTitle: 'Sign out everywhere',
    signOutDescription: 'End every session on every device, including this one.',
    signOutButton: 'Sign out everywhere',
    signOutConfirm: 'Sign out',
    deleteTitle: 'Delete account',
    deleteDescription: 'Permanently remove your account and its data. This cannot be undone.',
    deleteButton: 'Delete account',
    deleteDialogTitle: 'Delete your account?',
    deleteDialogDescription:
      'Your profile, projects and settings are removed for good. This cannot be undone.',
    deleteConfirm: 'Delete permanently',
  },
  ar: {
    title: 'المنطقة الخطرة',
    description: 'هذه الإجراءات تؤثر على حسابك بالكامل.',
    signOutTitle: 'تسجيل الخروج من كل مكان',
    signOutDescription: 'إنهاء كل الجلسات على كل الأجهزة، بما فيها هذا الجهاز.',
    signOutButton: 'تسجيل الخروج من كل مكان',
    signOutConfirm: 'تسجيل الخروج',
    deleteTitle: 'حذف الحساب',
    deleteDescription: 'إزالة حسابك وبياناته نهائياً. لا يمكن التراجع عن ذلك.',
    deleteButton: 'حذف الحساب',
    deleteDialogTitle: 'هل تريد حذف حسابك؟',
    deleteDialogDescription: 'ستُزال ملفاتك ومشاريعك وإعداداتك نهائياً. لا يمكن التراجع عن ذلك.',
    deleteConfirm: 'حذف نهائي',
  },
};

type Settings01DangerLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface Settings01DangerProps {
  /** Runs after the user confirms; reject to keep the dialog open with an error. */
  onDeleteAccount?: () => void | Promise<void>;
  onSignOutEverywhere?: () => void | Promise<void>;
  labels?: Settings01DangerLabels;
}

/** Account-wide actions, each behind a confirmation. Deleting asks with a red button focused on Cancel. */
function Settings01Danger({
  onDeleteAccount,
  onSignOutEverywhere,
  labels: overrides,
}: Settings01DangerProps) {
  const labels = useLabels(messages, overrides);
  return (
    <Card className="border-danger/40">
      <CardHeader>
        <CardTitle as="h2" className="text-danger">
          {labels.title}
        </CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="gap-row flex flex-col">
        <div className="gap-row flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-h5 text-text-primary">{labels.signOutTitle}</h3>
            <p className="text-b2 text-text-secondary">{labels.signOutDescription}</p>
          </div>
          <ConfirmDialog
            trigger={<Button variant="outline">{labels.signOutButton}</Button>}
            title={labels.signOutTitle}
            description={labels.signOutDescription}
            confirmLabel={labels.signOutConfirm}
            onConfirm={async () => onSignOutEverywhere?.()}
          />
        </div>
        <Separator decorative />
        <div className="gap-row flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-h5 text-text-primary">{labels.deleteTitle}</h3>
            <p className="text-b2 text-text-secondary">{labels.deleteDescription}</p>
          </div>
          <ConfirmDialog
            destructive
            trigger={<Button variant="destructive">{labels.deleteButton}</Button>}
            title={labels.deleteDialogTitle}
            description={labels.deleteDialogDescription}
            confirmLabel={labels.deleteConfirm}
            onConfirm={async () => onDeleteAccount?.()}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export { Settings01Danger };
export type { Settings01DangerLabels, Settings01DangerProps };
