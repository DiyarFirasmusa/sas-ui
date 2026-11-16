import type { ReactElement, ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarRailTooltipProps {
  /** The name shown beside the control. */
  label: string;
  /** The focusable element that carries the tooltip; it keeps its own `aria-label`. */
  children: ReactNode;
  /** Wrapper element for the trigger. A span keeps links and buttons intact. */
  render?: ReactElement;
}

/**
 * Name tooltip for an icon-only control of the collapsed rail. It opens on the
 * inline-end side, so it points into the page in both directions, and on
 * keyboard focus as well as hover. A tooltip only supplements: the control
 * still needs its own accessible name.
 */
function SidebarRailTooltip({ label, children, render }: SidebarRailTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger render={render ?? <span className="flex" />}>{children}</TooltipTrigger>
      <TooltipContent side="inline-end">{label}</TooltipContent>
    </Tooltip>
  );
}

export { SidebarRailTooltip };
export type { SidebarRailTooltipProps };
