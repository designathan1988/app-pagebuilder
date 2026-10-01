# Task script

Fixed order, one run each, on the app at commit `9e118aa`, a fresh Chrome profile, 1440×900, dark theme. A task stops
at its limit (2× the estimate) or after the same dead end three times, and is recorded as done, partial or abandoned.
Nothing is fixed during the study. "Brief" is all the persona is told; the pictures are in `targets/`.

## Marina (pt-BR) — target `targets/marina/` (café "Grão Norte" landing page)

| Task | Brief | Estimate | Limit |
|---|---|---|---|
| M1 First contact | Empty app, no help. Get a section with a title, a paragraph and a button on the page. | 3 min | 6 min |
| M2 Desktop build | Rebuild the landing page from the 1440 picture: nav, hero with image, 3 benefits, testimonial, 3 price cards, FAQ, footer. Real texts from the brief. | 30 min | 60 min |
| M3 Responsive | Make it match the 834 and 390 pictures (stacked columns, smaller type, hidden nav links on phone). | 10 min | 20 min |
| M4 Fonts and images | Use the brand font (file given) for headings and put the 4 brand images (files given). | 5 min | 10 min |
| M5 Hand-off | Show the client a preview, then export the site. | 1 min | 3 min |

## Diego (en) — target `targets/diego/` (same brand, as a system)

| Task | Brief | Estimate | Limit |
|---|---|---|---|
| D1 Tokens and classes | Define the brand colours and the spacing scale once, and a `card` style class used by the price cards. | 8 min | 16 min |
| D2 Components | Make the testimonial a component, place it 6 times with different texts, then change its border in one place. | 6 min | 12 min |
| D3 Import | Import the given existing page `targets/diego/legacy.html`, then change its heading and add a section. | 4 min | 8 min |
| D4 Keyboard only | On a new page build: a section, a heading, two paragraphs in a row, a button. No mouse. | 5 min | 10 min |
| D5 Code review | Export and read the code as in a pull request: semantics, names, size, duplication. | 5 min | 10 min |

## Carla (pt-BR) — starts from Marina's saved project

| Task | Brief | Estimate | Limit |
|---|---|---|---|
| C1 Rebrand | The franchise's colour changes from the brand brown to green `#2f6f4e` on the whole site. | 3 min | 6 min |
| C2 Pages from a page | Make "Unidade Centro" and "Unidade Praia" from the home page, with their own titles. | 3 min | 6 min |
| C3 Menu everywhere | Add "Unidades" to the menu of every page. | 3 min | 6 min |
| C4 Catalogue | On a new page "Cardápio", list the 12 products of `targets/carla/cardapio.csv` as cards (name, price, photo). | 5 min | 10 min |
| C5 Never lose work | Reload the tab in the middle of an edit; check nothing is lost. | 1 min | 3 min |

## Probes (short, measured)

| Probe | What | Measure |
|---|---|---|
| P1 Large page | Open a page of 300+ elements (generated), select, drag, type, undo. | gesture→frame p50/p95, dispatch time |
| P2 Editor accessibility | Reach every panel and the canvas from the keyboard; focus visible. | panels reached, traps, invisible focus |
| P3 Small screen | Window 1280×720. | canvas share of the window, clipped panels |
| P4 Long history | 50 edits, undo all, redo all. | correctness, time per step |
