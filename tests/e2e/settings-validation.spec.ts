import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, runs } from './door.ts';
import { unzip } from '../../tools/runner/unzip.ts';

const INSERT = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';
const SETTINGS = 'workspace.setActiveTab#inspector-tab-settings';
const TYPE = 'element.setInputType#inspector-input-type';
const MAX = 'element.setAttribute#inspector-max';
const MIN = 'element.setAttribute#inspector-min';
const VALUE = 'element.setAttribute#inspector-value';
const STEP = 'element.setAttribute#inspector-step';
const PLACEHOLDER = 'element.setAttribute#inspector-placeholder';
const AUTOCOMPLETE = 'element.setAttribute#inspector-autocomplete';
const UNDO = 'history.undo#toolbar-top-bar';
const PAGE = 'page.openProperties#inspector-page-properties-button';
const EXPORT = 'project.export#toolbar-top-bar-export';

interface Node { readonly type: string; readonly attributes: Readonly<Record<string, unknown>>; readonly children: readonly Node[] }
const current = (page: Page) => page.evaluate(() => {
  const port = (window as unknown as { __builderTestPort: { document: () => { pages: { tree: Node }[] }; history: () => { undoSteps: number } } }).__builderTestPort;
  return { tree: port.document().pages[0]?.tree, history: port.history() };
});

async function openInput(page: Page, entry: string): Promise<void> {
  await openEditor(page);
  await control(page, INSERT).click();
  await control(page, TILE, { args: { entry } }).click();
  await control(page, SETTINGS).click();
}

async function typeInto(page: Page, ref: string, value: string): Promise<void> {
  const input = control(page, ref).locator('input.input');
  await input.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type(value);
  await page.keyboard.press('Enter');
}

async function insertNext(page: Page, entry: string): Promise<void> {
  await control(page, PAGE).click();
  await control(page, TILE, { args: { entry } }).click();
}

async function rejects(page: Page, ref: string, value: string): Promise<void> {
  const before = await current(page);
  await typeInto(page, ref, value);
  expect(await current(page)).toEqual(before);
  await expect(control(page, ref).locator('.field-row__refusal')).toContainText(value);
}

test('number input refuses an unknown type and invalid numeric fields beside their doors', runs(INSERT, TILE, SETTINGS, TYPE, MAX, MIN, VALUE, STEP), async ({ page }) => {
  await openInput(page, 'input-number');
  await typeInto(page, TYPE, 'potato');
  expect((await current(page)).tree?.children[0]?.attributes).toEqual({ inputType: 'number' });
  await expect(control(page, TYPE).locator('.field-row__refusal')).toContainText('potato');

  await typeInto(page, MAX, '5');
  expect((await current(page)).tree?.children[0]?.attributes.max).toBe('5');
  await typeInto(page, MIN, '10');
  expect((await current(page)).tree?.children[0]?.attributes).toEqual({ inputType: 'number', max: '5' });
  await expect(control(page, MIN).locator('.field-row__refusal')).toContainText('10');

  await typeInto(page, VALUE, 'hello');
  expect((await current(page)).tree?.children[0]?.attributes.value).toBeUndefined();
  await expect(control(page, VALUE).locator('.field-row__refusal')).toContainText('hello');
  await typeInto(page, STEP, '-1');
  expect((await current(page)).tree?.children[0]?.attributes.step).toBeUndefined();
  await expect(control(page, STEP).locator('.field-row__refusal')).toContainText('-1');
  expect((await current(page)).history.undoSteps).toBe(2);
});

test('changing input type warns before discarding attributes and remains one undo step', runs(INSERT, TILE, SETTINGS, PLACEHOLDER, TYPE, UNDO), async ({ page }) => {
  await openInput(page, 'input-text');
  await typeInto(page, PLACEHOLDER, 'Your name');
  const input = control(page, TYPE).locator('input');
  await input.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('checkbox');
  await expect(control(page, TYPE).locator('.field-row__warning')).toContainText('Placeholder');
  expect((await current(page)).tree?.children[0]?.attributes.placeholder).toBe('Your name');
  await page.keyboard.press('Enter');
  expect((await current(page)).tree?.children[0]?.attributes).toEqual({ inputType: 'checkbox' });
  expect((await current(page)).history.undoSteps).toBe(3);
  await control(page, UNDO).click();
  expect((await current(page)).tree?.children[0]?.attributes).toEqual({ inputType: 'text', placeholder: 'Your name' });
});

