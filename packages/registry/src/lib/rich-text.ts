/**
 * Pure helpers for the HTML the rich-text editor produces and consumes.
 * The editor's value is an HTML string; these keep it honest: an editor with
 * nothing in it is '' (so `required` validation works), stored HTML can be
 * sanitised before it is rendered, and links are limited to safe protocols.
 */

/** Tags whose presence means the document has content even without text. */
const CONTENT_TAGS = /<(img|table|hr|video|iframe)\b/iu;

/** An empty block as TipTap and browsers emit it: `<p></p>`, `<p><br></p>`, `<p>&nbsp;</p>`. */
const EMPTY_PARAGRAPH = /<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/giu;
const LEADING_EMPTY = /^(?:\s|<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+/iu;
const TRAILING_EMPTY = /(?:\s|<p(?:\s[^>]*)?>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>)+$/iu;

function textOf(html: string): string {
  return html
    .replaceAll(/<[^>]*>/gu, '')
    .replaceAll('&nbsp;', ' ')
    .trim();
}

/** True when the HTML has no visible text and no image/table/rule. An empty paragraph is empty. */
export function isRichTextEmpty(html: string | null | undefined): boolean {
  if (!html) {
    return true;
  }
  if (CONTENT_TAGS.test(html)) {
    return false;
  }
  return textOf(html) === '';
}

/**
 * Canonical value for forms: '' when the document is empty, otherwise the HTML
 * with blank paragraphs removed from its start and end (blank lines in the
 * middle are the author's spacing and stay).
 */
export function normalizeRichText(html: string | null | undefined): string {
  if (isRichTextEmpty(html) || !html) {
    return '';
  }
  return html.trim().replace(LEADING_EMPTY, '').replace(TRAILING_EMPTY, '');
}

/** Removes every blank paragraph, including those between blocks. */
export function stripEmptyParagraphs(html: string): string {
  return html.replaceAll(EMPTY_PARAGRAPH, '');
}

/** The text of the HTML on one line, e.g. for a table cell preview. */
export function richTextToPlain(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  return html
    .replaceAll(/<\/(p|h[1-6]|li|tr|blockquote)>/giu, ' ')
    .replaceAll(/<br\s*\/?>/giu, ' ')
    .replaceAll(/<[^>]*>/gu, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll(/\s+/gu, ' ')
    .trim();
}

/** Characters of visible text (the number a character counter shows). */
export function richTextLength(html: string | null | undefined): number {
  return [...richTextToPlain(html)].length;
}

const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Turns what a user typed into a link target, or null when it is not allowed.
 * `example.com/x` becomes `https://example.com/x`; `javascript:` and `data:`
 * URLs are refused.
 */
export function normalizeLinkUrl(input: string): string | null {
  const value = input.trim();
  if (value === '') {
    return null;
  }
  const hasScheme = /^[a-z][a-z0-9+.-]*:/iu.test(value);
  const candidate = hasScheme ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? candidate : null;
  } catch {
    return null;
  }
}

const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre', 'blockquote',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'a',
]);
/** Elements dropped together with everything inside them. */
const DROPPED_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript']);
const ALIGNMENTS = new Set(['left', 'right', 'center', 'justify']);

function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function cleanNode(node: Node, output: Node, document: Document): void {
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      output.appendChild(document.createTextNode(child.textContent ?? ''));
      return;
    }
    if (!(child instanceof Element)) {
      return;
    }
    const tag = child.tagName.toLowerCase();
    if (DROPPED_TAGS.has(tag)) {
      return;
    }
    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown wrapper: keep its text and allowed descendants, lose the tag.
      cleanNode(child, output, document);
      return;
    }
    const clean = document.createElement(tag);
    if (tag === 'a') {
      const href = normalizeLinkUrl(child.getAttribute('href') ?? '');
      if (href !== null) {
        clean.setAttribute('href', href);
        clean.setAttribute('target', '_blank');
        clean.setAttribute('rel', 'noopener noreferrer');
      }
    }
    const align = /text-align:\s*(\w+)/iu.exec(child.getAttribute('style') ?? '')?.[1]?.toLowerCase();
    if (align !== undefined && ALIGNMENTS.has(align) && /^(p|h[1-6]|li)$/u.test(tag)) {
      clean.setAttribute('style', `text-align: ${align}`);
    }
    cleanNode(child, clean, document);
    output.appendChild(clean);
  });
}

/**
 * Allow-list sanitiser for rendering stored editor HTML. Keeps the formatting
 * the editor can produce (paragraphs, headings, lists, emphasis, alignment,
 * safe links) and drops scripts, event handlers, styles and unknown markup.
 * Needs a DOM; without one (server render) it returns the text, escaped.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) {
    return '';
  }
  if (typeof DOMParser === 'undefined') {
    return escapeHtml(richTextToPlain(html));
  }
  const source = new DOMParser().parseFromString(html, 'text/html');
  const target = source.implementation.createHTMLDocument('');
  cleanNode(source.body, target.body, target);
  return target.body.innerHTML;
}
