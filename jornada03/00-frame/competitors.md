# Competitors: professional visual website builders (state at 2026-10-01)

Scope: Webflow, Framer, Figma Sites, Wix Studio, Elementor (Pro, v4), Pinegrow, Bootstrap Studio, against Builder.
Research date: 2026-10-01. Official docs, changelogs and press releases were preferred; where only third-party
reviews were found (pricing pages that would not load, review sites), the cell says so or the source is marked
"(secondary)" under Sources. Claims about Builder come from the project's own feature list, not from the web.

Legend: **yes** = shipped and usable by a professional; **partial** = exists with real limits; **no** = absent.

## 1. Capability matrix

### 1.1 Layout and visual fidelity

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Free-form box model (flex, grid, position) | yes, full CSS box model | yes, stacks/grid, canvas-like | yes, auto layout → CSS | yes, grid/flex/stacks | yes, flexbox containers; atomic Grid still in development (2026) | yes, any CSS | partial, Bootstrap grid first | yes, every CSS property in the Inspector |
| Full HTML element choice / semantics | yes, tag settings | partial, tag per frame | partial, div-heavy output criticised; tags set per layer | partial, semantic tags limited | partial, widget-based | yes, any tag | yes, Bootstrap components + custom HTML | yes, full HTML + SVG palette |
| Ready-made section templates | yes, Flowkit, libraries, marketplace | yes, marketplace/community | yes, blocks + libraries | yes, huge template library | yes, kits + Pro templates | partial, Bootstrap/Tailwind blocks | yes, components + premium templates | yes, hero/navbar/card/grid/form/tabs/accordion/modal/gallery |
| Layers tree | yes, Navigator | yes | yes (Figma layers) | yes | yes, Structure panel | yes, Tree | yes, Overview | yes |
| Pseudo-states (hover, focus…) | yes | yes, variants | partial, via interactions/variants | yes | yes | yes | yes | yes |

### 1.2 Responsive

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Breakpoints | yes, desktop-first cascade, 6+ | yes, custom breakpoints | yes, named breakpoints | yes, custom breakpoints | yes, 7 device modes | yes, any media query | yes, Bootstrap breakpoints | yes, 4 fixed (1440/1180/834/390), max-width cascade |
| Responsive components (variant per breakpoint) | partial | yes | yes, auto-swaps variant by breakpoint name | partial | partial | no | no | no |
| Auto-responsive / AI responsive fixing | partial, AI assistant | yes, Agents "make layouts responsive" (2026) | partial | yes, AI responsive optimisation | partial, Angie | no | no | no |
| Fluid type / clamp() | yes (via code or variables) | yes | partial | partial | yes, v4 units | yes | partial | partial, by typing values |

### 1.3 Design system: classes, variables, components, variants

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Reusable style classes | yes, combo classes | partial, styles not classes | partial, text/colour styles; auto class names | yes, CSS classes + custom CSS | yes, v4 Classes (Apr 2026) | yes, real CSS rules | yes, CSS + Bootstrap utilities | yes, style classes |
| Design variables / tokens with modes | yes, collections + modes | yes, colour/text styles, modes | yes, Figma variables + modes | partial, theme colours/fonts | yes, v4 Variables, import/export between sites | partial, CSS custom props | partial, Bootstrap theme vars | yes, design variables |
| Components with props / slots | yes, props, slots, shared libraries | yes, variants, props, code components | yes, Figma components | partial | yes, v4 Components (Pro) | yes, smart components / master pages (Pro) | yes, linked components | yes, create / instance / detach |
| Component variants | yes | yes | yes | partial | partial | no | no | no |
| Linked copies / symbols across pages | yes | yes | yes | yes | yes, global widgets | yes | yes | yes, "Repeat" |
| Cross-project shared libraries | yes, Shared Libraries | yes, via remix/packages | yes, team libraries | partial | yes, export/import classes+vars | partial | partial | no |

