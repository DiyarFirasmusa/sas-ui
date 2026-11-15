import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  type ResizablePanelGroupProps,
} from '@/components/ui/resizable';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

function Example(props: Partial<ResizablePanelGroupProps>) {
  return (
    <ResizablePanelGroup direction="horizontal" {...props}>
      <ResizablePanel defaultSize={40} minSize={20} maxSize={70}>
        Sidebar
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel>Content</ResizablePanel>
    </ResizablePanelGroup>
  );
}

function rect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('Resizable', () => {
  it('lays panels out by their default sizes and exposes a separator', () => {
    render(<Example />);
    const handle = screen.getByRole('separator', { name: 'Resize panels' });
    expect(handle).toHaveAttribute('aria-valuenow', '40');
    expect(handle).toHaveAttribute('aria-valuemin', '20');
    expect(handle).toHaveAttribute('aria-valuemax', '70');
    expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle).toHaveAttribute('aria-controls', screen.getByText('Sidebar').id);
    expect(screen.getByText('Sidebar')).toHaveStyle({ flexGrow: '40' });
    expect(screen.getByText('Content')).toHaveStyle({ flexGrow: '60' });
  });

  it('uses a horizontal separator for a vertical group', () => {
    render(
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50}>Top</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Bottom</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('resizes with the arrow keys and reports the layout', async () => {
    const onLayout = vi.fn();
    render(<Example onLayout={onLayout} />);
    const handle = screen.getByRole('separator');
    handle.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '45');
    expect(onLayout).toHaveBeenLastCalledWith([45, 55]);
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(handle).toHaveAttribute('aria-valuenow', '35');
    expect(screen.getByText('Content')).toHaveStyle({ flexGrow: '65' });
  });

  it('takes a bigger step with Shift and honours keyboardStep', async () => {
    render(<Example keyboardStep={2} />);
    const handle = screen.getByRole('separator');
    handle.focus();
    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(handle).toHaveAttribute('aria-valuenow', '48');
  });

  it('snaps to the limits with Home and End and never passes them', async () => {
    render(<Example />);
    const handle = screen.getByRole('separator');
    handle.focus();
    await userEvent.keyboard('{End}');
    expect(handle).toHaveAttribute('aria-valuenow', '70');
    await userEvent.keyboard('{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '70');
    await userEvent.keyboard('{Home}');
    expect(handle).toHaveAttribute('aria-valuenow', '20');
  });

  it('ignores keys that are not for it', async () => {
    render(<Example />);
    const handle = screen.getByRole('separator');
    handle.focus();
    await userEvent.keyboard('{ArrowUp}a');
    expect(handle).toHaveAttribute('aria-valuenow', '40');
  });

  it('uses up/down for vertical groups', async () => {
    render(
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50}>Top</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Bottom</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole('separator');
    handle.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(handle).toHaveAttribute('aria-valuenow', '55');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(handle).toHaveAttribute('aria-valuenow', '45');
  });

  it('resizes three panels independently through their own handles', async () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30}>A</ResizablePanel>
        <ResizableHandle label="First" />
        <ResizablePanel defaultSize={40}>B</ResizablePanel>
        <ResizableHandle label="Second" />
        <ResizablePanel defaultSize={30}>C</ResizablePanel>
      </ResizablePanelGroup>,
    );
    screen.getByRole('separator', { name: 'Second' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('separator', { name: 'Second' })).toHaveAttribute(
      'aria-valuenow',
      '45',
    );
    expect(screen.getByRole('separator', { name: 'First' })).toHaveAttribute('aria-valuenow', '30');
    expect(screen.getByText('C')).toHaveStyle({ flexGrow: '25' });
  });

  it('resizes by dragging the handle', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(1000, 500));
    render(<Example />);
    const handle = screen.getByRole('separator');
    await userEvent.pointer([
      {
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientX: 400, clientY: 0 },
      },
      { coords: { clientX: 500, clientY: 0 } },
    ]);
    expect(handle).toHaveAttribute('aria-valuenow', '50');
    await userEvent.pointer({
      target: handle,
      coords: { clientX: 900, clientY: 0 },
    });
    expect(handle).toHaveAttribute('aria-valuenow', '70');
    await userEvent.pointer({
      target: handle,
      coords: { clientX: 450, clientY: 0 },
    });
    expect(handle).toHaveAttribute('aria-valuenow', '45');
    fireEvent.pointerUp(handle);
    await userEvent.pointer({
      target: handle,
      coords: { clientX: 100, clientY: 0 },
    });
    expect(handle).toHaveAttribute('aria-valuenow', '45');
  });

  it('mirrors keys and drag direction in RTL', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect(1000, 500));
    renderWithLocale(<Example />, { locale: 'ar' });
    const handle = screen.getByRole('separator', { name: 'تغيير حجم اللوحات' });
    expect(screen.getByText('Sidebar').parentElement).toHaveAttribute('dir', 'rtl');
    handle.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(handle).toHaveAttribute('aria-valuenow', '45');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(handle).toHaveAttribute('aria-valuenow', '35');

    await userEvent.pointer([
      {
        keys: '[MouseLeft>]',
        target: handle,
        coords: { clientX: 600, clientY: 0 },
      },
      { coords: { clientX: 500, clientY: 0 } },
    ]);
    // Dragging left grows the first panel, which sits on the right.
    expect(handle).toHaveAttribute('aria-valuenow', '45');
    fireEvent.pointerUp(handle);
  });

  it('lets dir override the locale', () => {
    renderWithLocale(<Example dir="ltr" />, { locale: 'ar' });
    expect(screen.getByText('Sidebar').parentElement).toHaveAttribute('dir', 'ltr');
  });

  it('accepts a custom handle label', () => {
    render(
      <ResizablePanelGroup>
        <ResizablePanel>A</ResizablePanel>
        <ResizableHandle label="Resize sidebar" />
        <ResizablePanel>B</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole('separator', { name: 'Resize sidebar' })).toBeInTheDocument();
  });

  it('throws a clear error outside a group', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ResizableHandle />)).toThrow(/ResizablePanelGroup/);
  });

  it('has no axe violations', async () => {
    render(<Example />);
    await expectNoA11yViolations();
  });
});
