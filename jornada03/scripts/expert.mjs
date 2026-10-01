// Phase 3 (jornada03): the expert baseline. Each task of the study replayed along its best known path — the doors,
// shortcuts and tricks the sessions revealed, no search, no dead end, no error — through the same driver (real
// gestures, same recorder), on a fresh profile. It gives the floor each persona's gestures are divided by.
//   node jornada03/scripts/expert.mjs <task…|all>     (the driver must be running on :5399)
const BASE = `http://localhost:${process.env.STUDY_PORT ?? 5399}`;
const call = async (route, body = {}) => {
  const res = await fetch(`${BASE}/${route}`, { method: 'POST', body: JSON.stringify(body) });
  const out = await res.json();
  if (out.error) throw new Error(`${route}: ${out.error}`);
  return out;
};
const act = (a) => call('act', a);
const look = async (filter, max = 400) => (await call('look', { filter, max })).items;
const read = async (expr) => (await call('read', { expr })).value;
const last = () => read('window.__study.messages.at(-1)?.text');

// the n-th visible item starting with text, on the canvas (frame) or in the editor (ui)
async function at(text, where = 'frame', n = 1) {
  const items = (await look(text)).filter((i) => (where === 'frame') === i.frame && i.t.toLowerCase().startsWith(text.toLowerCase()));
  const it = items[n - 1];
  return it ? { x: it.x, y: it.y } : null;
}
async function scrollTo(text, n = 1) {
  for (let i = 0; i < 12; i += 1) {
    const p = await at(text, 'frame', n);
    if (p && p.y > 140 && p.y < 860) return p;
    await act({ do: 'wheel', x: 700, y: 500, dy: i === 0 ? -6000 : 450 });
  }
  throw new Error(`not on the canvas: ${text}`);
}
async function click(text, opts = {}) {
  const p = opts.ui ? await at(text, 'ui', opts.n ?? 1) : await scrollTo(text, opts.n ?? 1);
  if (!p) throw new Error(`no ${text}`);
  await act({ do: 'click', x: p.x, y: p.y, ...(opts.mods ? { mods: opts.mods } : {}), ...(opts.button ? { button: opts.button } : {}) });
  return p;
}
// the k-th element (document order) whose text starts with `text`, scrolled into sight: its screen point
async function nth(text, n) {
  for (let i = 0; i < 14; i += 1) {
    const box = await read(`(() => { const f = document.querySelector('.frame__page'); const d = f.contentDocument; const z = f.currentCSSZoom || 1; const fr = f.getBoundingClientRect();
      const els = [...d.querySelectorAll('[data-node]')].filter((e) => e.childElementCount === 0 && (e.textContent || '').trim().startsWith(${JSON.stringify(text)}));
      const e = els[${n - 1}]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: fr.left + (r.left + Math.min(12, r.width / 2)) * z, y: fr.top + (r.top + r.height / 2) * z }; })()`);
    if (box && box.y > 140 && box.y < 860) return box;
    await act({ do: 'wheel', x: 700, y: 500, dy: i === 0 ? -9000 : 400 });
  }
  throw new Error(`no ${n}th ${text}`);
}
async function ed(text, value, n = 1) {
  const p = n === 1 ? await scrollTo(text, 1) : await nth(text, n);
  await act([{ do: 'click', x: p.x, y: p.y, count: 2 }, { do: 'key', key: 'Control+a' }, { do: 'type', text: value }, { do: 'key', key: 'Escape' }]);
}
// an inspector field by its label: from the top, scrolled into sight; a squeezed one is reset first
async function setf(label, value, section = null) {
  await act({ do: 'wheel', x: 1290, y: 500, dy: -3000 });
  for (let i = 0; i < 9; i += 1) {
    const items = (await look(label)).filter((x) => !x.frame);
    const inp = items.find((x) => x.tag === 'input' && x.t === label);
    if (inp && inp.y > 290 && inp.y < 860) {
      let target = inp;
      if (inp.w < 25) {
        const reset = items.find((b) => b.tag === 'button' && (b.t.startsWith('Redefinir') || b.t.startsWith('Reset')));
        if (reset) await act({ do: 'click', x: reset.x, y: reset.y });
        // the field grows back once emptied: aim at it again
        target = (await look(label)).find((x) => !x.frame && x.tag === 'input' && x.t === label) ?? inp;
      }
      await act([{ do: 'click', x: target.x, y: target.y }, { do: 'key', key: 'Control+a' }, { do: 'type', text: value }, { do: 'key', key: 'Enter' }]);
      return last();
    }
    await act({ do: 'wheel', x: 1290, y: 500, dy: 250 });
  }
  // a section the element holds no value in is collapsed: open the one named in `section`, then look again
  if (section) {
    await act({ do: 'wheel', x: 1290, y: 500, dy: -3000 });
    for (let i = 0; i < 9; i += 1) {
      const head = (await look(section)).find((x) => !x.frame && x.t === section && x.x > 1150);
      if (head && head.y > 290 && head.y < 860) {
        await act({ do: 'click', x: head.x, y: head.y });
        return setf(label, value);
      }
      await act({ do: 'wheel', x: 1290, y: 500, dy: 250 });
    }
  }
  throw new Error(`no field ${label}`);
}
// a block: a text inside it, then its name in the breadcrumb
async function pick(text, crumb) {
  await click(text);
  const items = (await look(crumb)).filter((i) => !i.frame && i.y > 870 && i.t === crumb);
  const it = items.at(-1);
  if (!it) throw new Error(`no crumb ${crumb}`);
  await act({ do: 'click', x: it.x, y: it.y });
}
// a palette tile through the Insert search (the panel must be open)
async function ins(term, tile = term) {
  // the search box moves down when the hint above it wraps: found by its placeholder each time
  const box = (await look('')).find((i) => !i.frame && i.tag === 'input' && /^(Buscar elementos|Search elements)/.test(i.t)) ?? (await look('elementos')).find((i) => i.tag === 'input');
  await act([{ do: 'click', x: box?.x ?? 140, y: box?.y ?? 131 }, { do: 'key', key: 'Control+a' }, { do: 'type', text: term }]);
  const p = (await look(tile)).find((i) => !i.frame && i.tag === 'button' && i.t.toLowerCase() === tile.toLowerCase());
  if (!p) throw new Error(`no tile ${tile}`);
  await act({ do: 'click', x: p.x, y: p.y });
}
async function contextCopyPaste(from, to, words = ['Copiar estilo', 'Colar estilo']) {
  const a = await scrollTo(from);
  await act({ do: 'click', x: a.x, y: a.y, button: 'right' });
  await click(words[0], { ui: true });
  for (const t of [].concat(to)) {
    const b = await scrollTo(t.text ?? t, t.n ?? 1);
    await act({ do: 'click', x: b.x, y: b.y, button: 'right' });
    await click(words[1], { ui: true });
  }
}
const run = async (id, limitMin, fn, end = {}) => {
  await call('begin', { id: `expert-${id}`, limitMin });
  await fn();
  const out = await call('end', { result: 'done', notes: 'expert baseline', ...end });
  console.log(id, JSON.stringify(out));
};
const ptBR = async () => act([{ do: 'click', x: 1279, y: 888 }, { do: 'click', x: 1140, y: 832 }]);
const openProject = async (file, words = 'Abrir projeto', menu = { x: 73, y: 20 }) => {
  await act({ do: 'click', ...menu });
  const p = await at(words, 'ui');
  await act({ do: 'click', x: p.x, y: p.y, files: [file] });
  await act({ do: 'wait', ms: 800 });
};
const ROOT = 'C:/Codex-Shared/deepseek/builder-6/jornada03';
const A = `${ROOT}/00-frame/targets/marina/assets`;

