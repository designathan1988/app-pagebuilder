// snap-toggle-settings beyond its scenarios (spec/BEHAVIOUR.md#snap-toggle-settings), read in the storage after an
// immediate reload: the Snap button switches snap with one click (Problems in Pager 1); Apply keeps the targets and the
// distance as preferences and leaves snap off (Problems in Pager 2 and 3), and the reopened dialog shows them; Cancel
// (the close button) drops what was ticked and typed.
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { runDoor, runs } from './door.ts';

const TOGGLE = 'snap.setEnabled#toolbar-canvas-toolbar-snap';
const OPEN = 'workspace.openDialog#menu-snap-snap-settings';
const APPLY = 'snap.setSettings#snap-settings-apply';
const CLOSE = 'ui.dismiss#dialog-close';
const DIALOG = '[data-region="snap-settings-dialog"]';

type Stored = { snap?: true; snapSettings?: { targets: string[]; distance: number } } | null;
const stored = (page: Page) => page.evaluate(() => JSON.parse(window.localStorage.getItem('preferences') ?? 'null') as Stored);
async function reload(page: Page): Promise<void> {
  await page.reload();
  await page.locator('.workbench').waitFor();
}
const box = (page: Page, target: string) => page.locator(`${DIALOG} input[name="targets"][value="${target}"]`);
const distance = (page: Page) => page.locator(`${DIALOG} input[name="distance"]`);

test('the Snap button switches snap with one click, kept after a reload', runs(TOGGLE), async ({ page }) => {
  await openEditor(page);
  await runDoor(page, TOGGLE);
  await reload(page);
  expect((await stored(page))?.snap).toBe(true);
  await runDoor(page, TOGGLE);
  await reload(page);
  expect((await stored(page))?.snap).toBeUndefined();
});

test('Apply keeps the targets and the distance, leaves snap off, and the reopened dialog shows them', runs(OPEN, APPLY), async ({ page }) => {
  await openEditor(page);
  await runDoor(page, OPEN);
  // every target ticked and 6 px by default
  for (const target of ['page', 'grid', 'centers', 'edges']) await expect(box(page, target)).toBeChecked();
  await expect(distance(page)).toHaveValue('6');
  await box(page, 'grid').click();
  await box(page, 'centers').click();
  await distance(page).click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('10');
  await runDoor(page, APPLY);
  await expect(page.locator(DIALOG)).toHaveCount(0);
  await reload(page);
  const kept = await stored(page);
  expect(kept?.snap).toBeUndefined();
  expect(kept?.snapSettings).toEqual({ targets: ['page', 'parent', 'elements', 'guides', 'rulers', 'edges'], distance: 10 });
  await runDoor(page, OPEN);
  await expect(box(page, 'grid')).not.toBeChecked();
  await expect(box(page, 'centers')).not.toBeChecked();
  await expect(box(page, 'edges')).toBeChecked();
  await expect(distance(page)).toHaveValue('10');
});

test('Cancel drops what was ticked and typed', runs(OPEN, CLOSE), async ({ page }) => {
  await openEditor(page);
  await runDoor(page, OPEN);
  await box(page, 'guides').click();
  await distance(page).click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('20');
  await runDoor(page, CLOSE);
  await expect(page.locator(DIALOG)).toHaveCount(0);
  await reload(page);
  expect((await stored(page))?.snapSettings).toBeUndefined();
  await runDoor(page, OPEN);
  await expect(box(page, 'guides')).toBeChecked();
  await expect(distance(page)).toHaveValue('6');
});

test('Escape after a press on the modal shield closes Snap settings without clearing the selection', runs('workspace.setPanelOpen#toolbar-activity-bar-insert', 'element.insert#elements-tile', OPEN, 'ui.dismiss#key-escape-in-dialog'), async ({ page }) => {
  await openEditor(page);
  await runDoor(page, 'workspace.setPanelOpen#toolbar-activity-bar-insert');
  await runDoor(page, 'element.insert#elements-tile', { args: { entry: 'container' } });
  const selected = await page.evaluate(() => (window as unknown as { __builderTestPort: { selection: () => string[] } }).__builderTestPort.selection());
  expect(selected).toHaveLength(1);
  await runDoor(page, OPEN);
  await expect(page.locator(DIALOG)).toBeVisible();
  await page.locator('.dialog-shield').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Escape');
  await expect(page.locator(DIALOG)).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __builderTestPort: { selection: () => string[] } }).__builderTestPort.selection())).toEqual(selected);
});
