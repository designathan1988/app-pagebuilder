// The study's session driver (jornada03, Phase 1): one Chrome (Playwright, channel "chrome") kept open for a whole
// persona session, driven one real gesture at a time over a local HTTP port, so the evaluator looks at each picture
// before choosing the next gesture, as a person does. It counts gestures and mouse travel, photographs every step, and
// a probe inside the page (every frame, the canvas iframe too) measures input→frame latency, the status bar's messages
// (refusals), console errors and the editor's incidents. Nothing here changes the app: it only uses the mouse, the
// keyboard, the file chooser, downloads, and reads (the read-only test port, the DOM).
//
//   node jornada03/scripts/driver.mjs            (port 5399; run in the background)
//   curl -s localhost:5399/<route> -d '<json>'   routes: open, begin, act, look, shot, end, close
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const APP = process.env.APP ?? 'http://localhost:5320/';
const ROOT = 'jornada03';
const REFUSAL = /refused|recusad|cannot|não pode|nothing matches|nada corresponde|not available|não disponível|já existe|already exists/i;

// the in-page probe: every frame records into the top window's log
const PROBE = () => {
  const top = window.top ?? window;
  // the log survives a reload of the tab (sessionStorage), so a reload mid-task loses nothing
  if (!top.__study) {
    let saved = null;
    try { saved = JSON.parse(top.sessionStorage.getItem('__study') ?? 'null'); } catch { saved = null; }
    top.__study = saved ?? { latency: [], messages: [], errors: [] };
    top.__study.reloads = (top.__study.reloads ?? -1) + 1;
    const keep = () => { try { top.sessionStorage.setItem('__study', JSON.stringify(top.__study)); } catch { /* full */ } };
    top.setInterval(keep, 500);
    // the editor's incidents, counted across reloads (the feed itself starts empty after one)
    let seen = 0;
    top.setInterval(() => {
      const list = top.__builderTestPort?.incidents?.() ?? [];
      if (list.length < seen) seen = 0;
      for (const one of list.slice(seen)) (top.__study.incidents ??= []).push(`${one.kind}: ${String(one.what).slice(0, 200)}`);
      seen = list.length;
    }, 400);
    top.addEventListener('pagehide', keep);
  }
  const log = top.__study;
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const sample = async (kind) => {
    const t0 = performance.now();
    await frame();
    log.latency.push({ kind, ms: Math.round((performance.now() - t0) * 10) / 10 });
  };
  addEventListener('pointerdown', () => void sample('pointer'), true);
  addEventListener('keydown', () => void sample('key'), true);
  const err = console.error.bind(console);
  console.error = (...a) => {
    log.errors.push(a.map(String).join(' ').slice(0, 300));
    err(...a);
  };
  addEventListener('error', (e) => log.errors.push(String(e.message).slice(0, 300)));
  if (window === top) {
    const watch = () => {
      const bar = document.querySelector('.status-bar__message');
      if (!bar) return setTimeout(watch, 300);
      let last = '';
      new MutationObserver(() => {
        const text = bar.textContent ?? '';
        if (text !== last) log.messages.push({ t: Math.round(performance.now()), text: (last = text) });
      }).observe(bar, { childList: true, characterData: true, subtree: true });
    };
    addEventListener('DOMContentLoaded', watch);
  }
};

let browser = null;
let context = null;
let page = null;
let session = null; // { persona, dir }
let task = null; // { id, persona, start, limitMs, steps, gestures, travel, last, downloads, uploads }

const json = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

async function snap(label) {
  const dir = path.join(ROOT, 'shots', task?.id ?? `${session.persona}-free`);
  fs.mkdirSync(dir, { recursive: true });
  const n = task ? ++task.steps : Date.now();
  const file = path.join(dir, `${String(n).padStart(3, '0')}-${String(label).replace(/[^a-z0-9-]+/gi, '-').slice(0, 50)}.png`);
  await page.screenshot({ path: file });
  return file;
}

const statusText = () => page.locator('.status-bar__message').innerText({ timeout: 1000 }).catch(() => '');

function count(kind, to) {
  if (!task) return;
  task.gestures[kind] = (task.gestures[kind] ?? 0) + 1;
  if (to && task.last) task.travel += Math.hypot(to.x - task.last.x, to.y - task.last.y);
  if (to) task.last = to;
}

