// The interactions of an element (ARCHITECTURE.md, Command owners; group 18; spec events-actions): the document's
// `interactions` (model.ts) and the three commands over them — interactions.add, interactions.update,
// interactions.remove — with the readers the export asks (which animations an event plays, which elements the script
// addresses).
//  - An interaction is one event and one action on the element: on click, hover, entering the screen, the page loading
//    or a form's submit; show, hide, toggle a class, play an animation, scroll to an element or open a link.
//  - The triggers and actions are the manifest's own lists (the enums of interactions.add's arguments), never re-listed
//    here. What applies is read from the element: a form's submit only on a <form>, playing an animation only where
//    the element holds one. Anything else is refused with status.interactions.notApplicable naming what.
//  - An interaction is named by its place in the element's list (as a shadow's layer is by its index), so a door drawn
//    per interaction stands for exactly one. A field's text is read by the `field` argument its door fixes
//    (manifest: adapter.fields). The editing canvas never runs an interaction; the preview and the exported page do,
//    through src/core/events/script.ts.
import { message, registerHandler, type HandlerContext, type Message, type Outcome, type RegisteredHandler } from '../commands/registry.ts';
import { locate, walk, type DocNode, type DocumentJson, type Interaction, type NodeId, type Selection } from '../document/model.ts';
import type { MessageId } from '../../generated/ids.ts';
import type { Patch } from '../history/transaction.ts';
import { firstLockRefusal } from '../nodes/flags.ts';
import { readAddress } from '../elements/address.ts';
import { animationsOf } from '../animation/animation.ts';
import { manifest } from '../../manifest/runtime.ts';

const NONE: readonly Interaction[] = [];
export const interactionsOf = (node: DocNode): readonly Interaction[] => node.interactions ?? NONE;

// The doors the Interactions tab draws, read from the manifest's own data (the panel's name and the control names are
// the drawing's): the Add button and the card's fields, whose commands declare the triggers, the actions and the fields
// they offer, so nothing is re-listed here.
const doorOf = (control: string): DoorRef | null => manifest.doors.find((d) => d.door.kind === 'panel-control' && d.door.panel === 'inspector' && d.door.control === control) ?? null;
type DoorRef = (typeof manifest.doors)[number];
const addDoor = (): DoorRef | null => doorOf('interaction-add');
const fieldDoor = (field: string): DoorRef | null => manifest.doors.find((d) => d.door.kind === 'panel-control' && d.door.panel === 'inspector' && (d.door.args as { field?: unknown }).field === field) ?? null;

const NONE_VALUES: readonly string[] = [];
const enumValues = (entry: DoorRef | null, argument: string): readonly string[] => {
  const declared = entry === null ? undefined : (entry.command.args as Record<string, { values?: readonly string[] }>)[argument];
  return declared?.values ?? NONE_VALUES;
};
export const TRIGGERS: readonly string[] = enumValues(addDoor(), 'trigger');
export const ACTIONS: readonly string[] = enumValues(addDoor(), 'action');

// the fields an interaction's card edits (interactions.update's `field` argument, the enum of the manifest)
export const FIELDS: readonly string[] = enumValues(fieldDoor('trigger'), 'field');

// a class the toggle-class action toggles and the scope names: a CSS class name's grammar (core/design/classes.ts)
const CLASS_NAME = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/;

// whether the element is a form (the trigger is the element's own submit)
const isForm = (node: DocNode): boolean => node.tag === 'form';

// The triggers an element offers: every one, but a form's submit only on a form (spec events-actions, Problems in
// Pager 2: a combination that cannot apply is not offered).
export const applicableTriggers = (node: DocNode): readonly string[] => TRIGGERS.filter((trigger) => trigger !== 'form-submit' || isForm(node));

// The actions an element offers: playing an animation needs one of its own animations (the action names it).
export const applicableActions = (node: DocNode): readonly string[] => (animationsOf(node).length === 0 ? ACTIONS.filter((action) => action !== 'play-animation') : ACTIONS);

// What an action needs: an element it acts on, the animation it plays (one of the element's own), the class it
// toggles, the address it opens.
export const needsTarget = (action: string): boolean => ['show', 'hide', 'toggle-class', 'scroll-to', 'play-animation'].includes(action);
export const needsAnimation = (action: string): boolean => action === 'play-animation';
export const needsClassName = (action: string): boolean => action === 'toggle-class';
export const needsAddress = (action: string): boolean => action === 'open-link';

