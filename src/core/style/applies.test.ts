import { describe, expect, it } from 'vitest';
import type { NodeId } from '../../generated/commands.ts';
import { manifest } from '../../manifest/runtime.ts';
import type { DocNode } from '../document/model.ts';
import { rulesFromManifest } from '../document/validate.ts';
import { appliesToOf, contextPredicate, elementPredicate, kindsOf, shownForContext, shownForKinds, type ElementContext } from './applies.ts';
import { codecOf } from './codecs.ts';
import { factsOf } from './set.ts';

const RULES = rulesFromManifest(manifest.elements, manifest.properties, manifest.html);
const node = (type: string, tag: string | null = null): DocNode => ({ id: type as NodeId, type: type as DocNode['type'], name: type, tag: tag as DocNode['tag'], attributes: {}, classes: [], styles: {}, text: null, children: [] });

describe('the element predicates (spec props-element-specific)', () => {
  it('reads a kind from the tag the element is written with', () => {
    expect(elementPredicate('list', node('list', 'ul'), RULES)).toBe(true);
    expect(elementPredicate('list', node('listItem', 'li'), RULES)).toBe(true);
    expect(elementPredicate('list', node('section', 'section'), RULES)).toBe(false);
    // a list switched to an ordered list is still a list; a section switched to an article is not one
    expect(elementPredicate('list', node('list', 'ol'), RULES)).toBe(true);
    // with no tag of its own, the type's
    expect(elementPredicate('table', node('table'), RULES)).toBe(true);
    expect(elementPredicate('tableOrCaption', node('caption', 'caption'), RULES)).toBe(true);
    expect(elementPredicate('table', node('caption', 'caption'), RULES)).toBe(false);
  });

  it('shows the media properties only on the replaced elements they act on (Problems in Pager 1)', () => {
    expect(elementPredicate('media', node('image', 'img'), RULES)).toBe(true);
    expect(elementPredicate('media', node('video', 'video'), RULES)).toBe(true);
    expect(elementPredicate('media', node('picture', 'picture'), RULES)).toBe(false);
    expect(elementPredicate('media', node('svg', 'svg'), RULES)).toBe(false);
  });

  it('shows the form properties only on the controls Chrome styles with them (Problems in Pager 2)', () => {
    expect(elementPredicate('formControl', node('input', 'input'), RULES)).toBe(true);
    expect(elementPredicate('formControl', node('select', 'select'), RULES)).toBe(true);
    expect(elementPredicate('formControl', node('option', 'option'), RULES)).toBe(false);
    expect(elementPredicate('textInput', node('textarea', 'textarea'), RULES)).toBe(true);
    expect(elementPredicate('textInput', node('select', 'select'), RULES)).toBe(false);
    expect(elementPredicate('textarea', node('input', 'input'), RULES)).toBe(false);
  });

  it('answers what an element holds, and nothing for a predicate that reads more than the element', () => {
    expect(elementPredicate('text', node('paragraph', 'p'), RULES)).toBe(true);
    expect(elementPredicate('text', node('image', 'img'), RULES)).toBe(false);
    expect(elementPredicate('svgShape', node('rectangle', 'rect'), RULES)).toBe(true);
    expect(elementPredicate('hasBox', node('rectangle', 'rect'), RULES)).toBe(false);
    expect(elementPredicate('flexContainer', node('div', 'div'), RULES)).toBeNull();
    expect(elementPredicate('always', node('div', 'div'), RULES)).toBeNull();
  });

  it('shows a kind of field only while every selected element is of that kind', () => {
    const list = node('list', 'ul');
    const item = node('listItem', 'li');
    const table = node('table', 'table');
    // both are lists, and both have a box: kinds are every predicate every selected element holds (B0 made hasBox
    // cover every element outside SVG, so a list holds it too)
    expect(kindsOf([list, item], RULES)).toEqual(['list', 'hasBox']);
    // a list and a table are of no kind together, and only hasBox holds for both
    expect(kindsOf([list, table], RULES)).toEqual(['hasBox']);
    expect(kindsOf([], RULES)).toEqual([]);
    expect(shownForKinds(['list-style-type'], kindsOf([list], RULES), RULES)).toBe(true);
    expect(shownForKinds(['list-style-type'], kindsOf([list, table], RULES), RULES)).toBe(false);
    expect(shownForKinds(['border-collapse'], kindsOf([list], RULES), RULES)).toBe(false);
    expect(shownForKinds(['caption-side'], kindsOf([table], RULES), RULES)).toBe(true);
    // a property of a predicate that is no kind always shows, a selection or none; a size field, which reads the
    // element's box (hasBox, a kind), shows only with a selection it holds for
    expect(shownForKinds(['display', 'position'], [], RULES)).toBe(true);
    expect(shownForKinds(['width'], [], RULES)).toBe(false);
  });
});

