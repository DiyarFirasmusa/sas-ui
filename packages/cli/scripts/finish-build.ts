/** Marks the compiled entry executable (the shebang is already in the source). */
import { chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

chmodSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'bin.js'), 0o755);
