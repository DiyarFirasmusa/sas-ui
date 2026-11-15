import { readConfig, type ProjectConfig } from '../config.ts';
import { installPackages } from '../install-deps.ts';
import {
  readProjectFile,
  renderedContent,
  targetPath,
  writeProjectFile,
  type CommandContext,
} from '../project.ts';
import { openRegistry, type RegistrySource } from '../registry-source.ts';
import { resolveItems } from '../resolve-items.ts';

export interface AddOptions {
  names: string[];
  all?: boolean;
  overwrite?: boolean;
  /** Also copy each component's test file. */
  tests?: boolean;
  /** Skip installing npm dependencies. */
  install?: boolean;
  dryRun?: boolean;
}

export interface AddResult {
  written: string[];
  overwritten: string[];
  skipped: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

/** Copies the requested items (and what they depend on) into the project. */
export async function runAdd(
  context: CommandContext,
  options: AddOptions,
  provided?: { config: ProjectConfig; source: RegistrySource },
): Promise<AddResult> {
  const config = provided?.config ?? readConfig(context.cwd);
  const source =
    provided?.source ?? openRegistry({ flag: context.registry, configured: config.registry });
  const { logger } = context;

  const requested = options.all
    ? (await source.getIndex()).items
        .filter((item) => item.type === 'ui' && item.tier !== 'extra')
        .map((item) => item.name)
    : options.names;
  if (requested.length === 0) {
    throw new Error('Name at least one component, or pass --all. Try "sas-ui list".');
  }

  const items = await resolveItems(source, requested);
  const result: AddResult = {
    written: [],
    overwritten: [],
    skipped: [],
    dependencies: {},
    devDependencies: {},
  };

  for (const item of items) {
    const files = item.files.filter((file) => file.role === 'source' || options.tests === true);
    for (const file of files) {
      const destination = targetPath(config, file);
      const existing = readProjectFile(context.cwd, destination);
      const next = renderedContent(config, file);
      if (existing === next) {
        result.skipped.push(destination);
        continue;
      }
      if (existing !== undefined && options.overwrite !== true) {
        result.skipped.push(destination);
        logger.warn(`${destination} already exists and differs — kept (use --overwrite, or "sas-ui diff ${item.name}")`);
        continue;
      }
      if (options.dryRun !== true) {
        writeProjectFile(context.cwd, destination, next);
      }
      (existing === undefined ? result.written : result.overwritten).push(destination);
    }
    Object.assign(result.dependencies, item.dependencies);
    if (options.tests === true) {
      Object.assign(result.devDependencies, item.devDependencies);
    }
  }

  const verb = options.dryRun === true ? 'Would write' : 'Wrote';
  for (const path of result.written) {
    logger.success(`${verb} ${path}`);
  }
  for (const path of result.overwritten) {
    logger.success(`${options.dryRun === true ? 'Would overwrite' : 'Overwrote'} ${path}`);
  }
  if (result.written.length + result.overwritten.length === 0) {
    logger.info('Everything requested is already up to date.');
  }

  if (options.dryRun !== true && options.install !== false) {
    const dependenciesOk = installPackages(context.cwd, result.dependencies, false);
    const devOk = installPackages(context.cwd, result.devDependencies, true);
    if (!dependenciesOk || !devOk) {
      logger.warn('Dependency install failed — install these manually: ' + JSON.stringify({ ...result.dependencies, ...result.devDependencies }));
    }
  } else if (Object.keys(result.dependencies).length > 0) {
    logger.info(`Dependencies to install: ${Object.entries(result.dependencies).map(([name, range]) => `${name}@${range}`).join(' ')}`);
  }
  return result;
}
