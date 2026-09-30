import { describe, expect, it } from 'vitest';
import type { StoreState } from '../../core/store/store.ts';
import { EMPTY_HISTORY } from '../../core/history/history.ts';
import { documentOf, node } from '../../core/testing/handlers.ts';
import { INITIAL_PREFERENCES } from '../preferences/preferences.ts';
import { initialEditorUi, type EditorUi } from '../state.ts';
import { pageFollowsSelection } from './page-follows.ts';

const document = documentOf({
  pages: [
    { id: 'home', name: 'Home', file: 'index.html', tree: node('HomeRoot', 'page', 'body', { children: [node('Hero', 'section', 'section')] }) },
    { id: 'about', name: 'About', file: 'about.html', tree: node('AboutRoot', 'page', 'body', { children: [node('Team', 'section', 'section')] }) },
  ],
});
const state = (selection: string[], page: string): StoreState<EditorUi> =>
  ({ document, selection, history: EMPTY_HISTORY, message: null, ui: { ...initialEditorUi(INITIAL_PREFERENCES), page } }) as unknown as StoreState<EditorUi>;

describe('pageFollowsSelection (the code audit’s E-04)', () => {
  it('opens the page of a selection restored on another page (an undo after a page switch)', () => {
    expect(pageFollowsSelection(state(['Team'], 'home')).page).toBe('about');
  });

  it('leaves the page alone when the selection is on it, or empty', () => {
    const on = state(['Hero'], 'home');
    expect(pageFollowsSelection(on)).toBe(on.ui);
    const none = state([], 'about');
    expect(pageFollowsSelection(none)).toBe(none.ui);
  });
});
