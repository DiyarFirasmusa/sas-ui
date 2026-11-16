import { useEffect, useState } from 'react';
import { loadExamples } from '../catalog';
import type { Example } from '../example-types';

/** A block alone on the page, no docs chrome — the content of the block iframe. */
export function PreviewPage({ name }: { name: string }) {
  const [examples, setExamples] = useState<Example[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadExamples(name).then((module) => {
      if (!cancelled) {
        setExamples(module?.examples ?? []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [name]);
  if (examples === null) {
    return null;
  }
  const example = examples[0];
  return (
    <div
      className={`bg-background text-foreground min-h-screen ${example?.fullBleed === true ? '' : 'p-row md:p-card'}`}
    >
      {example?.render()}
    </div>
  );
}
