// The incident feed (the plan's T2): bounded, readable, and it tells whoever listens. It is what the status bar's
// badge, the test port and the browser checks read — an error nobody watched for still shows up somewhere.
import { describe, expect, it } from 'vitest';
import { clearIncidents, incidents, onIncident, reportError, reportInvariantBreach } from './incidents.ts';

describe('the incident feed', () => {
  it('records what it is told, and tells its listeners', () => {
    clearIncidents();
    let told = 0;
    const off = onIncident(() => (told += 1));
    expect(incidents()).toEqual([]);
    reportInvariantBreach('element.insert', [{ path: '/pages/0/tree/children/0', message: 'id n1 is already used' }]);
    expect(incidents()).toEqual([{ kind: 'invariant', what: 'commit "element.insert" left a document the model refuses', detail: '/pages/0/tree/children/0: id n1 is already used' }]);
    reportError('the page threw', 'Error: boom');
    expect(incidents().length).toBe(2);
    expect(incidents()[1]?.kind).toBe('error');
    expect(told).toBe(2);
    off();
    reportError('after the listener left', 'still recorded');
    expect(told).toBe(2);
    expect(incidents().length).toBe(3);
  });

  it('keeps the newest fifty, and clears', () => {
    clearIncidents();
    for (let i = 0; i < 60; i += 1) reportError(`error ${i}`, 'detail');
    expect(incidents().length).toBe(50);
    expect(incidents()[0]?.what).toBe('error 10');
    clearIncidents();
    expect(incidents()).toEqual([]);
  });
});
