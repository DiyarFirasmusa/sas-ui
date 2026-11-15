import { useMemo, useState } from 'react';
import { PdfViewer } from '@/components/ui/pdf-viewer';
import type { Example } from '../example-types';

/** A tiny one-page PDF, built in memory so the examples need no network. */
function useSamplePdf(): string {
  return useMemo(() => {
    const body =
      '%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 144]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n' +
      '4 0 obj<</Length 44>>stream\nBT /F1 24 Tf 40 70 Td (SAS UI sample) Tj ET\nendstream endobj\n' +
      '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF';
    return URL.createObjectURL(new Blob([body], { type: 'application/pdf' }));
  }, []);
}

function Sample() {
  const src = useSamplePdf();
  return (
    <PdfViewer
      src={src}
      title="Sample document"
      downloadName="sample.pdf"
      height={320}
      className="w-full max-w-2xl"
    />
  );
}

function Retry() {
  const [attempt, setAttempt] = useState(0);
  return (
    <PdfViewer
      src={`/missing-${attempt}.pdf`}
      title="Unavailable document"
      error
      onRetry={() => setAttempt((count) => count + 1)}
      height={240}
      className="w-full max-w-2xl"
    />
  );
}

export const examples: Example[] = [
  {
    title: 'Default',
    description:
      'The browser renders the PDF; the toolbar adds download, open in new tab and full screen.',
    wide: true,
    render: () => <Sample />,
  },
  {
    title: 'Aspect ratio',
    render: () => <PdfViewerRatio />,
  },
  {
    title: 'Error with retry and download',
    description: 'Shown when the load times out or `error` is set.',
    wide: true,
    render: () => <Retry />,
  },
  {
    title: 'Unsafe address',
    description: 'javascript: and HTML data: addresses are never framed.',
    render: () => (
      <PdfViewer
        src="javascript:alert(1)"
        title="Blocked"
        height={200}
        className="w-full max-w-md"
      />
    ),
  },
];

function PdfViewerRatio() {
  const src = useSamplePdf();
  return (
    <PdfViewer
      src={src}
      title="Portrait page"
      aspectRatio={0.75}
      hideToolbar
      className="w-full max-w-xs"
    />
  );
}
