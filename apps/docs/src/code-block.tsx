import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, CopyIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Monospace block with a copy button; always left-to-right (code is Latin). */
export function CodeBlock({
  code,
  className,
  maxHeight = false,
}: {
  code: string;
  className?: string;
  maxHeight?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div dir="ltr" className={cn('group relative', className)}>
      <pre
        dir="ltr"
        className={cn(
          'overflow-auto rounded-lg border border-stroke bg-surface-dim p-inline pe-12 text-start font-mono text-b2 text-text-primary',
          maxHeight && 'max-h-96',
        )}
      >
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute end-2 top-2"
        aria-label={copied ? 'Copied' : 'Copy code'}
        onClick={async () => {
          setCopied(await copy(code));
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
    </div>
  );
}

/** One-line install command chip (the shadcn "npx shadcn add …" pill). */
export function CommandChip({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      dir="ltr"
      className="rounded-control border-stroke bg-surface px-inline text-b2 text-text-primary hover:bg-hover-row inline-flex h-9 max-w-full items-center gap-2 border font-mono"
      onClick={async () => {
        setCopied(await copy(command));
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={`Copy command ${command}`}
    >
      <span className="text-text-muted">$</span>
      <span className="truncate">{command}</span>
      {copied ? <CheckIcon className="text-success" /> : <CopyIcon className="text-text-muted" />}
    </button>
  );
}
