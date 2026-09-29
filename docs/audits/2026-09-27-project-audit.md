# Project Audit — builder-5

- **Audit date:** 2026-09-27
- **Project root:** `C:\Codex-Shared\deepseek\builder-5`
- **Git branch:** `integration` (local only; no upstream relationship to any remote ref)
- **HEAD at audit start:** `0d4f7c9` ("a blank line out of the findings list"); 56 commits, root commit `2d8dc18` ("Baseline: consolidated state at 3.6") with no parents
- **Working tree at audit start:** dirty — 7 modified files (`src/core/document/validate.ts`, `src/core/elements/inputs.ts`, `src/core/elements/link.ts`, `src/core/export/export.ts`, `src/core/render/output.ts`, `src/core/render/render.ts`, `src/editor/canvas/frame.tsx`) and 3 untracked files (`builder-5-audit-prompt.md`, `src/core/elements/references.ts`, `src/core/files/values.ts`)
- **Note:** a concurrent builder session was actively editing the working tree during this audit (see §19, "Concurrency"). Nothing in this audit modified, moved, deleted or executed anything.

## Method and limitations

This audit is a read-only inspection. It combined: directory listings and size/file-count measurements (`du`, `find`, `wc`); full or sampled reads of the project's own configuration, contracts and source; text searches (`rg`) for imports, identifiers, paths, environment variables and language content; and read-only Git commands (`git --no-optional-locks`, with a per-command `-c safe.directory=` override because the checkout is owned by another Windows account — no config file was written). Nothing was executed: no build, no dev server, no test suite, no npm/npx command, no project script, no Git hook, no network access. Consequently, all runtime behaviour is inferred from code, configuration and documentation; anything that could only be confirmed by running something is classified `REQUIRES REVIEW`. Dependency directories (`node_modules`), `.git` internals, and other projects (`reference/Brickflow`, `reference/Pager`) were measured but not read file by file. Large generated JSON files were inspected by header and size only. Unused *exports* inside live files were not exhaustively verified (no tool was run); the reachability analysis is at file level. The tree was changing under the audit (concurrent builder session), so all statements are pinned to the moments cited. The file `builder-5-audit-prompt.md` is this audit's own input and is excluded from cleanup findings; this report excludes itself as well.

---

## 1. Executive Summary

The project is in good structural health: one store, one command table, one manifest contract, a documented single-owner architecture, a working dependency-driven validation cycle, and no Portuguese in filenames or code identifiers. The material that can be cleaned is almost entirely **outside the tracked tree**: of the project's 2,047 MB on disk, 1,300 MB sit in `.cache/` (scratch, logs, and eleven near-complete copies of this or older projects), 344 MB in `reference/` (a read-only requirement) and 315 MB in `node_modules/`.

Key facts:

1. **`.cache/` contains stale repository copies**: `.cache/wt/*` (10 directories, 409 MB), `.cache/ts` (370 MB) and `.cache/audit` (345 MB) are full checkouts whose `.git` pointer files name `C:/Users/jonathanrodriguesti/Documents/builder/.git/worktrees/...` — a git directory **outside the project root** that is no longer this repository. They may hold unique uncommitted work and must be verified before deletion (RV-01).
2. **Documentation contradicts the tree on two points**: `docs/testing/README.md` and `ARCHITECTURE.md` state that hooks in `.claude/settings.json` enforce the validation cycle, but that file is absent from HEAD (the post-move baseline commit does not include it; `PROGRESS.md` records the hooks as deliberately off). The one copy of its content is `.cache/old-root/claude-settings-guard.json.bak` (RV-02, CO-05). `docs/testing/README.md` also cites `.cache/measure/results.jsonl`, a directory that does not exist (RV-05).
3. **One likely live test contradiction**: `src/core/text/inline.test.ts:41` expects `isSafeHref('/about')`, `isSafeHref('about.html')` and `isSafeHref('')` to be `false`, while both now delegate to the A3.2 single address rule (`src/core/elements/address.ts:52-62`), which returns `true` for all three. This suggests a stale unit test (a currently red unit suite) that static reading cannot finally settle (RV-03).
4. **No code file is suspected dead** at module level: every non-test source file has at least one importer, and the only zero-importer files are unit tests (collected directly by Vitest), `src/main.tsx` (the Vite/HTML entry) and `src/app/commands.typecheck.ts` (a deliberate compile-time-only proof, documented as such).
5. **One orphan configuration file**: `.dependency-cruiser.cjs` has no dependency (`dependency-cruiser` is not in `package.json` or the lockfile), no npm script and no consumer (RM-01).
6. **One obsolete agent-instruction file**: `AGENTS.md` is written in Portuguese, instructs a retired parallel-Codex workflow on ports 5341/5311 (the live preview uses 5320), and points at coordination files outside the project (RM-02).
7. **The tracked tree (861 files) is disciplined**: 307 spec files, 244 src files, 127 test files, 71 design files, 54 manifest files, 35 tool files, and a clean root of entry points and configuration. The generated-but-committed files (`src/generated/*`, `manifest/generated/*`, `src/ui/tokens.css`, `src/ui/icons.svg`, `design/*/shots/*.png`) are all validated by `npm run gen:check`, so their presence in Git is deliberate and safe.
8. **Legacy material with unique information** that must not be lost: `.cache/old-root/claude-settings-guard.json.bak` (the only hook settings), `.cache/logs/` (raw proof logs referenced by `.memory/audit-checklist.md`), `.cache/investigation-report.md` (prior Brickflow/Pager investigation), `.memory/builder-brief.md` + `.memory/audit-checklist.md` (the literal user orders and item ledger), and `reference/Pager` (the behavioural reference for unbuilt features).

Findings counts: **RM (removal) 13 — CO (consolidation) 6 — MV (move/rename) 3 — RV (review) 8** (RV-01…RV-08: orphaned copies, absent hook settings, the address-rule test contradiction, the unpinned MCP fetch, the `.cache/measure` doc drift, the historical map-features tool, the cwd-derived impact refs, the missing README), all detailed in §13–§15 and §19.

---

## 2. Current Project Tree

Depth 2–3; dependency and generated directories collapsed. Sizes are MB (rounded), counts are files. All numbers measured 2026-09-27.

```
builder-5/                                2,047 MB total — 861 tracked files
├─ package.json  package-lock.json  index.html
├─ tsconfig.json  tsconfig.app.json  tsconfig.node.json
├─ vite.config.ts  vite.proofs.config.ts  vitest.config.ts  playwright.config.ts
├─ eslint.config.js  .dependency-cruiser.cjs  .mcp.json  .gitattributes  .gitignore
├─ CLAUDE.md  DESIGN.md  ARCHITECTURE.md  PROGRESS.md  AGENTS.md  builder-5-audit-prompt.md
├─ .claude/                                 1 file — launch.json (tracked)
├─ .memory/                                 7 files, ignored — builder/auditor briefs + audit-checklist.md
├─ .git/                                    45 MB, git internals (not read file by file)
├─ src/                4 MB   246 files    the application (TS only; core plain, editor React)
│   ├─ app/           commands.ts, commands.typecheck.ts, features.ts
│   ├─ config/        product.ts
│   ├─ core/          25 subdirs — document, elements, style, render, structure, store, history, …
│   ├─ editor/        20 subdirs — canvas, shell, inspector, input, drag, doors, layers, …
│   ├─ generated/     commands.ts, ids.ts, value-lists.ts (written by tools/gen)
│   ├─ i18n/          index.ts, glossary.json, locales/{en,pt-BR}.json
│   ├─ manifest/      schema.ts, check.ts, runtime.ts, scenario.ts, chord.ts, css.ts, fields.ts
│   └─ ui/            tokens.css (generated), icons.svg (generated)
├─ tests/              2 MB   127 files    e2e/ (121 specs + door.ts) · support/ (test.ts, editor.ts, proofs.ts, global-setup.ts, global-teardown.ts)
├─ tools/              1 MB    35 files    design 278 · gen 1,592 · hooks 215 · impact 1,138 · lint 1,139 · manifest 2,099 · measure 423 · runner 2,067 · verify 30 lines
├─ manifest/          13 MB    54 files    commands/*.json (18) · features/*.json (20) + fixtures (3) · generated/*.json (4) · elements, properties, layout, interactions, checks, environment, consumers, references, css-exclusions
├─ spec/behavior/      6 MB   307 files    143 behavior specs (.md) + img/ (164 evidence PNGs)
├─ design/            13 MB    71 files    final/ (mockup + tokens.json + 17 shots) · a-classic-refined, b-pen, c-studio (13 shots each — declared history) · shared/ · OPTIONS.md
├─ docs/                   2 files         history.md (1,551 lines) · testing/README.md (230 lines)
├─ reference/        344 MB 20,185 files   Pager 33 MB (behavioural reference, read-only) · Brickflow 312 MB (previous attempt) · report.txt · EXECUTION-DOCUMENT.md
├─ node_modules/     315 MB 21,687 files   ignored
├─ .cache/         1,300 MB 56,143 files   ignored — see §10/§11 (logs 38 MB, impact 83 MB, old-root 32 MB, pager-run 11 MB, scratch 5 MB, shots 7 MB, copies ~1,124 MB)
├─ .playwright-mcp/    6 MB   101 files    ignored — browser-tool screenshots + console logs
├─ dist/               4 MB     4 files     ignored — vite build + proofs bundle
└─ test-results/       1 MB     1 file      ignored — Playwright .last-run.json
```

