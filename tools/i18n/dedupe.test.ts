import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCALE_FILES, duplicateKeys } from './dedupe.ts';

describe('the locale catalogues', () => {
  it('write every key once (JSON keeps the last copy of a key written twice, silently)', () => {
    for (const file of LOCALE_FILES) expect(duplicateKeys(readFileSync(file, 'utf8')), file).toEqual([]);
  });

  it('find a key written twice, with both values', () => {
    expect(duplicateKeys('{\n  "a": "x",\n  "b": "y",\n  "a": "z"\n}')).toEqual([{ key: 'a', values: ['"x"', '"z"'] }]);
  });
});
