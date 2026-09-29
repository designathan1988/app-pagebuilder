# multi-select-edit — Edit a property on several selected elements at once

Read from Pager's source (`reference/Pager`, run from `.cache/pager-run`); references are `path:line` inside Pager. Test document: Section > [Heading, Paragraph, Paragraph] with different font sizes.

## Trigger

- Select several elements (Shift+click on the canvas or in Layers, spec `multi-select-click`), then type a value in a field of the inspector or of the quick panel and press Enter (or leave the field).

## What the fields show

- The inspector compares, for each field, the value of every selected element (its declared value, else the value in force) with the first one's (`src/features/inspector/properties.js:3240-3244`, `ppMixed`). When one differs, the field shows no value and the placeholder `Mixed` (`:3247-3258`); when they are all equal, the field shows the value as for one element.
- The quick panel builds one model per selected element and marks the fields whose values differ (`src/features/inspector/quick-panel.js:431-434`): those fields show the placeholder `Mixed` (`:254`) and no value, **except the colour fields** (`backgroundColor`, `color`), which keep showing the primary element's colour (`:433`).

## Result in the document

- A committed value is written to every selected element, at the active breakpoint and state, in one transaction (`quick-panel.js:354-390`, the inspector's `ppWrite`); the status bar says how many elements took it.

## Undo and redo

One undo step restores every element's own previous value (each element's declaration, or its absence); redo writes the value to all of them again.

## Nested elements

A selection of an element and one of its descendants writes to both.

## Keyboard equivalent

The fields' keys (Enter, Escape, the arrows) act on every selected element the same way.

## Problems in Pager

1. **The colour fields hide that the elements differ** (`quick-panel.js:433`): they show the primary element's colour although the others have other colours. Required: every field, colours included, shows `Mixed` [inspector.mixedValue] when the selected elements' values differ, in the inspector and in the quick panel alike.
2. **Two different rules decide what is mixed** (the inspector compares declared-or-in-force values, the quick panel its own model). Required: one rule, one owner, for both: an element's value is the one it declares at the base breakpoint and state, else the value the page computes; the field is mixed when any selected element's value differs from the primary's.
3. **A mixed field keeps no hint of what typing does.** Required: a mixed field shows no value, so what is typed is the whole new value for every selected element; Escape leaves it mixed.
4. **Mixed values were said in some controls only** (the user's real-use audit, A3.35): with two elements of different values, Text align and Position showed every button off with nothing saying why, the spacing box and the alignment matrix showed the first element's value while the field beside said Mixed, the linked field of a box whose four sides differ was empty, Reset stayed off when only one of the elements held a value, and both links of the box were titled "Link all four sides". Required: every control says a value the selected elements do not share in the same way: a field's placeholder "Mixed", and beside a control that has none (the segmented buttons, the matrix) the word "Mixed", with no button or cell pressed; the spacing box's side fields and a linked box whose sides differ say Mixed; Reset this value is drawn when any selected element holds a value of its own and takes it away from all of them in one step; each box's link names its box ("Link the four sides of Margin", "… of Padding").
