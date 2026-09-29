// @vitest-environment happy-dom
// One editor per document (the plan's T7, decided): the pointer owner keeps its transient state per window, so a
// second editor installed over a live one would share it. It cannot happen silently — the second installer is refused
// (and throws in development and tests, recording an incident), the first keeps the pointer, and unmounting frees it
// again. This guard is what makes a second instance impossible until T7's per-store state is built for a feature that
// truly shows two editors side by side.
import { describe, expect, it } from 'vitest';
import { createEditorStore } from '../store.ts';
import { manualClock } from '../../core/ports/clock.ts';
import { sequentialIds } from '../../core/ports/ids.ts';
import { clearIncidents, incidents } from '../../core/incidents.ts';
import { installPointer } from './pointer.ts';

const store = () => createEditorStore({ storage: { read: () => null, write: () => undefined }, ids: sequentialIds('n'), clock: manualClock() });

describe('installing the pointer owner', () => {
  it('refuses a second editor while one holds it, and frees it when that one leaves', () => {
    clearIncidents();
    const first = store();
    const second = store();
    const remove = installPointer(first, window);
    // a different editor is refused, loudly, and the feed says why
    expect(() => installPointer(second, window)).toThrow(/one editor per document/);
    expect(incidents().some((one) => one.what.includes('second editor'))).toBe(true);
    // the first leaves (its effect's cleanup, as React runs it): the pointer is free for another editor
    remove();
    const again = installPointer(second, window);
    expect(typeof again).toBe('function');
    again();
  });
});
