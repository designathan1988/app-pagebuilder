// The status bar (DESIGN.md "Dock and status bar"; spec status-bar): the last message in an aria-live region, the
// breadcrumb of the selection (each ancestor a button that selects it), the size of the selection in page pixels, the
// breakpoint and the state, the element count, the zoom controls and the language, in the order of region
// status-bar, then the save state (autosave-restore). During a palette tile's creation drag the message is the drag's
// words (palette-drag-insert).
import { activeBreakpoint } from '../view/breakpoints.ts';
import { usePrimarySize } from '../view/selection-size.ts';
import { useState, useSyncExternalStore } from 'react';
import type { MessageId } from '../../generated/ids.ts';
import { saveState, type SaveState } from '../persistence/autosave.ts';
import { incidents, onIncident } from '../../core/incidents.ts';
import { allNodes, locate, type DocNode } from '../../core/document/model.ts';
import type { Message } from '../../core/commands/registry.ts';
import { pluralForm } from '../../i18n/index.ts';
import { dragMessages } from '../canvas/chrome.tsx';
import { DoorControl, Icon } from '../doors/door.tsx';
import { elementIcon, type DoorEntry } from '../../manifest/runtime.ts';
import { MenuButton } from '../doors/menu.tsx';
import { drag, duplicating } from '../input/pointer.ts';
import { drawnAsOf } from '../doors/placement.ts';
import { useEditorState } from '../store.ts';
import { activeState } from '../view/style-state.ts';
import { panelName } from '../workspace/panels.ts';
import { messageText, useLocale, useT } from '../text.ts';
import { ZoomValue } from './canvas.tsx';
import { Slots } from './slots.tsx';


export function StatusBar() {
  const t = useT();
  const locale = useLocale();
  const message = useEditorState((s) => s.message);
  const document = useEditorState((s) => s.document);
  const count = [...allNodes(document)].length;
  // the breakpoint the canvas shows and its width (spec breakpoints-switch), and the state being edited (view/setStyleState)
  const breakpoint = useEditorState((s) => activeBreakpoint(s.ui));
  const state = useEditorState((s) => activeState(s.ui));
  // while a drag goes on (pointer.ts), an element's or a palette tile's, the message is the drop's own words, as its
  // label reads them on the canvas, or, off the page, that releasing cancels (spec palette-drag-insert, Problems in
  // Pager 1 and 2; the user's real-use audit, item 3.3)
  const dragging = useSyncExternalStore(drag.subscribe, drag.get);
  const copying = useSyncExternalStore(duplicating.subscribe, duplicating.get);
  const words = dragging !== null ? dragMessages(document, dragging, copying) : [];
  // a message given during the drag that did not move where it lands (a level key refused: "Already at the top level")
  // stays until the place changes; a key that moved it is read in the drop's words
  const said = dragging === null ? '' : JSON.stringify(words);
  const [held, setHeld] = useState<{ words: string; message: Message | null; pinned: Message | null }>({ words: said, message, pinned: null });
  const next = dragging === null ? { words: '', message, pinned: null } : said !== held.words ? { words: said, message, pinned: null } : message !== held.message ? { words: said, message, pinned: message } : held;
  if (next !== held && (next.words !== held.words || next.message !== held.message || next.pinned !== held.pinned)) setHeld(next);
  const shown = dragging === null ? [message] : next.pinned !== null ? [next.pinned] : words.length > 0 ? words : [message];
  // the whole message, also its tooltip: a long one is cut on the bar (DESIGN.md "Dock and status bar")
  const dockClosed = useEditorState((s) => s.ui.layout.dock === 'collapsed');
  const text = shown.every((m) => m === null) ? null : shown.flatMap((m) => (m === null ? [] : [messageText(locale, m)])).join(' · ');
  return (
    <footer className="status-bar" data-region="status-bar">
      <span className="status-bar__message" role="status" aria-live="polite" title={text ?? undefined}>
        {text}
      </span>
      <Slots
        region="status-bar"
        render={(slot) => {
          // the region's item is the breadcrumb of the selection (DESIGN.md "Regions": 1 the breadcrumb)
          if (slot.kind === 'door' && drawnAsOf(slot.entry) === 'item') {
            // the breadcrumb of the selection, then its size, the breakpoint and the state, and the element count
            return [
              <Breadcrumb key="breadcrumb" entry={slot.entry} />,
              <SelectionSize key="size" />,
              <span key="context" className="status-bar__item status-bar__context">
                {t('statusBar.context', { breakpoint: t(breakpoint.labelKey as MessageId), state: t(state.labelKey as MessageId) })}
              </span>,
              <span key="count" className="status-bar__item">
                {t(`status.elementCount.${pluralForm(locale, count)}`, { count })}
              </span>,
              <IncidentCount key="incidents" />,
            ];
          }
          // the dock's panels as icons while the dock is closed (the audit's A3.18: the strip's 28 px go back to the
          // canvas; pressing one opens the dock on that panel)
          if (slot.kind === 'door' && dockClosed) {
            return <DoorControl key={slot.entry.ref} entry={slot.entry} />;
          }
          if (slot.kind === 'menu' && slot.menu === 'zoom') {
            return (
              <MenuButton key={slot.menu} menu={slot.menu} anchor={slot.anchor}>
                <ZoomValue />
              </MenuButton>
            );
          }
          if (slot.kind === 'menu' && slot.menu === 'language') {
            return (
              <MenuButton key={slot.menu} menu={slot.menu} anchor={slot.anchor}>
                <span className="status-bar__language">{locale.toUpperCase()}</span>
              </MenuButton>
            );
          }
          return undefined;
        }}
      />
      <SaveStateLabel />
    </footer>
  );
}

