// app-menu beyond its scenarios (spec/BEHAVIOUR.md#app-menu): a menu opened from its button takes the focus on its
// first item, the arrows move the focus, and Escape closes the menu and gives the focus back to its button (Enter on
// the button is keyboard-panel-navigation's, finding 48); with nothing selected, Arrange's items that need a
// selection are disabled and say why (Problems in Pager 4), and a click on one changes nothing.
import { expect, test } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { runs } from './door.ts';

const DUPLICATE = 'element.duplicate#menu-edit';
const MOVE_UP = 'element.moveUp#menu-arrange';
type Port = { document: () => unknown };
const documentNow = (page: import('@playwright/test').Page) => page.evaluate(() => JSON.stringify((window as unknown as { __builderTestPort: Port }).__builderTestPort.document()));

test('an open menu moves and closes from the keyboard, and gives the focus back to its button', runs(), async ({ page }) => {
  await openEditor(page);
  const edit = page.locator('.menu-button[data-menu="edit"]');
  await edit.click();
  const items = page.locator('[role="menu"] [role^="menuitem"]');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="menu"]')).toHaveCount(0);
  await expect(edit).toBeFocused();
});

test('with nothing selected, a menu item that needs a selection is disabled, says why, and does nothing', runs(MOVE_UP, DUPLICATE), async ({ page }) => {
  await openEditor(page);
  const before = await documentNow(page);
  await page.locator('.menu-button[data-menu="arrange"]').click();
  const moveUp = page.locator(`[data-door="${MOVE_UP}"]`);
  await expect(moveUp).toHaveAttribute('aria-disabled', 'true');
  const reason = await moveUp.getAttribute('title');
  expect(reason ?? '').not.toBe('');
  expect(reason).not.toContain('not available yet');
  await moveUp.click({ force: true });
  expect(await documentNow(page)).toBe(before);
});

// The menu bar from the keyboard (spec app-menu; the audit's U-033): F10 opens File, the arrows go to the next and the
// previous menu, and on an item that leads to a submenu ArrowRight opens it and ArrowLeft closes it, back on its item.
test('F10 opens the menu bar, the arrows walk its menus, and open and close a submenu', runs('focus.menuBar#key-f10-in-global', 'focus.nextMenu#key-arrow-right-in-menu', 'focus.previousMenu#key-arrow-left-in-menu'), async ({ page }) => {
  await openEditor(page);
  const open = () => page.locator('.top-bar__menus [data-menu][aria-expanded="true"]').getAttribute('data-menu');
  await page.keyboard.press('F10');
  await expect.poll(open).toBe('file');
  await page.keyboard.press('ArrowRight');
  await expect.poll(open).toBe('edit');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(open).toBe('file');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(open).toBe('help');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(open).toBe('view');
  // the View menu's Theme leads to a submenu
  const theme = page.locator('.menu__sub > [aria-haspopup="menu"]').first();
  await theme.focus();
  await page.keyboard.press('ArrowRight');
  await expect(theme).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => page.evaluate(() => document.activeElement?.closest('.menu__sub .menu') !== null)).toBe(true);
  await page.keyboard.press('ArrowLeft');
  await expect(theme).toHaveAttribute('aria-expanded', 'false');
  await expect(theme).toBeFocused();
});