### 1.4 Content and data: CMS, collections, data binding

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| CMS collections + template pages | yes, 20k items on Premium | yes, 1k–40k items | partial, beta Nov 2025, 200 items/collection | yes, CMS + datasets | yes, WordPress posts/CPT + Loop | partial, via WordPress builder add-on | partial, built-in blog (tags, authors) | no |
| Bind repeated items to external data | partial, CMS API / Apps | partial, CMS sync plugins | partial | yes, datasets, Velo | yes, dynamic tags/ACF | partial, WordPress | no | partial, "Fill from data" from a project JSON/CSV, at design time |
| Localization | yes, paid add-on | yes, paid per locale | no | yes, Wix Multilingual | partial, WPML/Polylang plugins | no | no | no (UI is bilingual; sites are not) |

### 1.5 Code: export quality, custom code, import / round-trip

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Static code export | partial, HTML/CSS/JS on paid workspace; CMS, logic, ecommerce not exported; webflow.js runtime | no official export | partial, export for Full seats; output quality criticised | no | no, WordPress-bound | yes, it edits your files directly | yes, clean Bootstrap HTML/CSS/JS | yes, ZIP: semantic HTML + one BEM CSS, no inline styles, small JS |
| Readable class naming in output | yes, your class names | no, hashed | no, autogenerated (css-xxxx) | n/a | partial, e-/elementor- classes | yes | yes | yes, BEM |
| Custom code (embed, head, CSS) | yes | yes, code overrides + code components (React) | yes, code layers (React, early access Jul 2026) | yes, Velo/JS, custom CSS | yes, custom CSS/HTML/PHP | yes, full code editor | yes, full code editor | partial, interactions JS generated; no arbitrary code blocks noted |
| React/code components on canvas | yes, Code Components (React import, DevLink) | yes, Workshop + code components | yes, code layers | partial, Velo | partial, custom widgets via Angie | partial, Vue Designer | no | no |
| Import existing HTML / round-trip | no (only paste from Figma/other apps) | partial, "HTML to Framer" guide | partial, code layers can clone repos (2026) | no | no | yes, opens and saves real HTML, true round-trip | partial, HTML import | partial, HTML import into the document (one-way) |
| Project file you own / works offline | no, cloud | no, cloud | no, cloud | no, cloud | partial, self-hosted WordPress | yes, local files, offline | yes, desktop app, local .bsdesign | yes, project file + IndexedDB autosave with versions, runs in Chrome |

### 1.6 Interactions and animation

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Click/hover triggers → show/hide/class | yes, Interactions | yes, variants/effects | yes, preset interactions | yes | yes, Motion effects | yes, Interactions add-on | partial | yes, show/hide/toggle class/play animation |
| Keyframe timeline | yes, Interactions timeline (GSAP-based) | yes, effects + appear/scroll | yes, native animations/3D at Config 2026 | yes | partial | yes, scroll scenes timeline | partial, animations; View Transitions (v8, Feb 2026) | yes, keyframe animations + Timeline |
| Scroll-driven animation | yes | yes | yes | yes | yes | yes | partial | no (not listed) |
| Page transitions | partial | yes | partial | partial | no | partial | yes, View Transitions | no |

### 1.7 Assets, fonts and image optimisation

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Asset manager | yes | yes | yes | yes, Media Manager | yes, WP Media | yes, project files | yes | yes, file tree with folders |
| Custom fonts | yes | yes | yes | yes | yes | yes | yes | yes |
| Automatic responsive images / AVIF/WebP | yes, auto srcset + WebP/AVIF | yes, CDN-optimised | yes, CDN | yes | partial, Image Optimizer in Elementor One | no | yes, optimise dialog + responsive images (7.1) | no |