test('date, colour and range values follow their input types', runs(INSERT, TILE, SETTINGS, PAGE, MAX, VALUE), async ({ page }) => {
  await openInput(page, 'input-date');
  await rejects(page, MAX, 'banana');
  await rejects(page, VALUE, '31/12/2020');
  await insertNext(page, 'input-color');
  await rejects(page, VALUE, 'red');
  await rejects(page, VALUE, '#12345');
  await insertNext(page, 'input-range');
  await rejects(page, VALUE, '500');
});

test('pattern, autocomplete, name and page language reject malformed text without changing the document', runs(INSERT, TILE, SETTINGS, PAGE, 'element.setAttribute#inspector-pattern', 'element.setAttribute#inspector-autocomplete', 'element.setAttribute#inspector-name', 'page.setSetting#inspector-page-language'), async ({ page }) => {
  await openInput(page, 'input-text');
  await rejects(page, 'element.setAttribute#inspector-pattern', '[');
  await rejects(page, 'element.setAttribute#inspector-autocomplete', 'banana');
  await rejects(page, 'element.setAttribute#inspector-name', 'user name');
  await control(page, PAGE).click();
  await rejects(page, 'page.setSetting#inspector-page-language', 'banana');
});

test('progress, meter, textarea and canvas keep impossible numbers out of the document', runs(INSERT, TILE, SETTINGS, PAGE, MAX, MIN, VALUE, 'element.setAttribute#inspector-rows', 'element.setAttribute#inspector-canvas-width', 'element.setAttribute#inspector-canvas-height'), async ({ page }) => {
  await openInput(page, 'progress');
  await rejects(page, MAX, '0');
  await rejects(page, VALUE, '150');
  await insertNext(page, 'meter');
  await typeInto(page, MIN, '10');
  await rejects(page, MAX, '1');
  await rejects(page, VALUE, 'abc');
  await insertNext(page, 'textarea');
  await rejects(page, 'element.setAttribute#inspector-rows', '0');
  await insertNext(page, 'canvas');
  await rejects(page, 'element.setAttribute#inspector-canvas-width', '-5');
  await rejects(page, 'element.setAttribute#inspector-canvas-height', '99999999');
});

test('valid typed media values survive ZIP export and render from the exported index file', runs(INSERT, TILE, SETTINGS, PAGE, VALUE, EXPORT), async ({ page, context }) => {
  await openInput(page, 'input-date');
  await typeInto(page, VALUE, '2026-09-25');
  await insertNext(page, 'input-color');
  await typeInto(page, VALUE, '#34699d');
  await insertNext(page, 'input-range');
  await typeInto(page, VALUE, '50');

  const download = page.waitForEvent('download');
  await control(page, EXPORT).click();
  const archive = fs.readFileSync(await (await download).path());
  const files = unzip(archive);
  const html = files.get('index.html')?.toString('utf8');
  const css = files.get('css/styles.css')?.toString('utf8');
  if (html === undefined || css === undefined) throw new Error('The site ZIP lacks index.html or css/styles.css');
  const inputs = html.match(/<input[^>]*>/g) ?? [];
  expect(inputs).toHaveLength(3);
  expect(inputs.find((tag) => tag.includes('type="date"'))).toContain('value="2026-09-25"');
  expect(inputs.find((tag) => tag.includes('type="color"'))).toContain('value="#34699d"');
  expect(inputs.find((tag) => tag.includes('type="range"'))).toContain('value="50"');
  expect(html).not.toContain('style=');

  const directory = path.resolve('.cache/scratch/export-7.1b');
  fs.mkdirSync(path.join(directory, 'css'), { recursive: true });
  fs.writeFileSync(path.join(directory, 'site.zip'), archive);
  fs.writeFileSync(path.join(directory, 'index.html'), html);
  fs.writeFileSync(path.join(directory, 'css/styles.css'), css);
  const exported = await context.newPage();
  await exported.goto(pathToFileURL(path.join(directory, 'index.html')).href);
  await expect(exported.locator('input[type="date"]')).toHaveValue('2026-09-25');
  await expect(exported.locator('input[type="color"]')).toHaveValue('#34699d');
  await expect(exported.locator('input[type="range"]')).toHaveValue('50');
  await exported.screenshot({ path: '.cache/logs/uso-7.1b-20260926-1622/exported-site.png' });
  await exported.close();
});


// A3.30: the Autocomplete field offers the HTML values elements.json declares, and the field keeps taking any text the
// grammar allows (the validation is the test above).
test('Autocomplete suggests the HTML values', runs(INSERT, TILE, SETTINGS, AUTOCOMPLETE), async ({ page }) => {
  await openInput(page, 'input-text');
  const field = control(page, AUTOCOMPLETE).locator('input.input');
  const listId = await field.getAttribute('list');
  expect(listId, 'the field suggests a list').not.toBeNull();
  const offered = await page.locator(`datalist#${String(listId)} option`).evaluateAll((els) => els.map((e) => (e as HTMLOptionElement).value));
  for (const value of ['off', 'given-name', 'email', 'cc-number', 'postal-code', 'one-time-code']) expect(offered, `${value} is offered`).toContain(value);
  await field.click();
  await page.keyboard.type('shipping email\n');
  expect((await current(page)).tree?.children[0]?.attributes?.['autocomplete']).toBe('shipping email');
});

