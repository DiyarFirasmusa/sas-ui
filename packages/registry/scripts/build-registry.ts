/**
 * Builds registry-out/: index.json, items/<name>.json (with inlined sources)
 * and css/ (the generated token CSS), which the CLI bundles and the docs app
 * reads. Fails loudly on any registry inconsistency.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRESETS } from '../../tokens/src/all-presets.ts';
import { buildIndex, buildItems, readManifests } from '../registry/build.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'registry-out');
const packageJson: {
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const items = buildItems(readManifests(), packageJson);
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'items'), { recursive: true });

for (const item of items) {
  writeFileSync(join(out, 'items', `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
}
const index = buildIndex(
  items,
  packageJson.version,
  PRESETS.map(({ name, label, description }) => ({ name, label, description })),
);
writeFileSync(join(out, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
cpSync(join(root, '..', 'tokens', 'css'), join(out, 'css'), {
  recursive: true,
});
console.log(`registry: ${items.length} items, ${PRESETS.length} presets → registry-out/`);
