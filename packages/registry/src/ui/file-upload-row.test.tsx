import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileUploadRow, type FileUploadRowProps } from '@/components/ui/file-upload-row';
import { fileUploadMessages } from '@/lib/file-upload-messages';
import { expectNoA11yViolations } from '@/test/a11y';

const file = new File(['x'], 'report.pdf', { type: 'application/pdf' });
Object.defineProperty(file, 'size', { value: 2048 });

function Row(props: Partial<FileUploadRowProps>) {
  return (
    <ul>
      <FileUploadRow
        file={file}
        preview={false}
        locale="en"
        labels={fileUploadMessages.en}
        removable
        onRemove={() => {}}
        {...props}
      />
    </ul>
  );
}

describe('FileUploadRow', () => {
  it('shows the name, size and a remove button', async () => {
    const onRemove = vi.fn();
    render(<Row onRemove={onRemove} />);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText(/^2 kB$/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove report.pdf' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('hides the remove button when not removable', () => {
    render(<Row removable={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows determinate and indeterminate progress', () => {
    const { rerender } = render(<Row state={{ status: 'uploading', progress: 42.4 }} />);
    expect(
      screen.getByRole('progressbar', { name: 'Upload progress for report.pdf' }),
    ).toHaveAttribute('aria-valuenow', '42');
    expect(screen.getByText('Uploading')).toBeInTheDocument();
    rerender(<Row state={{ status: 'uploading' }} />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  });

  it('shows success and caller errors', () => {
    const { rerender } = render(<Row state={{ status: 'done' }} />);
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    rerender(<Row state={{ status: 'error', error: 'Server said no' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Server said no');
    rerender(<Row state={{ status: 'error' }} />);
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('renders a rejected row with its reason and a dismiss button', () => {
    render(<Row rejection="file-too-large" errorText="Too big" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Too big');
    expect(screen.getByRole('button', { name: 'Dismiss report.pdf' })).toBeInTheDocument();
    expect(document.querySelector('[data-status="error"]')).not.toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Row state={{ status: 'uploading', progress: 10 }} />);
    await expectNoA11yViolations(container);
  });
});
