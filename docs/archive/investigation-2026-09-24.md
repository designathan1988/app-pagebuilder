# Investigation report — registries, feature chains and break points (Brickflow, Pager)

Date: 2026-09-24. Read-only investigation. Nothing in the project or in `reference/` was edited. Scratch runs happened in `.cache/pager-invest` only.

**Legend.** Every claim carries a tag:
- **[obs]**: observed. I read the code or the git history, or I ran the command in this session.
- **[inf]**: inferred. This is my conclusion from observed facts.
- **[log]**: stated in the project's own log or report, and I could not re-observe it (for example, a raw log that no longer exists). I treat it as secondary evidence.

**Trees analysed.**
- `reference/Brickflow`: HEAD `7803419` ("A20: …"), tree `f03283d`. This is the same tree hash `report.txt:7` names. The work tree is clean except for the untracked `lista.txt`, which is a UTF‑16 directory listing and not relevant [obs]. The repository has no branch, stash or reflog entry past A20 [obs].
- `reference/Pager`: HEAD `2f63c51` ("Tres correcoes reais na aplicacao, com o portao ainda VERMELHO"). The work tree has **59 uncommitted entries** (45 modified files, docs moved, `tools/steps/*` deleted, two untracked unit tests) [obs, `git status`]. I analysed the **working tree**, because that is what `.cache/pager-run` runs. Line numbers refer to the working tree.
- Current project: HEAD `c8e30ef`. `features.json` has 161 entries, and each entry has the fields `id, spec, title, steps, expected, passes` [obs]. `DESIGN.md` and `ARCHITECTURE.md` do not exist yet [obs].

Paths are relative to `reference/Brickflow/` (BF) or `reference/Pager/` (PG) unless written in full.

---

## 0. Corrections to the premise (read these first)

These facts change how the rest of the report should be read. None of them overturns the thesis.

1. **Authorship.** Every one of Brickflow's 125 commits carries a `Co-Authored-By` trailer that names a Claude model [obs, `git log --format=%(trailers)`]:
   - `c3d7b8b`…`898012c` (12 commits) name *Claude Opus 5 (1M)*.
   - `ee41f2f`…`d478fa8` (90 commits, Phase 1 → U2) name *Claude Sonnet 5*.
   - `185d33e`…`7803419` (23 commits, the studio UI redo and A1–A20) name *Claude Opus 5.5*.

   DeepSeek appears only as an **external auditor called over its API** (`docs/work/LOG.md:2091`, `review/deepseek-*.md`) [obs]. The harness writes these trailers, so they do not prove which model wrote the code [inf]. Still, nothing in the repository supports "built by DeepSeek".

2. **The green numbers.** "unit 44+49, property 9, e2e 70, tasks 51/51" describe **A20 = HEAD** (`LOG.md:2607,2612`; `report.txt:55-56`) [obs]. That is the state *after* the UI redo (`185d33e`) and *after* the 20 audit repairs.
   - At the handover point before the redo (`d478fa8`, U2) the numbers were: unit 43+35, 63 e2e, tasks **25/25**, all run on Playwright's **bundled Chromium** (`LOG.md:2028-2029`) [log].
   - Right after the redo, the first run of the tasks on **installed Chrome** failed **20 of 44** (`LOG.md:2143`) [log]. The raw log folder `.probe/audit/pw-chrome-tasks/` is empty [obs].
   - If "Claude Code took it over to redo the UI" means work started *after* A20, that work is not in `reference/` (see Not covered).

3. **What "broke" was mostly latent.** I dated the origin of each of the 27 product defects fixed in A1–A20 (§4.2, with `git log -S` and `--diff-filter=A --follow`):
   - **11** were introduced by the redo commit `185d33e`.
   - **15** existed before it, from the Sonnet-era commits.
   - **1** was introduced by an audit repair itself: A12 wrote "a compound value" and A16 fixed it.

   The redo together with hands-on use in the target browser *exposed* more than it *broke* [obs + inf].

4. **Pager's own gate is red at HEAD.** The HEAD commit message says the gate is still red (`2f63c51`). Pager's `package.json` `test` runs **109 node-only tests**. I ran them in a fresh copy: `ℹ tests 109 … pass 109 … duration_ms 122` [obs]. The repository contains **no browser test**. The "acceptance checks" and "the suites" that comments mention (`layers-panel.js:704`, `diagnostics/index.js:115`) are not in the repo [obs].

5. **`report.txt` is not fully accurate.** At least two of its claims contradict the tree it names:
   - It says `apps/editor/public/fonts/` is "an empty directory" (`report.txt:89`, `AUDIT-A20.md:120`). The directory holds `inter-latin.woff2` (48,256 bytes), tracked since `185d33e` [obs]. The substance (CF-26, own fonts for exported pages, is absent) still holds, because Inter is the editor's own UI font (`styles/tokens.css:10`) [obs].
   - It says the P-35 scrub was "not built … 0 on screen" (`report.txt:87`). A scrub exists at A20 (`features/inspector/controls.tsx:36-63`, `spacing-box.tsx:15-19`) and was repaired in A9 (`0385251`) [obs].

   An independent, executing audit also made unverified claims. This matters for thesis point 4.

---

## 1. Registration mechanisms in Brickflow

### 1.1 Summary

| # | Registry | Path | Production reader | Test reader | UI entry points generated from it? | Declares expected outcome? | Fails the build when violated? | Who writes status |
|---|---|---|---|---|---|---|---|---|
| R1 | Feature manifests (capabilities) | `apps/editor/src/features/{palette,layers,toolbar,inspector}/manifest.ts` | `app/composition.ts:16-21` → `app-shell.tsx:152-156` → `diagnostics-panel.tsx:25-35` | `e2e/tasks/user-checks-diagnostics-results.spec.ts:2-5,16-23` | **No.** It lists capabilities only. Buttons, chords and palette are written by hand elsewhere | **No.** `title` is prose, `task` is a file name | **No** | Derived from `task-results.json` (R2) |
| R2 | Task results + reporter + source status | `tools/tasks-reporter.mjs`; `apps/editor/public/task-results.json` (gitignored); `packages/core/src/schema/task-results.ts:3-10`; `vite.config.ts:6-29` (`__COMMIT__`, `__WORKTREE_DIRTY__`, `/__source-status`) | `app/task-results.ts:7-43` | `apps/editor/test/task-results.test.ts:5-16` | n/a | n/a | **No.** `pnpm tasks` is not part of `pnpm check` (`package.json:14-16`) | The reporter writes it, and **only when someone runs `pnpm tasks` with it** |
| R3 | Command registry (planners) | `packages/core/src/commands/commands.ts:12-56` (+ `commands-{node,layout,project,guides}.ts`) | `planCommand` on every store dispatch | core planner/property tests (`gr-15-planners.property.test.ts` and others) | **No.** UI code builds command objects inline (e.g. `surface/wrap-selection.ts:38-53`, `features/toolbar/selection-actions.tsx:36-48`) | No. Plans are code | At runtime only (`unknown-command`, `invalid-command-args`, `commands.ts:43-54`) | n/a |
| R4 | Element catalogue | `packages/core/src/elements/catalogue*.ts` | palette grouping (`features/palette/logic.ts`), drop policy (`surface/drop.ts:271`, `drop-wrappers.ts:91`), validation (`requireAcceptsChild`) | core tests | **Partly.** The palette is generated from it | Structure rules only | At runtime (validation) | n/a |
| R5 | Property catalogue | `packages/core/src/properties/{property-types,catalogue-structure,catalogue-appearance,property-catalogue}.ts` | inspector CSS tab rows (`features/inspector/logic.ts:70-88`), `view.tsx:64`, value validation in core | `lg-18-values`, `p-37-units` and others | **Partly.** The CSS tab is generated. The quick controls are hand lists (`features/inspector/fields.tsx:65-115`) | Value grammar only | At runtime (refusal) | n/a |
| R6 | Layout catalogue | `packages/core/src/layouts/catalogue.ts:12-43` | palette layouts, keyboard/button wrap (`surface/wrap-selection.ts:19,40-45`), `childTypeOf` in drop | `l-11-layouts.test.ts` | Palette: yes. **Drag wrapper: no** (§4) | Styles as data | No | n/a |
| R7 | Attribute catalogue | `packages/core/src/attributes/catalogue.ts` | `features/inspector/attribute-fields.ts:21-42` | `gr-24-attribute-catalogue.test.ts` | Yes (attribute rows) | No | No | n/a |
| R8 | Chord vocabulary | `apps/editor/src/surface/keyboard-chords.ts:17-118` (predicates, not a table) + `keyboard.ts:97-191` + `keyboard-tree.ts` | the keyboard arbiter | `e2e/functional/keyboard-*.spec.ts`, tasks | **No.** Help text is hand-written in i18n (`i18n/messages-en.ts:272,276`) | No | No | n/a |
| R9 | One function per bar/chord action | `apps/editor/src/surface/shell-actions.ts:1-53` | toolbar (`features/toolbar/view.tsx:142-144`, `canvas-toolbar.tsx:14-67`) and chords, via `app/editor.ts:182-196` | tasks (zoom, undo) | **Shared path**, not generated | No | No | n/a |
| R10 | i18n dictionaries | `apps/editor/src/i18n/messages-{en,pt}.ts`, `messages.ts:9-25` | every surface through `t()` | `apps/editor/test/i18n.test.ts` | n/a | n/a | typecheck (keys typed through `MessageKey`) | n/a |
| R11 | Local ESLint rules | `tools/eslint-rules/*.mjs` (15 rules) | n/a | n/a | n/a | Rules, not outcomes | **Yes** (`pnpm lint`) | n/a |
| R12 | Test integrity check | `tools/test-integrity.mjs:5-88` | n/a | runs as the first step of `pnpm test` | n/a | No | **Yes** (skip/only/todo, a test without `expect`, truthiness on literals) | n/a |
| R13 | *(deleted at E1, `f87d165`)* acceptance inventory, verify chain, gate registry, negative/positive controls, traceability | `inventory/acceptance-inventory.json`, `tools/inventory/generate-inventory.ts`, `tools/lib/verify-chain.ts`, `tools/lib/traceability.ts`, `harness/**`, `tools/gates/**` (read with `git show f87d165^:…`) | the verify chain | the old AR-18/AR-21 tests | No | **No.** Requirement prose + status + pointer to evidence | **Yes**, through phase gates | **The generator**, from a proxy (§1.13) |

