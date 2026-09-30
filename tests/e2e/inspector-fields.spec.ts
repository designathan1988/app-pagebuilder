// An inspector field is drawn as its door says (drawnAs of the inspector-field door): a button for an editor's action
// (Add a shadow, Reverse the gradient) or a fixed value (Spread), otherwise its property's control (a value field, a
// menu, keyword buttons). Read from the manifest and checked on every field the inspector draws in Chrome.
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '../support/test.ts';
import { openEditor } from '../support/editor.ts';
import { openEverySection, runDoor } from './door.ts';

const DRAWN = new Map<string, string>();
for (const file of fs.readdirSync('manifest/commands')) {
  const { commands } = JSON.parse(fs.readFileSync(path.join('manifest/commands', file), 'utf8')) as { commands: { id: string; entryPoints: { id: string; kind: string; drawnAs?: string }[] }[] };
  for (const c of commands) for (const d of c.entryPoints) if (d.kind === 'inspector-field' && d.drawnAs !== undefined) DRAWN.set(`${c.id}#${d.id}`, d.drawnAs);
}

test('every inspector field on screen is a button exactly when its door is drawn as one', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openEditor(page);
  // An element that holds text is selected — a paragraph draws the text fields too, and an element whose own content
  // is not text draws none of them (spec quick-panel; the user's real-use audit, 5.1) — and every section is drawn
  // open: the check reads every field of the Style tab
  await runDoor(page, 'workspace.setPanelOpen#toolbar-activity-bar-insert');
  await runDoor(page, 'element.insert#elements-tile', { args: { entry: 'paragraph' } });
  await openEverySection(page);
  // a door is drawn by its row (a field, a fixed-value button in its row) or, in a row it shares with words, by its own
  // button (Add a shadow: the + at the end of the shadow editor's head row, spec shadow-editor Problems 5); a keyword
  // button stands for one value of its field's door, drawn as the field
  const rows = await page.locator('.inspector .field-row[data-door], .inspector .field-row button.door:not(.door--segment)[data-door]').evaluateAll((els) =>
    els.map((el) => ({ ref: el.getAttribute('data-door') ?? '', button: el.matches('button.door') || el.querySelector(':scope > button.door--button') !== null })),
  );
  const drawn = rows.filter((r) => DRAWN.has(r.ref));
  // the Style tab draws its fields, among them editors' actions and fixed-value buttons (two fewer than the 101 it drew
  // before: Remove every shadow is drawn only once there is a shadow, spec shadow-editor Problems in Pager 5)
  expect(drawn.length).toBeGreaterThan(95);
  expect(drawn.filter((r) => DRAWN.get(r.ref) === 'button').length).toBeGreaterThan(3);
  expect(drawn.filter((r) => r.button !== (DRAWN.get(r.ref) === 'button')).map((r) => `${r.ref} drawn ${r.button ? 'as a button' : 'as a field'}`)).toEqual([]);
});
