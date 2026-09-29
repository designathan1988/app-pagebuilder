// The link picker's state (ARCHITECTURE.md, Command owners; spec elements-structure; the user's real-use audit, item
// 7.4): the one place that chooses what a link points at. Its state is editor state (ui.linkPicker: the node whose
// link is being chosen, or null); nothing of it is document state. The view that draws it is shell/link-picker.tsx;
// this module owns the three commands that open it, switch the kind of link and close it.
import { message, registerHandler } from '../../core/commands/registry.ts';
import type { NodeId } from '../../core/document/model.ts';
import type { EditorUi } from '../state.ts';

export const openLinkPicker = registerHandler<'linkPicker.open', EditorUi>('linkPicker.open', ({ state }, { target }) => {
  const node = (target as NodeId | undefined) ?? state.selection[0];
  if (node === undefined) return { kind: 'refused', message: message('status.needsSingleSelection') };
  if (state.ui.linkPicker?.node === node) return { kind: 'change' };
  return { kind: 'change', ui: { ...state.ui, linkPicker: { node, kind: 'url' } } };
});

export const setLinkKind = registerHandler<'linkPicker.setKind', EditorUi>('linkPicker.setKind', ({ state }, { kind }) => {
  if (state.ui.linkPicker === null) return { kind: 'change' };
  if (state.ui.linkPicker.kind === kind) return { kind: 'change' };
  return { kind: 'change', ui: { ...state.ui, linkPicker: { ...state.ui.linkPicker, kind } } };
});

export const closeLinkPicker = registerHandler<'linkPicker.close', EditorUi>('linkPicker.close', ({ state }) =>
  state.ui.linkPicker === null ? { kind: 'change' } : { kind: 'change', ui: { ...state.ui, linkPicker: null } },
);
