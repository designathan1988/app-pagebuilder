# Progress

At most 60 lines: state, the user's pending decisions, open findings. History and proofs: `docs/history.md`.

## State (2026-09-29: builder-6, the consolidated tree)

- THIS root is , the consolidated tree; the old checkout  stays as the archive (its
   holds the Pager). One tree, one copy of the application. Every line that held finished work is merged here: the
  workspace line (the panels that leave their place, the shortcuts panel, the clipboard's cut and styles, the
  status bar, command-bar-set-property), the layout-tools line (the canvas grid editor 8.2, the layout actions
  8.1, the component names A3.12, the positioned moves A3.13, the responsive grid A1.4). The old parallel lines
  are deleted; `origin/codex` (two days old, the abandoned parallel attempt, its Settings items since built here)
  is not merged.
- **Every command of the manifest is built** (`src/app/commands.ts` holds no NOT_AVAILABLE_YET). Two features are
  still unregistered as built: `hover-measure` and `shortcuts-e2e-sweep`.
- The static checks are green on this tree: `gen:check`, `manifest:check` (1333 scenarios), `typecheck` (both
  projects), `lint`, `unit` (663 tests).
- The bureaucracy is gone: no worktrees, no agent branches, no hooks or guards, no impact machinery, no
  measurement harness, no checkpoints. `tools/` holds what the app is built and tested with: `gen`, `lint`,
  `manifest`, `runner`.

## What is left (the user's goal in force: the whole application working end to end)

1. The properties panel (5.1): its data first (property icons — 2 of 181 today; sliders — one property; the
   presets of A3.30), then one home for the field components, then the visual pass (`.visual-qa` holds the
   observations, the panel's own CSS moves to a file of its own).
2. The remaining audit items, in the brief's order: 7.1 (A3.3, A3.5, A3.25), 7.6/7.7 (A3.26, A3.27), 8.1
   (A3.20), 8.3, 9.1 (A3.40, A3.45), then 14/15/16/17/20 of the manifest's feature groups.
3. `hover-measure` and `shortcuts-e2e-sweep` (the two features not built).
4. The final pass: the complete `npm run e2e` once, on a quiet machine (the census's own walk is the long part),
   then the browser sweep of the whole application at 100% and at Fit, Desktop and Phone.

## Decisions taken in the consolidation (2026-09-29)

- Conflicting lines are resolved as unions, never by dropping a side: pointer.ts carries the timeline's and the
  panels' drags, the dock draws Checks and Shortcuts, clipboard.ts keeps the external paste beside cut and the
  styles, the catalogues take every key (2042 each, equal sets).
- `manifest/references.json` is a ledger: merged by (kind,id), 17 entries recovered from the layout-tools line.
- The unit suite follows the built behaviour, with the assertions kept as strong: the store's marker entry now
  stands in the test table (every real command is built), a section carrying the essentials is drawn open,
  hasBox covers every element outside SVG, a wrap of non-adjacent siblings asks first.
- `docs/testing/README.md` and `CLAUDE.md` describe the new cycle: basic test per feature with browser photos,
  the block's tests at the end of the block, the complete suite once at the end.

## Open findings

- The complete suite has not run since the consolidation; run it once before the next block's work is called
  done (the user's rule: the whole suite only when the application is ready).
- The `.memory/` brief still carries orders of the fragmented period (worktrees, agents, the parallel Codex
  line). `builder-brief.md` now holds the goal in force and the standing orders only.
