# Status Board

The official summary of the base editor, at the close of its architecture-and-verification chapter (2026-09-29).
It states what the application is, what it delivers, how that is proven and what is honestly still open. The
authoritative documents stay `docs/PROJECT.md` (the layers, the rules, the state) and `spec/BEHAVIOUR.md` (one section
per feature); this board only summarises them.

## What it is

A desktop pagebuilder that runs in recent Chrome only, for professionals who build websites: one working tree, one
copy of the application, and one contract — `manifest/` — from which every command, door, field, palette entry and
scenario is declared and drawn. The document JSON is the source of truth, never the DOM; the page renders in an iframe
scaled with CSS `zoom`; state changes only through `dispatch(command)`.

## The architecture

| Layer | Where | What it holds |
|---|---|---|
| The contract | `manifest/` | Elements, properties, commands with their doors, layout, features with their scenarios. Nothing is re-listed in code. |
| The document core | `src/core/` | Plain TypeScript, no React, no DOM (its ports are injected): the model and its validation, structure, styles, text, the importer, the renderer, the export. |
| The editor | `src/editor/` | React, and only drawing and input: panels, canvas, drag, the keymap, the pointer owner. |
| The wiring | `src/app/` | The one command table and the one feature table; a missing or extra entry is a type error. |
| The manifest at runtime | `src/manifest/` | Loading, checking and looking up the contract. |
| Generated files | `src/generated/`, `src/ui/tokens.css`, `manifest/generated/` | Written by `npm run gen` alone; `gen:check` fails on a hand edit. |
| Tools | `tools/` | `gen`, `manifest`, `lint`, `runner`, `inventory`, `ui` — what the app is built, checked and driven with. |

The owner of a concept is the module that registers its commands; the inventory names it. A second implementation of a
concept that has an owner is a defect.

## What is delivered

Counted by `npm run inventory` from the contract and the source: **187 features (185 built), 256 commands, 998 doors,
1,333 scenarios, 249 modules, 47,946 lines.**

- **The canvas**: selection (click, Shift, marquee, the tree walk), drag and drop with proposals, resize and rotate
  handles, spacing handles, guides (drag from the ruler, snap, Alt measures), rulers, column/row/dot grids, outlines
  and zones, zoom and pan, the four breakpoints, the status bar, the quick panel.
- **The panels**: Insert (74 palette entries — the whole HTML/SVG palette, the form controls, the templates — plus a
  tile per component of the project), Layers (windowed, colours, rename, hide, lock, drag to reorder and reparent),
  Explorer (pages, files, folders, assets, the file actions), Styles (style classes with their users, variables),
  Checks (accessibility and link findings with their fixes), Timeline (animations and their keyframes).
- **The inspector**: three tabs, the nine style sections in the contract's order, Essentials only / All properties,
  the property search and reveal, and the editors — spacing box model, border and radius, shadows, gradients, grid
  tracks, filters, anchors, custom declarations — each drawn from the manifest.
- **The document**: the whole element set (structure, text, lists, tables, forms, media, interactive, SVG), the
  templates, structure commands (insert, duplicate with a fresh id and name and a copy that stands off its original,
  unwrap, nest, move, wrap, the hand), in-place text editing with inline runs and rich paste, classes, components
  (create, place, detach; instances share a class in the export), interactions (with the exported script) and
  animation.
- **Out of the editor**: the export (a ZIP of HTML plus a separate BEM stylesheet, no inline styles, every file of the
  project at its path, an optional interactions script), the preview, and the language: English and Portuguese (pt-BR)
  complete, with the theme (light, dark, system) and the workspace persisted.

Two features are declared and deliberately **unregistered**: `hover-measure` (its behaviour lives in the canvas chrome)
and `shortcuts-e2e-sweep`. Neither brings a command or a door.

## How it is proven

- **The gate, at every commit**: `gen:check`, `manifest:check`, `inventory:check`, both typechecks, lint, and
  **690 unit tests**.
- **The complete browser suite**: **1,941 tests** — every scenario through every door it names, on the installed
  Chrome (`channel: 'chrome'`), plus the end-to-end specs. Its last complete run, on the tree this board summarises:
  **1,941 passed** in 25.6 minutes, no failures and no flakes.
- **The flows**: the seven `npm run ui` flows, each a real gesture at a time with a screenshot per step.
- **The application audit**: the editor was driven as a user — a landing page built from scratch through the doors,
  then every panel, menu, tab, editor and gesture walked with photographs and measurements.
- **The export and the preview**: rendered and read outside the editor, with the console watched.

## Stability

The last stretch deliberately verified the application by *using* it, and the browser suite stayed green while doing
so — the four defects below lived through every green run, because no test covered them:

1. **The exported stylesheet's addresses**: a declaration kept the stored path while the stylesheet stands at
   `css/styles.css`, so a background image of the project never loaded in the export (`55f5661`).
2. **The preview drew nothing of the project's files**: its frame has an opaque origin, where a blob: URL of the
   editor's origin does not load; every source, background and font now goes through a data: URL (`e15179d`).
3. **The component prompt's only button** wore the create command's label while running the close command, so the
   whole components feature was unreachable from the UI (`163b508`, `f3e13ea`).
4. **An image with no address** was briefly treated as a draft and dropped from the page; the contract says an image
   is written and its alternative text is the browser's own fallback. The rule stays with the media parts (`3bd6195`).

## Open, honestly

- `hover-measure` and `shortcuts-e2e-sweep`: unregistered by decision (no command, no door behind them).
- **T7 deferred with its reason**: the pointer's module-level singletons only matter when two editors share a page,
  and no flow opens two; it waits for the first feature that does.
- **The Radius row keeps its slider**: the glyph, its size and its centring match the design system to the pixel
  (measured); the slider's horizontal weight in that row is a product decision the owner keeps.
- **One verification gap is the harness's, not the app's**: my driver cannot enter and leave the preview reliably, so
  an interaction created in the editor was not yet *watched* running there; its scenarios pass through their doors.
