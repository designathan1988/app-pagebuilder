// The engineering surface (the plan's T5): the answers are the owners' (the content model, the flags, the checks),
// asked without running anything — so a tool can say why a drop would be refused and what the document holds, in the
// same words a command's refusal would use.
import { describe, expect, it } from 'vitest';
import type { NodeId } from '../generated/commands.ts';
import { manifest } from '../manifest/runtime.ts';
import { createEmptyDocument, type DocNode, type DocumentJson } from './document/model.ts';
import { rulesFromManifest } from './document/validate.ts';
import { sequentialIds } from './ports/ids.ts';
import { aboutNode, saidOf, whyNotAccepted } from './explain.ts';

const RULES = rulesFromManifest(manifest.elements, manifest.properties, manifest.html);
const node = (id: string, type: string, tag: string, fields: Partial<DocNode> = {}): DocNode => ({
  id: id as NodeId,
  type: type as DocNode['type'],
  name: id,
  tag,
  attributes: {},
  classes: [],
  styles: {},
  text: null,
  children: [],
  ...fields,
});

// a page holding a box (a list with one item) and a paragraph beside it
function document(): DocumentJson {
  const empty = createEmptyDocument(sequentialIds('n'), { page: 'Home', root: 'Page' }, RULES.root);
  return {
    ...empty,
    pages: [
      {
        ...(empty.pages[0] as NonNullable<DocumentJson['pages'][number]>),
        tree: node('Page', 'page', 'body', {
          children: [
            node('Box', 'div', 'div', {
              children: [node('List', 'list', 'ul', { children: [node('Item', 'listItem', 'li', { text: 'one' })] }), node('Para', 'paragraph', 'p', { text: 'text' })],
            }),
          ],
        }),
      },
    ],
  };
}

describe('the engineering answers', () => {
  it('says why these nodes cannot go into that parent, in the refusal a command would give', () => {
    const doc = document();
    // a list accepts only list items: a paragraph into it is refused by the content model
    const refused = whyNotAccepted(doc, RULES, 'List' as NodeId, ['Para' as NodeId]);
    expect(refused.asked).toBe('Para into List');
    expect(refused.refusal?.key).toBe('status.refused.onlyAccepts');
    // and a place the model accepts answers nothing
    const accepted = whyNotAccepted(doc, RULES, 'Box' as NodeId, ['Para' as NodeId]);
    expect(accepted.refusal).toBeNull();
    expect(saidOf(accepted.refusal)).toBe('accepted');
  });

  it('names the refusal in one line, with what it names', () => {
    const doc = document();
    const refused = whyNotAccepted(doc, RULES, 'List' as NodeId, ['Para' as NodeId]);
    expect(saidOf(refused.refusal)).toBe('status.refused.onlyAccepts (parent=<ul> children=<li>)');
  });

  it('says what the document holds about a node, and what the checks say', () => {
    const doc = document();
    const about = aboutNode(doc, RULES, 'Para' as NodeId, manifest.interactions.checks);
    expect(about.about).toBe('node Para (p)');
    expect(about.facts.name).toBe('Para');
    expect(about.facts.tag).toBe('p');
    expect(about.facts.parent).toBe('Box');
    expect(about.facts.children).toBe(0);
    expect(about.facts.locked).toBe(false);
    // a paragraph holds text, so the checks find nothing on it
    expect(about.answer).toBe('no check has anything on it');
    // a node the document lacks is answered as that, not as a defect
    const missing = aboutNode(doc, RULES, 'Nope' as NodeId);
    expect(missing.facts.found).toBe(false);
    expect(missing.answer).toBe('the document has no such node');
  });
});
