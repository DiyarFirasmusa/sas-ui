import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from '@/components/ui/field';
import { FileUpload, type FileUploadState } from '@/components/ui/file-upload';
import { fileKey } from '@/lib/file-validation';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderWithLocale } from '@/test/render';

const ARABIC_INDIC = /[٠-٩۰-۹]/;

function makeFile(name: string, size = 1024, type = 'application/pdf', lastModified = 1): File {
  const file = new File(['x'], name, { type, lastModified });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

function fileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) {
    throw new Error('no file input');
  }
  return input;
}

function dropzone(): HTMLElement {
  const zone = document.querySelector<HTMLElement>('[data-slot="file-upload-dropzone"]');
  if (!zone) {
    throw new Error('no dropzone');
  }
  return zone;
}

function drop(files: File[]) {
  fireEvent.drop(dropzone(), { dataTransfer: { files } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FileUpload', () => {
  it('renders a dropzone button with hints', () => {
    renderWithLocale(<FileUpload multiple maxSize={5 * 1024 * 1024} maxFiles={3} />);
    const zone = dropzone();
    expect(zone).toHaveTextContent('Drop files here, or click to browse');
    expect(zone).toHaveTextContent('Up to 5 MB per file');
    expect(zone).toHaveTextContent('Up to 3 files');
    expect(zone.tagName).toBe('BUTTON');
  });

  it('uses single-file wording without multiple', () => {
    renderWithLocale(<FileUpload />);
    expect(screen.getByRole('button', { name: /Drop a file here/ })).toBeInTheDocument();
  });

  it('opens the native picker from the dropzone, with Enter and Space too', async () => {
    const { container } = renderWithLocale(<FileUpload />);
    const click = vi.spyOn(fileInput(container), 'click');
    await userEvent.click(dropzone());
    expect(click).toHaveBeenCalledTimes(1);
    dropzone().focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(click).toHaveBeenCalledTimes(3);
  });

  it('passes accept and multiple to the native input', () => {
    const { container } = renderWithLocale(
      <FileUpload accept="image/*,.pdf" multiple name="docs" />,
    );
    const input = fileInput(container);
    expect(input).toHaveAttribute('accept', 'image/*,.pdf');
    expect(input).toHaveAttribute('name', 'docs');
    expect(input.multiple).toBe(true);
  });

  describe('adding files', () => {
    it('adds browsed files to the list and reports them', async () => {
      const onValueChange = vi.fn();
      const { container } = renderWithLocale(<FileUpload multiple onValueChange={onValueChange} />);
      const a = makeFile('a.pdf', 2048);
      const b = makeFile('b.pdf', 1536);
      await userEvent.upload(fileInput(container), [a, b]);
      expect(onValueChange).toHaveBeenCalledWith([a, b]);
      const list = screen.getByRole('list', { name: 'Selected files' });
      expect(within(list).getAllByRole('listitem')).toHaveLength(2);
      expect(list).toHaveTextContent('a.pdf');
      expect(list).toHaveTextContent('2 kB');
      expect(list).toHaveTextContent('1.5 kB');
    });

    it('adds dropped files and shows the dragging state', () => {
      const onValueChange = vi.fn();
      renderWithLocale(<FileUpload multiple onValueChange={onValueChange} />);
      const zone = dropzone();
      fireEvent.dragEnter(zone, { dataTransfer: { files: [] } });
      expect(zone).toHaveAttribute('data-dragging');
      expect(zone).toHaveTextContent('Release to add');
      fireEvent.dragLeave(zone, { relatedTarget: document.body });
      expect(zone).not.toHaveAttribute('data-dragging');
      fireEvent.dragOver(zone, { dataTransfer: { files: [] } });
      expect(zone).toHaveAttribute('data-dragging');
      const file = makeFile('dropped.pdf');
      drop([file]);
      expect(zone).not.toHaveAttribute('data-dragging');
      expect(onValueChange).toHaveBeenCalledWith([file]);
    });

    it('replaces the file in single mode', async () => {
      const { container } = renderWithLocale(<FileUpload />);
      await userEvent.upload(fileInput(container), makeFile('first.pdf'));
      await userEvent.upload(
        fileInput(container),
        makeFile('second.pdf', 10, 'application/pdf', 2),
      );
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(1);
      expect(items[0]).toHaveTextContent('second.pdf');
    });

    it('appends in multiple mode and works controlled', async () => {
      function Harness() {
        const [files, setFiles] = useState<File[]>([]);
        return <FileUpload multiple value={files} onValueChange={setFiles} />;
      }
      const { container } = renderWithLocale(<Harness />);
      await userEvent.upload(fileInput(container), makeFile('a.pdf'));
      await userEvent.upload(fileInput(container), makeFile('b.pdf'));
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('removes a file with its remove button', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(
        <FileUpload
          multiple
          defaultValue={[makeFile('a.pdf'), makeFile('b.pdf')]}
          onValueChange={onValueChange}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
      expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
      expect(onValueChange.mock.calls[0]?.[0].map((file: File) => file.name)).toEqual(['b.pdf']);
    });
  });

  describe('validation', () => {
    it('rejects files over maxSize with a per-file message', async () => {
      const onFilesRejected = vi.fn();
      const onValueChange = vi.fn();
      const { container } = renderWithLocale(
        <FileUpload
          multiple
          maxSize={1024 * 1024}
          onFilesRejected={onFilesRejected}
          onValueChange={onValueChange}
        />,
      );
      const ok = makeFile('ok.pdf', 100);
      const big = makeFile('big.pdf', 3 * 1024 * 1024);
      await userEvent.upload(fileInput(container), [ok, big]);
      expect(onValueChange).toHaveBeenCalledWith([ok]);
      expect(onFilesRejected).toHaveBeenCalledWith([{ file: big, code: 'file-too-large' }]);
      const rejected = screen.getByRole('list', {
        name: 'Files that were not added',
      });
      expect(rejected).toHaveTextContent('big.pdf');
      expect(within(rejected).getByRole('alert')).toHaveTextContent('The file is larger than 1 MB');
    });

    it('rejects wrong types dropped onto the zone', () => {
      const onValueChange = vi.fn();
      renderWithLocale(<FileUpload accept="image/*" onValueChange={onValueChange} />);
      drop([makeFile('notes.txt', 10, 'text/plain')]);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('This file type is not allowed');
    });

    it('rejects too-small files', () => {
      renderWithLocale(<FileUpload minSize={2048} />);
      drop([makeFile('tiny.pdf', 10)]);
      expect(screen.getByRole('alert')).toHaveTextContent('The file is smaller than 2 kB');
    });

    it('enforces maxFiles and duplicates', async () => {
      const { container } = renderWithLocale(<FileUpload multiple maxFiles={2} />);
      await userEvent.upload(fileInput(container), [makeFile('a.pdf'), makeFile('b.pdf', 5)]);
      await userEvent.upload(fileInput(container), makeFile('c.pdf', 7));
      expect(screen.getAllByRole('listitem')).toHaveLength(3); // 2 files + 1 rejection row
      expect(screen.getByRole('alert')).toHaveTextContent('No more files can be added (limit 2)');
      await userEvent.click(screen.getByRole('button', { name: 'Dismiss c.pdf' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      drop([makeFile('a.pdf')]);
      expect(screen.getByRole('alert')).toHaveTextContent('This file was already added');
    });

    it('clears old errors when the next batch is clean', async () => {
      const { container } = renderWithLocale(<FileUpload accept=".pdf" />);
      drop([makeFile('x.txt', 10, 'text/plain')]);
      expect(screen.getByRole('alert')).toBeInTheDocument();
      await userEvent.upload(fileInput(container), makeFile('good.pdf'));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('rejects extra files in single mode', async () => {
      const onValueChange = vi.fn();
      renderWithLocale(<FileUpload onValueChange={onValueChange} />);
      const first = makeFile('a.pdf');
      drop([first, makeFile('b.pdf', 2)]);
      expect(onValueChange).toHaveBeenCalledWith([first]);
      expect(screen.getByRole('alert')).toHaveTextContent('limit 1');
    });
  });

  describe('upload states', () => {
    it('shows progress, success and error states supplied by the caller', () => {
      const uploading = makeFile('up.pdf');
      const done = makeFile('done.pdf', 10);
      const failed = makeFile('bad.pdf', 20);
      const states: Record<string, FileUploadState> = {
        [fileKey(uploading)]: { status: 'uploading', progress: 42.4 },
        [fileKey(done)]: { status: 'done' },
        [fileKey(failed)]: { status: 'error', error: 'Server said no' },
      };
      renderWithLocale(
        <FileUpload multiple defaultValue={[uploading, done, failed]} states={states} />,
      );
      const bar = screen.getByRole('progressbar', {
        name: 'Upload progress for up.pdf',
      });
      expect(bar).toHaveAttribute('aria-valuenow', '42');
      expect(bar.firstElementChild).toHaveStyle({ width: '42.4%' });
      const items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Uploading');
      expect(items[1]).toHaveTextContent('Uploaded');
      expect(items[2]).toHaveTextContent('Server said no');
      expect(items[2]).toHaveAttribute('data-status', 'error');
    });

    it('shows an indeterminate bar without progress and a generic failure text', () => {
      const a = makeFile('a.pdf');
      const b = makeFile('b.pdf', 5);
      renderWithLocale(
        <FileUpload
          multiple
          defaultValue={[a, b]}
          states={{
            [fileKey(a)]: { status: 'uploading' },
            [fileKey(b)]: { status: 'error' },
          }}
        />,
      );
      expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
      expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('Upload failed');
    });

    it('still lets the user remove an uploading file (cancel)', async () => {
      const file = makeFile('a.pdf');
      renderWithLocale(
        <FileUpload
          defaultValue={[file]}
          states={{ [fileKey(file)]: { status: 'uploading', progress: 10 } }}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('image preview', () => {
    it('shows a thumbnail for images and revokes it on unmount', () => {
      const create = vi.fn(() => 'blob:preview');
      const revoke = vi.fn();
      vi.stubGlobal(
        'URL',
        Object.assign(URL, {
          createObjectURL: create,
          revokeObjectURL: revoke,
        }),
      );
      const { container, unmount } = renderWithLocale(
        <FileUpload showPreview defaultValue={[makeFile('p.png', 100, 'image/png')]} />,
      );
      expect(container.querySelector('img')).toHaveAttribute('src', 'blob:preview');
      unmount();
      expect(revoke).toHaveBeenCalledWith('blob:preview');
      vi.unstubAllGlobals();
    });

    it('does not preview without showPreview or for non-images', () => {
      const create = vi.fn(() => 'blob:preview');
      vi.stubGlobal(
        'URL',
        Object.assign(URL, {
          createObjectURL: create,
          revokeObjectURL: vi.fn(),
        }),
      );
      const { container } = renderWithLocale(
        <FileUpload multiple defaultValue={[makeFile('p.png', 100, 'image/png')]} />,
      );
      expect(container.querySelector('img')).toBeNull();
      renderWithLocale(<FileUpload showPreview defaultValue={[makeFile('d.pdf')]} />);
      expect(create).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });
  });

  describe('states and forms', () => {
    it('is inert when disabled', async () => {
      const onValueChange = vi.fn();
      const { container } = renderWithLocale(<FileUpload disabled onValueChange={onValueChange} />);
      expect(dropzone()).toBeDisabled();
      expect(fileInput(container)).toBeDisabled();
      drop([makeFile('a.pdf')]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('shows files but blocks changes when read-only', async () => {
      const onValueChange = vi.fn();
      const { container } = renderWithLocale(
        <FileUpload readOnly defaultValue={[makeFile('a.pdf')]} onValueChange={onValueChange} />,
      );
      expect(screen.queryByRole('button', { name: 'Remove a.pdf' })).not.toBeInTheDocument();
      expect(dropzone()).toHaveAttribute('aria-disabled', 'true');
      const click = vi.spyOn(fileInput(container), 'click');
      await userEvent.click(dropzone());
      expect(click).not.toHaveBeenCalled();
      drop([makeFile('b.pdf', 2)]);
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it('marks invalid and required', () => {
      renderWithLocale(<FileUpload invalid required />);
      expect(dropzone()).toHaveAttribute('aria-invalid', 'true');
      expect(dropzone()).toHaveAttribute('aria-required', 'true');
    });

    it('forwards ref and onBlur to the dropzone', () => {
      const ref = createRef<HTMLButtonElement>();
      const onBlur = vi.fn();
      renderWithLocale(<FileUpload ref={ref} onBlur={onBlur} />);
      expect(ref.current).toBe(dropzone());
      ref.current?.focus();
      ref.current?.blur();
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('is named by its Field label and linked to hints and errors', () => {
      renderWithLocale(
        <Field label="Attachments" description="PDF only" error="At least one file">
          <FileUpload maxSize={1024 * 1024} />
        </Field>,
      );
      const zone = screen.getByRole('button', { name: /Attachments/ });
      expect(zone).toHaveAccessibleName('Attachments Drop a file here, or click to browse');
      expect(zone).toHaveAttribute('aria-invalid', 'true');
      expect(zone).toHaveAccessibleDescription(
        /PDF only At least one file Up to 1 MB per file|Up to 1 MB per file/,
      );
    });

    it('works with react-hook-form', async () => {
      const seen: File[][] = [];
      function Form() {
        const { control, watch } = useForm<{ docs: File[] }>({
          defaultValues: { docs: [] },
        });
        seen.push(watch('docs'));
        return (
          <Controller
            control={control}
            name="docs"
            render={({ field }) => (
              <FileUpload
                aria-label="Docs"
                multiple
                ref={field.ref}
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        );
      }
      const { container } = render(<Form />);
      const file = makeFile('form.pdf');
      await userEvent.upload(fileInput(container), file);
      expect(seen.at(-1)).toEqual([file]);
    });
  });

  describe('Arabic / RTL', () => {
    it('localises the dropzone, hints and errors with Latin digits', () => {
      renderWithLocale(
        <FileUpload multiple maxSize={5 * 1024 * 1024} maxFiles={3} accept="image/*" />,
        { locale: 'ar' },
      );
      const zone = screen.getByRole('button', { name: /انقر للاستعراض/ });
      expect(zone).toHaveTextContent('أفلت الملفات هنا، أو انقر للاستعراض');
      expect(zone.textContent).toContain('5');
      expect(zone.textContent).toContain('م.ب');
      expect(ARABIC_INDIC.test(zone.textContent ?? '')).toBe(false);
      fireEvent.drop(zone, {
        dataTransfer: { files: [makeFile('doc.txt', 10, 'text/plain')] },
      });
      expect(screen.getByRole('alert')).toHaveTextContent('نوع هذا الملف غير مسموح');
    });

    it('localises list labels and file sizes, keeping Arabic names bidi-safe', async () => {
      renderWithLocale(<FileUpload multiple defaultValue={[makeFile('تقرير.pdf', 1536)]} />, {
        locale: 'ar',
      });
      const list = screen.getByRole('list', { name: 'الملفات المختارة' });
      expect(list).toHaveTextContent('1.5');
      expect(ARABIC_INDIC.test(list.textContent ?? '')).toBe(false);
      expect(within(list).getByText('تقرير.pdf')).toHaveAttribute('dir', 'auto');
      expect(screen.getByRole('button', { name: 'إزالة تقرير.pdf' })).toBeInTheDocument();
    });

    it('localises upload states', () => {
      const file = makeFile('a.pdf');
      renderWithLocale(
        <FileUpload
          defaultValue={[file]}
          states={{ [fileKey(file)]: { status: 'uploading', progress: 5 } }}
        />,
        { locale: 'ar' },
      );
      expect(screen.getByRole('progressbar', { name: 'تقدم رفع a.pdf' })).toBeInTheDocument();
      expect(screen.getByText('جارٍ الرفع')).toBeInTheDocument();
    });

    it('lets labels be overridden', () => {
      renderWithLocale(<FileUpload labels={{ dropSingle: 'Choose a file' }} />);
      expect(screen.getByRole('button', { name: 'Choose a file' })).toBeInTheDocument();
    });
  });

  it('has no axe violations (empty, with files in every state, in a Field)', async () => {
    const a = makeFile('a.pdf');
    const b = makeFile('b.pdf', 5);
    const c = makeFile('c.pdf', 6);
    const { container } = renderWithLocale(
      <Field label="Attachments" description="PDF only">
        <FileUpload
          multiple
          accept=".pdf"
          defaultValue={[a, b, c]}
          states={{
            [fileKey(a)]: { status: 'uploading', progress: 30 },
            [fileKey(b)]: { status: 'done' },
            [fileKey(c)]: { status: 'error', error: 'Failed' },
          }}
        />
      </Field>,
    );
    drop([makeFile('x.txt', 5, 'text/plain')]);
    await expectNoA11yViolations(container);
  });
});
