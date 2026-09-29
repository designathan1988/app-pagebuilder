// The measured size of an element, in page pixels (the status bar's readout, the box model's centre): the layout
// port's own box for it, re-measured on every frame while it is selected, and the same at any zoom — the number a
// person compares against the Width and Height fields (spec canvas-page-iframe; DESIGN.md "Sections", the box model).
import { useEffect, useState } from 'react';
import type { NodeId } from '../../generated/commands.ts';
import { pageLayout } from '../canvas/coordinates.ts';

export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

export function usePrimarySize(id: NodeId | null): ElementSize | null {
  const [size, setSize] = useState<ElementSize | null>(null);
  useEffect(() => {
    if (id === null) {
      setSize(null);
      return;
    }
    let frame = requestAnimationFrame(function measure() {
      const box = pageLayout.box(id);
      const next = box === null ? null : { width: Math.round(box.width), height: Math.round(box.height) };
      setSize((was) => (was?.width === next?.width && was?.height === next?.height ? was : next));
      frame = requestAnimationFrame(measure);
    });
    return () => cancelAnimationFrame(frame);
  }, [id]);
  return size;
}
