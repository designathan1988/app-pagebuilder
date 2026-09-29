// Small drop targets beyond the scenarios (spec drag-drop-inside, Problems in Pager 5; drag-reorder-canvas, Problems in
// Pager 6; the user's real-use audit, item 2.2), at 25 %: a tile released 10 screen px below the middle of the Hero's
// empty Actions, outside its own box, over the Hero's bottom padding, lands inside Actions (its aim); a tile released
// near the Hero's top, past where a band taken in CSS pixels would end but inside the band taken in screen pixels,
// lands before the Hero. The points are measured against the boxes on the screen; the document is read through the
// read-only test port.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, openMenu, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const ZOOM_25 = 'view.zoomTo#menu-zoom-25';
const INSERT_PANEL = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';
const ROW = 'selection.select#layers-row';
const DISPLAY = 'style.set#inspector-display';
const PALETTE_DRAG = 'element.insert#canvas-drag-palette-tile-drop-proposal';

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
interface Tree {
  readonly id: string;
  readonly name: string;
  readonly children: readonly Tree[];
}

// the names of a node's children in the document the port reads
async function childrenOf(page: Page, id: string): Promise<readonly string[]> {
  const doc = (await page.evaluate(() => (window as unknown as Record<string, { document: () => unknown }>).__builderTestPort?.document())) as { pages: { tree: Tree }[] };
  const find = (n: Tree): Tree | undefined => (n.id === id ? n : n.children.map(find).find((x) => x !== undefined));
  const tree = doc.pages[0]?.tree;
  return (tree === undefined ? undefined : find(tree))?.children.map((c) => c.name) ?? [];
}
// the screen box of a node's element: its box in the frame, through the frame's content box and CSS zoom
function screenBox(page: Page, id: string): Promise<Box> {
  return page.evaluate((node) => {
    const iframe = document.querySelector<HTMLIFrameElement>('.frame__page');
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) throw new Error('the canvas has no page');
    const zoom = iframe.currentCSSZoom;
    const frame = iframe.getBoundingClientRect();
    const style = getComputedStyle(iframe);
    const left = frame.left + (parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft)) * zoom;
    const top = frame.top + (parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop)) * zoom;
    const el = doc.querySelector(`[data-node="${node}"]`);
    if (!el) throw new Error(`the canvas does not draw ${node}`);
    const r = el.getBoundingClientRect();
    return { x: left + r.left * zoom, y: top + r.top * zoom, width: r.width * zoom, height: r.height * zoom };
  }, id);
}
// the node under a screen point on the canvas: the nearest element standing for a node
function nodeUnder(page: Page, at: { readonly x: number; readonly y: number }): Promise<string | null> {
  return page.evaluate((p) => {
    const iframe = document.querySelector<HTMLIFrameElement>('.frame__page');
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return null;
    const zoom = iframe.currentCSSZoom;
    const frame = iframe.getBoundingClientRect();
    const style = getComputedStyle(iframe);
    const left = frame.left + (parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft)) * zoom;
    const top = frame.top + (parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop)) * zoom;
    return doc.elementFromPoint((p.x - left) / zoom, (p.y - top) / zoom)?.closest('[data-node]')?.getAttribute('data-node') ?? null;
  }, at);
}
async function canvasZoom(page: Page): Promise<number> {
  return page.evaluate(() => document.querySelector<HTMLIFrameElement>('.frame__page')?.currentCSSZoom ?? 0);
}
// presses the paragraph tile, moves the pointer to a point of the page in steps, the button held, and releases there
async function dropTileAt(page: Page, at: { readonly x: number; readonly y: number }): Promise<void> {
  const tile = control(page, TILE, { args: { entry: 'paragraph' } });
  // the insert panel is a scrollable palette: the tile is scrolled to before it is pressed, as a person does
  await tile.scrollIntoViewIfNeeded();
  const box = await tile.boundingBox();
  if (box === null) throw new Error('the paragraph tile is not laid out');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2 + 10, { steps: 3 });
  await page.mouse.move(at.x, at.y, { steps: 12 });
  await expect(page.locator('[data-chrome="drop-label"]')).toHaveCount(1);
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-actions"]')).toHaveCount(1);
});

