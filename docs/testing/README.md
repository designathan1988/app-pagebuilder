# Testing

One tree, one copy of the application. The checks below are the whole cycle; nothing guards, blocks or
records it.

## While implementing

No suite runs between steps. Each feature is written with its own basic test — the test that proves the
thing that was built, and its scenarios in the manifest in the same commit.

**A screen is checked in the browser with Playwright on the installed Chrome** (`channel: 'chrome'`),
never with an embedded preview pane: open the dev server (`PORT`), make the real gestures one at a
time (click, drag, type), take a screenshot of each step into `.cache/logs/uso-<item>-<time>/`, and
compare the photo with what the code should produce. A screen is not done until a photo shows it
working.

## At the end of a block

Run the tests of what the block built — never the whole suite:

```
npm run e2e -- <spec file>
```

Fix what they find before the next block. A failed browser test is diagnosed with
`npm run e2e:diagnose` (the failed tests again, with their trace). Never add a retry, raise a
timeout, lower the number of workers, or weaken a test to make it pass.

**The tooth proof**: for each feature, make its command handler return without changing anything, run
its scenarios and show they FAIL, then undo that single edit and show they pass
(`npm run e2e:tooth` does the switching off for the features named).

## When the whole application is ready

The complete suite, once:

```
npm run e2e
```

`tests/e2e/census.spec.ts` walks every door of the built commands in the same run.

## The static checks (fast, no browser)

```
npm run gen:check
npm run manifest:check
npm run typecheck
npm run lint
npm run unit
```

- `gen:check` — `src/generated/` and `src/ui/tokens.css` are what the manifest and the catalogues generate.
- `inventory:check` — the generated inventory (every feature, command, door and module, and their links) is what the
  generator writes now; every built feature has a module registering its commands; no module implements a feature the
  app does not offer.
- `manifest:check` — the contract: schemas, references, doors, scenarios, i18n, the property model.
- `typecheck`, `lint` — the code and the project's lint rules (owners, tokens, i18n, no hand-written ids).
- `unit` — vitest over `src/**/*.test.ts` and `tools/**/*.test.ts`.

## How the browser tests are written

- Tests enter only through doors, with the real mouse and keyboard, on the installed Chrome.
- They assert on end artifacts: the document JSON diff, computed style or geometry inside the frame,
  storage after an immediate reload, the files inside the exported ZIP. Never on a proxy such as a
  Layers row or a "saved" label, and never only that something exists or is visible.
- The test port (`src/editor/test-port.ts`) is read-only: it reads the document, the selection, the
  history and the export; it never writes, loads or creates anything.
- Every test opens the editor once in a fresh profile (`tests/support/editor.ts`).
