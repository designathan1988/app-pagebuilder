# Development infrastructure evaluation (2026-09-27)

Requested by `builder-5-finish-prompt.md` step 5. Report only: nothing in the infrastructure was changed, and keeping
any of it here does not approve it. Costs are lines of code (LOC) and files measured on this tree; runtimes marked
"measured" are from this pass, the others from `docs/testing/README.md`. Measured here: `npm run build` 0.27 s,
`npm run unit` 39.5 s (654 tests), `npm run manifest:check` seconds, `npm run gen:check` seconds, a full `npm run e2e`
14.9 min (1,605 passed of 1,679 recorded, before the fixes of the same day).

## impact / `npm run check` — `tools/impact/` (7 files, 1,138 LOC)

- **Protects against:** running the wrong tests — a change validated by tests that never exercised it, or the whole
  suite re-run after every edit (measured cost of that habit: 23 runs of 334 tests in 3 h 41, mostly on unchanged code).
- **Evidence it caught defects:** the deliberate-bug table in `docs/testing/README.md` — five bugs planted alone, each
  caught by exactly the tests its code reaches (b1: 11 browser + 3 unit; b2: 6 browser; b5: 1 browser + typecheck +
  lint); the independence proof (bug A open, an independent change B still validated in 25.6 s); the five scenarios
  S1–S5 measuring selection cost (2 to 335 tests).
- **Runtime cost:** `npm run check` = one build + changed statics + unvouched browser tests. Measured cases: 26.4 s
  (2 tests) to 80.0 s (335 tests). A full run rebuilds `map.json` (78 MB, 85 MB with the raw records).
- **Maintenance cost:** the largest single subsystem after the runner; it keeps a function/CSS/class map of the build
  (`analyze.ts`, `statics.ts`, `impact.ts`, `check.ts`, `checkpoint.ts`) and its own unit tests.
- **Overlap:** it *drives* the unit and e2e suites; no other subsystem does test selection.
- **Recommendation:** keep. It is the only mechanism that makes "run the tests the change can affect" honest, and its
  measurements are what justify the worker count and the "no retries" rule.

## Scenario runner — `tools/runner/` (5 files, 2,070 LOC)

- **Protects against:** a feature declared built while a scenario of its manifest feature does not pass through a door
  or reach its terminal — the contract's core claim ("status comes only from the runner").
- **Evidence:** every item of `.memory/audit-checklist.md` is proven through it; the runner's own 1,683 mapped tests
  appear in every full run (the finish pass ran it for `link-picker-and-references`: 3 tests, 3 passed).
- **Runtime cost:** 163 scenario tests in 35.7 s at 4 workers (docs/testing/README.md table).
- **Maintenance cost:** `scenarios.ts` + `status.ts` + `tooth.ts` + `unzip.ts` + `tooth-plugin.ts`; the runner reached
  several bugs of its own in this project's history (the file-drag door, the feature-tag tooth match).
- **Overlap:** the tooth proof and the census both build on it; `tools/impact/check.ts` runs its generated tests.
- **Recommendation:** keep — it is the project's central idea (the manifest as the contract), and its failures are the
  ones that mean "not delivered".

## Census — `tests/e2e/census.spec.ts` (256 LOC + `door.ts` 308 LOC)

- **Protects against:** a door drawn enabled with no command behind it, a built command no test runs, a built feature
  with no scenario, or a palette tile whose feature is not built.
- **Evidence:** it found 74 Insert tiles enabled without a command in its first form (`docs/history.md`, item 13/14);
  its exploration was added because of that finding, and it now visits every state a built door leads to (374 states,
  240 s budget in the live view). Each of its rules has a planted failure proving it bites.
