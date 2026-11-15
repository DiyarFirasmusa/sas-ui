import { Toolbar } from '@base-ui/react/toolbar';
import { useEditorState, type Editor } from '@tiptap/react';
import { Fragment, useId, useState, type ReactNode, type SVGProps } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { normalizeLinkUrl } from '@/lib/rich-text';
import { cn } from '@/lib/utils';

type RichTextTool =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'alignStart'
  | 'alignCenter'
  | 'alignEnd'
  | 'link'
  | 'undo'
  | 'redo';

type RichTextToolbarLabels = Record<
  | RichTextTool
  | 'toolbar'
  | 'linkAddress'
  | 'applyLink'
  | 'removeLink'
  | 'cancelLink'
  | 'invalidLink',
  string
>;

/** Tools in display order, grouped; a group with no enabled tool draws no divider. */
const TOOL_GROUPS: readonly (readonly RichTextTool[])[] = [
  ['bold', 'italic', 'underline'],
  ['heading'],
  ['bulletList', 'orderedList'],
  ['alignStart', 'alignCenter', 'alignEnd'],
  ['link'],
  ['undo', 'redo'],
];

function Glyph({
  children,
  mirror = false,
  ...props
}: SVGProps<SVGSVGElement> & { mirror?: boolean; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('size-4 shrink-0', mirror && 'rtl:-scale-x-100')}
      {...props}
    >
      {children}
    </svg>
  );
}

const ICONS: Record<RichTextTool, ReactNode> = {
  bold: (
    <Glyph>
      <path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" />
    </Glyph>
  ),
  italic: (
    <Glyph>
      <path d="M19 4h-9M14 20H5M15 4 9 20" />
    </Glyph>
  ),
  underline: (
    <Glyph>
      <path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" />
    </Glyph>
  ),
  heading: (
    <Glyph>
      <path d="M6 4v16M18 4v16M6 12h12" />
    </Glyph>
  ),
  bulletList: (
    <Glyph mirror>
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </Glyph>
  ),
  orderedList: (
    <Glyph mirror>
      <path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </Glyph>
  ),
  alignStart: (
    <Glyph mirror>
      <path d="M21 6H3M15 12H3M17 18H3" />
    </Glyph>
  ),
  alignCenter: (
    <Glyph>
      <path d="M21 6H3M17 12H7M19 18H5" />
    </Glyph>
  ),
  alignEnd: (
    <Glyph mirror>
      <path d="M21 6H3M21 12H9M21 18H7" />
    </Glyph>
  ),
  link: (
    <Glyph>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </Glyph>
  ),
  undo: (
    <Glyph mirror>
      <path d="M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8" />
    </Glyph>
  ),
  redo: (
    <Glyph mirror>
      <path d="M21 7v6h-6M21 13a9 9 0 1 1-3-7.7L21 8" />
    </Glyph>
  ),
};

function linkHrefOf(editor: Editor): string {
  const href: unknown = editor.getAttributes('link').href;
  return typeof href === 'string' ? href : '';
}

function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current.isActive('bold'),
      italic: current.isActive('italic'),
      underline: current.isActive('underline'),
      heading: current.isActive('heading', { level: 2 }),
      bulletList: current.isActive('bulletList'),
      orderedList: current.isActive('orderedList'),
      alignStart: current.isActive({ textAlign: 'start' }),
      alignCenter: current.isActive({ textAlign: 'center' }),
      alignEnd: current.isActive({ textAlign: 'end' }),
      link: current.isActive('link'),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
      linkHref: linkHrefOf(current),
    }),
  });
}

function runTool(editor: Editor, tool: RichTextTool): void {
  const chain = editor.chain().focus();
  switch (tool) {
    case 'bold':
      chain.toggleBold().run();
      break;
    case 'italic':
      chain.toggleItalic().run();
      break;
    case 'underline':
      chain.toggleUnderline().run();
      break;
    case 'heading':
      chain.toggleHeading({ level: 2 }).run();
      break;
    case 'bulletList':
      chain.toggleBulletList().run();
      break;
    case 'orderedList':
      chain.toggleOrderedList().run();
      break;
    case 'alignStart':
    case 'alignCenter':
    case 'alignEnd': {
      const alignment = tool === 'alignStart' ? 'start' : tool === 'alignCenter' ? 'center' : 'end';
      (editor.isActive({ textAlign: alignment })
        ? chain.unsetTextAlign()
        : chain.setTextAlign(alignment)
      ).run();
      break;
    }
    case 'undo':
      chain.undo().run();
      break;
    case 'redo':
      chain.redo().run();
      break;
    case 'link':
      break;
  }
}