Notable structure observations:

- **Duplicate directory structures**: eleven project-shaped trees exist under `.cache/` (`.cache/wt/{integration, drag-level-keys-escape, elements-structure, export-zip, inspector-number-fields, props-attributes, semantic-tag-switch, style-contracts-2, text-inline-formatting}`, `.cache/ts`, `.cache/audit`) — see §11, RV-01.
- **Unnecessary nesting**: none material. `src/core` (25 subdirs) and `src/editor` (20 subdirs) are deliberate single-owner modules, not accidental fragmentation; several directories hold one file by design (`src/core/ports/`, `src/editor/view/`, `src/config/`).
- **Abandoned structures**: `.cache/wt/work22` (an empty `node_modules` shell), `.cache/pw-tooth/`, `.cache/e2e-build/`, `.cache/shots/`, `.cache/pager-invest/`.
- **Misplaced files**: `AGENTS.md` (Portuguese, retired workflow) in the root; `.dependency-cruiser.cjs` (orphan config) in the root; the hook settings living only in `.cache/old-root/` as a `.bak`.
- **20 largest project-owned files** (excluding `node_modules`, `.git`, `.cache`, `reference`, `.playwright-mcp`, `dist`, `test-results`):

| Path | Size |
|---|---|
| manifest/generated/css-compat.json | 6.4 MB |
| manifest/features/04-inspector.json | 1.1 MB |
| manifest/features/07-elements.json | 0.8 MB |
| manifest/features/02-structure-editing.json | 0.5 MB |
| manifest/generated/css-properties.json | 0.4 MB |
| manifest/features/10-view-and-positioning.json | 0.4 MB |
| manifest/features/13-workspace.json | 0.3 MB |
| manifest/commands/style.json | 0.3 MB |
| design/{a-classic-refined,b-pen,c-studio,final}/shots/1920-01-default.png (4 files) | ~0.3 MB each |
| design/a-classic-refined/shots/1440-{04-drag,07-state,12-context,11-menu}.png (4) | 0.2 MB each |
| docs/history.md | 0.2 MB |

(The largest single file anywhere in `.cache/` is `.cache/impact/map.json` at 78 MB — see §10.)

---

## 3. Root Directory Audit

Every entry directly in the project root. The intended future state is a root with only entry points and configuration.

