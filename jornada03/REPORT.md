# Jornada 03 — the Builder in the hands of the people who would use it

Study run on 2026-10-01 on the application at commit `9e118aa`, following the approved plan (5 phases with exit
criteria). Three professionals were played — **Marina** (freelance web designer), **Diego** (front-end developer at an
agency) and **Carla** (agency production) — each with a client job, real gestures in the installed Chrome, a photo per
step, and an in-page probe; nothing was fixed during the study. Equal weight for the three personas.

**Read first — the honest limit.** The evaluator is an AI playing personas. The objective measures (results, dead
ends, silent failures, incidents, fidelity, code metrics, latency) are data. The subjective ones (SEQ per task, SUS per
persona) are a proxy and are marked so. A simulated persona does not wander with the mouse, so its difficulty shows as
dead ends, refusals, errors and silent failures rather than as extra gestures: the efficiency ratio stays near 1 on most
tasks and is reported but not leaned on. The study ends recommending the same script with 3–5 real people.

Where things are: `00-frame/` (personas, hypotheses, task script, competitor matrix with sources, design targets and
their pictures), `scripts/` (driver, probe, helpers, expert runs, fidelity, analysis), `data/` (one JSON per task,
`scoreboard.json`, `fidelity/`, downloads), `shots/` (a photo per step per task).

## 0. How to read this report (every acronym and code)

