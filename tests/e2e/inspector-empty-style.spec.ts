import { expect, test } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';

test('Style with no selection shows only the guidance', async ({ page }) => {
  await openEditor(page);
  const style = page.locator('[data-region="inspector-style"]');
  await expect(page.locator('.selector-bar__element')).toHaveText('Nothing selected');
  await expect(style.locator('.inspector-hints li')).toHaveCount(3);
  await expect(style.locator('.inspector-controls, .inspector-sections, .inspector-section, .field-row')).toHaveCount(0);
  await expect(page.locator('.selector-bar__targets, .selector-bar__state')).toHaveCount(0);
  await expect(style.locator('.inspector-hints')).toBeVisible();
});
