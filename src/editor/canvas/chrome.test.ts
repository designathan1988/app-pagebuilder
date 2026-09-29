// The hit area of a resize handle (src/editor/canvas/chrome.tsx, handleHitBox): the canvas audit of 2026-09-28 — the
// south handle of a selected card sat wholly over the 23 px card below it, so a press meant to drag that card resized
// the one above. The box never covers a neighbouring element's box; the room a neighbour leaves outside is all the
// handle keeps, the rest moves inside the element, and the dot stays on the element's edge.
import { describe, expect, it } from 'vitest';
import { handleHitBox } from './chrome.tsx';

interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const ELEMENT = box(0, 0, 100, 100);

describe('a resize handle, with no neighbour at its edge', () => {
  it('stands wholly outside the element, centred on the edge point', () => {
    const south = handleHitBox('s', ELEMENT, 24, []);
    expect(south.box).toEqual(box(38, 100, 24, 24));
    expect(south.at).toEqual({ x: 0.5, y: 0 });
    const west = handleHitBox('w', ELEMENT, 24, []);
    expect(west.box).toEqual(box(-24, 38, 24, 24));
    expect(west.at).toEqual({ x: 1, y: 0.5 });
    const corner = handleHitBox('se', ELEMENT, 24, []);
    expect(corner.box).toEqual(box(100, 100, 24, 24));
    expect(corner.at).toEqual({ x: 0, y: 0 });
  });
});

describe('a resize handle with a neighbour at its edge', () => {
  it('moves inside the element when the neighbour begins at the edge: the neighbour keeps every press, the dot stays on the edge', () => {
    const below = box(0, 100, 100, 23);
    const south = handleHitBox('s', ELEMENT, 24, [below]);
    // a layout unit short of the shared boundary (1/64 px): the browser rounds the drawn box and the neighbour's box
    // through different paths, and one that ends exactly on the boundary is reported a fraction inside it (the audit of
    // 2026-09-29: 2e-6 px, enough for the check to call it a cover)
    expect(south.box).toEqual(box(38, 76 - 1 / 64, 24, 24));
    expect(overlaps(south.box, below), 'the hit area covers no part of the neighbour').toBe(false);
    expect(south.at, 'the dot sits on the element’s own bottom edge').toEqual({ x: 0.5, y: 1 });
  });
  it('keeps the outside room the neighbour leaves, and no more', () => {
    const below = box(0, 110, 100, 20);
    const south = handleHitBox('s', ELEMENT, 24, [below]);
    expect(south.box).toEqual(box(38, 86, 24, 24));
    expect(overlaps(south.box, below)).toBe(false);
    expect(south.at.y).toBeCloseTo(14 / 24);
  });
  it('a neighbour beside only the other part of the edge leaves the handle alone', () => {
    const belowLeft = box(0, 100, 30, 20);
    const south = handleHitBox('s', ELEMENT, 24, [belowLeft]);
    expect(south.box).toEqual(box(38, 100, 24, 24));
  });
  it('a neighbour behind the edge is not in the way', () => {
    const above = box(0, -100, 100, 100);
    const south = handleHitBox('s', ELEMENT, 24, [above]);
    expect(south.box).toEqual(box(38, 100, 24, 24));
  });
  it('a neighbour straddling the edge (an element drawn over the selected one) leaves no room outside: the box moves wholly inside', () => {
    const over = box(0, 90, 100, 20);
    const south = handleHitBox('s', ELEMENT, 24, [over]);
    expect(south.box).toEqual(box(38, 76, 24, 24));
  });
  it('the west handle of an element with a neighbour against it mirrors the same rule', () => {
    const left = box(-40, 0, 40, 100);
    const west = handleHitBox('w', ELEMENT, 24, [left]);
    expect(west.box).toEqual(box(1 / 64, 38, 24, 24));
    expect(overlaps(west.box, left)).toBe(false);
    expect(west.at).toEqual({ x: 0, y: 0.5 });
  });
});
