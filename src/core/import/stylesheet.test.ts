import { describe, expect, it } from 'vitest';
import { readDeclarations, readStylesheet } from './stylesheet.ts';

describe('readStylesheet', () => {
  it('reads a rule with its declarations and their lines, comments left out', () => {
    const sheet = readStylesheet('/* a comment\n   on two lines */\n.panel__title {\n  font-size: 32px;\n  color: #111;\n}\n');
    expect(sheet.rules).toHaveLength(1);
    expect(sheet.rules[0]).toMatchObject({ selector: '.panel__title', media: [], line: 3 });
    expect(sheet.rules[0]?.declarations).toEqual([
      { text: 'font-size: 32px', important: false, line: 4 },
      { text: 'color: #111', important: false, line: 5 },
    ]);
    expect(sheet.atRules).toEqual([]);
  });

  it('reads a selector list as one rule per selector, and !important as the flag it is', () => {
    const sheet = readStylesheet('.a, .b { color: red !important; }');
    expect(sheet.rules.map((rule) => rule.selector)).toEqual(['.a', '.b']);
    expect(sheet.rules[0]?.declarations[0]).toEqual({ text: 'color: red', important: true, line: 1 });
  });

  it('reads the media a rule sits in, and reports the at-rules it cannot map', () => {
    const sheet = readStylesheet('@media (max-width: 834px) {\n  .a { color: red; }\n}\n@supports (display: grid) {\n  .b { display: grid; }\n}\n@font-face { font-family: X; src: url(x.woff2); }');
    expect(sheet.rules).toHaveLength(1);
    expect(sheet.rules[0]).toMatchObject({ selector: '.a', media: ['(max-width: 834px)'], line: 2 });
    expect(sheet.atRules.map((one) => one.name)).toEqual(['supports', 'font-face']);
    expect(sheet.atRules.map((one) => one.line)).toEqual([4, 7]);
  });

  it('reads a value with a semicolon inside a string or a url() as one declaration', () => {
    const declarations = readDeclarations('background-image: url("a;b.png"); content: "x;y"', 1, 'background-image: url("a;b.png"); content: "x;y"');
    expect(declarations.map((one) => one.text)).toEqual(['background-image: url("a;b.png")', 'content: "x;y"']);
  });

  it('reads the rules of the fixture the states scenarios import, each with its media and its line', () => {
    // manifest/features/fixtures/import/states.css, as the scenarios hand it over
    const sheet = readStylesheet(
      [
        '.band__title {',
        '  font-size: 40px;',
        '}',
        '',
        '@media (max-width: 834px) {',
        '  .band__title {',
        '    font-size: 24px;',
        '  }',
        '}',
        '',
        '@media (max-width: 900px) {',
        '  .band__lead {',
        '    color: #444444;',
        '  }',
        '}',
        '',
        '@media (min-width: 1000px) {',
        '  .band__lead {',
        '    color: #222222;',
        '  }',
        '}',
        '',
        '.band__cta:hover {',
        '  color: #00aa00;',
        '}',
        '',
        '.band__title::before {',
        '  content: ">";',
        '}',
        '',
        '.band .band__cta:hover {',
        '  color: #ff0000;',
        '}',
        '',
        '@supports (display: grid) {',
        '  .band__lead {',
        '    display: grid;',
        '  }',
        '}',
        '',
      ].join('\n'),
    );
    expect(sheet.rules.map((rule) => [rule.selector, rule.media.join(), rule.line])).toEqual([
      ['.band__title', '', 1],
      ['.band__title', '(max-width: 834px)', 6],
      ['.band__lead', '(max-width: 900px)', 12],
      ['.band__lead', '(min-width: 1000px)', 18],
      ['.band__cta:hover', '', 23],
      ['.band__title::before', '', 27],
      ['.band .band__cta:hover', '', 31],
    ]);
    expect(sheet.atRules).toEqual([{ name: 'supports', line: 35 }]);
  });
});
