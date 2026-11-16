import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icons';
import { DOC_SLUGS, type DocSlug } from '../use-hash-route';
import { DOCS } from './docs-content';

/** A prose docs page with previous / next links, like shadcn's docs. */
export function DocsPage({ slug }: { slug: DocSlug }) {
  const page = DOCS[slug];
  const index = DOC_SLUGS.indexOf(slug);
  const previous = index > 0 ? DOC_SLUGS[index - 1] : undefined;
  const next = DOC_SLUGS[index + 1];
  return (
    <article className="gap-field flex min-w-0 flex-col">
      <h1 className="text-h1 text-text-primary">{page.title}</h1>
      <p className="text-b1 text-text-secondary">{page.description}</p>
      <div className="gap-field pt-field flex flex-col">{page.body}</div>
      <nav
        aria-label="Pager"
        className="mt-card gap-field border-stroke pt-row flex justify-between border-t"
      >
        {previous ? (
          <a
            className="gap-field text-b1 text-primary-text inline-flex items-center hover:underline"
            href={`#/docs/${previous}`}
          >
            <ArrowLeftIcon /> {DOCS[previous].title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a
            className="gap-field text-b1 text-primary-text inline-flex items-center hover:underline"
            href={`#/docs/${next}`}
          >
            {DOCS[next].title} <ArrowRightIcon />
          </a>
        ) : null}
      </nav>
    </article>
  );
}
