// semantic-tag-switch beyond its scenarios (spec/BEHAVIOUR.md#semantic-tag-switch): the Settings tab's HTML tag field
// shows the element's tag and suggests its equivalent tags (elements.json), and an element with no equivalent tag has
// no such field; a tag kept with Enter changes only the node's tag and the canvas draws the new element around the same
// children, undo and redo giving back each tag and the selection; leaving the field (Tab, a click on the canvas) keeps
// what was typed; a refused tag and an emptied field leave the document as it was and the field shows the element's
// tag again; a kept tag survives an immediate reload and the canvas draws it (Problems in Pager 1, 2, 5, 6). The
// document, the selection and the history are read through the read-only test port; the page through the frame.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { control, openMenu, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const SELECT = 'selection.select#canvas-click-element-or-page';
const SETTINGS = 'workspace.setActiveTab#inspector-tab-settings';
const PAGE_PROPERTIES = 'page.openProperties#inspector-page-properties-button';
const TAG = 'element.setTag#inspector-tag';
const UNDO = 'history.undo#toolbar-top-bar';
const REDO = 'history.redo#toolbar-top-bar';

const EN = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8')) as Record<string, string>;
const ELEMENTS = JSON.parse(fs.readFileSync('manifest/elements.json', 'utf8')) as { elements: { id: string; tag: string | null; alternativeTags: string[] }[] };
const words = (key: string, params: Record<string, string> = {}) => (EN[key] ?? '').replace(/\{(\w+)\}/g, (_, name: string) => params[name] ?? '');
// the tags an element of a type may take: its own and its alternative tags, each once
const equivalentOf = (type: string) => {
  const element = ELEMENTS.elements.find((e) => e.id === type);
  return [...new Set([element?.tag ?? '', ...(element?.alternativeTags ?? [])])];
};

interface Tree {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly tag: string | null;
  readonly attributes: Readonly<Record<string, unknown>>;
  readonly children: readonly Tree[];
}
const port = (page: Page) =>
  page.evaluate(() => {
    const p = (window as unknown as Record<string, { document: () => { pages: { tree: Tree }[] }; selection: () => string[]; history: () => { undoSteps: number } }>).__builderTestPort;
    if (!p) throw new Error('the test port is missing');
    return { document: p.document(), selection: p.selection(), undoSteps: p.history().undoSteps };
  });
const find = (tree: Tree, id: string): Tree | null => (tree.id === id ? tree : tree.children.map((c) => find(c, id)).find((n) => n !== null) ?? null);
// a node as the port reads it
const nodeOf = async (page: Page, id: string) => {
  const tree = (await port(page)).document.pages[0]?.tree;
  const found = tree === undefined ? null : find(tree, id);
  if (found === null) throw new Error(`the document has no node ${id}`);
  return found;
};
// the element's own href, as the document holds it (A3.7)
const linkOf = (node: Tree): unknown => node.attributes.href ?? null;
const tagOf = async (page: Page, id: string) => (await nodeOf(page, id)).tag;
const drawn = (page: Page, id: string) => page.frameLocator('.frame__page').locator(`[data-node="${id}"]`);
// the element the canvas draws for a node: its tag, the nodes of its child elements, and a computed style
const frameTag = (page: Page, id: string) => drawn(page, id).evaluate((el) => el.localName);
const frameChildren = (page: Page, id: string) => drawn(page, id).evaluate((el) => [...el.children].map((c) => c.getAttribute('data-node')));
const computed = (page: Page, id: string, property: string) => drawn(page, id).evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);
const status = (page: Page) => page.getByRole('status');
const field = (page: Page) => control(page, TAG).locator('input');

async function openAurora(page: Page) {
  await openMenu(page, 'file');
  const chooser = page.waitForEvent('filechooser');
  await page.locator(`[data-door="${OPEN}"]`).click();
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await expect(drawn(page, 'n-intro')).toHaveCount(1);
}

// A click on a point of a node's element on the canvas, which selects it: the middle where the element itself lies
// under it, else a point of its box the element takes — a container whose middle a child covers (the Hero holds the
// Title and the Intro at its middle) is clicked at a free part of its box, as the runner's own canvas point does
async function select(page: Page, id: string) {
  const at = await page.evaluate((node) => {
    const iframe = document.querySelector<HTMLIFrameElement>('.frame__page');
    const doc = iframe?.contentDocument;
    const el = doc?.querySelector(`[data-node="${node}"]`);
    if (!iframe || !doc || !el) throw new Error(`the canvas does not draw ${node}`);
    const zoom = iframe.currentCSSZoom;
    const frame = iframe.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const fractions = [0.5, 0.35, 0.65, 0.2, 0.8, 0.05, 0.95];
    const points = fractions.flatMap((fy) => fractions.map((fx) => ({ x: r.left + fx * r.width, y: r.top + fy * r.height })));
    const own = points.find((p) => doc.elementFromPoint(p.x, p.y)?.closest('[data-node]') === el) ?? { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    return { x: frame.left + own.x * zoom, y: frame.top + own.y * zoom };
  }, id);
  await page.mouse.click(at.x, at.y);
  await expect.poll(async () => (await port(page)).selection).toEqual([id]);
}

// a node selected on the canvas, then the Settings tab, with its HTML tag field showing the node's tag
async function tagFieldOf(page: Page, id: string) {
  await select(page, id);
  await runDoor(page, SETTINGS);
  await expect(field(page)).toHaveValue((await tagOf(page, id)) ?? '');
}

// types into the field as a person does: a click on it, everything it holds selected, then the text (an empty text
// deletes what it holds)
async function typeTag(page: Page, text: string) {
  await field(page).click();
  await page.keyboard.press('Control+A');
  if (text === '') await page.keyboard.press('Backspace');
  else await page.keyboard.type(text);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.locator('.workbench')).toBeVisible();
});

