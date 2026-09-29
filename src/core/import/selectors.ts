// Selector matching for the import (ARCHITECTURE.md, Command owners; the manifest's html-import-styles and
// html-import-states): the one owner of "which elements a CSS selector matches" and of a selector's specificity. The
// importer resolves each stylesheet rule onto the nodes it built, so a declaration lands on the element it belongs to;
// nothing else in the editor matches selectors (style.applyCssRule writes the rule of the one selected element).
//
// What it reads: a compound selector of a type (or `*`), classes, an id and attribute tests ([attr], [attr=v],
// [attr~=v], [attr^=v], [attr$=v], [attr*=v]), joined by the descendant and the child combinators; a trailing
// pseudo-class is left to the caller (the state a rule belongs to: properties.json's states), and every other
// pseudo-class, a pseudo-element or a sibling combinator is not read — the caller reports such a rule instead of
// mapping it. Specificity counts (ids, classes and attributes, types), as CSS counts it.
export interface Facts {
  readonly tag: string | null;
  readonly classes: readonly string[];
  readonly id: string | null;
  readonly attributes: ReadonlyMap<string, string>;
}

export interface AttributeTest {
  readonly name: string;
  readonly op: 'exists' | '=' | '~=' | '^=' | '$=' | '*=';
  readonly value: string;
}

export interface Compound {
  readonly tag: string | null;
  readonly universal: boolean;
  readonly classes: readonly string[];
  readonly id: string | null;
  readonly attributes: readonly AttributeTest[];
  // the pseudo-class the compound ends with (`hover` for `:hover`), which the caller reads as a state; null for none
  readonly pseudo: string | null;
}

export interface Selector {
  // the compound selectors, in the written order (the leftmost names the ancestor)
  readonly compounds: readonly Compound[];
  // the combinators between them, `compounds.length - 1` of them: ' ' (a descendant) or '>' (a child)
  readonly combinators: readonly (' ' | '>')[];
  readonly specificity: readonly [number, number, number];
}

