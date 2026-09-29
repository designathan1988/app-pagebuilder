# canvas-grid-editor — editing a grid on the canvas: its tracks, its cells and the items in them

The user's real-use audit, item 8.2 ("Editor de grade no canvas"): enter with a double click or Enter, leave with
Escape; line numbers; resizable tracks; add and remove a track; drop into a cell; span from the corner; merge
(Ctrl+M) and split (Ctrl+Shift+M) cells; draw and name areas; a responsive grid; everything per breakpoint and
undoable. The grid's own data belongs to the owners that already have it: the tracks are
`src/core/style/tracks.ts` (style.setGridTracks: a track's size, the repeat form, the track editor's add and remove)
and an item's place is `src/core/style/grid-item.ts` (style.setGridItem: its start and its span). This feature adds
the canvas editor over them — one editing mode of the canvas, its own key context, its own chrome — and nothing of
the document shape of its own.

## Trigger

- **Enter**: a double click on a grid container on the canvas (`grid.enterEdit#canvas-double-click-grid-container`).
  A container is a grid when the page computes `display: grid` for it (the value predicate `gridContainer`,
  properties.json); anything else is refused with its name (`status.gridEdit.notGrid`).
- **Leave**: `Escape` in the key context `grid-edit` (interactions.json), which the keymap takes for the canvas's
  while the editor is on (the same rule as the Edit on canvas modes, `src/editor/canvas/edit-mode.ts`
  `keyContextIn`).
- While it is on the canvas draws (`src/editor/canvas/grid-editor.tsx`): the number of every column at its start, a
  grip on the boundary between each two columns, and a grip at the bottom-right corner of the selected item. The
  grips are canvas handles: the boundary grip is the door `style.setGridTracks#handle-grid-track`, the corner grip
  `grid.spanItem#handle-grid-span`, so the pointer owner drags them as any other handle.

## What the editor writes

| Gesture | Command | Written through |
|---|---|---|
| Drag a boundary grip | `style.setGridTracks#handle-grid-track` | the track list of the axis, the track before the boundary taken as the px the drag makes (`withTrackSet`, the repeat form kept for equal tracks) |
| `Shift+=` / `Shift+-` in the editing context | `grid.addTrack` / `grid.removeTrack` | the same owner: one track added (equal to the others while they are equal) or the last taken away |
| Drag the corner grip | `grid.spanItem#handle-grid-span` | the item's grid-column: the width the drag makes divided by the width of one track — read from the item's own box (the layout port) and its current span — as its start and span, through style.setGridItem |
| `Ctrl+M` | `grid.mergeCells` | the same: the item's span on the axis one greater, refused where a child of the grid already covers the next cell (`status.gridEdit.cellTaken` naming it) |
| `Ctrl+Shift+M` | `grid.splitCells` | the same: the item's span one smaller, refused when it covers one cell (`status.gridEdit.nothingToSplit`) |

Every write goes through style.set's own reader and writer at the breakpoint and state the editor edits, so a grid
edited at the Phone is written at the Phone, and one undo step is one gesture or one command.

## Not built yet (the audit's remaining half of 8.2)

- **Dropping an element into a cell** (writing the item's grid-column/grid-row from the cell under the pointer): the
  drag's proposal knows the receiving parent and the index among its children, not the cell under the pointer, so a
  drop inside a grid still lands as an insertion among its children. The item's place is set from the corner grip,
  the item fields of the Style panel (A1.3) or the merge keys above.
- **Drawing and naming areas** on the canvas: `grid-template-areas` is edited in the Style panel's field, and an
  item names one of the parent's areas in its Area field (A1.3); the canvas does not draw areas yet.

## Problems in Pager

1. **The grid is edited in the Style panel only.** Pager sizes a grid's columns by typing the list, with no canvas
   editor, no line numbers and no grip on a track. Required: the editor above, on the canvas, over the owners of the
   tracks and of an item's place.
2. **A track written by the editor must keep the value's form.** Required: the editor writes what the track owner
   writes — the repeat form while the tracks are equal — so three equal columns sized by hand do not turn into three
   separate tracks by accident.
3. **A merge only where the cells are free.** Required: the keys refuse a merge with a reason naming the element in
   the way, and change nothing.
