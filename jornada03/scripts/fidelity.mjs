// Fidelity of a persona's export to the hand-written target (jornada03): both pages rendered in Chrome at each of the
// editor's four widths, full page, and compared pixel by pixel over their common height. A pixel matches when every
// channel is within TOLERANCE; the score is the share of matching pixels, reported with the two heights (a page much
// shorter or taller than the target is a difference of its own). Also: html-validate errors and stylesheet size.
//   node jornada03/scripts/fidelity.mjs <site.zip> <target.html> <out-name>
import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [zip, target, name] = process.argv.slice(2);
const TOLERANCE = 24;
const WIDTHS = [1440, 1180, 834, 390];
const out = path.join('jornada03', 'data', 'fidelity');
const site = path.join(out, `${name}-site`);
fs.rmSync(site, { recursive: true, force: true });
fs.mkdirSync(site, { recursive: true });
execSync(`unzip -q -o "${zip}" -d "${site}"`);
const url = (file) => 'file:///' + path.resolve(file).split(path.sep).join('/');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
const shots = {};
for (const w of WIDTHS) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const [kind, file] of [['export', path.join(site, 'index.html')], ['target', target]]) {
    await page.goto(url(file));
    await page.waitForTimeout(300);
    const png = path.join(out, `${name}-${kind}-${w}.png`);
    await page.screenshot({ path: png, fullPage: true });
    shots[`${kind}-${w}`] = png;
  }
}
// compare in the page: both pictures drawn on canvases, pixels counted
const results = [];
for (const w of WIDTHS) {
  const a = fs.readFileSync(shots[`export-${w}`]).toString('base64');
  const b = fs.readFileSync(shots[`target-${w}`]).toString('base64');
  const r = await page.evaluate(
    async ([a, b, tol]) => {
      const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = `data:image/png;base64,${src}`; });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const w = Math.min(ia.width, ib.width);
      const h = Math.min(ia.height, ib.height);
      const data = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
      const da = data(ia);
      const db = data(ib);
      let same = 0;
      for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) <= tol && Math.abs(da[i + 1] - db[i + 1]) <= tol && Math.abs(da[i + 2] - db[i + 2]) <= tol) same += 1;
      return { match: Math.round((same / (w * h)) * 1000) / 10, exportHeight: ia.height, targetHeight: ib.height };
    },
    [a, b, TOLERANCE],
  );
  // the height difference counts against the score: the unmatched rows of the longer page are misses
  const longer = Math.max(r.exportHeight, r.targetHeight);
  const adjusted = Math.round(((r.match * Math.min(r.exportHeight, r.targetHeight)) / longer) * 10) / 10;
  results.push({ width: w, pixelMatchCommon: r.match, pixelMatchAdjusted: adjusted, exportHeight: r.exportHeight, targetHeight: r.targetHeight });
}
await browser.close();

let validate = '';
try { execSync(`npx html-validate "${site}/*.html"`, { stdio: 'pipe' }); validate = 'no errors'; } catch (e) { validate = String(e.stdout); }
const css = fs.readFileSync(path.join(site, 'css', 'styles.css'), 'utf8');
const html = fs.readdirSync(site).filter((f) => f.endsWith('.html')).map((f) => fs.readFileSync(path.join(site, f), 'utf8')).join('\n');
const record = {
  name,
  zip,
  target,
  tolerance: TOLERANCE,
  results,
  htmlValidate: { errors: (validate.match(/\berror\b/g) ?? []).length, output: validate.slice(0, 3000) },
  css: { bytes: css.length, lines: css.split('\n').length, rules: (css.match(/\{/g) ?? []).length, classes: new Set(html.match(/class="[^"]*"/g) ?? []).size },
  inlineStyles: (html.match(/ style="/g) ?? []).length,
};
fs.writeFileSync(path.join(out, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`);
console.log(JSON.stringify({ results, htmlErrors: record.htmlValidate.errors, css: record.css, inlineStyles: record.inlineStyles }, null, 1));
