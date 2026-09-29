// Mixed values said the same way everywhere (spec multi-select-edit, Problems in Pager 4; the user's real-use audit,
// A3.35). The two cards' titles, given different text alignments through the Text align buttons, then clicked and
// Shift+clicked on the canvas: the buttons say Mixed and none is pressed; Reset this value is drawn and takes both
// alignments away in one undo step (the document read through the read-only test port). The Margin and Padding
// links carry their own names. One title given a top padding: the Padding top field of both says Mixed.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { control, openEverySection, runDoor, runs } from './door.ts';

const FIXTURE = 'manifest/features/fixtures/aurora.json';
const OPEN = 'project.open#menu-file';
const ROW = 'selection.select#layers-row';
const ADD = 'selection.add#canvas-click-element-shift';
const ALIGN = 'style.set#inspector-text-align';
const RESET = 'style.reset#inspector-property-reset';
const LINK = 'inspector.toggleSpacingLink#inspector-spacing-link';
const PADDING_TOP = 'style.setSpacing#inspector-padding-top-box-model';

interface Tree {
  readonly id: string;
  readonly styles: Record<string, Record<string, Record<string, string>> | undefined>;
  readonly children: readonly Tree[];
}
type Port = { document: () => { pages: { tree: Tree }[] }; history: () => { undoSteps: number } };
const read = (page: Page) =>
  page.evaluate(() => {
    const p = (window as unknown as { __builderTestPort: Port }).__builderTestPort;
    return { tree: p.document().pages[0]?.tree, undoSteps: p.history().undoSteps };
  });
async function alignOf(page: Page, id: string): Promise<string | undefined> {
  const { tree } = await read(page);
  const find = (n: Tree): Tree | undefined => (n.id === id ? n : n.children.map(find).find((x) => x !== undefined));
  return (tree === undefined ? undefined : find(tree))?.styles.desktop?.base?.['text-align'];
}
async function clickOnCanvas(page: Page, id: string, shift: boolean): Promise<void> {
  const at = await page.evaluate((node) => {
    const iframe = document.querySelector<HTMLIFrameElement>('.frame__page');
    const el = iframe?.contentDocument?.querySelector(`[data-node="${node}"]`);
    if (!iframe || !el) throw new Error(`the canvas does not draw ${node}`);
    const zoom = iframe.currentCSSZoom;
    const frame = iframe.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: frame.left + (r.left + r.width / 4) * zoom, y: frame.top + (r.top + r.height / 2) * zoom };
  }, id);
  if (shift) await page.keyboard.down('Shift');
  await page.mouse.click(at.x, at.y);
  if (shift) await page.keyboard.up('Shift');
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  const chooser = page.waitForEvent('filechooser');
  await runDoor(page, OPEN);
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync(FIXTURE) });
  await expect(page.frameLocator('.frame__page').locator('[data-node="n-card-b-title"]')).toHaveCount(1);
  // every section drawn open: the Text align buttons and the spacing box live in sections a title holds nothing in
  // (item 5.1), and this spec reads both
  await openEverySection(page);
  await control(page, ROW, { args: { target: 'n-card-a-title' } }).click();
  await control(page, ALIGN, { args: { property: 'text-align', value: 'center' } }).click();
  await control(page, ROW, { args: { target: 'n-card-b-title' } }).click();
  await control(page, ALIGN, { args: { property: 'text-align', value: 'right' } }).click();
  await expect.poll(() => alignOf(page, 'n-card-a-title')).toBe('center');
  await expect.poll(() => alignOf(page, 'n-card-b-title')).toBe('right');
  await clickOnCanvas(page, 'n-card-a-title', false);
  await clickOnCanvas(page, 'n-card-b-title', true);
});

test('two titles aligned differently: Text align says Mixed with no button pressed, and Reset takes both away in one step', runs(OPEN, ROW, ALIGN, ADD, RESET), async ({ page }) => {
  const group = page.locator(`[data-door="${ALIGN}"]`).first().locator('xpath=..');
  await expect(group).toHaveAttribute('data-mixed', '');
  await expect(page.locator(`[data-door="${ALIGN}"][aria-pressed="true"]`)).toHaveCount(0);
  // the Mixed word stands beside the field's control, in the row itself (the row holds the control's cell and the marker)
  await expect(group.locator('xpath=../..').locator('.field-row__mixed')).toHaveText('Mixed');
  const before = (await read(page)).undoSteps;
  // the reset floats beside the active field: hovering the field draws it
  const choice = group.locator('xpath=..');
  await choice.hover();
  await choice.locator(`[data-door="${RESET}"]`).click();
  await expect.poll(() => alignOf(page, 'n-card-a-title')).toBeUndefined();
  expect(await alignOf(page, 'n-card-b-title')).toBeUndefined();
  expect((await read(page)).undoSteps).toBe(before + 1);
});

test('each box link names its box, and a side only one title holds says Mixed', runs(OPEN, ROW, ALIGN, ADD, LINK, PADDING_TOP), async ({ page }) => {
  const names = await page.locator(`[data-door="${LINK}"]`).evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
  expect(names).toEqual(['Link the four sides of Margin', 'Link the four sides of Padding']);
  // only the first title holds a top padding
  await control(page, ROW, { args: { target: 'n-card-a-title' } }).click();
  const top = page.locator(`[data-door="${PADDING_TOP}"] input`);
  await top.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('12px');
  await page.keyboard.press('Enter');
  await clickOnCanvas(page, 'n-card-a-title', false);
  await clickOnCanvas(page, 'n-card-b-title', true);
  await expect(top).toHaveAttribute('placeholder', 'Mixed');
  await expect(top).toHaveValue('');
});

test('Reset this value is drawn when only another selected element holds the value, and takes it away', runs(OPEN, ROW, ALIGN, ADD, RESET), async ({ page }) => {
  // the first title's alignment taken away: only the second holds one
  await control(page, ROW, { args: { target: 'n-card-a-title' } }).click();
  const row = page.locator(`[data-door="${ALIGN}"]`).first().locator('xpath=../..');
  // the reset floats beside the active field, drawn while the field is hovered or holds the focus
  const reset = async () => {
    await row.hover();
    await row.locator(`[data-door="${RESET}"]`).click();
  };
  await reset();
  await expect.poll(() => alignOf(page, 'n-card-a-title')).toBeUndefined();
  await clickOnCanvas(page, 'n-card-a-title', false);
  await clickOnCanvas(page, 'n-card-b-title', true);
  await reset();
  await expect.poll(() => alignOf(page, 'n-card-b-title')).toBeUndefined();
});
