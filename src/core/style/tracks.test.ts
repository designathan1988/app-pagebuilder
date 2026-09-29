import { describe, expect, it } from 'vitest';
import { tracksOf, tracksToValue, withTrackAdded, withTrackRemoved, withTrackSet } from './tracks.ts';

describe('grid tracks (spec props-grid-container, Problems in Pager 3; the user\'s real-use audit, item A1.2)', () => {
  it('reads a repeat of equal tracks as its tracks, and a list as its own', () => {
    expect(tracksOf('repeat(3, minmax(0, 1fr))')).toEqual(['minmax(0, 1fr)', 'minmax(0, 1fr)', 'minmax(0, 1fr)']);
    expect(tracksOf('1fr 2fr auto')).toEqual(['1fr', '2fr', 'auto']);
    expect(tracksOf('repeat(2, 120px)')).toEqual(['120px', '120px']);
    // a track holding a comma inside parentheses stays one track
    expect(tracksOf('minmax(0, 1fr) minmax(120px, 1fr)')).toEqual(['minmax(0, 1fr)', 'minmax(120px, 1fr)']);
    expect(tracksOf('none')).toEqual([]);
    expect(tracksOf(undefined)).toEqual([]);
  });

  it('writes equal tracks in the repeat form, any other list joined, and none as none', () => {
    expect(tracksToValue(['minmax(0, 1fr)', 'minmax(0, 1fr)', 'minmax(0, 1fr)', 'minmax(0, 1fr)'])).toBe('repeat(4, minmax(0, 1fr))');
    expect(tracksToValue(['1fr', '2fr', '1fr'])).toBe('1fr 2fr 1fr');
    expect(tracksToValue([])).toBe('none');
  });

  it('adds a track to three equal columns as repeat(4, …), never beside the repeat (the audit\'s acceptance)', () => {
    expect(withTrackAdded('repeat(3, minmax(0, 1fr))')).toBe('repeat(4, minmax(0, 1fr))');
    // a grid that holds none gets its first, written plainly (a single track is no repeat)
    expect(withTrackAdded('none')).toBe('minmax(0, 1fr)');
    expect(withTrackAdded(undefined)).toBe('minmax(0, 1fr)');
    // a list of different tracks takes the default track, as a list
    expect(withTrackAdded('1fr 2fr')).toBe('1fr 2fr minmax(0, 1fr)');
    // equal tracks take one more like themselves, keeping their form
    expect(withTrackAdded('1fr 1fr')).toBe('repeat(3, 1fr)');
  });

  it('removes the last track, giving three columns back from four', () => {
    expect(withTrackRemoved('repeat(4, minmax(0, 1fr))')).toBe('repeat(3, minmax(0, 1fr))');
    expect(withTrackRemoved('1fr 2fr')).toBe('1fr');
    expect(withTrackRemoved('1fr')).toBe('none');
    expect(withTrackRemoved('none')).toBe('none');
  });

  it('sets one track, keeping its place (changing the second of three to 2fr)', () => {
    expect(withTrackSet('repeat(3, minmax(0, 1fr))', 1, '2fr')).toBe('minmax(0, 1fr) 2fr minmax(0, 1fr)');
    expect(withTrackSet('1fr 2fr 1fr', 1, '2fr')).toBe('1fr 2fr 1fr');
    expect(withTrackSet('repeat(3, minmax(0, 1fr))', 0, '120px')).toBe('120px minmax(0, 1fr) minmax(0, 1fr)');
    expect(() => withTrackSet('1fr', 1, '2fr')).toThrow(/no track 1/);
  });
});
