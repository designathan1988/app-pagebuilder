// The incident feed (the plan's T2): what the application must never hide.
//
//  - 'invariant': a command produced its patches and the whole-document validator still refused the result. That is a
//    bug — a rule the operation should have refused before producing anything — so the state is not published, the
//    incident is recorded here, and in development and tests the commit throws so the defect is loud. Predictable
//    invalid operations are refused by the operation itself, with a message; they never reach this feed.
//  - 'error': an error the page threw (a render error, an unhandled rejection): recorded by the editor side, so the
//    person and the browser checks see it instead of a console nobody reads.
//
// A bounded ring (the newest LIMIT), process-wide on purpose: an incident is about the app, not about one document.
// It holds no document state and changes nothing; whoever draws it (the status bar's badge, the checks pane, the test
// port, the dev server's terminal) only reads.
import type { Invalid } from './document/validate.ts';

export interface Incident {
  readonly kind: 'invariant' | 'error';
  // one line naming what happened: the command and its source, or where the error came from
  readonly what: string;
  // what the validator or the thrower said, in full
  readonly detail: string;
}

const LIMIT = 50;
let feed: readonly Incident[] = [];
const listeners = new Set<() => void>();

function record(incident: Incident): void {
  feed = [...feed, incident].slice(-LIMIT);
  for (const listener of [...listeners]) listener();
}

// A document the validator refused after a command's patches: a bug, never a normal refusal.
export function reportInvariantBreach(source: string, problems: readonly Invalid[]): void {
  record({ kind: 'invariant', what: `commit "${source}" left a document the model refuses`, detail: problems.map((p) => `${p.path}: ${p.message}`).join('\n') });
}

// An error the page threw, recorded by the editor side.
export function reportError(what: string, detail: string): void {
  record({ kind: 'error', what, detail });
}

export function incidents(): readonly Incident[] {
  return feed;
}

export function clearIncidents(): void {
  feed = [];
  for (const listener of [...listeners]) listener();
}

export function onIncident(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
