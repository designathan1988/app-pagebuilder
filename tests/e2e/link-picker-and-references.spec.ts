// The link picker and the references between elements (spec elements-structure; the user's real-use audit, items 7.4,
// A3.4 and A3.44): the picker chooses what a link points at (a page of the project, an element of the page, an address),
// a reference is kept by the target's node id so renaming the target's ID leaves it working and the export writes the
// ID as it stands, a delete says how many references it takes away and removes them in the same undo step, and a
// project file whose semantics are broken is refused with the reason at File › Open.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, openMenu, runDoor, runs } from './door.ts';
import { unzip } from '../../tools/runner/unzip.ts';

const INSERT = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';
const SETTINGS = 'workspace.setActiveTab#inspector-tab-settings';
const OPEN_PICKER = 'linkPicker.open#field-href-choose';
const KIND = (kind: string) => `linkPicker.setKind#link-picker-${kind}`;
const ANCHOR_ITEM = 'element.setLink#link-picker-anchor-item';
const PAGE_ITEM = 'element.setLink#link-picker-page-item';
const CLOSE = 'linkPicker.close#link-picker-close';
const ID_FIELD = 'element.setId#inspector-id';
const LABEL_FOR = 'element.setLabelTarget#inspector-label-for';
const OPEN = 'project.open#menu-file';
const EXPORT = 'project.export#toolbar-top-bar-export';
const ROW = 'selection.select#layers-row';

interface Node { readonly id: string; readonly type: string; readonly name: string; readonly attributes: Readonly<Record<string, unknown>>; readonly children: readonly Node[] }
const tree = async (page: Page): Promise<Node> =>
  page.evaluate(() => (window as unknown as { __builderTestPort: { document: () => { pages: { tree: Node }[] } } }).__builderTestPort.document().pages[0]?.tree as Node);