### 1.8 SEO and accessibility tooling

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Page meta / OG / sitemap | yes | yes | partial | yes, SEO tools | yes, via WP SEO plugins | partial, manual | yes | partial, SEO checks; meta authored in project |
| In-editor a11y audit | partial, Audit panel beta: 4 checks, skips components | yes, Agents audit links/contrast/a11y (2026) | partial, settings per layer, no pre-publish warnings | partial | partial, Ally plugin in Elementor One | no | partial, link aria/title fields | yes, accessibility/link/SEO checks panel |
| AEO / AI search optimisation | yes, AEO agents (Team plan) | partial | no | partial | no | no | no | no |

### 1.9 Collaboration and review

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Real-time multiplayer | yes, same-page co-editing (2025) | yes | yes, Figma multiplayer | yes | no | no | no | no |
| Comments / review | yes | yes | yes | yes | partial, Notes | no | no | no |
| Branching / staging / approval | yes, page branching + publishing workflows | yes, Branching (Jun 2026) | partial, version rollback | partial, release candidates | partial, WP staging | no | no | no |
| Version history | yes, backups | yes | yes | yes | partial, WP revisions | partial, git-friendly files | partial | yes, local versions (no diff) |

### 1.10 AI features

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Prompt-to-site | yes, AI site builder (multi-page, GA 2026) | yes, Wireframer + Agents | yes, AI prompts; Figma Make | yes, Harmony + Aria (Jan 2026) | yes, AI site planner / Angie | partial, AI Assistant edits pages | yes, v8 AI Assistant creates pages (Feb 2026) | no |
| AI on canvas (edit, restyle, copy) | yes, AI Assistant | yes, Agents edit pages, CMS, SEO | yes | yes | yes | yes, Smart HTML Edit, AI style edit | yes | no |
| AI code components | yes, AI code components | yes, Workshop | yes, code layers via chat | yes, AI code assistant | yes, Angie custom widgets | yes, BYO model (Claude, GPT, custom) | yes | no |
| External agent access (MCP / API) | yes, MCP server + Data API | yes, External Agents (Jun 2026) | yes, Dev Mode MCP | partial | yes, Angie via MCP | partial, BYO API key | no | no (manifest of commands could be exposed) |

### 1.11 Publishing / hosting, Figma import, pricing

| Capability | Webflow | Framer | Figma Sites | Wix Studio | Elementor v4 | Pinegrow | Bootstrap Studio | Builder |
|---|---|---|---|---|---|---|---|---|
| Hosting / one-click publish | yes, + Webflow Cloud for apps | yes | yes, custom domains on paid seats | yes | partial, Elementor Hosting or any WP host | no, FTP/your host | partial, Bootstrap Studio hosting + FTP | no, export ZIP only |
| Forms backend | yes | yes | partial | yes | yes, Pro forms | no | yes, form handling | no |
| Ecommerce | yes | no (third-party) | no | yes, Wix Stores | yes, WooCommerce | partial, WooCommerce add-on | no | no |
| Figma import | yes, Figma to Webflow: layers, variables (multi-mode, Sep 2025), styles | yes, "Figma to HTML with Framer" paste | native | yes, Figma to Wix Studio plugin (Jun 2024) | partial, third-party | no | no | no |
| Pricing model | site plan (free / Basic / Premium ~$25–39/mo / Team ~$2.5k/mo) + workspace seats; export needs paid workspace (secondary) | Free / Basic $10 / Pro $30 per site + editor seats; AI credits | Figma Full seat ~$16/mo+ (Professional) | free agency workspace; client pays site plan ~$19–159/mo (secondary) | Editor Pro $59–399/yr; Elementor One $15–36/mo with AI credits (secondary) | desktop licence ~$49.50/yr or one-time; add-ons | one-time licence + paid updates (desktop) | n/a (local tool) |
| Target user | agencies, marketing teams, enterprise | designers, startups, marketing | Figma-native designers | agencies, freelancers | WordPress freelancers/agencies | front-end devs who own their code | Bootstrap devs, freelancers | professionals who want clean exported code |

## 2. Where Builder stands

### At parity
- Core visual editing: full CSS Inspector, Layers, states, classes, variables, components with instances/detach and
  linked copies — comparable to Webflow and Elementor v4 (which only reached classes/variables/components in April 2026).
