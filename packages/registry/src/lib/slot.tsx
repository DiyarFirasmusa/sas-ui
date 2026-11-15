import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn } from '@/lib/utils';

interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

interface ChildProps {
  className?: string;
  style?: CSSProperties;
  ref?: Ref<HTMLElement>;
}

/**
 * Renders its single child with the slot's props merged in — the `asChild`
 * pattern, for wrapping a router `<Link>` in a button without a wrapper node.
 * Base UI components use their own `render` prop; Slot is for our wrappers.
 */
export function Slot({ children, className, style, ref, ...rest }: SlotProps) {
  const child = Children.toArray(children)[0];
  if (!isValidElement<ChildProps>(child)) {
    return null;
  }
  const element: ReactElement<ChildProps> = child;
  return cloneElement(element, {
    ...rest,
    ...element.props,
    className: cn(className, element.props.className),
    style: { ...style, ...element.props.style },
    ref: element.props.ref ?? ref,
  });
}
