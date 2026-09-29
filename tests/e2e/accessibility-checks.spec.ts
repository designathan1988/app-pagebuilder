// The Checks panel (manifest feature accessibility-checks; the user's real-use audit, 7.5 and A3.39): the document's
// issues (core/a11y/checks.ts, the one owner) are listed with their category, their rule, the element they are about
// and the fix to suggest; a row selects its element on the canvas; the list follows every command; and a page with
// issues edits and exports like any other — a check is advice, never a gate.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runDoor } from './door.ts';

const INSERT_PANEL = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';
const CHECKS = 'workspace.setPanelOpen#menu-view-checks';
const EXPORT = 'project.export#toolbar-top-bar-export';

const rows = (page: Page): Promise<string[]> => page.locator('.dock-checks__row').allTextContents();
// a page with nothing to report says so in the panel's own words
const none = (page: Page): Promise<string | null> => page.locator('.dock-checks__none').textContent();
const selection = (page: Page): Promise<readonly string[]> =>
  page.evaluate(() => (window as unknown as { __builderTestPort: { selection: () => readonly string[] } }).__builderTestPort.selection());

async function open(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
}

test('the panel lists every issue with its category and fix, and a row selects its element', async ({ page }) => {
  await open(page);
  await runDoor(page, INSERT_PANEL, {});
  await runDoor(page, TILE, { args: { entry: 'image' } });
  await runDoor(page, TILE, { args: { entry: 'link' } });
  await runDoor(page, CHECKS, {});
  await expect(page.locator('[data-region="dock-checks"]')).toBeVisible();
  const listed = await rows(page);
  // an image with no alt is the accessibility rule; a link with neither an address nor text is the links rules
  expect(listed.some((row) => row.includes('Accessibility') && row.includes('Image without alt text in Image')), `the image issue is listed (${listed.join(' | ')})`).toBe(true);
  expect(listed.some((row) => row.includes('Links') && row.includes('Link without an address in Link')), 'the address issue is listed').toBe(true);
  expect(listed.every((row) => row.includes('Fix:')), 'every row suggests its fix').toBe(true);
  // pressing a row selects the element it is about (the canvas and the Layers agree through the selection)
  const before = await selection(page);
  await page.locator('.dock-checks__row').first().click();
  await expect.poll(() => selection(page), { message: 'the row selected its element' }).not.toEqual(before);
  await expect(page.locator('[data-door="selection.select#layers-row"]').first()).toBeVisible();
});

test('the list follows the document and never blocks the export', async ({ page }) => {
  await open(page);
  await runDoor(page, CHECKS, {});
  await runDoor(page, INSERT_PANEL, {});
  await expect.poll(() => none(page), { message: 'a page with no issue says so' }).toBe('No issues');
  await runDoor(page, TILE, { args: { entry: 'image' } });
  await expect.poll(() => rows(page), { message: 'the image it just inserted is reported at once' }).toHaveLength(1);
  // the fix: alt text written in the Settings removes the issue, with no other command
  await runDoor(page, 'workspace.setActiveTab#inspector-tab-settings', {});
  await control(page, 'element.setAttribute#inspector-alt').locator('input, textarea').first().fill('A photo');
  await control(page, 'element.setAttribute#inspector-alt').locator('input, textarea').first().press('Enter');
  await expect.poll(() => rows(page), { message: 'the issue is gone once its alt text is written' }).toHaveLength(0);
  // and with an issue standing, the export still writes the site
  await runDoor(page, TILE, { args: { entry: 'link' } });
  await expect.poll(() => rows(page)).toHaveLength(1);
  const download = page.waitForEvent('download');
  await runDoor(page, EXPORT, {});
  const file = await download;
  expect(fs.readFileSync(await file.path()).length, 'the site was written although the page has issues').toBeGreaterThan(0);
});