// A type, universal, class, id, attribute or pseudo-class piece of a compound selector.
const TYPE = /^[a-z][a-z0-9-]*/i;
const CLASS = /^\.(-?[_a-z][\w-]*)/i;
const ID = /^#(-?[_a-z][\w-]*)/i;
const PSEUDO = /^::?([\w-]+)(\(([^)]*)\))?/;
const ATTRIBUTE = /^\[\s*([\w-]+)\s*(?:([~^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\s*)?\]/;

// The pieces of one compound selector, or null when a piece is one this module does not read.
function readCompound(text: string): Compound | null {
  let rest = text;
  let tag: string | null = null;
  let universal = false;
  const classes: string[] = [];
  let id: string | null = null;
  const attributes: AttributeTest[] = [];
  let pseudo: string | null = null;
  while (rest !== '') {
    if (pseudo !== null) return null; // nothing follows a pseudo-class (an unsupported chain: :hover:focus)
    const attribute = ATTRIBUTE.exec(rest);
    if (attribute !== null) {
      const [, name = '', op, dq, sq, bare] = attribute;
      const value = dq ?? sq ?? bare ?? '';
      attributes.push({ name: name.toLowerCase(), op: op === undefined ? 'exists' : (op as AttributeTest['op']), value });
      rest = rest.slice(attribute[0].length);
      continue;
    }
    const pseudoMatch = PSEUDO.exec(rest);
    if (pseudoMatch !== null) {
      const [, name = '', args] = pseudoMatch;
      // a pseudo-element, or a pseudo-class that takes arguments (:not, :nth-child): not read here
      if (rest.startsWith('::') || args !== undefined) return null;
      pseudo = name.toLowerCase();
      rest = rest.slice(pseudoMatch[0].length);
      continue;
    }
    const cls = CLASS.exec(rest);
    if (cls !== null) {
      classes.push(cls[1] as string);
      rest = rest.slice(cls[0].length);
      continue;
    }
    const ident = ID.exec(rest);
    if (ident !== null) {
      id = ident[1] as string;
      rest = rest.slice(ident[0].length);
      continue;
    }
    if (rest.startsWith('*')) {
      universal = true;
      rest = rest.slice(1);
      continue;
    }
    const type = TYPE.exec(rest);
    if (type !== null && tag === null && classes.length === 0 && id === null && attributes.length === 0) {
      tag = type[0].toLowerCase();
      rest = rest.slice(type[0].length);
      continue;
    }
    return null;
  }
  return { tag, universal, classes, id, attributes, pseudo };
}

// A selector read into its compounds and combinators, or null when it holds a piece this module does not read (a
// pseudo-element, :not(), a sibling combinator, an escape): the caller reports such a rule as not mapped.
export function readSelector(text: string): Selector | null {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  // split on the combinators, outside brackets: a whitespace or a ">" outside a compound closes the one before it
  const compounds: Compound[] = [];
  const combinators: (' ' | '>')[] = [];
  let current = '';
  let depth = 0;
  let pending: ' ' | '>' | null = null;
  let failed = false;
  const commit = (): void => {
    if (current === '') return;
    const compound = readCompound(current);
    if (compound === null) {
      failed = true;
      return;
    }
    if (compounds.length > 0) combinators.push(pending ?? ' ');
    compounds.push(compound);
    current = '';
    pending = null;
  };
  for (let at = 0; at < trimmed.length; at += 1) {
    const char = trimmed[at] as string;
    if (char === '[') depth += 1;
    if (char === ']') depth -= 1;
    if (depth > 0) {
      current += char;
      continue;
    }
    if (char === '>') {
      if (current !== '') commit();
      pending = '>';
      continue;
    }
    if (/\s/.test(char)) {
      if (current !== '') commit();
      pending ??= ' ';
      continue;
    }
    if (char === '+' || char === '~' || char === ',') return null;
    current += char;
  }
  commit();
  if (failed || compounds.length === 0 || current !== '' || pending === '>') return null;
  const ids = compounds.filter((c) => c.id !== null).length;
  const others = compounds.reduce((n, c) => n + c.classes.length + c.attributes.length + (c.pseudo === null ? 0 : 1), 0);
  const types = compounds.filter((c) => c.tag !== null).length;
  return { compounds, combinators, specificity: [ids, others, types] };
}

const attributeHolds = (facts: Facts, test: AttributeTest): boolean => {
  const value = test.name === 'id' ? facts.id : test.name === 'class' ? facts.classes.join(' ') : facts.attributes.get(test.name) ?? null;
  if (value === null || value === undefined) return false;
  switch (test.op) {
    case 'exists':
      return true;
    case '=':
      return value === test.value;
    case '~=':
      return value.split(/\s+/).includes(test.value);
    case '^=':
      return test.value !== '' && value.startsWith(test.value);
    case '$=':
      return test.value !== '' && value.endsWith(test.value);
    case '*=':
      return test.value !== '' && value.includes(test.value);
  }
};

// whether one compound selector holds for these facts
export function compoundHolds(compound: Compound, facts: Facts): boolean {
  if (compound.tag !== null && facts.tag !== compound.tag) return false;
  if (compound.id !== null && facts.id !== compound.id) return false;
  for (const className of compound.classes) if (!facts.classes.includes(className)) return false;
  for (const test of compound.attributes) if (!attributeHolds(facts, test)) return false;
  return true;
}

// Whether the subject, at the place its ancestors name (nearest first), matches the selector. The caller reports a
// rule whose selector ends in a pseudo-class (a state) separately, matching only what stands before it.
export function matches(selector: Selector, subject: Facts, ancestors: readonly Facts[]): boolean {
  const last = selector.compounds.length - 1;
  if (last < 0 || !compoundHolds(selector.compounds[last] as Compound, subject)) return false;
  const holds = (at: number, above: number): boolean => {
    if (at < 0) return true;
    const compound = selector.compounds[at] as Compound;
    const combinator = selector.combinators[at] as ' ' | '>';
    if (combinator === '>') {
      const parent = ancestors[above];
      return parent !== undefined && compoundHolds(compound, parent) && holds(at - 1, above + 1);
    }
    for (let from = above; from < ancestors.length; from += 1) {
      if (compoundHolds(compound, ancestors[from] as Facts) && holds(at - 1, from + 1)) return true;
    }
    return false;
  };
  return holds(last - 1, 0);
}
