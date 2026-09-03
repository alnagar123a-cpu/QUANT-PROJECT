/* ============================================================
   MODULE 5 — Technical Indicators (levels 57–70)
   ============================================================ */
(function () {
  'use strict';
  var C = window.CURRICULUM, CX = window.CX;

  C.push({
    id: 'd057', day: 57, module: 5, minutes: 30,
    title: 'The Simple Moving Average',
    subtitle: 'The first indicator, and the warm-up problem every indicator has.',
    goal: '<b>Goal:</b> implement a batch SMA over a whole series, correctly handling the bars where it is not yet defined.',
    objectives: [
      'Compute an SMA over a rolling window',
      'Return <code>null</code> for the warm-up period rather than a partial value',
      'Use a running sum instead of re-summing each window',
      'Explain what an SMA does and does not tell you'
    ],
    sections: [
      { h: 'The definition',
        body: '<p>The <em>n</em>-period simple moving average at bar <em>i</em> is the mean of the closes from <code>i-n+1</code> to <code>i</code> inclusive. Before bar <em>n−1</em> there is not enough history, and the honest answer is "undefined".</p>' +
              '<p>Returning <code>null</code> there matters: a 20-period SMA computed from 3 bars is not a slow average, it is a fast one wearing the wrong label, and every crossover it produces is fictional.</p>',
        code: 'function sma(series, n) {\n  return series.map((_, i) =>\n    i < n - 1 ? null\n              : series.slice(i - n + 1, i + 1).reduce((a, v) => a + v, 0) / n);\n}\n\nconsole.log(sma([10, 12, 11, 15, 14], 3));' },
      { h: 'The naive version is O(n × period)',
        body: '<p>Re-summing the window on every bar is fine for 78 bars and painful for a million. The rolling form adds the incoming value and subtracts the outgoing one — one add and one subtract per bar, whatever the period.</p>',
        code: 'function smaFast(series, n) {\n  const out = new Array(series.length).fill(null);\n  let sum = 0;\n  for (let i = 0; i < series.length; i++) {\n    sum += series[i];\n    if (i >= n) sum -= series[i - n];      // drop the value leaving the window\n    if (i >= n - 1) out[i] = sum / n;\n  }\n  return out;\n}\n\nconsole.log(smaFast([10, 12, 11, 15, 14], 3));' },
      { h: 'What it actually measures',
        body: '<p>An SMA is the average price a holder over the last <em>n</em> bars would have paid. Price above it means recent buyers are, on average, in profit. That is the entire intuition — everything else is inference.</p>' +
              '<div class="note note-warn"><b>Every moving average lags</b>An SMA of period <em>n</em> lags by roughly <em>n</em>/2 bars by construction. It cannot turn before the data does. Anyone selling you a non-lagging moving average is selling you a look-ahead bug.</div>',
        code: 'const s = MARKET.closes;\nconst fast = (function (a, n) {\n  return a.map((_, i) => i < n - 1 ? null : a.slice(i - n + 1, i + 1).reduce((x, y) => x + y, 0) / n);\n})(s, 9);\n\nconsole.log("close:", s.at(-1).toFixed(2), " sma9:", fast.at(-1).toFixed(2));\nconsole.log("first 10 SMA values:", fast.slice(0, 10));' },
      { h: 'Aligning an indicator with its bars',
        body: '<p>Keep indicator arrays the same length as the price array, with <code>null</code> padding at the front. Then <code>indicator[i]</code> always refers to <code>bars[i]</code> and no offset arithmetic is needed anywhere else — which is exactly where off-by-one bugs come from.</p>' }
    ],
    parsons: {
      prompt: 'Compute a rolling sum that drops the value leaving the window.',
      lines: [
        'let sum = 0;',
        'for (let i = 0; i < series.length; i++) {',
        '  sum += series[i];',
        '  if (i >= n) sum -= series[i - n];',
        '  if (i >= n - 1) out[i] = sum / n;',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'sma()', difficulty: 'Core',
        prompt: 'Write <code>sma(series, n)</code> returning an array the same length as <code>series</code>, with <code>null</code> for the first <code>n-1</code> entries and the simple moving average thereafter.<br>' +
          'An <code>n</code> of 1 returns a copy of the series. An <code>n</code> larger than the series returns all nulls.',
        starter: 'function sma(series, n) {\n  // same length, nulls during the warm-up\n}\n',
        solution: 'function sma(series, n) {\n  const out = new Array(series.length).fill(null);\n  let sum = 0;\n  for (let i = 0; i < series.length; i++) {\n    sum += series[i];\n    if (i >= n) sum -= series[i - n];\n    if (i >= n - 1) out[i] = sum / n;\n  }\n  return out;\n}',
        hints: ['Start with an array of nulls the same length as the input.',
                'Keep a running sum: add <code>series[i]</code>, and once <code>i &gt;= n</code> subtract <code>series[i - n]</code>.',
                'Only write a value once <code>i &gt;= n - 1</code>.'],
        tests: { fn: 'sma', approx: 1e-9, cases: [
          { args: [[10, 12, 11, 15, 14], 3], expect: [null, null, 11, 38 / 3, 40 / 3] },
          { args: [[1, 2, 3], 1], expect: [1, 2, 3], name: 'a period of 1 is the series itself' },
          { args: [[1, 2], 5], expect: [null, null], name: 'too little data is all nulls' },
          { args: [[], 3], expect: [] },
          { args: [[2, 4, 6, 8], 2], expect: [null, 3, 5, 7] }
        ], checks: [{
          name: 'matches a brute-force average on the real session', expose: ['sma'],
          run: function (s) {
            var out = s.sma(MARKET.closes, 20);
            if (out.length !== MARKET.closes.length) return 'the output must be the same length as the input';
            for (var i = 19; i < MARKET.closes.length; i++) {
              var want = MARKET.closes.slice(i - 19, i + 1).reduce(function (a, b) { return a + b; }, 0) / 20;
              if (Math.abs(out[i] - want) > 1e-6) return 'index ' + i + ': expected ' + want + ', got ' + out[i];
            }
            return true;
          }
        }] } },
      { id: 'e2', title: 'smaCross()', difficulty: 'Core',
        prompt: 'Write <code>smaCross(series, fastN, slowN)</code> returning an array the same length as <code>series</code> where each entry is:<ul>' +
          '<li><code>"long"</code> on a bar where the fast SMA moves from at-or-below the slow SMA to above it</li>' +
          '<li><code>"short"</code> on a bar where it moves from at-or-above to below</li>' +
          '<li><code>null</code> otherwise, including any bar where either SMA is still <code>null</code></li></ul>' +
          '<span class="muted">The <code>sma</code> function is provided in the starter.</span>',
        starter: 'function sma(series, n) {\n  const out = new Array(series.length).fill(null);\n  let sum = 0;\n  for (let i = 0; i < series.length; i++) {\n    sum += series[i];\n    if (i >= n) sum -= series[i - n];\n    if (i >= n - 1) out[i] = sum / n;\n  }\n  return out;\n}\n\nfunction smaCross(series, fastN, slowN) {\n  // "long", "short" or null per bar\n}\n',
        solution: 'function sma(series, n) {\n  const out = new Array(series.length).fill(null);\n  let sum = 0;\n  for (let i = 0; i < series.length; i++) {\n    sum += series[i];\n    if (i >= n) sum -= series[i - n];\n    if (i >= n - 1) out[i] = sum / n;\n  }\n  return out;\n}\n\nfunction smaCross(series, fastN, slowN) {\n  const f = sma(series, fastN), s = sma(series, slowN);\n  return series.map((_, i) => {\n    if (i === 0) return null;\n    if (f[i] === null || s[i] === null || f[i - 1] === null || s[i - 1] === null) return null;\n    const nowAbove = f[i] > s[i], wasAbove = f[i - 1] > s[i - 1];\n    if (nowAbove && !wasAbove) return "long";\n    if (!nowAbove && wasAbove) return "short";\n    return null;\n  });\n}',
        hints: ['Compute both SMAs first, then walk the bars comparing each with the one before.',
                'A cross needs four defined values: both SMAs at <code>i</code> and at <code>i-1</code>.',
                'Reduce it to two booleans — <code>nowAbove</code> and <code>wasAbove</code> — and compare them.'],
        tests: { fn: 'smaCross', cases: [
          { args: [[1, 2, 3, 4, 5], 2, 3],
            check: function (out) {
              if (!Array.isArray(out) || out.length !== 5) return 'expected an array of 5 entries';
              if (out[0] !== null || out[1] !== null) return 'the warm-up bars must be null';
              return true;
            }, name: 'warm-up bars are null' },
          { args: [[10, 10, 10, 10, 20, 30, 40], 2, 4],
            check: function (out) {
              var longs = out.filter(function (v) { return v === 'long'; }).length;
              return longs === 1 ? true : 'a single rally should give exactly one long cross, got ' + longs;
            }, name: 'a rally produces one long cross' },
          { args: [[40, 30, 20, 10, 20, 30, 40, 50, 40, 30, 20, 10], 2, 4],
            check: function (out) {
              var kinds = out.filter(function (v) { return v !== null; });
              if (kinds.indexOf('long') < 0) return 'expected a long cross on the way up';
              return kinds.indexOf('short') >= 0 ? true : 'expected a short cross on the way down';
            }, name: 'fires in both directions' },
          { args: [[5, 5, 5, 5, 5, 5], 2, 3],
            check: function (out) {
              return out.every(function (v) { return v === null; }) ? true : 'a flat series should produce no crosses';
            }, name: 'a flat series produces no crosses' }
        ] } },
      { id: 'e3', title: 'weightedMovingAverage()', difficulty: 'Stretch',
        prompt: 'A weighted moving average gives linearly increasing weight to newer bars: the oldest value in the window has weight 1, the next 2, up to <em>n</em> for the newest. Divide by the sum of the weights.<br>' +
          'Write <code>wma(series, n)</code> with the same <code>null</code>-padding convention.<br>' +
          '<code>wma([1,2,3], 3)</code> → <code>[null, null, (1×1 + 2×2 + 3×3) / 6]</code> = <code>[null, null, 2.333…]</code>',
        starter: 'function wma(series, n) {\n  // linearly weighted moving average\n}\n',
        solution: 'function wma(series, n) {\n  const denom = n * (n + 1) / 2;\n  return series.map((_, i) => {\n    if (i < n - 1) return null;\n    let acc = 0;\n    for (let k = 0; k < n; k++) acc += series[i - n + 1 + k] * (k + 1);\n    return acc / denom;\n  });\n}',
        hints: ['The weights are 1..n, so their sum is <code>n * (n + 1) / 2</code>.',
                'Walk the window from oldest to newest, multiplying by the position <code>k + 1</code>.',
                'Keep the same <code>null</code> padding as the SMA.'],
        tests: { fn: 'wma', approx: 1e-9, cases: [
          { args: [[1, 2, 3], 3], expect: [null, null, 14 / 6] },
          { args: [[10, 20], 1], expect: [10, 20], name: 'a period of 1 is the series itself' },
          { args: [[1, 2, 3, 4], 2], expect: [null, (1 * 1 + 2 * 2) / 3, (2 * 1 + 3 * 2) / 3, (3 * 1 + 4 * 2) / 3] },
          { args: [[5], 3], expect: [null] },
          { args: [[], 2], expect: [] }
        ], checks: [{
          name: 'weights the newest bar most heavily', expose: ['wma'],
          run: function (s) {
            var flat = s.wma([10, 10, 10], 3);
            if (Math.abs(flat[2] - 10) > 1e-9) return 'a flat window should average to the flat value';
            var rising = s.wma([0, 0, 10], 3);
            return rising[2] > 10 / 3 ? true : 'the newest value should pull the average up more than an SMA would';
          }
        }] } }
    ],
    quiz: [
      { q: 'Why return <code>null</code> for the first <code>n-1</code> bars of an SMA?',
        options: ['To save memory', 'A partial average is a different, faster indicator — treating it as the SMA invents signals', 'Because 0 is falsy', 'It is optional'],
        answer: 1,
        explain: 'Every backtest has a warm-up. Emitting a "20-period average" of 3 bars fabricates crossovers at the start of every run.' },
      { q: 'What does the rolling-sum technique change?',
        options: ['The result', 'The cost, from O(n × period) to O(n)', 'The lag', 'The warm-up length'],
        answer: 1,
        explain: 'One add and one subtract per bar regardless of period. The values are identical.' },
      { q: 'How much does a 20-period SMA lag?',
        options: ['Not at all', 'Roughly 10 bars', '20 bars', 'It leads price'],
        answer: 1,
        explain: 'Roughly half the period, by construction. Any average of past data must lag it.' }
    ],
    recap: [
      'SMA at bar <em>i</em> is the mean of the last <em>n</em> closes.',
      'Pad the warm-up with <code>null</code> and keep the array aligned with the bars.',
      'A rolling sum makes it linear in the number of bars.',
      'Every moving average lags by roughly half its period.'
    ],
    vocab: [
      { term: 'Moving average', def: 'A smoothed version of price. Used to define trend direction and as dynamic support or resistance.' },
      { term: 'Lag', def: 'How far behind the data an indicator turns. The unavoidable price of smoothing.' }
    ]
  });

  C.push({
    id: 'd058', day: 58, module: 5, minutes: 30,
    title: 'The Exponential Moving Average',
    subtitle: 'Constant memory, recent-weighted, and the basis of MACD.',
    goal: '<b>Goal:</b> implement a batch EMA that matches the standard convention, and understand what alpha controls.',
    objectives: [
      'Apply the EMA recurrence over a series',
      'Compute alpha from a period',
      'Seed the EMA correctly and know why the choice matters',
      'Compare EMA and SMA responsiveness'
    ],
    sections: [
      { h: 'The recurrence',
        body: '<p class="mono" style="color:var(--fg)">EMA<sub>i</sub> = α × price<sub>i</sub> + (1 − α) × EMA<sub>i−1</sub>,&nbsp;&nbsp; α = 2 / (n + 1)</p>' +
              '<p>Every past price still contributes, but its weight decays geometrically. Unlike the SMA, nothing ever "leaves the window" — which is why one number of state is enough.</p>',
        code: 'function ema(series, n) {\n  const a = 2 / (n + 1);\n  const out = [];\n  let prev = null;\n  for (const p of series) {\n    prev = prev === null ? p : a * p + (1 - a) * prev;\n    out.push(prev);\n  }\n  return out;\n}\n\nconsole.log(ema([10, 12, 11, 15, 14], 3).map(v => v.toFixed(3)));' },
      { h: 'What alpha means',
        body: '<p>α is the weight given to the newest price. A 3-period EMA has α = 0.5 — half the value is the latest bar. A 200-period EMA has α ≈ 0.01, so it barely moves.</p>',
        code: '[3, 9, 20, 50, 200].forEach(n =>\n  console.log(`period ${n}: alpha ${(2 / (n + 1)).toFixed(4)}`));' },
      { h: 'Seeding',
        body: '<p>There is no single correct seed. Two conventions dominate:</p>' +
              '<ul><li><strong>First price</strong> — simple, converges quickly, what most charting libraries do.</li>' +
              '<li><strong>SMA of the first <em>n</em> bars</strong> — what TradingView and most Pine scripts do, with <code>null</code> before that.</li></ul>' +
              '<div class="note note-warn"><b>Seeding differences are real</b>Two EMAs with different seeds converge but are not identical for the first few multiples of the period. If your backtest disagrees with your charting platform at the start of the series, this is usually why.</div>',
        code: 'function emaSeededWithSma(series, n) {\n  const a = 2 / (n + 1);\n  const out = new Array(series.length).fill(null);\n  if (series.length < n) return out;\n  let prev = series.slice(0, n).reduce((x, y) => x + y, 0) / n;\n  out[n - 1] = prev;\n  for (let i = n; i < series.length; i++) {\n    prev = a * series[i] + (1 - a) * prev;\n    out[i] = prev;\n  }\n  return out;\n}\n\nconsole.log(emaSeededWithSma([10, 12, 11, 15, 14], 3).map(v => v === null ? null : +v.toFixed(3)));' },
      { h: 'EMA versus SMA',
        body: '<p>The EMA turns sooner because the newest bar carries more weight. That is an advantage in a trend and a liability in chop, where it whipsaws more. Neither is better; they trade responsiveness against noise.</p>',
        code: 'const s = MARKET.closes.slice(-20);\nconst a = 2 / 10;\nlet e = s[0];\nconst emas = s.map(p => (e = a * p + (1 - a) * e));\nconst smas = s.map((_, i) => i < 8 ? null : s.slice(i - 8, i + 1).reduce((x, y) => x + y, 0) / 9);\n\nconsole.log("last close:", s.at(-1).toFixed(2));\nconsole.log("ema9:", emas.at(-1).toFixed(2), " sma9:", smas.at(-1).toFixed(2));' }
    ],
    parsons: {
      prompt: 'Apply the EMA recurrence across a series.',
      lines: [
        'const alpha = 2 / (n + 1);',
        'let prev = null;',
        'const out = series.map(price => {',
        '  prev = prev === null ? price : alpha * price + (1 - alpha) * prev;',
        '  return prev;',
        '});'
      ]
    },
    exercises: [
      { id: 'e1', title: 'ema()', difficulty: 'Core',
        prompt: 'Write <code>ema(series, n)</code> returning an array the same length as <code>series</code>, seeded with the <strong>first price</strong> and applying the recurrence thereafter.<br>' +
          'An empty series returns an empty array.',
        starter: 'function ema(series, n) {\n  // seed with the first price, then the recurrence\n}\n',
        solution: 'function ema(series, n) {\n  const a = 2 / (n + 1);\n  let prev = null;\n  return series.map(p => (prev = prev === null ? p : a * p + (1 - a) * prev));\n}',
        hints: ['Compute alpha once, outside the loop.',
                'Track <code>prev</code> across iterations; the first bar seeds it.',
                'An assignment expression can be returned directly from a <code>map</code> callback.'],
        tests: { fn: 'ema', approx: 1e-9, cases: [
          { args: [[10], 3], expect: [10], name: 'the first value seeds the EMA' },
          { args: [[10, 12], 3], expect: [10, 0.5 * 12 + 0.5 * 10] },
          { args: [[], 5], expect: [] },
          { args: [[5, 5, 5, 5], 4], expect: [5, 5, 5, 5], name: 'a flat series stays flat' }
        ], checks: [{
          name: 'alpha is 2/(period+1)', expose: ['ema'],
          run: function (s) {
            var out = s.ema([100, 110], 9);
            var want = 0.2 * 110 + 0.8 * 100;
            return Math.abs(out[1] - want) < 1e-9 ? true : 'expected ' + want + ', got ' + out[1];
          }
        }, {
          name: 'output length always matches the input', expose: ['ema'],
          run: function (s) {
            var out = s.ema(MARKET.closes, 21);
            return out.length === MARKET.closes.length ? true : 'got length ' + out.length;
          }
        }] } },
      { id: 'e2', title: 'emaSma()', difficulty: 'Core',
        prompt: 'Write <code>emaSma(series, n)</code> using the charting-platform convention:<ul>' +
          '<li><code>null</code> for the first <code>n-1</code> bars</li>' +
          '<li>at bar <code>n-1</code>, the simple average of the first <code>n</code> values</li>' +
          '<li>the EMA recurrence from bar <code>n</code> onwards</li></ul>' +
          'A series shorter than <code>n</code> returns all nulls.',
        starter: 'function emaSma(series, n) {\n  // SMA-seeded EMA with null padding\n}\n',
        solution: 'function emaSma(series, n) {\n  const a = 2 / (n + 1);\n  const out = new Array(series.length).fill(null);\n  if (series.length < n) return out;\n  let prev = series.slice(0, n).reduce((x, y) => x + y, 0) / n;\n  out[n - 1] = prev;\n  for (let i = n; i < series.length; i++) {\n    prev = a * series[i] + (1 - a) * prev;\n    out[i] = prev;\n  }\n  return out;\n}',
        hints: ['Guard the too-short case first and return the all-null array.',
                'The seed goes at index <code>n-1</code>, not index 0.',
                'The recurrence loop starts at <code>i = n</code>.'],
        tests: { fn: 'emaSma', approx: 1e-9, cases: [
          { args: [[10, 12, 11], 3], expect: [null, null, 11] },
          { args: [[10, 12, 11, 15], 3], expect: [null, null, 11, 0.5 * 15 + 0.5 * 11] },
          { args: [[1, 2], 5], expect: [null, null], name: 'too short is all nulls' },
          { args: [[], 3], expect: [] },
          { args: [[7, 7, 7, 7], 2], expect: [null, 7, 7, 7] }
        ] } },
      { id: 'e3', title: 'Compare responsiveness', difficulty: 'Stretch',
        prompt: 'Write <code>responsiveness(series, n)</code> returning <code>{ emaLast, smaLast, emaCloser }</code>:<ul>' +
          '<li><code>emaLast</code> — the final value of a first-price-seeded EMA of period <code>n</code></li>' +
          '<li><code>smaLast</code> — the final value of an <code>n</code>-period SMA</li>' +
          '<li><code>emaCloser</code> — whether the EMA ends strictly closer to the last price than the SMA does</li></ul>' +
          'If the series is shorter than <code>n</code>, return <code>{ emaLast: null, smaLast: null, emaCloser: false }</code>.',
        starter: 'function responsiveness(series, n) {\n  // compare an EMA and an SMA against the last price\n}\n',
        solution: 'function responsiveness(series, n) {\n  if (series.length < n) return { emaLast: null, smaLast: null, emaCloser: false };\n  const a = 2 / (n + 1);\n  let e = null;\n  for (const p of series) e = e === null ? p : a * p + (1 - a) * e;\n  const smaLast = series.slice(-n).reduce((x, y) => x + y, 0) / n;\n  const last = series[series.length - 1];\n  return {\n    emaLast: e,\n    smaLast,\n    emaCloser: Math.abs(e - last) < Math.abs(smaLast - last)\n  };\n}',
        hints: ['You only need the final EMA value, so a running variable is enough — no array required.',
                'The final SMA is just the mean of the last <code>n</code> values.',
                '"Closer" compares absolute distances from the last price.'],
        tests: { fn: 'responsiveness', approx: 1e-9, cases: [
          { args: [[1, 2], 5], expect: { emaLast: null, smaLast: null, emaCloser: false },
            name: 'too little data returns nulls' },
          { args: [[10, 10, 10, 10], 4],
            check: function (r) {
              if (Math.abs(r.emaLast - 10) > 1e-9 || Math.abs(r.smaLast - 10) > 1e-9) return 'a flat series should give 10 for both';
              return r.emaCloser === false ? true : 'neither is closer on a flat series';
            }, name: 'a flat series ties' },
          { args: [[10, 10, 10, 10, 10, 30], 5],
            check: function (r) {
              return r.emaCloser === true ? true : 'after a jump the EMA should sit closer to price than the SMA';
            }, name: 'after a jump the EMA is closer to price' }
        ], checks: [{
          name: 'works on the real session', expose: ['responsiveness'],
          run: function (s) {
            var r = s.responsiveness(MARKET.closes, 9);
            if (typeof r.emaLast !== 'number' || typeof r.smaLast !== 'number') return 'both values should be numbers';
            var wantSma = MARKET.closes.slice(-9).reduce(function (a, b) { return a + b; }, 0) / 9;
            return Math.abs(r.smaLast - wantSma) < 1e-6 ? true : 'smaLast was ' + r.smaLast;
          }
        }] } }
    ],
    quiz: [
      { q: 'What is alpha for a 19-period EMA?',
        options: ['<code>1/19</code>', '<code>2/19</code>', '<code>0.1</code>', '<code>19/2</code>'],
        answer: 2,
        explain: 'α = 2/(19+1) = 0.1. Ten percent of each new EMA value is the latest bar.' },
      { q: 'How much state does a streaming EMA need?',
        options: ['The last n prices', 'One number', 'Two numbers', 'The whole series'],
        answer: 1,
        explain: 'Only the previous EMA. That is why it costs the same at period 5 or period 500.' },
      { q: 'Your EMA disagrees with TradingView for the first 40 bars but converges after. Why?',
        options: ['A bug in your alpha', 'A different seeding convention', 'Floating-point error', 'Different data'],
        answer: 1,
        explain: 'First-price seeding and SMA seeding converge but differ early. Match the convention you are comparing against.' }
    ],
    recap: [
      'EMA<sub>i</sub> = α·price + (1−α)·EMA<sub>i−1</sub>, with α = 2/(n+1).',
      'Alpha is the weight on the newest bar.',
      'Seeding convention affects the start of the series but not the tail.',
      'EMA turns sooner than SMA — better in trends, worse in chop.'
    ],
    vocab: [
      { term: 'Smoothing factor (α)', def: 'How much of each new EMA value comes from the latest price. Higher is faster and noisier.' },
      { term: 'Whipsaw', def: 'A signal that reverses almost immediately, costing the spread and commission for nothing. Faster indicators produce more of them.' }
    ]
  });

  C.push({
    id: 'd059', day: 59, module: 5, minutes: 30,
    title: 'Momentum and Rate of Change',
    subtitle: 'How fast, not how high — and the indicator this repository actually ships.',
    goal: '<b>Goal:</b> implement rate of change and smooth it, reproducing the core of a real momentum signal.',
    objectives: [
      'Compute momentum and rate of change over a lookback',
      'Smooth an oscillator and understand what that costs',
      'Apply a threshold to reduce noise around zero',
      'Detect zero-line crosses'
    ],
    sections: [
      { h: 'Momentum is a difference; ROC is a ratio',
        body: '<p><strong>Momentum</strong> = price<sub>i</sub> − price<sub>i−n</sub>, in points. <strong>Rate of change</strong> = that difference as a percentage of the older price. ROC is comparable across instruments and price levels; raw momentum is not.</p>',
        code: 'function roc(series, n) {\n  return series.map((p, i) =>\n    i < n ? null : (p - series[i - n]) / series[i - n] * 100);\n}\n\nconsole.log(roc([100, 102, 104, 103, 108], 2).map(v => v === null ? null : +v.toFixed(3)));' },
      { h: 'Raw ROC is noisy',
        body: '<p>An unsmoothed oscillator crosses zero constantly in a choppy market. Smoothing it with an EMA cuts the false crossings at the cost of a little more lag — the trade every filter makes.</p>',
        code: 'const s = MARKET.closes;\nconst rawRoc = s.map((p, i) => i < 10 ? null : (p - s[i - 10]) / s[i - 10] * 100);\n\nfunction countZeroCrosses(series) {\n  let n = 0;\n  for (let i = 1; i < series.length; i++) {\n    if (series[i] === null || series[i - 1] === null) continue;\n    if (Math.sign(series[i]) !== Math.sign(series[i - 1])) n++;\n  }\n  return n;\n}\n\nconsole.log("raw ROC zero crosses:", countZeroCrosses(rawRoc));' },
      { h: 'A threshold band around zero',
        body: '<p>Requiring the oscillator to move beyond ±threshold rather than merely above zero removes the cluster of crossings that happen when it is hovering at the line. This is exactly what the <code>momThreshold</code> input does in the Pine script in this repository.</p>',
        code: 'function signalFrom(value, threshold) {\n  if (value === null) return null;\n  if (value > threshold) return "long";\n  if (value < -threshold) return "short";\n  return null;\n}\n\n[0.6, 0.05, -0.02, -0.9].forEach(v =>\n  console.log(v, "->", signalFrom(v, 0.1)));' },
      { h: 'What this repository ships',
        body: '<p>The Pine script alongside this site — <code>Momentum ROC Signal [ES/NQ 5m]</code> — is exactly this idea with three filters bolted on:</p>' +
              '<ul><li>ROC over a lookback, smoothed with an SMA or EMA</li>' +
              '<li>a <strong>trend filter</strong>: only take longs above a long EMA</li>' +
              '<li>a <strong>volatility filter</strong>: skip signals when ATR is below its own average</li>' +
              '<li>an optional <strong>session filter</strong>: regular hours only</li></ul>' +
              '<p>You will build all four across this module and combine them in the day 70 boss.</p>' }
    ],
    parsons: {
      prompt: 'Compute rate of change over an n-bar lookback.',
      lines: [
        'function roc(series, n) {',
        '  return series.map((p, i) =>',
        '    i < n ? null : (p - series[i - n]) / series[i - n] * 100);',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'momentum() and roc()', difficulty: 'Core',
        prompt: 'Write two functions, both returning arrays the same length as the input with <code>null</code> for the first <code>n</code> bars:<ul>' +
          '<li><code>momentum(series, n)</code> — <code>series[i] - series[i-n]</code></li>' +
          '<li><code>roc(series, n)</code> — that difference as a percentage of <code>series[i-n]</code></li></ul>' +
          'If the older price is <code>0</code>, <code>roc</code> should give <code>null</code> rather than <code>Infinity</code>.',
        expose: ['momentum', 'roc'],
        starter: 'function momentum(series, n) {\n  // difference over n bars\n}\n\nfunction roc(series, n) {\n  // percentage change over n bars\n}\n',
        solution: 'function momentum(series, n) {\n  return series.map((p, i) => i < n ? null : p - series[i - n]);\n}\n\nfunction roc(series, n) {\n  return series.map((p, i) => {\n    if (i < n) return null;\n    const old = series[i - n];\n    return old === 0 ? null : (p - old) / old * 100;\n  });\n}',
        hints: ['Both need <code>i &lt; n</code> to produce <code>null</code> — note it is <code>n</code>, not <code>n-1</code>.',
                'Guard the zero denominator in <code>roc</code> before dividing.'],
        tests: { checks: [
          { name: 'momentum is the n-bar difference', expose: ['momentum'],
            run: function (s, h) {
              return h.eq(s.momentum([100, 102, 104, 103], 2), [null, null, 4, 1], 1e-9)
                ? true : 'got ' + JSON.stringify(s.momentum([100, 102, 104, 103], 2));
            } },
          { name: 'roc is the n-bar percentage change', expose: ['roc'],
            run: function (s, h) {
              var out = s.roc([100, 102, 104, 103], 2);
              return h.eq(out, [null, null, 4, (103 - 102) / 102 * 100], 1e-9) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'both pad the first n bars with null', expose: ['momentum', 'roc'],
            run: function (s) {
              var m = s.momentum([1, 2, 3, 4], 3), r = s.roc([1, 2, 3, 4], 3);
              if (m[0] !== null || m[1] !== null || m[2] !== null) return 'momentum should null the first 3 bars';
              return (r[0] === null && r[1] === null && r[2] === null) ? true : 'roc should null the first 3 bars';
            } },
          { name: 'roc guards a zero denominator', expose: ['roc'],
            run: function (s) {
              var out = s.roc([0, 5, 10], 2);
              return out[2] === null ? true : 'a zero base price should give null, got ' + out[2];
            } },
          { name: 'an empty series gives an empty array', expose: ['momentum', 'roc'],
            run: function (s) {
              return (s.momentum([], 3).length === 0 && s.roc([], 3).length === 0) ? true : 'expected empty arrays';
            } }
        ] } },
      { id: 'e2', title: 'smoothOscillator()', difficulty: 'Core',
        prompt: 'Write <code>smoothOscillator(values, n)</code> applying an EMA of period <code>n</code> to an array that may contain leading <code>null</code>s.<br>' +
          'Leading nulls stay null; the first real value seeds the EMA; the recurrence continues from there.',
        starter: 'function smoothOscillator(values, n) {\n  // EMA that skips leading nulls\n}\n',
        solution: 'function smoothOscillator(values, n) {\n  const a = 2 / (n + 1);\n  let prev = null;\n  return values.map(v => {\n    if (v === null) return null;\n    prev = prev === null ? v : a * v + (1 - a) * prev;\n    return prev;\n  });\n}',
        hints: ['Return <code>null</code> immediately for a null input value, without touching <code>prev</code>.',
                'The first non-null value seeds the EMA exactly as before.'],
        tests: { fn: 'smoothOscillator', approx: 1e-9, cases: [
          { args: [[null, null, 10, 12], 3], expect: [null, null, 10, 0.5 * 12 + 0.5 * 10] },
          { args: [[null, null], 3], expect: [null, null] },
          { args: [[5, 5, 5], 3], expect: [5, 5, 5] },
          { args: [[], 3], expect: [] }
        ], checks: [{
          name: 'smoothing reduces zero-line crossings', expose: ['smoothOscillator'],
          run: function (s) {
            var raw = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1];
            var smooth = s.smoothOscillator(raw, 5);
            function crosses(a) {
              var n = 0;
              for (var i = 1; i < a.length; i++) {
                if (a[i] === null || a[i - 1] === null) continue;
                if (Math.sign(a[i]) !== Math.sign(a[i - 1])) n++;
              }
              return n;
            }
            var before = crosses(raw), after = crosses(smooth);
            return after < before ? true : 'smoothing should cut crossings (' + before + ' -> ' + after + ')';
          }
        }] } },
      { id: 'e3', title: 'momentumSignal()', difficulty: 'Stretch',
        prompt: 'Reproduce the core of the repository\'s Pine indicator. Write <code>momentumSignal(closes, { rocLength, smoothLength, threshold })</code> returning an array the same length as <code>closes</code>:<ol>' +
          '<li>compute ROC over <code>rocLength</code></li>' +
          '<li>smooth it with an EMA of <code>smoothLength</code>, preserving leading nulls</li>' +
          '<li>emit <code>"long"</code> on the bar where the smoothed value crosses <em>up</em> through <code>+threshold</code>, and <code>"short"</code> where it crosses <em>down</em> through <code>-threshold</code></li>' +
          '<li><code>null</code> everywhere else, including any bar where the current or previous smoothed value is null</li></ol>' +
          '<span class="muted">"Crosses up through +t" means the previous value was at or below +t and the current one is above it.</span>',
        starter: 'function momentumSignal(closes, { rocLength, smoothLength, threshold }) {\n  // roc -> smooth -> threshold cross\n}\n',
        solution: 'function momentumSignal(closes, { rocLength, smoothLength, threshold }) {\n  const roc = closes.map((p, i) => {\n    if (i < rocLength) return null;\n    const old = closes[i - rocLength];\n    return old === 0 ? null : (p - old) / old * 100;\n  });\n  const a = 2 / (smoothLength + 1);\n  let prev = null;\n  const sm = roc.map(v => {\n    if (v === null) return null;\n    prev = prev === null ? v : a * v + (1 - a) * prev;\n    return prev;\n  });\n  return sm.map((v, i) => {\n    if (i === 0 || v === null || sm[i - 1] === null) return null;\n    const p = sm[i - 1];\n    if (p <= threshold && v > threshold) return "long";\n    if (p >= -threshold && v < -threshold) return "short";\n    return null;\n  });\n}',
        hints: ['Build the three stages in order — ROC, then smoothing, then the cross detection.',
                'A cross needs the previous smoothed value, so guard <code>i === 0</code> and both nulls.',
                'Use strict inequality on the current side and inclusive on the previous, so a value sitting exactly at the threshold does not fire twice.'],
        tests: { fn: 'momentumSignal', cases: [
          { args: [[100, 100, 100, 100], { rocLength: 2, smoothLength: 2, threshold: 0.1 }],
            check: function (out) {
              if (out.length !== 4) return 'the output must match the input length';
              return out.every(function (v) { return v === null; }) ? true : 'a flat series should produce no signals';
            }, name: 'a flat series produces no signals' },
          { args: [[100, 100, 100, 101, 103, 106, 110], { rocLength: 2, smoothLength: 2, threshold: 0.5 }],
            check: function (out) {
              var longs = out.filter(function (v) { return v === 'long'; }).length;
              if (longs === 0) return 'a rally should produce a long signal';
              return longs === 1 ? true : 'a single sustained rally should fire once, got ' + longs;
            }, name: 'a rally fires long exactly once' },
          { args: [[100, 100, 100, 99, 97, 94, 90], { rocLength: 2, smoothLength: 2, threshold: 0.5 }],
            check: function (out) {
              var shorts = out.filter(function (v) { return v === 'short'; }).length;
              return shorts === 1 ? true : 'a sell-off should fire short once, got ' + shorts;
            }, name: 'a sell-off fires short exactly once' },
          { args: [[100, 101], { rocLength: 5, smoothLength: 2, threshold: 0.1 }],
            check: function (out) {
              return out.every(function (v) { return v === null; }) ? true : 'too little data must produce no signals';
            }, name: 'too little data produces nothing' }
        ], checks: [{
          name: 'a higher threshold produces no more signals than a lower one', expose: ['momentumSignal'],
          run: function (s) {
            var loose = s.momentumSignal(MARKET.closes, { rocLength: 10, smoothLength: 5, threshold: 0.02 });
            var tight = s.momentumSignal(MARKET.closes, { rocLength: 10, smoothLength: 5, threshold: 0.5 });
            var l = loose.filter(function (v) { return v; }).length;
            var t = tight.filter(function (v) { return v; }).length;
            return t <= l ? true : 'a tighter threshold produced more signals (' + t + ' vs ' + l + ')';
          }
        }] } }
    ],
    quiz: [
      { q: 'Why is ROC more comparable across instruments than raw momentum?',
        options: ['It is smoother', 'It is a percentage, so it does not depend on the price level', 'It has less lag', 'It is bounded'],
        answer: 1,
        explain: 'Ten points means something very different on ES at 5240 and on CL at 78. A percentage normalises that away.' },
      { q: 'What does a threshold band around zero achieve?',
        options: ['Faster signals', 'Fewer signals from an oscillator hovering at the zero line', 'More accuracy', 'It removes lag'],
        answer: 1,
        explain: 'Most false crossings happen while the oscillator sits near zero. Requiring a real move past ±t removes that cluster.' },
      { q: 'What does smoothing an oscillator cost you?',
        options: ['Nothing', 'Additional lag', 'Accuracy of the underlying data', 'Memory'],
        answer: 1,
        explain: 'Every filter trades noise for lag. The question is only whether the noise it removes was worth more than the delay it adds.' }
    ],
    recap: [
      'Momentum is a difference; ROC is that difference as a percentage.',
      'Raw oscillators cross zero constantly — smooth them.',
      'A threshold band removes the crossings that happen near zero.',
      'This is the exact structure of the Pine indicator in this repository.'
    ],
    vocab: [
      { term: 'Oscillator', def: 'An indicator that moves around a centre line rather than tracking price. Used to gauge momentum and extremes.' },
      { term: 'Zero-line cross', def: 'The moment an oscillator changes sign — the simplest momentum signal there is.' }
    ]
  });


  C.push({
    id: 'd060', day: 60, module: 5, minutes: 35, boss: true,
    title: 'Boss: The Indicator Library',
    subtitle: 'One coherent module, validated inputs, aligned outputs.',
    goal: '<b>Goal:</b> package what you have built into a library with a single convention that everything else can rely on.',
    objectives: [
      'Fix one contract for every indicator in the library',
      'Validate inputs once, at the library boundary',
      'Add rolling highest/lowest as reusable primitives',
      'Compose indicators without special-casing nulls everywhere'
    ],
    sections: [
      { h: 'One contract, no exceptions',
        body: '<p>Every function in the library takes a numeric series and returns an array of the <strong>same length</strong>, <code>null</code> where the value is undefined. Nothing else. That single rule is what lets you compose indicators without checking lengths or offsets anywhere downstream.</p>' +
              '<div class="note note-tip"><b>Why the length rule matters so much</b>If some indicators trim their warm-up and others pad it, every consumer needs offset arithmetic, and every piece of offset arithmetic is a chance to be one bar wrong. One bar wrong is the difference between a backtest and a look-ahead bug.</div>' },
      { h: 'Validate at the door',
        body: '<p>Check the series and the period once, in a shared helper. After that every indicator can assume valid input and stay short.</p>',
        code: 'function assertSeries(series, period) {\n  if (!Array.isArray(series)) throw new TypeError("series must be an array");\n  if (!Number.isInteger(period) || period < 1) {\n    throw new RangeError(`period must be a positive integer, got ${period}`);\n  }\n}\n\ntry { assertSeries([1, 2, 3], 0); } catch (e) { console.log(e.name + ":", e.message); }\ntry { assertSeries("nope", 5); } catch (e) { console.log(e.name + ":", e.message); }' },
      { h: 'Rolling highest and lowest',
        body: '<p>Two primitives you will use constantly: breakout levels, Donchian channels, stop placement, and the Stochastic all need them.</p>',
        code: 'function highest(series, n) {\n  return series.map((_, i) =>\n    i < n - 1 ? null : Math.max(...series.slice(i - n + 1, i + 1)));\n}\n\nconsole.log(highest([1, 5, 3, 8, 2], 3));' },
      { h: 'Composing safely',
        body: '<p>With a shared contract, combining indicators is a <code>map</code> over the index with one null guard, and nothing more.</p>',
        code: 'const s = MARKET.closes;\nconst sma = (a, n) => a.map((_, i) => i < n - 1 ? null : a.slice(i - n + 1, i + 1).reduce((x, y) => x + y, 0) / n);\n\nconst f = sma(s, 9), sl = sma(s, 21);\nconst spread = s.map((_, i) => (f[i] === null || sl[i] === null) ? null : f[i] - sl[i]);\n\nconsole.log("last spread:", spread.at(-1).toFixed(3));\nconsole.log("defined from bar:", spread.findIndex(v => v !== null));' }
    ],
    parsons: {
      prompt: 'Combine two indicator arrays with one null guard.',
      lines: [
        'const spread = closes.map((_, i) => {',
        '  if (fast[i] === null || slow[i] === null) return null;',
        '  return fast[i] - slow[i];',
        '});'
      ]
    },
    exercises: [
      { id: 'e1', title: 'highest() and lowest()', difficulty: 'Boss · part 1',
        prompt: 'Write <code>highest(series, n)</code> and <code>lowest(series, n)</code> returning the rolling maximum and minimum over the last <code>n</code> values, with <code>null</code> for the first <code>n-1</code> bars.',
        expose: ['highest', 'lowest'],
        starter: 'function highest(series, n) {\n  // rolling maximum\n}\n\nfunction lowest(series, n) {\n  // rolling minimum\n}\n',
        solution: 'function highest(series, n) {\n  return series.map((_, i) => i < n - 1 ? null : Math.max(...series.slice(i - n + 1, i + 1)));\n}\n\nfunction lowest(series, n) {\n  return series.map((_, i) => i < n - 1 ? null : Math.min(...series.slice(i - n + 1, i + 1)));\n}',
        hints: ['<code>series.slice(i - n + 1, i + 1)</code> is the window ending at <code>i</code>.',
                'Spread it into <code>Math.max</code> or <code>Math.min</code>.'],
        tests: { checks: [
          { name: 'highest tracks the rolling maximum', expose: ['highest'],
            run: function (s, h) {
              return h.eq(s.highest([1, 5, 3, 8, 2], 3), [null, null, 5, 8, 8])
                ? true : 'got ' + JSON.stringify(s.highest([1, 5, 3, 8, 2], 3));
            } },
          { name: 'lowest tracks the rolling minimum', expose: ['lowest'],
            run: function (s, h) {
              return h.eq(s.lowest([1, 5, 3, 8, 2], 3), [null, null, 1, 3, 2])
                ? true : 'got ' + JSON.stringify(s.lowest([1, 5, 3, 8, 2], 3));
            } },
          { name: 'a period of 1 returns the series', expose: ['highest', 'lowest'],
            run: function (s, h) {
              return (h.eq(s.highest([3, 1, 2], 1), [3, 1, 2]) && h.eq(s.lowest([3, 1, 2], 1), [3, 1, 2]))
                ? true : 'a period of 1 should return each value itself';
            } },
          { name: 'too little data is all nulls', expose: ['highest'],
            run: function (s, h) {
              return h.eq(s.highest([1, 2], 5), [null, null]) ? true : 'expected all nulls';
            } },
          { name: 'output length always matches the input', expose: ['highest', 'lowest'],
            run: function (s) {
              var a = s.highest(MARKET.closes, 20), b = s.lowest(MARKET.closes, 20);
              return (a.length === MARKET.closes.length && b.length === MARKET.closes.length)
                ? true : 'both must return the same length as the input';
            } }
        ] } },
      { id: 'e2', title: 'Validation helper', difficulty: 'Boss · part 2',
        prompt: 'Write <code>assertSeries(series, period)</code> which throws:<ul>' +
          '<li><code>TypeError</code> when <code>series</code> is not an array</li>' +
          '<li><code>TypeError</code> when any element is not a finite number</li>' +
          '<li><code>RangeError</code> when <code>period</code> is not a positive integer</li></ul>' +
          'and returns <code>true</code> when everything is valid. An empty array is valid.',
        starter: 'function assertSeries(series, period) {\n  // throw on bad input, return true otherwise\n}\n',
        solution: 'function assertSeries(series, period) {\n  if (!Array.isArray(series)) throw new TypeError("series must be an array");\n  for (let i = 0; i < series.length; i++) {\n    if (!Number.isFinite(series[i])) {\n      throw new TypeError(`series[${i}] is not a finite number`);\n    }\n  }\n  if (!Number.isInteger(period) || period < 1) {\n    throw new RangeError(`period must be a positive integer, got ${period}`);\n  }\n  return true;\n}',
        hints: ['Check the array-ness first, then the elements, then the period.',
                '<code>Number.isFinite</code> rejects NaN, both infinities, and non-numbers.',
                '<code>Number.isInteger</code> rejects 2.5 as well as strings.'],
        tests: { checks: [
          { name: 'valid input returns true', expose: ['assertSeries'],
            run: function (s) { return s.assertSeries([1, 2, 3], 2) === true ? true : 'should return true'; } },
          { name: 'an empty series is valid', expose: ['assertSeries'],
            run: function (s) { return s.assertSeries([], 3) === true ? true : 'an empty array should be accepted'; } },
          { name: 'a non-array throws TypeError', expose: ['assertSeries'],
            run: function (s) {
              try { s.assertSeries('nope', 3); } catch (e) { return e instanceof TypeError ? true : 'threw ' + e.name; }
              return 'should have thrown';
            } },
          { name: 'a NaN element throws TypeError', expose: ['assertSeries'],
            run: function (s) {
              try { s.assertSeries([1, NaN, 3], 2); } catch (e) { return e instanceof TypeError ? true : 'threw ' + e.name; }
              return 'should have thrown';
            } },
          { name: 'a zero period throws RangeError', expose: ['assertSeries'],
            run: function (s) {
              try { s.assertSeries([1, 2], 0); } catch (e) { return e instanceof RangeError ? true : 'threw ' + e.name; }
              return 'should have thrown';
            } },
          { name: 'a fractional period throws RangeError', expose: ['assertSeries'],
            run: function (s) {
              try { s.assertSeries([1, 2], 2.5); } catch (e) { return e instanceof RangeError ? true : 'threw ' + e.name; }
              return 'should have thrown';
            } }
        ] } },
      { id: 'e3', title: 'The Indicators module', difficulty: 'Boss · final',
        prompt: 'Assemble everything into one module. Build <code>Indicators</code> (an IIFE assigned to a const) exposing exactly five functions, each validating its input and each returning an array the same length as the series:<ul>' +
          '<li><code>sma(series, n)</code></li><li><code>ema(series, n)</code> — seeded with the first price, so no nulls</li>' +
          '<li><code>roc(series, n)</code> — percentage, <code>null</code> for the first <code>n</code> bars</li>' +
          '<li><code>highest(series, n)</code></li><li><code>lowest(series, n)</code></li></ul>' +
          'Invalid input must throw, using the same rules as part 2.',
        expose: ['Indicators'],
        starter: 'const Indicators = (function () {\n  function assertSeries(series, period) {\n    if (!Array.isArray(series)) throw new TypeError("series must be an array");\n    for (let i = 0; i < series.length; i++) {\n      if (!Number.isFinite(series[i])) throw new TypeError(`series[${i}] is not a finite number`);\n    }\n    if (!Number.isInteger(period) || period < 1) {\n      throw new RangeError(`period must be a positive integer, got ${period}`);\n    }\n  }\n\n  // sma, ema, roc, highest, lowest — then return the public surface\n})();\n',
        solution: 'const Indicators = (function () {\n  function assertSeries(series, period) {\n    if (!Array.isArray(series)) throw new TypeError("series must be an array");\n    for (let i = 0; i < series.length; i++) {\n      if (!Number.isFinite(series[i])) throw new TypeError(`series[${i}] is not a finite number`);\n    }\n    if (!Number.isInteger(period) || period < 1) {\n      throw new RangeError(`period must be a positive integer, got ${period}`);\n    }\n  }\n\n  function sma(series, n) {\n    assertSeries(series, n);\n    const out = new Array(series.length).fill(null);\n    let sum = 0;\n    for (let i = 0; i < series.length; i++) {\n      sum += series[i];\n      if (i >= n) sum -= series[i - n];\n      if (i >= n - 1) out[i] = sum / n;\n    }\n    return out;\n  }\n\n  function ema(series, n) {\n    assertSeries(series, n);\n    const a = 2 / (n + 1);\n    let prev = null;\n    return series.map(p => (prev = prev === null ? p : a * p + (1 - a) * prev));\n  }\n\n  function roc(series, n) {\n    assertSeries(series, n);\n    return series.map((p, i) => {\n      if (i < n) return null;\n      const old = series[i - n];\n      return old === 0 ? null : (p - old) / old * 100;\n    });\n  }\n\n  function highest(series, n) {\n    assertSeries(series, n);\n    return series.map((_, i) => i < n - 1 ? null : Math.max(...series.slice(i - n + 1, i + 1)));\n  }\n\n  function lowest(series, n) {\n    assertSeries(series, n);\n    return series.map((_, i) => i < n - 1 ? null : Math.min(...series.slice(i - n + 1, i + 1)));\n  }\n\n  return { sma, ema, roc, highest, lowest };\n})();',
        hints: ['Call <code>assertSeries</code> as the first line of every public function.',
                'Reuse the implementations you already wrote — this exercise is about packaging, not new maths.',
                'Return exactly the five functions, so nothing internal leaks out.'],
        tests: { checks: [
          { name: 'exposes exactly the five functions', expose: ['Indicators'],
            run: function (s) {
              var keys = Object.keys(s.Indicators).sort().join(',');
              return keys === 'ema,highest,lowest,roc,sma' ? true : 'the public surface is ' + keys;
            } },
          { name: 'sma is correct and aligned', expose: ['Indicators'],
            run: function (s, h) {
              return h.eq(s.Indicators.sma([10, 12, 11, 15, 14], 3), [null, null, 11, 38 / 3, 40 / 3], 1e-9)
                ? true : 'got ' + JSON.stringify(s.Indicators.sma([10, 12, 11, 15, 14], 3));
            } },
          { name: 'ema is seeded with the first price', expose: ['Indicators'],
            run: function (s) {
              var out = s.Indicators.ema([10, 12], 3);
              if (out[0] !== 10) return 'the first value should seed the EMA';
              return Math.abs(out[1] - (0.5 * 12 + 0.5 * 10)) < 1e-9 ? true : 'got ' + out[1];
            } },
          { name: 'roc pads the first n bars', expose: ['Indicators'],
            run: function (s, h) {
              return h.eq(s.Indicators.roc([100, 102, 104], 2), [null, null, 4], 1e-9)
                ? true : 'got ' + JSON.stringify(s.Indicators.roc([100, 102, 104], 2));
            } },
          { name: 'highest and lowest work', expose: ['Indicators'],
            run: function (s, h) {
              return (h.eq(s.Indicators.highest([1, 5, 3], 2), [null, 5, 5]) &&
                      h.eq(s.Indicators.lowest([1, 5, 3], 2), [null, 1, 3]))
                ? true : 'highest/lowest are wrong';
            } },
          { name: 'every function returns the input length', expose: ['Indicators'],
            run: function (s) {
              var n = MARKET.closes.length;
              var names = ['sma', 'ema', 'roc', 'highest', 'lowest'];
              for (var i = 0; i < names.length; i++) {
                var out = s.Indicators[names[i]](MARKET.closes, 14);
                if (out.length !== n) return names[i] + ' returned length ' + out.length + ', expected ' + n;
              }
              return true;
            } },
          { name: 'every function validates its input', expose: ['Indicators'],
            run: function (s) {
              var names = ['sma', 'ema', 'roc', 'highest', 'lowest'];
              for (var i = 0; i < names.length; i++) {
                var threw = false;
                try { s.Indicators[names[i]]([1, 2, 3], 0); } catch (e) { threw = e instanceof RangeError; }
                if (!threw) return names[i] + ' did not reject a period of 0';
                threw = false;
                try { s.Indicators[names[i]]([1, NaN], 2); } catch (e) { threw = e instanceof TypeError; }
                if (!threw) return names[i] + ' did not reject a NaN in the series';
              }
              return true;
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why must every indicator return an array of the same length as its input?',
        options: ['Performance', 'So <code>indicator[i]</code> always refers to <code>bars[i]</code> with no offset arithmetic', 'JavaScript requires it', 'To save memory'],
        answer: 1,
        explain: 'Mixed conventions force offset maths at every call site, and one bar of offset is a look-ahead bug.' },
      { q: 'Where should input validation live in a library?',
        options: ['In every internal helper', 'Once, in the public functions at the boundary', 'In the tests only', 'Nowhere'],
        answer: 1,
        explain: 'Validate at the door; the interior then assumes valid input and stays readable.' },
      { q: 'Why expose only the five functions from the module?',
        options: ['Smaller bundle', 'Internals stay changeable because nothing outside can depend on them', 'It is faster', 'To allow JSON'],
        answer: 1,
        explain: 'A small public surface is what makes a rewrite of the internals safe.' }
    ],
    recap: [
      'One contract: numeric series in, same-length array out, <code>null</code> for undefined.',
      'Validate once at the library boundary.',
      '<code>highest</code>/<code>lowest</code> are primitives many indicators need.',
      'A small public surface keeps the internals free to change.'
    ],
    vocab: [
      { term: 'Donchian channel', def: 'The rolling highest high and lowest low over n bars. The basis of classic breakout systems.' }
    ]
  });

  C.push({
    id: 'd061', day: 61, module: 5, minutes: 30,
    title: 'RSI',
    subtitle: 'Relative Strength Index, and what "overbought" really means.',
    goal: '<b>Goal:</b> implement RSI with Wilder\'s smoothing and understand why it pins in a strong trend.',
    objectives: [
      'Separate gains from losses bar by bar',
      'Apply Wilder\'s smoothing to average them',
      'Convert relative strength into a 0–100 index',
      'Handle the all-gains and all-losses edge cases'
    ],
    sections: [
      { h: 'The construction',
        body: '<ol><li>Take the change from each bar to the next.</li>' +
              '<li>Split it: gain is the change if positive else 0; loss is <em>minus</em> the change if negative else 0. Both are non-negative.</li>' +
              '<li>Average each over <em>n</em> bars.</li>' +
              '<li>RS = avgGain / avgLoss, and RSI = 100 − 100/(1 + RS).</li></ol>' +
              '<p>The result is bounded between 0 and 100 by construction.</p>',
        code: 'const closes = [44, 44.3, 44.1, 44.6, 45.1, 44.9];\nconst changes = closes.slice(1).map((c, i) => c - closes[i]);\nconst gains = changes.map(c => c > 0 ? c : 0);\nconst losses = changes.map(c => c < 0 ? -c : 0);\n\nconsole.log("changes:", changes.map(v => +v.toFixed(2)));\nconsole.log("gains:  ", gains.map(v => +v.toFixed(2)));\nconsole.log("losses: ", losses.map(v => +v.toFixed(2)));' },
      { h: "Wilder's smoothing",
        body: '<p>Wilder used a smoothed average that is an EMA with α = 1/n rather than 2/(n+1). The first value is a simple average of the first <em>n</em> gains (or losses); after that:</p>' +
              '<p class="mono" style="color:var(--fg)">avg<sub>i</sub> = (avg<sub>i−1</sub> × (n − 1) + value<sub>i</sub>) / n</p>' +
              '<div class="note note-warn"><b>This is why implementations disagree</b>Using a standard EMA with α = 2/(n+1) gives a visibly different RSI. If your values do not match your charting platform, check this first.</div>',
        code: 'function wilder(values, n) {\n  const out = new Array(values.length).fill(null);\n  if (values.length < n) return out;\n  let avg = values.slice(0, n).reduce((a, b) => a + b, 0) / n;\n  out[n - 1] = avg;\n  for (let i = n; i < values.length; i++) {\n    avg = (avg * (n - 1) + values[i]) / n;\n    out[i] = avg;\n  }\n  return out;\n}\n\nconsole.log(wilder([1, 2, 3, 4, 5], 3).map(v => v === null ? null : +v.toFixed(4)));' },
      { h: 'The zero-loss case',
        body: '<p>If every bar in the window rose, average loss is 0 and RS is infinite. Mathematically RSI tends to 100, so return exactly 100 rather than letting <code>Infinity</code> propagate. The mirror case — no gains at all — gives 0.</p>',
        code: 'function rsiFrom(avgGain, avgLoss) {\n  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;\n  const rs = avgGain / avgLoss;\n  return 100 - 100 / (1 + rs);\n}\n\nconsole.log(rsiFrom(1, 0), rsiFrom(0, 1), rsiFrom(0, 0), rsiFrom(1, 1).toFixed(1));' },
      { h: 'What 70 and 30 actually mean',
        body: '<p>RSI above 70 means recent bars have been overwhelmingly up. That is <em>strength</em>, not a sell signal — in a strong trend RSI can sit above 70 for days while price keeps climbing, and every mean-reversion short is a loser.</p>' +
              '<div class="note note-trade"><b>The usual mistake</b>Treating RSI extremes as reversal signals without a trend filter. Overbought in a downtrend is a decent short; overbought in an uptrend is just an uptrend.</div>' }
    ],
    parsons: {
      prompt: 'Split bar-to-bar changes into gains and losses.',
      lines: [
        'const changes = closes.slice(1).map((c, i) => c - closes[i]);',
        'const gains = changes.map(c => c > 0 ? c : 0);',
        'const losses = changes.map(c => c < 0 ? -c : 0);',
        'console.log(gains.length, losses.length);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'gainsAndLosses()', difficulty: 'Core',
        prompt: 'Write <code>gainsAndLosses(closes)</code> returning <code>{ gains, losses }</code>, each an array the same length as <code>closes</code> with <code>null</code> at index 0 (no previous bar).<br>' +
          'Gains and losses are both non-negative: a gain of 0 on a down bar, a loss of 0 on an up bar.',
        starter: 'function gainsAndLosses(closes) {\n  // { gains, losses }, both null-padded at index 0\n}\n',
        solution: 'function gainsAndLosses(closes) {\n  const gains = [], losses = [];\n  closes.forEach((c, i) => {\n    if (i === 0) { gains.push(null); losses.push(null); return; }\n    const change = c - closes[i - 1];\n    gains.push(change > 0 ? change : 0);\n    losses.push(change < 0 ? -change : 0);\n  });\n  return { gains, losses };\n}',
        hints: ['Index 0 has no previous bar, so both arrays start with <code>null</code>.',
                'A loss is the <em>magnitude</em> of a negative change: <code>-change</code>.'],
        tests: { fn: 'gainsAndLosses', approx: 1e-9, cases: [
          { args: [[44, 44.3, 44.1]], expect: { gains: [null, 0.3, 0], losses: [null, 0, 0.2] } },
          { args: [[10]], expect: { gains: [null], losses: [null] } },
          { args: [[10, 10]], expect: { gains: [null, 0], losses: [null, 0] }, name: 'an unchanged bar is neither' },
          { args: [[]], expect: { gains: [], losses: [] } }
        ], checks: [{
          name: 'both arrays are non-negative on the real session', expose: ['gainsAndLosses'],
          run: function (s) {
            var r = s.gainsAndLosses(MARKET.closes);
            for (var i = 1; i < r.gains.length; i++) {
              if (r.gains[i] < 0 || r.losses[i] < 0) return 'index ' + i + ' produced a negative value';
            }
            return true;
          }
        }] } },
      { id: 'e2', title: "wilderSmooth()", difficulty: 'Core',
        prompt: 'Write <code>wilderSmooth(values, n)</code> applying Wilder\'s smoothing to an array whose <strong>first element is <code>null</code></strong> (as produced by the previous exercise).<br>' +
          'Return an array the same length, with <code>null</code> until <code>n</code> real values have been seen. The first output is the simple average of the first <code>n</code> real values; after that use <code>(prev × (n-1) + value) / n</code>.',
        starter: 'function wilderSmooth(values, n) {\n  // Wilder smoothing, skipping the leading null\n}\n',
        solution: 'function wilderSmooth(values, n) {\n  const out = new Array(values.length).fill(null);\n  const real = [];\n  let avg = null;\n  for (let i = 0; i < values.length; i++) {\n    if (values[i] === null) continue;\n    real.push(values[i]);\n    if (real.length < n) continue;\n    if (real.length === n) avg = real.reduce((a, b) => a + b, 0) / n;\n    else avg = (avg * (n - 1) + values[i]) / n;\n    out[i] = avg;\n  }\n  return out;\n}',
        hints: ['Skip null entries entirely — they do not count toward the window.',
                'Count how many real values you have seen; the <em>n</em>th one seeds with a simple average.',
                'After the seed, each step is <code>(prev * (n - 1) + value) / n</code>.'],
        tests: { fn: 'wilderSmooth', approx: 1e-9, cases: [
          { args: [[null, 1, 2, 3], 3], expect: [null, null, null, 2], name: 'the seed is a simple average' },
          { args: [[null, 1, 2, 3, 4], 3], expect: [null, null, null, 2, (2 * 2 + 4) / 3] },
          { args: [[null, 1], 3], expect: [null, null], name: 'too little data is all nulls' },
          { args: [[null, 5, 5, 5], 3], expect: [null, null, null, 5] },
          { args: [[], 3], expect: [] }
        ] } },
      { id: 'e3', title: 'rsi()', difficulty: 'Stretch',
        prompt: 'Write <code>rsi(closes, n)</code> returning an array the same length as <code>closes</code>.<ol>' +
          '<li>Split into gains and losses (index 0 null).</li>' +
          '<li>Wilder-smooth each with period <code>n</code>.</li>' +
          '<li>Where both averages exist, RSI = <code>100 - 100/(1 + avgGain/avgLoss)</code>.</li>' +
          '<li>When <code>avgLoss</code> is 0: return <code>100</code> if there were gains, or <code>50</code> if both are 0.</li>' +
          '<li><code>null</code> everywhere the averages are undefined.</li></ol>',
        starter: 'function rsi(closes, n) {\n  // gains/losses -> Wilder smoothing -> index\n}\n',
        solution: 'function rsi(closes, n) {\n  const gains = [], losses = [];\n  closes.forEach((c, i) => {\n    if (i === 0) { gains.push(null); losses.push(null); return; }\n    const change = c - closes[i - 1];\n    gains.push(change > 0 ? change : 0);\n    losses.push(change < 0 ? -change : 0);\n  });\n\n  function smooth(values) {\n    const out = new Array(values.length).fill(null);\n    const real = [];\n    let avg = null;\n    for (let i = 0; i < values.length; i++) {\n      if (values[i] === null) continue;\n      real.push(values[i]);\n      if (real.length < n) continue;\n      if (real.length === n) avg = real.reduce((a, b) => a + b, 0) / n;\n      else avg = (avg * (n - 1) + values[i]) / n;\n      out[i] = avg;\n    }\n    return out;\n  }\n\n  const ag = smooth(gains), al = smooth(losses);\n  return closes.map((_, i) => {\n    if (ag[i] === null || al[i] === null) return null;\n    if (al[i] === 0) return ag[i] === 0 ? 50 : 100;\n    return 100 - 100 / (1 + ag[i] / al[i]);\n  });\n}',
        hints: ['Reuse the two previous exercises — a local helper for the smoothing keeps it short.',
                'Handle the zero-loss case before dividing, or you get <code>Infinity</code>.',
                'A completely flat window has both averages at 0, which conventionally reads as 50.'],
        tests: { fn: 'rsi', approx: 1e-6, cases: [
          { args: [[1, 2, 3, 4, 5, 6], 3],
            check: function (out) {
              var defined = out.filter(function (v) { return v !== null; });
              if (!defined.length) return 'no values were produced';
              return defined.every(function (v) { return v === 100; })
                ? true : 'an unbroken rally should give RSI 100, got ' + JSON.stringify(defined);
            }, name: 'an unbroken rally gives 100' },
          { args: [[6, 5, 4, 3, 2, 1], 3],
            check: function (out) {
              var defined = out.filter(function (v) { return v !== null; });
              return defined.every(function (v) { return v === 0; })
                ? true : 'an unbroken decline should give RSI 0, got ' + JSON.stringify(defined);
            }, name: 'an unbroken decline gives 0' },
          { args: [[5, 5, 5, 5, 5], 3],
            check: function (out) {
              var defined = out.filter(function (v) { return v !== null; });
              return defined.every(function (v) { return v === 50; })
                ? true : 'a flat series should give 50, got ' + JSON.stringify(defined);
            }, name: 'a flat series gives 50' },
          { args: [[10, 11], 5],
            check: function (out) {
              return out.every(function (v) { return v === null; }) ? true : 'too little data must be all nulls';
            }, name: 'too little data is all nulls' }
        ], checks: [
          { name: 'stays within 0 and 100 on the real session', expose: ['rsi'],
            run: function (s) {
              var out = s.rsi(MARKET.closes, 14);
              if (out.length !== MARKET.closes.length) return 'the output must match the input length';
              for (var i = 0; i < out.length; i++) {
                if (out[i] === null) continue;
                if (!(out[i] >= 0 && out[i] <= 100)) return 'index ' + i + ' produced ' + out[i];
              }
              return true;
            } },
          { name: 'the warm-up is null and real values follow', expose: ['rsi'],
            run: function (s) {
              var out = s.rsi(MARKET.closes, 14);
              var first = out.findIndex(function (v) { return v !== null; });
              if (first < 14) return 'RSI became defined too early, at index ' + first;
              return typeof out[out.length - 1] === 'number' ? true : 'the final value should be a number';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is the range of RSI?',
        options: ['−100 to 100', '0 to 100', 'Unbounded', '0 to 1'],
        answer: 1,
        explain: 'The formula <code>100 − 100/(1+RS)</code> is bounded by construction, whatever RS does.' },
      { q: 'Every bar in the window rose. What is avgLoss, and what should RSI be?',
        options: ['0, and RSI 100', '0, and RSI Infinity', '1, and RSI 50', 'Undefined — throw'],
        answer: 0,
        explain: 'RS tends to infinity so RSI tends to 100. Return 100 explicitly instead of letting Infinity propagate.' },
      { q: 'RSI has been above 70 for two days while price keeps rising. What does that mean?',
        options: ['A reversal is imminent', 'The trend is strong — overbought is not a sell signal', 'The data is wrong', 'RSI is broken'],
        answer: 1,
        explain: 'RSI measures the balance of recent gains and losses. In a strong trend it stays pinned, and shorting it is how mean-reversion traders lose money.' }
    ],
    recap: [
      'RSI splits changes into non-negative gains and losses, then compares their averages.',
      'Wilder\'s smoothing uses α = 1/n, not the EMA\'s 2/(n+1).',
      'Handle the zero-loss case explicitly: return 100.',
      'Extremes signal strength; only a trend filter makes them a reversal signal.'
    ],
    vocab: [
      { term: 'RSI', def: 'Relative Strength Index — 0 to 100, comparing average gains with average losses over a lookback, usually 14 bars.' },
      { term: 'Mean reversion', def: 'The premise that price returns to an average after an extreme. It works until a trend starts, which is when it stops working expensively.' }
    ]
  });

  C.push({
    id: 'd062', day: 62, module: 5, minutes: 30,
    title: 'True Range and ATR',
    subtitle: 'Measuring volatility properly, including the gaps.',
    goal: '<b>Goal:</b> compute Average True Range and use it to size a stop that adapts to conditions.',
    objectives: [
      'Explain why simple range understates volatility',
      'Compute True Range across three cases',
      'Average it with Wilder\'s smoothing',
      'Place an ATR-based stop'
    ],
    sections: [
      { h: 'Why high − low is not enough',
        body: '<p>If a market closes at 5240 and opens the next session at 5200, the low of that new bar might be 5195 and its high 5205 — a range of 10 points, while price actually moved 45. Simple range ignores the gap entirely.</p>' +
              '<p><strong>True Range</strong> is the largest of three distances:</p>' +
              '<ul><li>high − low (this bar\'s own range)</li>' +
                  '<li>|high − previous close| (gap up)</li>' +
                  '<li>|low − previous close| (gap down)</li></ul>',
        code: 'function trueRange(bar, prevClose) {\n  if (prevClose === null || prevClose === undefined) return bar.high - bar.low;\n  return Math.max(\n    bar.high - bar.low,\n    Math.abs(bar.high - prevClose),\n    Math.abs(bar.low - prevClose)\n  );\n}\n\nconsole.log("no gap:", trueRange({ high: 5205, low: 5195 }, 5200));\nconsole.log("gap down:", trueRange({ high: 5205, low: 5195 }, 5240));' },
      { h: 'ATR is the smoothed True Range',
        body: '<p>Wilder\'s ATR uses the same smoothing as RSI: a simple average of the first <em>n</em> true ranges, then <code>(prev × (n−1) + TR) / n</code>.</p>',
        code: 'const trs = MARKET.bars.map((b, i) =>\n  i === 0 ? b.high - b.low\n          : Math.max(b.high - b.low,\n                     Math.abs(b.high - MARKET.bars[i - 1].close),\n                     Math.abs(b.low - MARKET.bars[i - 1].close)));\n\nlet atr = trs.slice(0, 14).reduce((a, b) => a + b, 0) / 14;\nfor (let i = 14; i < trs.length; i++) atr = (atr * 13 + trs[i]) / 14;\nconsole.log("ATR(14) at the end of the session:", atr.toFixed(3), "points");' },
      { h: 'ATR-based stops',
        body: '<p>A fixed 8-point stop is too tight in a fast market and too wide in a quiet one. A stop at <em>k</em> × ATR adapts automatically: wider when volatility rises, tighter when it falls.</p>' +
              '<div class="note note-trade"><b>Sizing follows the stop</b>An ATR stop changes the dollar risk per contract, so position size has to move with it: <code>contracts = riskDollars / (atrStop × pointValue)</code>. Bigger stop, smaller size — the risk per trade stays constant. This is the mechanism behind the risk levels in the Pine script in this repository.</div>',
        code: 'const atr = 4.2, entry = 5240.25, pointValue = 50;\n[1.5, 2, 3].forEach(k => {\n  const stopDistance = k * atr;\n  const riskPerContract = stopDistance * pointValue;\n  const contracts = Math.floor(500 / riskPerContract);\n  console.log(`${k}x ATR: stop ${stopDistance.toFixed(2)} pts, $${riskPerContract.toFixed(0)}/contract, size ${contracts}`);\n});' },
      { h: 'ATR is not directional',
        body: '<p>ATR says how much a market moves, never which way. A rising ATR in a downtrend and a rising ATR in a rally look identical. Use it for sizing, stops and filters — never as a signal.</p>' }
    ],
    parsons: {
      prompt: 'Compute True Range including gaps.',
      lines: [
        'function trueRange(bar, prevClose) {',
        '  return Math.max(',
        '    bar.high - bar.low,',
        '    Math.abs(bar.high - prevClose),',
        '    Math.abs(bar.low - prevClose)',
        '  );',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'trueRangeSeries()', difficulty: 'Core',
        prompt: 'Write <code>trueRangeSeries(bars)</code> returning an array the same length as <code>bars</code>.<br>' +
          'The first bar has no previous close, so its True Range is simply <code>high - low</code>. Every later bar uses the maximum of the three distances.',
        starter: 'function trueRangeSeries(bars) {\n  // True Range per bar\n}\n',
        solution: 'function trueRangeSeries(bars) {\n  return bars.map((b, i) => {\n    if (i === 0) return b.high - b.low;\n    const prev = bars[i - 1].close;\n    return Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev));\n  });\n}',
        hints: ['Index 0 has no previous close — return the plain range there.',
                '<code>Math.max</code> takes all three distances at once.'],
        tests: { fn: 'trueRangeSeries', approx: 1e-9, cases: [
          { args: [[{ high: 10, low: 8, close: 9 }]], expect: [2], name: 'the first bar is just high - low' },
          { args: [[{ high: 10, low: 8, close: 9 }, { high: 11, low: 9, close: 10 }]], expect: [2, 2] },
          { args: [[{ high: 5205, low: 5195, close: 5200 }, { high: 5165, low: 5155, close: 5160 }]],
            expect: [10, 45], name: 'a gap down is captured' },
          { args: [[{ high: 5205, low: 5195, close: 5200 }, { high: 5250, low: 5240, close: 5245 }]],
            expect: [10, 50], name: 'a gap up is captured' },
          { args: [[]], expect: [] }
        ], checks: [{
          name: 'True Range is never below the simple range', expose: ['trueRangeSeries'],
          run: function (s) {
            var out = s.trueRangeSeries(MARKET.bars);
            for (var i = 0; i < MARKET.bars.length; i++) {
              var simple = MARKET.bars[i].high - MARKET.bars[i].low;
              if (out[i] < simple - 1e-9) return 'index ' + i + ': TR ' + out[i] + ' is below the range ' + simple;
            }
            return true;
          }
        }] } },
      { id: 'e2', title: 'atr()', difficulty: 'Core',
        prompt: 'Write <code>atr(bars, n)</code> returning an array the same length as <code>bars</code>:<ul>' +
          '<li><code>null</code> for the first <code>n-1</code> bars</li>' +
          '<li>at bar <code>n-1</code>, the simple average of the first <code>n</code> true ranges</li>' +
          '<li>thereafter <code>(prev × (n-1) + TR) / n</code></li></ul>',
        starter: 'function atr(bars, n) {\n  // Wilder-smoothed True Range\n}\n',
        solution: 'function atr(bars, n) {\n  const tr = bars.map((b, i) => {\n    if (i === 0) return b.high - b.low;\n    const prev = bars[i - 1].close;\n    return Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev));\n  });\n  const out = new Array(bars.length).fill(null);\n  if (bars.length < n) return out;\n  let avg = tr.slice(0, n).reduce((a, b) => a + b, 0) / n;\n  out[n - 1] = avg;\n  for (let i = n; i < tr.length; i++) {\n    avg = (avg * (n - 1) + tr[i]) / n;\n    out[i] = avg;\n  }\n  return out;\n}',
        hints: ['Build the True Range series first, then smooth it — two clear steps.',
                'The smoothing is identical to the one you wrote for RSI.',
                'Guard the case where there are fewer than <code>n</code> bars.'],
        tests: { fn: 'atr', approx: 1e-9, cases: [
          { args: [[{ high: 2, low: 0, close: 1 }, { high: 3, low: 1, close: 2 }, { high: 4, low: 2, close: 3 }], 3],
            expect: [null, null, 2], name: 'the seed is the mean of the first n true ranges' },
          { args: [[{ high: 2, low: 0, close: 1 }], 3], expect: [null], name: 'too little data is null' },
          { args: [[], 3], expect: [] }
        ], checks: [
          { name: 'ATR is positive on the real session', expose: ['atr'],
            run: function (s) {
              var out = s.atr(MARKET.bars, 14);
              if (out.length !== MARKET.bars.length) return 'the output must match the input length';
              var last = out[out.length - 1];
              if (typeof last !== 'number') return 'the final ATR should be a number';
              return last > 0 ? true : 'ATR should be positive, got ' + last;
            } },
          { name: 'the warm-up is exactly n-1 nulls', expose: ['atr'],
            run: function (s) {
              var out = s.atr(MARKET.bars, 14);
              var first = out.findIndex(function (v) { return v !== null; });
              return first === 13 ? true : 'the first defined value is at index ' + first + ', expected 13';
            } },
          { name: 'a longer period gives a smoother series', expose: ['atr'],
            run: function (s) {
              function variation(a) {
                var v = a.filter(function (x) { return x !== null; });
                var d = 0;
                for (var i = 1; i < v.length; i++) d += Math.abs(v[i] - v[i - 1]);
                return d / (v.length - 1);
              }
              var short = variation(s.atr(MARKET.bars, 5));
              var long = variation(s.atr(MARKET.bars, 30));
              return long <= short ? true : 'a 30-period ATR should move less per bar than a 5-period one';
            } }
        ] } },
      { id: 'e3', title: 'atrStopAndSize()', difficulty: 'Stretch',
        prompt: 'Write <code>atrStopAndSize({ side, entry, atr, multiplier, equity, riskPercent, pointValue })</code> returning <code>{ stop, stopDistance, riskPerContract, contracts }</code>:<ul>' +
          '<li><code>stopDistance</code> — <code>atr × multiplier</code></li>' +
          '<li><code>stop</code> — that far below the entry for a long, above for a short</li>' +
          '<li><code>riskPerContract</code> — <code>stopDistance × pointValue</code></li>' +
          '<li><code>contracts</code> — <code>equity × riskPercent / 100</code> divided by the risk per contract, rounded <strong>down</strong>, never below 0</li></ul>' +
          'If <code>atr</code> or <code>multiplier</code> is 0 or less, return <code>contracts: 0</code> and a <code>stop</code> equal to the entry.',
        starter: 'function atrStopAndSize({ side, entry, atr, multiplier, equity, riskPercent, pointValue }) {\n  // volatility-adjusted stop and size\n}\n',
        solution: 'function atrStopAndSize({ side, entry, atr, multiplier, equity, riskPercent, pointValue }) {\n  if (atr <= 0 || multiplier <= 0) {\n    return { stop: entry, stopDistance: 0, riskPerContract: 0, contracts: 0 };\n  }\n  const stopDistance = atr * multiplier;\n  const stop = side === "long" ? entry - stopDistance : entry + stopDistance;\n  const riskPerContract = stopDistance * pointValue;\n  const riskDollars = equity * riskPercent / 100;\n  const contracts = Math.max(0, Math.floor(riskDollars / riskPerContract));\n  return { stop, stopDistance, riskPerContract, contracts };\n}',
        hints: ['Guard the degenerate inputs first and return the all-zero shape.',
                'The stop moves in the opposite direction to the trade: below for a long, above for a short.',
                '<code>Math.max(0, Math.floor(...))</code> handles both rounding and a negative equity.'],
        tests: { fn: 'atrStopAndSize', approx: 1e-9, cases: [
          { args: [{ side: 'long', entry: 5240, atr: 4, multiplier: 2, equity: 50000, riskPercent: 1, pointValue: 50 }],
            expect: { stop: 5232, stopDistance: 8, riskPerContract: 400, contracts: 1 } },
          { args: [{ side: 'short', entry: 5240, atr: 4, multiplier: 2, equity: 100000, riskPercent: 1, pointValue: 50 }],
            expect: { stop: 5248, stopDistance: 8, riskPerContract: 400, contracts: 2 },
            name: 'a short stop sits above the entry' },
          { args: [{ side: 'long', entry: 5240, atr: 8, multiplier: 2, equity: 100000, riskPercent: 1, pointValue: 50 }],
            expect: { stop: 5224, stopDistance: 16, riskPerContract: 800, contracts: 1 },
            name: 'higher volatility means a wider stop and a smaller size' },
          { args: [{ side: 'long', entry: 5240, atr: 0, multiplier: 2, equity: 50000, riskPercent: 1, pointValue: 50 }],
            expect: { stop: 5240, stopDistance: 0, riskPerContract: 0, contracts: 0 },
            name: 'a zero ATR returns a zero size instead of Infinity' },
          { args: [{ side: 'long', entry: 5240, atr: 4, multiplier: 2, equity: 1000, riskPercent: 1, pointValue: 50 }],
            expect: { stop: 5232, stopDistance: 8, riskPerContract: 400, contracts: 0 },
            name: 'too small an account sizes to zero, not a fraction' }
        ], checks: [{
          name: 'dollar risk stays roughly constant as ATR changes', expose: ['atrStopAndSize'],
          run: function (s) {
            var base = { side: 'long', entry: 5240, multiplier: 2, equity: 400000, riskPercent: 1, pointValue: 50 };
            var quiet = s.atrStopAndSize(Object.assign({}, base, { atr: 2 }));
            var wild = s.atrStopAndSize(Object.assign({}, base, { atr: 8 }));
            if (wild.contracts >= quiet.contracts) return 'higher ATR should reduce the position size';
            var rq = quiet.contracts * quiet.riskPerContract;
            var rw = wild.contracts * wild.riskPerContract;
            return Math.abs(rq - rw) <= 4000 ? true : 'total risk moved from ' + rq + ' to ' + rw;
          }
        }] } }
    ],
    quiz: [
      { q: 'Why is True Range preferred to high − low?',
        options: ['It is smoother', 'It accounts for gaps between the previous close and this bar', 'It is bounded', 'It is directional'],
        answer: 1,
        explain: 'A bar that gaps 40 points and then trades in a 10-point range moved 45 points, not 10.' },
      { q: 'ATR doubles. What should happen to position size at constant risk?',
        options: ['Double', 'Halve', 'Stay the same', 'Go to zero'],
        answer: 1,
        explain: 'A twice-as-wide stop costs twice as much per contract, so half the contracts keep the dollar risk constant.' },
      { q: 'Can ATR tell you which way the market is going?',
        options: ['Yes, rising ATR means up', 'No — it measures magnitude only', 'Only with a moving average', 'Only intraday'],
        answer: 1,
        explain: 'True Range is built from absolute distances. A violent rally and a violent sell-off look identical.' }
    ],
    recap: [
      'True Range is the largest of the bar range and the two gap distances.',
      'ATR is Wilder-smoothed True Range.',
      'ATR stops adapt to conditions; size must adapt with them.',
      'ATR is magnitude only — never a direction signal.'
    ],
    vocab: [
      { term: 'ATR', def: 'Average True Range — the average size of recent bars including gaps. The standard volatility measure for stops and sizing.' },
      { term: 'Gap', def: 'A jump between one bar\'s close and the next bar\'s open, with no trading in between. Common across the overnight session.' }
    ]
  });

  C.push({
    id: 'd063', day: 63, module: 5, minutes: 30,
    title: 'Standard Deviation and Bollinger Bands',
    subtitle: 'Bands that widen when the market gets nervous.',
    goal: '<b>Goal:</b> compute rolling standard deviation and build Bollinger Bands, then measure how tight the market is.',
    objectives: [
      'Compute variance and standard deviation over a window',
      'Build upper, middle and lower bands',
      'Compute %B and bandwidth',
      'Interpret a squeeze without over-reading it'
    ],
    sections: [
      { h: 'Standard deviation in one pass of a window',
        body: '<p>Variance is the mean of the squared distances from the mean; standard deviation is its square root. Indicators use the <em>population</em> form — divide by <em>n</em>, not <em>n−1</em> — because the window is the whole population of interest, not a sample of it.</p>',
        code: 'function stdev(window) {\n  const n = window.length;\n  const mean = window.reduce((a, b) => a + b, 0) / n;\n  const variance = window.reduce((a, v) => a + (v - mean) ** 2, 0) / n;\n  return Math.sqrt(variance);\n}\n\nconsole.log(stdev([10, 12, 11, 15, 14]).toFixed(4));\nconsole.log(stdev([12, 12, 12]).toFixed(4));   // no dispersion' },
      { h: 'The bands',
        body: '<p>Middle band is the <em>n</em>-period SMA. Upper and lower sit <em>k</em> standard deviations either side, conventionally n=20 and k=2.</p>' +
              '<p>Because the deviation is computed from the same window as the mean, the bands widen automatically when the market becomes volatile and contract when it goes quiet.</p>',
        code: 'function bollinger(series, n, k) {\n  return series.map((_, i) => {\n    if (i < n - 1) return null;\n    const w = series.slice(i - n + 1, i + 1);\n    const mean = w.reduce((a, b) => a + b, 0) / n;\n    const sd = Math.sqrt(w.reduce((a, v) => a + (v - mean) ** 2, 0) / n);\n    return { middle: mean, upper: mean + k * sd, lower: mean - k * sd };\n  });\n}\n\nconst b = bollinger(MARKET.closes, 20, 2);\nconst last = b.at(-1);\nconsole.log(`lower ${last.lower.toFixed(2)} | mid ${last.middle.toFixed(2)} | upper ${last.upper.toFixed(2)}`);' },
      { h: '%B and bandwidth',
        body: '<p><strong>%B</strong> places price within the bands: 0 at the lower band, 1 at the upper, and outside that range when price is beyond them.</p>' +
              '<p><strong>Bandwidth</strong> is <code>(upper − lower) / middle</code> — a scale-free measure of how wide the bands are, comparable across instruments and over time.</p>',
        code: 'function percentB(price, band) {\n  const width = band.upper - band.lower;\n  return width === 0 ? 0.5 : (price - band.lower) / width;\n}\n\nconst band = { lower: 100, middle: 105, upper: 110 };\n[95, 100, 105, 110, 115].forEach(p =>\n  console.log(`price ${p}: %B ${percentB(p, band).toFixed(2)}`));\nconsole.log("bandwidth:", ((band.upper - band.lower) / band.middle).toFixed(4));' },
      { h: 'The squeeze, and what it does not tell you',
        body: '<p>Bandwidth at a multi-week low means volatility has compressed, and compression tends to be followed by expansion. That is a genuine statistical tendency.</p>' +
              '<div class="note note-warn"><b>It says nothing about direction</b>A squeeze predicts a bigger move, not which way. Trading a squeeze means preparing for either direction — usually with a bracket — rather than picking one.</div>' }
    ],
    parsons: {
      prompt: 'Compute the population standard deviation of a window.',
      lines: [
        'const n = window.length;',
        'const mean = window.reduce((a, b) => a + b, 0) / n;',
        'const variance = window.reduce((a, v) => a + (v - mean) ** 2, 0) / n;',
        'const sd = Math.sqrt(variance);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'stdev()', difficulty: 'Core',
        prompt: 'Write <code>stdev(series, n)</code> returning the rolling population standard deviation over the last <code>n</code> values, with <code>null</code> for the first <code>n-1</code> bars.',
        starter: 'function stdev(series, n) {\n  // rolling population standard deviation\n}\n',
        solution: 'function stdev(series, n) {\n  return series.map((_, i) => {\n    if (i < n - 1) return null;\n    const w = series.slice(i - n + 1, i + 1);\n    const mean = w.reduce((a, b) => a + b, 0) / n;\n    return Math.sqrt(w.reduce((a, v) => a + (v - mean) * (v - mean), 0) / n);\n  });\n}',
        hints: ['Take the window, compute its mean, then the mean of the squared distances.',
                'Divide by <code>n</code>, not <code>n-1</code> — indicators use the population form.'],
        tests: { fn: 'stdev', approx: 1e-9, cases: [
          { args: [[2, 4, 4, 4, 5, 5, 7, 9], 8], expect: [null, null, null, null, null, null, null, 2],
            name: 'the classic textbook example gives 2' },
          { args: [[5, 5, 5], 3], expect: [null, null, 0], name: 'no dispersion gives 0' },
          { args: [[1, 2], 5], expect: [null, null] },
          { args: [[], 3], expect: [] },
          { args: [[10, 20], 2], expect: [null, 5] }
        ] } },
      { id: 'e2', title: 'bollinger()', difficulty: 'Core',
        prompt: 'Write <code>bollinger(series, n, k)</code> returning an array the same length as <code>series</code> where each defined entry is <code>{ middle, upper, lower }</code> and the warm-up entries are <code>null</code>.<br>' +
          '<code>middle</code> is the SMA, and the bands sit <code>k</code> standard deviations either side.',
        starter: 'function bollinger(series, n, k) {\n  // { middle, upper, lower } per bar\n}\n',
        solution: 'function bollinger(series, n, k) {\n  return series.map((_, i) => {\n    if (i < n - 1) return null;\n    const w = series.slice(i - n + 1, i + 1);\n    const mean = w.reduce((a, b) => a + b, 0) / n;\n    const sd = Math.sqrt(w.reduce((a, v) => a + (v - mean) * (v - mean), 0) / n);\n    return { middle: mean, upper: mean + k * sd, lower: mean - k * sd };\n  });\n}',
        hints: ['Reuse the standard-deviation calculation, then build the three levels from the mean.',
                'Return <code>null</code> — not an object of nulls — during the warm-up.'],
        tests: { fn: 'bollinger', approx: 1e-9, cases: [
          { args: [[5, 5, 5], 3, 2], expect: [null, null, { middle: 5, upper: 5, lower: 5 }],
            name: 'a flat window collapses the bands onto the mean' },
          { args: [[10, 20], 2, 1], expect: [null, { middle: 15, upper: 20, lower: 10 }] },
          { args: [[1], 3, 2], expect: [null] },
          { args: [[], 3, 2], expect: [] }
        ], checks: [
          { name: 'the bands bracket the middle on the real session', expose: ['bollinger'],
            run: function (s) {
              var out = s.bollinger(MARKET.closes, 20, 2);
              if (out.length !== MARKET.closes.length) return 'the output must match the input length';
              for (var i = 0; i < out.length; i++) {
                if (out[i] === null) continue;
                if (!(out[i].lower <= out[i].middle && out[i].middle <= out[i].upper)) {
                  return 'index ' + i + ' has bands out of order';
                }
              }
              return true;
            } },
          { name: 'a larger k gives wider bands', expose: ['bollinger'],
            run: function (s) {
              var a = s.bollinger(MARKET.closes, 20, 1).at(-1);
              var b = s.bollinger(MARKET.closes, 20, 3).at(-1);
              return (b.upper - b.lower) > (a.upper - a.lower) ? true : 'k = 3 should be wider than k = 1';
            } }
        ] } },
      { id: 'e3', title: 'bandMetrics()', difficulty: 'Stretch',
        prompt: 'Write <code>bandMetrics(series, n, k)</code> returning an array the same length as <code>series</code>, each defined entry being <code>{ percentB, bandwidth, squeeze }</code>:<ul>' +
          '<li><code>percentB</code> — <code>(price - lower) / (upper - lower)</code>, or <code>0.5</code> when the bands have zero width</li>' +
          '<li><code>bandwidth</code> — <code>(upper - lower) / middle</code>, or <code>0</code> when <code>middle</code> is 0</li>' +
          '<li><code>squeeze</code> — <code>true</code> when this bar\'s bandwidth is the lowest of every defined bandwidth up to and including it</li></ul>',
        starter: 'function bandMetrics(series, n, k) {\n  // { percentB, bandwidth, squeeze } per bar\n}\n',
        solution: 'function bandMetrics(series, n, k) {\n  let lowestSoFar = Infinity;\n  return series.map((price, i) => {\n    if (i < n - 1) return null;\n    const w = series.slice(i - n + 1, i + 1);\n    const mean = w.reduce((a, b) => a + b, 0) / n;\n    const sd = Math.sqrt(w.reduce((a, v) => a + (v - mean) * (v - mean), 0) / n);\n    const upper = mean + k * sd, lower = mean - k * sd;\n    const width = upper - lower;\n    const percentB = width === 0 ? 0.5 : (price - lower) / width;\n    const bandwidth = mean === 0 ? 0 : width / mean;\n    const squeeze = bandwidth <= lowestSoFar;\n    if (bandwidth < lowestSoFar) lowestSoFar = bandwidth;\n    return { percentB, bandwidth, squeeze };\n  });\n}',
        hints: ['Track the lowest bandwidth seen so far in a variable outside the map.',
                'A bar ties the record when its bandwidth equals the lowest so far — that still counts as a squeeze.',
                'Guard both divisions: zero width and a zero middle.'],
        tests: { fn: 'bandMetrics', approx: 1e-9, cases: [
          { args: [[5, 5, 5], 3, 2],
            check: function (out) {
              if (out[0] !== null || out[1] !== null) return 'the warm-up must be null';
              var m = out[2];
              if (m.percentB !== 0.5) return 'zero-width bands should give %B 0.5, got ' + m.percentB;
              if (m.bandwidth !== 0) return 'a flat window has zero bandwidth, got ' + m.bandwidth;
              return m.squeeze === true ? true : 'the first defined bar is always the lowest so far';
            }, name: 'a flat window gives %B 0.5 and a squeeze' },
          { args: [[10, 20], 2, 1],
            check: function (out) {
              var m = out[1];
              if (Math.abs(m.percentB - 1) > 1e-9) return 'price at the upper band should give %B 1, got ' + m.percentB;
              return Math.abs(m.bandwidth - 10 / 15) < 1e-9 ? true : 'bandwidth was ' + m.bandwidth;
            }, name: '%B is 1 at the upper band' },
          { args: [[1], 3, 2], expect: [null] }
        ], checks: [
          { name: 'squeeze is only true at a new low in bandwidth', expose: ['bandMetrics'],
            run: function (s) {
              var out = s.bandMetrics(MARKET.closes, 20, 2);
              var lowest = Infinity, ok = true;
              out.forEach(function (m) {
                if (!m) return;
                var shouldBe = m.bandwidth <= lowest;
                if (m.squeeze !== shouldBe) ok = false;
                if (m.bandwidth < lowest) lowest = m.bandwidth;
              });
              return ok ? true : 'a squeeze flag did not match the running minimum bandwidth';
            } },
          { name: '%B goes above 1 when price breaks the upper band', expose: ['bandMetrics'],
            run: function (s) {
              var series = [10, 10, 10, 10, 10, 10, 10, 10, 10, 40];
              var out = s.bandMetrics(series, 5, 1);
              var last = out[out.length - 1];
              return last.percentB > 1 ? true : 'expected %B above 1 after a breakout, got ' + last.percentB;
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why do indicators divide by <code>n</code> rather than <code>n-1</code>?',
        options: ['It is simpler', 'The window is the whole population of interest, not a sample of a larger one', 'It gives bigger numbers', 'Convention only'],
        answer: 1,
        explain: 'Bessel\'s correction is for estimating a population from a sample. Here the window is the population.' },
      { q: 'What does a %B of 1.2 mean?',
        options: ['Price is at the middle band', 'Price is above the upper band', 'The bands are inverted', 'An error'],
        answer: 1,
        explain: '%B is 0 at the lower band and 1 at the upper, so above 1 means price has broken out above.' },
      { q: 'Bandwidth hits a multi-week low. What can you conclude?',
        options: ['Price will rise', 'Price will fall', 'A larger move is likelier, in an unknown direction', 'Nothing at all'],
        answer: 2,
        explain: 'Compression tends to precede expansion, but carries no directional information whatsoever.' }
    ],
    recap: [
      'Standard deviation over a window measures dispersion around its mean.',
      'Bollinger Bands are an SMA plus and minus k standard deviations.',
      '%B locates price within the bands; bandwidth measures their width.',
      'A squeeze suggests a bigger move, never which way.'
    ],
    vocab: [
      { term: 'Bollinger Bands', def: 'A moving average with volatility-scaled envelopes. Conventionally 20 periods and 2 standard deviations.' },
      { term: 'Squeeze', def: 'A period of unusually narrow bands. Often precedes an expansion in range — direction unspecified.' }
    ]
  });


  C.push({
    id: 'd064', day: 64, module: 5, minutes: 30,
    title: 'MACD',
    subtitle: 'Two EMAs, their difference, and a signal line.',
    goal: '<b>Goal:</b> build MACD from its three parts and detect the crossings that generate signals.',
    objectives: [
      'Compute the MACD line from a fast and slow EMA',
      'Derive the signal line and the histogram',
      'Detect signal-line and zero-line crosses',
      'Explain what each part is actually measuring'
    ],
    sections: [
      { h: 'Three components',
        body: '<table><tr><th>Part</th><th>Formula</th><th>Measures</th></tr>' +
              '<tr><td>MACD line</td><td>EMA(12) − EMA(26)</td><td>how far the fast average is ahead of the slow one</td></tr>' +
              '<tr><td>Signal line</td><td>EMA(9) of the MACD line</td><td>a smoothed version of that</td></tr>' +
              '<tr><td>Histogram</td><td>MACD − signal</td><td>whether the gap is widening or narrowing</td></tr></table>' +
              '<p>The MACD line above zero means the fast EMA is above the slow one — an uptrend by that definition. The histogram turning down while still positive means the trend is still up but decelerating.</p>',
        code: 'function ema(series, n) {\n  const a = 2 / (n + 1);\n  let prev = null;\n  return series.map(p => (prev = prev === null ? p : a * p + (1 - a) * prev));\n}\n\nconst s = MARKET.closes;\nconst macdLine = ema(s, 12).map((f, i) => f - ema(s, 26)[i]);\nconst signal = ema(macdLine, 9);\nconst hist = macdLine.map((m, i) => m - signal[i]);\n\nconsole.log("macd:", macdLine.at(-1).toFixed(4));\nconsole.log("signal:", signal.at(-1).toFixed(4));\nconsole.log("histogram:", hist.at(-1).toFixed(4));' },
      { h: 'Computing it once, not three times',
        body: '<p>The snippet above recomputes the slow EMA on every bar — 78 full passes. Compute each series once and index into it.</p>',
        code: 'function ema(series, n) {\n  const a = 2 / (n + 1);\n  let prev = null;\n  return series.map(p => (prev = prev === null ? p : a * p + (1 - a) * prev));\n}\n\nfunction macd(series, fast, slow, signalPeriod) {\n  const f = ema(series, fast), sl = ema(series, slow);\n  const line = series.map((_, i) => f[i] - sl[i]);\n  const signal = ema(line, signalPeriod);\n  return line.map((m, i) => ({ macd: m, signal: signal[i], histogram: m - signal[i] }));\n}\n\nconst out = macd(MARKET.closes, 12, 26, 9);\nconsole.log(out.at(-1));' },
      { h: 'Two different crosses',
        body: '<p><strong>Signal-line cross</strong> — the MACD line crossing its own signal line. Frequent, early, noisy.</p>' +
              '<p><strong>Zero-line cross</strong> — the MACD line crossing zero, which is the same event as the fast EMA crossing the slow one. Rarer, later, more reliable.</p>' +
              '<div class="note note-warn"><b>MACD is not bounded</b>Unlike RSI, MACD has no fixed range — its scale depends on the instrument\'s price. A MACD of 3 is enormous on CL and trivial on NQ. Never hard-code a MACD threshold across instruments.</div>',
        code: 'function crosses(values, level) {\n  const out = [];\n  for (let i = 1; i < values.length; i++) {\n    const p = values[i - 1], c = values[i];\n    if (p <= level && c > level) out.push({ i, dir: "up" });\n    else if (p >= level && c < level) out.push({ i, dir: "down" });\n  }\n  return out;\n}\n\nconsole.log(crosses([-1, -0.5, 0.2, 0.6, -0.3], 0));' },
      { h: 'The histogram is the early warning',
        body: '<p>The histogram peaks before the MACD line crosses its signal, because it <em>is</em> the gap between them. A shrinking histogram means the cross is approaching — sooner, and with more false alarms.</p>' }
    ],
    parsons: {
      prompt: 'Build the three MACD components.',
      lines: [
        'const fast = ema(series, 12);',
        'const slow = ema(series, 26);',
        'const line = series.map((_, i) => fast[i] - slow[i]);',
        'const signal = ema(line, 9);',
        'const histogram = line.map((m, i) => m - signal[i]);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'macd()', difficulty: 'Core',
        prompt: 'Write <code>macd(series, fast, slow, signalPeriod)</code> returning an array the same length as <code>series</code>, each entry <code>{ macd, signal, histogram }</code>.<br>' +
          'Use first-price-seeded EMAs (the <code>ema</code> helper is in the starter), so there are no nulls.',
        starter: 'function ema(series, n) {\n  const a = 2 / (n + 1);\n  let prev = null;\n  return series.map(p => (prev = prev === null ? p : a * p + (1 - a) * prev));\n}\n\nfunction macd(series, fast, slow, signalPeriod) {\n  // { macd, signal, histogram } per bar\n}\n',
        solution: 'function ema(series, n) {\n  const a = 2 / (n + 1);\n  let prev = null;\n  return series.map(p => (prev = prev === null ? p : a * p + (1 - a) * prev));\n}\n\nfunction macd(series, fast, slow, signalPeriod) {\n  const f = ema(series, fast), sl = ema(series, slow);\n  const line = series.map((_, i) => f[i] - sl[i]);\n  const sig = ema(line, signalPeriod);\n  return line.map((m, i) => ({ macd: m, signal: sig[i], histogram: m - sig[i] }));\n}',
        hints: ['Compute each EMA series once and index into it — do not call <code>ema</code> inside the map.',
                'The signal line is an EMA of the MACD line, not of the price.',
                'The histogram is simply <code>macd - signal</code>.'],
        tests: { fn: 'macd', approx: 1e-9, cases: [
          { args: [[5, 5, 5, 5], 2, 4, 2],
            check: function (out) {
              if (out.length !== 4) return 'the output must match the input length';
              return out.every(function (r) {
                return Math.abs(r.macd) < 1e-9 && Math.abs(r.histogram) < 1e-9;
              }) ? true : 'a flat series should give a MACD and histogram of 0';
            }, name: 'a flat series gives zeros' },
          { args: [[], 12, 26, 9], expect: [] }
        ], checks: [
          { name: 'histogram always equals macd minus signal', expose: ['macd'],
            run: function (s) {
              var out = s.macd(MARKET.closes, 12, 26, 9);
              for (var i = 0; i < out.length; i++) {
                if (Math.abs(out[i].histogram - (out[i].macd - out[i].signal)) > 1e-9) {
                  return 'index ' + i + ' has an inconsistent histogram';
                }
              }
              return true;
            } },
          { name: 'a rally drives the MACD line positive', expose: ['macd'],
            run: function (s) {
              var rising = [];
              for (var i = 0; i < 60; i++) rising.push(100 + i);
              var out = s.macd(rising, 12, 26, 9);
              return out[out.length - 1].macd > 0 ? true : 'a sustained rally should give a positive MACD';
            } },
          { name: 'a decline drives the MACD line negative', expose: ['macd'],
            run: function (s) {
              var falling = [];
              for (var i = 0; i < 60; i++) falling.push(200 - i);
              var out = s.macd(falling, 12, 26, 9);
              return out[out.length - 1].macd < 0 ? true : 'a sustained decline should give a negative MACD';
            } },
          { name: 'computes each EMA once, not per bar', expose: ['macd'],
            run: function (s) {
              var big = [];
              for (var i = 0; i < 4000; i++) big.push(100 + Math.sin(i / 10));
              var t0 = Date.now();
              s.macd(big, 12, 26, 9);
              var ms = Date.now() - t0;
              return ms < 400 ? true : 'took ' + ms + 'ms on 4000 bars — the EMAs are being recomputed inside the loop';
            } }
        ] } },
      { id: 'e2', title: 'crossings()', difficulty: 'Core',
        prompt: 'Write <code>crossings(values, level)</code> returning an array of <code>{ index, direction }</code> for every bar where <code>values</code> crosses <code>level</code>.<ul>' +
          '<li><code>"up"</code> when the previous value was at or below the level and the current is above</li>' +
          '<li><code>"down"</code> when the previous was at or above and the current is below</li></ul>' +
          'Entries where either value is <code>null</code> are skipped.',
        starter: 'function crossings(values, level) {\n  // [{ index, direction }]\n}\n',
        solution: 'function crossings(values, level) {\n  const out = [];\n  for (let i = 1; i < values.length; i++) {\n    const p = values[i - 1], c = values[i];\n    if (p === null || c === null) continue;\n    if (p <= level && c > level) out.push({ index: i, direction: "up" });\n    else if (p >= level && c < level) out.push({ index: i, direction: "down" });\n  }\n  return out;\n}',
        hints: ['Start the loop at <code>i = 1</code> — a cross needs a previous value.',
                'Inclusive on the previous side and strict on the current side prevents a value sitting exactly on the level from firing twice.'],
        tests: { fn: 'crossings', cases: [
          { args: [[-1, -0.5, 0.2, 0.6, -0.3], 0],
            expect: [{ index: 2, direction: 'up' }, { index: 4, direction: 'down' }] },
          { args: [[1, 2, 3], 0], expect: [], name: 'never touching the level gives nothing' },
          { args: [[0, 1], 0], expect: [{ index: 1, direction: 'up' }],
            name: 'starting exactly at the level and rising counts as a cross up' },
          { args: [[null, null, 1, -1], 0], expect: [{ index: 3, direction: 'down' }],
            name: 'nulls are skipped' },
          { args: [[], 0], expect: [] }
        ] } },
      { id: 'e3', title: 'macdSignals()', difficulty: 'Stretch',
        prompt: 'Write <code>macdSignals(series, { fast, slow, signalPeriod, requireTrend })</code> returning an array the same length as <code>series</code>:<ul>' +
          '<li><code>"long"</code> where the MACD line crosses <em>above</em> its signal line</li>' +
          '<li><code>"short"</code> where it crosses <em>below</em></li>' +
          '<li><code>null</code> elsewhere</li></ul>' +
          '<span class="muted">Define a cross up as <code>line[i] &gt; signal[i]</code> while <code>line[i-1] &lt;= signal[i-1]</code>, and a cross down as the mirror image — so two lines that were exactly equal still register a cross when they separate.</span><br>' +
          'When <code>requireTrend</code> is true, only emit <code>"long"</code> if the MACD line is also above zero, and <code>"short"</code> only if it is below zero.<br>' +
          '<span class="muted">The <code>ema</code> helper is in the starter.</span>',
        starter: 'function ema(series, n) {\n  const a = 2 / (n + 1);\n  let prev = null;\n  return series.map(p => (prev = prev === null ? p : a * p + (1 - a) * prev));\n}\n\nfunction macdSignals(series, { fast, slow, signalPeriod, requireTrend }) {\n  // signal-line crosses, optionally gated by the zero line\n}\n',
        solution: 'function ema(series, n) {\n  const a = 2 / (n + 1);\n  let prev = null;\n  return series.map(p => (prev = prev === null ? p : a * p + (1 - a) * prev));\n}\n\nfunction macdSignals(series, { fast, slow, signalPeriod, requireTrend }) {\n  const f = ema(series, fast), sl = ema(series, slow);\n  const line = series.map((_, i) => f[i] - sl[i]);\n  const sig = ema(line, signalPeriod);\n  return series.map((_, i) => {\n    if (i === 0) return null;\n    const crossedUp = line[i] > sig[i] && line[i - 1] <= sig[i - 1];\n    const crossedDown = line[i] < sig[i] && line[i - 1] >= sig[i - 1];\n    if (crossedUp) return (!requireTrend || line[i] > 0) ? "long" : null;\n    if (crossedDown) return (!requireTrend || line[i] < 0) ? "short" : null;\n    return null;\n  });\n}',
        hints: ['Build the MACD and signal series first, then walk them comparing each bar with the previous.',
                'A cross up is <code>line[i] &gt; sig[i] &amp;&amp; line[i-1] &lt;= sig[i-1]</code>; a cross down mirrors it. Writing both sides this way means two equal values still register as a cross when they separate.',
                'The trend gate applies <em>after</em> the cross is detected — a suppressed cross is <code>null</code>, not the opposite signal.'],
        tests: { fn: 'macdSignals', cases: [
          { args: [[5, 5, 5, 5, 5], { fast: 2, slow: 4, signalPeriod: 2, requireTrend: false }],
            check: function (out) {
              return out.every(function (v) { return v === null; }) ? true : 'a flat series should produce no signals';
            }, name: 'a flat series produces no signals' },
          { args: [[], { fast: 12, slow: 26, signalPeriod: 9, requireTrend: false }], expect: [] }
        ], checks: [
          { name: 'a rally produces a long cross', expose: ['macdSignals'],
            run: function (s) {
              var series = [];
              for (var i = 0; i < 20; i++) series.push(100);
              for (var j = 0; j < 20; j++) series.push(100 + j * 2);
              var out = s.macdSignals(series, { fast: 3, slow: 8, signalPeriod: 3, requireTrend: false });
              return out.indexOf('long') >= 0 ? true : 'expected a long signal during the rally';
            } },
          { name: 'a sell-off produces a short cross', expose: ['macdSignals'],
            run: function (s) {
              var series = [];
              for (var i = 0; i < 20; i++) series.push(100);
              for (var j = 0; j < 20; j++) series.push(100 - j * 2);
              var out = s.macdSignals(series, { fast: 3, slow: 8, signalPeriod: 3, requireTrend: false });
              return out.indexOf('short') >= 0 ? true : 'expected a short signal during the decline';
            } },
          { name: 'requireTrend never produces more signals', expose: ['macdSignals'],
            run: function (s) {
              var opts = { fast: 12, slow: 26, signalPeriod: 9 };
              var loose = s.macdSignals(MARKET.closes, Object.assign({ requireTrend: false }, opts));
              var tight = s.macdSignals(MARKET.closes, Object.assign({ requireTrend: true }, opts));
              var l = loose.filter(function (v) { return v; }).length;
              var t = tight.filter(function (v) { return v; }).length;
              return t <= l ? true : 'the trend gate produced more signals (' + t + ' vs ' + l + ')';
            } },
          { name: 'gated longs only appear above the zero line', expose: ['macdSignals'],
            run: function (s) {
              var f = function (a, n) {
                var al = 2 / (n + 1), prev = null;
                return a.map(function (p) { return (prev = prev === null ? p : al * p + (1 - al) * prev); });
              };
              var fast = f(MARKET.closes, 12), slow = f(MARKET.closes, 26);
              var line = MARKET.closes.map(function (_, i) { return fast[i] - slow[i]; });
              var out = s.macdSignals(MARKET.closes, { fast: 12, slow: 26, signalPeriod: 9, requireTrend: true });
              for (var i = 0; i < out.length; i++) {
                if (out[i] === 'long' && line[i] <= 0) return 'a gated long fired at index ' + i + ' with MACD below zero';
                if (out[i] === 'short' && line[i] >= 0) return 'a gated short fired at index ' + i + ' with MACD above zero';
              }
              return true;
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is the MACD line?',
        options: ['An EMA of price', 'The difference between a fast and a slow EMA', 'The signal line smoothed', 'A percentage'],
        answer: 1,
        explain: 'Typically EMA(12) − EMA(26). It measures how far ahead the fast average is.' },
      { q: 'What does a MACD zero-line cross correspond to?',
        options: ['Price crossing its average', 'The fast EMA crossing the slow EMA', 'The histogram peaking', 'Nothing'],
        answer: 1,
        explain: 'MACD is the difference of the two EMAs, so MACD = 0 is exactly the moment they cross.' },
      { q: 'Why should a MACD threshold never be hard-coded across instruments?',
        options: ['It is bounded 0-100', 'MACD is in price units, so its scale depends on the instrument', 'It changes daily', 'It is always zero'],
        answer: 1,
        explain: 'A MACD of 3 is huge on crude at $78 and negligible on NQ at 18,000.' }
    ],
    recap: [
      'MACD line = fast EMA − slow EMA; signal = EMA of that; histogram = the gap.',
      'Zero-line crosses are the two EMAs crossing.',
      'The histogram turns before the signal-line cross.',
      'MACD is unbounded and price-scaled — thresholds do not transfer.'
    ],
    vocab: [
      { term: 'MACD', def: 'Moving Average Convergence Divergence. A trend-following momentum indicator built entirely from EMAs.' },
      { term: 'Histogram', def: 'The gap between the MACD line and its signal. Its slope is a leading hint of an approaching cross.' }
    ]
  });

  C.push({
    id: 'd065', day: 65, module: 5, minutes: 30,
    title: 'VWAP',
    subtitle: 'The volume-weighted average price, and why institutions care.',
    goal: '<b>Goal:</b> compute session VWAP and its standard-deviation bands, and reset it correctly at the session boundary.',
    objectives: [
      'Compute typical price and the running VWAP',
      'Reset VWAP at the start of each session',
      'Add VWAP standard-deviation bands',
      'Explain why VWAP is a benchmark, not a signal'
    ],
    sections: [
      { h: 'The formula',
        body: '<p><strong>Typical price</strong> for a bar is <code>(high + low + close) / 3</code>. VWAP is the running sum of typical price × volume, divided by the running sum of volume.</p>' +
              '<p>Unlike a moving average, VWAP is <em>cumulative from a reset point</em> — usually the session open — so it becomes progressively harder to move as the day goes on.</p>',
        code: 'function vwap(bars) {\n  let pv = 0, vol = 0;\n  return bars.map(b => {\n    const typical = (b.high + b.low + b.close) / 3;\n    pv += typical * b.volume;\n    vol += b.volume;\n    return vol === 0 ? null : pv / vol;\n  });\n}\n\nconst v = vwap(MARKET.bars);\nconsole.log("VWAP after 5 bars:", v[4].toFixed(2));\nconsole.log("VWAP at the close:", v.at(-1).toFixed(2));\nconsole.log("last close:", MARKET.closes.at(-1).toFixed(2));' },
      { h: 'Why it is a benchmark',
        body: '<p>A fund with a large order to work is measured against VWAP: filling below it on a buy is a good execution, above it is a bad one. That makes VWAP a genuine magnet — a great deal of real order flow is actively trying to trade near it.</p>' +
              '<div class="note note-trade"><b>Benchmark, not signal</b>"Price is above VWAP" tells you buyers have paid up relative to the session average. It is context for a decision, not a decision. Systems that buy every VWAP touch discover that the level fails exactly when the trend is strongest.</div>' },
      { h: 'Resetting at the session boundary',
        body: '<p>A VWAP that never resets drifts further from price every day until it is meaningless. Reset the accumulators whenever a bar starts a new session.</p>',
        code: 'function sessionVwap(bars, isNewSession) {\n  let pv = 0, vol = 0;\n  return bars.map((b, i) => {\n    if (isNewSession(b, i)) { pv = 0; vol = 0; }\n    const typical = (b.high + b.low + b.close) / 3;\n    pv += typical * b.volume;\n    vol += b.volume;\n    return vol === 0 ? null : pv / vol;\n  });\n}\n\nconst out = sessionVwap(MARKET.bars, (b, i) => i === 0 || i === 40);\nconsole.log("bar 39:", out[39].toFixed(2), " bar 40 (reset):", out[40].toFixed(2));' },
      { h: 'VWAP bands',
        body: '<p>Bands are placed at multiples of the volume-weighted standard deviation of typical price around the VWAP. The maths mirrors Bollinger, but everything is weighted by volume, so a heavy bar counts for more than a thin one.</p>',
        code: 'function vwapWithBands(bars, k) {\n  let pv = 0, pv2 = 0, vol = 0;\n  return bars.map(b => {\n    const t = (b.high + b.low + b.close) / 3;\n    pv += t * b.volume;\n    pv2 += t * t * b.volume;\n    vol += b.volume;\n    if (vol === 0) return null;\n    const mean = pv / vol;\n    const variance = Math.max(0, pv2 / vol - mean * mean);\n    const sd = Math.sqrt(variance);\n    return { vwap: mean, upper: mean + k * sd, lower: mean - k * sd };\n  });\n}\n\nconst last = vwapWithBands(MARKET.bars, 1).at(-1);\nconsole.log(`lower ${last.lower.toFixed(2)} | vwap ${last.vwap.toFixed(2)} | upper ${last.upper.toFixed(2)}`);' }
    ],
    parsons: {
      prompt: 'Accumulate a running VWAP.',
      lines: [
        'let pv = 0, vol = 0;',
        'const out = bars.map(b => {',
        '  const typical = (b.high + b.low + b.close) / 3;',
        '  pv += typical * b.volume;',
        '  vol += b.volume;',
        '  return pv / vol;',
        '});'
      ]
    },
    exercises: [
      { id: 'e1', title: 'typicalPrice() and vwap()', difficulty: 'Core',
        prompt: 'Write two functions:<ul>' +
          '<li><code>typicalPrice(bar)</code> — <code>(high + low + close) / 3</code></li>' +
          '<li><code>vwap(bars)</code> — the running VWAP, one value per bar, <code>null</code> while the cumulative volume is still 0</li></ul>',
        expose: ['typicalPrice', 'vwap'],
        starter: 'function typicalPrice(bar) {\n  // (high + low + close) / 3\n}\n\nfunction vwap(bars) {\n  // running volume-weighted average price\n}\n',
        solution: 'function typicalPrice(bar) {\n  return (bar.high + bar.low + bar.close) / 3;\n}\n\nfunction vwap(bars) {\n  let pv = 0, vol = 0;\n  return bars.map(b => {\n    pv += typicalPrice(b) * b.volume;\n    vol += b.volume;\n    return vol === 0 ? null : pv / vol;\n  });\n}',
        hints: ['Keep two running totals outside the map: price×volume, and volume.',
                'Guard against dividing by a zero cumulative volume.'],
        tests: { checks: [
          { name: 'typicalPrice averages high, low and close', expose: ['typicalPrice'],
            run: function (s) {
              var v = s.typicalPrice({ high: 12, low: 6, close: 9 });
              return Math.abs(v - 9) < 1e-9 ? true : 'expected 9, got ' + v;
            } },
          { name: 'a single bar VWAPs to its typical price', expose: ['vwap'],
            run: function (s) {
              var out = s.vwap([{ high: 12, low: 6, close: 9, volume: 100 }]);
              return Math.abs(out[0] - 9) < 1e-9 ? true : 'got ' + out[0];
            } },
          { name: 'weights by volume', expose: ['vwap'],
            run: function (s) {
              var out = s.vwap([
                { high: 10, low: 10, close: 10, volume: 1 },
                { high: 20, low: 20, close: 20, volume: 9 }
              ]);
              return Math.abs(out[1] - 19) < 1e-9 ? true : 'expected 19, got ' + out[1];
            } },
          { name: 'zero volume gives null rather than NaN', expose: ['vwap'],
            run: function (s) {
              var out = s.vwap([{ high: 10, low: 10, close: 10, volume: 0 }]);
              return out[0] === null ? true : 'expected null, got ' + out[0];
            } },
          { name: 'output length matches the bars', expose: ['vwap'],
            run: function (s) {
              return s.vwap(MARKET.bars).length === MARKET.bars.length ? true : 'the lengths do not match';
            } }
        ] } },
      { id: 'e2', title: 'sessionVwap()', difficulty: 'Core',
        prompt: 'Write <code>sessionVwap(bars, isNewSession)</code> where <code>isNewSession(bar, index)</code> returns true for the first bar of a session.<br>' +
          'Reset the accumulators <strong>before</strong> including that bar, so the first bar of a session VWAPs to its own typical price.',
        starter: 'function sessionVwap(bars, isNewSession) {\n  // VWAP that resets at each session start\n}\n',
        solution: 'function sessionVwap(bars, isNewSession) {\n  let pv = 0, vol = 0;\n  return bars.map((b, i) => {\n    if (isNewSession(b, i)) { pv = 0; vol = 0; }\n    const t = (b.high + b.low + b.close) / 3;\n    pv += t * b.volume;\n    vol += b.volume;\n    return vol === 0 ? null : pv / vol;\n  });\n}',
        hints: ['Check <code>isNewSession</code> first, then accumulate — order matters here.',
                'Resetting after accumulating would discard the bar that started the session.'],
        tests: { fn: 'sessionVwap', approx: 1e-9, cases: [
          { args: [[{ high: 10, low: 10, close: 10, volume: 1 },
                    { high: 20, low: 20, close: 20, volume: 1 },
                    { high: 30, low: 30, close: 30, volume: 1 }],
                   function (b, i) { return i === 0 || i === 2; }],
            expect: [10, 15, 30], name: 'the reset bar VWAPs to its own typical price' },
          { args: [[{ high: 10, low: 10, close: 10, volume: 1 },
                    { high: 20, low: 20, close: 20, volume: 1 }],
                   function (b, i) { return i === 0; }],
            expect: [10, 15], name: 'without a reset it accumulates normally' },
          { args: [[], function () { return true; }], expect: [] }
        ] } },
      { id: 'e3', title: 'vwapBands()', difficulty: 'Stretch',
        prompt: 'Write <code>vwapBands(bars, k)</code> returning one entry per bar: <code>{ vwap, upper, lower }</code>, or <code>null</code> while the cumulative volume is 0.<br>' +
          'The bands sit <code>k</code> volume-weighted standard deviations either side of the VWAP.<br>' +
          '<span class="muted">Variance = Σ(t²·v)/Σv − mean². Clamp it at 0 so floating-point error cannot produce a negative under the square root.</span>',
        starter: 'function vwapBands(bars, k) {\n  // { vwap, upper, lower } per bar\n}\n',
        solution: 'function vwapBands(bars, k) {\n  let pv = 0, pv2 = 0, vol = 0;\n  return bars.map(b => {\n    const t = (b.high + b.low + b.close) / 3;\n    pv += t * b.volume;\n    pv2 += t * t * b.volume;\n    vol += b.volume;\n    if (vol === 0) return null;\n    const mean = pv / vol;\n    const variance = Math.max(0, pv2 / vol - mean * mean);\n    const sd = Math.sqrt(variance);\n    return { vwap: mean, upper: mean + k * sd, lower: mean - k * sd };\n  });\n}',
        hints: ['Keep a third accumulator for the sum of typical price squared times volume.',
                'Variance is the weighted mean of squares minus the square of the weighted mean.',
                '<code>Math.max(0, …)</code> before the square root guards against tiny negative values.'],
        tests: { fn: 'vwapBands', approx: 1e-9, cases: [
          { args: [[{ high: 10, low: 10, close: 10, volume: 5 }], 2],
            expect: [{ vwap: 10, upper: 10, lower: 10 }],
            name: 'a single bar has zero dispersion' },
          { args: [[{ high: 10, low: 10, close: 10, volume: 0 }], 2],
            expect: [null], name: 'zero volume gives null' },
          { args: [[], 2], expect: [] }
        ], checks: [
          { name: 'bands widen as prices disperse', expose: ['vwapBands'],
            run: function (s) {
              var out = s.vwapBands([
                { high: 10, low: 10, close: 10, volume: 1 },
                { high: 20, low: 20, close: 20, volume: 1 }
              ], 1);
              var w = out[1].upper - out[1].lower;
              return w > 0 ? true : 'two different prices should give a non-zero band width';
            } },
          { name: 'the bands bracket the VWAP on the real session', expose: ['vwapBands'],
            run: function (s) {
              var out = s.vwapBands(MARKET.bars, 2);
              if (out.length !== MARKET.bars.length) return 'the output must match the input length';
              for (var i = 0; i < out.length; i++) {
                if (out[i] === null) continue;
                if (!(out[i].lower <= out[i].vwap && out[i].vwap <= out[i].upper)) {
                  return 'index ' + i + ' has bands out of order';
                }
                if (!Number.isFinite(out[i].upper)) return 'index ' + i + ' produced a non-finite band';
              }
              return true;
            } },
          { name: 'the VWAP component matches a plain VWAP', expose: ['vwapBands'],
            run: function (s) {
              var pv = 0, vol = 0, want = [];
              MARKET.bars.forEach(function (b) {
                var t = (b.high + b.low + b.close) / 3;
                pv += t * b.volume; vol += b.volume;
                want.push(pv / vol);
              });
              var out = s.vwapBands(MARKET.bars, 1);
              for (var i = 0; i < out.length; i++) {
                if (Math.abs(out[i].vwap - want[i]) > 1e-6) return 'index ' + i + ' VWAP differs';
              }
              return true;
            } }
        ] } }
    ],
    quiz: [
      { q: 'How does VWAP differ from a moving average?',
        options: ['It is smoother', 'It is cumulative from a reset point and weighted by volume', 'It uses only closes', 'It leads price'],
        answer: 1,
        explain: 'A moving average has a fixed window; VWAP accumulates from the session open and weights each bar by its volume.' },
      { q: 'Why does VWAP become harder to move later in the session?',
        options: ['Volume falls', 'The cumulative volume in the denominator keeps growing', 'It is capped', 'It is smoothed'],
        answer: 1,
        explain: 'Each new bar is a smaller fraction of the total, so its influence shrinks as the day progresses.' },
      { q: 'What happens to a VWAP that is never reset?',
        options: ['It becomes more accurate', 'It drifts further from price every day until it is meaningless', 'It stays the same', 'It throws'],
        answer: 1,
        explain: 'Weeks of accumulated volume anchor it somewhere price left long ago. Reset it at each session start.' }
    ],
    recap: [
      'VWAP = Σ(typical × volume) / Σ volume, accumulated from a reset point.',
      'Typical price is (high + low + close) / 3.',
      'Reset at the session boundary or the level goes stale.',
      'VWAP is an execution benchmark first and a chart level second.'
    ],
    vocab: [
      { term: 'VWAP', def: 'Volume Weighted Average Price. The benchmark large orders are measured against, and a level much real order flow targets.' },
      { term: 'Execution benchmark', def: 'The reference price a fill is judged by. Beating VWAP on a buy means filling below it.' }
    ]
  });


  C.push({
    id: 'd066', day: 66, module: 5, minutes: 30,
    title: 'The Stochastic Oscillator',
    subtitle: 'Where does this close sit inside the recent range?',
    goal: '<b>Goal:</b> implement %K and %D and understand what a bounded range oscillator can and cannot tell you.',
    objectives: [
      'Compute %K from the rolling high and low',
      'Smooth it into %D',
      'Handle a flat range without dividing by zero',
      'Contrast the fast and slow variants'
    ],
    sections: [
      { h: 'The idea in one sentence',
        body: '<p>Where does the current close sit between the highest high and lowest low of the last <em>n</em> bars? At the top of the range, %K is 100; at the bottom, 0.</p>' +
              '<p class="mono" style="color:var(--fg)">%K = 100 × (close − lowestLow) / (highestHigh − lowestLow)</p>',
        code: 'function stochK(bars, n) {\n  return bars.map((b, i) => {\n    if (i < n - 1) return null;\n    const w = bars.slice(i - n + 1, i + 1);\n    const hh = Math.max(...w.map(x => x.high));\n    const ll = Math.min(...w.map(x => x.low));\n    return hh === ll ? 50 : 100 * (b.close - ll) / (hh - ll);\n  });\n}\n\nconst k = stochK(MARKET.bars, 14);\nconsole.log("last %K:", k.at(-1).toFixed(2));' },
      { h: 'The flat-range case',
        body: '<p>If every bar in the window had the same high and low, the denominator is 0. There is no meaningful position within a range of zero width, so return the midpoint 50 rather than producing <code>NaN</code>.</p>' +
              '<div class="note note-warn"><b>This is not hypothetical</b>Illiquid instruments, halted markets and overnight sessions all produce runs of identical bars. An unguarded division turns the whole downstream series into <code>NaN</code>.</div>' },
      { h: '%D and the fast/slow variants',
        body: '<p>%D is a moving average of %K, conventionally 3 periods. The names get confusing, so:</p>' +
              '<table><tr><th>Variant</th><th>%K</th><th>%D</th></tr>' +
              '<tr><td>Fast</td><td>raw %K</td><td>SMA(3) of %K</td></tr>' +
              '<tr><td>Slow</td><td>SMA(3) of raw %K</td><td>SMA(3) of that</td></tr></table>' +
              '<p>The slow variant is just the fast one smoothed once more. Most platforms show slow by default because raw %K is extremely noisy.</p>',
        code: 'function smaOf(values, n) {\n  return values.map((_, i) => {\n    if (i < n - 1) return null;\n    const w = values.slice(i - n + 1, i + 1);\n    if (w.some(v => v === null)) return null;\n    return w.reduce((a, b) => a + b, 0) / n;\n  });\n}\n\nconsole.log(smaOf([null, null, 10, 20, 30], 3));' },
      { h: 'Bounded does not mean mean-reverting',
        body: '<p>%K is trapped between 0 and 100, which tempts people to fade the extremes. But a market trending strongly closes near the top of its range every bar, so %K pins above 80 and stays there. The same warning as RSI: extremes measure strength, and only a trend filter turns them into a reversal case.</p>' }
    ],
    parsons: {
      prompt: 'Locate the close within the recent range.',
      lines: [
        'const window = bars.slice(i - n + 1, i + 1);',
        'const hh = Math.max(...window.map(b => b.high));',
        'const ll = Math.min(...window.map(b => b.low));',
        'const k = hh === ll ? 50 : 100 * (bars[i].close - ll) / (hh - ll);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'stochasticK()', difficulty: 'Core',
        prompt: 'Write <code>stochasticK(bars, n)</code> returning an array the same length as <code>bars</code>, <code>null</code> for the first <code>n-1</code> bars, and %K thereafter.<br>' +
          'A window whose highest high equals its lowest low gives <code>50</code>.',
        starter: 'function stochasticK(bars, n) {\n  // 100 * (close - lowestLow) / (highestHigh - lowestLow)\n}\n',
        solution: 'function stochasticK(bars, n) {\n  return bars.map((b, i) => {\n    if (i < n - 1) return null;\n    const w = bars.slice(i - n + 1, i + 1);\n    const hh = Math.max(...w.map(x => x.high));\n    const ll = Math.min(...w.map(x => x.low));\n    return hh === ll ? 50 : 100 * (b.close - ll) / (hh - ll);\n  });\n}',
        hints: ['Take the window, then its highest high and lowest low.',
                'Guard the zero-width case before dividing.'],
        tests: { fn: 'stochasticK', approx: 1e-9, cases: [
          { args: [[{ high: 10, low: 0, close: 10 }], 1], expect: [100], name: 'a close at the high gives 100' },
          { args: [[{ high: 10, low: 0, close: 0 }], 1], expect: [0], name: 'a close at the low gives 0' },
          { args: [[{ high: 10, low: 0, close: 5 }], 1], expect: [50] },
          { args: [[{ high: 5, low: 5, close: 5 }], 1], expect: [50], name: 'a zero-width range gives 50, not NaN' },
          { args: [[{ high: 10, low: 5, close: 8 }, { high: 12, low: 4, close: 11 }], 2],
            expect: [null, 100 * (11 - 4) / (12 - 4)] },
          { args: [[], 3], expect: [] }
        ], checks: [{
          name: 'stays within 0 and 100 on the real session', expose: ['stochasticK'],
          run: function (s) {
            var out = s.stochasticK(MARKET.bars, 14);
            if (out.length !== MARKET.bars.length) return 'the output must match the input length';
            for (var i = 0; i < out.length; i++) {
              if (out[i] === null) continue;
              if (!(out[i] >= 0 && out[i] <= 100)) return 'index ' + i + ' produced ' + out[i];
            }
            return true;
          }
        }] } },
      { id: 'e2', title: 'smoothSeries()', difficulty: 'Core',
        prompt: 'Write <code>smoothSeries(values, n)</code> applying an <code>n</code>-period simple moving average to an array that may contain <code>null</code>s.<br>' +
          'Any window containing a <code>null</code> produces <code>null</code>.',
        starter: 'function smoothSeries(values, n) {\n  // SMA that refuses windows containing nulls\n}\n',
        solution: 'function smoothSeries(values, n) {\n  return values.map((_, i) => {\n    if (i < n - 1) return null;\n    const w = values.slice(i - n + 1, i + 1);\n    if (w.some(v => v === null)) return null;\n    return w.reduce((a, b) => a + b, 0) / n;\n  });\n}',
        hints: ['Check the window for nulls with <code>some</code> before averaging.',
                'The warm-up rule is the same as any other moving average.'],
        tests: { fn: 'smoothSeries', approx: 1e-9, cases: [
          { args: [[null, null, 10, 20, 30], 3], expect: [null, null, null, null, 20] },
          { args: [[10, 20, 30], 3], expect: [null, null, 20] },
          { args: [[5, 5, 5, 5], 2], expect: [null, 5, 5, 5] },
          { args: [[], 3], expect: [] }
        ] } },
      { id: 'e3', title: 'stochastic()', difficulty: 'Stretch',
        prompt: 'Write <code>stochastic(bars, { kPeriod, kSmooth, dPeriod })</code> returning an array the same length as <code>bars</code>, each entry <code>{ k, d }</code> or <code>null</code>.<ol>' +
          '<li>Compute raw %K over <code>kPeriod</code>.</li>' +
          '<li><code>k</code> is that smoothed over <code>kSmooth</code> periods (a <code>kSmooth</code> of 1 leaves it raw).</li>' +
          '<li><code>d</code> is <code>k</code> smoothed over <code>dPeriod</code>.</li>' +
          '<li>An entry is <code>null</code> only while <code>k</code> itself is undefined; <code>d</code> may still be <code>null</code> inside a defined entry.</li></ol>',
        starter: 'function stochastic(bars, { kPeriod, kSmooth, dPeriod }) {\n  // { k, d } per bar\n}\n',
        solution: 'function stochastic(bars, { kPeriod, kSmooth, dPeriod }) {\n  const raw = bars.map((b, i) => {\n    if (i < kPeriod - 1) return null;\n    const w = bars.slice(i - kPeriod + 1, i + 1);\n    const hh = Math.max(...w.map(x => x.high));\n    const ll = Math.min(...w.map(x => x.low));\n    return hh === ll ? 50 : 100 * (b.close - ll) / (hh - ll);\n  });\n  const smooth = (values, n) => values.map((_, i) => {\n    if (n <= 1) return values[i];\n    if (i < n - 1) return null;\n    const w = values.slice(i - n + 1, i + 1);\n    if (w.some(v => v === null)) return null;\n    return w.reduce((a, b) => a + b, 0) / n;\n  });\n  const k = smooth(raw, kSmooth);\n  const d = smooth(k, dPeriod);\n  return k.map((v, i) => v === null ? null : { k: v, d: d[i] });\n}',
        hints: ['Build raw %K first, then apply the smoothing helper twice.',
                'A <code>kSmooth</code> of 1 should pass the raw values through unchanged.',
                'The final map returns <code>null</code> only when <code>k</code> is null — <code>d</code> can legitimately still be null.'],
        tests: { fn: 'stochastic', approx: 1e-9, cases: [
          { args: [[{ high: 10, low: 0, close: 10 }], { kPeriod: 1, kSmooth: 1, dPeriod: 1 }],
            expect: [{ k: 100, d: 100 }], name: 'all periods of 1 pass the raw value through' },
          { args: [[], { kPeriod: 14, kSmooth: 3, dPeriod: 3 }], expect: [] }
        ], checks: [
          { name: 'k and d stay within 0 and 100', expose: ['stochastic'],
            run: function (s) {
              var out = s.stochastic(MARKET.bars, { kPeriod: 14, kSmooth: 3, dPeriod: 3 });
              if (out.length !== MARKET.bars.length) return 'the output must match the input length';
              for (var i = 0; i < out.length; i++) {
                if (out[i] === null) continue;
                if (!(out[i].k >= 0 && out[i].k <= 100)) return 'k out of range at index ' + i;
                if (out[i].d !== null && !(out[i].d >= 0 && out[i].d <= 100)) return 'd out of range at index ' + i;
              }
              return true;
            } },
          { name: 'd lags k', expose: ['stochastic'],
            run: function (s) {
              var out = s.stochastic(MARKET.bars, { kPeriod: 14, kSmooth: 3, dPeriod: 3 });
              var firstK = out.findIndex(function (v) { return v !== null; });
              var firstD = out.findIndex(function (v) { return v !== null && v.d !== null; });
              return firstD > firstK ? true : 'd should become defined later than k (' + firstK + ' vs ' + firstD + ')';
            } },
          { name: 'kSmooth of 1 leaves k raw', expose: ['stochastic'],
            run: function (s) {
              var raw = s.stochastic(MARKET.bars, { kPeriod: 5, kSmooth: 1, dPeriod: 1 });
              var i = MARKET.bars.length - 1;
              var w = MARKET.bars.slice(i - 4, i + 1);
              var hh = Math.max.apply(null, w.map(function (x) { return x.high; }));
              var ll = Math.min.apply(null, w.map(function (x) { return x.low; }));
              var want = hh === ll ? 50 : 100 * (MARKET.bars[i].close - ll) / (hh - ll);
              return Math.abs(raw[i].k - want) < 1e-9 ? true : 'expected ' + want + ', got ' + raw[i].k;
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does a %K of 100 mean?',
        options: ['The market is overbought', 'The close is at the highest high of the lookback window', 'The trend has ended', 'Volume is at a peak'],
        answer: 1,
        explain: 'It is a position within a range, nothing more. Interpreting it as "overbought" is the reader\'s inference, not the maths.' },
      { q: 'Every bar in the window has the same high and low. What should %K return?',
        options: ['0', '100', '50', 'NaN'],
        answer: 2,
        explain: 'The range has zero width, so no position within it is meaningful. The midpoint is the conventional answer and it keeps NaN out of the series.' },
      { q: 'What is the difference between fast and slow stochastic?',
        options: ['The lookback period', 'Slow applies one extra smoothing pass', 'Slow uses closes only', 'Nothing'],
        answer: 1,
        explain: 'Slow %K is fast %D. Every platform shows slow by default because raw %K is extremely noisy.' }
    ],
    recap: [
      '%K places the close within the recent high-low range, 0 to 100.',
      'Guard the zero-width range and return 50.',
      '%D is %K smoothed; slow stochastic is one more smoothing pass.',
      'Bounded oscillators pin in trends — extremes mean strength.'
    ],
    vocab: [
      { term: 'Stochastic oscillator', def: 'Where the close sits within the recent range. Developed by George Lane in the 1950s and still on most charts.' },
      { term: 'Fading', def: 'Trading against a move — selling strength, buying weakness. Profitable in ranges, expensive in trends.' }
    ]
  });

  C.push({
    id: 'd067', day: 67, module: 5, minutes: 30,
    title: 'Volume Analysis',
    subtitle: 'Relative volume, OBV, and confirming a move.',
    goal: '<b>Goal:</b> measure whether a move is backed by participation, using relative volume and on-balance volume.',
    objectives: [
      'Compute relative volume against a baseline',
      'Build On-Balance Volume',
      'Detect a volume spike',
      'Explain why volume confirms rather than predicts'
    ],
    sections: [
      { h: 'Raw volume is not comparable',
        body: '<p>Twenty thousand contracts is enormous at 03:00 and unremarkable at the open. Volume only means something relative to what is <em>normal for that moment</em>.</p>' +
              '<p><strong>Relative volume</strong> is this bar\'s volume divided by the average of the last <em>n</em> bars. Above 1 means heavier than usual; 2 means twice normal.</p>',
        code: 'function relativeVolume(volumes, n) {\n  return volumes.map((v, i) => {\n    if (i < n) return null;\n    const avg = volumes.slice(i - n, i).reduce((a, b) => a + b, 0) / n;\n    return avg === 0 ? null : v / avg;\n  });\n}\n\nconst rv = relativeVolume(MARKET.volumes, 20);\nconsole.log("last relative volume:", rv.at(-1).toFixed(2));\nconsole.log("spikes above 1.5x:", rv.filter(v => v !== null && v > 1.5).length);' },
      { h: 'The baseline must exclude the current bar',
        body: '<div class="note note-warn"><b>A subtle self-reference</b>If the average includes the current bar, a huge bar inflates its own baseline and its relative volume is understated. Compare against the <em>prior</em> n bars: <code>slice(i - n, i)</code>, not <code>slice(i - n + 1, i + 1)</code>.</div>' },
      { h: 'On-Balance Volume',
        body: '<p>OBV is a running total: add the bar\'s volume when the close rose, subtract it when the close fell, and leave it unchanged when the close was flat.</p>' +
              '<p>The absolute value is meaningless — only the <em>direction</em> of OBV matters. Rising OBV means volume is arriving on up bars.</p>',
        code: 'function obv(bars) {\n  let total = 0;\n  return bars.map((b, i) => {\n    if (i > 0) {\n      if (b.close > bars[i - 1].close) total += b.volume;\n      else if (b.close < bars[i - 1].close) total -= b.volume;\n    }\n    return total;\n  });\n}\n\nconst o = obv(MARKET.bars);\nconsole.log("OBV start:", o[0], " end:", o.at(-1));\nconsole.log(o.at(-1) < 0 ? "volume arrived on down bars" : "volume arrived on up bars");' },
      { h: 'Volume confirms; it does not predict',
        body: '<p>A breakout on twice-normal volume has more participants behind it than one on half-normal volume. That is a real distinction, and it is the whole of what volume tells you.</p>' +
              '<div class="note note-trade"><b>What volume cannot do</b>It cannot tell you direction — a huge down bar and a huge up bar have identical volume. Use it to filter signals you already have, never to generate them.</div>' }
    ],
    parsons: {
      prompt: 'Accumulate on-balance volume.',
      lines: [
        'let total = 0;',
        'const out = bars.map((b, i) => {',
        '  if (i > 0 && b.close > bars[i - 1].close) total += b.volume;',
        '  else if (i > 0 && b.close < bars[i - 1].close) total -= b.volume;',
        '  return total;',
        '});'
      ]
    },
    exercises: [
      { id: 'e1', title: 'relativeVolume()', difficulty: 'Core',
        prompt: 'Write <code>relativeVolume(volumes, n)</code> returning this bar\'s volume divided by the average of the <strong>previous</strong> <code>n</code> bars.<br>' +
          '<code>null</code> for the first <code>n</code> bars, and <code>null</code> if the baseline average is 0.',
        starter: 'function relativeVolume(volumes, n) {\n  // volume vs the prior n-bar average\n}\n',
        solution: 'function relativeVolume(volumes, n) {\n  return volumes.map((v, i) => {\n    if (i < n) return null;\n    const avg = volumes.slice(i - n, i).reduce((a, b) => a + b, 0) / n;\n    return avg === 0 ? null : v / avg;\n  });\n}',
        hints: ['The baseline window is <code>slice(i - n, i)</code> — it stops <em>before</em> the current bar.',
                'The warm-up is <code>i &lt; n</code>, not <code>i &lt; n - 1</code>, because the current bar is excluded.'],
        tests: { fn: 'relativeVolume', approx: 1e-9, cases: [
          { args: [[100, 100, 100, 200], 3], expect: [null, null, null, 2] },
          { args: [[100, 100, 100, 50], 3], expect: [null, null, null, 0.5] },
          { args: [[0, 0, 0, 100], 3], expect: [null, null, null, null], name: 'a zero baseline gives null' },
          { args: [[1, 2], 5], expect: [null, null] },
          { args: [[], 3], expect: [] }
        ], checks: [{
          name: 'the current bar is excluded from its own baseline', expose: ['relativeVolume'],
          run: function (s) {
            var out = s.relativeVolume([10, 10, 10, 1000], 3);
            return Math.abs(out[3] - 100) < 1e-9
              ? true : 'expected 100 (1000 / 10), got ' + out[3] + ' — the baseline is including the spike itself';
          }
        }] } },
      { id: 'e2', title: 'obv()', difficulty: 'Core',
        prompt: 'Write <code>obv(bars)</code> returning the running on-balance volume, one value per bar.<br>' +
          'The first bar contributes nothing (there is no previous close), so it is <code>0</code>. Unchanged closes leave the total alone.',
        starter: 'function obv(bars) {\n  // running on-balance volume\n}\n',
        solution: 'function obv(bars) {\n  let total = 0;\n  return bars.map((b, i) => {\n    if (i > 0) {\n      if (b.close > bars[i - 1].close) total += b.volume;\n      else if (b.close < bars[i - 1].close) total -= b.volume;\n    }\n    return total;\n  });\n}',
        hints: ['Keep the running total outside the map.',
                'Compare with <code>bars[i - 1].close</code>; an equal close changes nothing.'],
        tests: { fn: 'obv', cases: [
          { args: [[{ close: 10, volume: 100 }]], expect: [0], name: 'the first bar contributes nothing' },
          { args: [[{ close: 10, volume: 100 }, { close: 11, volume: 50 }]], expect: [0, 50] },
          { args: [[{ close: 10, volume: 100 }, { close: 9, volume: 50 }]], expect: [0, -50] },
          { args: [[{ close: 10, volume: 100 }, { close: 10, volume: 50 }]], expect: [0, 0],
            name: 'an unchanged close leaves OBV alone' },
          { args: [[{ close: 10, volume: 10 }, { close: 11, volume: 20 }, { close: 10, volume: 5 }]],
            expect: [0, 20, 15] },
          { args: [[]], expect: [] }
        ] } },
      { id: 'e3', title: 'volumeConfirmation()', difficulty: 'Stretch',
        prompt: 'Write <code>volumeConfirmation(bars, { lookback, spikeMultiple })</code> returning an array the same length as <code>bars</code>, each entry <code>{ relative, spike, direction, confirmed }</code> or <code>null</code> during the warm-up:<ul>' +
          '<li><code>relative</code> — relative volume against the prior <code>lookback</code> bars</li>' +
          '<li><code>spike</code> — whether <code>relative &gt;= spikeMultiple</code></li>' +
          '<li><code>direction</code> — <code>"up"</code>, <code>"down"</code> or <code>"flat"</code> from this close versus the previous one</li>' +
          '<li><code>confirmed</code> — <code>true</code> only when there is a spike <em>and</em> the direction is not flat</li></ul>',
        starter: 'function volumeConfirmation(bars, { lookback, spikeMultiple }) {\n  // { relative, spike, direction, confirmed } per bar\n}\n',
        solution: 'function volumeConfirmation(bars, { lookback, spikeMultiple }) {\n  return bars.map((b, i) => {\n    if (i < lookback) return null;\n    const prior = bars.slice(i - lookback, i);\n    const avg = prior.reduce((a, x) => a + x.volume, 0) / lookback;\n    if (avg === 0) return null;\n    const relative = b.volume / avg;\n    const prevClose = bars[i - 1].close;\n    const direction = b.close > prevClose ? "up" : b.close < prevClose ? "down" : "flat";\n    const spike = relative >= spikeMultiple;\n    return { relative, spike, direction, confirmed: spike && direction !== "flat" };\n  });\n}',
        hints: ['The baseline again excludes the current bar.',
                'Direction comes from comparing closes, not from the volume.',
                'Confirmation needs both conditions — a huge bar that closed unchanged confirms nothing.'],
        tests: { fn: 'volumeConfirmation', approx: 1e-9, cases: [
          { args: [[{ close: 10, volume: 100 }, { close: 10, volume: 100 }, { close: 12, volume: 300 }],
                   { lookback: 2, spikeMultiple: 2 }],
            check: function (out) {
              if (out[0] !== null || out[1] !== null) return 'the warm-up must be null';
              var r = out[2];
              if (Math.abs(r.relative - 3) > 1e-9) return 'relative should be 3, got ' + r.relative;
              if (r.spike !== true) return 'a 3x bar should be a spike';
              if (r.direction !== 'up') return 'direction should be up, got ' + r.direction;
              return r.confirmed === true ? true : 'an up bar on a spike should be confirmed';
            }, name: 'a spike on an up bar is confirmed' },
          { args: [[{ close: 10, volume: 100 }, { close: 10, volume: 100 }, { close: 10, volume: 300 }],
                   { lookback: 2, spikeMultiple: 2 }],
            check: function (out) {
              var r = out[2];
              if (r.direction !== 'flat') return 'direction should be flat, got ' + r.direction;
              return r.confirmed === false ? true : 'a flat close cannot be confirmed however heavy the volume';
            }, name: 'a flat close is never confirmed' },
          { args: [[{ close: 10, volume: 100 }, { close: 10, volume: 100 }, { close: 12, volume: 100 }],
                   { lookback: 2, spikeMultiple: 2 }],
            check: function (out) {
              var r = out[2];
              if (r.spike !== false) return 'normal volume is not a spike';
              return r.confirmed === false ? true : 'no spike means no confirmation';
            }, name: 'a move on normal volume is unconfirmed' },
          { args: [[], { lookback: 20, spikeMultiple: 2 }], expect: [] }
        ], checks: [{
          name: 'works on the real session without NaN', expose: ['volumeConfirmation'],
          run: function (s) {
            var out = s.volumeConfirmation(MARKET.bars, { lookback: 20, spikeMultiple: 1.5 });
            if (out.length !== MARKET.bars.length) return 'the output must match the input length';
            for (var i = 0; i < out.length; i++) {
              if (out[i] === null) continue;
              if (!Number.isFinite(out[i].relative)) return 'index ' + i + ' produced a non-finite relative volume';
              if (['up', 'down', 'flat'].indexOf(out[i].direction) < 0) return 'index ' + i + ' has a bad direction';
            }
            return true;
          }
        }] } }
    ],
    quiz: [
      { q: 'Why compare volume to a baseline rather than using it raw?',
        options: ['Raw volume is inaccurate', 'What counts as heavy depends entirely on the time of day and the instrument', 'To bound it 0-100', 'It is faster'],
        answer: 1,
        explain: 'Twenty thousand contracts is enormous overnight and unremarkable at the open. Only the ratio is comparable.' },
      { q: 'Why must the baseline exclude the current bar?',
        options: ['Performance', 'A huge bar would inflate its own baseline and understate its own spike', 'To avoid nulls', 'It should include it'],
        answer: 1,
        explain: 'Self-reference dampens exactly the signal you are trying to detect.' },
      { q: 'What does On-Balance Volume tell you?',
        options: ['The exact accumulated position', 'Whether volume is arriving on up bars or down bars', 'Future direction', 'The spread'],
        answer: 1,
        explain: 'Its absolute value is arbitrary — only its direction carries information.' }
    ],
    recap: [
      'Volume only means something relative to a baseline.',
      'The baseline must exclude the bar being measured.',
      'OBV accumulates volume signed by the close-to-close direction.',
      'Volume confirms a move; it never predicts one.'
    ],
    vocab: [
      { term: 'Relative volume', def: 'Current volume divided by the recent average. Above 2 usually means something is happening.' },
      { term: 'OBV', def: 'On-Balance Volume — a running signed total of volume. Direction matters, magnitude does not.' }
    ]
  });

  C.push({
    id: 'd068', day: 68, module: 5, minutes: 30,
    title: 'Pivots, Swings and Levels',
    subtitle: 'Finding the highs and lows that matter — without peeking.',
    goal: '<b>Goal:</b> detect swing points and build support and resistance levels, while being honest about confirmation lag.',
    objectives: [
      'Detect a swing high or low with a symmetric window',
      'Understand why swing detection is inherently delayed',
      'Compute classic floor-trader pivots',
      'Cluster nearby levels into zones'
    ],
    sections: [
      { h: 'A swing high needs bars on both sides',
        body: '<p>A bar is a swing high with strength <em>k</em> if its high exceeds the highs of the <em>k</em> bars before <em>and</em> the <em>k</em> bars after it.</p>' +
              '<div class="note note-warn"><b>The confirmation lag is real, not a bug</b>You cannot know bar <em>i</em> is a swing high until bar <em>i+k</em> has closed. Marking it at bar <em>i</em> in a backtest is look-ahead bias — the single most common way a swing-based strategy fakes profitability.</div>',
        code: 'function swingHighs(bars, k) {\n  const out = [];\n  for (let i = k; i < bars.length - k; i++) {\n    let isHigh = true;\n    for (let j = i - k; j <= i + k; j++) {\n      if (j !== i && bars[j].high >= bars[i].high) { isHigh = false; break; }\n    }\n    if (isHigh) out.push({ index: i, price: bars[i].high, confirmedAt: i + k });\n  }\n  return out;\n}\n\nconst sh = swingHighs(MARKET.bars, 3);\nconsole.log(sh.length, "swing highs with strength 3");\nconsole.log(sh.slice(0, 3));' },
      { h: 'Floor-trader pivots',
        body: '<p>Computed once from the <em>previous</em> session\'s high, low and close, and used as levels for the whole of the next one. Because they depend only on completed data, there is no look-ahead risk at all.</p>' +
              '<p class="mono" style="color:var(--fg)">P = (H + L + C) / 3<br>' +
              'R1 = 2P − L&nbsp;&nbsp;&nbsp;S1 = 2P − H<br>' +
              'R2 = P + (H − L)&nbsp;&nbsp;&nbsp;S2 = P − (H − L)</p>',
        code: 'function pivots(prev) {\n  const p = (prev.high + prev.low + prev.close) / 3;\n  const range = prev.high - prev.low;\n  return {\n    p,\n    r1: 2 * p - prev.low, s1: 2 * p - prev.high,\n    r2: p + range, s2: p - range\n  };\n}\n\nconst prevSession = {\n  high: Math.max(...MARKET.highs),\n  low: Math.min(...MARKET.lows),\n  close: MARKET.closes.at(-1)\n};\nconst lv = pivots(prevSession);\nObject.entries(lv).forEach(([k, v]) => console.log(k.toUpperCase().padEnd(3), v.toFixed(2)));' },
      { h: 'Clustering levels into zones',
        body: '<p>Support is rarely one price. Several swing lows within a few ticks are one zone, and treating them as three separate levels produces three separate signals for one event.</p>',
        code: 'function cluster(levels, tolerance) {\n  const sorted = [...levels].sort((a, b) => a - b);\n  const zones = [];\n  for (const v of sorted) {\n    const last = zones[zones.length - 1];\n    if (last && v - last.max <= tolerance) {\n      last.max = v; last.members.push(v);\n    } else {\n      zones.push({ min: v, max: v, members: [v] });\n    }\n  }\n  return zones.map(z => ({\n    price: z.members.reduce((a, b) => a + b, 0) / z.members.length,\n    touches: z.members.length\n  }));\n}\n\nconsole.log(cluster([5200, 5200.5, 5201, 5240, 5241], 1));' },
      { h: 'Why levels work at all',
        body: '<p>Not magic — memory. Resting orders accumulate at round numbers and prior extremes, and traders who were wrong at a level want out at break-even when price returns. The level matters because participants remember it, which is also why an untested level is weaker than one that has already held.</p>' }
    ],
    parsons: {
      prompt: 'Test whether bar i is a swing high with strength k.',
      lines: [
        'let isHigh = true;',
        'for (let j = i - k; j <= i + k; j++) {',
        '  if (j !== i && bars[j].high >= bars[i].high) { isHigh = false; break; }',
        '}',
        'console.log(isHigh);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'swingHighs() and swingLows()', difficulty: 'Core',
        prompt: 'Write <code>swingHighs(bars, k)</code> and <code>swingLows(bars, k)</code> returning arrays of <code>{ index, price, confirmedAt }</code>.<ul>' +
          '<li>A swing high\'s <code>high</code> must be strictly greater than every high within <code>k</code> bars either side.</li>' +
          '<li>A swing low\'s <code>low</code> must be strictly less than every low within <code>k</code> bars either side.</li>' +
          '<li><code>confirmedAt</code> is <code>index + k</code> — the bar at which it could first be known.</li>' +
          '<li>Bars without <code>k</code> neighbours on both sides can never qualify.</li></ul>',
        expose: ['swingHighs', 'swingLows'],
        starter: 'function swingHighs(bars, k) {\n  // [{ index, price, confirmedAt }]\n}\n\nfunction swingLows(bars, k) {\n  // [{ index, price, confirmedAt }]\n}\n',
        solution: 'function swingHighs(bars, k) {\n  const out = [];\n  for (let i = k; i < bars.length - k; i++) {\n    let ok = true;\n    for (let j = i - k; j <= i + k; j++) {\n      if (j !== i && bars[j].high >= bars[i].high) { ok = false; break; }\n    }\n    if (ok) out.push({ index: i, price: bars[i].high, confirmedAt: i + k });\n  }\n  return out;\n}\n\nfunction swingLows(bars, k) {\n  const out = [];\n  for (let i = k; i < bars.length - k; i++) {\n    let ok = true;\n    for (let j = i - k; j <= i + k; j++) {\n      if (j !== i && bars[j].low <= bars[i].low) { ok = false; break; }\n    }\n    if (ok) out.push({ index: i, price: bars[i].low, confirmedAt: i + k });\n  }\n  return out;\n}',
        hints: ['Loop from <code>k</code> to <code>bars.length - k - 1</code> so both sides exist.',
                'Compare against every neighbour, skipping the bar itself.',
                'Using <code>&gt;=</code> in the rejection test means ties disqualify — a plateau has no single swing high.'],
        tests: { checks: [
          { name: 'finds a clear swing high', expose: ['swingHighs'],
            run: function (s, h) {
              var bars = [1, 2, 5, 2, 1].map(function (v) { return { high: v, low: v }; });
              var out = s.swingHighs(bars, 2);
              return h.eq(out, [{ index: 2, price: 5, confirmedAt: 4 }]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'finds a clear swing low', expose: ['swingLows'],
            run: function (s, h) {
              var bars = [5, 4, 1, 4, 5].map(function (v) { return { high: v, low: v }; });
              var out = s.swingLows(bars, 2);
              return h.eq(out, [{ index: 2, price: 1, confirmedAt: 4 }]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'edge bars can never qualify', expose: ['swingHighs'],
            run: function (s) {
              var bars = [9, 1, 1, 1, 9].map(function (v) { return { high: v, low: v }; });
              var out = s.swingHighs(bars, 2);
              return out.length === 0 ? true : 'a bar without k neighbours on both sides should not qualify';
            } },
          { name: 'a plateau produces no swing high', expose: ['swingHighs'],
            run: function (s) {
              var bars = [1, 5, 5, 5, 1].map(function (v) { return { high: v, low: v }; });
              var out = s.swingHighs(bars, 1);
              return out.length === 0 ? true : 'equal neighbours should disqualify, got ' + JSON.stringify(out);
            } },
          { name: 'confirmedAt is always k bars later', expose: ['swingHighs'],
            run: function (s) {
              var out = s.swingHighs(MARKET.bars, 3);
              for (var i = 0; i < out.length; i++) {
                if (out[i].confirmedAt !== out[i].index + 3) return 'confirmedAt is wrong at index ' + out[i].index;
              }
              return true;
            } }
        ] } },
      { id: 'e2', title: 'pivots()', difficulty: 'Core',
        prompt: 'Write <code>pivots(prevSession)</code> taking <code>{ high, low, close }</code> and returning <code>{ p, r1, r2, s1, s2 }</code> using the classic floor-trader formulas.',
        starter: 'function pivots(prevSession) {\n  // { p, r1, r2, s1, s2 }\n}\n',
        solution: 'function pivots(prevSession) {\n  const { high, low, close } = prevSession;\n  const p = (high + low + close) / 3;\n  const range = high - low;\n  return { p, r1: 2 * p - low, r2: p + range, s1: 2 * p - high, s2: p - range };\n}',
        hints: ['The pivot is the typical price of the previous session.',
                'R1 and S1 reflect the pivot around the low and high respectively.'],
        tests: { fn: 'pivots', approx: 1e-9, cases: [
          { args: [{ high: 110, low: 90, close: 100 }],
            expect: { p: 100, r1: 110, r2: 120, s1: 90, s2: 80 } },
          { args: [{ high: 100, low: 100, close: 100 }],
            expect: { p: 100, r1: 100, r2: 100, s1: 100, s2: 100 },
            name: 'a zero-range session collapses every level onto the pivot' }
        ], checks: [{
          name: 'the levels are correctly ordered', expose: ['pivots'],
          run: function (s) {
            var lv = s.pivots({ high: Math.max.apply(null, MARKET.highs),
                                low: Math.min.apply(null, MARKET.lows),
                                close: MARKET.closes[MARKET.closes.length - 1] });
            return (lv.s2 <= lv.s1 && lv.s1 <= lv.p && lv.p <= lv.r1 && lv.r1 <= lv.r2)
              ? true : 'expected s2 <= s1 <= p <= r1 <= r2, got ' + JSON.stringify(lv);
          }
        }] } },
      { id: 'e3', title: 'clusterLevels()', difficulty: 'Stretch',
        prompt: 'Write <code>clusterLevels(prices, tolerance)</code> grouping nearby prices into zones.<br>' +
          'Sort ascending, then start a new zone whenever the next price is more than <code>tolerance</code> above the highest price already in the current zone.<br>' +
          'Return <code>{ price, touches, low, high }</code> per zone — <code>price</code> being the mean of its members — sorted by <code>touches</code> descending, then by <code>price</code> ascending.',
        starter: 'function clusterLevels(prices, tolerance) {\n  // group nearby prices into zones\n}\n',
        solution: 'function clusterLevels(prices, tolerance) {\n  const sorted = [...prices].sort((a, b) => a - b);\n  const zones = [];\n  for (const v of sorted) {\n    const last = zones[zones.length - 1];\n    if (last && v - last[last.length - 1] <= tolerance) last.push(v);\n    else zones.push([v]);\n  }\n  return zones\n    .map(z => ({\n      price: z.reduce((a, b) => a + b, 0) / z.length,\n      touches: z.length,\n      low: z[0],\n      high: z[z.length - 1]\n    }))\n    .sort((a, b) => (b.touches - a.touches) || (a.price - b.price));\n}',
        hints: ['Sort a copy first — never reorder the caller\'s array.',
                'Compare each price against the last member of the current zone, not against its mean.',
                'The final sort chains two comparisons with <code>||</code>.'],
        tests: { fn: 'clusterLevels', approx: 1e-9, cases: [
          { args: [[5200, 5200.5, 5201, 5240, 5241], 1],
            expect: [
              { price: 5200.5, touches: 3, low: 5200, high: 5201 },
              { price: 5240.5, touches: 2, low: 5240, high: 5241 }
            ] },
          { args: [[100], 5], expect: [{ price: 100, touches: 1, low: 100, high: 100 }] },
          { args: [[], 1], expect: [] },
          { args: [[10, 30, 20], 0],
            expect: [
              { price: 10, touches: 1, low: 10, high: 10 },
              { price: 20, touches: 1, low: 20, high: 20 },
              { price: 30, touches: 1, low: 30, high: 30 }
            ], name: 'a zero tolerance keeps distinct prices apart and sorts them' }
        ], checks: [{
          name: 'does not reorder the input array', expose: ['clusterLevels'],
          run: function (s) {
            var input = [30, 10, 20];
            s.clusterLevels(input, 1);
            return (input[0] === 30 && input[1] === 10) ? true : 'the input array was sorted in place';
          }
        }] } }
    ],
    quiz: [
      { q: 'Why can a swing high with strength 3 not be marked on the bar itself?',
        options: ['Performance', 'It needs the next 3 bars to confirm, so marking it earlier is look-ahead bias', 'It needs volume', 'It can be'],
        answer: 1,
        explain: 'The confirmation lag is inherent. Backtests that ignore it show profits no live system can reproduce.' },
      { q: 'What data do floor-trader pivots use?',
        options: ['The current session so far', 'The previous session\'s high, low and close', 'A moving average', 'Volume'],
        answer: 1,
        explain: 'Entirely completed data, which is exactly why they carry no look-ahead risk.' },
      { q: 'Why cluster nearby levels into a zone?',
        options: ['To save memory', 'Several touches within a few ticks are one level, not several', 'To smooth the chart', 'No reason'],
        answer: 1,
        explain: 'Treating them separately generates several signals for a single event and overstates how many setups a strategy found.' }
    ],
    recap: [
      'A swing point needs k bars on both sides — and is only known k bars later.',
      'Ignoring that lag is look-ahead bias.',
      'Pivots use only the previous session, so they are safe by construction.',
      'Cluster nearby levels into zones before acting on them.'
    ],
    vocab: [
      { term: 'Swing high/low', def: 'A local extreme with lower highs (or higher lows) on both sides. The building block of trend structure.' },
      { term: 'Pivot points', def: 'Levels derived from the previous session\'s range, widely watched precisely because they are widely watched.' }
    ]
  });


  C.push({
    id: 'd069', day: 69, module: 5, minutes: 30,
    title: 'Divergence',
    subtitle: 'When price and momentum disagree — and how easy it is to fool yourself.',
    goal: '<b>Goal:</b> detect divergence between price swings and an oscillator, honestly, without peeking at future bars.',
    objectives: [
      'Define regular bullish and bearish divergence precisely',
      'Compare consecutive swing points on two series',
      'Respect the swing confirmation lag',
      'Explain why divergence has a poor standalone record'
    ],
    sections: [
      { h: 'The definitions',
        body: '<table><tr><th>Type</th><th>Price</th><th>Oscillator</th><th>Read as</th></tr>' +
              '<tr><td>Bearish</td><td>higher high</td><td>lower high</td><td>the rally is losing force</td></tr>' +
              '<tr><td>Bullish</td><td>lower low</td><td>higher low</td><td>the decline is losing force</td></tr></table>' +
              '<p>Both compare <em>two consecutive swing points</em> on each series. Nothing about divergence involves the bars in between.</p>' },
      { h: 'Comparing the last two swings',
        body: '<p>Take the two most recent confirmed swing highs. If price made a higher high while the oscillator made a lower high, that is bearish divergence.</p>',
        code: 'function bearishDivergence(swingHighs, price, osc) {\n  if (swingHighs.length < 2) return null;\n  const [a, b] = swingHighs.slice(-2);         // a is older\n  const priceUp = price[b.index] > price[a.index];\n  const oscDown = osc[b.index] < osc[a.index];\n  return priceUp && oscDown ? { from: a.index, to: b.index } : null;\n}\n\nconsole.log(bearishDivergence(\n  [{ index: 10 }, { index: 20 }],\n  { 10: 100, 20: 110 },\n  { 10: 80, 20: 65 }\n));' },
      { h: 'The lag applies here too',
        body: '<div class="note note-warn"><b>Two lags, stacked</b>The second swing is only confirmed <em>k</em> bars after it happened, so the divergence itself is only knowable at that point. A backtest that flags divergence at the swing bar is reading the future twice over — once for the swing and once for the signal.</div>' +
              '<p>Report divergence at <code>max(confirmedAt)</code> of the two swings, and enter no earlier.</p>' },
      { h: 'Why the standalone record is poor',
        body: '<p>Divergence is a statement about deceleration, and a trend can decelerate for a long time before it reverses — or simply resume. Momentum peaking early in a strong move is normal, not a warning.</p>' +
              '<div class="note note-trade"><b>How practitioners actually use it</b>As a <em>filter</em> on a signal that already exists, not as an entry. "Take the short only if there is also bearish divergence" is defensible. "Short because there is divergence" is how people spend a bull market getting run over.</div>' }
    ],
    parsons: {
      prompt: 'Detect bearish divergence between the last two swing highs.',
      lines: [
        'const [a, b] = swingHighs.slice(-2);',
        'const priceHigher = price[b.index] > price[a.index];',
        'const oscLower = osc[b.index] < osc[a.index];',
        'const bearish = priceHigher && oscLower;',
        'console.log(bearish);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'compareSwings()', difficulty: 'Core',
        prompt: 'Write <code>compareSwings(indexes, price, osc)</code> where <code>indexes</code> is an array of swing bar indexes, oldest first.<br>' +
          'Using the last two, return <code>{ priceDirection, oscDirection }</code>, each <code>"up"</code>, <code>"down"</code> or <code>"flat"</code>, comparing the newer swing with the older one.<br>' +
          'With fewer than two swings, return <code>null</code>.',
        starter: 'function compareSwings(indexes, price, osc) {\n  // { priceDirection, oscDirection } or null\n}\n',
        solution: 'function compareSwings(indexes, price, osc) {\n  if (indexes.length < 2) return null;\n  const a = indexes[indexes.length - 2];\n  const b = indexes[indexes.length - 1];\n  const dir = (older, newer) => newer > older ? "up" : newer < older ? "down" : "flat";\n  return {\n    priceDirection: dir(price[a], price[b]),\n    oscDirection: dir(osc[a], osc[b])\n  };\n}',
        hints: ['The last two entries are at <code>length - 2</code> and <code>length - 1</code>.',
                'A small local helper avoids writing the same ternary twice.'],
        tests: { fn: 'compareSwings', cases: [
          { args: [[10, 20], { 10: 100, 20: 110 }, { 10: 80, 20: 65 }],
            expect: { priceDirection: 'up', oscDirection: 'down' } },
          { args: [[10, 20], { 10: 110, 20: 100 }, { 10: 65, 20: 80 }],
            expect: { priceDirection: 'down', oscDirection: 'up' } },
          { args: [[10, 20], { 10: 100, 20: 100 }, { 10: 50, 20: 50 }],
            expect: { priceDirection: 'flat', oscDirection: 'flat' } },
          { args: [[5, 10, 20], { 5: 1, 10: 100, 20: 110 }, { 5: 1, 10: 80, 20: 65 }],
            expect: { priceDirection: 'up', oscDirection: 'down' },
            name: 'only the last two swings are compared' },
          { args: [[10], { 10: 100 }, { 10: 80 }], expect: null, name: 'one swing is not enough' },
          { args: [[], {}, {}], expect: null }
        ] } },
      { id: 'e2', title: 'findDivergence()', difficulty: 'Core',
        prompt: 'Write <code>findDivergence(swings, price, osc, type)</code> where <code>swings</code> is an array of <code>{ index, confirmedAt }</code>, oldest first, and <code>type</code> is <code>"bearish"</code> or <code>"bullish"</code>.<ul>' +
          '<li>Bearish needs price higher and the oscillator lower at the newer swing.</li>' +
          '<li>Bullish needs price lower and the oscillator higher.</li></ul>' +
          'Return <code>{ from, to, signalAt }</code> where <code>signalAt</code> is the later of the two <code>confirmedAt</code> values, or <code>null</code> when there is no divergence.',
        starter: 'function findDivergence(swings, price, osc, type) {\n  // { from, to, signalAt } or null\n}\n',
        solution: 'function findDivergence(swings, price, osc, type) {\n  if (swings.length < 2) return null;\n  const a = swings[swings.length - 2];\n  const b = swings[swings.length - 1];\n  const priceUp = price[b.index] > price[a.index];\n  const priceDown = price[b.index] < price[a.index];\n  const oscUp = osc[b.index] > osc[a.index];\n  const oscDown = osc[b.index] < osc[a.index];\n  const match = type === "bearish" ? (priceUp && oscDown) : (priceDown && oscUp);\n  if (!match) return null;\n  return { from: a.index, to: b.index, signalAt: Math.max(a.confirmedAt, b.confirmedAt) };\n}',
        hints: ['Compute the four booleans once, then pick the pair the type needs.',
                '<code>signalAt</code> is <code>Math.max</code> of the two confirmation bars — you cannot know before both.'],
        tests: { fn: 'findDivergence', cases: [
          { args: [[{ index: 10, confirmedAt: 13 }, { index: 20, confirmedAt: 23 }],
                   { 10: 100, 20: 110 }, { 10: 80, 20: 65 }, 'bearish'],
            expect: { from: 10, to: 20, signalAt: 23 } },
          { args: [[{ index: 10, confirmedAt: 13 }, { index: 20, confirmedAt: 23 }],
                   { 10: 110, 20: 100 }, { 10: 65, 20: 80 }, 'bullish'],
            expect: { from: 10, to: 20, signalAt: 23 } },
          { args: [[{ index: 10, confirmedAt: 13 }, { index: 20, confirmedAt: 23 }],
                   { 10: 100, 20: 110 }, { 10: 65, 20: 80 }, 'bearish'],
            expect: null, name: 'price and momentum agreeing is not divergence' },
          { args: [[{ index: 10, confirmedAt: 13 }, { index: 20, confirmedAt: 23 }],
                   { 10: 100, 20: 100 }, { 10: 80, 20: 65 }, 'bearish'],
            expect: null, name: 'an equal price high is not a higher high' },
          { args: [[{ index: 10, confirmedAt: 13 }], { 10: 100 }, { 10: 80 }, 'bearish'],
            expect: null, name: 'one swing is not enough' }
        ] } },
      { id: 'e3', title: 'divergenceScan()', difficulty: 'Stretch',
        prompt: 'Write <code>divergenceScan(bars, osc, k)</code> returning every bearish and bullish divergence in a series, as <code>{ type, from, to, signalAt }</code> sorted by <code>signalAt</code> ascending.<ol>' +
          '<li>Find swing highs and lows of strength <code>k</code> (strict on both sides, <code>confirmedAt = index + k</code>).</li>' +
          '<li>For each <em>consecutive pair</em> of swing highs, report <code>"bearish"</code> when price made a higher high and <code>osc</code> a lower one.</li>' +
          '<li>For each consecutive pair of swing lows, report <code>"bullish"</code> when price made a lower low and <code>osc</code> a higher one.</li></ol>' +
          '<span class="muted">Price for a high is <code>bars[i].high</code>; for a low it is <code>bars[i].low</code>. The oscillator is read at the same index. Skip any pair where either oscillator value is <code>null</code>.</span>',
        starter: 'function divergenceScan(bars, osc, k) {\n  // every divergence in the series\n}\n',
        solution: 'function divergenceScan(bars, osc, k) {\n  const highs = [], lows = [];\n  for (let i = k; i < bars.length - k; i++) {\n    let isH = true, isL = true;\n    for (let j = i - k; j <= i + k; j++) {\n      if (j === i) continue;\n      if (bars[j].high >= bars[i].high) isH = false;\n      if (bars[j].low <= bars[i].low) isL = false;\n    }\n    if (isH) highs.push(i);\n    if (isL) lows.push(i);\n  }\n  const out = [];\n  for (let n = 1; n < highs.length; n++) {\n    const a = highs[n - 1], b = highs[n];\n    if (osc[a] === null || osc[b] === null) continue;\n    if (bars[b].high > bars[a].high && osc[b] < osc[a]) {\n      out.push({ type: "bearish", from: a, to: b, signalAt: b + k });\n    }\n  }\n  for (let n = 1; n < lows.length; n++) {\n    const a = lows[n - 1], b = lows[n];\n    if (osc[a] === null || osc[b] === null) continue;\n    if (bars[b].low < bars[a].low && osc[b] > osc[a]) {\n      out.push({ type: "bullish", from: a, to: b, signalAt: b + k });\n    }\n  }\n  return out.sort((x, y) => x.signalAt - y.signalAt);\n}',
        hints: ['One pass can collect both swing highs and swing lows.',
                'Compare consecutive pairs, not just the last two — this is a full scan.',
                'Sort at the end so the two swing types interleave chronologically.'],
        tests: { fn: 'divergenceScan', cases: [
          { args: [[], [], 2], expect: [] },
          { args: [[{ high: 1, low: 1 }, { high: 2, low: 2 }], [1, 2], 2], expect: [],
            name: 'too few bars produce nothing' }
        ], checks: [
          { name: 'finds a constructed bearish divergence', expose: ['divergenceScan'],
            run: function (s) {
              // two swing highs: index 2 (high 10) then index 6 (high 12), oscillator falling
              var highs = [5, 8, 10, 8, 5, 9, 12, 9, 5];
              var bars = highs.map(function (v) { return { high: v, low: v }; });
              var osc = [50, 60, 80, 60, 50, 55, 65, 55, 50];
              var out = s.divergenceScan(bars, osc, 2);
              var bear = out.filter(function (d) { return d.type === 'bearish'; });
              if (!bear.length) return 'expected a bearish divergence, got ' + JSON.stringify(out);
              if (bear[0].from !== 2 || bear[0].to !== 6) return 'expected the pair 2 -> 6, got ' + JSON.stringify(bear[0]);
              return bear[0].signalAt === 8 ? true : 'signalAt should be 8 (6 + k), got ' + bear[0].signalAt;
            } },
          { name: 'finds a constructed bullish divergence', expose: ['divergenceScan'],
            run: function (s) {
              var lows = [12, 9, 5, 9, 12, 8, 3, 8, 12];
              var bars = lows.map(function (v) { return { high: v, low: v }; });
              var osc = [50, 40, 20, 40, 50, 45, 30, 45, 50];
              var out = s.divergenceScan(bars, osc, 2);
              var bull = out.filter(function (d) { return d.type === 'bullish'; });
              if (!bull.length) return 'expected a bullish divergence, got ' + JSON.stringify(out);
              return (bull[0].from === 2 && bull[0].to === 6) ? true : 'expected the pair 2 -> 6, got ' + JSON.stringify(bull[0]);
            } },
          { name: 'skips pairs with a null oscillator value', expose: ['divergenceScan'],
            run: function (s) {
              var highs = [5, 8, 10, 8, 5, 9, 12, 9, 5];
              var bars = highs.map(function (v) { return { high: v, low: v }; });
              var osc = [null, null, null, 60, 50, 55, 65, 55, 50];
              var out = s.divergenceScan(bars, osc, 2);
              return out.every(function (d) { return d.from !== 2; })
                ? true : 'a pair whose oscillator value is null should be skipped';
            } },
          { name: 'results are sorted by signalAt', expose: ['divergenceScan'],
            run: function (s) {
              var osc = MARKET.closes.map(function (c, i) { return i < 5 ? null : c; });
              var out = s.divergenceScan(MARKET.bars, osc, 2);
              for (var i = 1; i < out.length; i++) {
                if (out[i].signalAt < out[i - 1].signalAt) return 'the output is not sorted by signalAt';
              }
              return true;
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is bearish divergence?',
        options: ['Price and oscillator both falling', 'Price makes a higher high while the oscillator makes a lower high', 'The oscillator crosses zero', 'Volume falls'],
        answer: 1,
        explain: 'Price extends but momentum does not — the move is running on less force than the previous one.' },
      { q: 'When can a divergence between two swings first be acted on?',
        options: ['At the second swing bar', 'k bars after the second swing, once it is confirmed', 'At the first swing', 'Immediately'],
        answer: 1,
        explain: 'The second swing is not known to be a swing until k bars later. Anything earlier is look-ahead bias.' },
      { q: 'Why does divergence perform poorly as a standalone entry?',
        options: ['It is hard to compute', 'A trend can decelerate for a long time before reversing, or simply resume', 'The oscillator is unbounded', 'It only works on daily bars'],
        answer: 1,
        explain: 'It signals deceleration, not reversal. Used as a filter on an existing signal it is defensible; used alone it fights trends.' }
    ],
    recap: [
      'Divergence compares two consecutive swings on price and an oscillator.',
      'Bearish: higher price high, lower oscillator high. Bullish is the mirror.',
      'It is only knowable once the second swing is confirmed.',
      'Use it to filter a signal, not to generate one.'
    ],
    vocab: [
      { term: 'Divergence', def: 'Price and momentum disagreeing at consecutive swings. A deceleration signal, not a reversal signal.' },
      { term: 'Hidden divergence', def: 'The continuation variant: price makes a higher low while the oscillator makes a lower low, read as a trend resuming.' }
    ]
  });

  C.push({
    id: 'd070', day: 70, module: 5, minutes: 35, boss: true,
    title: 'Boss: The Filtered Signal System',
    subtitle: 'Momentum, trend, volatility and session — the full indicator stack.',
    goal: '<b>Goal:</b> reproduce the complete signal logic of the Pine indicator shipped in this repository, in JavaScript.',
    objectives: [
      'Compose four independent filters into one decision',
      'Keep every filter separately testable',
      'Produce entry, stop and target levels together',
      'Measure how much each filter removes'
    ],
    sections: [
      { h: 'What you are building',
        body: '<p>The <code>Momentum ROC Signal [ES/NQ 5m]</code> script in <code>indicators/</code> generates a long or short when <em>all</em> of these agree:</p>' +
              '<ol><li><strong>Momentum</strong> — smoothed ROC crosses beyond ±threshold</li>' +
              '<li><strong>Trend</strong> — price is on the correct side of a long EMA</li>' +
              '<li><strong>Volatility</strong> — ATR is at least a multiple of its own average</li>' +
              '<li><strong>Session</strong> — the bar is inside regular trading hours</li></ol>' +
              '<p>Then it attaches an ATR-based stop and target. You have built every piece; this level is the assembly.</p>' },
      { h: 'Filters are independent predicates',
        body: '<p>Each filter answers one question about one bar and knows nothing about the others. That is what lets you test them separately and measure what each one removes.</p>',
        code: 'const filters = {\n  trendUp: (close, ema) => ema !== null && close > ema,\n  volatilityOk: (atr, atrAvg, mult) => atr !== null && atrAvg !== null && atr >= atrAvg * mult,\n  inSession: (minute, from, to) => minute >= from && minute < to\n};\n\nconsole.log(filters.trendUp(5240, 5200));\nconsole.log(filters.volatilityOk(4.2, 5.0, 0.8));\nconsole.log(filters.inSession(900, 810, 1200));' },
      { h: 'Measure what each filter costs you',
        body: '<p>Counting how many raw signals each filter removes tells you whether it is earning its place. A filter that removes 2% of signals is decoration; one that removes 80% is doing the actual work — and needs to be justified.</p>' +
              '<div class="note note-warn"><b>Every filter is a parameter you can overfit</b>Four filters with two settings each is sixteen combinations. Try them all on one dataset and the best one is chosen by luck as much as by edge. Module 6 covers how to tell the difference.</div>' },
      { h: 'Levels come with the signal',
        body: '<p>Emit the entry, stop and target together with the signal. A signal without its levels is only half a decision, and computing them later means computing them from different data.</p>',
        code: 'function levels(side, entry, atr, stopMult, targetMult) {\n  const dir = side === "long" ? 1 : -1;\n  return {\n    entry,\n    stop: entry - dir * atr * stopMult,\n    target: entry + dir * atr * targetMult\n  };\n}\n\nconsole.log(levels("long", 5240, 4, 1.5, 3));\nconsole.log(levels("short", 5240, 4, 1.5, 3));' }
    ],
    parsons: {
      prompt: 'Gate a raw momentum signal through three filters.',
      lines: [
        'const raw = momentum[i];',
        'if (raw === null) return null;',
        'if (!trendOk(raw, close[i], ema[i])) return null;',
        'if (!volatilityOk(atr[i], atrAvg[i])) return null;',
        'if (!inSession(bars[i])) return null;',
        'return raw;'
      ]
    },
    exercises: [
      { id: 'e1', title: 'The four filters', difficulty: 'Boss · part 1',
        prompt: 'Write four predicates:<ul>' +
          '<li><code>momentumSignal(value, threshold)</code> — <code>"long"</code> above <code>+threshold</code>, <code>"short"</code> below <code>-threshold</code>, else <code>null</code>; <code>null</code> input gives <code>null</code></li>' +
          '<li><code>trendOk(side, close, ema)</code> — a long needs <code>close &gt; ema</code>, a short needs <code>close &lt; ema</code>; a <code>null</code> ema fails</li>' +
          '<li><code>volatilityOk(atr, atrAverage, multiplier)</code> — <code>atr &gt;= atrAverage × multiplier</code>; any <code>null</code> fails</li>' +
          '<li><code>inSession(minuteOfDay, startMinute, endMinute)</code> — start inclusive, end exclusive</li></ul>',
        expose: ['momentumSignal', 'trendOk', 'volatilityOk', 'inSession'],
        starter: 'function momentumSignal(value, threshold) {\n}\n\nfunction trendOk(side, close, ema) {\n}\n\nfunction volatilityOk(atr, atrAverage, multiplier) {\n}\n\nfunction inSession(minuteOfDay, startMinute, endMinute) {\n}\n',
        solution: 'function momentumSignal(value, threshold) {\n  if (value === null) return null;\n  if (value > threshold) return "long";\n  if (value < -threshold) return "short";\n  return null;\n}\n\nfunction trendOk(side, close, ema) {\n  if (ema === null) return false;\n  return side === "long" ? close > ema : close < ema;\n}\n\nfunction volatilityOk(atr, atrAverage, multiplier) {\n  if (atr === null || atrAverage === null) return false;\n  return atr >= atrAverage * multiplier;\n}\n\nfunction inSession(minuteOfDay, startMinute, endMinute) {\n  return minuteOfDay >= startMinute && minuteOfDay < endMinute;\n}',
        hints: ['Each is a few lines — guard the nulls first, then the comparison.',
                'A missing indicator value should fail the filter, never pass it by default.'],
        tests: { checks: [
          { name: 'momentumSignal respects the threshold band', expose: ['momentumSignal'],
            run: function (s) {
              if (s.momentumSignal(0.6, 0.1) !== 'long') return 'above +threshold should be long';
              if (s.momentumSignal(-0.9, 0.1) !== 'short') return 'below -threshold should be short';
              if (s.momentumSignal(0.05, 0.1) !== null) return 'inside the band should be null';
              if (s.momentumSignal(0.1, 0.1) !== null) return 'exactly at the threshold should be null';
              return s.momentumSignal(null, 0.1) === null ? true : 'a null value should give null';
            } },
          { name: 'trendOk gates each side correctly', expose: ['trendOk'],
            run: function (s) {
              if (s.trendOk('long', 5240, 5200) !== true) return 'a long above the EMA should pass';
              if (s.trendOk('long', 5180, 5200) !== false) return 'a long below the EMA should fail';
              if (s.trendOk('short', 5180, 5200) !== true) return 'a short below the EMA should pass';
              if (s.trendOk('short', 5240, 5200) !== false) return 'a short above the EMA should fail';
              return s.trendOk('long', 5240, null) === false ? true : 'a null EMA must fail';
            } },
          { name: 'volatilityOk compares against the scaled average', expose: ['volatilityOk'],
            run: function (s) {
              if (s.volatilityOk(4.2, 5, 0.8) !== true) return '4.2 >= 4.0 should pass';
              if (s.volatilityOk(3.5, 5, 0.8) !== false) return '3.5 < 4.0 should fail';
              if (s.volatilityOk(4, 5, 0.8) !== true) return 'exactly at the threshold should pass';
              return (s.volatilityOk(null, 5, 0.8) === false && s.volatilityOk(4, null, 0.8) === false)
                ? true : 'a null on either side must fail';
            } },
          { name: 'inSession is start-inclusive and end-exclusive', expose: ['inSession'],
            run: function (s) {
              if (s.inSession(810, 810, 1200) !== true) return 'the start minute is inside the session';
              if (s.inSession(1200, 810, 1200) !== false) return 'the end minute is outside the session';
              if (s.inSession(900, 810, 1200) !== true) return 'a mid-session minute should pass';
              return s.inSession(700, 810, 1200) === false ? true : 'a pre-session minute should fail';
            } }
        ] } },
      { id: 'e2', title: 'buildIndicators()', difficulty: 'Boss · part 2',
        prompt: 'Write <code>buildIndicators(bars, config)</code> with <code>config = { rocLength, smoothLength, trendLength, atrLength, atrBaseLength }</code>, returning <code>{ momentum, trendEma, atr, atrAverage }</code> — four arrays, each the same length as <code>bars</code>.<ul>' +
          '<li><code>momentum</code> — ROC of closes over <code>rocLength</code>, smoothed by an EMA of <code>smoothLength</code> (nulls preserved)</li>' +
          '<li><code>trendEma</code> — first-price-seeded EMA of closes over <code>trendLength</code></li>' +
          '<li><code>atr</code> — Wilder ATR over <code>atrLength</code></li>' +
          '<li><code>atrAverage</code> — a simple moving average of <code>atr</code> over <code>atrBaseLength</code>, <code>null</code> wherever the window contains a null</li></ul>',
        starter: 'function buildIndicators(bars, config) {\n  const { rocLength, smoothLength, trendLength, atrLength, atrBaseLength } = config;\n  // { momentum, trendEma, atr, atrAverage }\n}\n',
        solution: 'function buildIndicators(bars, config) {\n  const { rocLength, smoothLength, trendLength, atrLength, atrBaseLength } = config;\n  const closes = bars.map(b => b.close);\n\n  const roc = closes.map((p, i) => {\n    if (i < rocLength) return null;\n    const old = closes[i - rocLength];\n    return old === 0 ? null : (p - old) / old * 100;\n  });\n  const sa = 2 / (smoothLength + 1);\n  let sp = null;\n  const momentum = roc.map(v => {\n    if (v === null) return null;\n    sp = sp === null ? v : sa * v + (1 - sa) * sp;\n    return sp;\n  });\n\n  const ta = 2 / (trendLength + 1);\n  let tp = null;\n  const trendEma = closes.map(p => (tp = tp === null ? p : ta * p + (1 - ta) * tp));\n\n  const tr = bars.map((b, i) => {\n    if (i === 0) return b.high - b.low;\n    const prev = bars[i - 1].close;\n    return Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev));\n  });\n  const atr = new Array(bars.length).fill(null);\n  if (bars.length >= atrLength) {\n    let avg = tr.slice(0, atrLength).reduce((a, b) => a + b, 0) / atrLength;\n    atr[atrLength - 1] = avg;\n    for (let i = atrLength; i < tr.length; i++) {\n      avg = (avg * (atrLength - 1) + tr[i]) / atrLength;\n      atr[i] = avg;\n    }\n  }\n\n  const atrAverage = atr.map((_, i) => {\n    if (i < atrBaseLength - 1) return null;\n    const w = atr.slice(i - atrBaseLength + 1, i + 1);\n    if (w.some(v => v === null)) return null;\n    return w.reduce((a, b) => a + b, 0) / atrBaseLength;\n  });\n\n  return { momentum, trendEma, atr, atrAverage };\n}',
        hints: ['This is four pieces you have already written, stacked — take them one at a time.',
                'The smoothing must skip nulls without consuming them, exactly as on day 59.',
                'The ATR average is an ordinary SMA that refuses any window containing a null.'],
        tests: { checks: [
          { name: 'all four arrays match the bar count', expose: ['buildIndicators'],
            run: function (s) {
              var r = s.buildIndicators(MARKET.bars, { rocLength: 10, smoothLength: 5, trendLength: 200, atrLength: 14, atrBaseLength: 20 });
              var n = MARKET.bars.length;
              var names = ['momentum', 'trendEma', 'atr', 'atrAverage'];
              for (var i = 0; i < names.length; i++) {
                if (!Array.isArray(r[names[i]])) return names[i] + ' is missing';
                if (r[names[i]].length !== n) return names[i] + ' has length ' + r[names[i]].length + ', expected ' + n;
              }
              return true;
            } },
          { name: 'the trend EMA has no nulls and tracks price', expose: ['buildIndicators'],
            run: function (s) {
              var r = s.buildIndicators(MARKET.bars, { rocLength: 10, smoothLength: 5, trendLength: 20, atrLength: 14, atrBaseLength: 20 });
              if (r.trendEma.some(function (v) { return v === null; })) return 'a first-price-seeded EMA should have no nulls';
              var lo = Math.min.apply(null, MARKET.lows), hi = Math.max.apply(null, MARKET.highs);
              var last = r.trendEma[r.trendEma.length - 1];
              return (last >= lo && last <= hi) ? true : 'the EMA left the price range: ' + last;
            } },
          { name: 'ATR is defined from bar atrLength-1 onward', expose: ['buildIndicators'],
            run: function (s) {
              var r = s.buildIndicators(MARKET.bars, { rocLength: 10, smoothLength: 5, trendLength: 20, atrLength: 14, atrBaseLength: 20 });
              var first = r.atr.findIndex(function (v) { return v !== null; });
              if (first !== 13) return 'the first ATR value is at index ' + first + ', expected 13';
              return r.atr[r.atr.length - 1] > 0 ? true : 'the final ATR should be positive';
            } },
          { name: 'the ATR average lags the ATR', expose: ['buildIndicators'],
            run: function (s) {
              var r = s.buildIndicators(MARKET.bars, { rocLength: 10, smoothLength: 5, trendLength: 20, atrLength: 14, atrBaseLength: 20 });
              var fa = r.atr.findIndex(function (v) { return v !== null; });
              var fb = r.atrAverage.findIndex(function (v) { return v !== null; });
              return fb > fa ? true : 'the ATR average should become defined later than the ATR (' + fa + ' vs ' + fb + ')';
            } },
          { name: 'momentum preserves its warm-up nulls', expose: ['buildIndicators'],
            run: function (s) {
              var r = s.buildIndicators(MARKET.bars, { rocLength: 10, smoothLength: 5, trendLength: 20, atrLength: 14, atrBaseLength: 20 });
              for (var i = 0; i < 10; i++) if (r.momentum[i] !== null) return 'momentum should be null before bar ' + 10;
              return typeof r.momentum[r.momentum.length - 1] === 'number' ? true : 'the final momentum should be a number';
            } }
        ] } },
      { id: 'e3', title: 'generateSignals()', difficulty: 'Boss · final',
        prompt: 'Write <code>generateSignals(bars, config)</code> returning <code>{ signals, stats }</code>.<br>' +
          '<code>config</code> adds to part 2\'s fields: <code>{ threshold, volatilityMultiplier, sessionStart, sessionEnd, stopMultiplier, targetMultiplier, useTrend, useVolatility, useSession }</code>.<br>' +
          'For each bar, in this order:<ol>' +
          '<li>Raw momentum signal from the smoothed value and <code>threshold</code>. No signal → <code>null</code> entry.</li>' +
          '<li>If <code>useTrend</code>, drop it unless price is on the right side of <code>trendEma</code>.</li>' +
          '<li>If <code>useVolatility</code>, drop it unless ATR ≥ average × multiplier.</li>' +
          '<li>If <code>useSession</code>, drop it unless the bar\'s UTC minute-of-day is in <code>[sessionStart, sessionEnd)</code>.</li>' +
          '<li>Survivors become <code>{ side, entry, stop, target }</code> with entry at the close and ATR-scaled levels.</li></ol>' +
          '<code>stats</code> counts <code>{ raw, afterTrend, afterVolatility, afterSession }</code> — how many signals remained after each stage.<br>' +
          '<span class="muted">The four filters and <code>buildIndicators</code> are supplied in the starter.</span>',
        starter: 'function buildIndicators(bars, config) {\n  const { rocLength, smoothLength, trendLength, atrLength, atrBaseLength } = config;\n  const closes = bars.map(b => b.close);\n  const roc = closes.map((p, i) => {\n    if (i < rocLength) return null;\n    const old = closes[i - rocLength];\n    return old === 0 ? null : (p - old) / old * 100;\n  });\n  const sa = 2 / (smoothLength + 1);\n  let sp = null;\n  const momentum = roc.map(v => {\n    if (v === null) return null;\n    sp = sp === null ? v : sa * v + (1 - sa) * sp;\n    return sp;\n  });\n  const ta = 2 / (trendLength + 1);\n  let tp = null;\n  const trendEma = closes.map(p => (tp = tp === null ? p : ta * p + (1 - ta) * tp));\n  const tr = bars.map((b, i) => {\n    if (i === 0) return b.high - b.low;\n    const prev = bars[i - 1].close;\n    return Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev));\n  });\n  const atr = new Array(bars.length).fill(null);\n  if (bars.length >= atrLength) {\n    let avg = tr.slice(0, atrLength).reduce((a, b) => a + b, 0) / atrLength;\n    atr[atrLength - 1] = avg;\n    for (let i = atrLength; i < tr.length; i++) {\n      avg = (avg * (atrLength - 1) + tr[i]) / atrLength;\n      atr[i] = avg;\n    }\n  }\n  const atrAverage = atr.map((_, i) => {\n    if (i < atrBaseLength - 1) return null;\n    const w = atr.slice(i - atrBaseLength + 1, i + 1);\n    if (w.some(v => v === null)) return null;\n    return w.reduce((a, b) => a + b, 0) / atrBaseLength;\n  });\n  return { momentum, trendEma, atr, atrAverage };\n}\n\nconst momentumSignal = (v, t) => v === null ? null : v > t ? "long" : v < -t ? "short" : null;\nconst trendOk = (side, close, ema) => ema === null ? false : (side === "long" ? close > ema : close < ema);\nconst volatilityOk = (atr, avg, m) => (atr === null || avg === null) ? false : atr >= avg * m;\nconst inSession = (min, from, to) => min >= from && min < to;\nconst minuteOfDay = t => { const d = new Date(t); return d.getUTCHours() * 60 + d.getUTCMinutes(); };\n\nfunction generateSignals(bars, config) {\n  // { signals, stats }\n}\n',
        solution: 'function buildIndicators(bars, config) {\n  const { rocLength, smoothLength, trendLength, atrLength, atrBaseLength } = config;\n  const closes = bars.map(b => b.close);\n  const roc = closes.map((p, i) => {\n    if (i < rocLength) return null;\n    const old = closes[i - rocLength];\n    return old === 0 ? null : (p - old) / old * 100;\n  });\n  const sa = 2 / (smoothLength + 1);\n  let sp = null;\n  const momentum = roc.map(v => {\n    if (v === null) return null;\n    sp = sp === null ? v : sa * v + (1 - sa) * sp;\n    return sp;\n  });\n  const ta = 2 / (trendLength + 1);\n  let tp = null;\n  const trendEma = closes.map(p => (tp = tp === null ? p : ta * p + (1 - ta) * tp));\n  const tr = bars.map((b, i) => {\n    if (i === 0) return b.high - b.low;\n    const prev = bars[i - 1].close;\n    return Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev));\n  });\n  const atr = new Array(bars.length).fill(null);\n  if (bars.length >= atrLength) {\n    let avg = tr.slice(0, atrLength).reduce((a, b) => a + b, 0) / atrLength;\n    atr[atrLength - 1] = avg;\n    for (let i = atrLength; i < tr.length; i++) {\n      avg = (avg * (atrLength - 1) + tr[i]) / atrLength;\n      atr[i] = avg;\n    }\n  }\n  const atrAverage = atr.map((_, i) => {\n    if (i < atrBaseLength - 1) return null;\n    const w = atr.slice(i - atrBaseLength + 1, i + 1);\n    if (w.some(v => v === null)) return null;\n    return w.reduce((a, b) => a + b, 0) / atrBaseLength;\n  });\n  return { momentum, trendEma, atr, atrAverage };\n}\n\nconst momentumSignal = (v, t) => v === null ? null : v > t ? "long" : v < -t ? "short" : null;\nconst trendOk = (side, close, ema) => ema === null ? false : (side === "long" ? close > ema : close < ema);\nconst volatilityOk = (atr, avg, m) => (atr === null || avg === null) ? false : atr >= avg * m;\nconst inSession = (min, from, to) => min >= from && min < to;\nconst minuteOfDay = t => { const d = new Date(t); return d.getUTCHours() * 60 + d.getUTCMinutes(); };\n\nfunction generateSignals(bars, config) {\n  const ind = buildIndicators(bars, config);\n  const stats = { raw: 0, afterTrend: 0, afterVolatility: 0, afterSession: 0 };\n  const signals = bars.map((bar, i) => {\n    const side = momentumSignal(ind.momentum[i], config.threshold);\n    if (side === null) return null;\n    stats.raw++;\n\n    if (config.useTrend && !trendOk(side, bar.close, ind.trendEma[i])) return null;\n    stats.afterTrend++;\n\n    if (config.useVolatility && !volatilityOk(ind.atr[i], ind.atrAverage[i], config.volatilityMultiplier)) return null;\n    stats.afterVolatility++;\n\n    if (config.useSession && !inSession(minuteOfDay(bar.time), config.sessionStart, config.sessionEnd)) return null;\n    stats.afterSession++;\n\n    const atr = ind.atr[i];\n    const dir = side === "long" ? 1 : -1;\n    return {\n      side,\n      entry: bar.close,\n      stop: bar.close - dir * atr * config.stopMultiplier,\n      target: bar.close + dir * atr * config.targetMultiplier\n    };\n  });\n  return { signals, stats };\n}',
        hints: ['Build the indicators once, then walk the bars applying the filters in order.',
                'Increment each counter immediately after the corresponding filter passes, so the numbers describe the funnel.',
                'A disabled filter is skipped entirely — the count still advances.'],
        tests: { checks: [
          { name: 'returns a signals array matching the bar count', expose: ['generateSignals'],
            run: function (s) {
              var cfg = { rocLength: 10, smoothLength: 5, trendLength: 20, atrLength: 14, atrBaseLength: 20,
                threshold: 0.05, volatilityMultiplier: 0.8, sessionStart: 0, sessionEnd: 1440,
                stopMultiplier: 1.5, targetMultiplier: 3, useTrend: false, useVolatility: false, useSession: false };
              var r = s.generateSignals(MARKET.bars, cfg);
              return (Array.isArray(r.signals) && r.signals.length === MARKET.bars.length)
                ? true : 'signals must be one entry per bar';
            } },
          { name: 'signal entries carry side, entry, stop and target', expose: ['generateSignals'],
            run: function (s) {
              var cfg = { rocLength: 5, smoothLength: 3, trendLength: 10, atrLength: 5, atrBaseLength: 5,
                threshold: 0.01, volatilityMultiplier: 0, sessionStart: 0, sessionEnd: 1440,
                stopMultiplier: 1.5, targetMultiplier: 3, useTrend: false, useVolatility: false, useSession: false };
              var r = s.generateSignals(MARKET.bars, cfg);
              var hit = r.signals.find(function (v) { return v !== null; });
              if (!hit) return 'no signals were produced with a very loose threshold';
              if (['long', 'short'].indexOf(hit.side) < 0) return 'side must be long or short';
              for (var k of ['entry', 'stop', 'target']) {
                if (!Number.isFinite(hit[k])) return k + ' is not a finite number';
              }
              return true;
            } },
          { name: 'stop and target sit on the correct sides', expose: ['generateSignals'],
            run: function (s) {
              var cfg = { rocLength: 5, smoothLength: 3, trendLength: 10, atrLength: 5, atrBaseLength: 5,
                threshold: 0.01, volatilityMultiplier: 0, sessionStart: 0, sessionEnd: 1440,
                stopMultiplier: 1.5, targetMultiplier: 3, useTrend: false, useVolatility: false, useSession: false };
              var r = s.generateSignals(MARKET.bars, cfg);
              for (var i = 0; i < r.signals.length; i++) {
                var sg = r.signals[i];
                if (!sg) continue;
                if (sg.side === 'long' && !(sg.stop < sg.entry && sg.target > sg.entry)) return 'a long has its levels inverted';
                if (sg.side === 'short' && !(sg.stop > sg.entry && sg.target < sg.entry)) return 'a short has its levels inverted';
              }
              return true;
            } },
          { name: 'the stats form a non-increasing funnel', expose: ['generateSignals'],
            run: function (s) {
              var cfg = { rocLength: 10, smoothLength: 5, trendLength: 20, atrLength: 14, atrBaseLength: 20,
                threshold: 0.02, volatilityMultiplier: 0.9, sessionStart: 810, sessionEnd: 1200,
                stopMultiplier: 1.5, targetMultiplier: 3, useTrend: true, useVolatility: true, useSession: true };
              var st = s.generateSignals(MARKET.bars, cfg).stats;
              if (!(st.raw >= st.afterTrend)) return 'afterTrend exceeded raw';
              if (!(st.afterTrend >= st.afterVolatility)) return 'afterVolatility exceeded afterTrend';
              if (!(st.afterSession <= st.afterVolatility)) return 'afterSession exceeded afterVolatility';
              return true;
            } },
          { name: 'enabling filters never increases the signal count', expose: ['generateSignals'],
            run: function (s) {
              var base = { rocLength: 10, smoothLength: 5, trendLength: 20, atrLength: 14, atrBaseLength: 20,
                threshold: 0.02, volatilityMultiplier: 0.9, sessionStart: 810, sessionEnd: 1200,
                stopMultiplier: 1.5, targetMultiplier: 3 };
              var count = function (cfg) {
                return s.generateSignals(MARKET.bars, cfg).signals.filter(function (v) { return v; }).length;
              };
              var none = count(Object.assign({}, base, { useTrend: false, useVolatility: false, useSession: false }));
              var all = count(Object.assign({}, base, { useTrend: true, useVolatility: true, useSession: true }));
              return all <= none ? true : 'filters produced more signals (' + all + ' vs ' + none + ')';
            } },
          { name: 'with all filters off, afterSession equals raw', expose: ['generateSignals'],
            run: function (s) {
              var cfg = { rocLength: 10, smoothLength: 5, trendLength: 20, atrLength: 14, atrBaseLength: 20,
                threshold: 0.02, volatilityMultiplier: 0.9, sessionStart: 810, sessionEnd: 1200,
                stopMultiplier: 1.5, targetMultiplier: 3, useTrend: false, useVolatility: false, useSession: false };
              var st = s.generateSignals(MARKET.bars, cfg).stats;
              return st.raw === st.afterSession ? true : 'disabled filters should not drop anything (' + st.raw + ' -> ' + st.afterSession + ')';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why keep each filter a separate predicate?',
        options: ['Performance', 'Each can be tested alone, and you can measure what each one removes', 'JavaScript requires it', 'To use fewer variables'],
        answer: 1,
        explain: 'A single tangled condition can only be tested end to end, and tells you nothing about which part is doing the work.' },
      { q: 'A filter removes 2% of raw signals. What does that suggest?',
        options: ['It is very effective', 'It is barely doing anything and may not be worth its parameter', 'It is broken', 'It should be inverted'],
        answer: 1,
        explain: 'Every filter is a parameter that can be overfit. One that changes almost nothing adds risk without adding value.' },
      { q: 'Why emit the stop and target alongside the signal?',
        options: ['Convenience', 'Computing them later means computing them from different data than the decision used', 'To reduce memory', 'It is optional'],
        answer: 1,
        explain: 'The levels are part of the decision. Deriving them from a later bar\'s ATR quietly changes what was actually decided.' }
    ],
    recap: [
      'A real signal is a raw trigger plus independent filters.',
      'Keep filters as separate predicates so each is testable and measurable.',
      'Count what each filter removes — that is how you know it earns its place.',
      'Emit entry, stop and target together with the signal.'
    ],
    vocab: [
      { term: 'Signal funnel', def: 'The successive reduction from raw triggers to tradeable signals as each filter is applied.' },
      { term: 'Regime filter', def: 'A condition describing the market environment — trending, volatile, in session — that gates whether a strategy trades at all.' }
    ]
  });

})();
