# elements-structure — Structure elements and the Link Block's link

How Pager behaves, read from its source and observed by running it from `.cache/pager-run` (Chrome, window 1600×900). Source references are `path:line` inside Pager.

## Trigger

- The Elements panel's **Structure and layout** group: Container, Header, Navigation, Main, Section, Article, Aside, Footer, Card and Link Block (`src/model/elements.js:11-21`, observed in the panel). A click on a tile inserts the element (the rules of palette-click-insert: into a selected container, after a selected leaf, at the end of the page with nothing selected); a drag places it (palette-drag-insert).
- The Link Block's link: the **href** text field of the inspector's Content section (`src/features/inspector/properties.js:2287`), shown for a Link Block.

## Result

- Each tile makes a container node (`src/model/templates.js:17-27`), named and styled:

| Tile | Tag | Layer name | Default styles |
|---|---|---|---|
| Container | `div` | Container | `padding: 0px` |
| Header | `header` | Header | `padding: 20px 40px; align-items: center` |
| Navigation | `nav` | **Nav** | `padding: 20px 40px; align-items: center` |
| Main | `main` | Main | `padding: 56px 40px` |
| Section | `section` | Section | `padding: 56px 40px` |
| Article | `article` | Article | `padding: 56px 40px` |
| Aside | `aside` | Aside | `padding: 24px` |
| Footer | `footer` | Footer | `padding: 20px 40px; align-items: center` |
| Card | `article` (the tile's hint says `div`) | Card | `padding: 20px` |
| Link Block | `a` | Link Block | none |

- The structure tags can be switched among each other afterwards (`src/model/tree.js:435`: div, section, header, main, footer, nav, aside, article).
- An interactive element (a link, a button, a form control, another Link Block) dropped or inserted inside a Link Block is refused with `An interactive element cannot sit inside a Link Block` (`src/model/grammar.js:47`, `:113`; `src/features/drag/drag.js:742`).
- The Link Block's href is stored as typed. Rendering and export pass it through `safeHref` (`src/model/urls.js:7-17`): a scheme other than http, https, mailto, tel or ftp becomes empty, and the export then writes `href="#"` (`src/features/export/index.js:159`). A Link Block with no href is exported with `href="#"` too.

## Visual feedback

| Stage | What is drawn |
|---|---|
| After a tile click | The new element on the canvas, selected, with its label; the Layers row appears. An empty container is drawn with the canvas's minimum height. |
| Link Block href typed | Nothing on the canvas (a link looks the same); an unsafe value is kept in the field and in the document without a word. |

## Undo and redo

Each insert is one undo step; each href change is one undo step.

## Keyboard equivalent

A focused tile inserts with Enter or Space (palette-click-insert). The href field takes the keyboard like any text field.

## Problems in Pager

1. **Card is a separate element type that is only an `article` under another name**, and its tile says `div` while it writes `article`. Required: there is no Card element type; the Structure group offers Container, Header, Navigation, Main, Section, Article, Aside, Footer and Link Block (`elements.json` palette), and cards come from templates.
2. **Navigation is named "Nav"** while its tile reads "Navigation". Required: a new element's layer name is its element label in the UI language (`Navigation`, numbered when taken, as palette-click-insert does).
3. **Header, Navigation and Footer get `align-items: center` without `display: flex`**, a declaration that does nothing and lands in the export. Required: an element's default styles are only declarations that act (the `defaultStyles` of `elements.json`: padding for the bands and bars); a Link Block is `display: block`, since it is a block link that holds other elements.
4. **An unsafe link is kept in the document and silently exported as `href="#"`**, and a Link Block without a link is exported as a link to `#`. Required: the Link field of the Settings tab (DESIGN.md `inspector-settings`, `element.setLink`) keeps a link on Enter or when the field loses focus, as one undo step, and the status bar names the element and the link (`status.link.set`); a value whose scheme is not http, https, mailto or tel is refused with `status.url.unsafe` naming it, and the document keeps its value; a Link Block with no link has no `href` (the export does not invent one).
5. **The refusal inside a Link Block is only in the drag's code path and its message names no element.** Required: every insert (tile click, Enter/Space on a tile, drag) of an interactive element (a Link Block, a link, a button, a form control) into a Link Block, or into an element inside one, is refused with `status.refused.interactiveInside` naming the Link Block, and nothing changes.
6. **An empty structure element would collapse** to no height on the canvas. Required (already true in the editor): an empty container keeps the canvas's minimum height (`canvas.emptyContainerMinHeight`), an editor aid never written into the document nor the export.

## Our rule: one rule for every address (the user's real-use audit, A3.2)

- **One owner decides what an address may be** (`src/core/elements/address.ts`, `readAddress`): every field that
  writes an address asks it — a link's `href`, a resource attribute (an image's Source, a form's action, a video's
  poster, an iframe's src), the page's own addresses (Canonical URL, Sharing image, Favicon), a background image and
  every `url(…)` inside a free declaration. No field carries a rule of its own.
- **Taken**: a relative path (`/about`, `about.html`, `img/logo.png`, `../x`), a fragment of the page itself
  (`#inicio`), a web address (`https:`, `http:`), `mailto:` and `tel:`; and a domain typed without its scheme
  (`example.com/about`), stored as `https://example.com/about` with the status naming both (`status.url.normalized`).
- **Refused with its reason beside the field**: what runs code or hands a document over inline — `javascript:`,
  `vbscript:`, `data:`, `blob:`, `file:` (`status.url.unsafe`) — and what names no address at all: a word alone
  (`nope`: no path, no extension, no scheme, `status.url.malformed`), a space inside a web address, an unknown scheme.
  The document keeps the address it had.
- **The same rule reads stored addresses** (`addressAllowed`): what the validator asks a document that arrived from a
  file, a paste or an import, so no road into the document is left unchecked (item A3.44).

## Our rule: the link picker (the user's real-use audit, item 7.4)

- **One place chooses what a link points at** (feature link-picker): the Link address field shows a choose button
  (`linkPicker.open`, ui.linkPicker keeps the node and the kind), and the picker opens over a shield with the five
  kinds as its segments (`linkPicker.setKind`: a web address, a page of the project, an element of this page — an
  anchor — an email address, a phone number), the current link shown, and the body of the kind: the address field for
  the three address kinds, the pages of the project as items (`element.setLink#link-picker-page-item`, each standing
  for one page's file), the elements of the page that carry an ID as items
  (`element.setLink#link-picker-anchor-item`). Its close button, a click on the shield and Escape (its own key context
  in the keymap) leave it.
- **A link to a page** stores the page's file path (what the export writes, `about.html`); **a link to an element**
  stores a reference: the fragment with the target's *node id*, and the page writes the target's `id` attribute as it
  stands (`#inicio`), so renaming the ID later leaves the link working (A3.4). An element the picker lists that has no
  ID attribute yet is given one when it is chosen.
- **Open in a new tab** says what it adds — `rel="noopener noreferrer"` beside `target="_blank"` (the field's label).

## Our rule: the references between elements (the user's real-use audit, A3.4)

- **A reference is kept by the target's node id** (`src/core/elements/references.ts`, the one owner): a label's `for`
  and a link's `#anchor`. The page's writers (the renderer and the export, through `core/files/values.ts`) resolve it to
  the target's `id` attribute at that moment, so renaming or re-numbering the ID follows in the canvas and in the site;
  a reference whose target holds no ID writes nothing.
- **The label's field shows the control it points at by name and ID** (`Button 24 · cta`), takes either when typed, and
  offers every form control of the page.
- **A delete says what it takes away and takes it away**: the message counts the references to the deleted subtree
  (`status.deleted.cited`) and the same undo step removes those `for`/`href` values, so nothing is left pointing at
  nothing; Undo gives back the element and its references together.
- **The validator refuses a project whose references name no element** and, with item A3.44, any document whose
  semantics are broken (an input type outside HTML's own, an address the one rule of an address refuses, an attribute a
  tag cannot hold): File › Open says which path and why, and nothing is opened.
