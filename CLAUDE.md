# Builder

A desktop pagebuilder that runs in recent Chrome only, for professionals who build websites.

## One tree, one copy

There is one working tree, this root, and one copy of the application. No worktrees, no agent branches,
no parallel trees, no code waiting to be merged, no hooks or guards that block an operation. Work is
committed on `main` directly as it advances; a change that is not finished stays in the working tree,
never on another branch.

## Files that drive the work

- `manifest/`: the single contract. It declares the test environment, every element type, every edited CSS property, every interaction constant, every command with its doors (entry points), and every feature with its scenarios. The schema is `src/manifest/schema.ts`; `npm run manifest:check` validates it. A feature may point to a behavior spec in `spec/behavior/`.
- `docs/DESIGN.md`: the interface. Layout, panels, where every door is placed, design tokens.
- `docs/ARCHITECTURE.md`: the modules and the single owner of every concept. It confirms the `owner` of each command.
- `docs/PROGRESS.md`: at most 60 lines: the current state, the user's pending decisions and the open findings. Everything past goes to `docs/history.md`.
- `docs/testing/README.md`: the whole test cycle.

The old application (the Pager) is read-only reference material at `reference/` (a folder of this tree, ignored
by git), for behavior only, never for code. Never write inside it.

## How work happens

1. Read the manifest entry, the spec and the sections of `docs/DESIGN.md` and `docs/ARCHITECTURE.md` an item touches, then build it: manifest and spec first when behaviour changes, then the code, in the same commit.
2. Every feature is written with its own basic test — the test that proves the thing that was built — and checked in the browser with Playwright on the installed Chrome (`channel: 'chrome'`): real gestures one at a time (click, drag, type), a screenshot per step into `.cache/logs/uso-<item>-<time>/`, compared with what the code should produce. Never the embedded preview pane, which cannot press modified keys, drag, or read what the app stored.
3. No suite runs between steps. **At the end of a block, run the tests of what the block built** (`npm run e2e -- <spec file>`) and fix what they find. The complete suite (`npm run e2e`, the census included) runs once, when the whole application is ready.
4. Each feature that changes behaviour gets its tooth proof: make its handler change nothing, show its scenarios FAIL, undo the edit, show them pass.
5. Never edit, skip or loosen a test or a scenario to make it pass; if one looks wrong, stop and tell the user. Never fake a result.
6. The complete output of every command you claim goes to `.cache/logs/`; in the chat, the exit code, the failing test names and the last lines.

## The manifest is the contract

- A change of behaviour starts in the manifest, in the same commit as the code, and `npm run manifest:check` stays green.
- The UI registers doors only from the manifest. Every button, menu item, context-menu item, shortcut, field, handle and drag target is generated from a door in `manifest/commands/*.json`; there is no other keymap, menu table or button list. A door whose feature is not built yet is shown disabled with "not available yet", except in the context menu, which shows only the commands that apply to the selection.
- A door's adapter data (the values it offers, the selection it acts on, the properties it writes) is read from the manifest, never re-listed in code.
- Status comes only from the runner: a feature passes when every scenario passes through every door it names, at the current commit, on a clean tree. Never write a status or `passes` field anywhere.

## Stack and architecture

- npm (never pnpm), TypeScript strict, Vite, React for the editor UI, the document core in plain TypeScript with no React.
- Vitest for unit tests, Playwright with `channel: 'chrome'` for end-to-end tests.
- The document JSON is the source of truth, never the DOM. The edited page renders inside an iframe scaled with CSS `zoom`.
- One store. State changes only through `dispatch(command)`. No document or selection state in `useState` or `useRef`.
- Follow `docs/ARCHITECTURE.md`: every concept has one owner module. A new concept gets its owner there and its data in the manifest, in the same commit.
- Follow `docs/DESIGN.md`. Colors, spacing, fonts, radii and shadows come only from the design tokens.
- No module that only tests call: every module is reachable from the app; every test walks the path the app walks.
- Code, file names and commits in English. UI text only through i18n (`src/i18n/locales/en.json` and `pt-BR.json`); English is the source catalogue and the default UI language. One term per concept in each language (`src/i18n/glossary.json`). The product name appears only in `src/config/product.ts`.
- Export: a ZIP with HTML plus a separate CSS file, BEM classes, no inline styles, standard HTML/CSS that works in any browser.
- The dev server port comes from the `PORT` environment variable.

## Checks

```
npm run gen:check && npm run manifest:check && npm run typecheck && npm run lint && npm run unit
```

All five green before a block is called done. The browser tests of the block, then.