- Keyframe animations with a Timeline and click interactions — comparable to Pinegrow Interactions and Webflow's
  basic interactions.
- Multi-page projects, asset tree, custom fonts, HTML import, preview, versioned autosave.
- In-editor accessibility/link/SEO checks: broader than Webflow's Audit panel (4 checks, components skipped) and
  Figma Sites (no pre-publish warnings).

### Behind
- **AI**: every competitor (even Pinegrow and Bootstrap Studio) now has an AI assistant; four have prompt-to-site and
  two (Framer, Webflow) expose agents/MCP. Builder has none.
- **Publishing/hosting, forms, CMS, localization, ecommerce**: Builder stops at the ZIP.
- **Collaboration**: no multiplayer, comments, branching or diff, which Webflow, Framer, Figma and Wix all have.
- **Figma import**: Webflow, Framer, Wix and Figma Sites all bring Figma frames and variables in.
- **Responsive depth**: 4 fixed breakpoints, no responsive variants, no scroll-driven animation, no image optimisation
  (srcset/AVIF/WebP).
- **Component variants / props / slots** and cross-project libraries.

### Ahead
- **Export quality**: semantic HTML + one BEM CSS file, no inline styles, no runtime framework. Only Pinegrow and
  Bootstrap Studio are in the same league, and they tie you to hand-authored or Bootstrap CSS. Webflow exports need a
  paid workspace and ship `webflow.js`; Framer and Wix do not export; Figma Sites output is criticised for div soup and
  hashed classes.
- **Local-first ownership**: a project file plus local versions in the browser, no account, no seat. Only the two
  desktop apps (Pinegrow, Bootstrap Studio) match this, and they need an installer.
- **"Fill from data"** from a project JSON/CSV at design time is a lightweight path nobody else offers without a CMS.
- **Contract-driven UI** (manifest → every door, command bar, scenarios): no competitor exposes its command surface
  as a declarative contract; this is the natural base for an agent/MCP interface.

## 3. Notable competitor innovations, 2024–2026

1. **Framer Agents (16 Jun 2026)** — agents on the canvas edit pages, components, CMS, SEO, responsiveness and audit
   accessibility; plus External Agents and Branching. https://www.rutlandherald.com/news/business/framer-launches-ai-agents/article_548d5bc1-755b-59aa-b334-714bb0502779.html
2. **Framer Wireframer + Workshop (May 2025)** — prompt-to-layout and vibe-coded on-brand code components.
   https://www.businesswire.com/news/home/20250521574932/en/
3. **Webflow AI site builder (launched Feb 2026, now GA)** — prompt to a multi-page site built on Flowkit, with
   variables, text styles and animations, editable in the Designer. https://webflow.com/updates/ai-site-builder-evolved
4. **Webflow App Gen + Webflow Cloud (Webflow Conf, Sep 2025)** — prompt-to-production apps that reuse the site's
   design system and CMS, deployed next to the site; plus AEO and real-time co-editing. https://webflow.com/blog/app-gen
5. **Webflow Figma design-system sync (Sep 2025)** — multiple variable collections and modes, aliases kept as aliases.
   https://webflow.com/updates/sync-multiple-variable-collections-and-modes-from-figma-to-webflow
6. **Figma Sites (Config, May 2025)** — design-to-published-site inside Figma with responsive components that swap
   variants per breakpoint. https://www.figma.com/blog/introducing-figma-sites/
7. **Figma Sites CMS (public beta, Nov 2025)** — collections, dynamic CMS pages, CMS lists.
   https://www.cmswire.com/digital-experience/figma-launches-code-layers-motion-at-config-2026/
8. **Figma code layers + native motion (Config, Jun 2026)** — React-backed code layers on the canvas, editable by chat,
   repositories cloned into design layers; native animations and 3D transforms.
   https://thenextweb.com/news/figma-config-code-layers-ai-skills-plugins-animations
