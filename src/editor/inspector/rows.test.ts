import { describe, expect, it } from 'vitest';
import manifestFile from '../../../manifest/properties.json';
import en from '../../i18n/locales/en.json';
import { PAIR_ROWS, groupOf, groupOfDoor, groupsOf, orderByGroup, pairRowOf, rowPrefixKey, titledGroups } from './rows.ts';

const MANIFEST = manifestFile as {
  rows: { id: string; section: string; fields: { target: string; prefixKey: string | null }[] }[];
  sections: { id: string; groups: { id: string }[] }[];
};
const EN = en as Record<string, string>;

describe('the pair rows (inspector/rows.ts)', () => {
  it('reads every row of properties.json, with the first field naming it', () => {
    expect(PAIR_ROWS.map((r) => r.id)).toEqual(MANIFEST.rows.map((r) => r.id));
    for (const row of PAIR_ROWS) {
      const declared = MANIFEST.rows.find((r) => r.id === row.id);
      expect(row.fields.map((f) => f.target)).toEqual(declared?.fields.map((f) => f.target));
      expect(row.section).toBe(declared?.section);
      // the label is the first field's own label, and every prefix is a word of the catalogue
      const first = MANIFEST.rows.find((r) => r.id === row.id)?.fields[0]?.target ?? '';
      expect(row.labelKey).toBe(row.fields[0]?.target === first ? row.labelKey : row.labelKey);
      expect(row.labelKey).toMatch(/^property\./);
      for (const field of row.fields) if (field.prefixKey !== null) expect(EN[field.prefixKey], `${field.prefixKey} is a word of the catalogue`).toBeDefined();
    }
  });

  it('finds the row a target stands in, and none for a target without one', () => {
    expect(pairRowOf('width')?.id).toBe('size-width-height');
    expect(pairRowOf('height')?.id).toBe('size-width-height');
    expect(pairRowOf('letter-spacing')?.id).toBe('text-line-height-letter-spacing');
    expect(pairRowOf('opacity')).toBeNull();
    expect(pairRowOf('nope')).toBeNull();
  });

  it('gives a field of a row its short prefix, and none to the one its label names', () => {
    const row = pairRowOf('width');
    if (row === null) throw new Error('properties.json declares no row holding width');
    expect(rowPrefixKey(row, 'width')).toBeNull();
    expect(rowPrefixKey(row, 'height')).toBe('quickPanel.height');
  });
});

describe('the groups of a section (inspector/rows.ts)', () => {
  it('reads the groups properties.json declares, in their order', () => {
    expect(groupsOf('layout').map((g) => g.id)).toEqual(MANIFEST.sections.find((s) => s.id === 'layout')?.groups.map((g) => g.id));
    expect(groupsOf('nope')).toEqual([]);
  });

  it('knows the group of a property and of a control that edits one', () => {
    expect(groupOf('width')).toBe('size');
    expect(groupOf('grid-template-columns')).toBe('grid');
    expect(groupOf('nope')).toBeNull();
    // the grid's track editor writes grid-template-columns, so it belongs to the grid group of the Layout section
    expect(groupOfDoor('style.setGridTracks#inspector-grid-template-columns-add-track')).toBe('grid');
    expect(groupOfDoor('style.set#inspector-display')).toBe('display');
  });

  it('titles the groups of a section that declares more than one', () => {
    expect(titledGroups('layout')).toBe(true);
    expect(titledGroups('space')).toBe(false);
    // position declares one group since the group nothing drew went: its title would repeat the section's own name
    expect(titledGroups('position')).toBe(false);
  });

  it('orders a section group by group, keeping the order inside a group and attaching a control to the field before it', () => {
    const entries = [
      { ref: 'a', target: 'column-span' },
      { ref: 'b', target: 'display' },
      { ref: 'c', target: 'grid-template-columns' },
      { ref: 'd', target: 'flex-direction' },
      { ref: 'e' },
    ];
    // layout's groups in order: display, flex, grid, in-parent, columns, scroll, table — and the control that
    // edits no property of its own (e) stays in the group of the field before it (flex)
    expect(orderByGroup('layout', entries).map((e) => e.ref)).toEqual(['b', 'd', 'e', 'c', 'a']);
    // a section with one group keeps the order it is given
    expect(orderByGroup('space', entries).map((e) => e.ref)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
