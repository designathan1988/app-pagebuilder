// Where a floating layer is drawn (the audit's S-002 and U-009: popups that ran off the window or over the panel's
// edge): under its anchor, from the anchor's start edge — or ending at its end edge when that would leave the window —
// above it when there is no room below, and always inside the window with `edge` pixels between it and the window's
// sides. One answer for every layer that floats next to something: a menu under its button, a popover under its
// trigger, the link prompt under the text toolbar, the context menu at the pointer (an anchor with no size).
export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Placed {
  readonly left: number;
  readonly top: number;
}

export function floatBelow(anchor: Box, size: Size, view: Size, edge: number, gap = 0): Placed {
  const fromStart = anchor.left + size.width + edge <= view.width;
  const left = fromStart ? anchor.left : anchor.right - size.width;
  const below = anchor.bottom + gap + size.height + edge <= view.height;
  const top = below ? anchor.bottom + gap : anchor.top - gap - size.height;
  return {
    left: Math.max(edge, Math.min(left, view.width - size.width - edge)),
    top: Math.max(edge, Math.min(top, view.height - size.height - edge)),
  };
}

// the point a layer opens at (the context menu at the pointer), as an anchor of no size
export const pointAnchor = (x: number, y: number): Box => ({ left: x, top: y, right: x, bottom: y });
