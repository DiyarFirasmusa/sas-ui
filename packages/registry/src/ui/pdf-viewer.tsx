import { useEffect, useRef, useState, type CSSProperties, type SVGProps } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertTriangleIcon, DownloadIcon, ExternalLinkIcon } from '@/components/ui/icons';
import { useLabels, type Messages } from '@/lib/locale';
import { cn } from '@/lib/utils';

const messages: Messages<
  | 'download'
  | 'openInNewTab'
  | 'fullscreen'
  | 'exitFullscreen'
  | 'loading'
  | 'errorTitle'
  | 'errorDescription'
  | 'retry'
> = {
  en: {
    download: 'Download',
    openInNewTab: 'Open in new tab',
    fullscreen: 'Full screen',
    exitFullscreen: 'Exit full screen',
    loading: 'Loading document',
    errorTitle: 'The document could not be loaded',
    errorDescription: 'Try again, or download the file to open it on your device.',
    retry: 'Try again',
  },
  ar: {
    download: 'تنزيل',
    openInNewTab: 'فتح في تبويب جديد',
    fullscreen: 'ملء الشاشة',
    exitFullscreen: 'إنهاء ملء الشاشة',
    loading: 'جارٍ تحميل المستند',
    errorTitle: 'تعذر تحميل المستند',
    errorDescription: 'حاول مرة أخرى، أو نزّل الملف لفتحه على جهازك.',
    retry: 'إعادة المحاولة',
  },
};

type Phase = 'loading' | 'ready' | 'error';

interface PdfViewerProps {
  /** Address of the PDF: http(s), a blob URL, a PDF data URL or a relative path. */
  src: string;
  /** Accessible name of the frame and the toolbar heading. Required. */
  title: string;
  /** File name suggested by the download button. */
  downloadName?: string;
  /** Fixed frame height (CSS length or pixels). Ignored when `aspectRatio` is set. Default 70vh. */
  height?: CSSProperties['height'];
  /** Width / height of the frame, e.g. 0.75 for portrait A4. Takes precedence over `height`. */
  aspectRatio?: number;
  /** Hide the download / new tab / full screen toolbar. */
  hideToolbar?: boolean;
  /**
   * Forces the error state, e.g. after your own check of the file failed. Browsers do not
   * report a failed PDF load on an iframe, so this and `loadTimeout` are how errors surface.
   */
  error?: boolean;
  /** Called when Try again is pressed, before the frame reloads (e.g. to refresh a signed URL). */
  onRetry?: () => void;
  /** Milliseconds to wait for the frame to load before showing the error state. 0 disables. Default 30000. */
  loadTimeout?: number;
  onLoad?: () => void;
  onError?: () => void;
  labels?: Partial<Record<keyof (typeof messages)['en'], string>>;
  className?: string;
}

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'blob:']);

/**
 * A `javascript:` or HTML `data:` address in an iframe runs in this page's
 * origin, so only network, blob and PDF data URLs are framed.
 */
function isFrameableUrl(src: string): boolean {
  try {
    const url = new URL(src, globalThis.location?.href ?? 'http://localhost/');
    if (url.protocol === 'data:') {
      return /^data:application\/pdf[;,]/iu.test(src);
    }
    return SAFE_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

function ExpandIcon({ exit, ...props }: SVGProps<SVGSVGElement> & { exit: boolean }) {
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
      className="size-4 shrink-0"
      {...props}
    >
      {exit ? (
        <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
      ) : (
        <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
      )}
    </svg>
  );
}

function FrameSkeleton({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      data-slot="pdf-viewer-skeleton"
      className="gap-row bg-surface p-card absolute inset-0 flex flex-col"
    >
      {['w-2/3', 'w-full', 'w-5/6', 'w-full', 'w-1/2'].map((width, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn(
            'h-4 animate-pulse rounded-md bg-hover-row motion-reduce:animate-none',
            width,
          )}
        />
      ))}
      <div
        aria-hidden="true"
        className="bg-hover-row min-h-24 flex-1 animate-pulse rounded-md motion-reduce:animate-none"
      />
    </div>
  );
}

/**
 * PDF frame: the browser's own viewer in an iframe with a small toolbar
 * (download, open in new tab, full screen), a loading skeleton until the
 * frame reports `load`, and an error state offering retry and download. No
 * PDF library: pages, zoom and search come from the browser.
 */