### 1.2 R1: feature manifests

- **Shape** [obs]. `{ id, title, capabilities: [{ id, title, task }] }`. Excerpt (`features/toolbar/manifest.ts:8`):
  `{ id: 'wrap-selection', title: 'Create and remove a wrapper with visible controls', task: 'user-wraps-and-unwraps-elements.spec.ts' }`.
  The four manifests declare **49 capabilities**: palette 6, layers 11, toolbar 19, inspector 13 [obs].
- The inspector manifest also carries `properties: propertyCatalogue` (`inspector/manifest.ts:23`). No code reads it [obs, grep over `src`, `test`, `e2e`]. It is a declared field that nothing consumes.
- **Manifest vs tasks** [obs]. There are 51 task files for 49 capabilities, and no capability points at a missing file. `user-reloads-a-page-with-content.spec.ts` and `user-sees-an-empty-section-and-drops-into-it.spec.ts` are in no manifest (my `comm` over the manifests and `e2e/tasks/`). No check ties the two lists together [obs].
- **Entry points** [obs]. The manifests do not name any. The toolbar buttons (`features/toolbar/view.tsx`, `selection-actions.tsx:54-57`), the chords (`surface/keyboard.ts:111-174`) and the palette are registered by hand.
- **What the manifest states** [obs]. A capability states only that the named task file passed. The expected outcome lives only inside each spec file.

### 1.3 R2: the evidence pipe

- **Reporter** (`tools/tasks-reporter.mjs`) [obs].
  - Results are keyed by the **spec file's basename**: `this.results[basename(test.location.file)] = status` (`:33`). A file with two tests would record only the last one. Today every task file holds exactly one test, which I counted over all 51 files, so the defect is latent.
  - It refuses to write the file when the run errored, ran nothing, or HEAD changed during the run (`:37-46`).
  - It stamps `<commit>-dirty` when `apps packages tools …` have local changes (`:11-13,48`).
- **Reader** (`app/task-results.ts:7-11`) [obs]:
  `if (dirty || capability.task === undefined || results === null || results.commit !== commit) return 'unverified'`.
  - Under the dev server, the running commit is read from the `/__source-status` middleware (`vite.config.ts:19-27`; `task-results.ts:18-22`).
  - This live read was added in A19 (`b602881`). Before that, the panel compared against the `__COMMIT__` taken when the server started, so every capability read `unverified` after any commit (`LOG.md:2587-2590`) [obs + log].
- **Schema.** `taskResultsSchema` is a zod strict object (`schema/task-results.ts:3-7`) [obs].
- **Where it runs** [obs]. `pnpm tasks` = `playwright test apps/editor/e2e/tasks --reporter=./tools/tasks-reporter.mjs` (`package.json:15`). `pnpm check` = typecheck, lint, test, property and e2e. The tasks are **not** in `check` (`package.json:14,16`).

### 1.4 R3: command registry

- **Shape** [obs]. `Map<type, CommandDefinition>`, where each definition is `{type, argsSchema, plan}` (`commands.ts:12-27`). `planCommand` validates the args and dispatches (`:41-56`).
- The codec `commandSchema` (`schema/command.ts:3`) is used only by `packages/core/test/codecs.test.ts` [obs]. The command objects that UI code builds are validated by each planner's own `argsSchema`, not by the codec [obs]. `report.txt:127` makes the same observation.
- Nothing generates UI from the registry. Entry points hand-build command literals, for example `{ type: 'insert', args: { parentId, nodeId, type, index }, … }` in `wrap-selection.ts:39` [obs].

### 1.5–1.7 R4–R6: element, property and layout catalogues

- **Property shape** [obs]. `{ name, control, label, group, keywords?, units?, sides?, family?, appliesTo?, inherited? }` (`property-types.ts:32-41`). Excerpt: `{ name: 'display', control: 'keyword', …, keywords: ['block','flex','grid','inline','inline-block','inline-flex','contents', …] }` (`catalogue-structure.ts:65`).
- **The CSS tab is generated** [obs]: `catalogue.filter((spec) => spec.group === group).map(…)` (`inspector/logic.ts:77-88`).
- **The quick controls are hand lists** [obs]: `displayOptions` offers 4 values (`fields.tsx:65-70`), direction 2, wrap 2, text-align 4, border-style 4 (`fields.tsx:72-109`). The alignment box has its own list, `places = ['flex-start','center','flex-end']` (`fields.tsx:115`). These lists diverged from the catalogue (§4, BF-07, BF-42).
- **Layout shape** [obs]. `{ id, label, root, styles, children }`, with `rowStyles = { display:'flex', gap:'16px' }` (`layouts/catalogue.ts:14`). The keyboard and button wrap read it (`wrap-selection.ts:19,40-45`). The drag wrapper does not (`drop-wrappers.ts:73-79`).

### 1.8 R8–R9: chords and shared actions

- **Chords are predicates** [obs], for example `isWrapRowChord(init, tracked)` (`keyboard-chords.ts:89-92`). The arbiter lists the chords **twice**:
  - once to dispatch (`dispatchChromeChords` / `dispatchEditChords` / `dispatchKey`, `keyboard.ts:97-174`);
  - once to decide `preventDefault` (`isConsumedChord`, `keyboard.ts:176-191`).

  The two lists must stay in step by hand [obs]. I found no defect caused by this [obs].
- **Shared actions.** `shell-actions.ts:1-2` says: *"what the toolbar and the keyboard both drive — one function per action, so the bar's control and the chord can only ever do the same thing."* Undo/redo, zoom, fit, rulers and outlines go through it (`app/editor.ts:182-196`) [obs]. No divergence defect was ever reported for these concepts (§6.3) [obs over LOG A1–A20 and `report.txt`].

### 1.9 R11–R12: executable rules

- **`no-pointer-owner` (AR-07)** bans `pointerdown|move|up|cancel`, `got|lostpointercapture`, `key*` listeners and `onPointer*`/`onKey*` props outside `surface/` (`tools/eslint-rules/no-pointer-owner.mjs:2-10,26-40`) [obs]. **It does not list `mouse*`.** The inspector scrub attaches `document.addEventListener('mousemove'|'mouseup')` from a feature (`features/inspector/controls.tsx:42-62`, `spacing-box.tsx:15-19`). Its comment claims it respects AR-07: *"never the canvas's pointer pipeline (AR-07 keeps that one owner)"* (`controls.tsx:36-38`) [obs]. The A9 defect (the scrub lost its unit) lived in this path [obs, `0385251`]. The rule was satisfied to the letter and bypassed in substance [inf].
- **`test-integrity.mjs`** fails on `.skip/.only/.todo`, on a test without `expect(`, and on `expect(<literal>).toBe…` (`:7-12,65-84`) [obs]. It cannot tell whether an assertion reads the right artifact. A4 found a text-edit task that passed without the editor ever opening (`LOG.md:2258-2264`) [log].

### 1.10 R13: the deleted apparatus (history)

- **Acceptance inventory** (`git show f87d165^:inventory/acceptance-inventory.json`) [obs].
  - It has 341 entries, each `{ id, section, requirement, status, evidence:{kind,id} | null, reason? }`.
  - Status counts at deletion: 109 implemented, 12 partial, 220 absent.
  - Excerpt: `{ "id": "C-01", …, "status": "implemented", "evidence": { "kind": "test", "id": "apps/editor/e2e/functional/frame-slice.spec.ts:54" } }`.
- **How "implemented" was computed** (`f87d165^:tools/inventory/generate-inventory.ts`) [obs]:
  - An id counts as claimed when a test **title** contains it (`tools/lib/traceability.ts:1`: *"every section-1 id claimed by exactly one test"*).
  - Test evidence was green when `stepIsGreen('unit') && stepIsGreen('property')` (`evidenceIsGreen`). The e2e step was never consulted, even when the evidence pointer was an e2e spec such as C-01 above.
  - A step with **no recorded verdict counted as green**: `return greenness.greenSteps.has(step) || !greenness.recordedSteps.has(step);`.

  So status was derived from execution, but from the execution of **something else** [inf].
- **Verify chain / gate registry** (`f87d165^:tools/lib/verify-chain.ts`, `harness/gate-registry.json`, `harness/gate-results/phase1-gate.json`) [obs].
  - Eight steps, gates, thresholds, negative and positive controls.
  - Phase 1 gate: mutation score 95.6% on ring 1 (`phase1-gate.json`); 46 negative controls regenerated at the delivered tree (commit `cffa9c1` message).
  - The share of the codebase that was verification apparatus reached 41.1% / 53.5% / 59.8% (commit subjects `4c32b20`, `d5f252b`, `88411fe`).
  - E1 deleted all of it: 201 files, 21,175 lines (`f87d165 --stat`).
- **What the apparatus missed** [log]:
  - The day it was deleted, the first run of the new real-input tasks suite reported *"14 tasks, 5 failing"* and found two inspector defects: Enter+blur wrote two history entries, and `top` compiled as `top-top` (`LOG.md:957-972`).
  - E0 found *"37 passed, 11 failed"* in the chromium e2e suite at a HEAD that an F4.1 "certificate" had passed. The certificate had never run that suite (`LOG.md:854-856`).

---

## 2. The Diagnostics mechanism (Brickflow)

**What it registers** [obs]. The 49 manifest capabilities (R1). The panel `app/diagnostics-panel.tsx` also shows readouts: engine errors, revision, applied revision, selection, mode, and `export-source`, a `<pre>` of the page with **inline** CSS (`:66-76`; `app-shell.tsx:152-156`; `app/editor.ts:170-176`).

**How it computes status** [obs]. `works` means a task file with the capability's name ended `passed` in a run stamped with the running commit, on a clean tree. Everything else is `fails` or `unverified` (`task-results.ts:7-11`). The rule is written as a dated decision: *"the inventory is derived from results, never declared"* (`docs/DECISIONS.md:41-46`).

**What it would detect** [inf, from the rule]:
- a task that fails;
- a task never run at this commit;
- results from another commit or from a dirty tree;
- a malformed results file;
- a run that did not run (reporter `:41-46`).

It turns the question "did it pass here, now" into data. That part is worth keeping.

**What it missed, and why.** The independent audit confirmed the panel showed **49/49 `works` on a clean tree at A20** (`report.txt:58`) [log]. The same tree contained:

