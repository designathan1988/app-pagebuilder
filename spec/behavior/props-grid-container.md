# props-grid-container — Grid container: tracks, areas, auto flow and item alignment

How Pager behaves, read from its source (source references are `path:line` inside Pager) and checked in `.cache/pager-run`. Test element: a Container with `display: grid` holding three cards.

## Trigger

- Inspector › Style › Layout, for a grid container (`src/features/inspector/catalogue.js:313-319`):
  - **Columns:** the track editor (`ppTracks`, `properties.js:2048-2100`; `editor: "tracks"`, `:2319`): one row per track with its size and unit (`fr`, `px`, `%`, `em`, `rem`), a track written as an expression shown as text, and **Add a track** (`:2059-2061`), which adds `1fr`.
  - **Rows:** a text field (placeholder `auto auto`).
  - **Auto flow:** `row`, `column`, `dense`, `row dense`, `column dense`; **Justify items:** `stretch`, `start`, `end`, `center`.
  - **Areas** (More): a text field (placeholder `"head head" "side main"`, `:441`).

## Hit zones and thresholds

Not applicable: every control is a field, a button or a menu of the inspector.

## Visual feedback

The canvas lays the grid out again at once; the track editor's strip shows the rendered size of each column.

## Result in the document

- Columns writes `grid-template-columns` (the tracks joined, `none` for none, `:2067`); Rows `grid-template-rows`; the menus their properties; Areas `grid-template-areas`.
- Add a track appends `1fr` to the columns.
- The children are laid out in the iframe on the tracks written.

## Undo and redo

Each change is one undo step.

## Nested elements

Not applicable: the controls act on the selected container only.

## Zoom other than 100 %

Not affected (the controls are in the Inspector).

## Keyboard equivalent

The fields, the button and the menus are keyboard-operable like every inspector control.

## Problems in Pager

1. **The track editor's names are English text written in the code** (`"Line names"`, `"Track expression"`, `"Track size"`, `properties.js:2081-2082`), so they are never translated. Required: every name of the grid controls comes from the catalogue.
2. **Areas are stored as typed:** rows of different lengths (`"a b" "c"`) are stored and the browser drops them silently. Required: areas the browser does not take are refused with a message and nothing is written; so are tracks.
3. **Add a track has no door of its own that says what it writes.** Required: Add column is a door of style.set that stands for the tracks it writes (the columns the element has, then 1fr; the first track of a grid with none).

## Our rule

- **The track editor** (the user's real-use audit, item A1.2). The tracks a grid's axis holds are read and written by
  one owner, `src/core/style/tracks.ts`: a value written in the repeat form the templates use
  (`repeat(3, minmax(0, 1fr))`) holds that track three times, a list (`1fr 2fr auto`) holds its own, `none` or no
  value holds none; written back, equal tracks take the repeat form, a single track is written plainly, any other
  list is joined. The editor draws, for a grid container's columns and again for its rows: the count of tracks, one
  field per track keeping that track in its place (`style.setGridTracks` with the place and the text typed), and the
  doors that add and remove a track. The raw value keeps its own field beside the editor.
- Add appends a track like the ones the axis already holds while they are all the same (three equal columns take a
  fourth and keep their `repeat(4, …)`; the acceptance of the audit), the default track `minmax(0, 1fr)` otherwise,
  and the first track of a grid that holds none. Remove takes the last track away (`none` from one). A place the grid
  does not hold, and a track the property does not take, are refused with what was typed named and nothing written.
- Each edit is one undo step, written at the base breakpoint and state like every style write; a locked element
  refuses as every style write does (spec lock-element).

## Our rule: the grid child (the user's real-use audit, item A1.3)

- A grid item's place is written by start and span, one axis at a time: `style.setGridItem` takes `grid-column` or
  `grid-row` and whole numbers for `start` and `span`, writes them as the composite's own value through `style.set`'s
  reader and writer (`"2 / span 3"`, `"span 2"` alone for a span, the plain number for a start), and reads the half a
  door leaves out from the value the item holds. A start or a span below 1 is refused, naming the number; a locked
  element refuses as every style write does. The Style tab draws, for the child of a grid, one field per half on each
  axis (Column start, Column span, Row start, Row span).
- The **Area** field (grid-area) takes the name of an area or a line the parent's `grid-template-areas` holds, as a
  CSS identifier, and writes it into the property's four longhands (grid-row-start, grid-column-start, grid-row-end,
  grid-column-end — the manifest forbids storing a shorthand whole, so the value is written as the composite it is);
  the card moves into that area. It reads no list of its own: an area name is what the person wrote in the parent.
- The **Span in columns** property (`column-span`) belongs to multi-column layouts: its name says so, so it is not
  taken for the grid item's span.