9. **Wix Harmony + Aria (21 Jan 2026)** — hybrid vibe coding + drag-and-drop with a site-building agent.
   https://www.globenewswire.com/news-release/2026/01/21/3222826/0/en/Wix-Launches-Wix-Harmony
10. **Elementor v4 Atomic Editor (4.0, Apr 2026)** — CSS-first classes, variables and components, portable between
    sites. https://elementor.com/products/website-builder/v4-faq/
11. **Elementor Angie (2025–2026)** — free agentic WordPress plugin that builds widgets, code and pages through MCP.
    https://elementor.com/help/what-is-angie/
12. **Bootstrap Studio 8 (10 Feb 2026)** and **Pinegrow 8.x (2024–2025)** — even the desktop, code-clean tools added
    autonomous AI assistants (BYO model in Pinegrow, Smart HTML Edit), View Transitions and an inline-style-to-class
    extractor. https://bootstrapstudio.io/pages/releases · https://docs.pinegrow.com/release_notes/

## 4. Opportunities no competitor does well

1. **Agent-operable by contract.** Builder's manifest already lists every command, door and scenario. Exposing it as
   an MCP/CLI surface ("dispatch a command, get JSON patches back, validated") would give any external AI a safe,
   deterministic, undoable API to the editor — Framer/Webflow agents are proprietary and cloud-bound; Pinegrow's AI
   rewrites HTML text. Bring-your-own-model, no credits.
2. **Export you would hand to a code reviewer.** Semantic HTML, one BEM stylesheet, no runtime, no inline styles —
   and a promise to keep it that way, measured (HTML validity, a11y score, CSS size, zero unused rules) on every export.
   Nobody publishes export quality metrics; Figma Sites and Framer are criticised on exactly this.
3. **Accessibility as a gate, not a panel.** Webflow's audit has 4 checks and skips components; Figma warns of
   nothing. A builder whose checks cover components, contrast per state/breakpoint, focus order and landmarks, and that
   can block export, would own the "accessible by construction" claim.
4. **Local-first, account-free, git-friendly project files.** A readable, diff-able project JSON (with a version
   diff in-app) fits agencies who keep client work in git. Cloud builders cannot offer this; the desktop tools use
   opaque or framework-bound formats.
5. **Data-to-page without a CMS.** "Fill from data" from JSON/CSV can grow into static generation: one template page ×
   N rows → N exported pages (directories, catalogues, event lists) with no hosting lock-in — the part of a CMS
   static-site professionals actually need. Webflow does not even export its CMS.
6. **Real HTML round-trip for hand-off.** Only Pinegrow edits real files. Import → edit → export that preserves
   classes and structure (and re-imports the export losslessly) would make Builder safe to use on a developer's code,
   not just on its own.
7. **Design tokens as a first-class export.** Variables exported as CSS custom properties plus a W3C Design Tokens
   JSON, importable back — a neutral bridge to Figma variables and code without a proprietary sync plugin.
8. **Bilingual, offline, no-seat tool for the pt-BR market.** Most competitors price per seat/site in USD and are
   English-first; a free-to-run, Portuguese-native, local tool is an underserved niche (claim to validate).

## Sources (all accessed 2026-10-01)