// View › Zoom › 25 %, then the Insert panel
async function at25(page: Page): Promise<void> {
  await openMenu(page, 'zoom');
  await control(page, ZOOM_25).click();
  await expect.poll(() => canvasZoom(page)).toBeCloseTo(0.25, 2);
  await runDoor(page, INSERT_PANEL);
}
// at the fit zoom: a Link in the Hero's Actions (selected in Layers, laid out as `display` says), the Insert panel open
async function linkInActions(page: Page, display: string | null): Promise<Box> {
  await control(page, ROW, { args: { target: 'n-actions' } }).click();
  if (display !== null) {
    await control(page, DISPLAY).locator('input').click();
    await page.keyboard.press('Control+A');
    await page.keyboard.type(display);
    await page.keyboard.press('Enter');
  }
  await runDoor(page, INSERT_PANEL);
  await control(page, TILE, { args: { entry: 'link' } }).click();
  await expect.poll(() => childrenOf(page, 'n-actions')).toEqual(['Link']);
  const link = await page.evaluate(() => document.querySelector<HTMLIFrameElement>('.frame__page')?.contentDocument?.querySelector('[data-node="n-actions"] > [data-node]')?.getAttribute('data-node') ?? '');
  return screenBox(page, link);
}

test('at the fit zoom, over the centre of a link in a row of inline links, the drop lands beside it, not out of the row', runs(OPEN, ROW, INSERT_PANEL, TILE, PALETTE_DRAG), async ({ page }) => {
  const link = await linkInActions(page, null);
  const actions = await screenBox(page, 'n-actions');
  // a row shorter than twice the escape band's floor and slop (8 px): only its third (drag-reorder-canvas, Problems
  // in Pager 6) keeps the middle of the link out of the row's escape band
  expect(actions.height).toBeLessThan(16);
  const at = { x: link.x + link.width * 0.75, y: actions.y + actions.height / 2 };
  expect(await nodeUnder(page, at)).not.toBe('n-actions');
  await dropTileAt(page, at);
  await expect.poll(() => childrenOf(page, 'n-actions')).toEqual(['Link', 'Paragraph']);
});

test("at the fit zoom, over a link of a flex row near the row's top edge, the drop stays in the row beside it", runs(OPEN, ROW, DISPLAY, INSERT_PANEL, TILE, PALETTE_DRAG), async ({ page }) => {
  const link = await linkInActions(page, 'flex');
  const actions = await screenBox(page, 'n-actions');
  // 2 px below the row's top edge: within its escape band (a third of it), over the link
  const at = { x: link.x + link.width * 0.75, y: actions.y + 2 };
  expect(Math.min(8, actions.height / 3)).toBeGreaterThan(2);
  expect(await nodeUnder(page, at)).not.toBe('n-actions');
  await dropTileAt(page, at);
  await expect.poll(() => childrenOf(page, 'n-actions')).toEqual(['Link', 'Paragraph']);
});

test('at 25 % a tile released outside an empty container, within its aim, lands inside it', runs(OPEN, ZOOM_25, INSERT_PANEL, PALETTE_DRAG), async ({ page }) => {
  await at25(page);
  const actions = await screenBox(page, 'n-actions');
  // the container is shorter than the aim on the screen, and the point is outside its own box, over the Hero
  expect(actions.height).toBeLessThan(40);
  const at = { x: actions.x + actions.width / 2, y: actions.y + actions.height / 2 + 10 };
  expect(at.y).toBeGreaterThan(actions.y + actions.height);
  expect(await nodeUnder(page, at)).toBe('n-hero');
  await dropTileAt(page, at);
  await expect.poll(() => childrenOf(page, 'n-actions')).toEqual(['Paragraph']);
});

test('at 25 % the band at the top of the Hero keeps its size in screen pixels', runs(OPEN, ZOOM_25, INSERT_PANEL, PALETTE_DRAG), async ({ page }) => {
  await at25(page);
  const hero = await screenBox(page, 'n-hero');
  const zoom = await canvasZoom(page);
  // the band in screen pixels, and the one the same table gives in CSS pixels, scaled to the screen
  const band = Math.min(Math.max(8, Math.min(0.25 * hero.height, 32)), 0.4 * hero.height);
  const cssBand = Math.min(Math.max(8, Math.min((0.25 * hero.height) / zoom, 32)), (0.4 * hero.height) / zoom) * zoom;
  expect(band - cssBand).toBeGreaterThanOrEqual(2);
  const at = { x: hero.x + hero.width / 2, y: hero.y + (band + cssBand) / 2 };
  expect(await nodeUnder(page, at)).toBe('n-hero');
  await dropTileAt(page, at);
  await expect.poll(async () => (await childrenOf(page, 'n-page'))[0]).toBe('Paragraph');
});