// What the incident feed holds (the plan's T2: nothing hidden): a badge with the count and, in its title, what each
// incident says — an invariant a command broke, an error the page threw. It draws nothing at all while the feed is
// empty, which is the normal state; the browser checks and the development tools read the same feed through the test
// port, so an incident that no person notices still fails a check.
function IncidentCount() {
  const t = useT();
  const locale = useLocale();
  const feed = useSyncExternalStore(onIncident, incidents, incidents);
  if (feed.length === 0) return null;
  const detail = feed.map((one) => `${one.what}\n${one.detail}`).join('\n\n');
  return (
    <span className="status-bar__item status-bar__incidents" data-local="incident-count" role="status" title={detail}>
      <Icon name="triangle-alert" size="sm" />
      {t(`status.incidents.${pluralForm(locale, feed.length)}`, { count: feed.length })}
    </span>
  );
}

// The breadcrumb of the selection (spec status-bar; the audit's A3.20): every ancestor of the primary selected node,
// from the page root down to it, each a button that selects it (selection.select's status-bar door), with the
// element's icon and name; the primary itself wears the current mark. Empty without a selection.
function Breadcrumb({ entry }: { readonly entry: DoorEntry }) {
  const t = useT();
  const document = useEditorState((s) => s.document);
  const selection = useEditorState((s) => s.selection);
  const primary = selection[0] ?? null;
  const crumbs: DocNode[] = [];
  for (let at = primary === null ? null : locate(document, primary); at !== null; at = at.parent === null ? null : locate(document, at.parent.id)) crumbs.unshift(at.node);
  return (
    <nav className="status-bar__breadcrumb" aria-label={t(panelName('layers'))}>
      {crumbs.map((node, i) => (
        <DoorControl key={node.id} entry={entry} args={{ target: node.id }} current={node.id === primary} className={i === 0 ? 'status-bar__crumb status-bar__crumb--first' : 'status-bar__crumb'}>
          <Icon name={elementIcon(node.type) ?? 'box'} size="xs" />
          <span className="door__label">{node.name}</span>
        </DoorControl>
      ))}
    </nav>
  );
}

// The size of the primary selection in page pixels, re-measured on every frame while one is selected: the page's
// layout follows styles, the zoom and scrolling, so a measurement taken once goes stale.
function SelectionSize() {
  const t = useT();
  const primary = useEditorState((s) => s.selection[0] ?? null);
  const size = usePrimarySize(primary);
  if (size === null) return null;
  return (
    <span className="status-bar__item status-bar__size" data-size={`${size.width}x${size.height}`}>
      {t('statusBar.size', { width: size.width, height: size.height })}
    </span>
  );
}

// The save state, last in the bar (autosave: Not saved, Saving…, Saved, Save failed). A read-only display.
const SAVE_STATE_KEYS: Readonly<Record<SaveState, MessageId>> = { notSaved: 'status.save.notSaved', saving: 'status.save.saving', saved: 'status.save.saved', recoveryRequired: 'status.save.recoveryRequired' };
function SaveStateLabel() {
  const t = useT();
  const current = useSyncExternalStore(saveState.subscribe, saveState.get);
  // a write IndexedDB refused says why (spec unsaved-work-guard)
  const reason = useSyncExternalStore(saveState.subscribe, saveState.reason);
  return (
    <span className={`status-bar__item status-bar__save is-${current}`} data-save-state={current}>
      {reason !== null && current === 'notSaved' ? t('status.save.notSavedBecause', { reason }) : t(SAVE_STATE_KEYS[current])}
    </span>
  );
}
