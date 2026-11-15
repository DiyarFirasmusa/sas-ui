import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { GripVerticalIcon } from '@/components/ui/icons';
import { useLabels, useLocale, type Direction, type Messages } from '@/lib/locale';
import {
  initialSizes,
  keyboardDelta,
  pixelsToPercent,
  resizePanels,
  resizeRange,
  type Orientation,
  type PanelConstraints,
} from '@/lib/resizable-math';
import { cn } from '@/lib/utils';

const messages: Messages<'resize'> = {
  en: { resize: 'Resize panels' },
  ar: { resize: 'تغيير حجم اللوحات' },
};

const DEFAULT_MIN_SIZE = 10;

interface GroupContextValue {
  orientation: Orientation;
  rtl: boolean;
  sizes: number[];
  constraints: PanelConstraints[];
  keyboardStep: number;
  panelId: (index: number) => string;
  groupRef: React.RefObject<HTMLDivElement | null>;
  commit: (sizes: number[]) => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);
/** Position of the panel (or, for a handle, the panel before it) in the group. */
const IndexContext = createContext(0);

function useGroup(): GroupContextValue {
  const group = useContext(GroupContext);
  if (!group) {
    throw new Error('ResizablePanel and ResizableHandle must be used inside ResizablePanelGroup');
  }
  return group;
}

interface ResizablePanelGroupProps extends React.ComponentProps<'div'> {
  direction?: Orientation;
  /** Text direction. Horizontal groups lay out and resize mirrored in `rtl`. Defaults to the locale's. */
  dir?: Direction;
  /** Arrow-key step in %. Shift multiplies it by 4. Default 5. */
  keyboardStep?: number;
  /** Called with the new sizes (%, in panel order) after every resize. */
  onLayout?: (sizes: number[]) => void;
}

interface PanelEntry {
  defaultSize: number | undefined;
  constraints: PanelConstraints;
}

function readPanel(child: ReactNode): PanelEntry | null {
  if (isValidElement<ResizablePanelProps>(child) && child.type === ResizablePanel) {
    return {
      defaultSize: child.props.defaultSize,
      constraints: {
        minSize: child.props.minSize ?? DEFAULT_MIN_SIZE,
        maxSize: child.props.maxSize ?? 100,
      },
    };
  }
  return null;
}

/**
 * Resizable panels, sized in %. Panels and handles must be direct children:
 * panel, handle, panel, handle, panel. Sizes live in the group; read them
 * with `onLayout` if you need to persist them.
 */
function ResizablePanelGroup({
  direction = 'horizontal',
  dir,
  keyboardStep = 5,
  onLayout,
  className,
  children,
  ...props
}: ResizablePanelGroupProps) {
  const locale = useLocale();
  const textDirection = dir ?? locale.direction;
  const baseId = useId();
  const groupRef = useRef<HTMLDivElement>(null);
  const [stored, setStored] = useState<number[] | null>(null);

  const nodes = Children.toArray(children);
  const panels = nodes.map(readPanel).filter((entry) => entry !== null);
  const constraints = panels.map((entry) => entry.constraints);
  const sizes =
    stored && stored.length === panels.length
      ? stored
      : initialSizes(
          panels.map((entry) => entry.defaultSize),
          constraints,
        );

  const commit = useCallback(
    (next: number[]) => {
      setStored(next);
      onLayout?.(next);
    },
    [onLayout],
  );

  let panelIndex = -1;
  const indexed = nodes.map((node, position) => {
    if (readPanel(node)) {
      panelIndex += 1;
    }
    return (
      <IndexContext key={isValidElement(node) && node.key !== null ? node.key : position} value={Math.max(panelIndex, 0)}>
        {node}
      </IndexContext>
    );
  });

  const value: GroupContextValue = {
    orientation: direction,
    rtl: textDirection === 'rtl',
    sizes,
    constraints,
    keyboardStep,
    panelId: (index) => `${baseId}-panel-${index}`,
    groupRef,
    commit,
  };

  return (
    <GroupContext value={value}>
      <div
        ref={groupRef}
        data-slot="resizable-panel-group"
        data-direction={direction}
        dir={textDirection}
        className={cn('flex size-full data-[direction=vertical]:flex-col', className)}
        {...props}
      >
        {indexed}
      </div>
    </GroupContext>
  );
}

