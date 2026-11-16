import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Heading {
  id: string;
  text: string;
  level: number;
}

/**
 * "On this page" table of contents. Headings (`h2`, `h3`) inside <main> are
 * collected after each render of the page; the visible one is highlighted.
 */
export function OnThisPage({ watch }: { watch: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const collect = () => {
      const found = [...document.querySelectorAll<HTMLElement>('main h2, main h3')]
        .filter((element) => element.id !== '')
        .map((element) => ({
          id: element.id,
          text: element.textContent ?? '',
          level: element.tagName === 'H2' ? 2 : 3,
        }));
      setHeadings(found);
    };
    const timer = setTimeout(collect, 250);
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      setTimeout(collect, 150);
    });
    const main = document.querySelector('main');
    if (main) {
      observer.observe(main, { childList: true, subtree: true });
    }
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [watch]);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) {
          setActive(visible.target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px' },
    );
    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) {
    return null;
  }
  return (
    <nav aria-label="On this page" className="text-start">
      <h2 className="text-label text-text-primary mb-2">On this page</h2>
      <ul className="border-stroke flex flex-col gap-1.5 border-s">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => {
                event.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                '-ms-px block border-s border-transparent ps-inline text-b3 text-text-muted hover:text-text-primary',
                heading.level === 3 && 'ps-card',
                active === heading.id && 'border-primary font-semibold text-text-primary',
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
