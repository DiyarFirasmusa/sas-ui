import { useState, useSyncExternalStore } from 'react';
import {
  Settings01Danger,
  type Settings01DangerLabels,
} from '@/components/blocks/settings-01-danger';
import {
  Settings01Notifications,
  type Settings01NotificationsLabels,
  type Settings01NotificationValues,
} from '@/components/blocks/settings-01-notifications';
import {
  Settings01PreferencesSection,
  type Settings01Preferences,
  type Settings01PreferencesLabels,
  type Settings01Preset,
} from '@/components/blocks/settings-01-preferences';
import {
  Settings01Profile,
  type Settings01ProfileLabels,
  type Settings01ProfileValues,
} from '@/components/blocks/settings-01-profile';
import { AlertTriangleIcon, InboxIcon, SettingsIcon, UserIcon } from '@/components/ui/icons';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<
  'title' | 'subtitle' | 'navLabel' | 'profile' | 'preferences' | 'notifications' | 'danger'
> = {
  en: {
    title: 'Settings',
    subtitle: 'Manage your profile, preferences and account.',
    navLabel: 'Settings sections',
    profile: 'Profile',
    preferences: 'Preferences',
    notifications: 'Notifications',
    danger: 'Danger zone',
  },
  ar: {
    title: 'الإعدادات',
    subtitle: 'أدر ملفك الشخصي وتفضيلاتك وحسابك.',
    navLabel: 'أقسام الإعدادات',
    profile: 'الملف الشخصي',
    preferences: 'التفضيلات',
    notifications: 'الإشعارات',
    danger: 'المنطقة الخطرة',
  },
};

type Settings01Section = 'profile' | 'preferences' | 'notifications' | 'danger';

const SECTIONS: readonly Settings01Section[] = [
  'profile',
  'preferences',
  'notifications',
  'danger',
];

function isSection(value: unknown): value is Settings01Section {
  return SECTIONS.some((section) => section === value);
}

/** Section list beside the content from `md` up; a scrolling strip above it below. */
const WIDE_QUERY = '(min-width: 768px)';

function subscribeWide(notify: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', notify);
  return () => {
    query.removeEventListener('change', notify);
  };
}

function useIsWide() {
  return useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

const ICONS = {
  profile: UserIcon,
  preferences: SettingsIcon,
  notifications: InboxIcon,
  danger: AlertTriangleIcon,
} satisfies Record<Settings01Section, typeof UserIcon>;

interface Settings01Props extends React.ComponentProps<'div'> {
  /** Section open first. Default `profile`. */
  defaultSection?: Settings01Section;
  /** Saved profile (defaults to a sample) and the save handler. */
  profile?: Settings01ProfileValues;
  avatarSrc?: string;
  onSaveProfile?: (values: Settings01ProfileValues) => void | Promise<void>;
  /** Language, theme and mode: controlled with `preferences`, or just listen with `onPreferencesChange`. */
  preferences?: Settings01Preferences;
  onPreferencesChange?: (next: Settings01Preferences) => void;
  /** Theme presets to offer, with their swatches (the shape `ThemeSwitcher` takes). */
  presets?: readonly Settings01Preset[];
  notifications?: Settings01NotificationValues;
  onSaveNotifications?: (values: Settings01NotificationValues) => void | Promise<void>;
  onDeleteAccount?: () => void | Promise<void>;
  onSignOutEverywhere?: () => void | Promise<void>;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  /** Overrides for the wording inside each section. */
  sectionLabels?: {
    profile?: Settings01ProfileLabels;
    preferences?: Settings01PreferencesLabels;
    notifications?: Settings01NotificationsLabels;
    danger?: Settings01DangerLabels;
  };
}

/**
 * Settings page: a section list (vertical tabs from `md`, a strip above the
 * content on phones) with Profile, Preferences, Notifications and a Danger
 * zone. Sections stay mounted while hidden, so unsaved edits survive moving
 * between them. Every handler is a prop; without one the section still works
 * against local state.
 */
function Settings01({
  defaultSection = 'profile',
  profile,
  avatarSrc,
  onSaveProfile,
  preferences,
  onPreferencesChange,
  presets,
  notifications,
  onSaveNotifications,
  onDeleteAccount,
  onSignOutEverywhere,
  labels: overrides,
  sectionLabels,
  className,
  ...props
}: Settings01Props) {
  const labels = useLabels(messages, overrides);
  const wide = useIsWide();
  const [section, setSection] = useState<Settings01Section>(defaultSection);

  return (
    <div className={cn('min-h-svh bg-background', className)} {...props}>
      <div className="gap-card md:p-page mx-auto flex w-full max-w-5xl flex-col p-4">
        <PageHeader title={labels.title} subtitle={labels.subtitle} />
        <Tabs
          value={section}
          onValueChange={(next) => {
            if (isSection(next)) {
              setSection(next);
            }
          }}
          orientation={wide ? 'vertical' : 'horizontal'}
          className="gap-card"
        >
          <TabsList aria-label={labels.navLabel} className={wide ? 'w-52 shrink-0' : undefined}>
            {SECTIONS.map((name) => {
              const Icon = ICONS[name];
              return (
                <TabsTrigger key={name} value={name}>
                  <Icon />
                  {labels[name]}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <TabsContent value="profile" keepMounted className="min-w-0">
            <Settings01Profile
              defaultValues={profile}
              avatarSrc={avatarSrc}
              onSave={onSaveProfile}
              labels={sectionLabels?.profile}
            />
          </TabsContent>
          <TabsContent value="preferences" keepMounted className="min-w-0">
            <Settings01PreferencesSection
              value={preferences}
              onChange={onPreferencesChange}
              presets={presets}
              labels={sectionLabels?.preferences}
            />
          </TabsContent>
          <TabsContent value="notifications" keepMounted className="min-w-0">
            <Settings01Notifications
              defaultValues={notifications}
              onSave={onSaveNotifications}
              labels={sectionLabels?.notifications}
            />
          </TabsContent>
          <TabsContent value="danger" keepMounted className="min-w-0">
            <Settings01Danger
              onDeleteAccount={onDeleteAccount}
              onSignOutEverywhere={onSignOutEverywhere}
              labels={sectionLabels?.danger}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export { Settings01 };
export type { Settings01Props, Settings01Section };