interface ResizablePanelProps extends React.ComponentProps<'div'> {
  /** Starting size in %. Panels without one share the remaining space. */
  defaultSize?: number;
  /** Smallest size in %. Default 10. */
  minSize?: number;
  /** Largest size in %. Default 100. */
  maxSize?: number;
}

// defaultSize/minSize/maxSize are read by the group from this element's props;
// they are pulled out here only so they do not reach the DOM.
function ResizablePanel({
  defaultSize: _defaultSize,
  minSize: _minSize,
  maxSize: _maxSize,
  className,
  style,
  id,
  ...props
}: ResizablePanelProps) {
  const group = useGroup();
  const index = useContext(IndexContext);
  const size = group.sizes[index] ?? 0;
  return (
    <div
      data-slot="resizable-panel"
      id={id ?? group.panelId(index)}
      className={cn('min-h-0 min-w-0 overflow-hidden', className)}
      style={{ flexGrow: size, flexShrink: 1, flexBasis: 0, ...style }}
      {...props}
    />
  );
}

interface ResizableHandleProps extends Omit<React.ComponentProps<'div'>, 'role' | 'children'> {
  /** Show a grip so the handle is discoverable. */
  withHandle?: boolean;
  /** Accessible name; defaults to "Resize panels". */
  label?: string;
}

interface DragState {
  start: number;
  startSizes: number[];
}

/** Separator between two panels: drag it, or focus it and use the arrow keys, Home and End. */
function ResizableHandle({ withHandle = false, label, className, ...props }: ResizableHandleProps) {
  const group = useGroup();
  const index = useContext(IndexContext);
  const labels = useLabels(messages, label ? { resize: label } : undefined);
  const drag = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState(false);
  const horizontal = group.orientation === 'horizontal';
  const range = resizeRange(group.sizes, index, group.constraints);

  function pointerPosition(event: React.PointerEvent): number {
    return horizontal ? event.clientX : event.clientY;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { start: pointerPosition(event), startSizes: group.sizes };
    setDragging(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const rect = group.groupRef.current?.getBoundingClientRect();
    if (!state || !rect) {
      return;
    }
    const delta = pixelsToPercent(
      pointerPosition(event) - state.start,
      horizontal ? rect.width : rect.height,
      group.orientation,
      group.rtl,
    );
    // Always from the sizes at pointer-down, so hitting a limit and coming
    // back does not drift.
    group.commit(resizePanels(state.startSizes, index, delta, group.constraints));
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
    setDragging(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? group.keyboardStep * 4 : group.keyboardStep;
    const delta = keyboardDelta(event.key, group.orientation, group.rtl, step);
    if (delta === null) {
      return;
    }
    event.preventDefault();
    group.commit(resizePanels(group.sizes, index, delta, group.constraints));
  }

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={labels.resize}
      aria-orientation={horizontal ? 'vertical' : 'horizontal'}
      aria-valuenow={Math.round(group.sizes[index] ?? 0)}
      aria-valuemin={Math.round(range.min)}
      aria-valuemax={Math.round(range.max)}
      aria-controls={group.panelId(index)}
      data-slot="resizable-handle"
      data-dragging={dragging ? '' : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={cn(
        'relative flex shrink-0 touch-none items-center justify-center bg-stroke outline-none select-none',
        'transition-colors motion-reduce:transition-none hover:bg-primary focus-visible:bg-primary data-[dragging]:bg-primary',
        "after:absolute after:content-['']",
        horizontal
          ? 'w-px cursor-col-resize after:inset-y-0 after:-inset-x-1.5'
          : 'h-px w-full cursor-row-resize after:inset-x-0 after:-inset-y-1.5',
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <span
          aria-hidden="true"
          className="z-10 flex h-5 w-3.5 items-center justify-center rounded-sm border border-stroke bg-surface text-text-muted"
        >
          <GripVerticalIcon className={cn('size-3', !horizontal && 'rotate-90')} />
        </span>
      ) : null}
    </div>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
export type { ResizableHandleProps, ResizablePanelGroupProps, ResizablePanelProps };
