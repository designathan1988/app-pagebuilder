// The engineering surface (the plan's T5): one read-only place that answers "why" about the document, so a person, a
// browser check or a tool asks once instead of walking the rules by hand.
//
// It owns no rule of its own: every answer is another owner's (the content model's placement refusal, the flags' lock
// refusal, the checks' list, the style applicability's kinds), gathered here under one shape and in one line of words.
// Nothing here changes anything: the same question through a command would run it (store.refusal answers that one).
import type { Message } from './commands/registry.ts';
import { locate, type DocNode, type DocumentJson, type NodeId } from './document/model.ts';
import type { ModelRules } from './document/validate.ts';
import { kindsOf } from './style/applies.ts';
import { checksOf, type CheckProperties } from './a11y/checks.ts';
import { placementRefusal } from './elements/content-model.ts';
import { lockOver, lockRefusal } from './nodes/flags.ts';

export interface Explanation {
  // what was asked, in words a person reads
  readonly about: string;
  // the answer in one line
  readonly answer: string;
  // the data behind the answer, for a tool
  readonly facts: Readonly<Record<string, unknown>>;
}

// Why these nodes cannot be put inside this parent: the one rule of where elements may go (the content model) and the
// one answer to what locks a node — the same refusals element.insert and element.moveTo return, asked without running
// anything.
export function whyNotAccepted(document: DocumentJson, rules: ModelRules, parentId: NodeId, nodes: readonly NodeId[]): { readonly asked: string; readonly refusal: Message | null } {
  const parent = locate(document, parentId);
  const inside = nodes.flatMap((id) => locate(document, id)?.node ?? []);
  if (parent === null || inside.length === 0) return { asked: `${nodes.join(', ')} into ${parentId}`, refusal: null };
  const locked = lockRefusal(document, parentId, 'status.locked.insert') ?? nodes.map((id) => lockRefusal(document, id, 'status.locked.move')).find((one) => one !== null) ?? null;
  return { asked: `${inside.map((node) => node.name).join(', ')} into ${parent.node.name}`, refusal: locked ?? placementRefusal(document, rules, parentId, inside) };
}

// What the document says about one node: its place, its kind, what holds it, and what the checks say about it — the
// same list the Checks panel draws (core/a11y/checks.ts).
export function aboutNode(document: DocumentJson, rules: ModelRules, id: NodeId, checks: CheckProperties | null = null): Explanation {
  const at = locate(document, id);
  if (at === null) return { about: `node ${id}`, answer: 'the document has no such node', facts: { found: false } };
  const node: DocNode = at.node;
  const issues = checks === null ? [] : checksOf(document, checks).filter((issue) => issue.node === id);
  const facts: Record<string, unknown> = {
    found: true,
    name: node.name,
    type: node.type,
    tag: node.tag,
    kinds: kindsOf([node], rules),
    children: node.children.length,
    locked: lockOver(document, id) !== null,
    hidden: node.hidden === true,
    parent: at.parent?.name ?? null,
    index: at.index,
    attributes: Object.keys(node.attributes),
    issues: issues.map((issue) => ({ rule: issue.rule, category: issue.category, fix: issue.fix })),
  };
  return {
    about: `node ${node.name} (${node.tag})`,
    answer: issues.length === 0 ? 'no check has anything on it' : `${issues.length} check(s)`,
    facts,
  };
}

// One line of words for a refusal, for a log or a tool: the message's key and what it names.
export function saidOf(refusal: Message | null): string {
  if (refusal === null) return 'accepted';
  const named = Object.entries(refusal.params ?? {})
    .map(([name, value]) => `${name}=${String(value)}`)
    .join(' ');
  return named === '' ? refusal.key : `${refusal.key} (${named})`;
}
