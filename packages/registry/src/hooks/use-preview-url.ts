import { useEffect, useState } from 'react';
import { isImageFile } from '@/lib/file-validation';

/** Object URL for an image file's thumbnail, revoked when the file or flag changes. */
export function usePreviewUrl(file: File, enabled: boolean): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled || !isImageFile(file) || typeof URL.createObjectURL !== 'function') {
      setUrl(null);
      return;
    }
    const created = URL.createObjectURL(file);
    setUrl(created);
    return () => URL.revokeObjectURL(created);
  }, [file, enabled]);
  return url;
}
