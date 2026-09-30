// The browser tests of what changed (npm run e2e:affected [--since <ref>] [--list]): the features a change reaches and
// the spec files that prove them, run in Chrome instead of the whole suite. What changed is the working tree against
// HEAD (or against <ref>), untracked files included. A changed module of src/ reaches every module that imports it,
// directly or not; a feature is affected when one of the modules the inventory names for it (docs/inventory.json) is
// reached, or when its scenarios' file of manifest/features changed. The affected features' scenario tests run
// (@feature:<id>), with the spec files named after an affected feature and the spec files that changed. A change to
// what every browser test stands on (tests/support, the scenario runner, the door helpers, the Playwright
// configuration, the manifest's commands or layout) reaches everything: the run says so and runs the complete suite.
// The complete suite still runs once at the end of the work (CLAUDE.md, The loop); this is the loop between.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

interface Inventory {
  readonly features: readonly { readonly id: string; readonly built: boolean; readonly modules: readonly string[] }[];
}

const args = process.argv.slice(2);
const since = args.includes('--since') ? args[args.indexOf('--since') + 1] : undefined;
const listOnly = args.includes('--list');
const posix = (p: string) => p.split(path.sep).join('/');

const git = (...a: string[]) => execFileSync('git', ['-c', 'safe.directory=*', ...a], { encoding: 'utf8' }).split('\n').filter((l) => l !== '');
const changed = [...new Set([...git('diff', '--name-only', since ?? 'HEAD'), ...git('ls-files', '--others', '--exclude-standard')])];

// what every browser test stands on: a change there reaches every test
const EVERYTHING = [/^tests\/support\//, /^tests\/e2e\/door\.ts$/, /^tools\/runner\/scenarios\.ts$/, /^playwright\.config\.ts$/, /^manifest\/(commands\/|layout\.json|interactions\.json|properties\.json|elements\.json|environment\.json)/, /^package(-lock)?\.json$/, /^vite\.config\.ts$/, /^index\.html$/, /^src\/main\.tsx$/];

// the modules of src/ and what each imports (relative imports, resolved to files)
function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = posix(path.join(dir, e.name));
    if (e.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|css|json)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [full] : [];
  });
}
const IMPORT = /(?:import|export)\s[^'"]*?from\s+['"](\.{1,2}\/[^'"]+)['"]|import\s+['"](\.{1,2}\/[^'"]+)['"]/g;
const importers = new Map<string, Set<string>>();
for (const file of sourceFiles('src')) {
  if (!/\.tsx?$/.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(IMPORT)) {
    const target = posix(path.normalize(path.join(path.dirname(file), m[1] ?? m[2] ?? '')));
    const set = importers.get(target) ?? new Set<string>();
    set.add(file);
    importers.set(target, set);
  }
}
// every module a change reaches: the changed ones and, transitively, those that import them
const reached = new Set<string>();
const queue = changed.filter((f) => f.startsWith('src/'));
while (queue.length > 0) {
  const file = queue.pop() as string;
  if (reached.has(file)) continue;
  reached.add(file);
  for (const importer of importers.get(file) ?? []) queue.push(importer);
}

const inventory = JSON.parse(fs.readFileSync('docs/inventory.json', 'utf8')) as Inventory;
const featureFiles = changed.filter((f) => /^manifest\/features\/\d{2}-.*\.json$/.test(f));
const featuresInFiles = new Set(
  featureFiles.filter((f) => fs.existsSync(f)).flatMap((f) => (JSON.parse(fs.readFileSync(f, 'utf8')) as { features: { id: string }[] }).features.map((x) => x.id)),
);
const affected = inventory.features.filter((f) => f.built && (featuresInFiles.has(f.id) || f.modules.some((m) => reached.has(m)))).map((f) => f.id);
const specs = [
  ...new Set([
    ...affected.map((id) => `tests/e2e/${id}.spec.ts`).filter((f) => fs.existsSync(f)),
    ...changed.filter((f) => /^tests\/e2e\/.*\.spec\.ts$/.test(f) && fs.existsSync(f)),
  ]),
];
const everything = changed.filter((f) => EVERYTHING.some((r) => r.test(f)));
const styles = changed.filter((f) => f.endsWith('.css'));

console.log(`changed: ${changed.length} files${since === undefined ? '' : ` since ${since}`}`);
if (everything.length > 0) console.log(`reaches every browser test: ${everything.join(', ')}`);
else {
  console.log(`features: ${affected.length === 0 ? 'none' : affected.join(' ')}`);
  console.log(`spec files: ${specs.length === 0 ? 'none' : specs.join(' ')}`);
  if (styles.length > 0) console.log(`stylesheets changed (${styles.join(', ')}): the tests above prove behaviour; look at the screens with npm run ui`);
}
if (listOnly) process.exit(0);

const cli = path.join('node_modules', '@playwright', 'test', 'cli.js');
const playwright = (a: string[]) => spawnSync(process.execPath, [cli, 'test', ...a], { stdio: 'inherit' }).status ?? 1;
let status = 0;
if (everything.length > 0) status = playwright([]);
else {
  if (affected.length > 0) status = playwright(['scenarios.spec', '--grep', affected.map((id) => `@feature:${id}(?![\\w-])`).join('|')]);
  if (specs.length > 0) status = Math.max(status, playwright(specs));
  if (affected.length === 0 && specs.length === 0) console.log('no browser test is reached by the change');
}
process.exit(status);
