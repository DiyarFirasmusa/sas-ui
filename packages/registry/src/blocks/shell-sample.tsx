import type { ShellNotification } from '@/components/blocks/shell-notifications';
import type { SearchItem } from '@/components/blocks/shell-search';
import type { ShellUser } from '@/components/blocks/shell-user-menu';
import {
  BuildingIcon,
  CalendarIcon,
  FileIcon,
  FolderIcon,
  HomeIcon,
  SettingsIcon,
  UserIcon,
} from '@/components/ui/icons';
import type { Locale } from '@/lib/locale';
import type { NavItem } from '@/lib/nav-utils';

/** Sample content for the shell blocks, written in both languages. Replace with your own data. */
interface ShellCopy {
  dashboard: string;
  projects: string;
  allProjects: string;
  archived: string;
  customers: string;
  invoices: string;
  calendar: string;
  settings: string;
  general: string;
  team: string;
  billing: string;
  workspaceLabel: string;
  workspaceName: string;
  status: string;
  userRole: string;
  userName: string;
  commands: string;
  newInvoice: string;
  inviteMember: string;
  notifications: readonly { id: string; title: string; description: string; time: string }[];
}

const COPY: Record<Locale, ShellCopy> = {
  en: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    allProjects: 'All projects',
    archived: 'Archived',
    customers: 'Customers',
    invoices: 'Invoices',
    calendar: 'Calendar',
    settings: 'Settings',
    general: 'General',
    team: 'Team',
    billing: 'Billing',
    workspaceLabel: 'Workspace',
    workspaceName: 'Northwind Trading',
    status: 'All systems operational',
    userRole: 'Operations manager',
    userName: 'Layla Hassan',
    commands: 'Actions',
    newInvoice: 'Create invoice',
    inviteMember: 'Invite a team member',
    notifications: [
      {
        id: 'n1',
        title: 'Invoice 1042 was paid',
        description: 'Northwind Trading paid in full.',
        time: '5 min ago',
      },
      {
        id: 'n2',
        title: 'New comment on Q4 plan',
        description: 'Omar left a note on the budget.',
        time: '1 hour ago',
      },
      {
        id: 'n3',
        title: 'Weekly report is ready',
        description: 'Revenue grew 12%.',
        time: 'Yesterday',
      },
    ],
  },
  ar: {
    dashboard: 'لوحة التحكم',
    projects: 'المشاريع',
    allProjects: 'كل المشاريع',
    archived: 'المؤرشفة',
    customers: 'العملاء',
    invoices: 'الفواتير',
    calendar: 'التقويم',
    settings: 'الإعدادات',
    general: 'عام',
    team: 'الفريق',
    billing: 'الفوترة',
    workspaceLabel: 'مساحة العمل',
    workspaceName: 'شركة الشمال للتجارة',
    status: 'كل الأنظمة تعمل بشكل طبيعي',
    userRole: 'مديرة العمليات',
    userName: 'ليلى حسن',
    commands: 'إجراءات',
    newInvoice: 'إنشاء فاتورة',
    inviteMember: 'دعوة عضو إلى الفريق',
    notifications: [
      {
        id: 'n1',
        title: 'تم دفع الفاتورة 1042',
        description: 'سددت شركة الشمال للتجارة المبلغ بالكامل.',
        time: 'قبل 5 دقائق',
      },
      {
        id: 'n2',
        title: 'تعليق جديد على خطة الربع الرابع',
        description: 'ترك عمر ملاحظة على الميزانية.',
        time: 'قبل ساعة',
      },
      { id: 'n3', title: 'التقرير الأسبوعي جاهز', description: 'نمت الإيرادات 12%.', time: 'أمس' },
    ],
  },
};

function sampleNav(locale: Locale): NavItem[] {
  const copy = COPY[locale];
  return [
    { id: 'dashboard', label: copy.dashboard, href: '/dashboard', icon: <HomeIcon />, exact: true },
    {
      id: 'projects',
      label: copy.projects,
      icon: <FolderIcon />,
      children: [
        { id: 'projects-all', label: copy.allProjects, href: '/projects' },
        { id: 'projects-archived', label: copy.archived, href: '/projects/archived' },
      ],
    },
    { id: 'customers', label: copy.customers, href: '/customers', icon: <UserIcon /> },
    { id: 'invoices', label: copy.invoices, href: '/invoices', icon: <FileIcon />, badge: 3 },
    { id: 'calendar', label: copy.calendar, href: '/calendar', icon: <CalendarIcon /> },
    {
      id: 'settings',
      label: copy.settings,
      icon: <SettingsIcon />,
      pinned: true,
      children: [
        { id: 'settings-general', label: copy.general, href: '/settings' },
        { id: 'settings-team', label: copy.team, href: '/settings/team' },
        { id: 'settings-billing', label: copy.billing, href: '/settings/billing' },
      ],
    },
  ];
}

function sampleUser(locale: Locale): ShellUser {
  return {
    name: COPY[locale].userName,
    email: 'layla@example.com',
    role: COPY[locale].userRole,
  };
}

/** The workspace block under the brand, and the status line of the footer. */
function sampleWorkspace(locale: Locale): { label: string; name: string; status: string } {
  const copy = COPY[locale];
  return { label: copy.workspaceLabel, name: copy.workspaceName, status: copy.status };
}

function sampleNotifications(locale: Locale): ShellNotification[] {
  return COPY[locale].notifications.map((item, index) => ({ ...item, read: index > 1 }));
}

/** Actions listed beside the pages in the palette. */
function sampleCommands(locale: Locale): SearchItem[] {
  const copy = COPY[locale];
  return [
    { id: 'new-invoice', label: copy.newInvoice, group: copy.commands, icon: <BuildingIcon /> },
    { id: 'invite-member', label: copy.inviteMember, group: copy.commands, icon: <UserIcon /> },
  ];
}

export { sampleCommands, sampleNav, sampleNotifications, sampleUser, sampleWorkspace };
