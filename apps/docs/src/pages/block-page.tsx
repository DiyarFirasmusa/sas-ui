import { Badge } from '@/components/ui/badge';
import { findItem } from '../catalog';
import { BlockView } from './block-view';

/** A single block, full width, with its source below. */
export function BlockPage({ name }: { name: string }) {
  const block = findItem(name);
  if (!block) {
    return <p className="text-b1">No block called “{name}”.</p>;
  }
  return (
    <article className="gap-card mx-auto flex max-w-6xl flex-col">
      <header className="gap-field flex flex-col">
        <p className="text-b3 text-text-muted">
          <a href="#/blocks" className="hover:text-text-primary">
            Blocks
          </a>
        </p>
        <div className="gap-field flex flex-wrap items-center">
          <h1 dir="auto" className="text-h1 text-text-primary">
            {block.title}
          </h1>
          <Badge tone="purple">block</Badge>
        </div>
      </header>
      <BlockView block={block} height={760} />
    </article>
  );
}
