# rotation-handle — Rotate an element with a handle on the canvas

How Pager behaves, read from its source and observed by running it from `.cache/pager-run` (Chrome, window 1600×900). Source references are `path:line` inside Pager.

## Trigger

**Pager has no rotation handle.** Rotation exists only as text properties in the inspector: `transform` (placeholder `rotate(2deg)`) and `rotate` (placeholder `6deg`) (`src/features/inspector/catalogue.js:399`, `:402`). The canvas selection shows resize handles only; no canvas code handles rotation (no rotation in `src/features/resize`, `src/features/spacing`, `src/features/selection` or `src/platform/overlay.js`).

## Hit zones and thresholds

None in Pager.

## Visual feedback

None in Pager.

## Result in the document

Pager writes rotation only through the inspector's text fields.

## Undo and redo

Not applicable in Pager.

## Nested elements

Not applicable in Pager.

## Zoom other than 100 %

Not applicable in Pager.

## Keyboard equivalent

None in Pager.

## Our rule: four zones, the live angle, and a chrome that turns (the user's real-use audit, item 4.4)

- **One rotation zone outside each of the four corners** (not one handle at the north-east): each is the same door
  (`style.set#handle-rotate`), drawn `--space-4` outside its corner, `--space-6` square, round, with the grabbing
  cursor, and held inside the canvas as the old single handle was — held *by its turned place*: the zone is round, so
  the element's own rotation moves it along its circle rather than turning it in place, and the clamp applies after
  that move (a wide turned element's corner can lie beyond the canvas, where a CSS turn could not hold it in).
- **The label carries the angle while the element holds a rotation** (`canvas.rotate.angle` = `{angle}°`,
  `data-chrome="label-angle"`): live while a rotate drag goes on, since every move writes the document, and kept
  afterwards. The label itself does not turn (its text stays readable and its chips stay upright).
- **The outline and the handles turn with the element**, about the element's centre: each drawn control carries the
  element's rotation as a transform whose origin is the vector from that control's own corner to the centre
  (`chrome.tsx` `spun`), so the outline, the eight resize handles and the four zones follow the turn at any angle. The
  label keeps clear of the turned controls as it does of the straight ones (`--space-6` + `--space-4`, item 4.2).
- Shift still steps by `rotate.snapStep` (15°) and every drag is one undo step; the status bar names the angle
  ("Rotate of CardA: -90deg.").
- **Known limit, recorded in PROGRESS.md**: a resize of an *already turned* element measures and writes its
  axis-aligned box (the audit asks the chrome to follow the turn, not the resize to work in the turned frame).

## Problems in Pager

1. **No rotation on the canvas.** Required (manifest feature `rotation-handle`):
   - A rotation handle sits outside the selection outline at a fixed screen distance; over it the cursor shows rotation.
   - Dragging it rotates the element around its transform-origin and the angle follows the pointer; Shift snaps to 15° steps; the status bar shows the live angle.
   - The handle and the inspector's Rotate field run the same command and write the `rotate` property, never the `transform` list (manifest property layer: translate, rotate and scale are their own properties); a whole drag is one undo step.
   - The angle does not depend on the zoom; the outline and handles follow the rotated box.
