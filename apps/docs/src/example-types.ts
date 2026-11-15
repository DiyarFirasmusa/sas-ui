import type { ReactElement } from 'react';

export interface Example {
  title: string;
  description?: string;
  /** Rendered live in the docs preview; also shown as the example's source reference. */
  render: () => ReactElement;
  /** Make the preview wider than the default column (tables, shells). */
  wide?: boolean;
}

/** Every file in src/examples exports `examples` — one entry per demo. */
export interface ExampleModule {
  examples: Example[];
}