- **Runtime cost:** runs only in the full suite; ~240 s (the live view's budget).
- **Maintenance cost:** one spec plus the annotation helpers it shares with the runner (`runs()`, `door-unavailable`).
- **Overlap:** it reads the same manifest data as `manifest:check`'s `door-coverage`/`tooth-proof` rules, but proves
  them against the *editor in Chrome*, which the checker cannot.
- **Recommendation:** keep — it is the door rule's only enforcement against "looks usable, does nothing".

## Tooth proof — `tools/runner/tooth.ts` + `tooth-plugin.ts`

- **Protects against:** a test that passes without the feature — an assertion that proves nothing, or a scenario whose
  handler was already dead.
- **Evidence:** 249 tooth logs and directories in `.cache/logs/`; the finish pass ran three (the address `https://`
  refusal, the language rule's owner, the validator's one-report rule), each failing with the behaviour off and passing
  with it on.
- **Runtime cost:** one focused e2e run per feature (the runner starts the app and runs only that feature's tests).
- **Maintenance cost:** inside the runner's 2,070 LOC; the `TOOTH_COMMANDS`/`TOOTH_MODULE` environment contract.
- **Overlap:** it re-runs the runner's tests with a handler stubbed; it is the only thing that proves a test *bites*.
- **Recommendation:** keep.

## Measure harness — `tools/measure/` (4 files, 423 LOC)

- **Protects against:** the validation strategy itself being guesswork — worker counts, trace cost, editor-load cost.
- **Evidence:** every number in `docs/testing/README.md` (the worker table, the S1–S5 scenarios, the five deliberate
  bugs) comes from it.
- **Runtime cost:** manual runs only (no npm script), minutes each; writes `.cache/measure/results.jsonl`.
- **Maintenance cost:** small; the least load-bearing subsystem by design.
- **Overlap:** none — it measures the process, not the product.
- **Recommendation:** keep, unchanged; re-run only when a rule's cost is questioned.

## `verify:fast` — `tools/verify/parallel.ts` (30 LOC)

- **Protects against:** a commit that fails typecheck, lint, unit or `manifest:check` before the long browser suite
  runs; it records the checkpoint the guard and the handoff read.
- **Evidence:** it is the checkpoint named in `CLAUDE.md`; this pass ran its four parts (all green) before the full e2e.
- **Runtime cost:** the four statics in parallel — the same as one `npm run check` statics half (order of a minute).
- **Maintenance cost:** 30 lines.
- **Overlap:** `npm run check` runs the same statics, but limited and without the checkpoint record.
- **Recommendation:** keep.

## Hooks / guard — `tools/hooks/` (2 files, 216 LOC)

- **Protects against:** work left outside any commit (measured: the cleanup found a whole day, 354 files, uncommitted
  inside an unfinished merge) and a push to `main` without the checkpoint.
- **Evidence:** the user's correction rewrote its rules after that incident; it is currently **off** (wiring preserved
  in `tools/hooks/settings.example.json`), and its rules' unit tests still run under Vitest.
- **Runtime cost:** none while off; milliseconds when on.
- **Maintenance cost:** small, but its behaviour is process control — it must judge the worktree the git command runs
  in, which was the user's finding.
- **Overlap:** it gates on `npm run check`'s and `checkpoint.ts`'s records, not on its own tests.
- **Recommendation:** keep the code; decide separately whether to re-enable it (the user's call). If re-enabled, keep
  the user's corrections: the guard judges the repository of the git command; non-main commits need no check.

## Contract lint rules — `tools/lint/` (3 files, 1,139 LOC, 9 rules)

- **Protects against:** a second owner in code — a second key table, pointer handler, frame writer, manifest id, UI
  string, token literal or clock/random use (`use-ports`, `pointer-owner`, `gesture-owner`, `keyboard-owner`,
  `frame-owner`, `no-manifest-id`, `no-literal-ui-string`, `use-tokens`, `builder-css/use-tokens`).
- **Evidence:** each rule's planted violation failed `verify:fast` at lint before being removed; `no-manifest-id` found
  24 literals that now read their fact from the manifest (docs/history.md).
- **Runtime cost:** seconds on changed files; runs inside `npm run check` and `verify:fast`.
- **Maintenance cost:** the rules are small, but each needs its plant and, in one case, its own test file.
- **Overlap:** `manifest:check`'s `owner` rule checks the *table* in `docs/ARCHITECTURE.md`; lint checks the code.
- **Recommendation:** keep — it is the mechanical half of "one concept, one owner".

## Manifest checker and plants — `src/manifest/check.ts` (2,223 LOC) + `tools/manifest/` (4 files, 1,790 LOC)

- **Protects against:** contract drift — 45 rules covering schema, references, doors, scenarios, terminals, placement,
  ownership, icons, i18n, CSS values and the document's grammar.
- **Evidence:** every rule has a plant; the checker caught, in this pass, nothing new but protected the cleanup's moves
  (its `owner` rule reads `docs/ARCHITECTURE.md` through `tools/manifest/load.ts`), and it failed on the interrupted
  session's manifest while that work was unfinished.
- **Runtime cost:** every run of `npm run check` and `verify:fast`; it reads every source file and the catalogues.
- **Maintenance cost:** the largest checker in the project; each new rule costs a plant and, often, a unit test.
- **Overlap:** with the census (doors) and the lint rules (owner), but at the contract's data level.
- **Recommendation:** keep; if it ever feels heavy, the candidate to drop is the `map-features` tool (removed today),
  not a rule.

## gen — `tools/gen/` (7 files, 1,592 LOC)

- **Protects against:** generated files edited by hand or stale (`src/generated/`, `manifest/generated/`,
  `src/ui/tokens.css`, `src/ui/icons.svg`) — today it caught exactly that: the WIP commit's `src/generated/ids.ts` was
  missing `open.refused`, and `gen:check` failed until `npm run gen` ran.
- **Evidence:** this pass (`gen:check` red before `npm run gen`, green after); `verify:fast` starts with it.
- **Runtime cost:** seconds.
- **Maintenance cost:** moderate (it generates the web data from installed packages, the tokens from
  `design/final/tokens.json` and the icon sprite from Lucide).
- **Overlap:** none.
- **Recommendation:** keep.

## Design shots — `tools/design/shots.ts` (278 LOC)

- **Protects against:** the visual contract drifting — clipped text, targets under 24 px, console errors, misplaced
  controls, wrong i18n text in `design/final/`.
- **Evidence:** 39 screenshots measured with 0 findings when the mockup was frozen; the check fails on a violation
  rather than warning.
- **Runtime cost:** a Chrome pass over the mockup, manual/periodic (no script in the checkpoint).
- **Maintenance cost:** small; it reads `design/final/index.html`.
- **Overlap:** none — the e2e suite tests the editor, not the mockup.
- **Recommendation:** keep for periodic runs; it does not belong in the minimal workflow.

## Test support and the proofs bundle — `tests/support/` (5 files, 245 LOC) + `tests/e2e/door.ts` (308 LOC)

- **Protects against:** a test-only fork of the application — the one fixture records what each test used (for the
  impact map) and always opens the real editor; `proofs.ts` re-exports the app's own modules into the browser.
- **Evidence:** every browser test in the project; the impact map is built from these records.
- **Runtime cost:** the fixture's recording is why traces are off (`no trace on every test`, docs/testing/README.md).
- **Maintenance cost:** small and central; `door.ts` is the one helper that runs a door as a user does.
- **Overlap:** none.
- **Recommendation:** keep.

## `.cache/logs/` and `.cache/impact/`

- **Protects against:** claimed-but-unproven work: `.cache/logs/` (1,529 entries, 38 MB) is the raw evidence the
  checklist cites, and `.cache/impact/` (85 MB, `map.json` 78 MB) is the state that lets `npm run check` vouch for a
  test instead of re-running it.
- **Evidence:** every item's row in `.memory/audit-checklist.md` names its log file.
- **Runtime cost:** disk only; losing the map costs one full suite before vouching works again.
- **Maintenance cost:** none; both are ignored by git and regenerated (the map by a full run).
- **Overlap:** none.
- **Recommendation:** keep, and prune `.cache/logs/` once the checklist no longer cites an entry (the user's call).

## The minimal validation workflow (proposal)

The exact commands a change must pass, from smallest to largest:

1. **Every change:** `npm run check` — builds, runs the statics the change can affect and the browser tests the map
   cannot vouch for, and says why each one ran.
2. **The change delivers or changes a behaviour:** `npm run e2e:tooth <feature>` — the feature's scenarios with its
   handler off must fail.
3. **Every commit that must stand (block's end, handoff):** `npm run verify:fast`, then `npm run e2e` — all statics,
   then the whole browser suite including the census, on that commit.
4. **Before `main`:** `npm run gen:check` and `npm run manifest:check` are already inside `verify:fast`; no extra step.

Nothing else in the infrastructure needs to run per change: `measure`, `design:shots` and the guard are periodic or
policy, not validation.