const find = (node: Node, type: string): Node | null => (node.type === type ? node : node.children.map((c) => find(c, type)).find((x) => x !== null) ?? null);
async function typeInto(page: Page, ref: string, text: string, keep: 'enter' | 'tab' = 'enter'): Promise<void> {
  const field = control(page, ref).locator('textarea, input').first();
  await field.click();
  await page.keyboard.press('Control+A');
  if (text === '') await page.keyboard.press('Backspace');
  else await page.keyboard.type(text);
  await page.keyboard.press(keep === 'tab' ? 'Tab' : 'Enter');
}
async function exportedHtml(page: Page): Promise<string> {
  const download = page.waitForEvent('download');
  await runDoor(page, EXPORT);
  return unzip(fs.readFileSync(await (await download).path())).get('index.html')?.toString('utf8') ?? '';
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

test('the link picker chooses a section, a page or an address, and closes with Escape or its button', runs(INSERT, TILE, SETTINGS, OPEN_PICKER, KIND('page'), KIND('anchor'), KIND('url'), ANCHOR_ITEM, PAGE_ITEM, CLOSE, EXPORT), async ({ page }) => {
  await runDoor(page, TILE, { args: { entry: 'heading' } });
  await runDoor(page, SETTINGS);
  await typeInto(page, ID_FIELD, 'inicio');
  await runDoor(page, TILE, { args: { entry: 'link' } });
  await runDoor(page, SETTINGS);
  const link = find(await tree(page), 'link');
  const heading = find(await tree(page), 'heading');
  if (link === null || heading === null) throw new Error('the Link and the Heading are missing');
  await runDoor(page, OPEN_PICKER, { args: { target: link.id } });
  const picker = page.locator('[data-region="link-picker"]');
  await expect(picker).toBeVisible();
  // the kinds are the region's five segments; the anchor kind lists the elements that carry an ID, by name and ID
  expect(await picker.locator('[data-door^="linkPicker.setKind"] ').count()).toBe(5);
  await runDoor(page, KIND('anchor'));
  await expect(control(page, ANCHOR_ITEM, { args: { anchor: heading.id } })).toBeVisible();
  await expect(control(page, ANCHOR_ITEM, { args: { anchor: heading.id } })).toContainText('· #inicio');
  await runDoor(page, KIND('page'));
  await expect(control(page, PAGE_ITEM, { args: { page: 'index.html' } })).toBeVisible();
  await runDoor(page, KIND('url'));
  await expect(picker.locator('input[type="text"]')).toBeVisible();
  await picker.locator('input[type="text"]').fill('/about');
  await picker.locator('input[type="text"]').press('Enter');
  await expect.poll(async () => find(await tree(page), 'link')?.attributes.href).toBe('/about');
  // the anchor writes the section; the export carries the fragment the target's ID names
  await runDoor(page, OPEN_PICKER, { args: { target: link.id } });
  await runDoor(page, KIND('anchor'));
  await runDoor(page, ANCHOR_ITEM, { args: { anchor: heading.id } });
  await expect.poll(async () => find(await tree(page), 'link')?.attributes.href).toBe(`#${heading.id}`);
  // the picker covers the editor: it is closed before the export is asked for
  await runDoor(page, CLOSE);
  expect(await exportedHtml(page)).toContain('<a href="#inicio">A link</a>');
  // Escape closes the picker; the close button too
  await runDoor(page, OPEN_PICKER, { args: { target: link.id } });
  await expect(picker).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(picker).toHaveCount(0);
  await runDoor(page, OPEN_PICKER, { args: { target: link.id } });
  await runDoor(page, CLOSE);
  await expect(picker).toHaveCount(0);
  // and renaming the target's ID leaves the link working: the export follows it (A3.4)
  await control(page, ROW, { args: { target: heading.id } }).click();
  await runDoor(page, SETTINGS);
  await typeInto(page, ID_FIELD, 'cta');
  expect(await exportedHtml(page)).toContain('<a href="#cta">A link</a>');
});

test('a label points at a control by name or ID, follows the ID, and a delete says what it takes away', runs(INSERT, TILE, SETTINGS, LABEL_FOR, ID_FIELD, 'element.delete#menu-edit', EXPORT), async ({ page }) => {
  await runDoor(page, TILE, { args: { entry: 'input-text' } });
  await runDoor(page, TILE, { args: { entry: 'label' } });
  await runDoor(page, SETTINGS);
  const label = find(await tree(page), 'label');
  const input = find(await tree(page), 'input');
  if (label === null || input === null) throw new Error('the Label and the Input are missing');
  // the field shows the control it points at, by name and ID, and takes either of them
  await runDoor(page, LABEL_FOR);
  const field = control(page, LABEL_FOR).locator('input');
  await field.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Input');
  await page.keyboard.press('Enter');
  await expect.poll(async () => find(await tree(page), 'label')?.attributes.labelFor).toBe(input.id);
  await expect(field).toHaveValue('Input');
  const named = String(find(await tree(page), 'input')?.attributes.id ?? '');
  expect(named, 'the control got an ID').not.toBe('');
  expect(await exportedHtml(page)).toContain(`for="${named}"`);
  // the label follows a new ID of its control
  await control(page, ROW, { args: { target: input.id } }).click();
  await runDoor(page, SETTINGS);
  await typeInto(page, ID_FIELD, 'email-field');
  expect(await exportedHtml(page)).toContain('for="email-field"');
  // deleting the control says how many references go with it, and the export has no orphan for
  await control(page, ROW, { args: { target: input.id } }).click();
  await runDoor(page, 'element.delete#menu-edit');
  await expect(page.getByRole('status')).toContainText('references');
  expect(find(await tree(page), 'label')?.attributes.labelFor).toBeUndefined();
  expect(await exportedHtml(page)).not.toContain('for=');
  // one undo gives both back
  await runDoor(page, 'history.undo#toolbar-top-bar');
  await expect.poll(async () => find(await tree(page), 'label')?.attributes.labelFor).toBe(input.id);
});

test('a project file whose semantics are broken is refused with the reason', runs(OPEN, 'element.insert#elements-tile'), async ({ page }) => {
  const held = await page.evaluate(() => (window as unknown as { __builderTestPort: { document: () => unknown } }).__builderTestPort.document());
  // an input whose type is not an HTML input type, and a label pointing at nothing
  const broken = JSON.parse(JSON.stringify(held)) as { pages: { tree: { children: unknown[] } }[] };
  const root = broken.pages[0]?.tree;
  if (root === undefined) throw new Error('no page');
  root.children = [
    { id: 'a1', type: 'input', name: 'Input', tag: 'input', attributes: { inputType: 'potato' }, classes: [], styles: {}, text: null, children: [] },
    { id: 'a2', type: 'label', name: 'Label', tag: 'label', attributes: { labelFor: 'gone:01' }, classes: [], styles: {}, text: null, children: [] },
  ];
  // a plain id attribute the file carried ('button-24') is left alone; a reference that names no element is refused
  for (const [broken1, expected] of [[true, 'potato'], [false, 'names no element']] as const) {
    if (!broken1) delete (root.children[0] as { attributes: Record<string, unknown> }).attributes.inputType;
    await openMenu(page, 'file');
    const chooser = page.waitForEvent('filechooser');
    await page.locator(`[data-door="${OPEN}"]`).click();
    await (await chooser).setFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(broken), 'utf8') });
    await expect(page.getByRole('status')).toContainText(expected);
    // nothing was opened: the document is still the empty project
    expect(await page.evaluate(() => (window as unknown as { __builderTestPort: { document: () => { pages: { tree: { children: unknown[] } }[] } } }).__builderTestPort.document().pages[0]?.tree.children.length)).toBe(0);
  }});
