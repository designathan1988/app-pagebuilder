// The compact resting face of a real field. The input keeps its full CSS value and its existing command wiring;
// this presentation separates the number, unit and origin without squeezing the editable value in paired rows.
import type { ReactNode } from 'react';
import type { MessageId } from '../../generated/ids.ts';
import { formatColor, parseColor } from '../../core/style/color.ts';
import { valueOrigin } from '../inspector/origin.ts';
import { layeredRules, useEditorState } from '../store.ts';
import { BREAKPOINTS } from '../view/breakpoints.ts';
import { useT } from '../text.ts';

export function useFieldAppearance(properties: readonly string[], mixed = false) {
  const t = useT();
  const source = useEditorState((state) => {
    const origin = valueOrigin(state, properties, layeredRules(state.ui));
    if (origin === null) return '';
    if (origin.kind === 'breakpoint') return `${origin.kind}|${origin.breakpoint}`;
    return origin.kind;
  });
  const [kind = '', breakpoint = ''] = source.split('|');
  const label = kind === 'inherited' ? t('inspector.legend.inherited')
    : kind === 'breakpoint' ? t((BREAKPOINTS.find((one) => one.id === breakpoint)?.labelKey ?? 'breakpoint.desktop') as MessageId)
    : null;
  return { kind: mixed ? 'mixed' : kind, label: mixed ? null : label };
}

export function compactFieldValue(text: string, numeric = false, colour = false): { value: string; unit: string } {
  if (colour) {
    const parsed = parseColor(text);
    if (parsed !== null && parsed.a === 1) return { value: formatColor(parsed).toUpperCase(), unit: '' };
  }
  const token = /^var\((--[^,)]+)\)$/.exec(text.trim());
  if (token !== null) return { value: token[1] ?? text, unit: '' };
  const number = numeric ? /^(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/i.exec(text.trim()) : null;
  return number === null ? { value: text, unit: '' } : { value: number[1] ?? text, unit: number[2] ?? '' };
}

export function FieldValueSlot({ children, value }: { readonly children: ReactNode; readonly value: string }) {
  return <span className="field__value-slot" title={value}>{children}<span className="field__rest-value" aria-hidden="true">{value}</span></span>;
}

export function FieldOriginBadge({ label }: { readonly label: string | null }) {
  return label === null ? null : <span className="field__origin-badge" aria-hidden="true">{label}</span>;
}
