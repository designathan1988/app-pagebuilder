import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { namedIn, projectText, unusedKeys } from './unused.ts';

describe('the English catalogue', () => {
  it('holds no key that nothing names (the audit M-06)', () => {
    const keys = Object.keys(JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')) as Record<string, string>);
    expect(unusedKeys(keys, namedIn(projectText()))).toEqual([]);
  });
  it('counts a key named, its plural stem, and one a template builds from its prefix', () => {
    const text = "t('a.b'); t('c.d'); t(`e.f.${x}`); t('g.' + y)";
    expect(unusedKeys(['a.b', 'c.d.one', 'e.f.g', 'g.h', 'z.z'], namedIn(text))).toEqual(['z.z']);
  });
});
