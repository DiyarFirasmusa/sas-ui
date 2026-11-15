import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has stopped changing for `delay` ms. Typing in a
 * search box updates the input immediately while the server request waits for
 * a pause. A `delay` of 0 or less passes the value straight through.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return undefined;
    }
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return delay <= 0 ? value : debounced;
}
