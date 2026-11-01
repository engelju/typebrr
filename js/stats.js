/*
 * Persistent stats in localStorage. Per character we keep moving averages of
 * error rate (e) and time to type it in ms (s), so recent practice counts more.
 */
(function (global) {
  'use strict';

  // One store per layout; STD keeps the original key so existing progress stays.
  const layout = global.Layout.CURRENT;
  const KEY = layout.id === 'std' ? 'typbrr.v1' : `typbrr.v1.${layout.id}`;
  const ERR_ALPHA = 0.08;
  const SPEED_ALPHA = 0.12;

  function fresh() {
    return { chars: {}, sessions: [], unlocked: 0, mode: { type: 'lesson', idx: 0 }, emulate: layout.emulate };
  }
  // Stored data is untrusted (all github.io pages of a user share one origin),
  // so only keep known fields with the expected types.
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const obj = (v) => (v && typeof v === 'object' ? v : {});
  function sanitize(d) {
    d = obj(d);
    const clean = fresh();
    for (const [ch, c] of Object.entries(obj(d.chars))) {
      if ([...ch].length !== 1) continue;
      const x = obj(c);
      clean.chars[ch] = { n: num(x.n), e: num(x.e), s: num(x.s), t: num(x.t) };
    }
    if (Array.isArray(d.sessions)) {
      clean.sessions = d.sessions.map(obj).map((s) => ({
        t: num(s.t), mode: typeof s.mode === 'string' ? s.mode : '',
        wpm: num(s.wpm), acc: num(s.acc), chars: num(s.chars),
      }));
    }
    clean.unlocked = Math.max(0, Math.floor(num(d.unlocked)));
    const m = obj(d.mode);
    if (m.type === 'free' && typeof m.id === 'string') clean.mode = { type: 'free', id: m.id };
    else if (m.type === 'weak') clean.mode = { type: 'weak' };
    else clean.mode = { type: 'lesson', idx: Math.max(0, Math.floor(num(m.idx))) };
    if (typeof d.emulate === 'boolean') clean.emulate = d.emulate;
    return clean;
  }

  let data;
  try {
    data = sanitize(JSON.parse(localStorage.getItem(KEY)));
  } catch (e) {
    data = fresh();
  }
  const save = () => localStorage.setItem(KEY, JSON.stringify(data));

  function charStat(ch) {
    return data.chars[ch] || (data.chars[ch] = { n: 0, e: 0, s: 0, t: 0 });
  }
  function hit(ch, ms) {
    const c = charStat(ch);
    c.n++;
    c.e += ERR_ALPHA * (0 - c.e);
    if (ms != null && ms < 3000) {
      c.s = c.t ? c.s + SPEED_ALPHA * (ms - c.s) : ms;
      c.t++;
    }
  }
  function miss(ch) {
    const c = charStat(ch);
    c.e += ERR_ALPHA * (1 - c.e);
  }

  function addSession(s) {
    data.sessions.push(s);
    if (data.sessions.length > 500) data.sessions.shift();
    save();
  }

  function avgSpeed() {
    const vals = Object.values(data.chars).filter((c) => c.t >= 3).map((c) => c.s);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  // Characters sorted by how much practice they need.
  function weakChars(n, filter = () => true) {
    const avg = avgSpeed() || 1;
    return Object.entries(data.chars)
      .filter(([ch, c]) => c.n >= 5 && ch !== ' ' && filter(ch))
      .map(([ch, c]) => ({ ch, c, score: c.e * 4 + Math.max(0, (c.s - avg) / avg) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }

  // --- Heatmap ---------------------------------------------------------------
  let heatKb = null;
  let heatMode = 'err';

  function renderHeat() {
    const L = global.Layout;
    if (!heatKb) heatKb = L.createKeyboard(document.getElementById('heatmap'), { showBadge: false });
    const avg = avgSpeed();
    const colors = {};
    for (const [pos, ch] of Object.entries(L.TAP)) {
      const c = data.chars[ch];
      if (!c || c.n < 3) continue;
      let bad;
      if (heatMode === 'err') bad = Math.min(1, c.e / 0.15);
      else if (avg && c.t >= 3) bad = Math.max(0, Math.min(1, (c.s / avg - 0.7) / 0.8));
      else continue;
      colors[pos] = `hsl(${Math.round(130 * (1 - bad))} 55% 32%)`;
    }
    heatKb.setHeat(colors);

    const weak = weakChars(8);
    const weakEl = document.getElementById('weak');
    weakEl.innerHTML = weak.length
      ? '<b>Weakest:</b> ' + weak.map(({ ch, c }) =>
        `<span class="chip"><kbd>${esc(L.displayChar(ch))}</kbd> ${Math.round(c.e * 100)}% · ${Math.round(c.s)}ms</span>`).join('')
      : '<i>Type a bit to collect stats.</i>';
  }

  // --- History chart ---------------------------------------------------------
  function renderHistory() {
    const cv = document.getElementById('history');
    const g = cv.getContext('2d');
    const W = cv.width, H = cv.height, P = 28;
    g.clearRect(0, 0, W, H);
    const ss = data.sessions.slice(-60);
    const css = getComputedStyle(document.body);
    const fg = css.getPropertyValue('--muted'), c1 = css.getPropertyValue('--accent'), c2 = css.getPropertyValue('--ok');
    g.font = '11px system-ui';
    g.fillStyle = fg;
    if (ss.length < 2) {
      g.fillText('Finish a few rounds to see your progress.', P, H / 2);
    } else {
      const maxW = Math.max(20, ...ss.map((s) => s.wpm)) * 1.1;
      const x = (i) => P + (i * (W - 2 * P)) / (ss.length - 1);
      const line = (vals, max, min, color) => {
        g.strokeStyle = color;
        g.lineWidth = 2;
        g.beginPath();
        vals.forEach((v, i) => {
          const y = H - P - ((v - min) / (max - min)) * (H - 2 * P);
          i ? g.lineTo(x(i), y) : g.moveTo(x(i), y);
        });
        g.stroke();
      };
      g.strokeStyle = 'rgba(128,128,128,.2)';
      for (let i = 0; i <= 4; i++) {
        const y = P + (i * (H - 2 * P)) / 4;
        g.beginPath(); g.moveTo(P, y); g.lineTo(W - P, y); g.stroke();
        g.fillText(Math.round(maxW * (1 - i / 4)), 2, y + 4);
        g.fillText(Math.round(100 - 10 * i) + '%', W - P + 3, y + 4);
      }
      line(ss.map((s) => s.wpm), maxW, 0, c1);
      line(ss.map((s) => Math.max(60, s.acc)), 100, 60, c2);
      g.fillStyle = c1; g.fillText('wpm', P + 4, 12);
      g.fillStyle = c2; g.fillText('accuracy', P + 40, 12);
    }

    const all = data.sessions;
    const last10 = all.slice(-10);
    const avg = (arr, k) => (arr.length ? arr.reduce((a, s) => a + s[k], 0) / arr.length : 0);
    document.getElementById('totals').innerHTML = all.length
      ? `${all.length} rounds · ${all.reduce((a, s) => a + s.chars, 0)} chars typed · ` +
        `best ${Math.max(...all.map((s) => s.wpm))} wpm · last 10: ${avg(last10, 'wpm').toFixed(1)} wpm, ${avg(last10, 'acc').toFixed(1)}%`
      : '';
  }

  function esc(s) {
    return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function render() {
    renderHeat();
    renderHistory();
  }

  document.getElementById('heat-switch').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    heatMode = b.dataset.heat;
    for (const x of e.currentTarget.children) x.classList.toggle('on', x === b);
    renderHeat();
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm(`Delete all ${layout.name} stats, history and lesson progress?`)) return;
    const keep = { mode: data.mode, emulate: data.emulate };
    data = Object.assign(fresh(), keep);
    save();
    render();
    global.dispatchEvent(new Event('typbrr:reset'));
  });

  global.Stats = {
    get data() { return data; },
    save, hit, miss, addSession, weakChars, render, esc,
  };
})(window);