| ID | Path | Purpose / consumer | Current state | Classification | Recommended action | Risk |
|----|------|--------------------|----------------|----------------|--------------------|------|
| — | `package.json`, `package-lock.json` | npm scripts + deps; every tool | Current | KEEP | — | Low |
| — | `index.html` | Vite entry (`/src/main.tsx`); title injected from `src/config/product.ts` by a plugin (vite.config.ts:18-23) | Current | KEEP | — | Low |
| — | `tsconfig.json` / `.app.json` / `.node.json` | Type checking; app+node split; excludes `reference`, `.cache`, `.playwright-mcp` | Current | KEEP | — | Low |
| — | `vite.config.ts` | Dev/build; requires `PORT` env; unwatched set `reference/.cache/.playwright-mcp` | Current | KEEP | — | Low |
| — | `vite.proofs.config.ts` | Builds `dist/proofs.js` (test support) | Current | KEEP | — | Low |
| — | `vitest.config.ts` | Unit runner; includes `src/**/*.test.ts(x)` and `tools/**/*.test.ts` | Current | KEEP | — | Low |
| — | `playwright.config.ts` | E2E config; reporters `tools/runner/status.ts` + `tools/impact/checkpoint.ts` | Current | KEEP | — | Low |
| — | `eslint.config.js` | Contract lint rules (`tools/lint/plugin.ts`); ignores `.claude`, `.cache`, … | Current | KEEP | — | Low |
| **RM-01** | `.dependency-cruiser.cjs` | **None found** — no dep in package.json/lockfile, no script, no consumer; `forbidden: []` | Obsolete | SUSPECTED DEAD | Remove after one confirmation sweep | Low (config only) |
| — | `.gitattributes` | `eol=lf`, binary png/jpg/zip | Current | KEEP | — | Low |
| — | `.gitignore` | Ignores `reference/ node_modules/ dist/ test-results/ playwright-report/ .env* *.zip coverage/ blob-report/ *.tsbuildinfo .cache/ .memory/ .playwright-mcp/` | Current; no omissions detected (git status shows no unignored generated material) | KEEP | — | Low |
| — | `.mcp.json` | Playwright MCP for the app's browser tooling: `cmd /c npx -y @playwright/mcp@latest --browser chrome` | Current but network-fetching and unpinned | REQUIRES REVIEW (RV-04) | Pin a version or accept the fetch | Low (tooling) |
| — | `.claude/launch.json` | Preview configs: `builder-dev` (npm run dev, port 5320, autoPort) and `pager-run` (`npx vite .cache/pager-run --port 5330`) | Current | KEEP | — | Low |
| **CO-05** | `.claude/settings.json` | **Absent.** `docs/testing/README.md:15` and `ARCHITECTURE.md:81` say the hooks in it enforce the cycle; `PROGRESS.md` records them off; the only copy of its content is `.cache/old-root/claude-settings-guard.json.bak` | Contradiction | REQUIRES REVIEW (RV-02) | Restore (updated per the user's guard orders) or fix the docs | Medium — process control is documented as active while absent |
| — | `.memory/` (7 files) | User-authored memory: `builder-brief.md`, `builder.md`, `audit-checklist.md` (live), `builder-brief-earlier.md`, `builder-brief-old.md`, `auditor-brief.md`, `auditor.md` (older sets); imported by CLAUDE.md (two of them) | Current; ignored by git | KEEP live two; older sets → CONSOLIDATE (CO-02) | Merge/archive older sets with the user's consent | Medium — user-authored orders |
| **RM-03** | `.playwright-mcp/` | Browser-tool scratch: screenshots + `console-*.log` (101 files, 6 MB; the newest log is 398 KB from 2026-09-27 19:21) | Generated | GENERATED (tool: the MCP browser) | Remove; keep the newest console log only if a finding is still using it | Low |
| **RM-02** | `AGENTS.md` | Portuguese instructions for the retired parallel Codex session: reads `.memory/builder.md`, cites `C:\Users\jonathanrodriguesti\Documents\builder-coord\BOARD.md` (outside the root), `browser-codex.lock`, ports 5341/5311, "commits só no branch codex" | Obsolete (the user's 2026-09-26 order: "O Codex saiu… Não traga mais nada do Codex") | LEGACY | Remove, or rewrite in English as a stub pointing to `CLAUDE.md` | Low — but it is tracked, so its removal is a commit |
| — | `CLAUDE.md` (90 lines) | The project instructions: contract-first, single conversation per slice, memory, commands, rules | Current | KEEP | — | Low |
| — | `DESIGN.md` (278 lines) | The interface contract: regions, doors, canvas behaviour, tokens, icons | Current (updated through the user's audit items) | KEEP | — | Low |
| — | `ARCHITECTURE.md` (190 lines) | Ownership map: every concept's owner module + command-owner table; lists "planned" owners that do not exist yet (`src/core/animation`, `src/core/events`, `src/core/import`, `src/core/project/pages.ts`, `src/core/style/css-rule.ts`, `src/editor/{code-panel,explorer,timeline}`, `src/editor/view/editor-view.ts`) | Current; the planned lines are the roadmap, not dead code | KEEP | — | Low |
| — | `PROGRESS.md` (60 lines) | Current state, decisions, open findings 35–62; requires ≤60 lines | Current (exactly 60) | KEEP | — | Low |
| — | `builder-5-audit-prompt.md` | This audit's input | Untracked | Excluded from findings per instruction | The user decides where it lives | — |
| — | `design/` | `final/` is the visual contract source (DESIGN.md:15); `a-classic-refined`, `b-pen`, `c-studio` + `OPTIONS.md` are declared history (DESIGN.md:20) | `final/` current; options historical | KEEP + LEGACY | Consolidate options into a history folder (CO-01) | Low |
| **RM-04** | `dist/` | `vite build` + `build:proofs` output (index.html, assets, proofs.js) | Generated | GENERATED (`npm run build` / `npm run build:proofs`; rebuilt by the e2e webServer) | Remove freely; rebuilds itself | Low |
| — | `docs/` | `history.md` (1,551 lines of handoffs/decisions/proofs) + `testing/README.md` (the validation-cycle strategy and measurements) | Current; two contradictions inside `testing/README.md` (RV-02, RV-05) | KEEP | — | Low |
| — | `manifest/` | The contract: commands/doors, features + scenarios + fixtures, elements/properties/layout/interactions/checks, generated web data | Current; validated by `npm run manifest:check` | KEEP | — | Low |
| — | `reference/` | Read-only: `Pager` (required behavioural reference), `Brickflow` + `report.txt` + `EXECUTION-DOCUMENT.md` (previous attempt; "do not copy/follow") | Read-only by rule (CLAUDE.md) | KEEP Pager; LEGACY the rest (RM-13 only with the user's word) | — | High if touched without approval |
| — | `spec/` | 143 behavior specs + 164 evidence screenshots | Current | KEEP | — | Low |
| — | `src/` | The application | Current | KEEP | — | Low |
| **RM-08** | `test-results/` | Playwright `.last-run.json` | Generated | GENERATED (Playwright) | Remove freely | Low |
| — | `tests/` | 121 e2e specs + `door.ts` helper + 5 support modules | Current | KEEP | — | Low |
| — | `tools/` | 9 subsystems (see §9) | Current; two historical pieces (RV-06, hooks off) | KEEP | — | Low |
| **RM-05** | `node_modules/` | Installed deps (315 MB, 21,687 files) | Generated | GENERATED (`npm ci`; lockfile present) | Never commit; may be deleted and reinstalled at will | Low |
| **RM-06** | `.cache/` | See §10/§11 — logs, impact state, scratch, copies | Mixed generated + historical | Mostly SAFE REMOVAL after §11 review | Phased cleanup (see §18) | High for the copies (RV-01) |

**Root gaps**: no `README.md` exists (RV-08); the root carries one retired agent file (`AGENTS.md`) and one orphan config (`.dependency-cruiser.cjs`).

---

## 4. Directory Audit

| Directory | Size | Files | Purpose | Consumers | Classification | Action | Risk |
|---|---|---|---|---|---|---|---|
| `src/` | 4 MB | 246 | The application; `core` plain TS, `editor` React, `app` wiring, `manifest` contract reader/checker, `generated` gen output, `i18n`, `ui` | `index.html` → `src/main.tsx` → `src/editor/App.tsx`; tools import `src/manifest/*`, `src/core/*` | KEEP | — | Low |
| `tests/` | 2 MB | 127 | 121 e2e specs + `door.ts` (door helper + census annotations) + support fixture (`test.ts`, `editor.ts`, `proofs.ts`, global setup/teardown) | `playwright.config.ts`; `tools/runner/scenarios.ts` generates `scenarios.spec.ts` tests | KEEP | — | Low |
| `tools/` | 1 MB | 35 | 9 subsystems: gen (contract generation), impact (dependency map + limited validation), lint (contract ESLint rules), manifest (checker CLI + plants + load), measure (calibration harness), runner (scenario runner, tooth proof, status, unzip), verify (parallel verify:fast), design (mockup shots), hooks (guard) | `package.json` scripts, config files, docs | KEEP (details in §9) | — | Low |
| `manifest/` | 13 MB | 54 | The machine-read contract: 18 command files with doors, 20 feature groups with scenarios, 3 fixtures, 4 generated web-data files, plus `elements/properties/layout/interactions/checks/environment/css-exclusions/consumers/references` | `src/manifest/runtime.ts` (import.meta.glob, in the app); `tools/manifest/load.ts` (fs, in Node); `tools/runner` | KEEP | — | Low |
| `spec/behavior/` | 6 MB | 307 | 143 behaviour specs (English; Pager observations + "Problems in Pager" corrections) + `img/` evidence | Human/agent reference; specs point to manifest features | KEEP | — | Low |
| `design/` | 13 MB | 71 | `final/` = the mockup + `tokens.json` (source of `src/ui/tokens.css`) + 17 shots; `shared/` site css; three option directions + `OPTIONS.md` (history) | `tools/gen/tokens.ts`, `tools/design/shots.ts`, `src/ui/tokens.css` generation | `final`/`shared` KEEP; options LEGACY | CO-01 | Low |
| `docs/` | <1 MB | 2 | `history.md` (append-only handoff/decision log) + `testing/README.md` (strategy + measurements) | CLAUDE.md/PROGRESS.md reference them | KEEP (2 contradictions to fix) | — | Low |
| `reference/` | 344 MB | 20,185 | Read-only requirement: Pager (33 MB, the behaviour reference incl. its own node_modules) and Brickflow (312 MB, previous attempt) + its audit `report.txt` + `EXECUTION-DOCUMENT.md` | Named by CLAUDE.md and specs; not imported by any code | KEEP (Pager); LEGACY (Brickflow et al.) | RM-13 with user approval only | High |
| `.cache/` | 1,300 MB | 56,143 | Session scratch, proof logs, impact state, stale copies | Tools write/read `.cache/impact/*`, `.cache/logs/*`; docs/checklist cite logs | Mixed GENERATED/LEGACY | Phased (see §10, §11, §18) | High (copies) |
| `.playwright-mcp/` | 6 MB | 101 | Browser-tool scratch (screenshots, console logs) | The Playwright MCP sessions only | GENERATED | RM-03 | Low |
| `.memory/` | <1 MB | 7 | User-authored memory + audit checklist; two files imported by CLAUDE.md | CLAUDE.md import; the agent reads them | KEEP live; consolidate older sets | CO-02 | Medium |
| `dist/` | 4 MB | 4 | Build output (app + `proofs.js`) | e2e webServer rebuilds it; preview serves it | GENERATED | RM-04 | Low |
| `test-results/` | <1 MB | 1 | Playwright `.last-run.json` | Playwright only | GENERATED | RM-08 | Low |
| `node_modules/` | 315 MB | 21,687 | Installed deps | Everything | GENERATED | RM-05 (free to reinstall) | Low |
| `.git/` | 45 MB | — | Repository (directory, not a pointer file; single worktree; no submodules) | Git only | KEEP | — | — |

---

## 5. Live Code and Suspected Dead Code

**Entry points found:**

| Entry | How it starts |
|---|---|
| `index.html` | Vite/HTML entry → `src/main.tsx` (`<script type="module" src="/src/main.tsx">`) |
| `src/main.tsx` | Boots the editor (`App.tsx`), installs the read-only test port (`installTestPort`, main.tsx:10) and injects the icon sprite (`icons.svg?raw`, main.tsx:5) |
| `vite.config.ts` | Dev/build; imports `src/config/product.ts` and `tools/runner/tooth-plugin.ts` |
| `vite.proofs.config.ts` | Library build of `tests/support/proofs.ts` → `dist/proofs.js` |
| `playwright.config.ts` | E2E; `globalSetup/Teardown` = `tests/support/global-{setup,teardown}.ts`; reporters `tools/runner/status.ts`, `tools/impact/checkpoint.ts`; testDir `tests/e2e` |
| `vitest.config.ts` | Unit; `src/**/*.test.ts(x)` + `tools/**/*.test.ts` |
| `eslint.config.js` | Lints with `tools/lint/plugin.ts` (+ `style-values.ts`) |
| npm scripts (package.json:9-27) | `check`→`tools/impact/check.ts`; `e2e:tooth`→`tools/runner/tooth.ts`; `gen`/`gen:check`→`tools/gen/*`; `verify:fast`→`tools/verify/parallel.ts`; `manifest:check`→`tools/manifest/check.ts`; `manifest:map`→`tools/manifest/map-features.ts`; `design:shots`→`tools/design/shots.ts` |
| `.claude/launch.json` | `npm run dev` (builder-dev, 5320); `npx vite .cache/pager-run` (5330) |
| `.mcp.json` | Playwright MCP server for the browser tooling |

**Dynamic wiring accounted for:** `src/manifest/runtime.ts:26-29` loads `manifest/commands/*.json`, `manifest/{checks,elements,environment,interactions,layout,properties}.json` and `manifest/generated/html-elements.json` through `import.meta.glob` — the app's only registry-driven wiring. `tools/manifest/load.ts` reads the whole `manifest/` tree from disk (Node side). No `require()`, no lazy imports, no other globs exist (searched: `import.meta.glob|require\(|React.lazy|lazy\(|await import\(` — only the hits above). Assets: `src/ui/icons.svg` (imported by `src/main.tsx:5`), `src/ui/tokens.css` and the shell stylesheets (CSS side-effect imports: `src/editor/shell/shell.css`, `settings.css`, `src/ui/tokens.css`).

**Reachability method and result:** the audit extracted all 443 relative import specifiers (`from '…'` across `src`, `tests`, `tools`, configs) and counted, per source file, the files importing its extension-qualified filename. Every non-test file has ≥1 importer; the only files with none are 46 `src` unit tests + 5 `tools` unit tests (collected directly by Vitest), `src/main.tsx` (HTML entry), `src/app/commands.typecheck.ts` (by design — its header says "Nothing imports this file"; it is included in the `tsconfig.app.json:23` program and proves table completeness via `@ts-expect-error`), and `src/i18n/i18n.test.ts` (unit test). Meaningful examples verified by hand: `src/core/files/assets.ts`, `src/core/style/{recipes,units,transform,custom,alignment,background-image}.ts`, `src/core/geometry/{align,anchors}.ts`, `src/core/project/{project,recovery}.ts` are each imported by `src/app/commands.ts` (the command table); `src/editor/css-support.ts` by `src/editor/store.ts`; `src/editor/canvas/*.tsx` by the shell; `tools/measure/*` by `docs/testing/README.md`-documented manual runs and each other; `tools/runner/unzip.ts` by the scenario runner; `tools/lint/style-values.ts` by the lint plugin.

**Conclusions:**

- **Live production code**: all 246 files under `src/` (with the entries above) — no suspected dead module.
- **Unused exports**: not exhaustively verified (no tool run; the repo enforces `noUnusedLocals` but has no unused-export check). Classified as a known gap (§19).
- **Functionality declared but not built**: the manifest declares many commands whose entries are `NOT_AVAILABLE_YET` and ARCHITECTURE lists "planned" owner modules that do not exist yet. This is the project's explicit contract pattern (a door is shown disabled until built), not dead code.
- **Files used only by tooling**: `tools/**` (by design), `tests/support/proofs.ts` (only by the `build:proofs` entry), `src/editor/test-port.ts` (read-only test API installed in every build — main.tsx:10,34 — so the tests read the real app), `src/app/commands.typecheck.ts` (tsc program only).
- **`tools/manifest/map-features.ts`** is a historical verification tool: its input `features.json` no longer exists in the tree ("it was deleted after this check", map-features.ts:5); it reads from git when given `--rev`. RV-06.

---

## 6. Duplicate Implementations and Architectural Conflicts

The project's own rule is "one concept, one owner" (ARCHITECTURE.md:3), enforced by `manifest:check` rule `owner` and lint rules. Spot checks of the most-likely duplication sites found **no second implementation** in `src/`:

| Candidate pair | Verdict | Evidence |
|---|---|---|
| `src/core/elements/address.ts` vs `src/core/text/inline.ts` (`isSafeHref`, `isSafeSource`) | **Not a duplicate** — thin delegates | inline.ts:38-47 calls `readAddress(...).ok`; the one rule lives in address.ts:34-62; consumers: validate.ts:12,209 · page/settings.ts:19 · attributes.ts:22 · link.ts:21 · background-image.ts:15 · codecs.ts:28,388-420 |
| `src/manifest/check.ts` (library, 2,223 lines) vs `tools/manifest/check.ts` (CLI) | **Not a duplicate** — library + CLI wrapper | tools/manifest/check.ts:3 imports `checkManifest` from it; consumers: tools/gen/types.ts:11, tools/impact/check.ts:142, tools/manifest/{load,plants,check.test}.ts |
| `src/core/store/store.ts` vs `src/editor/store.ts` | **Not a duplicate** — core store vs React binding | ARCHITECTURE.md:20,45 names both owners distinctly (`useSyncExternalStore` binding) |
| `src/core/clipboard/clipboard.ts` vs `src/editor/clipboard.ts` | **Not a duplicate** — port contract vs the browser reader | ARCHITECTURE.md:63 vs :92 |
| `src/core/project/tab-guard.ts` vs `src/editor/persistence/tab-guard.ts` | **Not a duplicate** — command vs Web-Locks port | ARCHITECTURE.md:126 |
| `src/core/project/zip.ts` (writer) vs `tools/runner/unzip.ts` (reader) | **Deliberately separate** | unzip.ts:5: "written apart from the editor's own writer … so a wrong writer cannot pass its own test" |
| `src/core/geometry/snap.ts` vs `src/editor/view/snap.ts` / `src/editor/canvas/snapping.ts` / `snap-lines.tsx` | **Not a duplicate** — rule vs preferences vs measurement vs drawing | ARCHITECTURE.md:75,186 |
| `src/core/style/spacing.ts` vs `src/editor/inspector/spacing.ts` | **Not a duplicate** — command vs link preference | ARCHITECTURE.md:152,170 |
| `tests/e2e/door.ts` | **Test helper**, not app code | runs manifest doors and annotates them for the census |

Structural/duplicate-material conflicts that **are** real:

| ID | Conflict | Evidence | Resolution |
|---|---|---|---|
| RV-01 | **Eleven full copies of this project (or of an older state) under `.cache/`** | `.cache/wt/*` (10 dirs, each with `node_modules`), `.cache/ts`, `.cache/audit`; their `.git` files are pointers to `C:/Users/jonathanrodriguesti/Documents/builder/.git/worktrees/<name>` (e.g. `.cache/wt/integration/.git`), an external path this audit did not follow; `git worktree list` shows only the main checkout, so the copies are orphaned | Verify uniqueness against the old repository (outside this root) before removal; then delete as one batch |
| RV-02 | **Docs describe an enforcement that is absent** | docs/testing/README.md:15 and ARCHITECTURE.md:81 ("the hooks of `.claude/settings.json`") vs `.claude/settings.json` absent from HEAD (`git ls-files .claude` → only `launch.json`; the file's lineage is in the pre-baseline history only — `merge-base --is-ancestor d5994f8 integration` fails) and PROGRESS.md:7 ("the guard hooks are off") | Either restore the file from `.cache/old-root/claude-settings-guard.json.bak` (updating it per the user's guard corrections) or amend CLAUDE.md/docs/ARCHITECTURE |
| RV-03 | **A unit test contradicts the single address rule** | `src/core/text/inline.test.ts:41` expects `false` for `/about`, `about.html` and `''`; `src/core/elements/address.ts:52-62` returns `true` for all three (relative path accepted; empty removes; inline.ts:38-47 delegates) — likely a stale test (red `npm run unit`), unverifiable without executing | Run the unit suite; if red, fix the stale test with the before/after shown (project rule) |
| — | **`AGENTS.md` vs `CLAUDE.md`** | Two agent-instruction files; AGENTS.md is Portuguese, cites the retired Codex workflow, external paths and ports 5341/5311 that conflict with `.claude/launch.json` (5320) and `docs/testing/README.md` (5310) | RM-02 |
| — | **`manifest/generated/*` tracked by design** | `npm run gen:check` fails on hand edits/staleness (tools/gen/check.ts:2-5), so committing generated files is intentional | No action; documented |
| — | **`.cache/investigation-report.md` + `.cache/symbol-table.md` vs current docs** | The investigation report (2026-09-24) analyses Brickflow/Pager; the symbol table is the icon mapping now living in DESIGN.md:264 | CO-03 |

---

## 7. Documentation Audit

| Document | Lines/Size | Current / obsolete | Notes |
|---|---|---|---|
| `CLAUDE.md` | 90 lines | Current | The working agreement; imports `.memory/builder-brief.md` + `.memory/builder.md` |
| `DESIGN.md` | 278 lines, 65 KB | Current | Interface contract; declares a/b/c mockups history at line 20; carries the audit items' decisions |
| `ARCHITECTURE.md` | 190 lines, 110 KB | Current | Ownership map; the "Command owners" table names **planned modules that do not exist yet** (animation, events, import, pages, css-rule, code-panel, explorer, timeline, editor-view) — the roadmap, correctly separated |
| `PROGRESS.md` | 60 lines | Current (at its 60-line cap) | Open findings 35–62; older items moved to `docs/history.md` |
| `docs/history.md` | 1,551 lines | Current, grows append-only | Decisions, proofs, moved findings; contains the flaky-test evidence the strategy requires |
| `docs/testing/README.md` | 230 lines | Current, 2 contradictions | Line 15 hooks (RV-02); line 4 `.cache/measure/results.jsonl` (RV-05, dir absent) |
| `AGENTS.md` | 8 lines | **Obsolete** | Portuguese; retired Codex workflow; external paths; conflicting ports (RM-02) |
| `reference/report.txt`, `reference/EXECUTION-DOCUMENT.md` | 1 MB total | Historical (declared "do not copy / do not follow") | Keep as reference material; excluded from action |
| `.cache/investigation-report.md` | 78 KB, 2026-09-24 | Historical, unique | The Brickflow/Pager investigation; not duplicated in `docs/` (CO-03) |
| `.cache/symbol-table.md` | 3.5 KB | Superseded | Same mapping as DESIGN.md:264 |
| `.memory/*.md` (7) | 245 KB total | Mixed | `builder-brief.md` (orders in force, 84 KB), `builder.md` (60-line live memory), `audit-checklist.md` (33 KB); older sets (`builder-brief-earlier.md`, `builder-brief-old.md` — explicitly "not imported", `auditor-brief.md`, `auditor.md` — the retired auditor persona) (CO-02) |
| `spec/behavior/*.md` (143) | 7.5k lines + 164 PNGs | Current | Behaviour of Pager + "Problems in Pager" corrections; the source for scenarios |
| `builder-5-audit-prompt.md` | 354 lines | Audit input | Excluded from findings |

**Unique knowledge that must not be lost:** (1) the literal user orders in `.memory/builder-brief.md`; (2) the item ledger in `.memory/audit-checklist.md` (status/commit/log/verification per audit item); (3) `docs/history.md` decisions with their reasons; (4) the measured strategy in `docs/testing/README.md` (worker tables, traced causes, flaky-test evidence); (5) the raw proof logs in `.cache/logs/` referenced by the checklist; (6) `.cache/old-root/claude-settings-guard.json.bak` — the only copy of the hook wiring; (7) `reference/Pager` as the behavioural reference for unbuilt features; (8) `.cache/investigation-report.md`; (9) `design/final/tokens.json` (source of the design tokens).

**Consolidation target:** a small canonical set — `CLAUDE.md` (how to work), `DESIGN.md` + `ARCHITECTURE.md` + `manifest/` + `spec/` (what to build), `PROGRESS.md` + `docs/history.md` (state), `docs/testing/README.md` (how it is validated), plus the live `.memory` pair — with history/audits/prompts moved under one `docs/history/` area if the user wishes.

---

## 8. Language and Naming Audit

The intended language is English for all project-owned content. Result: **the project is already English in every structural place**; no rename is needed.

Findings:

| Where | Content | Occurrences | Judgement |
|---|---|---|---|
| `AGENTS.md` | Full Portuguese prose (the retired Codex instructions, e.g. "Navegador: usar o browser embutido…") | 8 lines, 6 accented | **Real Portuguese document** → RM-02 (remove/rewrite) |
| `src/i18n/locales/pt-BR.json` | The product's Brazilian-Portuguese catalogue | 707 accented lines | **Intentional** (DESIGN.md "UI language"; the only allowed locale besides en) |
| `src/i18n/locales/en.json` | 5 accented lines — all `×` glyphs and "Português (Brasil)" | — | Intentional |
| `src/i18n/glossary.json` | 3 accented lines — pt-BR terms ("Traço") + notes quoting "Espaço"/"Espaçamento" | — | Intentional (glossary is bilingual by contract) |
| `design/{a,b,c,final}/index.html`, `design/shared/site.css` | Sample site content (Aurora café) and pt-BR mockup labels | 54–158 accented lines per mockup | **User content / history**; DESIGN.md:243 states sample content is never translated |
| `docs/history.md` | 22 accented lines — quoted user decisions and UI strings (verbatim records) | — | Intentional (historical record) |
| `spec/behavior/*.md` (≈60 files, 1–15 accented lines each) | Quoted pt-BR UI strings/labels in an English text (e.g. "Assinar agora · :hover"; `resize-handles.md` quotes pt-BR status messages) — plus the `×` multiplication sign, which accounts for most hits | Sample per file: 15 max | Intentional |
| `manifest/features/*.json`, `manifest/interactions.json` | Scenario steps quoting UI text in pt-BR ("Português (Brasil)", "Página") and `×` notes | 13 in interactions.json | Intentional (contract data) |
| `tools/manifest/map-features.ts:214-223`, `tools/manifest/check.test.ts:187,341-343`, `tools/lint/plugin.test.ts:301` | pt-BR strings in test/verification fixtures ("Português (Brasil)", "Olá, mundo", "Página") | <10 | Intentional (tests of the locale machinery) |
| `.memory/*.md` | Portuguese user orders and briefs (not tracked, by design) | 7 files | **User-authored; keep as-is** (optionally translate later — the user's call) |
| `reference/Pager/**` | The legacy app's own Portuguese (package description, UI) | third-party legacy | **Excluded** (third-party code) |
| `src/**` identifiers, CSS classes, test IDs, routes, storage keys | No Portuguese found; no accented filenames anywhere under `src`, `tests`, `tools`, `manifest`, `spec`, `docs`, `design` (checked by filename glob) | 0 | Clean |
| `manifest/generated/*`, `src/generated/*`, `package-lock.json` | Excluded as generated/lockfile | — | — |

Impact of renames: none required. Removing/rewriting `AGENTS.md` affects no API, storage key, URL or selector. The only pt-BR strings that must stay are the i18n catalogue, the glossary, the quoted UI text inside specs/scenarios (they are the expected strings), and sample site content.

---

## 9. Tests and Development Infrastructure

| Subsystem | Purpose / entry command | Actual consumers | Verdict | Cost |
|---|---|---|---|---|
| Unit suite (Vitest) | `npm run unit`; 46 `src` + 5 `tools` test files | `npm run check` (impact-selected), `verify:fast` | Essential; exercises modules and the manifest library | 15.6k lines across tests; ~14 s of tool-level tests per docs |
| E2E suite (Playwright, `channel: chrome`) | `npm run e2e`; 121 spec files + the runner's generated scenario tests (163 per docs) | `npm run check` (selected), the checkpoint | Essential; tests enter only through doors and assert end artifacts | 121 spec files; tests/e2e + tests/support |
| Scenario runner | `tools/runner/scenarios.ts` — one test per scenario × door from the manifest; `status.ts` prints derived status; `tooth.ts` + `tooth-plugin.ts` = the tooth proof (`npm run e2e:tooth`) | `scenarios.spec.ts`, playwright reporters, `npm run check` | Essential and the project's core idea (manifest → tests); no parallel path — the runner drives the real app | 2,067 lines (tools/runner) |
| Census | `tests/e2e/census.spec.ts` — every door must be covered by a test and every registered feature must run | full-suite runs only | Essential guard | in tests/e2e |
| Impact system | `tools/impact/{check,impact,analyze,statics,checkpoint}.ts` — the dependency map, limited validation, static-check ledger, checkpoint records | `npm run check`, `verify:fast`, guard.ts, measure/baseline, playwright reporters | Essential to the validation cycle; ~1.1k lines; drives `.cache/impact/map.json` (78 MB, regenerated by runs) | 1,138 lines |
| Contract generation | `npm run gen` / `gen:check` — `tools/gen/*` writes `src/generated/*`, `manifest/generated/*`, `src/ui/tokens.css`, `src/ui/icons.svg` | `verify:fast` first step; `npm run check` always runs `gen:check` | Essential (generated files are committed and verified fresh) | 1,592 lines |
| Manifest checker | `npm run manifest:check` — `tools/manifest/check.ts` over `src/manifest/check.ts` (2,223 lines) + plants (each rule's planted defect) + unit tests | `verify:fast`, `npm run check` (always), `tools/impact/check.ts:142` | Essential; the contract's enforcement | 2,099 lines |
| Lint contract | `npm run lint`; `tools/lint/plugin.ts` (+ `style-values.ts`) rules: use-ports, no-literal-ui-string, use-tokens (TSX + CSS), pointer-owner, gesture-owner, frame-owner, keyboard-owner, no-manifest-id | `eslint.config.js`; `npm run check` runs lint on changed files | Essential; enforces single-owner rules mechanically | 1,139 lines |
| Measurement harness | `tools/measure/*` — cost of commands, change scenarios, planted bugs, baseline (docs/testing/README.md §"Proofs") | **Manual runs only** (documented commands; no npm script) | Useful but meta: it measures the *process*, not product behaviour; keep, but it is the least load-bearing subsystem | 423 lines |
| Verify:fast | `tools/verify/parallel.ts` — typecheck+lint+unit+manifest:check in parallel, records a checkpoint | `verify:fast` script; checkpoint for pushes to main | Essential | 30 lines |
| Guard (hooks) | `tools/hooks/guard.ts` + `guard.test.ts` — turn-end/commit/push gating | **None currently**: the hook settings file is absent (RV-02); the unit test still runs under Vitest | Keep the code; decide the wiring | 215 lines |
| Design shots | `npm run design:shots` — renders `design/final/index.html` in Chrome; fails on clipped text, small targets, console errors, misplaced controls, wrong i18n text | Manual/periodic runs; writes `design/final/shots/*.png` | Useful interface guard | 278 lines |
| Test support | `tests/support/{test.ts,editor.ts,proofs.ts,global-setup.ts,global-teardown.ts}` — the one test fixture (records coverage/classes), the one editor opener, the browser-side proofs bundle, the map recording | Every e2e test (lint-enforced import path) | Essential; the proofs bundle is test-only by construction and re-exports app modules (no parallel implementation) | 5 files |

Concern flagged by the audit brief ("infrastructure that measures process rather than real product behaviour"): `tools/measure/*` belongs to this category (by design and documented); `tools/impact/*` measures which tests to run but gates on real build artifacts and real test results, and the guard rails it feeds are what keep `main` green — it is load-bearing, not ceremony.

Tests exercise real paths: the scenario runner drives the app through manifest doors on the real Chrome with real input; the census walks every door; the proofs bundle loads the app's own modules from the served build. No test-only fork of the application was found.

---

## 10. Generated Files, Caches and Artifacts

| Path | Size / files | Regenerator | Git | Classification |
|---|---|---|---|---|
| `node_modules/` | 315 MB / 21,687 | `npm ci` (lockfile present) | ignored | GENERATED — safe removal |
| `dist/` | 4 MB / 4 | `npm run build` + `npm run build:proofs` (e2e webServer does it) | ignored | GENERATED — safe removal |
| `test-results/` | 1 file | Playwright on each run | ignored | GENERATED — safe removal |
| `.playwright-mcp/` | 6 MB / 101 (screenshots + `console-*.log`; newest 398 KB) | Using the browser tool | ignored | GENERATED — safe removal; logs may be evidence until the current block ends |
| `.cache/impact/map.json` | 78 MB | A full e2e run (`global-teardown.ts` → `writeMap`, impact.ts:22) | ignored | GENERATED — removal costs a full re-run to rebuild vouching |
| `.cache/impact/{statics,checkpoint,stop}.json`, `selection-14496.json`, `raw/` | 83 MB dir | `npm run check` / runs / guard | ignored | GENERATED (stale: selection-14496.json is from 2026-09-25) |
| `.cache/logs/` | 38 MB / 1,511 files, incl. 58 `uso-*` dirs | Every measured command, tooth run, uso session | ignored | **Historical evidence** referenced by `.memory/audit-checklist.md` — preserve or archive before removal (CO-04) |
| `.cache/scratch/` | 5 MB / ~350 files (`.mjs` probes, `.bak` copies, notes) | Written ad hoc during items; rule says "deleted when the item ends" | ignored | SAFE REMOVAL (spot-keep the checklist backup) — RM-06 |
| `.cache/old-root/` | 32 MB | Snapshot of the pre-move root | ignored | LEGACY — contains the only hook settings (RM-09, MV-02) |
| `.cache/{ts,audit,wt/*}` | 1,124 MB / ~11 trees | Copies of the project; not regenerable | ignored | REQUIRES REVIEW before removal (RV-01) |
| `.cache/pager-run/` | 11 MB | Copy of `reference/Pager` (CLAUDE.md workflow; launch.json `pager-run`) | ignored | KEEP (documented, regenerable by copying Pager again) |
| `.cache/pager-invest/` | 2 MB | The Sep-24 investigation's run copy | ignored | GENERATED — safe removal (RM-06) |
| `.cache/{pw-tooth,e2e-build,shots}/` | <10 MB | Tooth runs (`.cache/pw-tooth` JSON output), build scratch, screenshots | ignored | GENERATED — safe removal (RM-06) |
| `manifest/generated/*.json` (css-compat 6.4 MB, css-properties, html-elements, icons) | 7 MB | `npm run gen` (offline, from installed packages) | **tracked, verified fresh by gen:check** | GENERATED-BY-DESIGN — keep committed |
| `src/generated/*.ts` (ids, commands, value-lists) | 5.1k lines | `npm run gen` | tracked, verified | GENERATED-BY-DESIGN — keep committed |
| `src/ui/tokens.css`, `src/ui/icons.svg` | small | `npm run gen` (from `design/final/tokens.json` / Lucide) | tracked, verified | GENERATED-BY-DESIGN — keep committed |
| `design/*/shots/*.png` (56 files) | ~9 MB | `npm run design:shots` | tracked (the visual contract's evidence) | GENERATED-BY-DESIGN — keep committed |

---

## 11. Legacy Material, Copies and Worktrees

| ID | Path | What it is | Evidence | Risk |
|---|---|---|---|---|
| RV-01 | `.cache/wt/{integration, drag-level-keys-escape, elements-structure, export-zip, inspector-number-fields, props-attributes, semantic-tag-switch, style-contracts-2, text-inline-formatting, work22}` (409 MB) | Ten project checkouts. Each carries a `.git` **pointer file** to an external git dir, e.g. `.cache/wt/integration/.git` → `gitdir: C:/Users/jonathanrodriguesti/Documents/builder/.git/worktrees/integration`. `git worktree list` shows only the main checkout and `.git/worktrees` is empty here, so these are orphaned copies from the pre-move location. `work22` holds only an empty `node_modules`. `PROGRESS.md:7` calls them "stale". | Not followed (external path), per scope rules | **High** — they may hold unique uncommitted work from the old location; verify against that repository (outside this root) before deleting |
| RV-01 | `.cache/ts/` (370 MB), `.cache/audit/` (345 MB) | Two more full checkouts (src, tests, tools, manifest, dist, node_modules); `.git` pointers to the same external location (`…/builder/.git/worktrees/ts`, `…/worktrees/audit`) | Same | **High** — same verification needed |
| RM-09 | `.cache/old-root/` (32 MB) | Snapshot of the project root before the move (docs, manifest, src, tools, package files, `dist`, plus `claude-settings-guard.json.bak` — the only copy of the hook settings) | Listed contents; `.bak` read in full | Medium — preserve the `.bak` (MV-02) before removal |
| RM-13 | `reference/Brickflow/` (312 MB + its own node_modules), `reference/report.txt`, `reference/EXECUTION-DOCUMENT.md` | The previous attempt, its audit and its plan; CLAUDE.md says "do not copy / do not follow" | CLAUDE.md; sizes | High if touched without the user's word — read-only material |
| — | `reference/Pager/` (33 MB) | The legacy application this project replicates behaviourally; specs cite it `path:line` | CLAUDE.md; specs; `package.json` name `base-page-editor` | KEEP |
| — | `.cache/investigation-report.md`, `.cache/symbol-table.md`, `.cache/survey.json` | 2026-09-24 analyses of Brickflow/Pager; the symbol table duplicates DESIGN.md:264 | File headers/dates | Low — CO-03 |
| — | `design/{a-classic-refined,b-pen,c-studio}/` + `design/OPTIONS.md` | Three option mockups + comparison; DESIGN.md:20 declares them history | DESIGN.md:20 | Low — CO-01 |
| — | `refs/impact/938c2d5abe7d2f13` → `0a4ab56` "impact snapshot" (2026-09-27 19:19) | A ref created by `tools/impact/impact.ts:78` (`git update-ref refs/impact/<hash(process.cwd())>`); the name encodes the working directory of the run | impact.ts:78 | Low — tooling state; stale names accumulate if the tree moves (RV-07) |
| — | Orphaned history | `integration` is a fresh lineage (root commit `2d8dc18`, no parents); it shares **no ancestor** with `origin/main` (119 commits) or `origin/integration` (212 commits not in local); the pre-consolidation history (including `.claude/settings.json` and the older `AGENTS.md` lineage) is reachable only through those remote refs | `merge-base` fails; `rev-list --left-right --count` = 212/56 | Informational — the remotes still hold the old world |

---

## 12. Fixed-Path Dependencies

| Path / variable | Consumer (file:line) | Why | What must change if reorganised |
|---|---|---|---|
| `PORT` env (required, strict) | vite.config.ts:9-15, 44-54 | Dev/preview port; `npm run dev` and the e2e `vite preview` both read it | Keep; the var name is contractual (CLAUDE.md) |
| `E2E_PORT` (default 5310), `E2E_WORKERS` (default 4), `E2E_SELECTION`, `E2E_PREBUILT`, `E2E_BUILD`, `E2E_RECORD`, `E2E_SNAPSHOT` | playwright.config.ts:8-38, 61-65; vite.config.ts:57; tests/support/global-setup.ts:12-13 | E2E serving, worker count, selection, build flags | Keep names |
| `TOOTH_COMMANDS`, `TOOTH_MODULE`, `TOOTH_PORT` | tools/runner/tooth.ts; tools/runner/tooth-plugin.ts; vite.config.ts:49 | The tooth proof's switch | Keep |
| `.cache/impact/{map,statics,checkpoint,stop}.json`, `.cache/impact/raw/`, `.cache/pw-tooth`, `.cache/logs`, `.cache/measure`, `.cache/scratch/assets-shot.png` | tools/impact/impact.ts:22-23, 78; tools/impact/checkpoint.ts:11; tools/hooks/guard.ts:121; tools/runner/tooth.ts:54; tools/measure/measure.ts:137-139, 237; tests/support/test.ts:15; tests/e2e/explorer-assets.spec.ts:29 | Relative to **CWD**; every tool assumes it runs from the project root | If `.cache/` is reorganised or tools run from elsewhere, all these paths break; writers must create their dirs (`measure.ts` does; verify the others when cleaning) |
| `refs/impact/<hash(process.cwd())>` | tools/impact/impact.ts:78 | Git ref name derived from the run's directory | Moving the project orphans old refs |
| `reference`, `.cache`, `.playwright-mcp` (names at the root) | vite.config.ts:27-29 (realpath of `process.cwd()`); playwright.config.ts:14-29 (regex built from the config file's directory — layout-safe); vitest.config.ts:7; eslint.config.js:16; tsconfig.app.json:24, tsconfig.node.json:22 | Keep tooling out of those folders | Renaming/moving those folders requires updating all five |
| `$CLAUDE_PROJECT_DIR/tools/hooks/guard.ts` | `.cache/old-root/claude-settings-guard.json.bak` (the only copy of the hook config) | Hook wiring | If hooks return, this path must hold in the restored `.claude/settings.json` |
| `.cache/pager-run` | `.claude/launch.json` (`pager-run` config runs `npx vite .cache/pager-run`) | Serves the Pager copy | Keep the copy, or update launch.json |
| `design/final/tokens.json` → `src/ui/tokens.css`; `src/ui/icons.svg` | tools/gen/tokens.ts, tools/gen/icons.ts; eslint.config.js:11 (`TOKENS`) | Token sprite generation + lint rule read | Keep paths or update gen + lint |
| `manifest/**`, `src/i18n/**`, `spec/**`, `tools/**`, `design/**` relative reads | tools/manifest/load.ts:7 (`REPO_ROOT` from `import.meta.url` — layout-safe); src/manifest/runtime.ts:26-29 (`import.meta.glob` — bundler-resolved) | Contract reads | Mostly layout-safe already |
| Windows-specific command form | `.mcp.json`: `cmd /c npx -y @playwright/mcp@latest` | Spawns the MCP server on Windows | A Linux/macOS host needs a different command form |
| `GIT_CONFIG_COUNT/KEY_0/VALUE_0` safe.directory workaround | Recorded in docs/history.md (git runs against a directory owned by another account) | Ownership mismatch | Environmental, not a project file |
| `eol=lf` | .gitattributes:1 | Line endings across platforms | Keep |

---

## 13. Candidates for Removal

| ID | Path | Purpose | Evidence / Consumers | Classification | Recommended Action | Risk |
|----|------|---------|----------------------|----------------|--------------------|------|
| RM-01 | `.dependency-cruiser.cjs` | Dependency-cruiser config | **No consumer**: absent from `package.json` (deps+scripts), absent from `package-lock.json`, no reference in `tools/`, `src/`, `tests/`, configs or docs (rg "dependency-cruiser" → the file itself) | SUSPECTED DEAD | Delete (the one file that matched nothing else) | Low |
| RM-02 | `AGENTS.md` | Retired Codex-session instructions (PT) | The user's 2026-09-26 order ends the Codex workflow; its ports (5341/5311) conflict with launch.json/docs; it cites external paths | LEGACY | Delete, or replace with an English stub pointing to CLAUDE.md | Low |
| RM-03 | `.playwright-mcp/` | Browser-tool scratch (101 files, 6 MB) | Written by the Playwright MCP sessions; nothing reads it | GENERATED | Delete; retain the newest `console-*.log` only while a finding uses it | Low |
| RM-04 | `dist/` | Build output | Rebuilt by `npm run build`(+`:proofs`); e2e webServer rebuilds it | GENERATED | Delete freely | Low |
| RM-05 | `node_modules/` | Dependencies | `npm ci` restores from the lockfile | GENERATED | Delete freely (never commit) | Low |
| RM-06 | `.cache/scratch/` | Ad-hoc probes/backups (~350 files) | CLAUDE.md rule: deleted when the item ends; nothing in the repo reads it | SAFE REMOVAL CANDIDATE | Archive `audit-checklist.bak` into `.memory/` if wanted, then delete the rest | Low |
| RM-07 | `.cache/{pw-tooth,e2e-build,shots,pager-invest}/` | Tooth report output, build scratch, screenshots, investigation copy | Regenerable/expendable; `pager-invest` is a copy of reference/Pager | GENERATED | Delete | Low |
| RM-08 | `test-results/` | Playwright output | Regenerated each run | GENERATED | Delete freely | Low |
| RM-09 | `.cache/old-root/` | Pre-move root snapshot | Contains docs/manifests/src of the old state **and** the only copy of the hook settings | LEGACY | **Extract `claude-settings-guard.json.bak` first** (MV-02), then delete | Medium — unique settings inside |
| RM-10 | `.cache/wt/work22/` | Leftover shell: one empty `node_modules` | Nothing else inside | SAFE REMOVAL CANDIDATE | Delete | Low |
| RM-11 | `.cache/impact/{map,statics,checkpoint,stop}.json`, `selection-14496.json` | Tool state | Regenerated by runs (map by a full suite; statics/checkpoint by checks) | GENERATED | Delete only if a full rebuild is acceptable | Low |
| RM-12 | `.cache/logs/` (if archived) | Proof logs | Referenced by `.memory/audit-checklist.md` | LEGACY | Archive referenced logs (CO-04) before deleting the rest | Medium — evidence |
| RM-13 | `reference/Brickflow/`, `reference/report.txt`, `reference/EXECUTION-DOCUMENT.md` | Previous attempt + audit + plan | CLAUDE.md "do not copy / do not follow"; read-only material | LEGACY | **Only with the user's explicit approval**; 312 MB | High — user-owned reference |
| RV-01 | `.cache/wt/*` (9 real trees), `.cache/ts/`, `.cache/audit/` | Orphaned project copies (1,124 MB) | `.git` pointer files to an external old repo location; `git worktree list` does not know them | REQUIRES REVIEW | Verify uniqueness against the external repo, then delete as one batch | High — possible unique uncommitted work |

---

## 14. Candidates for Consolidation

| ID | Paths | Shared responsibility | Evidence | Recommended Action | Risk |
|----|-------|-----------------------|----------|--------------------|------|
| CO-01 | `design/a-classic-refined/`, `design/b-pen/`, `design/c-studio/`, `design/OPTIONS.md` (+ 39 shots, 3 tokens.json/css) | Three option mockups of the same interface | DESIGN.md:20 declares them history; only `final/` is the contract | Move under `design/history/` (or keep one markdown summary + the shots), leaving `design/final/` alone | Low |
| CO-02 | `.memory/builder-brief-earlier.md`, `builder-brief-old.md`, `auditor-brief.md`, `auditor.md` | Superseded memory sets (older briefs; the retired auditor persona) | CLAUDE.md imports only `builder-brief.md` + `builder.md`; `builder-brief-old.md` says "not imported" | Merge into one `builder-brief-archive.md` (or delete after confirming the live pair holds everything); keeps `.memory` readable | Medium — user-authored orders |
| CO-03 | `.cache/symbol-table.md`, `.cache/investigation-report.md` | Icon mapping (now DESIGN.md:264) and the Brickflow/Pager investigation | Duplicate knowledge; the investigation is unique | Fold the investigation's still-relevant facts into `docs/history.md` (or one `docs/investigation.md`), then delete the cache copies | Low |
| CO-04 | `.cache/logs/` (1,511 files) + references in `.memory/audit-checklist.md` | Proof evidence | The checklist names logs per item | Archive the logs cited by open items into one evidence folder; prune the rest; update the checklist to point there | Medium — evidence trail |
| CO-05 | Docs vs `.claude/settings.json` | The validation cycle's enforcement | README:15 + ARCHITECTURE:81 vs absence in HEAD (RV-02) | Either restore the settings file (updated per the user's guard corrections: the guard judges the worktree of the git command; non-main commits need no check) or amend the three documents to say the hooks are off | Medium — process control |
| CO-06 | `AGENTS.md` + `CLAUDE.md` | Agent instructions | RM-02 | One instructions file only | Low |

---

## 15. Candidates for Relocation or Rename

| ID | Path | Why | Evidence | Recommended Action | Risk |
|----|------|-----|----------|--------------------|------|
| MV-01 | `.cache/old-root/claude-settings-guard.json.bak` → `.claude/settings.json` | Restores the hook wiring if the cycle is to be enforced again | RV-02; the `.bak` content (Stop + PreToolUse Bash/PowerShell hooks calling `tools/hooks/guard.ts`) | Copy back, updated per the user's orders (worktree judging; non-main commits free) | Medium — changes agent behaviour once present |
| MV-02 | `builder-5-audit-prompt.md` (root) | Audit input sitting in the root, untracked | Present in the working tree only | The user decides (keep, move under `docs/audits/`, or delete) — excluded from findings per instruction | — |
| MV-03 | `docs/history.md` (1,551 lines) | Fine where it is; will keep growing | CLAUDE.md/PROGRESS.md point to it | Optional: split by year/block if it passes comfortable size | Low |
| — | **Rename-to-English** | — | §8 found **no** Portuguese filenames, identifiers, classes, routes or storage keys | **No renames needed** | — |

---

## 16. Items That Must Be Preserved

1. `manifest/**` (the contract), `spec/behavior/**`, `src/**`, `tests/**`, `tools/**` — the working system.
2. `design/final/**` including `tokens.json` and `shots/` — the visual contract; `src/ui/tokens.css` and `src/ui/icons.svg` are its generated forms.
3. `.memory/builder-brief.md` (literal orders in force), `.memory/builder.md` (live memory), `.memory/audit-checklist.md` (item ledger with commit + log + verification per item).
4. `.cache/old-root/claude-settings-guard.json.bak` — the only copy of the hook settings (MV-01).
5. `.cache/logs/**` cited by the audit checklist — the raw evidence behind delivered items (CO-04).
6. `.cache/impact/map.json` + `statics.json` — the validation vouching state; losing them forces a full re-run before `npm run check` can vouch again.
7. `reference/Pager/**` — the behavioural source for unbuilt features (specs cite it line by line); read-only.
8. `.cache/investigation-report.md` — the only written record of the Brickflow/Pager investigation.
9. `docs/testing/README.md` + `docs/history.md` — measured strategy knowledge (worker tables, traced causes, flaky-test evidence) and the decision log.
10. `design/final/index.html` + `design/shared/**` — the mockup `design:shots` renders and DESIGN.md anchors on.
11. `package-lock.json`, `.gitattributes` (eol=lf), `.gitignore` — reproducibility.
12. The generated-but-tracked files (`src/generated/*`, `manifest/generated/*`, `tokens.css`, `icons.svg`, `design/*/shots`): they are the committed contract; `gen:check` fails if they are stale or hand-edited.

---

## 17. Cleanup Risks

1. **The orphaned copies may hold unique work (RV-01, High).** `.cache/wt/*`, `.cache/ts`, `.cache/audit` are checkouts of an older repository whose git dir lives outside this root; their working trees cannot be proven clean from inside this boundary. Verify before deleting.
2. **The only hook settings live in a cache snapshot (RM-09/MV-01, Medium).** Deleting `.cache/old-root/` without extracting `claude-settings-guard.json.bak` loses the guard configuration irreversibly.
3. **Proof logs are the evidence trail (RM-12/CO-04, Medium).** `.memory/audit-checklist.md` cites logs in `.cache/logs/`; deleting the cache wholesale breaks the trail the user's orders require.
4. **Removing `.cache/impact/map.json` invalidates the limited validation's vouching (Medium).** `npm run check` would have to run everything once more before it can say a test is unaffected.
5. **The tree is being edited right now (Medium).** A concurrent builder session modified 11 more files and added `src/editor/shell/link-picker.ts` while this audit ran; any cleanup must start from a settled, committed tree, or it will collide with live work (see §19).
6. **`reference/` is read-only by contract (High if touched).** `reference/Brickflow` et al. are 312 MB of user-designated historical material; removal requires the user's explicit word.
7. **Documentation/tree drift already exists (Medium).** Hooks (RV-02) and `.cache/measure` (RV-05) show docs diverging from the tree; more such drift is likely if cleanup lands without a docs pass.
8. **Environment assumptions hide in relative paths (Low–Medium).** Every tool assumes CWD = project root and writes `.cache/` relative to it; run from elsewhere, they write elsewhere (guard.ts must judge the right repo; impact.ts poisons its ref names).

---

## 18. Proposed Target Project Structure

Target tree (tracked content only; ignored directories unchanged):

```
builder-5/
├─ package.json  package-lock.json
├─ index.html  vite.config.ts  vite.proofs.config.ts  vitest.config.ts  playwright.config.ts
├─ tsconfig.json  tsconfig.app.json  tsconfig.node.json  eslint.config.js
├─ .gitignore  .gitattributes  .mcp.json  .claude/launch.json (+ settings.json if hooks return)
├─ CLAUDE.md  DESIGN.md  ARCHITECTURE.md  PROGRESS.md            ← the canonical set
├─ manifest/                                                     ← the contract (unchanged)
├─ src/                                                          ← the application (unchanged)
├─ tests/{e2e,support}                                           ← unchanged
├─ tools/{gen,impact,lint,manifest,measure,runner,verify,design,hooks}
├─ spec/behavior/                                                ← unchanged
├─ design/final/**   design/history/** (CO-01; the three option directions + OPTIONS.md)
├─ docs/{history.md, testing/README.md}  docs/history/** (CO-03 archive, optional)
└─ reference/**                                                  ← untouched (Pager required; Brickflow only by user's word)
```

Suggested order of cleanup phases (dependencies noted):

1. **Preserve first** — extract `.cache/old-root/claude-settings-guard.json.bak` (MV-01); archive the logs cited by `.memory/audit-checklist.md` (CO-04); settle the concurrent work (commit/stash the builder session's files — with the user) so cleanup does not race live edits.
2. **Safe removals** — RM-03, RM-04, RM-05, RM-06, RM-07, RM-08, RM-10, RM-11 (all regenerable or empty). Verify each tool recreates its cache dirs (writers: `measure.ts:137-139` mkdirs; confirm `impact.ts`/`global-setup.ts` do likewise) before deleting `.cache/impact`/`raw`.
3. **Review-gated removals** — RV-01 (verify the orphaned copies against the external repository, then delete ~1.1 GB), RM-09 (after phase 1), RM-12 (after archiving), RM-13 (only with the user's approval), RM-01, RM-02.
4. **Path-dependency refactors** — none strictly required while the root layout holds; if `.cache` is relocated, update the §12 consumers; if hooks return, restore the settings with the user's worktree-judging corrections.
5. **Moves and renames** — CO-01 (design history), CO-02 (memory archive), CO-05 (docs vs hooks decision), plus the audit-input file's placement (MV-02, user's call).
6. **Consolidation of knowledge** — CO-03 (investigation/symbol table into docs), CO-04 (evidence folder), CO-06 (one agent-instructions file).
7. **Translation** — nothing to do in the tree (§8). Optionally the user may later translate `.memory/*` (their call; those are their own words).

Phases 1→2 are independent; 3 depends on 1 (and RV-01 on outside verification); 5 depends on 4 only if `.cache` moves; 6 can run any time.

---

## 19. Evidence

**Commands run (read-only).** Directory/size/count: `ls -la`, `du -sm`, `find … -type f | wc -l`, `wc -l`, `find … -printf "%s %p" | sort -rn`. Git (all with `--no-optional-locks` and a per-command `-c safe.directory=` — no config written): `rev-parse --show-toplevel`, `branch --show-current`/`-a`, `log --oneline`, `status --porcelain [--ignored]`, `worktree list`, `submodule status`, `for-each-ref`, `ls-files`, `ls-tree -r -l`, `merge-base [--is-ancestor]`, `rev-list --left-right --count`, `cat-file -e`, `check-ignore`, `show --stat`, `log --diff-filter=D`. Searches (`rg`): the import-specifier extraction (`from '…'`, 443 specifiers) and the per-file importer count; `import.meta.glob|require\(|React.lazy|lazy\(|await import\(`; `dependency-cruiser`; `isSafeHref|isSafeSource|readAddress|addressAllowed`; accented-character sweep (`[\x{00C0}-\x{00FF}]`) with per-file counts and filename globs; absolute-path sweep (`[A-Za-z]:[\\/]|/mnt/|/home/`); `process.cwd|__dirname|import.meta.url`; `process.env.[A-Z_]+`; literal `.cache` paths. No test, build, server, npm/npx, or network command was run.

**Key file:line references.** vite.config.ts:9-15,27-29,44-58 · playwright.config.ts:8-16,33,40-44,57-69 · vitest.config.ts:5-8 · package.json:9-27 · eslint.config.js:11,16,72 · tsconfig.app.json:23-24 · .gitignore:1-13 · ARCHITECTURE.md:3,34,81,91-190 · DESIGN.md:15,20,62,243,264 · docs/testing/README.md:4,15,102-111,216-231 · src/manifest/runtime.ts:26-29 · src/main.tsx:5,10,17,34 · src/app/commands.typecheck.ts:1-3 · src/core/elements/address.ts:20-62 · src/core/text/inline.ts:38-47 · src/core/text/inline.test.ts:39-42 · src/core/document/validate.ts:12,209 · tools/impact/impact.ts:22-23,78 · tools/impact/checkpoint.ts:11 · tools/hooks/guard.ts:121 · tools/runner/tooth.ts:54 · tools/measure/measure.ts:137-139,237 · tests/support/test.ts:15 · tests/e2e/explorer-assets.spec.ts:29 · .cache/old-root/claude-settings-guard.json.bak (whole) · .cache/wt/integration/.git (pointer) · tools/manifest/map-features.ts:5.

**Directories excluded from file-level reading:** `node_modules/`, `.git/` internals, `reference/` (other projects), `dist/`, `test-results/`, `.playwright-mcp/` (grouped only), large generated JSON (headers/sizes only), `.cache/wt/*`+`.cache/ts`+`.cache/audit` (measured; their git metadata not followed because it resolves outside the root).

**Known gaps.** (1) Nothing was executed, so red/green state is unknown; RV-03 is a static contradiction. (2) Unused exports inside live files were not exhaustively checked (no tool run; the repo has no unused-export check). (3) The uniqueness of the orphaned copies (RV-01) cannot be established inside this boundary. (4) `reference/` contents were sampled (sizes, provenance, report header), not read. (5) `map.json`/`css-compat.json` were inspected by size/header only. (6) Runtime behaviour of the guard, the dev server and the export was not exercised. (7) `.memory` files were audited by listing and headers (their live content is in the owning session's context).

**Concurrency.** The working tree changed between snapshots taken during this audit — from 7 modified + 3 untracked files at start (listed in the header) to 21 modified + 6 untracked at the end, including `manifest/commands/elements.json`, `manifest/features/{07,19}-*.json`, `manifest/interactions.json`, `src/app/commands.ts`, `src/core/structure/remove.ts`, `src/editor/{state.ts,canvas/frame.tsx,shell/{inspector,shell}.tsx}`, `src/generated/{commands,ids}.ts`, `src/i18n/locales/{en,pt-BR}.json`, `tools/runner/scenarios.ts`, and the new `src/editor/shell/link-picker.{ts,tsx}` — work of the concurrent builder session, not of this audit. **Completion check:** the final `git --no-optional-locks status --porcelain` shows the pre-existing builder-session entries plus exactly one new entry, `?? PROJECT-AUDIT.md`; HEAD is unchanged (`0d4f7c9`). The audit added no other file and changed none.

---

*End of audit. This report is the audit's only artifact (`PROJECT-AUDIT.md`); `builder-5-audit-prompt.md` and `PROJECT-AUDIT.md` are excluded from its findings.*
