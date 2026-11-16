import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icons';
import { useDocsSettings } from '../docs-settings';
import { useT } from '../i18n/use-t';
import { DOC_SLUGS, type DocSlug } from '../use-hash-route';
import { DOCS } from './docs-content';
import { DOCS_AR } from './docs-content-ar';

/** A prose docs page with previous / next links, like shadcn's docs. */
export function DocsPage({ slug }: { slug: DocSlug }) {
  const { locale } = useDocsSettings();
  const t = useT();
  const pageOf = (name: DocSlug) => (locale === 'ar' ? (DOCS_AR[name] ?? DOCS[name]) : DOCS[name]);
  const page = pageOf(slug);
  const index = DOC_SLUGS.indexOf(slug);
  const previous = index > 0 ? DOC_SLUGS[index - 1] : undefined;
  const next = DOC_SLUGS[index + 1];
  return (
    <article className="gap-field flex min-w-0 flex-col">
      <h1 className="text-h1 text-text-primary">{page.title}</h1>
      <p className="text-b1 text-text-secondary">{page.description}</p>
      <div className="gap-field pt-field flex flex-col">{page.body}</div>
      <nav
        aria-label={t('docs.pager')}
        className="mt-card gap-field border-stroke pt-row flex justify-between border-t"
      >
        {previous ? (
          <a
            className="gap-field text-b1 text-primary-text inline-flex items-center hover:underline"
            href={`#/docs/${previous}`}
          >
            <ArrowLeftIcon /> {pageOf(previous).title}
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a
            className="gap-field text-b1 text-primary-text inline-flex items-center hover:underline"
            href={`#/docs/${next}`}
          >
            {pageOf(next).title} <ArrowRightIcon />
          </a>
        ) : null}
      </nav>
    </article>
  );
}
