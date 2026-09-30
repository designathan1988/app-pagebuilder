// The page the editor shows follows the selection: a selection restored by an undo or a redo (or made anywhere else)
// on another page opens that page, so the canvas, the inspector and Delete act on a node the canvas draws. Undoing a
// change made on "About" after switching to "Home" shows "About" again, with the change undone in view.
import { locate, type DocumentJson } from '../../core/document/model.ts';
import { openedPage } from '../../core/project/pages.ts';
import type { StoreState } from '../../core/store/store.ts';
import type { EditorUi } from '../state.ts';

export function pageFollowsSelection(state: StoreState<EditorUi>): EditorUi {
  const first = state.selection[0];
  if (first === undefined) return state.ui;
  const at = pageOf(state.document, first);
  if (at < 0 || at === openedPage(state)) return state.ui;
  const page = state.document.pages[at];
  return page === undefined ? state.ui : { ...state.ui, page: page.id };
}

function pageOf(document: DocumentJson, id: string): number {
  return document.pages.findIndex((page) => locate({ ...document, pages: [page] }, id as never) !== null);
}
