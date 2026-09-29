// The inspector (DESIGN.md "Inspector"; spec inspector-panel): its header (the tabs, Page properties, the Element
// actions menu) and the body of the tab it shows (workspace.setActiveTab). A tab whose body the inspector does not draw
// yet (Interactions, until events-actions) is not available yet (DESIGN.md "Build order").
//  - Style: the selector bar, then the Style tab's region, as tall as what it shows (the inspector column scrolls it):
//    with nothing selected, the hints first (and the fields stay empty); then the value-origin legend, Essentials only
//    / All properties, the property search and the sections, always all eight and in order (properties.json), each
//    with the fields the manifest
//    places in inspector-style in their order. A section's header collapses and expands it (inspector.toggleSection);
//    a collapsed one shows no field and summarises the values the page computes (sections.ts). A field offers every
//    value of the catalogue in All properties (the generated list and the presets, DESIGN.md) and draws a
//    keyword-buttons control with the keyword icons of properties.json; the commands behind them arrive with their
//    features, so each shows "not available yet".
//  - Settings: no selector bar; its region starts under the header. The text of the one selected text element (its
//    field keeps the text with text.set), then the attribute fields that apply to the element's type, in their order;
//    on the page root, the fields of the page's settings keep what is typed with page.setSetting; on a Link Block or a
//    link, the Link address keeps it with element.setLink; the HTML tag field keeps a typed tag with element.setTag.
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react';
import type { CommandId, FeatureId, KeyContextId, MessageId, SectionId, StyleTargetId } from '../../generated/ids.ts';
import { GENERATED_VALUES } from '../../generated/value-lists.ts';
import { isFeatureBuilt } from '../../app/features.ts';
import { componentHolders, instanceRootOf } from '../../core/design/components.ts';
import { locate, type DocNode, type StoredValue } from '../../core/document/model.ts';
import { structuredCss } from '../../core/render/output.ts';
import type { DispatchResult } from '../../core/store/store.ts';
import { elementIcon, manifest, type DoorEntry } from '../../manifest/runtime.ts';
import { DoorControl, Icon, useDoor } from '../doors/door.tsx';
import { MenuButton } from '../doors/menu.tsx';
import { GLYPHS, doorSlots, drawnAsOf, partOf, slotsIn } from '../doors/placement.ts';
import { setActiveOption } from '../focus/focus.ts';
import { authoredProperties, editedProperties, editedPropertiesByDoor, inspectorMode, inspectorSearchOf, isColourValue, isEssential, searchMatches, sectionClosed, sectionProperties, summaryOf, summaryProperties } from '../inspector/sections.ts';
import { PAIR_ROWS, orderByGroup, pairRowOf, rowPrefixKey, type PairRow } from '../inspector/rows.ts';
import { valueOrigin } from '../inspector/origin.ts';
import { MODEL_RULES, useEditorState, useStore, layeredRules } from '../store.ts';
import { styleSource } from '../inspector/style-target.ts';
import { FieldOrigin } from './field-origin.tsx';
import './settings.css';
import { inspectorTab } from '../workspace/layout.ts';
import { isPanelOpen, panelName } from '../workspace/panels.ts';
import { pluralForm } from '../../i18n/index.ts';
import { useLocale, useT } from '../text.ts';
import { activeBreakpoint } from '../view/breakpoints.ts';
import { usePrimarySize } from '../view/selection-size.ts';
import { activeState } from '../view/style-state.ts';
import { KeywordButtons, NumberField, TextStyleField, keepAfterGesture, presetsOf, useEffectiveText, useMixed, usePageValues, useSelectionContext, type FieldPart } from './field.tsx';
import { storedValue } from '../../core/style/set.ts';
import { kindsOf, shownForContext, shownForKinds, type ElementContext } from '../../core/style/applies.ts';
import { storedPlace } from '../../core/style/grid-item.ts';
import { tracksOf } from '../../core/style/tracks.ts';
import { functionArgument, functionOfControl, translateAxis, translateWith } from '../../core/style/functions.ts';
import { Slots } from './slots.tsx';
import { InteractionsTab } from './interactions.tsx';
import { SettingsTab } from './inspector-settings.tsx';
import { Hints, useSingleNode } from '../inspector/selection.tsx';
import { Affects, TargetChips, classBarControl } from './class-bar.tsx';
import { GradientControl, isGradientControl } from './gradient.tsx';
import { ShadowControl, isShadowControl } from './shadow.tsx';
import { compactFieldValue, useFieldAppearance } from './field-face.tsx';

interface Target {
  readonly id: string;
  readonly section: string;
  readonly labelKey: string;
  readonly control: string;
  readonly icons: Readonly<Record<string, string>>;
  readonly subsets: readonly { readonly id: string; readonly values: readonly string[] | null }[];
  // a composite's longhands, in its shorthand's order
  readonly longhands?: readonly string[];
}

const TARGETS = new Map<string, Target>([
  ...manifest.properties.properties.map((p) => [p.id, p] as const),
  ...manifest.properties.composites.map((c) => [c.id, { ...c, icons: {} }] as const),
  ...manifest.properties.recipes.map((r) => [r.id, { ...r, icons: {}, subsets: [] }] as const),
]);
const SECTIONS = manifest.properties.sections;
// the selector bar's target chip and the × drawn inside a class chip
const CHIP = doorSlots('inspector-selector-bar').find((d) => drawnAsOf(d) === 'item');
// The track editor's doors (manifest commands/style.json, style.setGridTracks): the track field, the add and the
// remove button, one of each per axis.
const TRACK_DOORS: readonly DoorEntry[] = manifest.properties.properties.filter((p) => p.control === 'track-editor').flatMap((p) => p.doors.flatMap((ref) => manifest.doorByRef.get(ref as never) ?? []));
const CHIP_PART = CHIP ? partOf('inspector-selector-bar', CHIP) : null;
const ORIGINS: readonly { readonly key: MessageId; readonly origin: string }[] = [
  { key: 'inspector.legend.here', origin: 'here' },
  { key: 'inspector.legend.breakpoint', origin: 'breakpoint' },
  { key: 'inspector.legend.state', origin: 'state' },
  { key: 'inspector.legend.inherited', origin: 'inherited' },
  { key: 'inspector.legend.default', origin: 'default' },
];

// the controls drawn as the text field of a style value (field.tsx TextStyleField): typed, Enter keeps it
const TEXT_CONTROLS: readonly string[] = ['keyword-menu', 'font-menu', 'text-field', 'number-field', 'slider', 'track-editor', 'transform-fields'];

const targetOf = (entry: DoorEntry): Target | null => {
  const d = entry.door;
  if (d.kind !== 'inspector-field') return null;
  const id = d.property ?? d.composite ?? d.recipe;
  return id !== null ? (TARGETS.get(id) ?? null) : null;
};

// The section of the Style tab a door is drawn in: the property, composite or recipe its own field names; else the one
// a control of its own edits (the grid's track editor: properties.json lists its doors among grid-template-columns's,
// so it is drawn in the Layout section like the property it writes, never in whichever section happens to precede it);
// null for a control that edits no property (the custom declarations), drawn in the section of the field before it.
const sectionOf = (entry: DoorEntry): string | null => {
  const own = targetOf(entry)?.section;
  if (own !== undefined) return own;
  const edited = editedPropertiesByDoor(entry.ref);
  const first = edited === null ? undefined : edited[0];
  return first === undefined ? null : (TARGETS.get(first)?.section ?? null);
};

// The values a field offers in All properties: the generated list of its property and its presets.
function offered(entry: DoorEntry): readonly string[] {
  const offers = entry.door.adapter.offers;
  if (!offers) return [];
  const generated = offers.list === 'generated' ? (GENERATED_VALUES[offers.property as StyleTargetId]?.keywords ?? []) : [];
  return [...new Set([...generated, ...presetsOf(entry)])];
}

