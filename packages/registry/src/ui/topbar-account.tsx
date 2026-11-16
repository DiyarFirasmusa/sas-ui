import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@/components/ui/icons';
import { topbarChip, useTopbarVariant } from '@/components/ui/topbar';
import { fillTemplate } from '@/lib/format-message';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<'accountOf'> = {
  en: { accountOf: 'Account menu for {name}' },
  ar: { accountOf: 'قائمة حساب {name}' },
};

interface TopbarAccountProps {
  name: string;
  /** Role (and unit) shown under the name; the name and role hide below `md`. */
  role?: string;
  /** Longer line in the menu header, e.g. "Warehouse manager • Main depot". */
  detail?: string;
  avatarSrc?: string;
  /** Menu entries: `DropdownMenuItem`s and separators. */
  children: ReactNode;
  label?: string;
  className?: string;
}

/**
 * The signed-in user in the top bar: a soft chip with the avatar, name and
 * role that opens the account menu (its header repeats the name). Pair it with
 * `ShellAccountItems` from the shell blocks, or pass your own entries.
 */
function TopbarAccount({
  name,
  role,
  detail,
  avatarSrc,
  children,
  label,
  className,
}: TopbarAccountProps) {
  const labels = useLabels(messages);
  const variant = useTopbarVariant();
  const hr = variant === 'hr';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-slot="topbar-account"
        aria-label={label ?? fillTemplate(labels.accountOf, { name })}
        className={cn(topbarChip(variant, 'account'), 'min-w-0 text-start', className)}
      >
        <Avatar
          name={name}
          src={avatarSrc}
          size="sm"
          className={hr ? 'rounded-md' : 'rounded-lg'}
        />
        <span className="flex min-w-0 flex-col leading-tight max-md:sr-only">
          <span dir="auto" className="text-button-2 truncate">
            {name}
          </span>
          {role ? (
            <span
              dir="auto"
              className={cn(
                'truncate text-b3',
                variant === 'sidebar' ? 'text-sidebar-foreground/70' : 'text-text-secondary',
              )}
            >
              {role}
            </span>
          ) : null}
        </span>
        <ChevronDownIcon
          className={cn(
            'max-md:hidden',
            variant === 'sidebar' ? 'text-sidebar-foreground/70' : 'text-text-secondary',
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-inline py-field flex flex-col gap-1">
            <span dir="auto" className="text-h4 text-text-primary">
              {name}
            </span>
            {(detail ?? role) ? (
              <span dir="auto" className="text-b3 text-text-secondary">
                {detail ?? role}
              </span>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { TopbarAccount };
export type { TopbarAccountProps };