// what a property's codec writes for a typed text, against what the property offers; null when it reads nothing
const written = (property: string, text: string): string | null => {
  const codec = codecOf(RULES.propertyFacts.get(property)?.codec ?? '');
  if (codec === null) throw new Error(`no codec for ${property}`);
  const value = codec.read(text, factsOf(property, RULES));
  return value === null ? null : codec.write(value);
};

describe('the codecs of the element-specific properties', () => {
  it('length-pair: one or two lengths, a bare number in px, no percentage (Problems in Pager 4)', () => {
    expect(written('border-spacing', '4 8')).toBe('4px 8px');
    expect(written('border-spacing', '6')).toBe('6px');
    expect(written('border-spacing', '2px 2px')).toBe('2px');
    expect(written('border-spacing', '10%')).toBeNull();
    expect(written('border-spacing', '1px 2px 3px')).toBeNull();
    expect(written('border-spacing', 'wide')).toBeNull();
  });

  it('counter-style: a keyword, any counter style name, or a string (Problems in Pager 6)', () => {
    expect(written('list-style-type', 'None')).toBe('none');
    expect(written('list-style-type', 'upper-greek')).toBe('upper-greek');
    expect(written('list-style-type', '"- "')).toBe('"- "');
    expect(written('list-style-type', '12px')).toBeNull();
    expect(written('list-style-type', '"open')).toBeNull();
  });

  it('image: none, a gradient or an address written url(), never a script (Problems in Pager 5)', () => {
    expect(written('list-style-image', 'none')).toBe('none');
    expect(written('list-style-image', 'linear-gradient(red, blue)')).toBe('linear-gradient(red, blue)');
    expect(written('list-style-image', 'marker.png')).toBe('url("marker.png")');
    expect(written('list-style-image', 'javascript:alert(1)')).toBeNull();
  });

  describe('the context predicates (spec props-element-specific, "Our rule")', () => {
    const context = (own: Partial<ElementContext['own']>, parent: Partial<NonNullable<ElementContext['parent']>> | null = null, box = true): ElementContext => ({
      box,
      own: { display: 'block', position: 'static', columnCount: 'auto', columnWidth: 'auto', overflowX: 'visible', overflowY: 'visible', transform: 'none', ...own },
      parent:
        parent === null
          ? null
          : { display: 'block', overflowX: 'visible', overflowY: 'visible', scrollSnapType: 'none', perspective: 'none', transform: 'none', ...parent },
    });

    it('reads a container from its own display: a card in block shows no flex control until flex is chosen (item 5.1)', () => {
      expect(contextPredicate('flexContainer', context({ display: 'flex' }))).toBe(true);
      expect(contextPredicate('flexContainer', context({ display: 'inline flex' }))).toBe(true);
      expect(contextPredicate('flexContainer', context({ display: 'grid' }))).toBe(false);
      expect(contextPredicate('gridContainer', context({ display: 'grid' }))).toBe(true);
      expect(contextPredicate('flexOrGridContainer', context({ display: 'grid' }))).toBe(true);
      expect(contextPredicate('flexOrGridContainer', context({ display: 'block' }))).toBe(false);
      expect(contextPredicate('flexContainer', context({}))).toBe(false);
    });

    it('reads an item from its parent, and shows nothing it cannot read (no parent above the page root)', () => {
      expect(contextPredicate('flexItem', context({}, { display: 'flex' }))).toBe(true);
      expect(contextPredicate('gridItem', context({}, { display: 'inline grid' }))).toBe(true);
      expect(contextPredicate('flexOrGridItem', context({}, { display: 'block' }))).toBe(false);
      expect(contextPredicate('flexItem', context({}, null))).toBeNull();
      expect(contextPredicate('flexItem', null)).toBeNull();
    });

    it('reads position, multicol, scrolling, transforms and the inline level', () => {
      expect(contextPredicate('positioned', context({ position: 'absolute' }))).toBe(true);
      expect(contextPredicate('staticBox', context({ position: 'static' }))).toBe(true);
      expect(contextPredicate('staticBox', context({ position: 'sticky' }))).toBe(false);
      expect(contextPredicate('multicol', context({ columnCount: '3' }))).toBe(true);
      expect(contextPredicate('multicol', context({ columnWidth: '12em' }))).toBe(true);
      expect(contextPredicate('multicol', context({}))).toBe(false);
      expect(contextPredicate('scrollContainer', context({ overflowY: 'auto' }))).toBe(true);
      expect(contextPredicate('scrollContainer', context({}))).toBe(false);
      expect(contextPredicate('transformed', context({ display: 'inline-block' }))).toBe(true);
      expect(contextPredicate('perspectiveContext', context({}))).toBe(true);
      expect(contextPredicate('transformed', context({ display: 'inline' }))).toBe(false);
      expect(contextPredicate('transformed', context({ display: 'block' }, null, false))).toBe(false);
      expect(contextPredicate('inlineOrCell', context({ display: 'inline-block' }))).toBe(true);
      expect(contextPredicate('inlineOrCell', context({ display: 'table-cell' }))).toBe(true);
      expect(contextPredicate('inlineOrCell', context({ display: 'block' }))).toBe(false);
      expect(contextPredicate('snapChild', context({}, { overflowY: 'scroll', scrollSnapType: 'y mandatory' }))).toBe(true);
      expect(contextPredicate('snapChild', context({}, { scrollSnapType: 'y mandatory' }))).toBe(false);
      expect(contextPredicate('container', context({ display: 'flow-root' }))).toBe(true);
      expect(contextPredicate('container', context({ display: 'inline-block' }))).toBe(false);
      expect(contextPredicate('container', context({ display: 'block' }, null, false))).toBe(false);
      expect(contextPredicate('always', context({}))).toBeNull();
    });

    it('shows a field of a context predicate only where its context holds, and never hides one it cannot read', () => {
      expect(shownForContext(['flex-direction'], context({ display: 'block' }), RULES)).toBe(false);
      expect(shownForContext(['flex-direction'], context({ display: 'flex' }), RULES)).toBe(true);
      expect(shownForContext(['flex-grow'], context({}, { display: 'flex' }), RULES)).toBe(true);
      expect(shownForContext(['flex-grow'], context({}, { display: 'block' }), RULES)).toBe(false);
      expect(shownForContext(['flex-grow'], null, RULES)).toBe(true);
      expect(shownForContext(['display', 'height'], context({ display: 'block' }), RULES)).toBe(true);
    });

    it('leaves a predicate it does not own to the element predicates', () => {
      expect(contextPredicate('table', context({}))).toBeNull();
      expect(contextPredicate('text', context({}))).toBeNull();
    });
  });
});

describe('a recipe applies where properties.json says', () => {
  const rules = rulesFromManifest(manifest.elements, manifest.properties, manifest.html);
  it('reads the line clamp as a text field and the text selection as any element field', () => {
    expect(appliesToOf('line-clamp', rules)).toBe('text');
    expect(appliesToOf('user-select', rules)).toBe('always');
    expect(appliesToOf('padding', rules)).toBeNull();
  });
});