test("the HTML tag field shows the element's tag and suggests its equivalent tags; an element with no equivalent tag has none", runs(OPEN, SELECT, SETTINGS, TAG, PAGE_PROPERTIES), async ({ page }) => {
  await openAurora(page);
  const suggested = () => field(page).evaluate((input: HTMLInputElement) => [...(input.list?.options ?? [])].map((o) => o.value));
  for (const [id, type] of [
    ['n-hero', 'section'],
    ['n-title', 'heading'],
    ['n-intro', 'paragraph'],
  ] as const) {
    await tagFieldOf(page, id);
    await expect(field(page)).toBeEnabled();
    expect(await suggested(), `${id} suggests the equivalent tags of ${type}`).toEqual(equivalentOf(type));
  }
  // the page root (<body>) has no equivalent tag: its Settings tab has no HTML tag field
  await runDoor(page, PAGE_PROPERTIES);
  await expect.poll(async () => (await port(page)).selection).toEqual(['n-page']);
  await expect(page.locator('[data-region="inspector-settings"] input').first()).toBeVisible();
  await expect(control(page, TAG)).toHaveCount(0);
});

test('a tag kept with Enter changes only the tag, the canvas draws the new element around the same children, and undo and redo give back each tag and the selection', runs(OPEN, SELECT, SETTINGS, TAG, UNDO, REDO), async ({ page }) => {
  await openAurora(page);
  await tagFieldOf(page, 'n-hero');
  const before = await nodeOf(page, 'n-hero');
  const children = await frameChildren(page, 'n-hero');
  expect(await frameTag(page, 'n-hero')).toBe('section');
  await typeTag(page, 'article');
  // typing changes only the field
  expect(await tagOf(page, 'n-hero')).toBe('section');
  await page.keyboard.press('Enter');
  await expect.poll(() => tagOf(page, 'n-hero')).toBe('article');
  expect(await nodeOf(page, 'n-hero')).toEqual({ ...before, tag: 'article' });
  await expect(status(page)).toHaveText(words('status.tag.set', { name: 'Hero', tag: '<article>' }));
  await expect.poll(() => frameTag(page, 'n-hero')).toBe('article');
  expect(await frameChildren(page, 'n-hero')).toEqual(children);
  expect(await computed(page, 'n-hero', 'padding-top')).toBe('56px');
  expect((await port(page)).undoSteps).toBe(1);
  // Enter again with the same text records nothing
  await page.keyboard.press('Enter');
  expect((await port(page)).undoSteps).toBe(1);
  // a second switch is a second undo step
  await typeTag(page, 'header');
  await page.keyboard.press('Enter');
  await expect.poll(() => frameTag(page, 'n-hero')).toBe('header');
  expect((await port(page)).undoSteps).toBe(2);
  await select(page, 'n-intro');
  await runDoor(page, UNDO);
  await expect.poll(() => frameTag(page, 'n-hero')).toBe('article');
  expect(await tagOf(page, 'n-hero')).toBe('article');
  expect((await port(page)).selection).toEqual(['n-hero']);
  await runDoor(page, UNDO);
  await expect.poll(() => frameTag(page, 'n-hero')).toBe('section');
  expect(await nodeOf(page, 'n-hero')).toEqual(before);
  await runDoor(page, REDO);
  await runDoor(page, REDO);
  await expect.poll(() => frameTag(page, 'n-hero')).toBe('header');
  expect(await frameChildren(page, 'n-hero')).toEqual(children);
});

test('leaving the field keeps the typed tag, with Tab or a click on the canvas, and the canvas draws the heading at its new level', runs(OPEN, SELECT, SETTINGS, TAG), async ({ page }) => {
  await openAurora(page);
  await tagFieldOf(page, 'n-title');
  const h1Size = await computed(page, 'n-title', 'font-size');
  await typeTag(page, 'H4');
  await page.keyboard.press('Tab');
  await expect.poll(() => tagOf(page, 'n-title')).toBe('h4');
  await expect.poll(() => frameTag(page, 'n-title')).toBe('h4');
  // the base style's h4 (spec base-style; the ladder the tag-switch scenario names too)
  expect(await computed(page, 'n-title', 'font-size')).toBe('18px');
  expect(h1Size).not.toBe('18px');
  expect((await nodeOf(page, 'n-title')).type).toBe('heading');
  await typeTag(page, 'h5');
  await select(page, 'n-intro');
  await expect.poll(() => tagOf(page, 'n-title')).toBe('h5');
  await expect.poll(() => frameTag(page, 'n-title')).toBe('h5');
  expect((await port(page)).undoSteps).toBe(2);
});

