# Cleanup report — builder-5 (2026-09-27)

The physical cleanup and reorganization of the project (branch `integration`, local commits only), executed from
`PROJECT-AUDIT.md` (now `docs/audits/2026-09-27-project-audit.md`). Product behaviour was not changed; no test,
scenario, fixture, manifest entry or generated file was touched.

## Restore point — the WIP commit

`a0fad99bbb621a6df052ad8c15404641c4a9ae2e` — "WIP: link picker and references (interrupted builder session, unverified)",
31 files (26 modified, 5 added), 1,317 insertions, 73 deletions:

- modified: `ARCHITECTURE.md`, `manifest/commands/elements.json`, `manifest/features/07-elements.json`,
  `manifest/features/19-pages-files-assets.json`, `manifest/interactions.json`, `manifest/references.json`,
  `spec/behavior/elements-structure.md`, `src/app/commands.ts`, `src/app/features.ts`,
  `src/core/document/validate.ts`, `src/core/elements/inputs.ts`, `src/core/elements/link.ts`,
  `src/core/export/export.ts`, `src/core/render/output.ts`, `src/core/render/render.ts`,
  `src/core/structure/remove.ts`, `src/editor/canvas/frame.tsx`, `src/editor/shell/inspector.tsx`,
  `src/editor/shell/shell.tsx`, `src/editor/state.ts`, `src/generated/commands.ts`, `src/generated/ids.ts`,
  `src/i18n/locales/en.json`, `src/i18n/locales/pt-BR.json`, `src/manifest/scenario.ts`,
  `tools/runner/scenarios.ts`
- added: `src/core/elements/references.ts`, `src/core/files/values.ts`, `src/editor/shell/link-picker.ts`,
  `src/editor/shell/link-picker.tsx`, `tests/e2e/link-picker-and-references.spec.ts`

The tree was confirmed idle before committing (two `git status --porcelain` snapshots 2 min 13 s apart, identical; no
project file modified in the previous 5 minutes apart from the cleanup prompt itself).

## Check results before and after

| Command | Before the cleanup (on `a0fad99`) | After the cleanup |
|---|---|---|
| `npm run build` | pass (exit 0) | pass (exit 0) |
| `npm run unit` | fail: 5 of 654 (5 files) | fail: the same 5 of 654 |
| `npm run manifest:check` | pass (exit 0) | pass (exit 0) |
| `npm run gen:check` | fail | fail (same cause) |

The five red unit tests: `src/core/text/inline.test.ts` (the known RV-03), `src/core/elements/link.test.ts`,
`src/core/page/settings.test.ts`, `src/core/document/validate.test.ts`, `src/core/elements/svg.test.ts`.

`gen:check` fails because the WIP commit's `src/generated/ids.ts` is stale: regenerating adds the one message id
`open.refused`. Not fixed, by instruction; the regenerated file was restored to HEAD so this pass changes no generated
file. `gen:check` also needs the ownership workaround (`GIT_CONFIG_COUNT/KEY_0/VALUE_0` for `safe.directory`; nothing
was written to any Git config).

Results after are equal to before; nothing regressed because of a path reference of this pass. Raw logs:
`.cache/cleanup-check/{baseline,after}-*.log`.

## Deleted paths and space freed

| Path | Size | Kind |
|---|---|---|
| `.cache/ts/` | 370 MB | VERIFIED copy |
| `.cache/audit/` | 345 MB | VERIFIED copy |
| `.cache/wt/integration/` | 174 MB | VERIFIED copy |
| `.cache/wt/{drag-level-keys-escape, elements-structure, export-zip, props-attributes, semantic-tag-switch, style-contracts-2, text-inline-formatting}/` | 30 MB each (210 MB) | VERIFIED copies |
| `.cache/shots/` | 7 MB | generated |
| `.playwright-mcp/` | 6 MB | generated (browser-tool scratch) |
| `.cache/scratch/` | 5 MB | scratch |
| `.cache/{e2e-build, pager-invest}/` | 2 MB each | generated |
| `dist/` | 2 MB | generated (rebuilt by `npm run build`) |
| `.cache/{pw-tooth}/` | 1 MB | generated |
| `test-results/` | 1 MB | generated (Playwright) |
| `.cache/wt/work22/` | ~0 | empty shell |
| `.cache/symbol-table.md` | ~3.5 KB | superseded (DESIGN.md holds the same 122 icon pairs) |
| `.dependency-cruiser.cjs` | 356 B | tracked; no consumer |
| `AGENTS.md` | 1,685 B | tracked; the retired Codex workflow |

