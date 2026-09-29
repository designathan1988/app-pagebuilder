# Progress

Handoff notes between sessions. Newest entry first.

## 2026-09-28 — The group 18 decisions (the Interactions agent's worktree)

Group 18 (manifest/features/18-animation-and-events.json: timeline-animations, timeline-keyframes,
timeline-animation-settings, timeline-preview, export-keyframes, events-actions, export-events-js) in full. The
decisions, so the next session does not have to re-derive them:

- **The animations live on the element** (model.ts `DocNode.animations`: a name unique in the whole document, one CSS
  text per manifest setting — the setting ids are animation.setSettings' own enum — and keyframes by whole percent
  0..100, at most one each). A new animation holds the first value each setting's door offers (direction normal, fill
  none) and, where the manifest offers none, the app's own: 1 s, no delay, one iteration, Linear timing, running — a
  new animation is Linear so what the timeline scrubs is what the keyframes say. A taken name is refused with
  `status.animation.nameTaken` (one stylesheet holds every animation); an empty one with `status.animation.nameInvalid`.
- **The keyframe under the playhead is the inspector's subject.** `HandlerContext.keyframe` (registry.ts, the store's
  `keyframe` option = src/editor/timeline/playhead.ts `keyframeTarget`) makes `writeStyle` (core/style/set.ts) write
  into that keyframe's declarations instead of the element's styles, with `writeKeyframeDeclarations` beside
  `writeDeclarations`; `styleSource` (inspector/style-target.ts) draws the fields from the same keyframe, so every
  field, the provenance line and the sections' summaries read it as they read any style.
- **The track is `timeline.trackWidth` (400 css px) wide whatever the panel's width**, so a keyframe's offset and the
  playhead's time are the same pixels everywhere; a playhead set from the ruler lands on the keyframe it is nearest
  within `timeline.snapPercent` (2 %), else on `timeline.playheadStep` (1 %). The panel scrolls when it is narrower.
- **A canvas press that picks an interaction's target is deferred** (`pointer.ts` `pickAfter`): `interactions.update`
  records one transaction per dispatch and never joins a gesture, so the press records the node and the command runs
  when the gesture closes — the same shape the text-keeping press has. `interactions.update` is `per-dispatch` (the
  check rule keeps it so: a canvas-click is no gesture door to the manifest).
