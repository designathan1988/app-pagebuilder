// A narrow window keeps the editor inside it (the code audit's U-010): at 1024 × 768 the window does not scroll
// sideways — the panels keep their widths and the canvas toolbar scrolls within itself — and every breakpoint tab
// stays reachable.
import { expect, test } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runs } from './door.ts';

const PHONE = 'view.setBreakpoint#toolbar-breakpoint-tabs-phone';

test('at 1024 px the window does not scroll sideways, and the Phone tab is reachable', runs(PHONE), async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await openEditor(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
  const tab = control(page, PHONE);
  await tab.scrollIntoViewIfNeeded();
  await tab.click();
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);
});
