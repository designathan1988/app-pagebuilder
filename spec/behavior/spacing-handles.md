# spacing-handles — Edit padding and margin by dragging on the canvas

How Pager behaves, observed by running it from `.cache/pager-run` (Chrome, window 1600×900) and read from its source. Source references are `path:line` inside Pager. Test document: Section (`padding: 56px 40px`) > Paragraph, Section selected.

## Trigger

- Choose **Padding** or **Margin** in the quick panel's "Edit on canvas" select (default label `Adjust`; `src/features/inspector/quick-panel.js:416-425`), or press the quick panel's Margin / Padding action buttons (`:392-395`). This turns on a spacing mode (`setSpacingMode`, `src/features/spacing/handles.js:74-75`).
- In a mode, the four sides of the selected element are drawn as bands; primary-button press on a band arms a drag (`handles.js:164-193`), which starts after **4 px** (`:203`).
- Modifiers: **Shift** changes all four sides, **Ctrl/Cmd** changes the side and its opposite, and also suspends snapping (`src/features/spacing/model.js:70-79`, `handles.js:205-207`). **Alt does nothing** (observed).
- A press released without moving opens a typed field on the band (`handles.js:235`, `:273-283`); double-click and Enter on a focused band do the same (`:120-123`).
- `Escape` cancels a drag (`:246-250`); `Escape` outside a drag also closes the quick panel mode (`quick-panel.js:114`).
- Ctrl + hover measurement lines (`initMeasureHover`, `handles.js:370-499`) offer a second door: dragging a container distance line drags that container's padding on that side.

## Hit zones and thresholds

- Padding bands lie inside the border, as thick as the padding on that side and never thinner than **6 px** (`SPACING_MIN_BAND_PX`, `model.js:3`, times the zoom); top and bottom span the full width, left and right fill between them (`model.js:13-22`). Measured on the Section: top band 1392 × 56 px, left band 40 × 20 px.
- Margin bands lie outside the border, as thick as the margin, min 6 px; negative margins are drawn inward (`model.js:23-35`).
- Change = pointer movement along the side's normal ÷ zoom: dragging the top padding band **down** grows it, the bottom band **up** grows it; margins grow outward (`model.js:55-66`). Padding never goes below 0; margins can be negative (`:75`).
- With Snap on, the value snaps within the snap distance to 0, sibling values, ruler steps and grid steps (`handles.js:26-39`).
- The typed field accepts `12`, `12px`, `1.5rem`, `%`, `em`; `auto` for margins; ArrowUp/ArrowDown ±1, Shift ±10 (`model.js:82-98`, `:143-156`).

## Visual feedback

| Stage | What is drawn | Image |
|---|---|---|
| Padding mode on | The bands themselves are not tinted; only a small grey value chip per side is visible (`56`, `40`, `56`; the right one is off screen). Each band has a resize cursor and the tooltip `Padding top: 56px — drag to change; Shift moves all four, Ctrl the opposite pair`. The quick panel select reads `Padding`. | ![padding mode](img/spacing-handles--01-padding-mode.png) |
| Dragging the top band down 20 px | The element re-lays out live; the chip shows the live value; status `Padding 76px 40px 56px`. | ![dragging](img/spacing-handles--02-padding-top-dragging.png) |
| Margin mode, top band dragged up 16 px | Status `Margin 16px 0px 0px`, then `Margin set to 16px 0px 0px.` | ![margin](img/spacing-handles--03-margin-top-dragging.png) |
| Click on a band | In the code this opens a typed field on the band; in the run, a click at the middle of the top band did not leave a field open. | ![click](img/spacing-handles--04-click-opens-field.png) |

## Result in the document

Observed on the Section (`padding: 56px 40px`):

| Gesture | Written |
|---|---|
| top band +20 px | `paddingTop: 76px` (the `padding` shorthand stays) |
| left band +10 px with Alt | `paddingLeft: 50px` only |
| left band +10 px with Ctrl | `paddingLeft: 60px`, `paddingRight: 50px` |
| bottom band −8 px with Shift | all four sides +8: `84px 58px 64px 68px` |
| margin top +16 px | `marginTop: 16px` |