async function act(a) {
  const m = page.mouse;
  const k = page.keyboard;
  const mods = a.mods ?? [];
  for (const mod of mods) await k.down(mod);
  try {
    switch (a.do) {
      case 'move':
        await m.move(a.x, a.y, { steps: 6 });
        count('move', a);
        break;
      case 'click': {
        const chooser = a.files ? page.waitForEvent('filechooser', { timeout: 8000 }) : null;
        const download = a.download ? page.waitForEvent('download', { timeout: 15000 }) : null;
        await m.move(a.x, a.y, { steps: 6 });
        await m.click(a.x, a.y, { button: a.button ?? 'left', clickCount: a.count ?? 1 });
        count(a.count === 2 ? 'dblclick' : a.button === 'right' ? 'rightclick' : 'click', a);
        if (chooser) {
          await (await chooser).setFiles(a.files);
          task && task.uploads.push(...a.files);
        }
        if (download) {
          const d = await download;
          const to = path.join(ROOT, 'data', 'downloads', `${task?.id ?? 'free'}-${d.suggestedFilename()}`);
          fs.mkdirSync(path.dirname(to), { recursive: true });
          await d.saveAs(to);
          task && task.downloads.push(to);
        }
        break;
      }
      case 'drag': {
        await m.move(a.from.x, a.from.y, { steps: 4 });
        await m.down();
        await m.move(a.from.x + 5, a.from.y + 5, { steps: 3 });
        await m.move(a.to.x, a.to.y, { steps: a.steps ?? 20 });
        await page.waitForTimeout(120);
        await m.up();
        count('drag', a.to);
        break;
      }
      case 'type':
        await k.type(a.text, { delay: 15 });
        task && (task.gestures.keys = (task.gestures.keys ?? 0) + a.text.length);
        break;
      case 'key':
        for (let i = 0; i < (a.repeat ?? 1); i += 1) await k.press(a.key);
        task && (task.gestures.keys = (task.gestures.keys ?? 0) + (a.repeat ?? 1));
        if (/z$/i.test(a.key) && /Control|Meta/.test(a.key) && !/Shift/.test(a.key)) task && (task.undos += a.repeat ?? 1);
        break;
      case 'wheel':
        await m.move(a.x, a.y);
        await m.wheel(a.dx ?? 0, a.dy ?? 0);
        count('wheel', a);
        break;
      case 'wait':
        await page.waitForTimeout(a.ms ?? 500);
        break;
      default:
        throw new Error(`unknown act ${a.do}`);
    }
  } finally {
    for (const mod of mods.reverse()) await k.up(mod);
  }
  await page.waitForTimeout(a.settle ?? 180);
}

// What a person scanning the screen sees: look.mjs, loaded again on every call so the instrument can be corrected
// without ending a session.
async function look(filter, max) {
  const { look: fresh } = await import(`./look.mjs?v=${Date.now()}`);
  return fresh(page, filter, max);
}

