// The drop indicator and the gestures' pointer beyond the scenarios (spec drag-reorder-canvas, Problems in Pager 7 and
// 8; the user's real-use audit, items 3.1 and A3.14). While the Title is dragged over the Intro: the insertion line is
// a bar at least 3 px thick in a colour that is not the selection's, the dragged element's outline is not the
// selection's any more, and the drop label never lies under the ghost chip, wherever the pointer goes over the Intro's
// lower half; the release moves the Title. A resize whose pointer is cancelled, or whose capture is lost before the
// release, records nothing and throws nothing, and the next resize records one step. With the focus in the canvas
// frame, Escape cancels a drag. The document and the history are read through the read-only test port.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const ROW = 'selection.select#layers-row';
const MOVE = 'element.moveTo#canvas-drag-canvas-element-before-after';
const HANDLE = 'geometry.resize#handle-resize-e';

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
interface Tree {
  readonly id: string;
  readonly styles: unknown;
  readonly children: readonly Tree[];
}
type Port = { document: () => { pages: { tree: Tree }[] }; history: () => { undoSteps: number } };
const find = (n: Tree, id: string): Tree | undefined => (n.id === id ? n : n.children.map((c) => find(c, id)).find((x) => x !== undefined));
const tree = async (page: Page): Promise<Tree> => {
  const read = await page.evaluate(() => (window as unknown as { __builderTestPort?: Port }).__builderTestPort?.document().pages[0]?.tree);
  if (read === undefined) throw new Error('the test port reads no page');
  return read;
};
const childrenOf = async (page: Page, id: string) => find(await tree(page), id)?.children.map((c) => c.id) ?? [];
const stylesOf = async (page: Page, id: string) => JSON.stringify(find(await tree(page), id)?.styles ?? null);
const undoSteps = (page: Page) => page.evaluate(() => (window as unknown as { __builderTestPort?: Port }).__builderTestPort?.history().undoSteps ?? -1);

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
const rectOf = (page: Page, selector: string) => page.evaluate((s) => document.querySelector(s)?.getBoundingClientRect().toJSON() as Box | undefined, selector);
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-title"]')).toHaveCount(1);
  await control(page, ROW, { args: { target: 'n-title' } }).click();
});

