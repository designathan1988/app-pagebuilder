# props-filters-clip — Filters, backdrop filter, clip path and mask image

How Pager behaves, read from its source (source references are `path:line` inside Pager) and checked in `.cache/pager-run`. Test element: a Container.

## Trigger

- Inspector › Style › Effects: **Filter**, a text field (placeholder `blur(2px)`, `src/features/inspector/catalogue.js:397`).
- More: **Backdrop filter** (placeholder `blur(8px)`), **Clip path** (`inset(0 round 8px)`), **Mask image** (`linear-gradient(#000,transparent)`), text fields (`catalogue.js:457-459`).

## Hit zones and thresholds

Not applicable: every control is a field of the inspector.

## Visual feedback

The canvas draws the element again at once; the fields show the stored text.

## Result in the document

- Each field stores the typed text as its property: `filter: blur(2px)`, `backdrop-filter: blur(8px)`, `clip-path: inset(0 round 8px)`, `mask-image: …`.
- The computed values in the iframe match.

## Undo and redo

Each change is one undo step.

## Nested elements

Not applicable.

## Zoom other than 100 %

Not affected (the fields are in the Inspector).

## Keyboard equivalent

The fields are keyboard-operable like every inspector field.

## Problems in Pager

1. **The filters are one text field:** changing the blur means retyping every filter, and a typo (`blur(2)`) is stored and dropped by the browser. Required: one field per filter function (Blur, Brightness, Contrast, Saturation, Hue rotation, Grayscale, Invert, Sepia), each setting its function in the filter value (in its place, the others kept) through one command, `style.setFilter`; Remove filters takes them all away; a value the browser does not take is refused with a message and nothing is written.
2. **The mask image takes any text,** a script address included. Required: Mask image takes an image address as the background image does (bare or inside url(), a web address or a path inside the project); another scheme is refused naming the address.
3. **Backdrop filter and clip path store text the browser drops.** Required: a value the browser does not take is refused with a message.

## Our rule (the user's real-use audit, item A3.31)

- **Remove filters takes the declaration away.** The door hands `style.setFilter` `functions: "none"`, and the
  command routes it to `removeStyle` (`src/core/style/reset.ts`), the one owner of taking a declaration away: the
  `filter` declaration leaves the styles of every selected element at the breakpoint and state in view. The document
  and the export hold no `filter` at all, never a `filter: none` left in its place. The status bar names the reset and
  the change is one undo step, as every reset is.

## Our rule: the quick panel's guided Effects and Skew fields (the user's real-use audit, item 6.4)

- The quick panel's **Effects** field writes the whole filter list, and a **bare number in it is a blur radius in px**
  (`2` is `blur(2px)`, through the same `withBareUnit` the per-function fields use; `src/editor/canvas/quick-panel.tsx`
  `functionsTyped`); the full CSS list still works (`blur(2px) brightness(1.2)`, `none` takes them all away), and a text
  that is neither is refused naming the field. The guided per-function controls (a field per filter, its unit its own,
  the sliders) stay in the Style tab's Effects section.
- The quick panel's **Skew X and Skew Y** take a bare number as **degrees** (`10` is `skewX(10deg)`), like the
  inspector's own transform fields: the bare unit of each function comes from one owner
  (`src/core/style/functions.ts` `withBareUnit`: blur px, grayscale %, skew deg, scale a factor), so no door demands
  raw CSS syntax from a person.