Only the sides that changed are written, as longhands, on the active breakpoint/state layer (`handles.js:209-210`, `:253-269`); status `Padding set to 76px 40px 56px.`

## Undo and redo

One history entry per drag or typed value.

## Nested elements

Only the selected element's own padding and margin; in a flex/grid parent the parent reflows.

## Zoom other than 100 %

Band thickness and the minimum 6 px scale with the zoom; the value change is the pointer movement ÷ zoom.

## Keyboard equivalent

Focus a band (it is focusable) and press Enter to type a value; the Inspector's Space section is the full keyboard route.

## Our rule: the bands without a mode, and the mode that lets go (the user's real-use audit, items 4.1 and A3.15)

- **The bands are drawn on any selected element, with no mode chosen.** Each padding and margin band waits faint
  (opacity 0.06) and comes out while the pointer is on it (0.55), so a side is dragged without opening the quick
  panel; the `spacing-band` gesture's modifiers (Shift, Alt, Ctrl) act on a band the same way whether its mode is on
  or not. Choosing a mode pins its bands (opacity as drawn); Escape on the canvas leaves the mode and its bands stay,
  faint again. A mode is the shortcut the panel offers, never the door that has to be opened first.
- **A gap band is drawn only where there is a gap to edit.** The gap bands (row, column and Gap) are drawn only while
  the element's computed display is flex or grid; on a block container no gap band is drawn and the Edit on canvas menu
  leaves Gap disabled with its own reason, "Gap does not apply to the element" (`canvas.editMode.notApplicable`); a
  shadow mode on an element holding no shadow keeps its reason (`canvas.editMode.nothingToEdit`).
- **Shift adds the same displacement to the four sides.** Each side keeps its own value and takes the travel of the
  drag: a padding of `56px 40px 56px 40px` dragged +14 px on its top band with Shift becomes
  `70px 54px 70px 54px`, in one undo step. The four sides' values are read once, when the band is pressed, so the
  live re-render of the bands cannot count the travel twice. The status names the band the pointer holds and its own
  value ("Padding top of Hero: 70px.").
- **While a mode is on the canvas toolbar reads "Mode: Padding · Esc exits"** (`data-chrome="mode-hint"`), the mode
  named by the same words the menu uses; a drag's own hint takes its place while one goes on.
- **A mode never stays over a selection it cannot edit.** The chrome lets it go, through the manifest's own leaving
  door (the Escape shortcut of `canvas.setEditMode`), when the selection is not one resizable element (none, several,
  the page, a locked or hidden element), when the element takes none of the mode's values (Gap on a block container,
  Shadow blur on an element with no box-shadow), or when a project is opened or created (the selection becomes empty).
  The resize handles a mode hides come back with it, so no one is left without a handle to resize what they selected.

## Problems in Pager

1. **The bands are invisible except for their value chips.** Required: in Padding or Margin mode the four sides are drawn as tinted bands with their values (manifest feature `spacing-handles`), padding and margin in different design-token colours.
2. **The modifiers differ from the manifest intent:** Ctrl changes the opposite pair and Alt does nothing. Required: Alt changes the opposite side by the same amount; Shift changes all four sides.
3. **Ctrl both pairs sides and disables snapping** in the same gesture. Required: one modifier per meaning, declared once in the `spacing-band` gesture of `manifest/interactions.json`: **Shift** changes all four sides, **Alt** changes the opposite side by the same amount, **Ctrl** suspends snapping.
4. **The drag writes longhands next to an existing shorthand** (`padding: 56px 40px` plus `paddingTop: 76px`), so the Inspector and export must resolve two sources. Required: the written result is one coherent value per side: the document stores only the four longhands, never the `padding` or `margin` shorthand, and the band writes its side's longhand.
5. **A click on a band does not reliably open the typed field** (observed: no field after a click in the middle of the top band). Required: a click without drag opens the typed field; Enter commits, Escape cancels.
