// The snap lines (spec snap-while-moving, Problems in Pager 4; spec smart-guides): while a free drag or a resize snaps,
// or aligns with smart guides on (canvas/snapping.ts), each axis draws a dashed line at the place it snapped to or
// aligns with, from the moving element to the target, and an element target (a sibling, the parent, the page) is
// outlined, so the person sees why; each equal gap is marked on both gaps with its value (Problems in Pager 2).
// Drawn over the page (the overlay), in the canvas chrome, never in the page.
import { pageShown } from '../../core/project/pages.ts';
import { useLayoutEffect, useState, useSyncExternalStore, type CSSProperties } from 'react';
import type { Snap, SnapLine } from '../../core/geometry/snap.ts';
import { useEditorState } from '../store.ts';
import { canvasFrame, geometryOf, pageLayout, pageToScreen } from './coordinates.ts';
import { snapShown, type Snapped } from './snapping.ts';

interface Drawn {
  readonly lines: readonly { readonly axis: string; readonly source: string; readonly value: number | null; readonly style: CSSProperties }[];
  readonly targets: readonly { readonly id: string; readonly style: CSSProperties }[];
  // the equal gaps: each marked from its start to its end, with its value
  readonly gaps: readonly { readonly axis: string; readonly value: number; readonly style: CSSProperties }[];
}

// A line's extent along the other axis (item 4.5: the whole alignment, not just the moving box): a target with a span
// reaches from the moving box to it; a line without one (a guide, a grid's line, a ruler tick) runs the page's whole
// side, which is the alignment it stands for.
function extent(line: SnapLine, snapped: Snapped, page: { readonly x: number; readonly y: number; readonly width: number; readonly height: number } | null): { readonly from: number; readonly to: number } {
  const [from, to] = line.axis === 'x' ? [snapped.box.y, snapped.box.y + snapped.box.height] : [snapped.box.x, snapped.box.x + snapped.box.width];
  if (line.span !== null) return { from: Math.min(from, line.span.from), to: Math.max(to, line.span.to) };
  if (page === null) return { from, to };
  return line.axis === 'x' ? { from: page.y, to: page.y + page.height } : { from: page.x, to: page.x + page.width };
}

export function SnapLines({ overlay }: { readonly overlay: { readonly current: HTMLDivElement | null } }) {
  const snapped = useSyncExternalStore(snapShown.subscribe, snapShown.get);
  const pageId = useEditorState((s) => pageShown(s)?.tree.id ?? null);
  const [drawn, setDrawn] = useState<Drawn | null>(null);
  useLayoutEffect(() => {
    const request = requestAnimationFrame(() => setDrawn(measure(snapped, overlay.current, pageId)));
    return () => cancelAnimationFrame(request);
  }, [snapped, overlay, pageId]);
  if (drawn === null) return null;
  return (
    <>
      {drawn.targets.map((target) => (
        <div key={target.id} className="snap-target" data-snap-target={target.id} style={target.style} />
      ))}
      {drawn.gaps.map((gap, i) => (
        <div key={`gap-${i}`} className={`equal-gap equal-gap--${gap.axis}`} data-equal-gap={gap.value} style={gap.style}>
          <span className="equal-gap__value">{gap.value}</span>
        </div>
      ))}
      {drawn.lines.map((line) => (
        <div key={line.axis} className={`snap-line snap-line--${line.axis}`} data-snap-line={line.axis} data-snap-source={line.source} style={line.style}>
          {line.value === null ? null : <span className="snap-line__value">{line.value}</span>}
        </div>
      ))}
    </>
  );
}

// where the lines and the outlined targets are drawn on the overlay, from the frame's geometry now
// the box of the element a line's target stands for (a sibling, the parent, the page), or null for a guide, a grid's
// line or a ruler tick
function targetBox(snap: Snap): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } | null {
  const target = snap.line.target;
  if (target === null || (snap.line.source !== 'element' && snap.line.source !== 'parent' && snap.line.source !== 'page')) return null;
  return pageLayout.box(target);
}

function measure(snapped: Snapped | null, overlay: HTMLDivElement | null, pageId: string | null): Drawn | null {
  const frame = canvasFrame();
  const g = frame ? geometryOf(frame) : null;
  const area = overlay?.getBoundingClientRect();
  if (snapped === null || g === null || area === undefined) return null;
  // the page's own box: what a line without a span (a guide, a grid's line, a ruler tick) runs along
  const page = pageId === null ? null : pageLayout.box(pageId);
  // a page point on the overlay
  const at = (x: number, y: number) => {
    const screen = pageToScreen({ x, y }, g);
    return { x: screen.x - area.x, y: screen.y - area.y };
  };
  const lines = [snapped.x, snapped.y].flatMap((snap) => {
    if (snap === null) return [];
    const { from, to } = extent(snap.line, snapped, page);
    const start = snap.line.axis === 'x' ? at(snap.line.at, from) : at(from, snap.line.at);
    const end = snap.line.axis === 'x' ? at(snap.line.at, to) : at(to, snap.line.at);
    const style: CSSProperties = snap.line.axis === 'x' ? { left: start.x, top: start.y, height: end.y - start.y } : { left: start.x, top: start.y, width: end.x - start.x };
    // what the line measures (item 4.5): the distance the moving box stands from an element target's near edge, or the
    // place itself for a guide, a grid's line or a ruler tick (which name no target box)
    const box = targetBox(snap);
    const value = box === null ? Math.round(snap.line.at) : Math.round(Math.abs(snap.offset));
    return [{ axis: snap.line.axis, source: snap.line.source, value, style }];
  });
  const targets = [snapped.x, snapped.y].flatMap((snap) => {
    const target = snap?.line.target ?? null;
    const box = target !== null && snap !== null && (snap.line.source === 'element' || snap.line.source === 'parent' || snap.line.source === 'page') ? pageLayout.box(target) : null;
    if (target === null || box === null) return [];
    const topLeft = at(box.x, box.y);
    return [{ id: target, style: { left: topLeft.x, top: topLeft.y, width: box.width * g.zoom, height: box.height * g.zoom } }];
  });
  const gaps = snapped.gaps.flatMap((g) =>
    g.marks.map((mark) => {
      const start = g.axis === 'x' ? at(mark.from, mark.across) : at(mark.across, mark.from);
      const end = g.axis === 'x' ? at(mark.to, mark.across) : at(mark.across, mark.to);
      const style: CSSProperties = g.axis === 'x' ? { left: start.x, top: start.y, width: end.x - start.x } : { left: start.x, top: start.y, height: end.y - start.y };
      return { axis: g.axis, value: Math.round(g.gap), style };
    }),
  );
  return { lines, targets: targets.filter((t, i) => targets.findIndex((o) => o.id === t.id) === i), gaps };
}
