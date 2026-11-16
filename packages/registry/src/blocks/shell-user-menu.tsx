import { LanguagesIcon, LogOutIcon } from '@/components/blocks/block-icons';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoonIcon, SunIcon, UserIcon } from '@/components/ui/icons';
import { SidebarUser } from '@/components/ui/sidebar-user';
import { TopbarAccount } from '@/components/ui/topbar-account';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, useLocale, type Locale, type Messages } from '@/lib/locale';
import { COLOR_MODES, isColorMode, isLocale, type ColorMode } from '@/lib/theme';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'accountOf'
  | 'profile'
  | 'language'
  | 'theme'
  | 'signOut'
  | 'light'
  | 'dark'
  | 'system'
  | 'arabic'
  | 'english'
> = {
  en: {
    accountOf: 'Account menu for {name}',
    profile: 'Profile',
    language: 'Language',
    theme: 'Theme',
    signOut: 'Sign out',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    arabic: 'العربية',
    english: 'English',
  },
  ar: {
    accountOf: 'قائمة حساب {name}',
    profile: 'الملف الشخصي',
    language: 'اللغة',
    theme: 'المظهر',
    signOut: 'تسجيل الخروج',
    light: 'فاتح',
    dark: 'داكن',
    system: 'حسب النظام',
    arabic: 'العربية',
    english: 'English',
  },
};

type UserMenuLabels = Partial<Record<keyof (typeof messages)['en'], string>>;

interface ShellUser {
  name: string;
  email?: string;
  /** Role shown under the name in the top bar, e.g. "Warehouse manager". */
  role?: string;
  /** Image URL; initials show while it loads or when it is missing. */
  avatarSrc?: string;
}

interface ShellAccountItemsProps {
  onProfile?: () => void;
  onSignOut?: () => void;
  /** Language and theme sections appear only when their handler is given. */
  onLocaleChange?: (locale: Locale) => void;
  mode?: ColorMode;
  onModeChange?: (mode: ColorMode) => void;
  labels?: UserMenuLabels;
}

/**
 * The entries of the account menu: profile, language, theme and sign out.
 * Sections whose handler is missing are left out, so an app wires only what
 * it supports. Drop it inside any menu popup (`TopbarAccount`, `SidebarUser`).
 */
function ShellAccountItems({
  onProfile,
  onSignOut,
  onLocaleChange,
  mode = 'system',
  onModeChange,
  labels: overrides,
}: ShellAccountItemsProps) {
  const labels = useLabels(messages, overrides);
  const { locale } = useLocale();
  const modeLabels: Record<ColorMode, string> = {
    light: labels.light,
    dark: labels.dark,
    system: labels.system,
  };
  const ModeIcon = mode === 'dark' ? MoonIcon : SunIcon;

  return (
    <>
      {onProfile ? (
        <DropdownMenuItem onClick={onProfile}>
          <UserIcon />
          {labels.profile}
        </DropdownMenuItem>
      ) : null}
      {onLocaleChange ? (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="gap-field flex items-center">
              <LanguagesIcon />
              {labels.language}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={locale}
              onValueChange={(value) => {
                if (isLocale(value)) {
                  onLocaleChange(value);
                }
              }}
            >
              <DropdownMenuRadioItem value="ar" lang="ar">
                {labels.arabic}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="en" lang="en">
                {labels.english}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      ) : null}
      {onModeChange ? (
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="gap-field flex items-center">
              <ModeIcon />
              {labels.theme}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={mode}
              onValueChange={(value) => {
                if (isColorMode(value)) {
                  onModeChange(value);
                }
              }}
            >
              {COLOR_MODES.map((option) => (
                <DropdownMenuRadioItem key={option} value={option}>
                  {modeLabels[option]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      ) : null}
      {onSignOut ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={onSignOut}>
            <LogOutIcon />
            {labels.signOut}
          </DropdownMenuItem>
        </>
      ) : null}
    </>
  );
}

interface ShellUserMenuProps extends ShellAccountItemsProps {
  user: ShellUser;
  /**
   * `topbar` is the chip of the top bar (avatar, name, role); `sidebar` the
   * user block at the bottom of the sidebar; `compact` the avatar alone.
   */
  variant?: 'topbar' | 'sidebar' | 'compact';
  /** Sidebar variant only: render in the phone drawer but not on desktop. */
  drawerOnly?: boolean;
  className?: string;
}

/**
 * Account menu in one of the dashboards' three placements. All of them open
 * the same entries (`ShellAccountItems`). In a collapsed sidebar the user
 * block shrinks to the avatar.
 */
function ShellUserMenu({
  user,
  variant = 'compact',
  drawerOnly,
  className,
  ...items
}: ShellUserMenuProps) {
  const labels = useLabels(messages, items.labels);
  const menu = <ShellAccountItems {...items} />;

  if (variant === 'topbar') {
    return (
      <TopbarAccount
        name={user.name}
        role={user.role ?? user.email}
        avatarSrc={user.avatarSrc}
        className={className}
      >
        {menu}
      </TopbarAccount>
    );
  }

  if (variant === 'sidebar') {
    return (
      <SidebarUser
        name={user.name}
        subtitle={user.role ?? user.email}
        avatarSrc={user.avatarSrc}
        drawerOnly={drawerOnly}
        className={className}
      >
        {menu}
      </SidebarUser>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="shell-user-menu"
        aria-label={fillTemplate(labels.accountOf, { name: user.name })}
        className={cn(
          'flex size-11 items-center justify-center rounded-control outline-none hover:bg-hover-row focus-visible:ring-2 focus-visible:ring-ring sm:size-9.5',
          className,
        )}
      >
        <Avatar name={user.name} src={user.avatarSrc} size="sm" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="gap-inline px-inline py-field flex items-center">
          <Avatar name={user.name} src={user.avatarSrc} size="md" aria-hidden="true" />
          <div className="flex min-w-0 flex-col">
            <span dir="auto" className="text-h5 text-text-primary truncate">
              {user.name}
            </span>
            {user.email ? (
              <span dir="ltr" className="text-b3 text-text-muted truncate text-start">
                {user.email}
              </span>
            ) : null}
          </div>
        </div>
        <DropdownMenuSeparator />
        {menu}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ShellAccountItems, ShellUserMenu };
export type { ShellAccountItemsProps, ShellUser, ShellUserMenuProps };
