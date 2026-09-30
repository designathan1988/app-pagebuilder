import { describe, expect, it } from 'vitest';
import { floatBelow, pointAnchor } from './float.ts';

const VIEW = { width: 1000, height: 800 };
const SIZE = { width: 200, height: 100 };

describe('floatBelow', () => {
  it('opens under the anchor, from its start edge', () => {
    expect(floatBelow({ left: 100, top: 50, right: 180, bottom: 74 }, SIZE, VIEW, 8)).toEqual({ left: 100, top: 74 });
  });
  it('keeps a gap between the anchor and the layer', () => {
    expect(floatBelow({ left: 100, top: 50, right: 180, bottom: 74 }, SIZE, VIEW, 8, 4)).toEqual({ left: 100, top: 78 });
  });
  it('ends at the anchor end edge when it would leave the window on the right', () => {
    expect(floatBelow({ left: 900, top: 50, right: 980, bottom: 74 }, SIZE, VIEW, 8)).toEqual({ left: 780, top: 74 });
  });
  it('stays inside the window when neither edge fits (the inspector at the window edge)', () => {
    expect(floatBelow({ left: 950, top: 50, right: 1000, bottom: 74 }, { width: 300, height: 100 }, VIEW, 8)).toEqual({ left: 692, top: 74 });
    expect(floatBelow({ left: 0, top: 50, right: 20, bottom: 74 }, SIZE, VIEW, 8)).toEqual({ left: 8, top: 74 });
  });
  it('opens above the anchor when there is no room below (a status bar menu)', () => {
    expect(floatBelow({ left: 100, top: 760, right: 180, bottom: 784 }, SIZE, VIEW, 8)).toEqual({ left: 100, top: 660 });
  });
  it('never leaves the window at the top, even taller than the room above', () => {
    expect(floatBelow({ left: 100, top: 60, right: 180, bottom: 740 }, { width: 200, height: 700 }, VIEW, 8)).toEqual({ left: 100, top: 8 });
  });
  it('opens at a point as at an anchor of no size (the context menu)', () => {
    expect(floatBelow(pointAnchor(990, 790), SIZE, VIEW, 8)).toEqual({ left: 790, top: 690 });
  });
});
