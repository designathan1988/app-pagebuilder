// The unchanged tabs palette tree becomes three accessible panels in the isolated Preview frame.
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runDoor, runs } from './door.ts';

const INSERT_PANEL = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';
const DUPLICATE = 'element.duplicate#key-ctrl-d-in-global';
const PREVIEW = 'view.enterPreview#key-ctrl-p-in-global';
const EXIT = 'view.exitPreview#key-escape-in-preview';
type Port = { document: () => unknown };
const documentNow = (page: Page) => page.evaluate(() => JSON.stringify((window as unknown as { __builderTestPort: Port }).__builderTestPort.document()));

test('copied tabs switch independent panels by mouse and keyboard in Preview', runs(INSERT_PANEL, TILE, DUPLICATE, PREVIEW, EXIT), async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  await runDoor(page, INSERT_PANEL);
  await control(page, TILE, { args: { entry: 'template-tabs' } }).click();
  await runDoor(page, DUPLICATE);
  const before = await documentNow(page);

  await runDoor(page, PREVIEW);
  const preview = page.frameLocator('[data-region="preview-page"]');
  const tabs = preview.getByRole('tab');
  const panels = preview.getByRole('tabpanel', { includeHidden: true });
  await expect(tabs).toHaveCount(6);
  await expect(panels).toHaveCount(6);
  await expect(panels.nth(0)).toBeVisible();
  await expect(panels.nth(1)).toBeHidden();
  await expect(panels.nth(2)).toBeHidden();
  await expect(panels.nth(3)).toBeVisible();

  await tabs.nth(1).click();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(panels.nth(1)).toBeVisible();
  await expect(panels.nth(0)).toBeHidden();
  await expect(panels.nth(3)).toBeVisible();
  await expect(panels.nth(1)).toContainText('Second tab');
  await page.keyboard.press('ArrowRight');
  await expect(panels.nth(2)).toBeVisible();
  await expect(panels.nth(2)).toContainText('Third tab');
  await page.keyboard.press('Home');
  await expect(panels.nth(0)).toBeVisible();
  const controls = await tabs.evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-controls')));
  expect(new Set(controls).size).toBe(6);
  for (let i = 0; i < 6; i += 1) expect(await panels.nth(i).getAttribute('id')).toBe(controls[i]);

  await runDoor(page, EXIT);
  expect(await documentNow(page)).toBe(before);
});
