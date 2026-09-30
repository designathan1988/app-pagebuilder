// One-off repair and permanent check of the locale catalogues: a key written twice in one file is silently resolved by
// JSON.parse to its last copy, so editing the first copy changes nothing. `node tools/i18n/dedupe.ts --write` rewrites
// each catalogue with every key once (the value JSON.parse already used, at the place of its first copy); without
// --write it reports the duplicates and exits 1 when there are any.
import { readFileSync, writeFileSync } from 'node:fs';

export const LOCALE_FILES = ['src/i18n/locales/en.json', 'src/i18n/locales/pt-BR.json'];

// every key written more than once in a JSON object text of one level (the catalogues are flat)
export function duplicateKeys(text: string): { readonly key: string; readonly values: readonly string[] }[] {
  const seen = new Map<string, string[]>();
  const line = /^\s*"((?:[^"\\]|\\.)*)"\s*:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/;
  for (const row of text.split(/\r?\n/)) {
    const found = line.exec(row);
    if (found === null) continue;
    const [, key = '', value = ''] = found;
    seen.set(key, [...(seen.get(key) ?? []), value]);
  }
  return [...seen].filter(([, values]) => values.length > 1).map(([key, values]) => ({ key, values }));
}

if (process.argv[1]?.endsWith('dedupe.ts')) {
  const write = process.argv.includes('--write');
  let total = 0;
  for (const file of LOCALE_FILES) {
    const text = readFileSync(file, 'utf8');
    const duplicates = duplicateKeys(text);
    total += duplicates.length;
    const differing = duplicates.filter((d) => new Set(d.values).size > 1);
    console.log(`${file}: ${duplicates.length} keys written twice, ${differing.length} with different values`);
    for (const d of differing) console.log(`  ${d.key}: ${d.values.join(' | ')}`);
    if (write && duplicates.length > 0) writeFileSync(file, `${JSON.stringify(JSON.parse(text), null, 2)}\n`);
  }
  if (!write && total > 0) process.exit(1);
}