// The animations an event plays, per node: the export writes their animation as a class rule (the script adds the
// class when the event fires) instead of the element's own rule (spec export-events-js).
export function playedAnimations(document: DocumentJson): ReadonlyMap<NodeId, ReadonlySet<string>> {
  const found = new Map<NodeId, Set<string>>();
  for (const page of document.pages) {
    for (const node of walk(page.tree)) {
      for (const interaction of interactionsOf(node)) {
        if (interaction.action !== 'play-animation' || interaction.animation === undefined) continue;
        const target = (interaction.target ?? node.id) as NodeId;
        const held = found.get(target) ?? new Set<string>();
        held.add(interaction.animation);
        found.set(target, held);
      }
    }
  }
  return found;
}

// Every node an interaction names (the element that holds it, and the target it acts on): the export gives these
// elements a class, so the script can address them by it (spec export-events-js: "Targets are addressed by their BEM
// class or user id, never by editor ids or data attributes").
export function addressedNodes(document: DocumentJson): ReadonlySet<NodeId> {
  const found = new Set<NodeId>();
  for (const page of document.pages) {
    for (const node of walk(page.tree)) {
      if (interactionsOf(node).length > 0) found.add(node.id as NodeId);
      for (const interaction of interactionsOf(node)) if (interaction.target !== undefined) found.add(interaction.target);
    }
  }
  return found;
}

// the element an interaction command acts on: the primary selected node (the manifest's singleSelection for add)
function targetNode<Ui>(context: HandlerContext<Ui>): { readonly node: DocNode; readonly path: readonly (string | number)[] } | null {
  const primary = context.state.selection[0];
  if (primary === undefined) return null;
  const found = locate(context.state.document, primary);
  return found === null ? null : { node: found.node, path: found.path };
}
const lockedRefusal = <Ui>(context: HandlerContext<Ui>, node: DocNode) => firstLockRefusal(context.state.document, [node.id as NodeId], 'status.locked.edit');

const writeInteractions = (found: { readonly node: DocNode; readonly path: readonly (string | number)[] }, interactions: readonly Interaction[]): Patch[] => {
  const { interactions: _dropped, ...rest } = found.node;
  void _dropped;
  return [{ op: 'replace', path: [...found.path], value: interactions.length === 0 ? rest : { ...rest, interactions } }];
};

// The catalogue key a trigger, an action or a field is named by: the manifest's own door labels where a door stands for
// the value (a field's door carries its label), else the catalogue's own key for it (a trigger and an action are named
// by the words of the panel's list). A message and the list say the same word.
function optionLabel(entry: DoorRef | null, argument: string, value: string): MessageId | null {
  const door = entry === null ? undefined : (entry.command.entryPoints as { args: Record<string, unknown>; labelKey: string }[]).find((d) => d.args[argument] === value);
  return door === undefined ? null : (door.labelKey as MessageId);
}
// a value as its catalogue key names it: a kebab value (toggle-class) with its camel case (toggleClass)
const camel = (value: string): string => value.replace(/-([a-z])/g, (_all, letter: string) => letter.toUpperCase());
export const triggerLabel = (trigger: string): MessageId => optionLabel(addDoor(), 'trigger', trigger) ?? (`interactions.trigger.${camel(trigger)}` as MessageId);
export const actionLabel = (action: string): MessageId => optionLabel(addDoor(), 'action', action) ?? (`interactions.action.${camel(action)}` as MessageId);
// the field a card's control edits, by its label (the door's own labelKey)
export const fieldLabel = (field: string): MessageId => (optionLabel(fieldDoor(field), 'field', field) ?? (`interactions.field.${camel(field)}` as MessageId));

// what an options text makes of an interaction's action: the class it toggles, the animation it plays, the address it
// opens (through the one rule of an address)
function optionsFrom(node: DocNode, action: string, text: string): { readonly change: Partial<Interaction> } | { readonly refused: Message } {
  const typed = text.trim();
  if (needsClassName(action)) {
    if (!CLASS_NAME.test(typed)) return { refused: message('status.interactions.notApplicable', { name: typed }) };
    return { change: { className: typed } };
  }
  if (needsAnimation(action)) {
    if (!animationsOf(node).some((animation) => animation.name === typed)) return { refused: message('status.interactions.notApplicable', { name: typed }) };
    return { change: { animation: typed } };
  }
  if (needsAddress(action)) {
    const read = readAddress(typed);
    if (!read.ok) return { refused: read.refusal };
    return { change: { address: read.value } };
  }
  return { refused: message('status.interactions.notApplicable', { name: { key: actionLabel(action) } }) };
}