const TASKS = {
  async M1() {
    await call('open', { persona: 'expert-marina', fresh: true });
    await run('M1', 6, async () => {
      await ptBR();
      for (const w of ['seção', 'título', 'parágrafo', 'botão']) await act([{ do: 'key', key: 'Control+k' }, { do: 'type', text: w }, { do: 'key', key: 'Enter' }]);
    });
  },
  async M2() {
    await call('open', { persona: 'expert-marina', fresh: true });
    await ptBR();
    await act({ do: 'click', x: 20, y: 110 });
    await run('M2', 60, async () => {
      await ins('barra de navegação', 'Barra de navegação');
      await ins('destaque', 'Destaque');
      for (const [a, b] of [['Marca', 'Grão Norte'], ['Início', 'Nossos cafés'], ['Sobre', 'Assinatura'], ['Contato', 'Dúvidas'], ['Entrar', 'Assinar'], ['Um título claro', 'Café de especialidade, torrado na semana em que chega à sua casa'], ['Uma linha de apoio', 'Grãos de pequenos produtores do sul de Minas, torra artesanal e entrega mensal.']]) await ed(a, b);
      await click('Saiba mais');
      await act({ do: 'key', key: 'Delete' });
      // the button's text through Settings (spaces typed in place are lost)
      await click('Começar');
      await act({ do: 'click', x: 1250, y: 58 });
      await act([{ do: 'click', x: 1299, y: 166 }, { do: 'key', key: 'Control+a' }, { do: 'type', text: 'Conhecer os planos' }, { do: 'key', key: 'Tab' }, { do: 'click', x: 1181, y: 58 }]);
      // hero: column + image, grid of two
      await click('Café de especialidade');
      await click('Grãos de pequenos', { mods: ['Shift'] });
      await click('Conhecer os planos', { mods: ['Shift'] });
      await act({ do: 'key', key: 'c' });
      await pick('Café de especialidade', 'Destaque');
      await ins('imagem', 'Imagem');
      await pick('Café de especialidade', 'Destaque');
      await setf('Exibição', 'grid');
      for (let i = 0; i < 2; i += 1) await click('Adicionar trilha', { ui: true });
      await setf('Gap entre colunas', '48');
      await setf('Fundo', '#f7efe4');
      for (const [s, v] of [['superior', '48'], ['inferior', '80'], ['esquerdo', '64'], ['direito', '64']]) await setf(`Padding ${s}`, v);
      await click('Café de especialidade');
      await setf('Tamanho da fonte', '56');
      await setf('Altura da linha', '1.15');
      await click('Grãos de pequenos');
      await setf('Tamanho da fonte', '20');
      await setf('Cor do texto', '#6f5b4d');
      await click('Conhecer os planos');
      for (const [l, v] of [['Fundo', '#6b3f26'], ['Cor do texto', '#ffffff'], ['Peso da fonte', '600'], ['Raio', '999px'], ['Borda', '0'], ['Padding superior', '14'], ['Padding inferior', '14'], ['Padding esquerdo', '28'], ['Padding direito', '28']]) await setf(l, v);
      // benefits
      await pick('Café de especialidade', 'Destaque');
      await ins('seção', 'Seção');
      await ins('título', 'Título');
      await ins('grade', 'Grade');
      await ed('Novo título', 'Por que o Grão Norte');
      await ins('cartão', 'Cartão');
      // the expert repeats the card instead of filling three cells (the template grid lays one track per child)
      await act({ do: 'key', key: 'Control+Shift+d' });
      await act({ do: 'key', key: 'Control+Shift+d' });
      for (const [a, b] of [['Título do cartão', 'Origem rastreada'], ['Título do cartão', 'Torra fresca'], ['Título do cartão', 'Sem fidelidade'], ['Uma descrição curta', 'Você sabe de qual fazenda veio cada pacote.'], ['Uma descrição curta', 'Torramos toda semana, só o que vamos enviar.'], ['Uma descrição curta', 'Pause ou cancele a assinatura quando quiser.']]) await ed(a, b);
      await click('Origem rastreada');
      await act({ do: 'key', key: 'Escape' });
      await setf('Estilo da borda', 'none').catch(() => setf('Borda', 'none'));
      await click('Por que o Grão');
      await setf('Tamanho da fonte', '36');
      // the rest of the page follows the same doors as the persona minus errors: quote, plans, FAQ, footer
      await pick('Por que o Grão', 'Seção');
      await ins('seção', 'Seção');
      await ins('parágrafo', 'Parágrafo');
      await ins('parágrafo', 'Parágrafo');
      await ed('Um parágrafo recém', '“O melhor café que já entrou na minha cozinha.”');
      await ed('Um parágrafo recém', '— Ana Ribeiro, assinante desde 2024');
      await pick('“O melhor', 'Seção 2');
      await setf('Fundo', '#6b3f26');
      await setf('Cor do texto', '#ffffff');
      await ins('seção', 'Seção');
      await ins('título', 'Título');
      await ins('grade', 'Grade');
      await ed('Novo título', 'Planos de assinatura');
      await ins('cartão', 'Cartão');
      await act([{ do: 'key', key: 'Control+Shift+d' }, { do: 'key', key: 'Control+Shift+d' }]);
      for (const [a, b] of [['Título do cartão', 'Degustação'], ['Título do cartão', 'Casa'], ['Título do cartão', 'Escritório'], ['Uma descrição curta', '250 g por mês, um café por vez.'], ['Uma descrição curta', '500 g por mês, dois cafés diferentes.'], ['Uma descrição curta', '1,5 kg por mês para a equipe.']]) await ed(a, b);
      await ins('seção', 'Seção');
      await ins('título', 'Título');
      await ins('sanfona', 'Sanfona');
      await ed('Novo título', 'Dúvidas');
      await ed('Primeira pergunta', 'Quando o café chega?');
      await ed('Segunda pergunta', 'Posso trocar de plano?');
      await ins('rodapé', 'Rodapé');
      await ins('parágrafo', 'Parágrafo');
      await ins('parágrafo', 'Parágrafo');
      await ed('Um parágrafo recém', '© 2026 Grão Norte');
      await ed('Um parágrafo recém', 'contato@graonorte.com.br');
      await pick('© 2026', 'Rodapé');
      await setf('Exibição', 'flex');
      await setf('Fundo', '#241710');
      await setf('Cor do texto', '#e9dcc9');
    }, { notes: 'expert baseline: the persona\'s observed path without errors, dead ends or searches, plus the shortcuts it revealed (Repeat for identical cards). Covers the same sections with fewer fine-tuning steps; the persona-only extras (plan prices, FAQ answers, nav styling) are counted by the gesture model in the analysis.' });
  },
  async M5() {
    await call('open', { persona: 'expert-marina' });
    await run('M5', 3, async () => {
      await act([{ do: 'key', key: 'Control+p' }, { do: 'click', x: 590, y: 20, download: true }, { do: 'key', key: 'Escape' }]);
    });
  },
  async D2() {
    await call('open', { persona: 'expert-diego', fresh: true });
    await openProject(`${ROOT}/data/downloads/marina-project.zip`, 'Open project', { x: 61, y: 20 });
    await run('D2', 12, async () => {
      await pick('“O melhor', 'Seção 2');
      const p = await scrollTo('“O melhor');
      await act({ do: 'click', x: 305, y: p.y, button: 'right' });
      await click('Create a component', { ui: true });
      await act([{ do: 'key', key: 'Control+a' }, { do: 'type', text: 'testimonial' }, { do: 'key', key: 'Enter' }, { do: 'key', key: 'Control+Shift+d', repeat: 5 }]);
      for (const q of ['“Chega sempre fresquinho.” ', '“Virei fã do microlote.” ', '“Atendimento impecável.” ', '“Meu escritório agradece.” ', '“Presente perfeito.” ']) await ed('“O melhor', q, 2);
      await pick('“Presente', 'Seção 9');
      await setf('Border', '4px solid', 'Border');
    });
  },
  async D4() {
    await call('open', { persona: 'expert-diego' });
    await run('D4', 10, async () => {
      await act([{ do: 'click', x: 247, y: 84 }, { do: 'key', key: 'Enter' }]);
      await act({ do: 'key', key: 'Escape' });
      for (const w of ['section']) await act([{ do: 'key', key: 'Control+k' }, { do: 'type', text: w }, { do: 'key', key: 'Enter' }]);
      for (const w of ['heading', 'paragraph']) await act([{ do: 'key', key: 'Control+k' }, { do: 'type', text: w }, { do: 'key', key: 'Enter' }]);
      await act({ do: 'key', key: 'r' });
      await act([{ do: 'key', key: 'Control+k' }, { do: 'type', text: 'paragraph' }, { do: 'key', key: 'Enter' }, { do: 'key', key: 'ArrowUp', repeat: 2 }, { do: 'key', key: 'Control+k' }, { do: 'type', text: 'button' }, { do: 'key', key: 'Enter' }]);
    }, { notes: 'expert baseline: starting from a selected section (the + adds the page and keeps the keyboard); the persona needed Ctrl+A to reach it' });
  },
  async C1() {
    await call('open', { persona: 'expert-carla', fresh: true });
    await ptBR();
    await openProject(`${ROOT}/data/downloads/marina-project.zip`);
    await run('C1', 6, async () => {
      await click('Assinar');
      await click('Conhecer os planos', { mods: ['Shift'] });
      for (let n = 1; n <= 3; n += 1) await click('Escolher', { mods: ['Shift'], n });
      await setf('Fundo', '#2f6f4e');
      await pick('“O melhor', 'Seção 2');
      await setf('Fundo', '#2f6f4e');
      await pick('Casa', 'Cartão 5');
      await setf('Cor da borda', '#2f6f4e');
    });
  },
  async C2() {
    await call('open', { persona: 'expert-carla' });
    await act({ do: 'click', x: 20, y: 66 });
    await run('C2', 6, async () => {
      for (const [row, name, from, title] of [[108, 'Unidade Centro', 'Café de especialidade', 'Grão Norte Centro'], [132, 'Unidade Praia', 'Grão Norte Centro', 'Grão Norte Praia']]) {
        await act([{ do: 'move', x: 150, y: row }, { do: 'click', x: 225, y: row }]);
        const r = row + 24;
        await act([{ do: 'click', x: 110, y: r }, { do: 'click', x: 110, y: r }, { do: 'key', key: 'Control+a' }, { do: 'type', text: name }, { do: 'key', key: 'Enter' }]);
        await ed(from, title);
      }
    });
  },
  async C5() {
    await call('open', { persona: 'expert-carla' });
    await run('C5', 3, async () => {
      await call('reload');
    });
  },
};

const wanted = process.argv.slice(2);
for (const id of wanted.includes('all') ? Object.keys(TASKS) : wanted) {
  try {
    await TASKS[id]();
  } catch (e) {
    console.log(id, 'FAILED', String(e).split('\n')[0]);
    await call('end', { result: 'abandoned', notes: `expert script failed: ${String(e).split('\n')[0]}` }).catch(() => {});
  }
}