| Defect present at A20 (`report.txt`, verified in code) | Why Diagnostics stayed green |
|---|---|
| Drag wrapper `gap: normal` vs button/keyboard `gap: 16px` (`drop-wrappers.ts:73-79` vs `layouts/catalogue.ts:14` + `wrap-selection.ts:40-45`) [obs] | The `wrap-selection` capability has one task, which drives the **button** path. It asserts `display` and `flex-direction`, not `gap` (`user-wraps-and-unwraps-elements.spec.ts:19-24`) [obs]. One task per capability means one entry point per concept, and nothing compares entry points [inf]. |
| Quick controls offer 4 of 8 `display` values; direction 2 of 4; wrap 2 of 3; border-style 4 of 7; text-align 4 of 6 (`fields.tsx:65-109` vs `catalogue-structure.ts:52,65,78,79`, `catalogue-appearance.ts:27`) [obs] | No capability declares "every value is reachable from every control". Tasks test whether a written value lands, not which values are offered [inf]. |
| Edit lost if reloaded within the 400 ms autosave debounce; no `beforeunload` flush or guard (`persistence/autosave.ts:46-55`, `app/composition.ts:24`; grep finds no `beforeunload`/`pagehide`) [obs] | The save/reload tasks **wait for the `saved` readout** before reloading (`user-saves-and-reloads.spec.ts:9-11`) [obs]. The test is deterministic by construction and therefore blind to the race [inf]. |
| A hidden node is removed from the export, although the spec says "hide in the editor" (`io/serialization.ts:31-35` vs `EXECUTION-DOCUMENT.md:286`) [obs] | The task **asserts** the removal: `expect(await exportSource(page)).not.toContain('<h1')` (`user-hides-and-locks-a-layer.spec.ts:14`) [obs]. The oracle enshrined the implementation. |
| `animation-name` exported with no `@keyframes` (P-29 absent) [log `report.txt:120`] | Diagnostics lists only built capabilities. A capability that does not exist cannot read `fails` [obs]. |
| Code panel, HTML import UI, density, RTL, own fonts absent [log `report.txt:86-89,130`] | Same: absent means not listed. |
| Export-zip task checks only the `PK\x03\x04` signature (`user-exports-a-zip.spec.ts:18-22`) [obs] | Other tasks read `export-source`, the inline-style readout (`task-helpers.ts:54-56`). The ZIP is built by a different branch, `cssHref` + a separate file (`io/archive.ts:11-18`; `io/serialization.ts:129-133`). The deliverable was checked by one task, and only for its magic number [obs]. |
| Two task files outside every manifest (`report.txt:71`) [obs, §1.2] | No check binds manifests to task files. |
| Labels in two vocabularies (core `Heading` vs i18n `Heading 1`) [log `report.txt:73`] | No task compares UI words across surfaces. |

**The A1–A20 defects also coexisted with a green or empty Diagnostics** [log]:
- From U2 until A19, the tasks never ran through the reporter. The results file still held `d478fa8`'s results, so every capability read `unverified` during the whole audit session (`LOG.md:2582-2585`, A19).
- Before that, every task ran on bundled Chromium. At `d478fa8`, a 25/25 green would have read `works` while 20/44 failed on the target Chrome (`LOG.md:2143`).
- At `d478fa8` the panel had no dirty-tree check. A second, unused `capabilities-panel.tsx` existed until the redo deleted it (`git log -- apps/editor/src/app/capabilities-panel.tsx`: created `ad60269`, deleted `185d33e`; `git show d478fa8:apps/editor/src/app/diagnostics-panel.tsx:11-21`) [obs].
- The Diagnostics self-test (`user-checks-diagnostics-results.spec.ts:14-23`) asserts only that the panel matches the results file. With no file, it expects all `unverified` and passes [obs]. It verifies the pipe, never the product [inf].

**Verdict on Diagnostics** [inf]. It is an honest **display of a proxy**: the proxy is "one hand-picked task file per capability passed". Three reasons explain why it caught nothing:
- its status comes from a single test per capability, and that test's oracle was chosen by the author;
- it cannot see entry points, missing capabilities or the deliverable;
- running it was optional, so it went stale for a whole session.

---

## 3. Pager's registries

### 3.1 Summary

| # | Registry | Path | Production reader | Test reader | UI generated from it? | Expected outcome? | Build fails? | Status |
|---|---|---|---|---|---|---|---|---|
| P1 | Typed registries (`command`, `property`, `panel`, `element`, `gesture`, `icon`, `breakpoint`, `token`) with required fields, deep freeze and seal | `src/core/definitions.js:15-24` (fields), `:41-75` (`createRegistry`), `:98-141` (`define`, `sealDefinitions`) | see P2–P6 | `tools/inventory/*` via `registryIds` | see below | Only the gesture kind names outcomes, and as labels | **At boot**: a missing field, a duplicate id or a late registration throws (`:26-39,49-51,100`) | n/a |
| P2 | Command registry | `defineCommand` calls: `app/boot.js:218-231`, `features/workspace/dock.js:551-613`, `features/resize/index.js:395-400`, `features/marquee/index.js:202` (40 call sites; 43 commands registered at boot, since a loop over the breakpoint table adds 4; `docs/INVENTORY.md:73`) | command bar list `workspace/camera.js:680-693`; chord dispatch `camera.js:694-704` | `tools/inventory/observe.mjs` | **Yes: the command bar.** `keys` binds a chord. `k` is display text only (`'JSON'`, `'HTML'`, `'375 px'`) | No | No | Health (P9) |
| P3 | KEYMAP (keyboard table) | `features/input/index.js:660-833`, rows `{when, keys, mods?, focus?, only?, what, run}` | `dispatchKey`/`runKey`/`keyBound` (`:846-890`, `keyMatches` `:835`) | none | **Yes: the shortcuts panel** (`features/shortcuts/index.js:29-49`), and menus check `keyBound` | No. `what` is an **English literal** (`:662` …) shown as the panel label (`shortcuts/index.js:41`) | No | n/a |
| P4 | Menu table `CMD_MENUS` | `features/workspace/dock.js:400-445`, rows `{when,key,mods,labelKey}` or `{dispatch:{key,ctrl}, chord:'Ctrl+D'}` or `{click:'#sel'}` | `buildCommandMenus` (`dock.js:446-490`) | none | Menus are **hand tables pointing into P3**. A row whose chord is unbound is dropped (`dock.js:460`; the reason is written at `input/index.js:884-885`) | No | No | n/a |
| P5 | Property registry + two UI tables | `catalogueProperty(...)` (`features/inspector/catalogue.js:99-109,300-318`); `PP_SPEC` (`properties.js:2281…`); `QUICK_FIELDS` (`quick-panel.js:133-145`) | inspector, command bar ("Edit property …" `camera.js:689-690`), layers | `tests/unit/*` (values) | Inspector rows: from P5 **plus** `PP_SPEC` (section, editor, glyph, **units**) | No | No | n/a |
| P6 | Element registry + nesting tables | `model/elements.js` (`WRAP_IN :125`, `TABLE_FLOW`, `FORM_ANY`, `TEXTUAL`); `model/grammar.js:1-19` (`ONLY`, `NEEDS`, `UNIQUE`, `CONT`, `NATURAL_CHILD` from flags) | `fitsIn`/`fitsInWhy`/`ancestorBad`/`siblingBad`/`wrapChain`/`validateTree` (`grammar.js:20-130`) | `tests/unit/model.test.mjs` | Palette from the element registry | No | `validateTree` throws on load | n/a |
| P7 | Gesture registry | `features/input/index.js:270-283` (12 `defineGesture`) | **none**: `gestureMatrix`/`gestureCoverageCases` (`definitions.js:144-162`) have no caller | `tools/inventory` (ids only) | No | **Labels only**: `preview:"proposal", result:"drop", cancel:"Escape\|pointercancel"` | No | n/a |
| P8 | Test port `window.__editorDiagnostics` | `features/diagnostics/index.js:92-252`, installed in production at boot | tools and external suites | `tools/inventory/observe.mjs` | n/a | n/a | n/a | n/a |
| P9 | Inventory + health | `tools/inventory/{static,observe,health,build}.mjs` → `system-inventory.json` (6.9 MB), `docs/INVENTORY.md`, `tools/observed.json` | none | `tools/check-inventory.mjs` | No | Generic rule, not per feature (§3.4) | `npm run verify` fails if the regenerated inventory differs from the committed one | **Derived from an observation sweep** |
| P10 | Architecture and integrity tables | `tools/feature-apis.json`, `single-source.json`, `arch-exceptions.json`, `surface-ceiling.json`, `boot-baseline.json`, `integrity*.json`, `fix-evidence.json`, `deliberate-changes.json` | none | `tools/check-*.mjs` | No | Structure only | Yes (`verify`, `prove`) | Hand plus tool |
| P11 | Services `provide`/`service` | `src/core/services.js:18-47` | everywhere | none | No | No | Runtime throw on a duplicate provider | n/a |
| P12 | Clock port | `src/core/clock.js:1-31` (`clockInstall` for replay) | `notes.js`, drag dwell (`drag.js:1091`), save stamp (`export/index.js:66`), telemetry | none | n/a | n/a | n/a | n/a |

### 3.2 The command-shaped registries (P2–P4)

- **Three places declare a shortcut** [obs]:
  - P3 KEYMAP rows;
  - P2 `keys` on commands (e.g. `view.zoomIn keys:['Ctrl+=','Ctrl++']`, `dock.js:569`; `selection.duplicate keys:"Ctrl+D"`, `boot.js:228`);
  - literal chord strings in P4 (`chord:'Ctrl+D'`).

  Features add their own `keydown` listeners on top (18 files register `keydown`, §5.1). The shortcuts panel reads **only KEYMAP** (`shortcuts/index.js:31`), so Ctrl+D, Ctrl+B, Ctrl+K, Ctrl+= and Ctrl+P are missing from it [obs; also `spec/behavior/shortcuts-panel.md` problem 1].
- **Undo appears twice with different truths** [obs]. `history.undo` has `k:'Ctrl+Z'` and no `keys` (`dock.js:553`). The binding lives in KEYMAP (`input/index.js:669-674`), which binds redo to both Ctrl+Shift+Z and Ctrl+Y. The command shows one of them.
- **Commands and menus reach their logic through the DOM or through fake keys** [obs]:
  - `run:() => queryOne('#bU').click()` (`dock.js:553-557`);
  - menu rows fire `document.dispatchEvent(new KeyboardEvent('keydown', …))` (`dock.js:474-479`);
  - the selection bar calls `runKey("canvas","r")` (`boot.js:279-283`).

  Several doors therefore share one path, but the coupling is to a key string or a DOM id [inf].
