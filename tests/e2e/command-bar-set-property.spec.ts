// The command bar as a property setter and as a way to a field (spec command-bar-set-property): typing "<property>
// <value>" offers "Set <property> to <value>", the entry writes the value the property's own writer takes (one undo
// step, the canvas follows), a value the property does not take is never offered, and "Edit property <name>" opens the
// inspector's section with the field focused. The end artifacts are the document the read-only test port reads, the
// computed style in the frame, the history and the focused field — never the presence of a row.
import fs from 'node:fs';
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { openCommandBar, runs } from './door.ts';

const SET = 'style.set#command-bar-set-property';
const EDIT = 'inspector.reveal#command-bar-edit-property';
const OPEN = 'commandBar.open#toolbar-top-bar-search';

interface Node {
  readonly id: string;
  readonly name: string;
  readonly styles: Record<string, Record<string, Record<string, unknown>>>;
  readonly children: readonly Node[];
}
const nodeOf = (page: Page, name: string) =>
  page.evaluate((wanted) => {
    const p = (window as unknown as { __builderTestPort: { document: () => { pages: { tree: Node }[] }; selection: () => string[]; history: () => { undoSteps: number } } }).__builderTestPort;
    const find = (node: Node): Node | null => (node.name === wanted ? node : (node.children.map(find).find((one) => one !== null) ?? null));
    return { node: find(p.document().pages[0]?.tree as unknown as Node), selection: p.selection(), undoSteps: p.history().undoSteps };
  }, name);
const options = (page: Page) => page.locator('.command-bar__option');

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  // the fixture, so a selection with a card to write on exists
  const chooser = page.waitForEvent('filechooser');
  await page.locator('.menu-button[data-menu="file"]').click();
  await page.locator('[data-door="project.open#menu-file"]').click();
  await (await chooser).setFiles({ name: 'aurora.json', mimeType: 'application/json', buffer: fs.readFileSync('manifest/features/fixtures/aurora.json') });
  await page.locator('[data-door="selection.select#layers-row"][data-args*="n-card-b"]').first().click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __builderTestPort: { selection: () => string[] } }).__builderTestPort.selection())).toEqual(['n-card-b']);
});

test('"<property> <value>" offers to set it, and running the entry writes it in one undo step', runs(OPEN, SET), async ({ page }) => {
  await openCommandBar(page);
  await page.keyboard.type('width 50%');
  await expect(options(page).first()).toHaveText(/Set width to 50%/);
  await page.keyboard.press('Enter');
  const written = await nodeOf(page, 'CardB');
  expect(written.node?.styles.desktop?.base?.width).toBe('50%');
  // the page computes it: half of the column it stands in, and one undo takes it back
  const halves = await page.frameLocator('.frame__page').locator('[data-node="n-card-b"]').evaluate((el) => {
    const mine = parseFloat(getComputedStyle(el).width);
    const column = el.parentElement === null ? 0 : parseFloat(getComputedStyle(el.parentElement).width);
    return Math.abs(mine - column / 2) <= 1;
  });
  expect(halves, 'the card measures half its column').toBe(true);
  await page.keyboard.press('Control+Z');
  await expect.poll(() => nodeOf(page, 'CardB').then((read) => read.node?.styles.desktop?.base?.width)).toBeUndefined();
});

test('a value the property does not take is not offered, and Enter changes nothing', runs(OPEN, SET), async ({ page }) => {
  await openCommandBar(page);
  await page.keyboard.type('width abc');
  await expect(options(page).filter({ hasText: /^Set / })).toHaveCount(0);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
  const read = await nodeOf(page, 'CardB');
  expect(read.node?.styles.desktop?.base?.width).toBeUndefined();
  expect(read.undoSteps).toBe(0);
  // and a value the property takes is offered again
  await openCommandBar(page);
  await page.keyboard.type('width 240px');
  await expect(options(page).first()).toHaveText(/Set width to 240px/);
});

test('the writer each property names takes the value: a spacing side, a border colour, a shadow', runs(OPEN, SET), async ({ page }) => {
  const write = async (query: string, expected: string) => {
    await openCommandBar(page);
    await page.keyboard.type(query);
    await expect(options(page).first()).toHaveText(new RegExp(`^Set ${expected}`));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  };
  await write('padding-top 20px', 'padding-top to 20px');
  await write('border-top-color #00aa00', 'border-top-color to #00aa00');
  await write('box-shadow 0px 1px 2px #000000', 'box-shadow to 0px 1px 2px #000000');
  const read = await nodeOf(page, 'CardB');
  const base = read.node?.styles.desktop?.base;
  expect(base?.['padding-top']).toBe('20px');
  expect(base?.['border-top-color']).toBe('#00aa00');
  expect(base?.['box-shadow']).toEqual([{ color: '#000000', offsetX: '0px', offsetY: '1px', blur: '2px', spread: '0px', inset: false, hidden: false }]);
  expect(read.undoSteps).toBe(3);
});

test('"Edit property <name>" opens the inspector on that field and focuses it', runs(OPEN, EDIT), async ({ page }) => {
  // the inspector is closed, so the reveal has to open it
  await page.keyboard.press('Control+Alt+b');
  await expect(page.locator('.inspector')).toHaveCount(0);
  await openCommandBar(page);
  await page.keyboard.type('border-top-color');
  await expect(options(page).first()).toHaveText(/Edit property border-top-color/);
  await page.keyboard.press('Enter');
  await expect(page.locator('.inspector')).toHaveCount(1);
  // the field of that property is drawn in the Style tab and holds the focus
  const focused = await page.evaluate(() => {
    const active = document.activeElement;
    const field = active?.closest('[data-door]');
    return { door: field?.getAttribute('data-door') ?? null, inspector: active?.closest('.inspector') !== null };
  });
  expect(focused.inspector).toBe(true);
  expect(focused.door).toContain('style.setBorder');
  // and nothing in the document changed: the reveal is no edit
  const read = await nodeOf(page, 'CardB');
  expect(read.undoSteps).toBe(0);
  expect(read.node?.styles).toEqual({});
});
