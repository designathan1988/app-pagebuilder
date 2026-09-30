# Status Board

The official summary of the base editor, at the close of its design-system chapter (2026-10-01): the audit of the
whole application (jornada01, jornada02) and its resolution plan — fast tests, the functional bugs, then the
interface brought onto the canonical design system.
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

Counted by `npm run inventory` from the contract and the source: **187 features (185 built), 258 commands, 1,002
doors, 1,341 scenarios, 259 modules, 49,885 lines.**

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
  **1,653 unit tests** — among them the headless scenario runner (every scenario's logic without a browser), the
  planted manifest fixtures, the catalogue's duplicate and unused-key checks, and coverage floors.
- **The complete browser suite**: **1,988 tests** — every scenario through every door it names, on the installed
  Chrome (`channel: 'chrome'`), plus the end-to-end specs. Its last complete run, on the tree this board summarises:
  **1,988 passed** in 11.0 minutes (workers capped at a quarter of the cores), no failures and no flakes.
- **Between commits**: `npm run e2e:affected` runs the browser tests of the features a change reaches; `npm run
  e2e:tooth` proves a feature's scenarios fail with it switched off.
- **The flows**: the seven `npm run ui` flows, each a real gesture at a time with a screenshot per step.
- **The application audit**: the editor was driven as a user — a landing page built from scratch through the doors,
  then every panel, menu, tab, editor and gesture walked with photographs and measurements.
- **The export and the preview**: rendered and read outside the editor, with the console watched.

## Stability

This chapter began with an audit of the whole application driven as a user (jornada01: 93 interface findings, 34
functional bugs, the contract's gaps) and its target design (jornada02). The functional bugs were fixed first, each with
the scenario that failed before it; then the interface moved onto the design system — one owner per primitive, the
tokens' type roles, z scale and sizes, the lean field, concept rows (All properties in at most four screens for every
element kind), the frame's breakpoint tabs, menus, the palette, the quick panel, the Explorer's rows. The contract was
tightened along the way: the rules `style-door-section`, `concept-row` and `quick-panel-group`, the readers of
`consumers.json` named for real (121 named modules never written), and the 43 catalogue keys nothing read removed.
Two mid-chapter complete runs caught what the per-block tests missed (a backdrop sized by a button rule, a runner that
read a tab while it reloaded); both are fixed and covered.

## Open, honestly

- **The bottom dock stays as the owner's A3.18 decided** (collapsed, no strip): the plan's 5.5 would give back a strip
  at the cost of 28 px of canvas — the owner's call.
- **Left/Right between the app menus** (a door of the menu context needs a scenario able to open an app menu without
  choosing an item), **the colour picker's 240 px popover restyle** and **the timeline's canonical layout** are open.
- **Fifteen manifest fields no module reads** keep a planned reader in `consumers.json`: wire them or drop them.
- **S-028** stays: a scenario pins that a whole border's refusal names the part the parser guessed.
- T.2 (door reach batched in one page) and T.5 (visual baselines) are not built.
- `hover-measure` and `shortcuts-e2e-sweep`: unregistered by decision (no command, no door behind them).
- **T7 deferred with its reason**: the pointer's module-level singletons only matter when two editors share a page,
  and no flow opens two; it waits for the first feature that does.
