// The unchanged modal palette tree gains native dialog behaviour in the isolated Preview frame.
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runDoor, runs } from './door.ts';

const INSERT_PANEL = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';
const PREVIEW = 'view.enterPreview#key-ctrl-p-in-global';
const EXIT = 'view.exitPreview#key-escape-in-preview';
type Port = { document: () => unknown };
const documentNow = (page: Page) => page.evaluate(() => JSON.stringify((window as unknown as { __builderTestPort: Port }).__builderTestPort.document()));

test('the modal template opens, closes and stays inside Preview', runs(INSERT_PANEL, TILE, PREVIEW, EXIT), async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  await runDoor(page, INSERT_PANEL);
  await control(page, TILE, { args: { entry: 'template-modal' } }).click();
  const before = await documentNow(page);

  await runDoor(page, PREVIEW);
  const preview = page.frameLocator('[data-region="preview-page"]');
  const dialog = preview.locator('dialog');
  await expect(dialog).not.toBeVisible();
  const openButton = dialog.locator('xpath=preceding-sibling::button[1]');
  await expect(openButton).toBeVisible();
  await openButton.click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveJSProperty('open', true);
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).not.toBeVisible();
  await openButton.click();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('[data-region="preview-page"]')).toBeVisible();

  await runDoor(page, EXIT);
  expect(await documentNow(page)).toBe(before);
});