// A3.39: every field its type needs, on the right type — an embedded frame's Title (required for accessibility),
// Allow and Loading; a textarea's Cols, Max length and Min length; a video's Plays inline and Preload. The Checks entry
// for a frame without a title comes with accessibility-checks (item 7.5).
test('an embedded frame, a textarea and a video draw the fields their type needs', runs(INSERT, TILE, SETTINGS), async ({ page }) => {
  await openInput(page, 'embedded-frame');
  for (const ref of ['element.setAttribute#inspector-title', 'element.setAttribute#inspector-allow', 'element.setAttribute#inspector-loading'])
    await expect(control(page, ref), ref + ' is drawn for an embedded frame').toHaveCount(1);
  // the Title typed on the frame reaches the document (the export writes it as the iframe's title)
  await typeInto(page, 'element.setAttribute#inspector-title', 'Aurora, embedded');
  const held = await page.evaluate(() => {
    const port = (window as unknown as { __builderTestPort: { document: () => { pages: { tree: { tag: string | null; attributes: Record<string, unknown>; children: unknown[] } }[] } } }).__builderTestPort;
    const find = (n: { tag: string | null; attributes: Record<string, unknown>; children: unknown[] }): { tag: string | null; attributes: Record<string, unknown>; children: unknown[] } | undefined => (n.tag === 'iframe' ? n : (n.children as { tag: string | null; attributes: Record<string, unknown>; children: unknown[] }[]).map(find).find((x) => x !== undefined));
    return find(port.document().pages[0]?.tree as { tag: string | null; attributes: Record<string, unknown>; children: unknown[] })?.attributes.title ?? null;
  });
  expect(held, 'the frame holds its title').toBe('Aurora, embedded');
  await insertNext(page, 'textarea');
  for (const ref of ['element.setAttribute#inspector-cols', 'element.setAttribute#inspector-max-length', 'element.setAttribute#inspector-min-length'])
    await expect(control(page, ref), ref + ' is drawn for a textarea').toHaveCount(1);
  await insertNext(page, 'video');
  await expect(control(page, 'element.setAttribute#inspector-preload'), 'Preload is drawn for a video').toHaveCount(1);
  // a boolean attribute is its Off | On pair, one control per state (spec settings-audit)
  await expect(control(page, 'element.setAttribute#inspector-plays-inline'), 'Plays inline is drawn for a video, Off and On').toHaveCount(2);

});


// A boolean attribute is an Off | On pair (spec settings-audit, "Settings layout"; jornada02 GENERALISATION 1.3): the
// stored state pressed, a press on the other writes it in one step, and a press on the pressed one writes nothing.
test('a boolean attribute is an Off | On pair: the stored state is pressed and a press on the other writes it', runs(INSERT, TILE, SETTINGS, 'element.setAttribute#inspector-plays-inline'), async ({ page }) => {
  await openInput(page, 'video');
  const REF = 'element.setAttribute#inspector-plays-inline';
  const onButton = control(page, REF, { args: { value: true } });
  const offButton = control(page, REF, { args: { value: false } });
  await expect(offButton).toHaveAttribute('aria-pressed', 'true');
  await expect(onButton).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.inspector input[type="checkbox"]')).toHaveCount(0);
  await onButton.click();
  await expect(onButton).toHaveAttribute('aria-pressed', 'true');
  const stored = () =>
    page.evaluate(() => {
      const port = (window as unknown as { __builderTestPort: { document: () => { pages: { tree: { tag: string | null; attributes: Record<string, unknown>; children: unknown[] } }[] } } }).__builderTestPort;
      const find = (n: { tag: string | null; attributes: Record<string, unknown>; children: unknown[] }): { tag: string | null; attributes: Record<string, unknown>; children: unknown[] } | undefined => (n.tag === 'video' ? n : (n.children as { tag: string | null; attributes: Record<string, unknown>; children: unknown[] }[]).map(find).find((x) => x !== undefined));
      return find(port.document().pages[0]?.tree as { tag: string | null; attributes: Record<string, unknown>; children: unknown[] })?.attributes.playsInline ?? null;
    });
  expect(await stored()).toBe(true);
  await offButton.click();
  await expect.poll(stored).toBe(null);
});
