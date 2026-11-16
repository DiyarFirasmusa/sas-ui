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
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronsUpDownIcon, MoonIcon, SunIcon, UserIcon } from '@/components/ui/icons';
import { useSidebar } from '@/components/ui/sidebar';
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

interface ShellUser {
  name: string;
  email?: string;
  /** Image URL; initials show while it loads or when it is missing. */
  avatarSrc?: string;
}

interface ShellUserMenuProps {
  user: ShellUser;
  /** `sidebar` is a wide button with the name and email; `compact` is the avatar alone. */
  variant?: 'sidebar' | 'compact';
  onProfile?: () => void;
  onSignOut?: () => void;
  /** Language and theme sections appear only when their handler is given. */
  onLocaleChange?: (locale: Locale) => void;
  mode?: ColorMode;
  onModeChange?: (mode: ColorMode) => void;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  className?: string;
}

/**
 * Account menu: profile, language, theme and sign out. Sections whose handler
 * is missing are left out, so an app wires only what it supports. In a
 * collapsed sidebar the trigger shrinks to the avatar.
 */
function ShellUserMenu({
  user,
  variant = 'compact',
  onProfile,
  onSignOut,
  onLocaleChange,
  mode = 'system',
  onModeChange,
  labels: overrides,
  className,
}: ShellUserMenuProps) {
  const labels = useLabels(messages, overrides);
  const { locale } = useLocale();
  const { collapsed } = useSidebar();
  const wide = variant === 'sidebar' && !collapsed;
  const modeLabels: Record<ColorMode, string> = {
    light: labels.light,
    dark: labels.dark,
    system: labels.system,
  };
  const ModeIcon = mode === 'dark' ? MoonIcon : SunIcon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="shell-user-menu"
        aria-label={wide ? undefined : fillTemplate(labels.accountOf, { name: user.name })}
        className={cn(
          'rounded-control focus-visible:ring-ring flex min-w-0 items-center outline-none focus-visible:ring-2',
          wide
            ? 'gap-inline hover:bg-sidebar-accent min-h-12 w-full p-1.5 text-start'
            : 'hover:bg-hover-row size-11 justify-center sm:size-9.5',
          className,
        )}
      >
        <Avatar name={user.name} src={user.avatarSrc} size="sm" aria-hidden="true" />
        {wide ? (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span dir="auto" className="text-b1 truncate">
                {user.name}
              </span>
              {user.email ? (
                <span dir="ltr" className="text-b3 text-sidebar-foreground/70 truncate text-start">
                  {user.email}
                </span>
              ) : null}
            </span>
            <ChevronsUpDownIcon className="text-sidebar-foreground/70" />
          </>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={wide ? 'top' : 'bottom'} className="w-60">
        <div className="px-inline py-field gap-inline flex items-center">
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
            <DropdownMenuContent side="inline-end" align="start" sideOffset={2}>
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
            </DropdownMenuContent>
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
            <DropdownMenuContent side="inline-end" align="start" sideOffset={2}>
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
            </DropdownMenuContent>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ShellUserMenu };
export type { ShellUser, ShellUserMenuProps };
