// hover-measure (spec/BEHAVIOUR.md#hover-measure): hovering an element shows its size in CSS px next to its hover
// outline; with a selection and Alt held, the distances from the selection to the hovered element (to a sibling: between
// the nearest edges; to an ancestor: to its inner edges), each labelled in CSS px; the same values at 50 %; measuring
// never changes the selection or the document. The feature has no command, so no scenario can run it: this test moves
// the real mouse, holds the real Alt and compares the labels with the geometry measured in the frame.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, openMenu, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const ROW = 'selection.select#layers-row';
const ZOOM_50 = 'view.zoomTo#menu-zoom-50';

type Rect = { left: number; top: number; right: number; bottom: number; width: number; height: number };
type Port = { document: () => unknown; selection: () => string[] };

// a node's box in CSS px, as the frame draws it, and a screen point inside it (at the fractions given)
const rectOf = (page: Page, id: string) => page.frameLocator('.frame__page').locator(`[data-node="${id}"]`).evaluate((el) => el.getBoundingClientRect().toJSON() as Rect);
const pointIn = (page: Page, id: string, fx: number, fy: number) =>
  page.evaluate(
    ({ id, fx, fy }) => {
      const iframe = document.querySelector<HTMLIFrameElement>('.frame__page');
      const el = iframe?.contentDocument?.querySelector(`[data-node="${id}"]`);
      if (!iframe || !el) throw new Error('not drawn');
      const f = iframe.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const z = iframe.currentCSSZoom;
      return { x: f.left + (r.left + r.width * fx) * z, y: f.top + (r.top + r.height * fy) * z };
    },
    { id, fx, fy },
  );
const distances = (page: Page) => page.locator('[data-chrome="distance"]').evaluateAll((els) => els.map((el) => Number(el.getAttribute('data-value'))).sort((a, b) => a - b));
const state = (page: Page) => page.evaluate(() => JSON.stringify([(window as unknown as { __builderTestPort: Port }).__builderTestPort.document(), (window as unknown as { __builderTestPort: Port }).__builderTestPort.selection()]));

test('hover shows the size; Alt shows the distances to a sibling and to an ancestor, the same at 50 %; nothing changes', runs(OPEN, ROW, ZOOM_50), async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });

  // nothing selected: the hovered element's size
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-intro"]')).toBeVisible();
  const intro = await pointIn(page, 'n-intro', 0.5, 0.5);
  await page.mouse.move(intro.x, intro.y);
  const introRect = await rectOf(page, 'n-intro');
  await expect(page.locator('[data-chrome="hover-size"]')).toHaveText(`${Math.round(introRect.width)} × ${Math.round(introRect.height)}`);

  // Title selected, Alt held over Intro, its sibling below: the gap between them
  await control(page, ROW, { args: { target: 'n-title' } }).click();
  const before = await state(page);
  const measureSibling = async () => {
    const at = await pointIn(page, 'n-intro', 0.5, 0.5);
    await page.mouse.move(at.x, at.y);
    await page.keyboard.down('Alt');
    const title = await rectOf(page, 'n-title');
    const below = await rectOf(page, 'n-intro');
    await expect.poll(() => distances(page)).toEqual([Math.round(below.top - title.bottom)]);
    await page.keyboard.up('Alt');
    await expect(page.locator('[data-chrome="distance"]')).toHaveCount(0);
  };
  await measureSibling();

  // Alt held over Hero, the Title's parent: the distances to its inner edges
  const hero = await pointIn(page, 'n-hero', 0.02, 0.05);
  await page.mouse.move(hero.x, hero.y);
  await page.keyboard.down('Alt');
  const title = await rectOf(page, 'n-title');
  const box = await rectOf(page, 'n-hero');
  const wanted = [title.top - box.top, box.bottom - title.bottom, title.left - box.left, box.right - title.right].map(Math.round).filter((v) => v > 0).sort((a, b) => a - b);
  await expect.poll(() => distances(page)).toEqual(wanted);
  await page.keyboard.up('Alt');

  // at 50 %, the same CSS px
  await openMenu(page, 'zoom');
  await control(page, ZOOM_50).click();
  await expect.poll(() => page.locator('.frame__page').evaluate((f) => (f as HTMLIFrameElement).currentCSSZoom)).toBe(0.5);
  await measureSibling();

  // nothing measured changed the document or the selection
  expect(await state(page)).toBe(before);
});

// Item 4.5: a resize in flow draws the distance from the dragged edge to its nearest neighbour, so a flow resize says
// where it stands from the elements around it (the Alt measurement above is the manual one).
test('a resize in flow draws the distance to its nearest neighbour', runs(OPEN, ROW, 'view.zoomTo#menu-zoom-100', 'geometry.resize#handle-resize-s'), async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await control(page, ROW, { args: { target: 'n-title' } }).click();
  // at 100 %: at the fit zoom the Title is shorter than the room a top or bottom handle asks for (resize.handleRoom)
  await openMenu(page, 'zoom');
  await control(page, 'view.zoomTo#menu-zoom-100').click();
  const handle = page.locator('[data-canvas-overlay] [data-door="geometry.resize#handle-resize-s"]').first();
  const box = await handle.boundingBox();
  if (box === null) throw new Error('the south handle is not drawn');
  const zoom = await page.locator('.frame__page').evaluate((el) => (el as HTMLIFrameElement).currentCSSZoom);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 40 * zoom, { steps: 8 });
  // the gap from the Intro's bottom to the next sibling's top, measured in the frame
  const gap = await page.evaluate(() => {
    const iframe = document.querySelector<HTMLIFrameElement>('.frame__page');
    const title = iframe?.contentDocument?.querySelector('[data-node="n-title"]');
    const after = iframe?.contentDocument?.querySelector('[data-node="n-intro"]');
    if (!iframe || !title || !after) throw new Error('the frame does not draw the Title and the Intro');
    return after.getBoundingClientRect().top - title.getBoundingClientRect().bottom;
  });
  expect(await distances(page), 'the distance to the neighbour is drawn, in page px').toContain(Math.round(gap));
  await page.mouse.up();
  await expect(page.locator('[data-chrome="distance"]'), 'the marks go with the drag').toHaveCount(0);
});
