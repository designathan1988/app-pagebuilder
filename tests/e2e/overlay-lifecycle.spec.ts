// Every layer the editor opens closes three ways — a second press on its trigger, a press outside it, and Escape —
// and no backdrop outlives the layer it belongs to. A person found the hole this covers: a select in the Style panel
// opened and never closed, because the field's own dropdown had copied the menu button's contract by hand and left
// out the backdrop. The sweep finds its triggers by role, so a layer drawn tomorrow is audited the day it appears
// (the user's direction: the suite tested the happy path of writing values, never the lifecycle of the interaction).
import { expect, test, type Page } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { runDoor, runs } from './door.ts';

const INSERT = 'workspace.setPanelOpen#toolbar-activity-bar-insert';
const TILE = 'element.insert#elements-tile';

interface Trigger {
  readonly key: string;
  readonly x: number;
  readonly y: number;
}

// Every control in a region that says it opens a layer, with the place it stands now (the caller scrolls first).
async function triggersIn(page: Page, selector: string): Promise<readonly Trigger[]> {
  return page.evaluate((scope) => {
    const root = document.querySelector(scope);
    if (root === null) return [];
    return [...root.querySelectorAll('[aria-haspopup]')]
      .filter((el) => {
        const b = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      })
      .map((el) => {
        const b = el.getBoundingClientRect();
        return {
          key: `${el.tagName}.${String(el.className).slice(0, 30)}[${el.getAttribute('data-door') ?? el.getAttribute('data-menu') ?? el.getAttribute('aria-label') ?? '?'}]`,
          x: Math.round(b.left + b.width / 2),
          y: Math.round(b.top + b.height / 2),
        };
      });
  }, selector);
}

// What a layer left behind: an open menu, a dialog, or the backdrop that stands under one.
const layersOpen = (page: Page): Promise<number> =>
  page.evaluate(() => document.querySelectorAll('[role="menu"], [role="dialog"], .overlay-backdrop, .class-popup__panel, .field__menu').length);
const backdrops = (page: Page): Promise<number> => page.evaluate(() => document.querySelectorAll('.overlay-backdrop').length);

async function expectClosed(page: Page, key: string, way: string): Promise<void> {
  await expect(layersOpen(page), `${key} still draws a layer after ${way}`).resolves.toBe(0);
  await expect(backdrops(page), `${key} leaves its backdrop behind after ${way}`).resolves.toBe(0);
}

async function sweepTrigger(page: Page, trigger: Trigger): Promise<void> {
  // open it
  await page.mouse.click(trigger.x, trigger.y);
  await expect(layersOpen(page), `${trigger.key} opens a layer`).resolves.toBeGreaterThan(0);
  // a second press on the trigger closes it
  await page.mouse.click(trigger.x, trigger.y);
  await expectClosed(page, trigger.key, 'a second press on its trigger');
  // a press outside closes it
  await page.mouse.click(trigger.x, trigger.y);
  await expect(layersOpen(page), `${trigger.key} opens a layer again`).resolves.toBeGreaterThan(0);
  await page.mouse.click(760, 520);
  await expectClosed(page, trigger.key, 'a press outside it');
  // and Escape closes it
  await page.mouse.click(trigger.x, trigger.y);
  await expect(layersOpen(page), `${trigger.key} opens a layer a third time`).resolves.toBeGreaterThan(0);
  await page.keyboard.press('Escape');
  await expectClosed(page, trigger.key, 'Escape');
}

test('every layer of the top bar closes on its trigger, outside and Escape', runs(), async ({ page }) => {
  await openEditor(page);
  const triggers = await triggersIn(page, '[data-region="top-bar"]');
  expect(triggers.length, 'the top bar draws menu buttons').toBeGreaterThan(3);
  for (const trigger of triggers) await sweepTrigger(page, trigger);
});

test('every layer of the Style panel closes on its trigger, outside and Escape', runs(INSERT, TILE), async ({ page }) => {
  await openEditor(page);
  await runDoor(page, INSERT);
  await runDoor(page, TILE, { args: { entry: 'heading' } });
  await page.locator('[data-door="workspace.setActiveTab#inspector-tab-style"]').first().click();
  // every section open: the sweep must see every layer the panel can draw
  for (let pass = 0; pass < 3; pass += 1) {
    for (const header of await page.locator('[data-door="inspector.toggleSection#inspector-section-header"]').all()) {
      if ((await header.getAttribute('aria-expanded')) !== 'true') await header.click();
    }
  }
  // the panel scrolls in its own box: each trigger is brought into view before it is pressed
  const keys = await page.evaluate(() => [...document.querySelector('[data-region="inspector-style"]').querySelectorAll('[aria-haspopup]')].map((el) => `${el.tagName}.${String(el.className).slice(0, 30)}[${el.getAttribute('data-door') ?? '?'}]`));
  expect(keys.length, 'the Style panel draws field dropdowns').toBeGreaterThan(4);
  for (const key of keys) {
    const visible = await page.evaluate((wanted) => {
      const region = document.querySelector('[data-region="inspector-style"]');
      const scroller = region.querySelector('.inspector-scroll');
      const field = [...region.querySelectorAll('[aria-haspopup]')].find((el) => `${el.tagName}.${String(el.className).slice(0, 30)}[${el.getAttribute('data-door') ?? '?'}]` === wanted);
      if (field === undefined) return null;
      const box = scroller.getBoundingClientRect();
      const b = field.getBoundingClientRect();
      scroller.scrollTop += b.top - box.top - 20;
      const now = field.getBoundingClientRect();
      return { key: wanted, x: Math.round(now.left + now.width / 2), y: Math.round(now.top + now.height / 2) };
    }, key);
    if (visible === null || visible.y < 180 || visible.y > 970) continue;
    await sweepTrigger(page, visible);
  }
});

test('the context menu closes on a press outside and on Escape, and leaves no backdrop', runs(), async ({ page }) => {
  await openEditor(page);
  await page.mouse.click(700, 400, { button: 'right' });
  await expect(page.locator('[data-context-menu]')).toHaveCount(1);
  await page.mouse.click(760, 520);
  await expect(page.locator('[data-context-menu]')).toHaveCount(0);
  await expect(backdrops(page)).resolves.toBe(0);
  await page.mouse.click(700, 400, { button: 'right' });
  await expect(page.locator('[data-context-menu]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-context-menu]')).toHaveCount(0);
  await expect(backdrops(page)).resolves.toBe(0);
});
