# base-style — The project's base style

How Pager behaves, observed by running it from `.cache/pager-run` (Chrome, window 1600×900, zoom 100 %) and read from its source. Source references are `path:line` inside Pager. Test document: Section > [Heading, Paragraph].

## Trigger

- Pager writes a small reset into the page's own style element when the frame mounts (`src/features/canvas/reset.css`, injected at `frame.js:88-104`).

## Hit zones and thresholds

Not applicable (no control of its own).

## Visual feedback

Not applicable: the base style changes the page's own layout, not the editor's chrome.

## Result in the document

- The reset is not part of the project file: it is written into the frame and into every export, so a project that is opened elsewhere keeps the same layout.

## Undo and redo

Not affected: the base style is not a document change.

## Nested elements

Not applicable.

## Zoom other than 100 %

Not affected.

## Keyboard equivalent

Not applicable.

## Problems in Pager

1. **The reset is content-box** (`* { box-sizing: content-box }` is the browser's default and Pager never changes it): a hero given `height: 100vh` with padding grows past the screen (observed: 900 px of content plus the padding). Required: the project's base style is `border-box`, written into the canvas and exported, so a height or a width the person sets is the size the element takes on screen (the user's real-use audit, item 2.4).
2. **The reset lives only in the editor's frame** (`frame.js` injects it, the export writes none of it): the exported page and the canvas disagree. Required: one owner writes the same base text into the canvas and at the head of every exported stylesheet (`src/core/render/base.ts`).

## Our rule (the user's real-use audit, item 2.4)

- The base is one text, `baseCss()` in `src/core/render/base.ts`: the canvas writes it as the page's first style element
  (`src/core/render/render.ts`, `data-base-style`) and every exported `css/styles.css` carries it at its head
  (`src/core/export/export.ts`). What the canvas shows is what the site does, for a rule of the base as for every other.
- It holds `box-sizing: border-box` for every element and its pseudo-elements. Its neutral presentation defaults cover
  the body font and margin, heading hierarchy, text spacing, links, lists, quotes, code, tables, form controls and media.
  The presentation selectors use `:where()` so an element's or class's own styles take precedence.
