# Builder

A desktop pagebuilder that runs in recent Chrome only, for professionals who build websites. The edited page renders
inside an iframe scaled with CSS `zoom`; the document JSON is the source of truth, never the DOM.

## Stack

- npm (never pnpm), TypeScript strict, Vite. React for the editor UI, the document core in plain TypeScript.
- Vitest for unit tests; Playwright with `channel: 'chrome'` for end-to-end tests.
- Export: a ZIP with HTML plus a separate CSS file, BEM classes, no inline styles.

## Run and check

- `npm run dev` starts the dev server; the port comes from the `PORT` environment variable.
- `npm run check` is the limited validation after a change: the static checks and the browser tests the change can affect.
- `npm run verify:fast`, then `npm run e2e`, is the checkpoint a commit must pass on to reach `main`.
- `npm run unit` runs the unit suite; `npm run manifest:check` validates the manifest contract; `npm run gen:check`
  fails when the generated files are stale or hand-edited; `npm run lint` and `npm run typecheck` are the static checks.

## Where things are

- `manifest/`: the single contract — every element type, edited CSS property, interaction constant and command with its
  doors, and every feature in dependency order with its scenarios.
- `src/`: the application. `src/core/` is the document core (no React), `src/editor/` the React editor, `src/app/` wires
  the two, `src/manifest/` reads and checks the contract.
- `spec/behavior/`: the behaviour specs the scenarios are written from.
- `tests/`: the browser tests (`tests/e2e/`) and their one fixture (`tests/support/`).
- `tools/`: contract generation, the manifest checker, the lint rules, the scenario runner and the validation cycle.
- `docs/DESIGN.md` and `docs/ARCHITECTURE.md`: the interface, and the single owner module of every concept.
- `docs/PROGRESS.md` and `docs/history.md`: the current state and the appended history.
- `docs/testing/README.md`: how the project validates a change, and the measurements behind each rule.
- `design/final/`: the visual contract and the design tokens; `design/history/` the older mockups.
- `reference/`: read-only reference material (the Pager app and the previous attempt); never write inside it.
- `.memory/` (ignored by git): the user-authored briefs and memory.
