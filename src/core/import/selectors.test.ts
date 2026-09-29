import { describe, expect, it } from 'vitest';
import { matches, readSelector, type Facts, type Selector } from './selectors.ts';

const facts = (tag: string | null, classes: readonly string[] = [], attributes: Readonly<Record<string, string>> = {}, id: string | null = null): Facts => ({ tag, classes, id, attributes: new Map(Object.entries(attributes)) });

// a selector the tests read, which fails loudly when the reader refuses it
const read = (text: string): Selector => {
  const selector = readSelector(text);
  if (selector === null) throw new Error(`the reader refused "${text}"`);
  return selector;
};

describe('readSelector', () => {
  it('reads a compound selector with its type, classes, an id and attribute tests', () => {
    const compound = read('div.card#hero[data-kind="a"]');
    expect(compound.compounds).toHaveLength(1);
    expect(compound.compounds[0]).toMatchObject({ tag: 'div', classes: ['card'], id: 'hero', attributes: [{ name: 'data-kind', op: '=', value: 'a' }] });
    expect(compound.specificity).toEqual([1, 2, 1]);
  });

  it('reads the descendant and the child combinators, and the pseudo-class a compound ends with', () => {
    const child = read('.band > .band__cta:hover');
    expect(child.combinators).toEqual(['>']);
    expect(child.compounds).toHaveLength(2);
    expect(child.compounds[1]?.pseudo).toBe('hover');
    expect(read('.a .b').combinators).toEqual([' ']);
  });

  it('reads nothing for a pseudo-element, :not(), a sibling combinator or a selector list', () => {
    expect(readSelector('.a::before')).toBeNull();
    expect(readSelector('.a:not(.b)')).toBeNull();
    expect(readSelector('.a + .b')).toBeNull();
    expect(readSelector('.a, .b')).toBeNull();
  });
});

describe('matches', () => {
  const title = facts('h2', ['band__title']);
  const cta = facts('a', ['band__cta'], { href: 'https://x.example' });
  const lead = facts('p', ['band__lead']);

  it('matches a class and a type, and refuses what the element does not carry', () => {
    expect(matches(read('.band__title'), title, [])).toBe(true);
    expect(matches(read('h2'), title, [])).toBe(true);
    expect(matches(read('h3'), title, [])).toBe(false);
    expect(matches(read('.band__cta'), title, [])).toBe(false);
  });

  it('matches an attribute test and a descendant, and reads the child combinator apart', () => {
    const band = facts('section', ['band']);
    expect(matches(read('[href]'), cta, [])).toBe(true);
    expect(matches(read('[href^="https"]'), cta, [])).toBe(true);
    expect(matches(read('[href^="http:"]'), cta, [])).toBe(false);
    // the nearest ancestor first, as a page's lineage reads
    expect(matches(read('.band .band__cta'), cta, [lead, band])).toBe(true);
    expect(matches(read('.band > .band__cta'), cta, [lead, band])).toBe(false);
    expect(matches(read('.band > .band__cta'), cta, [band])).toBe(true);
  });

  it('counts what a selector names, as CSS counts specificity', () => {
    expect(read('p').specificity).toEqual([0, 0, 1]);
    expect(read('.card').specificity).toEqual([0, 1, 0]);
    expect(read('#lead').specificity).toEqual([1, 0, 0]);
    expect(read('.a.b p').specificity).toEqual([0, 2, 1]);
  });
});