| Term | Meaning |
|---|---|
| Persona | A realistic, fictional user played in the study: Marina (designer), Diego (front-end developer), Carla (agency production). |
| M1–M5, D1–D5, C1–C5 | Task codes: M = Marina, D = Diego, C = Carla; the number is the order (C4 = Carla's fourth task, the catalogue). |
| P1–P4 | Probes: short tests of one aspect (large page, keyboard, small screen, long undo history). |
| H1–H17 | Hypotheses written before the sessions, confirmed or refuted by a number. |
| J1–J28 | Problem codes ("J" for Jornada 03), most severe first. |
| Severity 0–4 | Jakob Nielsen's usability severity scale: 4 catastrophe (work lost or task blocked), 3 major, 2 minor, 1 cosmetic, 0 not a problem. |
| Dead end | The person tried something and there was no way through: the feature was missing or failed; they worked around it or gave up. |
| Silent failure | The editor refused its own change internally and showed the person nothing; only the internal incident feed knew. |
| SEQ | Single Ease Question: a 1 (very hard) to 7 (very easy) rating after each task. Given here by the evaluator playing the persona, so an estimate. |
| SUS | System Usability Scale: a standard 10-question questionnaire scoring a product 0–100; 68 is the industry average, below 50 is poor. Estimated here, not answered by real people. |
| QA | Quality assurance: testing to find defects; `docs/QA-LOG.md` is the project's log of each defect found and fixed. |
| Fidelity | How close the page built in the Builder is to the client's original layout: the share of identical pixels between the two pictures. |
| Latency, ms, p50, p95 | Time from a click or key to the screen's answer, in milliseconds (1000 ms = 1 s). p50 = the typical time (half the actions were faster); p95 = the slowest actions (95 % were faster). Under 100 ms feels instant. |
| Committed changes | Changes the person confirmed that stayed in the document (undone ones do not count). |
| Expert baseline | Tasks redone along the best known path, without errors: the floor the personas are compared to. |
| KLM | Keystroke-Level Model: estimates task time by adding a fixed cost per gesture (about 1.3 s per pointer click, 0.28 s per key). |
| Export, ZIP | The site the Builder writes for publishing: a compressed archive (ZIP) of the pages and the stylesheet. |
| HTML, CSS | HTML is the page's content and structure; CSS is its look (colours, sizes, spacing). |
| BEM | A naming convention for CSS classes that keeps code readable (e.g. `card__title`). |
| Class, variable, component | Class = a named style reused on many elements; variable = a named value (e.g. the brand colour) reused in many places; component = a reusable block whose copies follow the original. |
| CSV, XLSX, JSON | Data file formats: CSV and XLSX are spreadsheets (plain text / Excel); JSON is a data format used by programs. |
| Manifest | The Builder's internal contract: the list of every command and control the app has. |
| MCP | Model Context Protocol: a standard for connecting AI assistants to programs so they can act in them. |
| CMS | Content Management System: other builders' way of keeping lists (products, posts) and generating pages from them. |
| Breakpoint | A screen size the page is tuned for: Desktop 1440 px, Laptop 1180, Tablet 834, Phone 390. |
| Commit | A saved record of changes in the project's history (git), named by a code such as `b39cc31`. |

## 1. Scoreboard

| Persona | Tasks | Done | Partial | Abandoned | Completion | Dead ends | Silent failures (incidents) | SEQ mean (AI) | SUS (AI proxy) |
|---|---|---|---|---|---|---|---|---|---|
| Marina — designer | 5 | 5 | 0 | 0 | 100 % | 10 | 0 | 4.0 / 7 | 45 |
| Diego — developer | 5 | 4 | 1 (D3 import) | 0 | 90 % | 6 | 4 (D1) | 3.4 / 7 | 47.5 |
| Carla — production | 5 | 4 | 1 (C4 catalogue) | 0 | 90 % | 4 | 4 (C4) | 3.0 / 7 | 37.5 |

Everything got built — a full landing page close to the design, a token/class/component system, a keyboard-only page,
a rebrand, two unit pages, a 12-item catalogue — but **every persona needed workarounds**, and **two features failed
silently** (the person saw nothing; only the editor's incident feed knew). A SUS around 45 sits in the "poor" band: the
product works, the path to the result does not yet feel trustworthy.

Per task (from `data/scoreboard.json`; pointer = clicks, drags and wheel turns; committed = changes that stayed):

| Task | Result | Pointer | Keys | Committed | Dead ends | Incidents | p95 ms | SEQ |
|---|---|---|---|---|---|---|---|---|
| M1 first contact | done | 12 | 57 | 4 | 2 | 0 | 174 | 5 |
| M2 desktop build (21 min) | done | 353 | 1545 | 150 | 4 | 0 | 242 | 3 |
| M3 responsive | done | 221 | 170 | 36 | 2 | 0 | 223 | 4 |
| M4 fonts and images | done | 72 | 200 | 15 | 2 | 0 | 163 | 3 |
| M5 preview and export | done | 2 | 1 | 0 | 0 | 0 | 241 | 5 |
| D1 tokens and classes | done | 128 | 355 | — | 3 | 4 | — | 2 |
| D2 component ×6 | done | 34 | 195 | 13 | 0 | 0 | 264 | 6 |
| D3 import HTML | **partial** | 16 | 53 | 2 | 1 | 0 | 260 | 3 |
| D4 keyboard only | done | 0 | 185 | 6 | 2 | 0 | 219 | 3 |
| D5 code review | done | 1 | 0 | 0 | 0 | 0 | 73 | 3 |
| C1 rebrand | done | 18 | 41 | 4 | 1 | 0 | 240 | 2 |
| C2 pages from a page | done | 13 | 167 | 6 | 0 | 0 | 395 | 4 |
| C3 menu everywhere | done | 75 | 68 | 9 | 1 | 0 | 435 | 2 |
| C4 catalogue from CSV | **partial** | 40 | 940 | 15 | 2 | 4 | 34 | 2 |
| C5 reload mid-edit | done | 1 | 10 | 0 | 0 | 0 | — | 5 |

Expert floor (Phase 3): calibrated on the expert runs whose result was verified (M1, M2 up to where it stopped, D2, D4,
C1) — **2.5 pointer gestures + 12.1 keystrokes per committed change**; the C2 expert run was invalid (the Explorer icon
closed its panel and the script edited Home) and is excluded. Efficiency (persona ÷ expert, keystroke-level model) is
0.9–1.9 on 11 tasks and **3.1 for C4** and **2.7 for D3** — the two tasks whose features failed under the persona.

Fidelity (Marina's export vs the hand-written target, pixel match at 24/255 tolerance): **1440: 86.2 % over the common
height, 80.6 % counting the height difference** (the export is 155 px shorter); 1180: 84.9/79.4; 834: 81.0/77.1;
390: 75.0/72.2. Export code (Diego, Home + Wholesale): 0 inline styles, semantic tags kept, CSS **16,985 B / 109 rules
(39 duplicate another's body), 310 longhand declarations — 4.9× the hand-written 3,445 B / 48 rules**; html-validate 8
errors (no `lang` ×2, `<button>` without `type` ×6); class names in Portuguese and numbered (`secao__titulo-3`).

Probes: P1 a 641-node page opens in 0.96 s; input→frame p50 **90 ms** (3× a small page), p95 287 ms. P2 focus ring
visible (2 px), but F6 never reaches the canvas or the Layers tree, the palette has 74 tab stops. P3 at 1280×720 the
canvas gets **45 %** of the window. P4 50 changes undone and redone exactly (~107 ms per step).

## 2. Hypotheses (thresholds fixed before the sessions)

| # | Hypothesis | Verdict | The number |
|---|---|---|---|
| H1 | Newcomer reaches title+text+button ≤5 min, ≤1 dead end | **Refuted** | 1.5 min net, but 2 dead ends (accent-sensitive search; "texto" gave a form field) |
| H2 | Desktop rebuild ≥85 % fidelity, ≤45 min | **Partial** | 21 min; 86.2 % common area, 80.6 % with height |
| H3 | Tablet+phone ≤15 min, ≥80 % at 834 and 390 | **Refuted** | 5 min; 77.1 % (834), 72.2 % (390) |
| H4 | Own font and images without leaving the app, ≤8 min | **Holds, with an accident** | 3.4 min; the uploaded font is not offered; typed letters wrapped an image in a grid and a row |
| H5 | Client-ready preview and export in 1 min | **Partial** | 11 s; export has 6 html-validate errors; no way to share with the client |
| H6 | Colours and spacing named once, reused | **Holds** | 11 variables in `:root`, `.card` uses `var(--space-32)`; only by typing `var(--…)`; one var() commit failed silently |
| H7 | Component ×6 changes everywhere from one edit | **Holds** | 2 min; "it reaches testimonial and its 6 copies" |
| H8 | Existing HTML imported and editable | **Partial** | structure kept, 35 elements, editable — but it replaces the whole project |
| H9 | A page from the keyboard alone | **Holds, barely** | 0 mouse gestures; only via Ctrl+A to reach the section |
| H10 | Export a developer accepts (CSS ≤2× hand-written) | **Refuted** | CSS 4.9×, 39 duplicate rules, numbered Portuguese names |
| H11 | Brand colour across the site in ≤3 actions | **Refuted** | 7 edits, no global tool |
| H12 | Pages from a page ≤1 min each | **Holds** | 2 pages in 71 s |
| H13 | Menu changes once for every page | **Refuted** | 3 inserts + 3 style pastes; no shared header |
| H14 | 12-item catalogue from a spreadsheet ≤5 min | **Refuted** | partial: CSV refused by upload, first fill failed silently, worked only after reordering columns |
| H15 | No work lost on reload | **Partial** | all committed work kept; the text being typed was lost without warning |
| H16 | p95 ≤100 ms with 300+ elements | **Refuted** | p50 90 ms, p95 287 ms at 641 nodes |
| H17 | Canvas ≥50 % at 1280×720 | **Refuted** | 45 % |

5 hold (2 with caveats), 4 partial, 8 refuted.

## 3. Problems (consolidated, most severe first)

Severity 0–4 (Nielsen); frequency = tasks where it was met. Types: **bug**, usability (**use**), visual (**vis**),
poor feature (**poor**), missing feature (**miss**). Evidence: `data/<task>.json` and `shots/<task>/`.

| ID | Sev | Type | Problem | Met in |
|---|---|---|---|---|
| J1 | 4 | bug | **Silent failures**: a command produces a state the validator refuses; nothing is published and the person sees nothing (only "N incidents" in the status bar). Met twice: `style.setBorder` with `var(--line)` on a class writes the shorthand `border-color`; `components.fillFromData` puts the first CSV column into the image `src`. | D1, C4 |
| J2 | 4 | bug | **Letters typed outside a field run structure shortcuts** until a letter that binds nothing: "Grãos de café" wrapped an image in a Grade and a Linha and flipped its direction; "Cardápio" switched the view to Code. Root cause each time: a click swallowed by a popover/panel just before (J8). | M4, C4 |
| J3 | 4 | bug | **File › Import HTML replaces the whole project** (every page) while the dialog says "Replace the page"; the client's other pages vanish (undo restores). | D3 |
| J4 | 4 | bug | **Spaces typed in a button's in-place text are dropped** ("Conhecerosplanos"); only Settings › Text keeps them. | M2 |
| J5 | 4 | bug | **The Styles view does not scroll**: the variables list runs under Layers; clicks there close/reopen/float Layers; the floating Layers window cannot be moved, closed or docked, and survives reloads (only View › Reset workspace frees it). | D1, D2 |
| J6 | 3 | bug | **Squeezed value inputs**: with a value, a unit and a reset, the number field shrinks to 0–19 px; the click lands on the unit menu and Enter re-commits the old value silently (font size, gap, radius, height, width, border colour). Workaround: reset first — which itself erases the value. | M2, M3, M4, D1, C1 |
| J7 | 3 | bug | **Ctrl+Z does nothing after confirming a field** (focus stays in it) and says nothing. | M2 |
| J8 | 3 | bug | **Clicks swallowed**: the image file chooser stays open after a choice; the activity-bar icon of the open panel closes it; the next click/typing goes elsewhere. | M4, C2, C3, C4 |
| J9 | 3 | bug | **"Collapse every branch" empties the Layers list** (the page root collapses too). | M3 |
| J10 | 3 | use | **Grid tracks editor shows "0 tracks" at a breakpoint that inherits 2**, while other fields show the inherited value with its badge; columns and rows lists are unlabelled; the + moves after the first add. | M2, M3 |
| J11 | 3 | use | **Insert search is accent-sensitive, has no synonyms, and orders badly**: "titulo" finds nothing; "texto" finds only form fields; "link" lists the empty Link Block first. | M1, C3 |
| J12 | 3 | use | **Keyboard cannot reach the canvas or Layers**: F6 cycles 7 regions without them; arrows need a selection; 74 palette tab stops; opening a panel from Ctrl+K drops the focus; Ctrl+K cannot switch pages or select layers. | D4, P2 |
| J13 | 3 | bug | **Upload refuses .csv/.json** although Fill from data needs a data file; Fill maps columns by position, with no mapping UI; images need project paths. | C4 |
| J14 | 3 | poor | **Export CSS is ~5× hand-written**: duplicated rules under numbered names, longhands everywhere, class names in the author's UI language. | D5 |
| J15 | 2 | bug | Opening the Font list commits half-typed text as the font; the list is clipped on the left; **uploaded fonts are not listed** (sev 3 as a gap). | M4 |
| J16 | 2 | vis | Selection label and size chips sit over neighbouring content, causing mis-clicks; two chips overlap. | M1, M2 |
| J17 | 2 | use | Shift+click in Layers toggles instead of selecting a range; the Layers list jumps when the selection changes. | M2 |
| J18 | 2 | use | Radius refuses bare numbers every other length field accepts. | M2 |
| J19 | 2 | bug | The inspector shows inherited values read from the zoomed canvas (border 1.69014px) and "None" while a base border is visible. | M2 |
| J20 | 2 | use | Duplicating a page neither opens the copy nor focuses its name; new elements don't take their siblings' look (blue underlined link in a styled menu). | C2, C3 |
| J21 | 2 | use | Component instances keep generic names (Seção 5…9) without a component badge. | D2 |
| J22 | 2 | use | Placeholder image spans the width its real picture won't; layout jumps when the source arrives. | M4 |
| J23 | 2 | use | Text being edited is lost on reload without a leave-page warning. | C5 |
| J24 | 2 | perf | 641-node page: p50 90 ms per gesture (3× a small page). | P1 |
| J25 | 2 | use | At 1280×720 the canvas gets 45 % of the window. | P3 |
| J26 | 2 | use | App opens in English for a pt-BR browser; unlabelled rail icons; first view is a file Explorer; "Inserir" vs "Elementos"; Ctrl+K lists raw English CSS names in pt-BR. | M1, C1 |
| J27 | 2 | use | The padding link toggle keeps its state across elements; only longhand spacing entry. | M2 |
| J28 | 1 | vis | Copy and summary glitches: "Seção colocado", "1 elementos", multi-selection messages name one element, "Sombra: nenhum" with a shadow, double arrows in combo fields, path drawn over a button, overlapping page names in Pages, wrap dialog jargon, import renames the page. | M1–M4, D3, C4 |

## 4. Does today's workspace serve each job? (crossed with the competitor matrix)

| Job | Verdict | Why (study) | Competitors (`00-frame/competitors.md`) |
|---|---|---|---|
| Rebuild a client's layout faithfully | **Partial** | 80–86 % at desktop in 21 min, but via ~150 field-by-field changes; no section templates with previews; J6 fights every numeric edit | Webflow/Framer/Figma Sites: Figma import, AI layout, rich template libraries |
| Make it responsive | **Partial** | breakpoints and badges clear; template grids adapt; own grids mislead (J10); 24 repeated edits | Framer/Wix: AI responsive fixing; Figma: responsive variants |
| Fonts and images | **Partial** | upload is easy; font not offered; chooser traps (J8, J2) | all: asset managers with previews; image optimisation |
| Show and hand off to the client | **No** | only a ZIP | all cloud tools: share link / hosting |
| Build a design system | **Partial** | variables, classes, components exist and export cleanly; usable only by typing `var(--…)`; no extract-to-class; silent failure (J1) | Webflow/Elementor v4: classes, variables in pickers, component props |
| Bring existing pages in | **No** | import replaces the project (J3) | Pinegrow: true round-trip |
| Work from the keyboard | **Partial** | possible only with a trick (J12) | — |
| Code a developer would accept | **Partial** | semantic, no inline, one stylesheet — ahead of most; but 5× CSS and generated names (J14) | ahead of Webflow/Framer/Figma Sites on cleanliness, behind Pinegrow/Bootstrap Studio on naming |
| Change the brand everywhere | **No** | 7 manual edits, no global replace | Webflow/Elementor: global variables, swap |
| Pages from a page | **Yes** | 71 s for two | — |
| One menu for every page | **No** | no shared header/footer (J20) | all: global symbols / master layouts |
| Content from a spreadsheet | **Partial** | worked after reformatting; failed silently first (J1, J13) | Wix datasets, Webflow CMS, Elementor dynamic tags |
| Never lose work | **Yes** | committed work always restored, even the selection | — |

## 5. Innovation — what the friction asked for

The 32 "wish" moments, grouped and scored (frequency × pain × feasibility in this architecture, 1–5 each):

| Opportunity | Wishes behind it | Freq | Pain | Feasible | Score |
|---|---|---|---|---|---|
| **A. A design system that builds itself** — detect repetition and offer "make it a style" (all sections share padding → one class), replace a colour site-wide, variables in every picker, extract-to-class, shorthand entry, export that merges duplicates | M2 ×2, M3, C1 ×2, D1 ×2, D5 ×2 | 5 | 5 | 5 (classes/variables/commands exist) | **125** |
| **B. An agent that drives the editor through the manifest** — "make the hero two columns", "apply the brand", "fill these cards from this sheet", each step a validated, undoable command (no silent failures by construction) | M1, M2 (21 min), C1, C4, D4 | 4 | 5 | 5 (every door is declared; commands return patches) | **100** |
| **C. Data to pages** — import CSV/XLSX through upload, a visual column→field mapping, N pages from one template (units, menus, catalogues), photos found by name | C4 ×2, C2 | 3 | 5 | 4 (Fill from data, pages.duplicate exist) | **60** |
| D. Shared regions — header/footer/menu shared by every page | C3 | 2 | 4 | 4 | 32 |
| E. Client preview — a share link or a single self-contained preview file | M5 | 2 | 4 | 3 | 24 |
| F. Layout from a picture/Figma — the session's "target" as input | M2 time | 2 | 4 | 2 | 16 |

The three bets, each with the metric it must move in the next study:

1. **A — self-building design system.** C1 rebrand from 7 edits to **1**; M3 side-padding edits from 24 to **≤6**; D5
   CSS from 4.9× to **≤2×** the hand-written target; H6 without typing `var(`.
2. **B — agent through the manifest.** M2 from 21 min / 150 changes to **≤8 min**; **0 silent failures** (every refusal
   spoken); C4 done without reformatting the sheet.
3. **C — data to pages.** C4 from partial to **done in ≤3 min** with the original CSV; C2-style pages generated from
   rows.

## 6. Backlog (prioritised; nothing was fixed during the study)

**Top 10 fixes** (severity × frequency):
1. J1 — never fail silently: a refused commit becomes a spoken refusal; fix the two producers (`style.setBorder` with
   `var()` on classes, `components.fillFromData` mapping into `src`).
2. J2 — a letter typed after a swallowed click must not run structure shortcuts (guard the first letter too, or only
   run single-letter shortcuts when the canvas has the focus).
3. J3 — Import HTML as a new page (keep the other pages); fix the dialog's words.
4. J4 — spaces in a button's in-place edit.
5. J5 — the Styles view scrolls; a floating panel can be moved, closed and docked.
6. J6 — value inputs keep a minimum width; a click on the number edits the number.
7. J7 — Ctrl+Z after a confirmed field undoes the change.
8. J8 — choosers close after a choice; the activity icon of the open panel does not close it on a single click.
9. J10/J9 — grid tracks show the inherited ones; "collapse all" keeps the page root.
10. J11 — accent-insensitive search with synonyms (texto→Parágrafo, titulo→Título); Link before Link Block.

**5 feature gaps:** onboarding and section templates with previews (J26, M1/M2); site-wide colour/style replace and
variables in pickers (A); shared header/footer (D); CSV/JSON upload with column mapping (C); client preview sharing (E).

**3 innovation bets:** A, B, C above.

**Then test with people:** the same script, 3–5 professionals (at least one of each persona), 60 minutes each, think
aloud; the scoreboard columns above are the comparison.

## 7. How this was measured (and what to distrust)

- Driver: `scripts/driver.mjs` keeps one Chrome per persona (persistent profile) and takes one gesture at a time over
  a local port; `look.mjs` lists only what a person can see (hit-tested). Helpers (`at`, `ed`, `setf`, `pick`) aim like
  a person (by visible text and labels) and are part of the gesture counts.
- Instrument incidents, excluded from the personas' judgement and noted in each JSON: accent encoding through the
  Windows command line (M1), a `look` that listed covered items (pilot, fixed), helper mis-aims (M2, M3), an unexplained
  page reload that emptied D1's probe log (the 4 incidents were read live), and two expert scripts (C2 invalid, M2
  partial).
- Wall-clock seconds include the evaluator's thinking; the keystroke-level model is used for efficiency.
- Refusals were recounted from the recorded messages; latency is input → second animation frame inside the page.