// A field's controls, disabled while its door is (not available yet, or its predicate does not hold).
function FieldInput({ entry, target, label, available }: { readonly entry: DoorEntry; readonly target: Target; readonly label: string; readonly available: boolean }) {
  const d = entry.door;
  const off = available ? '' : ' is-unavailable';
  const ariaDisabled = available ? undefined : true;
  // a field the door draws as a button (its drawnAs): an editor's action, or one fixed value (Spread writes space-between)
  if (d.kind === 'inspector-field' && d.drawnAs === 'button') {
    return (
      <button type="button" className={`door door--button${off}`} aria-disabled={ariaDisabled} aria-label={label}>
        <span className="door__label">{typeof d.args.value === 'string' ? d.args.value : label}</span>
      </button>
    );
  }
  if (target.control === 'keyword-buttons' && entry.door.kind === 'inspector-field' && entry.door.control === 'field') {
    return (
      <span className="segmented segmented--values" role="group" aria-label={label}>
        {offered(entry).map((value) => {
          const icon = target.icons[value];
          return (
            <button key={value} type="button" className={`door door--segment${off}`} aria-disabled={ariaDisabled} title={value} aria-label={value}>
              {icon !== undefined ? <Icon name={icon} size="sm" /> : <span className="door__label">{value}</span>}
            </button>
          );
        })}
      </span>
    );
  }
  if (target.control === 'keyword-menu' || target.control === 'font-menu') {
    return (
      <button type="button" className={`select${off}`} aria-disabled={ariaDisabled} aria-label={label} aria-haspopup="listbox">
        <span className="select__value" />
        <Icon name={GLYPHS.dropdown} size="xs" />
      </button>
    );
  }
  return (
    <span className="input-wrap">
      {target.control === 'color-field' ? <span className="swatch" /> : null}
      <input className="input" disabled={!available} aria-label={label} />
    </span>
  );
}

// The label a door of the Style tab shows: one that carries only its command's label is labelled by its property,
// composite or recipe (the glossary's term, rule label-term), or, for an editor control, by the first property it
// writes; a button with a label of its own (Spread, Stretch) keeps it. Find a property matches it too.
function fieldLabelKey(entry: DoorEntry): MessageId {
  if (entry.door.labelKey !== entry.command.labelKey) return entry.door.labelKey as MessageId;
  const named = targetOf(entry) ?? TARGETS.get(entry.door.adapter.writes[0] ?? '');
  return (named?.labelKey ?? entry.door.labelKey) as MessageId;
}

function Field({ entry, bare = false, labelled = false, prefix = null, rowLabel = null, measurement }: { readonly entry: DoorEntry; readonly bare?: boolean; readonly labelled?: boolean; readonly prefix?: string | null; readonly rowLabel?: MessageId | null; readonly measurement?: 'width' | 'height' | undefined }) {
  const t = useT();
  const target = targetOf(entry);
  // labelled as fieldLabelKey says, or by the row's own label when it has one (a pair row of the gap reads "Gap"). A
  // field is usable only once its own feature is registered as built (DESIGN.md "Build order"): style.set runs Width
  // and Height long before Display or Color.
  const own = entry.door.labelKey !== entry.command.labelKey;
  const door = useDoor(entry, {}, rowLabel !== null ? t(rowLabel) : target && !own ? t(fieldLabelKey(entry)) : undefined, isFeatureBuilt(entry.door.feature as FeatureId));
  if (!target) return null;
  const cssName = entry.door.kind === 'inspector-field' ? (entry.door.property ?? target.id) : target.id;
  // a composite of lengths (gap: row-gap and column-gap) is a text field of its longhands, one or two lengths
  if (target.control === 'length-field' && entry.door.kind === 'inspector-field' && entry.door.drawnAs === 'field' && entry.door.composite !== null && 'property' in entry.command.args) {
    return <TextStyleField entry={entry} door={door} property={entry.door.composite} longhands={target.longhands ?? null} label={door.label} bare={bare} labelled={labelled} prefix={prefix} />;
  }
  // the shadow editor's controls (shadow.tsx)
  if (isShadowControl(entry)) return <ShadowControl entry={entry} door={door} />;
  // the gradient editor's controls (gradient.tsx)
  if (isGradientControl(entry)) return <GradientControl entry={entry} door={door} />;
  // a field of a part of a value: a translate axis (Move X, Move Y), one function of a filter or a transform (Blur,
  // Skew X), by its door's control
  const part = partOfField(entry);
  if (part !== null && entry.door.kind === 'inspector-field' && entry.door.drawnAs === 'field' && entry.door.property !== null) {
    return <TextStyleField entry={entry} door={door} property={entry.door.property} longhands={null} label={door.label} part={part} />;
  }
  // a field drawn as a button that writes one fixed value (Stretch: align-items stretch; Spread: justify-content
  // space-between): its door, standing for that value
  if (entry.door.kind === 'inspector-field' && entry.door.drawnAs === 'button') {
    return (
      <div className={`field-row${door.available ? '' : ' is-unavailable'}`} data-door={entry.ref} data-args={JSON.stringify(entry.door.args)} title={door.title}>
        <span className="field-row__label" />
        <button type="button" className={`door door--button${door.available ? '' : ' is-unavailable'}`} aria-disabled={door.available ? undefined : true} onClick={door.run}>
          <span className="door__label">{door.face}</span>
        </button>
      </div>
    );
  }
  // a length field is the field component: typing, units, steps and the scrub (spec inspector-number-fields)
  if (target.control === 'length-field' && entry.door.kind === 'inspector-field' && entry.door.property !== null) return <NumberField entry={entry} door={door} property={entry.door.property} label={door.label} bare={bare} labelled={labelled} prefix={prefix} measurement={measurement} />;
  // keyword buttons: one button per value the property offers (field.tsx)
  if (target.control === 'keyword-buttons' && entry.door.kind === 'inspector-field' && entry.door.control === 'field' && entry.door.property !== null && 'property' in entry.command.args) {
    return <KeywordButtons entry={entry} door={door} property={entry.door.property} values={offered(entry)} icons={target.icons} label={door.label} />;
  }
  // a keyword menu, a font menu, a text field, a number field, a slider or a track list of a property or composite: a
  // text field suggesting its keywords
  if (TEXT_CONTROLS.includes(target.control) && entry.door.kind === 'inspector-field' && entry.door.drawnAs === 'field' && 'property' in entry.command.args) {
    // a keyword menu or a font menu also draws the button that opens every value at once (A3.33)
    return <TextStyleField entry={entry} door={door} property={entry.door.property ?? target.id} longhands={entry.door.composite !== null ? (target.longhands ?? null) : null} label={door.label} values={target.control === 'keyword-menu' || target.control === 'font-menu'} bare={bare} labelled={labelled} prefix={prefix} />;
  }
  // a border or radius field: its own command (style.setBorder, style.setRadius), the same field; the typed text is
  // parted into the command's arguments (field.tsx)
  if ((target.control === 'border-editor' || target.control === 'radius-editor') && entry.door.kind === 'inspector-field' && entry.door.drawnAs === 'field') {
    const edited = entry.door.composite ?? entry.door.property ?? target.id;
    // A row whose value is a colour, whatever the command that types its text (the border's colour, outline-color):
    // its swatch opens the colour picker on that property, which writes it through the one writer of a property
    // (core/style/set.ts writePropertyText) — the composite landing on its longhands (A3.29, finding 57)
    return <TextStyleField entry={entry} door={door} property={edited} longhands={entry.door.composite !== null ? (target.longhands ?? null) : null} label={door.label} ownCommand colour={isColourValue(edited)} bare={bare} labelled={labelled} prefix={prefix} />;
  }
  // an image field (the background image): its own command, the same field
  if (target.control === 'image-field' && entry.door.kind === 'inspector-field' && entry.door.drawnAs === 'field' && entry.door.property !== null && 'property' in entry.command.args) {
    return <TextStyleField entry={entry} door={door} property={entry.door.property} longhands={null} label={door.label} ownCommand />;
  }
  // a colour field: its swatch opens the colour picker (color.tsx), its text keeps a typed colour like a text field
  if (target.control === 'color-field' && entry.door.kind === 'inspector-field' && entry.door.drawnAs === 'field' && entry.door.property !== null && 'property' in entry.command.args) {
    return <TextStyleField entry={entry} door={door} property={entry.door.property} longhands={null} label={door.label} colour />;
  }
  return (
    <div className={`field-row${door.available ? '' : ' is-unavailable'}`} data-door={entry.ref} title={door.title}>
      <span className="field-row__label" title={cssName}>
        {door.label}
      </span>
      <FieldInput entry={entry} target={target} label={door.label} available={door.available} />
    </div>
  );
}

// The part of a value a field edits alone, by its door's control (manifest data): a translate axis (translate-x,
// translate-y: style.set with the whole translate, core/style/functions.ts translateWith), or one function of a filter or
// a transform (filter-blur, transform-skew-x: the door's command with that function's argument); null for any other.
function partOfField(entry: DoorEntry): FieldPart | null {
  if (entry.door.kind !== 'inspector-field' || entry.door.property === null) return null;
  const { control, property } = entry.door;
  const axis = ['translate-x', 'translate-y'].indexOf(control);
  if (axis >= 0) return { show: (held) => translateAxis(held, axis), args: (text, held) => ({ property, value: translateWith(held, axis, text) }) };
  const list = Object.entries(entry.command.args).find(([name, arg]) => name !== 'property' && arg.type === 'json')?.[0];
  if (list === undefined || !/^(filter|transform)-/.test(control)) return null;
  const name = functionOfControl(control);
  return { show: (held) => functionArgument(held, name), args: (text) => ({ property, [list]: { [name]: text } }) };
}