- **The picker is editor state** (`ui.pickTarget`, inspector/pick-target.ts), started by the Target field's own door
  (arguments `{field: 'target', changes: {pick: true}}`) and cleared by the write it produces: no command of its own
  (DESIGN.md's "the Target field starts picking (not a command)").
- **The trigger and action labels come from the catalogue's own keys** (`interactions.trigger.*`, `interactions.action.*`,
  a kebab value with its camel key: toggle-class → toggleClass): no per-value doors were invented for them, and the
  manifest:check rule that a message names what it refuses still holds (`status.interactions.notApplicable` with the
  value's label as its parameter).
- **The events' JavaScript** (core/events/script.ts) addresses elements by the class the export gives them or by the
  person's own id — never an editor id and never a data attribute; an element an interaction names takes a generated
  class even with no styles (export.ts `generatedClasses` gains the addressed set). A hover runs its action on
  pointerenter and the reverse (show↔hide) on pointerleave; scroll-into-view fires once through an
  IntersectionObserver at 0.5; a form's submit never navigates away. `previewPage` writes the same script into the
  preview inline, wrapped in DOMContentLoaded (an inline script is never deferred).
- **An animation an event plays is written as a class rule** beside its @keyframes (`.anim-<name>`), so it does not
  play on page load; every other animation is written on the element's own rule and plays when the page loads. The
  `@media (prefers-reduced-motion: reduce)` block turns the animations off and is written only when the page has one.
- **The preview is editor-only**: `render.ts` `previewTimeline` writes the animation at the playhead (a negative delay
  and the play state) into its own style element, and `installPlayingLoop` (timeline/preview.ts, run by the frame)
  follows the running animation with the playhead every `timeline.playheadTick` ms, so Pause freezes where the eye
  left it. `ui.timeline.live` tells a preview from Stop (Stop puts the element back to its own styles).
- **Doors added to the manifest for this group**: `timeline.show` (#timeline-animation-row) chooses which animation
  the panel shows; `inspector-interaction-target` starts the pick; `inspector-interaction-new-tab` writes
  `newTab`; `timeline.setPlayhead` lost its redundant `timeline-ruler-click` (the ruler's press already sets it).
  The seven settings' doors offer their CSS property through `adapter.offers` (so the generated value lists and the
  property codecs read them), and the keyframe-easing door offers animation-timing-function the same way.
- **Codecs added to codecs.ts**: `time-list` (a time, or a list: the animation's duration and delay — the transition
  longhands name the same codec) and `easing-list` (a keyword the property offers, or cubic-bezier()/steps()/linear()).
  Both were declared in properties.json and planned in references.json since the manifest's first pass; nothing else
  changed for them.

## 2026-09-27 — The B0 decisions (the finish pass, the user's plan)

The multi-page wiring. The open page had one owner already (`openedPage`/`pageShown`, core/project/pages.ts) and five
sites bypassed it by reading `pages[0]`: the Layers tree (sidebar.tsx), the top bar's switcher (top-bar.tsx), an
insert's default parent (core/structure/insert.ts `placement`) and a paste's target (core/clipboard `target`) — which
now take the state and ask the owner — and `page.setSetting` (core/page/settings.ts), which wrote page 0's root by
index and now writes `openedPage(state)`'s. A new page opens when it is added (its own scenario's name says so: "lists
it and opens it"), the selection goes with the page on a switch or a delete (the panel and the handles would otherwise
edit a node the canvas no longer draws), the open page survives a reload (ui.page rides the workspace record,
src/editor/workspace/persist.ts + src/editor/state.ts), and the file tabs list every open page — they drew only the
open one, so the file-tab door stood for the page already on the canvas and no tab could ever switch. The top bar's
switcher now stands for the page it shows (its door's current state marks it, and running it re-opens that page).

Two scenario changes, each shown in the chat:
- `adding-a-page-lists-it-and-opens-it`: its render check named `/Page`, which resolves to page 0's root (also named
  "Page") — so it passed whichever page was drawn. Before: `[{node:"/Page",property:"display",value:"block"}]`;
  after: `[{node:"/Page 2",property:"display",value:"block"}]` (the root of the page the scenario adds, which the
  canvas draws only when the add really opens it). Stronger: it now fails when the page is not opened, which the tooth
  run shows (its scenario fails with pages.add switched off).
- `switching-pages-opens-the-page-the-door-stands-for`: the top-bar switcher left its `doors` (that control stands for
  the page already on the canvas, so it can never switch) and its step was removed; a new scenario proves what it does
  (`the-top-bars-switcher-stands-for-the-page-on-the-canvas`: after the add, the step names `/Page 2` — the page the
  switcher must stand for, or its control is not drawn — and the run opens exactly that page). A third new scenario
  proves an insert with another page open lands on that page
  (`an-element-inserted-while-another-page-is-open-lands-on-it`). The file-tab step in the switch scenario now names
  the tab it clicks (`{page:"/Page"}`), which two tabs made necessary.

The runner (tools/runner/scenarios.ts):
- `canvasProblems` walked page 0 and demanded the canvas draw it, so a correct canvas (the open page) read as wrong. It
  now reads which page the canvas draws — the one whose root it finds among the drawn nodes — and holds that page to
  its nodes alone, in order. No page drawn at all keeps the old message.
- `own` dropped a step argument when the door declared it, which is right for a door that fixes a value and wrong for
  one that declares it as the empty string (the item's own value: a file tab's page, the switcher's). An empty-string
  declared argument now leaves the step's value in play, so the step finds that one item.

The panel (B0): the step buttons stand on the row at rest (drawn at opacity 0 until hover, which is what "não tem
steppers" was; shell.css); every row whose value IS a colour opens the picker (the border's colour row — inspector.tsx
passes `colour` where it passed `sample`), and the picker writes through the one writer of a property,
`writePropertyText` (core/style/set.ts, extracted from `style.set` and now used by `colorPicker.setChannel` too), so a
composite lands on its longhands exactly as a typed value does; the SVG properties (fill, stroke, stroke-width) show
only on an SVG element or the `<svg>` element itself (core/style/applies.ts: `svgShape` joined the kind filters) —
a `<p>` was offered a fill that paints nothing. docs/DESIGN.md's section order was matched to the app: Layout, Space,
Size, Position, Text, Paint, Border, Effects, Advanced (the user's order of use, item 5.1).

## 2026-09-25 — The user's answers, rename-element integrated

The user's answers (the three pending decisions, verbatim in `PROGRESS.md`):
1. project-open-json › the-empty-project-opens-without-asking: the runner does not compare the page's and the root's
   ids when the action replaces the whole document (File › Open). The door rule (wip/feature-table) is released after.
2. drag-level-keys-escape › arrow-up-at-the-top-level-is-refused: its first step drops "before Footer"; the one
   authorized scenario edit.
3. Shift/Ctrl+click on the Layers Page row does not add the page to the selection, as on the canvas.
Workflow: from now on, blocks of features are built, then one full suite; the suite is not re-run with no change
between runs. Style path first for integration: inspector-number-fields, props-spacing, props-typography,
color-picker, props-background, props-size-overflow, props-flex-container.

rename-element (from feature/rename-element, e9e014b) integrated with its code:
- The page root is not renamed: layers.startRename and element.rename refuse it with `status.rename.root` (new key in
  both locales) before the lock refusal, as delete/duplicate/wrap refuse it with `status.<op>.root`. Reason: the
  committed test context-menu.spec.ts:126 requires that with the page root selected no context-menu item applies, and
  "the page's name is the page's" (pages.rename). The helper's unit test that renamed the root was updated with it.
- The environment: git in this checkout needs `safe.directory` (the folder is owned by the other local account);
  passed as `GIT_CONFIG_COUNT/KEY_0/VALUE_0` env vars, never written to any config file. A stale dev server owned by
  that account holds port 5310 and cannot be killed from this session: suites run with `E2E_PORT=5311`.
- rename-element's 2 rename commands are one Tooth-off run: 4 of 4 tests fail on assertions (log
  `.cache/logs/tooth-rename-element-070803.log`).
- A second writer (another coordinator session on the same identity) pushed rename-element and the drag-level
  scenario to origin/main while this one worked. Its rename-element let the page root be renamed and rewrote the
  committed tests/e2e/context-menu.spec.ts to match; this session merged origin/main, restored that test byte for
  byte (4b38208) and kept the root refusal. The drag-level scenario edit (b31f6b4) is the user's authorized one and
  was kept. Two writers on origin/main need a clear owner per file: coordinate before the next push.

## 2026-09-25 — Group 02: a coordinator integrating helpers, one feature per commit

Why: the user's group 02 brief (a new helper per feature; up to 3 at once, each in a git worktree `.cache/wt/<feature>`;
the coordinator integrates one at a time after verify:fast, e2e with the census, e2e:tooth and the status). Logs of
every check are in `.cache/logs/` and named in each commit message.

Decisions by small ambiguity (moved here from PROGRESS.md):
- The brief's order wins over select-click's dependsOn palette-click-insert.
- The tooth switch also holds the feature's availability predicates true: a refusal a predicate makes goes with its
  feature (select-click's Escape with nothing selected).
- A drawn door follows its command: selection.select#layers-row and selection.clear#menu-edit work with select-click,
  each with a browser test the census asked for.
- layers-tree: selecting inside a folded branch unfolds it (its scenario asks it; the spec put it elsewhere).
- An empty container 0 px tall blocked keyboard-tree-walk's setup; not contested: the manifest's
  canvas.emptyContainerMinHeight decides it; the renderer marks containers with data-container and one editor style
  :where([data-container]:empty) gives the minimum height, never in the document.
- The runner's refusal check takes the message's names from the expected feedback of the same key, and compares the
  document with the one just before the refused step (a-new-command-after-undo-empties-redo changes it before).
- palette-click-insert: new names unique in the whole document; nothing selected inserts at the root of the first
  page; a tile of an unbuilt feature is disabled (same rule as shortcuts); a tile click is a plain onClick until
  palette-drag-insert moves tile presses into pointer.ts; a focused tile's Enter/Space inserts it (keymap reads the
  focused control's data-args); the runner checks the focused context after focusing the control.
- multi-select-click: the selection keeps selection order and the primary is the first (the scenarios' order); the
  count label uses canvas.selectedCount; two scenarios fail their tooth in setup, on an assertion (two nodes are
  selected only through this feature's Shift door); a Layers click with an unbound or doubled modifier does nothing.
- marquee-select: a layout port (src/core/ports/layout.ts) tells the core where each node is drawn; rect is the press
  point plus a signed width and height in page px; only descendants of the deepest node under the press take part;
  touching includes edges; 0/1/many give status.selection.cleared / status.selected / status.selection.count; on
  every move the gesture goes back to the selection held before the press (a Shift/Ctrl press's add/toggle is undone
  once it becomes a marquee); the runner presses a marquee near its target's top-left corner; the stage outside the
  page starts no marquee.
- delete-element: element.delete removes every selected root (the door's adapter says "roots"; status.deletedMany
  for several; browser test with Shift+click); the toast shows while the latest undo step is a delete and the last
  message is still its own, with no timer (the manifest has no toast duration), so there is at most one and its Undo
  undoes the latest delete only; the toast has no role=status (the status bar stays the only live region); a
  toolbar or panel-control step of the runner first asserts that the control runDoor clicks is drawn. Integration
  took three rounds: the drawn check first broke the Layers modifier doors, then remove.test.ts lacked `layout`.
- move-up-down: each selected root swaps with the nearest unselected sibling (up from the first, down from the last),
  so a block at the edge stays and keeps its order (Pager's rule); nothing moving is refused with
  status.move.alreadyFirst/alreadyLast and adds no undo step (the page root's message names the page); roots of
  different parents are refused with status.wrap.needsSameParent (the key the manifest lists); the selection stays.
- wrap-row-column: the Row and Column wrappers are defined once in manifest/elements.json `wrappers` (a div named
  node.name.row/column with display:flex and its flex-direction; schema, manifest:check rule and plant added), the
  same for every door (the no-manifest-id rule refused them in code); the Row has no align-items (the scenario leaves
  it out); several roots of one parent wrap together in document order; a parent refusing a div refuses with
  status.refused.onlyAccepts. The runner reaches a setup node with no point of its own (CardB covered by its h3) by
  clicking its nearest descendant with a point and pressing ArrowUp per level (spec select-click.md:41); the Layers
  row was tried first but leaves the focus in the panel (Escape to the canvas is not built).
- drag-reorder-canvas + drag-drop-inside (one commit: building element.moveTo makes drag-drop-inside runnable): the
  innermost container wins where edges coincide; the escape band never under 6 screen px for a container at least 12
  CSS px (constants drop.escapeBandFloor/Extent); container bands in CSS px, escape band in screen px; the drop label
  is canvas.dropTarget ("Drop in X · position N of M"); a refused drop goes through the inside door so the handler
  refuses it; a press on an EMPTY container drags it; a container with children is dragged by its selection label
  (spec select-click.md:16, drag-reorder-canvas.md:7), its empty area staying the marquee's; the runner presses the
  label when a source has no own drag point, and reaches a slot with no free gap by the child's half (spec).
- context-menu: shows only the commands that would run now (store.canRun), in manifest order, and no menu at all when
  none applies (DESIGN.md, not the spec's "shown disabled"); a right-click inside the selection keeps it, outside
  selects that node; running an item dispatches ui.dismiss; the Layers row's secondary door is drawn by the row
  itself (manifest: control "row", button "secondary", schema field added); a step before the action whose canvas
  click hits a node with no point of its own runs the same command's Layers row door instead (annotated).
- duplicate (waited for context-menu: its scenario duplicate-from-the-menu opens it): each node of a copy gets a new
  id and the first free numbered name ("Intro 2" copies to "Intro 3"); several selected roots each copied after
  their original in one undo step, the copies selected (primary's first), status.duplicatedMany; the page root is
  refused. Not built: status.refused.singleChild, status.locked.edit, renaming HTML ids inside a copy.
- text-edit-inline: edited inside the iframe (spec: "Editing happens in the zoomed iframe"): the renderer marks the
  node contenteditable="plaintext-only" (editor-only), frame.tsx installs the keymap on the frame's window, aria-hidden
  comes off while editing; double-click comes from the dblclick event (Chrome's pointerdown count is 0); an outside
  press selects in the press's gesture and text.set runs right after it closes (text.set is per-dispatch), one undo
  step; a predicate may give its own refusal message among the command's declared ones; the edit ends when an
  undoable command runs (store followCommand) or the selection changes; "\n" is drawn as <br>. Integrated by the
  brief "a aplicação completa" before its first task, because its files were already staged in the main folder and
  discarding them was refused; the coordinator added the editing look the spec requires (Problems in Pager 2, DESIGN
  "Canvas", text): the outline and the label ("Editing text · Intro") in the text editing mode colour, with a browser
  test and its tooth proof. Ctrl+A while editing is text.selectAll's (select-container-children): it does nothing
  until that feature is built (finding 31).
- Playwright runs at most 3 workers (the machine froze with helpers in parallel at the default 12; the test Chrome
  already draws on the RTX 3060 through ANGLE D3D11, checked). Then (brief "a aplicação completa", bcd255e): the
  worker count comes from E2E_WORKERS, 4 when unset; a value that is not a whole number >= 1 fails the run.
- The feature table (brief "a aplicação completa", first task), in three steps because the door of File › Open,
  through which every scenario loads its fixture, belongs to project-open-json (not built: no confirmation, no
  archive; it depends on project-save-json): (1) src/app/features.ts registers the 17 passing features; the runner
  runs only registered features; the census fails a registered feature with no scenario, an unbuilt command or a
  scenario door that does not work; the status reporter fails the run when a registered feature fails; the Insert
  tiles follow the table (the 21 templates and the other entries of unregistered features are "not available yet");
  the inspector's selector bar names the selection. (2) project-save-json and project-open-json, built first as the
  dependency. (3) every door (drawn, shortcut, canvas gesture, context menu) enabled only when its feature is
  registered; parked on branch wip/feature-table until then.
- autosave-restore (first of the dependency chain of the feature table's step 3): one record (format version,
  document, selection) written at every committed change to a localStorage journal first (a synchronous write, so an
  immediate reload keeps the change even while IndexedDB is slow: tests/e2e/autosave.spec.ts holds IndexedDB busy)
  and then to IndexedDB `work`/`projects`/`current`; at start the newer of the two is restored through archive.ts's
  `readProject` (the one reader of a project document) before the editor is drawn; a record the model refuses is
  kept and never overwritten (autosave-corruption-recovery will offer the way out). The scenarios' new optional
  terminal persistence.selection was proven by switching the selection's saving off (6 of 6 failed on it).
- project-save-json: project.zip (own writer src/core/project/zip.ts: stored entries, CRC-32, UTF-8 names, the clock's
  time as the entries' DOS time in UTC) holding project.json = the document pretty-printed; a handler hands the file
  in its `change` outcome (`download`) and the store gives it to the download port (src/core/ports/download.ts; the
  browser's in src/editor/download.ts). The runner's export terminal reads the browser's real download with its own
  unzip (tools/runner/unzip.ts, checks sizes and CRC-32); proven by switching the delivery off (2 of 2 failed on "a
  file was downloaded") and by planting the selection in project.json (failed on its absent text).
- palette-drag-insert (helper, WIP branch finished and merged): a press on a tile below drag.threshold is a click
  (insert at the selection), past it a creation drag over the page only, inserted on release as one gesture; the drop
  label and the status bar name the element, the parent and the position; refused where the parent refuses; a ghost
  follows the pointer. It builds drag.cancel (Escape), which feature/drag-level-keys-escape builds too: whichever
  lands second reconciles. The tooth now also switches off the commands of a feature's scenario action doors
  (drag.cancel here), so a scenario acting through another command's door still fails. Runner paths proven off:
  the tile press (4 of 4 failed) and the held drag (the held scenario failed on the document).
- ui-language: Pager never calls setLocale (unreachable catalogue); ours switches from View › Language and the
  status bar, stored in the preferences. The runner now asserts the setup's language (the shell's
  documentElement.lang) and reads feedback in the language the scenario expects after its steps (the last step that
  chooses one): reading the page's current language instead left a scenario without a tooth (it passed with the
  handler off), so the expected language comes from the scenario's own data. A unit test proves both catalogues share
  keys and placeholders (planted "{nome}" failed it).
- hide-element (helper; the coordinator added the chrome part the helper could not touch): src/core/nodes/flags.ts
  owns the node flags (`hidden: true`, validated; a hidden page root refused, new refusal status.hide.root); the
  renderer marks a hidden node's element data-hidden (display: none !important, editor-only); a Layers row's Hide and
  Lock are transparent until the pointer is on the row (they stay reachable by keyboard); a hidden selected node is
  outlined dashed on its nearest shown ancestor with a "hidden" flag on its label. Not built: refusing to hide inside
  a locked ancestor (lock-element), the marquee skipping hidden nodes (finding 26), hidden nodes in the export.
- hand-keyboard-move (helper, WIP branch finished): src/core/structure/hand.ts; M takes the one selected element
  into the hand, the arrows aim among slots and levels (each aim checked by moveSelectionTo, now exported), Enter
  drops through element.moveTo (one undo step), Escape drops the hand; the aim is drawn with the drag's drop
  indicator and announced ("Hero will receive. Position 2 of 3. Level 1 of 2."); the hand ends on any edit, undo or
  new selection. The coordinator fixed one helper test that clicked the Layers eye with nothing selected (the eye
  needs a selection: element.toggleHidden's hasSelection). Runner path proven: a hand key takes its arguments from
  the aim, not from a control (7 of 10 failed with it off).
- The tooth proof prints why each test failed (the first line and the matcher) and counts a failure that only ran
  out of time on an action or a wait (`locator.click: Timeout 5000ms exceeded.`) as no tooth, like a test timeout: a
  tooth fails on an assertion (brief "a aplicação completa").
- lock-element (helper, worktree .cache/wt/lock-element): the Layers lock, Element actions and the context menu lock
  and unlock (status Locked/Unlocked; the page root refused); the lock holds the whole subtree (flags.ts lockOver,
  lockRefusal naming the outermost lock): delete, move up/down, promote, nest, drag, wrap, unwrap, duplicate, a
  palette insert into it, text editing (double-click, Enter, text.set) and the Hide/Lock of rows inside it are refused
  with "Unlock <name> before …"; Ctrl+A leaves locked siblings out. Two runner rules, each proven by switching it off
  (a scenario failed on an assertion): a refusal is checked right after its refused step (the action, else the last
  later step whose command declares the key; ported from the drag-level-keys-escape branch), and a canvas key whose
  step names an element, pressed while a Layers control holds the focus, first clicks that element on the canvas
  (allowed only when it is the selection alone). Browser tests with every lock check off: 7 of 10 failed; with the
  root check off, its test failed.
- page-properties and export-zip (group 06): spec and scenarios written by the coordinator from Pager's source and a
  run of Pager (Page properties only selects the root there; no control sets title, language or direction).
  Decisions: the settings are the page element's attributes (elements.json pageTitle, pageLanguage, pageDirection)
  written by page.setSetting from the Settings tab; a value that is not a language tag, or a direction other than
  ltr/rtl/auto, is refused with the new status.page.settingInvalid; the export is site.zip (index.html +
  css/styles.css), with lang/dir/title only from the settings (else no lang/dir and the page's name as title).
- inspector-panel (helper, group 04): Style/Settings/Interactions tabs, collapsed sections kept in the preferences
  with a summary on the header, the element's text in the Settings tab (Enter keeps it, Shift+Enter is the text
  area's own line break, Escape puts it back: text.cancelEdit, with no edit in place, answers with its message and
  the field shows the document's text again), Element actions › Lock and Hide. Contract committed first (46cb97f).
  Runner: inspector-field steps (click the editable element, Control+A, type), keys of the element-text-field
  context act on what the field holds, U+2028 in `type` presses Shift+Enter; each proven by switching it off (7,
  3 and 1 scenarios failed). Escape's field case off: its scenario and its browser test failed.
- elements-structure (group 07): spec and scenarios by the coordinator (no Card type; Navigation's layer name is
  its label; default styles only declarations that act, a Link Block display: block; the Settings tab's Link field
  refuses a scheme other than http/https/mailto/tel with status.url.unsafe; an interactive element inside a Link Block
  is refused with status.refused.interactiveInside naming it).
- rename-element (helper): F2, a double-click on a row's name, Arrange › Rename and the context menu start a rename
  in the node's Layers row (layers.startRename, ui.rename in src/editor/layers/rename.ts); Enter or leaving the field
  keeps it (element.rename, trimmed; empty keeps the old name with status.rename.empty); a locked element refuses.
  pointer.ts: a canvas press first blurs a focused editor field, so its text is kept before the press's selection.
  The page root is refused (status.rename.root): the version that let it be renamed came with an edit to the
  committed tests/e2e/context-menu.spec.ts and was undone on 2026-09-25 (see the entry above). Runner: a panel-control door with count 2 is double-clicked; a panel field is typed with Backspace, the
  step's text and Enter; a Layers row part with no argument of its own is the row of the step's target. Each proven
  by switching it off, as were leaveField and the lock refusal. Open: Escape does not cancel (finding 31).
- Coordinator's slip, noted so it does not happen again: the Pager preview server (pager-run) stayed open during
  four suites of this stretch (e2e at 06:15, 06:22, 06:28, the tooth at 06:31); every server is stopped first now.

## 2026-09-25 — Slice 1: the rest of the foundation and the first usable block of group 02

Why: the user's slice 1 brief. It finishes the two pieces part 2 left half done (the runner for everything group 02's scenarios use; pointer.ts with its gesture machines and the transaction the door opens) and delivers select-click, palette-click-insert with undo-redo, layers-tree and delete-element. The scenarios under `manifest/features/` are the contract and are not edited in this slice.

Item 1, wip/part2 into main:
- f889bc2 (`FEATURE_COMMANDS` in `src/generated/commands.ts`, written by `tools/gen/types.ts`) is on main. Decision (small ambiguity): `git merge --ff-only wip/part2` could not run, because wip/part2 starts at 941b099 and main has the handoff commit 1b30b9c on top ("Diverging branches can't be fast-forwarded"); the handoff above names the other way, a cherry-pick of f889bc2, which gives the same content. `npm run gen` rewrote nothing new. The branch is deleted locally and on origin.
- Open findings 2, 3, 4 and 8 are closed by the user's decision, each for the reason the auditor gave: 2, display `flow` and the justify-* keywords stay offered, because browsers act on them; 3 is stale, because workspace-doors.spec, history-doors.spec and the census cover the dock strip, Undo and Redo through their doors; 4 rested on the auditor's own wrong report on a92d782 (the Styles view draws its waiting doors, correction 15); 8, an unbuilt toggle keeps saying "false", because an unbuilt feature's state is off.
- The first `npm run e2e` of item 1 failed once on `open-project.spec.ts` "a Layers row draws its caret alone": the click on the File menu button waited 30 s for the button to be "stable" (12 workers on this machine, other tests slow too: smoke 15 s); the rerun passed 52 of 52. Recorded as open finding 12.
- Open finding 11 is tied to the features that touch it (below).

Item 2, the runner for everything group 02's scenarios use (`tools/runner/scenarios.ts`, `tests/e2e/door.ts`, `tools/runner/tooth.ts`):
- Setup through doors, in order: File › Open, the language, the selection clicked on the canvas (the first node with selection.select's canvas click, every other with selection.add's), the breakpoint tab, the style state item and the zoom item whose arguments set the setup's value. A feature is runnable only when the commands of its setup doors are built too, and a test names every door it runs (setup, steps, and Undo and Redo when the scenario has undo steps) for the census. Setup context "global": the runner asserts no control holds the focus; any other context fails with "no door brings the focus there yet" (group 02 uses only global, desktop, base and fit).
- Steps: a canvas click lands on a screen point that hits the node itself, not a child (the centre when it can, else the nearest point of a grid over its visible box; the page root wherever no element is), and on the canvas overlay; a click on the stage outside the page lands in the gap around the frame; a door's button, count and modifier come from its door data. A drag (canvas element, palette tile, Layers row, empty area) presses its source, passes drag.threshold and is released at the drop's point, computed from the zones of the drag specs (leaf halves; a container's edge bands, and "inside" at the slot of the step's index, never over a child; Layers rows by quarter), or held across the next steps until its release (a step of the same drag door with no target, drop or hold); a dwell door during a held drag rests on its row for the gesture's dwell constant; a marquee's mode takes the gesture's modifier. A shortcut that names what it acts on (the palette's Enter on a tile) first brings the focus onto that control with Tab. Typed characters go through the real keyboard. A drawn door stands for its item through `data-args` (DoorControl writes the context's arguments), and `runDoor` picks the control whose arguments hold the step's.
- The canvas: after the setup and after the steps, the page's elements must be the nodes of the document the port reads, in order; a node's element is awaited as an assertion ("the canvas draws /Page/Hero", 5 s). `npm run e2e:tooth` counts a test that times out as no tooth: a tooth fails on an assertion.
- Proof, raw in the slice's report: with the renderer made a no-op the canvas-page-iframe test fails on "after File › Open, the canvas draws the document the test port reads" listing each node not drawn; `npm run e2e:tooth -- canvas-page-iframe editor-shell` → 6 of 6 "failed", exit 0; with the previous runner put back, the same tooth run says "TIMED OUT (no tooth …)", "NO TOOTH", exit 1.
- The drag, dwell, marquee and typing paths run first with drag-reorder-canvas, layers-drag, marquee-select and text-edit-inline; this slice builds none of them, so their points are proven when those scenarios run. Open finding 1 (a path cannot name a page or tell same-named siblings apart) blocks no scenario of this slice.

Item 3, the rest of the foundation:
- `src/editor/input/pointer.ts`, the pointer owner: window listeners (capture) for pointerdown, move, up, cancel and the window's blur; a press on the canvas overlay is on the node under it (`nodeAt` of the coordinates module: the deepest element standing for a node, or the page root where no element is), a press on the stage (`data-canvas-stage`) is on the stage; anything else is not the canvas's. The gesture state machine `step` (idle → pressed → dragging → idle; drag.threshold from interactions.json; another pointer never joins; a cancel closes) is pure and unit-tested. The press's door is found by its data: the canvas-click door whose target takes the press ("element-or-page", "element", "stage-outside-page"; the other targets arrive with their features), whose button, count and modifier match. The owner opens `store.gesture()` at the press, runs the door through it, commits at the release, cancels on pointercancel or blur. While a gesture is open the keymap reads keys in the drag key context and runs them through the gesture (before, a key during a held press threw "a gesture is open"). The hovered node is published for the canvas chrome (select-click draws it).
- Lint rules (tools/lint/plugin.ts, with RuleTester cases): `builder/pointer-owner` (pointer, mouse, drag and drop listeners, on… properties and onPointer…/onMouse…/onDrag…/onDrop props anywhere but pointer.ts; onClick allowed), `builder/gesture-owner` (a `gesture()` call anywhere but pointer.ts and the store's tests), `builder/frame-owner` (only the renderer writes the canvas page: `contentDocument`, `contentWindow` and `frames` are reached only by frame.tsx and coordinates.ts, which write no DOM or stylesheet; no other module imports `elementAt` or `screenBox`, which hand out the page's elements; `nodeAt` and `nodeBox` give nodes and boxes). The frame rule is the "dependency rule" of the brief, written as a lint rule because a write to the iframe is a property reach, not an import.
- menu.tsx had the only pointer listeners outside the owner (a submenu's onMouseEnter/Leave, a document mousedown to close). Now a submenu is drawn with its menu and shown by CSS while the pointer is over its item, the focus is in it, or its item was clicked; an open menu closes when the focus leaves it (a press outside), and the menu takes the focus on a press on its own background (tabIndex -1), so it stays open. `tests/e2e/menus.spec.ts` pins both.
- Proof, raw in the report: each rule's planted violation (`src/editor/plant-pointer.tsx`, `src/core/history/plant-gesture.ts`, `src/editor/plant-frame.ts` plus a `setAttribute` in coordinates.ts) → `npm run verify:fast` exit 1 at lint with that rule's messages, then removed. Teeth: the keymap ignoring the open gesture → pointer.spec fails ("a gesture is open: dispatch through it"); the press opening no gesture → pointer.spec fails (the global key ran during the press); the menu's blur close off → menus.spec fails; the menu without tabIndex → fails; the submenu hover rule off → fails; the threshold off → pointer.test fails.

Item 3, continued: the user's BLOCKING on 8ad7262 and decision 1 (the menu's keys were not doors):
- menu.tsx handled the arrows, Escape and a press outside with listeners of its own, while the manifest declares them as doors of the "menu" key context (focus.next#key-arrow-down-in-menu, focus.previous#key-arrow-up-in-menu, focus.first#key-home-in-menu, focus.last#key-end-in-menu, focus.activate#key-enter-in-menu, ui.dismiss#key-escape-in-menu, ui.dismiss#overlay-backdrop, feature context-menu). They are built now: `src/editor/focus/focus.ts` (the handler records the request in `ui.focus`; the owner's installer moves the DOM focus among the items of the region that names the focused key context, or runs the focused item) and `src/editor/menus/overlays.ts` (`ui.dismiss` counts dismissals in `ui.overlays`; an open menu closes when a dismissal newer than its opening arrives). menu.tsx has no key or pointer listener: the keymap runs its keys, and an open menu draws the backdrop door under itself (DoorControl's `area` drawing: no text, named by its label, out of the Tab order). What changed for a person: a press outside an open menu now lands on the backdrop (it closes the menu and does nothing else), the arrows wrap, Home and End work, and after Escape the focus is no longer put back on the menu's button (it rests on the page body).
- The user's decision on the other doors of these commands (toolbar, tab strip, palette, Layers tree, command bar, dialog): "a shortcut follows its feature". A shortcut runs when its command is built and its door's feature is the one that introduces the command or already has all its commands built (FEATURE_COMMANDS); drawn doors keep their rule. `src/editor/input/shortcut-rule.ts` is the rule, pure; the keymap, the door census and the scenario runner import it (no copy). DESIGN.md "Build order" and the keymap's line in ARCHITECTURE.md say so. A bound chord stays reserved (its default prevented) while its door waits, as DESIGN.md "Keyboard model" already said of unbuilt commands.
- The census explores only the doors a state's screen draws and menu items: a door drawn only while a menu is open and not an item of it (the backdrop) closes the menu back to the same state, so running it from the fresh profile would wait for a control that is not there (the first census run timed out on it after 240 s). It is still counted as drawn and enabled, and `menus.spec.ts` runs it.
- Proof, raw in the report: `menus.spec.ts` has a test per door (ArrowDown wraps, ArrowUp wraps, End and Home, Enter runs View › Inspector, Escape closes, a press outside lands on the backdrop; a press on the menu's own background keeps it open; the submenu hover); with each of the six commands made a no-op by the tooth plugin its door's test fails and the others pass; the planted violation (focus.next's keyboard-panel-navigation shortcuts running in shortcut-rule.ts) → the census fails on the six toolbar, tab strip and palette arrows "usable, and no browser test runs it"; `shortcut-rule.test.ts` pins the rule on the manifest's data.

Item 3, two more lint rules (user order): `builder/keyboard-owner` (key listeners and onKey… props only in the keymap) and `builder/no-manifest-id` (no CommandId, DoorId or PropertyId literal outside src/generated/, src/manifest/, the command table, a handler's or predicate's registered id, a type, and tests). The 24 places it found now read the fact from the manifest: whether a door stands for the current state is the `current` its command's owner registers beside the handler (registry.ts); the page tab and the class chip's × are an item and the icon button drawn inside it (placement.ts `partOf`); the Canvas tools toggle is the door that opens their panel; the dock's close is the door whose arguments close; the breadcrumb is the status bar's item; the Layers row is the layers-row-click door with no modifier; the element tile is the item whose command takes a palette entry; the box model's sides are named logically (block-start…); in the top bar the page switcher is drawn as `item`, the search as `field`, Export as the new drawnAs `primary`, and the separators come from the region's new `breaks` in layout.json (schema, consumers.json, DESIGN.md). Decision (small ambiguity): type positions and src/manifest/ are exempt, because a type is checked by TypeScript against the generated lists and decides nothing at runtime, and the manifest's own checker names its grammar. Proof: plants fail verify:fast at lint (.cache/logs/plant-keyboard-owner-003458.log, plant-no-manifest-id-003512.log); setTheme's `current` removed → door-state.spec fails (tooth-current-settheme-003538.log).

The user's decision 2 on the runner (2026-09-25): the runner's paths committed in item 2 without a test of their own (the setup selection clicked on the canvas, the drag, the held drag, the dwell on a target, the marquee and the typing) are accepted for now on this condition: the first feature that uses each path proves it by switching that step off in the runner and showing that its scenarios fail. Reason: a runner step that does nothing would let a scenario of the kind "refused, document unchanged" pass alone.

Open finding 11, tied: each part is fixed before that feature is built: a `}` in a style value before the first feature that edits a style through the inspector (inspector-number-fields, group 04, the first with `style.set`); a link's `newTab` rendered as `target="_blank"` with `rel="noopener"` before the first link feature (elements-structure, group 07, the first with `element.setLink`); a line break inside `textarea` and `option` before the first form feature (elements-form-structure, group 07).

## 2026-09-25 — Handoff: end of the builder/auditor run, one conversation per slice from here

Why: the user ended the two-session method (builder plus continuous auditor) because it was too slow. From now on each slice of work is one conversation; the protections stay in the repository (manifest:check, gen:check, lint, the door census, the scenario runner, the tooth proof) and in CLAUDE.md, which no longer mentions the auditor.

Committed on main (all pushed):
- Foundation part 2, 715c1af: the canvas iframe and renderer, coordinates under CSS zoom (25 to 400), File › Open (`project.open`), the read-only test port, the scenario runner (`tools/runner/`, `npm run e2e:tooth`). Group 01 passes through the runner, with teeth. See entry 16 below.
- 941b099: the user's decision on Open finding 10 (View › Timeline shows a folded dock's panel first, takes the tab out only while it shows). Done; nothing pending from it.
- Not built from part 2: c and d, the pointer owner (`src/editor/input/pointer.ts`, still "planned" in ARCHITECTURE.md) with its gesture state machines, and the undo transaction a door opens per gesture. Decision recorded in entry 16: they come with group 02's first gesture features.

On branch `wip/part2` (f889bc2, pushed, one "WIP:" commit on top of 941b099):
- `tools/gen/types.ts` writes `FEATURE_COMMANDS` (the commands each feature lists) into `src/generated/commands.ts`. Nothing uses it yet. It was meant for the Insert tiles: a palette entry names its own feature, so a tile would be enabled only when its entry is an `element` kind and every command of its feature is built.
- To resume: `git checkout main && git merge --ff-only wip/part2` (or cherry-pick f889bc2), run `npm run gen` and stage `src/generated/commands.ts` before `npm run verify:fast` (gen:check compares with the index).

Where group 02 stands (nothing of it is built):
- The first feature in file order is palette-click-insert, but 4 of its 5 scenarios start with a selection (`setup.selection`, for example `/Page/Hero/Actions`). The test port never writes, so the runner can only set that selection through a door of `selection.select`, and the one that fits is the canvas click of select-click, which needs `pointer.ts`. Planned order: select-click first (`selection.select`, `selection.clear`, `pointer.ts`, the runner's setup selection through the canvas click), then palette-click-insert. Building `selection.select` and `selection.clear` enables all of their doors (Layers row, breadcrumb, Edit › Clear selection, Escape, …), and the census then requires a browser test for each door it finds enabled.
- palette-click-insert, planned: `src/core/structure/insert.ts` (the handler: nothing selected → last child of the root; an unlocked container → its last child; a leaf → right after it; `parent`/`index` arguments override; names unique across the page; default text and names in the UI language; selection = the new node; message `status.placed`), an owner module for the HTML content model built from `manifest/generated/html-elements.json`, giving refusals such as `status.refused.onlyAccepts` (check.ts should reuse it), the tile's arguments on the door (`data-args`) so the palette's Enter and Space act on the focused tile.
- The runner (`tools/runner/scenarios.ts`) still throws on a setup with a selection, a context other than global, a breakpoint other than desktop, a state other than base, a zoom other than fit, and on steps with target, drop or hold. Extend it as each feature needs.

Open findings at the handoff: the list below. For 2, 3, 4 and 8 the auditor's last view (not a user decision) was to close them: 2, keep display flow and the justify-* keywords offered, because browsers act on them; 3 is stale, since workspace-doors.spec and history-doors.spec plus the census now cover it; 4 rested on the auditor's own wrong a92d782 report; 8, keep "false" on unbuilt toggles, because an unbuilt feature's state is off. No BLOCKING was open when the run ended; the auditor had not yet answered on 715c1af and 941b099.

## 2026-09-24 — Run: scenario contract, visual pass, foundation part 2, group 02

Why: part 1 is verified by the auditor at 380745b. This run goes by checkpoints in one session: each step committed, pushed and reviewed as it lands. The auditor writes the scenarios and fixtures of groups 01 and 02 under `manifest/features/` in the same folder and branch; the builder never edits them and commits only its own files with `git commit --only`.

Done:
0. The scenario contract (schema, manifest:check, loader, tests and plants; the auditor writes the data):
   - Fixtures are data: `manifest/features/fixtures/<id>.json`, each a project document of `src/core/document/model.ts`. The loader reads them with the manifest; rule `fixture` validates each with `validateDocument` and fails on a `setup.fixture` without a file. `empty` is a fresh profile's empty project, built with the names of the scenario's locale (Home/Page, Início/Página), and has no file. A fixture reaches the app only through File › Open (`project.open`, built in part 2 as runner infrastructure).
   - Steps: a scenario has `steps` (door, args, target, drop, action), run in order after the fixture loads; exactly one is the action step, and `doors` lists the alternative doors for it, each a door of the action step's command (rule `step`, which also checks every argument against the command's declared arguments: palette entries, enum values, node paths, properties…). Door references in steps are checked like the scenario's doors (rule `door-unknown-command`). Rule `door-coverage`: once a feature has scenarios, every door whose feature it is runs in one of them.
   - Paths: `src/manifest/scenario.ts` owns the grammar. A node path is the node names from the fixture's root (`/Page/Section`), each naming exactly one node; a field follows `/@` (`/Page/Section/@styles/desktop/base/padding-top`). A node value in `expect.document` omits id and its children array gives their order; a new node appears through its parent's value or `@children`. Rule `document-path` resolves setup paths in the fixture, applies the diff (refusing a node value with an id, an unknown field, a removed root, a key that is not there), validates the result against the model, resolves every expectation after the diff and every step path in the fixture or the result.
   - Editor terminals: `expect.editor` (regions of layout.json measured alone or against another region, and computed styles of regions) and `expect.persistence.preferences` beside `document`; rule `scenario-terminal` counts both; unknown regions fail `unknown-reference`.
   - Tooth proof without commands: optional `toothProof` on a feature names the module the tooth proof replaces with a no-op; rule `tooth-proof` requires it of a feature with scenarios and no commands, refuses it on a feature with commands, and requires the module to be one ARCHITECTURE.md names.
   - `status.placed` ("Placed {element} in {parent}, position {position} of {count}." / "{element} colocado em {parent}, posição {position} de {count}.") is in both catalogues.
   - Plants (each fails on its own rule only): `fixture-file-missing`, `fixture-breaks-model`, `setup-path-not-in-fixture`, `expect-path-removed-by-diff`, `diff-path-unresolved`, `diff-node-value-with-id`, `step-target-unresolved`, `step-argument-unknown`, `two-action-steps`, `door-in-no-scenario`, `editor-terminal-without-measure`, `persistence-of-nothing`, `editor-region-unknown`, `tooth-proof-without-module`, `tooth-proof-module-unknown`; the older scenario plants now build on two planted delete-element scenarios that together run all three of its doors. Positive tests: an editor-only and a preferences-only terminal pass; the empty project resolves `/Página` in pt-BR and `/Page` in English; a step inserting the palette entry `heading` into `/Page/Section` passes and one naming `banner` fails.

   - Follow-up (the auditor's findings on c703a3b, with the user's decisions it relayed; one commit before item 1 continued): steps gain `hold` (a drag held across the next steps, ended by a release on the same drag door with target null, drop null and hold false, or by drag.cancel) and `type` (characters typed with the real keyboard after the step's door; "
" is Enter), both optional so the committed scenarios stay valid (absent is false / null). Rule `step` now also fails on a hold never released or cancelled, a release with no held drag, a hold on a door that is not a drag, a rect or point argument written in a step (the gesture produces it), and a required argument the door does not fix and the step leaves out (a release is exempt: its held step gave them). The geometry comparison is documented: measure(x) against measure(reference) + value, or value alone. The path grammar also names `@locked`, `@hidden` and `@inline` (the node fields of lock, hide and inline formatting, which model.ts and validate.ts accept when group 02 builds them). 27 status messages the group 02 scenarios expect are in both catalogues. Plants: `hold-never-released`, `release-without-hold`, `hold-on-a-key`, `typed-text-not-text` (schema), `required-argument-missing`, `gesture-argument-given`.

1. The visual pass (first step: the look; the exclusion list follows as its own step):
   - `design/final/` first. `tokens.json`: direction C's palette in both themes (teal accent, C's surfaces, text and origin colours), C's radii (2, 3, 4, 6), Cascadia Code first in the code font, and the new `status-bar` / `on-status-bar` pair. `tools/gen/tokens.ts` now fails `npm run gen` when an on-colour reads below 4.5:1 on its colour or a text colour on the surfaces (planted light on-status-bar #33998c: "on-status-bar on status-bar: 1.42:1", exit 1). `index.html`: dark by default, the coloured status bar, C's compact upper-case section heads and one-row property rows with A's controls in the value column, the code font for values, class chips, tags and canvas label details, and the element count's plural key. `design:shots` draws every state dark and the default state also light and in pt-BR in both themes (17 screenshots, 0 findings); the old `1440-01-default-dark.png` is gone (dark is the default).
   - DESIGN.md: the intro (C's look on A's structure, Canvas the default view), Sources, Theme (a fresh profile opens in Dark, `theme.default` in environment.json; Light, Dark, System), Build order (Pages and Files drawn from the start, their doors disabled; Open finding 23 of part 1 decided), Face text, the coloured status bar, Density and tokens (radii, code font list, contrast rule, IDE-compact rows).
   - Manifest: `theme.default` "dark" in environment.json beside the default locale, checked against preferences.setTheme's values (plant `default-theme-unknown`); every door has `faceLabelKey` (null, or the shorter text its drawing shows: "+ Class" for Apply a class, "Add" for Add an interaction; Open finding 29 of part 1).
   - Shell: preferences start from the manifest's default theme; `DoorControl` draws a door's face text and keeps its label as the accessible name; `shell.css` has C's look (coloured status bar from its tokens, one-row section titles and inspector rows, upper-case section heads, the code font for values); the inspector's sections sit in one column without gaps.
   - e2e: a fresh profile opens in Dark while the system asks for light; View › Theme › Light repaints and survives an immediate reload (storage); System then follows the system in both directions.

   - The exclusion list (second step): `manifest/css-exclusions.json` is generator input: each entry names the property, the keyword and its evidence (kind spec, bcd or chrome; source; note). `npm run gen` marks each one unsupported in all three browsers with the evidence as the reason, so it leaves every generated list (401 keywords left out instead of 395: text-decoration is not an edited property). The seven entries are the certain ones: break-before and break-after `region` and `avoid-region`, break-inside `avoid-region` (CSS Regions, which no current browser implements), and `blink` for text-decoration and text-decoration-line (parsed, never blinks). Rule `exclusion` fails on an entry without evidence, on a keyword its property does not have or css-compat.json still supports (run gen), and on any declared list (presets, Essentials only, a quick panel list) that offers an excluded keyword; `browser-support` leaves those to it. Plants `exclusion-without-evidence` and `excluded-value-offered`. The summary prints the list.

Corrections after the user's review (rules since: a tooth proof before every commit, the installed Chrome is the truth, raw complete output, the brief followed exactly):
1. The face text of doors had no test that failed when it was turned off (2fc025f). `tests/e2e/doors.spec.ts` reads every door with a faceLabelKey from the manifest and, in the installed Chrome, checks each one the shell draws shows its face text and keeps its label as its accessible name, in English and in pt-BR; it requires Apply a class to be drawn. Tooth proof: face = label in door.tsx → fails ("unexpected value \"Apply a class\""); faceLabelKey null in the manifest → fails (no door checked); no aria-label when the face differs → fails (accessible name "+ Class"); restored → passes.

2. Every offered value is checked in the installed Chrome (454c764 trusted the compatibility data only, and the auditor found three offered keywords Chrome's parser refuses). `tests/e2e/css-support.spec.ts` collects every keyword, value and unit any door offers (the generated lists from `src/generated/value-lists.ts`, the presets, Essentials only and quick panel lists) and asks Chrome's `CSS.supports` for each, a value through any property it is written to (a recipe's declarations), a unit in its first accepted form (`1u`, `1u 1u`, …). It found four: `break-before: all`, `break-after: all`, `display: run-in` and the unit `%` in `columns` (a column width takes no percentage; `columns: 10em` is accepted). They joined `manifest/css-exclusions.json` with evidence kind chrome (Chrome 153.0.8010.54). An exclusion now names a keyword or a unit (rule exclusion checks exactly one); an excluded unit leaves the list through `generatedUnits`, and a declared list offering it fails (plant `excluded-unit-offered`). Now 2,230 values and 3,044 units of 149 properties pass in Chrome. Tooth proofs: `display: run-in` taken out of the list → the test fails with it; the `columns` unit taken out → fails with "columns: the unit %"; the unit filter of `generatedUnits` turned off → fails the same; restored → passes. DESIGN.md says the browser is the truth for every offered value.

3. The user's decisions on the auditor's report (after 0ca4bb8). Decision 1 (display run-in, break-before all, break-after all excluded with Chrome evidence) was already in 0ca4bb8; Open finding 2 now lists only keywords the generated lists offer (4bbdec3). Decision 2: a door whose only effect is to open a panel without its content is disabled with "not available yet" (Help › Keyboard shortcuts, View › Timeline, Checks and Variables, the activity bar's Styles); the doors of the panels that exist stay enabled. `PANEL_CONTENT` in `src/editor/workspace/panels.ts` names each panel's content or NOT_AVAILABLE_YET; `useDoor` treats a door opening an empty panel as not built; the dock body and the Styles view say "not available yet" (the auditor's BLOCKING 2 on a92d782). `tests/e2e/panels.spec.ts` checks in Chrome that those five doors are disabled with "not available yet" and change nothing when clicked, and that the doors of the existing panels are enabled. Tooth proof: timeline marked built → fails on View › Timeline; variables marked built → fails on View › Variables; the check removed from useDoor → fails; the inspector marked empty → the second test fails; restored → passes.
   Decision 3: `setup.zoom` is "fit" (the canvas as it opens, the frame fitted to the stage) or a canvas zoom level of `environment.zoomLevels`, now [25, 50, 100, 200, 400]; a number is allowed only once zoom-keyboard-buttons is built (every command of it registered: rule `zoom`, plant `zoom-before-zoom-doors`), and 100 stays accepted for one commit while the auditor moves the scenarios to "fit"; the planted scenarios use "fit". Tooth proof: rule zoom silenced → the plant passes (exit 0) and its test fails; zoomBuilt forced false → the test "once built" fails; restored → passes. The auditor moved all 132 scenarios to "fit" (6f58f23); the transitional 100 is gone, so no level passes before the zoom doors exist. Tooth proof: the new assertion (a scenario at 100 is reported) failed while 100 was still let through; it passes without it.
4. The auditor's BLOCKING on e8cb83f: `PANEL_CONTENT` was a status of each panel written by hand. It is gone. Whether a panel has its content now follows from the code that draws it (`src/editor/shell/bodies.ts`): a sidebar view has a body when `SIDEBAR_VIEWS` (sidebar.tsx) holds one, a dock tab when `DOCK_TABS` (dock.tsx) does, a section when its view does, and the inspector column, the canvas tools and the workbench are the shell's own frame; the shell draws the bodies from those tables and hands the answer to every door (`PanelBodies`). The command table alone cannot say it: Help › Keyboard shortcuts runs `workspace.setPanelOpen`, which is built, while its panel has no body. The Styles view and the Timeline and Checks bodies, which drew only headings, disabled doors and a "No issues" that no check had found, are gone until their features; a view or tab without a body says "not available yet". Tooth proof on `tests/e2e/panels.spec.ts`: a body given to Timeline, a body given to Variables, Insert's body removed, sections no longer following their view, the frame panels reported without body, the check bypassed in useDoor, the shell's answer replaced by "none" → each fails; restored → passes.
5. The auditor's BLOCKING 1 on effd579 and the user's decision 4: every door of a built command that the shell draws enabled is run in Chrome by a test that fails when its command does nothing. `tests/e2e/door.ts` runs a door as a user does (a shortcut by its chord, a menu item from its menu or submenu, any other control by a click on its `data-door`) and names the doors a test runs as annotations `door` (`runs(...)`), which the census will read. `tests/e2e/workspace-doors.spec.ts` runs View › Elements, Layers, Inspector, Explorer and Canvas tools, the activity bar's Explorer and Insert, the canvas toolbar's Canvas tools, the Layers title's toggle, the dock strip's close, show/hide and maximise (`workspace.setWorkbenchState`, decision 4), View › Toggle sidebar and Collapse docks, Language › English and View › Theme › Dark, each asserting the regions' geometry, a computed style or the stored preferences after a reload; `shell.spec.ts` runs its doors through `runDoor` and names them. Tooth proof, each handler made a no-op in turn: setPanelOpen → its 11 door tests fail; toggleLeftDock → 2; toggleInspector → 2; collapseDocks → 2; setWorkbenchState → the 2 strip tests; setLanguage → 3 (and with only English off, the English test); setTheme → 2 (and with only Dark off, the Dark test); restored → passes. Undo and Redo stay without a Chrome test until a group 02 command changes the document.
6. The auditor's BLOCKING on f1c41fc and BLOCKING 2 on effd579: no door of a command that is not built may stand for the current state. The dock drew the active tab (`workspace.setActiveTab`, not built) with its own `is-active` class, and the Explorer drew the first page's row as active (`pages.switch`, not built); both looks now come only from the door's own current state (`is-current`, set by useDoor from current.ts for built commands; the page row follows its door with `:has`). `tests/e2e/current-state.spec.ts` reads every drawn door of an unbuilt command in Chrome: none says pressed, selected or checked; doors of one command drawn side by side in one place and of one shape look alike (computed colours, weight, shadow, borders); a sidebar row that holds such a door looks like an unselected row; and no item of an unbuilt command is checked in any menu or submenu. Tooth proof: the dock tab marked current → the look check fails; the page row's door marked current → the row check fails; View's editor view made current in current.ts with `built &&` removed from useDoor (the auditor's reproduction) → the ARIA check fails; the same with every menu item checkable → the menu test fails; restored → passes.
7. The auditor's BLOCKING 1 on b1fe2ec: the dock strip's close test only saw the tab strip get narrower, so it stayed green when the close button closed the other tab. The dock body is now the tab's panel, named after its tab (`role="tabpanel"`, `aria-label`), and the test opens the workbench, then pins the tabs in order and the panel shown after each close (Timeline, Checks → Checks → none), and that the workbench is hidden after the last one: with no tab left a shown and a hidden workbench take the same room, so the strip's show/hide toggle (a built command's current state) says which. Tooth proof: the close door closing the other tab (the auditor's mutation) → fails on the tabs; the closed tab left as the one shown → fails on the panel; the workbench left shown after the last close → fails on the toggle; the panel unnamed → fails; restored → passes.
8. The auditor's BLOCKING on c30a87a: the file tab drew the open page's tab current with its own `is-current` wrapper around `pages.switch#file-tab` (not built), and current-state.spec.ts compared only door elements and sidebar rows. The file tab now follows its door (`.file-tab:has(> .door.is-current)`), and the test takes every state marker (is-current, is-active, is-selected, ARIA pressed/selected/checked "true") off the whole page with transitions off, compares every element's computed look, and requires each element whose look changed to be, hold or sit inside a built door, or to inherit its look from such an element. Tooth proof: the file tab's old wrapper class and rule put back → the new check fails on `div.file-tab`; the page row's old wrapper class and rule put back → the row check fails; restored → passes.
9. The auditor's BLOCKING 3 on effd579: door.tsx `isToggle` named `workspace.setPanelOpen` and `workspace.setWorkbenchState` to decide which icon buttons say pressed, and menu.tsx did the same for the Theme and Language items. It is door data now: toolbar and panel-control doors have `pressed` (a toggle button: 18 doors, the icon buttons and buttons whose arguments toggle or whose command is a `toggle…` one; every other one false), menu doors have `checked` (`radio`: Theme, Language, the zoom levels, the style states, snap on/off, 19 doors; `checkbox`: the 4 Layers row details; null: 57 command items). 255 entries written with JSON.parse by field name (git diff --stat: 255 insertions, 0 deletions). The close buttons of the dock and panel headers, which isToggle made say "pressed false", now say nothing. `tests/e2e/door-state.spec.ts`: the built toggle buttons say pressed by their panel's state, a close button says nothing; Theme and Language items are radios saying which is chosen, the zoom levels are radios, a command item is a plain item. Tooth proof: Insert's `pressed` false in the data → fails; Dark's `checked` null → fails; the old isToggle back → fails on the close button; the old menu rule back → fails on the zoom level; restored → passes.
10. The auditor's BLOCKING 4 on effd579: inspector.tsx decided with a regex on a control id (add, remove, reset, reverse, distribute) that an inspector field is a button. Inspector-field doors now have `drawnAs` like toolbar and panel controls: `button` for the 14 editors' actions and the 2 fixed-value buttons (Stretch, Spread), `field` for the other 237; 253 entries written with JSON.parse by field name (git diff --stat: 253 insertions), authored once with the old rule. `tests/e2e/inspector-fields.spec.ts` checks in Chrome that every inspector field on screen is a button exactly when its door says so. Tooth proof: inspector.tsx ignoring drawnAs → fails on the 16 buttons; the old regex back with gradient-type's data saying button → fails on gradient-type; restored → passes.
11. The auditor's BLOCKING 1 on 65cc75a: 65cc75a gave the 10 on/off switches (drawn as `toggle`: the table caption, head and foot parts, and the Guides & Grids switches) `pressed: false`, so they would never say whether they are on, and grid.toggleColumns, Rows and Dots said pressed on the canvas tools but not in Guides & Grids. The 10 now say `pressed: true` (JSON.parse by field name; git diff --stat: 10 insertions, 10 deletions). New manifest:check rule `pressed` (the auditor's NOTE 1): a switch says pressed; only a switch, an icon button or a button says it; doors of one command with the same arguments agree. It reported exactly those 13 problems on the data before the fix. Plants `switch-not-pressed`, `pressed-on-a-tab`, `pressed-disagrees`, each failing on its rule only; with the rule silenced the three plant tests fail. With it, the auditor's NOTE 2 on 46c8805: an inspector field's `drawnAs` is only `field` or `button` (plant `inspector-field-drawn-as-tab`, rule schema; with the whole enum back the plant passes and its test fails).
12. The auditor's BLOCKING 5 on effd579: inspector.tsx's BoxModel named margin-top … padding-left and the composites margin and padding to place its fields. It now reads the composites drawn as a box model (properties.json control `box-model`), nests their boxes in the placement order of their doors (the first outermost: margin 61, padding 62), and puts each side's field by its property's index in the composite's `longhands` (the shorthand's order: top, right, bottom, left); no property is named in the code. `tests/e2e/box-model.spec.ts` checks the geometry in Chrome from the same data: each box lies inside the one before it, and each side's field sits between its box's edge and the box inside it, on its side. Tooth proof: the sides' order swapped in the code → fails on margin-right; the nesting reversed → fails on the boxes; restored → passes.
13. The user's decision 5, the census, with the user's answer on Undo and Redo. `tests/e2e/census.spec.ts` reads the built commands (the registered handlers of references.json), the doors every browser test names (annotations `door` and `door-unavailable`, from Playwright's own `--list --reporter=json` of the suite, which starts no server) and the editor in Chrome with every menu and submenu opened (337 doors drawn, 21 enabled). It fails when a door is drawn enabled without a built command, when a built command has no test that runs one of its doors, and when a door a user can run (drawn enabled, or a shortcut) is run by no test. The user's answer: while the manifest has no built undoable command, a built command none of whose drawn doors is enabled (Undo and Redo: nothing to undo) is proven by a test that runs each of its doors and shows it cannot run yet; from the first undoable command on it needs tests of its own. `tests/e2e/history-doors.spec.ts` is that test: every drawn Undo and Redo door is disabled with "Nothing to undo." or "Nothing to redo." and a click changes no region nor the stored preferences; Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y put the reason in the status bar and change nothing. Proof as the user asked: a command planted with a real handler and no test (view.toggleOutlines registered, its canvas-tools door drawn enabled) → the census fails on the command and on its door; the plant removed → passes. Tooth proof: an unbuilt door drawn enabled → fails; an undoable command marked built → Undo and Redo lose their exception and fail with it; Ctrl+Y left out of the Undo/Redo test → fails; `canUndo` holding always → the Undo/Redo test fails; restored → passes.
14. The auditor's BLOCKING on 7cb737c (and the user's order): the census read only the start screen and the menus, so 74 Insert tiles enabled without a command passed. It now visits every state a built door leads to: from a fresh profile it runs each door of a built command that is drawn enabled, and each shortcut of one, once, from the first state it was seen in, and reads the screen and every menu and submenu in each state reached (28 states, 343 doors); a menu button that a state hides is skipped. Proof the user asked for: an Insert tile enabled on purpose without a command (`element.insert#elements-tile` treated as built in useDoor) → the census fails on it; restored → passes. Tooth: the exploration switched off → fails (1 state visited, more than 20 expected).
15. The user's correction of decision 2 (the report it rested on was wrong): the Timeline tab and the Styles view are drawn again, from the manifest's regions dock-timeline (18 doors) and styles (New variable, `tokens.create#variables-add`), every door disabled with "not available yet", so the doors of future features wait where the user can see them; View › Timeline, View › Variables and the activity bar's Styles are enabled again (their panels have a body). Checks keeps no body (no check exists) and View › Checks stays disabled, as does Help › Keyboard shortcuts. `tests/e2e/panels.spec.ts` follows the corrected decision (only Checks and Keyboard shortcuts are empty); new `tests/e2e/waiting-panels.spec.ts` opens Timeline and Styles through their doors and finds the 19 doors disabled with the reason, and finds View › Checks and Help › Keyboard shortcuts disabled. Tooth proof: the Timeline body removed → fails; the Styles view removed → both Styles tests fail; restored → passes.
16. Item 2, foundation part 2 (the user's pacing order: two helper agents in parallel, the coordinates module and the renderer; the rest by the builder):
   - a. The canvas iframe (`src/editor/canvas/frame.tsx`): same-origin, srcdoc, sandboxed without scripts, no event handler, `pointer-events: none`, an overlay above it; the renderer mounts the document once and applies each change the store publishes (`subscribeDocument`, with the transaction's patches, an undo's inverses, a cancelled gesture's inverses, a loaded project's pages). The renderer (`src/core/render/render.ts`, helper): patches touch only their elements, the others stay the same objects (15 unit tests in happy-dom, `tests/e2e/render.spec.ts` in Chrome at two breakpoints). The helper also fixed the draft: a tag change lost its children across windows, a replaced subtree reused stale elements, page-level patches rebuilt the page, stale style elements after StrictMode's second mount, `on…` attributes are never written.
   - b. Coordinates (`src/editor/canvas/coordinates.ts`, helper): the zoom is the frame's `currentCSSZoom` (Chrome rounds offsetWidth), the page origin includes the frame's border and padding; `tests/e2e/coordinates.spec.ts` clicks page points with the real mouse at every level of environment.zoomLevels (25 to 400), with the page scrolled, and checks screenBox against the painted pixels.
   - e. The read-only test port (`src/editor/test-port.ts`), installed in development: its members are exactly four readers, frozen and fixed on window; a read is a copy; calling its members with arguments changes nothing (`tests/e2e/test-port.spec.ts`).
   - f. File › Open (`project.open`, `src/core/project/archive.ts`): the door asks the browser's file chooser for the command's required `file` argument; the document is replaced (selection and history empty); a file that is not a project document or of a newer version is refused with the reason and the canvas keeps what it had (`tests/e2e/open-project.spec.ts`, also: a click on the page lands on the overlay, and a Layers caret is drawn alone, named by its label).
   - g. The runner (`tools/runner/scenarios.ts`, `tests/e2e/scenarios.spec.ts`): one test per scenario and door of every feature whose commands and scenario doors are built; group 01 passes (editor-shell 3 of 3, canvas-page-iframe 3 of 3). `status.ts` prints each feature's derived status and whether the tree is clean; `npm run e2e:tooth` reruns each feature with its handlers, or its `toothProof` module, switched off by the Vite plugin `tooth-plugin.ts` and requires every test to fail (both group 01 features have teeth). Message texts are read from the app's own i18n runtime in the page.
   - Decision (small ambiguity, for review): c and d, the pointer owner with its gesture state machines and the transaction the door opens per gesture, are built with the first gesture features of group 02 (select-click, the drags), because no built command takes a pointer gesture before them, so nothing could prove them in Chrome now; group 01's scenarios use no pointer gesture.
   - Tooth proof: File › Open's handler a no-op → the 4 open-project tests fail; the door without the file chooser → they fail; the store not telling the document's listeners → the render and overlay tests fail; the frame without its overlay → the overlay test fails (the hit falls through the iframe to the frame view); the caret drawn with its label → the caret test fails; a writing member added to the port → its shape test fails; document() reading the editor state → its read test fails; the renderer and coordinates teeth are in the helpers' reports; the runner's own tooth proof on group 01.
17. The user's decision on Open finding 10: a View item that toggles a dock panel shows it when it is not showing and takes its tab out only while it shows. `isPanelOpen` counts a dock panel as open only when its tab is the active one of a dock that is not folded, so from a fresh profile View › Timeline opens the dock on Timeline, and a second click takes the tab out and shows the next one; the same for every dock panel. `waiting-panels.spec.ts` now pins that through View › Timeline; the unit test of the first start reads a dock panel's layout `open` as "a tab at the first start". Tooth proof: the old rule (a tab counts as open) back → the Timeline test fails on the first click; restored → passes.

Open findings (recorded, not acted on) — added:
16. (user, independent check of 8ad7262) The playwright.config.ts `testIgnore` '**/.cache/**' makes the e2e find no test at all when the repository sits in a path that contains `.cache`.
15. (user, independent check of 8ad7262) shell.tsx:41 keeps the fit zoom in useState; it moves to the store when the zoom commands exist.
14. (user, independent check of 8ad7262) sidebar.tsx:80, 94 and 98 write the argument name "target", which the manifest gives in the door's adapter.selection, and build data-args apart from DoorControl.
13. (user, independent check of 8ad7262) In Insert, the density labels overflow and overlap ("Two columns": a 69 px text in a 50 px button, overflow visible).
12. (builder, slice 1 item 1) One e2e run timed out on the File menu button's click in `open-project.spec.ts` (Playwright waited for "visible, enabled and stable" for 30 s) while the machine was loaded; the rerun passed. Watch for it; if it comes back, find what keeps the button from being stable.
11. (renderer helper) A link's `newTab: true` renders as `target=""`, not `target="_blank"`: the manifest has no value for it. A text with a line break inside a `textarea` or `option` gets a `<br>`, which those elements cannot show. A style value containing `}` could break out of its node's rules; only the value checks on style values stop that. Tied by the user (slice 1): the `}` before inspector-number-fields, `target="_blank"` with `rel="noopener"` before elements-structure, the line break in textarea and option before elements-form-structure.
10. (builder, decision 2 corrected) View › Timeline took a folded dock's Timeline tab out on the first click. Closed by the user's decision (correction 17).

Open findings (recorded, not acted on):
8. Closed by the user (slice 1): an unbuilt toggle keeps "false", because an unbuilt feature's state is off. (auditor, 65cc75a, NOTE 2) A toggle button or a radio item of a command that is not built says aria-pressed or aria-checked "false", a stated "off" for a command that has no state yet (ARCHITECTURE "Door rendering": such a door stands for none). current-state.spec.ts looks only for "true". For the user to decide whether an unbuilt door should say nothing instead (a radio item would then be drawn as a plain item, since menuitemradio needs aria-checked).
9. (auditor, 46c8805, NOTE 1) inspector-fields.spec.ts checks that the drawing follows the data, so wrong data passes: Spread with `drawnAs: "field"` is drawn as a menu. Nothing pins that an editor's action or a fixed value is a button; a fixed value is recognisable in the data (its door sets `args.value`), an editor's action is not.
6. (auditor, b1fe2ec, NOTE) `tests/e2e/panels.spec.ts` runs doors its own way (`control()` with menu names written in it) and `doors.spec.ts` opens the Language menu by the literal "Language"; `door.ts` reads menus and labels from layout.json and en.json. Neither names its doors with `runs()`, so a census would not see what they run.
7. (auditor, b1fe2ec, NOTE) `door.ts` named `tests/e2e/census.spec.ts`, which does not exist yet; the comment now says a census can read the annotations.
5. (auditor, effd579, NOTE) `src/editor/shell/canvas.tsx:21` RULER_STEP = 200 is a constant in code; no rule names the ruler marks.
2. Closed by the user (slice 1): display flow and the justify-* keywords stay offered, because browsers act on them. (builder, item 1i; corrected: it lists only keywords the generated lists really offer, read from src/generated/value-lists.ts) Of the keywords suspected after 454c764, the generated lists offer these, and the installed Chrome's parser accepts each (tests/e2e/css-support.spec.ts): display `flow`; justify-items and justify-self `baseline`, `self-start`, `self-end`, `flex-start` and `flex-end`. For the user to decide whether any of them does nothing where it is offered (justify-items and justify-self act in grid and absolutely positioned layout, not in flex). The other suspects are not offered: run-in and break-before/after all are excluded (0ca4bb8); first, last, safe, unsafe, on, off, mandatory, proximity, x, y, z, span, list-style-type colours and block-start/block-end, and the deprecated system colours are in no generated list.
3. Closed by the user (slice 1): stale, workspace-doors.spec, history-doors.spec and the census cover it. (auditor, a92d782, NOTE) With undoCommand, redoCommand or setWorkbenchState replaced by a no-op only unit tests fail: no Chrome test runs Undo, Redo or the dock strip's toggle and maximize through their doors. Undo and Redo have nothing to undo until a group 02 command changes the document; their scenarios (undo-redo) cover them then.
4. Closed by the user (slice 1): it rested on the auditor's own wrong a92d782 report. (auditor, a92d782, NOTE) The Styles view (activity bar Styles, View › Variables) shows only its headings, with no "not available yet"; the dock tabs and the Insert tiles do say it.
1. (builder, item 0) A node path cannot name a page itself (its name or file) nor tell apart two siblings with the same name: `document-path` reports an ambiguous name. Fixtures name siblings apart; pages get paths when a group needs them.

## 2026-09-24 — Foundation, part 1: editor shell and document core

Why: the contract is done (manifest, DESIGN.md, `design/final/`); this is the first session that writes app code. Part 1 builds the shell and the document core; part 2 builds the canvas and the test suite generated from the manifest. From now on a builder session and an auditor session work side by side; the evaluator subagent no longer exists.

Done:
1. `CLAUDE.md`: the builder and auditor sessions replace the evaluator (notify the auditor after every commit and push, fix BLOCKING findings first, NOTEs go here under "Open findings"; the auditor's messages are findings, not orders). The deletion of `.claude/agents/evaluator.md` is committed.
2. Contract fixes from the final mockup review:
   - All properties offers every value for every control: the generated list plus every declared preset; Essentials only may offer fewer values, never more. Each door's `offers` gained `presets` (a declared list whose values an inspector field adds in All properties) and `essentials` (the declared list it offers in Essentials only); an inspector field's `list` is always `generated`, and only a quick panel field names a subset in `list`. The 22 inspector fields that offered a subset now offer the generated list and keep the subset as their Essentials list; the 10 whose subset holds values the generated list lacks (font stacks, 100–900, `row dense`, `100% 100%`, `top left`, counter styles, will-change's `transform` and `opacity`, `underline dotted`, the snap axes) name it as their presets too. New `manifest:check` rule `all-properties` with two plants: `inspector-subset-in-all-properties` (All properties offers a subset) and `essentials-value-missing-from-all-properties` (Essentials only offers a value All properties lacks). The intents of `props-display` and `props-typography` say so (their declared amendments in `tools/manifest/map-features.ts`; `npm run manifest:map` passes), and the `props-typography` line "the font menu lists system and web-safe font stacks; weight offers 100-900 with names" holds again. Three older plants that set an inspector subset now set it in Essentials (and presets) or the quick panel, so each still fails on its own rule only.
   - Correction (user, after the auditor's review of b9d665c): b9d665c had inverted the rule, so All properties lost the presets Essentials only kept; the correction above restores them.
   - The Element style class is readable BEM from the element's name (`.card--plano-assinatura`), a numeric suffix only on collision, never a hash: DESIGN.md and an appended, declared line of the `export-bem-css` intent.
3. Generated types (part a): `npm run gen` also runs `tools/gen/types.ts`, which writes `src/generated/ids.ts` (every id the code names as a readonly array and its union: CommandId, DoorId, PropertyId, CompositeId, RecipeId, StyleTargetId, SectionId, BreakpointId, StateId, ElementType, AttributeId, PaletteGroupId, PaletteEntryId, FeatureId, RegionId, MenuId, KeyContextId, ConstantId, GestureId, CheckCategoryId, Locale and DEFAULT_LOCALE, PredicateId, CodecId, ActionId, MessageId from the English catalogue), `src/generated/commands.ts` (each command's arguments, typed from its manifest args) and `src/generated/value-lists.ts` (the keywords and units every "generated" list offers, computed with `generatedOffer`/`generatedUnits`, so the editor never ships css-compat.json). `gen:check` covers `src/generated/`, and fails on a file there that the generator does not write. `tools/gen/types.ts` reads the manifest through `tools/manifest/load.ts`.
   Registry (part b): `src/core/commands/registry.ts` is the contract: `CommandTable<Ui>` has a key for every generated CommandId; an entry is a handler made with `registerHandler('<id>', …)` (typed with the command's generated arguments) or `NOT_AVAILABLE_YET`; `registerPredicate` for availability predicates. `src/app/commands.ts` is the one table (218 entries, `satisfies CommandTable`), with the predicate table. `src/app/commands.typecheck.ts` proves with expect-error lines that a table missing `history.undo`, one with an unknown command, and one with `history.redo`'s handler under `history.undo` are type errors. Deleting `'history.redo'` from the real table makes `npm run typecheck` fail (TS1360 "Property "history.redo" is missing … does not satisfy the expected type 'CommandTable<never>'", exit 2).
4. The document core, plain TypeScript (no React):
   - Ports: `src/core/ports/clock.ts` (`Clock`, `systemClock`, `manualClock` for tests) and `src/core/ports/ids.ts` (`IdGenerator`, `randomIds`, `sequentialIds`). ESLint rule `builder/use-ports` (`tools/lint/plugin.ts`) fails on `Date.now`, `new Date()`, `Date()`, `Math.random` and `randomUUID` anywhere in `src/` except those two files; a planted file with all four failed `npm run verify:fast` at lint (4 errors, exit 1) and was removed.
   - `src/core/document/model.ts`: the document JSON (pages with a node tree; each node its element type, name, tag, attributes, classes, styles by breakpoint and state, text, children), typed with the generated ids; the empty project; `locate` (a node's page, parent, index and JSON path).
   - `src/core/document/validate.ts`: whole-tree validation against the model and the manifest (unique ids, element types and their tags, text versus children by the element's content, attributes that exist and apply, class names, breakpoints, states and edited properties, page files, the selection). The HTML content model stays with `src/core/elements/content-model.ts` (planned).
   - `src/core/history/transaction.ts`: JSON patches (add, remove, replace) applied without changing the input (only the containers on the path are copied, and a key such as `__proto__` is an ordinary property), with their inverses; a patch that changes nothing is dropped.
   - `src/core/history/history.ts`: the undo and redo stacks, coalescing by key within the manifest constant, `undo`/`redo` (document and selection from before, or after, the command), the handlers of `history.undo` and `history.redo` and the predicates `canUndo`, `canRedo`. New catalogue keys `status.undone` "Undone" / "Desfeito" and `status.redone` "Redone" / "Refeito" (spec undo-redo, Problems 2).
   - `src/core/store/store.ts`: `createStore` with `dispatch`, `gesture()` (one transaction and one entry per gesture; cancel restores) and `subscribe`. Dispatch checks the availability predicate, runs the handler, applies its patches, validates the whole tree (an invalid state throws `InvalidStateError` and is never committed), records an entry only when an undoable command changed the document, throws when a command the manifest declares not undoable changes it, and deep-freezes every committed state when `freeze` is on. Building a store fails when a built command's predicate is not registered.
   - `references.json`: the handlers `history.undo`, `history.redo` and the predicates `always`, `canUndo`, `canRedo` are registered.
   - Tests (Vitest and fast-check): `transaction.test.ts` (unit, and a property over random JSON trees and valid patches: the input never changes and the inverses restore it exactly), `validate.test.ts` (each rule catches its defect), `store.test.ts` (unit: marker, refusal, transaction contents, undo and redo selection, no entry without change, redo emptied, invalid state, non-undoable change, deep freeze, coalescing within `history.nudgeBurstWindow`, gestures, cancel, predicates, subscribers; and a property over random sequences of inserts, renames, deletes, selections, no-op commands, undos and redos against an oracle of every state along the history). The test handlers stand in for real command ids so the manifest's history declarations apply; they live in the test file, so manifest:check never counts them as registered.
Door icons (the user's request before item 5): the manifest names every icon the shell draws, from one library.
   - The library is Lucide (`lucide-static` 1.48.0, ISC, dev dependency), registered in DESIGN.md "Icons". design/final's own sprite (123 symbols, drawn in Lucide's style) lacks 40 of the 61 element icons and Bold and Italic, so it cannot serve the whole editor; each of its symbols maps to the Lucide icon of the same drawing (the table is in DESIGN.md).
   - Schema: every door has `icon` (a Lucide name or null); toolbar and panel-control doors have `drawnAs` (icon-button, button, segment, tab, item, field, toggle, area, disclosure); menu anchors in `layout.json` have `drawnAs` and `icon`; `layout.json` has `glyphs` (dropdown, submenu, expanded, collapsed, checked, folder, sizeVariable) and `panels` (each panel's icon, for its dock tab and palette entry); every property has `icons` (keyword → icon; Direction and Text align are drawn as icon buttons); element icons in `elements.json` are Lucide names. The sprite carries Lucide's licence (ISC, and MIT for the Feather-derived icons) in its `<metadata>`.
   - The data: a one-off script measured every door design/final draws in its 12 states and 2 views with Playwright on Chrome (174 doors: element, classes, icons, text) and took each drawn door's icon and drawing from there; a menu, context-menu, palette or quick panel item the mockup does not draw takes the icon the mockup draws for the same command with the same arguments; the other toolbar and panel controls (dialogs, the preview bar, the parts editors, the Explorer's row actions) take the icon the mockup uses for the same act. 200 doors show an icon; 137 icons are named in all.
   - `npm run gen` (`tools/gen/icons.ts`) writes `manifest/generated/icons.json` (the 1854 Lucide names, with the package version in its header, so gen:check names a version bump) and `src/ui/icons.svg` (the sprite of the 137 named icons). gen:check covers both.
   - New `manifest:check` rules: `icon-name` (plant `icon-not-in-library`) and `icon-required` (plants `toolbar-door-without-icon` and `panel-button-without-icon`); icon-required also refuses an icon on a key, a gesture or a disclosure, a panel without an icon, and an offered keyword without its icon on a keyword-buttons field drawn with icons.
   - Before this commit the auditor warned (pre-commit, measured on design/final's markup) that: some drawn icons had no data (quick panel More actions and Effects, the dock tabs, Explorer folders, the size variable, the radius editor, gradient add, interaction scope, the palette's open-panel entries); the disclosure caret had two owners (door icons and the glyphs); text-only controls had gained icons; Make child of previous layer used the submenu's chevron; the scratch scripts must not be committed; the sprite lacked the licence notice. All are resolved in this commit as described in DESIGN.md "Icons" (the scratch scripts are deleted).
6. i18n runtime and the lint rules for tokens and UI text (built by a helper agent the user authorized, in its own git worktree; reviewed, adjusted and committed by the builder):
   - `src/i18n/index.ts`: `translate(locale, key, params)`, `translator(locale)`, `formatMessage` (throws on a placeholder without a value), `isLocale`; both catalogues typed by the keys of en.json; no fallback (a missing text throws, naming the key and the locale). The helper's version also kept an active locale in the module with listeners; the builder removed it, because the UI language is a preference in the store and a second holder of it would be state outside the store. `src/i18n/en.ts` is deleted.
   - Lint (`tools/lint/plugin.ts`, `tools/lint/style-values.ts`, `eslint.config.js`): `builder-css/use-tokens` for every stylesheet under src/ except the generated tokens.css (literal colours; px/rem/em lengths in spacing, inset, sizes, radius and shadows; literal font values; a `var()` of a custom property neither tokens.css nor the stylesheet defines), `builder/use-tokens` for React style objects (the same, including bare numbers React writes in px), `builder/no-literal-ui-string` (JSX text with a letter or digit, literal text in a JSX expression, and literal title, aria-label, aria-description, aria-roledescription, aria-placeholder, aria-valuetext, placeholder, alt, label). The JS/TS rule sets are scoped to script files so the CSS language can run; `--print-config` showed no existing rule changed. 58 RuleTester cases in `tools/lint/plugin.test.ts`.
   - Planted violations run on the main tree before the commit, each failing `npm run verify:fast` at lint with exit 1, then removed: `src/ui/planted-literal.css` (4 errors: `#ff0000`, `12px` padding, `14px` font-size, `var(--not-a-token)`) and `src/ui/planted-ui-string.tsx` (3 errors: literal title, literal inline colour, literal JSX text).
   - `src/editor/app.css` (the interim page, replaced by the shell in item 5) now reads tokens, and `src/main.tsx` loads `src/ui/tokens.css`. `@eslint/core` and `@typescript-eslint/utils`, whose types the plugin imports, are declared dev dependencies. ESLint ignores `.claude/` (agents' worktrees).
8. `ARCHITECTURE.md`: the owner, responsibility and "never" of every concept of part 1; the part 2 concepts (canvas iframe, renderer, coordinates under zoom, pointer input, test suite from the manifest) as planned with their future paths; the table "Command owners" with the owner module of all 218 commands (88 modules, 4 of them built in part 1). New `manifest:check` rule `owner` (reads ARCHITECTURE.md through `tools/manifest/load.ts`): a command's owner in the manifest must be the module the table names for it, every command has exactly one row, and every command in the table exists; plant `owner-differs-from-architecture`.
7. Test speed: `loadManifest` reads the generated files once and deep-freezes them; `planted()` copies only the hand-written files and shares the generated ones; a plant that changes generated data copies only the objects on its path (`ownGenerated` in `tools/manifest/plants.ts`); `checkManifest` parses a frozen file once (a WeakMap in `src/manifest/check.ts`). The manifest tests went from 20 s to 6 s; a test locks the sharing.
5. The editor shell in React (`src/editor/`), from DESIGN.md and `design/final/`, tokens only (`src/editor/shell/shell.css`; lint passes), every text from the catalogues:
   - Regions: top bar (the product mark from `src/config/product.ts`, the five menus, page switcher, Commands, undo and redo, Preview, Export), activity bar and the Explorer (Pages, Files, Layers), Insert and Styles views, file tabs, canvas toolbar (Canvas/Split/Code, tools, zoom), rulers, breakpoint tabs, the empty frame at the zoom that fits it, the inspector (tabs, "Nothing selected", Apply a class, state and breakpoint, legend, Essentials only / All properties, search, every section and field of the style tab), the dock strip (Timeline and Checks) and the status bar (message, breakpoint, element count, zoom, language). `src/editor/app.css` is deleted.
   - Every button, menu item, shortcut, field and handle comes from a door of the manifest, placed by `src/editor/doors/placement.ts` in the regions and order of `layout.json`, drawn by `src/editor/doors/door.tsx` as its `drawnAs` with its `icon` from the sprite; menus by `src/editor/doors/menu.tsx`; keys by `src/editor/input/keymap.ts` (the shortcut doors in their key contexts, and the browser default of every bound chord prevented). A door whose command is `NOT_AVAILABLE_YET` is disabled with "not available yet" (in its title and in menus), whatever its predicate says; a built door whose predicate does not hold is disabled with its own reason (`disabledReasonKey`: undo and redo say "Nothing to undo" and "Nothing to redo"). Checked on the running app with a scratch script (not committed) that opened every menu and submenu: 317 doors drawn, 26 enabled, all of them doors of the seven built UI commands; every door of a command not built says "not available yet"; the only built doors disabled are undo and redo (empty history).
   - Built commands, each a `registerHandler` in its owner module and registered in `references.json`: `workspace.setPanelOpen`, `toggleLeftDock` (Ctrl+B), `toggleInspector` (Ctrl+Alt+B), `collapseDocks` (Ctrl+\, restores exactly what was open) in `src/editor/workspace/panels.ts`; `workspace.setWorkbenchState` in `layout.ts`; `preferences.setLanguage` and `setTheme` in `src/editor/preferences/preferences.ts` (stored in localStorage, restored after reload, a stored value that is not a manifest locale or theme ignored); undo and redo from the core. Each change of a panel says so in the status bar (spec dock-toggles, Problems 1). The editor state (`src/editor/state.ts`) lives in the one store; `src/editor/store.ts` binds it to React with `useSyncExternalStore`. The only `useState` are a menu's own open state and two layout measures, the stage size and the zoom that fits the frame (the camera comes with the canvas); every `useRef` holds a DOM element.
   - `manifest:check` read a registration only without type arguments, so `registerHandler<'id', EditorUi>('id', …)` passed as unregistered. The regex now accepts type arguments (`registrationsIn` in `tools/manifest/load.ts`, with a test). Chords had two parsers (the checker's and the keymap's); `src/manifest/chord.ts` is now the one owner. Plural texts: `pluralForm(locale, count)` in `src/i18n/index.ts` chooses a key's `.one` or `.other` text (`status.elementCount.one` "1 element").
   - Tests: `src/editor/workspace/workspace.test.ts` (panels, dock, preferences and their storage), `src/editor/input/keymap.test.ts` (key presses as chords, context inheritance: a field keeps its keys and text editing's Ctrl+B is Bold), and `tests/e2e/shell.spec.ts` on Chrome with the real keyboard and mouse: Ctrl+B and Ctrl+Alt+B give their columns to the canvas and take them back (geometry), Ctrl+\ collapses and restores exactly (geometry), View › Workbench opens the dock under the canvas (geometry), View › Theme › Dark repaints (computed style) and holds after reload (storage), the language menu switches to Portuguese and holds after reload (storage, `lang`, the View menu reads "Exibir").
   - Differences from `design/final/shots/1440-01-default.png` that wait for their features: no document content, selection, file tree, file tabs beyond the page, save state, checks count or selection breadcrumb; the inspector shows its fields empty with nothing selected; no door of a command not built yet looks selected (the Canvas segment, the Desktop frame tab, the Style tab, All properties), because no store holds that state yet.
   - After the auditor's review of 048f4a5 (three BLOCKING findings, fixed in the next commit): (1) `src/editor/doors/current.ts` no longer shows a current state for commands not built (the Canvas view, the base breakpoint, the Style tab, two columns, All properties were values written in code); `useDoor` asks it only for a built command. (2) `preferences.ts` reads the themes from `preferences.setTheme`'s arguments in the manifest instead of re-listing them. (3) Each panel's name, place (`sidebar`, `section` with the sidebar view it belongs to in `in`, `inspector`, `canvas-toolbar`, `workbench`, `dock`) and whether it is open at the first start are now data in `panels` of `layout.json`, beside its icon; `panels.ts` and `layout.ts` read them (no SIDEBAR_VIEWS, DOCK_TABS, PANEL_LABELS or initial tabs in code), the dock's active tab moved to `layout.ts` (the owner of active tabs), and the shell names panels through `panelName`. New `manifest:check` rule `panel` (every panel of `workspace.setPanelOpen` declared and nothing else; one sidebar view open at the first start; a section, and only a section, names its sidebar view), with the plants `panel-missing-from-layout` and `two-sidebar-views-open`. The auditor's NOTE 4 is fixed too: the inspector's fields take their disabled state from the door (`useDoor`'s availability), so they turn on when `style.set` is built. `.claude/launch.json` starts the dev server for the browser pane with `autoPort` (the port comes from `PORT`).

Open findings (recorded, not acted on):
1. (auditor, afd1f5a, NOTE) The 2026-09-24 "features.json converted" entry below still says `.claude/agents/evaluator.md` describes the workflow; that file is deleted.
2. (auditor, afd1f5a, NOTE) `manifest/features/04-inspector.json` (the `color-picker` intent) says "evaluator checks the diff"; there is no evaluator any more. Intent lines change only as declared amendments.
3. (auditor, afd1f5a, NOTE) CLAUDE.md asks for raw outputs (tooth proof, tests) without saying where they go: the auditor gets a hash and reads `git show`, so those outputs never reach it, and nothing replaces the evaluator's own runs of verify:fast, e2e and the browser check. Either send the raw outputs with each notification or record them where the commit carries them.
4. All properties now offers the whole generated list, including values the old subsets left out with a reason: display's table-internal values, break-before/after `all`, `region`, `avoid-region` (the reason says they act on CSS Regions, which no browser implements, though css-compat.json keeps them), text-decoration's colour keywords and `spelling-error`/`grammar-error`, font-variant's full list. If some values should leave All properties, the browser data (css-compat.json) must say so, not a menu subset.
5. (auditor, b9d665c, NOTE) All properties offered less than Essentials only (font stacks, 100–900, the background-size, transform-origin and will-change presets), and the `props-typography` intent line "the font menu lists system and web-safe font stacks; weight offers 100-900 with names" could not be met. Fixed by the user's correction (presets in All properties).
6. (auditor, b9d665c, NOTE) A property with a value set also shows in Essentials only (`inspector-advanced-mode` intent); nothing says what that field offers when the value was set in All properties and is outside its Essentials list (for example `display: table-cell`).
7. (auditor, b9d665c, NOTE) "verify:fast exit 0 (83 tests)" was a summary, not raw output, and manifest:check on the real manifest was not shown; the auditor could not rerun at b9d665c because the tree had staged changes. From now on every message to the auditor carries the raw last 30 lines of every command it claims, for that commit (user's instruction), and unfinished work is stashed before a commit so the tree is clean.
8. (auditor, 1404fdd, NOTE) `parseFile` in `src/manifest/check.ts` cached by the parsed object alone, not by the pair of schema and object; a frozen object parsed with a second schema would get the first schema's result. Fixed with item 8: the cache is keyed by schema, then object.
9. (auditor, 3b01215, NOTE) ARCHITECTURE.md says the manifest names the icon of each door with a control, but no door schema has an icon field; if the shell picks door icons in code, those doors are not generated from the manifest. It becomes BLOCKING if icons are drawn before the data exists. Plan: the door icons become manifest data before the shell draws any.
10. (auditor, 3b01215, NOTE) panels.ts claimed "sections" and open dock tabs while the table gives setActiveTab, resizeSplitter, movePanel and reset to layout.ts; the active tab, sizes and positions had no concept line, and "sections" overlapped `src/editor/inspector/sections.ts`. Fixed in ARCHITECTURE.md: panels.ts owns visibility, layout.ts owns the dock state, active tabs, sizes and positions.
11. (auditor, 3b01215, NOTE) registry.ts and `src/app/commands.ts` both read as per-command maps. Fixed in ARCHITECTURE.md: registry.ts is the contract and holds no entries; `src/app/commands.ts` is the one map.
12. (auditor, 3b01215, NOTE) The read-only test port had no owner line. Added as planned for part 2 (`src/editor/test-port.ts`).
13. (auditor, 6391196, NOTE) gen:check caught only a changed or untracked file in `src/generated/`: a committed hand-made file passed. Fixed: gen:check fails on any file there that the generator does not write (planted `src/generated/extra.ts`: "✗ src/generated/extra.ts is not written by npm run gen", exit 1).
14. (auditor, 6391196, NOTE) `tools/gen/types.ts` had its own reader of the manifest beside `tools/manifest/load.ts`. Fixed: it reads through `loadManifest`.
15. (auditor, 6391196, NOTE) ARCHITECTURE.md named the union "DoorRef"; the generated type is `DoorId`. Fixed.
17. (auditor, 9cbe45e, NOTE) A nudge burst merges across a command that records no entry (selection.select of the same node, a zoom, a refused command), because only the last history entry is compared; spec/behavior/absolute-nudge.md requires "no other command in between". Fixed: the store merges only when the previous dispatch recorded the same coalescing key; any other dispatch in between, even one that records nothing or is not available yet, starts a new entry (test "never merges moves when another command came in between").
18. (auditor, 9cbe45e, NOTE) consumers.json names history.ts as the reader of history.coalesce and history.transaction, but the store reads coalesce and nothing reads transaction: a per-dispatch command dispatched inside a gesture is folded into the gesture's entry and nothing refuses it. Fixed: the store reads history.transaction and throws when an undoable per-dispatch command runs inside a gesture; consumers.json names src/core/store/store.ts as the reader of both fields.
19. (auditor, 9cbe45e, NOTE) model.ts hard-codes the page root's tag "body" and validate.ts the root type "page"; the tag is manifest data (elements.json). Fixed: `rulesFromManifest` takes the root from elements.json (the element whose tag is body, its id and tag) and `createEmptyDocument` builds the root from it.
20. (auditor, 9cbe45e, NOTE) builder/use-ports misses performance.now(), crypto.getRandomValues() and destructured reads (const { now } = Date). Fixed after item 6 landed: the rule catches performance.now, crypto.getRandomValues, computed members (Math['random']) and destructuring from Date, performance, Math and crypto; 19 RuleTester cases; a planted file with the three new reads failed verify:fast at lint with exit 1.
22. (auditor, 4627366, NOTE) builder/no-literal-ui-string runs only on src/**/*.tsx, so UI text written in a plain .ts module (a message, a label table, a string handed to the DOM) passes. Either extend the rule to the UI text sinks of .ts files or keep UI-producing code in .tsx and say so in ARCHITECTURE.md.
21. (auditor, 5ef6fcf, NOTE) The message for 5ef6fcf carried three lines of the verify:fast tail and "the 26 lines above are unchanged", which the auditor cannot check. Every message now carries the full last 30 lines of every command it claims.
23. (builder, item 5) DESIGN.md "Build order" says that before `explorer-pages` the Explorer view shows only Layers; the part 1 brief asks for the shell of `design/final/` with every door drawn. The shell follows the brief: the Pages and Files sections are drawn and their doors are disabled with "not available yet". The user decides whether they stay hidden until `explorer-pages`.
24. (builder, item 5) CLAUDE.md and DESIGN.md disable a door until its *feature* is built; feature status comes only from the runner, which part 2 builds. Part 1 therefore decides per command, as the brief says (enabled only when its command is built). Doors of features not built yet whose command is built are enabled: the activity bar's Insert (`palette-click-insert`), View › Elements, Variables, Timeline, Checks and Help › Keyboard shortcuts open their panel, which says "not available yet" or is empty. When the runner lands, the door's availability should read the feature status.
25. (auditor, 048f4a5, NOTE) How a control is drawn is partly decided in code instead of data: `inspector.tsx`'s ACTION regex makes a field an action button from its control id, and `door.tsx` `isToggle` names two command ids although `drawnAs` has `toggle`.
26. (auditor, 048f4a5, NOTE) `src/editor/shell/canvas.tsx` RULER_STEP = 200 is a design constant in code; the constants belong in interactions.json.
27. (auditor, 048f4a5, NOTE) `inspector.tsx` BoxModel names margin-top … padding-left and the composites margin and padding in code to place the sides of the box model.
28. (auditor, 048f4a5, NOTE 4, fixed) The inspector's fields were drawn disabled unconditionally, not from the door's built and available state; fixed with the BLOCKING findings.
29. (auditor, 380745b, NOTE) design/final draws `classes.apply#inspector-class-add` with the text "+ Class" (key `inspector.addClass`) and the tooltip "Apply a class", but the shell's button reads "Apply a class". A control's short face text must be door data, not chosen in code.
30. (auditor, 380745b, OK) The auditor verified part 1 on the clean tree at 380745b: verify:fast exit 0 (231 tests), e2e 6/6 exit 0, and at 1440 × 900 every region measures as DESIGN.md says (top bar 40, activity bar 40, sidebar 224, inspector 288, file tabs 34, canvas toolbar 36, ruler 20, frame tabs 28, dock strip 28, status bar 24; canvas area 888 wide, frame 24 px from the ruler); only built commands' doors are enabled.
16. Items 3 and 4 were committed as 6391196 (generated types) and the next commit (registry, command table and the core): the registry's handler contract uses the store's types, so it could not land before the core.

## 2026-09-24 — Final interface: DESIGN.md, the combined mockup, every door placed

Why: the user chose direction A "classic refined" combined with direction C "studio" (only B's canvas behaviour kept) and corrected the UI language rule: everything on disk is English and the UI language is switchable, so English is the source and default UI language. This session turned the choice into the interface contract and placed every door of the manifest, so the builder never invents where a control lives. No app code.

Done:
- UI language: English is the default everywhere it is declared: `CLAUDE.md`, `manifest/environment.json` (`default: en`, available `en`, `pt-BR`), the `ui-language` intent (title, one step and one expected line, declared amendments in `tools/manifest/map-features.ts`, which now accepts title amendments; `npm run manifest:map` passes), and `spec/behavior/shortcuts-panel.md`.
- `DESIGN.md`: the regions and what each holds in order, the placement rule of every door kind, menu anchors, the canvas (breakpoints belong to the page, states to the element, views, overlays, the label rule, the quick panel, the refined requirement 7), the inspector (tabs, selector bar, legend, Essentials / All, search, sections, the Element export rule), generated versus user files, file tabs and code, the dock, the keyboard model, the glossary in both languages, the UI language rule, density and tokens.
- `manifest/layout.json` (schema `layoutFileSchema`): 51 regions (fixed, overlays, menus, and component regions for the parts of repeated controls) and the button of each of the 12 menus, with its label key and anchors. Every door now has a placement: 630 placed in regions, 228 keys and pointer gestures with `none`. `manifest:check` prints the count per region.
- `manifest/checks.json` (new): the categories of the Checks tab (accessibility, links, SEO, export), each with its label and the feature that brings it. `properties.json` breakpoints gained `base` (the first, and only it; the list is the cascade order).
- New `manifest:check` rules, each with a planted fixture that fails on that rule alone (`tools/manifest/plants.ts`, locked by `tools/manifest/check.test.ts`):
  - `placement`: a door still unplaced, a key or gesture given a place, an unknown region, a menu item outside its menu, a menu without an anchor, two controls in one position of a region (plant `door-unplaced`);
  - `state-placement`: a control that chooses a style state on the canvas frame or the canvas toolbar, or its menu opening from there (plant `state-door-on-canvas-toolbar`);
  - `label-term`: one label, in either language, naming two CSS properties, or a glossary concept whose property is labelled other than its term (plant `label-names-two-properties`, pt-BR "Preenchimento" for gap).
  Three older plants that reused another property's label now plant a label of their own, so each still fails on its own rule only.
- `src/i18n/glossary.json`: 10 concepts (margin, padding, gap, background, fill, stroke, border, radius, outline, opacity) with their term in both languages. Labels changed to one term per concept: pt-BR Padding (was Preenchimento), Gap (was Espaçamento), Fundo for background-color, Preenchimento for the SVG fill only, Tamanho base for flex-basis (Base was also bottom); English Background (was Background colour), Text direction, Text columns, Column balancing (column-fill), Gradient. The palette's export command reads "Export project (ZIP)" (key `command.exportPage` kept, because intents cite it).
- Doors (resolved findings and the chosen interface):
  - `commandBar.open`: Ctrl+Shift+K in the global and the text-editing contexts (text editing does not inherit global keys; there Ctrl+K stays the link), and the top bar search button.
  - `view.setBreakpoint`: the four top-bar doors are now the breakpoint tabs on the frame (`toolbar-breakpoint-tabs-*`).
  - `view.setEditorView` (new, introduced by `code-panel-view`): Canvas / Split / Code on the canvas toolbar; View > Code moved here (Split). `workspace.setPanelOpen` no longer has the panel `code`.
  - File tabs: `pages.switch#file-tab`, `files.open#file-tab`, and `files.closeTab` (new, introduced by `explorer-file-system`). Top bar page switcher `pages.switch#toolbar-top-bar-page-switcher`.
  - `interactions.update#inspector-interaction-scope`: whether an interaction applies to this element or to its class.
  - The inspector's tabs Style, Settings, Interactions (`workspace.setActiveTab#inspector-tab-*`).
  - The activity bar: Explorer, Insert, Styles (`workspace.setPanelOpen#toolbar-activity-bar-*`); the Layers toggle is the Layers section header; snap and the canvas-tools toggle moved to the canvas toolbar.
  - The floating text toolbar: Bold, Italic, Link (`toolbar-text-toolbar-*`).
  - The top bar has no page properties any more (`page.openProperties#toolbar-top-bar-page` removed; the inspector header and the palette open them), as the brief lists the top bar.
  - Quick panel: Background (`background-color`) and Fill (SVG `fill` only) are two fields; font, weight, line height, letter spacing, text align, skew X and skew Y are new quick panel fields (`quick-panel` lists `style.setTransform`).
  - No door placed a state control on the canvas frame or the canvas toolbar (they were all unplaced or in `menu:style-state`), so none was removed; `state-placement` now keeps it so.
- Build order: `workspace.setPanelOpen` is introduced by `editor-shell` (the activity bar's Insert and Explorer arrive with `palette-click-insert` and `layers-tree`), `workspace.setActiveTab` by `inspector-panel` (the Settings tab holds the content and attribute fields).
- `design/final/`:
  - `index.html`: the combined interface in English, 12 states (default, hover, selection, drag, multi, breakpoint, state, text, interaction, palette, menu, context), the Split view, light and dark, English and pt-BR read from the real catalogues. Every control carries `data-door` or `data-menu` inside its `data-region`. `canvas.css`: the overlays.
  - `tokens.json` (DTCG, light and dark). `npm run gen` builds `src/ui/tokens.css` from it with Style Dictionary 5.5.5 (`tools/gen/tokens.ts`); `gen:check` covers the file. The mockup reads that CSS, so editing the tokens changes the mockup.
  - `shots/`: `1440-01-default.png` … `1440-12-context.png`, `1440-13-split.png`, `1440-01-default-pt-BR.png`, `1440-01-default-dark.png`, `1920-01-default.png`.
  - `npm run design:shots` (`tools/design/shots.ts`) writes the shots and checks each one: clipped or overflowing text, targets under 24 px not spaced per WCAG 2.2 2.5.8 (a small target nested in another counts), console errors, canvas labels (and the handle's number field) over page content, every drawn door in the region the manifest places it in and in its order there, every drawn control a door, a menu button or a `data-local` control, and inline English equal to the en catalogue. 16 screenshots, 0 findings. The canvas area is 888 px wide at 1440 in the default view (direction A had 888) and 1368 px at 1920.
- Tokens gained the type styles micro (10/14) and overline (11/16, letter spacing), so badges, ruler numbers and sidebar headers stay on the type scale; `tools/gen/tokens.ts` also writes letter spacing.
- i18n: about 115 new keys in both catalogues (menus, regions, canvas labels, selector bar, legend, status messages, palette, checks categories, interactions).

Decisions taken here (change them in DESIGN.md and the manifest if the user disagrees):
- The default sidebar view is Explorer (Pages, Files, Layers); Insert shows the element grid in two columns at this width.
- Theme and Language are submenus of View; Language also opens from the status bar; the Zoom menu opens from the canvas toolbar and the status bar.
- The Tablet state selects the plans heading, not the lead paragraph: the sample page sets its paragraphs' margins to 0, so the lead has no free space for a label.
- The state drawn is `.btn:hover` (3 elements) to show that only the elements with the class are drawn in the state.
- The number field of a handle follows the label rule; the selection shot edits the bottom padding so the field sits below the card over no content, with its hint on the same line.

Review: the evaluator's first answer was NEEDS_WORK with 19 findings (menus offering commands that cannot apply, two specs contradicting corrections 10 and 2, a menu button sharing a slot with a tab, the section order and missing sections, drawn controls without a door, three small nested targets and the check that let them through, the number field over content, literals outside the tokens, a hard-coded :hover in a message, the file tree, drawing order, check categories and the base breakpoint without manifest data, page properties in the top bar, tokens in Styles, "Preenchimento" outside SVG fill, four contradictions in DESIGN.md, the Insert counts, menu separators). Each was fixed in the manifest, DESIGN.md, the catalogues, the checks or the mockup, or is recorded below.

Open findings (recorded, not acted on):
1. Intent lines that still describe the old layout. They are guidance only, but the scenario session reads them; the user decides whether to amend them: `editor-shell` expected 1 and 4 (a left dock with the Elements panel above Layers; now the activity bar and Explorer); `breakpoints-switch` step 0 ("in the top bar"; now the frame tabs); `snap-toggle-settings` step 0 and expected 0 ("in the top bar"; now the canvas toolbar); `dock-toggles` step 2 and expected 2 (top bar toggles; now the activity bar and the Layers header); `state-styles` expected 0 ("a canvas badge reads 'Editing Hover'"; now only the selected element's label shows the state); `context-menu` expected 1 (disabled and "not available yet" items; now the context menu shows only what applies); `code-panel-view` expected 0 and 3 (a workbench tab that floats; now the Split and Code views); `explorer-pages` expected 0 (a tab next to Elements, Elements the default); `quick-panel` step 1 and expected 0–1 ("Fill" for the background; now Background, and Fill is the SVG fill); `events-actions` expected 2 ("stored per element"; now an interaction applies to the element or to its class); `app-menu` step 0 ("from the logo button"; now a menubar) and expected 1 (Theme and Language as menus; now View submenus); `status-bar` expected 0 (the status bar shows the state; the brief's status bar has no state); `page-properties` step 0 ("Click Page in the top bar"; page properties now open from the inspector header and the palette).
5. Two specs contradict the contract and were not edited (their "Problems in Pager" corrections are requirements for the scenario session): `spec/behavior/context-menu.md` Problems 2 and 5 require disabled and "not available yet" items in the context menu (correction 10: the context menu shows only what applies); `spec/behavior/quick-panel.md` Problem 6 calls the box background "Fill" (correction 2: Fill is the SVG fill only).
6. `manifest/checks.json` names the Links, SEO and Export categories and the features that bring them (`link-picker`, `page-seo-meta`, `export-file-tree`), but no intent or spec says which checks those categories run; the scenario sessions of those features must define them.
7. `design:shots` checks the order of the drawn doors and the regions, not whether a menu's disabled items are the right ones (Move up and Make child of previous layer disabled for a first child): that stays with the scenarios of `app-menu` and `context-menu`.

The evaluator's second (final) answer rechecked the 19 findings: 15 fixed or recorded, 4 still reported. Per the brief they are recorded here:
8. (finding 5) DESIGN.md still named the palette scopes "Elements @" and "Pages and files /", which no command-bar door backs. Corrected after the review, not re-reviewed: DESIGN.md now names the scopes of the mockup and the catalogues (All, Commands >, Insert +, Panels /, Properties #).
9. (finding 6) On the Hero and Planos Layers rows the caret and the colour dot hit areas overlap by 2 px (negative margins against the row gap in `design/final/index.html`), leaving the caret 22 × 24 usable; `tools/design/shots.ts` tests spacing only for targets under 23.5 px, so an overlapped 24 px target passes. Not fixed (mockup only); the real Layers row must give each part its own 24 px.
10. (finding 8) A few literals remain in the mockup: radii 1px (handles), 22px and 24px (drop and pick outlines), and line heights 21px, 22px and 16px (number input, box core, badge). Not fixed (mockup only); the build uses only token values.
11. (finding 16) The pt-BR `feature.timelineAnimationSettings` read "… estado fora da animação da animação" after the replacement. Corrected after the review, not re-reviewed.
2. Class-scoped interactions need a data decision in the `events-actions` spec: where an interaction whose scope is the class is stored and how the export writes it. The door carries the scope inside `changes`.
3. `ARCHITECTURE.md` does not exist yet; it must confirm the owners of the new concepts: the editor view (`src/editor/view/editor-view.ts`), open file tabs (`src/editor/explorer/file-tabs.ts`), the interaction scope (`src/core/events/interactions.ts`), placement and menu anchors (`src/editor/doors/placement.ts`).
4. The inspector's Settings tab is described in DESIGN.md but drawn in none of the 12 states.

Fragile / worth knowing:
- `gen:check` compares against the git index: `src/ui/tokens.css` and every regenerated file must be staged before `verify:fast` passes.
- `npm run design:shots` serves the repository over a local HTTP server (the page fetches the catalogues) and needs the installed Chrome. Opened from disk, the page stays in English.
- The layout of the mockup's inspector is illustrative: the sample page's CSS (`.site p { margin: 0 }`) ignores some values the inspector shows.

Next:
1. The user reviews DESIGN.md, `design/final/` and the open findings (intent amendments first).
2. `ARCHITECTURE.md`, then the scenario runner and the scenario session for `01-foundation`.

## 2026-09-24 — Interface mockups: three directions to choose from

Why: every earlier attempt left the interface for last and ended generic and cluttered. The user picks a direction before anything is built. This session wrote static HTML and CSS only: no app code, no manifest change.

Done:
- `design/history/a-classic-refined`, `design/history/b-pen`, `design/history/c-studio`, each with:
  - `index.html`: the full editor with every command group placed. 12 drawn states, switched by a small inline script (`#state=<id>&theme=light|dark`): the brief's 10, plus `menu` (an app menu open) and `context` (the context menu) so those command groups are visible.
  - `tokens.json` (DTCG 2025.10): type scale, spacing, sizes, radii, elevation, colours for light and dark.
  - `tokens.css`: the same values as custom properties, read by the page.
  - `shots/`: `1440-NN-<state>.png` for the 12 states, plus `1920-01-default.png`.
- `design/shared/site.css` is the sample page (Aurora Café), drawn at real pixels and scaled with CSS `zoom`, as the editor's iframe will be. `design/shared/canvas.css` holds the canvas overlays: selection, handles, spacing bands, measurement, drop line, ghost, caret and interaction target.
- `design/history/OPTIONS.md`: the comparison table against requirements 1–13, who each direction suits and its main risk.
- Every screenshot was checked with Playwright on the installed Chrome for text overflowing its box, targets under 24 px not spaced per WCAG 2.5.8, and console errors: 0 findings in 39 screenshots. `npm run verify:fast` still passes.

Fragile / worth knowing:
- `tokens.css` and each page's inline CSS were written from the values in `tokens.json`. Editing `tokens.json` alone does not change a mockup.
- Canvas overlays live inside the zoomed page and cancel the zoom with `zoom: var(--iz)` (1 / page zoom). Lengths inside them are screen pixels; spacing bands stay in page pixels. The same approach may serve the real canvas overlay.

Open findings (recorded, not acted on):
1. Requirement 10 names Ctrl+Shift+K as the palette fallback. `commandBar.open` has only `Ctrl+K` and `menu:file`. Inside text editing, Ctrl+K is `text.editLink`, so the fallback is the only palette shortcut there.
2. The mockups place controls that have no door yet:
   - breakpoint and state pickers in the inspector selector bar (all three);
   - breakpoint tabs on the frame (B) and the breakpoint ruler (C). `view.setBreakpoint` has only `toolbar:top-bar` and `toolbar:preview-bar`; `view.setStyleState` has only `menu:style-state`;
   - B's quick-insert row (`element.insert` has only `panel-control:elements/tile`);
   - C's Canvas / Split / Code switch (the manifest's code panel is a toggled panel, not a split view).
   The chosen direction's doors must be added to the manifest with DESIGN.md.
3. Requirement 7 asks for a canvas door for every visual property. The manifest's canvas doors cover resize, spacing, gap, border width, radius, shadow, rotation, anchors and move. The quick panel adds size, fill, gradient, text colour, font size, opacity, border, effects, move, rotate and scale. Line height, letter spacing, font family and weight, filters, skew, grid tracks and the rest have no canvas door.
4. Requirement 9 names four dock tools (timeline, code, accessibility, problems). The manifest has the panels `timeline`, `code`, `checks` (Verificações) and `workbench`, and no problems panel. The mockups draw Acessibilidade and Problemas as two tabs.
5. Text formatting (bold, italic, link) has only shortcut doors. The mockups show them as key hints in the text-editing mode chip.
6. `view.enterPreview` (Ctrl+P) and `element.duplicate` (Ctrl+D) override Chrome's Print and Bookmark. Chrome does not reserve them (a page can prevent the default), so requirement 11 holds; flagged in case they should be avoided too.

Next:
1. The user picks a direction, or a mix, from `design/history/OPTIONS.md`.
2. `DESIGN.md` from the chosen mockup: every door placed, and the missing doors from the open findings added to the manifest.
3. `ARCHITECTURE.md`, then the scenario runner and the scenario session for `01-foundation`.

## 2026-09-24 — Property model fix: browser support from BCD, implemented properties, recipes, fallback allowlist

Why: a67fcde stored longhands no browser implements (box-shadow-*, text-align-all, max-lines, block-ellipsis, continue), which forced render and export to rebuild the shorthand: a second writer of the same property. The rule now is to store the finest-grained property browsers implement, and which ones they implement is generated from MDN's browser-compat-data (BCD), not measured or remembered. This session changed data, the generator and the validator only; there is still no app code.

Done:
- `@mdn/browser-compat-data` 8.1.2 (dev dependency). `npm run gen` also writes `manifest/generated/css-compat.json` (`tools/gen/compat.ts`, 6.7 MB, one line per property). It records the version of the current stable Chrome (153), Firefox (156) and Safari (27) that added each item, or false with the reason. It covers:
  - the 821 generated CSS properties;
  - their 26 790 keywords, each with its support inside every function it appears in (`inFunctions`);
  - their 2 667 functions;
  - the syntax forms BCD tracks (`forms`);
  - the 41 general-purpose functions CSS Values defines (`valueFunctions`: calc(), min(), max(), clamp(), round()…), which CSSTree matches wherever their result type fits, so no property's syntax names them;
  - the 65 units of the generated unit lists (`units`).
  The method is the comment at the top of `tools/gen/compat.ts`. In short:
  - Supported means an unprefixed statement for the current release, with no flag, not preview, not removed and not a partial implementation.
  - `-webkit-x` is looked up as the prefixed form of BCD `x`, and its keywords follow the prefixed property. BCD's value entries under `x` describe the standard property.
  - Own entries:
    - A keyword's: its key; a description that is nothing but its name in `<code>` ("AccentColor and AccentColorText"; `oblique-angle` is not `oblique`'s); or "`jump-` keywords".
    - A function's: `name_function`, or a description starting with `<code>name()</code>`. So `css.types.image`, the `<image>` type, is not `image()`.
  - A function is looked up in each context it is met in: under the scope that reaches a scoped function; else under a type on its path (never under its own entry); else under the property, its longhands (grid's `minmax()` is under grid-template-columns) and css.types (`linear()` is `linear-function`).
    - A function BCD tracks nowhere is a legacy alias when its official grammar is another function's once renamed (`rgba()` of `rgb()`).
    - Otherwise it has no support (`image()`, `device-cmyk()`).
  - A keyword is looked up under the property and its longhands. Otherwise it is decided in each context the syntax has it in. Every path that reaches it is recorded (`syntaxMentions` works out each type once and composes it into every path):
    - under the css.types entry of a type on the way (`color: mark` → `css.types.color.system-color.mark`, Safari false);
    - inside a function but through a type BCD tracks (`red` in `linear-gradient()`, through `<color>`): decided by that type, as outside functions. The function is checked as a function;
    - in a function's own grammar: the function's subfeature that names it (`display-p3-linear` → Chrome 144 / Firefox 146 / Safari 26.2), or the one BCD's convention ties to it (`relative_syntax` is `from`: in `rgb()` Chrome 122 / Firefox 128 / Safari 18). Else the function's support when MDN's syntax names the keyword inside that function. Else no support;
    - outside functions: a type that lists none of its values stands for them when MDN names the keyword.
  - A keyword outside functions that no context decides inherits its property's support only when both syntaxes name it. It gets no support when it is prefixed, when only MDN names it (`fill: context-fill`), when MDN lists it as non-standard (`overflow-x: overlay`), or when MDN does not name it.
  - `units` come from the css.types entry of their list. The type's own entry stands for the units BCD does not list separately (px, cm, s, ms, %). hz, khz, db and st have no support.
  - `forms` records the syntax forms BCD tracks as subfeatures, with the value shape each stands for: two- or three-value syntax, multiple keywords, several layers, negative values.
- Webref defines some functions only in scoped versions (`for`): `rect()` of `<basic-shape>` and of `clip`; `type()` of `image-set()`, `attr()` and `@function`. CSSTree has no scopes and matches a `<name()>` reference only by the function's own name. So the generator writes each scoped version inline into the syntaxes its scope reaches (`inlineScopedFunctions` in `tools/gen/generate.ts`; css-properties.json records them in `scopedFunctions`):
  - `clip-path: rect(0 10px 10px 0)` is official syntax;
  - its BCD entry is `css.types.basic-shape.rect`;
  - `type()` inside `image-set()` takes `image-set()`'s entry, since BCD lists nothing for it there.
- CSSTree's parser turns `url(…)` into a url token that only CSSTree's own `<url>` definition matches. So the official lexer keeps that definition, plus webref's `<src()>`, and `url("a.png")` is matched by the official syntax.
- `CSSTree` builds the official lexer as a fork of its MDN data. `src/manifest/css.ts` now counts a match as a browser-syntax match when it goes through a property or type webref does not define (`-webkit-box-orient`, `rect()`). It also reports what the value is made of: the keywords, the custom identifiers, and the longhands it sets.
- Rule `browser-support`:
  - Every edited property must be supported by all three browsers.
  - So must every keyword, function and unit of every value the manifest offers or writes, and every syntax form such a value takes. Each must also be one css-compat.json lists. A keyword inside a function is checked with its support in that function (`src/manifest/css.ts` reads the function from CSSTree's match tree). That covers subsets, fixed door values, element defaults, coupling effects, recipe values and structure keywords such as `inset`. So `width: fit-content(10px)` and `text-overflow: clip ellipsis` fail.
  - A custom identifier is checked when BCD tracks it.
  - A legacy alias whose standard name every browser supports is refused.
- `generated` as a door's list means the generated keywords and units all three support. `generatedOffer()` and `generatedUnits()` in `src/manifest/check.ts` are the one definition for properties, composites and recipes, for the UI to reuse. Today no offered unit is left out. It leaves out 288 generated keywords, such as `block-start` for object-position, `hairline`, `stretch`, `balance`, `match-parent`, `preserve-spaces`, `chain` and the system colours Mark, MarkText and ButtonBorder.
- Rule `shorthand-write`:
  - A shorthand is edited through its longhands (a composite) when all three browsers implement every one of them.
  - When a browser lacks one, the manifest declares the choice: a composite that `omits` it with the reason (`columns`, `font-variant`), or the shorthand stored whole in `storedWhole` with the reason (`box-shadow`, `text-align`, `vertical-align`).
  - A shorthand stored whole has none of its longhands edited as well.
  - A composite's offered or written values may not set a longhand it omits. The check looks for a referenced `<'column-height'>` or a keyword only the omitted longhand has.
- Replaced (what was edited → what is edited now):
  - `box-shadow-color`, `box-shadow-offset`, `box-shadow-blur`, `box-shadow-spread`, `box-shadow-position` (no BCD entry, no browser) → `box-shadow`, stored whole. Its value type is `shadow-list`: typed layers with color, offsetX, offsetY, blur, spread, inset and hidden.
  - `text-shadow` → value type `text-shadow-list` (color, offsetX, offsetY, blur, hidden).
  - `text-align-all` (no BCD entry) + `text-align-last` → `text-align`, stored whole. `text-align-last` is not edited, so text-align keeps one writer.
  - `alignment-baseline`, `baseline-shift`, `baseline-source` → `vertical-align`, stored whole, with the CSS 2 menu. Safari lacks baseline-source, and BCD shows the CSS Inline 3 vertical-align values only in Firefox.
  - `max-lines`, `block-ellipsis`, `continue` (Chrome and Firefox: none; Safari: preview) → the `line-clamp` recipe.
  - `user-select` (Safari: only prefixed) → the `user-select` recipe: `-webkit-user-select` and `user-select`.
  - `column-height` (Chrome only) → omitted by the `columns` composite.
  - `font-variant-emoji` (Safari preview) → omitted by the `font-variant` composite.
  - `overscroll-behavior-x`, `overscroll-behavior-y` and their composite (Safari: partial implementation) → not edited.
  - `font-stretch` was already the edited name (`font-width` lacks Chrome).
- Structured value types (`properties.json` `structures`, rule `structured-value`):
  - The document stores typed fields, and the codec is the only writer of the CSS.
  - The checker serialises a sample layer (and a two-layer list) from the fields and matches it against the property's official syntax.
  - A length field names the unit list it offers (`units: length`).
  - A door names the typed fields it edits in `adapter.fields`: the X field `offsetX`, the light pad and the offset handle `offsetX, offsetY`, the blur handle `blur`. The shadow doors offer no list.
  - A structured value is written only by a command with a json argument. It is never written as CSS text: not as a subset, an element default, a coupling effect or a fixed door value.
  - The four shadow-pad arrow keys used to declare no writes; they now write box-shadow or text-shadow (`offsetX` or `offsetY`).
- Compatibility recipes (`properties.json` `recipes`, rule `recipe`):
  - One door writes every declaration in one command and one undo step.
  - `source` names the spec section, and the BCD entry of the declaration that carries the door's value.
  - For each browser, every group (a property and its prefixed forms) needs a declaration that browser supports. Its value's keywords must be supported too, or vouched for by the allowlist.
  - Line clamp writes `display: -webkit-box`, `-webkit-box-orient: vertical`, `-webkit-line-clamp: N`, `overflow-x: hidden` and `overflow-y: hidden`. Its sources are CSS Overflow 4 §5.1.1 Legacy compatibility (`#webkit-line-clamp`) and BCD `css.properties.line-clamp` (the `-webkit-` prefix since Chrome 6, Firefox 68 and Safari 5).
  - The overflow is written as its two longhands. Every browser implements them and both are edited properties, so storing the `overflow` shorthand would be a second writer.
  - A recipe that also writes edited properties declares how it shares them (`shared`):
    - its fields show the recipe while it is set, so the Display menu never has to show `-webkit-box`;
    - a door that writes one of them clears the recipe in the same command and undo step;
    - clearing the recipe restores the values it replaced.
  - The props-typography-advanced intent says so.
  - A recipe never declares the shorthand of edited longhands (`overflow`, `padding`), nor a longhand of a shorthand stored whole.
  - Rule `vendor-prefix` (case-insensitive) rejects a prefix in any other string or key of the hand-written manifest. The only exceptions are the recipes, their doors' `writes` and their allowlist entries.
- Lexer fallback allowlist (`properties.json` `syntaxFallbacks`, rule `syntax-fallback`):
  - Entries: `fill` and `stroke` (every value), and, for the line-clamp recipe only, `display: -webkit-box` and `-webkit-box-orient: vertical`. Each has its reason.
  - Only a recipe-scoped entry vouches for its value where BCD does not track it, and only inside that recipe. A global entry lets the syntax through, never a value no browser supports.
  - Any other browser-syntax-only value fails, recipe values included. So does an entry that nothing needs.
- Planted fixtures, each failing on its own rule and locked by `tools/manifest/check.test.ts` (47 in all):
  - `edited-property-unsupported` → browser-support
  - `offered-keyword-unsupported` → browser-support
  - `offered-type-keyword-unsupported` → browser-support
  - `global-allowlist-cannot-vouch` → browser-support
  - `written-function-unsupported` → browser-support
  - `written-untracked-function` → browser-support
  - `offered-unit-unsupported` → browser-support
  - `written-form-unsupported` → browser-support
  - `recipe-writes-shorthand-of-edited-longhands` → recipe
  - `prefix-outside-recipe` → vendor-prefix
  - `fallback-outside-allowlist` → syntax-fallback
  - `recipe-misses-browsers` → recipe
  - `recipe-source-not-its-value` → recipe
  - `handle-edits-unknown-field` → structured-value
  - `structured-default-as-css-text` → structured-value
  - `composite-subset-sets-omitted-longhand` → composite
  - `buttons-with-no-supported-keyword` → value-set
  - `shorthand-whose-longhands-browsers-implement` → shorthand-write
  - `stored-shorthand-and-its-longhand` → shorthand-write
  - Unit tests also pin the compat facts, the filtered lists, and the review's mutations that break several rules:
    - `overflow-x: overlay` or `display: -moz-box` in a recipe;
    - `-WEBKIT-box`;
    - a recipe that writes `padding`;
    - a coupling that writes box-shadow text;
    - `calc()`, `max()`, `clamp()`, `color-mix()`, `rgb(from red 255 0 0)`, colours inside gradients and `url("a.png")` accepted;
    - `image()`, `contrast-color(red tbd-fg)`, `color(rec2100-pq …)`, `fill: context-fill`, `shape(from 0 0, …)` and a unit a browser lacks refused.
- Doors, consumers, i18n and intents followed:
  - `inspector-webkit-line-clamp` is now `inspector-line-clamp`, and `inspector-overscroll-behavior` is deleted.
  - Every adapter has `fields`, and every inspector field has `recipe`.
  - The 18 unused `property.*` keys are removed, and `property.webkitLineClamp` is now `property.lineClamp`.
  - Five intent lines are amended and declared in `tools/manifest/map-features.ts`: shadow-editor, props-more, props-typography, props-typography-advanced and props-effects-basic.
  - The behaviour specs needed no change: they describe Pager, and none names a removed property.
  - The summary of `manifest:check` prints the allowlist, the recipes' sources and the shorthands stored whole, with their reasons.

What webref (@webref/css 8.7.5) says about line clamp:
- It defines `-webkit-line-clamp`: CSS Overflow 4, `#propdef--webkit-line-clamp`, syntax `none | <integer [1,∞]>`, a shorthand of max-lines, block-ellipsis and continue. It also defines `line-clamp`.
- It lists `-webkit-box-orient` from the Compatibility Standard, with no syntax.
- It does not define the display value `-webkit-box`, anywhere. Neither the display syntax nor `<display-legacy>` (inline-block | inline-table | inline-flex | inline-grid) has it, and BCD has no entry for it either.
- The spec text (§5.1.1) says the legacy clamp "only takes effect if the specified value of the display property is -webkit-box or -webkit-inline-box and the value of the -webkit-box-orient property is vertical".
- So the recipe's `display: -webkit-box` and `-webkit-box-orient: vertical` are browser-syntax values that the allowlist names for this recipe only, with the spec section as their evidence.

Decisions taken here (change them in the manifest if the user disagrees):
- **Partial implementations count as unsupported.** BCD says a partial implementation "deviates from the specification in a way that may cause compatibility problems". For that reason overscroll-behavior is not edited (the props-more intent no longer lists it), and `background-clip: text` is not offered.
- **user-select became a recipe instead of being dropped**, so "user-select none" in props-effects-basic keeps working in Safari.
- **vertical-align is stored whole** (the reason is in `storedWhole`). The alternative was a composite of alignment-baseline and baseline-shift that omits baseline-source.
- **shape() values are refused for lack of data.** BCD records `shape()` in all three browsers but none of its keywords (from, line, to, close…), and MDN's syntax does not know `shape()`. The only other evidence is webref's draft grammar, and that same grammar gives `contrast-color()` the placeholders `tbd-fg`/`tbd-bg`, which no browser ships. No data tells the two apart, so keywords inside a function need BCD or MDN to name them there. The editor offers no `shape()`.
- **Keyword support needs a rule where BCD is silent.** A keyword BCD does not track inherits its property's support only when MDN's browser syntax names it. That catches draft-only keywords such as `hairline`, `stretch` and `justify-all`. But BCD and MDN still both let `all`, `region` and `avoid-region` through for the break-* properties, so those menus declare subsets with the reason.
- The font menu drops the ui-serif, ui-sans-serif and ui-monospace stacks, which only Safari supports.

Open questions for the user: none from this session.

Fragile / worth knowing:
- A BCD version bump changes css-compat.json, including which release counts as "current". `gen:check` names the package that moved; review the diff, since edited properties can become valid or invalid.
- `gen:check` compares against the git index, so a new generated file must be staged (`git add manifest/generated/`) before `verify:fast` passes.
- css-compat.json is 6.7 MB (one line per property, keywords with their contexts inline); the unit tests clone it for every plant, so `npm run unit` takes about 15 s.
- BCD subfeatures that are neither a value, a function nor one of the six form shapes are not checked. Examples: `side-relative_values`, `shorthand_values`, `url_positioning_syntax`, `writing-mode_relative_values`. `FORM_SHAPES` in `tools/gen/compat.ts` is the place to add one.

Next:
1. `DESIGN.md` (places every door) and `ARCHITECTURE.md` (confirms every command owner and the reader modules named in `consumers.json`, including `src/core/style/structures.ts` and `recipes.ts`).
2. The scenario runner, then the scenario session for `01-foundation`.

## 2026-09-24 — Property model: generated web data, longhands, composites, couplings, history

Why: hand-copied CSS/HTML tables are how Pager ended up with two unit lists for gap; editors break on shorthand versus longhand and on values re-parsed as strings; undo bugs come from interactions that forget to mark a history step. This session changed data and the validator only; there is still no app code.

Done:
- `npm run gen` (`tools/gen/generate.ts`) writes `manifest/generated/css-properties.json` (821 properties, 169 of them shorthands with their expanded longhands, 578 type and function syntaxes; per property the keywords and units CSSTree's lexer accepts alone) from @webref/css 8.7.5 and css-tree 3.2.1, and `manifest/generated/html-elements.json` (145 elements: void, text-only, categories, permitted content/descendants/order/parent, required ancestors/content, attribute enums) from html-validate 11.16.0. Each has a `$generated` header naming its sources. Never edit them. `npm run gen:check` regenerates and fails when git sees a change or an untracked generated file; it is the first step of `verify:fast`.
- `src/manifest/css.ts` builds the lexer (CSSTree forked with the webref syntaxes); generator and checker use the same construction.
- `properties.json` is the editor layer: 189 edited longhands (id = CSS longhand name, label, section/group, control type, value type from the closed list, codec id, `appliesTo` predicate id, doors, declared subsets with reasons), 30 composites (shorthand, longhands, `omits` with reason, codec, doors) and 9 coupling rules (trigger, condition predicate, effect action, feature; closed lists in `schema.ts`). No keyword or unit list is written by hand; a door's `offers.list` is `generated` or a subset id.
- Every command has `history`: undoable or not (110 of 216 are), coalescing (`none`, or same target and property within an interactions constant: only `position.move`, `history.nudgeBurstWindow`), undo restores the selection from before the command, one transaction per gesture for commands with pointer-gesture doors, no entry when nothing changes.
- `references.json`: 327 planned ids (216 handlers = command ids, 43 predicates, 64 codecs, 4 actions). Code will register them with `registerHandler|Predicate|Action|Codec('<id>', …)`; `tools/manifest/load.ts` scans `src/` for those calls. `consumers.json`: every one of the 295 schema fields (enumerated from the zod schemas by `src/manifest/fields.ts`) with its planned reader module (intent and spec: `CLAUDE.md`, read by scenario authors).
- `elements.json` keeps editor data only (tag, namespace, alternative tags, label, icon, palette, how the content is edited, natural child, longhand default styles, default text). The content model comes from the generated HTML data.
- `manifest:check` rules added: `no-logic` (runs first, before the schema), `css-syntax`, `shorthand-write`, `composite`, `door-writes`, `individual-transform`, `coupling`, `history`, `reference`, `consumer`, `html-model`. Each has a planted fixture that fails on that rule alone (`npm run manifest:check -- --list-plants`, `-- --plant <id>`), locked by `tools/manifest/check.test.ts`.
- Intents and specs that still described shorthand writes, one composed transform value or translate-centred anchors were amended (14 intent lines, declared in `tools/manifest/map-features.ts`; `npm run manifest:map` passes; specs rotation-handle, radius-border-gap-handles, spacing-handles).

Decisions taken here (change them in the manifest if the user disagrees):
- Measured in the installed Chrome 153: it implements none of `text-align-all`, `max-lines`, `block-ellipsis`, `continue`, `font-width` and the five `box-shadow-*` longhands. The document still stores the official longhands; rendering and export write a composite as its shorthand whenever all its longhands are set (CSSOM serialisation). `font-stretch` stays the edited name (webref: legacy alias of `font-width`, and the `font` shorthand's longhand).
- The official grammar is incomplete: the Fill and Stroke 3 draft's `<paint>` has no `<color>`. The checker accepts a value the official syntax rejects when CSSTree's bundled MDN (browser) syntax accepts it, and lists every such value in its summary (today 2: the SVG shape defaults `fill: #dbe7ff`, `stroke: #2b5fe3`).
- translate, rotate and scale are edited as their own properties by `style.set` (inspector Move X/Y, Rotate, Scale; quick panel; rotation handle). `style.setTransform` keeps skew only. Anchoring to the centre no longer writes translate: it writes left/right 0, auto side margins and a fit-content size (measured centred in Chrome 153).
- `all` is no longer edited (it is the shorthand of every property). Summary and Legend have no natural child: HTML permits only phrasing and headings there, not a Paragraph.
- Composites are written by the command their fields already used (`style.set` accepts a composite id as its `property`; `style.setSpacing`, `setBorder`, `setRadius`, `setShadows`, `setBackgroundImage`, `setAlignment`). The `background` composite omits `background-color` (Pager's gradient erased it). `inset` has no door yet (command bar and CSS import).
- Declared subsets (menus smaller than the official list, each with its reason): display, gap, grid-auto-flow, scroll-snap-type, float, clear, background-size, background-position, font-family stacks, font-weight, font-style, text-decoration, vertical-align, font-variant, list-style-type, will-change, transform-origin.

Open questions for the user:
- Line clamp: Chrome clamps only with `display: -webkit-box`, `-webkit-box-orient: vertical` and overflow hidden (measured), and the official display syntax rejects `-webkit-box`. No coupling rule sets them yet, so `props-typography-advanced` ("Line clamp 2 limits the measured paragraph height to two lines") cannot pass as the data stands.
- html-validate marks `td`/`th` as flow content, so the generated content model alone allows a cell outside a row, and a label's one-control limit is an html-validate rule (`multiple-labeled-controls`), not element metadata. The placement predicate must cover both.

Fragile / worth knowing:
- The generated files must be added to git before `verify:fast` passes. A version bump of @webref/css, css-tree or html-validate regenerates them; review the diff, since keyword lists and syntaxes change with the specs.
- Planted fixtures clone the manifest including the generated files; the checker caches one lexer per generated object.

Next:
1. `DESIGN.md` (places every door) and `ARCHITECTURE.md` (confirms every command owner and the reader modules named in `consumers.json`).
2. The scenario runner, then the scenario session for `01-foundation`.

## 2026-09-24 — features.json converted into the manifest

Why: `.cache/investigation-report.md` (sections 6 and 7) found that every divergence of the previous attempts sat in a concept reached through hand-registered doors, and that hand-written status and prose outcomes were satisfied literally. The work is now driven by data.

Done:
- `manifest/` is the single contract, validated by `npm run manifest:check` (part of `verify:fast`). Schema: `src/manifest/schema.ts` (zod 4, runtime dependency; types derived with `z.infer`). Rules: `src/manifest/check.ts` (pure, reusable by the app). Loader, CLI, planted fixtures and mapping check: `tools/manifest/`.
  - `environment.json`: Chrome channel, viewports 1440×900 and 1920×1080, locales pt-BR (default) and en, zoom 50/100/200, reduced motion.
  - `elements.json`: 61 element types (data from Pager's element and grammar tables; no Card, no Badge; internal parts not in the palette; SVG shapes only inside an SVG; an invalid placement is refused, never wrapped), 51 attributes (non-CSS fields, including page settings), 74 palette entries in 8 groups.
  - `properties.json`: 162 CSS properties with value type, keywords, units (the complete list where Pager's two tables disagreed), section, group, `appliesTo` predicate, essentials flag and the one command that writes each; 10 inspector sections; breakpoints (1440/1180/834/390); 7 style states.
  - `interactions.json`: 24 key contexts (with inheritance), 121 named constants with unit and source spec, 35 gestures with one meaning per modifier.
  - `commands/*.json`: 216 commands in 18 domain files, 834 doors. Each command has owner (planned module path), args schema, availability (predicate id and refusal key), refusal keys, optional confirmation, and its doors. Each door has kind, the feature that makes it work, label and disabled-reason keys, placement (`none` for keys and gestures, menu/context-menu orders from the features, `unplaced` otherwise until DESIGN.md) and adapter data (selection normalisation, offered value set as a declared subset of the catalogue with a reason, properties written).
  - `features/NN-group.json`: the 179 capabilities in 20 groups, same order as features.json, each with title key, commands needed, `dependsOn`, spec, `intent` (old title, steps and expected text, guidance only) and `scenarios: []`. The scenario schema is defined (setup, doors, document diff, selection, history, render/persistence/export terminals, refusals; no "exists"/"visible" assertion).
- `src/i18n/locales/pt-BR.json` and `en.json`: 1135 keys, same keys and placeholders in both. `src/i18n/en.ts` reads the JSON; `t()` still returns English, pt-BR wiring is feature `ui-language`.
- The three points the review left open are resolved in the intents and specs: no older saved format exists (schema version from the first save, migrations tested on the real loading path; `autosave-restore`, `explorer-file-system`); while resizing Alt resizes from the centre and Ctrl suspends snapping, and Ctrl is the snap switch in every snapping gesture (`snap-while-moving`, specs `resize-handles`, `snap-while-moving`, `absolute-free-drag`, `spacing-handles`); an opened folder's linked stylesheets are parsed into the document and the .css files stay as unlinked files (`explorer-open-folder`).
- `features.json` deleted after `npm run manifest:map` proved 179/179 ids map to exactly one feature in order and 1202/1206 lines are verbatim (the 4 others are the declared amendments above). The script read features.json from git (`ffecbb5`). Spec citations of features.json now say "manifest feature". The tool and its `manifest:map` script were removed on 2026-09-27 (one-time migration check; it no longer ran — see "Finish pass" below).
- CLAUDE.md and `.claude/agents/evaluator.md` describe the manifest workflow: scenario session then build session per group, build sessions never edit scenarios, status only from the runner, doors only from the manifest, read-only test port.

Decisions taken here (change them in the manifest if the user disagrees):
- Door kinds beyond the brief's list, needed for doors that are neither menus nor drags: `canvas-click`, `canvas-wheel`, `panel-control`, `panel-drag`.
- New bindings where specs asked for one without naming it: Nest into previous = Alt+ArrowRight (canvas); hand "aim at the previous position" = Shift+ArrowDown / Shift+ArrowRight; `history.nudgeBurstWindow` = 1000 ms; one dock-edge zone (80 px) and one tabs/stack split (upper 45 %) for every panel.
- Not edited as properties: `touch-action`, `content`, the `background` shorthand, standalone `rotate`/`scale` (the transform command owns them). `translate` is owned by the anchors command.
- Opening a dropdown menu is not a command; its items are doors. Widget-local state (a slider value before Apply, text being typed) is not a command.

Fragile / worth knowing:
- The manifest was authored with a throwaway generator; from now on edit the JSON directly and keep `npm run manifest:check` green. Door ids are unique per command and referenced by scenarios as `<command>#<door>`.
- `manifest:check` validates structure and cross-references, not product sense. Door placements are `unplaced` until DESIGN.md; owners are planned paths until ARCHITECTURE.md confirms them.
- Every feature is "missing": there is no runner yet. Nothing may write a status.

Next:
1. Write `DESIGN.md` (places every door) and `ARCHITECTURE.md` (confirms every command owner).
2. Build the scenario runner: generates a Playwright test per scenario × door, real input on Chrome, read-only test port, parity across doors, negative control, commit-stamped status.
3. Scenario session for group `01-foundation`, then its build session.

## 2026-09-24 — features.json written

Done:
- `features.json` has 161 entries ordered by dependency, all `"passes": false`. Build them strictly top to bottom. An independent reviewer checked the order three times for forward references, oversized entries, contradictions and tests that later entries would break.
- Found by running Pager and using it in Chrome: served from a copy at `.cache/pager-run` (`node tools/serve.mjs . 8125` inside that folder). Nothing was written inside `reference/`.
- The first entries are the editor layout and structural editing (select, layers, undo/redo, delete, drag reorder/inside, drag level keys, palette drag, layers drag, move up/down, wrap, context menu, unwrap, nest, promote, duplicate, copy/paste, keyboard walk, hand mode).
- Entries for what Pager lacks: `unsaved-work-guard`, `autosave-crash-recovery`, `autosave-corruption-recovery`, `multi-tab-guard`, `clipboard-cut-system`, `clipboard-paste-external`, `keyboard-panel-navigation`, `layers-keyboard-navigation`, `html-import-*`, `code-panel-*`, `timeline-*`, `export-keyframes`, `explorer-*`, `export-multi-page`, `export-assets`.
- `.gitignore` now ignores `.cache/` and `.playwright-mcp/` (the Playwright MCP tool writes snapshots there).

Worth knowing for the work ahead:
- Menus and the context menu arrive before most of their commands. Items for unbuilt features are shown disabled with 'not available yet' (CLAUDE.md rule). Which features are built must come from ONE feature registry, and tests compare the UI with that registry, never with a fixed list, or they break when later features land (tests may never be edited).
- Tests of early entries assert "at least these, in this order", never "only these", for menus and inspector sections.
- The canvas reserves 20 px bands for rulers from the first entry; the bottom workbench dock is closed by default.
- `shortcuts-e2e-sweep` is deliberately last: each keymap row carries its own sweep case.
- Tests need to read the document JSON. Plan a read-only test accessor (or read the IndexedDB record) in the first feature and use it everywhere.
- Pager facts worth copying as behaviour (not code): desktop-first breakpoints 1440/1180/834/390; states Base, Hover, Focus, Active, Disabled, Invalid, Placeholder shown; 95 palette entries = 74 element types + 21 templates.

Next:
- Take `editor-shell`, the first feature with `"passes": false`.

## 2026-09-24 — Project initialized

Done:
- npm project with Vite 8, React 19, TypeScript 6 (strict), Vitest 5, Playwright 1.63 (`channel: 'chrome'`), ESLint 10.
- Scripts: `dev`, `build`, `typecheck`, `lint`, `unit`, `e2e`, `verify:fast` (typecheck + lint + unit).
- `src/config/product.ts` holds the product name. `index.html` has an empty `<title>`; a Vite plugin in `vite.config.ts` fills it from `product.ts`.
- `src/i18n/` has `t(key, params)` and `formatMessage`. All UI text goes through `t`.
- ESLint forbids React imports inside `src/core/**`.
- `tests/e2e/smoke.spec.ts` opens the app in Chrome and checks the page title and the heading.

How to run:
- Dev server: `PORT` is required (`$env:PORT=5300; npm run dev` in PowerShell). Without it Vite exits with an error. 5173 is used by another app on this machine.
- `npm run e2e` starts its own dev server on `E2E_PORT` (default 5310) and never reuses a running server.

Fragile / worth knowing:
- `reference/` has its own HTML entries. `vite.config.ts` restricts `optimizeDeps.entries` to `index.html` and does not watch `reference/`. Without that, Vite's dependency scan crawls Brickflow and complains about missing packages.

## PROGRESS.md state moved here (2026-09-26)

- Drag and drop (moved first by the user): spec/behavior/drag-layout.md gathers what a professional builder's drag does
  (Webflow, Elementor, Framer, Pager). Built: ghost chip for element drags, receiver in the target colour, 3 px line,
  a side drop in a narrow strip of the element under the pointer (drag-side-wrap, element.wrapBeside), autoscroll, drop
  flash, selection label always above; Layers keyboard (layers-keyboard-navigation).
- Finding 38 (resolved by the user, 2026-09-25): the style scenarios start at zoom 100.
- Finding 9 (inspector-fields.spec.ts: wrong drawnAs data passes) still stands; the spec now also found the button
  rows moving their data-door (fixed in the inspector).

## 2026-09-26: group 04 finished (quick-panel, multi-select-edit, color-picker-oklch, color-swatches-eyedropper) and elements-svg-shapes

- quick-panel: 27 scenarios, tooth 35/35 (.cache/logs/e2e-tooth-quick-panel-*); spec tests quick-panel.spec.ts
  (offset kept after a reload, fields that apply) with manual tooth (-off-/-on- logs).
- elements-svg-shapes: 14 scenarios, tooth 14/14; unit tests svg.test.ts (sanitizer, viewBox, geometry, content model).
- multi-select-edit: 3 scenarios, tooth 6/6; spec test multi-select-edit.spec.ts (Mixed) with manual tooth.
- color-picker-oklch: 5 scenarios, tooth 5/5; unit tests color.test.ts; spec test color-picker-oklch.spec.ts with tooth.
- color-swatches-eyedropper: 5 scenarios, tooth 5/5.
- Fixed on the way: computedValues threw on a recipe id (line-clamp) at every frame (test + tooth in
  props-typography-advanced.spec.ts); the chip placed before its label covered neighbours for a frame.
- Block check: .cache/logs/check-group04-final-040624.log; the 29 quick panel runs it failed passed after the chip was
  held inside the stage.

## 2026-09-26: groups 05 (canvas handles), 06 (css-variables-tokens) and 07 (props-element-specific, shared-style-classes)

- Edit on canvas (canvas/edit-mode.ts, canvas/handles.ts, canvas/edit-handles.tsx): spacing-handles tooth 14/14
  (.cache/logs/e2e-tooth-spacing-handles-042857.log), radius-border-gap-handles 12/12 (-044139), shadow-handles 4/4
  (-044726) plus a manual pointer tooth; spacing-handles.spec.ts (bands, Escape keeps the selection).
- css-variables-tokens: 12 scenarios, tooth 12/12 (e2e-tooth-css-variables-tokens-045632.log), manual var() tooth.
- props-element-specific: spec written from Pager (catalogue.js:419-434); 10 scenarios, tooth 10/10
  (e2e-tooth-pes-051302.log); spec test props-element-specific.spec.ts (a kind's field only on its kind, Add a property
  too) with manual tooth (e2e-tooth-pes-filter-off/-on-*); unit tests applies.test.ts (predicates, three codecs).
- shared-style-classes: spec written (Pager keeps classStyles per page with no control and writes them after the
  element rules); 10 scenarios, tooth 10/10 (e2e-tooth-classes-053325.log); manual teeth for the write redirect
  (-redirect-off/-on-) and the sheet order after a reload (-order-off-053518/-on-053529, the spec test's second test).
  The runner gained one rule: a control that opens a field for the text argument its step types.
- The export stylesheet parts the :root and class blocks from the element rules with a blank line, as between rules.
- Block check: .cache/logs/check-group05-07-053557.log: static green, 1162 passed, 5 failed: open findings 39, 41 x2
  and the new 44 x2 (waiting-panels' premise gone). The app used by hand: a class saved, applied, styled as the target,
  named on a field with the Element target, counted in the Styles view; a list's marker fields only on the list.

## 2026-09-26: decisions moved out of PROGRESS.md (still in force)

- Custom CSS declarations accept the properties of properties.json only; Copy refuses the root. The hand's keys act
  with the focus in Layers too. Specs were missing for 17 block-1 features: their scenarios follow the intent.
- The user: no surgical pointing; the label always above; style scenarios at zoom 100 (fitted where at 100 the element
  lies outside the view: SVG, anchors, rotation). Guides are named axis-n; the page's root holds them (/@guides).
- A shortcut runs when its command is built and its feature introduces the command or is registered. The census does
  not click inspector text fields to explore and counts inert controls as not usable.

## 2026-09-26: groups 08-10 (templates and components, panels, view and positioning)

- 08 reusable-components; 10 absolute-free-drag, absolute-nudge, absolute-anchors, align-distribute, rotation-handle,
  guides-manual, workspace-settings-dialog (shell/dialog.tsx, shell/guides-grids.tsx, core/page/grid-settings.ts),
  snap-toggle-settings (editor/view/snap.ts, shell/snap-settings.tsx), snap-while-moving (core/geometry/snap.ts,
  canvas/snapping.ts, canvas/snap-lines.tsx), smart-guides (equal gaps, hints, two switches): scenarios pass, teeth
  shown (logs wsd-*, snap-*, swm-*, smart-* in .cache/logs).
- Runner rules added: numbers in typed fields; an aria-modal dialog is closed before the undo check; a dialog's Apply
  button fills its form's named inputs; a resize or free drag holds the step's key once the gesture began.
- Block check: .cache/logs/check-group08-10-082416.log: static green, 1260 passed, 8 failed (findings 39, 41x2, 44x2,
  45x2, 47). Visual pass in the app: Guides & Grids (6 columns drawn), Snap button, Snap settings kept.

## 2026-09-26: decisions moved out of PROGRESS.md (still in force)

- Dialogs are modal (shell/dialog.tsx): the runner closes an open one before its undo check. Snap settings' Cancel is
  the dialog's close button; Apply closes it. Snap targets: an element's edges/centres need Elements + Edges/Centers;
  ruler ticks and grid lines snap only while shown; smart guides and equal spacing are on by default. Two scenarios
  of snap-toggle-settings and six of snap-while-moving were corrected before their first commit (a stored preference
  first; the kept selection), never after a pass.

## 2026-09-26: group 03 leftovers

- app-menu, project-open-json (port of wip/project-open-json 7aa66f9), new-blank-page, unsaved-work-guard,
  autosave-crash-recovery, autosave-corruption-recovery, multi-tab-guard: scenarios pass, teeth shown (.cache/logs).
- Runner: file argument handed to the chooser and waited for; confirmation answered; setup storage
  (corrupt-current-record), tabs (another-tab-editing), context dialog.
- Block check: .cache/logs/check-group03-091000.log: static green, 1298 passed, 9 failed (findings + one runner race
  since fixed, .cache/logs/open-json-rerun-091601.log 27/27). Visual pass: New blank page asks and Cancel keeps; a
  second tab reads, Take over editing moves the lock.

## 2026-09-26: group 11 (responsive and states)

- breakpoints-switch, breakpoint-overrides, state-styles: scenarios pass, teeth (feature tooths + layer, preview,
  origin by hand; logs g11-*). The store hands handlers the edited layer as rules.base (new elements' defaults use
  rules.baseLayer); editor readers use layeredRules(ui); shownValue gives what a field inherits; the renderer's
  previewState draws the selection with the state applied (its own stylesheet). Menus opened from a button open at
  fixed coordinates (the inspector's overflow cut the State menu). The selector bar names the active state and
  breakpoint (it read the base ones: fixed with a test and its tooth).
- Block check: .cache/logs/check-group11-093700.log: 1317 passed, 8 failed (findings), unit 1 (finding 49).

## 2026-09-26: decisions moved out of PROGRESS.md

- Quick panel: its chip sits beside the selection's label (DESIGN "Canvas"), so it covers no more than the label;
  the open panel goes to the side with the most free space. SVG: the element's name is "SVG" (a "/" broke node paths);
  its viewBox is its px size; shapes keep geometry attributes (elements.json). Saved colours live in the document
  (`swatches`, diff path "/@swatches"), recent ones in the preferences; saving joins the picker's session.
- A field's Reset leaves the Tab order while there is nothing to reset. plants.ts: door-writes-shorthand's door runs in a
  quick-panel scenario. Scenarios name no vendor-prefixed property (spec tests prove a recipe's).
- Export stylesheet: a blank line parts every rule, the :root and class blocks too. A class target returns to Element
  on a new selection; a field of a kind (list, table, form, media) shows only while every selected element is of it.

## 2026-09-26: decided findings moved out of PROGRESS.md

## Decided findings (the user's order of 2026-09-26: decide, record why, tooth for each changed test)

- 39 current-state: built features left 15 unbuilt doors, not the fixed floor of 100: it now expects every unbuilt door
  the manifest places at start, each set side by side compared (tooth: unbuilt doors drawn current are caught).
- 40 door rule applied: isDoorBuilt needs the feature registered; the census fails a door usable without it (13 caught).
- 41 palette-tiles: every palette feature is built; the tests prove every tile usable and inserting (tooth: insert off);
  a door of a feature to come is proven unusable by the census and waiting-panels.
- 44 waiting-panels: New variable built, expected usable (tooth: tokens.create off); Timeline waits (tooth: rule off).
- 45 props-position: absolute-free-drag's couplings are built; both scenarios expect top/left and the relative parent
  too (tooth: handlers off, couplings off).
- 47 Delete is always the context menu's last item (DESIGN and manifest order 99): the scenario holds unchanged.
- 49 check.test plants move or rebind an existing, covered door instead of adding one (tooth: rule off fails each).


## 2026-09-26: audit prompt, block 1 documentation changes (moved from PROGRESS.md)

- 1.1 DESIGN Style tab: "a field never shows a blank: it shows the effective value" -> the document's value as written;
  none there: empty, the effective value as its muted placeholder, nothing zoom-dependent. Spec provenance-reset: + P4.
- 1.2 DESIGN Style 4 "Property search ... reveals" -> Find a property filters; row "3 search result" -> "3 Add a property's item".

## 2026-09-26: audit prompt, block 1 documentation changes, rest (moved from PROGRESS.md)

- 1.3 text-shadow effects/shadow -> text/typography; DESIGN "Text" -> "Text (with the text shadow)", + Add a property rule.
- 1.4 DESIGN Build order + "a disabled control is drawn clearly disabled; the quick panel leaves out an action that
  cannot act; a field draws its Reset only while there is a value"; specs quick-panel P8, provenance-reset P5.
- 1.4 decision: Canvas/Split/Code stay drawn, clearly disabled, none pressed (an unbuilt door never stands for a
  state: ARCHITECTURE Door rendering, current-state.spec); Canvas shows pressed once code-panel-view (group 17) is built.
- 1.5 spec undo-redo P2 "the status reads exactly Undone or Redone" -> "Undone/Redone with what it undid"; + P3.
- 1.6 DESIGN field component + "a refused value is said beside the field"; spec inspector-number-fields P3.
- 1.3 (block 1 real-use pass): Escape left the Add a property list open. Spec inspector-add-property + P4: closed as
  every menu (Escape, backdrop, focus back to +); its filter a combobox of the menu key context (arrows, Enter).

## 2026-09-26: audit 2.1 documentation (moved from PROGRESS.md)

- 2.1 spec drag-reorder-canvas P5 + "an ancestor's escape band wins over a side drop inside it". Own new scenarios,
  never green, corrected: y equals CardA -> y < CardA + 24 (a p's 16 px margin); inline-block cards set one by one.

## 2026-09-26: audit block 1 A items documentation (moved from PROGRESS.md)

- A1.1 spec zoom-wheel-pan P2 "Space pans ... no text field has focus" -> also not a control the keyboard focused
  whose Space runs (palette tile); a click-focused control never keeps Space. elements-lists spec + 8 scenarios.
- A3.41 decision: "every preference change reports" = settings chosen in menus/switches; folding sections, groups or
  branches is layout state and stays silent; a long message is cut, the other status items keep their size.
- A3.32 spec inspector-number-fields + P4: a bare number takes the field's default unit (was: the unit held; set.ts,
  set.test, number-field.test, inspector-number-fields.spec (a burst is one step; Playwright clock splits bursts)
  updated; 7 props-filters-clip scenarios retired for their bare-number-in-% twins (same computed factor).
  Spacing box: its own key context (spacing-field), Escape runs field.cancel for the box.
- A3.23: View › Explorer -> layers-tree; View toggles checked; plural message params; Distribute own predicate and
  reason (a door's reason is its predicate's refusal); distribute-needs-three-elements retired for
  distribute-availability.spec; workspace-doors tests View › Explorer working. Decision: Help keeps its one item
  disabled (door rule) until shortcuts-panel (group 13, mine); Paste waits for item 3.8.
- A3.38 text-edit-inline P4: emptied text keeps a min height, dashed mark, Layers "empty" (image part: no repro).

## 2026-09-26: audit A3.10 documentation (moved from PROGRESS.md)

- A3.10 spec
  provenance-reset P6: origin note per field (class muted, others in legend colour) + "Typing writes to X · layer".

## 2026-09-26: the Codex lane (moved from PROGRESS.md when the Codex left)

- 2026-09-26: Worktree `builder-codex`, branch `codex`; first commit `4a49cc1` adds the lane instructions.
- 7.1 baseline reproduced in the in-app browser from 92bb39b: flat Settings, blank Button type, invalid attributes/values, stale link data, class target, Label/Select, inline text and missing fields. Evidence: `.cache/logs/uso-7.1-20260926-1459/antes/`.
- 7.1a current app: General/Link/Attributes for a link and `submit` default on a button in Desktop/Phone at 100%/Fit; undo/redo, reload and adjacent drag checked, zero console errors. Evidence: `.cache/logs/uso-7.1a-20260926-1519/`.
- Previous Settings layout: one flat attribute list; new layout: manifest-driven General, Link, Image, Accessibility, SEO and Attributes sections.
- 7.1a delivered as `5343759` on origin/codex: `settings-organized.spec.ts` and its UI tooth passed, plus 32+36 nearby scenarios and four-combination real use; logs in `.cache/logs/`. The class-registry write was deferred to 7.1c so the old Classes scenario stays green.
- 7.1b spec correction: page-properties P3 formerly accepted any language-shaped tag; now a known BCP 47 language or valid private-use tag is required, so `banana` is refused beside Page language.
- 7.1b verified: type-specific refusals and local errors, type-switch loss warning, native date/colour/range controls; 6 focused browser tests, 9 existing scenarios, 16 unit tests and three direct document-diff teeth passed. In-app browser Desktop 100%/Phone Fit, undo/redo/reload/Preview, ZIP and file URL render, console 0: `.cache/logs/uso-7.1b-20260926-1622/`. Broad `npm run check` is deferred to the block-end suite by the user's latest order.
- 7.1c contract correction: DESIGN Styles and shared-style-classes formerly said the class list was read-only; now Rename/Delete change one project registry. The committed `props-attributes` scenario `the-classes-field-stores-a-list` expected only element classes; it is retired in favour of `settings-classes-field-registers-project-classes`, which also expects project definitions and keeps the same undo/reload claims. Its door now belongs to `settings-class-management`; the new scenario passed and failed with the handler disabled.
- 7.1c browser-test correction: shared-style-classes previously asserted the whole Styles row text `.band2 elements`; the class name is now an editable input, so the stronger assertion checks the Rename field value `band` and the use-count text `2 elements` separately. Tooth proof is required before delivery.
- 7.1c verified: six targeted scenarios pass; all six fail with feature handlers off. Two focused UI tests and the Styles count regression pass; the changed row assertion fails directly when its count text is mutated and passes when restored (`tooth-7-1c-style-row-*.log`). Typecheck, lint, nine targeted unit tests and manifest check pass. In-app browser Desktop 100% and Phone Fit: class creation, target selection, rename/delete/undo, reserved attribute refusal, reload persistence, console 0 (`.cache/logs/uso-7.1c-20260926-1705/`). Broad check deferred to block end.

## 2026-09-27: audit 2.2, documentation changed (moved from PROGRESS.md)

- 2.2: drag-reorder-canvas P6 new (bands in screen px, were CSS px; an escape band <= 1/3 of its ancestor, capping P4's
  6 px floor; a flex/grid child never climbs the ladder); drag-drop-inside P5 new (empty container aim 40 screen px).
  drop.test.ts: Actions 20 -> 40 px tall, points y 108 -> 125 and 20 -> 35, escapeBand(11, 0.5) 8 -> 11/3; runner
  drop zones in screen px. The Codex left (2026-09-26): its lane notes moved to docs/history.md.

## 2026-09-27: audit 3.1/A3.14 and 3.2, documentation changed (moved from PROGRESS.md)

- 3.1/A3.14: drag-reorder-canvas P7 (own drop colour #2563eb/#60a5fa, 3 px bar, source outline neutral, label clear
  of the ghost) and P8 (pointer capture, cancel on pointercancel/lost capture/stale press). Tests: line position read
  at the bar's centre (line.y -> line.y + line.height / 2) in drag-drop-inside, drag-level-keys-escape,
  drag-reorder-canvas, palette-drag-insert, hand-keyboard-move. A key path in the frame was dropped: a press brings the
  focus back to the editor, and a focus moved into the frame ends the gesture (window blur).
- 3.2 per the user (2026-09-27): no preview of the drop (a reflowing space flickered; a dashed overlay got in the
  way). P9: only the line; the page never moves; stable under a resting, trembling hand (drop-rest.spec).

## 2026-09-27: audit 3.7 and 3.8, documentation changed (moved from PROGRESS.md)

- 3.7: marquee-select spec: "Candidates: every descendant ... a leaf when touched, a container only when held
  entirely" -> "Our rules" (the direct children of the container where it started, each one it touches; Alt the
  leaves; Shift on an element; locked, in-a-lock and hidden left out and counted) and Problems in Pager 3 and 4;
  Nested elements rewritten. DESIGN.md canvas states: a "band" row. manifest: the marquee gesture gains Alt
  "take-leaves"; selection.marquee gains the args leaves and target and the door canvas-drag-shift-on-element.
- 3.7 tests: 4 new scenarios (the cards, the Shift siblings, the Alt leaves, the locked card left out);
  marquee-select.spec.ts: the container test's expectation gains n-actions (the band reaches Hero's third child now);
  the container/leaf test became the Alt test (same expectation, same status; tooth: 6 of 6 fail with
  selection.marquee off). Decisions: a press on a container's own area keeps working inside it (Shift or not, the
  committed scenario shift-band-adds-to-the-selection holds); Alt alone names no mode and keeps the plain one.
- 3.8: clipboard-copy-paste spec: Problems in Pager 2 kept (the system clipboard is written and read) and a new
  Problems in Pager 4 (the read may be refused: the editor keeps its own copy and a paste falls back to it; the
  system clipboard is the complement); ARCHITECTURE.md's System clipboard row says the module keeps the editor's own
  copy; the manifest's feature intent follows; the scenario setup gains the optional `clipboard: "denied"` (schema,
  consumers.json, the runner) with the scenario paste-finds-the-editors-own-copy-when-the-browser-denies-the-clipboard.
  Decision: the system clipboard is read first when it holds something readable (what the person last copied
  anywhere), the editor's own copy answering otherwise. Tooth: 6 of 6 fail with clipboard.copy and clipboard.paste off.

## 2026-09-27: audit 3.9, A3.19 and A3.28, documentation changed (moved from PROGRESS.md)

- 3.9/A3.19: layout.json gives the layers panel `in: null` (the sidebar's stack under every view) and declares the
  splitters (`sidebar-stack`); the schema and the manifest:check section rule learned `in: null` (the stack); DESIGN.md
  needs no change (the sidebar/stack was already "collapsible", spec panel-resize). The palette-drag scenarios' steps
  gain an optional `drop.on: "layers-row"` (schema, consumers.json, the runner's point) so a tile's drop on a row is
  the same gesture released over the row; the runner drags a splitter along its declared axis.
- 3.9/A3.19 tests: 4 new scenarios (the splitter drag with a reload, two arrows, the two across the axis) and, in
  palette-drag-insert, a-tile-dropped-on-a-layers-row-lands-inside-it. Tests that read the old layout follow it
  (before/after in the chat): six explorer-layers region heights "greater-than 300" -> "equals 260"; three
  layers-row-details "y greater-than <n> below layers-row" -> "x greater-than 0" (the details are drawn beside the
  row); expand-every-branch's layers-row height "> 400" -> "> 230" (the tree fills the panel's stack now, not the
  page); layers-tree.spec's row walk reads the drawn window; workspace-doors.spec and waiting-panels.spec assert the
  Explorer's body goes while the Layers stays; the fold test asserts the folded section keeps the title alone.
- A3.28: the Layers draws the rows of its window alone (18 rows where 1564 were drawn, 284 DOM nodes where 20 926),
  the first and the last row always kept for the keyboard's Home and End; the tree scrolls with the focus (never with
  a pointer press, which would move the row under the pointer away from its own context menu); the row indent is
  capped at eight levels. The runner and the specs scroll the tree to a row before addressing it (a row outside the
  window is not drawn), each step waiting for the editor to lay the new scroll out. Measured on 1461 elements: a
  Layers row click 147 ms and a Style edit 53 ms to the frame after them (< 150 and < 100, the audit's acceptance).

## 2026-09-27: audit A3.18, documentation changed

- A3.18: the canvas chrome loses three rows (the audit measured 689 px of visible page at 1440×900, its acceptance is
  779): the file-tabs row draws only with more than one page (the audit's "só com mais de um arquivo aberto ou na vista
  Código"; the Code view itself is not built yet), the breakpoint tabs move from over the frame into the canvas
  toolbar with a width of their own (a new region `canvas-breakpoints`; the frame keeps `canvas-frame`, which now
  belongs to the frame element itself, so every test that measured the frame through it keeps its meaning), the dock
  draws no strip while it is closed (its panels stand as icons in the status bar: a new door
  `workspace.setPanelOpen#status-bar-timeline` with its scenario; the Checks icon waits for the Checks panel's body,
  which is not built), and the fit margin falls from 24 px to 8 (`zoom.fitMargin`). A new region `canvas-stage` names
  the room the canvas shows.
- The workspace survives a reload (A3.18's third acceptance point): src/editor/workspace/persist.ts keeps the panels
  and the layout under the 'workspace' storage key, validated against the manifest on read.
- Measured: 780 px of page visible (from 689), the Phone tab clickable and legible at any zoom (the tabs live in the
  toolbar now), the Insert view, the folded Layers and the splitter size all kept across a reload.
- Tests that read the old chrome follow it (before/after in the chat): 18 file-tabs region expectations become
  canvas-toolbar (the same centre column), 5 fit widths gain the 32 px the smaller margin gives back, one fit
  feedback 57% -> 59%, the wheel scenario's window shifts 20 px, the workbench-panel scenarios open the dock from
  View before the strip's buttons act (and two folded ones assert the room the canvas gains: the stage > 779),
  door-state, waiting-panels and workspace-doors open it the same way, and the toolbar metric leaves the
  breakpoints' own group out.

## 2026-09-27: audit 3.10 and 3.11, documentation changed

- 3.10 (drag-autoscroll): the behaviour existed in the pointer owner with no spec, no feature and no test. New spec
  spec/behavior/drag-autoscroll.md (the Pager references: drag.js:954, :1054-1083, measure.js:48; Problems in Pager 1-3:
  one autoscroll owned by the pointer, the Layers scrolling too, and the arming rule), the feature `drag-autoscroll` in
  02-structure-editing.json (no commands, toothProof src/editor/input/pointer.ts) with its scenario
  a-drag-held-at-the-bottom-edge-scrolls-the-page-under-the-pointer, and the constants drop.autoscrollZone (56) and
  drop.autoscrollMaxStep (22) now sourced from the spec. The runner's step gained `wait` (a pause after a held step,
  for a pointer that rests at an edge).
- 3.10 code: the autoscroll scrolls the Layers tree as well (its own box, its own arming), and a scroller that moved
  takes the drop proposal again (dragging.takenAt = null): the drag's hysteresis had kept the proposal taken before
  the scroll, so a release after a scroll landed where the page had been, not where it was. The runner's drag now
  rests a frame after the threshold move (a drag lives across frames: the per-frame arming reads the pointer where it
  passes) and scrolls a Layers tree to a row a step names before clicking it.
- 3.11 (one wrapper by every path): elements.json's wrappers own the layout — the row's column-gap 16px, the column's
  row-gap 16px, and the row's children grown alike (childStyles: flex-grow 1, flex-basis 0px, so the widths are equal
  whatever the children hold). The wrap commands and the side drop read both (withChildStyles in wrap.ts); the Row and
  Column templates take their root styles from the same wrappers, and the Row template's two authored columns carry
  the children's pattern as well. The side drop's label names the visible result ("Side by side: {name} beside
  {target}", "Stacked: …" in a row parent), the user's remark of the same day. wrap-row-column P5 and
  templates-layout P1 record it; drag-layout row 5 carries the new label.
- 3.11 tests: the 15 wrapper expectations and 15 feedback strings in 02/03/13 gained the wrapper's styles and the
  children's (childStyles); the Row template's scenario gained row-gap and flex-basis on its columns; wrap.test.ts's
  four cases assert the wrapper, its child styles and the column that writes none. The tooth-plugin fix: the proof
  leaves a const binding alone (a module with constants still builds; the behaviour is its function), which unblocks
  the teeth of the four features that name a module (render, autosave, rulers, pointer).
- Measured in the open app: R on a paragraph gives Row(display flex, row, column-gap 16px) with the child flex 1 1
  0px; the side drop beside a Grid gives Row 3 with two children 704 px each and the gap 16; a drag from the top of
  a 2726 px page held at the bottom edge scrolled it to 1408 and the release put the Title into the Footer.

## 2026-09-27: block 1's checkpoint, the open failures it carried fixed

- The room rule (interactions.json resize.handleRoom, spec resize-handles, the user's real use) tested the handle's
  whole name: "resize" carries an s and an e, so every handle asked for both dimensions and a short element drew
  none. chrome.tsx's roomFor reads the side (handleSide) - the bug that left nine resize tests and the whole
  geometry.resize family red.
- PAGE_REGIONS gains canvas-breakpoints and canvas-stage (A3.18 gave the canvas a region of its own; the
  state-placement rule must refuse it as it refuses the frame).
- A DoorControl writes the args its manifest declares over the ones its context adds (the status-bar Timeline icon
  had none, so nothing could name it; the dock test follows A3.18's collapsed dock: its panel is reached from the
  status-bar icon).
- The scenarios that resize a small element follow the rule (the requests of the checklist's resize-handles and
  elements-svg-shapes): the corner scenarios write 600x60 first (their diff and undo count carry the writes), the
  shape scenarios work at 200% and pan by the middle button (a scenario step, view.pan#canvas-drag-middle-button-stage),
  and the escape scenario pins the width the cancel left (equals 600, stronger than the old greater-than 1300).
- drop-indicator.spec presses the east handle and measures it against the side its door names; editor.ts's openEditor
  takes reusedProfile (a second page shares its context's profile); ensurePanel clicks a view's toggle only while the
  control says the panel is closed (the workspace keeps the view across a reload, so the old toggle closed it).

## 2026-09-27: audit 5.1, the inspector's context (first part)

- The applicability predicates that read the layout an element is in were declared in properties.json (flexContainer,
  flexOrGridContainer, gridContainer, flexItem, flexOrGridItem, gridItem, container, multicol, scrollContainer,
  snapChild, positioned, staticBox, transformed, perspectiveContext, inlineOrCell, fragmented) and never consulted:
  applies.ts answered null for them, so every flex, grid, multicol, scroll and position field showed everywhere.
- applies.ts gains contextPredicate and shownForContext (spec props-element-specific, "Our rule", extended with the
  predicates' definitions) and properties.json a `context` section naming the values they read (its schema and
  consumers entries): the inspector reads the selection's and its parent's computed values on the canvas
  (useSelectionContext) and hides what does not apply. A context the editor cannot read hides nothing.
  DESIGN.md's inspector section records the rule.
- Tests: applies.test.ts gains the predicates' cases (13 in all); inspector-panel.spec.ts a card in block shows
  display and no flex or grid control until flex is chosen, a grid chosen on its parent brings its own controls and
  its child's grid column, and the tooth bites (with shownForContext off the test fails, "Received: 4").
  The scenarios whose property needed a container now set it first: props-more's four column-rule/column-fill
  scenarios write the columns composite (2) before, the two scroll ones write overflow-y hidden, and
  scroll-snap-align writes its parent's overflow and snap type (undo counts follow: 2, 2 and 3).

## 2026-09-27: 5.1 second part, the sections' order, and the panel's height measured

- properties.json's sections take the order of use the audit asks for: content, layout, space, size, position, text,
  paint, border, effects, interactions (Text before Paint and Border; the other sections keep their order). The
  inspector-panel test that reads the order reads it from properties.json, so it follows by itself.
- The panel's height on a card (1440x900, All properties): 4762 px, 5.7 screens, where the audit measured 5882 px,
  about 9 screens, and asks for at most 4. The context rule (the commit before) is most of the gain: a card in block
  no longer draws the flex, grid, multicol, scroll or position fields. Effects (1221 px, 44 rows) and Text (697) are
  the two that remain largest.
- A pairs layout (two short fields in a row, Size and Text) was built, measured at 4358 px (5.2 screens) and taken
  out again: the inspector is 277 px wide (A3.45: panel-resize, group 13), so a half-width row leaves the control
  too narrow to use, and the field steps stopped writing (41 scenarios failed on it). The height work waits for
  panel-resize, and PROGRESS carries the measurement.

## 2026-09-27: audit A3.24, the keyboard and the accessible names of the Style tab

- Every Reset and unit control names its property ("Reset Width", "Unit of Width"; field.reset.of and field.unit.of
  with the property's own label), which is what a screen reader reads; their disabled reasons are their own
  (field.reset.none, field.unit.none) and no longer the expression reserved for unbuilt features.
- A segmented group and the alignment matrix hold one Tab stop between them (DoorControl's `roving`: only the current
  control is in the Tab order; a mixed matrix keeps its first cell), so Tab walks the fields and not every arrow. The
  number fields and the track and grid item fields are spinbuttons to assistive technology.
- Test: inspector-panel.spec gains "Display to Wrap costs two Tab stops, and a reset names its property" (the four
  direction arrows hold one stop, the next stop after them is Wrap, and the Reset of a set Width reads "Reset Width"),
  with its tooth (with the naming off the test fails on "Reset this value").
- The catalogue's "Column span" (column-span, the multi-column property) reads "Span in columns" / "Abrange colunas"
  so it is not taken for the grid item's span (A1.3); the props-more scenario that asserts the message follows.

## 2026-09-27: audit A3.31, coupled properties and the doors that mean "away with it"

- One owner takes a declaration away: `removeStyle` (`src/core/style/reset.ts`), the body of `style.reset` lifted into
  a function. "Remove filters" (`style.setFilter` with `functions: "none"`) and "Remove the gradient"
  (`style.setBackgroundImage` with the edit `reset`) route to it, so neither leaves a `filter: none` or a
  `background-image: none` in the document or the export. Both doors keep their command and their arguments, so the
  two scenarios keep their door and their tooth; only their expectation changed: the old `set …: none` op becomes the
  absent declaration (the whole-document comparison fails on an extra key), and the feedback names the reset
  (`status.style.reset`), not a write. Raw proof: T1 teeth with `removeStyle` returning immediately showed the three
  scenarios failing on the document ("background-image: not expected, found …", "filter: not expected, found …",
  "column-rule-width: not expected, found …"), restore and 60 pass
  (.cache/logs/e2e-tooth-removeStyle-*.log).
- With it, a declaration a coupling filled in goes with its trigger while it still holds exactly the coupling's value:
  resetting `column-rule-width` takes the `column-rule-style: solid` the coupling wrote, so no orphan rule style
  draws a medium rule in the export; a style set otherwise keeps its value. Scenario
  props-more#resetting-the-rule-width-takes-the-rule-style-with-it; the tooth showed exactly the orphan
  ("column-rule-style: not expected, found \"solid\"") with the rule off.
- The line clamp recipe over a display the element holds its own is refused before anything is written (`style.set`
  reads `recipeFacts` and names the recipe and the property in the way; status `recipe.conflict`); the scenario
  props-typography-advanced#a-clamp-over-a-display-of-its-own-is-refused failed with the refusal off ("Line clamp of
  Intro: 3." written instead, the document changed) and passes with it.
- `position.setMode` back to `static` or `relative` takes the inset longhands the element holds its own, in the same
  undo step: the document and the export hold no dead top/left that would resurface at the next absolute. `z-index`
  (it acts on a later positioned state) and the parent's `position: relative` (the containing block of any absolute
  descendant) stay; the reasons are in props-position's "Our rule". Scenario
  props-position#back-to-static-takes-the-top-and-left-away failed with the cleanup off ("top: not expected, found
  \"170px\"", "left …") and passes with it.
- Break after and break before keep refusing `avoid`, `avoid-page` and `avoid-column` — the audit asked for them,
  but BCD notes for Firefox and for Safari that the value is recognized and has no effect, so a page exported with it
  would break where the editor promised it would not (break-inside offers `avoid` because all three act on it
  there). The subsets' own `reason` text now names this with the evidence; manifest:check's browser-support rule is
  the one that refused the wider list.
- Specs: "Our rule" sections added to props-filters-clip, gradient-editor, props-more, props-position and
  props-typography-advanced, each naming the item. One committed sentence changed: gradient-editor Problem 1 said
  "removing the gradient returns `background-image` to `none`", now "takes the `background-image` declaration away,
  so the element shows its default again (`none`)" (PROGRESS, documentation changed).

## 2026-09-27: audit A3.30, the ready values and the guided controls

- **A slider a door declares.** properties.json's controls carried `slider` for opacity since the first build and no
  door drew one; `commands/style.json`'s inspector-field doors now have `slider: {min, max, step, unit}` (schema.ts,
  with min < max enforced and each field naming its reader in consumers.json), and the field draws a range beside its
  text (field.tsx): opacity 0–1 by 0.01, blur 0–40px, brightness/contrast/saturate 0–200 %, grayscale/invert/sepia
  0–100 %, hue-rotate 0–360deg, the five radii 0–200px. `.field__slider` takes 45 % of the value's row (a first
  `flex: 1 1 0` measured 0 px wide: the text input's `width: 100%` left the slider no basis to grow from).
- **The release is the write.** The pointer owner learned the slider (registerSlider; a press on a registered range is
  a `sliding` state of its own, nothing runs while the pointer moves, the release calls the field's commit — the same
  command the text field uses), so a whole drag is one undo step and the canvas is written once. The unit written is
  the one the shown value carries (a `50%` blur stays a percentage); a value no slider can read leaves it disabled
  with its reason as the tooltip.
- **The ready values.** properties.json's `presets` subsets and the doors' `offers.presets` (the mechanism
  DESIGN.md already described) got their first values: the aspect ratios (16 / 9, 4 / 3, 3 / 2, 1 / 1, 21 / 9,
  9 / 16) and the transitions (all 200ms ease, all 300ms ease-in-out, opacity 200ms ease, transform 300ms ease,
  background-color 150ms linear). The project's variables of the field's kind were already suggested as var(--name).
- **The Autocomplete list.** The field suggested nothing while its validator read a closed token list: the manifest
  now holds one list (`elements.json` `autocompleteTokens`, 63 HTML tokens: the field names, the modifiers home,
  work, mobile, fax, pager and the prefixes shipping, billing, section), the attribute's keywords are that list, and
  `invalidForNode` reads a value token by token, so `shipping email` is accepted and `banana` refused. `form`'s own
  autocomplete (on/off only in the HTML data) got its own entry (`formAutocomplete`).
- Tests: inspector-panel.spec "the opacity slider writes what the pointer releases on, in one undo step" (a real
  mouse drag; held: the thumb moved and the document did not; released: the value, one undo step, the status) and
  "Aspect ratio offers the ratio presets and writes the one chosen"; settings-validation.spec "Autocomplete suggests
  the HTML values". Teeth (point edits, each shown failing then restored): the release without its commit ("the
  release wrote it" fails), presetsOf returning nothing ("16 / 9 is offered" fails), the attribute's keywords emptied
  ("the field suggests a list" fails). A new scenario, props-transition#the-transition-preset-of-all-200ms-ease-
  writes-its-longhands; the props-transition suite 6 passed, props-size-overflow + inspector-panel 46 passed,
  css-support 1 passed.
- The app, in Chrome (.cache/logs/uso-a330-114352): the opacity slider dragged with the mouse wrote `Opacity of Hero:
  0.89.` in one undo step, nothing written while held; the Aspect ratio field listed 16 / 9, 4 / 3, 3 / 2, 1 / 1,
  21 / 9, 9 / 16 and wrote `aspect-ratio: 16 / 9`; the radius fields drew their sliders; no console error.
- Specs: "Our rule" sections in inspector-number-fields.md (the slider and the ready values), props-size-overflow.md
  and props-transition.md; settings-audit.md's attribute paragraph now names the token list. DESIGN.md: the presets
  sentence and the field paragraph name the slider and its write on release.

## 2026-09-27: audit A3.34, the shadow layers and the background layers

- **A layer's row reads as words.** `shadow.tsx`'s rows showed the raw CSS ("Shadow 2: rgba(15, 23, 42, 0.24) 0px
  4px 12px 0px"); each row now shows the layer's colour as a swatch and one line of words (`inspector.shadow.summary`,
  "0px, 4px · blur 12px · rgba(…)" — the full text in the row's tooltip), with Inset and a hidden layer as tags
  beside it, and the row is the drag handle (`cursor: grab`).
- **A layer is dragged to reorder.** `style.setShadows` gained the edit `{ move: { from, to } }` (both ends clamped;
  a move that names no numbers is refused), and the pointer owner learned the row drag (a `panel-drag` door of source
  `box-shadow-row`/`text-shadow-row`, gesture `shadow-layer-drag`; the press carries the rows' boxes, every move
  cancels the gesture back and dispatches the move for the row the pointer is over, the release commits): the document
  and the CSS write the new order and the whole drag is one undo step. New scenarios in shadow-editor (both
  properties), and the runner moves a `shadow-rows` drag vertically (VERTICAL_ZONES).
- **The editors are titled.** The inspector titles an editor with the property it edits (the property's own label:
  Box shadow, Text shadow), drawn once before its first control, when the door's target draws a whole editor
  (`editorTargetOf`).
- **A layer's controls are drawn only with a layer.** With no shadow the editor shows Add a shadow, the Text shadow's
  CSS field and "No shadow yet."; the Hide and Remove buttons of a layer that does not exist are gone.
- **The background image holds several layers.** `splitLayers` (codecs.ts) parts them at the commas outside
  parentheses; the image codec reads a list (each layer a gradient or a safe address, none `none`), the gradient editor
  edits the first gradient layer in its place (`gradientLayer`), Add prepends one over the image, and Remove the
  gradient takes its layer away and keeps the rest (the declaration goes only when nothing is left). Scenario
  gradient-editor#adding-a-gradient-over-an-image-keeps-the-image-under-it (the document holds
  "linear-gradient(…), url(…)" and the computed value matches).
- **The Quick Panel's field is named by what it shows**: `quick-panel-fill-gradient`'s label is the property's
  Background image (quickPanel.fillGradient dropped; DESIGN.md's quick panel list and the terms paragraph follow).
  Test in quick-panel.spec.
- Teeth (point edits, shown failing then restored): the move off ("document" fails for both new scenarios), the
  codec's list read cut to one layer (the stack scenario fails on the document), the field's name put back to Fill
  ("Expected Background image, Received Fill"). A3.30's regression found by the wider run: the radius sliders wrote
  "0px" when a field lost the focus without a slide — `keepSlide` now writes only when the value holds a number and the
  thumb actually moved; gradient-editor, props-background, shadow-editor, quick-panel and border suites 170 passed.
- The app, in Chrome (.cache/logs/uso-a334-120000): two box shadows added, the second row dragged above the first with
  the mouse swapped the layers (["2px","12px"] -> ["12px","2px"]) with the new CSS in the status bar, both editors
  titled, the rows showing swatches and words; no console error.

## 2026-09-27: audit A3.43, the contrast, the targets and the states

- The acceptance is an automatic measurement, so it is a test: `tests/e2e/accessibility-audit.spec.ts` walks every
  visible element the editor draws (the All-properties panel, a card selected) and reads what Chrome computes — each
  text's colour against the first opaque surface behind it (4.5:1, 3:1 from 24 px), each control's box (24 x 24 at
  least), each clickable control's cursor — and asserts the three lists are empty. The first run found what the audit
  found: 67 controls with `cursor: default` (the base rule said so) and a focused field whose border never changed.
- Fixes, all from the tokens (`--color-border-strong`, `--color-focus`, `--color-danger`, `--color-text-subtle`):
  `button { cursor: pointer }` with `not-allowed` when disabled; a text field's border takes `--color-border-strong` on
  hover and `--color-focus` on focus — the focus rule needs the same specificity as the hover one
  (`.input:focus:not(:disabled)`) or the hover wins while the pointer rests on the field; the refused value's
  `--color-danger` outline was already there. The disabled Interactions tab (text-subtle at 45 % opacity) against an
  inactive one (text-muted, opaque) is the test's second case: rest, hover, focus and error told apart, and a disabled
  control is not a quiet one.
- Teeth (point edits, shown failing then restored): the pointer cursor back to `default` (the measurement fails on
  "controls that take a click without the pointer cursor"), the focus border removed (the state test fails);
  the focus test first compared the focused border to the *rest* one, which passed while the pointer still hovered the
  field — it compares against the hovered state now. The caption size (10 px) is kept as the token says: the
  acceptance measures contrast and targets, both green.
- The app, in Chrome (.cache/logs/uso-a343-121339): the Width field's border read #262b33 at rest, #363d48 on hover,
  #5fe0cf focused, its outline #ff6b6b with "abc" refused and the message beside it; the Interactions tab
  rgb(135,145,160) at 0.45 opacity against Settings rgb(168,176,189); no console error.
- DESIGN.md's "Density and tokens" carries the rule now (the cursor, the states by token, the measurement test).

## 2026-09-27: items 5.2 and A3.33, the lists, the units, the variables and the shortcuts

- **The unit menu is short.** `src/core/style/units.ts` owns the units a person reaches for (px, %, em, rem, vw, vh, ch)
  and which of them a property offers; the menu draws those and one **More units** item that reveals the rest of the
  units and the property's keywords (Font size: seven items, then sixty-one). The runner opens More units itself when a
  step's unit waits behind it, so the committed unit scenarios kept their steps untouched.
- **A list field opens every value.** A field whose control is a keyword menu or a font menu draws a button
  (`.field__values-button`) that lists every value it offers — generated plus presets — whatever the field holds, with
  the value held checked; the font weights read by name ("Thin 100" … "Black 900": `value.font-weight.<n>` in both
  locales, `hasText`/`useValueLabel` in the i18n runtime). Text align offers its four (left, centre, right, justified)
  in Essentials (a declared subset) and every value in All properties.
- **The free declarations take a custom property and a shorthand.** `custom.ts`'s parser accepts `--name: value` (the
  document validator too: a `--name` is the person's property) and a shorthand an owner reads (`background: …`,
  `border: …`), expanding it through the composite's codec into the longhands it stands for. Scenario
  props-attributes#a-custom-property-and-a-shorthand-are-taken (a `--brand` and `padding: 4px` become the four
  paddings, computed 4px).
- **A project variable in a colour field**: props-typography#a-project-variable-is-taken-by-a-colour-field writes
  `var(--color-1)` (the variable the Variables view's Add button offers) and the canvas resolves it to rgb(0, 0, 0).
- **The wart the audit's case walked into**: with text typed but not committed, clicking the field's own opener (its
  values list, its unit menu) lost the click — the blur commit re-laid the row out mid-press (the reset appears, the
  field narrows) so the release landed on another element. `keep` now commits one task later (`window.setTimeout(…, 0)`)
  in both field kinds; the number-fields spec's Tab case still holds (its own test passes untouched).
- Tests: inspector-panel.spec "the unit menu keeps its list short, and a value field opens every value" (seven items
  before More units, more after, every Display value with "block" typed, the weights by name); the unit-menu scenario
  test in inspector-number-fields now opens More units and expects its seven first. Teeth (each shown failing, then
  restored): the short list off (the count fails), the values button off (the list is not found), the shorthand
  expansion off (the document fails), the commit deferral off (the list is not found). Suites: 30 field-heavy tests,
  204 across the touched features, 8 inspector-number-fields, 654 units.
- The app, in Chrome (.cache/logs/uso-a333-124711): the Font size menu listed seven units and sixty-one after More
  units; Display's list showed all twenty-two values with "block" typed; the weights read "Thin 100"…"Bold 700"; the
  declarations wrote "CardATitle has 5 declarations." (the --brand and the four paddings); no console error.
- Specs: "Our rule" sections in inspector-number-fields (the short unit menu), props-attributes (the declarations),
  props-typography (the lists, the names, the deferral); DESIGN.md names the open-list button and the short unit menu.

## 2026-09-27: item 5.4 and audit A3.36, the states an element kind stands on

- `properties.json`'s states name the element ids each stands on (`elements`, null for every element) and six were
  missing: focus-visible, visited, first-child, last-child, before (::before) and after (::after) — thirteen states
  now, each with its menu door. The State menu offers only the states of the selected element (a paragraph lists no
  Disabled, Invalid, Placeholder shown or Visited; a link lists Visited), the canvas label names the state being edited
  ("Heading 2 · Hover", chrome__state), and the validator refuses a stored layer of a state its element does not take
  (ModelRules.stateElements) — so the export and the canvas write no rule a browser ignores (:disabled in an h2's CSS).
- The preview for a class target: while a state other than Base is edited, the preview stylesheet applies the selected
  nodes' own values of that state and those of the classes they wear, after them (A3.36's "a class target's hover was
  not drawn").
- The three committed scenarios that applied :disabled, :invalid and :placeholder-shown to a paragraph were retargeted
  to a form control (inserted into the Actions container; the layer holds the value, the control computes its colour) —
  the states they name are the states of an input; their assertions stay as strong and now cover the insert too.
- Tests: two in responsive-and-states.spec (a paragraph's menu leaves out Disabled/Invalid/Placeholder/Visited and
  keeps Hover/Focus/Focus visible/First child/Last child/Before/After; a link's menu offers Visited) and the label
  test; teeth (each shown failing, then restored): the menu filter off (Disabled comes back), the label's state off
  (the element is not found), the validator's per-kind rule off (the validate unit test fails). state-styles 14
  scenarios, responsive-and-states 4, units 654.

## 2026-09-27: item 6.1 and audit A3.8, the Quick Panel's fields and one context for every style door

- **A3.8**: `geometry.resize` wrote straight into the element's styles (`writeDeclarations`), so with a class as the
  style target a handle's drag landed on the element while the panel and the fields wrote to the class. It writes
  through `styleHolders` now, as every style write does: the class holds it, at the breakpoint and state in view. The
  Quick Panel and the canvas label name the context they write in (the class target, the state, the breakpoint; the
  element's name and tag are the label's own). Test: resize-handles.spec "a handle writes into the class the style
  target names, at the state and breakpoint in view" (the class's tablet·hover width, and the element keeps none), with
  its tooth (the target resolution off: the class holds nothing).
- **6.1**: the panel's fields per element kind: six style doors of `style.set` (direction, align-items, padding, gap
  — the gap writing both longhands, the audit's acceptance — object-fit and radius) and six attribute-field doors
  (`element.setAttribute` for src, alt and a buttons type; `element.setLink` for href and new tab; `text.set` for the
  text). A quick-panel door may name the attribute it edits (schema, the Settings vocabulary); the panel draws an
  attribute field as the Settings tab does (a switch for a boolean) and filters it by the kinds the attribute names.
  The panel's fields follow the same applicability rule as the Style tab (`shownForContext`, the context
  `useSelectionContext` exports). One panel drawn bug found and fixed on the way: a selector that built an object
  every call re-rendered forever (React's "Maximum update depth exceeded").
- Scenarios (each in the feature that introduces its command, as the manifest's order rule asks): the container's
  direction, alignment, padding and gap in quick-panel; the image's source, alt and type in props-attributes; a link's
  address and its new tab in elements-structure; the text in inspector-panel; and an image's own styles. Teeth (each
  shown failing, then restored): the layout context off (a paragraph shows the gap field), the attribute branch off
  (the source field is not drawn), the gap door removed (the container scenario has no door). The runner reads a
  quick-panel field without a `type` the way it reads a panel control's kept argument.
- Specs: "Our rule" sections in quick-panel.md; DESIGN.md names the panel's kind fields and the shared context.

## 2026-09-27: item 6.2 and audit A3.42, the panel's position and what the preferences keep

- 6.2's placement rules were already the audit's "Correto" (the side with the most free space, the label's room above,
  the grip's drag, the offset kept per element through a reload: the spec's drag test passes untouched). What A3.42
  added: **the offsets are pruned of the elements the document no longer holds as the preferences are written** — the
  subscription watches the document too, so a delete rewrites the stored preferences without the dead entry (the write
  also had to drop the stale key rather than only omit adding it). Test: quick-panel.spec "deleting an element with a
  moved panel removes its offset from the preferences" (the local storage holds the id after the drag, null after the
  delete), with its tooth (the prune off: the dead entry stays).
- **The history across a reload, decided and documented**: it does not survive; the document comes back from the
  autosave, and the restored message now says so ("Your work was recovered from the last session. Undo starts again
  from here."; autosave-crash-recovery.spec updated, its before/after in the commit). Specs and DESIGN.md carry the
  decision.

## 2026-09-27: item 6.3, the quick panel's keyboard (the audit's "Escape num campo não fecha o painel")

- **The panel's open state became a command** (`quickPanel.setOpen`, owner `src/editor/quick-panel/quick-panel.ts`,
  `ui.quickPanelOpen`; not undoable): its **chip is a door of the panel's own region** (a `panel-control` door,
  `drawnAs: icon-button`, args `{open: "toggle"}`, placement `quick-panel` order 44 — DESIGN.md's data-local list no
  longer names the chip), a **global shortcut Ctrl+Shift+Q** turns it over from anywhere (F6 stays the region key,
  `keyboard-panel-navigation`), and **Escape inside the panel** closes it. Ctrl+Shift+Q is bound in the panel's own
  context too: a field's keys do not reach the global ones (a field is sealed), so the panel has to hear its own key.
- **A key context may absorb the fields inside it** (`interactions.json`: `absorbsFields`; `keymap.ts` `focusChain`):
  a key of a focused field inside the quick panel is looked up in the panel's context first and in the field's own
  after it, so Escape closes the panel from any of its fields while Enter keeps what a field holds and the arrows step
  it; the region above the field is looked up from its parent, never from the field itself (a number field names its
  own context on its own input, which would otherwise shadow the region). No other region absorbs: an inspector field
  keeps the field's own keys, and the global keys stay out of a field.
- **Opening puts the focus in the panel's first field; closing gives it back to the chip on the canvas** — both wait
  for the placing: the panel and the chip are drawn hidden while they are measured (`.is-measuring`,
  `visibility: hidden`), and a hidden element takes no focus. The acceptance ("Esc fecha, e Delete em seguida apaga a
  seleção") is a scenario: the chip opens, Escape closes, Delete deletes.
- **Closing the panel cancels what a field held unkept**: the panel's fields are drawn with `keepOnLeave={false}` —
  they keep while the panel is open (leaving a field for another control of the panel still keeps, as an inspector
  field does) and drop the draft when the panel itself closes ("Panel fields drop an unkept draft"; `field.tsx`,
  `inspector.tsx`: the blur that the close makes checks the panel's state, and the unmount keeps nothing). The
  inspector's fields keep the old rule untouched.
- Tests: three scenarios in the quick-panel feature (`escape-in-the-panel-closes-it-and-the-canvas-keys-return`,
  `the-shortcut-turns-the-panel-over`, `closing-the-panel-cancels-what-a-field-held-unkept`); the runner mirrors the
  absorption in `focusedContexts` and waits for the focus to arrive in the panel (`expect.poll`: the focus lands a
  frame after the panel opens, once it is placed). Teeth: the feature's commands off (`e2e:tooth quick-panel`), the
  absorption off (the escape leaves the panel open: the delete never happens), the drop off (the typed width lands in
  the document and in the history).
- Docs: spec `quick-panel.md` (Problems in Pager 4 rewritten to the built rule + "Our rule: the panel's keyboard"),
  DESIGN.md (the keyboard list, the Quick panel paragraph, the panel-control region row, the data-local list),
  ARCHITECTURE.md (the command's owner; the keymap's absorption).

## 2026-09-27: item 6.4, the quick panel's guided Effects and Skew fields

- What the audit saw as "raw CSS syntax only": the quick panel's **Effects** field refused a bare number (`2` → "Filter:
  "2" is not a value this field takes."), and its **Skew X/Y** were reported as refusing `10` too. Measured on the
  build of 6.3 (`a64-probe`): Skew X `10` already wrote `skewX(10deg)` (the bare-unit owner of block 1, A3.32, reached
  the panel's per-function fields), and only the Effects field still refused.
- Built: **a bare number in the panel's Effects field is a blur radius in px** (`2` → `blur(2px)`, through
  `withBareUnit`; `functionsTyped` in `src/editor/canvas/quick-panel.tsx`); the full CSS list and `none` behave as
  before. The Style tab's guided per-function controls (a field per filter with its own unit and its slider) stay where
  they are; the panel keeps its one Effects field.
- Tests: two scenarios — `the-panel-skew-takes-a-bare-number-as-degrees` (the audit's acceptance: typing `10` writes
  `skewX(10deg)`) and `the-panel-effects-take-a-bare-number-as-a-blur` (`2` writes `blur(2px)`); the whole quick-panel
  feature runs green (42 tests). Teeth shown: the guided-effects rule off (the effects scenario fails on the document
  diff, the skew one passes), the bare-unit owner off (the skew scenario fails). Real use in the app
  (`.cache/logs/uso-6-4-*`): `10` in Skew X, `5` in Skew Y and `2` in Effects.
- Docs: spec `props-filters-clip.md` ("Our rule: the quick panel's guided Effects and Skew fields"), DESIGN.md (the
  quick panel's field list), PROGRESS.md and the checklist.

## 2026-09-27: item 6.5 and A3.29, the colour picker's title, its opaque pick and the colour samples

- **6.5, a pick over a transparent colour is opaque.** The area pick (pointer.ts pickColor), the picker's own writes
  (color.tsx `write`) and the channel fields (`editedColour`) now go through one owner, `pickedAlpha(shown, carried)`
  (`core/style/color.ts`): a write that keeps the alpha writes it 1 when the colour the picker shows has alpha 0; a
  write that sets the alpha (its slider, its channel) is kept as written. Scenario
  `a-pick-over-a-transparent-background-is-opaque` (the Actions element declares no background: the press writes
  `#f9f5f5`, opaque) with its tooth (the rule off: the document keeps `rgba(249, 245, 245, 0)`).
- **A3.29, the picker says what it edits**: its header is "Background · Actions" (`colorPicker.titleOf`, the property's
  word + the primary element's name, or the count for several), never just "Colour".
- **A3.29, "Save current" and the samples.** Measured first (a65-probe): saving, the saved chips and the reload were
  already built (the colour-swatches-eyedropper feature; `document.swatches`, the picker's lists, the autosave), and so
  was the picker on the four plain colour fields (the inspector's colour-field branch) — the audit was stale there.
  What was missing: the colour *samples*. A colour that is a part of a larger value now draws a sample chip
  (`.field__sample`, `sample` in field.tsx TextStyleField): the border's colour (inspector.tsx, `isColourValue`, a new
  helper in sections.ts reading properties.json's `valueType`), a shadow layer's colour (shadow.tsx) and a gradient
  stop's (gradient.tsx). Spec tests: "the picker names the property and the element it edits" and "a colour that is a
  part of a larger value is shown as a sample" (the border colour typed `#00aa00`: the chip takes it), each with its
  tooth.
- **The open finding**: the *picker* on the shadow's and the gradient stop's colours needs the picker's parts to carry
  a write target (their parts' doors are `style.set`'s, and those values live inside a json edit); it is in PROGRESS.md
  with the work it needs.
- Docs: spec `color-picker.md` ("Our rule: what the picker says, and a pick over a transparent colour"), DESIGN.md's
  color-picker region row, PROGRESS.md and the checklist.

## 2026-09-27: block 6's fixes, item 2.4 (the base style) and item 2.3 + A3.22 (the screen height, the fold lines, the site's width)

- **Block 6's e2e (1593 passed, 3 failed)** found three things, all fixed and shown:
  1. `field-refusal.spec.ts` typed `2` in the quick panel's Effects field and expected a refusal — the *old* behaviour
     (item 6.4 made a bare number the field's guided blur). The test now types `nope` (still no filter list): before
     `Filter: "2" is not a value this field takes.` / after `Filter: "nope" is not a value this field takes.`, the same
     three assertions (status bar, refusal beside the field, nothing written).
  2. `quick-panel.spec.ts` (the offset prune) failed: after a grip drag the *grip* holds the focus, and the new
     `data-key-context="quick-panel"` on the panel root had sealed it from the canvas's Delete. Fixed in the manifest:
     the quick-panel context **inherits the canvas's keys** (`quick-panel: inherits: canvas`), so a focused panel
     control keeps Delete and the arrows while a focused panel *field* stays sealed ([panel, field chain] — no global
     keys). The committed test needed no edit; the probe (`b6-probe`) shows Delete again after the drag.
  3. The census timed out at its 120 s limit under the load of my own typechecking during the run (finding 51); it is
     re-run quietly at the checkpoint.
- **2.4, the project's base style** (`src/core/render/base.ts`, `baseCss()`): `box-sizing: border-box` for every
  element and its pseudo-elements, written as the page document's first style element (`data-base-style`) and at the
  head of every exported `css/styles.css`, so a height or a width a person sets is the size the element takes on screen
  (a Section at 600px with 56px of padding measures 600). Its scenarios and a spec test (the base rule first, before
  the tokens and the classes; the canvas writes the same text) with the tooth tool: 2 of 2 fail with the module
  stubbed. `baseCss` is a function, not a constant: the tooth proof stubs exported functions.
- **2.3 + A3.22**: `properties.json`'s breakpoints gained a **height** (Desktop 900, Laptop 800, Tablet 1194, Phone
  844, the schema, its consumer and the generated files); the canvas gives the frame that height as the page's viewport,
  so `vh`, `svh` and `dvh` measure the screen at any zoom (5 scenarios: the Desktop 900, the Phone 844, Fit, the export
  keeping 100vh, and the Guides & Grids toggle for the **fold lines**, a new page setting `foldLines` and the command
  `grid.toggleFolds`). The fold lines are drawn by `grid-overlay.tsx` (`foldLines(pageHeight, screen)` in grid.ts, the
  new `canvas-folds` region): a 3000 px page on a 900 px screen draws three, "Fold 1 · 900 px" first. The Height field
  suggests **Screen height** (`100vh`, the preset in properties.json and its label in the catalogue; the number field
  now suggests its door's presets, named). A3.22: the renderer measures the browser's own scrollbar (`scrollbarWidth()`)
  and keeps it free on the page's root, the canvas draws no scrollbar inside the frame (the stage scrolls it), and a
  spec test compares the canvas's usable width with the exported page's in a 1440 px window at 100 % and at 25 %.
  Teeth: the screen off (3 height scenarios fail, 1318 px), the folds off (the fold test fails), each restored and shown
  passing. The scrollbar reservation measures 0 on this machine (Chrome's overlay scrollbars): the acceptance holds and
  is tested here, and the reservation is what makes it hold on a machine with classic scrollbars too.
- The committed breakpoints-switch scenarios (the laptop/tablet/phone widths) pass untouched: the base style and the
  frame's screen do not change the page's width on this browser.

## 4.1 + A3.15 — the bands on any selection, the mode that lets go (2026-09-27)
- Contract first: manifest/features/05-canvas-handles.json gained a-band-drag-without-the-mode-writes-its-side (no mode
  step; the top padding band dragged to 76px) and shift-writes-all-four-sides became
  shift-adds-the-same-displacement-to-the-four-sides (70/54/70/54, feedback "Padding top of Hero: 70px."); the
  scenario was uncommitted when it changed, and the before/after is in the chat of the build session. No committed
  scenario was edited (the two marquee-select tests 3.7 had changed stay as they are).
- Code: edit-handles draws the padding, margin and gap bands on any selection (opacity 0.06, 0.55 under the pointer)
  and a mode only pins them; modeRefusal (canvas/edit-mode.ts) gives the reason a mode cannot act (nothingToEdit, or
  notApplicable — one of its writes applying is enough, since a shadow handle writes box-shadow and text-shadow);
  chrome.tsx lets the mode go through the manifest's own leaving door; the canvas toolbar carries the mode hint
  (canvas.editMode.hint); pointer.ts writes the four sides with the same displacement from the starts captured at the
  press, the dragged side last, so the status names it.
- Proofs: e2e-b41g (16 passed), e2e-b41h/e2e-b41j (18), e2e-b41l (33 → fixed), e2e-b41m (100: the three handle features
  and the quick panel), e2e-b41n/e2e-b41o (16: resize-handles, rotation-handle, quick-panel, spacing-handles),
  e2e-b41p (19: hover-measure, drag*, drop*, box-model, empty-*), e2e-b41q/e2e-b41r (35, the three handle features).
  Teeth: npm run e2e:tooth spacing-handles — 15 of 15 scenario tests fail with the feature off; tooth-modestay (the
  drop off: "the mode is gone" 1 instead of 0), tooth-modehint (the hint off: Expected "Mode: Gap · Esc exits"),
  tooth-notapplicable/tooth-notapplicable2 (the applicability off: aria-disabled "true" received ""), tooth-shift
  (Shift off: padding-right 40px where 54px was expected). Real use: .cache/logs/uso-4.1-174632 (8 shots): the band
  revealed under the pointer (0.06 → 0.55), the drag with no mode wrote padding-top 76px (status "Padding top of
  Hero: 76px."), Gap disabled with its reason on a section and offered on the flex Grid, the hint on, the mode let go
  with the east resize handle back, the 10 px Intro still dragged before the Title, console clean.
- Two fixes the ripple found: the always-drawn bands were drawn over the mode's handles (a radius corner inside the
  padding band's strip) — bands first, then the mode's handles, then the resize handles; and the bands swallowed a
  10 px-tall paragraph — an unpinned band waits out an element without room (2 × spacing.minBand + resize.handleRoom).

## Decisions moved out of PROGRESS.md (2026-09-27, verbatim)
- A3.30: presets a door offers and a door-declared slider (opacity, filters, radii) writing on release in one undo step.
  A3.31: Remove filters, Remove the gradient and the position's way back take their declarations away through removeStyle
  (a coupling's companion with its trigger, the inert insets with the position); break before/after keep refusing avoid
  (BCD). A3.34: a shadow's rows read as words and drag to reorder; the Quick Panel's field is Background image. A3.43:
  contrast >= 4.5:1 and controls >= 24x24 are measured by accessibility-audit.spec.ts.
- 5.2+A3.33: the unit menu is short; a list field opens every value; the declarations take --customs and shorthands.
  5.3: rem/em/% convert with the layout port measuring the page.
- 6.3: the panel's open state is a command (quickPanel.setOpen; its chip is a door of the panel's region, Ctrl+Shift+Q in
  the global and in the panel's own context, Escape in the panel); its key context absorbs its fields and inherits the
  canvas's, so a focused panel control keeps Delete while a panel field stays sealed; a panel field drops an unkept draft
  as the panel closes. 6.4: a bare number there is guided (10 -> skewX(10deg); 2 -> blur(2px)).
- 6.5+A3.29: a pick over a fully transparent colour is written opaque (color.ts pickedAlpha); the picker's header names
  the property and the element; a colour inside a larger value draws a sample chip.
- 2.4: box-sizing:border-box is the project's base style (base.ts baseCss), written first into the canvas page and at the
  head of every exported stylesheet. 2.3+A3.22: a breakpoint is a screen (properties.json heights: the frame gives the
  page that viewport, so vh measures it at any zoom); the fold lines mark each whole screen (grid.toggleFolds, a page
  setting); the renderer keeps the browser's scrollbar width free on the page's root (0 with overlay scrollbars).

## 4.2 + A3.16 — the dragged edge follows the pointer, and the parent bounds the box (2026-09-27)
- Contract first: manifest/commands/geometry.json gained marginLeft and marginTop args and the start-edge doors write
  them (the west door writes width, left and margin-left); properties.json lists those doors on the four properties;
  interactions.json declares the resize gesture Shift as toggle-aspect-ratio (a medium keeps its ratio unless Shift
  releases it). The feature gained six scenarios: the-west-handle-moves-the-left-edge-and-keeps-the-right-one,
  the-north-handle-moves-the-top-edge-and-keeps-the-bottom-one, a-north-east-corner-handle-moves-the-top-edge,
  a-south-west-corner-handle-moves-the-left-edge, a-north-west-corner-handle-moves-both-start-edges and
  the-east-handle-stops-at-the-grid-cells-edge (a card 200 px wide dragged east in a 448 px cell stops at 448 px).
  The three older scenarios (an edge handle, a top or bottom handle, a corner handle) keep their end-edge doors only:
  their diffs are unchanged, and the doors moved to the new scenarios (door-coverage green).
- Code: resizeBasis (editor/canvas/coordinates.ts) reports the margins, the room to the parent content edge (a grid
  items own cell, from the resolved tracks its box touches) and whether the own declarations move the start edge;
  resizedBox (core/geometry/resize.ts) negotiates the start edge with a margin or left/top, keeps the ratio for the
  media kinds and caps the width (never the height); the chrome draws a start-edge handle disabled with the reason
  (canvas.resize.parentPlaces) and the pointer ignores a press on one; the label carries the live size chip and stands
  a handle half above the element top edge, so no handle lies under it.
- Proofs: e2e-b42d..e2e-b42n (the feature: 16 scenarios + 10 spec tests green), the full suite in the background.
- Ripple: with the padding bands live (4.1) a selected container padding belongs to its bands, so three marquee
  scenarios now select the page first (before/after in the chat) and drag-drop-inside changed its clause; a height is
  not capped (the first clamp capped an image height against the auto-height page and broke its ratio).

## 4.4 — the four rotation zones, the live angle, the chrome that turns (2026-09-27)
- The single north-east rotation handle became one zone outside each corner (the same door style.set#handle-rotate
  drawn four times, data-rotate-zone), each round with the grabbing cursor, held inside the canvas by its *turned*
  place (turnedSpot moves the round zone along its circle instead of turning it, so the clamp applies after the
  move); the label carries the live angle (canvas.rotate.angle, data-chrome=label-angle); the outline, the
  eight resize handles and the zones are drawn with the element's rotation about its centre (spun, each control's
  transform-origin being the vector to that centre), and the label clears the zones by --space-6 + --space-4.
- Proofs: e2e-b44..e2e-b44h (the rotation and resize features, 27 passed), tooth-zones (only one zone: "the ne zone
  is drawn" fails), tooth-anglechip (no chip), tooth-outline (the outline does not turn), and the existing Shift test
  bit on turnedSpot (the second turn left 45deg while the zone left the canvas). The runner takes the first of the four
  zones; the rotation spec takes the north-east one where the label test polices it.
- Known limit (PROGRESS): resizing a turned element measures its axis-aligned box.

## Decisions moved out of PROGRESS.md (verbatim, later the same day)
- 4.2+A3.16: a start-edge drag moves the edge (a flow element by its margin, a positioned one by left/top, a shape by its
  geometry) and keeps the opposite edge; where the parent places the element (a flex or grid item, an inline-level one)
  the n/w handles, and the corners carrying them, are drawn disabled with the reason, a press on one belonging to what
  lies under it. The width stops at the parent's content edge (a grid item at its own cell: the tracks its box touches),
  never the height (a page grows downwards). A medium keeps its intrinsic ratio unless Shift releases it (the `resize`
  gesture's Shift is now `toggle-aspect-ratio`); the label carries the size chip and stands clear of the handles.
- 4.4: one rotation zone per corner (the same door four times, turned by moving it along its circle so the canvas clamp still holds it), the label carries the live angle (canvas.rotate.angle), and the outline, the resize handles and the zones turn with the element about its centre (each control's transform-origin is the vector to that centre). Known limit: resizing an already turned element still measures its axis-aligned box (the audit asks the chrome to follow the turn, not the resize).
- A selected container's padding belongs to its bands (4.1): a press there drags the padding, so a marquee starts on the
  page or on a container that is not selected. Three marquee scenarios gained a Page-row step; drag-drop-inside's "its
  own empty area is still a marquee" clause was replaced (before/after in the chat, a tooth on the band drag).

## Decisions moved out of PROGRESS.md (2026-09-27, item 7.3's stretch)

- 3.7: the band takes the container's direct children it touches; Alt dives to the leaves; Shift starts a band. 5.1: the
  layout predicates live in applies.ts; A3.24: one Tab stop per group, every Reset naming its property; A1.2+A1.3: the
  grid track editor and the grid child's start, span and Area; 3.11: the wrappers own the pattern the children grow by.
  5.4+A3.36: a state names the element kinds it stands on. 6.1+A3.8: every style door writes in one context (the panel
  and the label name the target, state and breakpoint); the panel's fields follow the element kind.
- 4.2+A3.16, 4.4 and the bands of a selected container (4.1) decided earlier the same session: docs/history.md.

## Findings moved out of PROGRESS.md (2026-09-27, still open, the live view keeps 51-62)

1. A node path names no page nor two same-named siblings. 5. canvas.tsx RULER_STEP = 200 is a constant in code.
6. panels.spec.ts, doors.spec.ts run doors without `runs()`. 9. inspector-fields.spec.ts: wrong `drawnAs` passes. 11.
Renderer: textarea/option line break becomes `<br>`. 12. Flaky under load: coordinates:181, a 'stable' File menu. 15.
shell.tsx keeps the fit zoom in useState. 14. sidebar.tsx writes the argument name "target". 18. Backdrop focus return
untested. 19. No size chip; label not a hit target. 20. Layers folds survive File › Open. 22. walking onto an off-screen element does not scroll it; history.depth (80). 24. Escape on a palette tile. 25. Layers Shift/Ctrl doors lack data-door. 27. M: no lock refusal. 28. Move up/down enabled at an edge. 31. Escape keeps a rename. 32. The inspector draws its sections with nothing selected. 33. New Summary empty. 30. Declared, not built: wrap refusals formInForm, labelOneControl; the hover label as a hit target. 34/37. palette-density, layers-drag dwell: spec-test teeth only. 36. nesting-grammar-structure vs hand unit test.

## Project cleanup — structure, copies and documentation (2026-09-27)
- The interrupted session's work (the link picker and the references) was committed unverified as `WIP: link picker and
  references (interrupted builder session, unverified)` (a0fad99, 31 files): the restore point. Its baseline, recorded
  without fixing anything: `npm run build` and `manifest:check` pass; `npm run unit` fails 5 of 654 (inline.test.ts is
  the known RV-03; link/settings/validate/svg tests may be the unverified change's own); `gen:check` fails because the
  commit's `src/generated/ids.ts` misses the `open.refused` message id.
- The cleanup followed PROJECT-AUDIT.md (its copy now lives at `docs/audits/2026-09-27-project-audit.md`).
- The stale copies were verified against this repository's objects (`git hash-object --stdin-paths`, then
  `cat-file -e`, a second pass with `--no-filters`): every file of eight `.cache/wt` worktrees, `.cache/ts` and
  `.cache/audit` matched, and all ten were deleted. `.cache/wt/inspector-number-fields` (35 files unmatched) and
  `.cache/old-root` (`ARCHITECTURE.md`, `PROGRESS.md` unmatched) were kept and are listed in the cleanup report.
- Removed with them (about 1.1 GB): `.cache/scratch`, `pw-tooth`, `e2e-build`, `shots`, `pager-invest`, `wt/work22`,
  `symbol-table.md` (its 122 icon pairs are the mapping in DESIGN.md), `.playwright-mcp`, `dist`, `test-results`,
  `.dependency-cruiser.cjs` (no consumer; its stale glob left `eslint.config.js`) and `AGENTS.md` (the retired Codex
  workflow).
- Preserved: the hook wiring as `tools/hooks/settings.example.json` (the only copy, from `.cache/old-root`) and the
  investigation report as `docs/archive/investigation-2026-09-24.md`; CLAUDE.md, docs/testing/README.md and
  ARCHITECTURE.md now say the hooks are off and are enabled by copying the example file to `.claude/settings.json`.
- Moved with `git mv`: `DESIGN.md`, `ARCHITECTURE.md` and `PROGRESS.md` into `docs/` (the manifest checker reads
  `docs/ARCHITECTURE.md` through `tools/manifest/load.ts`), and the option mockups + `OPTIONS.md` into
  `design/history/` (their `../shared/` links became `../../shared/`).
- Added the root `README.md`: what the project is, how to run and check it, and where the documentation lives.

## Decisions moved out of PROGRESS.md (2026-09-27, the finish pass; verbatim)

- 7.2 (f87ed02): the SEO fields of the page (Description, Canonical URL, Sharing title, Sharing image, Favicon) are
  kept by page.setSetting and written in the exported head after the title (elements.json `head`); the grid and fold
  toggles left the page's Settings for the canvas tools and Guides & Grids.
- 7.3+A3.6 (669865d): the project's files live in the document (core/files/files.ts: path, MIME type, base64, an
  image's intrinsic size); files.upload stores a chosen or dropped file (img/, fonts/, files/; "-2" when taken); the
  canvas draws a project file as its object URL, the Source field suggests the project's images and its choose button
  opens the asset picker (open/close doors, Escape in the picker's own key context); an image file dropped on the
  canvas is stored and placed, or becomes the source of the image under the pointer (the audit's acceptance); the
  export carries every file at its path. A3.6: an empty source/track is never exported, Autoplay switches Muted on,
  an emptied alt is decorative (alt=""), a pasted whole <svg> is unwrapped, an SVG drawing markup takes no shapes and
  an Embed warns that its code runs. settings-audit is registered (26 scenarios).

## Finish pass — the interrupted work, the copies, the full suite (2026-09-27)
- The interrupted session's work was finished (`ac86cad`, "Finish link picker and references"): the five red unit
  tests were fixed by their cause (two stale to the A3.2 address rule, one to the A3.6 svg unwrap; the validator now
  owns the language rule — private-use tags included — and reports one reason per attribute; `https://` names nothing
  and is refused). Each fix carries a tooth (`.cache/logs/tooth-address-*`, `tooth-language-*`, `tooth-onereport-*`).
- The two UNVERIFIED copies were resolved and deleted: every file compared against its counterpart;
  `.cache/old-root/PROGRESS.md` was unique (its 2026-09-25 findings are absent from the tree) and is kept as
  `docs/archive/unmerged/old-root.patch`; everything else was superseded. `tools/manifest/map-features.ts` and its
  `manifest:map` script were removed (one-time migration check; its input is gone and it no longer ran).
- The first full suite in weeks (14.9 min, 1,605 passed, 74 failed) found two real defects, both fixed (`5845c44`,
  "Fix failures found in full verification"): the number field drew every door of the `field` region as a part, so the
  asset and link choose buttons sat inside every field (intercepting clicks and adding Tab stops) — `field.tsx` now
  draws the four parts DESIGN.md lists; and the export wrote a project file's object URL instead of its path —
  `core/files/values.ts` now holds one writer per reader (`exportValue`, `canvasValue`). One scenario
  (`the-fold-lines-are-turned-on-in-guides-and-grids`) still opened the page panel for a door that moved to Guides &
  Grids in 7.2; its step now opens the dialog (the tooth: 10 of 10 fail with the feature off).
- `docs/audits/2026-09-27-dev-infrastructure-evaluation.md` reports every subsystem (what it protects, what it caught,
  cost, overlap, recommendation) and the minimal validation workflow.
- The user, the same day: tests at the end of each block and about what the block built — the whole suite only when
  the application is complete. The validation cycle in CLAUDE.md follows that order from here.

## The finish prompt, step by step (2026-09-27)
- Step 1 (the WIP `a0fad99`): done — `ac86cad` "Finish link picker and references" (the five unit tests fixed by cause,
  each with a tooth; `npm run gen`; the records updated). The e2e spec of the link picker passes.
- Step 2 (the two UNVERIFIED copies): done — every unmatched file compared; `old-root/PROGRESS.md` kept as a patch;
  both copies deleted.
- Step 3 (housekeeping): done — `map-features.ts` and its script removed; the memory paths updated; the four older
  memory files archived.
- Step 4 (the full verification): **partly done, and its end is superseded by the user's order**. The five static
  checks pass (`build`, `unit` 654, `lint`, `manifest:check`, `gen:check`). One full `npm run e2e` ran (14.9 min,
  1,605 passed, 74 failed) and its two real defects were fixed (`5845c44`) with teeth; the suite was not re-run to
  green because the user then ordered, literally: no suites while implementing, a block's own tests at its end, and
  the complete suite only when the whole application is ready. The census is part of that suite.
- Step 5 (the infrastructure evaluation): done — `docs/audits/2026-09-27-dev-infrastructure-evaluation.md`.
- Step 6 (history + commit + the prompt files): done — `2b56071` "Record finish pass"; the three prompt files removed.

## Decisions moved out of PROGRESS.md (2026-09-28)

Older decision bullets kept whole: custom CSS, zoom 100, guides axis-n, the shortcut rule, quick panel side, SVG naming,
swatches, reset tab order, export lines, the 4.5 detail, and the pointers to the 4.5+A1.5+A1.6+A3.17+A3.21 and 7.2/7.3
entries above.
