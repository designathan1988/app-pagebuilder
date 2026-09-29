// Where a drag lands, in words (spec drag-reorder-canvas, Problems in Pager 10; the user's real-use audit, item 3.3):
// the Hero's Title carried over the lower half of the first card's title, as a hand does (gradually, then resting):
// the drop label names the neighbour and the path to the card, the status bar reads the same words, and the canvas
// toolbar shows the drag's keys; after the release the keys are gone and the Title is in the card after its title
// (read through the read-only test port).
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const ROW = 'selection.select#layers-row';
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
type Port = { document: () => { pages: { tree: Tree }[] } };

async function childrenOf(page: Page, id: string): Promise<readonly string[]> {
  const tree = await page.evaluate(() => (window as unknown as { __builderTestPort?: Port }).__builderTestPort?.document().pages[0]?.tree);
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
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-card-a-title"]')).toHaveCount(1);
});

test('over a card the label names the neighbour and the path to the card, the status bar repeats it, and the toolbar shows the keys', runs(OPEN, ROW, MOVE), async ({ page }) => {
  await control(page, ROW, { args: { target: 'n-title' } }).click();
  const title = await nodeBox(page, 'n-title');
  const cardTitle = await nodeBox(page, 'n-card-a-title');
  await page.mouse.move(title.x + title.width / 3, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x + title.width / 3 + 12, title.y + title.height / 2 + 12, { steps: 4 });
  const at = { x: cardTitle.x + cardTitle.width / 2, y: cardTitle.y + cardTitle.height * 0.55 };
  await page.mouse.move(at.x, at.y, { steps: 25 });
  for (let k = 0; k < 6; k++) {
    await page.mouse.move(at.x + (k % 3) - 1, at.y + (k % 2));
    await page.waitForTimeout(50);
  }
  const words = 'After CardATitle · … › Plans › Grid › CardA';
  await expect(page.locator('[data-chrome="drop-label"]')).toHaveText(words);
  await expect(page.locator('.status-bar__message')).toHaveText(words);
  await expect(page.locator('[data-chrome="drag-hint"]')).toHaveText('↑↓ level · Esc cancels · Alt duplicates · Ctrl no snapping');
  await page.mouse.up();
  await expect.poll(() => childrenOf(page, 'n-card-a')).toEqual(['n-card-a-title', 'n-title']);
  await expect(page.locator('[data-chrome="drag-hint"]')).toHaveCount(0);
});

test('with Alt held the label and the status bar begin with Duplicate, and the release leaves the original and drops a copy', runs(OPEN, ROW, 'element.duplicate#canvas-drag-canvas-element-duplicate'), async ({ page }) => {
  await control(page, ROW, { args: { target: 'n-title' } }).click();
  const title = await nodeBox(page, 'n-title');
  const intro = await nodeBox(page, 'n-intro');
  const actions = await nodeBox(page, 'n-actions');
  await page.mouse.move(title.x + title.width / 3, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x + title.width / 3 + 12, title.y + title.height / 2 + 12, { steps: 4 });
  const gap = { x: intro.x + intro.width * 0.4, y: (intro.y + intro.height + actions.y) / 2 };
  await page.mouse.move(gap.x, gap.y, { steps: 25 });
  await page.keyboard.down('Alt');
  const words = 'Duplicate · Between Intro and Actions · Page › Hero';
  await expect(page.locator('[data-chrome="drop-label"]')).toHaveText(words);
  await expect(page.locator('.status-bar__message')).toHaveText(words);
  await page.mouse.up();
  await page.keyboard.up('Alt');
  await expect.poll(() => childrenOf(page, 'n-hero').then((c) => c.length)).toBe(4);
  const hero = await childrenOf(page, 'n-hero');
  expect(hero.slice(0, 2)).toEqual(['n-title', 'n-intro']);
  expect(hero[3]).toBe('n-actions');
});
