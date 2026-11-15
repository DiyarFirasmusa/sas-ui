export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/i;

export function parseColor(input: string): Rgba {
  const value = input.trim();
  const hex = HEX.exec(value);
  if (hex?.[1]) {
    const digits =
      hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join('') : hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgb = RGB.exec(value);
  if (rgb) {
    const alpha = rgb[4] ?? '1';
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: alpha.endsWith('%') ? Number.parseFloat(alpha) / 100 : Number(alpha),
    };
  }
  throw new Error(`Unsupported colour "${input}" (use #hex or rgb(r g b / a))`);
}

/** Composites `foreground` over an opaque `background`. */
export function blend(foreground: Rgba, background: Rgba): Rgba {
  const mix = (top: number, bottom: number) =>
    Math.round(top * foreground.a + bottom * (1 - foreground.a));
  return {
    r: mix(foreground.r, background.r),
    g: mix(foreground.g, background.g),
    b: mix(foreground.b, background.b),
    a: 1,
  };
}

function channelLuminance(channel: number): number {
  const scaled = channel / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

export function luminance(color: Rgba): number {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  );
}

/**
 * WCAG contrast ratio. A translucent `foreground` is composited over
 * `background` first, so tag containers (hue at 9% alpha) are measured the way
 * they render.
 */
export function contrastRatio(foreground: string, background: string): number {
  const bottom = parseColor(background);
  const top = blend(parseColor(foreground), bottom);
  const lighter = Math.max(luminance(top), luminance(bottom));
  const darker = Math.min(luminance(top), luminance(bottom));
  return (lighter + 0.05) / (darker + 0.05);
}

export function toHex(color: Rgba): string {
  return `#${[color.r, color.g, color.b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Resolves a (possibly translucent) colour against an opaque surface to #hex. */
export function resolveOver(color: string, surface: string): string {
  return toHex(blend(parseColor(color), parseColor(surface)));
}
