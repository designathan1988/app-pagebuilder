// The targets photographed at the editor's four breakpoint widths (full page): what the personas are shown.
import { chromium } from '@playwright/test';
import path from 'node:path';
const targets = process.argv.slice(2);
const widths = [1440, 1180, 834, 390];
const browser = await chromium.launch({ channel: 'chrome' });
for (const file of targets) {
  const page = await browser.newPage();
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('file:///' + path.resolve(file).split(path.sep).join('/'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: file.replace(/\.html$/, `-${w}.png`), fullPage: true });
  }
  await page.close();
}
await browser.close();
