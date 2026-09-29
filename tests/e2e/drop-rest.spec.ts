// Where a drop lands, under a hand's gestures (spec drag-reorder-canvas, Problems in Pager 9; the user's real-use
// audit, item 3.2, as the user corrected it on 2026-09-27: a person moves gradually, rests the pointer between two
// elements and trembles a few pixels before letting go; nothing previews the dropped element, in the page or over it).
// While the pointer rests there: one proposal all along, the insertion line still, the page's elements never moving,
// no preview drawn and the document unchanged (read through the read-only test port); the release lands where the
// line was. Escape takes the line away and the release changes nothing. A tile rests and lands the same way.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const ROW = 'selection.select#layers-row';
const MOVE = 'element.moveTo#canvas-drag-canvas-element-before-after';
const INSERT_PANEL = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';
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
type Port = { document: () => { pages: { tree: Tree }[] } };

const documentText = (page: Page) => page.evaluate(() => JSON.stringify((window as unknown as { __builderTestPort?: Port }).__builderTestPort?.document() ?? null));
async function childrenOf(page: Page, id: string): Promise<readonly string[]> {
  const tree = await page.evaluate(() => (window as unknown as { __builderTestPort?: Port }).__builderTestPort?.document().pages[0]?.tree);
  const find = (n: Tree): Tree | undefined => (n.id === id ? n : n.children.map(find).find((x) => x !== undefined));
  return (tree === undefined ? undefined : find(tree))?.children.map((c) => c.name) ?? [];
}
// the screen box of a node's element: its box in the frame, through the frame's content box and CSS zoom
function nodeBox(page: Page, id: string): Promise<Box> {
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
const chromeBox = (page: Page, name: string) => page.evaluate((n) => document.querySelector(`[data-chrome="${n}"]`)?.getBoundingClientRect().toJSON() as Box | undefined, name);

// A hand's approach: from where the pointer is to `at` in many small steps, then a rest of about a second while the
// hand trembles up to 2 px; each moment of the rest is read by `read`.
async function approachAndRest<T>(page: Page, from: { x: number; y: number }, at: { x: number; y: number }, read: () => Promise<T>): Promise<T[]> {
  await page.mouse.move(from.x + 12, from.y + 12, { steps: 4 });
  await page.mouse.move(at.x, at.y, { steps: 25 });
  const seen: T[] = [];
  for (let k = 0; k < 20; k++) {
    await page.mouse.move(at.x + (k % 3) - 1, at.y + ((k * 7) % 5) - 2);
    await page.waitForTimeout(50);
    seen.push(await read());
  }
  return seen;
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-title"]')).toHaveCount(1);
});

// the Title pressed and carried to rest in the gap between the Intro and the Actions: every moment of the rest
async function restTitleBetweenIntroAndActions(page: Page) {
  await control(page, ROW, { args: { target: 'n-title' } }).click();
  const title = await nodeBox(page, 'n-title');
  const intro = await nodeBox(page, 'n-intro');
  const actions = await nodeBox(page, 'n-actions');
  const start = { x: title.x + title.width / 3, y: title.y + title.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const gap = { x: intro.x + intro.width * 0.4, y: (intro.y + intro.height + actions.y) / 2 };
  const moments = await approachAndRest(page, start, gap, async () => ({
    label: await page.locator('[data-chrome="drop-label"]').textContent(),
    line: await chromeBox(page, 'drop-line'),
    previews: await page.locator('[data-chrome="drop-preview"]').count(),
    intro: await nodeBox(page, 'n-intro'),
    actions: await nodeBox(page, 'n-actions'),
  }));
  return { title, intro, actions, moments };
}

test('resting between two elements with a trembling hand: one proposal, the line still, nothing in the page moves, and the release lands there', runs(OPEN, ROW, MOVE), async ({ page }) => {
  const before = await documentText(page);
  const { intro, actions, moments } = await restTitleBetweenIntroAndActions(page);
  expect([...new Set(moments.map((m) => m.label))]).toEqual(['Between Intro and Actions · Page › Hero']);
  const line = moments[0]?.line;
  if (line === undefined) throw new Error('the line is drawn during the rest');
  // the line lies in the gap between the Intro and the Actions
  expect(line.y + line.height / 2).toBeGreaterThanOrEqual(intro.y + intro.height - 1);
  expect(line.y + line.height / 2).toBeLessThanOrEqual(actions.y + 1);
  for (const m of moments) {
    expect(m.intro).toEqual(intro);
    expect(m.actions).toEqual(actions);
    expect(m.line).toEqual(line);
    expect(m.previews).toBe(0);
  }
  expect(await documentText(page)).toBe(before);
  await page.mouse.up();
  await expect.poll(() => childrenOf(page, 'n-hero')).toEqual(['Intro', 'Title', 'Actions']);
  await expect(page.locator('[data-chrome="drop"]')).toHaveCount(0);
});

test('Escape during the rest takes the line away, and the release changes nothing', runs(OPEN, ROW, MOVE), async ({ page }) => {
  const before = await documentText(page);
  await restTitleBetweenIntroAndActions(page);
  await expect(page.locator('[data-chrome="drop-line"]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-chrome="drop"]')).toHaveCount(0);
  await page.mouse.up();
  expect(await documentText(page)).toBe(before);
});

test('a tile resting between two elements keeps one proposal and the line still, and its release inserts where the line was', runs(OPEN, INSERT_PANEL, PALETTE_DRAG), async ({ page }) => {
  await runDoor(page, INSERT_PANEL);
  const before = await documentText(page);
  const title = await nodeBox(page, 'n-title');
  const intro = await nodeBox(page, 'n-intro');
  const tile = await control(page, TILE, { args: { entry: 'paragraph' } }).boundingBox();
  if (tile === null) throw new Error('the paragraph tile is not laid out');
  const start = { x: tile.x + tile.width / 2, y: tile.y + tile.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const moments = await approachAndRest(page, start, { x: intro.x + intro.width * 0.4, y: (title.y + title.height + intro.y) / 2 }, async () => ({
    label: await page.locator('[data-chrome="drop-label"]').textContent(),
    line: await chromeBox(page, 'drop-line'),
    intro: await nodeBox(page, 'n-intro'),
  }));
  expect([...new Set(moments.map((m) => m.label))]).toEqual(['Insert Paragraph · between Title and Intro · Page › Hero']);
  for (const m of moments) {
    expect(m.intro).toEqual(intro);
    expect(m.line).toEqual(moments[0]?.line);
  }
  expect(await documentText(page)).toBe(before);
  await page.mouse.up();
  await expect.poll(() => childrenOf(page, 'n-hero')).toEqual(['Title', 'Paragraph', 'Intro', 'Actions']);
});
