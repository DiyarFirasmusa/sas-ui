import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Example } from '../example-types';

function Area({ children }: { children: string }) {
  return (
    <ContextMenuTrigger className="border-stroke-strong text-b1 text-text-muted flex h-32 w-72 items-center justify-center rounded-lg border border-dashed">
      {children}
    </ContextMenuTrigger>
  );
}

export const examples: Example[] = [
  {
    title: 'Default',
    description:
      'Right-click or long-press the area. Context menus are pointer-first, so every action here must also exist as a visible control.',
    render: () => (
      <ContextMenu>
        <Area>Right-click here</Area>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>File</ContextMenuLabel>
            <ContextMenuItem>Open</ContextMenuItem>
            <ContextMenuItem>Rename</ContextMenuItem>
            <ContextMenuCheckboxItem defaultChecked>Pinned</ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>Email</ContextMenuItem>
              <ContextMenuItem>Copy link</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem destructive>Delete</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ),
  },
  {
    title: 'Arabic (RTL)',
    render: () => (
      <div dir="rtl">
        <ContextMenu>
          <Area>انقر بزر الفأرة الأيمن هنا</Area>
          <ContextMenuContent>
            <ContextMenuItem>فتح</ContextMenuItem>
            <ContextMenuItem>إعادة تسمية</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem destructive>حذف</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    ),
  },
];
