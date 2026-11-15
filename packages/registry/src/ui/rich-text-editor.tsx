import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Input as FieldControl } from '@base-ui/react/input';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useId, useRef, type Ref } from 'react';
import {
  RichTextToolbar,
  type RichTextTool,
  type RichTextToolbarLabels,
} from '@/components/ui/rich-text-toolbar';
import { useLabels, useLocale, type Messages } from '@/lib/locale';
import { normalizeRichText, richTextLength } from '@/lib/rich-text';
import { cn } from '@/lib/utils';

const messages: Messages<keyof RichTextToolbarLabels | 'editor' | 'characters'> = {
  en: {
    editor: 'Rich text editor',
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
    invalidLink: 'Enter a valid web, email or phone link',
    characters: 'characters',
  },
  ar: {
    editor: 'محرر النص المنسق',
    toolbar: 'التنسيق',
    bold: 'غامق',
    italic: 'مائل',
    underline: 'تسطير',
    heading: 'عنوان',
    bulletList: 'قائمة نقطية',
    orderedList: 'قائمة مرقمة',
    alignStart: 'محاذاة إلى البداية',
    alignCenter: 'توسيط',
    alignEnd: 'محاذاة إلى النهاية',
    link: 'رابط',
    undo: 'تراجع',
    redo: 'إعادة',
    linkAddress: 'عنوان الرابط',
    applyLink: 'تطبيق',
    removeLink: 'إزالة الرابط',
    cancelLink: 'إلغاء',
    invalidLink: 'أدخل رابط ويب أو بريد أو هاتف صالحاً',
    characters: 'حرف',
  },
};

const ALL_TOOLS: readonly RichTextTool[] = [
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

const EXTENSIONS = [
  // Only what the toolbar can produce, so pasted HTML cannot smuggle in other blocks.
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: false,
    code: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    strike: false,
  }),
  // Logical alignment values keep the stored HTML correct in both directions.
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['start', 'center', 'end', 'justify'],
    defaultAlignment: null,
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    protocols: ['mailto', 'tel'],
    HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
  }),
];

/* Each block takes its own direction from its first strong character, so an
   English paragraph inside an Arabic document (and the reverse) reads right. */
const CONTENT_CLASSES = cn(
  '[&_.ProseMirror]:min-h-40 [&_.ProseMirror]:px-inline [&_.ProseMirror]:py-field [&_.ProseMirror]:outline-none',
  '[&_.ProseMirror_p]:[unicode-bidi:plaintext] [&_.ProseMirror_li]:[unicode-bidi:plaintext]',
  '[&_.ProseMirror_h2]:[unicode-bidi:plaintext] [&_.ProseMirror_h3]:[unicode-bidi:plaintext]',
  '[&_.ProseMirror_h2]:my-field [&_.ProseMirror_h2]:text-h3 [&_.ProseMirror_h3]:my-field [&_.ProseMirror_h3]:text-h4',
  '[&_.ProseMirror_p]:my-1.5 [&_.ProseMirror_p]:text-b1 [&_.ProseMirror_li]:text-b1',
  '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ul]:ps-6 [&_.ProseMirror_ol]:ps-6',
  '[&_.ProseMirror_a]:text-primary-text [&_.ProseMirror_a]:underline',
  '[&_.ProseMirror_strong]:font-semibold',
);

