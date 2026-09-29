# drag-autoscroll — A drag at the edge keeps scrolling the page and the Layers

How Pager behaves, observed by running it from `.cache/pager-run` (Chrome, window 1600×900) and read from its source. Source references are `path:line` inside Pager. Test document: a page three screens tall, with the Layers panel full enough to scroll.

## Trigger

- While a drag goes on (an element's or a palette tile's), the loop the drag runs every animation frame (`src/features/drag/drag.js:954`, `:1054-1083`) asks each of its scrollers — the stage and the Layers panel (`dragState.scrollers`) — whether the pointer is within **4 px across / 16 px beyond** its box (`:1055-1056`), and scrolls the ones the pointer is over.
- The scroll arms only once the pointer has been **properly inside** the stage, more than `MEASURE_LIMITS.SCROLL_ZONE` from its edges (`:1057-1059`, `dragState.arrived`): a drag that starts on the palette, outside, scrolls nothing until it has come in (UX-003).
- A side offer being held (the wrapper pill's axis) suspends the scroll along that axis (`:1060`, `:1088-1089`).

## Hit zones and thresholds

- The zone is `MEASURE_LIMITS.SCROLL_ZONE` = **56 px** inside each edge of the scroller (`src/platform/measure.js:48`).
- The step grows as the pointer nears the edge: `ceil((1 − distance / 56) × 22)` px per frame, `SCROLL_MAX` = **22** (`drag.js:1063-1070`).
- A scroller scrolls on an axis only when it has room: the stage when the page overflows its box, the Layers panel when its content overflows it (`:1061-1062`).
- The proposal follows: every frame that scrolled reruns the drop proposal at the pointer's place (`:1076`), so the insertion line tracks the page.

## Visual feedback

The drop indicator (the line, the receiver's outline, the label) moves with the page; nothing else is drawn for the scroll itself.

A proposal already taken stays while the pointer stands still (the drag's hysteresis keeps a jittering pointer from flipping between two slots), but a scroller that moved carried the page under it: the proposal is taken again there, so the release lands on what the scroll brought under the pointer, never on what stood there before.

## Result in the document

The scroll changes no document by itself; what it changes is where the release lands, because the node under the pointer after the scroll is a different one (a page that has scrolled up brings lower rows under the same pointer).

## Undo and redo

Not applicable: no document change of its own.

## Nested elements

The Layers panel scrolls even while the pointer is over the page and the reverse: both scrollers are asked each frame.

## Zoom other than 100 %

The zone and the step are screen pixels (`drag.js:1063`, screen coordinates), so the page moves `22 / zoom` page pixels a frame at another zoom.

## Keyboard equivalent

None.

## Problems in Pager

1. **The scroll is a loop of its own and belongs to the drag's owner.** Required: one autoscroll, in the pointer owner (src/editor/input/pointer.ts), registered in the manifest as the feature `drag-autoscroll`, with scenarios: the zone, the step and the arming rule are the constants `drop.autoscrollZone` and `drop.autoscrollMaxStep` of interactions.json.
2. **Only the page scrolls.** Required: the Layers panel scrolls the same way while the pointer is over it, so a row below the fold can be reached by dragging: its own visible box, its own scroll.
3. **A drag that starts at the edge scrolls at once.** Required: the scroll waits until the pointer has been properly inside the scroller, beyond the zone, at least once during the drag (spec drag-layout, row 8).
