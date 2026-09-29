# props-typography-advanced — Font stretch and variants, features, wrapping, hyphens, line clamp and writing mode

How Pager behaves, read from its source (source references are `path:line` inside Pager) and checked in `.cache/pager-run`. Test element: a Paragraph.

## Trigger

- Inspector › Style › More, typography (`src/features/inspector/catalogue.js:443-451`), for an element with text:
  - **Font stretch** (five values), **Font variant** (`normal`, `small-caps`, `all-small-caps`, `tabular-nums`, `oldstyle-nums`), **Overflow wrap**, **Hyphens**, **Direction**, **Writing mode**, **Text orientation** as menus;
  - **Font features** (a text field, placeholder `"liga" 1`);
  - **Line clamp** (`WebkitLineClamp`, a number field, `:448`).

## Hit zones and thresholds

Not applicable: every control is a field or a menu of the inspector.

## Visual feedback

The canvas draws the text again at once; the fields show the stored values.

## Result in the document

- Each control writes its property of the node's desktop base style: `font-stretch: condensed`, `font-variant: small-caps`, `font-feature-settings: "liga" 0`, `overflow-wrap: anywhere`, `hyphens: auto`, `direction: rtl`, `writing-mode: vertical-rl`, `text-orientation: upright`.
- Line clamp writes `-webkit-line-clamp: 2` alone.
- The computed values in the iframe match.

## Undo and redo

Each change is one undo step.

## Nested elements

Not applicable.

## Zoom other than 100 %

Not affected (the fields are in the Inspector).

## Keyboard equivalent

The fields and menus are keyboard-operable like every inspector field.

## Problems in Pager

1. **Line clamp writes `-webkit-line-clamp` alone** (`catalogue.js:448`), which clamps nothing: the browser needs `display: -webkit-box`, `-webkit-box-orient: vertical` and a hidden overflow with it. Required: Line clamp is written through its recipe (`line-clamp`, properties.json recipes): stored by its id and drawn and exported as all its declarations; a whole number from 1; a later write of the display or the overflow of the element takes the clamp away (the recipe's `otherWrite: clears-recipe`).
2. **Font variant is a menu of five values mixing caps and numeric variants** (`:444`) and stores the shorthand. Required: each variant typed goes to its longhand (small-caps: font-variant-caps, tabular-nums: font-variant-numeric), several at once, the others left as they are; `normal` alone makes every longhand normal.
3. **Font stretch offers five of the nine keywords** (`:443`). Required: every value of its generated list.

## Our rule (the user's real-use audit, item A3.31)

- **A recipe over a declaration the element holds its own is refused.** The line clamp recipe writes `display:
  -webkit-box` and `overflow: hidden` with its own declarations (Problems in Pager 1); if the element already holds
  `display` (or `overflow`) itself, the write would leave two `display` declarations the inspector cannot show, so
  `style.set` refuses it before anything is written, naming the recipe and the property in the way (status
  `recipe.conflict`, "Line clamp needs Display of its own: reset it first."). The other direction is unchanged: a later
  write of the display or the overflow takes the clamp away (the recipe's `otherWrite: clears-recipe`).
