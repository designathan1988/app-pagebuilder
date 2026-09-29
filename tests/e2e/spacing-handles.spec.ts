// spacing-handles beyond its scenarios (spec/BEHAVIOUR.md#spacing-handles): in Padding mode the four sides are drawn as
// tinted bands labelled with their values (Problems in Pager 1), as thick on the screen as the padding times the zoom;
// Margin mode draws the margin's bands in another colour; Escape on the canvas leaves the mode (the selection stays)
// and the bands go. The scenarios cannot say what the canvas draws: this test reads the bands in Chrome.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const ROW = 'selection.select#layers-row';
const MODE = 'canvas.setEditMode#quick-panel-edit-on-canvas';
const ESCAPE = 'canvas.setEditMode#key-escape-in-canvas-edit-mode';
const TOP = 'style.setSpacing#handle-padding-top-band';

const bands = (page: Page) => page.locator('[data-canvas-overlay] [data-edit-handle]');
// the quick panel's Edit on canvas menu opened (its button: no door of its own) and a mode chosen
async function chooseMode(page: Page, mode: string): Promise<void> {
  if ((await page.locator('[data-quick-panel-chip][aria-expanded="false"]').count()) > 0) await page.locator('[data-quick-panel-chip]').click();
  await page.locator(`[data-door="${MODE}"][aria-haspopup]`).click();
  await control(page, MODE, { args: { mode } }).click();
}

test('padding and margin bands are drawn with their values; the mode pins them and Escape lets them go', runs(OPEN, ROW, MODE, ESCAPE), async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await control(page, ROW, { args: { target: 'n-hero' } }).click();
  // item 4.1: the spacing bands are drawn on any selection, faint until the pointer is on them, and their mode pins
  // them; the gap draws none in a block container (A3.15)
  await expect(bands(page), 'the spacing bands are drawn, waiting').toHaveCount(8);
  await expect(page.locator('[data-canvas-overlay] .chrome__band--auto'), 'none is pinned yet').toHaveCount(8);
  await chooseMode(page, 'padding');
  await expect(page.locator('[data-canvas-overlay] .chrome__band--padding:not(.chrome__band--auto)'), 'the padding mode pins its four').toHaveCount(4);
  // Hero's padding: 56px top, 40px sides; its top band as tall as 56 CSS px on the screen, tinted, labelled 56
  const top = page.locator(`[data-canvas-overlay] [data-door="${TOP}"]`);
  await expect(top).toHaveText('56');
  const zoom = await page.evaluate(() => document.querySelector<HTMLIFrameElement>('.frame__page')?.currentCSSZoom ?? 1);
  const height = (await top.boundingBox())?.height ?? 0;
  expect(Math.abs(height - 56 * zoom)).toBeLessThan(1);
  const tint = (locator: typeof top) => locator.evaluate((el) => getComputedStyle(el).backgroundColor);
  const padding = await tint(top);
  expect(padding).not.toBe('rgba(0, 0, 0, 0)');
  // Margin mode: other bands, in another colour
  await chooseMode(page, 'margin');
  await expect(page.locator('[data-canvas-overlay] .chrome__band--margin:not(.chrome__band--auto)'), 'the margin mode pins its own').toHaveCount(4);
  await expect(page.locator('[data-canvas-overlay] [data-door="style.setSpacing#handle-margin-top-band"]')).toHaveCount(1);
  expect(await tint(page.locator('[data-canvas-overlay] [data-door="style.setSpacing#handle-margin-top-band"]'))).not.toBe(padding);
  // Escape on the canvas leaves the mode, and only the mode: the selection stays (the canvas's own Escape waits)
  await page.locator('[data-quick-panel-chip][aria-expanded="true"]').click();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await runDoor(page, ESCAPE);
  await expect(bands(page), 'the bands stay, unpinned').toHaveCount(8);
  await expect(page.locator('[data-canvas-overlay] .chrome__band--auto')).toHaveCount(8);
  expect(await page.evaluate(() => (window as unknown as { __builderTestPort: { selection: () => string[] } }).__builderTestPort.selection())).toEqual(['n-hero']);
});

// the display field of the inspector's Layout section
const DISPLAY = 'style.set#inspector-display';
async function setDisplay(page: Page, value: string): Promise<void> {
  await control(page, DISPLAY).locator('input').click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}
// the editor with the fixture open, its page settled
async function openAurora(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-grid"]')).toHaveCount(1);
}

// A3.15: the gap mode is offered only where a gap exists to edit (a flex or grid container). On a section, which lays
// out in block, its item is disabled and says so; the padding's own item stays offered.
test('the Edit on canvas menu disables the gap, with its reason, on a container that is not flex or grid', runs(OPEN, ROW, MODE), async ({ page }) => {
  await openAurora(page);
  await control(page, ROW, { args: { target: 'n-hero' } }).click();
  if ((await page.locator('[data-quick-panel-chip][aria-expanded="false"]').count()) > 0) await page.locator('[data-quick-panel-chip]').click();
  await page.locator(`[data-door="${MODE}"][aria-haspopup]`).click();
  const gap = control(page, MODE, { args: { mode: 'gap' } });
  await expect(gap, 'the gap item is drawn').toBeVisible();
  await expect(gap).toHaveAttribute('aria-disabled', 'true');
  await expect(gap).toHaveAttribute('title', 'Gap — does not apply to the element');
  await expect(control(page, MODE, { args: { mode: 'padding' } }), 'the padding item, which applies, is offered').not.toHaveAttribute('aria-disabled', 'true');
});

// A3.15: a mode never stays over a selection it cannot edit. The gap mode, on over a flex container, lets go the
// moment a block container is selected: the toolbar's own hint goes with it and the resize handles it hides come back.
// While it is on, the toolbar says which mode it is and how to leave it (item 4.1).
test('a mode lets go of a selection it cannot edit, and the toolbar names the mode in force', runs(OPEN, ROW, MODE, DISPLAY), async ({ page }) => {
  await openAurora(page);
  await control(page, ROW, { args: { target: 'n-grid' } }).click();
  await setDisplay(page, 'flex');
  await chooseMode(page, 'gap');
  const hint = page.locator('[data-chrome="mode-hint"]');
  await expect(hint).toHaveText('Mode: Gap · Esc exits');
  await expect(page.locator('[data-canvas-overlay] .chrome__band--gap:not(.chrome__band--auto)'), 'the gap mode pins its bands').not.toHaveCount(0);
  await expect(page.locator('[data-canvas-overlay] .chrome__handle'), 'no resize handle while a mode is on').toHaveCount(0);
  // a section lays out in block: the gap has nothing to edit there, so the mode is let go
  await control(page, ROW, { args: { target: 'n-hero' } }).click();
  await expect(hint, 'the mode is gone').toHaveCount(0);
  await expect(page.locator('[data-canvas-overlay] .chrome__band--gap'), 'and its bands with it').toHaveCount(0);
  await expect(page.locator('[data-canvas-overlay] [data-door="geometry.resize#handle-resize-e"]'), 'the resize handles are back').toHaveCount(1);
});
