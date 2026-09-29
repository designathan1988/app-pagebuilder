# drag-duplicate — Alt at the release drops a copy and leaves the original

How Pager behaves, read from its source and its duplicate spec (`spec/behavior/duplicate.md`, "Trigger"): **Ctrl held during a pointer drag** duplicates: the ghost reads `Copy of <name>`, and the release inserts a copy at the drop point while the original stays (`src/features/drag/drag.js:307-311`, `:358-367`, `:1166-1170`). This editor gives Ctrl to the selection (a Ctrl+click toggles an element in it) and follows Webflow and DESIGN.md "Canvas", drag (spec drag-layout, row 12): the key is **Alt**.

## Trigger

- An element drag on the canvas (drag-reorder-canvas, drag-drop-inside) with **Alt held at the release**. While the drag goes on, Alt belongs to the duplicate: pressing or releasing it changes nothing but what the release will do, and the drop label and the status bar say it ("Duplicate · …").
- The canvas toolbar's key hint of a drag reads "↑↓ level · Esc cancels · Alt duplicates".

## Result in the document

- The dragged elements (the selection's roots) stay where they are; a copy of each, made as `element.duplicate` makes it (fresh ids, new names, spec duplicate), lands where the drop label says, in document order: `element.duplicate` then `element.moveTo` of the copies to the parent and index drawn, through the drag's one gesture.
- Where the copies may not go (the drop is refused, spec drag-layout, Problems in Pager 4), the release does what the proposal drawn says; a refused release changes nothing.
- The copies become the selection.

## Undo and redo

One undo step takes the copies away and gives back the selection from before; redo puts them back.

## Problems in Pager

1. **The modifier is Ctrl, which the selection needs** (Ctrl+click toggles an element in the selection, spec multi-select-click). Required: Alt duplicates, as in Webflow; Ctrl keeps its selection meaning.
2. **Nothing but the ghost says a copy will be made.** Required: the drop label and the status bar begin with "Duplicate ·" while Alt is held, and the toolbar's key hint names Alt.
