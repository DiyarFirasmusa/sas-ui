import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePreviewUrl } from '@/hooks/use-preview-url';

const image = new File(['x'], 'a.png', { type: 'image/png' });
const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' });

const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');

function restore(name: 'createObjectURL' | 'revokeObjectURL', original?: PropertyDescriptor) {
  if (original) {
    Object.defineProperty(URL, name, original);
  } else {
    Reflect.deleteProperty(URL, name);
  }
}

afterEach(() => {
  restore('createObjectURL', originalCreate);
  restore('revokeObjectURL', originalRevoke);
});

function stubUrl() {
  const create = vi.fn(() => 'blob:preview');
  const revoke = vi.fn();
  URL.createObjectURL = create;
  URL.revokeObjectURL = revoke;
  return { create, revoke };
}

describe('usePreviewUrl', () => {
  it('creates an object URL for an image and revokes it on unmount', () => {
    const { create, revoke } = stubUrl();
    const { result, unmount } = renderHook(() => usePreviewUrl(image, true));
    expect(result.current).toBe('blob:preview');
    expect(create).toHaveBeenCalledWith(image);
    unmount();
    expect(revoke).toHaveBeenCalledWith('blob:preview');
  });

  it('returns null when disabled or for a non-image', () => {
    const { create } = stubUrl();
    expect(renderHook(() => usePreviewUrl(image, false)).result.current).toBeNull();
    expect(renderHook(() => usePreviewUrl(pdf, true)).result.current).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it('returns null when object URLs are unavailable', () => {
    Object.defineProperty(URL, 'createObjectURL', { value: undefined, configurable: true });
    expect(renderHook(() => usePreviewUrl(image, true)).result.current).toBeNull();
  });
});
