// The browser environment every run takes from the contract (manifest/environment.json): the browser channel (the
// installed Chrome) and whether motion is reduced. The Playwright configuration and the UI driver read it here, so the
// manifest is the one place that says them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface Environment {
  readonly browser: { readonly channel: 'chrome' };
  readonly reducedMotion: boolean;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const environment = JSON.parse(fs.readFileSync(path.join(root, 'manifest', 'environment.json'), 'utf8')) as Environment;

// the browser channel Playwright launches
export const CHANNEL = environment.browser.channel;
// what the page reads from prefers-reduced-motion
export const REDUCED_MOTION: 'reduce' | 'no-preference' = environment.reducedMotion ? 'reduce' : 'no-preference';
