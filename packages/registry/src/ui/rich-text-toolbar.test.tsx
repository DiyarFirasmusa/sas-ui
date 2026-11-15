import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  RichTextToolbar,
  type RichTextTool,
  type RichTextToolbarLabels,
} from '@/components/ui/rich-text-toolbar';
import { expectNoA11yViolations } from '@/test/a11y';

const labels: RichTextToolbarLabels = {
  toolbar: 'Formatting',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  heading: 'Heading',
  bulletList: 'Bulleted list',
  orderedList: 'Numbered list',
  alignStart: 'Align to start',
  alignCenter: 'Center',
  alignEnd: 'Align to end',
  link: 'Link',
  undo: 'Undo',
  redo: 'Redo',
  linkAddress: 'Link address',
  applyLink: 'Apply',
  removeLink: 'Remove link',
  cancelLink: 'Cancel',
  invalidLink: 'Enter a valid link',
};

const ALL: RichTextTool[] = [
  'bold',
  'italic',
  'underline',
  'heading',
  'bulletList',
  'orderedList',
  'alignStart',
  'alignCenter',
  'alignEnd',
  'link',
  'undo',
  'redo',
];

function Harness({
  tools = ALL,
  disabled = false,
}: {
  tools?: readonly RichTextTool[];
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['start', 'center', 'end'],
      }),
    ],
    content: '<p>Hello</p>',
    immediatelyRender: true,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Body',
      },
    },
  });
  if (!editor) {
    return null;
  }
  return (
    <>
      <RichTextToolbar editor={editor} tools={tools} labels={labels} disabled={disabled} />
      <EditorContent editor={editor} />
    </>
  );
}

describe('RichTextToolbar', () => {
  beforeAll(() => {
    document.elementFromPoint = () => null;
    document.createRange = () => {
      const range = new Range();
      range.getBoundingClientRect = () => new DOMRect();
      range.getClientRects = () => ({
        item: () => null,
        length: 0,
        [Symbol.iterator]: [][Symbol.iterator],
      });
      return range;
    };
  });

  it('is a labelled toolbar of toggle buttons', () => {
    render(<Harness />);
    const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
    expect(within(toolbar).getAllByRole('button')).toHaveLength(ALL.length);
    expect(within(toolbar).getByRole('button', { name: 'Bold' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    // Undo/redo are actions, not toggles.
    expect(within(toolbar).getByRole('button', { name: 'Undo' })).not.toHaveAttribute(
      'aria-pressed',
    );
  });

  it('shows only the requested tools and no empty group dividers', () => {
    render(<Harness tools={['bold', 'undo']} />);
    const toolbar = screen.getByRole('toolbar');
    expect(
      within(toolbar)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Bold', 'Undo']);
    expect(within(toolbar).getAllByRole('separator')).toHaveLength(1);
  });

  it('toggles a mark and reflects it in aria-pressed', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.keyboard('{Control>}a{/Control}');
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
    });
    expect(screen.getByRole('textbox').innerHTML).toContain('<strong>Hello</strong>');
  });

  it('does not take focus from the editor when pressed', async () => {
    render(<Harness />);
    const editable = screen.getByRole('textbox');
    await userEvent.click(editable);
    await userEvent.click(screen.getByRole('button', { name: 'Italic' }));
    expect(editable).toHaveFocus();
  });

  it('disables every tool but keeps them focusable', async () => {
    render(<Harness disabled />);
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(bold);
    expect(bold).toHaveAttribute('aria-pressed', 'false');
  });

  it('opens the link bar from the Link button and toggles it closed', async () => {
    render(<Harness />);
    const link = screen.getByRole('button', { name: 'Link' });
    await userEvent.click(link);
    expect(link).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('textbox', { name: 'Link address' })).toHaveFocus();
    await userEvent.click(link);
    expect(screen.queryByRole('textbox', { name: 'Link address' })).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    render(<Harness />);
    await expectNoA11yViolations();
  });
});
