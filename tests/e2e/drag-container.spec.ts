// A drag started inside a selected container drags the container (spec drag-reorder-canvas, Problems in Pager 12; the
// user's real-use audit, item 3.5), with a hand's gesture: the second card selected in Layers, a press on its title
// on the canvas carried to the gap between the Hero's Intro and Actions moves the card there, its title still in it;
// a press on its title released without a drag selects the title. The document and the selection are read through the
// read-only test port.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const ROW = 'selection.select#layers-row';
const CLICK = 'selection.select#canvas-click-element-or-page';
const MOVE = 'element.moveTo#canvas-drag-canvas-element-before-after';

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
interface Tree {
  readonly id: string;
  readonly children: readonly Tree[];
}
type Port = { document: () => { pages: { tree: Tree }[] }; selection: () => string[] };
const read = (page: Page) =>
  page.evaluate(() => {
    const p = (window as unknown as { __builderTestPort: Port }).__builderTestPort;
    return { tree: p.document().pages[0]?.tree, selection: p.selection() };
  });
async function childrenOf(page: Page, id: string): Promise<readonly string[]> {
  const { tree } = await read(page);
  const find = (n: Tree): Tree | undefined => (n.id === id ? n : n.children.map(find).find((x) => x !== undefined));
  return (tree === undefined ? undefined : find(tree))?.children.map((c) => c.id) ?? [];
}
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

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-card-b-title"]')).toHaveCount(1);
  await control(page, ROW, { args: { target: 'n-card-b' } }).click();
  await expect.poll(async () => (await read(page)).selection).toEqual(['n-card-b']);
});

test('with the card selected, a drag from its title moves the card, the title still in it', runs(OPEN, ROW, MOVE), async ({ page }) => {
  const title = await nodeBox(page, 'n-card-b-title');
  const from = { x: title.x + title.width / 3, y: title.y + title.height / 2 };
  const intro = await nodeBox(page, 'n-intro');
  const actions = await nodeBox(page, 'n-actions');
  const gap = { x: intro.x + intro.width * 0.4, y: (intro.y + intro.height + actions.y) / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 12, from.y + 12, { steps: 4 });
  await page.mouse.move(gap.x, gap.y, { steps: 25 });
  for (let k = 0; k < 6; k++) {
    await page.mouse.move(gap.x + (k % 3) - 1, gap.y + (k % 2));
    await page.waitForTimeout(50);
  }
  await page.mouse.up();
  await expect.poll(() => childrenOf(page, 'n-hero')).toEqual(['n-title', 'n-intro', 'n-card-b', 'n-actions']);
  expect(await childrenOf(page, 'n-card-b')).toEqual(['n-card-b-title']);
  expect((await read(page)).selection).toEqual(['n-card-b']);
});

test('with the card selected, a click on its title selects the title', runs(OPEN, ROW, CLICK), async ({ page }) => {
  const title = await nodeBox(page, 'n-card-b-title');
  await page.mouse.click(title.x + title.width / 3, title.y + title.height / 2);
  await expect.poll(async () => (await read(page)).selection).toEqual(['n-card-b-title']);
});
