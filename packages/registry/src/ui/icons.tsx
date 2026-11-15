import type { ReactNode, SVGProps } from 'react';
import { cn } from '@/lib/utils';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

/**
 * Builds a 24px stroke icon. Decorative by default (aria-hidden); pass
 * `aria-label` to expose one. Direction-dependent glyphs (chevrons, arrows)
 * are mirrored in RTL by `mirror`.
 */
function createIcon(displayName: string, paths: ReactNode, mirror = false) {
  function Icon({ className, ...props }: IconProps) {
    const labelled = props['aria-label'] !== undefined;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={labelled ? undefined : true}
        role={labelled ? 'img' : undefined}
        focusable="false"
        className={cn('size-4 shrink-0', mirror && 'rtl:-scale-x-100', className)}
        {...props}
      >
        {paths}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const CheckIcon = createIcon('CheckIcon', <path d="M20 6 9 17l-5-5" />);
export const MinusIcon = createIcon('MinusIcon', <path d="M5 12h14" />);
export const PlusIcon = createIcon('PlusIcon', <path d="M5 12h14M12 5v14" />);
export const CloseIcon = createIcon('CloseIcon', <path d="M18 6 6 18M6 6l12 12" />);
export const ChevronDownIcon = createIcon('ChevronDownIcon', <path d="m6 9 6 6 6-6" />);
export const ChevronUpIcon = createIcon('ChevronUpIcon', <path d="m18 15-6-6-6 6" />);
export const ChevronRightIcon = createIcon('ChevronRightIcon', <path d="m9 18 6-6-6-6" />, true);
export const ChevronLeftIcon = createIcon('ChevronLeftIcon', <path d="m15 18-6-6 6-6" />, true);
export const ChevronsLeftIcon = createIcon(
  'ChevronsLeftIcon',
  <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />,
  true,
);
export const ChevronsRightIcon = createIcon(
  'ChevronsRightIcon',
  <path d="m6 17 5-5-5-5M13 17l5-5-5-5" />,
  true,
);
export const ChevronsUpDownIcon = createIcon(
  'ChevronsUpDownIcon',
  <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />,
);
export const ArrowUpIcon = createIcon('ArrowUpIcon', <path d="m5 12 7-7 7 7M12 19V5" />);
export const ArrowDownIcon = createIcon('ArrowDownIcon', <path d="m19 12-7 7-7-7M12 5v14" />);
export const ArrowRightIcon = createIcon(
  'ArrowRightIcon',
  <path d="M5 12h14m-7-7 7 7-7 7" />,
  true,
);
export const ArrowLeftIcon = createIcon('ArrowLeftIcon', <path d="M19 12H5m7-7-7 7 7 7" />, true);
export const SearchIcon = createIcon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>,
);
export const InfoIcon = createIcon(
  'InfoIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </>,
);
export const AlertTriangleIcon = createIcon(
  'AlertTriangleIcon',
  <>
    <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </>,
);
export const CheckCircleIcon = createIcon(
  'CheckCircleIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </>,
);
export const XCircleIcon = createIcon(
  'XCircleIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </>,
);
export const LoaderIcon = createIcon('LoaderIcon', <path d="M21 12a9 9 0 1 1-6.2-8.6" />);
export const CalendarIcon = createIcon(
  'CalendarIcon',
  <>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </>,
);
export const ClockIcon = createIcon(
  'ClockIcon',
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </>,
);
export const UploadIcon = createIcon(
  'UploadIcon',
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
);
export const DownloadIcon = createIcon(
  'DownloadIcon',
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
);
export const FileIcon = createIcon(
  'FileIcon',
  <>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z" />
    <path d="M14 2v6h6" />
  </>,
);
export const TrashIcon = createIcon(
  'TrashIcon',
  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />,
);
export const PencilIcon = createIcon(
  'PencilIcon',
  <path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
);
export const EyeIcon = createIcon(
  'EyeIcon',
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const EyeOffIcon = createIcon(
  'EyeOffIcon',
  <>
    <path d="M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A16 16 0 0 0 2 12s3.6 8 10 8a10 10 0 0 0 5.4-1.6" />
    <path d="m2 2 20 20M14.1 14.1a3 3 0 0 1-4.2-4.2" />
  </>,
);
export const MoreHorizontalIcon = createIcon(
  'MoreHorizontalIcon',
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </>,
);
export const MoreVerticalIcon = createIcon(
  'MoreVerticalIcon',
  <>
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </>,
);
export const FilterIcon = createIcon('FilterIcon', <path d="M22 3H2l8 9.5V19l4 2v-8.5Z" />);
export const MenuIcon = createIcon('MenuIcon', <path d="M4 6h16M4 12h16M4 18h16" />);
export const GripVerticalIcon = createIcon(
  'GripVerticalIcon',
  <>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </>,
);
export const CopyIcon = createIcon(
  'CopyIcon',
  <>
    <rect width="14" height="14" x="8" y="8" rx="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>,
);
export const ExternalLinkIcon = createIcon(
  'ExternalLinkIcon',
  <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />,
);
export const FolderIcon = createIcon(
  'FolderIcon',
  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
);
export const SunIcon = createIcon(
  'SunIcon',
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2m-7.1-17.1 1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
  </>,
);
export const MoonIcon = createIcon('MoonIcon', <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />);
export const HomeIcon = createIcon(
  'HomeIcon',
  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM9 22V12h6v10" />,
);
export const UserIcon = createIcon(
  'UserIcon',
  <>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>,
);
export const SettingsIcon = createIcon(
  'SettingsIcon',
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
  </>,
);
export const InboxIcon = createIcon(
  'InboxIcon',
  <path d="M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" />,
);
export const CircleIcon = createIcon('CircleIcon', <circle cx="12" cy="12" r="10" />);
export const DotIcon = createIcon(
  'DotIcon',
  <circle cx="12" cy="12" r="2.5" fill="currentColor" />,
);
export const SidebarIcon = createIcon(
  'SidebarIcon',
  <>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </>,
  true,
);
export const BuildingIcon = createIcon(
  'BuildingIcon',
  <>
    <rect width="16" height="20" x="4" y="2" rx="2" />
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
  </>,
);
