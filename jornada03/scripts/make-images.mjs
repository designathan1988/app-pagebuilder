// The brand's images for the targets: drawn with CSS and photographed, so the study needs no download.
import { chromium } from '@playwright/test';
const out = 'jornada03/00-frame/targets/marina/assets';
const images = {
  'hero.png': [1200, 800, 'radial-gradient(circle at 35% 40%, #f3d9b1 0 18%, #8a5a3b 19% 30%, #3b2418 31% 100%)'],
  'graos.png': [800, 600, 'repeating-radial-gradient(circle at 30% 30%, #6b3f26 0 14px, #4a2a19 15px 22px, #2e1a10 23px 30px)'],
  'xicara.png': [800, 600, 'radial-gradient(circle at 50% 55%, #fff 0 26%, #3b2418 27% 34%, #e9dcc9 35% 100%)'],
  'loja.png': [800, 600, 'linear-gradient(160deg, #c99a6b 0 40%, #8a5a3b 40% 70%, #3b2418 70%)'],
};
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
for (const [name, [w, h, bg]] of Object.entries(images)) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<body style="margin:0"><div style="width:${w}px;height:${h}px;background:${bg}"></div></body>`);
  await page.screenshot({ path: `${out}/${name}` });
}
await browser.close();