- **One good idea** [obs]. `definitions.js:83-96` wraps each command's `run` **where it is defined**, because *"`run` is called from six different places (the chord table, the command palette, cmd-K, the menus, a panel action, the selection bar), and wrapping each of them would be six chances to miss one"*. That is the single-choke-point principle, applied to telemetry only.

### 3.3 P5–P7: property, nesting and gesture tables

- **Units for one property differ between two tables** [obs]. For `gap`/`rowGap`, the catalogue has `LEN_NOAUTO=["px","%","em","rem","vh","vw","ch"]` (`catalogue.js:231,315-316`). `PP_SPEC` has `units: ["px","rem","%","em"]` (`properties.js:2316-2318`).
- **Quick-panel value subsets** [obs]. `alignItems pick:["stretch","flex-start","center","flex-end"]` (`quick-panel.js:137`) against 7 catalogue values (`catalogue.js:311`). `justifyContent` offers 4 of 8 (`:138` vs `:310`). This is the same pattern as Brickflow's `fields.tsx`.
- **The nesting tables are single-sourced** [obs]: `ONLY/NEEDS/UNIQUE` come from `elementLists/elementFlags`. **The composition of those tables is written again in each path** [obs]:
  - `fitsIn` (`grammar.js:20-23`);
  - the drag `validate`, with inline `ONLY/NEEDS` and **English literals** `" only accepts "` / `" only exists inside "` (`drag/drag.js:775-783`), where `fitsInWhy` is i18n (`grammar.js:24-32`);
  - `validateTree` (`grammar.js:78-130`);
  - `unwrapNode` (`boot.js:192-213`);
  - KEYMAP promote and wrap (`input/index.js:765-813`);
  - Layers indent and outdent (`layers-panel.js:529-558`).
- **Gesture outcomes are declared but never read** [obs]. `defineGesture({ id:"canvas-drop", …, preview:"proposal", result:"drop", cancel:"Escape|pointercancel" })` (`input/index.js:274`). The functions that would turn these into a matrix of coverage cases have no caller (`definitions.js:144-162`, grep). The shape is the closest thing to a manifest in either project, and it was inert.

### 3.4 P8–P9: test port and health

- **Test port** [obs]. It has read accessors: `tree()`, `selected()`, `history()`, `exportHTML`, `keymap()`, `registry(kind)`, `registryIds(kind)`, `kbd()`, `composed()`, `genSheet()`. It also has **write backdoors that bypass every entry point**, all installed in production:
  - `create`/`createMany` insert without the palette (`diagnostics/index.js:220-231`);
  - `setAt` writes `state.ctx.state/breakpoint` directly and calls `setProp` without the inspector (`:199-212`);
  - `setGeomAt`, `load`, `select`, `render`;
  - `probe(x,y)` resolves a drop without the pointer (`:236-252`).
- **Health rule** (`tools/inventory/health.mjs:1-27,74-115`) [obs]. *"THE ABSENCE OF AN ERROR IS NOT EVIDENCE."* `healthy` requires four things:
  - the command was observed in a flow and did not throw;
  - there was no guard violation and no `noted()`;
  - the DOM signature was unchanged;
  - if it writes, a **non-empty delta confined to its declared paths** and at least one render charged to it.

  This is the only mechanism in either project that detects a *silent no-op* [inf]. It does **not** check that the delta is the *right* one, that the canvas shows the intended result, or anything about persistence and export [obs, rule text].
- **The observation sweep** (`observe.mjs`) [obs]:
  - It drives the command bar with a synthetic `KeyboardEvent` and `el.click()` inside `page.evaluate` (`:230-248`).
  - It presses real keys only for command `keys` (`:439`).
  - It excludes by design *"drags that cross the iframe"*, the eyedropper, file dialogs and absolute resizing (`:14-19`).
  - Pager's own CLAUDE.md forbids *"Synthetic `KeyboardEvent`s in tests"* (`CLAUDE.md:40`).

  KEYMAP-only actions (wrap, promote, move up/down, rename) are not commands, so the sweep never runs them as commands [obs, P3 vs P2].
- **The roll-up hides coverage** [obs]. A feature takes the worst status among its **exercised** resources and ignores the unexercised ones (`build.mjs:212-231`). Result: `drag` is **healthy with 10/235 resources exercised**, `palette` healthy 7/33, `inspector` healthy 248/1146 (`docs/INVENTORY.md:47-67`).

### 3.5 Dead registry remnants [obs]

- 25 i18n strings `panel.control.*` describe a "Capabilities" panel that *"capabilities are declared in spec/capabilities/native-editor.json"* (`core/i18n.js:406-419`). No code references `panel.control`, and the file does not exist [obs, grep].
- `defineInteraction` was removed because *"the registry kind had no registration anywhere"* (`definitions.js:116-118`).

---

## 4. Break points of Brickflow

### 4.1 Method

- Sources: the LOG entries for A1–A20, the studio phase and U0–U2; each fix commit, with `git show --stat` checked for all 21 A-series commits; `report.txt`; and code reading.
- For each defect, "origin" is the commit that created the faulty code, found with `git log -S` or `--diff-filter=A --follow`.
- **Link** is the first link of the chain whose output was wrong:
  - **G** gesture/input: the input reaches the right handler (hit test, focus, cross-frame delivery, cancel);
  - **C** command: the entry point builds the right command, value set, target and transaction; validation accepts it;
  - **D** document change;
  - **R** render: canvas projection, overlays, panels and feedback text;
  - **P** persistence;
  - **X** export.
- **Test status before the fix:**
  - **N**: no test drove this entry point to this outcome;
  - **R̲**: an end-to-end test walked the chain but asserted an intermediate readout or another artifact;
  - **E**: an end-to-end test asserted the wrong expectation, enshrining the defect;
  - **B**: an end-to-end test existed but ran on the non-target engine, bundled Chromium;
  - **T**: the defect was caught by a test (the suite went red);
  - **?**: unknown.

### 4.2 Product defects (45)

