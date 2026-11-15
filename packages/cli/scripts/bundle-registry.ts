/** Copies the built registry (packages/registry/registry-out) into the CLI package. */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const built = join(root, '..', 'registry', 'registry-out');
if (!existsSync(join(built, 'index.json'))) {
  throw new Error('Build the registry first: pnpm build:registry');
}
rmSync(join(root, 'registry'), { recursive: true, force: true });
cpSync(built, join(root, 'registry'), { recursive: true });
console.log('bundled registry into packages/cli/registry');
