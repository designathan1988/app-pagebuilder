// Phase 4 (jornada03): the scoreboard, computed from the task records alone (data/*.json), never by hand.
//  - pointer gestures = clicks + double clicks + right clicks + drags + wheel turns; keystrokes as recorded;
//  - committed changes = the editor's undo steps at the end minus at the start (work that stayed);
//  - refusals are recounted from the recorded status messages (the driver's first pattern missed some wordings);
//  - expert floor = committed changes x the expert rate calibrated on the verified expert runs;
//  - time is compared through the keystroke-level model (KLM: 1.3 s per pointer gesture, 0.28 s per keystroke), since
//    the evaluator's wall clock includes its own thinking; the wall clock is reported beside it.
//   node jornada03/scripts/analyze.mjs   -> data/scoreboard.json and a table on stdout
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join('jornada03', 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && !['scoreboard.json'].includes(f));
const tasks = files.filter((f) => /^(marina|diego|carla)-/.test(f)).map(read);
const probes = files.filter((f) => f.startsWith('probe-')).map(read);
const experts = files.filter((f) => f.startsWith('expert-')).map(read);

const REFUSAL = /refused|recusad|cannot|não pode|not a value|não é um valor|nothing matches|nenhum elemento corresponde|não é um arquivo|needs a single|select an element first|selecione um elemento/i;
const pointer = (g) => (g.click ?? 0) + (g.dblclick ?? 0) + (g.rightclick ?? 0) + (g.drag ?? 0) + (g.wheel ?? 0);
const commits = (r) => Math.max(0, (r.historyAtEnd?.undoSteps ?? 0) - (r.historyAtStart?.undoSteps ?? 0));
const klm = (ptr, keys) => Math.round((1.3 * ptr + 0.28 * keys) * 10) / 10;

// calibration: verified expert runs with committed changes (C2 invalid; M5/C5 commit nothing)
const calib = experts.filter((e) => e.result !== 'invalid' && commits(e) > 0);
const cCommits = calib.reduce((s, e) => s + commits(e), 0);
const rate = { pointer: calib.reduce((s, e) => s + pointer(e.gestures), 0) / cCommits, keys: calib.reduce((s, e) => s + (e.gestures.keys ?? 0), 0) / cCommits, runs: calib.map((e) => e.id), commits: cCommits };

const rows = tasks.map((t) => {
  const ptr = pointer(t.gestures);
  const keys = t.gestures.keys ?? 0;
  const c = commits(t);
  const refusals = (t.messages ?? []).filter((m) => REFUSAL.test(m));
  const floorPtr = Math.max(1, Math.round(c * rate.pointer));
  const floorKeys = Math.round(c * rate.keys);
  const personaKlm = klm(ptr, keys);
  const expertKlm = klm(floorPtr, floorKeys);
  return {
    id: t.id,
    persona: t.persona,
    result: t.result,
    wallSeconds: t.seconds,
    pointer: ptr,
    keys,
    committed: t.historyAtEnd ? c : null,
    undos: t.undos,
    refusals: refusals.length,
    deadEnds: (t.deadEnds ?? []).length,
    incidents: Math.max(t.incidents ?? 0, (t.incidentsSeen ?? []).length),
    latencyP50: t.latencyMs?.p50 ?? null,
    latencyP95: t.latencyMs?.p95 ?? null,
    seq: t.seq,
    issues: (t.issues ?? []).length,
    wishes: (t.wish ?? []).length,
    klmSeconds: personaKlm,
    expertKlmSeconds: t.historyAtEnd && c > 0 ? expertKlm : null,
    efficiency: t.historyAtEnd && c > 0 ? Math.round((personaKlm / expertKlm) * 10) / 10 : null,
    pointerRatio: t.historyAtEnd && c > 0 ? Math.round((ptr / floorPtr) * 10) / 10 : null,
  };
});

const byPersona = {};
for (const p of ['marina', 'diego', 'carla']) {
  const r = rows.filter((x) => x.persona === p);
  byPersona[p] = {
    tasks: r.length,
    done: r.filter((x) => x.result === 'done').length,
    partial: r.filter((x) => x.result === 'partial').length,
    abandoned: r.filter((x) => x.result === 'abandoned').length,
    completion: Math.round(((r.filter((x) => x.result === 'done').length + 0.5 * r.filter((x) => x.result === 'partial').length) / r.length) * 100),
    meanSeq: Math.round((r.reduce((s, x) => s + (x.seq ?? 0), 0) / r.length) * 10) / 10,
    deadEnds: r.reduce((s, x) => s + x.deadEnds, 0),
    incidents: r.reduce((s, x) => s + x.incidents, 0),
    medianEfficiency: (() => { const v = r.map((x) => x.efficiency).filter((x) => x !== null).sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : null; })(),
  };
}
const allLat = tasks.flatMap(() => []);
const issuesRaw = tasks.concat(probes).flatMap((t) => (t.issues ?? []).map((i) => ({ task: t.id, ...i })));
const fidelity = fs.existsSync(path.join(DIR, 'fidelity', 'marina.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'fidelity', 'marina.json'), 'utf8')) : null;
const board = {
  method: { klm: '1.3 s per pointer gesture, 0.28 s per keystroke', expertRate: rate, refusalPattern: String(REFUSAL) },
  rows,
  byPersona,
  probes: probes.map((p) => ({ id: p.id, result: p.result, latency: p.latencyMs, notes: p.notes })),
  fidelity: fidelity && { results: fidelity.results, htmlErrors: fidelity.htmlValidate.errors, css: fidelity.css, inlineStyles: fidelity.inlineStyles },
  issuesRaw,
  wishes: tasks.flatMap((t) => (t.wish ?? []).map((w) => ({ task: t.id, wish: w }))),
};
void allLat;
fs.writeFileSync(path.join(DIR, 'scoreboard.json'), `${JSON.stringify(board, null, 2)}\n`);
const pad = (s, n) => String(s ?? '—').padEnd(n);
console.log(`expert rate: ${rate.pointer.toFixed(2)} pointer + ${rate.keys.toFixed(1)} keys per committed change (${rate.runs.join(', ')}; ${rate.commits} changes)`);
console.log(['task', 'result', 'ptr', 'keys', 'commit', 'undo', 'refus', 'dead', 'incid', 'p95', 'seq', 'KLM s', 'exp s', 'eff'].map((h, i) => pad(h, [11, 9, 5, 6, 7, 5, 6, 5, 6, 6, 4, 7, 7, 5][i])).join(''));
for (const r of rows) console.log([r.id, r.result, r.pointer, r.keys, r.committed, r.undos, r.refusals, r.deadEnds, r.incidents, r.latencyP95, r.seq, r.klmSeconds, r.expertKlmSeconds, r.efficiency].map((v, i) => pad(v, [11, 9, 5, 6, 7, 5, 6, 5, 6, 6, 4, 7, 7, 5][i])).join(''));
console.log(JSON.stringify(byPersona));
console.log('raw issues', issuesRaw.length, 'wishes', board.wishes.length);