// A grid item's start or span (spec props-grid-container, the user's real-use audit, item A1.3): a whole number
// kept on Enter or on leaving the field, written with the item's own command (style.setGridItem), which reads the half
// the field leaves out from the value the element holds.
function GridItemField({ entry, half }: { readonly entry: DoorEntry; readonly half: 'start' | 'span' }) {
  const store = useStore();
  const t = useT();
  const property = typeof entry.door.args.property === 'string' ? entry.door.args.property : '';
  const appearance = useFieldAppearance([property]);
  const place = (s: Parameters<typeof styleSource>[0]) => {
    const node = styleSource(s);
    return node ? storedPlace(node, property, layeredRules(s.ui)) : null;
  };
  const start = useEditorState((s) => place(s)?.start ?? null);
  const span = useEditorState((s) => place(s)?.span ?? 1);
  const shown = half === 'start' ? (start === null ? '' : String(start)) : String(span);
  const door = useDoor(entry, {}, t(fieldLabelKey(entry)), isFeatureBuilt(entry.door.feature as FeatureId));
  const input = useRef<HTMLInputElement>(null);
  const draft = useRef(false);
  useEffect(() => {
    const element = input.current;
    if (element !== null && !draft.current) element.value = shown;
  }, [shown]);
  const keep = () => {
    const element = input.current;
    if (element === null || !draft.current) return;
    draft.current = false;
    const typed = element.value.trim();
    if (typed === '') return;
    const number = Number.parseInt(typed, 10);
    if (!Number.isInteger(number)) return;
    (store.dispatch as (id: CommandId, args: unknown) => DispatchResult)(entry.command.id, { property, [half]: number });
  };
  return (
    <form
      className="field-row"
      data-origin={appearance.kind}
      data-door={entry.ref}
      data-args={JSON.stringify({ property })}
      title={door.title}
      onSubmit={(event) => {
        event.preventDefault();
        keep();
      }}
    >
      <span className="field-row__label" title={t(entry.door.labelKey as MessageId)}>{t(entry.door.labelKey as MessageId)}</span>
      <input
        ref={input}
        className="input"
        type="text"
        role="spinbutton"
        inputMode="numeric"
        spellCheck={false}
        disabled={!door.available}
        aria-label={t(entry.door.labelKey as MessageId)}
        onInput={() => { draft.current = true; }}
        onBlur={keep}
      />
    </form>
  );
}

// The grid's track editor (spec props-grid-container, Problems in Pager 3; the user's real-use audit, item A1.2): for
// a grid container's columns or rows, one field per track of the axis, each keeping its track in its place
// (style.setGridTracks), a count line, and the doors that add and remove a track. The raw value keeps its own field
// beside the editor.
function GridTracks({ entry }: { readonly entry: DoorEntry }) {
  const t = useT();
  const locale = useLocale();
  // the axis the door edits (its own argument: a panel control carries no property of its own)
  const property = typeof entry.door.args.property === 'string' ? entry.door.args.property : '';
  const appearance = useFieldAppearance([property]);
  const value = useEditorState((s) => {
    const node = styleSource(s);
    return node ? storedValue(node, property, layeredRules(s.ui)) : undefined;
  });
  const tracks = tracksOf(value);
  const control = (d: DoorEntry) => (d.door.kind === 'panel-control' ? d.door.control : null);
  const doors = TRACK_DOORS.filter((d) => String(d.door.args.property ?? '') === property);
  const field = doors.find((d) => control(d) === 'track-field');
  const add = doors.find((d) => control(d) === 'add-track');
  const remove = doors.find((d) => control(d) === 'remove-track');
  const primary = useEditorState((s) => s.selection[0] ?? null);
  return (
    <div className="grid-tracks" data-door={entry.ref} data-args={JSON.stringify({ property })}>
      <div className="field-row" data-origin={appearance.kind}>
        <span className="field-row__label">{t(`inspector.grid.trackCount.${pluralForm(locale, tracks.length)}`, { count: tracks.length })}</span>
      </div>
      {tracks.map((track, index) => (
        <GridTrackField key={index} entry={field} property={property} index={index} track={track} available={primary !== null} />
      ))}
      <div className="field-row grid-tracks__buttons">
        {add ? <DoorControl entry={add} args={{ property, edit: { add: true } }} /> : null}
        {remove ? <DoorControl entry={remove} args={{ property, edit: { remove: true } }} /> : null}
      </div>
    </div>
  );
}

// One track of the editor: its text kept on Enter or on leaving the field, written by its place (style.setGridTracks).
function GridTrackField({ entry, property, index, track, available }: { readonly entry: DoorEntry | undefined; readonly property: string; readonly index: number; readonly track: string; readonly available: boolean }) {
  const store = useStore();
  const t = useT();
  const appearance = useFieldAppearance([property]);
  const door = useDoor(entry ?? (manifest.doors[0] as DoorEntry), {}, t('inspector.grid.track'), entry !== undefined && available);
  const input = useRef<HTMLInputElement>(null);
  const draft = useRef(false);
  useEffect(() => {
    const element = input.current;
    if (element !== null && !draft.current) element.value = track;
  }, [track]);
  const keep = () => {
    const element = input.current;
    if (element === null || !draft.current || entry === undefined) return;
    draft.current = false;
    (store.dispatch as (id: CommandId, args: unknown) => DispatchResult)(entry.command.id, { property, track: index, value: element.value });
  };
  if (entry === undefined) return null;
  return (
    <form
      className="field-row"
      data-origin={appearance.kind}
      data-door={entry.ref}
      data-args={JSON.stringify({ property, track: index })}
      title={door.title}
      onSubmit={(event) => {
        event.preventDefault();
        keep();
      }}
    >
      <span className="field-row__label">{t('inspector.grid.track')}</span>
      <input
        ref={input}
        className="input"
        role="spinbutton"
        inputMode="numeric"
        aria-label={`${t('inspector.grid.track')} ${String(index + 1)}`}
        spellCheck={false}
        disabled={!door.available}
        onInput={() => { draft.current = true; }}
        onBlur={keep}
      />
    </form>
  );
}

// The shorthand of a paired property edits both cells at once. It is a compact
// third control on their shared line, so the property label appears only once.
function PairShorthand({ entry }: { readonly entry: DoorEntry }) {
  const store = useStore();
  const t = useT();
  const [value, setValue] = useState('');
  const door = useDoor(entry, {}, t(fieldLabelKey(entry)), isFeatureBuilt(entry.door.feature as FeatureId));
  const property = entry.door.kind === 'inspector-field' ? entry.door.composite : null;
  if (property === null) return null;
  const keep = () => {
    const typed = value.trim();
    if (!door.available || typed === '') return;
    (store.dispatch as (id: CommandId, args: unknown) => DispatchResult)(entry.command.id, { ...entry.door.args, property, value: typed });
    setValue('');
  };
  return (
    <form className="input-wrap" data-door={entry.ref} data-args={JSON.stringify({ property })} title={door.title} onSubmit={(event) => { event.preventDefault(); keep(); }}>
      <input className="input" aria-label={t(fieldLabelKey(entry))} disabled={!door.available} value={value} onChange={(event) => setValue(event.target.value)} onBlur={keep} spellCheck={false} />
    </form>
  );
}

// The sides of a box in the order a box composite lists its longhands (CSS Box 3: top, right, bottom, left), each named
// as CSS Logical Properties name it in a horizontal, top-to-bottom writing mode; the side argument of style.setSpacing.
const BOX_SIDES = ['block-start', 'inline-end', 'block-end', 'inline-start'] as const;
// the link of a box (inspector.toggleSpacingLink): the style region's control whose command takes a box and nothing else
const SPACING_LINK = doorSlots('inspector-style').find((d) => d.door.kind === 'panel-control' && d.door.drawnAs === 'icon-button' && Object.keys(d.command.args).join() === 'box');

