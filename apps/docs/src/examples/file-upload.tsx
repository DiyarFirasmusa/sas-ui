import { useEffect, useState } from 'react';
import { Field } from '@/components/ui/field';
import { FileUpload, type FileUploadState } from '@/components/ui/file-upload';
import { fileKey } from '@/lib/file-validation';
import type { Example } from '../example-types';

const MB = 1024 * 1024;

/** Fakes an upload so the progress, done and error states can be seen. */
function SimulatedUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [states, setStates] = useState<Record<string, FileUploadState>>({});

  function handleChange(next: File[]) {
    setFiles(next);
    setStates((current) => {
      const updated: Record<string, FileUploadState> = {};
      for (const file of next) {
        const key = fileKey(file);
        updated[key] = current[key] ?? { status: 'uploading', progress: 0 };
      }
      return updated;
    });
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setStates((current) => {
        const updated = { ...current };
        for (const [key, state] of Object.entries(current)) {
          if (state.status !== 'uploading') {
            continue;
          }
          const progress = (state.progress ?? 0) + 20;
          if (progress < 100) {
            updated[key] = { status: 'uploading', progress };
          } else {
            updated[key] = key.includes('fail')
              ? { status: 'error', error: 'The server rejected this file' }
              : { status: 'done' };
          }
        }
        return updated;
      });
    }, 600);
    return () => clearInterval(timer);
  }, []);

  return (
    <Field label="Attachments" description='A file with "fail" in its name ends in an error'>
      <FileUpload
        multiple
        accept=".pdf,image/*"
        maxSize={5 * MB}
        maxFiles={5}
        value={files}
        onValueChange={handleChange}
        states={states}
      />
    </Field>
  );
}

export const examples: Example[] = [
  {
    title: 'Single file',
    render: () => (
      <Field label="Contract" description="PDF, up to 5 MB">
        <FileUpload accept=".pdf" maxSize={5 * MB} />
      </Field>
    ),
  },
  {
    title: 'Multiple files with simulated upload',
    render: () => <SimulatedUpload />,
  },
  {
    title: 'Image previews',
    render: () => (
      <Field label="Photos">
        <FileUpload multiple showPreview accept="image/*" maxSize={2 * MB} />
      </Field>
    ),
  },
  {
    title: 'Invalid',
    render: () => (
      <Field label="National ID" error="Upload a scan of your ID">
        <FileUpload accept="image/*,.pdf" />
      </Field>
    ),
  },
  {
    title: 'Disabled and read-only',
    render: () => (
      <div className="gap-row flex flex-col">
        <Field label="Locked">
          <FileUpload disabled />
        </Field>
        <Field label="Read-only">
          <FileUpload
            readOnly
            defaultValue={[new File(['x'], 'agreement.pdf', { type: 'application/pdf' })]}
          />
        </Field>
      </div>
    ),
  },
];
