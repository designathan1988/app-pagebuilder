// The one entry point of every browser test: specs and the scenario runner import `test` and `expect` from here,
// never from '@playwright/test' directly (lint: a spec that imports them anywhere else fails). tests/support/editor.ts
// opens the editor once per test, in a fresh profile.
export { expect, test } from '@playwright/test';
export type { Download, Locator, Page, TestInfo } from '@playwright/test';
