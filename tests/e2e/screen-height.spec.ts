// Beyond the scenarios of item 2.3 and A3.22 (spec/BEHAVIOUR.md#breakpoints-switch, "Our rule"): the fold lines the
// canvas draws at each whole screen, the Height field's Screen height preset, and the canvas laying the page out at the
// width a real browser gives it — the acceptance of A3.22: the Section on the canvas measures what the exported page
// measures in a 1440 px window, at the Fit zoom and at 25 %.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { unzip } from '../../tools/runner/unzip.ts';
import { control, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const EXPORT = 'project.export#toolbar-top-bar-export';
const HEIGHT = 'style.set#inspector-height';
const UNIT = 'field.setUnit#inspector-unit-menu';
const FOLDS = 'grid.toggleFolds#guides-grids-fold-lines';

async function openProject(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-hero"]')).toHaveCount(1);
  await page.keyboard.press('Control+0');
}

async function type(page: Page, ref: string, text: string): Promise<void> {
  const field = control(page, ref).locator('input').first();
  await field.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}

// the Section's width as the page draws it (page px: the frame is scaled by the zoom, its document is not)
// the page's usable width on the canvas: what the frame's document lays out in (A3.22: the site's, less its scrollbar)
const pageWidth = (page: Page) => page.locator('.frame__page').evaluate((el) => (el as HTMLIFrameElement).contentDocument?.documentElement.clientWidth ?? 0);

test('the canvas draws a fold line at each whole screen, named with its fold and its distance', runs(OPEN, HEIGHT, FOLDS), async ({ page }) => {
  await openProject(page);
  await control(page, 'selection.select#layers-row', { args: { target: 'n-hero' } }).click();
  // a page three screens and a bit tall: 3000 px on the 900 px desktop screen
  await type(page, HEIGHT, '3000px');
  await runDoor(page, 'workspace.openDialog#menu-view-guides-grids');
  await runDoor(page, FOLDS);
  await page.keyboard.press('Escape');
  const folds = page.locator('.chrome__fold');
  await expect(folds, 'a 3000 px page on a 900 px screen has three folds').toHaveCount(3);
  await expect(folds.nth(0).locator('.chrome__fold-label')).toHaveText('Fold 1 · 900 px');
  await expect(folds.nth(2).locator('.chrome__fold-label')).toHaveText('Fold 3 · 2700 px');
  // the first fold sits one screen below the page's top, whatever the zoom
  // the first fold sits exactly one screen below the page's top, in page px (the frame is scaled by the zoom)
  const facts = await page.locator('.frame__page').evaluate((el) => {
    const frame = el as HTMLIFrameElement;
    return { top: frame.getBoundingClientRect().top, zoom: frame.currentCSSZoom ?? 1 };
  });
  const first = await folds.nth(0).evaluate((el) => el.getBoundingClientRect().top);
  const pageTop = await page.frameLocator('.frame__page').locator('body').evaluate((el) => el.getBoundingClientRect().top);
  expect((first - facts.top) / facts.zoom - pageTop, "the first fold sits one screen below the page's top").toBeGreaterThan(899);
  expect((first - facts.top) / facts.zoom - pageTop).toBeLessThan(901);
});

test('the Height field suggests the Screen height preset and writing it keeps 100vh', runs(OPEN, HEIGHT, UNIT), async ({ page }) => {
  await openProject(page);
  await control(page, 'selection.select#layers-row', { args: { target: 'n-hero' } }).click();
  // the field suggests the preset, named as the catalogue names the value: the first item of its unit menu
  const field = control(page, HEIGHT);
  await field.hover();
  await control(page, UNIT, { args: { property: 'height' } }).first().click();
  const option = page.locator(`[role="menu"] [data-door="${HEIGHT}"][data-args*='"value":"100vh"']`);
  await expect(option, 'the field suggests 100vh').toHaveCount(1);
  await expect(option, 'named Screen height').toHaveText('Screen height · 100vh');
  await option.click();
  const stored = await page.evaluate(() => {
    type Node = { readonly name: string; readonly styles?: Record<string, Record<string, Record<string, string>>>; readonly children?: readonly Node[] };
    const port = (window as unknown as { __builderTestPort: { document: () => { pages: readonly { tree: Node }[] } } }).__builderTestPort;
    const hero = (port.document().pages[0]?.tree.children ?? []).find((c) => c.name === 'Hero');
    return hero?.styles?.desktop?.base?.height;
  });
  expect(stored).toBe('100vh');
});

test('the canvas lays the page out at the width a 1440 px window gives it, at Fit and at 25 %', runs(OPEN, EXPORT), async ({ page, context }) => {
  await openProject(page);
  const download = page.waitForEvent('download');
  await runDoor(page, EXPORT);
  const files = unzip(fs.readFileSync(await (await download).path()));
  const html = files.get('index.html')?.toString('utf8') ?? '';
  const css = files.get('css/styles.css')?.toString('utf8') ?? '';
  // the exported page in a window of the same width the breakpoint names
  const exported = await context.newPage();
  await exported.setViewportSize({ width: 1440, height: 900 });
  await exported.route('https://site.test/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    return path === '/css/styles.css' ? route.fulfill({ contentType: 'text/css', body: css }) : route.fulfill({ contentType: 'text/html', body: html });
  });
  await exported.goto('https://site.test/index.html');
  // the page's usable width on the site: a 1440 px window less the scrollbar
  const written = await exported.evaluate(() => document.documentElement.clientWidth);
  await exported.close();
  // at 100 % and at 25 %: the canvas gives the page the width the real browser gives it
  for (const [zoom, what] of [
    ['Control+0', '100 %'],
    ['menu-zoom-25', '25 %'],
  ] as const) {
    if (zoom === 'Control+0') await page.keyboard.press(zoom);
    else await runDoor(page, `view.zoomTo#${zoom}`);
    await page.waitForTimeout(400);
    const canvas = await pageWidth(page);
    expect(Math.abs(canvas - written), `the canvas measures what the site measures at ${what}`).toBeLessThanOrEqual(1);
  }
});
