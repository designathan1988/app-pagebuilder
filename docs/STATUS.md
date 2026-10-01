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

Counted by `npm run inventory` from the contract and the source: **187 features (185 built), 261 commands, 1,006
doors, 1,343 scenarios, 259 modules, 49,995 lines.**

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
  **1,655 unit tests** — among them the headless scenario runner (every scenario's logic without a browser), the
  planted manifest fixtures, the catalogue's duplicate and unused-key checks, and coverage floors.
- **The complete browser suite**: **2,006 tests** — every scenario through every door it names, on the installed
  Chrome (`channel: 'chrome'`), plus the end-to-end specs. Its last complete run, on the tree this board summarises:
  **2,006 passed** in 11.9 minutes (workers capped at a quarter of the cores), no failures and no flakes.
- **Visual baselines**: fourteen pictures of the editor (seven states, light and dark), at most 50 pixels of difference.
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
The chapter closed with the menu bar walkable from the keyboard (F10, the arrows, submenus), the colour picker and the
Timeline on their canonical anatomy, every manifest field read by a module or taken out, and visual baselines. Two
mid-chapter complete runs caught what the per-block tests missed (a backdrop sized by a button rule, a runner that
read a tab while it reloaded); both are fixed and covered.

## Open, honestly

Nothing of the chapter's plan is left undone; three items were decided rather than built, each with its reason in
`docs/PROJECT.md` and its spec section:

- **The bottom dock stays closed without a strip** (the owner's A3.18); the status bar's Checks icon carries the issues.
- **S-028 stays**: the scenario `a-side-colour-that-is-no-colour-is-refused` pins naming the part the parser guessed.
- **T.2 is not built**: the per-commit loop is already fast (headless runner, `e2e:affected`) and the complete suite
  stable in about 11 minutes; a runner rewrite would risk that for a margin.
- `hover-measure` and `shortcuts-e2e-sweep`: unregistered by decision (no command, no door behind them).
- **T7 deferred with its reason**: the pointer's module-level singletons only matter when two editors share a page,
  and no flow opens two; it waits for the first feature that does.
