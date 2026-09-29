// The census (the user's decision 5): no command works without a browser test that proves it, and no door looks usable
// without a command behind it.
//
// It reads the manifest (which commands are built: the registered handlers of references.json), the doors every browser
// test names (its annotations "door", read from Playwright's own list of the suite, which starts no server), the doors
// the scenarios run (the scenario runner gives each of them a test), and it fails when
//   - a door is drawn enabled while its command is not built;
//   - a built command has no test that runs one of its doors;
//   - a door of a built command that a user can reach is run by no test (a shortcut that runs by the keymap's own rule,
//     or a control the shell draws — its command built and its feature built);
//   - a feature registered as built in the feature table (src/app/features.ts) has no scenario, a command it lists is
//     not built, or a scenario of it runs a door that does not work yet.
//
// The first two bullets' *drawing* side ("no door looks usable without a command") is one rule in one place — a door
// is drawn disabled while its command is not built (src/editor/doors/door.tsx, its `built` and the entry's feature) —
// so it is proven where it lives (src/editor/doors/door.test.ts, which renders the control) instead of by walking
// every state of the app: that walk cost minutes on every run and proved nothing the rule's own test does not.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '../support/test.ts';
import { shortcutRuns } from '../../src/editor/input/shortcut-rule.ts';
import { isFeatureBuilt } from '../../src/app/features.ts';
import type { FeatureId } from '../../src/generated/ids.ts';
import { FEATURES, blockers, registered } from '../../tools/runner/scenarios.ts';
import { DOOR_ANNOTATION, UNAVAILABLE_ANNOTATION } from './door.ts';

interface Command {
  readonly id: string;
  readonly introducedBy: string;
  readonly history: { readonly undoable: boolean };
  readonly entryPoints: readonly { readonly id: string; readonly kind: string; readonly feature: string }[];
}
const COMMANDS: Command[] = [];
for (const file of fs.readdirSync('manifest/commands')) COMMANDS.push(...(JSON.parse(fs.readFileSync(path.join('manifest/commands', file), 'utf8')) as { commands: Command[] }).commands);
const REFERENCES = (JSON.parse(fs.readFileSync('manifest/references.json', 'utf8')) as { references: { kind: string; id: string; status: string }[] }).references;
const BUILT = new Set(REFERENCES.filter((r) => r.kind === 'handler' && r.status === 'registered').map((r) => r.id));

// the doors the scenarios run: the runner gives every scenario-door pair a test of its own
function scenarioDoors(): Set<string> {
  const doors = new Set<string>();
  for (const f of FEATURES) {
    for (const s of f.scenarios) {
      for (const ref of s.doors) doors.add(ref);
      for (const step of s.steps) doors.add(step.door);
    }
  }
  return doors;
}

interface Listed {
  readonly specs?: readonly { readonly title: string; readonly tests: readonly { readonly annotations: readonly { readonly type: string; readonly description?: string }[] }[] }[];
  readonly suites?: readonly Listed[];
}
// the doors each annotation type names, over every test of the suite (Playwright's list, which starts no server)
async function annotated(): Promise<Map<string, Set<string>>> {
  const cli = path.join('node_modules', '@playwright', 'test', 'cli.js');
  const listed = await new Promise<string>((resolve, reject) =>
    execFile(process.execPath, [cli, 'test', '--list', '--reporter=json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, E2E_SELECTION: '' } }, (error, stdout) =>
      error ? reject(error) : resolve(stdout),
    ),
  );
  const report = JSON.parse(listed) as { suites: Listed[] };
  const found = new Map<string, Set<string>>();
  const walk = (suite: Listed) => {
    for (const spec of suite.specs ?? []) for (const t of spec.tests) for (const a of t.annotations) if (a.description !== undefined) found.set(a.type, (found.get(a.type) ?? new Set()).add(a.description));
    for (const inner of suite.suites ?? []) walk(inner);
  };
  for (const suite of report.suites) walk(suite);
  return found;
}

test('every feature registered as built has scenarios that can all run', () => {
  const unproven = FEATURES.filter(registered).flatMap((f) => blockers(f).map((why) => `${f.id}: ${why}`));
  expect(unproven, 'registered features whose scenarios cannot all run').toEqual([]);
  console.log(`census: ${FEATURES.filter(registered).length} features registered as built, each with scenarios that can all run`);
});

test('every working command is proven by a browser test, and no door looks usable without a command', async () => {
  const tests = await annotated();
  const runsDoor = new Set([...(tests.get(DOOR_ANNOTATION) ?? []), ...scenarioDoors()]);
  const runsUnavailable = tests.get(UNAVAILABLE_ANNOTATION) ?? new Set<string>();
  // a shortcut a user can press now: the keymap's own rule (src/editor/input/shortcut-rule.ts), on the manifest's data
  const runs = (c: Command, d: Command['entryPoints'][number]) =>
    d.kind === 'shortcut' && shortcutRuns({ command: c.id, introducedBy: c.introducedBy, feature: d.feature }, (id) => BUILT.has(id), (feature) => isFeatureBuilt(feature as FeatureId));

  const missing: string[] = [];
  for (const c of COMMANDS.filter((c) => BUILT.has(c.id))) {
    for (const d of c.entryPoints) {
      const ref = `${c.id}#${d.id}`;
      if (runsDoor.has(ref) || runsUnavailable.has(ref)) continue;
      // a door a user can reach: a shortcut that runs now, or a control the shell draws (its feature built)
      const reachable = runs(c, d) || isFeatureBuilt(d.feature as FeatureId);
      missing.push(`${ref}: ${reachable ? 'reachable by a user and no browser test runs it' : 'no browser test runs it and none shows it unavailable'}`);
    }
  }
  expect(missing, 'doors of built commands without a browser test').toEqual([]);
  console.log(`census: ${BUILT.size} built commands, ${runsDoor.size} doors run by tests, ${runsUnavailable.size} shown unavailable`);
});
