# Inspector visual audit

Visual thesis: calm, compact desktop controls with aligned labels, readable values and clearly grouped actions.
Content: preserve canvas and existing panel structure; improve secondary Inspector.
Interaction: retain existing focus, disclosure and popover behavior; no decorative animation.

## First sweep
Observed in real app at 1665 × 920, 100% zoom. Captures examined inline.

- Shared field grid splits compound rows and sends subgroup headings into value column. Width/height, font size/weight, gap pairs stack incorrectly.
- Generic grid leaks into custom children: media source and option rows, grid tracks, shadow buttons.
- Settings link and image picker buttons overflow panel; horizontal scrollbar appears.
- Link type segmented group has overlapping long labels, unusable.
- Interactions uses raw enum strings, blank scope value, empty option buttons and oversized delete label.
- Class popovers can overflow right edge and stay open together.
- Radius linking control appears in Layout instead of Border.
- Position/text alignment wrap unpredictably with reset buttons on another row.
- Settings long checkbox copy consumes multiple lines in narrow label column.

Implementation pending.

## Implemented
Shared Inspector layout in inspector.css; explicit pair labels; full-width textareas; aligned booleans/parts/actions; icon buttons for sources/links; vertical link-picker destinations; class popup bounds/dismissals; readable Interactions menus/scope and compact remove; Radius control correctly grouped; Position word grid; anchor icons. Typecheck passed. Lint passed before last focused refinements.

## Second sweep in progress
Full Style top-to-bottom captured, including expanded shadows/gradient/Advanced. Settings Page, Container, heading, link (all five picker types), image, video and select inspected after changes. Interactions empty/4 cards, all menu families and conditional fields inspected. Remaining work tracked in inventory.pending.
