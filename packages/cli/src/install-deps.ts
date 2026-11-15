import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export function detectPackageManager(cwd: string): PackageManager {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) {
    return 'bun';
  }
  return 'npm';
}

export function installCommand(
  manager: PackageManager,
  packages: readonly string[],
  dev: boolean,
): { command: string; args: string[] } {
  const verb = manager === 'npm' ? 'install' : 'add';
  const flag = dev ? [manager === 'npm' ? '--save-dev' : '-D'] : [];
  return { command: manager, args: [verb, ...flag, ...packages] };
}

/** Installs `name@range` specs; returns false when the package manager failed. */
export function installPackages(cwd: string, specs: Record<string, string>, dev: boolean): boolean {
  const packages = Object.entries(specs).map(([name, range]) => `${name}@${range}`);
  if (packages.length === 0) {
    return true;
  }
  const { command, args } = installCommand(detectPackageManager(cwd), packages, dev);
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  return result.status === 0;
}