// A field of the box model (spec props-spacing): one side of a box, or, while the box is linked, its four sides. It shows
// the value the primary selected element holds (the four sides' when they agree, else nothing), else the value the page
// computes; it is the one field of a form of its own, so Enter submits it and keeps what it holds with its door's command
// (style.setSpacing, with its box and sides), as leaving it with typing not kept yet does (one undo step).
// the key context of a side of the box, whose Escape (field.cancel for the box: the form stands for it as `property`)
// puts back the value the document holds; the message it gives rewrites the side, so leaving it writes nothing (spec
// inspector-number-fields, Problems in Pager 4)
const SPACING_KEYS: KeyContextId = 'spacing-field';
function SpacingField({ entry, box, sides, properties, where, label }: { readonly entry: DoorEntry; readonly box: string; readonly sides: string; readonly properties: readonly string[]; readonly where: string; readonly label: string }) {
  const store = useStore();
  const door = useDoor(entry, { box, sides }, label, isFeatureBuilt(entry.door.feature as FeatureId));
  const primary = useEditorState((st) => st.selection[0] ?? null);
  const stored = useEditorState((st) => {
    const node = styleSource(st);
    if (!node) return undefined;
    const values = properties.map((p) => storedValue(node, p, layeredRules(st.ui)));
    return values.some((v) => v === undefined) ? undefined : new Set(values).size === 1 ? values[0] : '';
  });
  // the document's value, else nothing; the effective value (one the sides share) is the placeholder (spec
  // inspector-provenance-reset, Problems in Pager 4)
  const effectiveSides = useEffectiveText(properties[0] ?? '', properties, stored !== undefined);
  const effective = new Set(effectiveSides.split(' ')).size === 1 ? effectiveSides : '';
  // several elements with different values, or four sides that differ: said Mixed, as every field says it (A3.35)
  const mixed = useMixed(properties) || stored === '';
  const appearance = useFieldAppearance(properties, mixed);
  const t = useT();
  const shown = mixed ? '' : (stored ?? '');
  const said = useEditorState((st) => st.message);
  const field = useRef<HTMLInputElement>(null);
  const typed = useRef(false);
  const command = entry.command.id;
  useEffect(() => {
    if (field.current === null) return;
    field.current.value = shown;
    typed.current = false;
  }, [shown, said]);
  const keep = () => {
    const element = field.current;
    if (element === null || !typed.current) return;
    typed.current = false;
    const value = element.value;
    keepAfterGesture(() => {
      if (store.getState().selection.length === 0) return;
      (store.dispatch as (id: CommandId, args: unknown) => DispatchResult)(command, { box, sides, value });
    });
  };
  return (
    <form
      className={`box__side box__side--${where}`}
      data-origin={appearance.kind}
      data-door={entry.ref}
      data-args={JSON.stringify({ box, sides, property: box })}
      title={door.title}
      onSubmit={(event) => {
        event.preventDefault();
        keep();
      }}
    >
      <input
        ref={field}
        className="box__input"
        disabled={!door.available || primary === null}
        aria-label={door.label}
        spellCheck={false}
        placeholder={mixed ? t('inspector.mixedValue') : effective || undefined}
        onInput={() => {
          typed.current = true;
        }}
        onBlur={keep}
        data-key-context={SPACING_KEYS}
      />
      <span className="box__rest-value" aria-hidden="true">{mixed ? t('inspector.mixedValue') : compactFieldValue(shown || effective, true).value}</span>
    </form>
  );
}

// The innermost cell of the box model (DESIGN.md "Sections", the design's centre): the selection's own measured size,
// in page pixels whatever the zoom — the number a person compares the Width and Height fields against — or, with
// several elements selected, how many there are. Nothing with nothing selected.
function BoxCore() {
  const t = useT();
  const count = useEditorState((s) => s.selection.length);
  const primary = useEditorState((s) => (s.selection.length === 1 ? (s.selection[0] ?? null) : null));
  const size = usePrimarySize(primary);
  const words = size !== null ? t('statusBar.size', { width: size.width, height: size.height }) : count > 1 ? t('inspector.elementCount', { count }) : '';
  return <span className="box__core">{words}</span>;
}

// The box model (DESIGN.md "Sections": margin outside, padding inside): the composites drawn as a box model
// (properties.json control box-model), each a box around the next in their placement order, the first outermost. Each
// box has its label and its link (inspector.toggleSpacingLink); unlinked, a field on each side writes that side's
// longhand; linked, one field (the box's own door) writes its four sides. No property is named here.
// no box linked (one value, so the selector returns the same list while nothing changes)
const NO_LINKS: readonly string[] = [];
function BoxModel({ doors }: { readonly doors: readonly DoorEntry[] }) {
  const t = useT();
  const links = useEditorState((st) => st.ui.preferences.spacingLinks ?? NO_LINKS);
  const boxes = doors.filter((d) => d.door.kind === 'inspector-field' && d.door.composite !== null);
  const sideField = (css: string | undefined) => doors.find((d) => d.door.kind === 'inspector-field' && d.door.property === css);
  const draw = (level: number): ReactNode => {
    const box = boxes[level];
    const target = box ? targetOf(box) : null;
    if (!box || !target) return <BoxCore />;
    const linked = (links as readonly string[]).includes(target.id);
    const longhands = target.longhands ?? [];
    const side = (where: (typeof BOX_SIDES)[number]) => {
      const index = BOX_SIDES.indexOf(where);
      const css = longhands[index];
      const entry = sideField(css);
      const label = css !== undefined ? TARGETS.get(css)?.labelKey : undefined;
      // the side a longhand is: its name after the box's (padding-top: top), a value of style.setSpacing's sides
      return entry && css ? <SpacingField key={entry.ref} entry={entry} box={target.id} sides={css.slice(target.id.length + 1)} properties={[css]} where={where} label={label !== undefined ? t(label as MessageId) : css} /> : null;
    };
    return (
      <div className={`box box--${target.id}${linked ? ' is-linked' : ''}`}>
        {/* the box's label stands for its composite door while the box is unlinked; linked, the four sides' field does */}
        <span className="box__label" data-door={linked ? undefined : box.ref} data-args={linked ? undefined : JSON.stringify({ box: target.id, sides: 'all' })}>
          {t(target.labelKey as MessageId)}
        </span>
        {/* its own name: "Link the four sides of Margin", "… of Padding" (A3.35) */}
        {SPACING_LINK ? <DoorControl entry={SPACING_LINK} args={{ box: target.id }} className="box__link" label={t('inspector.spacing.linkBox', { box: { key: target.labelKey as MessageId } })} /> : null}
        {linked ? (
          <SpacingField entry={box} box={target.id} sides="all" properties={longhands} where="all" label={t(target.labelKey as MessageId)} />
        ) : (
          <>
            {side('block-start')}
            {side('inline-start')}
          </>
        )}
        {draw(level + 1)}
        {linked ? null : (
          <>
            {side('inline-end')}
            {side('block-end')}
          </>
        )}
      </div>
    );
  };
  return draw(0);
}

// The section header (the disclosure door of inspector-style) and every door after it, in its section; an editor
// control sits in the section of the field before it. A section with no Style field (Content: its fields are in the
// Settings tab; Interactions: its own tab) is not a Style section.
const SECTION_HEADER = doorSlots('inspector-style').find((d) => d.door.kind === 'panel-control' && d.door.drawnAs === 'disclosure');
// Find a property's field (spec inspector-property-search): the region's search field
const FOUND_SEARCH = doorSlots('inspector-style').find((d) => d.door.kind === 'panel-control' && d.door.control === 'search-field');
if (FOUND_SEARCH === undefined) throw new Error('inspector-style has no search field');
const PROPERTY_SEARCH: DoorEntry = FOUND_SEARCH;
// the CSS names a door of the Style tab edits, for the search: a field's property (a composite with its longhands), an
// editor control's writes
const cssNamesOf = (entry: DoorEntry): readonly string[] => {
  const target = editedTarget(entry);
  return target !== null ? [target, ...editedProperties(target)] : entry.door.adapter.writes;
};
const SECTION_DOORS = (() => {
  const headerOrder = SECTION_HEADER && typeof SECTION_HEADER.door.placement === 'object' ? SECTION_HEADER.door.placement.order : 0;
  const bySection = new Map<string, DoorEntry[]>();
  let section: string = SECTIONS[0]?.id ?? '';
  for (const slot of slotsIn('inspector-style')) {
    // Find a property is drawn above the sections, not in one
    if (slot.kind !== 'door' || slot.order <= headerOrder || slot.entry === PROPERTY_SEARCH) continue;
    section = sectionOf(slot.entry) ?? section;
    const list = bySection.get(section) ?? [];
    list.push(slot.entry);
    bySection.set(section, list);
  }
  return bySection;
})();
const STYLE_SECTIONS = SECTIONS.filter((s) => (SECTION_DOORS.get(s.id) ?? []).length > 0);

