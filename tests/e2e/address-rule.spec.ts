// The one rule of an address (core/elements/address.ts; the user's real-use audit, A3.2): every address field takes
// a relative path, https:, mailto: and tel:, refuses what runs code (javascript:, data:) with its reason, and refuses a
// #section that names no element of the page as well as a bare domain stored as https://… — the acceptance being
// /about in a Link and a Form, "nope" refused in a
// video's Poster, and url("javascript:…") refused in a free declaration. The document is read through the read-only
// test port, the refusal from beside the field.
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, openEverySection, runDoor, runs } from './door.ts';

const INSERT = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';
const SETTINGS = 'workspace.setActiveTab#inspector-tab-settings';
const HREF = 'element.setLink#inspector-href';
const ACTION = 'element.setAttribute#inspector-action';
const POSTER = 'element.setAttribute#inspector-poster';
const DECLARATIONS = 'style.setCustomDeclarations#inspector-custom-declarations';
const STYLE = 'workspace.setActiveTab#inspector-tab-style';

interface Node { readonly type: string; readonly attributes: Readonly<Record<string, unknown>>; readonly styles: Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, string>>>>>>; readonly children: readonly Node[] }
const tree = async (page: Page): Promise<Node> =>
  page.evaluate(() => (window as unknown as { __builderTestPort: { document: () => { pages: { tree: Node }[] } } }).__builderTestPort.document().pages[0]?.tree as Node);
const find = (node: Node, type: string): Node | null => (node.type === type ? node : node.children.map((c) => find(c, type)).find((x) => x !== null) ?? null);
const baseOf = (node: Node): Readonly<Record<string, string>> => find(node, 'video')?.styles.desktop?.base ?? {};
async function typeInto(page: Page, ref: string, text: string): Promise<void> {
  const field = control(page, ref).locator('textarea, input').first();
  await field.click();
  await page.keyboard.press('Control+A');
  if (text === '') await page.keyboard.press('Backspace');
  else await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.locator('.workbench')).toBeVisible();
  await openEditor(page);
  await runDoor(page, INSERT);
});

test('a Link and a Form take a relative path, a #section and a bare domain (stored as https://…), and refuse what runs code', runs(INSERT, TILE, SETTINGS, HREF, ACTION), async ({ page }) => {
  await runDoor(page, TILE, { args: { entry: 'link' } });
  await runDoor(page, SETTINGS);
  const link = find(await tree(page), 'link');
  if (link === null) throw new Error('the Link was not inserted');
  const addresses: readonly (readonly [string, string])[] = [['/about', '/about'], ['mailto:ana@example.com', 'mailto:ana@example.com'], ['tel:+55 11 99999-0000', 'tel:+55 11 99999-0000']];
  for (const [typed, stored] of addresses) {
    await typeInto(page, HREF, typed);
    await expect.poll(async () => find(await tree(page), 'link')?.attributes.href).toBe(stored);
  }
  // A fragment names an element of the page — the link picker's own case (the scenario of link-picker: a link points
  // at a section of the page and follows its id, A3.4). One that names nothing is refused here with its reason, and
  // the document keeps its link: the validator refuses a document holding a reference to nothing, and the field says
  // why instead of the write going missing in silence.
  await typeInto(page, HREF, '#inicio');
  await expect(control(page, HREF).locator('.field-row__refusal')).toContainText('inicio');
  expect(find(await tree(page), 'link')?.attributes.href).toBe('tel:+55 11 99999-0000');
  // a domain typed without its scheme is stored as the browser would open it, and the status says so
  await typeInto(page, HREF, 'example.com/about');
  await expect.poll(async () => find(await tree(page), 'link')?.attributes.href).toBe('https://example.com/about');
  await expect(page.getByRole('status')).toContainText('https://example.com/about');
  // what runs code is refused, with the reason, and the document keeps its link
  await typeInto(page, HREF, 'javascript:alert(1)');
  await expect(control(page, HREF).locator('.field-row__refusal')).toContainText('javascript:alert(1)');
  expect(find(await tree(page), 'link')?.attributes.href).toBe('https://example.com/about');
  // a Form's action takes a path too (the sidebar still shows the palette)
  await runDoor(page, TILE, { args: { entry: 'form' } });
  await runDoor(page, SETTINGS);
  await typeInto(page, ACTION, '/send');
  await expect.poll(async () => find(await tree(page), 'form')?.attributes.action).toBe('/send');
});

test('a video Poster refuses a word that names no address, and a free declaration refuses url(javascript:…) with its reason', runs(INSERT, TILE, SETTINGS, STYLE, POSTER, DECLARATIONS), async ({ page }) => {
  await runDoor(page, TILE, { args: { entry: 'video' } });
  await runDoor(page, SETTINGS);
  await typeInto(page, POSTER, '/img/poster.jpg');
  await expect.poll(async () => find(await tree(page), 'video')?.attributes.poster).toBe('/img/poster.jpg');
  await typeInto(page, POSTER, 'nope');
  await expect(control(page, POSTER).locator('.field-row__refusal')).toContainText('nope');
  expect(find(await tree(page), 'video')?.attributes.poster).toBe('/img/poster.jpg');
  // the declarations' text area (the Style tab, its last control) keeps a path and refuses a code address, naming it;
  // it lives in the Advanced section, drawn collapsed while the element holds nothing there (item 5.1)
  await runDoor(page, STYLE);
  await openEverySection(page);
  await typeInto(page, DECLARATIONS, 'background-image: url("/img/a.png")');
  await expect.poll(async () => baseOf(await tree(page))['background-image']).toBe('url("/img/a.png")');
  await typeInto(page, DECLARATIONS, 'background-image: url("javascript:alert(1)")');
  await expect(page.getByRole('status')).toContainText('javascript:alert(1)');
  expect(baseOf(await tree(page))['background-image']).toBe('url("/img/a.png")');
});
