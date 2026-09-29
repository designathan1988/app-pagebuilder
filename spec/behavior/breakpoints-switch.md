# breakpoints-switch — Switch between Desktop, Laptop, Tablet and Phone breakpoints

Read from Pager's source (`reference/Pager`); references are `path:line` inside Pager.

## Trigger

- Pager: a segmented control of Desktop, Laptop, Tablet and Phone in the top bar (`src/features/workspace/dock.js:133`, `:607`) calls `setBreakpoint(name, width)` (`src/features/workspace/camera.js:262-276`): the page's width becomes the breakpoint's, the canvas re-centres, and the inspector reads and writes that breakpoint's layer from then on. The widths are the breakpoint table's (`src/model/style-layers.js`).

## Our rule

- The frame's tabs (`view.setBreakpoint`, one door per breakpoint of properties.json's `breakpoints`): the active one pressed, its tooltip naming its width.
- The page inside the frame takes the breakpoint's width in CSS px: Desktop 1440, Laptop 1180, Tablet 834, Phone 390; in Fit mode the canvas refits the zoom, at a manual zoom the zoom stays.
- The status bar shows the active breakpoint and its width.
- The active breakpoint is a workspace preference, restored after a reload. It changes nothing in the document and records nothing.
- The tabs, the frame's widths and the export's media queries read the one breakpoint table (properties.json `breakpoints`).

## Refusals

None.

## Problems in Pager

1. **The breakpoint is a global (`window.BP`)** kept apart from the store, and lost at a reload. Required: editor state, a preference restored after a reload.
2. **The widths are written in three places** (the buttons' `data-w`, the page style, the export). Required: one table.

## Undo and redo

Not affected: switching the breakpoint records nothing.

## Our rule: the screen height, the fold lines and the width the site gives the page (the user's real-use audit, items 2.3 and A3.22)

- **Each breakpoint has a screen, width and height** (`properties.json`: Desktop 1440 × 900, Laptop 1180 × 800,
  Tablet 834 × 1194, Phone 390 × 844). The canvas gives the page inside the frame that height as its viewport, so
  `vh`, `svh` and `dvh` measure the screen whatever the zoom — a hero at Height 100vh measures 900 px on Desktop and
  844 px on Phone, at 100 %, at Fit and at 25 % — and the **export keeps 100vh**, which the site resolves to its own
  window the same way ("Screen height" is the name the Height field's list gives the value).
- **The fold lines** mark where each screen ends: one at every whole screen (a 3000 px page on a 900 px screen has
  three, at 900, 1800 and 2700), each labelled "Fold 2 · 1800 px", drawn in the canvas chrome and never exported. They
  are a page setting (`foldLines` on the page root, like the layout grids), turned on and off in Guides & Grids, saved
  with the document and undone in one step.
- **The page lays out at the width a real browser gives it**: the canvas draws no scrollbar inside the frame (the stage
  scrolls the page), and the renderer keeps the browser's own scrollbar width free on the page's root
  (`scrollbarWidth()` in render.ts, measured once in the editor's document), so the Section on the canvas measures what
  the exported page measures in a window of the breakpoint's width, at any zoom (A3.22).