// The section header's origin dot (DESIGN.md "Inspector", the value-origin legend; the mockup's .has mark): where the
// values the section holds come from, read by inspector/origin.ts over every
// field in that section. Its marks stay visible when the section is closed.
function SectionOrigin({ section }: { readonly section: SectionId }) {
  const kinds = useEditorState((s) => {
    const found = new Set(sectionProperties(section).map((property) => valueOrigin(s, [property], layeredRules(s.ui))?.kind));
    return ['here', 'breakpoint', 'state', 'class', 'inherited'].filter((kind) => found.has(kind as 'here' | 'breakpoint' | 'state' | 'class' | 'inherited')).join(' ');
  });
  return <>{kinds.split(' ').filter(Boolean).map((kind) => <span key={kind} className="inspector-section__origin" data-origin={kind} aria-hidden="true" />)}</>;
}

function StyleSections() {
  const t = useT();
  const locale = useLocale();
  // The sections drawn collapsed: the user's own collapses and openings (the preferences), and, for a section nobody
  // has touched, whether the edit target holds a value in it — the element, or the class while a class is the target
  // (sections.ts authoredProperties). As one text, so the hook's answer is stable while nothing changes.
  const collapsedText = useEditorState((s) => {
    const held = authoredProperties(s);
    return STYLE_SECTIONS.filter((section) => sectionClosed(s.ui, section.id as SectionId, held))
      .map((section) => section.id)
      .join(' ');
  });
  const collapsed = useMemo(() => collapsedText.split(' ').filter((id) => id !== '') as readonly SectionId[], [collapsedText]);
  // the one selected element, whose values a collapsed section summarises
  const only = useEditorState((s) => (s.selection.length === 1 ? (s.selection[0] ?? null) : null));
  const properties = useMemo(() => collapsed.flatMap((section) => summaryProperties(section)), [collapsed]);
  const values = usePageValues(only, properties);
  const node = useSingleNode();
  const mode = useEditorState((s) => inspectorMode(s.ui));
  const revealed = useEditorState((s) => s.ui.revealed?.field ?? null);
  const kinds = useSelectionKinds();
  const context = useSelectionContext();
  // Find a property's query: every section keeps only its matching fields, in either mode (spec
  // inspector-property-search)
  const query = useEditorState((s) => inspectorSearchOf(s.ui));
  const searching = query.trim() !== '';
  // What the edit target holds a value of, in any layer: the element, or the class while a class is the target. One
  // text, so the hook's answer is stable while nothing changes; the Essentials filter and the headers' counts read it
  // (the interface audit, findings F05 and F17).
  const heldText = useEditorState((s) => [...authoredProperties(s)].sort().join(' '));
  const held = useMemo(() => new Set(heldText.split(' ').filter((property) => property !== '')), [heldText]);
  const shownDoors = (section: string) =>
    (SECTION_DOORS.get(section) ?? []).filter((d) => shownForSelection(d, kinds, context) && (searching ? searchMatches(query, t(fieldLabelKey(d)), cssNamesOf(d)) : mode === 'all' || shownInEssentials(d, held, revealed)));
  if (searching && STYLE_SECTIONS.every((s) => shownDoors(s.id).length === 0)) return <p className="inspector-search__none">{t('inspector.searchNoMatch', { query: query.trim() })}</p>;
  return (
    <>
      {STYLE_SECTIONS.map((s) => {
        const section = s.id as SectionId;
        // the fields of a section are drawn group by group (rows.ts): the section's groups in the order properties.json
        // declares them, the manifest's placement order inside each group
        const doors = orderByGroup(s.id, shownDoors(s.id));
        // A shorthand with the same name and longhands as a complete pair row
        // edits both values together. Keep its command as a compact control on
        // the pair instead of drawing a second property row (for example Gap).
        const shorthand = new Set(doors.filter((door) => {
          const composite = door.door.kind === 'inspector-field' ? door.door.composite : null;
          if (composite === null) return false;
          return PAIR_ROWS.some((row) => row.section === s.id && row.labelKey === fieldLabelKey(door)
            && row.fields.length === door.door.adapter.writes.length
            && row.fields.every((field) => door.door.adapter.writes.includes(field.target)
              && doors.some((other) => other !== door && editedTarget(other) === field.target)));
        }).map((door) => door.ref));
        // a section with no match is not drawn while searching
        if (searching && doors.length === 0) return null;
        const set = sectionProperties(section).filter((p) => held.has(p)).length;
        // a collapsed section with a match is drawn open for the search; its collapsed state is kept
        const closed = !searching && collapsed.includes(section);
        const summary = closed ? summaryOf(section, values, t, locale) : null;
        const boxDoors = doors.filter((d) => targetOf(d)?.control === 'box-model');
        // The manifest orders the fields by group; the design draws the fields without subgroup headings.
        const units: ReactNode[] = [];
        const rowDrawn = new Set<string>();
        const shorthandDrawn = new Set<string>();
        // the fields of a pair row this section draws, in the row's own order; a row with one field left keeps a field
        const pairMembers = (row: PairRow): readonly DoorEntry[] => row.fields.map((f) => doors.find((x) => editedTarget(x) === f.target)).filter((x): x is DoorEntry => x !== undefined);
        // the shorthand a row draws at its end: a door of this section whose command writes exactly the row's targets
        const bulkOf = (row: PairRow): DoorEntry | undefined => doors.find((candidate) => shorthand.has(candidate.ref)
          && candidate.door.adapter.writes.length === row.fields.length
          && row.fields.every((field) => candidate.door.adapter.writes.includes(field.target)));
        // Every shorthand a pair row will draw is claimed before the loop: the manifest's order decides which comes
        // first, and a shorthand door drawn on its own here would draw a second time inside the row it belongs to
        // (the pair's shorthand, the user's real-use audit, item 5.1). Only the shorthand is claimed here — the loop
        // still draws each row where its first member stands.
        for (const d of doors) {
          const target = editedTarget(d);
          const row = target === null ? null : pairRowOf(target);
          if (row === null || pairMembers(row).length < 2) continue;
          const bulk = bulkOf(row);
          if (bulk !== undefined) shorthandDrawn.add(bulk.ref);
        }
        const drawer = (d: DoorEntry): ReactNode => {
          if (targetOf(d)?.control === 'box-model') return boxDoors[0] === d ? <BoxModel key={d.ref} doors={boxDoors} /> : null;
          if (d.door.kind === 'panel-control' && d.door.drawnAs === 'field' && cssTextArg(d) !== null && node !== null) return <DeclarationsField key={`${d.ref}@${node.id}`} entry={d} node={node} />;
          if (d === SPACING_LINK) return null;
          // a grid item's start or span: its own field
          if (d.door.kind === 'panel-control' && d.door.control === 'grid-item-field') {
            const half = d.ref.endsWith('-span') ? 'span' : 'start';
            return <GridItemField key={d.ref} entry={d} half={half} />;
          }
          // the grid's tracks are one editor per axis, drawn at the first of its own doors (the door names the
          // axis it edits); the raw value keeps its field
          const axis = typeof d.door.args.property === 'string' ? d.door.args.property : null;
          const trackDoors = axis === null ? [] : TRACK_DOORS.filter((x) => x.door.args.property === axis);
          if (trackDoors.includes(d)) return trackDoors[0] === d ? <GridTracks key={d.ref} entry={d} /> : null;
          if (d.door.kind === 'panel-control' && d.door.control === ANCHOR_CONTROL) return <AnchorControl key={d.ref} entry={d} />;
          if (d.door.kind === 'panel-control') return <Fragment key={d.ref}>{d.door.drawnAs === 'icon-button' ? <DoorControl entry={d} /> : <PanelField entry={d} />}</Fragment>;
          return (
            <Fragment key={d.ref}>
              <Field entry={d} />
              <FieldOrigin entry={d} target={editedTarget(d)} />
            </Fragment>
          );
        };
        for (const d of doors) {
          if (shorthand.has(d.ref)) {
            if (!shorthandDrawn.has(d.ref)) units.push(<Fragment key={d.ref}>{drawer(d)}</Fragment>);
            continue;
          }
          const target = editedTarget(d);
          const row = searching || target === null ? null : pairRowOf(target);
          if (row === null || rowDrawn.has(d.ref)) {
            if (row === null) units.push(<Fragment key={d.ref}>{drawer(d)}</Fragment>);
            continue;
          }
          // the fields of the row this section draws, in the row's own order; a row with one field left keeps a row
          const members = pairMembers(row);
          if (members.length < 2) {
            units.push(<Fragment key={d.ref}>{drawer(d)}</Fragment>);
            continue;
          }
          for (const m of members) rowDrawn.add(m.ref);
          const bulk = bulkOf(row);
          const rowSet = members.some((m) => { const t2 = editedTarget(m); return t2 !== null && editedProperties(t2).some((p) => held.has(p)); });
          units.push(
            <Fragment key={row.id}>
              {/* The first column names the concept; compact prefixes distinguish the second value. */}
              <div className={bulk === undefined ? undefined : 'field-row-pair-wrap'}>
                <div className={`field-row field-row--pair${rowSet ? ' is-set' : ''}`} data-pair={row.id} data-number-field={rowSet || members.some((m) => targetOf(m)?.control === 'length-field') ? true : undefined}>
                  {members.map((m, index) => {
                    const prefixKey = rowPrefixKey(row, editedTarget(m) ?? '');
                    return <Field key={m.ref} entry={m} bare labelled={index === 0} rowLabel={index === 0 ? row.labelKey : null} prefix={prefixKey === null ? null : t(prefixKey)} measurement={row.fields.find((field) => field.target === editedTarget(m))?.measurement} />;
                  })}
                </div>
                {bulk === undefined ? null : <div className="field-row__shorthand"><PairShorthand entry={bulk} /></div>}
              </div>
              {members.map((m) => <FieldOrigin key={`${m.ref}-origin`} entry={m} target={editedTarget(m)} />)}
            </Fragment>,
          );
        }
        return (
          <section key={s.id} className="inspector-section" data-section={section} aria-label={t(s.labelKey as MessageId)}>
            {SECTION_HEADER ? (
              <DoorControl entry={SECTION_HEADER} args={{ section }} expanded={!closed} className="inspector-section__header">
                <span className="door__label">{t(s.labelKey as MessageId)}</span>
                <SectionOrigin section={section} />
                {summary !== null ? <span className="inspector-section__summary">{summary}</span> : null}
                {set > 0 ? <span className="inspector-section__count">{t('inspector.valuesSet', { count: set })}</span> : null}
              </DoorControl>
            ) : null}
            {closed ? null : units}
          </section>
        );
      })}
    </>
  );
}

