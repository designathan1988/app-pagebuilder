# html-import — Import an HTML file (and its CSS) into the page

How Pager behaves, read from its source and observed by running it from `.cache/pager-run` (Chrome, window 1600×900). Source references are `path:line` inside Pager.

## Trigger

- None. Pager has no HTML importer: the File menu's comment says "Importing HTML is not a current capability" (`index.html:40-43`). Only a project file (`File › Open project`, `project.json`) brings a document in.

## Result

- Nothing. There is no door that reads HTML.

## Visual feedback

None: no control, no message.

## Undo and redo

Not applicable.

## Nested elements

Not applicable.

## Zoom other than 100 %

Not applicable.

## Keyboard equivalent

None.

## Problems in Pager

1. **No HTML import.** Required (manifest feature `html-import-structure`): File › Import HTML (and the command bar) opens the browser's file picker, reads the picked `.html`, and each supported tag becomes the matching element type in the document JSON with its text, inline marks and supported attributes (`href`, `src`, `alt`, `type`, `name`, …); element names come from BEM classes when present, else from the element type; the import replaces the page and is one undo step; a ZIP among the picked files is read as a whole, its entries standing for the files it holds.
2. **Import cleaning.** Required (`html-import-cleaning`): scripts are not dropped — each is kept with its page (its code, or its `src` as a project file or as an address the page lists), never run on the editing canvas, written back by the export, and listed in the report; event handler attributes (`on…`) are removed and listed; unknown elements are unwrapped into their children; structures the editor cannot hold are repaired (a stray `li` gets a `ul`) or dropped; the resulting document always passes the content model; an import report lists everything that was dropped, unwrapped, repaired or kept, with the source line.
3. **The styles of the imported page.** Required (`html-import-styles`): the import takes several files at once; a linked stylesheet is found by its path among the picked files; `style` attributes, `<style>` blocks and linked stylesheets' declarations are resolved by specificity and order (importance, inline, specificity, then order) and become each element's styles in the document JSON, so the computed styles of every element in the canvas match the original file opened in Chrome; a linked stylesheet that was not picked is listed in the report; a declaration of a property the editor does not edit is listed in the report and left out.
4. **Media queries.** Required (`html-import-media-queries`): a `max-width` rule whose width is a breakpoint's becomes an override of that breakpoint; another width maps to the nearest breakpoint at or below it and is reported; rules that cannot be mapped (`min-width`, `orientation`, `print`) are listed in the report; at each breakpoint the computed styles in the canvas equal the original's.
5. **Pseudo-class rules.** Required (`html-import-states`): each supported pseudo-class rule (`:hover`, `:focus`, `:active`, `:disabled`, `:invalid`, `:placeholder-shown`, `:first-child`, `:last-child`, `:focus-visible`, `:visited`) becomes a state style of the matching element, at its breakpoint; in preview, hovering an imported element shows its hover styles; a selector that cannot be mapped to single elements (a descendant rule, `@supports`, `::before`, an unsupported pseudo-class) is listed in the report.
6. **Exported pages import back.** Required (`html-import-roundtrip`): importing the ZIP the export wrote imports its pages together with their linked stylesheets as a whole; the imported document equals the original in tag structure, texts, attributes and styles per breakpoint and state (element types that share a tag are compared by tag); element names are recovered from their BEM classes, so a second export writes the same pages and the same rules again. Ids and editor-only data (locks, guides, grid settings, saved colours) are not compared.
7. **Pasted HTML from outside.** Required (manifest feature `clipboard-paste-external`, spec clipboard-paste-external): pasted `text/html` goes through the same importer and the same nesting and cleaning rules and is inserted into the selection as one undo step; scripts in pasted HTML are not kept, a pasted fragment having no page to keep them with; plain text becomes one Paragraph per line; anything the importer drops is reported in the status bar. (Chrome's own clipboard already leaves a `<script>` and an `on…` attribute out of the HTML it hands back; what reaches the importer through a paste is what the platform kept, and the importer's cleaning applies to that.)

## Format of the four doors

- The door is `project.importHtml` (File › Import HTML, the command bar), one picker, several files at once: an HTML page, the stylesheets it links, its images, its scripts, or a ZIP of them.
- The command's argument is the picked files (name and bytes); the door reads them and expands an archive into its entries before the command runs, so the handler stays a pure function of the document and the files.
- The report shows in the status bar, as a message naming what was imported and, per kind, the source lines: scripts kept, event handlers removed, unknown elements unwrapped, elements repaired, elements dropped, stylesheet rules not mapped, declarations not stored, linked stylesheets not picked.
