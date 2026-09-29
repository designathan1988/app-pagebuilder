# page-seo-meta — The page's metadata for search and sharing

How Pager behaves, read from its source (it was not run for this spec). Source references are `path:line` inside Pager.

## Trigger

- Nothing in Pager. Its export writes the head's charset, viewport, title and the page's `lang`/`dir`
  (`src/features/export/index.js:172`) and nothing else: there is no control and no page field for a description, a
  canonical URL, Open Graph tags, a favicon or a linked script, and a project file cannot carry them either.

## Result

- A page's metadata can only be edited by hand in the exported file, which the next export overwrites. Observed:
  nothing of the interface reads or writes it.

## Problems in Pager

Everything: the capability does not exist. Required (the user's real-use audit, item 7.2): the page's settings carry
its metadata and the export writes it — see the rule below, which is the contract.

## Our rule (the user's real-use audit, item 7.2)

- **Six settings on the page root**, in `elements.json` in this order after the title, the language and the
  direction: **Description** (`pageDescription`), **Canonical URL** (`pageCanonical`), **Sharing title**
  (`pageOgTitle`), **Sharing image** (`pageOgImage`), **Favicon** (`pageFavicon`) and **Linked scripts**
  (`pageScripts`). They are drawn in the inspector's Settings tab under the page's header, and each is kept by
  `page.setSetting` exactly like the title: on Enter or when the field loses focus, one undo step, a status naming
  the setting and the value, and emptying the field removes it from the page root (`status.page.settingRemoved`).
- **The export writes them in the head of the page**, in the manifest's order, after the title and before the
  stylesheet link: a `meta` as `<meta name="description" content="…">`, a property (`og:`, `twitter:`) as
  `<meta property="og:title" content="…">`, a `link` as `<link rel="canonical" href="…">` or
  `<link rel="icon" href="…">`, and a path list as one `<script src="…"></script>` per entry. Values are escaped as
  attributes; nothing set writes nothing. An empty value never writes an empty tag.
- **The mapping is data**: each attribute's `head` in `elements.json` (`meta:description`, `link:icon`, `script:`) is
  read by the one export writer (`core/export/export.ts`, `headLines`); no second list of tags lives in code, and the
  preview shows the same head because it is the exported page.
- **The canvas draws no metadata**: it is not page content, so nothing of it reaches the frame.
- **The address fields** — Canonical URL, Sharing image, Favicon — carry an address, so they take the one address
  grammar (the owner of A3.2, item 7.4) as Link's and Source's fields do; until that owner exists they keep any text.
  The image fields may pick a file from the project when the file tree exists (feature explorer-assets).
- **The grid and fold toggles left the page's Settings** (item 7.2): they are canvas tools and live on the canvas's
  toolbar and in Guides & Grids, so the page's panel holds settings only and nothing is edited in two places.