| ID | Defect (concept) | Link | Entry points for the concept (file:line) | Test before fix | Why green | Origin → fix | Found by |
|---|---|---|---|---|---|---|---|
| BF-01 | Every host gesture died over the page in Chrome (palette drag, resize, rulers/guides, bands, labels) | G | 5 gestures, **1 shared** pointer machine (`surface/pointer-machine.ts`, `sameLayer`) | B | Bundled Chromium keeps the sandboxed frame in-process. `pointer-machine.test.ts` asserted the defective behaviour (`LOG.md:2173-2175`) | `1d3459a` → `61c9043` | Hands-on audit in Chrome (`LOG.md:2138-2143`) |
| BF-02 | Canvas blank after returning from preview (`display:none` on an out-of-process frame) | R | preview toggle: button, chord | B | Engine (C-02 failed 6/10 on Chrome) | pre-redo → `61c9043` | Audit in Chrome |
| BF-03 | Tab never reached the canvas | G | Tab | B | Engine | pre-redo → `61c9043` | Audit |
| BF-04 | Hover outline froze after zoom/pan and leaked into preview | R | hover | N | none | `185d33e` (`hover.ts` created) → `61c9043` | Screenshots |
| BF-05 | Space+drag did not pan with focus inside the page | G | Space from host vs from frame (`keyboard.ts:246-250`) | N | C-04 covered only the host-focus entry | pre-redo → `4575f56` | Probe `space-pan.mjs` |
| BF-06 | A phone breakpoint was shown at 200 % | R | chord, toolbar select, inspector select (3 → 1 session value) | E | C-05 asserted the 200 % rung. E0 widened the viewport so the assertion stayed *"verbatim"* (`LOG.md:874-877`, `2245-2248`) | `1d3459a` → `4575f56` | Audit |
| BF-07 | Alignment box wrote `flex-start/flex-end`, which the catalogue refused, so nothing changed | C | alignment box (`fields.tsx:115`) vs CSS tab (catalogue): **2 value lists** | N | *"no test ever clicked the box"* (`LOG.md:2195`) | `185d33e` → `1e5c0ce` | Hands-on use |
| BF-08 | One alignment click wrote two transactions (two undos) | C | same | N | none | `185d33e` → `1e5c0ce` | Use |
| BF-09 | Alignment box ignored flex-direction (wrong axis property) | C | same | N | none | `185d33e` → `1e5c0ce` | Use |
| BF-10 | A refusal and the `:state` leaked across selections; edits landed in `:hover` silently | C | inspector (state in `useState`, `view.tsx`) | N | none | `7d73138` → `1e5c0ce` | Use |
| BF-11 | "Move into…" offered destinations the move command refuses | C | select (`selection-actions.tsx:13-25`) vs move validation: **2 rules** until A2 | N | none | `185d33e` → `1e5c0ce` | Use |
| BF-12 | Dismissed toast hid every later error in that slot | R | toast | N | none | `185d33e` → `64a59e5` | Probe `toasts.mjs` |
| BF-13 | Drag chip said the raw id `columns-2` | R | chip label (`element-label.ts`) | N | none | `d478fa8` → `64a59e5` | Screenshot |
| BF-14 | Hard-coded English abbreviations in the panel; screen reader read "W" | R | inspector | N | none | `185d33e` → `64a59e5` | Screenshot |
| BF-15 | Preview ignored the chosen device | R | preview | R̲ | Task asserts only the text `preview` and `no preview errors` (`user-previews-the-page.spec.ts:6-11`) | `1d3459a` → `c79be8c` | Building a landing page by hand |
| BF-16 | Inserted image without `src` was 0×0 (invisible, ungrabbable) | R | palette insert | R̲ | Image task never required a visible box (`LOG.md:2300-2301`) | pre-redo → `c79be8c` | Use |
| BF-17 | Bold/italic/underline/link froze the projection; blank page after reload | R | text editor marks | N | *"No task had ever applied a mark"* (`LOG.md:2317-2318`) | `a8ee2fe`/`b7a1baf` → `910e483` | Use (`bold.mjs`) |
| BF-18 | Clicking away left typed words floating and unsaved | G | click-away, panel focus, Escape, Ctrl+Enter | N | Click-away never tested | `b7a1baf` → `9c5a3c0` | Use |
| BF-19 | Scrub lost the unit (`2rem` became `12px`) | C | scrub (`controls.tsx`, `spacing-box.tsx`) vs typing: 2 value builders | N | *"No test had ever dragged a value"* (`LOG.md:2372`) | `185d33e` → `0385251` | Use |
| BF-20 | Border width with style `none` drew nothing | C | inspector | R̲ | Task *"only looked for the declaration in the export"* (`LOG.md:2377-2379`) | `185d33e` → `0385251` | Use |
| BF-21 | Canvas words kept the old language after a switch | R | language menu | R̲ | Language task did not read canvas words | `1b5a012`+C6 → `9a12e71` | Probe `lang-canvas.mjs` |
| BF-22 | Empty columns hidden during a drag over them | R | overlay marks | N | Task never dragged over an empty card | `185d33e` → `d3829c9` | Screenshots |
| BF-23 | Refusals shown as English code words in pt-BR | R | every refusal surface | E | Ten assertions held the English sentences (`LOG.md:2425-2426`) | pre-redo → `ff5118a` | Use in pt-BR |
| BF-24 | Release outside the canvas showed an error toast instead of cancelling | G | release outside: palette and element drags | R̲ | D-30 test *"never looked at the toast"* (`LOG.md:2521-2524`) | pre-redo → `9b7439e` | Use |
| BF-25 | `describeValue` said "a compound value" in English | R | refusal text | N | none | `ff5118a` (A12 itself) → `9b7439e` | Use |
| BF-26 | Text editor used 13 px interface type instead of the element's | R | text editor | N | none | `b7a1baf` → `59c984a` | Probe `edit-font.mjs` |
| BF-27 | CSS tab labels in English under pt-BR; unset keyword shown blank | R | CSS tab | R̲ | Task asserted neither | `185d33e` → `e0579cf` | Sweep in dark theme |
| BF-28 | Selection order reversed: the second click hit the host overlay before the first click's frame message arrived | G | canvas click, Shift+click | T | Caught: 2 of 40 tasks red (`LOG.md:2114`) | studio redo → redo checkpoint | Tasks |
| BF-29 | Preview/source vacancy off by 80 px; preview null when the root had no rect; placeholder inherited an 80 px min-height | R | drag preview | T | Caught by a new task (`LOG.md:2118`) | studio redo → redo | Tasks |
| BF-30 | Text element without child elements drawn as an empty container | R | outline marks | N | none | studio redo → redo | Owner's browser (`LOG.md:2097`) |
| BF-31 | Side-wrap dropped as a same-parent no-op; wrapper id reused the moved node's id | C | drag of an existing element | N | *"need their new regression cases"* (`LOG.md:2099`) | studio redo → redo | Review |
| BF-32 | Drag cancelled before the dwell still repainted (3 callbacks instead of 2) | G | drag cancel | T | Red unit test written after the auditor's remark (`LOG.md:2096`) | studio redo → redo | Test |
| BF-33 | Parent's label intercepted clicks meant for a child's empty label | G | canvas click | T | Red regression (`LOG.md:2126`) | studio redo → redo | Test |
| BF-34 | Rapid undo lost the iframe focus | G | Ctrl+Z | ? | "earlier real failures" (`LOG.md:2118`) | ? | ? |
| BF-35 | Numeric length `20` refused before normalisation | C | inspector typing | ? | same | ? | ? |
| BF-36 | `display:flex` without `flex-direction` read as a column, so D-17/D-18 never fired on the app's own rows | C | canvas drop (`drop.ts:154-165`) | N | none | pre-redo → redo | Owner screenshots, U0 (`LOG.md:1857`) |
| BF-37 | Empty container had no box and was not a drop target | R | canvas | N | none | pre-U1 → `1b5a012` | Owner screen |
| BF-38 | Restored page not drawn on the canvas after reload (the Layers panel listed it) | R | reload | R̲ | Earlier check was that the layers list it (`LOG.md:1912-1913`) | pre-U1 → `1b5a012` | Owner screen |
| BF-39 | Element defaults written to the literal `base` bucket, which no document declares, so declared defaults (`margin:0`) never applied | D | every insert | N | none | pre-U2 → `d478fa8` | Owner analysis (`LOG.md:2009-2012`) |
| BF-40 | Elements born with `name = tag`, so the UI said "div" and BEM classes were meaningless | D | every insert (3 builders) | E | Three fixtures asserted the seeded name (`LOG.md:2016-2018`) | pre-U2 → `d478fa8` | Owner critique |
| BF-41 | **Row wrapper styles differ by entry point**: drag writes `display:flex; flex-direction:row` (no gap); button and Shift+A write `display:flex; gap:16px` (+ direction) | C | 5 entry points, 2 code paths (§6.3) | N | Wrap task drives the button only and asserts no `gap` | drag `aae6d6e`, keyboard `9587ab6`; open at A20 | Independent audit probe (`report.txt:101`) |
| BF-42 | Quick controls offer a subset of catalogue keywords | C | quick controls vs CSS tab | N | none | `185d33e`; open at A20 | Independent audit |
| BF-43 | Element labels in two vocabularies (core vs i18n) | R | layer rows, starter content | N | none | `d478fa8`; open at A20 | Independent audit |
| BF-44 | Edit lost on reload inside the 400 ms debounce | P | any edit + reload | R̲ | Tasks wait for `saved` | `3f139fd`; open at A20 | Independent audit probe |
| BF-45 | Hidden node removed from the export, contrary to T-09 | X | hide (Layers) | E | Task asserts the removal (`user-hides-and-locks-a-layer.spec.ts:14`) | `d478fa8` decision; open at A20 | Independent audit |

The same rule was implemented more than once (`report.txt:100-105`, verified) [obs]:
- The same-parent index rule is in 3 places: `drop-contract.ts:150-169` (whose comment says *"One place knows that rule"*), `in-hand.ts:47-53`, and `selection-move.ts:19-41`, plus the row-fraction policy in `layer-reorder.ts:65-73`.
- The preferences key is written by 2 modules: `i18n/language-store.ts:5` and `ui/theme-store.ts:7`.
- Void/raw-text knowledge is in 3 places: `io/serialization.ts:6,23` and `surface/projector.ts:128`.

No behavioural divergence was ever observed for these, so they are not in the 45.

### 4.3 Verification and oracle defects (not product defects)

| ID | What | Evidence |
|---|---|---|
| OR-01 | Suite ran on bundled Chromium, not the target Chrome | `git show 61c9043 -- playwright.config.ts` (the `channel: 'chrome'` line added) [obs] |
| OR-02 | Unit test asserted the defective cross-frame behaviour | `LOG.md:2173-2175`; `.probe/audit/cross-frame-red.log` ("1 failed") [obs] |
| OR-03 | Three specs measured frame elements with `boundingBox`, which ignores the frame's scale in Chrome | `LOG.md:2176-2179`; the fix is `e2e/frame-geometry.ts:1-25` [obs] |
| OR-04 | C-05 viewport widened to keep a 200 % assertion "verbatim" | `LOG.md:874-877` [log] |
| OR-05 | Text-edit task passed without the editor opening | `LOG.md:2258-2264`; `c151b65` [obs] |
| OR-06 | Reporter wrote an empty results file for a run that did not run | `LOG.md:1810-1817`; `8f9119e` [obs] |
| OR-07 | `import/no-cycle` was inert, which hid 19 cycles | `LOG.md:1938-1943`; `5404b48` [obs] |
| OR-08 | Reporter unused for a whole session; panel compared a stale commit | `LOG.md:2582-2591`; `b602881` [obs] |
| OR-09 | Property-group task read only the export text | `LOG.md:2377-2379` [log] |
| OR-10 | D-30 test ignored the toast | `LOG.md:2521-2524` [log] |
| OR-11 | Ten assertions enshrined English refusal sentences | `LOG.md:2425-2426`; `ff5118a` touches 9 spec files [obs] |
| OR-12 | Export oracle is the inline-style readout; ZIP checked by signature only | `task-helpers.ts:54-56`, `user-exports-a-zip.spec.ts:18-22`, `io/archive.ts:13` [obs] |
| OR-13 | Two task files belong to no manifest | §1.2 [obs] |
| OR-14 | `migrateEnvelope` is tested and unused; `migrateStoredProject` is used by production (`persistence/index.ts:26`) and named by no test | grep [obs] |
| OR-15 | Old inventory: title claims plus unrelated steps green, with "never recorded" counted as green | §1.10 [obs] |
| OR-16 | A certificate skipped the chromium suite and 11 reds shipped | `LOG.md:854-856` [log] |
| OR-17 | AR-07 lint rule bypassed with `mouse*` listeners | §1.9 [obs] |
| OR-18 | The independent audit's own false claims (fonts, scrub) | §0.5 [obs] |

### 4.4 Declared capabilities that were absent (Diagnostics could not show them)

- **Built during the audit:** PL-02 layer drag (A13), X-01 Shift+Enter (A14), D-15 tree↔canvas drag (A16), and press-drag moves an element (U0 state 8 → U2).
- **Still absent at A20:** P-29 keyframes, CF-01/04 code panel, CF-02/08 import UI, PL-20 density, P-48/PL-21 RTL, CF-25 unsaved guard, CF-26 own fonts [log `report.txt`, spot-checked: no `beforeunload` in `src`, no keyframes in the catalogue or compiler].

### 4.5 Why the suite stayed green (counts over the 45)

- **N = 24.** The entry point or outcome was never driven. Typically this was a UI surface added in the redo that no task clicked (BF-07/08/09/11/19), or a second entry point to a concept that one task already covered (BF-05, BF-41) [obs].
- **R̲ = 8.** The chain was walked, but the oracle read a proxy: the Layers rows instead of the canvas (BF-38), the `preview` text instead of the frame width (BF-15), the export text instead of the computed style (BF-20), the `saved` readout instead of a reload inside the window (BF-44), and a toast that was never read (BF-24) [obs].
- **E = 4.** The oracle enshrined the defect (BF-06, 23, 40, 45) [obs].
- **B = 3.** Right chain, wrong browser (BF-01/02/03) [obs].
- **T = 4.** Tests caught them (BF-28, 29, 32, 33). Three of these were caught by new tests written *after* a person or an auditor pointed at the area [obs].
- **? = 2.**

