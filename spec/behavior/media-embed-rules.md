# media-embed-rules — What a media element, an SVG's markup and an Embed write

How Pager behaves, read from its source (it was not run for this spec). Source references are `path:line` inside Pager.

## Trigger

- A Video's or Audio's parts editor (`parts.js`), whose Add source and Add track buttons add an empty part; the
  controls toggle `autoplay`, `muted`, `loop`, `controls`, `playsinline`, `preload` and `poster`.
- An Image's Alternative text field (a plain text input).
- An SVG's markup field (a text area, `element.setSvgMarkup`'s door) and the shapes editor's Add rectangle.
- An Embed's markup field (`element.setEmbedMarkup`'s door).

## Result

- **Empty parts are exported as empty tags.** A `<source src="">` and a `<track src="">` with no address are written
  into the page (`export/index.js` writes every child). Observed in an export of a Video with one Source and one
  Track: `<source src="">`, `<source src="">`, `<track src="">`.
- **Autoplay without muted is exported as it is**, and a browser refuses to play it — the page shows a still frame.
- **An emptied alternative text removes the attribute** (the same rule as every other attribute): the export writes
  `<img>` with no `alt`, which a screen reader reads as the file's name.
- **A whole `<svg>` pasted into the markup is kept as written**, so the page ends up with `<svg><svg>…</svg></svg>`
  (observed by typing a complete `<svg>` into Pager's markup field and exporting).
- **A shape can be added beside a markup** (Add rectangle writes a shape node next to the markup group), so the
  element has two owners of its content and a re-edit of one loses the other's work.
- **An Embed's markup is written verbatim**, script tags and event attributes included, with nothing in the editor
  saying so.

## Visual feedback

| Stage | What is drawn |
|---|---|
| An empty part | A row in the parts editor; nothing on the canvas (a `<source>` has no box). Nothing says it is a draft. |
| An emptied alternative text | The field is empty: the same as an image that never had one. |
| Markup typed | The canvas draws the shapes and the markup together. |

## Undo and redo

Each field and each part button is one undo step; the coupling written below records one step for the pair.

## Problems in Pager

Each is required (the user's real-use audit, A3.6); the rules hold for the canvas and the export alike, and the
document stays the source of truth:

1. **A media part with no address is never exported.** A `<source>` or `<track>` the person added and did not fill
   yet stays in the document and in its parts editor, and nothing of it reaches the page
   (`writesNode`, `src/core/render/output.ts`): a Video with one filled Source exports one `<source src="…">` and no
   empty tag. The canvas keeps drawing the document it is given (an empty part draws nothing, as a `<source>` never
   does), so the editor and the export never disagree about what the person sees and what the page says.
2. **Autoplay switches Muted on with it**, in the same undo step (`element.setAttribute`,
   `src/core/elements/attributes.ts`): a browser blocks an audible autoplay, so the setting alone would leave a still
   frame where the person asked for a playing one. Unticking Autoplay leaves Muted as it is.
3. **An empty alternative text is a value of its own**: an image whose Alternative text is emptied is decorative — the
   document stores `alt: ""` (`keepsEmpty` on the attribute, `elements.json`) and the export writes `alt=""`, which a
   screen reader skips. An attribute the person never filled has no `alt` at all, and the Checks panel reports it
   (feature accessibility-checks).
4. **A whole `<svg>` pasted into the markup is unwrapped** (`src/core/elements/svg.ts`, `sanitizedSvgMarkup`): the
   element the markup is pasted into is the SVG, and `<svg><circle/></svg>` is stored as `<circle/>`. A self-closing
   `<svg/>` alone empties the markup.
5. **An SVG's content has one owner at a time**: an SVG that draws a markup takes no shape parts — Add rectangle (and
   its siblings) is refused with `status.svg.holdsMarkup`, and the person clears the markup to place shapes. The
   shapes written into the markup by hand are the markup's own and are never split into part nodes.
6. **An Embed says its code runs in the published page** (`holdsExecutableCode`, `src/core/elements/embed.ts`): while
   the markup holds a `<script>`, an `on…` attribute or a `javascript:` address, the field shows
   `settings.embedRunsCode` beside it. The export writes the code as it is; the canvas keeps it in a sandboxed frame
   where it never runs.