interface LinkBarProps {
  editor: Editor;
  initialHref: string;
  active: boolean;
  labels: RichTextToolbarLabels;
  onClose: () => void;
}

/** Inline link editor shown under the toolbar: address field, apply, remove, cancel. */
function LinkBar({ editor, initialHref, active, labels, onClose }: LinkBarProps) {
  const [href, setHref] = useState(initialHref);
  const [invalid, setInvalid] = useState(false);
  const errorId = useId();

  function close() {
    onClose();
    editor.chain().focus().run();
  }

  function apply() {
    const target = normalizeLinkUrl(href);
    if (target === null) {
      setInvalid(true);
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: target }).run();
    close();
  }

  return (
    <div
      data-slot="rich-text-link-bar"
      className="gap-field border-stroke bg-surface-dim p-field flex flex-wrap items-center border-b"
    >
      <Input
        kind="latin"
        autoFocus
        aria-label={labels.linkAddress}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        placeholder="https://"
        value={href}
        className="h-8 min-w-48 flex-1"
        onChange={(event) => {
          setHref(event.target.value);
          setInvalid(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            apply();
          } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }}
      />
      <Button type="button" size="sm" onClick={apply}>
        {labels.applyLink}
      </Button>
      {active ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            close();
          }}
        >
          {labels.removeLink}
        </Button>
      ) : null}
      <Button type="button" size="sm" variant="ghost" onClick={close}>
        {labels.cancelLink}
      </Button>
      {invalid ? (
        <p id={errorId} role="alert" className="text-b3 text-danger w-full">
          {labels.invalidLink}
        </p>
      ) : null}
    </div>
  );
}

interface RichTextToolbarProps {
  editor: Editor;
  tools: readonly RichTextTool[];
  labels: RichTextToolbarLabels;
  disabled?: boolean;
}

/**
 * Formatting toolbar: toggle buttons with `aria-pressed`, arrow-key navigation
 * (one tab stop) and the order following the reading direction. Buttons keep
 * the editor's selection by not taking focus on press.
 */
function RichTextToolbar({ editor, tools, labels, disabled = false }: RichTextToolbarProps) {
  const state = useToolbarState(editor);
  const [linkOpen, setLinkOpen] = useState(false);
  const groups = TOOL_GROUPS.map((group) => group.filter((tool) => tools.includes(tool))).filter(
    (group) => group.length > 0,
  );

  return (
    <>
      <Toolbar.Root
        aria-label={labels.toolbar}
        data-slot="rich-text-toolbar"
        className="border-stroke bg-surface-dim flex flex-wrap items-center gap-1 border-b p-1"
      >
        {groups.map((group, index) => (
          <Fragment key={group.join()}>
            {index > 0 ? <Toolbar.Separator className="bg-stroke mx-1 h-5 w-px" /> : null}
            <Toolbar.Group className="flex items-center gap-1">
              {group.map((tool) => {
                const pressed =
                  tool === 'undo' || tool === 'redo'
                    ? undefined
                    : tool === 'link'
                      ? state.link || linkOpen
                      : state[tool];
                const unavailable =
                  (tool === 'undo' && !state.canUndo) || (tool === 'redo' && !state.canRedo);
                return (
                  <Toolbar.Button
                    key={tool}
                    aria-label={labels[tool]}
                    aria-pressed={pressed}
                    disabled={disabled || unavailable}
                    focusableWhenDisabled
                    data-tool={tool}
                    // Keeps the text selection in the editor while a toolbar button is pressed.
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      if (tool === 'link') {
                        setLinkOpen((open) => !open);
                      } else {
                        runTool(editor, tool);
                      }
                    }}
                    className={cn(
                      'inline-flex size-8 items-center justify-center rounded-md text-text-secondary outline-none transition-colors',
                      'hover:bg-hover-row focus-visible:ring-2 focus-visible:ring-ring',
                      'aria-pressed:bg-primary-light aria-pressed:text-primary-text',
                      'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                      'max-sm:size-11',
                    )}
                  >
                    {ICONS[tool]}
                  </Toolbar.Button>
                );
              })}
            </Toolbar.Group>
          </Fragment>
        ))}
      </Toolbar.Root>
      {linkOpen ? (
        <LinkBar
          editor={editor}
          initialHref={state.linkHref}
          active={state.link}
          labels={labels}
          onClose={() => {
            setLinkOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

export { RichTextToolbar };
export type { RichTextTool, RichTextToolbarLabels, RichTextToolbarProps };
