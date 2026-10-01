// Moving a positioned element (src/core/geometry/position.ts; specs absolute-free-drag, absolute-anchors): each axis
// moves through the edge it is anchored to, and an element anchored on both edges moves whole, its size kept.
import { describe, expect, it } from 'vitest';
import type { DocNode } from '../document/model.ts';
import { RULES } from '../testing/handlers.ts';
import { movedInsets } from './position.ts';

const node = (declared: Record<string, string>): DocNode =>
  ({ id: 'n', type: 'div', name: 'Box', tag: 'div', attributes: {}, classes: [], styles: { desktop: { base: declared } }, text: null, children: [] }) as unknown as DocNode;

describe('movedInsets', () => {
  it('moves the start edge of an element anchored left and top', () => {
    expect(movedInsets(node({ position: 'absolute', left: '10px', top: '20px' }), RULES, null, 5, -4).writes).toEqual({ left: '15px', top: '16px' });
  });
  it('moves the end edge of an element anchored only right and bottom', () => {
    expect(movedInsets(node({ position: 'absolute', right: '10px', bottom: '20px' }), RULES, { left: 100, top: 50 }, 5, 4).writes).toEqual({ right: '5px', bottom: '16px' });
  });
  it('moves both edges of an element anchored on both sides, so it keeps its size (a dialog centred by inset 0)', () => {
    expect(movedInsets(node({ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }), RULES, null, 120, -40).writes).toEqual({ left: '120px', right: '-120px', top: '-40px', bottom: '40px' });
  });
});