function PdfViewer({
  src,
  title,
  downloadName,
  height = '70vh',
  aspectRatio,
  hideToolbar = false,
  error = false,
  loadTimeout = 30_000,
  onLoad,
  onError,
  onRetry,
  labels: overrides,
  className,
}: PdfViewerProps) {
  const labels = useLabels(messages, overrides);
  const frameable = isFrameableUrl(src);
  const [loadPhase, setPhase] = useState<Phase>(frameable ? 'loading' : 'error');
  const phase: Phase = error ? 'error' : loadPhase;
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Callbacks are read at call time so an inline handler cannot restart the timeout.
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  // A new address starts over; the same address after an error starts over via retry().
  useEffect(() => {
    setPhase(frameable ? 'loading' : 'error');
  }, [src, frameable]);

  useEffect(() => {
    if (phase !== 'loading' || loadTimeout <= 0) {
      return;
    }
    const timer = setTimeout(() => {
      setPhase('error');
      onErrorRef.current?.();
    }, loadTimeout);
    return () => {
      clearTimeout(timer);
    };
  }, [phase, loadTimeout, attempt]);

  // Full screen is the real Fullscreen API when the browser has it and a fixed
  // overlay otherwise; either way Escape and the toggle leave it.
  useEffect(() => {
    const root = rootRef.current;
    if (!expanded || !root) {
      return;
    }
    if (typeof root.requestFullscreen === 'function') {
      root.requestFullscreen().catch(() => {
        // The overlay styling already fills the viewport; nothing else to do.
      });
    }
    const onFullscreenChange = () => {
      if (document.fullscreenElement === null) {
        setExpanded(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeyDown);
      if (document.fullscreenElement === root) {
        document.exitFullscreen().catch(() => {
          // Already left (the user pressed Escape); nothing to undo.
        });
      }
    };
  }, [expanded]);

  function retry() {
    onRetry?.();
    setAttempt((count) => count + 1);
    setPhase(frameable ? 'loading' : 'error');
  }

  const frameStyle: CSSProperties = expanded
    ? {}
    : aspectRatio === undefined
      ? { height }
      : { aspectRatio: String(aspectRatio) };
  const linkClasses = buttonVariants({ variant: 'ghost', size: 'sm' });
  const textClasses = 'max-sm:sr-only';

  return (
    <div
      ref={rootRef}
      data-slot="pdf-viewer"
      data-expanded={expanded || undefined}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-stroke bg-surface',
        expanded && 'fixed inset-0 z-50 rounded-none',
        className,
      )}
    >
      {hideToolbar ? null : (
        <div
          data-slot="pdf-viewer-toolbar"
          className="gap-field border-stroke bg-surface-dim px-inline py-field flex items-center border-b"
        >
          <span dir="auto" className="text-label text-text-primary min-w-0 flex-1 truncate">
            {title}
          </span>
          {frameable ? (
            <>
              <a
                href={src}
                download={downloadName ?? ''}
                className={cn(linkClasses, 'max-sm:min-h-11')}
              >
                <DownloadIcon />
                <span className={textClasses}>{labels.download}</span>
              </a>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(linkClasses, 'max-sm:min-h-11')}
              >
                <ExternalLinkIcon />
                <span className={textClasses}>{labels.openInNewTab}</span>
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={expanded}
                className="max-sm:min-h-11"
                onClick={() => {
                  setExpanded((open) => !open);
                }}
              >
                <ExpandIcon exit={expanded} />
                <span className={textClasses}>
                  {expanded ? labels.exitFullscreen : labels.fullscreen}
                </span>
              </Button>
            </>
          ) : null}
        </div>
      )}
      <div
        style={frameStyle}
        aria-busy={phase === 'loading' || undefined}
        className={cn('relative min-h-0 bg-surface-dim', expanded && 'flex-1')}
      >
        {phase !== 'error' && frameable ? (
          <iframe
            key={attempt}
            src={src}
            title={title}
            referrerPolicy="no-referrer"
            className="size-full border-0"
            onLoad={() => {
              setPhase('ready');
              onLoad?.();
            }}
          />
        ) : null}
        {phase === 'loading' ? <FrameSkeleton label={labels.loading} /> : null}
        {phase === 'error' ? (
          <div
            role="alert"
            data-slot="pdf-viewer-error"
            className="gap-row bg-surface p-card absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            <AlertTriangleIcon className="text-danger size-8" />
            <div className="flex flex-col gap-1">
              <p className="text-h5 text-text-primary">{labels.errorTitle}</p>
              <p className="text-b2 text-text-secondary">{labels.errorDescription}</p>
            </div>
            <div className="gap-field flex flex-wrap justify-center">
              {frameable ? (
                <Button type="button" onClick={retry}>
                  {labels.retry}
                </Button>
              ) : null}
              {frameable ? (
                <a
                  href={src}
                  download={downloadName ?? ''}
                  className={buttonVariants({ variant: 'outline' })}
                >
                  <DownloadIcon />
                  {labels.download}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { PdfViewer };
export type { PdfViewerProps };
