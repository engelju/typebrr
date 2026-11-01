(function () {
  'use strict';

  const { LESSONS, FREE, weakText, LETTER_LESSONS } = window.Lessons;
  const L = window.Layout;
  const S = window.Stats;
  const $ = (id) => document.getElementById(id);

  const PASS_ACC = 95;

  // QWERTY key codes -> ZMK positions, for "QWERTY emulation".
  const QWERTY_CODES = [
    ['KeyQ', 1], ['KeyW', 2], ['KeyE', 3], ['KeyR', 4], ['KeyT', 5],
    ['KeyY', 7], ['KeyU', 8], ['KeyI', 9], ['KeyO', 10], ['KeyP', 11],
    ['KeyA', 14], ['KeyS', 15], ['KeyD', 16], ['KeyF', 17], ['KeyG', 18],
    ['KeyH', 22], ['KeyJ', 23], ['KeyK', 24], ['KeyL', 25], ['Semicolon', 26],
    ['KeyZ', 29], ['KeyX', 30], ['KeyC', 31], ['KeyV', 32], ['KeyB', 33],
    ['KeyN', 36], ['KeyM', 37], ['Comma', 38], ['Period', 39], ['Slash', 40],
  ];
  const CODE_POS = Object.fromEntries(QWERTY_CODES);
  const SHIFTED = { ';': ':', ',': '<', '.': '>', '/': '?' };
  const SPECIAL_KEYS = { Backspace: '\b', Delete: '\x7f', Enter: '\n', Tab: '\t' };

  const kb = L.createKeyboard($('keyboard'), { hands: true });

  const fingerTag = (pos, verb) => {
    const f = L.FINGER[pos];
    return `<span class="ftag f-${f}">${verb ? verb + ' · ' : ''}${L.FINGER_NAME[f]}</span>`;
  };

  let state = null;
  let mode = S.data.mode;

  // --- Text generation ---------------------------------------------------------
  function currentLetters() {
    if (mode.type !== 'lesson') return null;
    let letters = '';
    for (let i = 0; i <= mode.idx && i < LETTER_LESSONS; i++) letters += LESSONS[i].keys.join('');
    return mode.idx < LETTER_LESSONS ? letters : null;
  }

  function generate() {
    if (mode.type === 'lesson') return LESSONS[mode.idx].gen();
    if (mode.type === 'weak') {
      const weak = S.weakChars(5, (ch) => !!L.methodFor(ch) && !'\b\x7f\t\n'.includes(ch)).map((w) => w.ch);
      return weakText(weak.length ? weak : ['e', 't', 'a']);
    }
    return FREE[mode.id].gen();
  }

  // --- Typing session ---------------------------------------------------------
  function start(text) {
    text = text || generate();
    state = {
      text, chars: [...text], pos: 0, spans: [],
      started: 0, last: 0, ok: 0, wrong: 0, erred: new Set(),
    };
    renderText();
    $('result').hidden = true;
    $('text').classList.remove('finished');
    const allowed = currentLetters();
    kb.setDim(allowed
      ? Object.entries(L.TAP).filter(([, c]) => /[a-z]/.test(c) && !allowed.includes(c)).map(([p]) => +p)
      : []);
    updateCursor();
    updateLive();
  }

  function renderText() {
    const box = $('text');
    box.innerHTML = '';
    box.scrollTop = 0;
    const frag = document.createDocumentFragment();
    let word = null;
    for (const ch of state.chars) {
      const span = document.createElement('span');
      span.className = 'ch';
      if (ch === ' ') {
        span.classList.add('sp');
        span.textContent = ' ';
        word = null;
        frag.appendChild(span);
      } else if (ch === '\n') {
        span.classList.add('special');
        span.textContent = '↵';
        word = null;
        frag.appendChild(span);
        frag.appendChild(document.createElement('br'));
      } else {
        // Keep words together so line breaks never split them.
        if (!word) {
          word = document.createElement('span');
          word.className = 'word';
          frag.appendChild(word);
        }
        if (ch.length === 1 && L.displayChar(ch) !== ch) span.classList.add('special');
        span.textContent = L.displayChar(ch);
        word.appendChild(span);
      }
      state.spans.push(span);
    }
    box.appendChild(frag);
  }

  function updateCursor() {
    const { spans, pos, chars } = state;
    spans.forEach((s) => s.classList.remove('cur'));
    if (pos >= chars.length) {
      kb.highlight(null);
      $('hint').innerHTML = '';
      return;
    }
    const cur = spans[pos];
    cur.classList.add('cur');
    const ch = chars[pos];
    const method = L.methodFor(ch);
    kb.highlight(method);
    const tags = method
      ? method.mods.map((p) => fingerTag(p, 'hold')).join('') + method.keys.map((p) => fingerTag(p)).join('')
      : '';
    $('hint').innerHTML = `<kbd>${S.esc(ch === ' ' ? 'space' : L.displayChar(ch))}</kbd>${tags}` +
      `<span class="desc">${L.describe(ch)}</span>`;

    const box = $('text');
    const lineH = parseFloat(getComputedStyle(box).lineHeight) || 40;
    const target = cur.offsetTop - lineH;
    if (Math.abs(box.scrollTop - target) > lineH / 2) box.scrollTop = Math.max(0, target);
  }

  function inputChar(e) {
    if (e.ctrlKey || e.metaKey || (e.altKey && !e.getModifierState('AltGraph'))) return null;
    if (SPECIAL_KEYS[e.key]) return SPECIAL_KEYS[e.key];
    if (S.data.emulate && CODE_POS[e.code] != null) {
      const c = L.TAP[CODE_POS[e.code]];
      if (!e.shiftKey) return c;
      return /[a-z]/.test(c) ? c.toUpperCase() : SHIFTED[c];
    }
    return e.key && e.key.length === 1 ? e.key : null;
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      start();
      return;
    }
    if (!state) return;

    if (state.pos >= state.chars.length) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        next();
      }
      return;
    }

    const ch = inputChar(e);
    if (ch == null) return;
    e.preventDefault();

    const now = performance.now();
    const expected = state.chars[state.pos];
    if (!state.started) state.started = state.last = now;

    if (ch === expected) {
      S.hit(expected, state.pos && !state.erred.has(state.pos) ? now - state.last : null);
      state.last = now;
      const span = state.spans[state.pos];
      span.classList.add(state.erred.has(state.pos) ? 'bad' : 'good');
      const m = L.methodFor(ch);
      if (m) kb.flash(m.keys, true);
      state.ok++;
      state.pos++;
      if (state.pos >= state.chars.length) return finish(now);
      updateCursor();
    } else if (ch === '\b') {
      // Backspace is never needed for corrections, so ignore it unless it is the target.
    } else {
      S.miss(expected);
      state.wrong++;
      state.erred.add(state.pos);
      const span = state.spans[state.pos];
      span.classList.remove('shake');
      void span.offsetWidth;
      span.classList.add('err', 'shake');
      const m = L.methodFor(ch);
      if (m) kb.flash(m.keys, false);
    }
    updateLive();
  }

  function metrics(now) {
    const mins = state.started ? (now - state.started) / 60000 : 0;
    const wpm = mins > 0.02 ? state.ok / 5 / mins : 0;
    const total = state.ok + state.wrong;
    const acc = total ? (100 * state.ok) / total : 100;
    return { wpm, acc };
  }

  function updateLive() {
    const { wpm, acc } = metrics(performance.now());
    $('wpm').textContent = Math.round(wpm);
    $('acc').textContent = Math.round(acc);
    $('progress').textContent = `${state.pos}/${state.chars.length}`;
  }
  setInterval(() => {
    if (state && state.started && state.pos < state.chars.length) updateLive();
  }, 500);

  function modeName() {
    if (mode.type === 'lesson') return `Lesson ${mode.idx + 1}: ${LESSONS[mode.idx].name}`;
    if (mode.type === 'weak') return 'Weak keys';
    return FREE[mode.id].name;
  }

  function finish(now) {
    const { wpm, acc } = metrics(now);
    updateLive();
    updateCursor();
    $('text').classList.add('finished');
    S.addSession({ t: Date.now(), mode: modeName(), wpm: +wpm.toFixed(1), acc: +acc.toFixed(1), chars: state.ok });

    let msg = '';
    let nextLabel = 'Next round';
    if (mode.type === 'lesson') {
      const passed = acc >= PASS_ACC;
      if (passed && mode.idx === S.data.unlocked && mode.idx < LESSONS.length - 1) S.data.unlocked++;
      S.save();
      if (passed && mode.idx < LESSONS.length - 1) {
        msg = `Passed. Lesson ${mode.idx + 2} is unlocked.`;
        nextLabel = 'Next lesson →';
      } else if (passed) {
        msg = 'Last lesson passed. Now use "Top 200 words", "Sentences" and "Weak keys" to build speed.';
      } else {
        msg = `You need ${PASS_ACC}% accuracy to pass. Slow down a bit and go again.`;
        nextLabel = 'Try again';
      }
      state.passed = passed;
    }

    $('result').innerHTML = `
      <div class="big"><b>${wpm.toFixed(1)}</b> wpm · <b>${acc.toFixed(1)}</b>% accuracy</div>
      <p>${msg}</p>
      <button id="next" class="primary">${nextLabel}</button>
      <button id="again">Repeat same text</button>
      <span class="muted">Space / Enter = continue · Esc = new text</span>`;
    $('result').hidden = false;
    $('next').onclick = next;
    $('again').onclick = () => start(state.text);
    S.render();
    renderLessonBar();
  }

  function next() {
    if (mode.type === 'lesson' && state && state.passed && mode.idx < LESSONS.length - 1) {
      setMode({ type: 'lesson', idx: mode.idx + 1 });
    } else {
      start();
    }
  }

  // --- Modes & navigation ---------------------------------------------------------
  function setMode(m) {
    mode = m;
    S.data.mode = m;
    S.save();
    renderNav();
    renderLessonBar();
    start();
  }

  function renderNav() {
    const items = [['lesson', 'Lessons'], ...Object.entries(FREE).map(([id, f]) => [id, f.name]), ['weak', 'Weak keys']];
    const nav = $('modes');
    nav.innerHTML = '';
    for (const [id, name] of items) {
      const b = document.createElement('button');
      b.textContent = name;
      const active = mode.type === 'lesson' ? id === 'lesson' : mode.type === 'weak' ? id === 'weak' : mode.id === id;
      b.className = active ? 'on' : '';
      b.onclick = () => {
        if (id === 'lesson') setMode({ type: 'lesson', idx: Math.min(S.data.unlocked, LESSONS.length - 1) });
        else if (id === 'weak') setMode({ type: 'weak' });
        else setMode({ type: 'free', id });
        b.blur();
      };
      nav.appendChild(b);
    }
  }

  function renderLessonBar() {
    const bar = $('lesson-bar');
    bar.innerHTML = '';
    if (mode.type === 'weak') {
      const weak = S.weakChars(5, (ch) => !!L.methodFor(ch));
      bar.innerHTML = weak.length
        ? `<span class="muted">Training your weakest keys:</span> ${weak.map((w) => `<kbd>${S.esc(L.displayChar(w.ch))}</kbd>`).join(' ')}`
        : '<span class="muted">No stats yet. Do a few lessons first, then come back here.</span>';
      return;
    }
    if (mode.type !== 'lesson') return;
    LESSONS.forEach((l, i) => {
      const b = document.createElement('button');
      const done = i < S.data.unlocked;
      const locked = i > S.data.unlocked;
      b.className = ['lesson', i === mode.idx && 'on', done && 'done', locked && 'locked'].filter(Boolean).join(' ');
      b.title = l.name + (locked ? ' (locked, but you can still try it)' : '');
      b.innerHTML = `<span>${i + 1}</span>${S.esc(l.name)}`;
      b.onclick = () => {
        setMode({ type: 'lesson', idx: i });
        b.blur();
      };
      bar.appendChild(b);
    });
  }

  // --- Setup ---------------------------------------------------------------------
  if (mode.type === 'free' && !FREE[mode.id]) mode = { type: 'lesson', idx: 0 };
  if (mode.type === 'lesson' && !LESSONS[mode.idx]) mode = { type: 'lesson', idx: 0 };

  // Layout dropdown and the parts of the page that depend on the layout.
  const select = $('layout');
  for (const [id, l] of Object.entries(L.LAYOUTS)) select.add(new Option(l.name, id, false, id === L.CURRENT.id));
  select.addEventListener('change', () => L.selectLayout(select.value));
  document.title = `typbrr – ${L.CURRENT.name} trainer for the Eyelash Corne`;
  $('howto').innerHTML = L.CURRENT.howto;
  const k = (pos) => `<b>${S.esc(L.keyName(pos))}</b>`;
  $('shift-tip').innerHTML = `Shift is a home row mod on ${k(14)} (left) and ${k(26)} (right). ` +
    'Hold the shift key on the <i>opposite</i> hand from the letter.';
  $('combo-tip').innerHTML = `Combos: ${k(8)}+${k(9)} ⌫, ${k(9)}+${k(10)} ⌦, ${k(23)}+${k(24)} ↵, ` +
    `${k(1)}+${k(2)} / ${k(37)}+${k(38)} ⇥, ${k(39)}+${k(40)} '.`;
  $('emulate').parentElement.title =
    `Turns key presses from a QWERTY keyboard (or the Corne on QWERTY) into ${L.CURRENT.name}`;

  $('emulate').checked = !!S.data.emulate;
  $('emulate').addEventListener('change', (e) => {
    S.data.emulate = e.target.checked;
    S.save();
    e.target.blur();
  });

  document.addEventListener('keydown', onKey);
  window.addEventListener('typbrr:reset', () => setMode({ type: 'lesson', idx: 0 }));

  renderNav();
  renderLessonBar();
  S.render();
  start();
})();
