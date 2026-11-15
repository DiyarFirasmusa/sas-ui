import { describe, expect, it } from 'vitest';
import {
  isRichTextEmpty,
  normalizeLinkUrl,
  normalizeRichText,
  richTextLength,
  richTextToPlain,
  sanitizeRichText,
  stripEmptyParagraphs,
} from '@/lib/rich-text';

describe('isRichTextEmpty', () => {
  it.each([undefined, null, '', '<p></p>', '<p> </p>', '<p><br></p>', '<p>&nbsp;</p>', '<p></p><p></p>'])(
    'treats %j as empty',
    (value) => {
      expect(isRichTextEmpty(value)).toBe(true);
    },
  );

  it.each(['<p>a</p>', '<h1>Title</h1>', '<p>مرحبا</p>', '<hr>', '<img src="x">', '<table></table>'])(
    'treats %j as content',
    (value) => {
      expect(isRichTextEmpty(value)).toBe(false);
    },
  );
});

describe('normalizeRichText', () => {
  it('turns an empty document into an empty string', () => {
    expect(normalizeRichText('<p></p>')).toBe('');
    expect(normalizeRichText('<p><br></p>')).toBe('');
    expect(normalizeRichText(null)).toBe('');
  });

  it('removes blank paragraphs from the ends but keeps spacing inside', () => {
    expect(normalizeRichText('<p></p><p>a</p><p></p><p>b</p><p> </p>')).toBe('<p>a</p><p></p><p>b</p>');
  });

  it('leaves normal content untouched', () => {
    expect(normalizeRichText('<p>hello</p>')).toBe('<p>hello</p>');
    expect(normalizeRichText('  <p>hello</p>  ')).toBe('<p>hello</p>');
  });

  it('keeps a paragraph with attributes that has text', () => {
    expect(normalizeRichText('<p style="text-align: center">x</p>')).toBe('<p style="text-align: center">x</p>');
  });
});

describe('stripEmptyParagraphs', () => {
  it('removes blank paragraphs everywhere', () => {
    expect(stripEmptyParagraphs('<p>a</p><p></p><p><br></p><p>b</p>')).toBe('<p>a</p><p>b</p>');
  });
});

describe('richTextToPlain / richTextLength', () => {
  it('flattens blocks to one line', () => {
    expect(richTextToPlain('<p>One</p><ul><li>Two</li><li>Three</li></ul>')).toBe('One Two Three');
    expect(richTextToPlain('a<br>b &amp; c &lt;d&gt;')).toBe('a b & c <d>');
    expect(richTextToPlain(undefined)).toBe('');
  });

  it('counts visible characters, Arabic included', () => {
    expect(richTextLength('<p>abc</p>')).toBe(3);
    expect(richTextLength('<p>مرحبا</p>')).toBe(5);
    expect(richTextLength('<p></p>')).toBe(0);
  });
});

describe('normalizeLinkUrl', () => {
  it('adds https to bare domains and accepts safe protocols', () => {
    expect(normalizeLinkUrl('example.com/a')).toBe('https://example.com/a');
    expect(normalizeLinkUrl(' https://example.com ')).toBe('https://example.com');
    expect(normalizeLinkUrl('mailto:a@b.co')).toBe('mailto:a@b.co');
    expect(normalizeLinkUrl('tel:+966500000000')).toBe('tel:+966500000000');
  });

  it('refuses dangerous or empty input', () => {
    expect(normalizeLinkUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeLinkUrl('data:text/html,<b>')).toBeNull();
    expect(normalizeLinkUrl('')).toBeNull();
    expect(normalizeLinkUrl('   ')).toBeNull();
  });
});

describe('sanitizeRichText', () => {
  it('keeps editor formatting', () => {
    const html = '<h2>Title</h2><p style="text-align: center"><strong>a</strong> <em>b</em> <u>c</u></p><ul><li>x</li></ul>';
    expect(sanitizeRichText(html)).toBe(html);
  });

  it('drops scripts, handlers and unknown wrappers', () => {
    const out = sanitizeRichText(
      '<p onclick="x()">hi<script>alert(1)</script></p><div><span class="a">kept</span></div><iframe src="//e"></iframe>',
    );
    expect(out).toBe('<p>hi</p>kept');
  });

  it('only keeps text-align from inline styles', () => {
    expect(sanitizeRichText('<p style="color:red; text-align: right">a</p>')).toBe('<p style="text-align: right">a</p>');
    expect(sanitizeRichText('<p style="color:red">a</p>')).toBe('<p>a</p>');
  });

  it('keeps safe links with noopener and removes unsafe targets', () => {
    expect(sanitizeRichText('<a href="https://x.test" onclick="y()">l</a>')).toBe(
      '<a href="https://x.test" target="_blank" rel="noopener noreferrer">l</a>',
    );
    expect(sanitizeRichText('<a href="javascript:alert(1)">l</a>')).toBe('<a>l</a>');
  });

  it('escapes text and returns "" for nothing', () => {
    expect(sanitizeRichText('<p>1 &lt; 2</p>')).toBe('<p>1 &lt; 2</p>');
    expect(sanitizeRichText('')).toBe('');
    expect(sanitizeRichText(null)).toBe('');
  });
});