async function route(name, body) {
  switch (name) {
    case 'open': {
      if (browser) await browser.close();
      // one profile per persona, kept across driver restarts (the editor's autosave lives there); `fresh` starts it new
      const profile = path.join('.cache', 'study-profiles', body.persona);
      if (body.fresh) fs.rmSync(profile, { recursive: true, force: true });
      context = await chromium.launchPersistentContext(profile, { channel: 'chrome', viewport: { width: body.width ?? 1440, height: body.height ?? 900 }, colorScheme: body.scheme ?? 'dark', acceptDownloads: true });
      browser = { close: () => context.close() };
      await context.addInitScript(PROBE);
      page = context.pages()[0] ?? (await context.newPage());
      page.on('pageerror', (e) => page.evaluate((m) => window.__study?.errors.push(`pageerror ${m}`), String(e)).catch(() => {}));
      session = { persona: body.persona };
      await page.goto(APP);
      await page.locator('.workbench').waitFor();
      return { shot: await snap('open') };
    }
    case 'begin': {
      task = { id: body.id, persona: session.persona, start: Date.now(), limitMs: (body.limitMin ?? 10) * 60000, steps: 0, gestures: {}, travel: 0, last: null, undos: 0, downloads: [], uploads: [] };
      await page.evaluate(() => window.__study && Object.assign(window.__study, { latency: [], messages: [], errors: [], reloads: 0, incidents: [] }));
      task.history0 = await page.evaluate(() => window.__builderTestPort?.history()).catch(() => null);
      task.incidents0 = (await page.evaluate(() => window.__builderTestPort?.incidents()?.length ?? 0).catch(() => 0)) ?? 0;
      return { shot: await snap('begin'), limitMin: body.limitMin };
    }
    case 'act': {
      const list = Array.isArray(body) ? body : [body];
      for (const a of list) await act(a);
      const elapsed = task ? Math.round((Date.now() - task.start) / 1000) : null;
      const over = task ? Date.now() - task.start > task.limitMs : false;
      return { shot: await snap(list.map((a) => a.why ?? a.do).join('+')), status: await statusText(), elapsedS: elapsed, overLimit: over };
    }
    case 'look':
      return { items: await look(body.filter, body.max) };
    case 'read':
      // read-only facts a person would see or the test port reports (never used to act)
      return { value: await page.evaluate(body.expr) };
    case 'shot':
      return { shot: await snap(body.label ?? 'look'), status: await statusText() };
    case 'end': {
      const probe = await page.evaluate(() => window.__study ?? { latency: [], messages: [], errors: [] });
      const history = await page.evaluate(() => window.__builderTestPort?.history()).catch(() => null);
      const incidents = ((await page.evaluate(() => window.__builderTestPort?.incidents()?.length ?? 0).catch(() => 0)) ?? 0) - task.incidents0;
      const lat = probe.latency.map((l) => l.ms).sort((a, b) => a - b);
      const pct = (p) => (lat.length ? lat[Math.min(lat.length - 1, Math.floor((p / 100) * lat.length))] : null);
      const undoMessages = probe.messages.filter((m) => /^(undone|desfeito)/i.test(m.text)).length;
      const record = {
        id: task.id,
        persona: task.persona,
        result: body.result,
        seconds: Math.round((Date.now() - task.start) / 1000),
        limitSeconds: task.limitMs / 1000,
        gestures: task.gestures,
        gestureTotal: Object.entries(task.gestures).filter(([k]) => k !== 'move').reduce((s, [, v]) => s + v, 0),
        mouseTravelPx: Math.round(task.travel),
        undos: Math.max(task.undos, undoMessages),
        refusals: probe.messages.filter((m) => REFUSAL.test(m.text)).map((m) => m.text),
        messages: probe.messages.map((m) => m.text),
        consoleErrors: probe.errors,
        incidents,
        reloadsDuringTask: probe.reloads ?? 0,
        incidentsSeen: probe.incidents ?? [],
        latencyMs: { n: lat.length, p50: pct(50), p95: pct(95), max: lat.at(-1) ?? null },
        historyAtStart: task.history0,
        historyAtEnd: history,
        downloads: task.downloads,
        uploads: task.uploads,
        seq: body.seq ?? null,
        feel: body.feel ?? [],
        wish: body.wish ?? [],
        deadEnds: body.deadEnds ?? [],
        issues: body.issues ?? [],
        notes: body.notes ?? '',
        shots: path.join(ROOT, 'shots', task.id),
      };
      fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'data', `${task.id}.json`), `${JSON.stringify(record, null, 2)}\n`);
      task = null;
      return { saved: `${ROOT}/data/${record.id}.json`, seconds: record.seconds, gestureTotal: record.gestureTotal, refusals: record.refusals.length, latency: record.latencyMs };
    }
    case 'resize':
      await page.setViewportSize({ width: body.width, height: body.height });
      return { shot: await snap('resize') };
    case 'reload':
      await page.reload();
      await page.locator('.workbench').waitFor();
      count('reload');
      return { shot: await snap('reload') };
    case 'close':
      await browser?.close();
      browser = null;
      return { closed: true };
    default:
      throw new Error(`no route ${name}`);
  }
}

http
  .createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', async () => {
      try {
        json(res, 200, await route(req.url.replace(/^\//, ''), raw ? JSON.parse(raw) : {}));
      } catch (e) {
        json(res, 500, { error: String(e).split('\n')[0] });
      }
    });
  })
  .listen(Number(process.env.STUDY_PORT ?? 5399), () => console.log('study driver ready'));
