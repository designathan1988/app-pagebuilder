# layout-actions — the layout quick actions: a container, a grid, the swapped direction, the phone stack, the organized children and the column divider

The user's real-use audit, item 8.1 ("Ações rápidas, no menu de contexto, no Arrange e por atalho"): wrap in a
container, wrap in a grid, swap the direction row↔column, distribute equally, a draggable divider between columns,
stack on the phone and organize the loose children. What already exists is never duplicated: Wrap in a row and Wrap
in a column are `element.wrapRow` and `element.wrapColumn` (spec wrap-row-column), Remove wrapper is
`element.unwrap`, and Distribute equally is `position.distribute` (spec align-distribute). A1.4 — the responsive
grid — lives here too: creating a grid offers the phone behaviour without anything being edited afterwards.

## Trigger

- The context menu of a selection (secondary click on the canvas or a Layers row), the Arrange menu, the command
  palette (Ctrl+K, "wrap in a grid") and the canvas keys: **D** wrap in a container, **G** wrap in a grid, **S** swap
  the direction, **Shift+S** stack on the phone, **O** organize the children.
- The divider is no menu item: it is the grip the canvas draws between the columns of a selected flex row, dragged
  with the pointer (the canvas-handle door `element.setDivider#handle-divider`).
- Every door acts on the selection and is disabled with its reason where it does not apply (a grid wrap needs the
  selected elements to share one parent; the direction actions need a flex or grid container; the divider needs a
  flex row holding at least two children).

## Wrap in a container, wrap in a grid

`element.wrapContainer` and `element.wrapGrid` are `element.wrapRow`'s own wrap (elements.json wrappers, one
definition per door): the selected roots leave their parent from the last one up and a new element takes the first
one's place, holding them in their order, one undo step, and becomes the selection.

| Wrapper | Element and styles |
|---|---|
| Container | a `<div>` with no styles of its own: a plain grouping box the person then styles. |
| Grid | a `<div>` with `display: grid`, `column-gap: 16px` and `row-gap: 16px` and one equal track per element it holds (`repeat(2, minmax(0, 1fr))` for two), the count written with the same writer the track editor uses (`tracksForChildren`, `src/core/style/tracks.ts`). |

The status bar names the wrapper and the styles it added ("Wrapped Intro in Container (display: grid; …)"), or, for
a wrapper that adds none, "Wrapped Intro in Container." (`status.wrappedPlain`).

### A1.4 — the grid created is a responsive grid

A grid wrapper ("Wrap in a grid", and the Grid template, which names the same wrapper) writes, besides the base
breakpoint's tracks, the tracks the narrower breakpoints take, from interactions.json: `layout.gridTracks.tablet`
(two tracks while the grid holds more) and `layout.gridTracks.phone` (one track). So a grid of three cards shows
three columns at the Desktop, two at the Tablet and **one at the Phone, with nothing edited afterwards**, and the
per-breakpoint override the Styles tab writes keeps working over it (it is an ordinary layer of the element's
styles).

## Swap the direction

`element.swapDirection` writes the opposite of what the primary element lays its children out with, for every
selected element, at the breakpoint and state the editor edits (one undo step, through style.set's one writer and
its target rules):

- a flex container's `flex-direction`: row ↔ column, row-reverse ↔ column-reverse;
- a grid container's `grid-auto-flow`: row ↔ column (a `dense` keyword is kept).

Available on a stored flex or grid container (the value predicate `flexOrGridContainer`); an element of neither
layout is refused with its element named (`status.swap.notContainer`). The status bar names the element, the
property and the value it now holds ("Swapped the direction of Row: flex-direction column.").

## Stack on the phone

`element.stackOnPhone` writes one column at the narrowest breakpoint alone (properties.json lists the cascade
widest first, so the last is the Phone), whatever breakpoint and state the editor edits: a flex container takes
`flex-direction: column`, a grid container one track (`minmax(0, 1fr)`) at that breakpoint. Every other breakpoint
is untouched — the row a person built for the Desktop stays a row there. The status bar names the breakpoint
("Row: one column at Phone."). The same element twice changes nothing and records no entry.

## Organize the children

`element.organize` reads where the selected container's children lie (the layout port) and lays them out the way
they already run: the line is a column when each child stands below the one before it (and the boxes do not also
run across), a row when each stands beside; the gap is the whole-pixel distance most of the neighbours stand
apart. The container takes `display: flex`, that `flex-direction` and that gap at the edge the editor edits, and
each child's margins along that line — the ones it holds at that layer — are removed with them, so the spacing
moves into the gap and **what the page shows does not move**. One undo step. A child the canvas draws no box for
is refused with its container named (`status.organize.unmeasured`) rather than guessed.

## The divider between two columns

For a selected flex row, the canvas chrome draws a grip on the boundary between each two of its columns
(`divider.grip` wide, over the gap band, in its own colour). Dragging it writes the two children's share of the
row: the width asked for the child before the boundary gives the fraction of the room they share, and both take it
as their `flex-grow` (`flex-basis: 0px`, so the free space splits by it and the proportion holds however the
container is resized afterwards). A width below a column's least (`divider.minWidth`) is bounded to it, on either
side. One gesture is one undo step; the status bar names the row and the two shares ("Split of Row: columns of 28%
and 72%.").

## Wrapping what the page would show differently asks first (A3.13)

Wrapping does not always keep what the page shows: a positioned element leaves the flow it was placed in, and
selected siblings that were not next to each other come out in another order (the elements between them stay
outside the wrapper). Both cases ask the person first — the confirmation dialog of `element.wrapRow`,
`element.wrapColumn`, `element.wrapContainer` and `element.wrapGrid` — and cancelling changes nothing ("Cancelled:
nothing changed."). The other half of A3.13 is in spec duplicate (the copy of a positioned element moves off the
original) and spec nest-into-previous (a change of parent keeps the element where it is drawn).

## Problems in Pager

1. **The quick actions do not exist**: Pager wraps in a row or a column only, by key, and has no wrap in a
   container or a grid, no swap, no stack per breakpoint, no organize and no divider; the ratio of two columns is
   edited by hand in the Style panel. Required: the seven actions above, in the context menu, the Arrange menu and
   by key, and the divider on the canvas.
2. **A grid is not responsive**: a grid keeps its columns at every width, so a three-column grid of cards is
   unreadable on a phone (the audit's A1.4: "sem override, a grade fica com 3 colunas de 85 px no Phone"). Required:
   one track per element at the base breakpoint, two at the Tablet while it holds more, one at the Phone, written
   by the one owner of the tracks and by every path that creates such a grid (the wrapper and the template).
3. **Wrapping changes what is shown without a word**: Pager wraps a positioned element, or elements that were not
   next to each other, silently. Required: ask first, and change nothing when the person cancels.
