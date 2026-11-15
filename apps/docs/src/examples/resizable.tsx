import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import type { Example } from '../example-types';

function Pane({ children }: { children: string }) {
  return (
    <div className="p-row text-b1 text-text-secondary flex h-full items-center justify-center">
      {children}
    </div>
  );
}

export const examples: Example[] = [
  {
    title: 'Horizontal',
    description:
      'Drag the handle, or focus it and use the arrow keys (Shift for bigger steps, Home/End for the limits). In RTL the first panel sits on the right and the keys mirror.',
    wide: true,
    render: () => (
      <ResizablePanelGroup
        direction="horizontal"
        className="border-stroke h-48 max-w-2xl rounded-lg border"
      >
        <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
          <Pane>Sidebar</Pane>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <Pane>Content</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    ),
  },
  {
    title: 'Vertical',
    render: () => (
      <ResizablePanelGroup
        direction="vertical"
        className="border-stroke h-64 max-w-md rounded-lg border"
      >
        <ResizablePanel defaultSize={60}>
          <Pane>Editor</Pane>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel minSize={15}>
          <Pane>Console</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    ),
  },
  {
    title: 'Three panels',
    wide: true,
    render: () => (
      <ResizablePanelGroup
        direction="horizontal"
        className="border-stroke h-40 max-w-2xl rounded-lg border"
      >
        <ResizablePanel defaultSize={25}>
          <Pane>Navigation</Pane>
        </ResizablePanel>
        <ResizableHandle label="Resize navigation" />
        <ResizablePanel defaultSize={50}>
          <Pane>Main</Pane>
        </ResizablePanel>
        <ResizableHandle label="Resize details" />
        <ResizablePanel defaultSize={25}>
          <Pane>Details</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    ),
  },
  {
    title: 'Arabic (RTL)',
    render: () => (
      <ResizablePanelGroup dir="rtl" className="border-stroke h-40 max-w-md rounded-lg border">
        <ResizablePanel defaultSize={35} minSize={20}>
          <Pane>القائمة</Pane>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel>
          <Pane>المحتوى</Pane>
        </ResizablePanel>
      </ResizablePanelGroup>
    ),
  },
];