`.cache/` fell from 1,300 MB to 196 MB; with `dist/`, `test-results/` and `.playwright-mcp/` removed, **about 1.11 GB
was freed**. `.cache/wt/` itself was kept (not empty; see below).

## Copy verification (step 3)

Each file of each copy was hashed with `git hash-object --stdin-paths` from the project root and checked with
`git cat-file -e`; a file that did not match was rehashed with `--no-filters` and checked again (a match under either
method counts). Excluded from hashing: `node_modules/`, `dist/`, `test-results/`, `.playwright-mcp/`, nested `.cache/`
and the `.git` pointer file.

- **VERIFIED (every file matched, deleted):** `.cache/wt/integration` (841 files), `.cache/wt/drag-level-keys-escape`
  (592), `.cache/wt/elements-structure` (600), `.cache/wt/export-zip` (590), `.cache/wt/props-attributes` (601),
  `.cache/wt/semantic-tag-switch` (604), `.cache/wt/style-contracts-2` (590), `.cache/wt/text-inline-formatting` (597),
  `.cache/ts` (603), `.cache/audit` (495).
- **UNVERIFIED (kept):**
  - `.cache/wt/inspector-number-fields/` — 35 of 593 files did not match: `ARCHITECTURE.md`, `DESIGN.md`,
    `manifest/commands/style.json`, `manifest/features/04-inspector.json`, `manifest/references.json`,
    `src/app/commands.ts`, `src/app/features.ts`, `src/core/commands/registry.ts`, `src/core/document/validate.ts`,
    `src/core/nodes/flags.test.ts`, `src/core/nodes/names.test.ts`, `src/core/store/store.ts`,
    `src/core/structure/{duplicate,hand,insert,move,remove,wrap}.test.ts`, `src/core/style/codecs.ts`,
    `src/core/style/set.ts`, `src/core/text/text.test.ts`, `src/editor/input/keymap.ts`, `src/editor/input/pointer.ts`,
    `src/editor/shell/field.tsx`, `src/editor/shell/inspector.tsx`, `src/editor/shell/shell.css`, `src/editor/store.ts`,
    `src/generated/commands.ts`, `src/generated/ids.ts`, `src/i18n/locales/en.json`, `src/i18n/locales/pt-BR.json`,
    `src/manifest/check.ts`, `src/manifest/schema.ts`, `tests/e2e/inspector-number-fields.spec.ts`,
    `tools/runner/scenarios.ts` — content of an older lineage this repository does not hold; may be unique work.
  - `.cache/old-root/` — 2 of 606 files did not match: `ARCHITECTURE.md` (a 165-line older revision) and
    `PROGRESS.md`. Its `claude-settings-guard.json.bak` counts as preserved (copied in step 2).

Neither copy was deleted and neither was inspected with Git (their `.git` pointers name
`C:/Users/jonathanrodriguesti/Documents/builder/.git/worktrees/…`, outside this root, and were never followed).

## Moves and the references updated for them

- `DESIGN.md`, `ARCHITECTURE.md`, `PROGRESS.md` → `docs/` (`git mv`).
  - `tools/manifest/load.ts` — `ARCHITECTURE_FILE` is now `docs/ARCHITECTURE.md` (the manifest checker's `owner` rule
    reads it through this constant; the only functional path reader of the three).
  - `CLAUDE.md` — every mention repointed to `docs/…`.
  - `docs/DESIGN.md` — its own "history mockups" line repointed to the new design paths.
  - `docs/history.md` — three path-shaped references repointed; bare-name mentions in older narrative entries were left.
  - Not changed (out of scope, name mentions only, nothing resolves them): comments in `src/**`, `tests/**`,
    `tools/**` and `spec/**` that cite "ARCHITECTURE.md"/"DESIGN.md"/"PROGRESS.md"; the labels `src/manifest/check.ts`
    prints for the `owner` rule; historical narrative in `docs/history.md` and `docs/archive/`.
- `design/{a-classic-refined, b-pen, c-studio}` and `design/OPTIONS.md` → `design/history/` (`git mv`).
  - The three mockups' `<link href="../shared/…">` became `../../shared/…`.
  - `design/history/OPTIONS.md` now says `design/history/<direction>/…`.
  - `docs/DESIGN.md` history line and the three path-shaped mentions in `docs/history.md` updated.
- Preserved material: `.cache/old-root/claude-settings-guard.json.bak` → `tools/hooks/settings.example.json`
  (identical, valid JSON); `.cache/investigation-report.md` → `docs/archive/investigation-2026-09-24.md`
  (byte-identical, hash `8ff7db3`).