interface RichTextEditorProps {
  /** The document as HTML. An empty editor is the empty string, so `required` works. */
  value?: string;
  /** Initial HTML when uncontrolled. */
  defaultValue?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Which toolbar buttons to show, in the toolbar's fixed order. All by default. */
  tools?: readonly RichTextTool[];
  /** Shows a character counter under the editor. */
  showCount?: boolean;
  /** With `showCount`, the limit the counter compares against (display only). */
  maxLength?: number;
  /** Adds a hidden input carrying the HTML, so a plain `<form>` submits it. */
  name?: string;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

interface FieldWiring {
  id?: string;
  labelledBy?: string;
  describedBy?: string;
  invalid: boolean;
  disabled: boolean;
  ref?: Ref<HTMLElement>;
}

/**
 * Rich-text field on TipTap: bold, italic, underline, heading, lists,
 * alignment, links and undo/redo, with a value that is plain HTML. Content
 * follows the typed language per block; the toolbar follows the page
 * direction. Pass `aria-labelledby`/`aria-label` (or place it in a `Field`
 * with `aria-labelledby`) so the editing area has a name.
 */
function RichTextEditor(props: RichTextEditorProps) {
  return (
    // The Base UI control slot connects the editor to an enclosing `Field`
    // (label, description, error, disabled) without this file knowing about it.
    <FieldControl
      id={props.id}
      disabled={props.disabled}
      render={(fieldProps) => (
        <RichTextEditorImpl
          {...props}
          field={{
            id: fieldProps.id,
            labelledBy: fieldProps['aria-labelledby'],
            describedBy: fieldProps['aria-describedby'],
            invalid: fieldProps['aria-invalid'] === true || fieldProps['aria-invalid'] === 'true',
            disabled: 'disabled' in fieldProps && fieldProps.disabled === true,
            ref: fieldProps.ref,
          }}
        />
      )}
    />
  );
}

function RichTextEditorImpl({
  field,
  value,
  defaultValue = '',
  onChange,
  onBlur,
  placeholder,
  readOnly = false,
  disabled: disabledProp = false,
  invalid: invalidProp = false,
  name,
  tools = ALL_TOOLS,
  showCount = false,
  maxLength,
  id: idProp,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledByProp,
  'aria-describedby': ariaDescribedByProp,
  labels: overrides,
  className,
  ref,
}: RichTextEditorProps & { field: FieldWiring }) {
  const labels = useLabels(messages, overrides);
  const { direction } = useLocale();
  const countId = useId();
  const disabled = disabledProp || field.disabled;
  const invalid = invalidProp || field.invalid;
  const id = idProp ?? field.id;
  const ariaLabelledBy = ariaLabelledByProp ?? field.labelledBy;
  const ariaDescribedBy =
    [ariaDescribedByProp, field.describedBy].filter(Boolean).join(' ') || undefined;
  const editable = !readOnly && !disabled;
  const fieldRef = field.ref;
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      for (const target of [ref, fieldRef]) {
        if (typeof target === 'function') {
          target(node);
        } else if (target) {
          target.current = node;
        }
      }
    },
    [ref, fieldRef],
  );
  const describedBy = [ariaDescribedBy, showCount ? countId : undefined].filter(Boolean).join(' ');

  const attributes = {
    ...(id ? { id } : {}),
    role: 'textbox',
    'aria-multiline': 'true',
    ...(ariaLabel || !ariaLabelledBy ? { 'aria-label': ariaLabel ?? labels.editor } : {}),
    ...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : {}),
    ...(placeholder ? { 'aria-placeholder': placeholder } : {}),
    ...(readOnly ? { 'aria-readonly': 'true' } : {}),
    ...(disabled ? { 'aria-disabled': 'true' } : {}),
    ...(invalid ? { 'aria-invalid': 'true' } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
  };
  const attributesKey = JSON.stringify(attributes);

  // Handlers go through refs so the editor is created once and never rebuilt
  // (which would reset the document) when a parent re-renders with new callbacks.
  const onChangeRef = useRef(onChange);
  const onBlurRef = useRef(onBlur);
  useEffect(() => {
    onChangeRef.current = onChange;
    onBlurRef.current = onBlur;
  });

  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value ?? defaultValue,
    editable,
    // Render on mount so the toolbar and content are present without a second pass.
    immediatelyRender: true,
    editorProps: { attributes },
    onUpdate: ({ editor: current }) => {
      onChangeRef.current?.(normalizeRichText(current.getHTML()));
    },
    onBlur: () => {
      onBlurRef.current?.();
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Keyed by content, not identity: the object is rebuilt every render.
  useEffect(() => {
    editor?.setOptions({ editorProps: { attributes } });
  }, [editor, attributesKey]);

  // A value set from outside (form reset, loaded record) replaces the document;
  // typing already matches it, so it is left alone and the caret stays put.
  useEffect(() => {
    if (!editor || value === undefined) {
      return;
    }
    if (normalizeRichText(editor.getHTML()) !== normalizeRichText(value)) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      empty: current ? current.isEmpty : true,
      length: current ? richTextLength(current.getHTML()) : 0,
      html: current ? normalizeRichText(current.getHTML()) : '',
    }),
  });

  const overLimit = maxLength !== undefined && (state?.length ?? 0) > maxLength;
  const showToolbar = editable && tools.length > 0;

  return (
    <DirectionProvider direction={direction}>
      <div
        ref={setRoot}
        data-slot="rich-text-editor"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(
          'overflow-hidden rounded-control border border-stroke-strong bg-surface text-text-primary',
          'focus-within:border-primary-highlight focus-within:ring-2 focus-within:ring-ring/40',
          'data-[invalid]:border-danger data-[invalid]:ring-danger/30',
          'data-[disabled]:cursor-not-allowed data-[disabled]:bg-disabled-container data-[disabled]:text-text-inactive',
          readOnly && 'border-stroke bg-transparent',
          className,
        )}
      >
        {editor && showToolbar ? (
          <RichTextToolbar editor={editor} tools={tools} labels={labels} />
        ) : null}
        <div className="relative">
          {state?.empty && placeholder && editable ? (
            <span
              aria-hidden="true"
              className="start-inline top-field text-b1 text-text-muted pointer-events-none absolute mt-1.5"
            >
              {placeholder}
            </span>
          ) : null}
          {/* Empty: follow the UI direction (like Input); typed: the language decides. */}
          <EditorContent
            editor={editor}
            dir={state?.empty ? direction : 'auto'}
            className={CONTENT_CLASSES}
          />
        </div>
        {name ? <input type="hidden" name={name} value={state?.html ?? ''} /> : null}
        {showCount ? (
          <p
            id={countId}
            data-over-limit={overLimit || undefined}
            className="border-stroke px-inline text-b3 text-text-muted data-[over-limit]:text-danger flex justify-end gap-1 border-t py-1"
          >
            <span dir="ltr" className="tabular-nums">
              {maxLength === undefined ? state?.length : `${state?.length ?? 0} / ${maxLength}`}
            </span>{' '}
            <span>{labels.characters}</span>
          </p>
        ) : null}
      </div>
    </DirectionProvider>
  );
}

export { RichTextEditor };
export type { RichTextEditorProps };