Official / primary:
- https://bootstrapstudio.io/pages/releases
- https://docs.pinegrow.com/release_notes/
- https://pinegrow.com/release_notes/pinegrow-web-editor-8-5/
- https://pinegrow.com/release_notes/pinegrow-web-editor-8-6/
- https://pinegrow.com/
- https://www.framer.com/pricing
- https://framer.com/academy/lessons/import-from-figma
- https://www.framer.com/learn/html-to-framer/
- https://www.businesswire.com/news/home/20250521574932/en/Framer-Launches-AI-Features-to-Supercharge-Web-Design-Democratizing-How-Stunning-Websites-are-Built
- https://webflow.com/updates/ai-site-builder-evolved
- https://webflow.com/blog/ai-site-builder
- https://webflow.com/blog/app-gen
- https://webflow.com/updates/app-gen
- https://webflow.com/updates/sync-multiple-variable-collections-and-modes-from-figma-to-webflow
- https://webflow.com/updates/major-figma-to-webflow-improvements
- https://help.webflow.com/hc/en-us/articles/33961386739347 (code export)
- https://help.webflow.com/hc/en-us/articles/33961313088531 (Audit panel)
- https://webflow.com/updates/find-and-fix-accessibility-issues-with-new-audit-panel
- https://www.figma.com/blog/introducing-figma-sites/
- https://help.figma.com/hc/en-us/articles/31242789265431-Improve-the-accessibility-of-your-site
- https://help.figma.com/hc/en-us/articles/31242838116119 (text styles per breakpoint)
- https://help.figma.com/hc/en-us/articles/35895608840599-Figma-Sites-collection-Figma-Sites-collection-overview
- https://status.figma.com/incidents/y8pltwjvzwsl
- https://www.globenewswire.com/news-release/2026/01/21/3222826/0/en/Wix-Launches-Wix-Harmony
- https://wix.com/press-room/home/post/wix-studio-announces-a-new-figma-plugin-to-turn-designs-into-functional-interactive-websites
- https://www.wix.com/studio/academy/guides/exporting-designs-from-figma-to-wix-studio
- https://elementor.com/products/website-builder/v4-faq/
- https://developers.elementor.com/elementor-editor-4-0-developers-update/
- https://elementor.com/help/what-is-angie/
- https://elementor.com/blog/elementor-angie-cloudfest/

Press and secondary (used for dates, pricing and criticism where official pages did not load):
- https://thenextweb.com/news/figma-config-code-layers-ai-skills-plugins-animations (24 Jun 2026)
- https://www.cmswire.com/digital-experience/figma-launches-code-layers-motion-at-config-2026/
- https://www.rutlandherald.com/news/business/framer-launches-ai-agents/article_548d5bc1-755b-59aa-b334-714bb0502779.html (16 Jun 2026)
- https://ecommercenews.com.au/story/framer-launches-ai-agents-for-website-creation-editing
- https://www.techradar.com/pro/framer-aims-to-increase-productivity-but-maintain-magic-with-new-website-building-features
- https://www.hunted.space/dashboard/webflow/launches/webflow-ai-site-builder (Webflow AI site builder, 5 Feb 2026)
- https://cmswire.com/digital-experience/webflow-launches-ai-powered-app-gen-for-web-experiences
- https://www.digidop.com/blog/recap-of-webflow-conf-2025
- https://www.flowninja.com/blog/webflow-pricing-demystified (Webflow pricing; webflow.com/pricing failed to load)
- https://www.nocode.mba/articles/webflow-pricing-2026
- https://brixtemplates.com/blog/can-you-export-a-webflow-website-understanding-code-export-limitations
- https://uxdesign.cc/figma-sites-when-accessibility-is-an-afterthought-070ba3b41553
- https://www.creativejuiz.fr/blog/en/user-experience/figma-sites-a-promising-start-still-not-accessible
- https://www.banani.co/blog/figma-pricing-and-credits
- https://www.techradar.com/pro/website-building/wix-launches-harmony-a-hybrid-approach-to-vibe-coding-and-visual-design
- https://www.techradar.com/pro/website-building/wix-studio-review
- https://toolradar.com/tools/wix-studio/pricing
- https://theplusaddons.com/blog/elementor-atomic-editor-explained/
- https://kopfundstift.de/elementor-pro-kosten/
- https://usagepricing.com/blueprint/elementor
- https://forum.figma.com/ask-the-community-7/why-can-t-i-import-figma-html-into-farmer-40948

Caveats: matrix cells for features not explicitly confirmed by a 2025–2026 source (for example Wix Studio semantic
tags, Elementor page transitions, Bootstrap Studio forms) reflect long-standing product behaviour and should be
re-verified before being quoted externally. Pricing figures marked "secondary" come from third-party reviews.