Origin of the 27 A-series defects: 11 were introduced by `185d33e`, 15 were latent, and 1 was introduced by A12 (§0.3) [obs].

---

## 5. Break points of Pager

### 5.1 The architectural defects named in the brief, verified

1. **State without an owner** [obs].
   - `core/state.js:53-60` exports one mutable object: `{model, sel, SEQ, MEMO, ghostT, pageIndex, ctx, project}`.
   - Nine modules assign its fields directly: `transactions.js:103,251-256`, `diagnostics/index.js:206-210`, `documents/index.js:185`, `drag.js:1317`, `export/index.js:47,50`, `layers-panel.js:701,710`, `camera.js:271,292`, `tree.js:299`, `measure.js:55,64`.
   - `state.sel` is a getter/setter that the **model layer patches onto the core object** (`model/selection-set.js:57-65`). The selection set is mutated from 9 files besides its own module (`selection.set/add/clear/toggle` calls in `marquee`, `layers-panel`, `boot`, `camera`, `spacing/handles`, `resize`, `drag`, `documents`, `transactions`).
   - Feature modules hold 83 top-level `let` bindings (`dragState`, `KB`, `directSession`, `shDrag`, …) outside any store.
   - The **test port writes production state** (`state.ctx`, `diagnostics/index.js:199-212`).
2. **Pointer and key listeners spread across files** [obs].
   - `pointerdown` is registered in **15 files** (48 registrations) and `keydown` in **18 files** (64 registrations), next to 106 `click` registrations (grep over `src`).
   - Ownership is a cooperative lock, `claimPointer` (`core/pointer.js:9`), not a single dispatcher.
   - **Consequence, verified:** a press on the stage outside the page is taken by the marquee's capture listener as the Page root (`marquee/index.js:66-70`, `eventTarget(event,"#stage,#ov")?state.model`), while the stage's own handler would clear the selection (`workspace/dock.js:110-117`). One gesture, two listeners, two outcomes (PG-09).
3. **Hit-testing writes the wrong property** [obs].
   - The canvas spacing band decides the property from the measured axis of the band that was hit: `{[a.axis==="x"?"columnGap":"rowGap"]: …}` (`spacing/handles.js:209`), and the same in its typed field (`:288`).
   - The quick panel's Gap writes the shorthand and clears the longhands: `{ gap: v.css, rowGap: null, columnGap: null }` (`inspector/quick-panel.js:375`).
   - The direct handle writes `{[directMode]: …}` (`quick-panel.js:61`).
   - So "gap" is a different CSS property depending on the door. The same happens with padding and margin: the band drag writes `paddingTop` next to an existing `padding` shorthand (`handles.js:209-210`), while the quick panel writes the shorthand and nulls the four longhands (`quick-panel.js:369-372`).
4. **Undo is not atomic over (document, selection)** [obs].
   - A history unit is the document **plus the selection at the moment of the push** (`commands/transactions.js:24-26,206-211`).
   - `historyBack` pushes the *current* selection onto REDO (`:150-153`), so redo restores the selection from undo time, not the command's resulting selection. This matches `spec/behavior/undo-redo.md` problem 1.
   - The selection set after a command (`render(); select(…)` outside the `transaction`) is recorded nowhere.
   - Each nudge is its own history entry (`resize/index.js:284-300`).
5. **Duplicated rules** [obs]: see PG-01 to PG-08 and PG-18 to PG-19 below.

### 5.2 Product defects (19, each verified in code)

| ID | Defect | Link | Entry points (file:line) | Shared path? | Test before |
|---|---|---|---|---|---|
| PG-01 | Move up/down: the keyboard moves the whole selection and reports; the Layers menu moves only the primary node, is silent at the edges, and checks locks differently | C | Alt+↑/↓ `input/index.js:714-718`→`:629-658`; Arrange menu → `runKey` `dock.js:414-415`; selection bar → `runKey` `boot.js:279-280`; Layers menu `layers-panel.js:515-527` | 2 paths | N |
| PG-02 | Promote: the key row and the Layers "outdent" have different guards (single-selection, root) and different refusal texts (`a11y.cannotGoIn` vs `fitsInWhy`) | C | `p` `input/index.js:765-780` (+ menus/selection bar via `runKey`); Layers `layers-panel.js:545-558` | 2 paths | N |
| PG-03 | Rename: F2 prompt trims and falls back to the old name; Layers inline does not trim | C | `input/index.js:814-832` vs `layers-panel.js:561-575` | 2 paths | N |
| PG-04 | Row/Column wrapper built in 3 places plus a template with a different style (`gap:16px`); `alignItems:center` added under 3 different conditions | C | keys R/C `input/index.js:801-808` (menus and selection bar via `runKey`); single drop `drag.js:1189-1194`; group drop `drag.js:1258-1262`; template `model/templates.js:116` | 3 paths + template | N |
| PG-05 | Gap written as `rowGap`/`columnGap` by the band axis vs the `gap` shorthand by the panel | C | `handles.js:209,288`; `quick-panel.js:61,375`; inspector rows | ≥3 paths | N |
| PG-06 | Band drag writes longhands beside the shorthand; the panel replaces the shorthand | C/D | `handles.js:209-210` vs `quick-panel.js:369-372` | 2 paths | N |
| PG-07 | The nesting rule is composed again in each path; the drag path uses English literals | C | §3.3 list (≥6 places) | no | N |
| PG-08 | An invalid placement is silently wrapped by an automatic parent chain instead of refused | C | `drag.js:763-771` (policy the new spec reverses) | n/a | N |
| PG-09 | A press outside the page selects the Page root instead of clearing | G | `marquee/index.js:66-70` vs `dock.js:110-117` | 2 listeners | N |
| PG-10 | Redo restores the wrong selection | D (history) | every undoable command | 1 path, wrong | N |
| PG-11 | A burst of nudges is N undo steps | C | arrows `resize/index.js:284-300` | 1 path | N |
| PG-12 | Shortcuts declared in ≥4 places; the panel lists only KEYMAP, with English descriptions | R | §3.2 | no | N |
| PG-13 | Menu rows fire synthetic `KeyboardEvent`s | G | `dock.js:474-479` | fake key | N |
| PG-14 | Ctrl both duplicates and disables snapping in a drag | G | `drag.js:307-311` | 1 table, overloaded | N |
| PG-15 | Two parallel panel systems decide dock visibility | R | `dock.js:173-182` | 2 paths | N |
| PG-16 | Preview status hard-coded in English | R | `camera.js:822` | 1 | N |
| PG-17 | Equal-spacing snap computed but never drawn | R | `drag.js:705`; no `eq` in `platform/overlay.js` | 1 | N |
| PG-18 | Gap unit lists differ between two tables (7 vs 4 units) | C | `catalogue.js:231,315` vs `properties.js:2316-2318` | 2 tables | N |
| PG-19 | Quick panel offers subsets of `alignItems`/`justifyContent` | C | `quick-panel.js:137-138` vs `catalogue.js:310-311` | 2 tables | N |

`spec/behavior/*.md` lists **234 numbered "Problems in Pager"** over 80 specs [obs, count]. The earlier session observed them in Chrome (`PROGRESS.md`) [log]. I did not verify or classify all 234 (see Not covered).

Two spec claims do not match the code:
- `promote-out.md` says the key row and the Layers menu use a *"different index base"*. Both compute `at+1` (`input/index.js:776-779`, `layers-panel.js:553-556`) [obs].
- `move-up-down.md` cites `layers-panel.js:515-528`. The block is at 515-527 in the working tree [obs].

### 5.3 Why Pager's checks stayed green [obs + inf]

- There is no end-to-end test in the repository. The 109 node tests cover model, CSS, values, URLs, the guard, capabilities, persistence, transactions, box geometry and position. None drives a UI entry point (run in this session).
- The health sweep reaches commands through the command bar with synthetic events, excludes drags, and cannot see KEYMAP-only actions (§3.4). Every PG defect sits either on a drag, on a KEYMAP-only action, on a Layers menu path, or in rendered text.
- The verification effort was structural: architecture ranks, byte fidelity to a frozen reference, an integrity seal and anchors, inventory regeneration (`package.json` `verify`/`prove`). None of it asserts a feature's outcome [obs].
- Pager's own audit found tautological assertions in its unit tests, e.g. `validateTree(...).ok === undefined || true` (`git show HEAD:RELATORIO-AUDITORIA.md`, §B2) [obs].

---

## 6. Verdict, with numbers

### 6.1 Defects per chain link (Brickflow 45 + Pager 19 = 64 product defects)

| Link | Brickflow | Pager | Total |
|---|---|---|---|
| Gesture / input delivery | 9 | 3 | **12** |
| Command (entry-point adapter: values, target, transaction; validation) | 12 | 11 | **23** |
| Document change (incl. history) | 2 | 1 | **3** |
| Render (canvas, overlays, panels, feedback text) | 20 | 4 | **24** |
| Persistence | 1 | 0 | **1** |
| Export | 1 | 0 | **1** |

