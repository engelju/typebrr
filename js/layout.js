/*
 * Eyelash Corne layouts (STD, Colemak, QWERTY). Mods, combos and the
 * Lower/Raise/Adjust layers are taken from
 * ~/tmp/eyelash-corne/zmk-new_corne-std/config/eyelash_corne.keymap
 * and stay on the same positions for every layout.
 *
 * Positions use the ZMK key index of the shield (48 positions). The outer
 * columns, joystick and encoder are left out because they are &none / unused
 * for typing.
 */
(function (global) {
  'use strict';

  // ZMK physical layout (eyelash_corne-layouts.dtsi), 1 key = 100 units.
  // [x, y, rotationDeg, rx, ry]
  const RAW = {
    1: [100, 37], 2: [200, 12], 3: [300, 0], 4: [400, 12], 5: [500, 24],
    7: [1150, 24], 8: [1250, 12], 9: [1350, 0], 10: [1450, 12], 11: [1550, 37],
    14: [100, 137], 15: [200, 112], 16: [300, 100], 17: [400, 112], 18: [500, 124],
    22: [1150, 124], 23: [1250, 112], 24: [1350, 100], 25: [1450, 112], 26: [1550, 137],
    29: [100, 237], 30: [200, 212], 31: [300, 200], 32: [400, 212], 33: [500, 224],
    36: [1150, 224], 37: [1250, 212], 38: [1350, 200], 39: [1450, 212], 40: [1550, 237],
    42: [350, 312], 43: [450, 312, 12, 450, 412], 44: [550, 312, 24, 515, 433],
    45: [1100, 312, -24, 1230, 433], 46: [1200, 312, -12, 1300, 412], 47: [1300, 312],
  };
  // The joystick sits between the halves; without it we pull the right half closer.
  const GAP_SHRINK = 330;

  const PHYS = {};
  for (const [pos, [x, y, r = 0, rx = 0, ry = 0]] of Object.entries(RAW)) {
    const right = x >= 1000;
    PHYS[pos] = {
      x: right ? x - GAP_SHRINK : x, y, r,
      rx: right ? rx - GAP_SHRINK : rx, ry,
      hand: right ? 'R' : 'L',
    };
  }
  const POSITIONS = Object.keys(PHYS).map(Number);

  const ROW = (pos) => (pos < 13 ? 0 : pos < 28 ? 1 : pos < 42 ? 2 : 3);
  const ROW_NAME = ['top row', 'home row', 'bottom row', 'thumb'];

  const FINGER = {};
  const setFinger = (f, ...ps) => ps.forEach((p) => (FINGER[p] = f));
  setFinger('lp', 1, 14, 29);
  setFinger('lr', 2, 15, 30);
  setFinger('lm', 3, 16, 31);
  setFinger('li', 4, 17, 32, 5, 18, 33);
  setFinger('ri', 7, 22, 36, 8, 23, 37);
  setFinger('rm', 9, 24, 38);
  setFinger('rr', 10, 25, 39);
  setFinger('rp', 11, 26, 40);
  setFinger('lt', 42, 43, 44);
  setFinger('rt', 45, 46, 47);
  const FINGER_NAME = {
    lp: 'left pinky', lr: 'left ring', lm: 'left middle', li: 'left index',
    ri: 'right index', rm: 'right middle', rr: 'right ring', rp: 'right pinky',
    lt: 'left thumb', rt: 'right thumb',
  };

  // --- Layers -------------------------------------------------------------
  // Key label: string, or { t: tap, s: shifted, h: hold, cls }
  const NONE = { t: '', cls: 'none' };
  const HELD = (t) => ({ t, cls: 'held' });

  // Letters per layout, in the order of ALPHA_POS (top, home, bottom row).
  // stages: the order in which the lessons add letters.
  const LAYOUTS = {
    std: {
      name: 'STD',
      letters: 'qwpfgyloj;' + 'arstdhneiu' + 'zxbcvkm,./',
      stages: [
        ['Home: T S N E', 'tsne'], ['Home: A R I U', 'ariu'], ['Home: D H', 'dh'],
        ['Top: O L', 'ol'], ['Bottom: C M', 'cm'], ['Top: F P Y', 'fpy'], ['Top: G W', 'gw'],
        ['Bottom: B V K', 'bvk'], ['Rare: J X Q Z', 'jxqz'],
      ],
      howto: 'Turn on STD on the keyboard: hold <b>Lower + Raise</b> (Adjust) and tap <b>D</b> ' +
        '(the <b>G</b> key in QWERTY). Do the same to switch back to QWERTY.',
      emulate: false,
    },
    colemak: {
      name: 'Colemak',
      letters: 'qwfpgjluy;' + 'arstdhneio' + 'zxcvbkm,./',
      stages: [
        ['Home: T S N E', 'tsne'], ['Home: A R I O', 'ario'], ['Home: D H', 'dh'],
        ['Top: L U', 'lu'], ['Bottom: C M', 'cm'], ['Top: F P Y', 'fpy'], ['Top: G W', 'gw'],
        ['Bottom: B V K', 'bvk'], ['Rare: J X Q Z', 'jxqz'],
      ],
      howto: 'Your keymap has no Colemak layer. Keep the Corne on QWERTY and leave ' +
        '<b>QWERTY emulation</b> on, so the trainer turns your key presses into Colemak.',
      emulate: true,
    },
    qwerty: {
      name: 'QWERTY',
      letters: 'qwertyuiop' + 'asdfghjkl;' + 'zxcvbnm,./',
      stages: [
        ['Home: A S D F J K L', 'asdfjkl'], ['Home: G H', 'gh'], ['Top: E I', 'ei'],
        ['Top: R T U', 'rtu'], ['Top: O P W', 'opw'], ['Bottom: N M C', 'nmc'],
        ['Bottom: V B X', 'vbx'], ['Rare: Q Y Z', 'qyz'],
      ],
      howto: 'QWERTY is the base layer of your keymap. If STD is on, switch it off with ' +
        '<b>Lower + Raise</b> (Adjust) + <b>D</b> (the <b>G</b> key in QWERTY).',
      emulate: false,
    },
  };
  const LAYOUT_KEY = 'typbrr.layout';
  let layoutId = localStorage.getItem(LAYOUT_KEY);
  if (!LAYOUTS[layoutId]) layoutId = 'std';
  const CURRENT = Object.assign({ id: layoutId }, LAYOUTS[layoutId]);
  function selectLayout(id) {
    localStorage.setItem(LAYOUT_KEY, id);
    location.reload();
  }

  const ALPHA_POS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 22, 23, 24, 25, 26,
    29, 30, 31, 32, 33, 36, 37, 38, 39, 40];
  const TAP = {};
  [...CURRENT.letters].forEach((c, i) => (TAP[ALPHA_POS[i]] = c));
  const SHIFTED = { ';': ':', ',': '<', '.': '>', '/': '?' };
  const HOLD = { 14: 'Shift', 26: 'Shift', 29: 'Ctrl', 40: 'Ctrl' };

  const base = {};
  for (const [pos, c] of Object.entries(TAP)) {
    base[pos] = { t: c.toUpperCase(), s: SHIFTED[c], h: HOLD[pos] };
  }
  Object.assign(base, {
    42: { t: 'Lower', cls: 'layer' }, 43: 'Gui', 44: 'Alt',
    45: 'Esc', 46: { t: 'Space', cls: 'space' }, 47: { t: 'Raise', cls: 'layer' },
  });

  const lower = {
    1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 7: '6', 8: '7', 9: '8', 10: '9', 11: '0',
    14: '←', 15: '↑', 16: '→', 17: 'PgUp', 18: 'Home',
    22: '←', 23: '↓', 24: '↑', 25: '→', 26: 'Del',
    29: 'Ctrl', 30: '↓', 31: '`', 32: 'PgDn', 33: 'End',
    36: NONE, 37: NONE, 38: NONE, 39: NONE, 40: NONE,
    42: HELD('Lower'), 43: 'Alt', 44: 'Gui', 45: 'RAlt', 46: 'RGui', 47: { t: 'Raise', cls: 'layer' },
  };

  const raise = {
    1: '!', 2: '@', 3: '#', 4: '$', 5: '%', 7: '^', 8: '&', 9: '*', 10: '(', 11: ')',
    14: 'Shift', 15: NONE, 16: "'", 17: '"', 18: NONE,
    22: { t: '=', s: '+' }, 23: '[', 24: ']', 25: '~', 26: '\\',
    29: 'Ctrl', 30: NONE, 31: '\\', 32: '`', 33: '~',
    36: '-', 37: '{', 38: '}', 39: '_', 40: '|',
    42: { t: 'Lower', cls: 'layer' }, 43: 'Alt', 44: 'Gui', 45: 'RAlt', 46: 'RGui', 47: HELD('Raise'),
  };

  const adjust = {
    1: 'F1', 2: 'F2', 3: 'F3', 4: 'F4', 5: 'F5', 7: 'F6', 8: 'F7', 9: 'F8', 10: 'F9', 11: 'F10',
    14: 'RGB', 15: 'Hue+', 16: 'Sat+', 17: 'Bri+', 18: { t: 'STD', h: 'toggle', cls: 'layer' },
    22: NONE, 23: 'F11', 24: 'F12', 25: NONE, 26: 'Studio',
    29: 'Effect', 30: 'Hue-', 31: 'Sat-', 32: 'Bri-', 33: 'Boot',
    36: 'BT1', 37: 'BT2', 38: 'BT3', 39: 'BT clr', 40: 'Boot',
    42: HELD('Lower'), 43: NONE, 44: NONE, 45: NONE, 46: NONE, 47: HELD('Raise'),
  };

  const LAYERS = {
    base: { name: CURRENT.name, keys: base },
    lower: { name: 'Lower', keys: lower, note: 'hold Lower (left thumb, outer)' },
    raise: { name: 'Raise', keys: raise, note: 'hold Raise (right thumb, outer)' },
    adjust: { name: 'Adjust', keys: adjust, note: 'hold Lower + Raise' },
  };

  // Combos are positional (same on every layer), 50 ms window, 150 ms prior idle.
  const COMBOS = [
    { keys: [1, 2], label: '⇥', name: 'Tab', ch: '\t' },
    { keys: [37, 38], label: '⇥', name: 'Tab', ch: '\t' },
    { keys: [8, 9], label: '⌫', name: 'Backspace', ch: '\b' },
    { keys: [9, 10], label: '⌦', name: 'Delete', ch: '\x7f' },
    { keys: [23, 24], label: '↵', name: 'Enter', ch: '\n' },
    { keys: [39, 40], label: "'", name: 'Quote', ch: "'" },
  ];

  // --- How to produce each character ---------------------------------------
  const LOWER_KEY = 42, RAISE_KEY = 47, SHIFT_L = 14, SHIFT_R = 26;
  const METHODS = {};
  function add(ch, m) {
    if (!METHODS[ch]) METHODS[ch] = Object.assign({ mods: [], alts: [] }, m);
    else METHODS[ch].alts.push(Object.assign({ mods: [] }, m));
  }

  for (const [p, c] of Object.entries(TAP)) {
    const pos = Number(p);
    add(c, { layer: 'base', keys: [pos] });
    const up = /[a-z]/.test(c) ? c.toUpperCase() : SHIFTED[c];
    // Shift with the opposite hand: left-hand keys use the right pinky home key and vice versa.
    if (up) add(up, { layer: 'base', keys: [pos], mods: [PHYS[pos].hand === 'L' ? SHIFT_R : SHIFT_L] });
  }
  add(' ', { layer: 'base', keys: [46] });
  for (const c of COMBOS) {
    if (c.ch === '\t' && METHODS['\t']) continue;
    add(c.ch, { layer: 'base', keys: c.keys, combo: true });
  }
  // Raise first, so it wins for characters that also exist elsewhere.
  for (const [p, l] of Object.entries(raise)) {
    const t = typeof l === 'string' ? l : null;
    if (t && t.length === 1) add(t, { layer: 'raise', keys: [Number(p)], mods: [RAISE_KEY] });
  }
  add('=', { layer: 'raise', keys: [22], mods: [RAISE_KEY] });
  add('+', { layer: 'raise', keys: [22], mods: [RAISE_KEY, SHIFT_L] });
  add('"', { layer: 'base', keys: [39, 40], combo: true, mods: [SHIFT_L] });
  for (const [p, l] of Object.entries(lower)) {
    if (typeof l === 'string' && l.length === 1 && !/[←↑→↓]/.test(l)) {
      add(l, { layer: 'lower', keys: [Number(p)], mods: [LOWER_KEY] });
    }
  }
  // Tab via M + , as an alternative
  METHODS['\t'].alts.push({ layer: 'base', keys: [37, 38], combo: true, mods: [] });

  function methodFor(ch) {
    return METHODS[ch] || null;
  }

  // --- Descriptions ----------------------------------------------------------
  function keyName(pos) {
    if (TAP[pos]) return TAP[pos].toUpperCase();
    return { 42: 'Lower', 43: 'Gui', 44: 'Alt', 45: 'Esc', 46: 'Space', 47: 'Raise' }[pos] || '?';
  }
  function where(pos) {
    const r = ROW(pos);
    return r === 3 ? FINGER_NAME[FINGER[pos]] : `${FINGER_NAME[FINGER[pos]]}, ${ROW_NAME[r]}`;
  }
  function modText(pos, layer) {
    if (pos === LOWER_KEY) return 'hold <b>Lower</b> <i>(left thumb, outer)</i>';
    if (pos === RAISE_KEY) return 'hold <b>Raise</b> <i>(right thumb, outer)</i>';
    if (layer === 'raise' && pos === SHIFT_L) return 'hold <b>A</b> <i>(Shift on Raise)</i>';
    return `hold <b>${keyName(pos)}</b> for Shift <i>(${where(pos)})</i>`;
  }
  function describeOne(m) {
    const parts = m.mods.map((p) => modText(p, m.layer));
    if (m.combo) {
      parts.push(`press <b>${m.keys.map(keyName).join('</b> + <b>')}</b> together <i>(combo)</i>`);
    } else {
      const pos = m.keys[0];
      const onKey = m.layer === 'base' ? `<b>${keyName(pos)}</b>` : `the <b>${keyName(pos)}</b> key`;
      parts.push(`tap ${onKey} <i>(${where(pos)})</i>`);
    }
    const s = parts.join(' + ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function describe(ch) {
    const m = methodFor(ch);
    if (!m) return 'This character is not on the keymap.';
    let s = describeOne(m);
    if (m.alts.length) s += `<span class="alt">or: ${m.alts.map(describeOne).join(' · or: ')}</span>`;
    return s;
  }

  const DISPLAY = { ' ': '␣', '\n': '↵', '\t': '⇥', '\b': '⌫', '\x7f': '⌦' };
  const displayChar = (ch) => DISPLAY[ch] || ch;

  // --- SVG keyboard ----------------------------------------------------------
  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, parent) => {
    const e = document.createElementNS(SVGNS, name);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  };
  const center = (pos) => {
    const p = PHYS[pos];
    let cx = p.x + 50, cy = p.y + 50;
    if (p.r) {
      const a = (p.r * Math.PI) / 180, dx = cx - p.rx, dy = cy - p.ry;
      cx = p.rx + dx * Math.cos(a) - dy * Math.sin(a);
      cy = p.ry + dx * Math.sin(a) + dy * Math.cos(a);
    }
    return [cx, cy];
  };

  function createKeyboard(svg, opts = {}) {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', opts.hands ? '85 -15 1250 655' : '85 -15 1250 505');
    svg.classList.add('kb');
    const keys = {};
    const keysG = el('g', {}, svg);
    for (const pos of POSITIONS) {
      const p = PHYS[pos];
      const g = el('g', { class: `key f-${FINGER[pos]} r${ROW(pos)}`, 'data-pos': pos }, keysG);
      if (p.r) g.setAttribute('transform', `rotate(${p.r} ${p.rx} ${p.ry})`);
      el('rect', { class: 'cap', x: p.x + 5, y: p.y + 5, width: 90, height: 90, rx: 14 }, g);
      el('rect', { class: 'finger', x: p.x + 20, y: p.y + 83, width: 60, height: 5, rx: 2.5 }, g);
      const t = el('text', { class: 'tap', x: p.x + 50, y: p.y + 52 }, g);
      const s = el('text', { class: 'shifted', x: p.x + 18, y: p.y + 28 }, g);
      const h = el('text', { class: 'hold', x: p.x + 50, y: p.y + 76 }, g);
      keys[pos] = { g, t, s, h };
    }
    const combosG = el('g', { class: 'combos' }, svg);
    const comboEls = COMBOS.map((c) => {
      const [x1, y1] = center(c.keys[0]), [x2, y2] = center(c.keys[1]);
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + 30;
      const g = el('g', { class: 'combo' }, combosG);
      el('rect', { x: cx - 19, y: cy - 15, width: 38, height: 30, rx: 9 }, g);
      el('text', { x: cx, y: cy + 1 }, g).textContent = c.label;
      return { c, g };
    });
    // Two hands below the keyboard; the finger for the next key lights up.
    const handEls = {};
    if (opts.hands) {
      const hands = el('g', { class: 'hands' }, svg);
      const ox = 260, oy = 470;
      for (const side of ['l', 'r']) {
        // The right hand is the left one mirrored around the middle of the keyboard.
        const g = el('g', side === 'r' ? { transform: 'translate(1420 0) scale(-1 1)' } : {}, hands);
        // Fingers first, so the palm covers their bases.
        [['p', 34], ['r', 6], ['m', -6], ['i', 10]].forEach(([f, top], i) => {
          handEls[side + f] = el('rect', {
            class: `hf f-${side}${f}`, x: ox + i * 42, y: oy + top, width: 36, height: 120 - top, rx: 18,
          }, g);
        });
        handEls[side + 't'] = el('rect', {
          class: `hf f-${side}t`, x: ox + 146, y: oy + 36, width: 36, height: 96, rx: 18,
          transform: `rotate(38 ${ox + 164} ${oy + 132})`,
        }, g);
        el('rect', { class: 'palm', x: ox - 4, y: oy + 92, width: 174, height: 56, rx: 26 }, g);
      }
    }

    const badge = el('text', { class: 'layer-badge', x: 710, y: 120 }, svg);
    const badgeNote = el('text', { class: 'layer-note', x: 710, y: 150 }, svg);

    let layer = null;
    let marked = [];

    function setLayer(id) {
      if (id === layer) return;
      layer = id;
      const L = LAYERS[id];
      for (const pos of POSITIONS) {
        let l = L.keys[pos];
        if (l == null) l = NONE;
        if (typeof l === 'string') l = { t: l };
        const k = keys[pos];
        k.t.textContent = l.t || '';
        k.s.textContent = l.s || '';
        k.h.textContent = l.h || '';
        k.g.classList.remove('none', 'held', 'layer', 'space', 'long');
        if (l.cls) k.g.classList.add(l.cls);
        if ((l.t || '').length > 2) k.g.classList.add('long');
      }
      badge.textContent = opts.showBadge === false ? '' : L.name;
      badgeNote.textContent = opts.showBadge === false ? '' : (L.note || '');
      combosG.style.display = id === 'adjust' ? 'none' : '';
    }

    function clearMarks() {
      for (const e of marked) e.classList.remove('next', 'next-mod', 'next-combo');
      marked = [];
    }
    function mark(e, cls) {
      e.classList.add(cls);
      marked.push(e);
    }
    function highlight(method) {
      clearMarks();
      if (!method) return setLayer('base');
      setLayer(method.layer);
      for (const p of method.keys) mark(keys[p].g, 'next');
      for (const p of method.mods) mark(keys[p].g, 'next-mod');
      if (opts.hands) {
        for (const p of method.mods) mark(handEls[FINGER[p]], 'next-mod');
        for (const p of method.keys) mark(handEls[FINGER[p]], 'next');
      }
      if (method.combo) {
        const ce = comboEls.find((x) => x.c.keys.join() === method.keys.join());
        if (ce) mark(ce.g, 'next-combo');
      }
    }
    function flash(positions, ok) {
      for (const p of positions) {
        const g = keys[p] && keys[p].g;
        if (!g) continue;
        g.classList.remove('flash-ok', 'flash-err');
        g.classList.add(ok ? 'flash-ok' : 'flash-err');
        clearTimeout(g._ft);
        g._ft = setTimeout(() => g.classList.remove('flash-ok', 'flash-err'), 180);
      }
    }
    function setDim(positions) {
      const set = new Set(positions);
      for (const pos of POSITIONS) keys[pos].g.classList.toggle('dim', set.has(pos));
    }
    function setHeat(map) {
      for (const pos of POSITIONS) {
        const cap = keys[pos].g.querySelector('.cap');
        cap.style.fill = map && map[pos] ? map[pos] : '';
      }
    }

    setLayer(opts.layer || 'base');
    return { setLayer, highlight, flash, setHeat, setDim, keys, svg };
  }

  global.Layout = {
    LAYOUTS, CURRENT, selectLayout,
    PHYS, POSITIONS, FINGER, FINGER_NAME, LAYERS, COMBOS, TAP, METHODS,
    methodFor, describe, displayChar, keyName, createKeyboard,
  };
})(window);
