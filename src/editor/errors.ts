// What the page throws, into the incident feed (the plan's T2: nothing hidden). One installer at start, and the
// status bar draws what the feed holds. A render error goes through the root's `onUncaughtError` (main.tsx); this
// covers what the window itself reports — an error in a listener, an unhandled rejection from an awaited door.
import { reportError } from '../core/incidents.ts';

export function installErrorFeed(target: Window = window): void {
  target.addEventListener('error', (event) => {
    const error = (event as ErrorEvent).error as unknown;
    const what = error instanceof Error ? `${error.name}: ${error.message}` : String((event as ErrorEvent).message ?? 'an error');
    const where = (event as ErrorEvent).filename === undefined || (event as ErrorEvent).filename === '' ? '' : ` (${String((event as ErrorEvent).filename)}:${String((event as ErrorEvent).lineno)})`;
    reportError(`the page threw${where}`, error instanceof Error ? (error.stack ?? what) : what);
  });
  target.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason as unknown;
    reportError('a promise was rejected and nothing caught it', reason instanceof Error ? (reason.stack ?? reason.message) : String(reason));
  });
}