// Find a property (spec inspector-property-search): each change runs inspector.search with what the field holds; Enter
// keeps it (the form submits nothing)
function PropertySearch() {
  const store = useStore();
  const query = useEditorState((s) => inspectorSearchOf(s.ui));
  const door = useDoor(PROPERTY_SEARCH);
  const change = (value: string) => {
    if (door.built) (store.dispatch as (id: CommandId, args: unknown) => DispatchResult)(PROPERTY_SEARCH.command.id, { ...PROPERTY_SEARCH.door.args, query: value });
  };
  return (
    <form className="inspector-search" data-door={PROPERTY_SEARCH.ref} data-args="{}" onSubmit={(event) => event.preventDefault()}>
      {PROPERTY_SEARCH.door.icon !== null ? <Icon name={PROPERTY_SEARCH.door.icon} size="sm" /> : null}
      <input className="search" type="search" placeholder={door.label} aria-label={door.label} title={door.title} disabled={!door.built} spellCheck={false} autoComplete="off" value={query} onChange={(event) => change(event.currentTarget.value)} />
    </form>
  );
}

// the property, composite or recipe a door of the Style tab edits, or null (an editor control)
function editedTarget(entry: DoorEntry): string | null {
  if (entry.door.kind !== 'inspector-field') return null;
  return entry.door.property ?? entry.door.composite ?? entry.door.recipe ?? null;
}
// Whether the essentials mode draws a door (spec inspector-advanced-mode): an editor control always; a field when its
// property is one of the essentials, when the element holds a value of it, or when it was just revealed.
function shownInEssentials(entry: DoorEntry, held: ReadonlySet<string>, revealed: string | null): boolean {
  const target = editedTarget(entry);
  if (target === null) return true;
  return isEssential(target) || target === revealed || editedProperties(target).some((p) => held.has(p));
}
// The anchor control (spec absolute-anchors, Problems in Pager 2): per axis, the start edge, the centre, the end edge
// and both edges, each the control's door standing for that edge set (position.setAnchors, mode set), the anchors held
// drawn pressed; disabled while the selection is not positioned.
const ANCHOR_CONTROL = 'anchor-control';
// the rows follow position.setAnchors's edges in the manifest's order: left, right, top, bottom, the two centres, the two
// stretches; a door's label is its edge's (command.anchor.<edge in camel case>)
const camel = (edge: string) => edge.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
function anchorRows(entry: DoorEntry): readonly (readonly string[])[] {
  const [left = '', right = '', top = '', bottom = '', horizontalCenter = '', verticalCenter = '', horizontalStretch = '', verticalStretch = ''] = entry.command.args.edge?.values ?? [];
  return [
    [left, horizontalCenter, right, horizontalStretch],
    [top, verticalCenter, bottom, verticalStretch],
  ];
}
function AnchorControl({ entry }: { readonly entry: DoorEntry }) {
  const t = useT();
  const ready = isFeatureBuilt(entry.door.feature as FeatureId);
  return (
    <div className="field-row anchor-control" role="group" aria-label={t('anchors.title')}>
      <span className="field-row__label">{t('anchors.title')}</span>
      <div className="anchor-control__rows">
        {anchorRows(entry).map((row, i) => (
          <div key={i} className="segmented segmented--wide">
            {row.map((edge) => (
              <DoorControl key={edge} entry={entry} args={{ edge, mode: 'set' }} label={t(`command.anchor.${camel(edge)}` as MessageId)} className="anchor-control__item" ready={ready} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// The kinds of element every selected element is of (core/style/applies.ts), as one text so the hook's answer is stable.
const useSelectionKinds = (): readonly string[] =>
  useEditorState((s) => kindsOf(s.selection.flatMap((id) => locate(s.document, id)?.node ?? []), MODEL_RULES).join(' '))
    .split(' ')
    .filter((kind) => kind !== '');
// Whether a door of the Style tab is drawn for the selection (spec props-element-specific): a field of a kind of element
// (a table's, a list's, a form control's, a medium's) only while every selected element is of that kind, and a field of
// a layout the element is in (a flex container's, an item's) only while the page computes that layout for it.
function shownForSelection(entry: DoorEntry, kinds: readonly string[], context: ElementContext | null): boolean {
  const target = editedTarget(entry);
  // a field names its property, composite or recipe; an editor control (the alignment matrix) is named by the manifest
  // entries whose doors list it, so the same rules read it
  const properties = target !== null ? editedProperties(target) : editedPropertiesByDoor(entry.ref);
  if (properties === null) return true;
  // with nothing selected the section is a map of what the panel holds, drawn collapsed (item 5.1): a field of a kind
  // is not filtered out for want of an element of that kind, which would leave the section's header undrawn
  if (kinds.length === 0) return shownForContext(properties, context, MODEL_RULES);
  return shownForKinds(properties, kinds, MODEL_RULES) && shownForContext(properties, context, MODEL_RULES);
}


// The Add a property button (spec inspector-add-property): it opens the list of the properties the Style tab does not
// draw now (essentials mode), filtered by what is typed; choosing one reveals its field (inspector.reveal), which takes
// the focus. The button and each item are the reveal door, the items standing for their property. The list closes as
// every menu does (Problems in Pager 4): a dismissal newer than its opening (Escape in its filter or on an item, a press
// on the backdrop drawn under it) closes it, and the focus goes back to the button.
const REVEAL = doorSlots('inspector-style').find((d) => d.door.kind === 'panel-control' && d.door.control === 'add-property-item');
const ADD_PROPERTY_BACKDROP = doorSlots('overlay')[0];
function AddProperty() {
  const t = useT();
  const context = useSelectionContext();
  // the number of dismissals when the list was opened, or null while it is closed
  const dismissals = useEditorState((s) => s.ui.overlays.dismissals);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const open = openedAt !== null && openedAt === dismissals;
  const dismissed = openedAt !== null && !open;
  const setOpen = (next: boolean) => setOpenedAt(next ? dismissals : null);
  const [query, setQuery] = useState('');
  // opened, the list's filter takes the focus (spec inspector-add-property, Problems in Pager 3)
  const filter = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) filter.current?.focus();
  }, [open]);
  // dismissed, the focus that went down with the list goes back to its button
  useEffect(() => {
    if (dismissed && (document.activeElement === null || document.activeElement === document.body)) button.current?.focus();
  }, [dismissed]);
  const listId = useId();
  const mode = useEditorState((s) => inspectorMode(s.ui));
  const revealed = useEditorState((s) => s.ui.revealed?.field ?? null);
  const node = useSingleNode();
  const kinds = useSelectionKinds();
  // what the edit target holds: the element, or the class while a class is the target (findings F05 and F17), so a
  // property the class already sets is never offered as one to add
  const heldText = useEditorState((s) => [...authoredProperties(s)].sort().join(' '));
  const held = useMemo(() => new Set(heldText.split(' ').filter((property) => property !== '')), [heldText]);
  // the first property listed is the marked one after every change of the list (what is typed, the selection)
  const kindsKey = kinds.join(' ');
  useLayoutEffect(() => {
    const input = filter.current;
    const options = [...(list.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    if (open && input) setActiveOption(input, options, options.length > 0 ? 0 : null);
  }, [open, query, mode, revealed, node, kindsKey]);
  const door = useDoor(REVEAL ?? (manifest.doors[0] as DoorEntry), {}, t('inspector.addProperty'), REVEAL !== undefined && isFeatureBuilt(REVEAL.door.feature as FeatureId));
  if (REVEAL === undefined) return null;
  // the properties the panel hides in essentials mode, listed in the catalogue's own order (properties.json): the
  // doors' placement order is the order the panel draws them, not the order a person reads a list of properties in
  // (spec add-property-focus reads the list's first two entries, font-style and font-stretch, as the catalogue has them)
  const hiddenTargets = new Set(
    SECTIONS.flatMap((s) => SECTION_DOORS.get(s.id) ?? [])
      .filter((d) => shownForSelection(d, kinds, context) && !shownInEssentials(d, held, revealed))
      .flatMap((d) => editedTarget(d) ?? []),
  );
  const hidden =
    mode === 'all'
      ? []
      : manifest.properties.properties
          .map((property) => property.id)
          .filter((target) => {
            if (!hiddenTargets.has(target)) return false;
            const label = TARGETS.get(target)?.labelKey;
            const words = `${label === undefined ? '' : t(label as MessageId)} ${target}`.toLowerCase();
            return words.includes(query.trim().toLowerCase());
          });
  return (
    <div className="add-property">
      <button ref={button} type="button" className={`door door--icon-button${door.available ? '' : ' is-unavailable'}`} data-door={REVEAL.ref} data-args="{}" aria-haspopup="dialog" aria-expanded={open} aria-label={door.label} title={door.title} aria-disabled={door.available ? undefined : true} onClick={() => (door.available ? setOpen(!open) : undefined)}>
        {REVEAL.door.icon !== null ? <Icon name={REVEAL.door.icon} size="md" /> : null}
      </button>
      {/* the backdrop lies under the list and under "+", which closes the list as it opened it */}
      {open && ADD_PROPERTY_BACKDROP ? (
        <div className="add-property__backdrop">
          <DoorControl entry={ADD_PROPERTY_BACKDROP} className="overlay-backdrop" />
        </div>
      ) : null}
      {open ? (
        // a property chosen closes the list; its field takes the focus (inspector.reveal)
        <div ref={list} className="add-property__menu" role="dialog" aria-label={door.label} onClick={(event) => (event.target instanceof Element && event.target.closest('[data-door]') ? setOpen(false) : undefined)}>
          {/* the filter is a combobox of the menu key context: the arrows move the marked property, Enter chooses it */}
          <input
            ref={filter}
            className="input"
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label={t('inspector.addProperty.filter')}
            placeholder={t('inspector.addProperty.filter')}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            data-local="add-property-filter"
            data-key-context="menu"
          />
          {hidden.length === 0 ? <p className="add-property__none">{t('inspector.addProperty.none')}</p> : null}
          <div id={listId} role="listbox" aria-label={door.label} className="add-property__list">
            {hidden.map((target, i) => (
              <div key={target} id={`${listId}-${i}`} role="option" aria-selected="false">
                <DoorControl entry={REVEAL} args={{ property: target }} label={`${t((TARGETS.get(target)?.labelKey ?? '') as MessageId)} · ${target}`} className="add-property__item" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// The command argument a panel field's CSS text fills: its one text argument besides the node it stands for
// (style.setCustomDeclarations' declarations), when the command stands for a node; null otherwise.
function cssTextArg(entry: DoorEntry): string | null {
  const args = Object.entries(entry.command.args);
  if (!args.some(([name, arg]) => name === 'target' && arg.type === 'node')) return null;
  const text = args.filter(([name, arg]) => name !== 'target' && arg.type === 'string');
  return text.length === 1 ? (text[0] as [string, unknown])[0] : null;
}

// the node's declarations at the base breakpoint and state, "property: value;" each, on one line
function declarationsText(node: DocNode): string {
  const byState = (node.styles as Record<string, Record<string, Record<string, StoredValue>> | undefined>)[MODEL_RULES.base.breakpoint];
  // a structured value (a shadow's layers) as the page writes it
  return Object.entries(byState?.[MODEL_RULES.base.state] ?? {})
    .map(([property, value]) => `${property}: ${typeof value === 'string' ? value : structuredCss(value, MODEL_RULES.structures.get(property) ?? [])};`)
    .join(' ');
}

// The element's CSS declarations (style.setCustomDeclarations): a field showing what the element holds at the base
// breakpoint and state, the declarations separated by ";"; Enter (the field is the one field of its form, so Enter
// submits it) or leaving it (Tab, a click elsewhere, another selection) keeps what it holds for the node it was drawn
// for, one undo step, when it differs from what it last showed. A refused text is shown again as the document holds it
// after the command says why.
function DeclarationsField({ entry, node }: { readonly entry: DoorEntry; readonly node: DocNode }) {
  const store = useStore();
  const filled = cssTextArg(entry) ?? '';
  const args = useMemo(() => ({ target: node.id }), [node.id]);
  const door = useDoor(entry, args);
  const form = useRef<HTMLFormElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const shown = useRef('');
  const stored = declarationsText(node);
  const said = useEditorState((s) => s.message);
  const command = entry.command.id;
  useEffect(() => {
    if (field.current === null) return;
    field.current.value = stored;
    shown.current = stored;
  }, [stored, said]);
  useEffect(() => {
    const row = form.current;
    const element = field.current;
    if (row === null || element === null) return;
    const keep = () => {
      if (element.value === shown.current) return;
      shown.current = element.value;
      const text = element.value;
      keepAfterGesture(() => {
        if (locate(store.getState().document, args.target) === null) return;
        (store.dispatch as (id: CommandId, a: unknown) => DispatchResult)(command, { ...args, [filled]: text });
      });
    };
    const submit = (event: Event) => {
      event.preventDefault();
      keep();
    };
    row.addEventListener('submit', submit);
    element.addEventListener('blur', keep);
    return () => {
      row.removeEventListener('submit', submit);
      element.removeEventListener('blur', keep);
      keep();
    };
  }, [store, command, args, filled]);
  return (
    <form ref={form} className={`field-row field-row--wide${door.available ? '' : ' is-unavailable'}`} data-door={entry.ref} data-args={JSON.stringify(args)} title={door.title}>
      <span className="field-row__label">{door.label}</span>
      <input ref={field} className="input" disabled={!door.available} aria-label={door.label} spellCheck={false} />
    </form>
  );
}

// The alignment matrix (spec props-flex-container): three rows of three cells, each the matrix's door standing for
// where the cell is drawn (x across, y down: start, center, end), named from the catalogue; the cell standing for what
// the element holds is pressed.
const MATRIX_PLACES = ['start', 'center', 'end'] as const;
function MatrixCell({ entry, x, y, mixed }: { readonly entry: DoorEntry; readonly x: string; readonly y: string; readonly mixed: boolean }) {
  const t = useT();
  const name = t('inspector.alignment.cell', { x: { key: `inspector.alignment.x.${x}` as MessageId }, y: { key: `inspector.alignment.y.${y}` as MessageId } });
  return (
    <DoorControl entry={entry} args={{ x, y }} label={name} className="matrix__cell" current={mixed ? false : undefined} tabbable={mixed && x === MATRIX_PLACES[0] && y === MATRIX_PLACES[0]} roving={!mixed}>
      <span className="matrix__bars" aria-hidden="true" />
    </DoorControl>
  );
}
// several elements with different alignments: no cell pressed, and Mixed beside it, as every field says it (A3.35)
function AlignmentMatrix({ entry, label }: { readonly entry: DoorEntry; readonly label: string }) {
  const t = useT();
  const mixed = useMixed(entry.door.adapter.writes);
  return (
    <>
      <span className={`matrix${mixed ? ' is-mixed' : ''}`} role="group" aria-label={label} data-mixed={mixed ? '' : undefined}>
        {MATRIX_PLACES.flatMap((y) => MATRIX_PLACES.map((x) => <MatrixCell key={`${x}-${y}`} entry={entry} x={x} y={y} mixed={mixed} />))}
      </span>
      {mixed ? <span className="field-row__mixed">{t('inspector.mixedValue')}</span> : null}
    </>
  );
}

// an editor control of the Style tab that is not a property field (the alignment matrix, the anchors, the custom declarations)
function PanelField({ entry }: { readonly entry: DoorEntry }) {
  const door = useDoor(entry);
  return (
    <div className={`field-row${door.available ? '' : ' is-unavailable'}`} data-door={entry.ref} title={door.title}>
      <span className="field-row__label">{door.label}</span>
      {entry.door.kind === 'panel-control' && entry.door.control === 'alignment-matrix' ? (
        <AlignmentMatrix entry={entry} label={door.label} />
      ) : (
        <input className="input" disabled={!door.available} aria-label={door.label} />
      )}
    </div>
  );
}

// What the selector bar names (DESIGN.md "Inspector": the element's icon, name and tag): the one selected element,
// with its exported tag (the page root's is body); with several selected, how many; with none, that nothing is. Read
// from the store's selection, so the inspector never says something the store contradicts.
function SelectedElement() {
  const t = useT();
  const count = useEditorState((s) => s.selection.length);
  const node = useSingleNode();
  if (count > 1) return <div className="selector-bar__element">{t('canvas.selectedCount', { count })}</div>;
  if (node === null) return <div className="selector-bar__element">{t('inspector.nothingSelected')}</div>;
  return (
    <div className="selector-bar__element">
      <Icon name={elementIcon(node.type) ?? GLYPHS.folder} size="sm" />
      <span className="selector-bar__name">{node.name}</span>
      <small className="selector-bar__tag">{node.tag ?? ''}</small>
    </div>
  );
}


// The notice an element of an instance wears in the Style tab (the user's real-use audit, item A3.12): a style write
// there reaches the component and every copy of it, and the person is told before anything is typed.
function ComponentNotice() {
  const t = useT();
  // the store's own values (the selector returns what it holds, never a fresh object: the state subscription
  // compares them by identity)
  const document = useEditorState((s) => s.document);
  const only = useEditorState((s) => (s.selection.length === 1 ? (s.selection[0] ?? null) : null));
  if (only === null) return null;
  const root = instanceRootOf(document, only);
  const holders = componentHolders(document, only);
  if (root?.component === undefined || holders === null) return null;
  const copies = holders.length - 1;
  return (
    <p className="inspector-notice" role="note" data-region="inspector-component-notice">
      {copies === 1 ? t('inspector.componentNotice', { component: root.component }) : t('inspector.componentNoticeMany', { component: root.component, count: copies })}
    </p>
  );
}

// The Style tab: the selector bar, then its region, as tall as what it shows inside the scrolling column.
function StyleTab() {
  const t = useT();
  const none = useEditorState((s) => s.selection.length === 0);
  if (none) return (
    <>
      <SelectorBar />
      <div className="inspector-style" data-region="inspector-style">
        <div className="inspector-body inspector-body--empty"><Hints /></div>
        {/* the sections a person can open while nothing is selected: the panel is a map of what it holds, each
            section drawn collapsed, its own header reached by the pointer (item 5.1; spec box-model reads the Space
            section's header here) */}
        <div className="inspector-scroll">
          <div className="inspector-body">
            <div className="inspector-sections">
              <StyleSections />
            </div>
          </div>
        </div>
      </div>
    </>
  );
  return (
    <>
      <SelectorBar />
      <div className="inspector-style" data-region="inspector-style">
          <div className="inspector-controls">
            <ul className="legend">
              {ORIGINS.map((o) => (
                <li key={o.origin} className={`legend__item legend__item--${o.origin}`}>
                  {t(o.key)}
                </li>
              ))}
            </ul>
            <div className="inspector-mode">
              <div className="segmented segmented--wide" role="group">
                <Slots region="inspector-style" render={(slot) => (slot.kind === 'door' && slot.entry.door.kind === 'panel-control' && slot.entry.door.drawnAs === 'segment' ? undefined : null)} />
              </div>
            </div>
            <div className="inspector-searchline"><PropertySearch /><AddProperty /></div>
          </div>
        <div className="inspector-scroll">
        <div className="inspector-body">
          <ComponentNotice />
          <div className="inspector-sections">
            <StyleSections />
          </div>
        </div>
        </div>
      </div>
    </>
  );
}

// The body of each inspector tab the editor draws; the tab of any other is not available yet.
const TAB_BODIES: Readonly<Record<string, ComponentType>> = { style: StyleTab, settings: SettingsTab, interactions: InteractionsTab };

export function Inspector() {
  const t = useT();
  const open = useEditorState((s) => isPanelOpen(s.ui, 'inspector'));
  const tab = useEditorState((s) => inspectorTab(s.ui));
  if (!open) return null;
  const Body = TAB_BODIES[tab];
  return (
    <aside className="inspector" aria-label={t(panelName('inspector'))}>
      <div className="inspector-header" data-region="inspector-header">
        <div className="inspector-header__tabs" role="tablist">
          <Slots
            region="inspector-header"
            render={(slot) => {
              if (slot.kind !== 'door' || drawnAsOf(slot.entry) !== 'tab') return null;
              const panel = slot.entry.door.args.panel;
              return <DoorControl key={slot.entry.ref} entry={slot.entry} ready={typeof panel === 'string' && panel in TAB_BODIES} />;
            }}
          />
        </div>
        <span className="inspector-header__actions">
          <Slots region="inspector-header" render={(slot) => (slot.kind === 'door' && drawnAsOf(slot.entry) === 'tab' ? null : undefined)} />
        </span>
      </div>
      {Body ? <Body /> : null}
    </aside>
  );
}

// The selector bar of the Style tab (DESIGN.md "Inspector"): the selected element, its targets, the state picker and
// the active breakpoint.
function SelectorBar() {
  const t = useT();
  const none = useEditorState((s) => s.selection.length === 0);
  // the state and the breakpoint the editor edits (view/style-state.ts, view/breakpoints.ts)
  const state = useEditorState((s) => activeState(s.ui));
  const breakpoint = useEditorState((s) => activeBreakpoint(s.ui));
  const breakpointIcon = doorSlots('canvas-breakpoints').find((d) => d.door.args.breakpoint === breakpoint.id)?.door.icon ?? null;
  if (none) return <div className="selector-bar selector-bar--empty" data-region="inspector-selector-bar"><SelectedElement /></div>;
  return (
    <div className="selector-bar" data-region="inspector-selector-bar">
      <SelectedElement />
      <div className="selector-bar__targets">
        <TargetChips />
        <Slots
          region="inspector-selector-bar"
          render={(slot) => {
            if (slot.kind === 'menu') return null;
            const drawn = slot.entry.door.kind === 'panel-control' ? slot.entry.door.drawnAs : null;
            // the target chips and the × drawn inside them stand for the element's targets (TargetChips draws them)
            if (drawn === 'item' || slot.entry === CHIP_PART) return null;
            return classBarControl(slot.entry);
          }}
        />
      </div>
      <Affects />
      <div className="selector-bar__state" data-edited-state={state.id === MODEL_RULES.baseLayer.state ? 'base' : 'variant'}>
        <Slots
          region="inspector-selector-bar"
          render={(slot) =>
            slot.kind === 'menu' ? (
              <MenuButton key={slot.menu} menu={slot.menu} anchor={slot.anchor} indicator className="state-picker">
                <span className="state-picker__key">{t('menu.styleState')}</span>
                <span className="state-picker__value">{t(state.labelKey as MessageId)}</span>
              </MenuButton>
            ) : null
          }
        />
        <span className="active-breakpoint" data-variant={breakpoint.id !== MODEL_RULES.baseLayer.breakpoint ? 'true' : undefined} title={t('inspector.activeBreakpoint')}>
          {breakpointIcon !== null ? <Icon name={breakpointIcon} size="sm" /> : null}
          <span>{t(breakpoint.labelKey as MessageId)}</span>
          <span className="active-breakpoint__width">{breakpoint.width}</span>
        </span>
      </div>
    </div>
  );
}