[obs for each row's evidence; the link assignment is **inf**]

Brickflow's document link had the strongest checks: mutation 95.6–96 %, 9–10 property families at 1000 cases (`f87d165^:harness/gate-results/phase1-gate.json`; `LOG.md:277`). It had 2 defects, and both were *defaults* rather than reducer logic [obs].

### 6.2 End-to-end status before the fix

| Status | Brickflow | Pager | Total |
|---|---|---|---|
| N: never driven through that entry point to that outcome | 24 | 19 | **43** |
| R̲: chain walked, oracle read a proxy | 8 | 0 | **8** |
| E: oracle enshrined the defect | 4 | 0 | **4** |
| B: chain walked on the non-target engine | 3 | 0 | **3** |
| T: caught by a test | 4 | 0 | **4** |
| ?: unknown | 2 | 0 | **2** |

- **51 of 64 (80 %)** sat in links that no test exercised end to end to the right artifact (N + R̲).
- **58 of 64 (91 %)** add E + B, the cases where the chain was walked but the oracle or the environment was wrong.

By link (Brickflow): gesture N2 R̲1 B2 T3 ?1; command N10 R̲1 ?1; document N1 E1; render N11 R̲5 E2 B1 T1; persistence R̲1; export E1 [obs + inf].

### 6.3 Concepts reachable from more than one entry point

| Project | Concept | Entry points | Code paths | Divergence observed? |
|---|---|---|---|---|
| BF | Wrap row/column | 5: drag beside `drop-wrappers.ts:39-79`; grouping drop `:85-138`; multi-selection drag `selection-move.ts:43-64`; buttons `selection-actions.tsx:41-44,54-55`; Shift+A / Alt+Shift+A `keyboard-wiring.ts:118-130` | 2 (drag family vs `layoutWrapPlan`); button and key also normalise the selection differently (`selectionRoots` vs raw ids) | **Yes**: gap (BF-41) |
| BF | Move / reorder | 7: canvas drag, multi drag, layer drag, tree↔canvas, in-hand keys, up/down buttons, Move-into select | 3 index functions + 1 band policy | Move-into options, before A2 (BF-11); none in the exercised index cases (`report.txt:100`) |
| BF | CSS value choice | quick controls, CSS tab, alignment box | 3 value lists | **Yes** (BF-07, BF-42) |
| BF | CSS value writing | typing, row scrub, spacing-box scrub, bands, resize handles, nudge | 2 value builders (typed vs scrub) + `style-command.ts` | **Yes**: unit (BF-19) |
| BF | UI element labels | Layers, chips, starter content | 2 vocabularies | **Yes** (BF-43) |
| BF | Preferences storage | language, theme | 2 writers, one key | No |
| BF | Void/raw-text tags | serializer, projector | 3 places | No |
| BF | Undo/redo | button, chord | **1** (`shell-actions.ts:47-53`) | No |
| BF | Zoom / fit | buttons, menu, chords | **1** (`shell-actions.ts:23-37`) | No |
| BF | Rulers, outlines | button, chord | **1** | No |
| BF | Breakpoint | chord, toolbar select, inspector select | **1** session value (`LOG.md:1915-1918`) | No |
| BF | Rename | F2, Layers | **1** request (`shell-store.ts:9-11`) | No |
| PG | Wrap row/column | 6 + template | 3 + template | **Yes** (PG-04) |
| PG | Move up/down | 4 | 2 | **Yes** (PG-01) |
| PG | Promote | 4 | 2 | **Yes** (PG-02) |
| PG | Rename | 3 | 2 | **Yes** (PG-03) |
| PG | Gap / spacing value | ≥4 | ≥3 | **Yes** (PG-05/06) |
| PG | Nesting check | ≥6 | ≥6 | **Yes** (PG-07) |
| PG | Shortcut declaration | ≥4 tables | ≥4 | **Yes** (PG-12) |
| PG | Selection on outside click | 2 listeners | 2 | **Yes** (PG-09) |
| PG | Value sets and units | quick panel, inspector, catalogue | 2–3 tables | **Yes** (PG-18/19) |
| PG | Undo | key, command bar, toast, button | **1** (`#bU`) | No |
| PG | Zoom keys and bar | 2 | **1** (`setZoom(pageAnchor)`, `dock.js:566-570`) | No |
| PG | Breakpoint commands | generated from one table (`dock.js:597-609`) | **1** | No. An earlier hand copy had diverged (`docs/ARCHITECTURE.md:48-51`) |

**Count** [obs + inf]:
- **Every observed divergence is in a concept with ≥2 code paths**: 14 of the table's rows (BF 5, PG 9). Counted per underlying rule instead of per row, it is 17: BF wrap, keyword lists, alignment values, move-into options, labels, scrub units; PG wrap, move, promote, rename, gap, spacing longhands, nesting, shortcut declarations, outside click, value subsets, units.
- **None of the 8 single-path, multi-door rows diverged** (BF undo, zoom, rulers+outlines, breakpoint, rename; PG undo, zoom, breakpoints).
- 3 multi-path concepts (BF move index, preferences, void tags) have no observed divergence *yet*.

### 6.4 Point-by-point verdict

1. **The chain.** **Refined.** Defects occur in all six links, but they are not evenly spread: render 24 and command 23 against persistence 1 and export 1 (§6.1). Two refinements matter:
   - The "command" link is really an **entry-point adapter**: the value list a control offers, the property its hit test picks, and the selection normalisation it applies. The reducer behind it was rarely wrong. The manifest should treat adapter → command as its own link.
   - A seventh link was decisive: the **environment**, meaning the browser engine, the frame process model and the viewport (BF-01/02/03; OR-01, OR-03; `LOG.md:2054`, where the same drop produced 6 sections instead of 5 at the default viewport).
2. **Tests checked single links in isolation.** **Refined, and partly contradicted.**
   - For Pager it holds: no end-to-end test exists.
   - For Brickflow it does not hold as stated. The 51-task suite drove whole chains with real mouse and keys (`task-helpers.ts:1-2,58-79`). The defects survived for other reasons:
     - the end-of-chain oracle read a *proxy*: the Layers rows, the revision counter, the inline `export-source`, the `saved` readout (R̲ = 8);
     - the oracle *enshrined* current behaviour (E = 4);
     - the chain ran on the wrong engine (B = 3);
     - one task per capability meant **one entry point per concept**, so every other door was untested (most of N = 24).
   - Corrected statement: *no test walked the chain to the true end artifact (screen, storage after reload, exported files), in the target browser, for every entry point.*
3. **Many-to-one, hand-registered, diverged.** **Confirmed** (§6.3: 14 of 14 divergent rows are multi-path; 0 of 8 single-path rows diverged). Three nuances:
   - Divergence also appears in what an entry point **offers** (value lists, units, destinations), not only in what it writes.
   - Shared paths share failure: BF-01 killed five gestures at once. That is good for detection, but it does not replace per-door tests.
   - Pager's "shared" paths route through fake keys and DOM clicks (`runKey`, synthetic `KeyboardEvent`, `#bU.click()`). Sharing through strings is still hand registration.
4. **Prose was satisfied literally; external executable checks caught defects.** **Confirmed, with important contradicting evidence.**
   - Literal satisfaction, observed:
     - *"One place knows that rule"* over 3 implementations (`drop-contract.ts:150-151`);
     - AR-07 bypassed with `mouse*` (§1.9);
     - "assertions kept verbatim" by changing the scenario (OR-04);
     - test titles claiming requirement ids (§1.10);
     - the previous attempt's lesson *"Two implementations of one policy"* (`reference/EXECUTION-DOCUMENT.md:545-547`) written down and then repeated;
     - a Pager comment asserting parity between the key and pointer wrappers while copying the code (`input/index.js:807-808`);
     - Pager forbidding synthetic events in tests while its health oracle uses them (`CLAUDE.md:40` vs `observe.mjs:235`).
   - **Contradicting evidence:**
     - (a) Brickflow's *executable, self-checking* apparatus (mutation 95.6 %, 46 negative controls, gates) caught engine defects and **none** of the 45 product defects.
     - (b) Pager's executable health oracle rated `drag` healthy at 10/235 exercised.
     - (c) The independent, executing audit (`report.txt`) contains two false claims (§0.5).
     - (d) Tests written by the same agent **did** find real defects: first tasks run 5 red + 2 defects (`LOG.md:957-972`), E0 11 red (`:854`), BF-28/29/32/33.
   - Refined statement: *what caught defects was an oracle aimed at the end artifact and chosen independently of the implementation's readouts.* Being executable was necessary but not sufficient, and "same author" was not the deciding factor.
5. **The UI as the only external viewpoint.** **Refined.**
   - Most product defects were found by driving the real UI in Chrome and looking at it: BF-01 to BF-27 (A1–A17, hands-on and screenshots), and U0–U2 owner screenshots, about 35 of 45 in Brickflow.
   - But the defects that the UI cannot show were found by **probes reading storage and export**: BF-44 debounce loss, BF-45 hidden-from-export, and keyframes absent. The meaningless BEM names of BF-40 also only show in the export.
   - Fraudulent or weak tests were found by several means, not only by UI use: a flake trace (OR-05), a planted cycle (OR-07), running the reporter (OR-06), an automated weak-assertion scan in Pager (`RELATORIO-AUDITORIA.md` §B2), and running the unrun suite (OR-16).
   - Refined statement: *the end of the chain has three terminals (screen, storage after reload, exported files). A check from outside is needed at each one, and on the test oracles themselves.*

### 6.5 Contradicting evidence, collected

1. Brickflow commits are co-authored by Claude models; DeepSeek was only an auditor (§0.1).
2. The quoted green numbers are A20's (post-repair). Most of what "broke" (15 of 27) was latent before the UI redo (§0.3).
3. Brickflow *did* have end-to-end, real-input tasks for every declared capability (§6.4-2).
4. External, executable checks also failed or erred (§6.4-4a–c).
5. Self-authored tests caught real defects when their oracle was the end artifact (§6.4-4d).
6. Shared code paths share failure (BF-01). Per-door tests are still needed.
7. Some defects cannot be seen in the UI at all (§6.4-5).

---

## 7. Implications for the manifest

### 7.1 Worth reusing (as shape)

| From | What | Why |
|---|---|---|
| BF R2 | Commit-stamped, dirty-aware results; `unverified` as default; *"a run that did not run is not a result"* (`tasks-reporter.mjs:37-54`, `task-results.ts:7-11`, schema `task-results.ts:3-10`) | Status derived from execution, never written by hand. Stale or dirty runs cannot certify |
| BF | `settle(revision)`: wait on `revision N` and `applied N` (`task-helpers.ts:27-32`) | A deterministic readiness signal between the host and the frame, instead of timeouts |
| BF | `paintedBox` (`e2e/frame-geometry.ts:9-25`) | A correct geometry oracle through a scaled iframe |
| BF R9 | One function per action for bar and chord (`shell-actions.ts:1-2`) | Measured zero divergence (§6.3). The manifest should *generate* this binding |
| BF R3 | Registry keyed by command type with an args schema (`commands.ts:41-56`) | Commands as data are a prerequisite for generating entry points and scenarios |
| BF R5 | Catalogue-generated CSS tab (`inspector/logic.ts:77-88`) | The generated surface had no value-set divergence; the hand lists did |
| PG P1 | Required fields per kind, duplicate refusal, deep freeze, seal after boot (`definitions.js:15-39,49-51,98-141`) | Makes the registry itself fail fast |
| PG P7 | Gesture fields `start/input/targets/preview/result/cancel` (`definitions.js:23`) | The right *slots* for an entry point, if they carry checkable values and something reads them |
| PG P2/P3 | Command bar generated from the registry (`camera.js:680-693`); shortcuts panel generated from the keymap (`shortcuts/index.js:29-49`); menus refuse unbound chords (`dock.js:460`) | Generation plus a cross-check prevents dead doors |
| PG | Wrapping `run` at definition, not at each call site (`definitions.js:83-96`) | The single choke point for observing every door |
| PG P9 | *"Absence of an error is not evidence"*: non-empty delta within declared paths, plus a render (`health.mjs:1-27`) | A cheap generic check against silent no-ops, as a floor under per-scenario outcomes |
| PG P12 | Clock port with `clockInstall` (`core/clock.js:1-31`) | Replaceable time, if it is extended to timers (§7.4) |
| PG P8 (read side only) | `tree()`, `selected()`, `history()`, `exportHTML` | A read-only test port for document JSON, selection and history |

### 7.2 Must avoid, and why

1. **Hand-written status.** The current `features.json` `passes`, and Brickflow's old inventory `status` computed from a proxy, including "never recorded = green" (§1.10).
2. **One test per capability.** It leaves every other door of the concept untested (§6.4-2). Scenarios must be multiplied by entry points.
3. **Proxies as oracles.** Readout text, Layers rows, inline `export-source`, a `saved` label. Assert on document JSON diff, computed style and geometry in the frame, storage after an *immediate* reload, and the files inside the ZIP (§4.5 R̲).
4. **Roll-ups that hide coverage.** Pager's `healthy 10/235` (§3.4). Report every scenario × door × terminal, never a worst-of-exercised.
5. **A manifest that lists only what is built.** Brickflow could not show absent capabilities (§2). Declare everything from the start and derive "not available yet".
6. **Write backdoors in the test port.** Pager's `create`, `setAt`, `probe` and `load` bypass the doors (§3.4). Tests must enter only through generated doors. The port is read-only.
7. **Parallel registries for keys, commands and menus**, and doors that emulate keys or click DOM ids (§3.2).
8. **Declared-but-unread fields.** Pager gesture outcomes, BF `manifest.properties`, Pager's 25 capability-panel strings. Every field must have a reader that fails when violated.
9. **Keying results by file name** (`tasks-reporter.mjs:33`) and making the status run optional (not in `check`).
10. **Lint rules with loopholes**, e.g. `mouse*` (§1.9). Rules should name the concept (input listeners), not a list of event names.
11. **Prose outcomes.** `expected` strings in `features.json`; capability `title`s.

### 7.3 Fields the manifest needs that neither project had

A sketch of the shape, not a proposal of syntax:

- **Command**: `id`, `owner` (the ARCHITECTURE owner module), `argsSchema`, `availability` (predicate id + the refusal i18n key when unavailable).
- **`entryPoints[]`** per command, each with a kind and its placement:
  - `{kind:'shortcut', chord, context}`
  - `{kind:'menu', menu, order}`
  - `{kind:'context-menu', order}`
  - `{kind:'toolbar'|'selection-bar'|'quick-panel', region, order, icon}`
  - `{kind:'command-bar'}`
  - `{kind:'inspector-field', property, section}`
  - `{kind:'canvas-drag', source, zone}`
  - `{kind:'layers-drag'}`
  - `{kind:'canvas-handle', handle}`
  - Every door gets its label key, its disabled-reason key and its UI placement. The UI registers doors **from this list**, and a test asserts the rendered UI equals the list.
- **Per-door adapter data** that previously diverged silently: the value set it offers (must equal or be a declared subset of the catalogue's), the selection normalisation it applies, and the property its hit area maps to.
- **`scenarios[]`** per command, each with:
  - `setup`: fixture document, selection, context, breakpoint, locale, viewport;
  - `expect.document`: a JSON diff by path and value;
  - `expect.selection`;
  - `expect.history`: the number of undo steps; undo restores the exact document and selection; redo restores the after-state;
  - `expect.render`: computed style or geometry relations inside the frame, and visible feedback text keys;
  - `expect.persistence`: the same document after an immediate reload;
  - `expect.export`: presence or absence in the exported HTML/CSS files;
  - `refusals[]`, each with a refusal key and "document unchanged".
- **Generated per scenario × door:**
  - the Playwright test, using real input only;
  - a **parity assertion** that all doors produce the same document diff (this catches BF-41 and PG-04/05 by construction);
  - a **negative control**: with the command handler neutralised, the scenario must fail. This automates CLAUDE.md step 6.
- **Status**, derived per scenario × door × terminal: commit-stamped, dirty-aware, never hand-set. A feature passes only when all of its cells pass.
- **Environment**, declared in the manifest and checked at run start: browser channel, frame origin model, viewport sizes, locales, zoom levels.

### 7.4 Determinism: where it broke, or would break, in end-to-end tests

| Source | Evidence | Implication |
|---|---|---|
| **Frame process model and coordinates** | Brickflow's sandboxed opaque-origin frame (`surface/frame-environment.ts:12-15`) runs out of process in Chrome and in process in bundled Chromium. Consequences: pointer capture, focus, Tab and zero-size layout under `display:none` all differed (BF-01/02/03). `boundingBox` ignored the frame's transform scale (`viewport.ts:54` uses `transform: scale`; OR-03). Pager uses a same-origin frame (`index.html:191`, `projector.js:48`) with CSS `zoom` on the world (`camera.js:101`; `projector.js:66`; `measure.js:96-101`) [obs] | Run only on the target Chrome. Decide the frame origin model first and test input delivery across it. With CSS `zoom` (this project's rule), recheck Playwright box semantics against a painted-box oracle [inf] |
| **Asynchronous frame messages** | Typing before the editor opened by an async message existed (OR-05). The selection-order race between host overlay and frame message (BF-28). Keys pressed less than 50 ms apart during re-projection lost an undo on bundled Chromium (`LOG.md:2539-2548`) [log] | Wait on a published revision signal, never on time [inf] |
| **Debounce and async saves** | Brickflow autosave 400 ms, no flush (`autosave.ts:46-55`; BF-44). Pager 1000 ms with `pagehide`/`visibilitychange` flush and a `beforeunload` guard (`documents/index.js:213,342-344`). An IndexedDB poll flake on `request.result === undefined` (`LOG.md:1886-1891`) [obs/log] | Scenarios must test reload *inside* the window, not only after `saved` [inf] |
| **Timers and clocks** | Brickflow: dwell 400 ms (D-09), focus reclaim 600 ms (`text-edit.ts:189`), `Date.now()` in `pointer-deps.ts:84`. Pager: 19 `setTimeout` in 12 files and 16 `requestAnimationFrame` **outside** its clock port; ghost 140 ms (`drag.js:1317`), flash 900 ms (`:1237`), tooltip 500 ms (`kit.js:718`) [obs] | Put time *and* scheduling behind one port, or drive them with Playwright's clock [inf] |
| **Generated ids** | Brickflow: `crypto.randomUUID()` at 8 call sites (`editor.ts:126`, `drag.ts:174,187`, `in-hand-layer.ts:128`, `keyboard-wiring.ts:121,153`, `selection-actions.tsx:42`, `guides-layer.ts:131`). The wrapper id derived from the node id caused a real bug (BF-31). Pager: `randomUUID` (`tree.js:272`) plus the `SEQ` and `autoName` counters. The export stayed byte-identical because classes derive from names, not ids (`report.txt:72`) [obs/log] | One id generator port, seedable in tests. Assert on paths and names, not ids [inf] |
| **Fonts** | Brickflow self-hosts Inter for the UI (`tokens.css:10`). Page text used system fonts; line breaks and 32 px headings were asserted geometrically (A14, A15) [obs/log] | Bundle the fonts used by fixtures, or assert relations (`two lines`, `taller than`) rather than pixels [inf] |
| **Animation** | Pager ghost return animation and flash; Brickflow's `tools/shots` rests 550 ms before a photo (`LOG.md:1829-1832`) [obs/log] | Disable motion in test mode through a token or `prefers-reduced-motion` [inf] |
| **Viewport** | The same drop at the default viewport produced 6 sections instead of 5 (`LOG.md:2054`). C-05 depended on viewport width (OR-04) [log] | Viewport belongs in the scenario setup [inf] |
| **Environment** | An orphan dev server on the port made the reporter write empty results (`LOG.md:1810-1817`). Port 5173 was taken by another app. Four divergent Brickflow trees existed on one machine (`report.txt:28-35`). Pager: *"clear IndexedDB, not just localStorage"* (`CLAUDE.md` last lines) [log] | Fresh context per test, a strict port, and the run fingerprint (commit, dirty, browser version) stored with the results [inf] |

---

## Not covered

- **A Brickflow UI redo after A20.** The repository ends at A20 and has no later commit, branch or stash. If the brief's "Claude Code took it over to redo the UI" refers to work after A20, I could not inspect it. My Brickflow break points cover the in-history redo (`185d33e`), A1–A20, U0–U2 and the defects open at A20.
- **Running Brickflow.** I did not copy or run it. The wrapper-gap divergence, the keyword subsets and the debounce loss are verified in code and taken from `report.txt`'s browser probes, not reproduced by me. Reason: the pnpm `node_modules` would have to be copied, and `report.txt:17-22` documents EPERM problems with that tree.
- **Running Pager in a browser.** I ran only its node tests (109/109, in `.cache/pager-invest`). The PG defects are verified in code. Their visible behaviour comes from the earlier session's observations in `spec/behavior/*.md`.
- **The 234 "Problems in Pager".** I verified 19 in code and 2 citations against it (§5.2). The rest are neither classified by link nor verified.
- **Raw evidence for three log claims.** "20 of 44 tasks failed on Chrome" (A1) and the tasks-suite and E0 first-run counts are [log]. `.probe/audit/pw-chrome-tasks/` is empty.
- **Pager's external acceptance suites.** Comments reference them (`layers-panel.js:704`, `diagnostics/index.js:115`), but they are not in the repository.
- **Pager at HEAD vs working tree.** 45 files differ. I analysed the working tree and did not diff every claim against HEAD.
- **Model attribution.** I cannot determine which model wrote Brickflow beyond the commit trailers.
- **`DESIGN.md` and `ARCHITECTURE.md` of this project.** They do not exist yet, so nothing was checked against them.
- **The `.probe/` and `review/` scratch scripts** (for example the 29 `review/audit/scenarios/*.mjs`). I did not read them one by one. I used the LOG entries that cite them.
