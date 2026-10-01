// What a person scanning the screen sees: the visible controls and texts with their boxes (for aiming), top window
// and canvas frame, at most `max`, optionally filtered by text.
export async function look(page, filter, max = 120) {
  const read = (f) => {
    const out = [];
    const offset = window.frameElement ? window.frameElement.getBoundingClientRect() : { left: 0, top: 0 };
    const zoom = window.frameElement ? window.frameElement.currentCSSZoom || 1 : 1;
    const sel = 'button, a, input, select, textarea, [role], summary, label, [data-door], h1, h2, h3, h4, p, span, li, img';
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      // only what a person can see: the element (or a part of it) is what stands at its centre, not clipped or covered
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (hit === null || !(hit === el || el.contains(hit) || hit.contains(el))) continue;
      if (window.frameElement) {
        const fr = window.frameElement.getBoundingClientRect();
        const cx = fr.left + (r.left + r.width / 2) * zoom;
        const cy = fr.top + (r.top + r.height / 2) * zoom;
        const topHit = window.top.document.elementFromPoint(cx, cy);
        // the canvas draws its overlay (selection chrome) over the frame: a point under it still shows the page
        if (topHit !== window.frameElement && !topHit?.closest('.frame__view')) continue;
      }
      const x = offset.left + r.left * zoom;
      const y = offset.top + r.top * zoom;
      if (x > innerWidth * (window.frameElement ? 10 : 1) || y > 2000) continue;
      const text = (el.getAttribute('aria-label') || el.getAttribute('title') || (el.childElementCount === 0 ? el.textContent : '') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 50);
      if (!text && !el.matches('input, select, textarea, img')) continue;
      if (f && !text.toLowerCase().includes(f.toLowerCase())) continue;
      out.push({ t: text, tag: el.localName, x: Math.round(x + (r.width * zoom) / 2), y: Math.round(y + (r.height * zoom) / 2), w: Math.round(r.width * zoom), h: Math.round(r.height * zoom), frame: Boolean(window.frameElement) });
    }
    return out;
  };
  const all = [];
  for (const frame of page.frames()) all.push(...(await frame.evaluate(read, filter ?? null).catch(() => [])));
  return all.filter((e) => e.y >= 0 && e.y <= (page.viewportSize()?.height ?? 900)).slice(0, max);
}

