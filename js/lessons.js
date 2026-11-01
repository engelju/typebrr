/*
 * Lessons and text generators. Every generator returns a string; the app
 * shows special characters (\n, \t, \b, \x7f) as symbols.
 */
(function (global) {
  'use strict';

  const WORDS = global.WORDS || [];
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rnd(arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Made-up words for when there are too few real words with the allowed letters.
  function pseudoWord(letters, focus) {
    const len = 2 + rnd(4);
    let w = '';
    for (let i = 0; i < len; i++) w += Math.random() < 0.45 && focus.length ? pick(focus) : pick(letters);
    return w;
  }

  function wordsFrom(letters, focus, count) {
    const allowed = new Set(letters);
    const pool = WORDS.filter((w) => [...w].every((c) => allowed.has(c)));
    const withFocus = focus.length ? pool.filter((w) => focus.some((c) => w.includes(c))) : pool;
    const out = [];
    for (let i = 0; i < count; i++) {
      const fromPool = withFocus.length >= 12 ? withFocus : pool;
      if (fromPool.length >= 12 && Math.random() < 0.8) out.push(pick(fromPool.slice(0, 400)));
      else out.push(pseudoWord(letters, focus));
    }
    return out;
  }

  // --- Letter lessons -------------------------------------------------------
  const STAGES = global.Layout.CURRENT.stages;
  const TAP = global.Layout.TAP;

  const LESSONS = [];
  let acc = '';
  for (const [name, add] of STAGES) {
    const letters = (acc += add).split('');
    const focus = add.split('');
    LESSONS.push({
      name,
      keys: focus,
      gen: () => wordsFrom(letters, focus, 28).join(' '),
    });
  }

  const ALL = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const common = (n) => WORDS.slice(0, n);
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

  function sentences(count, opts = {}) {
    const out = [];
    let n = 0;
    while (n < count) {
      const len = 4 + rnd(7);
      const ws = [];
      for (let i = 0; i < len; i++) ws.push(pick(common(opts.pool || 300)));
      if (opts.caps) ws[0] = cap(ws[0]);
      if (opts.commas && len > 6) ws[2 + rnd(len - 4)] += ',';
      ws[ws.length - 1] += opts.endings ? pick(opts.endings) : '.';
      out.push(ws.join(' '));
      n += len;
    }
    return out.join(' ');
  }

  LESSONS.push(
    {
      name: 'Punctuation , . ; /',
      keys: [',', '.', ';', '/'],
      gen: () => {
        const out = [];
        for (let i = 0; i < 22; i++) {
          const w = pick(common(400));
          out.push(pick([w, w, w + ',', w + '.', w + ';', w + '/' + pick(common(200))]));
        }
        return out.join(' ');
      },
    },
    {
      name: `Capitals (Shift on ${TAP[14].toUpperCase()} / ${TAP[26].toUpperCase()})`,
      keys: ['A', 'U'],
      gen: () => sentences(30, { caps: true, commas: true, endings: ['.', '.', '?', ':'] })
        .replace(/\b(\w)/g, (m) => (Math.random() < 0.35 ? m.toUpperCase() : m)),
    },
    {
      name: 'Combos: Enter & Backspace',
      keys: ['\n', '\b'],
      gen: () => {
        const out = [];
        for (let i = 0; i < 20; i++) {
          let w = pick(common(300));
          if (Math.random() < 0.4) w += pick(ALL) + '\b';
          out.push(w);
          out.push(Math.random() < 0.3 ? '\n' : ' ');
        }
        return out.join('').trim();
      },
    },
    {
      name: "Combos: Tab, Delete & '",
      keys: ['\t', '\x7f', "'"],
      gen: () => {
        const out = [];
        for (let i = 0; i < 18; i++) {
          const w = pick(common(300));
          out.push(pick([w, "'" + w + "'", '\t' + w, w + '\x7f', '"' + w + '"', w + "'s"]));
        }
        return out.join(' ');
      },
    },
    {
      name: 'Numbers (Lower)',
      keys: '0123456789'.split(''),
      gen: () => {
        const out = [];
        for (let i = 0; i < 22; i++) {
          out.push(pick([
            String(rnd(10)), String(rnd(100)), String(rnd(10000)),
            `${1 + rnd(28)}.${1 + rnd(12)}.20${10 + rnd(20)}`,
            `${rnd(24)}:${String(rnd(60)).padStart(2, '0')}`,
            pick(common(200)),
          ]));
        }
        return out.join(' ');
      },
    },
    {
      name: 'Brackets ( ) [ ] { }',
      keys: ['(', ')', '[', ']', '{', '}'],
      gen: () => {
        const out = [];
        for (let i = 0; i < 18; i++) {
          const w = pick(common(300));
          out.push(pick([`(${w})`, `[${w}]`, `{${w}}`, `${w}()`, `${w}[${rnd(10)}]`, `{ ${w} }`]));
        }
        return out.join(' ');
      },
    },
    {
      name: 'Symbols (Raise)',
      keys: '!@#$%^&*=+-_~\\|`'.split(''),
      gen: () => symbolDrill(20),
    },
  );

  function symbolDrill(count) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const a = pick(common(200)), b = pick(common(200));
      out.push(pick([
        `${a} = ${b}`, `${a} + ${rnd(10)}`, `${a} - ${b}`, `${a}_${b}`, `${a} * ${rnd(10)}`,
        `$${rnd(100)}`, `${rnd(100)}%`, `#${a}`, `@${a}`, `${a}!`, `${a} & ${b}`, `~/${a}`,
        `${a} | ${b}`, `\\${a}`, `\`${a}\``, `2^${rnd(10)}`, `${a} != ${b}`, `${a} == ${b}`,
      ]));
    }
    return out.join(' ');
  }

  // --- Free practice --------------------------------------------------------
  const CODE_LINES = [
    (a, b) => `const ${a} = ${b}(${rnd(10)});`,
    (a, b) => `if (${a} > ${rnd(100)}) {`,
    (a, b) => `  return ${a}[${b}];`,
    () => '}',
    (a, b) => `for (let i = 0; i < ${a}.length; i++) {`,
    (a, b) => `  ${a} += ${b} * 2;`,
    (a, b) => `${a}.${b} = { ${a}: '${b}' };`,
    (a, b) => `let ${a}_${b} = [${rnd(9)}, ${rnd(9)}, ${rnd(9)}];`,
    (a, b) => `def ${a}(${b}):`,
    (a, b) => `  print(f"${a} {${b}}")`,
    (a, b) => `# ${a} ${b}`,
    (a, b) => `${a} := ${b} && !${a}`,
    (a, b) => `cd ~/${a}/${b} | grep -i "${a}"`,
  ];

  const FREE = {
    words200: { name: 'Top 200 words', gen: () => shuffle(common(200)).slice(0, 35).join(' ') },
    words2000: { name: 'Top 2000 words', gen: () => shuffle(common(2000)).slice(0, 35).join(' ') },
    sentences: { name: 'Sentences', gen: () => sentences(40, { caps: true, commas: true, pool: 600 }) },
    numbers: { name: 'Numbers & symbols', gen: () => LESSONS.find((l) => l.name.startsWith('Numbers')).gen() + ' ' + symbolDrill(10) },
    code: {
      name: 'Code',
      gen: () => {
        const lines = [];
        for (let i = 0; i < 8; i++) lines.push(pick(CODE_LINES)(pick(common(300)), pick(common(300))));
        return lines.join('\n');
      },
    },
  };

  // Words that contain the given weak characters. Non-letters get attached to words.
  function weakText(weakChars) {
    const letters = weakChars.filter((c) => /[a-z]/.test(c));
    const others = weakChars.filter((c) => !/[a-z]/.test(c) && c !== ' ');
    const out = [];
    for (let i = 0; i < 30; i++) {
      let w;
      if (letters.length) {
        const pool = WORDS.filter((x) => letters.some((c) => x.includes(c)));
        w = pick(pool.slice(0, 600));
      } else {
        w = pick(common(300));
      }
      if (others.length && Math.random() < 0.5) {
        const c = pick(others);
        if (/[A-Z]/.test(c)) {
          const starts = WORDS.filter((x) => x[0] === c.toLowerCase());
          w = cap(starts.length ? pick(starts.slice(0, 100)) : w);
          if (w[0] !== c) w = c + w;
        } else {
          w += c;
        }
      }
      out.push(w);
    }
    return out.join(' ');
  }

  global.Lessons = { LESSONS, FREE, weakText, LETTER_LESSONS: STAGES.length };
})(window);
