/* ============================================================
   MODULE 7 — Expert Systems (levels 85–100)
   ============================================================ */
(function () {
  'use strict';
  var C = window.CURRICULUM, CX = window.CX;

  C.push({
    id: 'd085', day: 85, module: 7, minutes: 30,
    title: 'Data Structures for Market Data',
    subtitle: 'Ring buffers, typed arrays, and why array.shift() is a trap.',
    goal: '<b>Goal:</b> hold a rolling window of ticks in a structure that stays fast as the feed keeps arriving.',
    objectives: [
      'Explain why <code>shift()</code> is O(n)',
      'Implement a fixed-size ring buffer',
      'Use typed arrays for large numeric series',
      'Choose a structure from access patterns'
    ],
    sections: [
      { h: 'shift() moves every element',
        body: '<p>Removing the first element of an array reindexes everything after it. Doing that on every tick, for a 5,000-element window, is 5,000 moves per tick — and it gets worse as the window grows.</p>' +
              '<p>A <strong>ring buffer</strong> never moves anything. It keeps a fixed array and an index that wraps, overwriting the oldest slot. Every operation is constant time regardless of size.</p>',
        code: 'const N = 20000;\nconst arr = new Array(N).fill(0);\n\nconsole.time("shift");\nfor (let i = 0; i < 3000; i++) { arr.push(i); arr.shift(); }\nconsole.timeEnd("shift");\n\nconst ring = new Array(N).fill(0);\nlet head = 0;\nconsole.time("ring");\nfor (let i = 0; i < 3000; i++) { ring[head] = i; head = (head + 1) % N; }\nconsole.timeEnd("ring");' },
      { h: 'The ring buffer',
        body: '<p>Two pieces of state: the write position and how many slots are filled. Reading in order means starting from the oldest slot and wrapping.</p>',
        code: 'function makeRing(capacity) {\n  const buf = new Array(capacity);\n  let head = 0, size = 0;\n  return {\n    push(v) {\n      buf[head] = v;\n      head = (head + 1) % capacity;\n      if (size < capacity) size++;\n    },\n    get size() { return size; },\n    toArray() {\n      const out = [];\n      const start = size < capacity ? 0 : head;\n      for (let i = 0; i < size; i++) out.push(buf[(start + i) % capacity]);\n      return out;\n    }\n  };\n}\n\nconst r = makeRing(3);\n[1, 2, 3, 4, 5].forEach(v => r.push(v));\nconsole.log(r.toArray(), "size", r.size);' },
      { h: 'Typed arrays for large numeric series',
        body: '<p>A regular array can hold anything, so each slot is a boxed reference. A <code>Float64Array</code> is a contiguous block of raw doubles — smaller, faster to scan, and with predictable memory behaviour.</p>' +
              '<div class="note note-warn"><b>Fixed length, numbers only</b>Typed arrays cannot grow, cannot hold objects, and silently coerce. Use them for long numeric series where the size is known; use plain arrays for everything else.</div>',
        code: 'const plain = [];\nconst typed = new Float64Array(5);\nfor (let i = 0; i < 5; i++) { plain.push(i * 1.5); typed[i] = i * 1.5; }\nconsole.log(plain, typed);\n\ntyped[0] = "oops";\nconsole.log("coerced to:", typed[0]);' },
      { h: 'Choosing by access pattern',
        body: '<table><tr><th>Need</th><th>Structure</th></tr>' +
              '<tr><td>Fixed rolling window, append only</td><td>ring buffer</td></tr>' +
              '<tr><td>Long numeric series, random access</td><td>typed array</td></tr>' +
              '<tr><td>Lookup by symbol</td><td><code>Map</code></td></tr>' +
              '<tr><td>Membership test</td><td><code>Set</code></td></tr>' +
              '<tr><td>Best bid / best ask</td><td>sorted structure or a heap</td></tr></table>' }
    ],
    parsons: {
      prompt: 'Push into a ring buffer that wraps.',
      lines: [
        'buf[head] = value;',
        'head = (head + 1) % capacity;',
        'if (size < capacity) size++;'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeRingBuffer()', difficulty: 'Core',
        prompt: 'Write <code>makeRingBuffer(capacity)</code> returning an object with:<ul>' +
          '<li><code>push(value)</code> — add, overwriting the oldest once full</li>' +
          '<li><code>size()</code> — how many values are held</li>' +
          '<li><code>toArray()</code> — the values in insertion order, oldest first</li>' +
          '<li><code>last()</code> — the most recent value, or <code>undefined</code> when empty</li></ul>',
        expose: ['makeRingBuffer'],
        starter: 'function makeRingBuffer(capacity) {\n  // { push, size, toArray, last }\n}\n',
        solution: 'function makeRingBuffer(capacity) {\n  const buf = new Array(capacity);\n  let head = 0, count = 0;\n  return {\n    push(value) {\n      buf[head] = value;\n      head = (head + 1) % capacity;\n      if (count < capacity) count++;\n    },\n    size() { return count; },\n    toArray() {\n      const out = [];\n      const start = count < capacity ? 0 : head;\n      for (let i = 0; i < count; i++) out.push(buf[(start + i) % capacity]);\n      return out;\n    },\n    last() {\n      if (count === 0) return undefined;\n      return buf[(head - 1 + capacity) % capacity];\n    }\n  };\n}',
        hints: ['Keep the write position and the count in the closure.',
                'Before the buffer is full the oldest value is at index 0; after that it is at <code>head</code>.',
                'The most recent value is one step behind <code>head</code>, wrapping around.'],
        tests: { checks: [
          { name: 'holds values in order before filling', expose: ['makeRingBuffer'],
            run: function (s, h) {
              var r = s.makeRingBuffer(5);
              [1, 2, 3].forEach(function (v) { r.push(v); });
              if (r.size() !== 3) return 'size should be 3, got ' + r.size();
              return h.eq(r.toArray(), [1, 2, 3]) ? true : 'got ' + JSON.stringify(r.toArray());
            } },
          { name: 'overwrites the oldest once full', expose: ['makeRingBuffer'],
            run: function (s, h) {
              var r = s.makeRingBuffer(3);
              [1, 2, 3, 4, 5].forEach(function (v) { r.push(v); });
              if (r.size() !== 3) return 'size should cap at 3, got ' + r.size();
              return h.eq(r.toArray(), [3, 4, 5]) ? true : 'got ' + JSON.stringify(r.toArray());
            } },
          { name: 'last() returns the most recent value', expose: ['makeRingBuffer'],
            run: function (s) {
              var r = s.makeRingBuffer(3);
              if (r.last() !== undefined) return 'an empty buffer should return undefined';
              [1, 2, 3, 4].forEach(function (v) { r.push(v); });
              return r.last() === 4 ? true : 'got ' + r.last();
            } },
          { name: 'a capacity of 1 keeps only the newest', expose: ['makeRingBuffer'],
            run: function (s, h) {
              var r = s.makeRingBuffer(1);
              r.push('a'); r.push('b');
              return (h.eq(r.toArray(), ['b']) && r.size() === 1) ? true : 'got ' + JSON.stringify(r.toArray());
            } },
          { name: 'stays fast on many pushes', expose: ['makeRingBuffer'],
            run: function (s) {
              var r = s.makeRingBuffer(5000);
              var t0 = Date.now();
              for (var i = 0; i < 200000; i++) r.push(i);
              var ms = Date.now() - t0;
              return ms < 800 ? true : '200k pushes took ' + ms + 'ms — is something shifting the array?';
            } }
        ] } },
      { id: 'e2', title: 'rollingMean() on a ring', difficulty: 'Core',
        prompt: 'Write <code>makeRollingMean(period)</code> returning a function that takes a value and returns the mean of the last <code>period</code> values.<br>' +
          'Use a fixed array with a wrapping index and a running sum — no <code>shift</code>, no <code>slice</code>, and no re-summing the window.<br>' +
          'Before the window is full, return the mean of what has been seen.',
        starter: 'function makeRollingMean(period) {\n  // constant-time rolling mean\n}\n',
        solution: 'function makeRollingMean(period) {\n  const buf = new Array(period).fill(0);\n  let head = 0, count = 0, sum = 0;\n  return value => {\n    if (count === period) sum -= buf[head];\n    else count++;\n    buf[head] = value;\n    sum += value;\n    head = (head + 1) % period;\n    return sum / count;\n  };\n}',
        hints: ['Subtract the value being overwritten from the running sum before replacing it.',
                'Divide by <code>count</code>, not <code>period</code>, so the warm-up works automatically.',
                'The slot being overwritten is exactly the one at <code>head</code>.'],
        tests: { checks: [
          { name: 'averages correctly before and after filling', expose: ['makeRollingMean'],
            run: function (s) {
              var m = s.makeRollingMean(3);
              if (m(10) !== 10) return 'the first value should return itself';
              if (m(20) !== 15) return 'after 10, 20 the mean is 15';
              if (m(30) !== 20) return 'after 10, 20, 30 the mean is 20';
              if (Math.abs(m(60) - 110 / 3) > 1e-9) return 'the window should drop the 10';
              return true;
            } },
          { name: 'a period of 1 returns the latest value', expose: ['makeRollingMean'],
            run: function (s) {
              var m = s.makeRollingMean(1);
              m(5);
              return m(9) === 9 ? true : 'got ' + m(9);
            } },
          { name: 'two instances are independent', expose: ['makeRollingMean'],
            run: function (s) {
              var a = s.makeRollingMean(2), b = s.makeRollingMean(2);
              a(100); a(100);
              return b(1) === 1 ? true : 'the second instance saw the first one\'s data';
            } },
          { name: 'stays accurate over a long stream', expose: ['makeRollingMean'],
            run: function (s) {
              var m = s.makeRollingMean(20);
              var vals = [];
              for (var i = 0; i < 500; i++) {
                var v = Math.sin(i / 7) * 100 + 5000;
                vals.push(v);
                var got = m(v);
                if (i >= 19) {
                  var w = vals.slice(i - 19, i + 1);
                  var want = w.reduce(function (a, b) { return a + b; }, 0) / 20;
                  if (Math.abs(got - want) > 1e-6) return 'drifted at index ' + i + ': ' + got + ' vs ' + want;
                }
              }
              return true;
            } },
          { name: 'does not shift or slice per value', expose: ['makeRollingMean'],
            run: function (s) {
              var m = s.makeRollingMean(4000);
              var t0 = Date.now();
              for (var i = 0; i < 60000; i++) m(i);
              var ms = Date.now() - t0;
              return ms < 800 ? true : '60k updates took ' + ms + 'ms — the window is being recomputed';
            } }
        ] } },
      { id: 'e3', title: 'toTypedSeries()', difficulty: 'Stretch',
        prompt: 'Write <code>toTypedSeries(bars, field)</code> returning a <code>Float64Array</code> of that field from every bar, and <code>seriesStats(typed)</code> returning <code>{ min, max, mean, count }</code> computed in a single pass.<br>' +
          'An empty input gives an empty array and <code>{ min: null, max: null, mean: 0, count: 0 }</code>.',
        expose: ['toTypedSeries', 'seriesStats'],
        starter: 'function toTypedSeries(bars, field) {\n  // Float64Array of one field\n}\n\nfunction seriesStats(typed) {\n  // { min, max, mean, count } in one pass\n}\n',
        solution: 'function toTypedSeries(bars, field) {\n  const out = new Float64Array(bars.length);\n  for (let i = 0; i < bars.length; i++) out[i] = bars[i][field];\n  return out;\n}\n\nfunction seriesStats(typed) {\n  if (!typed.length) return { min: null, max: null, mean: 0, count: 0 };\n  let min = typed[0], max = typed[0], sum = 0;\n  for (let i = 0; i < typed.length; i++) {\n    const v = typed[i];\n    if (v < min) min = v;\n    if (v > max) max = v;\n    sum += v;\n  }\n  return { min, max, mean: sum / typed.length, count: typed.length };\n}',
        hints: ['Allocate the typed array at the right length up front — it cannot grow.',
                'Seed min and max from the first element, not from 0 or Infinity.',
                'One loop can accumulate all three quantities.'],
        tests: { checks: [
          { name: 'produces a Float64Array of the right length', expose: ['toTypedSeries'],
            run: function (s) {
              var t = s.toTypedSeries(MARKET.bars, 'close');
              if (!(t instanceof Float64Array)) return 'expected a Float64Array';
              return t.length === MARKET.bars.length ? true : 'got length ' + t.length;
            } },
          { name: 'copies the requested field', expose: ['toTypedSeries'],
            run: function (s) {
              var t = s.toTypedSeries([{ close: 1.5, high: 9 }, { close: 2.5, high: 8 }], 'close');
              return (t[0] === 1.5 && t[1] === 2.5) ? true : 'got ' + t[0] + ', ' + t[1];
            } },
          { name: 'stats match the data', expose: ['toTypedSeries', 'seriesStats'],
            run: function (s) {
              var t = s.toTypedSeries(MARKET.bars, 'close');
              var st = s.seriesStats(t);
              var want = {
                min: Math.min.apply(null, MARKET.closes),
                max: Math.max.apply(null, MARKET.closes),
                mean: MARKET.closes.reduce(function (a, b) { return a + b; }, 0) / MARKET.closes.length
              };
              if (Math.abs(st.min - want.min) > 1e-9) return 'min was ' + st.min;
              if (Math.abs(st.max - want.max) > 1e-9) return 'max was ' + st.max;
              if (Math.abs(st.mean - want.mean) > 1e-6) return 'mean was ' + st.mean;
              return st.count === MARKET.closes.length ? true : 'count was ' + st.count;
            } },
          { name: 'handles an empty series', expose: ['toTypedSeries', 'seriesStats'],
            run: function (s, h) {
              var t = s.toTypedSeries([], 'close');
              if (t.length !== 0) return 'expected an empty array';
              return h.eq(s.seriesStats(t), { min: null, max: null, mean: 0, count: 0 })
                ? true : 'got ' + JSON.stringify(s.seriesStats(t));
            } },
          { name: 'works on negative values', expose: ['toTypedSeries', 'seriesStats'],
            run: function (s) {
              var t = s.toTypedSeries([{ v: -5 }, { v: -1 }, { v: -3 }], 'v');
              var st = s.seriesStats(t);
              return (st.min === -5 && st.max === -1) ? true : 'min/max were ' + st.min + '/' + st.max;
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why is <code>array.shift()</code> slow on a large array?',
        options: ['It copies the array', 'It reindexes every remaining element', 'It allocates memory', 'It is not slow'],
        answer: 1,
        explain: 'Every element after the removed one moves down by one — O(n) per call, on every tick.' },
      { q: 'What does a ring buffer avoid?',
        options: ['Memory allocation', 'Moving elements — the index wraps instead', 'Rounding error', 'Type coercion'],
        answer: 1,
        explain: 'Nothing ever moves. The oldest slot is simply overwritten and the read start point shifts.' },
      { q: 'When is a <code>Float64Array</code> the right choice?',
        options: ['Always', 'For a long numeric series of known length', 'For objects', 'For lookups by key'],
        answer: 1,
        explain: 'It cannot grow and holds only numbers, but it is compact and fast to scan.' }
    ],
    recap: [
      '<code>shift()</code> is O(n); a ring buffer is O(1).',
      'Track a write index and a count; the read start depends on whether it is full.',
      'Typed arrays are compact and fast but fixed-length and numeric only.',
      'Choose the structure from the access pattern, not from habit.'
    ],
    vocab: [
      { term: 'Ring buffer', def: 'A fixed-size array with a wrapping write index. The standard structure for a rolling window of live data.' },
      { term: 'Typed array', def: 'A contiguous block of numbers of one type. Compact, fast to iterate, and cannot be resized.' }
    ]
  });

  C.push({
    id: 'd086', day: 86, module: 7, minutes: 30,
    title: 'Performance and Profiling',
    subtitle: 'Measure first. Almost every optimisation guess is wrong.',
    goal: '<b>Goal:</b> find where the time actually goes, and fix that rather than what you assumed.',
    objectives: [
      'Time code accurately with <code>performance.now()</code>',
      'Write a benchmark that is not misleading',
      'Recognise the optimisations that actually matter',
      'Know when not to optimise'
    ],
    sections: [
      { h: 'Measure, do not guess',
        body: '<p>The bottleneck is almost never where it feels like it is. A parameter sweep that "must be slow because of the maths" usually spends its time allocating intermediate arrays.</p>',
        code: 'function time(label, fn, runs = 1) {\n  const t0 = performance.now();\n  for (let i = 0; i < runs; i++) fn();\n  const ms = performance.now() - t0;\n  console.log(`${label}: ${ms.toFixed(2)}ms total, ${(ms / runs).toFixed(4)}ms per run`);\n  return ms;\n}\n\nconst data = MARKET.closes;\ntime("chained", () => data.map(c => c * 2).filter(c => c > 10000).reduce((a, b) => a + b, 0), 200);\ntime("single loop", () => {\n  let s = 0;\n  for (let i = 0; i < data.length; i++) { const v = data[i] * 2; if (v > 10000) s += v; }\n  return s;\n}, 200);' },
      { h: 'Writing an honest benchmark',
        body: '<div class="note note-warn"><b>Four ways a benchmark lies</b>' +
              '<br>1. <strong>Dead code elimination</strong> — the engine removes work whose result is unused. Always consume the result.' +
              '<br>2. <strong>Too few iterations</strong> — timer resolution swamps the measurement. Run enough to take tens of milliseconds.' +
              '<br>3. <strong>No warm-up</strong> — the first runs are interpreted before the JIT optimises them.' +
              '<br>4. <strong>Comparing different work</strong> — make sure both versions compute the same answer.</div>',
        code: 'function benchmark(fn, runs) {\n  for (let i = 0; i < Math.min(50, runs); i++) fn();   // warm-up\n  let sink = 0;\n  const t0 = performance.now();\n  for (let i = 0; i < runs; i++) sink += Number(fn()) || 0;\n  const ms = performance.now() - t0;\n  return { ms, perRun: ms / runs, sink };\n}\n\nconsole.log(benchmark(() => MARKET.closes.reduce((a, b) => a + b, 0), 500).perRun.toFixed(5), "ms per reduce");' },
      { h: 'What actually helps',
        body: '<ol><li><strong>Do less work.</strong> A better algorithm beats every micro-optimisation. Rolling sums turned an O(n×period) SMA into O(n) on day 57 — nothing else comes close to that.</li>' +
              '<li><strong>Allocate less.</strong> Intermediate arrays in a hot loop cost more than the arithmetic.</li>' +
              '<li><strong>Cache repeated work.</strong> Memoisation, precomputed indicator series.</li>' +
              '<li><strong>Then</strong> consider loop details — and usually discover they do not matter.</li></ol>' },
      { h: 'When not to optimise',
        body: '<p>Code that runs once at startup, or on 78 bars, does not need optimising however inefficient it looks. Readable code that runs in 3ms is better than clever code that runs in 1ms and takes an afternoon to understand.</p>' +
              '<p>Optimise the hot path — the loop that runs on every tick, or the sweep that runs ten thousand times — and leave the rest alone.</p>' }
    ],
    parsons: {
      prompt: 'Time a function over many runs.',
      lines: [
        'const t0 = performance.now();',
        'for (let i = 0; i < runs; i++) fn();',
        'const ms = performance.now() - t0;',
        'console.log(ms / runs, "ms per run");'
      ]
    },
    exercises: [
      { id: 'e1', title: 'benchmark()', difficulty: 'Core',
        prompt: 'Write <code>benchmark(fn, runs, warmup)</code> returning <code>{ totalMs, perRun, runs }</code>.<ul>' +
          '<li>Call <code>fn</code> <code>warmup</code> times first, untimed.</li>' +
          '<li>Then time <code>runs</code> calls with <code>performance.now()</code>.</li>' +
          '<li>Accumulate the return values into a variable so the work cannot be optimised away.</li>' +
          '<li><code>runs</code> of 0 or less returns all zeros without calling <code>fn</code>.</li></ul>',
        starter: 'function benchmark(fn, runs, warmup) {\n  // { totalMs, perRun, runs }\n}\n',
        solution: 'function benchmark(fn, runs, warmup) {\n  if (runs <= 0) return { totalMs: 0, perRun: 0, runs: 0 };\n  for (let i = 0; i < warmup; i++) fn();\n  let sink = 0;\n  const t0 = performance.now();\n  for (let i = 0; i < runs; i++) {\n    const v = fn();\n    sink += typeof v === "number" ? v : 0;\n  }\n  const totalMs = performance.now() - t0;\n  if (sink === Infinity) console.log("");\n  return { totalMs, perRun: totalMs / runs, runs };\n}',
        hints: ['The warm-up loop runs before the timer starts.',
                'Consuming the result keeps the engine from removing the call entirely.',
                'Guard a non-positive run count before dividing.'],
        tests: { checks: [
          { name: 'calls fn the right number of times', expose: ['benchmark'],
            run: function (s) {
              var n = 0;
              s.benchmark(function () { n++; return 1; }, 100, 10);
              return n === 110 ? true : 'fn ran ' + n + ' times, expected 110 (100 timed + 10 warm-up)';
            } },
          { name: 'reports a plausible per-run time', expose: ['benchmark'],
            run: function (s) {
              var r = s.benchmark(function () {
                var t = 0;
                for (var i = 0; i < 2000; i++) t += i;
                return t;
              }, 200, 20);
              if (!(r.totalMs >= 0)) return 'totalMs should be a non-negative number';
              if (r.runs !== 200) return 'runs should be 200';
              return Math.abs(r.perRun - r.totalMs / 200) < 1e-9 ? true : 'perRun does not match totalMs / runs';
            } },
          { name: 'zero runs does nothing', expose: ['benchmark'],
            run: function (s, h) {
              var n = 0;
              var r = s.benchmark(function () { n++; return 1; }, 0, 5);
              if (n !== 0) return 'fn should not be called at all';
              return h.eq(r, { totalMs: 0, perRun: 0, runs: 0 }) ? true : 'got ' + JSON.stringify(r);
            } }
        ] } },
      { id: 'e2', title: 'Optimise the SMA', difficulty: 'Core',
        prompt: 'The naive SMA below re-sums its window on every bar. Rewrite <code>fastSma(series, n)</code> using a running sum so it does one add and one subtract per bar.<br>' +
          'It must produce <strong>identical</strong> output to the naive version, including the <code>null</code> warm-up.',
        starter: 'function naiveSma(series, n) {\n  return series.map((_, i) =>\n    i < n - 1 ? null : series.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n);\n}\n\nfunction fastSma(series, n) {\n  // same output, linear time\n}\n',
        solution: 'function naiveSma(series, n) {\n  return series.map((_, i) =>\n    i < n - 1 ? null : series.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n);\n}\n\nfunction fastSma(series, n) {\n  const out = new Array(series.length).fill(null);\n  let sum = 0;\n  for (let i = 0; i < series.length; i++) {\n    sum += series[i];\n    if (i >= n) sum -= series[i - n];\n    if (i >= n - 1) out[i] = sum / n;\n  }\n  return out;\n}',
        hints: ['Add the incoming value, then subtract the one leaving the window once <code>i &gt;= n</code>.',
                'Write into a pre-filled array of nulls so the warm-up matches exactly.'],
        tests: { fn: 'fastSma', approx: 1e-9, cases: [
          { args: [[10, 12, 11, 15, 14], 3], expect: [null, null, 11, 38 / 3, 40 / 3] },
          { args: [[1, 2, 3], 1], expect: [1, 2, 3] },
          { args: [[1, 2], 5], expect: [null, null] },
          { args: [[], 3], expect: [] }
        ], checks: [
          { name: 'matches the naive version exactly', expose: ['fastSma'],
            run: function (s) {
              var naive = MARKET.closes.map(function (_, i) {
                return i < 19 ? null
                  : MARKET.closes.slice(i - 19, i + 1).reduce(function (a, b) { return a + b; }, 0) / 20;
              });
              var fast = s.fastSma(MARKET.closes, 20);
              for (var i = 0; i < naive.length; i++) {
                if (naive[i] === null) {
                  if (fast[i] !== null) return 'index ' + i + ' should be null';
                } else if (Math.abs(fast[i] - naive[i]) > 1e-6) {
                  return 'index ' + i + ': ' + fast[i] + ' vs ' + naive[i];
                }
              }
              return true;
            } },
          { name: 'is fast on a long series with a long period', expose: ['fastSma'],
            run: function (s) {
              var big = new Array(60000);
              for (var i = 0; i < big.length; i++) big[i] = 5000 + Math.sin(i / 50) * 20;
              var t0 = Date.now();
              s.fastSma(big, 500);
              var ms = Date.now() - t0;
              return ms < 600 ? true : 'took ' + ms + 'ms — the window is still being re-summed';
            } },
        ], source: [{ name: 'no slice inside fastSma', fn: function (code) {
            var m = code.indexOf('function fastSma');
            if (m < 0) return true;
            return code.slice(m).indexOf('.slice(') < 0;
          }, why: 'the whole point is to avoid rebuilding the window each bar' }] } },
      { id: 'e3', title: 'compareImplementations()', difficulty: 'Stretch',
        prompt: 'Write <code>compareImplementations(implementations, input, runs)</code> where <code>implementations</code> is <code>{ name: fn }</code> and each <code>fn(input)</code> returns a result.<br>' +
          'Return <code>{ results, fastest, agree }</code>:<ul>' +
          '<li><code>results</code> — <code>{ name, totalMs, perRun }</code> for each, in declaration order</li>' +
          '<li><code>fastest</code> — the name with the lowest <code>perRun</code></li>' +
          '<li><code>agree</code> — whether every implementation produced the same output, compared with <code>JSON.stringify</code></li></ul>' +
          '<span class="muted">Run each implementation once first for the correctness check and as a warm-up.</span>',
        starter: 'function compareImplementations(implementations, input, runs) {\n  // { results, fastest, agree }\n}\n',
        solution: 'function compareImplementations(implementations, input, runs) {\n  const names = Object.keys(implementations);\n  const outputs = names.map(n => JSON.stringify(implementations[n](input)));\n  const agree = outputs.every(o => o === outputs[0]);\n  const results = names.map(name => {\n    const fn = implementations[name];\n    let sink = 0;\n    const t0 = performance.now();\n    for (let i = 0; i < runs; i++) {\n      const v = fn(input);\n      sink += Array.isArray(v) ? v.length : (typeof v === "number" ? v : 0);\n    }\n    const totalMs = performance.now() - t0;\n    if (sink === Infinity) console.log("");\n    return { name, totalMs, perRun: runs > 0 ? totalMs / runs : 0 };\n  });\n  let fastest = null;\n  results.forEach(r => { if (!fastest || r.perRun < fastest.perRun) fastest = r; });\n  return { results, fastest: fastest ? fastest.name : null, agree };\n}',
        hints: ['Run each one once up front — that both warms it up and gives you its output for the comparison.',
                'Consume something from each result inside the timing loop.',
                'The fastest is a simple argmin over <code>perRun</code>.'],
        tests: { checks: [
          { name: 'detects that two implementations agree', expose: ['compareImplementations'],
            run: function (s) {
              var r = s.compareImplementations({
                a: function (x) { return x.map(function (v) { return v * 2; }); },
                b: function (x) {
                  var out = [];
                  for (var i = 0; i < x.length; i++) out.push(x[i] * 2);
                  return out;
                }
              }, [1, 2, 3], 50);
              return r.agree === true ? true : 'identical implementations should agree';
            } },
          { name: 'detects disagreement', expose: ['compareImplementations'],
            run: function (s) {
              var r = s.compareImplementations({
                a: function (x) { return x.map(function (v) { return v * 2; }); },
                b: function (x) { return x.map(function (v) { return v * 3; }); }
              }, [1, 2, 3], 50);
              return r.agree === false ? true : 'different outputs should not agree';
            } },
          { name: 'reports one result per implementation, in order', expose: ['compareImplementations'],
            run: function (s) {
              var r = s.compareImplementations({
                first: function (x) { return x.length; },
                second: function (x) { return x.length; }
              }, [1, 2, 3], 20);
              if (r.results.length !== 2) return 'expected 2 results';
              return (r.results[0].name === 'first' && r.results[1].name === 'second')
                ? true : 'the results are out of order';
            } },
          { name: 'picks the faster implementation', expose: ['compareImplementations'],
            run: function (s) {
              var r = s.compareImplementations({
                slow: function (x) {
                  var t = 0;
                  for (var i = 0; i < 60000; i++) t += x[i % x.length];
                  return t % 7;
                },
                fast: function (x) { return x[0] % 7; }
              }, [1, 2, 3], 30);
              return r.fastest === 'fast' ? true : 'expected "fast", got ' + r.fastest;
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is the first step in optimising?',
        options: ['Rewrite the inner loop', 'Measure where the time actually goes', 'Add caching', 'Use typed arrays'],
        answer: 1,
        explain: 'The bottleneck is rarely where it feels like it is. Optimising the wrong thing costs time and readability for nothing.' },
      { q: 'Why consume a benchmark\'s return value?',
        options: ['To check correctness', 'So the engine cannot eliminate work whose result is unused', 'For logging', 'It is unnecessary'],
        answer: 1,
        explain: 'Dead-code elimination can remove the entire call, producing an impressively fast benchmark of nothing.' },
      { q: 'Which optimisation gives the largest gain, typically?',
        options: ['A tighter loop', 'A better algorithm — doing asymptotically less work', 'Fewer variables', 'Shorter names'],
        answer: 1,
        explain: 'Turning O(n × period) into O(n) beats every micro-optimisation combined.' }
    ],
    recap: [
      'Measure before changing anything.',
      'Warm up, run enough iterations, and consume the result.',
      'Algorithm first, allocation second, loop details last.',
      'Only optimise the hot path.'
    ],
    vocab: [
      { term: 'Hot path', def: 'The code that runs most often — the per-tick loop, the inner sweep. The only place optimisation reliably pays.' },
      { term: 'Dead-code elimination', def: 'The engine removing computations whose results are never used. A frequent cause of impossibly fast benchmarks.' }
    ]
  });


  C.push({
    id: 'd087', day: 87, module: 7, minutes: 30,
    title: 'Generators and Lazy Evaluation',
    subtitle: 'Producing values only when someone asks for them.',
    goal: '<b>Goal:</b> build lazy pipelines that process an unbounded series without ever materialising it.',
    objectives: [
      'Write a generator with <code>function*</code> and <code>yield</code>',
      'Compose generators into a lazy pipeline',
      'Explain the memory difference from array methods',
      'Use <code>yield*</code> to delegate'
    ],
    sections: [
      { h: 'A generator pauses',
        body: '<p>Calling a generator returns an iterator and runs nothing. Each <code>next()</code> runs until the following <code>yield</code> and then freezes, keeping all its local state.</p>',
        code: 'function* countFrom(n) {\n  while (true) {\n    yield n++;\n  }\n}\n\nconst it = countFrom(10);\nconsole.log(it.next().value, it.next().value, it.next().value);\nconsole.log("infinite, but only three values were ever computed");' },
      { h: 'Lazy pipelines never build intermediate arrays',
        body: '<p><code>arr.map(f).filter(g).slice(0, 5)</code> builds two full arrays to produce five values. Generator equivalents produce exactly the five values, and work on infinite sources.</p>',
        code: 'function* map(iter, fn) { for (const v of iter) yield fn(v); }\nfunction* filter(iter, pred) { for (const v of iter) if (pred(v)) yield v; }\nfunction* take(iter, n) {\n  let i = 0;\n  for (const v of iter) {\n    if (i++ >= n) return;\n    yield v;\n  }\n}\n\nfunction* naturals() { let n = 0; while (true) yield n++; }\n\nconsole.log([...take(filter(map(naturals(), x => x * x), x => x % 2 === 1), 5)]);' },
      { h: 'Only the work you need happens',
        body: '<p>Counting how many times the transform runs shows the difference plainly: the eager chain transforms everything, the lazy one stops the moment it has enough.</p>',
        code: 'let eager = 0, lazy = 0;\nconst data = Array.from({ length: 1000 }, (_, i) => i);\n\ndata.map(x => { eager++; return x * 2; }).filter(x => x > 10).slice(0, 3);\n\nfunction* lazyMap(iter, fn) { for (const v of iter) yield fn(v); }\nfunction* lazyTake(iter, n) { let i = 0; for (const v of iter) { if (i++ >= n) return; yield v; } }\n[...lazyTake(lazyMap(data, x => { lazy++; return x * 2; }), 3)];\n\nconsole.log("eager transforms:", eager, " lazy transforms:", lazy);' },
      { h: 'yield* delegates to another iterable',
        body: '<p><code>yield*</code> hands control to another generator or iterable and yields everything it produces. It is how you compose generators without a nested loop.</p>' +
              '<div class="note note-tip"><b>Where this pays off in trading</b>Replaying years of tick data, or streaming a multi-gigabyte file, cannot fit in memory as an array. A generator pipeline processes it one record at a time with constant memory.</div>',
        code: 'function* sessionBars(sessions) {\n  for (const session of sessions) {\n    yield* session;\n  }\n}\n\nconsole.log([...sessionBars([[1, 2], [3], [4, 5]])]);' }
    ],
    parsons: {
      prompt: 'Take the first n values from any iterable.',
      lines: [
        'function* take(iter, n) {',
        '  let i = 0;',
        '  for (const v of iter) {',
        '    if (i++ >= n) return;',
        '    yield v;',
        '  }',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'take(), map() and filter()', difficulty: 'Core',
        prompt: 'Write three generators that work on any iterable:<ul>' +
          '<li><code>take(iter, n)</code> — the first <code>n</code> values, then stop</li>' +
          '<li><code>lazyMap(iter, fn)</code> — each value transformed</li>' +
          '<li><code>lazyFilter(iter, pred)</code> — only the values passing the predicate</li></ul>' +
          '<code>take</code> with an <code>n</code> of 0 or less yields nothing and must not pull from the source.',
        expose: ['take', 'lazyMap', 'lazyFilter'],
        starter: 'function* take(iter, n) {\n}\n\nfunction* lazyMap(iter, fn) {\n}\n\nfunction* lazyFilter(iter, pred) {\n}\n',
        solution: 'function* take(iter, n) {\n  if (n <= 0) return;\n  let i = 0;\n  for (const v of iter) {\n    yield v;\n    if (++i >= n) return;\n  }\n}\n\nfunction* lazyMap(iter, fn) {\n  for (const v of iter) yield fn(v);\n}\n\nfunction* lazyFilter(iter, pred) {\n  for (const v of iter) if (pred(v)) yield v;\n}',
        hints: ['<code>return</code> inside a generator ends it.',
                'Guard <code>n &lt;= 0</code> before the loop so nothing is pulled from the source.',
                '<code>lazyMap</code> and <code>lazyFilter</code> are one line each.'],
        tests: { checks: [
          { name: 'take limits the output', expose: ['take'],
            run: function (s, h) {
              return h.eq([...s.take([1, 2, 3, 4, 5], 3), ], [1, 2, 3])
                ? true : 'got ' + JSON.stringify([...s.take([1, 2, 3, 4, 5], 3)]);
            } },
          { name: 'take works on an infinite source', expose: ['take'],
            run: function (s, h) {
              function* naturals() { var n = 0; while (true) yield n++; }
              return h.eq([...s.take(naturals(), 4)], [0, 1, 2, 3]) ? true : 'take did not stop';
            } },
          { name: 'take(0) pulls nothing', expose: ['take'],
            run: function (s) {
              var pulled = 0;
              function* counted() { pulled++; yield 1; }
              var out = [...s.take(counted(), 0)];
              if (out.length !== 0) return 'expected no output';
              return pulled === 0 ? true : 'the source was started despite n = 0';
            } },
          { name: 'lazyMap transforms every value', expose: ['lazyMap'],
            run: function (s, h) {
              return h.eq([...s.lazyMap([1, 2, 3], function (x) { return x * 2; })], [2, 4, 6])
                ? true : 'lazyMap is wrong';
            } },
          { name: 'lazyFilter keeps only matches', expose: ['lazyFilter'],
            run: function (s, h) {
              return h.eq([...s.lazyFilter([1, 2, 3, 4], function (x) { return x % 2 === 0; })], [2, 4])
                ? true : 'lazyFilter is wrong';
            } },
          { name: 'they compose lazily', expose: ['take', 'lazyMap', 'lazyFilter'],
            run: function (s, h) {
              function* naturals() { var n = 0; while (true) yield n++; }
              var out = [...s.take(s.lazyFilter(s.lazyMap(naturals(), function (x) { return x * x; }),
                function (x) { return x % 2 === 1; }), 5)];
              return h.eq(out, [1, 9, 25, 49, 81]) ? true : 'got ' + JSON.stringify(out);
            } }
        ] } },
      { id: 'e2', title: 'Count the work', difficulty: 'Core',
        prompt: 'Write <code>lazyWorkCount(data, transformCount)</code> which, using your lazy pipeline, takes the first <strong>3</strong> values of <code>data</code> doubled, calling <code>transformCount()</code> once per value actually transformed.<br>' +
          'Return the three values as an array. The transform must run exactly three times, however long <code>data</code> is.',
        starter: 'function* take(iter, n) {\n  if (n <= 0) return;\n  let i = 0;\n  for (const v of iter) { yield v; if (++i >= n) return; }\n}\nfunction* lazyMap(iter, fn) { for (const v of iter) yield fn(v); }\n\nfunction lazyWorkCount(data, transformCount) {\n  // take 3 doubled values, transforming only 3 times\n}\n',
        solution: 'function* take(iter, n) {\n  if (n <= 0) return;\n  let i = 0;\n  for (const v of iter) { yield v; if (++i >= n) return; }\n}\nfunction* lazyMap(iter, fn) { for (const v of iter) yield fn(v); }\n\nfunction lazyWorkCount(data, transformCount) {\n  return [...take(lazyMap(data, v => { transformCount(); return v * 2; }), 3)];\n}',
        hints: ['Wrap the source in <code>lazyMap</code>, then in <code>take</code>, then spread it.',
                'Because <code>take</code> stops pulling, the map only ever runs three times.'],
        tests: { checks: [
          { name: 'returns the first three doubled', expose: ['lazyWorkCount'],
            run: function (s, h) {
              var out = s.lazyWorkCount([1, 2, 3, 4, 5], function () {});
              return h.eq(out, [2, 4, 6]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'transforms exactly three times on a long input', expose: ['lazyWorkCount'],
            run: function (s) {
              var n = 0;
              var data = [];
              for (var i = 0; i < 5000; i++) data.push(i);
              s.lazyWorkCount(data, function () { n++; });
              return n === 3 ? true : 'the transform ran ' + n + ' times, expected 3';
            } },
          { name: 'handles a source shorter than three', expose: ['lazyWorkCount'],
            run: function (s, h) {
              var n = 0;
              var out = s.lazyWorkCount([7], function () { n++; });
              if (!h.eq(out, [14])) return 'got ' + JSON.stringify(out);
              return n === 1 ? true : 'the transform ran ' + n + ' times';
            } },
          { name: 'handles an empty source', expose: ['lazyWorkCount'],
            run: function (s, h) {
              return h.eq(s.lazyWorkCount([], function () {}), []) ? true : 'expected an empty array';
            } }
        ] } },
      { id: 'e3', title: 'A lazy bar pipeline', difficulty: 'Stretch',
        prompt: 'Write <code>barPipeline(sessions, options)</code>, a <strong>generator</strong> that:<ol>' +
          '<li>flattens an array of sessions (each an array of bars) with <code>yield*</code></li>' +
          '<li>skips bars whose <code>close</code> is not a finite number</li>' +
          '<li>yields <code>{ index, close, change }</code> where <code>index</code> counts the emitted bars from 0 and <code>change</code> is the close minus the previous emitted close (<code>null</code> for the first)</li>' +
          '<li>stops after <code>options.limit</code> emitted bars when <code>limit</code> is given</li></ol>' +
          'It must never build an intermediate array of all the bars.',
        expose: ['barPipeline'],
        starter: 'function* barPipeline(sessions, options) {\n  // flatten, clean, enrich, limit - all lazily\n}\n',
        solution: 'function* allBars(sessions) {\n  for (const session of sessions) yield* session;\n}\n\nfunction* barPipeline(sessions, options) {\n  const limit = options && options.limit;\n  let index = 0, prev = null;\n  for (const bar of allBars(sessions)) {\n    if (!Number.isFinite(bar.close)) continue;\n    if (limit !== undefined && limit !== null && index >= limit) return;\n    yield { index, close: bar.close, change: prev === null ? null : bar.close - prev };\n    prev = bar.close;\n    index++;\n  }\n}',
        hints: ['A small inner generator with <code>yield*</code> handles the flattening.',
                'Track the previous emitted close and the emitted count separately from the source position.',
                'Check the limit before yielding, so exactly <code>limit</code> values come out.'],
        tests: { checks: [
          { name: 'flattens sessions and numbers the output', expose: ['barPipeline'],
            run: function (s, h) {
              var out = [...s.barPipeline([[{ close: 10 }, { close: 12 }], [{ close: 11 }]], {})];
              return h.eq(out, [
                { index: 0, close: 10, change: null },
                { index: 1, close: 12, change: 2 },
                { index: 2, close: 11, change: -1 }
              ]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'skips unusable bars without counting them', expose: ['barPipeline'],
            run: function (s, h) {
              var out = [...s.barPipeline([[{ close: 10 }, { close: NaN }, { close: 12 }]], {})];
              return h.eq(out, [
                { index: 0, close: 10, change: null },
                { index: 1, close: 12, change: 2 }
              ]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'respects the limit', expose: ['barPipeline'],
            run: function (s) {
              var out = [...s.barPipeline([[{ close: 1 }, { close: 2 }, { close: 3 }, { close: 4 }]], { limit: 2 })];
              return out.length === 2 ? true : 'expected 2 bars, got ' + out.length;
            } },
          { name: 'is lazy — it stops pulling once the limit is met', expose: ['barPipeline'],
            run: function (s) {
              var pulled = 0;
              function* lazySession() {
                for (var i = 0; i < 10000; i++) { pulled++; yield { close: i + 1 }; }
              }
              var out = [...s.barPipeline([lazySession()], { limit: 3 })];
              if (out.length !== 3) return 'expected 3 bars, got ' + out.length;
              return pulled <= 4 ? true : 'pulled ' + pulled + ' bars for a limit of 3 — the pipeline is not lazy';
            } },
          { name: 'handles no sessions', expose: ['barPipeline'],
            run: function (s, h) {
              return h.eq([...s.barPipeline([], {})], []) ? true : 'expected no output';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What happens when you call a generator function?',
        options: ['The body runs to completion', 'An iterator is returned and nothing runs yet', 'It returns a promise', 'It throws'],
        answer: 1,
        explain: 'Execution starts on the first <code>next()</code> and pauses at each <code>yield</code>.' },
      { q: 'What does a lazy pipeline avoid?',
        options: ['Function calls', 'Building intermediate arrays and doing work nobody asked for', 'Type errors', 'Recursion'],
        answer: 1,
        explain: 'Taking 3 values from a chain over a million records does three transforms, not three million.' },
      { q: 'What does <code>yield*</code> do?',
        options: ['Yields an array', 'Delegates to another iterable, yielding everything it produces', 'Ends the generator', 'Yields twice'],
        answer: 1,
        explain: 'It is how generators compose without a nested loop — flattening sessions into bars, for instance.' }
    ],
    recap: [
      'A generator runs only as far as the next <code>yield</code>.',
      'Lazy pipelines avoid intermediate arrays and unnecessary work.',
      'They work on infinite and out-of-memory sources.',
      '<code>yield*</code> delegates to another iterable.'
    ],
    vocab: [
      { term: 'Lazy evaluation', def: 'Computing a value only when it is needed. Essential for streams larger than memory.' },
      { term: 'Tick replay', def: 'Feeding historical tick data through a system as if live. Often far too large to hold in an array.' }
    ]
  });

  C.push({
    id: 'd088', day: 88, module: 7, minutes: 30,
    title: 'Web Workers',
    subtitle: 'Moving heavy computation off the thread that draws the screen.',
    goal: '<b>Goal:</b> structure a parameter sweep so it can run in a worker without freezing the interface.',
    objectives: [
      'Explain what a worker can and cannot do',
      'Design a message protocol between threads',
      'Structure code so the heavy part is pure and transferable',
      'Report progress from a long job'
    ],
    sections: [
      { h: 'A worker is a separate thread with no DOM',
        body: '<p>Workers run in parallel with the main thread and communicate only by message passing. They have no access to the document, to your variables, or to anything except what you send them.</p>' +
              '<p>That constraint is a design benefit: the code you move into a worker has to be a <em>pure function of its inputs</em>, which is exactly the code that was easiest to test anyway.</p>',
        code: '// main thread\n// const worker = new Worker("sweep.js");\n// worker.postMessage({ type: "run", grid, bars });\n// worker.onmessage = e => console.log(e.data);\n\n// inside sweep.js\n// self.onmessage = e => {\n//   const result = runSweep(e.data.grid, e.data.bars);\n//   self.postMessage({ type: "done", result });\n// };\n\nconsole.log("Message passing only — no shared variables.");' },
      { h: 'Messages are copied, not shared',
        body: '<p>Everything sent is <strong>structured-cloned</strong>: deep-copied, losing functions, class identity and DOM nodes. Sending a large array costs a real copy.</p>' +
              '<div class="note note-warn"><b>What cannot cross</b>Functions, class instances (they arrive as plain objects), DOM nodes, and anything with a cycle the cloner cannot handle. Send <em>data</em> and let the worker hold the code.</div>' },
      { h: 'A message protocol',
        body: '<p>Give every message a <code>type</code> and, for anything that expects a reply, an <code>id</code> so responses can be matched to requests. Without an id, two concurrent jobs are indistinguishable when their results arrive.</p>',
        code: 'function makeProtocol() {\n  let nextId = 1;\n  const pending = new Map();\n  return {\n    request(type, payload) {\n      const id = nextId++;\n      return { message: { id, type, payload }, id };\n    },\n    resolve(response) {\n      const entry = pending.get(response.id);\n      pending.delete(response.id);\n      return entry;\n    },\n    track(id, handler) { pending.set(id, handler); },\n    get pendingCount() { return pending.size; }\n  };\n}\n\nconst p = makeProtocol();\nconsole.log(p.request("sweep", { fast: [5, 9] }).message);' },
      { h: 'Report progress, or it looks frozen',
        body: '<p>A ten-second job that says nothing is indistinguishable from a crash. Post a progress message every so often — but not on every iteration, since each message has a cost of its own.</p>',
        code: 'function runWithProgress(total, onProgress, everyN) {\n  const results = [];\n  for (let i = 0; i < total; i++) {\n    results.push(i * i);\n    if ((i + 1) % everyN === 0) onProgress({ done: i + 1, total });\n  }\n  return results;\n}\n\nrunWithProgress(10, p => console.log(`progress ${p.done}/${p.total}`), 3);' }
    ],
    parsons: {
      prompt: 'Tag a request with an id so its reply can be matched.',
      lines: [
        'const id = nextId++;',
        'pending.set(id, handler);',
        'worker.postMessage({ id, type, payload });'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeMessageBus()', difficulty: 'Core',
        prompt: 'Write <code>makeMessageBus(send)</code> where <code>send(message)</code> delivers a message to the other side. Return:<ul>' +
          '<li><code>request(type, payload)</code> — returns a Promise, sends <code>{ id, type, payload }</code>, and resolves when a matching response arrives</li>' +
          '<li><code>handleResponse(response)</code> — takes <code>{ id, result }</code> or <code>{ id, error }</code> and settles the matching promise</li>' +
          '<li><code>pendingCount()</code> — how many requests are outstanding</li></ul>' +
          'A response with an unknown id is ignored. An <code>error</code> rejects with <code>new Error(error)</code>.',
        expose: ['makeMessageBus'],
        starter: 'function makeMessageBus(send) {\n  // { request, handleResponse, pendingCount }\n}\n',
        solution: 'function makeMessageBus(send) {\n  let nextId = 1;\n  const pending = new Map();\n  return {\n    request(type, payload) {\n      const id = nextId++;\n      return new Promise((resolve, reject) => {\n        pending.set(id, { resolve, reject });\n        send({ id, type, payload });\n      });\n    },\n    handleResponse(response) {\n      const entry = pending.get(response.id);\n      if (!entry) return;\n      pending.delete(response.id);\n      if (response.error !== undefined) entry.reject(new Error(response.error));\n      else entry.resolve(response.result);\n    },\n    pendingCount() { return pending.size; }\n  };\n}',
        hints: ['Store the promise\'s <code>resolve</code> and <code>reject</code> in a Map keyed by id.',
                'Delete the entry before settling so a duplicate response does nothing.',
                'An unknown id should return quietly, not throw.'],
        tests: { checks: [
          { name: 'sends a message with an id and type', expose: ['makeMessageBus'],
            run: function (s) {
              var sent = null;
              var bus = s.makeMessageBus(function (m) { sent = m; });
              bus.request('sweep', { n: 1 });
              if (!sent) return 'nothing was sent';
              if (sent.type !== 'sweep') return 'type was ' + sent.type;
              if (typeof sent.id !== 'number') return 'the message needs a numeric id';
              return sent.payload.n === 1 ? true : 'the payload was not forwarded';
            } },
          { name: 'resolves on a matching response', expose: ['makeMessageBus'],
            run: async function (s) {
              var sent = null;
              var bus = s.makeMessageBus(function (m) { sent = m; });
              var p = bus.request('sweep', {});
              bus.handleResponse({ id: sent.id, result: 42 });
              var v = await p;
              return v === 42 ? true : 'resolved with ' + v;
            } },
          { name: 'rejects on an error response', expose: ['makeMessageBus'],
            run: async function (s) {
              var sent = null;
              var bus = s.makeMessageBus(function (m) { sent = m; });
              var p = bus.request('sweep', {});
              bus.handleResponse({ id: sent.id, error: 'worker died' });
              try { await p; } catch (e) { return e.message === 'worker died' ? true : 'got ' + e.message; }
              return 'it should have rejected';
            } },
          { name: 'matches concurrent requests by id', expose: ['makeMessageBus'],
            run: async function (s) {
              var sent = [];
              var bus = s.makeMessageBus(function (m) { sent.push(m); });
              var a = bus.request('x', {});
              var b = bus.request('y', {});
              bus.handleResponse({ id: sent[1].id, result: 'second' });
              bus.handleResponse({ id: sent[0].id, result: 'first' });
              var out = await Promise.all([a, b]);
              return (out[0] === 'first' && out[1] === 'second') ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'tracks and clears pending requests', expose: ['makeMessageBus'],
            run: async function (s) {
              var sent = null;
              var bus = s.makeMessageBus(function (m) { sent = m; });
              if (bus.pendingCount() !== 0) return 'a new bus should have nothing pending';
              var p = bus.request('x', {});
              if (bus.pendingCount() !== 1) return 'expected 1 pending';
              bus.handleResponse({ id: sent.id, result: 1 });
              await p;
              return bus.pendingCount() === 0 ? true : 'the entry was not cleared';
            } },
          { name: 'an unknown id is ignored', expose: ['makeMessageBus'],
            run: function (s) {
              var bus = s.makeMessageBus(function () {});
              try { bus.handleResponse({ id: 999, result: 1 }); } catch (e) { return 'it threw: ' + e.message; }
              return true;
            } }
        ] } },
      { id: 'e2', title: 'runWithProgress()', difficulty: 'Core',
        prompt: 'Write <code>runWithProgress(items, work, onProgress, everyN)</code> which applies <code>work(item, index)</code> to each item, collects the results, and calls <code>onProgress({ done, total, percent })</code> every <code>everyN</code> items <strong>and</strong> once at the end if the last item did not land on a boundary.<br>' +
          '<code>percent</code> is <code>done / total × 100</code>. An empty list reports nothing.',
        starter: 'function runWithProgress(items, work, onProgress, everyN) {\n  // results plus periodic progress\n}\n',
        solution: 'function runWithProgress(items, work, onProgress, everyN) {\n  const total = items.length;\n  const results = [];\n  for (let i = 0; i < total; i++) {\n    results.push(work(items[i], i));\n    const done = i + 1;\n    if (done % everyN === 0 || done === total) {\n      onProgress({ done, total, percent: done / total * 100 });\n    }\n  }\n  return results;\n}',
        hints: ['Report when <code>done % everyN === 0</code> or when <code>done === total</code>.',
                'The <code>||</code> means the final report is not duplicated when the last item is on a boundary.',
                'An empty list never enters the loop, so nothing is reported.'],
        tests: { checks: [
          { name: 'returns every result', expose: ['runWithProgress'],
            run: function (s, h) {
              var out = s.runWithProgress([1, 2, 3], function (v) { return v * 2; }, function () {}, 10);
              return h.eq(out, [2, 4, 6]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'reports every everyN items', expose: ['runWithProgress'],
            run: function (s) {
              var reports = [];
              s.runWithProgress([1, 2, 3, 4, 5, 6], function (v) { return v; },
                function (p) { reports.push(p.done); }, 2);
              return reports.join(',') === '2,4,6' ? true : 'reports were ' + JSON.stringify(reports);
            } },
          { name: 'reports once at the end off a boundary', expose: ['runWithProgress'],
            run: function (s) {
              var reports = [];
              s.runWithProgress([1, 2, 3, 4, 5], function (v) { return v; },
                function (p) { reports.push(p.done); }, 2);
              return reports.join(',') === '2,4,5' ? true : 'reports were ' + JSON.stringify(reports);
            } },
          { name: 'does not double-report on a boundary', expose: ['runWithProgress'],
            run: function (s) {
              var reports = [];
              s.runWithProgress([1, 2, 3, 4], function (v) { return v; },
                function (p) { reports.push(p.done); }, 2);
              return reports.join(',') === '2,4' ? true : 'reports were ' + JSON.stringify(reports);
            } },
          { name: 'percent is correct', expose: ['runWithProgress'],
            run: function (s) {
              var last = null;
              s.runWithProgress([1, 2, 3, 4], function (v) { return v; },
                function (p) { last = p; }, 2);
              return Math.abs(last.percent - 100) < 1e-9 ? true : 'the final percent was ' + last.percent;
            } },
          { name: 'an empty list reports nothing', expose: ['runWithProgress'],
            run: function (s) {
              var n = 0;
              var out = s.runWithProgress([], function (v) { return v; }, function () { n++; }, 2);
              return (out.length === 0 && n === 0) ? true : 'expected no results and no reports';
            } }
        ] } },
      { id: 'e3', title: 'A transferable sweep job', difficulty: 'Stretch',
        prompt: 'Structure a sweep so it could run in a worker unchanged. Write:<ul>' +
          '<li><code>buildJob(grid)</code> — turns <code>{ name: [values] }</code> (two parameters) into a plain, structured-cloneable array of combination objects</li>' +
          '<li><code>runJob(job, bars, scoreFn)</code> — scores every combination, returning <code>{ params, score }</code> sorted by score descending, then by the first parameter ascending</li>' +
          '<li><code>isTransferable(value)</code> — whether a value survives structured cloning: it must contain no functions and must round-trip through <code>JSON.stringify</code> unchanged in shape</li></ul>',
        expose: ['buildJob', 'runJob', 'isTransferable'],
        starter: 'function buildJob(grid) {\n  // every combination, as plain objects\n}\n\nfunction runJob(job, bars, scoreFn) {\n  // [{ params, score }] sorted\n}\n\nfunction isTransferable(value) {\n  // would this survive postMessage?\n}\n',
        solution: 'function buildJob(grid) {\n  const names = Object.keys(grid);\n  const [a, b] = names;\n  const out = [];\n  for (const av of grid[a]) {\n    for (const bv of grid[b]) {\n      out.push({ [a]: av, [b]: bv });\n    }\n  }\n  return out;\n}\n\nfunction runJob(job, bars, scoreFn) {\n  const firstKey = job.length ? Object.keys(job[0])[0] : null;\n  return job\n    .map(params => ({ params, score: scoreFn(params, bars) }))\n    .sort((x, y) => (y.score - x.score) ||\n      (firstKey ? x.params[firstKey] - y.params[firstKey] : 0));\n}\n\nfunction isTransferable(value) {\n  function scan(v) {\n    if (typeof v === "function") return false;\n    if (v === null || typeof v !== "object") return true;\n    if (Array.isArray(v)) return v.every(scan);\n    if (v instanceof Map || v instanceof Set) return false;\n    return Object.values(v).every(scan);\n  }\n  if (!scan(value)) return false;\n  try { JSON.parse(JSON.stringify(value)); } catch (e) { return false; }\n  return true;\n}',
        hints: ['<code>buildJob</code> is a nested loop over the two value lists, using computed property names.',
                'The sort chains the score comparison with a tie-break on the first parameter.',
                '<code>isTransferable</code> needs a recursive scan — a function anywhere inside disqualifies the whole value.'],
        tests: { checks: [
          { name: 'buildJob produces every combination', expose: ['buildJob'],
            run: function (s, h) {
              var job = s.buildJob({ fast: [5, 9], slow: [21, 34] });
              if (job.length !== 4) return 'expected 4 combinations, got ' + job.length;
              return h.eq(job[0], { fast: 5, slow: 21 }) ? true : 'the first entry was ' + JSON.stringify(job[0]);
            } },
          { name: 'the job is plain data', expose: ['buildJob', 'isTransferable'],
            run: function (s) {
              var job = s.buildJob({ fast: [5, 9], slow: [21, 34] });
              return s.isTransferable(job) === true ? true : 'the job should survive structured cloning';
            } },
          { name: 'runJob sorts by score then by the first parameter', expose: ['buildJob', 'runJob'],
            run: function (s) {
              var job = s.buildJob({ fast: [5, 9, 13], slow: [21] });
              var out = s.runJob(job, [], function (p) { return p.fast === 9 ? 10 : 5; });
              if (out[0].params.fast !== 9) return 'the best score should be first';
              return (out[1].params.fast === 5 && out[2].params.fast === 13)
                ? true : 'ties should break on the first parameter ascending';
            } },
          { name: 'isTransferable rejects functions', expose: ['isTransferable'],
            run: function (s) {
              if (s.isTransferable({ a: 1, fn: function () {} }) !== false) return 'a function should disqualify it';
              if (s.isTransferable([1, function () {}]) !== false) return 'a function in an array should disqualify it';
              return s.isTransferable({ deep: { fn: function () {} } }) === false
                ? true : 'a nested function should disqualify it';
            } },
          { name: 'isTransferable accepts plain data', expose: ['isTransferable'],
            run: function (s) {
              return s.isTransferable({ a: 1, b: [1, 2, { c: 'x' }], d: null }) === true
                ? true : 'plain nested data should be transferable';
            } },
          { name: 'isTransferable rejects Maps and Sets', expose: ['isTransferable'],
            run: function (s) {
              return (s.isTransferable({ m: new Map() }) === false && s.isTransferable({ s: new Set() }) === false)
                ? true : 'Maps and Sets do not survive a JSON round trip';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What can a Web Worker access?',
        options: ['The DOM', 'Only what is sent to it by message', 'Your global variables', 'Everything the main thread can'],
        answer: 1,
        explain: 'No DOM, no shared scope. The isolation is what makes the parallelism safe.' },
      { q: 'What happens to a class instance sent via <code>postMessage</code>?',
        options: ['It arrives intact', 'It arrives as a plain object, losing its methods', 'It throws', 'It is passed by reference'],
        answer: 1,
        explain: 'Structured cloning copies data, not prototypes. Send data and let the worker hold the code.' },
      { q: 'Why give each request an id?',
        options: ['For logging', 'So concurrent responses can be matched to the right request', 'For security', 'It is optional'],
        answer: 1,
        explain: 'Without an id, two jobs in flight are indistinguishable when their results come back.' }
    ],
    recap: [
      'Workers run in parallel with no DOM and no shared scope.',
      'Messages are structured-cloned: functions and prototypes do not survive.',
      'Tag requests with an id so replies can be matched.',
      'Report progress periodically, not per iteration.'
    ],
    vocab: [
      { term: 'Structured clone', def: 'The deep-copy algorithm used to pass messages between threads. Drops functions, prototypes and DOM nodes.' },
      { term: 'Message protocol', def: 'The agreed shape of messages between two sides — usually a type, an id and a payload.' }
    ]
  });


  C.push({
    id: 'd089', day: 89, module: 7, minutes: 30,
    title: 'Testing Your Own Code',
    subtitle: 'Building the harness, and finding the cases you would not think of.',
    goal: '<b>Goal:</b> write a tiny test runner and use property-based tests to find the inputs you would never have chosen.',
    objectives: [
      'Build a minimal assertion and test runner',
      'Write tests that describe behaviour, not implementation',
      'Use property-based testing to generate inputs',
      'Shrink a failing case to something readable'
    ],
    sections: [
      { h: 'A test runner is about thirty lines',
        body: '<p>You do not need a framework to start. Collect named functions, run them, catch what throws, and report.</p>',
        code: 'function makeRunner() {\n  const tests = [];\n  return {\n    test(name, fn) { tests.push({ name, fn }); },\n    run() {\n      const results = tests.map(({ name, fn }) => {\n        try { fn(); return { name, pass: true }; }\n        catch (e) { return { name, pass: false, error: e.message }; }\n      });\n      const passed = results.filter(r => r.pass).length;\n      return { results, passed, total: results.length };\n    }\n  };\n}\n\nconst r = makeRunner();\nr.test("2 + 2 is 4", () => { if (2 + 2 !== 4) throw new Error("arithmetic broke"); });\nr.test("this one fails", () => { throw new Error("as expected"); });\nconsole.log(r.run());' },
      { h: 'Test behaviour, not implementation',
        body: '<p>A test asserting that <code>sma</code> uses a running sum will break the moment you refactor, without ever having found a bug. A test asserting that <code>sma([10,12,11], 3)</code> is 11 keeps working through any rewrite.</p>' +
              '<div class="note note-tip"><b>The rule</b>If a correct refactor breaks your test, the test was measuring the wrong thing. Assert on inputs and outputs.</div>' },
      { h: 'Property-based testing',
        body: '<p>Instead of listing examples, state a property that must always hold and let the machine generate hundreds of inputs to attack it.</p>' +
              '<p>Good properties for indicator code: the output length always matches the input; an SMA always sits between the window\'s minimum and maximum; RSI is always between 0 and 100; reversing a sorted array and sorting it again gives the same result.</p>',
        code: 'function makeRng(seed) {\n  let s = seed >>> 0;\n  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };\n}\n\nfunction sma(series, n) {\n  return series.map((_, i) => i < n - 1 ? null\n    : series.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n);\n}\n\nconst rng = makeRng(7);\nlet failures = 0;\nfor (let t = 0; t < 200; t++) {\n  const len = 5 + Math.floor(rng() * 30);\n  const series = Array.from({ length: len }, () => rng() * 100);\n  const out = sma(series, 5);\n  out.forEach((v, i) => {\n    if (v === null) return;\n    const w = series.slice(i - 4, i + 1);\n    if (v < Math.min(...w) - 1e-9 || v > Math.max(...w) + 1e-9) failures++;\n  });\n}\nconsole.log("property violations:", failures);' },
      { h: 'Shrinking',
        body: '<p>A property test that fails on a 300-element array of random floats tells you nothing useful. <strong>Shrinking</strong> repeatedly simplifies the failing input — halving the array, rounding the numbers — while the failure persists, until you are left with the smallest case that still breaks.</p>',
        code: 'function shrinkArray(arr, stillFails) {\n  let current = arr;\n  let changed = true;\n  while (changed) {\n    changed = false;\n    const half = current.slice(0, Math.floor(current.length / 2));\n    if (half.length && stillFails(half)) { current = half; changed = true; continue; }\n    const tail = current.slice(Math.floor(current.length / 2));\n    if (tail.length && stillFails(tail)) { current = tail; changed = true; }\n  }\n  return current;\n}\n\nconsole.log(shrinkArray([1, 2, 3, 99, 5, 6, 7, 8], a => a.includes(99)));' }
    ],
    parsons: {
      prompt: 'Run a test and record whether it threw.',
      lines: [
        'try {',
        '  fn();',
        '  return { name, pass: true };',
        '} catch (e) {',
        '  return { name, pass: false, error: e.message };',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeRunner()', difficulty: 'Core',
        prompt: 'Write <code>makeRunner()</code> returning:<ul>' +
          '<li><code>test(name, fn)</code> — register a test</li>' +
          '<li><code>run()</code> — run them all in registration order, returning <code>{ results, passed, failed, total }</code></li></ul>' +
          'A result is <code>{ name, pass: true }</code> or <code>{ name, pass: false, error }</code> with the thrown message. One failing test must not stop the others.',
        expose: ['makeRunner'],
        starter: 'function makeRunner() {\n  // { test, run }\n}\n',
        solution: 'function makeRunner() {\n  const tests = [];\n  return {\n    test(name, fn) { tests.push({ name, fn }); },\n    run() {\n      const results = tests.map(({ name, fn }) => {\n        try { fn(); return { name, pass: true }; }\n        catch (e) { return { name, pass: false, error: e.message }; }\n      });\n      const passed = results.filter(r => r.pass).length;\n      return { results, passed, failed: results.length - passed, total: results.length };\n    }\n  };\n}',
        hints: ['Collect the tests in an array in the closure.',
                'The try/catch goes inside the map, so one failure cannot stop the run.'],
        tests: { checks: [
          { name: 'runs passing and failing tests', expose: ['makeRunner'],
            run: function (s) {
              var r = s.makeRunner();
              r.test('ok', function () {});
              r.test('bad', function () { throw new Error('boom'); });
              var out = r.run();
              if (out.total !== 2) return 'total should be 2';
              if (out.passed !== 1 || out.failed !== 1) return 'expected 1 pass and 1 fail';
              if (out.results[0].pass !== true) return 'the first test should pass';
              return out.results[1].error === 'boom' ? true : 'the error message was ' + out.results[1].error;
            } },
          { name: 'a failure does not stop later tests', expose: ['makeRunner'],
            run: function (s) {
              var ran = 0;
              var r = s.makeRunner();
              r.test('a', function () { ran++; throw new Error('x'); });
              r.test('b', function () { ran++; });
              r.run();
              return ran === 2 ? true : 'only ' + ran + ' tests ran';
            } },
          { name: 'preserves registration order', expose: ['makeRunner'],
            run: function (s) {
              var r = s.makeRunner();
              ['first', 'second', 'third'].forEach(function (n) { r.test(n, function () {}); });
              var names = r.run().results.map(function (x) { return x.name; }).join(',');
              return names === 'first,second,third' ? true : 'order was ' + names;
            } },
          { name: 'no tests gives an empty run', expose: ['makeRunner'],
            run: function (s, h) {
              return h.eq(s.makeRunner().run(), { results: [], passed: 0, failed: 0, total: 0 })
                ? true : 'expected an empty result';
            } }
        ] } },
      { id: 'e2', title: 'checkProperty()', difficulty: 'Core',
        prompt: 'Write <code>checkProperty({ generate, property, runs, seed })</code> where <code>generate(rng)</code> builds one input and <code>property(input)</code> returns <code>true</code> when it holds.<br>' +
          'Use the seeded generator from day 79. Return <code>{ passed, failed, firstFailure, runs }</code>, where <code>firstFailure</code> is the first input that failed (or threw), or <code>null</code>.<br>' +
          'Keep going after a failure so the counts are complete.',
        expose: ['checkProperty'],
        starter: 'function makeRng(seed) {\n  let s = seed >>> 0;\n  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };\n}\n\nfunction checkProperty({ generate, property, runs, seed }) {\n  // { passed, failed, firstFailure, runs }\n}\n',
        solution: 'function makeRng(seed) {\n  let s = seed >>> 0;\n  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };\n}\n\nfunction checkProperty({ generate, property, runs, seed }) {\n  const rng = makeRng(seed);\n  let passed = 0, failed = 0, firstFailure = null;\n  for (let i = 0; i < runs; i++) {\n    const input = generate(rng);\n    let ok = false;\n    try { ok = property(input) === true; } catch (e) { ok = false; }\n    if (ok) passed++;\n    else {\n      failed++;\n      if (firstFailure === null) firstFailure = input;\n    }\n  }\n  return { passed, failed, firstFailure, runs };\n}',
        hints: ['Create the generator once, before the loop, so each input differs.',
                'A property that throws counts as a failure.',
                'Record the first failing input only, but keep counting the rest.'],
        tests: { checks: [
          { name: 'a property that always holds passes every run', expose: ['checkProperty'],
            run: function (s) {
              var r = s.checkProperty({
                generate: function (rng) { return rng() * 100; },
                property: function (v) { return v >= 0 && v < 100; },
                runs: 200, seed: 1
              });
              return (r.passed === 200 && r.failed === 0 && r.firstFailure === null)
                ? true : 'got ' + JSON.stringify({ passed: r.passed, failed: r.failed });
            } },
          { name: 'a property that never holds fails every run', expose: ['checkProperty'],
            run: function (s) {
              var r = s.checkProperty({
                generate: function (rng) { return rng(); },
                property: function () { return false; },
                runs: 50, seed: 1
              });
              if (r.failed !== 50) return 'expected 50 failures, got ' + r.failed;
              return r.firstFailure !== null ? true : 'firstFailure should be recorded';
            } },
          { name: 'a throwing property counts as a failure', expose: ['checkProperty'],
            run: function (s) {
              var r = s.checkProperty({
                generate: function (rng) { return rng(); },
                property: function () { throw new Error('bad'); },
                runs: 10, seed: 1
              });
              return r.failed === 10 ? true : 'a throwing property should fail, got ' + r.failed;
            } },
          { name: 'is reproducible for a seed', expose: ['checkProperty'],
            run: function (s) {
              var opts = {
                generate: function (rng) { return Math.floor(rng() * 1000); },
                property: function (v) { return v < 500; },
                runs: 100, seed: 42
              };
              var a = s.checkProperty(opts), b = s.checkProperty(opts);
              return (a.failed === b.failed && a.firstFailure === b.firstFailure)
                ? true : 'the same seed produced different results';
            } },
          { name: 'finds a real violation', expose: ['checkProperty'],
            run: function (s) {
              var r = s.checkProperty({
                generate: function (rng) { return Math.floor(rng() * 1000); },
                property: function (v) { return v < 900; },
                runs: 500, seed: 3
              });
              return r.failed > 0 ? true : 'a property violated 10% of the time should have failed somewhere';
            } }
        ] } },
      { id: 'e3', title: 'shrink()', difficulty: 'Stretch',
        prompt: 'Write <code>shrink(input, stillFails)</code> reducing a failing array to a smaller one that still fails.<br>' +
          'Repeatedly try, in order, until nothing helps:<ol>' +
          '<li>the first half</li><li>the second half</li>' +
          '<li>each single-element removal, left to right — take the first that still fails</li></ol>' +
          'Return the smallest array reached. If <code>stillFails</code> is false for the original, return it unchanged.',
        starter: 'function shrink(input, stillFails) {\n  // reduce a failing case to a minimal one\n}\n',
        solution: 'function shrink(input, stillFails) {\n  if (!stillFails(input)) return input;\n  let current = input;\n  let progress = true;\n  while (progress) {\n    progress = false;\n    const mid = Math.floor(current.length / 2);\n    const first = current.slice(0, mid);\n    if (first.length && first.length < current.length && stillFails(first)) {\n      current = first; progress = true; continue;\n    }\n    const second = current.slice(mid);\n    if (second.length && second.length < current.length && stillFails(second)) {\n      current = second; progress = true; continue;\n    }\n    for (let i = 0; i < current.length; i++) {\n      const without = current.slice(0, i).concat(current.slice(i + 1));\n      if (stillFails(without)) { current = without; progress = true; break; }\n    }\n  }\n  return current;\n}',
        hints: ['Loop until a full pass makes no progress at all.',
                'Guard against a "smaller" candidate that is not actually smaller, or the loop never ends.',
                'Single-element removal is the fallback when neither half reproduces the failure.'],
        tests: { fn: 'shrink', cases: [
          { args: [[1, 2, 3, 99, 5, 6, 7, 8], function (a) { return a.indexOf(99) >= 0; }],
            expect: [99], name: 'reduces to the single offending element' },
          { args: [[1, 2, 3], function () { return false; }],
            expect: [1, 2, 3], name: 'a passing input is returned unchanged' },
          { args: [[5], function (a) { return a.length > 0; }],
            expect: [5], name: 'a single element cannot shrink further' }
        ], checks: [
          { name: 'finds a minimal pair', expose: ['shrink'],
            run: function (s) {
              var input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
              var out = s.shrink(input, function (a) {
                return a.indexOf(3) >= 0 && a.indexOf(9) >= 0;
              });
              return out.length === 2 ? true : 'expected 2 elements, got ' + JSON.stringify(out);
            } },
          { name: 'the result still fails', expose: ['shrink'],
            run: function (s) {
              var pred = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) > 20; };
              var out = s.shrink([1, 2, 3, 40, 5, 6], pred);
              return pred(out) ? true : 'the shrunk case no longer reproduces the failure';
            } },
          { name: 'terminates on a large input', expose: ['shrink'],
            run: function (s) {
              var big = [];
              for (var i = 0; i < 300; i++) big.push(i);
              var t0 = Date.now();
              var out = s.shrink(big, function (a) { return a.indexOf(250) >= 0; });
              if (Date.now() - t0 > 2000) return 'took too long — check the termination condition';
              return out.length === 1 ? true : 'expected 1 element, got ' + out.length;
            } }
        ] } }
    ],
    quiz: [
      { q: 'A correct refactor breaks one of your tests. What does that tell you?',
        options: ['The refactor is wrong', 'The test was asserting on implementation rather than behaviour', 'The test is fine', 'You need more tests'],
        answer: 1,
        explain: 'Tests should survive any rewrite that preserves behaviour. One that does not was measuring the wrong thing.' },
      { q: 'What does property-based testing generate?',
        options: ['Documentation', 'Many inputs to attack a stated invariant', 'Performance data', 'Mocks'],
        answer: 1,
        explain: 'You state what must always be true, and the machine hunts for a counterexample among inputs you would never have chosen.' },
      { q: 'Why shrink a failing input?',
        options: ['To make it run faster', 'A 300-element random failure is unreadable; a two-element one is a bug report', 'To fix it automatically', 'To save memory'],
        answer: 1,
        explain: 'The minimal case usually makes the cause obvious, and it becomes a permanent regression test.' }
    ],
    recap: [
      'A useful test runner is about thirty lines.',
      'Assert on inputs and outputs, never on implementation.',
      'Properties find inputs you would not have thought of.',
      'Shrink a failure until it is small enough to read.'
    ],
    vocab: [
      { term: 'Property-based testing', def: 'Testing an invariant against generated inputs rather than hand-picked examples.' },
      { term: 'Shrinking', def: 'Automatically simplifying a failing input while it still fails, to produce a minimal reproducible case.' }
    ]
  });

  C.push({
    id: 'd090', day: 90, module: 7, minutes: 35, boss: true,
    title: 'Boss: The Optimisation Engine',
    subtitle: 'A parameter search that is fast, resumable, and honest about overfitting.',
    goal: '<b>Goal:</b> build the sweep engine — grid generation, caching, ranking, and a robustness pass that resists curve-fitting.',
    objectives: [
      'Generate an N-dimensional parameter grid',
      'Cache and resume an interrupted sweep',
      'Rank by robustness rather than by peak',
      'Report the sweep honestly'
    ],
    sections: [
      { h: 'The grid is a cartesian product',
        body: '<p>Any number of parameters, each with a list of values. The generator has to work for two or five without special-casing either.</p>',
        code: 'function cartesian(grid) {\n  const names = Object.keys(grid);\n  return names.reduce((acc, name) =>\n    acc.flatMap(combo => grid[name].map(v => ({ ...combo, [name]: v }))), [{}]);\n}\n\nconsole.log(cartesian({ fast: [5, 9], slow: [21, 34] }));\nconsole.log(cartesian({ a: [1, 2], b: [3, 4], c: [5, 6] }).length, "combinations");' },
      { h: 'Cache and resume',
        body: '<p>A sweep over ten thousand combinations takes minutes. If it is interrupted, restarting from zero is unacceptable. Key each result by a canonical string of its parameters and skip anything already scored.</p>',
        code: 'function keyOf(params) {\n  return Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("|");\n}\n\nconsole.log(keyOf({ slow: 21, fast: 9 }));\nconsole.log(keyOf({ fast: 9, slow: 21 }));   // same key, order-independent' },
      { h: 'Rank by the neighbourhood',
        body: '<p>Day 78 established the principle; here it becomes part of the engine. Two combinations are neighbours if every parameter is either equal or one step apart in its value list. Score each combination by the average of itself and its neighbours, and report both rankings.</p>' +
              '<div class="note note-warn"><b>Report the peak too, and the gap</b>If the raw best and the robust best are far apart, that is the single most useful thing the sweep can tell you: the peak was luck.</div>' +
              '<p>One caveat worth knowing: a combination at the edge of the grid has fewer neighbours, so its average is taken over a smaller and often more favourable set. Edge cells can win the robustness ranking for that reason alone — which is a good argument for extending the grid past the range you actually care about.</p>' },
      { h: 'What the report must contain',
        body: '<ul><li>How many combinations were evaluated</li>' +
              '<li>The raw best and the robust best, with their scores</li>' +
              '<li>Whether they agree</li>' +
              '<li>The spread of scores, so a flat surface is visible</li></ul>' +
              '<p>A sweep that reports only its winner is indistinguishable from a sweep over random data.</p>' }
    ],
    parsons: {
      prompt: 'Build a cartesian product of parameter values.',
      lines: [
        'const names = Object.keys(grid);',
        'return names.reduce((acc, name) =>',
        '  acc.flatMap(combo => grid[name].map(v => ({ ...combo, [name]: v }))),',
        '  [{}]);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'cartesian() and keyOf()', difficulty: 'Boss · part 1',
        prompt: 'Write two functions:<ul>' +
          '<li><code>cartesian(grid)</code> — every combination of <code>{ name: [values] }</code>, for any number of parameters. An empty grid gives <code>[{}]</code>; a parameter with no values gives <code>[]</code>.</li>' +
          '<li><code>keyOf(params)</code> — a canonical string, keys sorted, formatted <code>"a=1|b=2"</code>, so key order cannot matter</li></ul>',
        expose: ['cartesian', 'keyOf'],
        starter: 'function cartesian(grid) {\n  // every combination\n}\n\nfunction keyOf(params) {\n  // an order-independent canonical key\n}\n',
        solution: 'function cartesian(grid) {\n  return Object.keys(grid).reduce(\n    (acc, name) => acc.flatMap(combo => grid[name].map(v => ({ ...combo, [name]: v }))),\n    [{}]\n  );\n}\n\nfunction keyOf(params) {\n  return Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("|");\n}',
        hints: ['<code>reduce</code> over the parameter names, expanding the accumulator each time.',
                'The seed is <code>[{}]</code> — one empty combination.',
                'Sorting the keys is what makes the key independent of insertion order.'],
        tests: { checks: [
          { name: 'two parameters give every pair', expose: ['cartesian'],
            run: function (s) {
              var out = s.cartesian({ fast: [5, 9], slow: [21, 34] });
              if (out.length !== 4) return 'expected 4, got ' + out.length;
              var keys = out.map(function (c) { return c.fast + '/' + c.slow; }).sort().join(',');
              return keys === '5/21,5/34,9/21,9/34' ? true : 'got ' + keys;
            } },
          { name: 'three parameters multiply out', expose: ['cartesian'],
            run: function (s) {
              return s.cartesian({ a: [1, 2], b: [3, 4], c: [5, 6] }).length === 8
                ? true : 'expected 8 combinations';
            } },
          { name: 'an empty grid gives one empty combination', expose: ['cartesian'],
            run: function (s, h) {
              return h.eq(s.cartesian({}), [{}]) ? true : 'expected [{}]';
            } },
          { name: 'a parameter with no values gives nothing', expose: ['cartesian'],
            run: function (s, h) {
              return h.eq(s.cartesian({ a: [1, 2], b: [] }), []) ? true : 'expected []';
            } },
          { name: 'keyOf is order-independent', expose: ['keyOf'],
            run: function (s) {
              var a = s.keyOf({ slow: 21, fast: 9 });
              var b = s.keyOf({ fast: 9, slow: 21 });
              if (a !== b) return 'the same parameters gave different keys';
              return a === 'fast=9|slow=21' ? true : 'got ' + a;
            } },
          { name: 'different parameters give different keys', expose: ['keyOf'],
            run: function (s) {
              return s.keyOf({ a: 1 }) !== s.keyOf({ a: 2 }) ? true : 'distinct parameters collided';
            } }
        ] } },
      { id: 'e2', title: 'runSweep() with caching', difficulty: 'Boss · part 2',
        prompt: 'Write <code>runSweep(grid, evaluate, cache)</code> where <code>cache</code> is a <code>Map</code> from key to score (possibly pre-populated).<ul>' +
          '<li>Evaluate every combination, skipping any already in the cache.</li>' +
          '<li>Store new scores in the cache.</li>' +
          '<li>Return <code>{ results, evaluated, cached }</code> — <code>results</code> being <code>{ params, key, score }</code> for every combination in grid order, and the two counts describing how many were computed versus reused.</li></ul>' +
          '<span class="muted"><code>cartesian</code> and <code>keyOf</code> are in the starter.</span>',
        starter: 'function cartesian(grid) {\n  return Object.keys(grid).reduce(\n    (acc, name) => acc.flatMap(combo => grid[name].map(v => ({ ...combo, [name]: v }))), [{}]);\n}\nfunction keyOf(params) {\n  return Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("|");\n}\n\nfunction runSweep(grid, evaluate, cache) {\n  // { results, evaluated, cached }\n}\n',
        solution: 'function cartesian(grid) {\n  return Object.keys(grid).reduce(\n    (acc, name) => acc.flatMap(combo => grid[name].map(v => ({ ...combo, [name]: v }))), [{}]);\n}\nfunction keyOf(params) {\n  return Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("|");\n}\n\nfunction runSweep(grid, evaluate, cache) {\n  const combos = cartesian(grid);\n  let evaluated = 0, cached = 0;\n  const results = combos.map(params => {\n    const key = keyOf(params);\n    if (cache.has(key)) {\n      cached++;\n      return { params, key, score: cache.get(key) };\n    }\n    const score = evaluate(params);\n    cache.set(key, score);\n    evaluated++;\n    return { params, key, score };\n  });\n  return { results, evaluated, cached };\n}',
        hints: ['Check <code>cache.has(key)</code> rather than the value — a cached score of 0 is still a hit.',
                'Count the two paths separately so the caller can see the saving.',
                'Results come back in grid order regardless of which were cached.'],
        tests: { checks: [
          { name: 'evaluates every combination on a cold cache', expose: ['runSweep'],
            run: function (s) {
              var calls = 0;
              var r = s.runSweep({ a: [1, 2], b: [3, 4] }, function () { calls++; return 1; }, new Map());
              if (r.results.length !== 4) return 'expected 4 results';
              if (calls !== 4) return 'evaluate ran ' + calls + ' times';
              return (r.evaluated === 4 && r.cached === 0) ? true : 'counts were ' + r.evaluated + '/' + r.cached;
            } },
          { name: 'reuses a warm cache', expose: ['runSweep'],
            run: function (s) {
              var cache = new Map();
              s.runSweep({ a: [1, 2] }, function (p) { return p.a * 10; }, cache);
              var calls = 0;
              var r = s.runSweep({ a: [1, 2] }, function () { calls++; return 0; }, cache);
              if (calls !== 0) return 'evaluate should not have run at all, ran ' + calls;
              if (r.cached !== 2) return 'expected 2 cache hits, got ' + r.cached;
              return r.results[0].score === 10 ? true : 'the cached score was not returned';
            } },
          { name: 'resumes a partial sweep', expose: ['runSweep'],
            run: function (s) {
              var cache = new Map();
              cache.set('a=1', 99);
              var calls = 0;
              var r = s.runSweep({ a: [1, 2, 3] }, function () { calls++; return 0; }, cache);
              if (calls !== 2) return 'expected 2 new evaluations, got ' + calls;
              return (r.evaluated === 2 && r.cached === 1) ? true : 'counts were ' + r.evaluated + '/' + r.cached;
            } },
          { name: 'a cached score of 0 counts as a hit', expose: ['runSweep'],
            run: function (s) {
              var cache = new Map();
              cache.set('a=1', 0);
              var calls = 0;
              s.runSweep({ a: [1] }, function () { calls++; return 5; }, cache);
              return calls === 0 ? true : 'a cached 0 was treated as a miss';
            } },
          { name: 'every result carries its key', expose: ['runSweep'],
            run: function (s) {
              var r = s.runSweep({ fast: [9], slow: [21] }, function () { return 1; }, new Map());
              return r.results[0].key === 'fast=9|slow=21' ? true : 'the key was ' + r.results[0].key;
            } }
        ] } },
      { id: 'e3', title: 'optimisationReport()', difficulty: 'Boss · final',
        prompt: 'Write <code>optimisationReport(grid, evaluate)</code> returning the full honest report:<br>' +
          '<code>{ combinations, best, robust, agree, scoreSpread }</code><ul>' +
          '<li><code>best</code> — <code>{ params, score }</code> with the highest raw score</li>' +
          '<li><code>robust</code> — <code>{ params, score }</code> with the highest <em>neighbourhood</em> score, where two combinations are neighbours when every parameter is at the same index or one index apart in its value list, and the neighbourhood score is the mean of the combination and all its neighbours</li>' +
          '<li><code>agree</code> — whether <code>best</code> and <code>robust</code> are the same combination</li>' +
          '<li><code>scoreSpread</code> — <code>max − min</code> across all raw scores, or <code>0</code> when there is nothing</li></ul>' +
          '<span class="muted">Ties on either ranking break toward the combination that appears first in grid order.</span>',
        starter: 'function cartesian(grid) {\n  return Object.keys(grid).reduce(\n    (acc, name) => acc.flatMap(combo => grid[name].map(v => ({ ...combo, [name]: v }))), [{}]);\n}\n\nfunction optimisationReport(grid, evaluate) {\n  // { combinations, best, robust, agree, scoreSpread }\n}\n',
        solution: 'function cartesian(grid) {\n  return Object.keys(grid).reduce(\n    (acc, name) => acc.flatMap(combo => grid[name].map(v => ({ ...combo, [name]: v }))), [{}]);\n}\n\nfunction optimisationReport(grid, evaluate) {\n  const names = Object.keys(grid);\n  const combos = cartesian(grid);\n  if (!combos.length) {\n    return { combinations: 0, best: null, robust: null, agree: true, scoreSpread: 0 };\n  }\n  const scored = combos.map(params => ({\n    params,\n    score: evaluate(params),\n    idx: names.map(n => grid[n].indexOf(params[n]))\n  }));\n\n  let best = scored[0];\n  scored.forEach(c => { if (c.score > best.score) best = c; });\n\n  let robust = null, bestNeighbourhood = -Infinity;\n  scored.forEach(c => {\n    const group = scored.filter(o =>\n      o.idx.every((v, k) => Math.abs(v - c.idx[k]) <= 1));\n    const avg = group.reduce((a, o) => a + o.score, 0) / group.length;\n    if (avg > bestNeighbourhood) { bestNeighbourhood = avg; robust = { params: c.params, score: avg }; }\n  });\n\n  const scores = scored.map(c => c.score);\n  return {\n    combinations: combos.length,\n    best: { params: best.params, score: best.score },\n    robust,\n    agree: JSON.stringify(best.params) === JSON.stringify(robust.params),\n    scoreSpread: Math.max(...scores) - Math.min(...scores)\n  };\n}',
        hints: ['Store each combination\'s <em>index</em> in every value list — neighbourhood is defined on indexes, not values.',
                'Two combinations are neighbours when every index differs by at most 1.',
                'Iterating with a strict <code>&gt;</code> comparison keeps the first of any tie.'],
        tests: { checks: [
          { name: 'counts the combinations', expose: ['optimisationReport'],
            run: function (s) {
              var r = s.optimisationReport({ a: [1, 2, 3], b: [1, 2] }, function () { return 1; });
              return r.combinations === 6 ? true : 'expected 6, got ' + r.combinations;
            } },
          { name: 'best picks the raw peak', expose: ['optimisationReport'],
            run: function (s) {
              var r = s.optimisationReport({ a: [1, 2, 3], b: [1, 2, 3] },
                function (p) { return (p.a === 2 && p.b === 2) ? 100 : 1; });
              return (r.best.score === 100 && r.best.params.a === 2) ? true : 'best was ' + JSON.stringify(r.best);
            } },
          { name: 'robust prefers a plateau over a spike', expose: ['optimisationReport'],
            run: function (s) {
              var r = s.optimisationReport({ a: [0, 1, 2, 3, 4], b: [0, 1, 2, 3, 4] }, function (p) {
                if (p.a === 0 && p.b === 0) return 50;
                if (p.a >= 3 && p.b >= 3) return 20;
                return 0;
              });
              if (r.best.score !== 50) return 'best should still be the spike';
              return (r.robust.params.a >= 3 && r.robust.params.b >= 3)
                ? true : 'robust chose ' + JSON.stringify(r.robust.params);
            } },
          { name: 'agree is false when the two rankings differ', expose: ['optimisationReport'],
            run: function (s) {
              var r = s.optimisationReport({ a: [0, 1, 2, 3, 4], b: [0, 1, 2, 3, 4] }, function (p) {
                if (p.a === 0 && p.b === 0) return 50;
                if (p.a >= 3 && p.b >= 3) return 20;
                return 0;
              });
              return r.agree === false ? true : 'the spike and the plateau are different combinations';
            } },
          { name: 'agree is true on a smooth surface', expose: ['optimisationReport'],
            run: function (s) {
              var r = s.optimisationReport({ a: [0, 1, 2, 3, 4], b: [0, 1, 2, 3, 4] },
                function (p) { return -(Math.abs(p.a - 2) + Math.abs(p.b - 2)); });
              return r.agree === true ? true : 'a smooth central peak should agree, got ' + JSON.stringify(r);
            } },
          { name: 'scoreSpread reports the range', expose: ['optimisationReport'],
            run: function (s) {
              var r = s.optimisationReport({ a: [1, 2, 3] }, function (p) { return p.a * 10; });
              return r.scoreSpread === 20 ? true : 'expected 20, got ' + r.scoreSpread;
            } },
          { name: 'a flat surface has zero spread and agrees', expose: ['optimisationReport'],
            run: function (s) {
              var r = s.optimisationReport({ a: [1, 2, 3] }, function () { return 5; });
              return (r.scoreSpread === 0 && r.agree === true) ? true : 'got ' + JSON.stringify(r);
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why key the cache on sorted parameter names?',
        options: ['Speed', 'So the same combination produces the same key regardless of key order', 'To save memory', 'It is not necessary'],
        answer: 1,
        explain: '<code>{fast:9, slow:21}</code> and <code>{slow:21, fast:9}</code> are the same combination and must hit the same cache entry.' },
      { q: 'What does it mean when the raw best and the robust best disagree?',
        options: ['A bug', 'The peak is probably noise, and the plateau is the safer choice', 'The grid is too small', 'Nothing'],
        answer: 1,
        explain: 'It is the single most useful thing a sweep can tell you, and it is invisible if you report only the winner.' },
      { q: 'Why report the score spread?',
        options: ['To fill the report', 'A near-flat surface means the parameter barely matters, which is worth knowing', 'For sorting', 'It is required'],
        answer: 1,
        explain: 'If every combination scores about the same, the "optimal" one was chosen by rounding error.' }
    ],
    recap: [
      'A grid is a cartesian product — build it for any number of parameters.',
      'Cache on a canonical key so a sweep can resume.',
      'Rank by neighbourhood as well as by peak, and report both.',
      'A sweep that reports only its winner tells you nothing.'
    ],
    vocab: [
      { term: 'Grid search', def: 'Exhaustively evaluating every combination in a parameter grid. Simple, parallelisable, and easy to overfit with.' },
      { term: 'Robust optimum', def: 'A parameter choice whose neighbours also perform well. Usually a better live bet than the raw maximum.' }
    ]
  });


  C.push({
    id: 'd091', day: 91, module: 7, minutes: 35,
    title: 'The Limit Order Book',
    subtitle: 'What is actually on the other side of your order.',
    goal: '<b>Goal:</b> build a working limit order book with price-time priority and matching.',
    objectives: [
      'Model bids and asks as price levels with queues',
      'Maintain best bid and best ask',
      'Match an incoming order against the book',
      'Explain price-time priority and partial fills'
    ],
    sections: [
      { h: 'The book is two sorted sides',
        body: '<p>Bids are buy orders sorted highest first; asks are sell orders sorted lowest first. The <strong>best bid</strong> and <strong>best ask</strong> are the top of each, and the gap between them is the spread.</p>' +
              '<p>At each price level, orders queue in arrival order. That is <strong>price-time priority</strong>: better price first, and among equal prices, whoever arrived first.</p>',
        code: 'const book = {\n  bids: [{ price: 5240.00, qty: 12 }, { price: 5239.75, qty: 30 }],\n  asks: [{ price: 5240.25, qty: 8 }, { price: 5240.50, qty: 25 }]\n};\n\nconst bestBid = book.bids[0], bestAsk = book.asks[0];\nconsole.log("bid", bestBid.price, "x", bestBid.qty);\nconsole.log("ask", bestAsk.price, "x", bestAsk.qty);\nconsole.log("spread:", (bestAsk.price - bestBid.price).toFixed(2));\nconsole.log("mid:", ((bestAsk.price + bestBid.price) / 2).toFixed(3));' },
      { h: 'A market order walks the book',
        body: '<p>A buy for more than the best ask\'s size consumes that level and moves to the next, at a worse price. This is <strong>market impact</strong>, and it is why size matters as much as direction.</p>',
        code: 'function walk(levels, qty) {\n  const fills = [];\n  let remaining = qty;\n  for (const level of levels) {\n    if (remaining <= 0) break;\n    const take = Math.min(remaining, level.qty);\n    fills.push({ price: level.price, qty: take });\n    remaining -= take;\n  }\n  return { fills, unfilled: remaining };\n}\n\nconst asks = [{ price: 5240.25, qty: 8 }, { price: 5240.50, qty: 25 }];\nconst r = walk(asks, 20);\nconsole.log(r.fills);\nconst avg = r.fills.reduce((a, f) => a + f.price * f.qty, 0) / (20 - r.unfilled);\nconsole.log("average fill:", avg.toFixed(4), "vs best ask 5240.25");' },
      { h: 'Adding and cancelling',
        body: '<p>A limit order that does not cross the spread rests in the book at its level, joining the back of that queue. A cancel removes it, and an empty level disappears entirely.</p>' +
              '<div class="note note-warn"><b>Keep the sides sorted, always</b>Every operation must preserve the ordering, or the "best" price is no longer the best. Insert into position rather than pushing and re-sorting the whole side on every message.</div>' },
      { h: 'Why the book explains slippage',
        body: '<p>Everything from module 6 about slippage falls out of this structure. The price you see quoted is the top level only; the price you get depends on how much size is resting there. A thin book means a large order walks several levels — which is exactly slippage, arrived at from first principles.</p>' }
    ],
    parsons: {
      prompt: 'Walk the ask side filling an order.',
      lines: [
        'let remaining = qty;',
        'for (const level of asks) {',
        '  if (remaining <= 0) break;',
        '  const take = Math.min(remaining, level.qty);',
        '  fills.push({ price: level.price, qty: take });',
        '  remaining -= take;',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'bookTop()', difficulty: 'Core',
        prompt: 'Write <code>bookTop(book)</code> where <code>book</code> is <code>{ bids, asks }</code>, each an array of <code>{ price, qty }</code> already sorted (bids descending, asks ascending).<br>' +
          'Return <code>{ bestBid, bestAsk, spread, mid, crossed }</code>:<ul>' +
          '<li><code>bestBid</code>/<code>bestAsk</code> — the top price on each side, or <code>null</code> when that side is empty</li>' +
          '<li><code>spread</code> and <code>mid</code> — <code>null</code> when either side is empty</li>' +
          '<li><code>crossed</code> — whether the best bid is at or above the best ask, which should never happen in a healthy book</li></ul>',
        starter: 'function bookTop(book) {\n  // { bestBid, bestAsk, spread, mid, crossed }\n}\n',
        solution: 'function bookTop(book) {\n  const bid = book.bids.length ? book.bids[0].price : null;\n  const ask = book.asks.length ? book.asks[0].price : null;\n  const both = bid !== null && ask !== null;\n  return {\n    bestBid: bid,\n    bestAsk: ask,\n    spread: both ? ask - bid : null,\n    mid: both ? (ask + bid) / 2 : null,\n    crossed: both ? bid >= ask : false\n  };\n}',
        hints: ['A one-sided book has no spread and no mid — return <code>null</code> for both.',
                'A crossed book means bid ≥ ask, which signals stale or corrupt data.'],
        tests: { fn: 'bookTop', approx: 1e-9, cases: [
          { args: [{ bids: [{ price: 5240, qty: 12 }], asks: [{ price: 5240.25, qty: 8 }] }],
            expect: { bestBid: 5240, bestAsk: 5240.25, spread: 0.25, mid: 5240.125, crossed: false } },
          { args: [{ bids: [], asks: [{ price: 5240.25, qty: 8 }] }],
            expect: { bestBid: null, bestAsk: 5240.25, spread: null, mid: null, crossed: false },
            name: 'a one-sided book has no spread' },
          { args: [{ bids: [], asks: [] }],
            expect: { bestBid: null, bestAsk: null, spread: null, mid: null, crossed: false } },
          { args: [{ bids: [{ price: 5241, qty: 1 }], asks: [{ price: 5240, qty: 1 }] }],
            expect: { bestBid: 5241, bestAsk: 5240, spread: -1, mid: 5240.5, crossed: true },
            name: 'a crossed book is flagged' }
        ] } },
      { id: 'e2', title: 'walkBook()', difficulty: 'Core',
        prompt: 'Write <code>walkBook(levels, qty)</code> filling <code>qty</code> against sorted price levels.<br>' +
          'Return <code>{ fills, filled, unfilled, averagePrice }</code>:<ul>' +
          '<li><code>fills</code> — <code>{ price, qty }</code> per level touched, in order, skipping any level that contributes nothing</li>' +
          '<li><code>averagePrice</code> — the size-weighted average of the fills, or <code>null</code> if nothing filled</li></ul>',
        starter: 'function walkBook(levels, qty) {\n  // { fills, filled, unfilled, averagePrice }\n}\n',
        solution: 'function walkBook(levels, qty) {\n  const fills = [];\n  let remaining = qty;\n  for (const level of levels) {\n    if (remaining <= 0) break;\n    const take = Math.min(remaining, level.qty);\n    if (take <= 0) continue;\n    fills.push({ price: level.price, qty: take });\n    remaining -= take;\n  }\n  const filled = qty - remaining;\n  const notional = fills.reduce((a, f) => a + f.price * f.qty, 0);\n  return {\n    fills,\n    filled,\n    unfilled: remaining,\n    averagePrice: filled > 0 ? notional / filled : null\n  };\n}',
        hints: ['Take the smaller of what you still need and what the level has.',
                'Stop as soon as nothing remains — later levels are untouched.',
                'The average is the notional divided by the filled quantity, not the mean of the prices.'],
        tests: { fn: 'walkBook', approx: 1e-9, cases: [
          { args: [[{ price: 5240.25, qty: 8 }, { price: 5240.5, qty: 25 }], 20],
            expect: { fills: [{ price: 5240.25, qty: 8 }, { price: 5240.5, qty: 12 }],
              filled: 20, unfilled: 0, averagePrice: (5240.25 * 8 + 5240.5 * 12) / 20 } },
          { args: [[{ price: 100, qty: 5 }], 5],
            expect: { fills: [{ price: 100, qty: 5 }], filled: 5, unfilled: 0, averagePrice: 100 },
            name: 'an exact fill touches one level' },
          { args: [[{ price: 100, qty: 5 }], 10],
            expect: { fills: [{ price: 100, qty: 5 }], filled: 5, unfilled: 5, averagePrice: 100 },
            name: 'a thin book leaves size unfilled' },
          { args: [[], 10],
            expect: { fills: [], filled: 0, unfilled: 10, averagePrice: null },
            name: 'an empty book fills nothing' },
          { args: [[{ price: 100, qty: 5 }], 0],
            expect: { fills: [], filled: 0, unfilled: 0, averagePrice: null } }
        ], checks: [{
          name: 'a larger order gets a worse average price', expose: ['walkBook'],
          run: function (s) {
            var asks = [{ price: 100, qty: 5 }, { price: 101, qty: 5 }, { price: 103, qty: 50 }];
            var small = s.walkBook(asks, 5).averagePrice;
            var large = s.walkBook(asks, 30).averagePrice;
            return large > small ? true : 'walking deeper into the book should cost more (' + small + ' vs ' + large + ')';
          }
        }] } },
      { id: 'e3', title: 'class OrderBook', difficulty: 'Stretch',
        prompt: 'Build a working book. <code>new OrderBook()</code> with:<ul>' +
          '<li><code>addLimit(side, price, qty, id)</code> — rest an order, keeping <code>bids</code> descending and <code>asks</code> ascending, joining the back of an existing level\'s queue</li>' +
          '<li><code>cancel(id)</code> — remove that order, deleting the level if it becomes empty; returns whether anything was removed</li>' +
          '<li><code>bestBid()</code> / <code>bestAsk()</code> — the top price on each side, or <code>null</code></li>' +
          '<li><code>marketOrder(side, qty)</code> — a buy walks the asks, a sell walks the bids; returns <code>{ fills, filled, unfilled }</code> and <strong>removes</strong> the consumed size from the book</li></ul>' +
          '<span class="muted">Each side is an array of <code>{ price, orders: [{ id, qty }] }</code>. Level quantity is the sum of its queue.</span>',
        expose: ['OrderBook'],
        starter: 'class OrderBook {\n  constructor() {\n    this.bids = [];   // [{ price, orders: [{ id, qty }] }], descending\n    this.asks = [];   // ascending\n  }\n\n  addLimit(side, price, qty, id) {}\n  cancel(id) {}\n  bestBid() {}\n  bestAsk() {}\n  marketOrder(side, qty) {}\n}\n',
        solution: 'class OrderBook {\n  constructor() {\n    this.bids = [];\n    this.asks = [];\n  }\n\n  addLimit(side, price, qty, id) {\n    const levels = side === "buy" ? this.bids : this.asks;\n    const existing = levels.find(l => l.price === price);\n    if (existing) { existing.orders.push({ id, qty }); return; }\n    const level = { price, orders: [{ id, qty }] };\n    const idx = levels.findIndex(l => side === "buy" ? l.price < price : l.price > price);\n    if (idx === -1) levels.push(level);\n    else levels.splice(idx, 0, level);\n  }\n\n  cancel(id) {\n    for (const levels of [this.bids, this.asks]) {\n      for (let i = 0; i < levels.length; i++) {\n        const at = levels[i].orders.findIndex(o => o.id === id);\n        if (at >= 0) {\n          levels[i].orders.splice(at, 1);\n          if (!levels[i].orders.length) levels.splice(i, 1);\n          return true;\n        }\n      }\n    }\n    return false;\n  }\n\n  bestBid() { return this.bids.length ? this.bids[0].price : null; }\n  bestAsk() { return this.asks.length ? this.asks[0].price : null; }\n\n  marketOrder(side, qty) {\n    const levels = side === "buy" ? this.asks : this.bids;\n    const fills = [];\n    let remaining = qty;\n    while (remaining > 0 && levels.length) {\n      const level = levels[0];\n      const order = level.orders[0];\n      const take = Math.min(remaining, order.qty);\n      fills.push({ price: level.price, qty: take, id: order.id });\n      order.qty -= take;\n      remaining -= take;\n      if (order.qty === 0) level.orders.shift();\n      if (!level.orders.length) levels.shift();\n    }\n    return { fills, filled: qty - remaining, unfilled: remaining };\n  }\n}',
        hints: ['Insert a new level before the first level that is worse than it, using <code>findIndex</code> and <code>splice</code>.',
                'Fill from the front of the front level\'s queue — that is price-time priority.',
                'Remove an order when its quantity reaches 0, and remove the level when its queue empties.'],
        tests: { checks: [
          { name: 'keeps both sides sorted', expose: ['OrderBook'],
            run: function (s) {
              var b = new s.OrderBook();
              b.addLimit('buy', 5239.75, 10, 1);
              b.addLimit('buy', 5240.00, 10, 2);
              b.addLimit('sell', 5240.50, 10, 3);
              b.addLimit('sell', 5240.25, 10, 4);
              if (b.bestBid() !== 5240) return 'best bid was ' + b.bestBid();
              if (b.bestAsk() !== 5240.25) return 'best ask was ' + b.bestAsk();
              var bidOrder = b.bids.map(function (l) { return l.price; }).join(',');
              var askOrder = b.asks.map(function (l) { return l.price; }).join(',');
              if (bidOrder !== '5240,5239.75') return 'bids were ' + bidOrder;
              return askOrder === '5240.25,5240.5' ? true : 'asks were ' + askOrder;
            } },
          { name: 'queues orders at the same price', expose: ['OrderBook'],
            run: function (s) {
              var b = new s.OrderBook();
              b.addLimit('buy', 5240, 10, 1);
              b.addLimit('buy', 5240, 5, 2);
              if (b.bids.length !== 1) return 'the same price should be one level, got ' + b.bids.length;
              var ids = b.bids[0].orders.map(function (o) { return o.id; }).join(',');
              return ids === '1,2' ? true : 'the queue order was ' + ids;
            } },
          { name: 'cancel removes the order and empty levels', expose: ['OrderBook'],
            run: function (s) {
              var b = new s.OrderBook();
              b.addLimit('buy', 5240, 10, 1);
              if (b.cancel(999) !== false) return 'cancelling an unknown id should return false';
              if (b.cancel(1) !== true) return 'cancelling a known id should return true';
              return (b.bids.length === 0 && b.bestBid() === null) ? true : 'the empty level was not removed';
            } },
          { name: 'a market buy walks the asks in price order', expose: ['OrderBook'],
            run: function (s, h) {
              var b = new s.OrderBook();
              b.addLimit('sell', 5240.25, 8, 1);
              b.addLimit('sell', 5240.50, 25, 2);
              var r = b.marketOrder('buy', 20);
              if (r.filled !== 20 || r.unfilled !== 0) return 'filled/unfilled were ' + r.filled + '/' + r.unfilled;
              if (r.fills.length !== 2) return 'expected 2 fills, got ' + r.fills.length;
              if (r.fills[0].price !== 5240.25 || r.fills[0].qty !== 8) return 'the first fill was wrong';
              return (r.fills[1].price === 5240.5 && r.fills[1].qty === 12) ? true : 'the second fill was wrong';
            } },
          { name: 'consumed size is removed from the book', expose: ['OrderBook'],
            run: function (s) {
              var b = new s.OrderBook();
              b.addLimit('sell', 5240.25, 8, 1);
              b.addLimit('sell', 5240.50, 25, 2);
              b.marketOrder('buy', 20);
              if (b.bestAsk() !== 5240.5) return 'the consumed level should be gone, best ask is ' + b.bestAsk();
              var left = b.asks[0].orders[0].qty;
              return left === 13 ? true : 'expected 13 left at the top level, got ' + left;
            } },
          { name: 'respects time priority within a level', expose: ['OrderBook'],
            run: function (s) {
              var b = new s.OrderBook();
              b.addLimit('sell', 100, 5, 'first');
              b.addLimit('sell', 100, 5, 'second');
              var r = b.marketOrder('buy', 5);
              return r.fills[0].id === 'first' ? true : 'the earlier order should fill first';
            } },
          { name: 'reports unfilled size on a thin book', expose: ['OrderBook'],
            run: function (s) {
              var b = new s.OrderBook();
              b.addLimit('sell', 100, 5, 1);
              var r = b.marketOrder('buy', 12);
              if (r.filled !== 5 || r.unfilled !== 7) return 'got ' + r.filled + '/' + r.unfilled;
              return b.bestAsk() === null ? true : 'the book should be empty';
            } },
          { name: 'a market sell walks the bids', expose: ['OrderBook'],
            run: function (s) {
              var b = new s.OrderBook();
              b.addLimit('buy', 5240, 10, 1);
              b.addLimit('buy', 5239, 10, 2);
              var r = b.marketOrder('sell', 15);
              if (r.fills[0].price !== 5240) return 'a sell should hit the highest bid first';
              return r.fills[1].price === 5239 ? true : 'the second fill was ' + r.fills[1].price;
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is price-time priority?',
        options: ['Newest orders fill first', 'Better prices fill first; among equal prices, whoever arrived first', 'Largest orders fill first', 'Random allocation'],
        answer: 1,
        explain: 'It is why joining a queue early at a level matters, and why quoting a better price jumps the queue entirely.' },
      { q: 'Why does a large market order fill at a worse average price?',
        options: ['Commission', 'It consumes the best level and walks into worse ones', 'Latency', 'It does not'],
        answer: 1,
        explain: 'The quoted price is only the top level. Size beyond it pays whatever is behind — which is exactly slippage.' },
      { q: 'What does a crossed book (bid ≥ ask) indicate?',
        options: ['A profitable arbitrage', 'Stale or corrupt data — a real book cannot stay crossed', 'High volatility', 'A halt'],
        answer: 1,
        explain: 'Any genuine crossing is matched instantly. Seeing one persist means your view of the book is wrong.' }
    ],
    recap: [
      'The book is two sorted sides with queues at each price level.',
      'Price-time priority: better price first, then arrival order.',
      'A market order walks levels — that is market impact.',
      'Slippage falls straight out of the book\'s shape.'
    ],
    vocab: [
      { term: 'Limit order book', def: 'The full set of resting buy and sell orders at every price. The actual market, of which the quote is only the surface.' },
      { term: 'Market impact', def: 'The price movement your own order causes by consuming resting liquidity. Grows with size and shrinks with depth.' }
    ]
  });

  C.push({
    id: 'd092', day: 92, module: 7, minutes: 30,
    title: 'Order Lifecycle State Machines',
    subtitle: 'An order has states, and only some transitions are legal.',
    goal: '<b>Goal:</b> model an order\'s lifecycle so that an impossible sequence of events cannot corrupt your position.',
    objectives: [
      'Enumerate the states of an order',
      'Define the legal transitions explicitly',
      'Handle partial fills and terminal states',
      'Reject out-of-order broker messages'
    ],
    sections: [
      { h: 'The states',
        body: '<table><tr><th>State</th><th>Meaning</th><th>Terminal?</th></tr>' +
              '<tr><td><code>pending</code></td><td>created, not yet acknowledged</td><td>no</td></tr>' +
              '<tr><td><code>working</code></td><td>live at the exchange</td><td>no</td></tr>' +
              '<tr><td><code>partial</code></td><td>partly filled, still working</td><td>no</td></tr>' +
              '<tr><td><code>filled</code></td><td>completely filled</td><td>yes</td></tr>' +
              '<tr><td><code>cancelled</code></td><td>withdrawn</td><td>yes</td></tr>' +
              '<tr><td><code>rejected</code></td><td>refused by the exchange</td><td>yes</td></tr></table>' +
              '<p>Terminal states have no outgoing transitions at all. An order that reports a fill after it was cancelled is a message you must reject, not apply.</p>' },
      { h: 'Transitions as data',
        body: '<p>Writing the legal moves as a lookup table rather than as scattered <code>if</code> statements means the rules can be read, tested and changed in one place.</p>',
        code: 'const TRANSITIONS = {\n  pending: ["working", "rejected", "cancelled"],\n  working: ["partial", "filled", "cancelled", "rejected"],\n  partial: ["partial", "filled", "cancelled"],\n  filled: [],\n  cancelled: [],\n  rejected: []\n};\n\nfunction canMove(from, to) {\n  return (TRANSITIONS[from] || []).includes(to);\n}\n\nconsole.log(canMove("working", "partial"));\nconsole.log(canMove("filled", "partial"));\nconsole.log(canMove("cancelled", "filled"));' },
      { h: 'Messages arrive out of order',
        body: '<div class="note note-warn"><b>The network does not owe you ordering</b>A fill acknowledgement can arrive after the cancel confirmation for the same order. Without a state machine, you apply both and your position is wrong. With one, the illegal transition is rejected and logged — and you find out at the time rather than at the reconciliation.</div>' },
      { h: 'Partial fills accumulate',
        body: '<p>A partial fill adds to the filled quantity and stays in <code>partial</code> until the total reaches the order size, at which point it becomes <code>filled</code>. The average fill price is the size-weighted mean across all the partials, not the last one.</p>',
        code: 'function applyFill(order, qty, price) {\n  const newFilled = order.filledQty + qty;\n  const notional = order.avgPrice * order.filledQty + price * qty;\n  return {\n    ...order,\n    filledQty: newFilled,\n    avgPrice: newFilled === 0 ? 0 : notional / newFilled,\n    state: newFilled >= order.qty ? "filled" : "partial"\n  };\n}\n\nlet o = { qty: 10, filledQty: 0, avgPrice: 0, state: "working" };\no = applyFill(o, 4, 100);\nconsole.log(o);\no = applyFill(o, 6, 102);\nconsole.log(o);' }
    ],
    parsons: {
      prompt: 'Reject an illegal transition.',
      lines: [
        'const allowed = TRANSITIONS[order.state] || [];',
        'if (!allowed.includes(next)) {',
        '  return { ok: false, reason: `cannot move ${order.state} -> ${next}` };',
        '}',
        'return { ok: true, state: next };'
      ]
    },
    exercises: [
      { id: 'e1', title: 'canTransition()', difficulty: 'Core',
        prompt: 'Write <code>canTransition(from, to)</code> using this table:<ul>' +
          '<li><code>pending</code> → working, rejected, cancelled</li>' +
          '<li><code>working</code> → partial, filled, cancelled, rejected</li>' +
          '<li><code>partial</code> → partial, filled, cancelled</li>' +
          '<li><code>filled</code>, <code>cancelled</code>, <code>rejected</code> → nothing</li></ul>' +
          'An unknown state returns <code>false</code>.',
        starter: 'function canTransition(from, to) {\n  // is this move legal?\n}\n',
        solution: 'const TRANSITIONS = {\n  pending: ["working", "rejected", "cancelled"],\n  working: ["partial", "filled", "cancelled", "rejected"],\n  partial: ["partial", "filled", "cancelled"],\n  filled: [],\n  cancelled: [],\n  rejected: []\n};\n\nfunction canTransition(from, to) {\n  return (TRANSITIONS[from] || []).includes(to);\n}',
        hints: ['Define the table once, outside the function.',
                '<code>(TRANSITIONS[from] || [])</code> handles an unknown state without a separate check.'],
        tests: { fn: 'canTransition', cases: [
          { args: ['pending', 'working'], expect: true },
          { args: ['working', 'partial'], expect: true },
          { args: ['partial', 'partial'], expect: true, name: 'a partial can be followed by another partial' },
          { args: ['partial', 'filled'], expect: true },
          { args: ['filled', 'partial'], expect: false, name: 'terminal states have no exits' },
          { args: ['cancelled', 'filled'], expect: false, name: 'a cancelled order cannot fill' },
          { args: ['pending', 'filled'], expect: false, name: 'an order must be working before it can fill' },
          { args: ['nonsense', 'working'], expect: false }
        ] } },
      { id: 'e2', title: 'applyFill()', difficulty: 'Core',
        prompt: 'Write <code>applyFill(order, qty, price)</code> returning a <strong>new</strong> order object with the fill applied.<br>' +
          '<code>order</code> is <code>{ qty, filledQty, avgPrice, state }</code>.<ul>' +
          '<li><code>avgPrice</code> is the size-weighted average across every fill so far.</li>' +
          '<li>The state becomes <code>"filled"</code> once <code>filledQty</code> reaches <code>qty</code>, otherwise <code>"partial"</code>.</li>' +
          '<li>A fill of 0 or less, or a fill on a terminal state, returns the order unchanged.</li></ul>',
        starter: 'function applyFill(order, qty, price) {\n  // a new order with the fill applied\n}\n',
        solution: 'function applyFill(order, qty, price) {\n  if (qty <= 0) return order;\n  if (["filled", "cancelled", "rejected"].includes(order.state)) return order;\n  const filledQty = order.filledQty + qty;\n  const notional = order.avgPrice * order.filledQty + price * qty;\n  return {\n    ...order,\n    filledQty,\n    avgPrice: filledQty === 0 ? 0 : notional / filledQty,\n    state: filledQty >= order.qty ? "filled" : "partial"\n  };\n}',
        hints: ['Guard both invalid cases first and return the original object.',
                'The new average is the total notional divided by the total filled quantity.',
                'Spread the order into a new object rather than mutating it.'],
        tests: { fn: 'applyFill', approx: 1e-9, cases: [
          { args: [{ qty: 10, filledQty: 0, avgPrice: 0, state: 'working' }, 4, 100],
            expect: { qty: 10, filledQty: 4, avgPrice: 100, state: 'partial' } },
          { args: [{ qty: 10, filledQty: 4, avgPrice: 100, state: 'partial' }, 6, 102],
            expect: { qty: 10, filledQty: 10, avgPrice: (100 * 4 + 102 * 6) / 10, state: 'filled' },
            name: 'completing the order marks it filled with a weighted average' },
          { args: [{ qty: 10, filledQty: 10, avgPrice: 100, state: 'filled' }, 5, 105],
            expect: { qty: 10, filledQty: 10, avgPrice: 100, state: 'filled' },
            name: 'a fill on a filled order is ignored' },
          { args: [{ qty: 10, filledQty: 0, avgPrice: 0, state: 'cancelled' }, 5, 105],
            expect: { qty: 10, filledQty: 0, avgPrice: 0, state: 'cancelled' },
            name: 'a fill on a cancelled order is ignored' },
          { args: [{ qty: 10, filledQty: 0, avgPrice: 0, state: 'working' }, 0, 100],
            expect: { qty: 10, filledQty: 0, avgPrice: 0, state: 'working' },
            name: 'a zero fill changes nothing' }
        ], checks: [{
          name: 'does not modify the original order', expose: ['applyFill'],
          run: function (s) {
            var o = { qty: 10, filledQty: 0, avgPrice: 0, state: 'working' };
            s.applyFill(o, 4, 100);
            return (o.filledQty === 0 && o.state === 'working') ? true : 'the input order was mutated';
          }
        }] } },
      { id: 'e3', title: 'class Order', difficulty: 'Stretch',
        prompt: 'Build the full lifecycle. <code>new Order(id, side, qty)</code> starts in <code>pending</code> with <code>filledQty</code> 0 and <code>avgPrice</code> 0. It has:<ul>' +
          '<li><code>apply(event)</code> — where <code>event</code> is <code>{ type, qty?, price?, reason? }</code> with <code>type</code> in <code>ack</code>, <code>fill</code>, <code>cancel</code>, <code>reject</code>. Returns <code>{ ok, state, reason }</code>; an illegal transition returns <code>ok: false</code> and leaves the order untouched.</li>' +
          '<li><code>isTerminal()</code> — whether no further events can apply</li>' +
          '<li><code>remaining()</code> — <code>qty − filledQty</code>, never below 0</li>' +
          '<li><code>history</code> — every <em>applied</em> event, in order</li></ul>' +
          '<span class="muted"><code>ack</code> moves pending → working. <code>fill</code> requires working or partial. <code>cancel</code> and <code>reject</code> follow the table from exercise 1.</span>',
        expose: ['Order'],
        starter: 'const TRANSITIONS = {\n  pending: ["working", "rejected", "cancelled"],\n  working: ["partial", "filled", "cancelled", "rejected"],\n  partial: ["partial", "filled", "cancelled"],\n  filled: [], cancelled: [], rejected: []\n};\n\nclass Order {\n  constructor(id, side, qty) {\n    this.id = id;\n    this.side = side;\n    this.qty = qty;\n    this.filledQty = 0;\n    this.avgPrice = 0;\n    this.state = "pending";\n    this.history = [];\n  }\n\n  apply(event) {}\n  isTerminal() {}\n  remaining() {}\n}\n',
        solution: 'const TRANSITIONS = {\n  pending: ["working", "rejected", "cancelled"],\n  working: ["partial", "filled", "cancelled", "rejected"],\n  partial: ["partial", "filled", "cancelled"],\n  filled: [], cancelled: [], rejected: []\n};\n\nclass Order {\n  constructor(id, side, qty) {\n    this.id = id;\n    this.side = side;\n    this.qty = qty;\n    this.filledQty = 0;\n    this.avgPrice = 0;\n    this.state = "pending";\n    this.history = [];\n  }\n\n  apply(event) {\n    let next;\n    if (event.type === "ack") next = "working";\n    else if (event.type === "cancel") next = "cancelled";\n    else if (event.type === "reject") next = "rejected";\n    else if (event.type === "fill") {\n      next = this.filledQty + (event.qty || 0) >= this.qty ? "filled" : "partial";\n    } else {\n      return { ok: false, state: this.state, reason: `unknown event type: ${event.type}` };\n    }\n\n    if (!(TRANSITIONS[this.state] || []).includes(next)) {\n      return { ok: false, state: this.state, reason: `cannot move ${this.state} -> ${next}` };\n    }\n\n    if (event.type === "fill") {\n      const qty = event.qty || 0;\n      if (qty <= 0) return { ok: false, state: this.state, reason: "fill quantity must be positive" };\n      const filled = this.filledQty + qty;\n      this.avgPrice = (this.avgPrice * this.filledQty + event.price * qty) / filled;\n      this.filledQty = filled;\n    }\n    this.state = next;\n    this.history.push(event);\n    return { ok: true, state: this.state, reason: null };\n  }\n\n  isTerminal() {\n    return (TRANSITIONS[this.state] || []).length === 0;\n  }\n\n  remaining() {\n    return Math.max(0, this.qty - this.filledQty);\n  }\n}',
        hints: ['Map the event type to a target state first, then check whether that move is legal.',
                'A fill\'s target state depends on whether it completes the order.',
                'Only push to <code>history</code> after the event has actually been applied.'],
        tests: { checks: [
          { name: 'runs the happy path', expose: ['Order'],
            run: function (s) {
              var o = new s.Order(1, 'buy', 10);
              if (o.state !== 'pending') return 'should start pending';
              if (o.apply({ type: 'ack' }).ok !== true) return 'ack should be accepted';
              if (o.state !== 'working') return 'state should be working, got ' + o.state;
              o.apply({ type: 'fill', qty: 4, price: 100 });
              if (o.state !== 'partial') return 'a part fill should give partial, got ' + o.state;
              o.apply({ type: 'fill', qty: 6, price: 102 });
              if (o.state !== 'filled') return 'completing should give filled, got ' + o.state;
              return Math.abs(o.avgPrice - (100 * 4 + 102 * 6) / 10) < 1e-9
                ? true : 'the average price was ' + o.avgPrice;
            } },
          { name: 'rejects a fill before acknowledgement', expose: ['Order'],
            run: function (s) {
              var o = new s.Order(1, 'buy', 10);
              var r = o.apply({ type: 'fill', qty: 5, price: 100 });
              if (r.ok !== false) return 'a fill on a pending order should be rejected';
              return (o.filledQty === 0 && o.state === 'pending') ? true : 'the order was modified anyway';
            } },
          { name: 'rejects a fill after cancellation', expose: ['Order'],
            run: function (s) {
              var o = new s.Order(1, 'buy', 10);
              o.apply({ type: 'ack' });
              o.apply({ type: 'cancel' });
              var r = o.apply({ type: 'fill', qty: 5, price: 100 });
              if (r.ok !== false) return 'a late fill should be rejected';
              return o.filledQty === 0 ? true : 'the late fill was applied anyway';
            } },
          { name: 'isTerminal and remaining are correct', expose: ['Order'],
            run: function (s) {
              var o = new s.Order(1, 'buy', 10);
              if (o.isTerminal()) return 'a pending order is not terminal';
              if (o.remaining() !== 10) return 'remaining should be 10';
              o.apply({ type: 'ack' });
              o.apply({ type: 'fill', qty: 4, price: 100 });
              if (o.remaining() !== 6) return 'remaining should be 6, got ' + o.remaining();
              o.apply({ type: 'fill', qty: 6, price: 100 });
              return (o.isTerminal() && o.remaining() === 0) ? true : 'a filled order should be terminal with 0 remaining';
            } },
          { name: 'history records only applied events', expose: ['Order'],
            run: function (s) {
              var o = new s.Order(1, 'buy', 10);
              o.apply({ type: 'fill', qty: 5, price: 100 });   // rejected
              o.apply({ type: 'ack' });                         // applied
              return o.history.length === 1 ? true : 'history has ' + o.history.length + ' entries, expected 1';
            } },
          { name: 'an unknown event type is rejected', expose: ['Order'],
            run: function (s) {
              var o = new s.Order(1, 'buy', 10);
              var r = o.apply({ type: 'teleport' });
              return (r.ok === false && typeof r.reason === 'string') ? true : 'an unknown type should be rejected with a reason';
            } },
          { name: 'a rejection can follow an acknowledgement', expose: ['Order'],
            run: function (s) {
              var o = new s.Order(1, 'buy', 10);
              o.apply({ type: 'ack' });
              var r = o.apply({ type: 'reject', reason: 'risk' });
              return (r.ok === true && o.state === 'rejected' && o.isTerminal())
                ? true : 'a working order should be rejectable';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is a terminal state?',
        options: ['The first state', 'One with no legal outgoing transitions', 'A state with an error', 'The most common state'],
        answer: 1,
        explain: '<code>filled</code>, <code>cancelled</code> and <code>rejected</code> are final. Any event afterwards must be rejected.' },
      { q: 'A fill message arrives after the cancel confirmation. What should happen?',
        options: ['Apply the fill', 'Reject it — the transition is illegal', 'Reopen the order', 'Ignore it silently'],
        answer: 1,
        explain: 'Reject and log. Applying it corrupts your position, and silence means you find out at reconciliation instead of at the time.' },
      { q: 'How is the average fill price computed across partials?',
        options: ['The last fill price', 'The mean of the fill prices', 'The size-weighted mean of all fills', 'The first fill price'],
        answer: 2,
        explain: 'A 9-lot at 100 and a 1-lot at 110 average 101, not 105.' }
    ],
    recap: [
      'An order has states, and only some transitions are legal.',
      'Keep the transition table as data, in one place.',
      'Reject illegal events rather than applying them.',
      'Average fill price is size-weighted across every partial.'
    ],
    vocab: [
      { term: 'Partial fill', def: 'An order filled in pieces. Common for size in a thin book, and the reason a weighted average is needed.' },
      { term: 'Reconciliation', def: 'Comparing your recorded positions against the broker\'s. Discrepancies usually trace back to a mishandled message.' }
    ]
  });


  C.push({
    id: 'd093', day: 93, module: 7, minutes: 30,
    title: 'Event Sourcing',
    subtitle: 'Store what happened, not what is. Then you can always ask why.',
    goal: '<b>Goal:</b> rebuild account state by replaying an event log, and use it to answer questions about the past.',
    objectives: [
      'Model state as a fold over an event log',
      'Write a pure reducer',
      'Replay to any point in time',
      'Snapshot to keep replay fast'
    ],
    sections: [
      { h: 'State is a fold over events',
        body: '<p>Instead of mutating a position object, append an immutable event and compute the current state by folding the log. The state becomes derived data — recomputable, auditable, and impossible to disagree with the history.</p>',
        code: 'const events = [\n  { type: "deposit", amount: 100000 },\n  { type: "fill", side: "buy", qty: 2, price: 5240 },\n  { type: "fill", side: "sell", qty: 2, price: 5250 }\n];\n\nfunction reduce(state, e) {\n  switch (e.type) {\n    case "deposit": return { ...state, cash: state.cash + e.amount };\n    case "fill": {\n      const delta = e.side === "buy" ? e.qty : -e.qty;\n      return { ...state, position: state.position + delta,\n        cash: state.cash - delta * e.price * 50 };\n    }\n    default: return state;\n  }\n}\n\nconsole.log(events.reduce(reduce, { cash: 0, position: 0 }));' },
      { h: 'Why it matters here',
        body: '<div class="note note-trade"><b>Three things you get for free</b>' +
              '<br><strong>Audit.</strong> "Why is my position 3?" has an exact answer — replay the log.' +
              '<br><strong>Time travel.</strong> Replay the first <em>n</em> events to see the state at any moment.' +
              '<br><strong>Reproducibility.</strong> A bug report is a log. Replay it and you have the exact state that caused it.</div>' },
      { h: 'The reducer must be pure',
        body: '<p>Same state plus same event must always give the same next state. That means no clock reads, no random numbers, no network calls inside the reducer — anything non-deterministic belongs in the <em>event</em>, recorded at the time it happened.</p>',
        code: '// WRONG: replay produces a different answer every time\n// case "fill": return { ...state, at: Date.now() };\n\n// RIGHT: the timestamp is part of the event\nconst e = { type: "fill", qty: 1, price: 5240, at: 1715693400000 };\nconsole.log("the event carries its own time:", new Date(e.at).toISOString());' },
      { h: 'Snapshots keep replay fast',
        body: '<p>A million events take a while to fold. Store a snapshot every <em>n</em> events; to reach event <em>k</em>, start from the latest snapshot at or before it and replay only the remainder.</p>',
        code: 'function buildSnapshots(events, reducer, seed, every) {\n  const snaps = [{ index: 0, state: seed }];\n  let state = seed;\n  events.forEach((e, i) => {\n    state = reducer(state, e);\n    if ((i + 1) % every === 0) snaps.push({ index: i + 1, state });\n  });\n  return snaps;\n}\n\nconst add = (s, e) => ({ n: s.n + e });\nconsole.log(buildSnapshots([1, 1, 1, 1, 1, 1, 1], add, { n: 0 }, 3));' }
    ],
    parsons: {
      prompt: 'Rebuild state by folding the event log.',
      lines: [
        'let state = seed;',
        'for (const event of events) {',
        '  state = reducer(state, event);',
        '}',
        'return state;'
      ]
    },
    exercises: [
      { id: 'e1', title: 'accountReducer()', difficulty: 'Core',
        prompt: 'Write <code>accountReducer(state, event)</code>, a pure function returning the next state.<br>' +
          'State is <code>{ cash, position, realised }</code>. Event types:<ul>' +
          '<li><code>deposit</code> — <code>{ amount }</code>: adds to cash</li>' +
          '<li><code>fill</code> — <code>{ side, qty, price, pointValue }</code>: a buy adds to position and subtracts <code>qty × price × pointValue</code> from cash; a sell does the reverse</li>' +
          '<li><code>realise</code> — <code>{ amount }</code>: adds to both <code>realised</code> and <code>cash</code></li>' +
          '<li>anything else: the state unchanged</li></ul>',
        starter: 'function accountReducer(state, event) {\n  // the next state, purely\n}\n',
        solution: 'function accountReducer(state, event) {\n  switch (event.type) {\n    case "deposit":\n      return { ...state, cash: state.cash + event.amount };\n    case "fill": {\n      const delta = event.side === "buy" ? event.qty : -event.qty;\n      const notional = delta * event.price * event.pointValue;\n      return { ...state, position: state.position + delta, cash: state.cash - notional };\n    }\n    case "realise":\n      return { ...state, realised: state.realised + event.amount, cash: state.cash + event.amount };\n    default:\n      return state;\n  }\n}',
        hints: ['Return a new object every time — never modify the state you were given.',
                'A signed <code>delta</code> lets one expression handle both sides.',
                'An unknown event type returns the same state object unchanged.'],
        tests: { fn: 'accountReducer', approx: 1e-9, cases: [
          { args: [{ cash: 0, position: 0, realised: 0 }, { type: 'deposit', amount: 100000 }],
            expect: { cash: 100000, position: 0, realised: 0 } },
          { args: [{ cash: 100000, position: 0, realised: 0 },
                   { type: 'fill', side: 'buy', qty: 2, price: 5240, pointValue: 50 }],
            expect: { cash: 100000 - 524000, position: 2, realised: 0 } },
          { args: [{ cash: 0, position: 2, realised: 0 },
                   { type: 'fill', side: 'sell', qty: 2, price: 5250, pointValue: 50 }],
            expect: { cash: 525000, position: 0, realised: 0 } },
          { args: [{ cash: 100, position: 0, realised: 0 }, { type: 'realise', amount: 500 }],
            expect: { cash: 600, position: 0, realised: 500 } },
          { args: [{ cash: 100, position: 1, realised: 0 }, { type: 'nonsense' }],
            expect: { cash: 100, position: 1, realised: 0 } }
        ], checks: [{
          name: 'does not modify the input state', expose: ['accountReducer'],
          run: function (s) {
            var st = { cash: 100, position: 0, realised: 0 };
            s.accountReducer(st, { type: 'deposit', amount: 50 });
            return st.cash === 100 ? true : 'the input state was mutated';
          }
        }] } },
      { id: 'e2', title: 'replay()', difficulty: 'Core',
        prompt: 'Write <code>replay(events, reducer, seed, upTo)</code> folding the events into a state.<ul>' +
          '<li>With no <code>upTo</code>, fold everything.</li>' +
          '<li>With an <code>upTo</code>, fold only the first <code>upTo</code> events.</li>' +
          '<li>An <code>upTo</code> of 0 returns the seed; a negative one also returns the seed.</li></ul>' +
          'The seed must never be modified.',
        starter: 'function replay(events, reducer, seed, upTo) {\n  // fold the log, optionally up to a point\n}\n',
        solution: 'function replay(events, reducer, seed, upTo) {\n  const end = upTo === undefined || upTo === null\n    ? events.length\n    : Math.max(0, Math.min(upTo, events.length));\n  let state = seed;\n  for (let i = 0; i < end; i++) state = reducer(state, events[i]);\n  return state;\n}',
        hints: ['Clamp <code>upTo</code> into the valid range before looping.',
                'Because the reducer is pure, the seed is never touched.'],
        tests: { checks: [
          { name: 'folds the whole log', expose: ['replay'],
            run: function (s) {
              var add = function (st, e) { return { n: st.n + e }; };
              return s.replay([1, 2, 3], add, { n: 0 }).n === 6 ? true : 'expected 6';
            } },
          { name: 'stops at upTo', expose: ['replay'],
            run: function (s) {
              var add = function (st, e) { return { n: st.n + e }; };
              return s.replay([1, 2, 3], add, { n: 0 }, 2).n === 3 ? true : 'expected 3';
            } },
          { name: 'an upTo of 0 returns the seed', expose: ['replay'],
            run: function (s) {
              var add = function (st, e) { return { n: st.n + e }; };
              return s.replay([1, 2, 3], add, { n: 99 }, 0).n === 99 ? true : 'expected the seed back';
            } },
          { name: 'an upTo past the end folds everything', expose: ['replay'],
            run: function (s) {
              var add = function (st, e) { return { n: st.n + e }; };
              return s.replay([1, 2], add, { n: 0 }, 100).n === 3 ? true : 'expected 3';
            } },
          { name: 'a negative upTo returns the seed', expose: ['replay'],
            run: function (s) {
              var add = function (st, e) { return { n: st.n + e }; };
              return s.replay([1, 2], add, { n: 5 }, -3).n === 5 ? true : 'expected the seed back';
            } },
          { name: 'the seed is not modified', expose: ['replay'],
            run: function (s) {
              var seed = { n: 0 };
              var add = function (st, e) { return { n: st.n + e }; };
              s.replay([1, 2, 3], add, seed);
              return seed.n === 0 ? true : 'the seed was mutated';
            } }
        ] } },
      { id: 'e3', title: 'makeEventStore()', difficulty: 'Stretch',
        prompt: 'Build the store. <code>makeEventStore(reducer, seed, snapshotEvery)</code> returns:<ul>' +
          '<li><code>append(event)</code> — record it, update the current state, and take a snapshot every <code>snapshotEvery</code> events</li>' +
          '<li><code>state()</code> — the current state</li>' +
          '<li><code>stateAt(index)</code> — the state after the first <code>index</code> events, computed from the nearest snapshot at or before it</li>' +
          '<li><code>length()</code> — how many events are stored</li>' +
          '<li><code>snapshotCount()</code> — how many snapshots exist, including the seed at index 0</li></ul>' +
          '<span class="muted"><code>stateAt</code> must not replay from zero when a nearer snapshot exists.</span>',
        expose: ['makeEventStore'],
        starter: 'function makeEventStore(reducer, seed, snapshotEvery) {\n  // { append, state, stateAt, length, snapshotCount }\n}\n',
        solution: 'function makeEventStore(reducer, seed, snapshotEvery) {\n  const events = [];\n  const snapshots = [{ index: 0, state: seed }];\n  let current = seed;\n  return {\n    append(event) {\n      events.push(event);\n      current = reducer(current, event);\n      if (events.length % snapshotEvery === 0) {\n        snapshots.push({ index: events.length, state: current });\n      }\n    },\n    state() { return current; },\n    stateAt(index) {\n      const target = Math.max(0, Math.min(index, events.length));\n      let base = snapshots[0];\n      for (const s of snapshots) {\n        if (s.index <= target) base = s;\n        else break;\n      }\n      let st = base.state;\n      for (let i = base.index; i < target; i++) st = reducer(st, events[i]);\n      return st;\n    },\n    length() { return events.length; },\n    snapshotCount() { return snapshots.length; }\n  };\n}',
        hints: ['Snapshots are sorted by index, so a simple scan finds the nearest one at or before the target.',
                'Replay from the snapshot\'s index, not from 0.',
                'The seed is snapshot 0, which is why <code>snapshotCount()</code> starts at 1.'],
        tests: { checks: [
          { name: 'tracks the current state', expose: ['makeEventStore'],
            run: function (s) {
              var st = s.makeEventStore(function (a, e) { return { n: a.n + e }; }, { n: 0 }, 10);
              [1, 2, 3].forEach(st.append);
              if (st.length() !== 3) return 'length should be 3';
              return st.state().n === 6 ? true : 'state was ' + st.state().n;
            } },
          { name: 'stateAt reconstructs any point', expose: ['makeEventStore'],
            run: function (s) {
              var st = s.makeEventStore(function (a, e) { return { n: a.n + e }; }, { n: 0 }, 10);
              [1, 2, 3, 4].forEach(st.append);
              if (st.stateAt(0).n !== 0) return 'stateAt(0) should be the seed';
              if (st.stateAt(2).n !== 3) return 'stateAt(2) should be 3, got ' + st.stateAt(2).n;
              return st.stateAt(4).n === 10 ? true : 'stateAt(4) should be 10';
            } },
          { name: 'takes snapshots at the interval', expose: ['makeEventStore'],
            run: function (s) {
              var st = s.makeEventStore(function (a, e) { return { n: a.n + e }; }, { n: 0 }, 3);
              if (st.snapshotCount() !== 1) return 'the seed snapshot should exist';
              for (var i = 0; i < 7; i++) st.append(1);
              return st.snapshotCount() === 3 ? true : 'expected 3 snapshots after 7 events, got ' + st.snapshotCount();
            } },
          { name: 'stateAt replays from the nearest snapshot', expose: ['makeEventStore'],
            run: function (s) {
              var calls = 0;
              var st = s.makeEventStore(function (a, e) { calls++; return { n: a.n + e }; }, { n: 0 }, 5);
              for (var i = 0; i < 20; i++) st.append(1);
              var before = calls;
              var v = st.stateAt(18);
              var replayed = calls - before;
              if (v.n !== 18) return 'stateAt(18) should be 18, got ' + v.n;
              return replayed <= 5 ? true : 'replayed ' + replayed + ' events — it should start from the snapshot at 15';
            } },
          { name: 'clamps an out-of-range index', expose: ['makeEventStore'],
            run: function (s) {
              var st = s.makeEventStore(function (a, e) { return { n: a.n + e }; }, { n: 0 }, 5);
              [1, 2].forEach(st.append);
              if (st.stateAt(100).n !== 3) return 'an index past the end should give the final state';
              return st.stateAt(-5).n === 0 ? true : 'a negative index should give the seed';
            } }
        ] } }
    ],
    quiz: [
      { q: 'In event sourcing, what is the source of truth?',
        options: ['The current state', 'The append-only event log', 'The database row', 'The snapshot'],
        answer: 1,
        explain: 'State is derived. The log is what actually happened, and it can always be replayed.' },
      { q: 'Why must a reducer be pure?',
        options: ['Style', 'Otherwise replaying the same log produces a different state each time', 'For speed', 'To allow snapshots'],
        answer: 1,
        explain: 'A <code>Date.now()</code> inside a reducer makes history unreproducible. Timestamps belong in the event.' },
      { q: 'What problem do snapshots solve?',
        options: ['Storage', 'Replay time — you start from the nearest snapshot instead of from zero', 'Correctness', 'Ordering'],
        answer: 1,
        explain: 'Folding a million events on every query is too slow. A snapshot every thousand makes it bounded work.' }
    ],
    recap: [
      'State is a fold over an append-only event log.',
      'The reducer must be pure — non-determinism goes in the event.',
      'Replaying a prefix gives the state at any point in the past.',
      'Snapshots bound the cost of replay.'
    ],
    vocab: [
      { term: 'Event sourcing', def: 'Storing every change as an immutable event and deriving current state by replaying them.' },
      { term: 'Reducer', def: 'A pure function of (state, event) returning the next state. The single place state changes.' }
    ]
  });

  C.push({
    id: 'd094', day: 94, module: 7, minutes: 30,
    title: 'Floating Point and Numerical Stability',
    subtitle: 'Where the money quietly goes missing.',
    goal: '<b>Goal:</b> write numeric code whose errors do not accumulate, and compare prices safely.',
    objectives: [
      'Explain why 0.1 + 0.2 is not 0.3',
      'Compare with a tolerance appropriate to the scale',
      'Avoid accumulating error in running sums',
      'Work in integer ticks where exactness matters'
    ],
    sections: [
      { h: 'Binary cannot represent every decimal',
        body: '<p>0.1 in binary is a repeating fraction, exactly as 1/3 is in decimal. It is stored rounded, and the tiny error is real.</p>' +
              '<p>A double has about 15–17 significant decimal digits. At ES prices near 5,000 that leaves roughly 12 digits after the point — plenty for one calculation, and not necessarily plenty for a million accumulated ones.</p>',
        code: 'console.log(0.1 + 0.2);\nconsole.log((0.1 + 0.2) - 0.3);\nconsole.log(0.1 + 0.2 === 0.3);\nconsole.log(Number.EPSILON);\nconsole.log(5240.25 + 0.1 - 0.1 === 5240.25);' },
      { h: 'Relative tolerance, not absolute',
        body: '<p>An absolute tolerance of 0.005 is right for ES at 5,240 and far too coarse for a currency pair at 1.0842. Scale the tolerance to the magnitude of the values being compared.</p>',
        code: 'function nearlyEqual(a, b, relative = 1e-9) {\n  if (a === b) return true;\n  const diff = Math.abs(a - b);\n  const scale = Math.max(Math.abs(a), Math.abs(b));\n  return diff <= scale * relative;\n}\n\nconsole.log(nearlyEqual(0.1 + 0.2, 0.3));\nconsole.log(nearlyEqual(5240.250000001, 5240.25));\nconsole.log(nearlyEqual(1.0842, 1.0843));' },
      { h: 'Accumulated error in a running sum',
        body: '<p>The rolling sum you wrote for the SMA on day 57 adds and subtracts millions of times. Each operation rounds, and the errors do not cancel — a long-running rolling sum can drift measurably away from the true value.</p>' +
              '<div class="note note-warn"><b>The fix: periodic recomputation</b>Every few thousand updates, recompute the sum from the window directly. It costs one full pass occasionally and eliminates unbounded drift. Kahan summation is the more sophisticated answer when a full recompute is impossible.</div>',
        code: 'let running = 0;\nconst values = [];\nfor (let i = 0; i < 100000; i++) {\n  const v = 0.1;\n  values.push(v);\n  running += v;\n}\nconst exact = values.length * 0.1;\nconsole.log("running:", running);\nconsole.log("exact:  ", exact);\nconsole.log("drift:  ", Math.abs(running - exact));' },
      { h: 'Integer ticks are exact',
        body: '<p>Where exactness matters — position accounting, order quantities, cash — work in the smallest unit as an integer. ES prices are always a whole number of 0.25 ticks, so <code>price / 0.25</code> is an integer that can be compared and summed with no error at all.</p>',
        code: 'function toTicks(price, tickSize) { return Math.round(price / tickSize); }\nfunction fromTicks(ticks, tickSize) { return ticks * tickSize; }\n\nconst a = toTicks(5240.25, 0.25), b = toTicks(5240.5, 0.25);\nconsole.log(a, b, "difference in ticks:", b - a);\nconsole.log("back to price:", fromTicks(b - a, 0.25));\nconsole.log("exact integer comparison:", a === 20961);' }
    ],
    parsons: {
      prompt: 'Compare two prices with a relative tolerance.',
      lines: [
        'if (a === b) return true;',
        'const diff = Math.abs(a - b);',
        'const scale = Math.max(Math.abs(a), Math.abs(b));',
        'return diff <= scale * relative;'
      ]
    },
    exercises: [
      { id: 'e1', title: 'nearlyEqual()', difficulty: 'Core',
        prompt: 'Write <code>nearlyEqual(a, b, relative)</code> returning whether two numbers are equal within a <strong>relative</strong> tolerance.<ul>' +
          '<li>Exactly equal values are equal, including both zeros.</li>' +
          '<li>The tolerance scales with the larger magnitude.</li>' +
          '<li><code>NaN</code> is never equal to anything, including itself.</li>' +
          '<li>Two infinities of the same sign are equal; of opposite signs, not.</li></ul>',
        starter: 'function nearlyEqual(a, b, relative) {\n  // relative-tolerance comparison\n}\n',
        solution: 'function nearlyEqual(a, b, relative) {\n  if (Number.isNaN(a) || Number.isNaN(b)) return false;\n  if (a === b) return true;\n  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;\n  const diff = Math.abs(a - b);\n  const scale = Math.max(Math.abs(a), Math.abs(b));\n  return diff <= scale * relative;\n}',
        hints: ['Check NaN first, then exact equality — which also handles matching infinities.',
                'A remaining infinity after the equality check cannot be near anything finite.',
                'Scale by the larger absolute value so the tolerance means the same thing at any magnitude.'],
        tests: { fn: 'nearlyEqual', cases: [
          { args: [0.1 + 0.2, 0.3, 1e-9], expect: true },
          { args: [5240.250000001, 5240.25, 1e-9], expect: true },
          { args: [1.0842, 1.0843, 1e-9], expect: false, name: 'a real difference is still detected' },
          { args: [0, 0, 1e-9], expect: true },
          { args: [NaN, NaN, 1e-9], expect: false, name: 'NaN is never equal' },
          { args: [Infinity, Infinity, 1e-9], expect: true },
          { args: [Infinity, -Infinity, 1e-9], expect: false },
          { args: [Infinity, 1, 1e-9], expect: false }
        ], checks: [{
          name: 'the tolerance scales with magnitude', expose: ['nearlyEqual'],
          run: function (s) {
            // the same relative difference at two very different scales
            if (s.nearlyEqual(1e-6, 1.0000001e-6, 1e-6) !== true) return 'tiny values should compare relatively';
            if (s.nearlyEqual(1e9, 1.0000001e9, 1e-6) !== true) return 'huge values should compare relatively';
            return s.nearlyEqual(1e9, 1.1e9, 1e-6) === false ? true : 'a 10% difference should never pass';
          }
        }] } },
      { id: 'e2', title: 'toTicks() and tickArithmetic()', difficulty: 'Core',
        prompt: 'Write three functions for exact tick arithmetic:<ul>' +
          '<li><code>toTicks(price, tickSize)</code> — the price as a whole number of ticks, rounded</li>' +
          '<li><code>fromTicks(ticks, tickSize)</code> — back to a price, rounded to 10 decimals to remove reconstruction noise</li>' +
          '<li><code>isValidPrice(price, tickSize)</code> — whether the price lands exactly on a tick, judged after the round trip with a tolerance of <code>tickSize / 1000</code></li></ul>',
        expose: ['toTicks', 'fromTicks', 'isValidPrice'],
        starter: 'function toTicks(price, tickSize) {\n}\n\nfunction fromTicks(ticks, tickSize) {\n}\n\nfunction isValidPrice(price, tickSize) {\n}\n',
        solution: 'function toTicks(price, tickSize) {\n  return Math.round(price / tickSize);\n}\n\nfunction fromTicks(ticks, tickSize) {\n  return Math.round(ticks * tickSize * 1e10) / 1e10;\n}\n\nfunction isValidPrice(price, tickSize) {\n  const back = fromTicks(toTicks(price, tickSize), tickSize);\n  return Math.abs(back - price) < tickSize / 1000;\n}',
        hints: ['<code>Math.round</code> on the division gives the tick count.',
                'Rounding at 10 decimals removes the noise from multiplying back.',
                '<code>isValidPrice</code> is a round trip plus a tolerance check.'],
        tests: { checks: [
          { name: 'converts to and from ticks', expose: ['toTicks', 'fromTicks'],
            run: function (s) {
              var t = s.toTicks(5240.25, 0.25);
              if (t !== 20961) return 'expected 20961 ticks, got ' + t;
              return s.fromTicks(t, 0.25) === 5240.25 ? true : 'round trip gave ' + s.fromTicks(t, 0.25);
            } },
          { name: 'tick differences are exact integers', expose: ['toTicks'],
            run: function (s) {
              var d = s.toTicks(5240.5, 0.25) - s.toTicks(5240.25, 0.25);
              return d === 1 ? true : 'expected a difference of 1 tick, got ' + d;
            } },
          { name: 'validates prices on the tick grid', expose: ['isValidPrice'],
            run: function (s) {
              if (s.isValidPrice(5240.25, 0.25) !== true) return '5240.25 is a valid ES price';
              if (s.isValidPrice(5240.5, 0.25) !== true) return '5240.50 is a valid ES price';
              return s.isValidPrice(5240.3, 0.25) === false ? true : '5240.30 is not on the 0.25 grid';
            } },
          { name: 'works with a different tick size', expose: ['toTicks', 'isValidPrice'],
            run: function (s) {
              if (s.toTicks(78.42, 0.01) !== 7842) return 'crude at 0.01 ticks: got ' + s.toTicks(78.42, 0.01);
              return s.isValidPrice(78.425, 0.01) === false ? true : '78.425 is not on the 0.01 grid';
            } },
          { name: 'round trips the whole session without drift', expose: ['toTicks', 'fromTicks'],
            run: function (s) {
              for (var i = 0; i < MARKET.closes.length; i++) {
                var p = Math.round(MARKET.closes[i] * 4) / 4;
                var back = s.fromTicks(s.toTicks(p, 0.25), 0.25);
                if (Math.abs(back - p) > 1e-9) return 'drifted at index ' + i + ': ' + back + ' vs ' + p;
              }
              return true;
            } }
        ] } },
      { id: 'e3', title: 'stableRollingSum()', difficulty: 'Stretch',
        prompt: 'Write <code>makeStableRollingSum(period, recomputeEvery)</code> returning a function that takes a value and returns the sum of the last <code>period</code> values.<ul>' +
          '<li>Maintain a running sum for speed.</li>' +
          '<li>Every <code>recomputeEvery</code> updates, rebuild the sum from the window directly, discarding accumulated error.</li>' +
          '<li>Before the window is full, return the sum of what has been seen.</li>' +
          '<li>Expose <code>recomputes</code> on the returned function — how many rebuilds have happened.</li></ul>',
        expose: ['makeStableRollingSum'],
        starter: 'function makeStableRollingSum(period, recomputeEvery) {\n  // a running sum that periodically rebuilds itself\n}\n',
        solution: 'function makeStableRollingSum(period, recomputeEvery) {\n  const buf = new Array(period).fill(0);\n  let head = 0, count = 0, sum = 0, updates = 0;\n  const fn = value => {\n    if (count === period) sum -= buf[head];\n    else count++;\n    buf[head] = value;\n    sum += value;\n    head = (head + 1) % period;\n    updates++;\n    if (updates % recomputeEvery === 0) {\n      let exact = 0;\n      for (let i = 0; i < count; i++) exact += buf[i];\n      sum = exact;\n      fn.recomputes++;\n    }\n    return sum;\n  };\n  fn.recomputes = 0;\n  return fn;\n}',
        hints: ['Start from the ring-buffer rolling mean of day 85 and add the periodic rebuild.',
                'The rebuild sums the buffer\'s filled slots — order does not matter for a sum.',
                'A function is an object, so <code>fn.recomputes</code> can live on it directly.'],
        tests: { checks: [
          { name: 'sums the rolling window', expose: ['makeStableRollingSum'],
            run: function (s) {
              var f = s.makeStableRollingSum(3, 1000);
              if (f(10) !== 10) return 'first value should sum to itself';
              if (f(20) !== 30) return 'after 10, 20 the sum is 30';
              if (f(30) !== 60) return 'after 10, 20, 30 the sum is 60';
              return f(40) === 90 ? true : 'the window should drop the 10, got ' + f(40);
            } },
          { name: 'recomputes on schedule', expose: ['makeStableRollingSum'],
            run: function (s) {
              var f = s.makeStableRollingSum(5, 10);
              for (var i = 0; i < 35; i++) f(1);
              return f.recomputes === 3 ? true : 'expected 3 recomputes after 35 updates, got ' + f.recomputes;
            } },
          { name: 'the recompute does not change the answer', expose: ['makeStableRollingSum'],
            run: function (s) {
              var withRebuild = s.makeStableRollingSum(4, 3);
              var noRebuild = s.makeStableRollingSum(4, 1e9);
              var a = 0, b = 0;
              for (var i = 1; i <= 20; i++) { a = withRebuild(i); b = noRebuild(i); }
              return Math.abs(a - b) < 1e-9 ? true : 'the rebuild changed the result: ' + a + ' vs ' + b;
            } },
          { name: 'controls drift over a long run', expose: ['makeStableRollingSum'],
            run: function (s) {
              var f = s.makeStableRollingSum(10, 500);
              var last = 0;
              for (var i = 0; i < 20000; i++) last = f(0.1);
              return Math.abs(last - 1) < 1e-9 ? true : 'drifted to ' + last + ', expected 1';
            } },
          { name: 'stays fast', expose: ['makeStableRollingSum'],
            run: function (s) {
              var f = s.makeStableRollingSum(2000, 5000);
              var t0 = Date.now();
              for (var i = 0; i < 100000; i++) f(i % 7);
              var ms = Date.now() - t0;
              return ms < 900 ? true : '100k updates took ' + ms + 'ms — is it recomputing every time?';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why is <code>0.1 + 0.2 !== 0.3</code>?',
        options: ['A JavaScript bug', '0.1 and 0.2 have no exact binary representation', 'Rounding in the display', 'It is equal'],
        answer: 1,
        explain: 'Every IEEE-754 language does this. The values stored are already slightly off before the addition happens.' },
      { q: 'Why prefer a relative tolerance to an absolute one?',
        options: ['It is faster', 'The right absolute tolerance depends entirely on the magnitude of the numbers', 'It handles NaN', 'It is more precise'],
        answer: 1,
        explain: '0.005 is fine for an index at 5,240 and hopelessly coarse for a currency pair at 1.0842.' },
      { q: 'How do you stop a long-running rolling sum from drifting?',
        options: ['Use more decimals', 'Recompute it from the window periodically', 'Round after every operation', 'Use strings'],
        answer: 1,
        explain: 'One occasional full pass discards the accumulated error and costs almost nothing amortised.' }
    ],
    recap: [
      'Binary floating point cannot represent every decimal exactly.',
      'Compare with a tolerance scaled to the magnitude.',
      'Running sums accumulate error — recompute periodically.',
      'Work in integer ticks wherever exactness matters.'
    ],
    vocab: [
      { term: 'Tick grid', def: 'The discrete set of legal prices for an instrument. Working in integer ticks makes price arithmetic exact.' },
      { term: 'Kahan summation', def: 'An algorithm that tracks and corrects the rounding error of each addition. Used when a full recompute is impractical.' }
    ]
  });


  C.push({
    id: 'd095', day: 95, module: 7, minutes: 30,
    title: 'Rendering a Chart',
    subtitle: 'Mapping prices to pixels, with SVG you build yourself.',
    goal: '<b>Goal:</b> turn a bar series into scaled coordinates and generate the SVG for a candlestick chart.',
    objectives: [
      'Build a linear scale between two ranges',
      'Invert the y axis, since screens count downward',
      'Generate SVG path and rect elements from data',
      'Handle the degenerate flat-series case'
    ],
    sections: [
      { h: 'A scale is a linear map between two ranges',
        body: '<p>Every chart is the same function: take a value in the data range and return its position in the pixel range. Writing it once, generically, is what keeps the rest of the drawing code simple.</p>',
        code: 'function makeScale(domainMin, domainMax, rangeMin, rangeMax) {\n  const span = domainMax - domainMin;\n  if (span === 0) return () => (rangeMin + rangeMax) / 2;\n  return v => rangeMin + (v - domainMin) / span * (rangeMax - rangeMin);\n}\n\nconst y = makeScale(5197, 5243, 400, 0);   // note: inverted\nconsole.log("low  5197 ->", y(5197).toFixed(1));\nconsole.log("high 5243 ->", y(5243).toFixed(1));\nconsole.log("mid  5220 ->", y(5220).toFixed(1));' },
      { h: 'The y axis is upside down',
        body: '<p>In SVG and canvas, y increases downward. A price scale therefore maps the data minimum to the <em>bottom</em> pixel value and the maximum to the top — which is simply <code>rangeMin</code> and <code>rangeMax</code> swapped.</p>' +
              '<div class="note note-warn"><b>The chart that looks fine but is upside down</b>If your candles look plausible but every rally points downward, you have forgotten the inversion. It is the single most common charting bug.</div>' },
      { h: 'Padding and the flat series',
        body: '<p>Two details that stop a chart looking broken: pad the price range by a few percent so candles do not touch the edges, and handle the case where every price is identical — a zero-height domain divides by zero and produces <code>NaN</code> coordinates for everything.</p>',
        code: 'function priceDomain(bars, padPercent) {\n  const lows = bars.map(b => b.low), highs = bars.map(b => b.high);\n  let min = Math.min(...lows), max = Math.max(...highs);\n  if (min === max) { min -= 1; max += 1; }\n  const pad = (max - min) * padPercent / 100;\n  return { min: min - pad, max: max + pad };\n}\n\nconsole.log(priceDomain(MARKET.bars.slice(0, 10), 5));\nconsole.log(priceDomain([{ high: 100, low: 100 }], 5));' },
      { h: 'Generating the SVG',
        body: '<p>A candle is two shapes: a thin line from low to high, and a rectangle from open to close. Colour it by direction and you have a chart.</p>',
        code: 'function candle(bar, x, width, yScale) {\n  const up = bar.close >= bar.open;\n  const bodyTop = yScale(Math.max(bar.open, bar.close));\n  const bodyBottom = yScale(Math.min(bar.open, bar.close));\n  const height = Math.max(1, bodyBottom - bodyTop);\n  const colour = up ? "#26d07c" : "#ff5c72";\n  return `<line x1="${x + width / 2}" y1="${yScale(bar.high)}" ` +\n         `x2="${x + width / 2}" y2="${yScale(bar.low)}" stroke="${colour}"/>` +\n         `<rect x="${x}" y="${bodyTop}" width="${width}" height="${height}" fill="${colour}"/>`;\n}\n\nconst yScale = v => 400 - (v - 5197) / 46 * 400;\nconsole.log(candle(MARKET.bars[0], 10, 6, yScale));' }
    ],
    parsons: {
      prompt: 'Build a linear scale from a data range to a pixel range.',
      lines: [
        'const span = domainMax - domainMin;',
        'if (span === 0) return () => (rangeMin + rangeMax) / 2;',
        'return v => rangeMin + (v - domainMin) / span * (rangeMax - rangeMin);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeScale()', difficulty: 'Core',
        prompt: 'Write <code>makeScale(domainMin, domainMax, rangeMin, rangeMax)</code> returning a function mapping a domain value to a range value.<ul>' +
          '<li>It must work when the range is inverted (<code>rangeMin &gt; rangeMax</code>).</li>' +
          '<li>A zero-width domain returns the midpoint of the range for every input.</li>' +
          '<li>Values outside the domain extrapolate rather than clamp.</li></ul>',
        starter: 'function makeScale(domainMin, domainMax, rangeMin, rangeMax) {\n  // a linear mapping function\n}\n',
        solution: 'function makeScale(domainMin, domainMax, rangeMin, rangeMax) {\n  const span = domainMax - domainMin;\n  if (span === 0) return () => (rangeMin + rangeMax) / 2;\n  return v => rangeMin + (v - domainMin) / span * (rangeMax - rangeMin);\n}',
        hints: ['Compute the fraction through the domain, then apply it to the range.',
                'Nothing in the formula assumes the range increases, so inversion works for free.',
                'Guard the zero span before dividing.'],
        tests: { checks: [
          { name: 'maps the endpoints', expose: ['makeScale'],
            run: function (s) {
              var f = s.makeScale(0, 100, 0, 400);
              if (f(0) !== 0) return 'the domain minimum should map to the range minimum';
              if (f(100) !== 400) return 'the domain maximum should map to the range maximum';
              return f(50) === 200 ? true : 'the midpoint gave ' + f(50);
            } },
          { name: 'handles an inverted range', expose: ['makeScale'],
            run: function (s) {
              var y = s.makeScale(5197, 5243, 400, 0);
              if (Math.abs(y(5197) - 400) > 1e-9) return 'the low price should be at the bottom';
              if (Math.abs(y(5243) - 0) > 1e-9) return 'the high price should be at the top';
              return y(5220) > 0 && y(5220) < 400 ? true : 'the midpoint should be inside the range';
            } },
          { name: 'a zero-width domain returns the range midpoint', expose: ['makeScale'],
            run: function (s) {
              var f = s.makeScale(100, 100, 0, 400);
              return (f(100) === 200 && f(50) === 200) ? true : 'expected 200 for every input, got ' + f(100);
            } },
          { name: 'extrapolates outside the domain', expose: ['makeScale'],
            run: function (s) {
              var f = s.makeScale(0, 100, 0, 100);
              return (f(150) === 150 && f(-50) === -50) ? true : 'values outside the domain should extrapolate';
            } }
        ] } },
      { id: 'e2', title: 'priceDomain() and layout', difficulty: 'Core',
        prompt: 'Write two helpers:<ul>' +
          '<li><code>priceDomain(bars, padPercent)</code> — <code>{ min, max }</code> spanning every low and high, padded by <code>padPercent</code> of the raw span on each side. A flat series (min equals max) widens by 1 on each side <em>before</em> padding. Empty input gives <code>{ min: 0, max: 1 }</code>.</li>' +
          '<li><code>barLayout(count, width, gapRatio)</code> — <code>{ slotWidth, barWidth }</code> where each bar occupies <code>width / count</code> and the drawn body is <code>slotWidth × (1 - gapRatio)</code>, never below 1. A count of 0 gives both as 0.</li></ul>',
        expose: ['priceDomain', 'barLayout'],
        starter: 'function priceDomain(bars, padPercent) {\n}\n\nfunction barLayout(count, width, gapRatio) {\n}\n',
        solution: 'function priceDomain(bars, padPercent) {\n  if (!bars.length) return { min: 0, max: 1 };\n  let min = Math.min(...bars.map(b => b.low));\n  let max = Math.max(...bars.map(b => b.high));\n  if (min === max) { min -= 1; max += 1; }\n  const pad = (max - min) * padPercent / 100;\n  return { min: min - pad, max: max + pad };\n}\n\nfunction barLayout(count, width, gapRatio) {\n  if (count <= 0) return { slotWidth: 0, barWidth: 0 };\n  const slotWidth = width / count;\n  return { slotWidth, barWidth: Math.max(1, slotWidth * (1 - gapRatio)) };\n}',
        hints: ['Widen the flat case first, then compute the padding from the widened span.',
                'The empty case has no data at all — return a usable placeholder domain.',
                'A minimum bar width of 1 pixel keeps candles visible when there are hundreds of them.'],
        tests: { checks: [
          { name: 'spans the lows and highs with padding', expose: ['priceDomain'],
            run: function (s) {
              var d = s.priceDomain([{ low: 100, high: 200 }], 10);
              return (Math.abs(d.min - 90) < 1e-9 && Math.abs(d.max - 210) < 1e-9)
                ? true : 'got ' + JSON.stringify(d);
            } },
          { name: 'widens a flat series', expose: ['priceDomain'],
            run: function (s) {
              var d = s.priceDomain([{ low: 100, high: 100 }], 0);
              return (d.min === 99 && d.max === 101) ? true : 'got ' + JSON.stringify(d);
            } },
          { name: 'an empty series gives a usable domain', expose: ['priceDomain'],
            run: function (s, h) {
              return h.eq(s.priceDomain([], 5), { min: 0, max: 1 }) ? true : 'expected { min: 0, max: 1 }';
            } },
          { name: 'covers the whole real session', expose: ['priceDomain'],
            run: function (s) {
              var d = s.priceDomain(MARKET.bars, 5);
              var lo = Math.min.apply(null, MARKET.lows), hi = Math.max.apply(null, MARKET.highs);
              return (d.min < lo && d.max > hi) ? true : 'the padded domain should contain every bar';
            } },
          { name: 'barLayout divides the width', expose: ['barLayout'],
            run: function (s) {
              var l = s.barLayout(10, 500, 0.2);
              if (l.slotWidth !== 50) return 'slotWidth should be 50, got ' + l.slotWidth;
              return Math.abs(l.barWidth - 40) < 1e-9 ? true : 'barWidth should be 40, got ' + l.barWidth;
            } },
          { name: 'barWidth never drops below 1', expose: ['barLayout'],
            run: function (s) {
              var l = s.barLayout(2000, 500, 0.2);
              return l.barWidth >= 1 ? true : 'barWidth was ' + l.barWidth;
            } },
          { name: 'a count of zero gives zeros', expose: ['barLayout'],
            run: function (s, h) {
              return h.eq(s.barLayout(0, 500, 0.2), { slotWidth: 0, barWidth: 0 }) ? true : 'expected zeros';
            } }
        ] } },
      { id: 'e3', title: 'renderCandles()', difficulty: 'Stretch',
        prompt: 'Write <code>renderCandles(bars, options)</code> returning an SVG string.<br>' +
          '<code>options</code> is <code>{ width, height, padPercent, gapRatio, upColour, downColour }</code>.<ol>' +
          '<li>Compute the padded price domain and a y scale mapping <code>min</code> to <code>height</code> and <code>max</code> to <code>0</code>.</li>' +
          '<li>Lay out the bars across the width.</li>' +
          '<li>For each bar emit a <code>&lt;line&gt;</code> from high to low at the slot centre and a <code>&lt;rect&gt;</code> from the higher of open/close to the lower, with a minimum height of 1.</li>' +
          '<li>Colour by direction: <code>close &gt;= open</code> uses <code>upColour</code>.</li>' +
          '<li>Wrap everything in <code>&lt;svg width="…" height="…" viewBox="0 0 W H"&gt;…&lt;/svg&gt;</code>.</li></ol>' +
          '<span class="muted">An empty bar list still returns a valid empty <code>&lt;svg&gt;</code> element.</span>',
        starter: 'function renderCandles(bars, options) {\n  // an SVG string\n}\n',
        solution: 'function renderCandles(bars, options) {\n  const { width, height, padPercent, gapRatio, upColour, downColour } = options;\n  const open = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;\n  if (!bars.length) return open + "</svg>";\n\n  let min = Math.min(...bars.map(b => b.low));\n  let max = Math.max(...bars.map(b => b.high));\n  if (min === max) { min -= 1; max += 1; }\n  const pad = (max - min) * padPercent / 100;\n  min -= pad; max += pad;\n\n  const span = max - min;\n  const y = v => span === 0 ? height / 2 : height - (v - min) / span * height;\n\n  const slotWidth = width / bars.length;\n  const barWidth = Math.max(1, slotWidth * (1 - gapRatio));\n\n  const parts = bars.map((bar, i) => {\n    const x = i * slotWidth + (slotWidth - barWidth) / 2;\n    const centre = i * slotWidth + slotWidth / 2;\n    const up = bar.close >= bar.open;\n    const colour = up ? upColour : downColour;\n    const top = y(Math.max(bar.open, bar.close));\n    const bottom = y(Math.min(bar.open, bar.close));\n    const h = Math.max(1, bottom - top);\n    return `<line x1="${centre}" y1="${y(bar.high)}" x2="${centre}" y2="${y(bar.low)}" stroke="${colour}"/>` +\n      `<rect x="${x}" y="${top}" width="${barWidth}" height="${h}" fill="${colour}"/>`;\n  });\n\n  return open + parts.join("") + "</svg>";\n}',
        hints: ['Build the domain and the scale first, then the layout, then map the bars to markup.',
                'Centre the body within its slot so the wick runs through its middle.',
                'The minimum body height of 1 keeps a doji visible instead of invisible.'],
        tests: { checks: [
          { name: 'produces one line and one rect per bar', expose: ['renderCandles'],
            run: function (s) {
              var svg = s.renderCandles(MARKET.bars.slice(0, 10), {
                width: 500, height: 300, padPercent: 5, gapRatio: 0.2,
                upColour: '#26d07c', downColour: '#ff5c72'
              });
              var lines = (svg.match(/<line /g) || []).length;
              var rects = (svg.match(/<rect /g) || []).length;
              return (lines === 10 && rects === 10) ? true : 'got ' + lines + ' lines and ' + rects + ' rects';
            } },
          { name: 'wraps in an svg element with a viewBox', expose: ['renderCandles'],
            run: function (s) {
              var svg = s.renderCandles([{ open: 1, high: 2, low: 0, close: 1.5 }], {
                width: 500, height: 300, padPercent: 5, gapRatio: 0.2,
                upColour: 'g', downColour: 'r'
              });
              if (svg.indexOf('<svg') !== 0) return 'the output should start with <svg';
              if (svg.indexOf('viewBox="0 0 500 300"') < 0) return 'the viewBox is missing or wrong';
              return svg.trim().endsWith('</svg>') ? true : 'the output should end with </svg>';
            } },
          { name: 'colours by direction', expose: ['renderCandles'],
            run: function (s) {
              var up = s.renderCandles([{ open: 1, high: 2, low: 0, close: 1.5 }], {
                width: 100, height: 100, padPercent: 0, gapRatio: 0, upColour: 'UP', downColour: 'DOWN'
              });
              var down = s.renderCandles([{ open: 1.5, high: 2, low: 0, close: 1 }], {
                width: 100, height: 100, padPercent: 0, gapRatio: 0, upColour: 'UP', downColour: 'DOWN'
              });
              if (up.indexOf('UP') < 0 || up.indexOf('DOWN') >= 0) return 'an up bar should use upColour only';
              return (down.indexOf('DOWN') >= 0 && down.indexOf('UP') < 0)
                ? true : 'a down bar should use downColour only';
            } },
          { name: 'the y axis is inverted', expose: ['renderCandles'],
            run: function (s) {
              var svg = s.renderCandles([{ open: 10, high: 10, low: 0, close: 0 }], {
                width: 100, height: 100, padPercent: 0, gapRatio: 0, upColour: 'g', downColour: 'r'
              });
              var m = svg.match(/<line x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/);
              if (!m) return 'no line was emitted';
              var yHigh = parseFloat(m[1]), yLow = parseFloat(m[2]);
              return yHigh < yLow ? true : 'the high should have a smaller y than the low (got ' + yHigh + ' vs ' + yLow + ')';
            } },
          { name: 'every coordinate is finite', expose: ['renderCandles'],
            run: function (s) {
              var svg = s.renderCandles(MARKET.bars, {
                width: 800, height: 400, padPercent: 5, gapRatio: 0.25,
                upColour: 'g', downColour: 'r'
              });
              return svg.indexOf('NaN') < 0 ? true : 'the output contains NaN coordinates';
            } },
          { name: 'a flat series still renders', expose: ['renderCandles'],
            run: function (s) {
              var flat = [{ open: 100, high: 100, low: 100, close: 100 },
                          { open: 100, high: 100, low: 100, close: 100 }];
              var svg = s.renderCandles(flat, {
                width: 200, height: 100, padPercent: 5, gapRatio: 0.2, upColour: 'g', downColour: 'r'
              });
              if (svg.indexOf('NaN') >= 0) return 'a flat series produced NaN coordinates';
              return (svg.match(/<rect /g) || []).length === 2 ? true : 'expected 2 candles';
            } },
          { name: 'no bars gives an empty svg', expose: ['renderCandles'],
            run: function (s) {
              var svg = s.renderCandles([], {
                width: 100, height: 50, padPercent: 5, gapRatio: 0.2, upColour: 'g', downColour: 'r'
              });
              if (svg.indexOf('<svg') !== 0 || !svg.trim().endsWith('</svg>')) return 'expected a valid svg element';
              return (svg.match(/<rect /g) || []).length === 0 ? true : 'an empty series should draw nothing';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why does a price scale map the minimum to the largest pixel value?',
        options: ['Convention', 'Screen y increases downward, so the chart must be inverted', 'To save space', 'It does not'],
        answer: 1,
        explain: 'Forgetting the inversion produces a chart that looks plausible and is upside down.' },
      { q: 'What happens when every bar has the same price?',
        options: ['Nothing special', 'The domain has zero width and dividing by it gives NaN coordinates', 'The chart is blank', 'An exception'],
        answer: 1,
        explain: 'Widen the domain artificially so there is something to scale against.' },
      { q: 'Why give a candle body a minimum height of 1 pixel?',
        options: ['Style', 'A bar closing exactly at its open would otherwise be invisible', 'For alignment', 'It is unnecessary'],
        answer: 1,
        explain: 'A doji has zero body height. Without a floor it simply disappears from the chart.' }
    ],
    recap: [
      'A scale is a linear map between a data range and a pixel range.',
      'The y axis is inverted on screen.',
      'Pad the domain, and widen it when the series is flat.',
      'Give bodies a minimum height so dojis stay visible.'
    ],
    vocab: [
      { term: 'Doji', def: 'A bar closing at or very near its open. Zero body height, and invisible on a chart without a minimum.' },
      { term: 'Domain and range', def: 'The input span of the data and the output span of the pixels. A scale maps one to the other.' }
    ]
  });

  C.push({
    id: 'd096', day: 96, module: 7, minutes: 30,
    title: 'Logging and Observability',
    subtitle: 'What you will wish you had recorded, at 09:31 tomorrow.',
    goal: '<b>Goal:</b> produce structured logs and metrics that let you reconstruct what a live system did and why.',
    objectives: [
      'Log structured records rather than sentences',
      'Use levels and filter by them',
      'Attach a correlation id to related records',
      'Track counters and latency percentiles'
    ],
    sections: [
      { h: 'Structured beats prose',
        body: '<p><code>console.log("Bought 2 ES at 5240.25")</code> is unsearchable. A structured record — <code>{ event: "fill", symbol: "ES", qty: 2, price: 5240.25 }</code> — can be filtered, aggregated and graphed without parsing English.</p>',
        code: 'function makeLogger(sink, level = "info") {\n  const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };\n  const min = LEVELS[level];\n  return {\n    log(lvl, event, fields) {\n      if (LEVELS[lvl] < min) return false;\n      sink({ level: lvl, event, at: fields.at, ...fields });\n      return true;\n    }\n  };\n}\n\nconst out = [];\nconst log = makeLogger(r => out.push(r), "info");\nlog.log("debug", "tick", { at: 1, price: 5240 });\nlog.log("info", "fill", { at: 2, symbol: "ES", qty: 2, price: 5240.25 });\nconsole.log(out);' },
      { h: 'Correlation ids',
        body: '<p>A single decision produces a signal, a risk check, an order, an acknowledgement and a fill — possibly interleaved with three other decisions. Without a shared id, reconstructing one of them from the log is guesswork.</p>' +
              '<div class="note note-trade"><b>The question you will actually ask</b>"Why did we buy at 09:31:14?" is answerable in seconds if every record from that decision shares an id, and nearly unanswerable if they do not.</div>',
        code: 'let nextId = 1;\nfunction startDecision() { return "d" + (nextId++); }\n\nconst id = startDecision();\n["signal", "risk-check", "order-sent", "fill"].forEach(event =>\n  console.log(JSON.stringify({ correlationId: id, event })));' },
      { h: 'Counters and latency',
        body: '<p>Logs tell you about individual events; metrics tell you about the system. The three that matter for a trading loop: how many events of each type, how long the loop takes, and how deep the queue is.</p>' +
              '<p>Report latency as percentiles, never as an average. A mean of 2ms hides a p99 of 400ms, and the p99 is what actually costs you fills.</p>',
        code: 'function percentile(values, p) {\n  if (!values.length) return 0;\n  const sorted = [...values].sort((a, b) => a - b);\n  return sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length))];\n}\n\nconst latencies = [1, 1, 1, 2, 1, 1, 2, 1, 400, 1];\nconst mean = latencies.reduce((a, b) => a + b, 0) / latencies.length;\nconsole.log("mean:", mean.toFixed(1) + "ms — looks fine");\nconsole.log("p50:", percentile(latencies, 50) + "ms");\nconsole.log("p99:", percentile(latencies, 99) + "ms — the real story");' },
      { h: 'What to log, and what not to',
        body: '<p><strong>Always:</strong> every order sent and every response received, every risk veto with its reason, every state transition, every error with its context.</p>' +
              '<p><strong>Never:</strong> credentials, API keys, or full account numbers. A log file is copied, emailed and pasted into issue trackers; treat everything in it as public.</p>' +
              '<p><strong>Sparingly:</strong> per-tick records. At thousands per second they cost more than they reveal — sample them, or log only on change.</p>' }
    ],
    parsons: {
      prompt: 'Drop a record below the configured level.',
      lines: [
        'const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };',
        'if (LEVELS[level] < LEVELS[minLevel]) return false;',
        'sink({ level, event, ...fields });',
        'return true;'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeLogger()', difficulty: 'Core',
        prompt: 'Write <code>makeLogger(sink, minLevel)</code> returning an object with <code>debug</code>, <code>info</code>, <code>warn</code> and <code>error</code> methods, each taking <code>(event, fields)</code>.<ul>' +
          '<li>Levels rank debug &lt; info &lt; warn &lt; error; anything below <code>minLevel</code> is dropped.</li>' +
          '<li>An emitted record is <code>{ level, event, ...fields }</code>.</li>' +
          '<li>Each method returns whether the record was emitted.</li>' +
          '<li>Also expose <code>setLevel(level)</code> to change the threshold at runtime.</li></ul>',
        expose: ['makeLogger'],
        starter: 'function makeLogger(sink, minLevel) {\n  // { debug, info, warn, error, setLevel }\n}\n',
        solution: 'function makeLogger(sink, minLevel) {\n  const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };\n  let threshold = LEVELS[minLevel];\n  function emit(level, event, fields) {\n    if (LEVELS[level] < threshold) return false;\n    sink({ level, event, ...(fields || {}) });\n    return true;\n  }\n  return {\n    debug: (e, f) => emit("debug", e, f),\n    info: (e, f) => emit("info", e, f),\n    warn: (e, f) => emit("warn", e, f),\n    error: (e, f) => emit("error", e, f),\n    setLevel(level) { threshold = LEVELS[level]; }\n  };\n}',
        hints: ['A numeric rank per level makes the comparison a single expression.',
                'Keep the threshold in a mutable closure variable so <code>setLevel</code> can change it.',
                'Spread the fields after <code>level</code> and <code>event</code>.'],
        tests: { checks: [
          { name: 'emits at or above the threshold', expose: ['makeLogger'],
            run: function (s) {
              var out = [];
              var log = s.makeLogger(function (r) { out.push(r); }, 'info');
              if (log.debug('tick', { price: 1 }) !== false) return 'debug should be dropped at info level';
              if (log.info('fill', { qty: 2 }) !== true) return 'info should be emitted';
              if (out.length !== 1) return 'expected 1 record, got ' + out.length;
              return (out[0].level === 'info' && out[0].event === 'fill' && out[0].qty === 2)
                ? true : 'the record was ' + JSON.stringify(out[0]);
            } },
          { name: 'warn and error always pass at info level', expose: ['makeLogger'],
            run: function (s) {
              var out = [];
              var log = s.makeLogger(function (r) { out.push(r); }, 'info');
              log.warn('slow', {});
              log.error('rejected', {});
              return out.length === 2 ? true : 'expected 2 records, got ' + out.length;
            } },
          { name: 'setLevel changes the threshold', expose: ['makeLogger'],
            run: function (s) {
              var out = [];
              var log = s.makeLogger(function (r) { out.push(r); }, 'error');
              log.info('a', {});
              if (out.length !== 0) return 'info should be dropped at error level';
              log.setLevel('debug');
              log.debug('b', {});
              return out.length === 1 ? true : 'after setLevel, debug should be emitted';
            } },
          { name: 'missing fields are handled', expose: ['makeLogger'],
            run: function (s) {
              var out = [];
              var log = s.makeLogger(function (r) { out.push(r); }, 'debug');
              try { log.info('bare'); } catch (e) { return 'calling without fields threw: ' + e.message; }
              return out[0].event === 'bare' ? true : 'the record was ' + JSON.stringify(out[0]);
            } }
        ] } },
      { id: 'e2', title: 'makeMetrics()', difficulty: 'Core',
        prompt: 'Write <code>makeMetrics()</code> returning:<ul>' +
          '<li><code>count(name)</code> — increment a named counter</li>' +
          '<li><code>observe(name, value)</code> — record a value in a named distribution</li>' +
          '<li><code>snapshot()</code> — <code>{ counters, distributions }</code>, where each distribution is <code>{ count, min, max, mean, p50, p95, p99 }</code></li></ul>' +
          'Use the percentile rule <code>sorted[min(length - 1, floor(p / 100 × length))]</code>. An unobserved name simply does not appear.',
        expose: ['makeMetrics'],
        starter: 'function makeMetrics() {\n  // { count, observe, snapshot }\n}\n',
        solution: 'function makeMetrics() {\n  const counters = {};\n  const samples = {};\n  const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length))];\n  return {\n    count(name) { counters[name] = (counters[name] || 0) + 1; },\n    observe(name, value) {\n      if (!samples[name]) samples[name] = [];\n      samples[name].push(value);\n    },\n    snapshot() {\n      const distributions = {};\n      for (const name of Object.keys(samples)) {\n        const sorted = [...samples[name]].sort((a, b) => a - b);\n        distributions[name] = {\n          count: sorted.length,\n          min: sorted[0],\n          max: sorted[sorted.length - 1],\n          mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,\n          p50: pct(sorted, 50),\n          p95: pct(sorted, 95),\n          p99: pct(sorted, 99)\n        };\n      }\n      return { counters: { ...counters }, distributions };\n    }\n  };\n}',
        hints: ['Keep counters and raw samples in separate objects.',
                'Sort a copy in <code>snapshot</code> so repeated calls stay correct.',
                'Return copies so a caller cannot mutate the internals.'],
        tests: { checks: [
          { name: 'counts events', expose: ['makeMetrics'],
            run: function (s) {
              var m = s.makeMetrics();
              m.count('fills'); m.count('fills'); m.count('rejects');
              var snap = m.snapshot();
              return (snap.counters.fills === 2 && snap.counters.rejects === 1)
                ? true : 'got ' + JSON.stringify(snap.counters);
            } },
          { name: 'summarises a distribution', expose: ['makeMetrics'],
            run: function (s) {
              var m = s.makeMetrics();
              [1, 1, 1, 2, 1, 1, 2, 1, 400, 1].forEach(function (v) { m.observe('latency', v); });
              var d = m.snapshot().distributions.latency;
              if (d.count !== 10) return 'count was ' + d.count;
              if (d.min !== 1 || d.max !== 400) return 'min/max were ' + d.min + '/' + d.max;
              if (d.p50 !== 1) return 'p50 should be 1, got ' + d.p50;
              return d.p99 === 400 ? true : 'p99 should be 400, got ' + d.p99;
            } },
          { name: 'the mean hides the tail', expose: ['makeMetrics'],
            run: function (s) {
              var m = s.makeMetrics();
              [1, 1, 1, 2, 1, 1, 2, 1, 400, 1].forEach(function (v) { m.observe('latency', v); });
              var d = m.snapshot().distributions.latency;
              return (d.mean < 50 && d.p99 === 400) ? true : 'the mean should look benign next to the p99';
            } },
          { name: 'repeated snapshots stay correct', expose: ['makeMetrics'],
            run: function (s) {
              var m = s.makeMetrics();
              [3, 1, 2].forEach(function (v) { m.observe('x', v); });
              var a = m.snapshot().distributions.x;
              var b = m.snapshot().distributions.x;
              return (a.min === b.min && a.max === b.max && a.p50 === b.p50)
                ? true : 'the second snapshot differed from the first';
            } },
          { name: 'an empty metrics object snapshots cleanly', expose: ['makeMetrics'],
            run: function (s, h) {
              var snap = s.makeMetrics().snapshot();
              return (h.eq(snap.counters, {}) && h.eq(snap.distributions, {}))
                ? true : 'expected empty objects';
            } }
        ] } },
      { id: 'e3', title: 'makeTracer()', difficulty: 'Stretch',
        prompt: 'Write <code>makeTracer(logger, now)</code> tying a decision\'s records together:<ul>' +
          '<li><code>start(name)</code> — begins a trace, returning <code>{ id, step, end }</code></li>' +
          '<li><code>step(event, fields)</code> — logs at info with the trace id, the trace name and the elapsed milliseconds since the trace began</li>' +
          '<li><code>end(outcome)</code> — logs an <code>"end"</code> event with the outcome and the total duration, then refuses any further calls (both <code>step</code> and a second <code>end</code> return <code>false</code>)</li>' +
          '<li><code>activeCount()</code> on the tracer — how many traces are still open</li></ul>' +
          'Trace ids are <code>"t1"</code>, <code>"t2"</code> and so on.',
        expose: ['makeTracer'],
        starter: 'function makeTracer(logger, now) {\n  // { start, activeCount }\n}\n',
        solution: 'function makeTracer(logger, now) {\n  let nextId = 1;\n  let active = 0;\n  return {\n    start(name) {\n      const id = "t" + (nextId++);\n      const startedAt = now();\n      let done = false;\n      active++;\n      return {\n        id,\n        step(event, fields) {\n          if (done) return false;\n          logger.info(event, { ...(fields || {}), traceId: id, trace: name, elapsed: now() - startedAt });\n          return true;\n        },\n        end(outcome) {\n          if (done) return false;\n          done = true;\n          active--;\n          logger.info("end", { traceId: id, trace: name, outcome, duration: now() - startedAt });\n          return true;\n        }\n      };\n    },\n    activeCount() { return active; }\n  };\n}',
        hints: ['Each trace closes over its own id, start time and done flag.',
                'The tracer keeps the shared counter and the active total.',
                'Decrement the active count exactly once, inside the <code>done</code> guard.'],
        tests: { checks: [
          { name: 'every step carries the trace id', expose: ['makeTracer'],
            run: function (s) {
              var out = [];
              var logger = { info: function (e, f) { out.push({ e: e, f: f }); } };
              var t = 0;
              var tracer = s.makeTracer(logger, function () { return t; });
              var trace = tracer.start('entry');
              trace.step('signal', { side: 'long' });
              trace.step('risk-check', { allowed: true });
              if (out.length !== 2) return 'expected 2 records, got ' + out.length;
              return (out[0].f.traceId === trace.id && out[1].f.traceId === trace.id)
                ? true : 'the records do not share a trace id';
            } },
          { name: 'elapsed and duration come from the clock', expose: ['makeTracer'],
            run: function (s) {
              var out = [];
              var logger = { info: function (e, f) { out.push({ e: e, f: f }); } };
              var t = 100;
              var tracer = s.makeTracer(logger, function () { return t; });
              var trace = tracer.start('entry');
              t = 105;
              trace.step('signal', {});
              t = 120;
              trace.end('filled');
              if (out[0].f.elapsed !== 5) return 'elapsed should be 5, got ' + out[0].f.elapsed;
              return out[1].f.duration === 20 ? true : 'duration should be 20, got ' + out[1].f.duration;
            } },
          { name: 'end records the outcome once', expose: ['makeTracer'],
            run: function (s) {
              var out = [];
              var logger = { info: function (e, f) { out.push({ e: e, f: f }); } };
              var tracer = s.makeTracer(logger, function () { return 0; });
              var trace = tracer.start('entry');
              if (trace.end('filled') !== true) return 'the first end should succeed';
              if (trace.end('filled') !== false) return 'a second end should be refused';
              if (trace.step('late', {}) !== false) return 'a step after end should be refused';
              return out.filter(function (r) { return r.e === 'end'; }).length === 1
                ? true : 'exactly one end record should be logged';
            } },
          { name: 'trace ids are unique and sequential', expose: ['makeTracer'],
            run: function (s) {
              var tracer = s.makeTracer({ info: function () {} }, function () { return 0; });
              var a = tracer.start('x'), b = tracer.start('y');
              return (a.id === 't1' && b.id === 't2') ? true : 'ids were ' + a.id + ' and ' + b.id;
            } },
          { name: 'activeCount tracks open traces', expose: ['makeTracer'],
            run: function (s) {
              var tracer = s.makeTracer({ info: function () {} }, function () { return 0; });
              if (tracer.activeCount() !== 0) return 'should start at 0';
              var a = tracer.start('x'), b = tracer.start('y');
              if (tracer.activeCount() !== 2) return 'expected 2 open traces';
              a.end('done');
              a.end('done');
              return tracer.activeCount() === 1 ? true : 'a double end should not decrement twice';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why log structured records rather than sentences?',
        options: ['They are shorter', 'They can be filtered and aggregated without parsing English', 'They are faster to write', 'Convention'],
        answer: 1,
        explain: '"How many fills over 5240 today?" is a query against structured data and a text-search nightmare against prose.' },
      { q: 'What is a correlation id for?',
        options: ['Deduplication', 'Tying together every record produced by one decision', 'Security', 'Ordering'],
        answer: 1,
        explain: 'Without it, reconstructing one decision from interleaved logs is guesswork.' },
      { q: 'Why report latency percentiles rather than the mean?',
        options: ['Percentiles are easier', 'A benign mean can hide a p99 that is costing you fills', 'The mean is undefined', 'They are equivalent'],
        answer: 1,
        explain: 'A mean of 2ms with a p99 of 400ms describes a system that is fine 99 times and unusable the hundredth.' }
    ],
    recap: [
      'Log structured records with a level and an event name.',
      'Give every decision a correlation id.',
      'Track counters and latency percentiles, not averages.',
      'Never log credentials — assume every log file becomes public.'
    ],
    vocab: [
      { term: 'Observability', def: 'Being able to answer questions about a running system from its outputs, without adding new instrumentation.' },
      { term: 'p99 latency', def: 'The value 99% of measurements fall below. The number that describes the bad case rather than the typical one.' }
    ]
  });


  C.push({
    id: 'd097', day: 97, module: 7, minutes: 30,
    title: 'Configuration and Reproducibility',
    subtitle: 'A run you cannot reproduce is a run you cannot learn from.',
    goal: '<b>Goal:</b> merge configuration from layers, validate it, and record exactly what a run used.',
    objectives: [
      'Layer defaults, file config and overrides',
      'Validate configuration against a schema',
      'Keep secrets out of the config object and the logs',
      'Fingerprint a run so it can be reproduced'
    ],
    sections: [
      { h: 'Configuration comes in layers',
        body: '<p>Defaults in code, then a file, then environment variables, then command-line overrides — each layer wins over the ones before it. Merging in a fixed order makes "why is this value 20?" answerable.</p>',
        code: 'function mergeLayers(...layers) {\n  return layers.reduce((acc, layer) => ({ ...acc, ...(layer || {}) }), {});\n}\n\nconst defaults = { fast: 9, slow: 21, riskPercent: 1 };\nconst file = { slow: 34 };\nconst cli = { riskPercent: 0.5 };\nconsole.log(mergeLayers(defaults, file, cli));' },
      { h: 'Validate before running, not during',
        body: '<p>A typo in a config key is silently ignored by a plain merge, and the run proceeds with the default. Validating against a schema turns that into an error at startup instead of a puzzling result three hours later.</p>',
        code: 'const SCHEMA = {\n  fast: { type: "number", min: 1, max: 200 },\n  slow: { type: "number", min: 1, max: 500 },\n  riskPercent: { type: "number", min: 0.01, max: 10 }\n};\n\nfunction validate(config, schema) {\n  const errors = [];\n  for (const key of Object.keys(config)) {\n    if (!schema[key]) errors.push(`unknown key: ${key}`);\n  }\n  for (const [key, rule] of Object.entries(schema)) {\n    const v = config[key];\n    if (v === undefined) { errors.push(`missing: ${key}`); continue; }\n    if (typeof v !== rule.type) errors.push(`${key} should be a ${rule.type}`);\n    else if (v < rule.min || v > rule.max) errors.push(`${key} out of range: ${v}`);\n  }\n  return errors;\n}\n\nconsole.log(validate({ fast: 9, slow: 21, riskPercent: 1 }, SCHEMA));\nconsole.log(validate({ fast: 9, slow: 21, riskPct: 1 }, SCHEMA));' },
      { h: 'Secrets are not configuration',
        body: '<div class="note note-warn"><b>Keep them apart, structurally</b>API keys and passwords belong in a separate object that is never logged, never serialised into a run record, and never committed. Mixing them into the config object means one careless <code>JSON.stringify</code> puts your broker credentials in a log file — which then gets pasted into an issue.</div>' +
              '<p>The practical rule: config describes <em>what the run does</em>; secrets describe <em>how it authenticates</em>. Different objects, different lifetimes, different handling.</p>' },
      { h: 'Fingerprint the run',
        body: '<p>Record the configuration, the data range, the code version and the random seed together, and hash them. Two runs with the same fingerprint should produce identical results — and if they do not, something non-deterministic is loose in your system.</p>',
        code: 'function fingerprint(obj) {\n  const canonical = JSON.stringify(obj, Object.keys(obj).sort());\n  let h = 2166136261;\n  for (let i = 0; i < canonical.length; i++) {\n    h ^= canonical.charCodeAt(i);\n    h = Math.imul(h, 16777619);\n  }\n  return (h >>> 0).toString(16).padStart(8, "0");\n}\n\nconsole.log(fingerprint({ fast: 9, slow: 21, seed: 42 }));\nconsole.log(fingerprint({ slow: 21, seed: 42, fast: 9 }));   // same, order-independent\nconsole.log(fingerprint({ fast: 10, slow: 21, seed: 42 }));' }
    ],
    parsons: {
      prompt: 'Merge configuration layers, later winning.',
      lines: [
        'return layers.reduce(',
        '  (acc, layer) => ({ ...acc, ...(layer || {}) }),',
        '  {}',
        ');'
      ]
    },
    exercises: [
      { id: 'e1', title: 'mergeConfig()', difficulty: 'Core',
        prompt: 'Write <code>mergeConfig(...layers)</code> merging any number of layers, later ones winning.<ul>' +
          '<li>A <code>null</code> or <code>undefined</code> layer is skipped.</li>' +
          '<li>A key whose value is <code>undefined</code> does not override an earlier value.</li>' +
          '<li>The inputs must not be modified.</li></ul>',
        starter: 'function mergeConfig(...layers) {\n  // later layers win\n}\n',
        solution: 'function mergeConfig(...layers) {\n  const out = {};\n  for (const layer of layers) {\n    if (!layer) continue;\n    for (const [k, v] of Object.entries(layer)) {\n      if (v !== undefined) out[k] = v;\n    }\n  }\n  return out;\n}',
        hints: ['A plain spread would let an explicit <code>undefined</code> overwrite a real value — copy key by key instead.',
                'Skip falsy layers before iterating them.'],
        tests: { fn: 'mergeConfig', cases: [
          { args: [{ fast: 9, slow: 21 }, { slow: 34 }], expect: { fast: 9, slow: 34 } },
          { args: [{ a: 1 }, null, { b: 2 }, undefined], expect: { a: 1, b: 2 },
            name: 'null layers are skipped' },
          { args: [{ a: 1 }, { a: undefined }], expect: { a: 1 },
            name: 'an undefined value does not override' },
          { args: [], expect: {} },
          { args: [{ a: 0 }, { a: 0 }], expect: { a: 0 }, name: 'a value of 0 is a real value' }
        ], checks: [{
          name: 'does not modify any input layer', expose: ['mergeConfig'],
          run: function (s) {
            var a = { x: 1 }, b = { x: 2 };
            s.mergeConfig(a, b);
            return (a.x === 1 && b.x === 2) ? true : 'an input layer was mutated';
          }
        }] } },
      { id: 'e2', title: 'validateConfig()', difficulty: 'Core',
        prompt: 'Write <code>validateConfig(config, schema)</code> returning an array of problem strings, empty when valid.<br>' +
          'A schema entry is <code>{ type, min, max }</code> (<code>min</code>/<code>max</code> optional). Report, in this order:<ol>' +
          '<li>every key in <code>config</code> not in the schema, as <code>"unknown key: NAME"</code></li>' +
          '<li>for each schema key in order: <code>"missing: NAME"</code> when absent, <code>"NAME should be a TYPE"</code> on a type mismatch, or <code>"NAME out of range: VALUE"</code> when outside the bounds</li></ol>' +
          'Report at most one problem per schema key.',
        starter: 'function validateConfig(config, schema) {\n  // an array of problems\n}\n',
        solution: 'function validateConfig(config, schema) {\n  const errors = [];\n  for (const key of Object.keys(config)) {\n    if (!schema[key]) errors.push(`unknown key: ${key}`);\n  }\n  for (const [key, rule] of Object.entries(schema)) {\n    const v = config[key];\n    if (v === undefined) { errors.push(`missing: ${key}`); continue; }\n    if (typeof v !== rule.type) { errors.push(`${key} should be a ${rule.type}`); continue; }\n    if ((rule.min !== undefined && v < rule.min) || (rule.max !== undefined && v > rule.max)) {\n      errors.push(`${key} out of range: ${v}`);\n    }\n  }\n  return errors;\n}',
        hints: ['Two passes: unknown keys first, then the schema in its own order.',
                '<code>continue</code> after each problem so a key produces at most one message.',
                'Only apply the range check when a bound is actually defined.'],
        tests: { fn: 'validateConfig', cases: [
          { args: [{ fast: 9 }, { fast: { type: 'number', min: 1, max: 200 } }], expect: [] },
          { args: [{ fast: 9, typo: 1 }, { fast: { type: 'number' } }], expect: ['unknown key: typo'] },
          { args: [{}, { fast: { type: 'number' } }], expect: ['missing: fast'] },
          { args: [{ fast: '9' }, { fast: { type: 'number' } }], expect: ['fast should be a number'] },
          { args: [{ fast: 500 }, { fast: { type: 'number', min: 1, max: 200 } }],
            expect: ['fast out of range: 500'] },
          { args: [{ fast: 9 }, { fast: { type: 'number' }, slow: { type: 'number' } }],
            expect: ['missing: slow'] },
          { args: [{ a: 1, b: 2 }, {}], expect: ['unknown key: a', 'unknown key: b'] }
        ], checks: [{
          name: 'reports one problem per key', expose: ['validateConfig'],
          run: function (s) {
            var out = s.validateConfig({ fast: 'x' }, { fast: { type: 'number', min: 1, max: 10 } });
            return out.length === 1 ? true : 'a type mismatch should not also report a range error';
          }
        }] } },
      { id: 'e3', title: 'makeRunRecord()', difficulty: 'Stretch',
        prompt: 'Write <code>makeRunRecord({ config, secrets, dataRange, codeVersion, seed })</code> returning the reproducibility record:<br>' +
          '<code>{ config, dataRange, codeVersion, seed, fingerprint, secretKeys }</code><ul>' +
          '<li>The record must <strong>not</strong> contain any secret values — only <code>secretKeys</code>, the sorted list of their names.</li>' +
          '<li><code>fingerprint</code> is an 8-character hex FNV-1a hash of the canonical JSON of <code>{ config, dataRange, codeVersion, seed }</code>, with object keys sorted at every level.</li>' +
          '<li>The fingerprint must not depend on key insertion order.</li></ul>' +
          '<span class="muted">FNV-1a: start at <code>2166136261</code>; for each character XOR the code and then <code>Math.imul(h, 16777619)</code>; finish with <code>(h &gt;&gt;&gt; 0).toString(16).padStart(8, "0")</code>.</span>',
        expose: ['makeRunRecord'],
        starter: 'function makeRunRecord({ config, secrets, dataRange, codeVersion, seed }) {\n  // a reproducible, secret-free run record\n}\n',
        solution: 'function canonical(value) {\n  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";\n  if (value && typeof value === "object") {\n    return "{" + Object.keys(value).sort()\n      .map(k => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}";\n  }\n  return JSON.stringify(value === undefined ? null : value);\n}\n\nfunction fnv1a(text) {\n  let h = 2166136261;\n  for (let i = 0; i < text.length; i++) {\n    h ^= text.charCodeAt(i);\n    h = Math.imul(h, 16777619);\n  }\n  return (h >>> 0).toString(16).padStart(8, "0");\n}\n\nfunction makeRunRecord({ config, secrets, dataRange, codeVersion, seed }) {\n  const core = { config, dataRange, codeVersion, seed };\n  return {\n    config,\n    dataRange,\n    codeVersion,\n    seed,\n    fingerprint: fnv1a(canonical(core)),\n    secretKeys: Object.keys(secrets || {}).sort()\n  };\n}',
        hints: ['Write a recursive canonicaliser that sorts keys at every level, then hash its output.',
                'The record carries only the secret <em>names</em> — never look at their values.',
                'Sorting the keys is what makes the fingerprint independent of insertion order.'],
        tests: { checks: [
          { name: 'never includes secret values', expose: ['makeRunRecord'],
            run: function (s) {
              var r = s.makeRunRecord({
                config: { fast: 9 }, secrets: { apiKey: 'SUPER-SECRET-123', apiSecret: 'shh' },
                dataRange: { from: 'a', to: 'b' }, codeVersion: 'v1', seed: 42
              });
              var text = JSON.stringify(r);
              if (text.indexOf('SUPER-SECRET-123') >= 0) return 'the record leaked a secret value';
              if (text.indexOf('shh') >= 0) return 'the record leaked a secret value';
              return true;
            } },
          { name: 'lists the secret names, sorted', expose: ['makeRunRecord'],
            run: function (s, h) {
              var r = s.makeRunRecord({
                config: {}, secrets: { zebra: 1, apple: 2 },
                dataRange: {}, codeVersion: 'v1', seed: 1
              });
              return h.eq(r.secretKeys, ['apple', 'zebra']) ? true : 'got ' + JSON.stringify(r.secretKeys);
            } },
          { name: 'no secrets gives an empty list', expose: ['makeRunRecord'],
            run: function (s, h) {
              var r = s.makeRunRecord({ config: {}, dataRange: {}, codeVersion: 'v1', seed: 1 });
              return h.eq(r.secretKeys, []) ? true : 'expected an empty list';
            } },
          { name: 'the fingerprint is 8 hex characters', expose: ['makeRunRecord'],
            run: function (s) {
              var r = s.makeRunRecord({
                config: { fast: 9 }, secrets: {}, dataRange: { from: 'a' }, codeVersion: 'v1', seed: 42
              });
              return /^[0-9a-f]{8}$/.test(r.fingerprint) ? true : 'got ' + r.fingerprint;
            } },
          { name: 'the fingerprint ignores key order', expose: ['makeRunRecord'],
            run: function (s) {
              var a = s.makeRunRecord({
                config: { fast: 9, slow: 21 }, secrets: {}, dataRange: { from: 'a', to: 'b' },
                codeVersion: 'v1', seed: 42
              });
              var b = s.makeRunRecord({
                config: { slow: 21, fast: 9 }, secrets: {}, dataRange: { to: 'b', from: 'a' },
                codeVersion: 'v1', seed: 42
              });
              return a.fingerprint === b.fingerprint
                ? true : 'the same configuration gave different fingerprints';
            } },
          { name: 'a changed value changes the fingerprint', expose: ['makeRunRecord'],
            run: function (s) {
              var base = { config: { fast: 9 }, secrets: {}, dataRange: {}, codeVersion: 'v1', seed: 42 };
              var a = s.makeRunRecord(base);
              var b = s.makeRunRecord(Object.assign({}, base, { seed: 43 }));
              var c = s.makeRunRecord(Object.assign({}, base, { config: { fast: 10 } }));
              if (a.fingerprint === b.fingerprint) return 'a different seed should change the fingerprint';
              return a.fingerprint !== c.fingerprint
                ? true : 'a different config should change the fingerprint';
            } },
          { name: 'secrets do not affect the fingerprint', expose: ['makeRunRecord'],
            run: function (s) {
              var base = { config: { fast: 9 }, dataRange: {}, codeVersion: 'v1', seed: 42 };
              var a = s.makeRunRecord(Object.assign({ secrets: { k: '1' } }, base));
              var b = s.makeRunRecord(Object.assign({ secrets: { k: '2' } }, base));
              return a.fingerprint === b.fingerprint
                ? true : 'rotating a credential should not change what the run computed';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why validate configuration at startup rather than on use?',
        options: ['Speed', 'A typo silently falls back to a default and surfaces as a puzzling result hours later', 'To reduce memory', 'It makes no difference'],
        answer: 1,
        explain: 'A misspelled key is invisible to a plain merge. Schema validation turns it into an error at the only moment it is cheap to fix.' },
      { q: 'Why keep secrets out of the config object?',
        options: ['Performance', 'Config is logged and serialised; one <code>JSON.stringify</code> would put credentials in a log file', 'Secrets are larger', 'They are the same thing'],
        answer: 1,
        explain: 'Log files get copied and pasted into issue trackers. Structural separation is the only reliable defence.' },
      { q: 'What should a run fingerprint cover?',
        options: ['Only the parameters', 'Config, data range, code version and seed together', 'The results', 'The timestamp'],
        answer: 1,
        explain: 'Two runs with the same fingerprint must produce identical results. If they do not, something non-deterministic is loose.' }
    ],
    recap: [
      'Merge configuration in a fixed layer order so any value can be traced.',
      'Validate against a schema at startup, including unknown keys.',
      'Secrets live in a separate object that is never logged or serialised.',
      'Fingerprint config, data, code version and seed together.'
    ],
    vocab: [
      { term: 'Run record', def: 'The full description of what a backtest or live session used, sufficient to reproduce it exactly.' },
      { term: 'Canonical form', def: 'A single deterministic serialisation of a value, so equal data always hashes identically.' }
    ]
  });

  C.push({
    id: 'd098', day: 98, module: 7, minutes: 30,
    title: 'Proxies and Guarded State',
    subtitle: 'Intercepting reads and writes to make invalid state impossible.',
    goal: '<b>Goal:</b> wrap a position object so every change is validated and recorded, without changing the code that uses it.',
    objectives: [
      'Intercept property access with a <code>Proxy</code>',
      'Validate writes in a <code>set</code> trap',
      'Build an audit trail of every change',
      'Know when a Proxy is the wrong tool'
    ],
    sections: [
      { h: 'A Proxy wraps an object and intercepts operations',
        body: '<p>The handler\'s traps run instead of the default behaviour. The two that matter here are <code>get</code> and <code>set</code>.</p>',
        code: 'const target = { qty: 2, entry: 5240.25 };\n\nconst watched = new Proxy(target, {\n  get(obj, key) {\n    console.log("read", String(key));\n    return obj[key];\n  },\n  set(obj, key, value) {\n    console.log("write", String(key), "=", value);\n    obj[key] = value;\n    return true;\n  }\n});\n\nwatched.qty;\nwatched.qty = 3;\nconsole.log("target is now", target.qty);' },
      { h: 'Validation in the set trap',
        body: '<p>Returning <code>false</code> from a <code>set</code> trap throws a <code>TypeError</code> in strict mode. Throwing your own error is usually clearer, and lets you say what was wrong.</p>',
        code: 'function guard(obj, rules) {\n  return new Proxy(obj, {\n    set(o, key, value) {\n      const rule = rules[key];\n      if (rule && !rule(value)) {\n        throw new RangeError(`invalid ${String(key)}: ${value}`);\n      }\n      o[key] = value;\n      return true;\n    }\n  });\n}\n\nconst pos = guard({ qty: 0 }, { qty: v => Number.isInteger(v) && v >= 0 });\npos.qty = 3;\nconsole.log("qty:", pos.qty);\ntry { pos.qty = -1; } catch (e) { console.log(e.name + ":", e.message); }\ntry { pos.qty = 1.5; } catch (e) { console.log(e.name + ":", e.message); }' },
      { h: 'An audit trail for free',
        body: '<p>Because every write goes through the trap, recording them costs nothing at the call site. The code using the object does not know it is being watched — which is the point, and also the danger.</p>' +
              '<div class="note note-warn"><b>Invisible behaviour is a real cost</b>A proxy makes ordinary-looking assignment throw, log, or take time. Someone debugging <code>position.qty = 3</code> six months later has no clue from that line that anything else happens. Use a proxy where the interception is the <em>whole point</em> — validation layers, audit, dev-mode checks — and a plain method where the behaviour should be visible.</div>' },
      { h: 'What a Proxy costs',
        body: '<p>Every trapped operation is a function call rather than a direct property access. That is irrelevant for a config object and very relevant for something read a million times in a tick loop. Wrap the boundary, not the hot path.</p>' }
    ],
    parsons: {
      prompt: 'Validate a write before letting it through.',
      lines: [
        'set(obj, key, value) {',
        '  const rule = rules[key];',
        '  if (rule && !rule(value)) throw new RangeError(`invalid ${String(key)}`);',
        '  obj[key] = value;',
        '  return true;',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'guarded()', difficulty: 'Core',
        prompt: 'Write <code>guarded(target, rules)</code> returning a Proxy where <code>rules</code> maps a key to a predicate.<ul>' +
          '<li>A write to a key with a rule that returns false throws <code>new RangeError("invalid KEY: VALUE")</code>.</li>' +
          '<li>A write to a key with no rule passes through.</li>' +
          '<li>Reads are unaffected, and a valid write reaches the underlying object.</li></ul>',
        expose: ['guarded'],
        starter: 'function guarded(target, rules) {\n  // a validating Proxy\n}\n',
        solution: 'function guarded(target, rules) {\n  return new Proxy(target, {\n    set(obj, key, value) {\n      const rule = rules[key];\n      if (rule && !rule(value)) {\n        throw new RangeError(`invalid ${String(key)}: ${value}`);\n      }\n      obj[key] = value;\n      return true;\n    }\n  });\n}',
        hints: ['Only the <code>set</code> trap is needed; reads fall through to the default.',
                'Return <code>true</code> from the trap to signal the write succeeded.'],
        tests: { checks: [
          { name: 'allows a valid write', expose: ['guarded'],
            run: function (s) {
              var t = { qty: 0 };
              var p = s.guarded(t, { qty: function (v) { return v >= 0; } });
              p.qty = 3;
              return (p.qty === 3 && t.qty === 3) ? true : 'the write did not reach the target';
            } },
          { name: 'rejects an invalid write', expose: ['guarded'],
            run: function (s) {
              var t = { qty: 1 };
              var p = s.guarded(t, { qty: function (v) { return v >= 0; } });
              try { p.qty = -1; } catch (e) {
                if (!(e instanceof RangeError)) return 'threw ' + e.name + ', expected RangeError';
                return t.qty === 1 ? true : 'the rejected value was written anyway';
              }
              return 'an invalid write should throw';
            } },
          { name: 'the message names the key and value', expose: ['guarded'],
            run: function (s) {
              var p = s.guarded({ qty: 0 }, { qty: function (v) { return v >= 0; } });
              try { p.qty = -5; } catch (e) {
                return e.message === 'invalid qty: -5' ? true : 'the message was ' + JSON.stringify(e.message);
              }
              return 'expected a throw';
            } },
          { name: 'unguarded keys pass through', expose: ['guarded'],
            run: function (s) {
              var p = s.guarded({ qty: 0 }, { qty: function (v) { return v >= 0; } });
              p.note = 'anything';
              return p.note === 'anything' ? true : 'an unguarded key should be writable';
            } },
          { name: 'reads are unaffected', expose: ['guarded'],
            run: function (s) {
              var p = s.guarded({ qty: 7, entry: 5240 }, { qty: function () { return true; } });
              return (p.qty === 7 && p.entry === 5240) ? true : 'reads should behave normally';
            } }
        ] } },
      { id: 'e2', title: 'audited()', difficulty: 'Core',
        prompt: 'Write <code>audited(target, now)</code> returning <code>{ proxy, log }</code>.<ul>' +
          '<li>Every write appends <code>{ key, from, to, at }</code> to <code>log</code>, with <code>at</code> from <code>now()</code>.</li>' +
          '<li><code>from</code> is the previous value, <code>undefined</code> for a new key.</li>' +
          '<li>A write of the same value is still recorded.</li>' +
          '<li>Deleting a key records <code>{ key, from, to: undefined, at }</code>.</li></ul>',
        expose: ['audited'],
        starter: 'function audited(target, now) {\n  // { proxy, log }\n}\n',
        solution: 'function audited(target, now) {\n  const log = [];\n  const proxy = new Proxy(target, {\n    set(obj, key, value) {\n      log.push({ key: String(key), from: obj[key], to: value, at: now() });\n      obj[key] = value;\n      return true;\n    },\n    deleteProperty(obj, key) {\n      log.push({ key: String(key), from: obj[key], to: undefined, at: now() });\n      delete obj[key];\n      return true;\n    }\n  });\n  return { proxy, log };\n}',
        hints: ['Read the old value before overwriting it.',
                'The <code>deleteProperty</code> trap handles <code>delete obj.key</code>.',
                'Return <code>true</code> from both traps.'],
        tests: { checks: [
          { name: 'records a write with both values', expose: ['audited'],
            run: function (s) {
              var t = 100;
              var a = s.audited({ qty: 1 }, function () { return t; });
              a.proxy.qty = 3;
              if (a.log.length !== 1) return 'expected 1 record, got ' + a.log.length;
              var r = a.log[0];
              return (r.key === 'qty' && r.from === 1 && r.to === 3 && r.at === 100)
                ? true : 'the record was ' + JSON.stringify(r);
            } },
          { name: 'a new key has an undefined from', expose: ['audited'],
            run: function (s) {
              var a = s.audited({}, function () { return 0; });
              a.proxy.stop = 5232;
              return a.log[0].from === undefined ? true : 'from should be undefined for a new key';
            } },
          { name: 'a no-op write is still recorded', expose: ['audited'],
            run: function (s) {
              var a = s.audited({ qty: 3 }, function () { return 0; });
              a.proxy.qty = 3;
              return a.log.length === 1 ? true : 'a write of the same value should still be audited';
            } },
          { name: 'the target is actually updated', expose: ['audited'],
            run: function (s) {
              var t = { qty: 1 };
              var a = s.audited(t, function () { return 0; });
              a.proxy.qty = 9;
              return t.qty === 9 ? true : 'the underlying object was not updated';
            } },
          { name: 'deletion is recorded', expose: ['audited'],
            run: function (s) {
              var t = { stop: 5232 };
              var a = s.audited(t, function () { return 7; });
              delete a.proxy.stop;
              if (!('stop' in t) === false) return 'the key should have been deleted';
              var r = a.log[0];
              return (r.key === 'stop' && r.from === 5232 && r.to === undefined && r.at === 7)
                ? true : 'the deletion record was ' + JSON.stringify(r);
            } },
          { name: 'records accumulate in order', expose: ['audited'],
            run: function (s) {
              var t = 0;
              var a = s.audited({ qty: 0 }, function () { return t++; });
              a.proxy.qty = 1;
              a.proxy.qty = 2;
              a.proxy.qty = 3;
              var seq = a.log.map(function (r) { return r.to; }).join(',');
              return seq === '1,2,3' ? true : 'the log order was ' + seq;
            } }
        ] } },
      { id: 'e3', title: 'makePosition()', difficulty: 'Stretch',
        prompt: 'Combine both. Write <code>makePosition(initial, now)</code> returning <code>{ position, changes, isValid }</code>:<ul>' +
          '<li><code>position</code> — a proxy over a copy of <code>initial</code>, enforcing: <code>qty</code> a non-negative integer, <code>entry</code> a positive finite number, <code>side</code> exactly <code>"long"</code> or <code>"short"</code>, <code>stop</code> a positive finite number or <code>null</code></li>' +
          '<li>Writing an unknown key throws <code>new TypeError("unknown field: KEY")</code></li>' +
          '<li>An invalid value throws <code>new RangeError("invalid KEY: VALUE")</code></li>' +
          '<li><code>changes</code> — the audit log of accepted writes only</li>' +
          '<li><code>isValid()</code> — whether the current state satisfies every rule</li></ul>',
        expose: ['makePosition'],
        starter: 'function makePosition(initial, now) {\n  // { position, changes, isValid }\n}\n',
        solution: 'function makePosition(initial, now) {\n  const RULES = {\n    qty: v => Number.isInteger(v) && v >= 0,\n    entry: v => Number.isFinite(v) && v > 0,\n    side: v => v === "long" || v === "short",\n    stop: v => v === null || (Number.isFinite(v) && v > 0)\n  };\n  const state = { ...initial };\n  const changes = [];\n  const position = new Proxy(state, {\n    set(obj, key, value) {\n      const name = String(key);\n      const rule = RULES[name];\n      if (!rule) throw new TypeError(`unknown field: ${name}`);\n      if (!rule(value)) throw new RangeError(`invalid ${name}: ${value}`);\n      changes.push({ key: name, from: obj[name], to: value, at: now() });\n      obj[name] = value;\n      return true;\n    }\n  });\n  return {\n    position,\n    changes,\n    isValid() {\n      return Object.keys(RULES).every(k => state[k] === undefined || RULES[k](state[k]));\n    }\n  };\n}',
        hints: ['Copy the initial object so the caller cannot bypass the proxy through their own reference.',
                'Check for an unknown key before checking the value — the error types differ.',
                'Only log after both checks pass, so rejected writes leave no trace.'],
        tests: { checks: [
          { name: 'accepts valid writes and logs them', expose: ['makePosition'],
            run: function (s) {
              var t = 0;
              var p = s.makePosition({ qty: 0, entry: 5240, side: 'long', stop: null }, function () { return t++; });
              p.position.qty = 2;
              p.position.stop = 5232;
              if (p.position.qty !== 2 || p.position.stop !== 5232) return 'the writes did not take effect';
              return p.changes.length === 2 ? true : 'expected 2 audit records, got ' + p.changes.length;
            } },
          { name: 'rejects an invalid quantity', expose: ['makePosition'],
            run: function (s) {
              var p = s.makePosition({ qty: 1 }, function () { return 0; });
              try { p.position.qty = -1; } catch (e) {
                if (!(e instanceof RangeError)) return 'expected RangeError, got ' + e.name;
                if (p.position.qty !== 1) return 'the value changed despite the rejection';
                return p.changes.length === 0 ? true : 'a rejected write should not be logged';
              }
              return 'a negative quantity should throw';
            } },
          { name: 'rejects a fractional quantity', expose: ['makePosition'],
            run: function (s) {
              var p = s.makePosition({ qty: 1 }, function () { return 0; });
              try { p.position.qty = 1.5; } catch (e) { return e instanceof RangeError ? true : 'got ' + e.name; }
              return 'a fractional quantity should throw';
            } },
          { name: 'rejects an unknown field with a TypeError', expose: ['makePosition'],
            run: function (s) {
              var p = s.makePosition({ qty: 1 }, function () { return 0; });
              try { p.position.qyt = 2; } catch (e) {
                if (!(e instanceof TypeError)) return 'expected TypeError, got ' + e.name;
                return e.message === 'unknown field: qyt' ? true : 'the message was ' + e.message;
              }
              return 'a typo should throw';
            } },
          { name: 'stop accepts null but not zero', expose: ['makePosition'],
            run: function (s) {
              var p = s.makePosition({ stop: 5232 }, function () { return 0; });
              p.position.stop = null;
              if (p.position.stop !== null) return 'null should be accepted for stop';
              try { p.position.stop = 0; } catch (e) { return true; }
              return 'a stop of 0 should be rejected';
            } },
          { name: 'side is restricted to long and short', expose: ['makePosition'],
            run: function (s) {
              var p = s.makePosition({ side: 'long' }, function () { return 0; });
              p.position.side = 'short';
              if (p.position.side !== 'short') return 'short should be accepted';
              try { p.position.side = 'sideways'; } catch (e) { return true; }
              return 'an unknown side should be rejected';
            } },
          { name: 'isValid reflects the current state', expose: ['makePosition'],
            run: function (s) {
              var good = s.makePosition({ qty: 2, entry: 5240, side: 'long', stop: null }, function () { return 0; });
              if (good.isValid() !== true) return 'a valid position should report valid';
              var bad = s.makePosition({ qty: -5, entry: 5240, side: 'long', stop: null }, function () { return 0; });
              return bad.isValid() === false ? true : 'an invalid initial state should report invalid';
            } },
          { name: 'the caller cannot bypass the proxy', expose: ['makePosition'],
            run: function (s) {
              var initial = { qty: 1 };
              var p = s.makePosition(initial, function () { return 0; });
              initial.qty = 999;
              return p.position.qty === 1 ? true : 'the initial object should be copied, not wrapped directly';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does a <code>set</code> trap returning <code>false</code> do in strict mode?',
        options: ['Silently ignores the write', 'Throws a TypeError', 'Retries', 'Deletes the key'],
        answer: 1,
        explain: 'Throwing your own error is usually clearer, because you can say what was wrong.' },
      { q: 'What is the main risk of using a Proxy?',
        options: ['Memory', 'Ordinary-looking assignment gains invisible behaviour', 'It cannot be nested', 'It breaks JSON'],
        answer: 1,
        explain: '<code>position.qty = 3</code> giving no hint that it validates, logs and may throw is a real cost to a future reader.' },
      { q: 'Where should you avoid a Proxy?',
        options: ['On config objects', 'On anything read millions of times in a hot loop', 'On class instances', 'On arrays'],
        answer: 1,
        explain: 'Every trapped access is a function call. Wrap the boundary, not the tick loop.' }
    ],
    recap: [
      'A Proxy intercepts property operations through handler traps.',
      'The <code>set</code> trap is the natural place for validation.',
      'Auditing every write costs nothing at the call site.',
      'Use it where interception is the point — and never in the hot path.'
    ],
    vocab: [
      { term: 'Proxy trap', def: 'A handler function that runs instead of a default object operation — get, set, has, deleteProperty and others.' },
      { term: 'Audit trail', def: 'A record of every change to a piece of state, with old value, new value and time.' }
    ]
  });


  C.push({
    id: 'd099', day: 99, module: 7, minutes: 35,
    title: 'Wiring the System',
    subtitle: 'Dependency injection, a composition root, and a system you can test.',
    goal: '<b>Goal:</b> assemble the whole application in one place, so every part can be replaced with a fake and tested alone.',
    objectives: [
      'Explain dependency injection and why it makes code testable',
      'Build a composition root',
      'Substitute fakes for the feed, the broker and the clock',
      'Keep the dependency graph acyclic'
    ],
    sections: [
      { h: 'Depend on what you are given, never on what you can reach',
        body: '<p>A component that constructs its own dependencies can only be tested with those exact dependencies. A component that <em>receives</em> them can be tested with anything.</p>' +
              '<p>You have been doing this since module 4, every time an exercise took a <code>fetchFn</code> or a <code>now</code> instead of calling the global. This level makes it explicit.</p>',
        code: '// Hard to test: reaches out for its own dependencies\nfunction badStrategy() {\n  const now = Date.now();\n  // const data = await fetch("https://api.example.com/bars");\n  return now;\n}\n\n// Easy to test: everything arrives as an argument\nfunction goodStrategy({ clock, feed, broker }) {\n  return { at: clock.now(), bars: feed.latest(), send: broker.send };\n}\n\nconst fakeClock = { now: () => 1715693400000 };\nconst fakeFeed = { latest: () => [{ close: 5240 }] };\nconst fakeBroker = { send: o => ({ ok: true, order: o }) };\nconsole.log(goodStrategy({ clock: fakeClock, feed: fakeFeed, broker: fakeBroker }).at);' },
      { h: 'The composition root',
        body: '<p>Exactly one place in the application constructs the real implementations and wires them together. Everywhere else receives what it needs. That one place is the <strong>composition root</strong>, and it is the only file that knows what the real feed or broker actually is.</p>',
        code: 'function buildSystem(deps) {\n  const { clock, feed, broker, logger, config } = deps;\n  const risk = makeRisk(config.limits, logger);\n  const engine = makeEngine({ feed, risk, broker, clock, logger, config });\n  return { engine, risk };\n}\n\nfunction makeRisk(limits, logger) {\n  return { check: pnl => pnl > -limits.maxDailyLoss };\n}\nfunction makeEngine({ risk, broker }) {\n  return { onBar: (bar, pnl) => risk.check(pnl) ? broker.send({ bar }) : null };\n}\n\nconst sys = buildSystem({\n  clock: { now: () => 0 }, feed: {}, broker: { send: o => "sent" },\n  logger: { info() {} }, config: { limits: { maxDailyLoss: 1000 } }\n});\nconsole.log(sys.engine.onBar({}, -200), sys.engine.onBar({}, -5000));' },
      { h: 'Fakes, not mocks',
        body: '<p>A <strong>fake</strong> is a working implementation with a shortcut — an in-memory broker that fills instantly, a clock you advance by hand. It behaves like the real thing, so tests written against it exercise real logic.</p>' +
              '<div class="note note-tip"><b>Why the clock matters most</b>An injected clock turns "wait five minutes for the daily reset" into "set the clock forward". Almost every hard-to-test piece of trading logic is hard to test because it reads the real time.</div>' },
      { h: 'Keep the graph acyclic',
        body: '<p>Dependencies should flow one way: indicators know nothing about the engine, the engine knows nothing about the reporting layer. If two components need each other, extract the shared piece into a third that both depend on.</p>' +
              '<p>A cycle is not just inelegant — it means neither component can be constructed, tested or understood without the other.</p>' }
    ],
    parsons: {
      prompt: 'Wire the system in one place.',
      lines: [
        'const risk = makeRisk(config.limits, logger);',
        'const engine = makeEngine({ feed, risk, broker, clock, logger });',
        'return { engine, risk };'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeFakeClock() and makeFakeBroker()', difficulty: 'Core',
        prompt: 'Build two test doubles.<ul>' +
          '<li><code>makeFakeClock(start)</code> — <code>{ now(), advance(ms) }</code>; <code>now()</code> returns the current time and <code>advance</code> moves it forward, ignoring non-positive amounts</li>' +
          '<li><code>makeFakeBroker()</code> — <code>{ send(order), orders, failNext(reason) }</code>; <code>send</code> records the order and returns <code>{ ok: true, id }</code> with ids counting from 1, unless <code>failNext</code> was called, in which case the <em>next</em> send alone returns <code>{ ok: false, reason }</code> and is not recorded</li></ul>',
        expose: ['makeFakeClock', 'makeFakeBroker'],
        starter: 'function makeFakeClock(start) {\n}\n\nfunction makeFakeBroker() {\n}\n',
        solution: 'function makeFakeClock(start) {\n  let t = start;\n  return {\n    now() { return t; },\n    advance(ms) { if (ms > 0) t += ms; }\n  };\n}\n\nfunction makeFakeBroker() {\n  let nextId = 1;\n  let failure = null;\n  const orders = [];\n  return {\n    orders,\n    send(order) {\n      if (failure !== null) {\n        const reason = failure;\n        failure = null;\n        return { ok: false, reason };\n      }\n      orders.push(order);\n      return { ok: true, id: nextId++ };\n    },\n    failNext(reason) { failure = reason; }\n  };\n}',
        hints: ['Both keep their state in a closure and expose only methods.',
                'The failure flag must clear itself after one use — that is what "next" means.',
                'A failed send records nothing, so the id counter does not advance either.'],
        tests: { checks: [
          { name: 'the clock advances only forward', expose: ['makeFakeClock'],
            run: function (s) {
              var c = s.makeFakeClock(1000);
              if (c.now() !== 1000) return 'now() should return the start';
              c.advance(500);
              if (c.now() !== 1500) return 'advance should move time forward';
              c.advance(-100);
              return c.now() === 1500 ? true : 'a negative advance should be ignored';
            } },
          { name: 'the broker records orders and returns ids', expose: ['makeFakeBroker'],
            run: function (s) {
              var b = s.makeFakeBroker();
              var a = b.send({ symbol: 'ES' });
              var c = b.send({ symbol: 'NQ' });
              if (a.ok !== true || a.id !== 1) return 'the first send should return id 1';
              if (c.id !== 2) return 'ids should increment';
              return b.orders.length === 2 ? true : 'both orders should be recorded';
            } },
          { name: 'failNext fails exactly one send', expose: ['makeFakeBroker'],
            run: function (s) {
              var b = s.makeFakeBroker();
              b.failNext('rejected by risk');
              var first = b.send({ symbol: 'ES' });
              if (first.ok !== false || first.reason !== 'rejected by risk') return 'the send should have failed';
              if (b.orders.length !== 0) return 'a failed order should not be recorded';
              var second = b.send({ symbol: 'NQ' });
              return (second.ok === true && b.orders.length === 1)
                ? true : 'only the next send should fail';
            } },
          { name: 'ids do not advance on failure', expose: ['makeFakeBroker'],
            run: function (s) {
              var b = s.makeFakeBroker();
              b.failNext('nope');
              b.send({});
              return b.send({}).id === 1 ? true : 'a failed send should not consume an id';
            } }
        ] } },
      { id: 'e2', title: 'buildSystem()', difficulty: 'Core',
        prompt: 'Write <code>buildSystem(deps)</code> — the composition root. <code>deps</code> is <code>{ clock, broker, logger, config }</code> and the return value is <code>{ risk, engine, config }</code> where:<ul>' +
          '<li><code>risk</code> has <code>check(dailyPnl)</code>, returning <code>{ allow, reason }</code> — blocked with <code>"daily loss limit"</code> when <code>dailyPnl &lt;= -config.maxDailyLoss</code></li>' +
          '<li><code>engine</code> has <code>submit(order, dailyPnl)</code> which consults <code>risk</code>, logs <code>"blocked"</code> with the reason and returns <code>null</code> when vetoed, otherwise sends through the broker, logs <code>"sent"</code>, and returns the broker\'s result</li>' +
          '<li>Every log record includes <code>at</code> from <code>clock.now()</code></li></ul>' +
          '<span class="muted"><code>logger</code> has an <code>info(event, fields)</code> method.</span>',
        expose: ['buildSystem'],
        starter: 'function buildSystem(deps) {\n  const { clock, broker, logger, config } = deps;\n  // { risk, engine, config }\n}\n',
        solution: 'function buildSystem(deps) {\n  const { clock, broker, logger, config } = deps;\n\n  const risk = {\n    check(dailyPnl) {\n      if (dailyPnl <= -config.maxDailyLoss) {\n        return { allow: false, reason: "daily loss limit" };\n      }\n      return { allow: true, reason: null };\n    }\n  };\n\n  const engine = {\n    submit(order, dailyPnl) {\n      const verdict = risk.check(dailyPnl);\n      if (!verdict.allow) {\n        logger.info("blocked", { reason: verdict.reason, at: clock.now() });\n        return null;\n      }\n      const result = broker.send(order);\n      logger.info("sent", { order, result, at: clock.now() });\n      return result;\n    }\n  };\n\n  return { risk, engine, config };\n}',
        hints: ['Build <code>risk</code> first, then hand it to <code>engine</code> — dependencies flow one way.',
                'The engine never reads the config directly; it asks <code>risk</code>.',
                'Both log paths stamp the time from the injected clock.'],
        tests: { checks: [
          { name: 'sends an allowed order', expose: ['buildSystem'],
            run: function (s) {
              var sent = [];
              var logs = [];
              var sys = s.buildSystem({
                clock: { now: function () { return 1234; } },
                broker: { send: function (o) { sent.push(o); return { ok: true, id: 1 }; } },
                logger: { info: function (e, f) { logs.push({ e: e, f: f }); } },
                config: { maxDailyLoss: 1000 }
              });
              var r = sys.engine.submit({ symbol: 'ES' }, -200);
              if (!r || r.ok !== true) return 'the order should have been sent';
              if (sent.length !== 1) return 'the broker should have received it';
              return (logs[0].e === 'sent' && logs[0].f.at === 1234) ? true : 'the log was ' + JSON.stringify(logs[0]);
            } },
          { name: 'blocks past the daily loss limit', expose: ['buildSystem'],
            run: function (s) {
              var sent = [];
              var logs = [];
              var sys = s.buildSystem({
                clock: { now: function () { return 1; } },
                broker: { send: function (o) { sent.push(o); return { ok: true, id: 1 }; } },
                logger: { info: function (e, f) { logs.push({ e: e, f: f }); } },
                config: { maxDailyLoss: 1000 }
              });
              var r = sys.engine.submit({ symbol: 'ES' }, -1500);
              if (r !== null) return 'a blocked order should return null';
              if (sent.length !== 0) return 'the broker should not have been called';
              return (logs[0].e === 'blocked' && logs[0].f.reason === 'daily loss limit')
                ? true : 'the log was ' + JSON.stringify(logs[0]);
            } },
          { name: 'risk is usable on its own', expose: ['buildSystem'],
            run: function (s) {
              var sys = s.buildSystem({
                clock: { now: function () { return 0; } },
                broker: { send: function () { return {}; } },
                logger: { info: function () {} },
                config: { maxDailyLoss: 500 }
              });
              if (sys.risk.check(-100).allow !== true) return 'a small loss should be allowed';
              return sys.risk.check(-500).allow === false ? true : 'exactly at the limit is a breach';
            } },
          { name: 'works entirely against fakes', expose: ['buildSystem'],
            run: function (s) {
              var calls = 0;
              var sys = s.buildSystem({
                clock: { now: function () { calls++; return 42; } },
                broker: { send: function () { return { ok: true, id: 7 }; } },
                logger: { info: function () {} },
                config: { maxDailyLoss: 1000 }
              });
              var r = sys.engine.submit({}, 0);
              return (r.id === 7 && calls > 0) ? true : 'the injected dependencies were not used';
            } }
        ] } },
      { id: 'e3', title: 'dependencyOrder()', difficulty: 'Stretch',
        prompt: 'Write <code>dependencyOrder(graph)</code> where <code>graph</code> maps a component name to the names it depends on.<br>' +
          'Return <code>{ order, cycle }</code>:<ul>' +
          '<li><code>order</code> — a construction order where every component appears after everything it depends on. Among components that become available at the same time, use alphabetical order so the result is deterministic.</li>' +
          '<li><code>cycle</code> — <code>true</code> when no valid order exists, in which case <code>order</code> is <code>[]</code></li>' +
          '<li>A dependency on a name that is not in the graph is treated as already satisfied.</li></ul>',
        starter: 'function dependencyOrder(graph) {\n  // { order, cycle }\n}\n',
        solution: 'function dependencyOrder(graph) {\n  const names = Object.keys(graph);\n  const known = new Set(names);\n  const remaining = new Set(names);\n  const done = new Set();\n  const order = [];\n\n  while (remaining.size) {\n    const ready = [...remaining].filter(name =>\n      (graph[name] || []).every(dep => !known.has(dep) || done.has(dep))\n    ).sort();\n    if (!ready.length) return { order: [], cycle: true };\n    for (const name of ready) {\n      order.push(name);\n      done.add(name);\n      remaining.delete(name);\n    }\n  }\n  return { order, cycle: false };\n}',
        hints: ['Repeatedly take every component whose dependencies are all satisfied, sorted alphabetically.',
                'If a pass finds nothing ready while components remain, there is a cycle.',
                'An unknown dependency name is external — treat it as already available.'],
        tests: { fn: 'dependencyOrder', cases: [
          { args: [{ engine: ['risk', 'feed'], risk: ['config'], feed: [], config: [] }],
            expect: { order: ['config', 'feed', 'risk', 'engine'], cycle: false } },
          { args: [{ a: ['b'], b: ['a'] }], expect: { order: [], cycle: true },
            name: 'a two-node cycle is detected' },
          { args: [{ a: [], b: [], c: [] }], expect: { order: ['a', 'b', 'c'], cycle: false },
            name: 'independent components come out alphabetically' },
          { args: [{}], expect: { order: [], cycle: false } },
          { args: [{ engine: ['externalBroker'] }], expect: { order: ['engine'], cycle: false },
            name: 'an unknown dependency is treated as external' },
          { args: [{ a: ['b'], b: ['c'], c: ['a'] }], expect: { order: [], cycle: true },
            name: 'a three-node cycle is detected' }
        ], checks: [{
          name: 'every component follows its dependencies', expose: ['dependencyOrder'],
          run: function (s) {
            var graph = {
              report: ['engine'], engine: ['risk', 'signals'], signals: ['indicators'],
              indicators: [], risk: ['config'], config: []
            };
            var r = s.dependencyOrder(graph);
            if (r.cycle) return 'this graph has no cycle';
            var seen = {};
            for (var i = 0; i < r.order.length; i++) {
              var name = r.order[i];
              var deps = graph[name] || [];
              for (var j = 0; j < deps.length; j++) {
                if (graph[deps[j]] && !seen[deps[j]]) return name + ' was constructed before ' + deps[j];
              }
              seen[name] = true;
            }
            return r.order.length === 6 ? true : 'expected all 6 components, got ' + r.order.length;
          }
        }] } }
    ],
    quiz: [
      { q: 'What makes a component testable?',
        options: ['Small functions', 'It receives its dependencies rather than constructing them', 'No side effects at all', 'Good names'],
        answer: 1,
        explain: 'A component that builds its own feed can only be tested with that feed. One that is handed a feed can be tested with anything.' },
      { q: 'What is a composition root?',
        options: ['The main function', 'The single place that constructs real implementations and wires them together', 'A base class', 'The config file'],
        answer: 1,
        explain: 'Everywhere else receives what it needs. Only the root knows what the real broker actually is.' },
      { q: 'Two components depend on each other. What should you do?',
        options: ['Nothing, it is fine', 'Extract the shared piece into a third both depend on', 'Merge them', 'Use a global'],
        answer: 1,
        explain: 'A cycle means neither can be constructed, tested or understood alone. Breaking it is not optional.' }
    ],
    recap: [
      'Receive dependencies; do not reach for them.',
      'Wire everything in one composition root.',
      'Fakes behave like the real thing, so tests exercise real logic.',
      'Keep the dependency graph acyclic and flowing one way.'
    ],
    vocab: [
      { term: 'Dependency injection', def: 'Passing a component its collaborators rather than having it construct them. The single largest factor in whether code can be tested.' },
      { term: 'Composition root', def: 'The one place that knows the real implementations and assembles the system from them.' }
    ]
  });

  C.push({
    id: 'd100', day: 100, module: 7, minutes: 35, boss: true,
    title: 'Boss: The Complete Trading System',
    subtitle: 'One hundred levels, assembled.',
    goal: '<b>Goal:</b> build the whole thing — data, indicators, signals, risk, execution and reporting — as one system, wired from a single root.',
    objectives: [
      'Assemble every layer built across the curriculum',
      'Keep each layer independently testable',
      'Run the system end to end against the sample session',
      'Produce a report anyone could audit'
    ],
    sections: [
      { h: 'What you have built',
        body: '<table><tr><th>Module</th><th>What it contributes</th></tr>' +
              '<tr><td>1–2</td><td>The language, and turning candles into numbers</td></tr>' +
              '<tr><td>3</td><td>Reusable, testable parts — closures, classes, errors</td></tr>' +
              '<tr><td>4</td><td>Live data that survives a bad network</td></tr>' +
              '<tr><td>5</td><td>Indicators, from the formula up</td></tr>' +
              '<tr><td>6</td><td>Honest measurement of whether any of it works</td></tr>' +
              '<tr><td>7</td><td>The engineering that makes it a system rather than a script</td></tr></table>' +
              '<p>This level puts them together. No new concepts — the difficulty is entirely in the assembly, which is exactly the difficulty of real systems.</p>' },
      { h: 'The layers, and the direction they point',
        body: '<p class="mono" style="color:var(--fg)">data → indicators → signals → risk → execution → reporting</p>' +
              '<p>Each layer knows only about the ones to its left. Indicators cannot see the engine; risk cannot see reporting. That is what lets you replace the signal without re-testing execution.</p>' },
      { h: 'What the system must guarantee',
        body: '<ol><li><strong>No look-ahead.</strong> The signal sees only bars up to the current one.</li>' +
              '<li><strong>Risk cannot be bypassed.</strong> Every order passes the gate.</li>' +
              '<li><strong>Costs are always applied.</strong> No gross-only results anywhere.</li>' +
              '<li><strong>Everything is derived from the trade log.</strong> No parallel counters.</li>' +
              '<li><strong>The run is reproducible.</strong> Same inputs, same output, every time.</li></ol>' +
              '<div class="note note-trade"><b>The honest ending</b>You now have the skills to build this. That is genuinely different from having an edge — the system is the easy half. Finding something that actually predicts, and surviving long enough to trade it, is the other half, and no curriculum can hand you that.</div>' }
    ],
    parsons: {
      prompt: 'The layers, in dependency order.',
      lines: [
        'const indicators = buildIndicators(bars, config);',
        'const signals = buildSignals(bars, indicators, config);',
        'const trades = execute(bars, signals, risk, config);',
        'const report = summarise(trades, config);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'The signal layer', difficulty: 'Boss · part 1',
        prompt: 'Write <code>buildSignals(bars, config)</code> returning an array the same length as <code>bars</code>, each entry <code>{ side, stopPoints, targetPoints }</code> or <code>null</code>.<br>' +
          '<code>config</code> is <code>{ fast, slow, atrLength, stopAtr, targetAtr }</code>.<ol>' +
          '<li>Compute fast and slow SMAs of the closes, and an ATR over <code>atrLength</code> (Wilder-smoothed, <code>null</code> for the first <code>atrLength-1</code> bars).</li>' +
          '<li>A <code>"long"</code> fires where the fast SMA crosses above the slow one, a <code>"short"</code> where it crosses below.</li>' +
          '<li>Suppress any signal where either SMA or the ATR is <code>null</code>, at bar 0, or where the previous bar\'s SMAs are <code>null</code>.</li>' +
          '<li>Stop and target distances are <code>atr × stopAtr</code> and <code>atr × targetAtr</code> at that bar.</li></ol>',
        starter: 'function buildSignals(bars, config) {\n  // indicators -> crossover -> ATR-scaled distances\n}\n',
        solution: 'function buildSignals(bars, config) {\n  const { fast, slow, atrLength, stopAtr, targetAtr } = config;\n  const closes = bars.map(b => b.close);\n\n  const sma = (series, n) => {\n    const out = new Array(series.length).fill(null);\n    let sum = 0;\n    for (let i = 0; i < series.length; i++) {\n      sum += series[i];\n      if (i >= n) sum -= series[i - n];\n      if (i >= n - 1) out[i] = sum / n;\n    }\n    return out;\n  };\n\n  const f = sma(closes, fast), s = sma(closes, slow);\n\n  const tr = bars.map((b, i) => {\n    if (i === 0) return b.high - b.low;\n    const prev = bars[i - 1].close;\n    return Math.max(b.high - b.low, Math.abs(b.high - prev), Math.abs(b.low - prev));\n  });\n  const atr = new Array(bars.length).fill(null);\n  if (bars.length >= atrLength) {\n    let avg = tr.slice(0, atrLength).reduce((a, b) => a + b, 0) / atrLength;\n    atr[atrLength - 1] = avg;\n    for (let i = atrLength; i < tr.length; i++) {\n      avg = (avg * (atrLength - 1) + tr[i]) / atrLength;\n      atr[i] = avg;\n    }\n  }\n\n  return bars.map((_, i) => {\n    if (i === 0) return null;\n    if (f[i] === null || s[i] === null || f[i - 1] === null || s[i - 1] === null) return null;\n    if (atr[i] === null) return null;\n    const up = f[i] > s[i] && f[i - 1] <= s[i - 1];\n    const down = f[i] < s[i] && f[i - 1] >= s[i - 1];\n    if (!up && !down) return null;\n    return {\n      side: up ? "long" : "short",\n      stopPoints: atr[i] * stopAtr,\n      targetPoints: atr[i] * targetAtr\n    };\n  });\n}',
        hints: ['Build the three indicator series first, then walk the bars looking for crossings.',
                'The cross test needs both SMAs at <code>i</code> and at <code>i-1</code> to be defined.',
                'Reuse the exact SMA and ATR implementations from module 5.'],
        tests: { checks: [
          { name: 'returns one entry per bar', expose: ['buildSignals'],
            run: function (s) {
              var out = s.buildSignals(MARKET.bars, { fast: 9, slow: 21, atrLength: 14, stopAtr: 1.5, targetAtr: 3 });
              return out.length === MARKET.bars.length ? true : 'got length ' + out.length;
            } },
          { name: 'suppresses signals during the warm-up', expose: ['buildSignals'],
            run: function (s) {
              var out = s.buildSignals(MARKET.bars, { fast: 9, slow: 21, atrLength: 14, stopAtr: 1.5, targetAtr: 3 });
              for (var i = 0; i < 20; i++) {
                if (out[i] !== null) return 'bar ' + i + ' produced a signal during the warm-up';
              }
              return true;
            } },
          { name: 'produces signals on a trending series', expose: ['buildSignals'],
            run: function (s) {
              var bars = [];
              for (var i = 0; i < 30; i++) bars.push({ open: 100, high: 101, low: 99, close: 100 });
              for (var j = 0; j < 30; j++) {
                var p = 100 + j * 2;
                bars.push({ open: p, high: p + 1, low: p - 1, close: p });
              }
              var out = s.buildSignals(bars, { fast: 5, slow: 15, atrLength: 5, stopAtr: 1.5, targetAtr: 3 });
              var longs = out.filter(function (v) { return v && v.side === 'long'; }).length;
              return longs >= 1 ? true : 'a sustained rally should produce a long signal';
            } },
          { name: 'stop and target scale with ATR', expose: ['buildSignals'],
            run: function (s) {
              var out = s.buildSignals(MARKET.bars, { fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3 });
              var hit = out.find(function (v) { return v !== null; });
              if (!hit) return 'no signals were produced on the sample session';
              if (!(hit.stopPoints > 0 && hit.targetPoints > 0)) return 'the distances should be positive';
              return Math.abs(hit.targetPoints / hit.stopPoints - 2) < 1e-9
                ? true : 'the target should be twice the stop for 3.0 / 1.5';
            } },
          { name: 'a flat series produces no signals', expose: ['buildSignals'],
            run: function (s) {
              var bars = [];
              for (var i = 0; i < 40; i++) bars.push({ open: 100, high: 100, low: 100, close: 100 });
              var out = s.buildSignals(bars, { fast: 5, slow: 15, atrLength: 5, stopAtr: 1.5, targetAtr: 3 });
              return out.every(function (v) { return v === null; })
                ? true : 'a flat market should produce nothing';
            } }
        ] } },
      { id: 'e2', title: 'The execution layer', difficulty: 'Boss · part 2',
        prompt: 'Write <code>execute(bars, signals, config)</code> running the bar loop.<br>' +
          '<code>config</code> is <code>{ startEquity, riskPercent, pointValue, commissionPerSide, maxDailyLoss }</code>.<ol>' +
          '<li>On each bar: if a position is open, exit at the stop (checked first) or the target if the bar\'s range reaches either; record the closed trade and update equity.</li>' +
          '<li>Then, if a signal was pending from the previous bar and you are flat, open at this bar\'s open, sized as <code>floor(equity × riskPercent / 100 / (stopPoints × pointValue))</code>. A size of 0 skips it.</li>' +
          '<li>Then, if flat, take <code>signals[i]</code> as pending — but only if the running loss is above <code>-maxDailyLoss</code>; otherwise record a veto.</li></ol>' +
          'Return <code>{ trades, equity, vetoes }</code>. Each trade is <code>{ side, entry, exit, qty, reason, points, net }</code>, with <code>net</code> after commission on both sides.',
        starter: 'function execute(bars, signals, config) {\n  // { trades, equity, vetoes }\n}\n',
        solution: 'function execute(bars, signals, config) {\n  const { startEquity, riskPercent, pointValue, commissionPerSide, maxDailyLoss } = config;\n  let equity = startEquity;\n  let position = null, pending = null, vetoes = 0;\n  const trades = [];\n\n  for (let i = 0; i < bars.length; i++) {\n    const bar = bars[i];\n\n    if (position) {\n      let reason = null, exit = null;\n      if (position.side === "long") {\n        if (bar.low <= position.stop) { reason = "stop"; exit = position.stop; }\n        else if (bar.high >= position.target) { reason = "target"; exit = position.target; }\n      } else {\n        if (bar.high >= position.stop) { reason = "stop"; exit = position.stop; }\n        else if (bar.low <= position.target) { reason = "target"; exit = position.target; }\n      }\n      if (reason) {\n        const points = position.side === "long" ? exit - position.entry : position.entry - exit;\n        const net = points * position.qty * pointValue - commissionPerSide * position.qty * 2;\n        trades.push({ side: position.side, entry: position.entry, exit, qty: position.qty,\n          reason, points, net });\n        equity += net;\n        position = null;\n      }\n    }\n\n    if (pending && !position) {\n      const entry = bar.open;\n      const perContract = pending.stopPoints * pointValue;\n      const qty = perContract <= 0 ? 0\n        : Math.max(0, Math.floor(equity * riskPercent / 100 / perContract));\n      if (qty > 0) {\n        const dir = pending.side === "long" ? 1 : -1;\n        position = { side: pending.side, entry, qty,\n          stop: entry - dir * pending.stopPoints,\n          target: entry + dir * pending.targetPoints };\n      }\n      pending = null;\n    }\n\n    if (!position) {\n      const sig = signals[i];\n      if (sig) {\n        if (equity - startEquity <= -maxDailyLoss) vetoes++;\n        else pending = sig;\n      }\n    }\n  }\n\n  return { trades, equity, vetoes };\n}',
        hints: ['Three blocks per bar, in order: exit, fill pending, take a new signal.',
                'The running loss is <code>equity - startEquity</code>.',
                'A vetoed signal increments the counter and is not stored as pending.'],
        tests: { checks: [
          { name: 'a target hit is recorded correctly', expose: ['execute'],
            run: function (s) {
              var bars = [
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 120, low: 100, close: 118 }
              ];
              var signals = [{ side: 'long', stopPoints: 5, targetPoints: 10 }, null, null];
              var r = s.execute(bars, signals, {
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 0, maxDailyLoss: 100000
              });
              if (r.trades.length !== 1) return 'expected 1 trade, got ' + r.trades.length;
              var t = r.trades[0];
              if (t.entry !== 100) return 'entry should be the next bar open';
              if (t.exit !== 110 || t.reason !== 'target') return 'expected a target exit at 110';
              return t.qty === 4 ? true : 'expected 4 contracts, got ' + t.qty;
            } },
          { name: 'the stop wins an ambiguous bar', expose: ['execute'],
            run: function (s) {
              var bars = [
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 120, low: 90, close: 100 }
              ];
              var signals = [{ side: 'long', stopPoints: 5, targetPoints: 10 }, null, null];
              var r = s.execute(bars, signals, {
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 0, maxDailyLoss: 100000
              });
              return r.trades[0].reason === 'stop' ? true : 'an ambiguous bar must resolve to the stop';
            } },
          { name: 'commission is charged on both sides', expose: ['execute'],
            run: function (s) {
              var bars = [
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 120, low: 100, close: 118 }
              ];
              var signals = [{ side: 'long', stopPoints: 5, targetPoints: 10 }, null, null];
              var r = s.execute(bars, signals, {
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 100000
              });
              var t = r.trades[0];
              var expected = 10 * t.qty * 50 - 2.5 * t.qty * 2;
              return Math.abs(t.net - expected) < 1e-9 ? true : 'net was ' + t.net + ', expected ' + expected;
            } },
          { name: 'never holds two positions', expose: ['execute'],
            run: function (s) {
              var bars = [], signals = [];
              for (var i = 0; i < 30; i++) {
                bars.push({ open: 100, high: 101, low: 99, close: 100 });
                signals.push({ side: 'long', stopPoints: 50, targetPoints: 100 });
              }
              var r = s.execute(bars, signals, {
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 0, maxDailyLoss: 100000
              });
              return r.trades.length <= 1 ? true : 'opened ' + r.trades.length + ' overlapping positions';
            } },
          { name: 'the daily loss limit vetoes new signals', expose: ['execute'],
            run: function (s) {
              var bars = [
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 100, low: 80, close: 85 },
                { open: 85, high: 85, low: 85, close: 85 },
                { open: 85, high: 120, low: 85, close: 118 }
              ];
              var signals = [
                { side: 'long', stopPoints: 10, targetPoints: 20 }, null, null,
                { side: 'long', stopPoints: 10, targetPoints: 20 }, null
              ];
              var r = s.execute(bars, signals, {
                startEquity: 100000, riskPercent: 5, pointValue: 50,
                commissionPerSide: 0, maxDailyLoss: 100
              });
              if (r.vetoes < 1) return 'the second signal should have been vetoed after the loss';
              return r.trades.length === 1 ? true : 'only the first trade should have been taken';
            } },
          { name: 'equity matches the trade log', expose: ['execute'],
            run: function (s) {
              var signals = MARKET.bars.map(function (_, i) {
                return i % 11 === 0 ? { side: i % 22 === 0 ? 'long' : 'short', stopPoints: 3, targetPoints: 6 } : null;
              });
              var r = s.execute(MARKET.bars, signals, {
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 100000
              });
              var net = r.trades.reduce(function (a, t) { return a + t.net; }, 0);
              return Math.abs(r.equity - (100000 + net)) < 1e-6
                ? true : 'equity does not match the sum of the trade log';
            } },
          { name: 'no signals means no trades', expose: ['execute'],
            run: function (s) {
              var signals = MARKET.bars.map(function () { return null; });
              var r = s.execute(MARKET.bars, signals, {
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 1000
              });
              return (r.trades.length === 0 && r.equity === 100000 && r.vetoes === 0)
                ? true : 'an inactive strategy should change nothing';
            } }
        ] } },
      { id: 'e3', title: 'runSystem()', difficulty: 'Boss · final',
        prompt: 'Wire it all together. Write <code>runSystem(bars, config)</code> returning the complete result:<br>' +
          '<code>{ signalCount, trades, equity, vetoes, stats, report }</code><ul>' +
          '<li><code>signalCount</code> — how many non-null signals the signal layer produced</li>' +
          '<li><code>stats</code> — <code>{ count, wins, losses, winRate, netPnl, profitFactor, maxDrawdown }</code>, all derived from the trade log; <code>profitFactor</code> is <code>Infinity</code> with profit and no loss, <code>0</code> with neither; <code>maxDrawdown</code> is the largest peak-to-trough fall of the equity curve starting from <code>startEquity</code>, as a positive number</li>' +
          '<li><code>report</code> — a string of aligned lines, label padded to 20 and value padded to 12, in the order: <code>Signals</code>, <code>Trades</code>, <code>Win rate</code> (one decimal and a percent sign), <code>Net P&amp;L</code> (two decimals), <code>Max drawdown</code> (two decimals), <code>Vetoes</code></li></ul>' +
          '<span class="muted"><code>buildSignals</code> and <code>execute</code> are supplied in the starter — this exercise is the assembly and the reporting.</span>',
        starter: 'function buildSignals(bars, config) {\n  const { fast, slow, atrLength, stopAtr, targetAtr } = config;\n  const closes = bars.map(b => b.close);\n  const sma = (series, n) => {\n    const out = new Array(series.length).fill(null);\n    let sum = 0;\n    for (let i = 0; i < series.length; i++) {\n      sum += series[i];\n      if (i >= n) sum -= series[i - n];\n      if (i >= n - 1) out[i] = sum / n;\n    }\n    return out;\n  };\n  const f = sma(closes, fast), s = sma(closes, slow);\n  const tr = bars.map((b, i) => i === 0 ? b.high - b.low\n    : Math.max(b.high - b.low, Math.abs(b.high - bars[i - 1].close), Math.abs(b.low - bars[i - 1].close)));\n  const atr = new Array(bars.length).fill(null);\n  if (bars.length >= atrLength) {\n    let avg = tr.slice(0, atrLength).reduce((a, b) => a + b, 0) / atrLength;\n    atr[atrLength - 1] = avg;\n    for (let i = atrLength; i < tr.length; i++) { avg = (avg * (atrLength - 1) + tr[i]) / atrLength; atr[i] = avg; }\n  }\n  return bars.map((_, i) => {\n    if (i === 0 || f[i] === null || s[i] === null || f[i - 1] === null || s[i - 1] === null || atr[i] === null) return null;\n    const up = f[i] > s[i] && f[i - 1] <= s[i - 1];\n    const down = f[i] < s[i] && f[i - 1] >= s[i - 1];\n    if (!up && !down) return null;\n    return { side: up ? "long" : "short", stopPoints: atr[i] * stopAtr, targetPoints: atr[i] * targetAtr };\n  });\n}\n\nfunction execute(bars, signals, config) {\n  const { startEquity, riskPercent, pointValue, commissionPerSide, maxDailyLoss } = config;\n  let equity = startEquity, position = null, pending = null, vetoes = 0;\n  const trades = [];\n  for (let i = 0; i < bars.length; i++) {\n    const bar = bars[i];\n    if (position) {\n      let reason = null, exit = null;\n      if (position.side === "long") {\n        if (bar.low <= position.stop) { reason = "stop"; exit = position.stop; }\n        else if (bar.high >= position.target) { reason = "target"; exit = position.target; }\n      } else {\n        if (bar.high >= position.stop) { reason = "stop"; exit = position.stop; }\n        else if (bar.low <= position.target) { reason = "target"; exit = position.target; }\n      }\n      if (reason) {\n        const points = position.side === "long" ? exit - position.entry : position.entry - exit;\n        const net = points * position.qty * pointValue - commissionPerSide * position.qty * 2;\n        trades.push({ side: position.side, entry: position.entry, exit, qty: position.qty, reason, points, net });\n        equity += net;\n        position = null;\n      }\n    }\n    if (pending && !position) {\n      const entry = bar.open;\n      const perContract = pending.stopPoints * pointValue;\n      const qty = perContract <= 0 ? 0 : Math.max(0, Math.floor(equity * riskPercent / 100 / perContract));\n      if (qty > 0) {\n        const dir = pending.side === "long" ? 1 : -1;\n        position = { side: pending.side, entry, qty, stop: entry - dir * pending.stopPoints,\n          target: entry + dir * pending.targetPoints };\n      }\n      pending = null;\n    }\n    if (!position) {\n      const sig = signals[i];\n      if (sig) {\n        if (equity - startEquity <= -maxDailyLoss) vetoes++;\n        else pending = sig;\n      }\n    }\n  }\n  return { trades, equity, vetoes };\n}\n\nfunction runSystem(bars, config) {\n  // signals -> execution -> statistics -> report\n}\n',
        solution: 'function buildSignals(bars, config) {\n  const { fast, slow, atrLength, stopAtr, targetAtr } = config;\n  const closes = bars.map(b => b.close);\n  const sma = (series, n) => {\n    const out = new Array(series.length).fill(null);\n    let sum = 0;\n    for (let i = 0; i < series.length; i++) {\n      sum += series[i];\n      if (i >= n) sum -= series[i - n];\n      if (i >= n - 1) out[i] = sum / n;\n    }\n    return out;\n  };\n  const f = sma(closes, fast), s = sma(closes, slow);\n  const tr = bars.map((b, i) => i === 0 ? b.high - b.low\n    : Math.max(b.high - b.low, Math.abs(b.high - bars[i - 1].close), Math.abs(b.low - bars[i - 1].close)));\n  const atr = new Array(bars.length).fill(null);\n  if (bars.length >= atrLength) {\n    let avg = tr.slice(0, atrLength).reduce((a, b) => a + b, 0) / atrLength;\n    atr[atrLength - 1] = avg;\n    for (let i = atrLength; i < tr.length; i++) { avg = (avg * (atrLength - 1) + tr[i]) / atrLength; atr[i] = avg; }\n  }\n  return bars.map((_, i) => {\n    if (i === 0 || f[i] === null || s[i] === null || f[i - 1] === null || s[i - 1] === null || atr[i] === null) return null;\n    const up = f[i] > s[i] && f[i - 1] <= s[i - 1];\n    const down = f[i] < s[i] && f[i - 1] >= s[i - 1];\n    if (!up && !down) return null;\n    return { side: up ? "long" : "short", stopPoints: atr[i] * stopAtr, targetPoints: atr[i] * targetAtr };\n  });\n}\n\nfunction execute(bars, signals, config) {\n  const { startEquity, riskPercent, pointValue, commissionPerSide, maxDailyLoss } = config;\n  let equity = startEquity, position = null, pending = null, vetoes = 0;\n  const trades = [];\n  for (let i = 0; i < bars.length; i++) {\n    const bar = bars[i];\n    if (position) {\n      let reason = null, exit = null;\n      if (position.side === "long") {\n        if (bar.low <= position.stop) { reason = "stop"; exit = position.stop; }\n        else if (bar.high >= position.target) { reason = "target"; exit = position.target; }\n      } else {\n        if (bar.high >= position.stop) { reason = "stop"; exit = position.stop; }\n        else if (bar.low <= position.target) { reason = "target"; exit = position.target; }\n      }\n      if (reason) {\n        const points = position.side === "long" ? exit - position.entry : position.entry - exit;\n        const net = points * position.qty * pointValue - commissionPerSide * position.qty * 2;\n        trades.push({ side: position.side, entry: position.entry, exit, qty: position.qty, reason, points, net });\n        equity += net;\n        position = null;\n      }\n    }\n    if (pending && !position) {\n      const entry = bar.open;\n      const perContract = pending.stopPoints * pointValue;\n      const qty = perContract <= 0 ? 0 : Math.max(0, Math.floor(equity * riskPercent / 100 / perContract));\n      if (qty > 0) {\n        const dir = pending.side === "long" ? 1 : -1;\n        position = { side: pending.side, entry, qty, stop: entry - dir * pending.stopPoints,\n          target: entry + dir * pending.targetPoints };\n      }\n      pending = null;\n    }\n    if (!position) {\n      const sig = signals[i];\n      if (sig) {\n        if (equity - startEquity <= -maxDailyLoss) vetoes++;\n        else pending = sig;\n      }\n    }\n  }\n  return { trades, equity, vetoes };\n}\n\nfunction runSystem(bars, config) {\n  // signals -> execution -> statistics -> report\n}\n' +
          'function runSystem(bars, config) {\n  const signals = buildSignals(bars, config);\n  const signalCount = signals.filter(Boolean).length;\n  const { trades, equity, vetoes } = execute(bars, signals, config);\n\n  const wins = trades.filter(t => t.net > 0).length;\n  const losses = trades.filter(t => t.net < 0).length;\n  const netPnl = trades.reduce((a, t) => a + t.net, 0);\n  const grossProfit = trades.filter(t => t.net > 0).reduce((a, t) => a + t.net, 0);\n  const grossLoss = Math.abs(trades.filter(t => t.net < 0).reduce((a, t) => a + t.net, 0));\n\n  let running = config.startEquity, peak = config.startEquity, maxDrawdown = 0;\n  for (const t of trades) {\n    running += t.net;\n    peak = Math.max(peak, running);\n    maxDrawdown = Math.max(maxDrawdown, peak - running);\n  }\n\n  const stats = {\n    count: trades.length,\n    wins,\n    losses,\n    winRate: trades.length ? wins / trades.length : 0,\n    netPnl,\n    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss,\n    maxDrawdown\n  };\n\n  const line = (label, value) => label.padEnd(20) + String(value).padStart(12);\n  const report = [\n    line("Signals", signalCount),\n    line("Trades", stats.count),\n    line("Win rate", (stats.winRate * 100).toFixed(1) + "%"),\n    line("Net P&L", stats.netPnl.toFixed(2)),\n    line("Max drawdown", stats.maxDrawdown.toFixed(2)),\n    line("Vetoes", vetoes)\n  ].join("\\n");\n\n  return { signalCount, trades, equity, vetoes, stats, report };\n}',
        hints: ['Call the two layers in order, then derive everything from the trade log.',
                'Walk the trades once to build the equity curve and the drawdown together.',
                'A small <code>line</code> helper keeps the report formatting in one place.'],
        tests: { checks: [
          { name: 'runs end to end on the sample session', expose: ['runSystem'],
            run: function (s) {
              var r = s.runSystem(MARKET.bars, {
                fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3,
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 5000
              });
              if (typeof r.signalCount !== 'number') return 'signalCount is missing';
              if (!Array.isArray(r.trades)) return 'trades should be an array';
              if (typeof r.equity !== 'number') return 'equity should be a number';
              return typeof r.report === 'string' ? true : 'report should be a string';
            } },
          { name: 'stats are derived from the trade log', expose: ['runSystem'],
            run: function (s) {
              var r = s.runSystem(MARKET.bars, {
                fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3,
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 100000
              });
              var net = r.trades.reduce(function (a, t) { return a + t.net; }, 0);
              if (Math.abs(r.stats.netPnl - net) > 1e-6) return 'netPnl does not match the log';
              if (r.stats.count !== r.trades.length) return 'count does not match the log';
              var wins = r.trades.filter(function (t) { return t.net > 0; }).length;
              if (r.stats.wins !== wins) return 'wins does not match the log';
              return Math.abs(r.equity - (100000 + net)) < 1e-6
                ? true : 'equity does not match the log';
            } },
          { name: 'maxDrawdown is non-negative and consistent', expose: ['runSystem'],
            run: function (s) {
              var r = s.runSystem(MARKET.bars, {
                fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3,
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 100000
              });
              if (r.stats.maxDrawdown < 0) return 'maxDrawdown should be positive';
              var running = 100000, peak = 100000, want = 0;
              r.trades.forEach(function (t) {
                running += t.net;
                peak = Math.max(peak, running);
                want = Math.max(want, peak - running);
              });
              return Math.abs(r.stats.maxDrawdown - want) < 1e-6
                ? true : 'expected ' + want + ', got ' + r.stats.maxDrawdown;
            } },
          { name: 'the report has six aligned lines', expose: ['runSystem'],
            run: function (s) {
              var r = s.runSystem(MARKET.bars, {
                fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3,
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 100000
              });
              var lines = r.report.split('\n');
              if (lines.length !== 6) return 'expected 6 lines, got ' + lines.length;
              for (var i = 0; i < lines.length; i++) {
                if (lines[i].length !== 32) return 'line ' + i + ' is ' + lines[i].length + ' characters, expected 32';
              }
              if (lines[0].indexOf('Signals') !== 0) return 'the first line should be Signals';
              return lines[5].indexOf('Vetoes') === 0 ? true : 'the last line should be Vetoes';
            } },
          { name: 'costs reduce the result', expose: ['runSystem'],
            run: function (s) {
              var base = {
                fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3,
                startEquity: 100000, riskPercent: 1, pointValue: 50, maxDailyLoss: 100000
              };
              var free = s.runSystem(MARKET.bars, Object.assign({ commissionPerSide: 0 }, base));
              var paid = s.runSystem(MARKET.bars, Object.assign({ commissionPerSide: 10 }, base));
              if (free.trades.length === 0) return 'the configuration produced no trades to compare';
              return paid.stats.netPnl < free.stats.netPnl
                ? true : 'paying commission should reduce net P&L';
            } },
          { name: 'a tighter risk limit produces vetoes or fewer trades', expose: ['runSystem'],
            run: function (s) {
              var base = {
                fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3,
                startEquity: 100000, riskPercent: 2, pointValue: 50, commissionPerSide: 2.5
              };
              var loose = s.runSystem(MARKET.bars, Object.assign({ maxDailyLoss: 1e9 }, base));
              var tight = s.runSystem(MARKET.bars, Object.assign({ maxDailyLoss: 1 }, base));
              return tight.trades.length <= loose.trades.length
                ? true : 'a tighter limit should never increase the trade count';
            } },
          { name: 'is deterministic', expose: ['runSystem'],
            run: function (s) {
              var cfg = {
                fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3,
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 5000
              };
              var a = s.runSystem(MARKET.bars, cfg);
              var b = s.runSystem(MARKET.bars, cfg);
              return a.report === b.report && a.equity === b.equity
                ? true : 'the same inputs produced different output';
            } },
          { name: 'an empty series produces an empty run', expose: ['runSystem'],
            run: function (s) {
              var r = s.runSystem([], {
                fast: 5, slow: 15, atrLength: 10, stopAtr: 1.5, targetAtr: 3,
                startEquity: 100000, riskPercent: 1, pointValue: 50,
                commissionPerSide: 2.5, maxDailyLoss: 5000
              });
              return (r.trades.length === 0 && r.equity === 100000 && r.stats.winRate === 0)
                ? true : 'no data should produce a clean, NaN-free result';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Which direction do dependencies flow in this system?',
        options: ['Both ways', 'One way: data → indicators → signals → risk → execution → reporting', 'Reporting first', 'It does not matter'],
        answer: 1,
        explain: 'One-way flow is what lets you replace the signal without re-testing execution.' },
      { q: 'Why derive every statistic from the trade log?',
        options: ['Speed', 'One source of truth, so the numbers cannot contradict each other and anyone can recompute them', 'Less memory', 'It is required'],
        answer: 1,
        explain: 'If a reader can rebuild every figure from the log, the engine cannot be hiding anything.' },
      { q: 'You can now build a complete trading system. What does that give you?',
        options: ['A profitable strategy', 'The engineering half — finding a real edge and surviving to trade it is the other half', 'Guaranteed returns', 'Nothing useful'],
        answer: 1,
        explain: 'The system is the tractable part. What it should trade, and staying solvent long enough to find out, is the part no curriculum can hand you.' }
    ],
    recap: [
      'Every layer depends only on the ones before it.',
      'No look-ahead, no bypassing risk, no gross-only numbers.',
      'Derive everything from the trade log.',
      'You have the engineering. The edge is a separate, harder problem — and now you can test honestly whether you have one.'
    ],
    vocab: [
      { term: 'Trading system', def: 'The whole apparatus — data, signals, risk, execution and measurement. Distinct from the strategy it happens to run.' },
      { term: 'Edge', def: 'A genuine, repeatable statistical advantage. The hard part, and the part a backtest can only ever fail to disprove.' }
    ]
  });

})();
