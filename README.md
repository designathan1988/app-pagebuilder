# Builder

A desktop pagebuilder that runs in recent Chrome only, for professionals who build websites. The edited page renders
inside an iframe scaled with CSS `zoom`; the document JSON is the source of truth, never the DOM.

## Run and check

- `npm run dev` starts the dev server; the port comes from the `PORT` environment variable.
- `npm run check:fast` is the static gate: `gen:check`, `manifest:check`, `inventory:check`, the type checks, lint and
  the unit suite — about a minute.
- `npm run ui -- <flow>` drives the real app in Chrome with real gestures (Playwright on the installed Chrome, never
  an embedded pane), photographs every step into `.cache/logs/ui-<flow>-<time>/`, and fails on any console error,
  incident or unmet expectation. `npm run ui -- --list` says what can be run.
- `npm run e2e` runs the browser tests; at the end of a block, run the tests of what the block built
  (`npm run e2e -- <spec file>`). The complete suite runs once, when the whole application is ready.
- `npm run inventory` regenerates `docs/INVENTORY.md` (and its machine copy) from the manifest and the source.

## Where things are

- `manifest/`: the contract — every element type, edited CSS property, interaction constant and command with its
  doors, and every feature with its scenarios. `manifest:check` validates it.
- `spec/BEHAVIOUR.md`: the behaviour specs, one section per feature, anchored by id (the manifest points at them).
- `docs/PROJECT.md`: the one project document — layers, rules, the interface contract, the loop, the state.
- `docs/INVENTORY.md`: generated — every feature, command, door and module, and who owns what.
- `src/core/`: the document core (no React); `src/editor/`: the editor; `src/app/`: the wiring; `src/manifest/`: the
  contract's reader; `src/generated/`: written by `npm run gen` alone.
- `tests/`: the browser tests and their one fixture (`tests/support/`).
- `tools/`: `gen`, `manifest`, `lint`, `runner`, `inventory`, `ui` — what the app is built, checked and driven with.
- `design/final/`: the visual contract and the tokens. `reference/` (in the old checkout `../builder-5/`): the read-only
  reference material; never write inside it.