export const addInteractionCommand = registerHandler('interactions.add', (context, { trigger, action, target, options }): Outcome<never> => {
  const found = targetNode(context);
  if (found === null) return { kind: 'change' };
  const chosenTrigger = trigger ?? applicableTriggers(found.node)[0] ?? 'click';
  if (!applicableTriggers(found.node).includes(chosenTrigger)) return { kind: 'refused', message: message('status.interactions.notApplicable', { name: { key: triggerLabel(chosenTrigger) }, element: found.node.name }) };
  const chosenAction = action ?? applicableActions(found.node)[0] ?? 'show';
  if (!applicableActions(found.node).includes(chosenAction)) return { kind: 'refused', message: message('status.interactions.notApplicable', { name: { key: actionLabel(chosenAction) }, element: found.node.name }) };
  const locked = lockedRefusal(context, found.node);
  if (locked !== null) return { kind: 'refused', message: locked };
  const held = options !== null && typeof options === 'object' && !Array.isArray(options) ? (options as Record<string, unknown>) : {};
  const interaction: Interaction = {
    trigger: chosenTrigger,
    action: chosenAction,
    ...(typeof target === 'string' ? { target: target as NodeId } : {}),
    ...(typeof held.className === 'string' ? { className: held.className } : {}),
    ...(typeof held.animation === 'string' ? { animation: held.animation } : {}),
    ...(typeof held.address === 'string' ? { address: held.address } : {}),
    ...(held.newTab === true ? { newTab: true as const } : {}),
    ...(typeof held.scope === 'string' && held.scope !== '' ? { scope: held.scope } : {}),
  };
  return {
    kind: 'change',
    patches: writeInteractions(found, [...interactionsOf(found.node), interaction]),
    message: message('status.interactions.added', { name: { key: triggerLabel(chosenTrigger) }, element: found.node.name, count: interactionsOf(found.node).length + 1 }),
  };
});

// the changes one field's text makes of an interaction
function changedByText(node: DocNode, interaction: Interaction, field: string, text: string): { readonly next: Interaction } | { readonly refused: Message } {
  const typed = text.trim();
  if (field === 'trigger') {
    if (!applicableTriggers(node).includes(typed)) return { refused: message('status.interactions.notApplicable', { name: { key: triggerLabel(typed) } }) };
    return { next: { ...interaction, trigger: typed } };
  }
  if (field === 'action') {
    if (!applicableActions(node).includes(typed)) return { refused: message('status.interactions.notApplicable', { name: { key: actionLabel(typed) } }) };
    // a new action takes the values it needs with it: what the old one held goes
    const { className: _c, animation: _a, address: _ad, newTab: _n, ...rest } = interaction;
    void _c;
    void _a;
    void _ad;
    void _n;
    return { next: { ...rest, action: typed } };
  }
  if (field === 'options') {
    const made = optionsFrom(node, interaction.action, typed);
    if ('refused' in made) return made;
    return { next: { ...interaction, ...made.change } };
  }
  if (field === 'scope') {
    if (typed === '') {
      const { scope: _dropped, ...rest } = interaction;
      void _dropped;
      return { next: rest };
    }
    if (!CLASS_NAME.test(typed)) return { refused: message('status.interactions.notApplicable', { name: typed }) };
    return { next: { ...interaction, scope: typed } };
  }
  return { refused: message('status.interactions.notApplicable', { name: { key: fieldLabel(field) } }) };
}

// The editor's maker of the picking state (spec events-actions: the Target field starts picking on the canvas or on a
// Layers row). It is the editor's own part of the store state, so its maker comes from there (as the hand's does,
// core/structure/hand.ts): the core never touches editor state itself.
export interface PickMaking<Ui> {
  makePicking(ui: Ui, interaction: number): Ui;
  makePicked(ui: Ui): Ui;
}

