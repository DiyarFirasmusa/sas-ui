import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { isRichTextEmpty, sanitizeRichText } from '@/lib/rich-text';
import type { Example } from '../example-types';

function Controlled() {
  const [html, setHtml] = useState('<p>Dear team,</p><p>The quarterly review is on Sunday.</p>');
  return (
    <div className="gap-field flex w-full max-w-2xl flex-col">
      <RichTextEditor aria-label="Announcement" value={html} onChange={setHtml} />
      <p className="text-b3 text-text-muted" dir="ltr">
        value: <code>{html === '' ? "''" : html}</code>
      </p>
    </div>
  );
}

function Required() {
  const [html, setHtml] = useState('');
  const [touched, setTouched] = useState(false);
  const error = touched && isRichTextEmpty(html) ? 'The message is required' : undefined;
  return (
    <Field
      label="Message"
      description="Empty paragraphs count as empty."
      error={error}
      className="w-full max-w-2xl"
    >
      <RichTextEditor
        value={html}
        onChange={setHtml}
        onBlur={() => setTouched(true)}
        placeholder="Write your message…"
        showCount
        maxLength={500}
      />
    </Field>
  );
}

export const examples: Example[] = [
  {
    title: 'Default',
    description: 'The value is an HTML string; an empty editor reports an empty string.',
    wide: true,
    render: () => <Controlled />,
  },
  {
    title: 'Inside a Field, required, with count',
    description: 'Takes its label, description and invalid state from Field.',
    wide: true,
    render: () => <Required />,
  },
  {
    title: 'Arabic content',
    description: 'Each block follows its own language; alignment is stored as start/end.',
    wide: true,
    render: () => (
      <div className="w-full max-w-2xl">
        <RichTextEditor
          aria-label="Arabic note"
          defaultValue="<p>مرحباً بالفريق،</p><p>الاجتماع الفصلي يوم الأحد.</p><p>Remote link: https://meet.example.com</p>"
        />
      </div>
    ),
  },
  {
    title: 'Limited toolbar',
    render: () => (
      <div className="w-full max-w-xl">
        <RichTextEditor aria-label="Comment" tools={['bold', 'italic', 'link', 'undo', 'redo']} />
      </div>
    ),
  },
  {
    title: 'Invalid',
    render: () => (
      <div className="w-full max-w-xl">
        <RichTextEditor aria-label="Notes" invalid defaultValue="<p>Too short</p>" />
      </div>
    ),
  },
  {
    title: 'Disabled',
    render: () => (
      <div className="w-full max-w-xl">
        <RichTextEditor
          aria-label="Locked notes"
          disabled
          defaultValue="<p>This field is locked.</p>"
        />
      </div>
    ),
  },
  {
    title: 'Read only',
    description: 'No toolbar; use sanitizeRichText() to render stored HTML anywhere else.',
    render: () => (
      <div className="gap-row flex w-full max-w-xl flex-col">
        <RichTextEditor
          aria-label="Published notice"
          readOnly
          defaultValue="<h2>Notice</h2><p>Office closed on <strong>Friday</strong>.</p>"
        />
        <div
          className="border-stroke p-row text-b1 rounded-lg border"
          dangerouslySetInnerHTML={{
            __html: sanitizeRichText(
              '<p onclick="x()">Sanitised <em>output</em><script>alert(1)</script></p>',
            ),
          }}
        />
      </div>
    ),
  },
];