test('the line is a 3 px bar in its own colour, the dragged selection is off, and the label never lies under the ghost', runs(OPEN, ROW, MOVE), async ({ page }) => {
  const selectionColour = await page.locator('[data-chrome="selection"]').evaluate((el) => getComputedStyle(el).outlineColor);
  const title = await screenBox(page, 'n-title');
  const intro = await screenBox(page, 'n-intro');
  await page.mouse.move(title.x + title.width / 2, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(title.x + title.width / 2, title.y + title.height / 2 + 10, { steps: 3 });
  // over the Intro's lower half, from its left edge on: the drop is after the Intro
  for (const fx of [0.01, 0.04, 0.1, 0.25, 0.5, 0.8, 0.97]) {
    for (const fy of [0.6, 0.95]) {
      await page.mouse.move(intro.x + intro.width * fx, intro.y + intro.height * fy, { steps: 4 });
      await expect(page.locator('[data-chrome="drop-line"]')).toHaveCount(1);
      const line = page.locator('[data-chrome="drop-line"]');
      const drawn = await line.evaluate((el) => ({ box: el.getBoundingClientRect().toJSON() as Box, colour: getComputedStyle(el).backgroundColor }));
      expect(Math.min(drawn.box.width, drawn.box.height)).toBeGreaterThanOrEqual(3);
      expect(drawn.colour).not.toBe(selectionColour);
      const source = await page.locator('[data-chrome="selection"]').evaluate((el) => getComputedStyle(el).outlineColor);
      expect(source).not.toBe(selectionColour);
      await expect
        .poll(async () => {
          const label = await rectOf(page, '[data-chrome="drop-label"]');
          const ghost = await rectOf(page, '.chrome-ghost-stack');
          const canvas = await rectOf(page, '.frame__overlay');
          if (label === undefined || ghost === undefined || canvas === undefined) return 'not drawn';
          const inside = label.x >= canvas.x - 1 && label.y >= canvas.y - 1 && label.x + label.width <= canvas.x + canvas.width + 1 && label.y + label.height <= canvas.y + canvas.height + 1;
          return { underGhost: overlaps(label, ghost), inside };
        }, { message: `the label, the ghost and the canvas at ${fx}, ${fy} of the Intro` })
        .toEqual({ underGhost: false, inside: true });
    }
  }
  // back over the middle of the Intro's lower half (its side strips offer a row) before the release
  await page.mouse.move(intro.x + intro.width / 2, intro.y + intro.height * 0.8, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => childrenOf(page, 'n-hero')).toEqual(['n-intro', 'n-title', 'n-actions']);
});

// presses the Title's south-east handle and drags it 30 px, the gesture open (past the threshold), the button held
async function holdResize(page: Page): Promise<void> {
  // the handle stands at the Title's corner again, drawn just outside it (the chrome redraws it a frame after a change)
  await expect
    .poll(async () => {
      const at = await page.locator(`[data-canvas-overlay] [data-door="${HANDLE}"]`).boundingBox();
      const title = await screenBox(page, 'n-title');
      // the handle stands on the side its door names ('e': the middle of the right edge)
      const side = HANDLE.slice(HANDLE.lastIndexOf('-') + 1);
      const corner = { x: title.x + (side.includes('w') ? 0 : side.includes('e') ? title.width : title.width / 2), y: title.y + (side.includes('n') ? 0 : side.includes('s') ? title.height : title.height / 2) };
      return at === null ? Infinity : Math.hypot(at.x + at.width / 2 - corner.x, at.y + at.height / 2 - corner.y);
    })
    .toBeLessThan(10);
  const handle = await page.locator(`[data-canvas-overlay] [data-door="${HANDLE}"]`).boundingBox();
  if (handle === null) throw new Error('the south-east handle is not drawn');
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 30, handle.y + handle.height / 2 + 10, { steps: 6 });
}
async function errorsOf(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

for (const [how, end] of [
  [
    'a cancelled pointer',
    () => {
      window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true }));
    },
  ],
  [
    'a capture lost before the release',
    () => {
      document.documentElement.releasePointerCapture(1);
    },
  ],
] as const) {
  test(`a resize ended by ${how} records nothing and throws nothing; the next resize records one step`, runs(OPEN, ROW, HANDLE), async ({ page }) => {
    const errors = await errorsOf(page);
    const before = await stylesOf(page, 'n-title');
    const steps = await undoSteps(page);
    await holdResize(page);
    await expect.poll(() => stylesOf(page, 'n-title')).not.toBe(before);
    await page.evaluate(end);
    await page.mouse.up();
    await expect.poll(() => stylesOf(page, 'n-title')).toBe(before);
    expect(await undoSteps(page)).toBe(steps);
    await holdResize(page);
    await page.mouse.up();
    await expect.poll(() => undoSteps(page)).toBe(steps + 1);
    expect(await stylesOf(page, 'n-title')).not.toBe(before);
    expect(errors).toEqual([]);
  });
}

test('with the focus in the canvas frame, a press brings it back to the editor and Escape cancels the drag; nothing changes', runs(OPEN, ROW, MOVE), async ({ page }) => {
  const title = await screenBox(page, 'n-title');
  const intro = await screenBox(page, 'n-intro');
  const inFrame = () => page.evaluate(() => document.activeElement?.classList.contains('frame__page') === true);
  // the focus in the frame before the press (as a text edited in place leaves it)
  await page.evaluate(() => document.querySelector<HTMLIFrameElement>('.frame__page')?.contentWindow?.focus());
  expect(await inFrame()).toBe(true);
  await page.mouse.move(title.x + title.width / 2, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(intro.x + intro.width / 2, intro.y + intro.height * 0.9, { steps: 8 });
  await expect(page.locator('[data-chrome="drop-line"]')).toHaveCount(1);
  expect(await inFrame()).toBe(false);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-chrome="drop"]')).toHaveCount(0);
  await page.mouse.up();
  expect(await childrenOf(page, 'n-hero')).toEqual(['n-title', 'n-intro', 'n-actions']);
});

test('a focus moved into the canvas frame during a drag ends it, and the release changes nothing', runs(OPEN, ROW, MOVE), async ({ page }) => {
  const title = await screenBox(page, 'n-title');
  const intro = await screenBox(page, 'n-intro');
  await page.mouse.move(title.x + title.width / 2, title.y + title.height / 2);
  await page.mouse.down();
  await page.mouse.move(intro.x + intro.width / 2, intro.y + intro.height * 0.9, { steps: 8 });
  await expect(page.locator('[data-chrome="drop-line"]')).toHaveCount(1);
  await page.evaluate(() => document.querySelector<HTMLIFrameElement>('.frame__page')?.contentWindow?.focus());
  await expect(page.locator('[data-chrome="drop"]')).toHaveCount(0);
  await page.mouse.up();
  expect(await childrenOf(page, 'n-hero')).toEqual(['n-title', 'n-intro', 'n-actions']);
});
