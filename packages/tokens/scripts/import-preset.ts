/**
 * Imports a hand-written tokens CSS file (the :root / .dark format the SAS
 * dashboards use) as a preset data file.
 *
 *   node scripts/import-preset.ts <tokens.css> <name> "<English label>" "<Arabic label>" "<description>"
 *
 * Re-run it to refresh a preset whose source palette changed — that is how
 * `wine-lapis` follows erp-tourism-react/src/style/tokens-colors.css.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { importPresetFromCss } from '../src/import-css.ts';
import { presetToSource } from '../src/preset-source.ts';

const [cssPath, name, labelEn, labelAr, description] = process.argv.slice(2);
if (!cssPath || !name || !labelEn || !labelAr || !description) {
  console.error('usage: import-preset.ts <css> <name> <label-en> <label-ar> <description>');
  process.exit(1);
}

const preset = importPresetFromCss(readFileSync(cssPath, 'utf8'), {
  name,
  label: { en: labelEn, ar: labelAr },
  description,
});
const header = `// Imported from ${cssPath.split('/').slice(-4).join('/')} with scripts/import-preset.ts.\n// Edit values freely; re-import to pull in upstream palette changes.`;
const target = new URL(`../src/presets/${name}.ts`, import.meta.url);
writeFileSync(target, presetToSource(preset, header));
console.log(`wrote ${target.pathname}`);
