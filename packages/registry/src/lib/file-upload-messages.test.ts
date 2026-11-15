import { describe, expect, it } from 'vitest';
import { fileUploadMessages } from '@/lib/file-upload-messages';

describe('fileUploadMessages', () => {
  it('has the same keys in English and Arabic', () => {
    expect(Object.keys(fileUploadMessages.ar).sort()).toEqual(
      Object.keys(fileUploadMessages.en).sort(),
    );
  });

  it('keeps the same placeholders in both languages', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const [key, english] of Object.entries(fileUploadMessages.en)) {
      expect(
        placeholders(fileUploadMessages.ar[key as keyof typeof fileUploadMessages.ar]),
      ).toEqual(placeholders(english));
    }
  });
});
