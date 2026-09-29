# quick-panel — Floating quick panel over the selection

How Pager behaves, observed by running it from `.cache/pager-run` (Chrome, window 1600×900, zoom 100 %) and read from its source. Source references are `path:line` inside Pager. Test document: Section > [Heading, Paragraph].

## Trigger

- The quick panel (`#selbar`) appears whenever exactly one element or a group is selected and the stage is at least 40 × 40 px (`src/features/selection/selection.js:203-279`). It is hidden during a drag (`style/08-ui-system.css:837`).
- Fields commit on Enter or blur; Escape restores (`src/features/inspector/quick-panel.js:208-219`). The tag select, the colour buttons and the "Edit on canvas" select commit on change.
- **Grip drag:** press on the `⠿` grip (`data-context-drag`) and move: the panel follows the pointer; the offset from the element is remembered **per element key** for the session (`src/features/windows/index.js:810-835`, `src/features/windows/context-position.js:28-33`). `Escape` during the drag restores the previous offset.

## Hit zones and thresholds

- Default placement (`context-position.js:3-26`): inside the stage minus a 20 px inset, the panel is centred on the element horizontally and tried **above** (12 px gap plus 20 px for the element's chip), then **below**, then **right**, then **left**; the first that fits wins; if none fits it is pinned at the top of the stage. A remembered manual offset is used when it fits and does not cover the element; otherwise the candidate nearest to it is used.
- The panel is limited to the stage width minus 40 px (`selection.js:262-264`).
- The grip drag has no threshold of its own; it moves from the first `pointermove`.

## Visual feedback

| Stage | What is drawn | Image |
|---|---|---|
| Section selected | A dark floating bar above the element: tag select `section`, grip `⠿`, `⋯` More actions, `W 1392`, `H 151`, `Fill` (colour swatch), and the "Edit on canvas" select. Padding and Margin fields exist but were not visible in the 399 px bar. | ![section](img/quick-panel--01-section-selected.png) |
| After dragging the grip (+300, +250 px) | The bar sits where it was dropped. | ![dragged](img/quick-panel--02-dragged.png) |
| Paragraph selected | Text fields appear: family, Size, weight, alignment, text colour; the Edit text action. | ![paragraph](img/quick-panel--03-paragraph.png) |
| Section at the top of the page | The remembered offset from the drag is reused (bar below the Section at y = 292). | ![top](img/quick-panel--04-top-of-page.png) |

The "Edit on canvas" select kept showing `Shadow offset` after that mode had been left with Escape (observed), so it can show a mode that is not active.

## Result in the document

- Typing `900` in W and Enter wrote `width: 900px` on the Section; status `W set to 900px.` Fields write through the same style writer as the Inspector (`quick-panel.js:354-390`), on the active breakpoint/state layer.
- With several elements selected, fields whose values differ show the placeholder `Mixed` (`:254`, `:433`) and a commit writes to every selected element in one transaction.
- The grip offset is not part of the document.

## Undo and redo

Each committed field is one history entry. Moving the panel is not.

## Nested elements

The panel follows the primary selection.

## Zoom other than 100 %

The panel is window chrome; its placement uses the zoomed element box, its size does not change.

## Keyboard equivalent

The panel's controls have `tabindex="-1"` (sealed out of the Tab order, `quick-panel.js:198`, `:221`, `:230`); there is no keyboard route into it.

## Problems in Pager

1. **The remembered offset is lost on reload** (a `WeakMap` in memory). Required: a dragged quick panel keeps its offset for that element across reloads (manifest feature `quick-panel`), stored with the workspace preferences.
2. **The "Edit on canvas" select shows a stale mode** after the mode ends. Required: the select always shows the active mode, or its neutral label when none is active.
3. **Fields do not fit:** Padding and Margin fields were present but not visible in the bar. Required: every control the panel offers is visible without overlap or clipping.
4. **Not reachable by keyboard.** Required: a shortcut opens and closes the panel from anywhere (Ctrl+Shift+Q; F6 stays the key that moves the focus between regions, `keyboard-panel-navigation`); Tab walks its fields; Escape closes it wherever the focus is inside it and gives the focus back to the canvas (manifest feature `quick-panel`, command `quickPanel.setOpen`).
5. **Controls for unbuilt features must be disabled with "not available yet"** (the manifest intent); Pager has no such distinction. Required: each control reads its availability from the one feature registry.
6. **Several visual properties have no control on the canvas:** Pager's panel offers W, H, Fill (a colour) and font Size, but no text colour, gradient, border, opacity, effects or transform. Required: the quick panel also offers Text colour (text elements), Border, Opacity, Effects and Transform (Move X, Rotate, Scale), and Fill opens the same fill editor as the inspector (solid colour or gradient); every control runs the inspector's command for that property (manifest feature `quick-panel`).
7. **More actions opens a separate strip** of action buttons. Required: More actions opens the element's context menu at the button, the same menu as a right-click (see `context-menu.md`).
8. **Its bar showed align and distribute always disabled, and its fields a Reset "not available yet" with nothing to reset** (the user's real-use audit, item 1.4: 8 buttons and 19 Resets that looked usable and did nothing). Required: the bar draws an action only while it can act (its door built and its command able to run on the selection; a list of choices, Edit on canvas, while built); a field's Reset is drawn only while the element holds a value of its own (inspector-provenance-reset, Problems in Pager 5).

## Our rule: the fields follow the element kind, and every style door shares one context (the user's real-use audit, items 6.1 and A3.8)

- The panel draws, per element kind: a container's direction, alignment, padding and gap (the layout rule of
  props-element-specific, read from the same context the Style tab reads); a text's typography and colour; an image's
  source, alternative text, object fit and radius; a link's address and new tab; a button's text and its type; the
  transformations in their group. A field of a layout the element is not in is not drawn, exactly as in the Style tab
  (`shownForContext`). An attribute field is drawn for the element kinds the attribute names (elements.json).
- **One context for every door**: the Style tab, the panel, the canvas handles and the Edit-on-canvas modes write to
  the same style target, at the same breakpoint and state. `geometry.resize` (a handle's drag) writes through
  `styleHolders`, so a drag with a class as the target lands in that class's styles, and the panel and the canvas label
  say the context they write in ("Button 24 · .card2 · Hover · Tablet": the element's name and tag, the class target,
  the state and the breakpoint, each when it is not the plain element at Base).

## Our rule: the remembered positions and the history across a reload (the user's real-use audit, item A3.42)

- The offsets a dragged panel leaves (`quickPanelOffsets`, per element) are **pruned of the elements the document no
  longer holds as they are written**: a delete, or another project opened, leaves no entry behind, so the list never
  grows with dead ids.
- **The history does not survive a reload**, and the editor says so: undo steps belong to the session, while the
  document itself comes back from the autosave. Restoring says it in the status bar ("Your work was recovered from the
  last session. Undo starts again from here."), so nobody looks for an undo that is not there. Restoring a version from
  the recovery dialog starts the history again the same way.

## Our rule: the panel's keyboard (the user's real-use audit, item 6.3)

- The panel's open state is the editor's, one command: `quickPanel.setOpen` (`ui.quickPanelOpen`; the chip's own door
  in the panel's region, the global shortcut Ctrl+Shift+Q, and Escape inside the panel; not undoable, and nothing in
  the document changes).
- **Opening it puts the focus in its first field**, so a person types at once and Tab walks its fields; **closing it
  gives the focus back to the canvas** (its chip stands beside the selection's label, in the canvas's key context), so
  Delete and the other canvas keys work again — a scenario proves it by deleting the selection right after Escape.
- **The panel's key context absorbs the fields inside it** (`interactions.json`: `quick-panel` with `absorbsFields`;
  `keymap.ts` `focusChain`): a key of the focus is looked up in the panel's context first and in the field's own after
  it, so Escape closes the panel from any of its fields while Enter keeps what a field holds and the arrows step it.
  No other region absorbs its fields: an inspector field keeps the field's own keys.
- **Closing the panel cancels what a field held unkept**: the panel's fields are drawn with `keepOnLeave={false}`, so a
  value typed and not kept with Enter is dropped when the panel closes, as Escape in an inspector field drops it; the
  inspector's own fields keep the rule that leaving a field keeps what was typed.