test("a refused tag and an emptied field leave the document as it was, and the field shows the element's tag again", runs(OPEN, SELECT, SETTINGS, TAG), async ({ page }) => {
  await openAurora(page);
  await tagFieldOf(page, 'n-hero');
  await typeTag(page, 'p');
  await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText(words('status.tag.notEquivalent', { tag: '<p>', name: 'Hero' }));
  await expect(field(page)).toHaveValue('section');
  expect(await tagOf(page, 'n-hero')).toBe('section');
  expect(await frameTag(page, 'n-hero')).toBe('section');
  expect((await port(page)).undoSteps).toBe(0);
  // leaving the field then keeps nothing new
  await page.keyboard.press('Tab');
  expect((await port(page)).undoSteps).toBe(0);
  // an emptied field: the element keeps its tag, the status bar names it, the field shows it again
  await typeTag(page, '');
  await page.keyboard.press('Enter');
  await expect(status(page)).toHaveText(words('status.tag.set', { name: 'Hero', tag: '<section>' }));
  await expect(field(page)).toHaveValue('section');
  expect(await tagOf(page, 'n-hero')).toBe('section');
  expect((await port(page)).undoSteps).toBe(0);
});

test('a kept tag survives an immediate reload and the canvas draws it', runs(OPEN, SELECT, SETTINGS, TAG), async ({ page }) => {
  await openAurora(page);
  await tagFieldOf(page, 'n-intro');
  await typeTag(page, 'pre');
  await page.keyboard.press('Enter');
  await expect.poll(() => frameTag(page, 'n-intro')).toBe('pre');
  expect(await computed(page, 'n-intro', 'font-family')).toBe('ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace');
  await page.reload();
  await expect(page.locator('.workbench')).toBeVisible();
  await expect(drawn(page, 'n-intro')).toHaveCount(1);
  const intro = await nodeOf(page, 'n-intro');
  expect([intro.type, intro.tag]).toEqual(['paragraph', 'pre']);
  expect(await frameTag(page, 'n-intro')).toBe('pre');
  expect(await computed(page, 'n-intro', 'font-family')).toBe('ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace');
});

// A3.7: a tag switch drops the attributes the new tag cannot hold, says so, and the Settings follows the new tag. The
// Link Block of the library holds an href; after the tag becomes a button the document keeps no href and the Settings
// shows no Link address.
test('a tag switch drops the attributes the new tag cannot hold and the Settings follows the tag', runs(OPEN, SELECT, SETTINGS, TAG, 'element.insert#elements-tile'), async ({ page }) => {
  await openAurora(page);
  // a Link (the text palette one: its type takes a and button), inserted into the page
  await page.locator('[data-door="workspace.setPanelOpen#toolbar-activity-bar-insert"]').first().click();
  await page.locator('[data-door="element.insert#elements-tile"][data-args*=\'"entry":"link"\']').first().click();
  await page.waitForTimeout(300);
  const id = await page.evaluate(() => (window as unknown as { __builderTestPort: { selection: () => string[] } }).__builderTestPort.selection()[0] as string);
  await runDoor(page, SETTINGS);
  const linkField = control(page, 'element.setLink#inspector-href');
  await expect(linkField, 'a link shows its address').toHaveCount(1);
  // an address typed in the Settings (the library's link arrives without one, item 7.6)
  const address = linkField.locator('input').first();
  await address.click();
  await page.keyboard.press('Control+A');
  // a full address: a relative path is refused until A3.2's one rule for addresses (item 7.4)
  await page.keyboard.type('https://example.com/about');
  await page.keyboard.press('Enter');
  expect(linkOf(await nodeOf(page, id)), 'and the document holds the href').not.toBeNull();
  // the tag becomes a button: the html name of the lost attribute is named in the status, and the document drops it
  await field(page).fill('button');
  await field(page).press('Enter');
  await expect(status(page)).toHaveText(words('status.tag.setLost', { name: 'Link', tag: '<button>', attributes: 'href' }));
  expect(await tagOf(page, id)).toBe('button');
  expect(linkOf(await nodeOf(page, id)), 'the href is gone from the document').toBeNull();
  await expect(linkField, 'and the Settings offers no Link address for a button').toHaveCount(0);
  // undo gives the tag and the href back together
  await runDoor(page, UNDO);
  expect(await tagOf(page, id)).toBe('a');
  expect(linkOf(await nodeOf(page, id))).not.toBeNull();
});