// interactions.update, for the editor state that holds the picker: a door of the Target field starts picking (ui
// alone), and any other door's write clears it.
export function updateInteractionCommand<Ui>(make: PickMaking<Ui>): RegisteredHandler<'interactions.update', Ui> {
  return registerHandler<'interactions.update', Ui>('interactions.update', (context, { interaction, field, changes }): Outcome<Ui> => {
  const found = targetNode(context);
  if (found === null || typeof interaction !== 'number') return { kind: 'change' };
  const held = interactionsOf(found.node)[interaction];
  if (held === undefined) return { kind: 'change' };
  // the Target field starts picking (DESIGN.md: not a command of its own; editor state alone, no undo step, nothing of
  // the document), and the pick itself clears it again
  if (changes !== null && typeof changes === 'object' && !Array.isArray(changes) && (changes as Record<string, unknown>).pick === true) {
    return { kind: 'change', ui: make.makePicking(make.makePicked(context.state.ui), interaction) };
  }
  const locked = lockedRefusal(context, found.node);
  if (locked !== null) return { kind: 'refused', message: locked };
  let next: Interaction = held;
  if (typeof changes === 'string') {
    if (typeof field !== 'string') return { kind: 'change' };
    const made = changedByText(found.node, held, field, changes);
    if ('refused' in made) return { kind: 'refused', message: made.refused };
    next = made.next;
  } else if (changes !== null && typeof changes === 'object' && !Array.isArray(changes)) {
    const wanted = changes as Record<string, unknown>;
    // the pick of a target: the element named on the canvas or on a Layers row (never a typed id)
    if (typeof wanted.target === 'string') {
      if (locate(context.state.document, wanted.target as NodeId) === null) return { kind: 'refused', message: message('status.interactions.notApplicable', { name: wanted.target }) };
      next = { ...next, target: wanted.target as NodeId };
    }
    if (typeof wanted.scope === 'string') next = { ...next, scope: wanted.scope };
    if (typeof wanted.trigger === 'string') {
      if (!applicableTriggers(found.node).includes(wanted.trigger)) return { kind: 'refused', message: message('status.interactions.notApplicable', { name: { key: triggerLabel(wanted.trigger) } }) };
      next = { ...next, trigger: wanted.trigger };
    }
    if (typeof wanted.action === 'string') {
      if (!applicableActions(found.node).includes(wanted.action)) return { kind: 'refused', message: message('status.interactions.notApplicable', { name: { key: actionLabel(wanted.action) } }) };
      next = { ...next, action: wanted.action };
    }
    // the new-tab toggle of an open-link action (the button stands for the value it writes)
    if (typeof wanted.newTab === 'boolean') {
      const { newTab: _dropped, ...rest } = next;
      void _dropped;
      next = wanted.newTab ? { ...rest, newTab: true } : rest;
    }
  } else {
    return { kind: 'change' };
  }
  const cleared = make.makePicked(context.state.ui);
  const ui = cleared === context.state.ui ? undefined : cleared;
  if (deepEqualInteraction(next, held)) return { kind: 'change', ...(ui === undefined ? {} : { ui }) };
  const interactions = interactionsOf(found.node).map((each, at) => (at === interaction ? next : each));
  return {
    kind: 'change',
    patches: writeInteractions(found, interactions),
    ...(ui === undefined ? {} : { ui }),
    message: message('status.interactions.updated', { name: { key: triggerLabel(next.trigger) }, element: found.node.name }),
  };
  });
}

const deepEqualInteraction = (a: Interaction, b: Interaction): boolean => JSON.stringify(a) === JSON.stringify(b);

export const removeInteractionCommand = registerHandler('interactions.remove', (context, { interaction }): Outcome<never> => {
  const found = targetNode(context);
  if (found === null || typeof interaction !== 'number') return { kind: 'change' };
  const held = interactionsOf(found.node)[interaction];
  if (held === undefined) return { kind: 'change' };
  const locked = lockedRefusal(context, found.node);
  if (locked !== null) return { kind: 'refused', message: locked };
  const interactions = interactionsOf(found.node).filter((_each, at) => at !== interaction);
  return { kind: 'change', patches: writeInteractions(found, interactions), message: message('status.interactions.removed', { name: { key: triggerLabel(held.trigger) }, element: found.node.name }) };
});

// the element an interaction of a node acts on: the target it names, else the node itself (the export's reader)
export const actionTarget = (node: DocNode, interaction: Interaction): NodeId => (interaction.target ?? (node.id as NodeId));
// the selection's primary element, for a reader of the panel (which draws the cards of the selected element)
export const primaryNodeOf = (document: DocumentJson, selection: Selection): DocNode | null => {
  const primary = selection[0];
  return primary === undefined ? null : (locate(document, primary)?.node ?? null);
};