- Hooks statements corrected (the hooks are off; wiring in `tools/hooks/settings.example.json`; enabled by copying it
  to `.claude/settings.json`): `CLAUDE.md`, `docs/testing/README.md`, `docs/ARCHITECTURE.md`, `tools/hooks/guard.ts`
  header, `docs/PROGRESS.md` state line.
- `docs/testing/README.md`: `.cache/measure/` marked "(created on first run)" (`tools/measure/measure.ts` mkdirs it).
- `eslint.config.js`: the `.dependency-cruiser.cjs` glob entry removed (the file is deleted).
- New: `README.md` (34 lines, root), `docs/audits/`, `docs/archive/`.

## Skipped items and contradictions with the audit

- The audit's §12 note about "a check on `PROGRESS.md` line count" has no implementation in the tree (only the
  `owner` rule reads a root document); nothing else needed updating.
- The audit's `dist/` measured 4 MB, 2 MB at cleanup time (it had been rebuilt).
- `src/core/elements/references.ts`, `link-picker.{ts,tsx}`, `src/core/files/values.ts` and
  `tests/e2e/link-picker-and-references.spec.ts` — product files the audit saw as untracked — are now the WIP commit.
- The audit listed `docs/testing/README.md:15` and `ARCHITECTURE.md:81` as hook statements; both corrected, plus the
  same statement in `CLAUDE.md`, `tools/hooks/guard.ts` and `docs/PROGRESS.md`.
- Copied from the audit's follow-ups and left for the user (below); nothing else was skipped.

## Stale references left in `.memory/` (not edited)

`DESIGN.md`/`ARCHITECTURE.md`/`PROGRESS.md` mentions: `builder-brief.md` 12, `audit-checklist.md` 1,
`builder-brief-earlier.md` 34, `builder-brief-old.md` 11, `auditor-brief.md` 11, `auditor.md` 6.

## Portuguese residue found (case-insensitive, whole word; report only)

Searched the tracked, project-owned files (excluding `src/i18n/`, `spec/`, `manifest/`, `reference/`, `.memory/`,
generated files, lockfile and the design mockups):

- `docs/history.md:420` — "Tamanho base for flex-basis" (a historical entry quoting the pt-BR labels).
- `docs/history.md:993` — a quoted phrase in Portuguese about the file-tabs row.
- `docs/archive/investigation-2026-09-24.md:12` — a quoted Portuguese commit message of `reference/Pager`.
- The `design/` mockups hold 81 further hits in their pt-BR sample content and labels (excluded category).

Nothing was translated.

## Follow-ups for the user

1. Review and finish the WIP commit (`a0fad99`, link picker and references): it is unverified — `npm run unit` is red
   in five files and `npm run gen:check` fails on `src/generated/ids.ts` (`open.refused` missing).
2. RV-03: `src/core/text/inline.test.ts:41` expects `isSafeHref('/about')`, `about.html` and `''` to be false while the
   single address rule (A3.2) accepts them — decide which side is stale.
3. `.mcp.json` still fetches `@playwright/mcp@latest` unpinned (RV-04).
4. `tools/manifest/map-features.ts` is a historical tool whose input no longer exists (RV-06).
5. `refs/impact/*` still carry refs named from an older working directory (RV-07).
6. `reference/Brickflow`, `reference/report.txt`, `reference/EXECUTION-DOCUMENT.md` (312 MB) — removal needs the user's
   explicit approval; untouched.
7. Consolidating `.memory/` (older brief sets + the retired auditor persona) — the user's call; untouched.
8. `.cache/logs/` (1,511 files) and `.cache/impact/` were kept for the evidence trail and the limited validation.
9. The `.cache/old-root/` and `.cache/wt/inspector-number-fields/` copies kept as UNVERIFIED (above) — settled on
   2026-09-27 (the finish pass): every unmatched file was compared with its current counterpart. `old-root/PROGRESS.md`
   was unique (its 2026-09-25 findings are absent from the current tree) and is kept as
   `docs/archive/unmerged/old-root.patch`; every other file of both copies was superseded, and both copies were
   deleted (step 2 of `builder-5-finish-prompt.md`).
10. The eight deleted copies leave stale worktree entries in the external repository named by their `.git` pointers
    (`C:/Users/jonathanrodriguesti/Documents/builder/.git/worktrees/…`) — outside this root, never followed.
11. The testing/manifest/impact/scenario infrastructure is preserved, as the prompt states, and will be evaluated
    separately after this physical cleanup.
