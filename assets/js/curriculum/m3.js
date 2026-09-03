/* ============================================================
   MODULE 3 — Functions in Depth (levels 29–42)
   ============================================================ */
(function () {
  'use strict';
  var C = window.CURRICULUM, CX = window.CX;

  C.push({
    id: 'd029', day: 29, module: 3, minutes: 30,
    title: 'Scope and Closures',
    subtitle: 'Functions that remember where they were born.',
    goal: '<b>Goal:</b> build a function that carries private state — the foundation of every streaming indicator you will write.',
    objectives: [
      'Explain block, function and module scope',
      'Describe what a closure captures',
      'Build a counter and a running accumulator with closures',
      'Recognise the shared-variable trap'
    ],
    sections: [
      { h: 'Scope is where a name is visible',
        body: '<p><code>let</code> and <code>const</code> are <strong>block scoped</strong>: they exist only between the nearest braces. An inner scope can see outward; an outer scope can never see in.</p>',
        code: 'const outer = "visible everywhere below";\n\nif (true) {\n  const inner = "only inside this block";\n  console.log(outer, "|", inner);\n}\n\ntry { console.log(inner); } catch (e) { console.log("Outside:", e.message); }' },
      { h: 'A closure is a function plus its birthplace',
        body: '<p>When a function is created inside another, it keeps a live link to that outer scope — even after the outer function has returned. That captured scope is <em>private</em>: nothing outside can reach it except through the function you returned.</p>',
        code: 'function makeCounter() {\n  let count = 0;              // private\n  return function () {\n    count++;\n    return count;\n  };\n}\n\nconst barCount = makeCounter();\nconsole.log(barCount(), barCount(), barCount());\n\nconst other = makeCounter();  // its own independent count\nconsole.log(other());' },
      { h: 'Why this matters for indicators',
        body: '<p>A streaming indicator needs memory: the previous EMA, the running sum, the bars seen so far. A closure gives you exactly that, without a global variable and without a class.</p>' +
              '<div class="note note-trade"><b>On the desk</b>A live feed hands you one bar at a time. You cannot re-run <code>slice(-20)</code> over history on every tick at scale — you keep the state and update it. A closure is the smallest thing that can hold that state safely.</div>',
        code: 'function makeRunningMean() {\n  let sum = 0, n = 0;\n  return function (value) {\n    sum += value;\n    n++;\n    return sum / n;\n  };\n}\n\nconst mean = makeRunningMean();\nfor (const c of closes.slice(0, 5)) {\n  console.log(c, "-> running mean", mean(c).toFixed(2));\n}' },
      { h: 'Closures capture variables, not values',
        body: '<p>The classic trap: every closure created in a <code>var</code> loop shares one variable. <code>let</code> creates a fresh binding each iteration, which fixes it.</p>',
        code: 'const broken = [];\nfor (var i = 0; i < 3; i++) broken.push(() => i);\nconsole.log(broken.map(f => f()));   // [3,3,3] — all share one i\n\nconst fixed = [];\nfor (let j = 0; j < 3; j++) fixed.push(() => j);\nconsole.log(fixed.map(f => f()));    // [0,1,2]' }
    ],
    parsons: {
      prompt: 'Build a counter that keeps its count private.',
      lines: [
        'function makeCounter() {',
        '  let count = 0;',
        '  return function () {',
        '    count++;',
        '    return count;',
        '  };',
        '}',
        'const c = makeCounter();',
        'console.log(c(), c());'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeCounter()', difficulty: 'Core',
        prompt: 'Write <code>makeCounter()</code> returning a function that, each time it is called, returns 1, then 2, then 3 and so on.<br>' +
          'Two counters made separately must not share a count.',
        starter: 'function makeCounter() {\n  // return a function with its own private count\n}\n',
        solution: 'function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}',
        hints: ['Declare the count inside <code>makeCounter</code>, before the returned function.',
                '<code>++count</code> increments first and returns the new value.'],
        tests: { fn: 'makeCounter', cases: [
          { args: [], check: function (got) {
              if (typeof got !== 'function') return 'expected a function to be returned';
              return (got() === 1 && got() === 2 && got() === 3) ? true : 'the counter should return 1, 2, 3 on successive calls';
            }, name: 'counts 1, 2, 3 on successive calls' },
          { args: [], check: function (got) { return typeof got === 'function' ? true : 'expected a function'; },
            name: 'returns a function' }
        ], checks: [{
          name: 'two counters are independent', expose: ['makeCounter'],
          run: function (s) {
            var a = s.makeCounter(), b = s.makeCounter();
            a(); a(); a();
            return b() === 1 ? true : 'the second counter started at ' + b() + ' — the state is being shared';
          }
        }] } },
      { id: 'e2', title: 'makeRunningSum()', difficulty: 'Core',
        prompt: 'Write <code>makeRunningSum()</code> returning a function that takes a number and returns the total of everything it has been given so far.<br>' +
          '<code>const add = makeRunningSum(); add(10) → 10; add(5) → 15; add(-3) → 12</code>',
        starter: 'function makeRunningSum() {\n  // return a function that accumulates\n}\n',
        solution: 'function makeRunningSum() {\n  let total = 0;\n  return v => total += v;\n}',
        hints: ['Keep <code>total</code> in the outer scope so it survives between calls.',
                '<code>total += v</code> evaluates to the new total, so an arrow can return it directly.'],
        tests: { fn: 'makeRunningSum', cases: [
          { args: [], check: function (got) {
              if (typeof got !== 'function') return 'expected a function';
              if (got(10) !== 10) return 'first call with 10 should return 10';
              if (got(5) !== 15) return 'second call with 5 should return 15';
              if (got(-3) !== 12) return 'third call with -3 should return 12';
              return true;
            }, name: 'accumulates 10, 5, -3 to 10, 15, 12' }
        ], checks: [{
          name: 'each accumulator has its own total', expose: ['makeRunningSum'],
          run: function (s) {
            var a = s.makeRunningSum(), b = s.makeRunningSum();
            a(100);
            return b(1) === 1 ? true : 'the second accumulator saw the first one\'s total';
          }
        }] } },
      { id: 'e3', title: 'makeRollingWindow()', difficulty: 'Stretch',
        prompt: 'Write <code>makeRollingWindow(size)</code> returning a function that takes a price and returns the mean of the last <code>size</code> prices.<br>' +
          'Before the window is full, return the mean of what has been seen so far.<br>' +
          '<code>const w = makeRollingWindow(3); w(10) → 10; w(20) → 15; w(30) → 20; w(60) → 36.67</code>',
        starter: 'function makeRollingWindow(size) {\n  // return a function computing the rolling mean\n}\n',
        solution: 'function makeRollingWindow(size) {\n  const buf = [];\n  return price => {\n    buf.push(price);\n    if (buf.length > size) buf.shift();\n    return buf.reduce((a, v) => a + v, 0) / buf.length;\n  };\n}',
        hints: ['Keep an array in the closure; push each new price and shift off the front once it exceeds <code>size</code>.',
                'Dividing by <code>buf.length</code> rather than <code>size</code> handles the not-yet-full case automatically.'],
        tests: { fn: 'makeRollingWindow', cases: [
          { args: [3], check: function (got, args, h) {
              if (typeof got !== 'function') return 'expected a function';
              if (Math.abs(got(10) - 10) > 1e-9) return 'first value should return itself';
              if (Math.abs(got(20) - 15) > 1e-9) return 'after 10 and 20 the mean is 15';
              if (Math.abs(got(30) - 20) > 1e-9) return 'after 10, 20, 30 the mean is 20';
              if (Math.abs(got(60) - 110 / 3) > 1e-6) return 'the window should drop the 10 and average 20, 30, 60';
              return true;
            }, name: 'rolls a window of 3 correctly' },
          { args: [1], check: function (got) {
              got(5);
              return Math.abs(got(9) - 9) < 1e-9 ? true : 'a window of 1 should always return the latest value';
            }, name: 'a window of 1 returns the latest value' }
        ] } }
    ],
    quiz: [
      { q: 'What does a closure capture?',
        options: ['A copy of the outer values', 'A live reference to the outer scope', 'Only parameters', 'Nothing — it re-reads globals'],
        answer: 1,
        explain: 'It keeps the variables alive, not snapshots of them. That is why a counter can keep incrementing.' },
      { q: 'Why does <code>for (var i...)</code> with closures give <code>[3,3,3]</code>?',
        options: ['A JavaScript bug', 'All three closures share one <code>i</code>, which ended at 3', '<code>var</code> is asynchronous', 'The array is reversed'],
        answer: 1,
        explain: '<code>var</code> is function-scoped, so there is one <code>i</code>. <code>let</code> creates a fresh binding per iteration.' },
      { q: 'How do you read a closure\'s captured variable from outside?',
        options: ['<code>fn.count</code>', 'You cannot — only through the function itself', '<code>Object.keys(fn)</code>', 'With <code>this</code>'],
        answer: 1,
        explain: 'That inaccessibility is the point: it is genuine private state.' }
    ],
    recap: [
      '<code>let</code>/<code>const</code> are block scoped; inner scopes see outward only.',
      'A closure keeps its birth scope alive after the outer function returns.',
      'Each call to the factory produces independent state.',
      'Closures capture variables, not values — use <code>let</code> in loops.'
    ],
    vocab: [
      { term: 'Streaming indicator', def: 'An indicator updated one bar at a time from stored state, rather than recomputed over history on every tick.' }
    ]
  });

  C.push({
    id: 'd030', day: 30, module: 3, minutes: 35, boss: true,
    title: 'Boss: The Indicator Factory',
    subtitle: 'Closures + everything so far, turned into live indicators.',
    goal: '<b>Goal:</b> build a family of stateful indicators from factory functions, then combine them into a signal.',
    objectives: [
      'Design a factory that returns a stateful update function',
      'Implement a streaming SMA and EMA',
      'Compose several indicators into one decision',
      'Keep state private and instances independent'
    ],
    sections: [
      { h: 'The factory pattern',
        body: '<p>A factory takes configuration, captures whatever state it needs, and returns the function that does the work. Every indicator in module 5 will follow this shape.</p>',
        code: 'function makeThreshold(limit) {\n  let breaches = 0;\n  return value => {\n    if (value > limit) breaches++;\n    return breaches;\n  };\n}\n\nconst counter = makeThreshold(5230);\nfor (const c of closes.slice(0, 6)) console.log(c, "->", counter(c));' },
      { h: 'Streaming SMA',
        body: '<p>The simple moving average over the last <em>n</em> values. Keep the buffer, drop the oldest, return <code>null</code> until you have enough data — a partial average is not an SMA, and pretending otherwise fabricates signals at the start of every backtest.</p>',
        code: 'function makeSMA(period) {\n  const buf = [];\n  return price => {\n    buf.push(price);\n    if (buf.length > period) buf.shift();\n    if (buf.length < period) return null;\n    return buf.reduce((a, v) => a + v, 0) / period;\n  };\n}\n\nconst sma3 = makeSMA(3);\nfor (const c of [10, 12, 11, 15, 14]) console.log(c, "->", sma3(c));' },
      { h: 'Streaming EMA',
        body: '<p>The exponential moving average weights recent prices more heavily and needs only one number of state:</p>' +
              '<p class="mono" style="color:var(--fg)">EMA = α × price + (1 − α) × previousEMA,&nbsp;&nbsp; α = 2 / (period + 1)</p>' +
              '<p>The conventional seed is the first price. From then on it is one multiply-add per bar — which is why EMAs are everywhere in live systems.</p>',
        code: 'function makeEMA(period) {\n  const a = 2 / (period + 1);\n  let prev = null;\n  return price => {\n    prev = prev === null ? price : a * price + (1 - a) * prev;\n    return prev;\n  };\n}\n\nconst ema3 = makeEMA(3);\nfor (const c of [10, 12, 11, 15]) console.log(c, "->", ema3(c).toFixed(3));' }
    ],
    parsons: {
      prompt: 'Build a streaming EMA factory.',
      lines: [
        'function makeEMA(period) {',
        '  const alpha = 2 / (period + 1);',
        '  let prev = null;',
        '  return price => {',
        '    prev = prev === null ? price : alpha * price + (1 - alpha) * prev;',
        '    return prev;',
        '  };',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeSMA()', difficulty: 'Boss · part 1',
        prompt: 'Write <code>makeSMA(period)</code> returning a function that takes one price and returns the simple moving average of the last <code>period</code> prices.<br>' +
          'Return <code>null</code> until <code>period</code> prices have been seen.',
        starter: 'function makeSMA(period) {\n  // return the streaming update function\n}\n',
        solution: 'function makeSMA(period) {\n  const buf = [];\n  return price => {\n    buf.push(price);\n    if (buf.length > period) buf.shift();\n    return buf.length < period ? null : buf.reduce((a, v) => a + v, 0) / period;\n  };\n}',
        hints: ['Keep the buffer in the closure; push then shift to hold it at <code>period</code> long.',
                'Return <code>null</code> while <code>buf.length &lt; period</code>.'],
        tests: { fn: 'makeSMA', cases: [
          { args: [3], check: function (got) {
              if (typeof got !== 'function') return 'expected a function';
              if (got(10) !== null) return 'the first value should return null (not enough data)';
              if (got(12) !== null) return 'the second value should still return null';
              if (Math.abs(got(11) - 11) > 1e-9) return 'the third value should return the mean 11';
              if (Math.abs(got(15) - 38 / 3) > 1e-9) return 'the fourth value should average 12, 11, 15';
              return true;
            }, name: 'nulls until full, then a correct 3-period mean' },
          { args: [1], check: function (got) {
              return Math.abs(got(7) - 7) < 1e-9 ? true : 'a period of 1 should return the value itself';
            }, name: 'a period of 1 returns each value' }
        ], checks: [{
          name: 'two SMAs do not share a buffer', expose: ['makeSMA'],
          run: function (s) {
            var a = s.makeSMA(2), b = s.makeSMA(2);
            a(100); a(100);
            return b(1) === null ? true : 'the second SMA saw the first one\'s data';
          }
        }] } },
      { id: 'e2', title: 'makeEMA()', difficulty: 'Boss · part 2',
        prompt: 'Write <code>makeEMA(period)</code> returning a streaming EMA function.<br>' +
          'α is <code>2 / (period + 1)</code>. Seed with the very first price, then apply <code>α × price + (1 − α) × previous</code>.<br>' +
          'Unlike the SMA, this returns a number from the first call.',
        starter: 'function makeEMA(period) {\n  // return the streaming update function\n}\n',
        solution: 'function makeEMA(period) {\n  const alpha = 2 / (period + 1);\n  let prev = null;\n  return price => {\n    prev = prev === null ? price : alpha * price + (1 - alpha) * prev;\n    return prev;\n  };\n}',
        hints: ['Compute <code>alpha</code> once, outside the returned function.',
                'Track <code>prev</code> as <code>null</code> initially so the first price seeds it.'],
        tests: { fn: 'makeEMA', cases: [
          { args: [3], check: function (got) {
              if (typeof got !== 'function') return 'expected a function';
              var a = 2 / 4;
              if (Math.abs(got(10) - 10) > 1e-9) return 'the first price should be returned unchanged as the seed';
              var want2 = a * 12 + (1 - a) * 10;
              if (Math.abs(got(12) - want2) > 1e-9) return 'expected ' + want2 + ' after 10 then 12';
              var want3 = a * 11 + (1 - a) * want2;
              if (Math.abs(got(11) - want3) > 1e-9) return 'expected ' + want3 + ' after adding 11';
              return true;
            }, name: 'seeds with the first price then applies the EMA recurrence' },
          { args: [9], check: function (got) {
              var a = 2 / 10;
              got(100);
              var want = a * 110 + (1 - a) * 100;
              return Math.abs(got(110) - want) < 1e-9 ? true : 'alpha should be 2/(period+1) = 0.2 for period 9';
            }, name: 'alpha is 2/(period+1)' }
        ] } },
      { id: 'e3', title: 'makeCrossoverSignal()', difficulty: 'Boss · final',
        prompt: 'Combine two EMAs into a signal generator.<br>' +
          'Write <code>makeCrossoverSignal(fastPeriod, slowPeriod)</code> returning a function that takes a price and returns:<ul>' +
          '<li><code>"long"</code> on the bar where the fast EMA crosses from at-or-below the slow EMA to <em>above</em> it</li>' +
          '<li><code>"short"</code> on the bar where it crosses from at-or-above to <em>below</em></li>' +
          '<li><code>null</code> on every other bar, including the first</li></ul>' +
          '<span class="muted">A cross is a change in the sign of (fast − slow) between consecutive bars, so you need the previous relationship as well as the current one.</span>',
        starter: 'function makeEMA(period) {\n  const alpha = 2 / (period + 1);\n  let prev = null;\n  return price => {\n    prev = prev === null ? price : alpha * price + (1 - alpha) * prev;\n    return prev;\n  };\n}\n\nfunction makeCrossoverSignal(fastPeriod, slowPeriod) {\n  // return the signal function\n}\n',
        solution: 'function makeEMA(period) {\n  const alpha = 2 / (period + 1);\n  let prev = null;\n  return price => {\n    prev = prev === null ? price : alpha * price + (1 - alpha) * prev;\n    return prev;\n  };\n}\n\nfunction makeCrossoverSignal(fastPeriod, slowPeriod) {\n  const fast = makeEMA(fastPeriod);\n  const slow = makeEMA(slowPeriod);\n  let wasAbove = null;\n  return price => {\n    const f = fast(price), s = slow(price);\n    const isAbove = f > s;\n    const signal = wasAbove === null ? null\n      : (isAbove && !wasAbove) ? "long"\n      : (!isAbove && wasAbove) ? "short"\n      : null;\n    wasAbove = isAbove;\n    return signal;\n  };\n}',
        hints: ['Create both EMAs inside the factory so each signal generator owns its own pair.',
                'Track a boolean <code>wasAbove</code>; a signal fires only when it flips.',
                'On the very first bar <code>wasAbove</code> is unknown, so return <code>null</code> and just record the state.'],
        tests: { fn: 'makeCrossoverSignal', cases: [
          { args: [2, 5], check: function (got) {
              if (typeof got !== 'function') return 'expected a function';
              if (got(100) !== null) return 'the first bar can never be a cross — return null';
              return true;
            }, name: 'the first bar returns null' },
          { args: [2, 10], check: function (got) {
              // both EMAs seed at the same price, then a sharp rally must produce a long cross
              got(100);
              var seen = [];
              [101, 105, 115, 130].forEach(function (p) { seen.push(got(p)); });
              return seen.indexOf('long') >= 0 ? true : 'a sustained rally should produce a "long" cross, got ' + JSON.stringify(seen);
            }, name: 'a rally produces a long signal' },
          { args: [2, 10], check: function (got) {
              got(100);
              [99, 95, 85, 70].forEach(function (p) { got(p); });
              var down = [];
              got(60); down.push('x');
              return true;
            }, name: 'a sell-off runs without error' },
          { args: [2, 10], check: function (got) {
              got(100);
              var signals = [101, 105, 115, 130, 128, 110, 90, 70, 60].map(function (p) { return got(p); });
              var fired = signals.filter(function (s) { return s !== null; });
              if (fired.indexOf('long') < 0) return 'expected a long cross on the way up';
              if (fired.indexOf('short') < 0) return 'expected a short cross on the way down';
              var longs = signals.filter(function (s) { return s === 'long'; }).length;
              return longs === 1 ? true : 'a single sustained rally should fire "long" once, not ' + longs + ' times';
            }, name: 'fires once per cross, in both directions' }
        ] } }
    ],
    quiz: [
      { q: 'Why should a streaming SMA return <code>null</code> before its window is full?',
        options: ['To save memory', 'A partial average is not the indicator, and treating it as one fabricates early signals', 'Because null is faster', 'It should return 0 instead'],
        answer: 1,
        explain: 'Every backtest starts with a warm-up period. Emitting a "20-period SMA" computed from 3 bars invents signals that never existed.' },
      { q: 'What is α for a 9-period EMA?',
        options: ['<code>1/9</code>', '<code>2/9</code>', '<code>2/10 = 0.2</code>', '<code>9/2</code>'],
        answer: 2,
        explain: 'α = 2/(period + 1). Higher α means more weight on the newest price and a faster, noisier line.' },
      { q: 'How much state does a streaming EMA need?',
        options: ['The whole price history', 'The last <code>period</code> prices', 'One number — the previous EMA', 'Two numbers'],
        answer: 2,
        explain: 'That is the EMA\'s practical advantage: constant memory and one multiply-add per bar, at any period.' }
    ],
    recap: [
      'A factory captures configuration and state, and returns the update function.',
      'A streaming SMA keeps a buffer; a streaming EMA keeps one number.',
      'Return <code>null</code> during the warm-up rather than a partial value.',
      'A crossover needs the previous relationship as well as the current one.'
    ],
    vocab: [
      { term: 'Crossover', def: 'The bar on which a fast average moves through a slow one. The oldest systematic signal there is, and still the basis of most trend systems.' },
      { term: 'Warm-up period', def: 'The bars at the start of a series where an indicator has insufficient history to be valid.' }
    ]
  });

  C.push({
    id: 'd031', day: 31, module: 3, minutes: 30,
    title: 'Higher-Order Functions',
    subtitle: 'Functions that take and return other functions.',
    goal: '<b>Goal:</b> parameterise behaviour, not just values — build a filter you can configure at runtime.',
    objectives: [
      'Pass functions as arguments',
      'Return functions to build configured helpers',
      'Write your own <code>map</code>-like utility',
      'Use predicate factories to build reusable rules'
    ],
    sections: [
      { h: 'Functions are values',
        body: '<p>You have been passing functions to <code>map</code> and <code>filter</code> since day 15. Nothing stops you from writing functions that accept them too.</p>',
        code: 'function applyToAll(values, fn) {\n  const out = [];\n  for (const v of values) out.push(fn(v));\n  return out;\n}\n\nconsole.log(applyToAll([1, 2, 3], x => x * 50));\nconsole.log(applyToAll(["es", "nq"], s => s.toUpperCase()));' },
      { h: 'Predicate factories',
        body: '<p>Instead of writing five nearly identical filters, write one function that <em>builds</em> them. The configuration is captured in a closure.</p>',
        code: 'const above = level => bar => bar.close > level;\nconst below = level => bar => bar.close < level;\n\nconsole.log(bars.filter(above(5230)).length, "bars above 5230");\nconsole.log(bars.filter(below(5210)).length, "bars below 5210");' },
      { h: 'Combining predicates',
        body: '<p>Because predicates are just functions, you can write combinators over them — <code>and</code>, <code>or</code>, <code>not</code> — and build complex entry filters out of small named pieces.</p>',
        code: 'const and = (...fns) => x => fns.every(f => f(x));\nconst or  = (...fns) => x => fns.some(f => f(x));\nconst not = fn => x => !fn(x);\n\nconst isGreen = b => b.close > b.open;\nconst isWide  = b => b.high - b.low > 2;\nconst isHeavy = b => b.volume > 2000;\n\nconst setup = and(isGreen, isWide, isHeavy);\nconsole.log(bars.filter(setup).length, "qualifying bars");\nconsole.log(bars.filter(not(isGreen)).length, "non-green bars");' },
      { h: 'Why this beats a pile of flags',
        body: '<div class="note note-tip"><b>Compare the alternatives</b>A function with <code>(useTrend, useVolume, useVolatility)</code> boolean parameters grows a new branch every time a rule is added, and every combination has to be tested. Composing small named predicates means each piece is tested once and the combinations are free.</div>' }
    ],
    parsons: {
      prompt: 'Build a configurable "above this level" predicate.',
      lines: [
        'const above = level => bar => bar.close > level;',
        'const above5230 = above(5230);',
        'const hits = bars.filter(above5230);',
        'console.log(hits.length);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'applyToAll()', difficulty: 'Core',
        prompt: 'Write <code>applyToAll(values, fn)</code> returning a new array with <code>fn</code> applied to each element.<br>' +
          'Implement it yourself with a loop — do not call <code>.map</code>.',
        starter: 'function applyToAll(values, fn) {\n  // your own map\n}\n',
        solution: 'function applyToAll(values, fn) {\n  const out = [];\n  for (const v of values) out.push(fn(v));\n  return out;\n}',
        hints: ['Build an empty array, loop, push the result of calling <code>fn</code>.',
                '<code>fn</code> is just a variable holding a function — call it with <code>fn(v)</code>.'],
        tests: { fn: 'applyToAll', cases: [
          { args: [[1, 2, 3], function (x) { return x * 2; }], expect: [2, 4, 6] },
          { args: [[], function (x) { return x; }], expect: [] },
          { args: [['a'], function (s) { return s.toUpperCase(); }], expect: ['A'] }
        ], source: [{ name: 'does not use the built-in .map', pattern: /\.map\s*\(/, forbid: true,
          why: 'write the loop yourself this time' }] } },
      { id: 'e2', title: 'makeRangeFilter()', difficulty: 'Core',
        prompt: 'Write <code>makeRangeFilter(min, max)</code> returning a predicate that takes a bar and answers whether its <code>close</code> is between <code>min</code> and <code>max</code>, inclusive at both ends.',
        starter: 'function makeRangeFilter(min, max) {\n  // return a predicate over bars\n}\n',
        solution: 'function makeRangeFilter(min, max) {\n  return bar => bar.close >= min && bar.close <= max;\n}',
        hints: ['The outer function captures <code>min</code> and <code>max</code>; the inner one takes the bar.',
                'Inclusive bounds means <code>&gt;=</code> and <code>&lt;=</code>.'],
        tests: { fn: 'makeRangeFilter', cases: [
          { args: [5200, 5250], check: function (f) {
              if (typeof f !== 'function') return 'expected a predicate function';
              if (f({ close: 5220 }) !== true) return 'a close inside the range should pass';
              if (f({ close: 5100 }) !== false) return 'a close below the range should fail';
              if (f({ close: 5300 }) !== false) return 'a close above the range should fail';
              if (f({ close: 5200 }) !== true) return 'the lower bound is inclusive';
              if (f({ close: 5250 }) !== true) return 'the upper bound is inclusive';
              return true;
            }, name: 'filters inclusively between min and max' }
        ], checks: [{
          name: 'works as a filter predicate', expose: ['makeRangeFilter'],
          run: function (s) {
            var f = s.makeRangeFilter(0, 10);
            var out = [{ close: 5 }, { close: 50 }].filter(f);
            return out.length === 1 ? true : 'expected 1 bar to pass, got ' + out.length;
          }
        }] } },
      { id: 'e3', title: 'and() / or() / not()', difficulty: 'Stretch',
        prompt: 'Write three combinators over predicates:<ul>' +
          '<li><code>and(...fns)</code> — a predicate true when every one is true</li>' +
          '<li><code>or(...fns)</code> — true when at least one is true</li>' +
          '<li><code>not(fn)</code> — the inverse of one predicate</li></ul>' +
          '<code>and()</code> with no arguments should be true; <code>or()</code> with none should be false.',
        expose: ['and', 'or', 'not'],
        starter: 'function and(...fns) {\n  // true when all pass\n}\n\nfunction or(...fns) {\n  // true when any passes\n}\n\nfunction not(fn) {\n  // the inverse\n}\n',
        solution: 'function and(...fns) {\n  return x => fns.every(f => f(x));\n}\n\nfunction or(...fns) {\n  return x => fns.some(f => f(x));\n}\n\nfunction not(fn) {\n  return x => !fn(x);\n}',
        hints: ['Each returns a new function taking the value to test.',
                '<code>every</code> and <code>some</code> already give you the empty-case behaviour for free.'],
        tests: { checks: [
          { name: 'and() requires every predicate to pass', expose: ['and'],
            run: function (s) {
              var p = s.and(function (x) { return x > 0; }, function (x) { return x < 10; });
              if (p(5) !== true) return '5 should pass both';
              if (p(-1) !== false) return '-1 should fail the first';
              if (p(50) !== false) return '50 should fail the second';
              return true;
            } },
          { name: 'or() needs only one to pass', expose: ['or'],
            run: function (s) {
              var p = s.or(function (x) { return x < 0; }, function (x) { return x > 10; });
              if (p(-5) !== true) return '-5 should pass the first';
              if (p(50) !== true) return '50 should pass the second';
              if (p(5) !== false) return '5 passes neither';
              return true;
            } },
          { name: 'not() inverts', expose: ['not'],
            run: function (s) {
              var p = s.not(function (x) { return x > 0; });
              return (p(5) === false && p(-5) === true) ? true : 'not() did not invert the predicate';
            } },
          { name: 'and() with no predicates is true, or() with none is false', expose: ['and', 'or'],
            run: function (s) {
              if (s.and()(1) !== true) return 'and() with no arguments should be true';
              if (s.or()(1) !== false) return 'or() with no arguments should be false';
              return true;
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is a higher-order function?',
        options: ['A function with many parameters', 'One that takes or returns another function', 'A recursive function', 'A function on a class'],
        answer: 1,
        explain: '<code>map</code>, <code>filter</code> and every factory you have written are higher-order functions.' },
      { q: 'What does <code>const above = level => bar => bar.close > level</code> return when called?',
        options: ['A boolean', 'A function expecting a bar', 'A number', 'An array'],
        answer: 1,
        explain: 'The outer arrow returns the inner arrow. <code>above(5230)</code> is a configured predicate you can hand to <code>filter</code>.' },
      { q: 'Why compose small predicates instead of adding boolean flags to one function?',
        options: ['It is faster', 'Each piece is tested once and combinations come free, instead of a branch per flag', 'Flags are not allowed', 'It uses less memory'],
        answer: 1,
        explain: 'Flag-driven functions grow combinatorially in branches; composed predicates grow linearly in pieces.' }
    ],
    recap: [
      'Functions are values — pass them and return them freely.',
      'A factory returns a configured function with its settings captured.',
      'Combinators like <code>and</code>/<code>or</code>/<code>not</code> build complex rules from small ones.',
      'Composition beats boolean flags for anything that grows.'
    ],
    vocab: [
      { term: 'Predicate', def: 'A function returning true or false. Entry rules, filters and validations are all predicates.' }
    ]
  });

  C.push({
    id: 'd032', day: 32, module: 3, minutes: 30,
    title: 'Composition and Currying',
    subtitle: 'Building pipelines out of single-purpose functions.',
    goal: '<b>Goal:</b> assemble a data-cleaning pipeline from small functions, with no intermediate variables.',
    objectives: [
      'Compose functions with <code>pipe</code> and <code>compose</code>',
      'Curry a function to fix its early arguments',
      'Understand why argument order matters for currying',
      'Recognise when composition hurts readability'
    ],
    sections: [
      { h: 'pipe: left to right',
        body: '<p><code>pipe(f, g, h)(x)</code> means <code>h(g(f(x)))</code> — reading in the order the data flows. It is <code>reduce</code> over an array of functions.</p>',
        code: 'const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);\n\nconst trim = s => s.trim();\nconst upper = s => s.toUpperCase();\nconst tag = s => `[${s}]`;\n\nconst clean = pipe(trim, upper, tag);\nconsole.log(clean("  es  "));' },
      { h: 'compose: right to left',
        body: '<p><code>compose</code> is the same thing in mathematical order. Pick one convention per codebase; mixing them is a reliable source of confusion.</p>',
        code: 'const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);\n\nconst double = n => n * 2;\nconst addTen = n => n + 10;\n\nconsole.log(compose(double, addTen)(5));  // double(addTen(5)) = 30\nconsole.log(((...fns) => x => fns.reduce((v, f) => f(v), x))(double, addTen)(5)); // 20' },
      { h: 'Currying fixes arguments one at a time',
        body: '<p>A curried function takes its arguments in stages. That lets you pre-configure the parts you know and hand the result to <code>map</code> or <code>pipe</code>, which only ever supply one argument.</p>',
        code: 'const scaleBy = factor => value => value * factor;\nconst toEsDollars = scaleBy(50);\nconsole.log([1, 2.5, -0.75].map(toEsDollars));\n\nconst clamp = min => max => v => Math.min(max, Math.max(min, v));\nconst clampRsi = clamp(0)(100);\nconsole.log(clampRsi(140), clampRsi(-20), clampRsi(55));' },
      { h: 'Argument order matters',
        body: '<p>For currying to be useful the <em>configuration</em> must come first and the <em>data</em> last. <code>scaleBy(factor)(value)</code> is useful; <code>scaleBy(value)(factor)</code> is not.</p>' +
              '<div class="note note-warn"><b>Do not overdo it</b>A three-stage curry with cryptic names is harder to read than a plain function with three parameters. Reach for it when you are genuinely feeding <code>map</code> or <code>pipe</code>, not to prove a point.</div>' }
    ],
    parsons: {
      prompt: 'Build a pipe and use it to clean a symbol.',
      lines: [
        'const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);',
        'const trim = s => s.trim();',
        'const upper = s => s.toUpperCase();',
        'const clean = pipe(trim, upper);',
        'console.log(clean("  es  "));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'pipe()', difficulty: 'Core',
        prompt: 'Write <code>pipe(...fns)</code> returning a function that applies each function left to right.<br>' +
          '<code>pipe(a, b, c)(x)</code> equals <code>c(b(a(x)))</code>. With no functions, it should return its input unchanged.',
        starter: 'function pipe(...fns) {\n  // left-to-right composition\n}\n',
        solution: 'function pipe(...fns) {\n  return x => fns.reduce((v, f) => f(v), x);\n}',
        hints: ['<code>reduce</code> over the functions with the value as the accumulator.',
                'The seed is the input <code>x</code>, so an empty list returns it untouched.'],
        tests: { fn: 'pipe', cases: [
          { args: [function (n) { return n + 1; }, function (n) { return n * 2; }],
            check: function (f) { return f(5) === 12 ? true : 'expected (5+1)*2 = 12, got ' + f(5); },
            name: 'applies left to right' },
          { args: [], check: function (f) { return f(9) === 9 ? true : 'with no functions it should return the input'; },
            name: 'empty pipe is the identity' },
          { args: [function (s) { return s.trim(); }, function (s) { return s.toUpperCase(); }],
            check: function (f) { return f('  es  ') === 'ES' ? true : 'got ' + JSON.stringify(f('  es  ')); },
            name: 'works on strings' }
        ] } },
      { id: 'e2', title: 'curried scaleBy()', difficulty: 'Core',
        prompt: 'Write <code>scaleBy(factor)</code> returning a function that multiplies its argument by <code>factor</code>.<br>' +
          'It must work directly as a <code>map</code> callback: <code>points.map(scaleBy(50))</code>.',
        starter: 'function scaleBy(factor) {\n  // return a function that multiplies by factor\n}\n',
        solution: 'function scaleBy(factor) {\n  return value => value * factor;\n}',
        hints: ['Configuration first, data last — that is what makes it usable with <code>map</code>.',
                'The inner function takes exactly one argument.'],
        tests: { fn: 'scaleBy', cases: [
          { args: [50], check: function (f) {
              if (typeof f !== 'function') return 'expected a function';
              return f(2.5) === 125 ? true : 'expected 125, got ' + f(2.5);
            }, name: 'scaleBy(50)(2.5) is 125' }
        ], checks: [{
          name: 'works directly as a map callback', expose: ['scaleBy'],
          run: function (s, h) {
            var out = [1, 2.5, -0.75].map(s.scaleBy(50));
            return h.eq(out, [50, 125, -37.5], 1e-9) ? true : 'got ' + JSON.stringify(out);
          }
        }] } },
      { id: 'e3', title: 'cleanSeries()', difficulty: 'Stretch',
        prompt: 'Build a cleaning pipeline. Write <code>cleanSeries(series)</code> that, using your own <code>pipe</code>, applies these steps in order:<ol>' +
          '<li>drop anything that is not a finite number</li>' +
          '<li>round each value to 2 decimals (still a number)</li>' +
          '<li>drop any value that is <code>&lt;= 0</code></li></ol>' +
          '<code>cleanSeries([5240.256, NaN, -3, "x", 10.1119])</code> → <code>[5240.26, 10.11]</code>',
        starter: 'const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);\n\nfunction cleanSeries(series) {\n  // compose the three steps\n}\n',
        solution: 'const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);\n\nfunction cleanSeries(series) {\n  return pipe(\n    a => a.filter(v => typeof v === "number" && Number.isFinite(v)),\n    a => a.map(v => Math.round(v * 100) / 100),\n    a => a.filter(v => v > 0)\n  )(series);\n}',
        hints: ['Each stage takes an array and returns an array.',
                '<code>Number.isFinite</code> rejects <code>NaN</code>, both infinities and non-numbers when combined with a <code>typeof</code> check.',
                'Round before the positivity filter so the order matches the specification.'],
        tests: { fn: 'cleanSeries', approx: 1e-9, cases: [
          { args: [[5240.256, NaN, -3, 'x', 10.1119]], expect: [5240.26, 10.11] },
          { args: [[1, 2, 3]], expect: [1, 2, 3] },
          { args: [[Infinity, -Infinity, null, undefined]], expect: [] },
          { args: [[]], expect: [] },
          { args: [[0, 0.004]], expect: [], name: '0 and values rounding to 0 are dropped' }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>pipe(f, g)(x)</code> evaluate to?',
        options: ['<code>f(g(x))</code>', '<code>g(f(x))</code>', '<code>f(x) + g(x)</code>', '<code>[f(x), g(x)]</code>'],
        answer: 1,
        explain: 'Pipe runs left to right, so <code>f</code> first. <code>compose</code> is the right-to-left version.' },
      { q: 'For currying to be useful, which argument should come last?',
        options: ['The configuration', 'The data being operated on', 'It does not matter', 'The callback'],
        answer: 1,
        explain: 'Config first, data last — that shape is what lets the partially applied function slot into <code>map</code> or <code>pipe</code>.' },
      { q: 'When does composition make code worse?',
        options: ['Never', 'When the pieces are cryptic and the reader must unwind several layers to see what happens', 'When there are more than two functions', 'On arrays'],
        answer: 1,
        explain: 'Composition is a readability tool. If it is not making the code read better, a plain function is the right answer.' }
    ],
    recap: [
      '<code>pipe</code> runs left to right; <code>compose</code> right to left.',
      'Both are one-line <code>reduce</code> implementations.',
      'Currying takes arguments in stages: configuration first, data last.',
      'Use composition where it clarifies, not to be clever.'
    ],
    vocab: [
      { term: 'Data cleaning', def: 'Removing bad ticks, gaps and duplicates before analysis. Real feeds contain all three, and none of them announce themselves.' }
    ]
  });

  C.push({
    id: 'd033', day: 33, module: 3, minutes: 30,
    title: 'this, Arrow Functions and Binding',
    subtitle: 'The one JavaScript feature that surprises everybody.',
    goal: '<b>Goal:</b> know which <code>this</code> a function will see, and pick the right function form on purpose.',
    objectives: [
      'Explain how <code>this</code> is determined at call time',
      'Contrast regular functions with arrow functions',
      'Fix a lost <code>this</code> with an arrow or <code>bind</code>',
      'Choose the right form for callbacks and methods'
    ],
    sections: [
      { h: 'this depends on how a function is called',
        body: '<p>For a regular function, <code>this</code> is decided at the <em>call site</em>, not where the function was written. Called as <code>obj.method()</code>, <code>this</code> is <code>obj</code>. Called bare, it is <code>undefined</code> in strict mode.</p>',
        code: 'const account = {\n  balance: 50000,\n  show() { return this.balance; }\n};\n\nconsole.log(account.show());     // 50000\n\nconst loose = account.show;      // detached from the object\ntry { console.log(loose()); } catch (e) { console.log("Detached:", e.message); }' },
      { h: 'Arrow functions have no this of their own',
        body: '<p>An arrow inherits <code>this</code> from the scope where it was <em>written</em>. That is exactly what you want for a callback inside a method, and exactly what you do not want for the method itself.</p>',
        code: 'const tracker = {\n  symbol: "ES",\n  prices: [5240, 5245, 5250],\n\n  labelsBroken() {\n    return this.prices.map(function (p) {\n      return this.symbol + " " + p;   // `this` is lost here\n    });\n  },\n\n  labelsFixed() {\n    return this.prices.map(p => `${this.symbol} ${p}`);  // arrow keeps it\n  }\n};\n\ntry { console.log(tracker.labelsBroken()); } catch (e) { console.log("Broken:", e.message); }\nconsole.log(tracker.labelsFixed());' },
      { h: 'bind, call and apply',
        body: '<p><code>bind</code> returns a new function with <code>this</code> permanently fixed. <code>call</code> and <code>apply</code> invoke immediately with a chosen <code>this</code>. Since arrow functions arrived, <code>bind</code> is mostly used to pass a method as a callback.</p>',
        code: 'const risk = {\n  maxLoss: 500,\n  check(loss) { return loss <= this.maxLoss; }\n};\n\nconst check = risk.check.bind(risk);\nconsole.log([100, 900].map(check));\n\nconsole.log(risk.check.call({ maxLoss: 1000 }, 900));' },
      { h: 'When to use which',
        body: '<table><tr><th>Situation</th><th>Use</th></tr>' +
              '<tr><td>Object method that needs <code>this</code></td><td>regular function / method shorthand</td></tr>' +
              '<tr><td>Callback inside a method</td><td>arrow</td></tr>' +
              '<tr><td>Short pure helper</td><td>arrow</td></tr>' +
              '<tr><td>Passing a method as a callback</td><td><code>bind</code>, or wrap in an arrow</td></tr></table>' +
              '<div class="note note-warn"><b>Never an arrow for a method that uses this</b><code>{ show: () => this.balance }</code> captures the surrounding scope, not the object — and reads <code>undefined</code> forever.</div>' }
    ],
    parsons: {
      prompt: 'Fix a lost `this` inside a map callback.',
      lines: [
        'const tracker = {',
        '  symbol: "ES",',
        '  prices: [5240, 5245],',
        '  labels() {',
        '    return this.prices.map(p => `${this.symbol} ${p}`);',
        '  }',
        '};',
        'console.log(tracker.labels());'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Fix the labels', difficulty: 'Core',
        prompt: 'The <code>labels()</code> method below throws because <code>this</code> is lost inside the callback.<br>' +
          'Fix it so <code>tracker.labels()</code> returns <code>["ES 5240", "ES 5245", "ES 5250"]</code>. Do not change the data.',
        starter: 'const tracker = {\n  symbol: "ES",\n  prices: [5240, 5245, 5250],\n  labels() {\n    return this.prices.map(function (p) {\n      return this.symbol + " " + p;\n    });\n  }\n};\n',
        solution: 'const tracker = {\n  symbol: "ES",\n  prices: [5240, 5245, 5250],\n  labels() {\n    return this.prices.map(p => `${this.symbol} ${p}`);\n  }\n};',
        hints: ['An arrow function inherits <code>this</code> from where it is written — here, from inside the method.',
                'Replace <code>function (p) { ... }</code> with <code>p =&gt; ...</code>.'],
        tests: { checks: [
          { name: 'tracker.labels() returns the three labels', expose: ['tracker'],
            run: function (s, h) {
              var out;
              try { out = s.tracker.labels(); } catch (e) { return 'labels() threw: ' + e.message; }
              return h.eq(out, ['ES 5240', 'ES 5245', 'ES 5250']) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'labels is still a method on the object', expose: ['tracker'],
            run: function (s) {
              return typeof s.tracker.labels === 'function' ? true : 'tracker.labels should still be a function';
            } }
        ] } },
      { id: 'e2', title: 'makeRiskChecker()', difficulty: 'Core',
        prompt: 'Write <code>makeRiskChecker(limits)</code> returning a function that can be passed straight to <code>map</code> and still see its limits.<br>' +
          'It takes a loss amount and returns <code>true</code> when the loss is within <code>limits.maxLoss</code> (inclusive).<br>' +
          'The returned function must work when detached from any object.',
        starter: 'function makeRiskChecker(limits) {\n  // return a standalone checker\n}\n',
        solution: 'function makeRiskChecker(limits) {\n  return loss => loss <= limits.maxLoss;\n}',
        hints: ['A closure sidesteps <code>this</code> entirely — capture <code>limits</code> instead.',
                'No <code>this</code>, no binding problem.'],
        tests: { fn: 'makeRiskChecker', cases: [
          { args: [{ maxLoss: 500 }], check: function (f) {
              if (typeof f !== 'function') return 'expected a function';
              if (f(100) !== true) return '100 is within a 500 limit';
              if (f(900) !== false) return '900 exceeds a 500 limit';
              if (f(500) !== true) return 'the limit itself is inclusive';
              return true;
            }, name: 'checks against the captured limit' }
        ], checks: [{
          name: 'still works when passed detached to map', expose: ['makeRiskChecker'],
          run: function (s, h) {
            var f = s.makeRiskChecker({ maxLoss: 500 });
            var out = [100, 900, 500].map(f);
            return h.eq(out, [true, false, true]) ? true : 'got ' + JSON.stringify(out);
          }
        }] } },
      { id: 'e3', title: 'bindAll()', difficulty: 'Stretch',
        prompt: 'Write <code>bindAll(obj, names)</code> which, for each method name in <code>names</code>, replaces that method on <code>obj</code> with a version permanently bound to <code>obj</code>. Return <code>obj</code>.<br>' +
          'After calling it, <code>const f = obj.method; f()</code> must still work.',
        starter: 'function bindAll(obj, names) {\n  // bind each named method to obj, return obj\n}\n',
        solution: 'function bindAll(obj, names) {\n  for (const n of names) obj[n] = obj[n].bind(obj);\n  return obj;\n}',
        hints: ['<code>fn.bind(obj)</code> returns a new function with <code>this</code> fixed.',
                'Assign the bound version back onto the object under the same key.'],
        tests: { fn: 'bindAll', cases: [
          { args: [{ v: 7, get: function () { return this.v; } }, ['get']],
            check: function (obj) {
              var detached = obj.get;
              var got;
              try { got = detached(); } catch (e) { return 'the detached method still threw: ' + e.message; }
              return got === 7 ? true : 'expected 7, got ' + got;
            }, name: 'a detached bound method still sees its object' },
          { args: [{ a: 1, b: 2, getA: function () { return this.a; }, getB: function () { return this.b; } }, ['getA', 'getB']],
            check: function (obj) {
              var x = obj.getA, y = obj.getB;
              return (x() === 1 && y() === 2) ? true : 'both named methods should be bound';
            }, name: 'binds every name given' },
          { args: [{ v: 1, get: function () { return this.v; } }, []],
            check: function (obj) { return obj.v === 1 ? true : 'the object should be returned'; },
            name: 'an empty name list returns the object unchanged' }
        ] } }
    ],
    quiz: [
      { q: 'What determines <code>this</code> inside a regular function?',
        options: ['Where it was defined', 'How it is called', 'Its parameter list', 'The file it is in'],
        answer: 1,
        explain: 'The call site decides. <code>obj.fn()</code> gives <code>obj</code>; a bare <code>fn()</code> gives <code>undefined</code> in strict mode.' },
      { q: 'What <code>this</code> does an arrow function use?',
        options: ['Its own', 'The one from the scope where it was written', '<code>globalThis</code>', '<code>undefined</code> always'],
        answer: 1,
        explain: 'Arrows have no <code>this</code> binding, so the lookup continues outward lexically. That is why they fix callbacks and break methods.' },
      { q: 'Why is <code>{ show: () => this.balance }</code> wrong as an object method?',
        options: ['Arrows cannot return', 'The arrow captures the surrounding scope, not the object', 'It needs a semicolon', 'It is too slow'],
        answer: 1,
        explain: 'There is no <code>this</code> binding to inherit from the object literal, so it reads whatever the enclosing scope had — usually undefined.' }
    ],
    recap: [
      'Regular functions get <code>this</code> from the call site.',
      'Arrow functions inherit <code>this</code> lexically.',
      'Arrows for callbacks; regular functions for methods.',
      '<code>bind</code> fixes <code>this</code> permanently when passing a method around.'
    ],
    vocab: [
      { term: 'Callback', def: 'A function handed to something else to be called later — on each element, on each tick, when a request completes.' }
    ]
  });


  C.push({
    id: 'd034', day: 34, module: 3, minutes: 30,
    title: 'Classes: Modelling a Position',
    subtitle: 'Constructors, methods and instances.',
    goal: '<b>Goal:</b> model an open position as a class that knows how to mark itself to market.',
    objectives: [
      'Define a class with a constructor and methods',
      'Create instances with <code>new</code>',
      'Understand what <code>this</code> refers to inside a class',
      'Decide between a class and a plain object with functions'
    ],
    sections: [
      { h: 'A class is a template for objects',
        body: '<p>The constructor runs on <code>new</code> and sets up the instance. Methods are shared by every instance rather than copied into each one.</p>',
        code: 'class Position {\n  constructor(symbol, side, entry, qty) {\n    this.symbol = symbol;\n    this.side = side;\n    this.entry = entry;\n    this.qty = qty;\n  }\n\n  points(price) {\n    return this.side === "long" ? price - this.entry : this.entry - price;\n  }\n\n  toString() {\n    return `${this.side.toUpperCase()} ${this.qty} ${this.symbol} @ ${this.entry}`;\n  }\n}\n\nconst p = new Position("ES", "long", 5240.25, 2);\nconsole.log(p.toString());\nconsole.log("Points at 5252.75:", p.points(5252.75));' },
      { h: 'Instances are independent',
        body: '<p>Each <code>new</code> produces a separate object with its own fields, but they share one copy of the methods.</p>',
        code: 'class Counter {\n  constructor() { this.n = 0; }\n  tick() { return ++this.n; }\n}\n\nconst a = new Counter(), b = new Counter();\na.tick(); a.tick();\nconsole.log(a.n, b.n);\nconsole.log(a.tick === b.tick);   // true — one shared method' },
      { h: 'Methods can call methods',
        body: '<p>Inside any method, <code>this</code> is the instance, so methods compose naturally.</p>',
        code: 'class Position {\n  constructor(symbol, side, entry, qty, pointValue = 50) {\n    Object.assign(this, { symbol, side, entry, qty, pointValue });\n  }\n  points(price) {\n    return this.side === "long" ? price - this.entry : this.entry - price;\n  }\n  pnl(price) {\n    return this.points(price) * this.qty * this.pointValue;\n  }\n  isWinning(price) {\n    return this.pnl(price) > 0;\n  }\n}\n\nconst p = new Position("ES", "short", 5250, 1);\nconsole.log(p.pnl(5240), p.isWinning(5240));' },
      { h: 'Class or plain object?',
        body: '<div class="note note-tip"><b>A useful rule</b>Use a class when you have <em>many</em> instances of the same shape that each carry mutable state and behaviour — positions, orders, indicators. Use plain objects and functions for data you only read, and for one-off configuration. A class with no state and one method should have been a function.</div>' }
    ],
    parsons: {
      prompt: 'Define a minimal Position class and use it.',
      lines: [
        'class Position {',
        '  constructor(symbol, entry, qty) {',
        '    this.symbol = symbol;',
        '    this.entry = entry;',
        '    this.qty = qty;',
        '  }',
        '  points(price) { return price - this.entry; }',
        '}',
        'const p = new Position("ES", 5240, 2);',
        'console.log(p.points(5250));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'class Position', difficulty: 'Core',
        prompt: 'Define a class <code>Position</code> with a constructor taking <code>(symbol, side, entry, qty, pointValue)</code> — <code>pointValue</code> defaulting to <code>50</code> — storing each as a field of the same name.<br>' +
          'Add two methods:<ul>' +
          '<li><code>points(price)</code> — <code>price - entry</code> for a long, <code>entry - price</code> for a short</li>' +
          '<li><code>pnl(price)</code> — points × qty × pointValue</li></ul>',
        expose: ['Position'],
        starter: 'class Position {\n  constructor(symbol, side, entry, qty, pointValue = 50) {\n    // store the fields\n  }\n\n  points(price) {\n    // signed points\n  }\n\n  pnl(price) {\n    // dollars\n  }\n}\n',
        solution: 'class Position {\n  constructor(symbol, side, entry, qty, pointValue = 50) {\n    this.symbol = symbol;\n    this.side = side;\n    this.entry = entry;\n    this.qty = qty;\n    this.pointValue = pointValue;\n  }\n\n  points(price) {\n    return this.side === "long" ? price - this.entry : this.entry - price;\n  }\n\n  pnl(price) {\n    return this.points(price) * this.qty * this.pointValue;\n  }\n}',
        hints: ['Assign each parameter with <code>this.name = name;</code> in the constructor.',
                '<code>pnl</code> can call <code>this.points(price)</code> — methods compose.'],
        tests: { checks: [
          { name: 'a long position computes points and P&L', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('ES', 'long', 5240.25, 2);
              if (Math.abs(p.points(5252.75) - 12.5) > 1e-9) return 'points() gave ' + p.points(5252.75);
              if (Math.abs(p.pnl(5252.75) - 1250) > 1e-9) return 'pnl() gave ' + p.pnl(5252.75);
              return true;
            } },
          { name: 'a short position flips the sign', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('NQ', 'short', 18470, 1, 20);
              if (Math.abs(p.points(18401.5) - 68.5) > 1e-9) return 'points() gave ' + p.points(18401.5);
              if (Math.abs(p.pnl(18401.5) - 1370) > 1e-9) return 'pnl() gave ' + p.pnl(18401.5);
              return true;
            } },
          { name: 'pointValue defaults to 50', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('ES', 'long', 100, 1);
              return p.pointValue === 50 ? true : 'expected 50, got ' + p.pointValue;
            } },
          { name: 'fields are stored on the instance', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('CL', 'long', 78.4, 3, 1000);
              return (p.symbol === 'CL' && p.side === 'long' && p.entry === 78.4 && p.qty === 3)
                ? true : 'one or more fields were not stored under the expected name';
            } },
          { name: 'instances are independent', expose: ['Position'],
            run: function (s) {
              var a = new s.Position('ES', 'long', 100, 1);
              var b = new s.Position('NQ', 'short', 200, 2);
              return a.symbol === 'ES' && b.symbol === 'NQ' ? true : 'instances are sharing state';
            } }
        ] } },
      { id: 'e2', title: 'Add a stop', difficulty: 'Core',
        prompt: 'Extend <code>Position</code> with stop handling. Add to the constructor a sixth parameter <code>stop</code> (default <code>null</code>), and two methods:<ul>' +
          '<li><code>setStop(price)</code> — store it and return <code>this</code> so calls can chain</li>' +
          '<li><code>isStopped(price)</code> — <code>true</code> when a long\'s price is at or below the stop, or a short\'s is at or above it. Always <code>false</code> when no stop is set.</li></ul>',
        expose: ['Position'],
        starter: 'class Position {\n  constructor(symbol, side, entry, qty, pointValue = 50, stop = null) {\n    this.symbol = symbol;\n    this.side = side;\n    this.entry = entry;\n    this.qty = qty;\n    this.pointValue = pointValue;\n    this.stop = stop;\n  }\n\n  setStop(price) {\n    // store and return this\n  }\n\n  isStopped(price) {\n    // side-aware stop test\n  }\n}\n',
        solution: 'class Position {\n  constructor(symbol, side, entry, qty, pointValue = 50, stop = null) {\n    this.symbol = symbol;\n    this.side = side;\n    this.entry = entry;\n    this.qty = qty;\n    this.pointValue = pointValue;\n    this.stop = stop;\n  }\n\n  setStop(price) {\n    this.stop = price;\n    return this;\n  }\n\n  isStopped(price) {\n    if (this.stop === null) return false;\n    return this.side === "long" ? price <= this.stop : price >= this.stop;\n  }\n}',
        hints: ['Returning <code>this</code> from a setter is what makes <code>p.setStop(x).isStopped(y)</code> work.',
                'Guard <code>this.stop === null</code> first — no stop means never stopped.'],
        tests: { checks: [
          { name: 'setStop stores the level and returns the position', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('ES', 'long', 5240, 1);
              var r = p.setStop(5232);
              if (p.stop !== 5232) return 'the stop was not stored';
              return r === p ? true : 'setStop should return this so calls can chain';
            } },
          { name: 'a long stops out at or below the level', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('ES', 'long', 5240, 1).setStop(5232);
              if (p.isStopped(5231) !== true) return 'below the stop should be true';
              if (p.isStopped(5232) !== true) return 'exactly at the stop should be true';
              if (p.isStopped(5235) !== false) return 'above the stop should be false';
              return true;
            } },
          { name: 'a short stops out at or above the level', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('ES', 'short', 5240, 1).setStop(5248);
              if (p.isStopped(5250) !== true) return 'above the stop should be true';
              if (p.isStopped(5248) !== true) return 'exactly at the stop should be true';
              if (p.isStopped(5240) !== false) return 'below the stop should be false';
              return true;
            } },
          { name: 'no stop means never stopped', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('ES', 'long', 5240, 1);
              return p.isStopped(1) === false ? true : 'with stop null, isStopped should always be false';
            } }
        ] } },
      { id: 'e3', title: 'class Book', difficulty: 'Stretch',
        prompt: 'Define a class <code>Book</code> that holds several positions.<ul>' +
          '<li><code>constructor()</code> — starts empty</li>' +
          '<li><code>add(position)</code> — appends and returns <code>this</code></li>' +
          '<li><code>size()</code> — how many positions are held</li>' +
          '<li><code>totalPnl(prices)</code> — where <code>prices</code> is an object mapping symbol to price, the sum of every position\'s <code>pnl</code> at its symbol\'s price. Positions whose symbol has no price contribute 0.</li></ul>' +
          '<span class="muted">Each position has <code>symbol</code> and a <code>pnl(price)</code> method.</span>',
        expose: ['Book'],
        starter: 'class Book {\n  constructor() {\n    // start empty\n  }\n\n  add(position) {\n    // append, return this\n  }\n\n  size() {\n    // how many\n  }\n\n  totalPnl(prices) {\n    // sum of each position\'s pnl at its price\n  }\n}\n',
        solution: 'class Book {\n  constructor() {\n    this.positions = [];\n  }\n\n  add(position) {\n    this.positions.push(position);\n    return this;\n  }\n\n  size() {\n    return this.positions.length;\n  }\n\n  totalPnl(prices) {\n    return this.positions.reduce((acc, p) => {\n      const price = prices[p.symbol];\n      return acc + (price === undefined ? 0 : p.pnl(price));\n    }, 0);\n  }\n}',
        hints: ['Hold an array field in the constructor: <code>this.positions = []</code>.',
                'In <code>totalPnl</code>, look each symbol up in the <code>prices</code> object and skip missing ones.'],
        tests: { checks: [
          { name: 'starts empty and add() chains', expose: ['Book'],
            run: function (s) {
              var b = new s.Book();
              if (b.size() !== 0) return 'a new Book should have size 0';
              var r = b.add({ symbol: 'ES', pnl: function () { return 1; } });
              if (b.size() !== 1) return 'size should be 1 after one add';
              return r === b ? true : 'add() should return this';
            } },
          { name: 'totalPnl sums across positions', expose: ['Book'],
            run: function (s) {
              var b = new s.Book();
              b.add({ symbol: 'ES', pnl: function (p) { return p * 2; } });
              b.add({ symbol: 'NQ', pnl: function (p) { return p * 10; } });
              var got = b.totalPnl({ ES: 5, NQ: 3 });
              return got === 40 ? true : 'expected 40, got ' + got;
            } },
          { name: 'a position with no price contributes 0', expose: ['Book'],
            run: function (s) {
              var b = new s.Book();
              b.add({ symbol: 'ES', pnl: function (p) { return p; } });
              b.add({ symbol: 'ZZ', pnl: function () { throw new Error('should not be called'); } });
              var got;
              try { got = b.totalPnl({ ES: 7 }); } catch (e) { return 'pnl was called for a symbol with no price'; }
              return got === 7 ? true : 'expected 7, got ' + got;
            } },
          { name: 'an empty book totals 0', expose: ['Book'],
            run: function (s) {
              return new s.Book().totalPnl({}) === 0 ? true : 'an empty book should total 0';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does the <code>constructor</code> do?',
        options: ['Defines the methods', 'Runs on <code>new</code> to set up the instance', 'Returns the class', 'Nothing without <code>super</code>'],
        answer: 1,
        explain: 'It initialises the fresh object that <code>new</code> creates, which <code>this</code> refers to inside it.' },
      { q: 'Are methods copied onto every instance?',
        options: ['Yes', 'No — they live on the prototype and are shared', 'Only arrow methods', 'Only after binding'],
        answer: 1,
        explain: 'That is why <code>a.tick === b.tick</code> is true: fields are per-instance, methods are shared.' },
      { q: 'When is a plain object with functions the better choice than a class?',
        options: ['Always', 'When there is one instance, no mutable state, and nothing to inherit', 'When using JSON', 'Never'],
        answer: 1,
        explain: 'A class with no state and a single method is a function wearing a costume.' }
    ],
    recap: [
      '<code>constructor</code> runs on <code>new</code>; <code>this</code> is the new instance.',
      'Fields are per-instance; methods are shared.',
      'Returning <code>this</code> from a mutator enables chaining.',
      'Reach for a class when many instances carry state and behaviour.'
    ],
    vocab: [
      { term: 'Mark to market', def: 'Revaluing an open position at the current price to get its unrealised P&L.' }
    ]
  });

  C.push({
    id: 'd035', day: 35, module: 3, minutes: 30,
    title: 'Inheritance and Static Members',
    subtitle: 'extends, super, and utilities that belong to the class itself.',
    goal: '<b>Goal:</b> build a family of order types that share behaviour without duplicating it.',
    objectives: [
      'Extend a class and call <code>super</code>',
      'Override a method and still reuse the parent version',
      'Define static methods and properties',
      'Know when composition beats inheritance'
    ],
    sections: [
      { h: 'extends and super',
        body: '<p>A subclass inherits every field and method. <code>super(...)</code> in the constructor runs the parent constructor — and must be called before you touch <code>this</code>.</p>',
        code: 'class Order {\n  constructor(symbol, side, qty) {\n    this.symbol = symbol;\n    this.side = side;\n    this.qty = qty;\n  }\n  describe() { return `${this.side} ${this.qty} ${this.symbol}`; }\n}\n\nclass LimitOrder extends Order {\n  constructor(symbol, side, qty, limitPrice) {\n    super(symbol, side, qty);      // must come first\n    this.limitPrice = limitPrice;\n  }\n  describe() {\n    return `${super.describe()} @ limit ${this.limitPrice}`;\n  }\n}\n\nconsole.log(new Order("ES", "buy", 2).describe());\nconsole.log(new LimitOrder("ES", "buy", 2, 5240.25).describe());' },
      { h: 'Overriding and extending',
        body: '<p><code>super.method()</code> calls the parent version, so an override can add to the parent behaviour instead of replacing it.</p>',
        code: 'class MarketOrder extends Order {\n  wouldFill() { return true; }\n}\n\nclass StopOrder extends Order {\n  constructor(symbol, side, qty, stopPrice) {\n    super(symbol, side, qty);\n    this.stopPrice = stopPrice;\n  }\n  wouldFill(price) {\n    return this.side === "buy" ? price >= this.stopPrice : price <= this.stopPrice;\n  }\n}\n\nconst s = new StopOrder("ES", "buy", 1, 5250);\nconsole.log(s.wouldFill(5249), s.wouldFill(5251));' },
      { h: 'Static members belong to the class',
        body: '<p>A <code>static</code> method is called on the class, not an instance. Use them for factories, validators and constants — anything that is about the type rather than one object.</p>',
        code: 'class Order {\n  static nextId = 1;\n  static create(symbol, side, qty) {\n    const o = new Order(symbol, side, qty);\n    o.id = Order.nextId++;\n    return o;\n  }\n  constructor(symbol, side, qty) {\n    Object.assign(this, { symbol, side, qty });\n  }\n}\n\nconsole.log(Order.create("ES", "buy", 1).id);\nconsole.log(Order.create("NQ", "sell", 2).id);' },
      { h: 'Prefer composition when the hierarchy stops being an "is-a"',
        body: '<div class="note note-warn"><b>The classic trap</b>Deep inheritance trees model taxonomies, not behaviour. A <code>TrailingStopLimitOCOOrder</code> is not a natural subclass of anything. Once a type needs traits from two branches, switch to composing small objects and functions — the pattern you already built on day 31.</div>' }
    ],
    parsons: {
      prompt: 'Extend an Order into a LimitOrder.',
      lines: [
        'class Order {',
        '  constructor(symbol, qty) { this.symbol = symbol; this.qty = qty; }',
        '}',
        'class LimitOrder extends Order {',
        '  constructor(symbol, qty, price) {',
        '    super(symbol, qty);',
        '    this.price = price;',
        '  }',
        '}',
        'console.log(new LimitOrder("ES", 2, 5240).price);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'LimitOrder extends Order', difficulty: 'Core',
        prompt: 'Given the <code>Order</code> base class in the starter, define <code>LimitOrder</code> that:<ul>' +
          '<li>takes <code>(symbol, side, qty, limitPrice)</code> and stores the extra <code>limitPrice</code></li>' +
          '<li>overrides <code>describe()</code> to return the parent description followed by <code>" @ limit "</code> and the price</li></ul>' +
          '<code>new LimitOrder("ES","buy",2,5240.25).describe()</code> → <code>"buy 2 ES @ limit 5240.25"</code>',
        expose: ['Order', 'LimitOrder'],
        starter: 'class Order {\n  constructor(symbol, side, qty) {\n    this.symbol = symbol;\n    this.side = side;\n    this.qty = qty;\n  }\n  describe() { return `${this.side} ${this.qty} ${this.symbol}`; }\n}\n\nclass LimitOrder extends Order {\n  // constructor and describe override\n}\n',
        solution: 'class Order {\n  constructor(symbol, side, qty) {\n    this.symbol = symbol;\n    this.side = side;\n    this.qty = qty;\n  }\n  describe() { return `${this.side} ${this.qty} ${this.symbol}`; }\n}\n\nclass LimitOrder extends Order {\n  constructor(symbol, side, qty, limitPrice) {\n    super(symbol, side, qty);\n    this.limitPrice = limitPrice;\n  }\n  describe() {\n    return `${super.describe()} @ limit ${this.limitPrice}`;\n  }\n}',
        hints: ['Call <code>super(symbol, side, qty)</code> before assigning <code>this.limitPrice</code>.',
                'Reuse the parent text with <code>super.describe()</code> rather than rebuilding it.'],
        tests: { checks: [
          { name: 'describe() extends the parent description', expose: ['LimitOrder'],
            run: function (s) {
              var o = new s.LimitOrder('ES', 'buy', 2, 5240.25);
              var got = o.describe();
              return got === 'buy 2 ES @ limit 5240.25' ? true : 'got ' + JSON.stringify(got);
            } },
          { name: 'inherits the parent fields', expose: ['LimitOrder'],
            run: function (s) {
              var o = new s.LimitOrder('NQ', 'sell', 1, 18400);
              return (o.symbol === 'NQ' && o.side === 'sell' && o.qty === 1 && o.limitPrice === 18400)
                ? true : 'a field was not set correctly';
            } },
          { name: 'a LimitOrder is an Order', expose: ['LimitOrder', 'Order'],
            run: function (s) {
              return (new s.LimitOrder('ES', 'buy', 1, 1) instanceof s.Order)
                ? true : 'LimitOrder should extend Order';
            } },
          { name: 'reuses super.describe rather than duplicating it', expose: ['LimitOrder'],
            run: function (s) {
              // change the parent behaviour and confirm the child follows
              var proto = Object.getPrototypeOf(Object.getPrototypeOf(new s.LimitOrder('ES', 'buy', 1, 1)));
              var original = proto.describe;
              proto.describe = function () { return 'PARENT'; };
              var got = new s.LimitOrder('ES', 'buy', 1, 99).describe();
              proto.describe = original;
              return got === 'PARENT @ limit 99' ? true : 'describe() should call super.describe(), got ' + JSON.stringify(got);
            } }
        ] } },
      { id: 'e2', title: 'StopOrder.wouldFill()', difficulty: 'Core',
        prompt: 'Define <code>StopOrder extends Order</code> taking <code>(symbol, side, qty, stopPrice)</code>.<br>' +
          'Add <code>wouldFill(price)</code>: a <code>"buy"</code> stop triggers when the price reaches or exceeds the stop; a <code>"sell"</code> stop triggers when the price reaches or falls below it.',
        expose: ['Order', 'StopOrder'],
        starter: 'class Order {\n  constructor(symbol, side, qty) {\n    this.symbol = symbol;\n    this.side = side;\n    this.qty = qty;\n  }\n}\n\nclass StopOrder extends Order {\n  // constructor and wouldFill\n}\n',
        solution: 'class Order {\n  constructor(symbol, side, qty) {\n    this.symbol = symbol;\n    this.side = side;\n    this.qty = qty;\n  }\n}\n\nclass StopOrder extends Order {\n  constructor(symbol, side, qty, stopPrice) {\n    super(symbol, side, qty);\n    this.stopPrice = stopPrice;\n  }\n  wouldFill(price) {\n    return this.side === "buy" ? price >= this.stopPrice : price <= this.stopPrice;\n  }\n}',
        hints: ['A buy stop sits <em>above</em> the market and triggers on the way up.',
                'Both comparisons are inclusive: <code>&gt;=</code> and <code>&lt;=</code>.'],
        tests: { checks: [
          { name: 'a buy stop triggers at or above the level', expose: ['StopOrder'],
            run: function (s) {
              var o = new s.StopOrder('ES', 'buy', 1, 5250);
              if (o.wouldFill(5249) !== false) return 'below the stop should not fill';
              if (o.wouldFill(5250) !== true) return 'exactly at the stop should fill';
              if (o.wouldFill(5251) !== true) return 'above the stop should fill';
              return true;
            } },
          { name: 'a sell stop triggers at or below the level', expose: ['StopOrder'],
            run: function (s) {
              var o = new s.StopOrder('ES', 'sell', 1, 5230);
              if (o.wouldFill(5231) !== false) return 'above the stop should not fill';
              if (o.wouldFill(5230) !== true) return 'exactly at the stop should fill';
              if (o.wouldFill(5229) !== true) return 'below the stop should fill';
              return true;
            } },
          { name: 'inherits from Order', expose: ['StopOrder', 'Order'],
            run: function (s) {
              return (new s.StopOrder('ES', 'buy', 1, 1) instanceof s.Order) ? true : 'StopOrder should extend Order';
            } }
        ] } },
      { id: 'e3', title: 'Static factory with ids', difficulty: 'Stretch',
        prompt: 'Add to <code>Order</code> a static counter and a static factory:<ul>' +
          '<li><code>static nextId</code> — starts at <code>1</code></li>' +
          '<li><code>static create(symbol, side, qty)</code> — builds an <code>Order</code>, assigns it <code>id</code> from the counter, increments the counter, and returns the order</li>' +
          '<li><code>static reset()</code> — sets the counter back to <code>1</code></li></ul>',
        expose: ['Order'],
        starter: 'class Order {\n  constructor(symbol, side, qty) {\n    this.symbol = symbol;\n    this.side = side;\n    this.qty = qty;\n  }\n\n  // static nextId, create() and reset()\n}\n',
        solution: 'class Order {\n  static nextId = 1;\n\n  constructor(symbol, side, qty) {\n    this.symbol = symbol;\n    this.side = side;\n    this.qty = qty;\n  }\n\n  static create(symbol, side, qty) {\n    const o = new Order(symbol, side, qty);\n    o.id = Order.nextId++;\n    return o;\n  }\n\n  static reset() {\n    Order.nextId = 1;\n  }\n}',
        hints: ['A static field is declared inside the class body as <code>static nextId = 1;</code>.',
                'Inside a static method, refer to the class by name: <code>Order.nextId++</code>.'],
        tests: { checks: [
          { name: 'ids increment from 1', expose: ['Order'],
            run: function (s) {
              s.Order.reset();
              var a = s.Order.create('ES', 'buy', 1);
              var b = s.Order.create('NQ', 'sell', 2);
              if (a.id !== 1) return 'the first order should have id 1, got ' + a.id;
              return b.id === 2 ? true : 'the second order should have id 2, got ' + b.id;
            } },
          { name: 'create returns a real Order with its fields set', expose: ['Order'],
            run: function (s) {
              s.Order.reset();
              var o = s.Order.create('CL', 'buy', 3);
              if (!(o instanceof s.Order)) return 'create should return an Order instance';
              return (o.symbol === 'CL' && o.side === 'buy' && o.qty === 3) ? true : 'the fields were not set';
            } },
          { name: 'reset() restarts the counter', expose: ['Order'],
            run: function (s) {
              s.Order.reset();
              s.Order.create('ES', 'buy', 1);
              s.Order.create('ES', 'buy', 1);
              s.Order.reset();
              return s.Order.create('ES', 'buy', 1).id === 1 ? true : 'reset() did not restart the counter';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What must happen before you use <code>this</code> in a subclass constructor?',
        options: ['Nothing', '<code>super(...)</code> must be called', 'The fields must be declared', '<code>bind</code> must be called'],
        answer: 1,
        explain: 'Accessing <code>this</code> before <code>super()</code> throws a ReferenceError — the instance does not exist yet.' },
      { q: 'How do you call the parent version of an overridden method?',
        options: ['<code>parent.method()</code>', '<code>super.method()</code>', '<code>this.super.method()</code>', 'You cannot'],
        answer: 1,
        explain: '<code>super.method()</code> reaches the parent implementation, letting an override extend rather than replace.' },
      { q: 'Where does a <code>static</code> method live?',
        options: ['On every instance', 'On the class itself', 'On the prototype chain of instances', 'In global scope'],
        answer: 1,
        explain: 'Call it as <code>Order.create(...)</code>. Statics are for behaviour about the type, not about one object.' }
    ],
    recap: [
      '<code>extends</code> inherits fields and methods; <code>super()</code> runs the parent constructor first.',
      '<code>super.method()</code> lets an override reuse the parent implementation.',
      '<code>static</code> members belong to the class — factories, counters, validators.',
      'When a type needs traits from two branches, compose instead of inheriting.'
    ],
    vocab: [
      { term: 'Stop order', def: 'An order that becomes active when price reaches a trigger. A buy stop sits above the market, a sell stop below.' },
      { term: 'Limit order', def: 'An order to trade at a price or better. It may never fill, but it will never fill worse than its limit.' }
    ]
  });

  C.push({
    id: 'd036', day: 36, module: 3, minutes: 30,
    title: 'Getters, Setters and Private Fields',
    subtitle: 'Computed properties and state nobody can corrupt.',
    goal: '<b>Goal:</b> expose derived values as properties and make invalid state impossible to construct.',
    objectives: [
      'Define <code>get</code> and <code>set</code> accessors',
      'Use <code>#private</code> fields',
      'Validate in a setter to protect an invariant',
      'Know when a getter is better than a method'
    ],
    sections: [
      { h: 'Getters look like fields, run like functions',
        body: '<p>A getter computes on access. Use one when the value is genuinely derived from other fields and is cheap to compute — the caller should not have to know it is calculated.</p>',
        code: 'class Position {\n  constructor(entry, qty, pointValue = 50) {\n    this.entry = entry;\n    this.qty = qty;\n    this.pointValue = pointValue;\n    this.last = entry;\n  }\n\n  get points() { return this.last - this.entry; }\n  get pnl() { return this.points * this.qty * this.pointValue; }\n  get isWinning() { return this.pnl > 0; }\n}\n\nconst p = new Position(5240.25, 2);\np.last = 5252.75;\nconsole.log(p.points, p.pnl, p.isWinning);   // no parentheses' },
      { h: 'Setters guard the way in',
        body: '<p>A setter intercepts assignment. It is the natural place to validate, so an object can never hold a value that makes no sense.</p>',
        code: 'class RiskLimit {\n  constructor(maxPercent) { this.maxPercent = maxPercent; }\n\n  get maxPercent() { return this._max; }\n  set maxPercent(v) {\n    if (typeof v !== "number" || v <= 0 || v > 100) {\n      throw new RangeError("maxPercent must be between 0 and 100");\n    }\n    this._max = v;\n  }\n}\n\nconst r = new RiskLimit(2);\nconsole.log(r.maxPercent);\ntry { r.maxPercent = 500; } catch (e) { console.log("Rejected:", e.message); }\nconsole.log("still", r.maxPercent);' },
      { h: 'Truly private fields with #',
        body: '<p>A <code>#name</code> field is private to the class body. Not "private by convention" like a leading underscore — genuinely unreachable from outside, and a syntax error to try.</p>',
        code: 'class Account {\n  #balance;\n\n  constructor(starting) { this.#balance = starting; }\n\n  get balance() { return this.#balance; }\n\n  apply(pnl) {\n    this.#balance += pnl;\n    return this.#balance;\n  }\n}\n\nconst a = new Account(50000);\nconsole.log(a.apply(-1200));\nconsole.log(a.balance);\nconsole.log(Object.keys(a));   // [] — the field is invisible' },
      { h: 'Getter or method?',
        body: '<div class="note note-tip"><b>The convention</b>A getter should be cheap and side-effect free, and should read like a property: <code>position.pnl</code>. If it does real work, takes an argument, or might throw, make it a method: <code>position.pnlAt(price)</code>. A caller does not expect <code>obj.x</code> to run a loop over 100,000 bars.</div>' }
    ],
    parsons: {
      prompt: 'Expose an unrealised P&L as a computed property.',
      lines: [
        'class Position {',
        '  constructor(entry, qty) { this.entry = entry; this.qty = qty; this.last = entry; }',
        '  get points() { return this.last - this.entry; }',
        '  get pnl() { return this.points * this.qty * 50; }',
        '}',
        'const p = new Position(5240, 2);',
        'p.last = 5250;',
        'console.log(p.pnl);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Computed position properties', difficulty: 'Core',
        prompt: 'Complete <code>Position</code> with three getters:<ul>' +
          '<li><code>points</code> — <code>last - entry</code> for a long, <code>entry - last</code> for a short</li>' +
          '<li><code>pnl</code> — points × qty × pointValue</li>' +
          '<li><code>isWinning</code> — whether <code>pnl</code> is above 0</li></ul>' +
          'They must be accessed without parentheses: <code>p.pnl</code>, not <code>p.pnl()</code>.',
        expose: ['Position'],
        starter: 'class Position {\n  constructor(side, entry, qty, pointValue = 50) {\n    this.side = side;\n    this.entry = entry;\n    this.qty = qty;\n    this.pointValue = pointValue;\n    this.last = entry;\n  }\n\n  // three getters here\n}\n',
        solution: 'class Position {\n  constructor(side, entry, qty, pointValue = 50) {\n    this.side = side;\n    this.entry = entry;\n    this.qty = qty;\n    this.pointValue = pointValue;\n    this.last = entry;\n  }\n\n  get points() {\n    return this.side === "long" ? this.last - this.entry : this.entry - this.last;\n  }\n  get pnl() { return this.points * this.qty * this.pointValue; }\n  get isWinning() { return this.pnl > 0; }\n}',
        hints: ['A getter is written <code>get points() { ... }</code> inside the class body.',
                'One getter can use another: <code>this.points</code> inside <code>get pnl()</code>.'],
        tests: { checks: [
          { name: 'points and pnl are computed for a long', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('long', 5240.25, 2);
              p.last = 5252.75;
              if (Math.abs(p.points - 12.5) > 1e-9) return 'points gave ' + p.points;
              if (Math.abs(p.pnl - 1250) > 1e-9) return 'pnl gave ' + p.pnl;
              return true;
            } },
          { name: 'a short flips the sign', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('short', 5250, 1);
              p.last = 5240;
              return Math.abs(p.points - 10) < 1e-9 ? true : 'points gave ' + p.points;
            } },
          { name: 'they are getters, not methods', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('long', 100, 1);
              return typeof p.pnl === 'number' ? true : 'p.pnl should be a number, not a ' + typeof p.pnl;
            } },
          { name: 'isWinning tracks the price', expose: ['Position'],
            run: function (s) {
              var p = new s.Position('long', 100, 1);
              if (p.isWinning !== false) return 'flat at entry is not winning';
              p.last = 110;
              return p.isWinning === true ? true : 'above entry a long should be winning';
            } }
        ] } },
      { id: 'e2', title: 'Validating setter', difficulty: 'Core',
        prompt: 'Define <code>RiskLimit</code> with a <code>maxPercent</code> accessor pair.<ul>' +
          '<li>The setter rejects anything that is not a number, or is <code>&lt;= 0</code>, or is <code>&gt; 100</code>, by throwing a <code>RangeError</code>.</li>' +
          '<li>The getter returns the stored value.</li>' +
          '<li>The constructor takes the initial value and must go through the setter, so invalid input throws at construction.</li></ul>',
        expose: ['RiskLimit'],
        starter: 'class RiskLimit {\n  constructor(maxPercent) {\n    this.maxPercent = maxPercent;\n  }\n\n  // getter and validating setter\n}\n',
        solution: 'class RiskLimit {\n  constructor(maxPercent) {\n    this.maxPercent = maxPercent;\n  }\n\n  get maxPercent() { return this._max; }\n\n  set maxPercent(v) {\n    if (typeof v !== "number" || Number.isNaN(v) || v <= 0 || v > 100) {\n      throw new RangeError("maxPercent must be between 0 and 100");\n    }\n    this._max = v;\n  }\n}',
        hints: ['Store the real value under a different name (<code>this._max</code>) or the setter would call itself forever.',
                'Assigning <code>this.maxPercent</code> in the constructor goes through the setter automatically.'],
        tests: { checks: [
          { name: 'a valid value is stored and readable', expose: ['RiskLimit'],
            run: function (s) {
              var r = new s.RiskLimit(2);
              return r.maxPercent === 2 ? true : 'expected 2, got ' + r.maxPercent;
            } },
          { name: 'out-of-range assignment throws RangeError', expose: ['RiskLimit'],
            run: function (s) {
              var r = new s.RiskLimit(2);
              try { r.maxPercent = 500; } catch (e) {
                return e instanceof RangeError ? true : 'threw a ' + e.name + ', expected RangeError';
              }
              return 'assigning 500 should have thrown';
            } },
          { name: 'a rejected assignment leaves the old value intact', expose: ['RiskLimit'],
            run: function (s) {
              var r = new s.RiskLimit(2);
              try { r.maxPercent = -1; } catch (e) {}
              return r.maxPercent === 2 ? true : 'the value changed to ' + r.maxPercent;
            } },
          { name: 'invalid construction throws', expose: ['RiskLimit'],
            run: function (s) {
              try { new s.RiskLimit(0); } catch (e) { return true; }
              return 'constructing with 0 should throw — route the constructor through the setter';
            } },
          { name: 'non-numbers are rejected', expose: ['RiskLimit'],
            run: function (s) {
              try { new s.RiskLimit('2'); } catch (e) { return true; }
              return 'a string should be rejected';
            } }
        ] } },
      { id: 'e3', title: 'Private balance', difficulty: 'Stretch',
        prompt: 'Define <code>Account</code> with a genuinely private balance:<ul>' +
          '<li><code>constructor(starting)</code> — stores it in a <code>#</code> private field</li>' +
          '<li><code>get balance()</code> — reads it</li>' +
          '<li><code>apply(pnl)</code> — adds to it and returns the new balance</li>' +
          '<li><code>get isBlown()</code> — <code>true</code> when the balance is at or below 0</li></ul>' +
          'The field must not appear in <code>Object.keys(account)</code>.',
        expose: ['Account'],
        starter: 'class Account {\n  // private field, getter, apply(), isBlown\n}\n',
        solution: 'class Account {\n  #balance;\n\n  constructor(starting) { this.#balance = starting; }\n\n  get balance() { return this.#balance; }\n\n  apply(pnl) {\n    this.#balance += pnl;\n    return this.#balance;\n  }\n\n  get isBlown() { return this.#balance <= 0; }\n}',
        hints: ['Declare the field at the top of the class body: <code>#balance;</code>',
                'Private fields are only reachable from inside the class body — including from getters.'],
        tests: { checks: [
          { name: 'balance reads back and apply() updates it', expose: ['Account'],
            run: function (s) {
              var a = new s.Account(50000);
              if (a.balance !== 50000) return 'balance gave ' + a.balance;
              if (a.apply(-1200) !== 48800) return 'apply should return the new balance';
              return a.balance === 48800 ? true : 'balance did not persist';
            } },
          { name: 'isBlown flips at or below zero', expose: ['Account'],
            run: function (s) {
              var a = new s.Account(100);
              if (a.isBlown !== false) return 'a positive balance is not blown';
              a.apply(-100);
              return a.isBlown === true ? true : 'a zero balance should count as blown';
            } },
          { name: 'the balance is genuinely private', expose: ['Account'],
            run: function (s) {
              var a = new s.Account(1000);
              var keys = Object.keys(a);
              if (keys.length !== 0) return 'the instance exposes ' + JSON.stringify(keys) + ' — use a # private field';
              return true;
            } },
          { name: 'the private field survives JSON serialisation attempts', expose: ['Account'],
            run: function (s) {
              var a = new s.Account(1000);
              return JSON.stringify(a) === '{}' ? true : 'a private field should not serialise, got ' + JSON.stringify(a);
            } }
        ] } }
    ],
    quiz: [
      { q: 'How do you read a getter called <code>pnl</code>?',
        options: ['<code>p.pnl()</code>', '<code>p.pnl</code>', '<code>p.get.pnl</code>', '<code>get p.pnl</code>'],
        answer: 1,
        explain: 'A getter is accessed like a field — that is the point of it.' },
      { q: 'Why must a setter store its value under a different name?',
        options: ['Style', 'Assigning to the same name would call the setter again, forever', 'To allow JSON', 'It would be private otherwise'],
        answer: 1,
        explain: '<code>set x(v) { this.x = v; }</code> is infinite recursion. Store in <code>_x</code> or a <code>#</code> field.' },
      { q: 'What is the difference between <code>_balance</code> and <code>#balance</code>?',
        options: ['None', '<code>_balance</code> is a convention; <code>#balance</code> is enforced by the language', '<code>#</code> is slower', '<code>_</code> is enforced'],
        answer: 1,
        explain: 'An underscore is a request. A <code>#</code> field is genuinely inaccessible, invisible to <code>Object.keys</code>, and skipped by JSON.' }
    ],
    recap: [
      'Getters expose derived values as properties.',
      'Setters are the place to validate and protect invariants.',
      '<code>#field</code> is real privacy, not a naming convention.',
      'If it takes an argument or does real work, make it a method.'
    ],
    vocab: [
      { term: 'Invariant', def: 'A condition that must always hold — position size never negative, risk never above the cap. Enforce them at the boundary, not by remembering.' },
      { term: 'Blown account', def: 'An account whose equity has reached zero or a hard stop-out. The outcome every risk rule exists to prevent.' }
    ]
  });

  C.push({
    id: 'd037', day: 37, module: 3, minutes: 30,
    title: 'Errors: Failing Loudly and Usefully',
    subtitle: 'throw, try/catch/finally, and custom error types.',
    goal: '<b>Goal:</b> reject bad input at the boundary and handle failure without hiding it.',
    objectives: [
      'Throw errors with useful messages',
      'Catch selectively and rethrow what you cannot handle',
      'Define a custom Error subclass',
      'Use <code>finally</code> for cleanup'
    ],
    sections: [
      { h: 'Throw early, throw clearly',
        body: '<p>A function given nonsense should say so immediately. The alternative is a <code>NaN</code> that travels through six more functions before surfacing as a wrong position size.</p>',
        code: 'function positionSize(equity, riskPercent, stopPoints) {\n  if (!Number.isFinite(equity) || equity <= 0) {\n    throw new RangeError(`equity must be a positive number, got ${equity}`);\n  }\n  if (stopPoints <= 0) {\n    throw new RangeError(`stopPoints must be positive, got ${stopPoints}`);\n  }\n  return Math.floor(equity * riskPercent / 100 / stopPoints);\n}\n\nconsole.log(positionSize(50000, 1, 10));\ntry { positionSize(50000, 1, 0); } catch (e) { console.log(e.name + ":", e.message); }' },
      { h: 'try / catch / finally',
        body: '<p><code>finally</code> runs whether or not an error was thrown — the right place for cleanup that must always happen, like releasing a lock or closing a connection.</p>',
        code: 'function riskyParse(text) {\n  try {\n    return JSON.parse(text);\n  } catch (e) {\n    console.log("parse failed:", e.message);\n    return null;\n  } finally {\n    console.log("...cleanup always runs");\n  }\n}\n\nconsole.log(riskyParse(\'{"ok":1}\'));\nconsole.log(riskyParse("broken"));' },
      { h: 'Custom error types',
        body: '<p>Subclass <code>Error</code> so callers can distinguish what went wrong with <code>instanceof</code>, and attach the data they need to react.</p>',
        code: 'class RiskError extends Error {\n  constructor(message, details) {\n    super(message);\n    this.name = "RiskError";\n    this.details = details;\n  }\n}\n\nfunction checkRisk(loss, limit) {\n  if (loss > limit) throw new RiskError("daily loss limit breached", { loss, limit });\n  return true;\n}\n\ntry { checkRisk(900, 500); }\ncatch (e) {\n  if (e instanceof RiskError) console.log(e.name, e.message, e.details);\n  else throw e;    // not ours — let it go up\n}' },
      { h: 'Never swallow an error',
        body: '<div class="note note-warn"><b>The worst two lines in trading code</b><code>try { placeOrder(); } catch (e) {}</code><br>The order silently failed, the position is not what the strategy believes, and there is no record. Catch only what you can actually handle, and rethrow everything else.</div>',
        code: 'function safeDivide(a, b) {\n  try {\n    if (b === 0) throw new RangeError("division by zero");\n    return a / b;\n  } catch (e) {\n    if (e instanceof RangeError) return 0;   // handled deliberately\n    throw e;                                  // anything else is not ours\n  }\n}\nconsole.log(safeDivide(10, 2), safeDivide(10, 0));' }
    ],
    parsons: {
      prompt: 'Validate an input and throw a clear error.',
      lines: [
        'function setLeverage(x) {',
        '  if (x <= 0 || x > 20) {',
        '    throw new RangeError(`leverage must be 1-20, got ${x}`);',
        '  }',
        '  return x;',
        '}',
        'try { setLeverage(50); } catch (e) { console.log(e.message); }'
      ]
    },
    exercises: [
      { id: 'e1', title: 'validateOrder()', difficulty: 'Core',
        prompt: 'Write <code>validateOrder(order)</code> which throws when the order is invalid and returns <code>true</code> when it is valid.<ul>' +
          '<li>missing or empty <code>symbol</code> → <code>TypeError</code></li>' +
          '<li><code>side</code> not exactly <code>"buy"</code> or <code>"sell"</code> → <code>TypeError</code></li>' +
          '<li><code>qty</code> not a positive whole number → <code>RangeError</code></li></ul>',
        starter: 'function validateOrder(order) {\n  // throw on invalid, return true when valid\n}\n',
        solution: 'function validateOrder(order) {\n  if (!order || typeof order.symbol !== "string" || order.symbol === "") {\n    throw new TypeError("order.symbol must be a non-empty string");\n  }\n  if (order.side !== "buy" && order.side !== "sell") {\n    throw new TypeError(`order.side must be "buy" or "sell", got ${order.side}`);\n  }\n  if (!Number.isInteger(order.qty) || order.qty <= 0) {\n    throw new RangeError(`order.qty must be a positive whole number, got ${order.qty}`);\n  }\n  return true;\n}',
        hints: ['Check each rule in turn and throw as soon as one fails — guard clauses, not nested ifs.',
                '<code>Number.isInteger(x)</code> is the whole-number test.'],
        tests: { checks: [
          { name: 'a valid order returns true', expose: ['validateOrder'],
            run: function (s) {
              return s.validateOrder({ symbol: 'ES', side: 'buy', qty: 2 }) === true ? true : 'should return true';
            } },
          { name: 'a missing symbol throws TypeError', expose: ['validateOrder'],
            run: function (s) {
              try { s.validateOrder({ side: 'buy', qty: 1 }); } catch (e) {
                return e instanceof TypeError ? true : 'threw ' + e.name + ', expected TypeError';
              }
              return 'should have thrown';
            } },
          { name: 'a bad side throws TypeError', expose: ['validateOrder'],
            run: function (s) {
              try { s.validateOrder({ symbol: 'ES', side: 'long', qty: 1 }); } catch (e) {
                return e instanceof TypeError ? true : 'threw ' + e.name + ', expected TypeError';
              }
              return 'should have thrown — "long" is not "buy" or "sell"';
            } },
          { name: 'a fractional qty throws RangeError', expose: ['validateOrder'],
            run: function (s) {
              try { s.validateOrder({ symbol: 'ES', side: 'buy', qty: 1.5 }); } catch (e) {
                return e instanceof RangeError ? true : 'threw ' + e.name + ', expected RangeError';
              }
              return 'should have thrown';
            } },
          { name: 'a zero qty throws RangeError', expose: ['validateOrder'],
            run: function (s) {
              try { s.validateOrder({ symbol: 'ES', side: 'buy', qty: 0 }); } catch (e) {
                return e instanceof RangeError ? true : 'threw ' + e.name;
              }
              return 'should have thrown';
            } }
        ] } },
      { id: 'e2', title: 'class RiskError', difficulty: 'Core',
        prompt: 'Define <code>RiskError extends Error</code>:<ul>' +
          '<li><code>constructor(message, details)</code> — passes the message to <code>super</code>, sets <code>this.name = "RiskError"</code>, and stores <code>details</code></li></ul>' +
          'Then write <code>checkDailyLoss(loss, limit)</code> which throws a <code>RiskError</code> with <code>details</code> of <code>{loss, limit}</code> when <code>loss</code> exceeds <code>limit</code>, and returns <code>true</code> otherwise.',
        expose: ['RiskError', 'checkDailyLoss'],
        starter: 'class RiskError extends Error {\n  // constructor\n}\n\nfunction checkDailyLoss(loss, limit) {\n  // throw a RiskError or return true\n}\n',
        solution: 'class RiskError extends Error {\n  constructor(message, details) {\n    super(message);\n    this.name = "RiskError";\n    this.details = details;\n  }\n}\n\nfunction checkDailyLoss(loss, limit) {\n  if (loss > limit) {\n    throw new RiskError("daily loss limit breached", { loss, limit });\n  }\n  return true;\n}',
        hints: ['<code>super(message)</code> must be the first statement in the constructor.',
                'Setting <code>this.name</code> is what makes the error print as <code>RiskError: ...</code>.'],
        tests: { checks: [
          { name: 'a loss within the limit returns true', expose: ['checkDailyLoss'],
            run: function (s) { return s.checkDailyLoss(100, 500) === true ? true : 'should return true'; } },
          { name: 'a breach throws a RiskError', expose: ['checkDailyLoss', 'RiskError'],
            run: function (s) {
              try { s.checkDailyLoss(900, 500); } catch (e) {
                if (!(e instanceof s.RiskError)) return 'threw ' + e.name + ', expected a RiskError';
                if (!(e instanceof Error)) return 'RiskError should extend Error';
                if (e.name !== 'RiskError') return 'e.name is ' + e.name;
                return true;
              }
              return 'should have thrown';
            } },
          { name: 'the error carries the details', expose: ['checkDailyLoss'],
            run: function (s, h) {
              try { s.checkDailyLoss(900, 500); } catch (e) {
                return h.eq(e.details, { loss: 900, limit: 500 }) ? true : 'details were ' + JSON.stringify(e.details);
              }
              return 'should have thrown';
            } },
          { name: 'the message survives to e.message', expose: ['checkDailyLoss'],
            run: function (s) {
              try { s.checkDailyLoss(900, 500); } catch (e) {
                return (typeof e.message === 'string' && e.message.length > 0)
                  ? true : 'pass the message through to super(message)';
              }
              return 'should have thrown';
            } }
        ] } },
      { id: 'e3', title: 'attemptOrder()', difficulty: 'Stretch',
        prompt: 'Write <code>attemptOrder(order, place, log)</code>:<ul>' +
          '<li>calls <code>place(order)</code> and returns <code>{ ok: true, result }</code> on success</li>' +
          '<li>if <code>place</code> throws, returns <code>{ ok: false, error: err.message }</code></li>' +
          '<li>calls <code>log(order)</code> exactly once either way, <strong>after</strong> the attempt</li></ul>' +
          'Use <code>finally</code> for the logging so it cannot be skipped.',
        starter: 'function attemptOrder(order, place, log) {\n  // try / catch / finally\n}\n',
        solution: 'function attemptOrder(order, place, log) {\n  try {\n    return { ok: true, result: place(order) };\n  } catch (err) {\n    return { ok: false, error: err.message };\n  } finally {\n    log(order);\n  }\n}',
        hints: ['<code>finally</code> runs even when the <code>try</code> block returns.',
                'Return from inside both <code>try</code> and <code>catch</code>; the <code>finally</code> still executes first.'],
        tests: { fn: 'attemptOrder', cases: [
          { args: [{ id: 1 }, function () { return 'filled'; }, function () {}],
            expect: { ok: true, result: 'filled' } },
          { args: [{ id: 1 }, function () { throw new Error('rejected by broker'); }, function () {}],
            expect: { ok: false, error: 'rejected by broker' } }
        ], checks: [
          { name: 'log is called exactly once on success', expose: ['attemptOrder'],
            run: function (s) {
              var n = 0;
              s.attemptOrder({}, function () { return 1; }, function () { n++; });
              return n === 1 ? true : 'log was called ' + n + ' times';
            } },
          { name: 'log is still called when place throws', expose: ['attemptOrder'],
            run: function (s) {
              var n = 0;
              s.attemptOrder({}, function () { throw new Error('x'); }, function () { n++; });
              return n === 1 ? true : 'log was called ' + n + ' times — use finally';
            } }
        ] } }
    ],
    quiz: [
      { q: 'When does a <code>finally</code> block run?',
        options: ['Only when no error was thrown', 'Only when an error was thrown', 'Always, including when the try block returns', 'Only if you call it'],
        answer: 2,
        explain: 'It runs on every exit path, which is what makes it right for cleanup.' },
      { q: 'Why subclass <code>Error</code> rather than throwing a string?',
        options: ['Strings are illegal', 'You get a stack trace, a name, and <code>instanceof</code> for selective handling', 'It is faster', 'To allow finally'],
        answer: 1,
        explain: 'Callers need to distinguish a risk breach from a network failure. <code>instanceof</code> makes that possible.' },
      { q: 'What is wrong with <code>catch (e) {}</code>?',
        options: ['Nothing', 'It hides the failure — the caller believes something happened that did not', 'It is a syntax error', 'It is slow'],
        answer: 1,
        explain: 'An order that silently failed leaves your strategy\'s idea of its position wrong, with no record of why.' }
    ],
    recap: [
      'Validate at the boundary and throw with a message naming the bad value.',
      '<code>finally</code> always runs — use it for cleanup.',
      'Custom <code>Error</code> subclasses let callers handle selectively.',
      'Catch what you can handle; rethrow everything else.'
    ],
    vocab: [
      { term: 'Daily loss limit', def: 'A hard cap on losses in one session. Hitting it means stopping for the day — mechanically, not by judgement.' }
    ]
  });

  C.push({
    id: 'd038', day: 38, module: 3, minutes: 30,
    title: 'Recursion',
    subtitle: 'Functions that call themselves, and when not to let them.',
    goal: '<b>Goal:</b> solve naturally nested problems — and know why most series work should stay iterative.',
    objectives: [
      'Write a recursive function with a base case',
      'Trace a recursive call by hand',
      'Recognise stack-overflow risk',
      'Choose recursion only where it genuinely reads better'
    ],
    sections: [
      { h: 'Base case first, always',
        body: '<p>Every recursion needs a case that returns without recursing, and every recursive call must move measurably toward it. Miss either and you get <code>RangeError: Maximum call stack size exceeded</code>.</p>',
        code: 'function countdown(n) {\n  if (n <= 0) return "liftoff";     // base case\n  console.log(n);\n  return countdown(n - 1);          // moves toward the base\n}\nconsole.log(countdown(4));' },
      { h: 'Where recursion actually wins: nested structures',
        body: '<p>Trees, nested configuration, an order with child orders — anything whose shape is "a thing that may contain more things" is naturally recursive. Flat arrays are not.</p>',
        code: 'const strategy = {\n  name: "root",\n  children: [\n    { name: "trend", children: [{ name: "ema-cross", children: [] }] },\n    { name: "meanrev", children: [] }\n  ]\n};\n\nfunction countNodes(node) {\n  return 1 + node.children.reduce((a, c) => a + countNodes(c), 0);\n}\nconsole.log(countNodes(strategy));' },
      { h: 'Stack depth is finite',
        body: '<p>Each pending call occupies a stack frame, and browsers allow roughly ten thousand. A recursion over 78 bars is fine; one over a million ticks is a crash.</p>' +
              '<div class="note note-warn"><b>JavaScript does not optimise tail calls</b>Other languages reuse the frame for a recursive call in tail position. Most JavaScript engines do not, so deep recursion overflows regardless of how you write it. For long series, loop.</div>',
        code: 'function depth(n) { return n === 0 ? 0 : 1 + depth(n - 1); }\nconsole.log(depth(1000));\ntry { depth(200000); } catch (e) { console.log("Deep recursion:", e.message.slice(0, 60)); }' },
      { h: 'Flattening nested data',
        body: '<p>A common real task: a config that allows nested groups of symbols, which must be flattened into one list.</p>',
        code: 'function flatten(list) {\n  return list.reduce((out, item) =>\n    Array.isArray(item) ? out.concat(flatten(item)) : out.concat(item), []);\n}\n\nconsole.log(flatten(["ES", ["NQ", ["RTY", "YM"]], "CL"]));' }
    ],
    parsons: {
      prompt: 'Sum a nested array recursively.',
      lines: [
        'function deepSum(list) {',
        '  return list.reduce((total, item) =>',
        '    Array.isArray(item) ? total + deepSum(item) : total + item, 0);',
        '}',
        'console.log(deepSum([1, [2, [3, 4]], 5]));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'flatten()', difficulty: 'Core',
        prompt: 'Write <code>flatten(list)</code> turning an arbitrarily nested array into a single flat array, preserving order.<br>' +
          '<code>flatten(["ES", ["NQ", ["RTY"]], "CL"])</code> → <code>["ES","NQ","RTY","CL"]</code><br>' +
          'Do not use the built-in <code>.flat(Infinity)</code> — write the recursion.',
        starter: 'function flatten(list) {\n  // recursive flatten\n}\n',
        solution: 'function flatten(list) {\n  return list.reduce((out, item) =>\n    Array.isArray(item) ? out.concat(flatten(item)) : out.concat(item), []);\n}',
        hints: ['<code>Array.isArray(item)</code> tells you whether to recurse.',
                'The base case is an item that is not an array — just add it.'],
        tests: { fn: 'flatten', cases: [
          { args: [['ES', ['NQ', ['RTY']], 'CL']], expect: ['ES', 'NQ', 'RTY', 'CL'] },
          { args: [[1, [2, [3, [4]]]]], expect: [1, 2, 3, 4] },
          { args: [[]], expect: [] },
          { args: [[[], [[]]]], expect: [], name: 'empty nested arrays flatten to nothing' },
          { args: [[1, 2, 3]], expect: [1, 2, 3], name: 'an already-flat array is unchanged' }
        ], source: [{ name: 'does not use .flat()', pattern: /\.flat\s*\(/, forbid: true,
          why: 'write the recursion rather than calling the built-in' }] } },
      { id: 'e2', title: 'countNodes()', difficulty: 'Core',
        prompt: 'A strategy tree node is <code>{ name, children }</code> where <code>children</code> is an array of nodes (possibly empty, possibly missing).<br>' +
          'Write <code>countNodes(node)</code> returning the total number of nodes including the root. A <code>null</code> node counts as 0.',
        starter: 'function countNodes(node) {\n  // total nodes in the tree\n}\n',
        solution: 'function countNodes(node) {\n  if (!node) return 0;\n  return 1 + (node.children ?? []).reduce((a, c) => a + countNodes(c), 0);\n}',
        hints: ['Count yourself as 1, then add the counts of every child.',
                'Guard both a missing node and a missing <code>children</code> array.'],
        tests: { fn: 'countNodes', cases: [
          { args: [{ name: 'a', children: [] }], expect: 1 },
          { args: [{ name: 'root', children: [{ name: 'x', children: [{ name: 'y', children: [] }] }, { name: 'z', children: [] }] }], expect: 4 },
          { args: [{ name: 'lonely' }], expect: 1, name: 'a missing children array counts as a leaf' },
          { args: [null], expect: 0 }
        ] } },
      { id: 'e3', title: 'maxDepth()', difficulty: 'Stretch',
        prompt: 'Write <code>maxDepth(node)</code> returning how many levels deep the tree goes.<br>' +
          'A single node with no children has depth <code>1</code>; <code>null</code> has depth <code>0</code>.',
        starter: 'function maxDepth(node) {\n  // deepest path length\n}\n',
        solution: 'function maxDepth(node) {\n  if (!node) return 0;\n  const kids = node.children ?? [];\n  if (!kids.length) return 1;\n  return 1 + Math.max(...kids.map(maxDepth));\n}',
        hints: ['The depth of a node is 1 plus the deepest of its children.',
                'Guard the leaf case before calling <code>Math.max</code> on an empty list.'],
        tests: { fn: 'maxDepth', cases: [
          { args: [null], expect: 0 },
          { args: [{ name: 'a', children: [] }], expect: 1 },
          { args: [{ name: 'a', children: [{ name: 'b', children: [] }] }], expect: 2 },
          { args: [{ name: 'a', children: [{ name: 'b', children: [] }, { name: 'c', children: [{ name: 'd', children: [{ name: 'e', children: [] }] }] }] }], expect: 4 },
          { args: [{ name: 'a' }], expect: 1, name: 'a missing children array is a leaf' }
        ] } }
    ],
    quiz: [
      { q: 'What does every recursive function need?',
        options: ['A loop', 'A base case and progress toward it', 'An array parameter', 'A try/catch'],
        answer: 1,
        explain: 'Without a base case, or without moving toward it, the stack fills and the program throws.' },
      { q: 'Roughly how deep can browser recursion go?',
        options: ['Unlimited', 'About ten thousand frames', 'Exactly 256', 'One million'],
        answer: 1,
        explain: 'It varies by engine but is in the low tens of thousands. Fine for trees, wrong for a tick series.' },
      { q: 'Which problem is genuinely better recursive?',
        options: ['Summing a flat array of closes', 'Walking a nested strategy tree', 'Computing an EMA', 'Filtering trades'],
        answer: 1,
        explain: 'Recursion fits data whose shape is self-similar. Flat sequences are clearer and safer as loops.' }
    ],
    recap: [
      'Base case first, and every call must move toward it.',
      'Recursion fits nested, self-similar structures.',
      'The call stack is finite and JavaScript does not optimise tail calls.',
      'For long flat series, loop.'
    ],
    vocab: [
      { term: 'Strategy tree', def: 'A hierarchy of rules or sub-strategies combined into one system — naturally recursive to walk and evaluate.' }
    ]
  });

  C.push({
    id: 'd039', day: 39, module: 3, minutes: 30,
    title: 'Memoization',
    subtitle: 'Caching pure functions, and paying for it in memory.',
    goal: '<b>Goal:</b> make an expensive repeated calculation cheap, without breaking correctness.',
    objectives: [
      'Cache results keyed by arguments',
      'Write a generic <code>memoize</code> wrapper',
      'Explain why only pure functions may be memoized',
      'Bound a cache so it cannot grow forever'
    ],
    sections: [
      { h: 'The idea',
        body: '<p>If a function always returns the same answer for the same arguments, the answer can be stored the first time and reused. A parameter sweep that recomputes the same indicator for hundreds of combinations is exactly this situation.</p>',
        code: 'function slowSquare(n) {\n  for (let i = 0; i < 200000; i++) {}   // pretend work\n  return n * n;\n}\n\nconst cache = new Map();\nfunction fastSquare(n) {\n  if (cache.has(n)) return cache.get(n);\n  const r = slowSquare(n);\n  cache.set(n, r);\n  return r;\n}\n\nconsole.time("first"); fastSquare(12); console.timeEnd("first");\nconsole.time("cached"); fastSquare(12); console.timeEnd("cached");' },
      { h: 'A generic memoize',
        body: '<p>Wrap any function. The tricky part is the cache key: arguments must be turned into something a <code>Map</code> can compare, and <code>JSON.stringify</code> is the usual pragmatic answer.</p>',
        code: 'function memoize(fn) {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n}\n\nlet calls = 0;\nconst sma = memoize((series, n) => {\n  calls++;\n  return series.slice(-n).reduce((a, v) => a + v, 0) / n;\n});\n\nconsole.log(sma([1, 2, 3, 4], 2), sma([1, 2, 3, 4], 2));\nconsole.log("underlying calls:", calls);' },
      { h: 'Only memoize pure functions',
        body: '<div class="note note-warn"><b>The rule</b>If the function reads outside state, uses the clock, or has side effects, caching it makes it wrong. Memoizing "get the current price" freezes the market at the first call.</div>' +
              '<p>The same applies to arguments that are mutated later: the key was computed from their contents at call time, so a mutated array silently returns a stale answer.</p>' },
      { h: 'Bound the cache',
        body: '<p>An unbounded cache is a memory leak with a nice name. For a sweep over unbounded inputs, cap the size and evict the oldest entry.</p>',
        code: 'function memoizeLimited(fn, max = 3) {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    if (cache.size > max) cache.delete(cache.keys().next().value);\n    return result;\n  };\n}\n\nconst f = memoizeLimited(n => n * 2, 2);\nf(1); f(2); f(3);\nconsole.log("cache holds at most 2 entries");' }
    ],
    parsons: {
      prompt: 'Wrap a function in a simple cache.',
      lines: [
        'function memoize(fn) {',
        '  const cache = new Map();',
        '  return (...args) => {',
        '    const key = JSON.stringify(args);',
        '    if (cache.has(key)) return cache.get(key);',
        '    const result = fn(...args);',
        '    cache.set(key, result);',
        '    return result;',
        '  };',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'memoize()', difficulty: 'Core',
        prompt: 'Write <code>memoize(fn)</code> returning a wrapped function that calls <code>fn</code> at most once per distinct argument list and returns the cached result thereafter.<br>' +
          'Key the cache on <code>JSON.stringify(args)</code>.',
        starter: 'function memoize(fn) {\n  // return a caching wrapper\n}\n',
        solution: 'function memoize(fn) {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    return result;\n  };\n}',
        hints: ['Keep the <code>Map</code> in the closure so it persists between calls.',
                'Use <code>cache.has(key)</code> rather than checking the value — a cached <code>undefined</code> is still a hit.'],
        tests: { checks: [
          { name: 'repeated identical calls hit the cache', expose: ['memoize'],
            run: function (s) {
              var calls = 0;
              var f = s.memoize(function (n) { calls++; return n * 2; });
              f(5); f(5); f(5);
              return calls === 1 ? true : 'the underlying function ran ' + calls + ' times, expected 1';
            } },
          { name: 'different arguments still compute', expose: ['memoize'],
            run: function (s) {
              var calls = 0;
              var f = s.memoize(function (n) { calls++; return n * 2; });
              f(1); f(2); f(3);
              return calls === 3 ? true : 'expected 3 underlying calls, got ' + calls;
            } },
          { name: 'the cached value is correct', expose: ['memoize'],
            run: function (s) {
              var f = s.memoize(function (a, b) { return a + b; });
              if (f(2, 3) !== 5) return 'first call returned the wrong value';
              return f(2, 3) === 5 ? true : 'the cached call returned the wrong value';
            } },
          { name: 'multi-argument calls are keyed correctly', expose: ['memoize'],
            run: function (s) {
              var f = s.memoize(function (a, b) { return a - b; });
              if (f(5, 3) !== 2) return 'f(5,3) should be 2';
              return f(3, 5) === -2 ? true : 'f(3,5) returned a stale value — the key must include every argument';
            } }
        ] } },
      { id: 'e2', title: 'memoizeLimited()', difficulty: 'Core',
        prompt: 'Write <code>memoizeLimited(fn, max)</code>: the same idea, but the cache never holds more than <code>max</code> entries. When it would exceed the limit, evict the <strong>oldest</strong> entry.<br>' +
          '<span class="muted">A <code>Map</code> iterates in insertion order, so <code>cache.keys().next().value</code> is the oldest key.</span>',
        starter: 'function memoizeLimited(fn, max) {\n  // bounded cache, oldest evicted first\n}\n',
        solution: 'function memoizeLimited(fn, max) {\n  const cache = new Map();\n  return (...args) => {\n    const key = JSON.stringify(args);\n    if (cache.has(key)) return cache.get(key);\n    const result = fn(...args);\n    cache.set(key, result);\n    if (cache.size > max) cache.delete(cache.keys().next().value);\n    return result;\n  };\n}',
        hints: ['After inserting, check <code>cache.size &gt; max</code> and delete the first key.',
                '<code>cache.keys().next().value</code> gives the earliest-inserted key.'],
        tests: { checks: [
          { name: 'caching still works within the limit', expose: ['memoizeLimited'],
            run: function (s) {
              var calls = 0;
              var f = s.memoizeLimited(function (n) { calls++; return n; }, 3);
              f(1); f(1);
              return calls === 1 ? true : 'expected 1 underlying call, got ' + calls;
            } },
          { name: 'the oldest entry is evicted past the limit', expose: ['memoizeLimited'],
            run: function (s) {
              var calls = 0;
              var f = s.memoizeLimited(function (n) { calls++; return n; }, 2);
              f(1); f(2); f(3);      // inserting 3 evicts 1
              var before = calls;
              f(1);                  // must recompute
              if (calls !== before + 1) return 'key 1 should have been evicted and recomputed';
              return true;
            } },
          { name: 'recently used entries survive', expose: ['memoizeLimited'],
            run: function (s) {
              var calls = 0;
              var f = s.memoizeLimited(function (n) { calls++; return n; }, 2);
              f(1); f(2); f(3);
              var before = calls;
              f(3);                  // still cached
              return calls === before ? true : 'the newest entry should still be cached';
            } }
        ] } },
      { id: 'e3', title: 'Cached backtest scorer', difficulty: 'Stretch',
        prompt: 'A parameter sweep evaluates the same combinations repeatedly. Write <code>makeScorer(scoreFn)</code> returning an object:<ul>' +
          '<li><code>score(fast, slow)</code> — the memoized result of <code>scoreFn(fast, slow)</code></li>' +
          '<li><code>hits</code> and <code>misses</code> — counts of cache hits and underlying calls, readable as properties</li>' +
          '<li><code>clear()</code> — empties the cache and resets both counters to 0</li></ul>',
        expose: ['makeScorer'],
        starter: 'function makeScorer(scoreFn) {\n  // return { score, hits, misses, clear }\n}\n',
        solution: 'function makeScorer(scoreFn) {\n  const cache = new Map();\n  const api = {\n    hits: 0,\n    misses: 0,\n    score(fast, slow) {\n      const key = fast + ":" + slow;\n      if (cache.has(key)) { api.hits++; return cache.get(key); }\n      api.misses++;\n      const r = scoreFn(fast, slow);\n      cache.set(key, r);\n      return r;\n    },\n    clear() { cache.clear(); api.hits = 0; api.misses = 0; }\n  };\n  return api;\n}',
        hints: ['Build the returned object first, then have <code>score</code> update its own counters.',
                'Two numbers make a simple key: <code>fast + ":" + slow</code>.'],
        tests: { checks: [
          { name: 'the first call is a miss, the second a hit', expose: ['makeScorer'],
            run: function (s) {
              var sc = s.makeScorer(function (a, b) { return a + b; });
              sc.score(9, 21);
              if (sc.misses !== 1 || sc.hits !== 0) return 'after one call expected misses 1 hits 0, got ' + sc.misses + '/' + sc.hits;
              sc.score(9, 21);
              return (sc.misses === 1 && sc.hits === 1) ? true : 'after two identical calls expected misses 1 hits 1, got ' + sc.misses + '/' + sc.hits;
            } },
          { name: 'results are correct', expose: ['makeScorer'],
            run: function (s) {
              var sc = s.makeScorer(function (a, b) { return a * b; });
              return (sc.score(3, 4) === 12 && sc.score(3, 4) === 12) ? true : 'the score value is wrong';
            } },
          { name: 'different parameters are separate entries', expose: ['makeScorer'],
            run: function (s) {
              var sc = s.makeScorer(function (a, b) { return a - b; });
              sc.score(1, 2); sc.score(2, 1);
              return sc.misses === 2 ? true : 'expected 2 misses for 2 distinct parameter pairs, got ' + sc.misses;
            } },
          { name: 'clear() empties the cache and the counters', expose: ['makeScorer'],
            run: function (s) {
              var sc = s.makeScorer(function (a, b) { return a + b; });
              sc.score(1, 1); sc.score(1, 1);
              sc.clear();
              if (sc.hits !== 0 || sc.misses !== 0) return 'clear() should reset both counters';
              sc.score(1, 1);
              return sc.misses === 1 ? true : 'after clear() the same call should be a miss again';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Which function is safe to memoize?',
        options: ['<code>getCurrentPrice()</code>', '<code>sma(series, period)</code> on immutable input', '<code>placeOrder(o)</code>', '<code>Math.random()</code>'],
        answer: 1,
        explain: 'Only pure functions. Caching anything that depends on time or has side effects makes it wrong.' },
      { q: 'Why check <code>cache.has(key)</code> rather than <code>cache.get(key) !== undefined</code>?',
        options: ['It is faster', 'A legitimately cached <code>undefined</code> would look like a miss', 'get() throws on missing keys', 'No difference'],
        answer: 1,
        explain: 'Otherwise every call returning <code>undefined</code> recomputes forever.' },
      { q: 'What is the cost of memoization?',
        options: ['Nothing', 'Memory, and staleness if the inputs change', 'CPU', 'It breaks closures'],
        answer: 1,
        explain: 'An unbounded cache is a memory leak, and a cached result of mutated input is silently wrong.' }
    ],
    recap: [
      'Memoization trades memory for time on pure functions.',
      'Key on the arguments; <code>JSON.stringify</code> is the pragmatic default.',
      'Use <code>has</code>, not a truthiness check, to detect a hit.',
      'Bound the cache, or it becomes a leak.'
    ],
    vocab: [
      { term: 'Parameter sweep', def: 'Running a strategy across many parameter combinations to see how performance varies. The main consumer of caching — and the main source of overfitting.' }
    ]
  });


  C.push({
    id: 'd040', day: 40, module: 3, minutes: 35, boss: true,
    title: 'Boss: Strategy Engine v1',
    subtitle: 'Rules, state and risk, wired into one object that trades a series.',
    goal: '<b>Goal:</b> build a class that walks a price series bar by bar, opens and closes a position by rule, and reports what happened.',
    objectives: [
      'Model a strategy as a class with explicit state',
      'Separate the signal rule from the execution logic',
      'Apply a stop and a target on every bar',
      'Return a trade log the analytics from day 20 can consume'
    ],
    sections: [
      { h: 'The three parts of any engine',
        body: '<p>Every backtester, however sophisticated, is these three things in a loop:</p>' +
              '<ol><li><strong>Signal</strong> — given the data so far, what does the rule say?</li>' +
              '<li><strong>Execution</strong> — given the signal and the current position, what changes?</li>' +
              '<li><strong>Accounting</strong> — record the fills so the result can be measured.</li></ol>' +
              '<p>Keeping them separate is what lets you swap the rule without touching the risk logic, and test each piece alone.</p>' },
      { h: 'State lives in one place',
        body: '<p>The engine holds the position, the trade log and nothing else that matters. Everything derived — P&L, win rate — is computed from the log afterwards rather than tracked in parallel, so the two can never disagree.</p>',
        code: 'class MiniEngine {\n  constructor() {\n    this.position = null;   // null = flat\n    this.trades = [];\n  }\n  enter(bar, side) {\n    this.position = { side, entry: bar.close, entryIndex: bar.index };\n  }\n  exit(bar, reason) {\n    const p = this.position;\n    const points = p.side === "long" ? bar.close - p.entry : p.entry - bar.close;\n    this.trades.push({ ...p, exit: bar.close, points, reason });\n    this.position = null;\n  }\n}\nconsole.log("state:", new MiniEngine().position);' },
      { h: 'Exit checks come before entry checks',
        body: '<p>On each bar, first ask whether the open position should close, then whether a new one should open. Reversing that order lets a strategy hold two positions at once, or exit and re-enter on the same bar without the exit ever being recorded.</p>' +
              '<div class="note note-warn"><b>Use the bar you are on, not the one after</b>Deciding on bar <em>i</em>\'s close and filling at bar <em>i</em>\'s close is a simplification every teaching backtester makes. It is still look-ahead-free as long as the signal only reads bars up to <em>i</em>. Filling at <em>i</em>\'s <em>open</em> using <em>i</em>\'s close is not — and it is the single most common way a backtest lies.</div>' },
      { h: 'Stops and targets',
        body: '<p>A stop and a target are checked against the bar\'s <code>low</code> and <code>high</code>, not its close: price traded there even if it did not settle there. When both could have been hit in one bar, the honest assumption is that the <em>stop</em> hit first.</p>',
        code: 'function exitReason(bar, pos) {\n  if (pos.side === "long") {\n    if (bar.low <= pos.stop) return "stop";\n    if (bar.high >= pos.target) return "target";\n  } else {\n    if (bar.high >= pos.stop) return "stop";\n    if (bar.low <= pos.target) return "target";\n  }\n  return null;\n}\nconsole.log(exitReason({ high: 12, low: 8 }, { side: "long", stop: 9, target: 11 }));' }
    ],
    parsons: {
      prompt: 'Check whether a long position was stopped or hit its target on this bar.',
      lines: [
        'function exitReason(bar, pos) {',
        '  if (bar.low <= pos.stop) return "stop";',
        '  if (bar.high >= pos.target) return "target";',
        '  return null;',
        '}',
        'console.log(exitReason({ high: 12, low: 8 }, { stop: 9, target: 11 }));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'exitReason()', difficulty: 'Boss · part 1',
        prompt: 'Write <code>exitReason(bar, position)</code> returning <code>"stop"</code>, <code>"target"</code> or <code>null</code>.<ul>' +
          '<li>A <strong>long</strong> stops out when <code>bar.low &lt;= stop</code>, and takes profit when <code>bar.high &gt;= target</code>.</li>' +
          '<li>A <strong>short</strong> stops out when <code>bar.high &gt;= stop</code>, and takes profit when <code>bar.low &lt;= target</code>.</li>' +
          '<li>If both are possible in the same bar, return <code>"stop"</code> — the pessimistic assumption.</li></ul>',
        starter: 'function exitReason(bar, position) {\n  // "stop", "target" or null\n}\n',
        solution: 'function exitReason(bar, position) {\n  if (position.side === "long") {\n    if (bar.low <= position.stop) return "stop";\n    if (bar.high >= position.target) return "target";\n  } else {\n    if (bar.high >= position.stop) return "stop";\n    if (bar.low <= position.target) return "target";\n  }\n  return null;\n}',
        hints: ['Check the stop before the target so an ambiguous bar resolves pessimistically.',
                'The comparisons mirror for a short: stop above, target below.'],
        tests: { fn: 'exitReason', cases: [
          { args: [{ high: 12, low: 8 }, { side: 'long', stop: 9, target: 15 }], expect: 'stop' },
          { args: [{ high: 12, low: 10 }, { side: 'long', stop: 9, target: 11 }], expect: 'target' },
          { args: [{ high: 12, low: 8 }, { side: 'long', stop: 9, target: 11 }], expect: 'stop',
            name: 'both hit in one bar resolves to the stop' },
          { args: [{ high: 12, low: 10 }, { side: 'long', stop: 9, target: 15 }], expect: null },
          { args: [{ high: 12, low: 8 }, { side: 'short', stop: 11, target: 5 }], expect: 'stop' },
          { args: [{ high: 12, low: 4 }, { side: 'short', stop: 15, target: 5 }], expect: 'target' },
          { args: [{ high: 16, low: 4 }, { side: 'short', stop: 15, target: 5 }], expect: 'stop',
            name: 'a short with both hit also resolves to the stop' }
        ] } },
      { id: 'e2', title: 'class Strategy', difficulty: 'Boss · part 2',
        prompt: 'Define a class <code>Strategy</code> that walks a series.<ul>' +
          '<li><code>constructor(signalFn, { stopPoints, targetPoints })</code> — store them; start flat with an empty trade log</li>' +
          '<li><code>onBar(bar, index)</code> — first, if a position is open, check the stop and target and close it if either is hit; then, if flat, call <code>signalFn(bar, index)</code> and open a position on <code>"long"</code> or <code>"short"</code></li>' +
          '<li>Entry price is <code>bar.close</code>; the stop and target are that many points away in the right direction</li>' +
          '<li>Closed trades are pushed to <code>this.trades</code> as <code>{ side, entry, exit, points, reason, entryIndex, exitIndex }</code></li></ul>' +
          '<span class="muted">Exit price is the stop or target level itself, not the bar close. Reuse <code>exitReason</code> — it is in the starter.</span>',
        expose: ['Strategy'],
        starter: 'function exitReason(bar, position) {\n  if (position.side === "long") {\n    if (bar.low <= position.stop) return "stop";\n    if (bar.high >= position.target) return "target";\n  } else {\n    if (bar.high >= position.stop) return "stop";\n    if (bar.low <= position.target) return "target";\n  }\n  return null;\n}\n\nclass Strategy {\n  constructor(signalFn, { stopPoints, targetPoints }) {\n    // store config, start flat, empty log\n  }\n\n  onBar(bar, index) {\n    // exit checks first, then entry\n  }\n}\n',
        solution: 'function exitReason(bar, position) {\n  if (position.side === "long") {\n    if (bar.low <= position.stop) return "stop";\n    if (bar.high >= position.target) return "target";\n  } else {\n    if (bar.high >= position.stop) return "stop";\n    if (bar.low <= position.target) return "target";\n  }\n  return null;\n}\n\nclass Strategy {\n  constructor(signalFn, { stopPoints, targetPoints }) {\n    this.signalFn = signalFn;\n    this.stopPoints = stopPoints;\n    this.targetPoints = targetPoints;\n    this.position = null;\n    this.trades = [];\n  }\n\n  onBar(bar, index) {\n    if (this.position) {\n      const reason = exitReason(bar, this.position);\n      if (reason) {\n        const p = this.position;\n        const exit = reason === "stop" ? p.stop : p.target;\n        const points = p.side === "long" ? exit - p.entry : p.entry - exit;\n        this.trades.push({ side: p.side, entry: p.entry, exit, points, reason,\n          entryIndex: p.entryIndex, exitIndex: index });\n        this.position = null;\n      }\n    }\n    if (!this.position) {\n      const signal = this.signalFn(bar, index);\n      if (signal === "long" || signal === "short") {\n        const entry = bar.close;\n        const dir = signal === "long" ? 1 : -1;\n        this.position = {\n          side: signal, entry, entryIndex: index,\n          stop: entry - dir * this.stopPoints,\n          target: entry + dir * this.targetPoints\n        };\n      }\n    }\n  }\n}',
        hints: ['A direction multiplier keeps the stop/target arithmetic to one line: <code>dir = side === "long" ? 1 : -1</code>.',
                'The stop is <code>entry - dir * stopPoints</code> and the target is <code>entry + dir * targetPoints</code>.',
                'After closing a position on this bar, the <code>if (!this.position)</code> check lets a new entry happen on the same bar.'],
        tests: { checks: [
          { name: 'starts flat with an empty trade log', expose: ['Strategy'],
            run: function (s) {
              var st = new s.Strategy(function () { return null; }, { stopPoints: 5, targetPoints: 10 });
              return (st.position === null && Array.isArray(st.trades) && st.trades.length === 0)
                ? true : 'expected position null and trades []';
            } },
          { name: 'a long signal opens a position with the right stop and target', expose: ['Strategy'],
            run: function (s) {
              var st = new s.Strategy(function () { return 'long'; }, { stopPoints: 5, targetPoints: 10 });
              st.onBar({ open: 100, high: 100, low: 100, close: 100 }, 0);
              if (!st.position) return 'no position was opened';
              if (st.position.entry !== 100) return 'entry should be the bar close';
              if (st.position.stop !== 95) return 'a long stop should be 5 below entry, got ' + st.position.stop;
              return st.position.target === 110 ? true : 'a long target should be 10 above entry, got ' + st.position.target;
            } },
          { name: 'a short signal mirrors the levels', expose: ['Strategy'],
            run: function (s) {
              var st = new s.Strategy(function () { return 'short'; }, { stopPoints: 5, targetPoints: 10 });
              st.onBar({ open: 100, high: 100, low: 100, close: 100 }, 0);
              if (st.position.stop !== 105) return 'a short stop should be above entry, got ' + st.position.stop;
              return st.position.target === 90 ? true : 'a short target should be below entry, got ' + st.position.target;
            } },
          { name: 'a stopped-out long is logged correctly', expose: ['Strategy'],
            run: function (s) {
              var n = 0;
              var st = new s.Strategy(function () { return n++ === 0 ? 'long' : null; }, { stopPoints: 5, targetPoints: 10 });
              st.onBar({ open: 100, high: 100, low: 100, close: 100 }, 0);
              st.onBar({ open: 99, high: 99, low: 90, close: 92 }, 1);
              if (st.trades.length !== 1) return 'expected 1 closed trade, got ' + st.trades.length;
              var t = st.trades[0];
              if (t.reason !== 'stop') return 'reason should be "stop", got ' + t.reason;
              if (t.exit !== 95) return 'a stopped exit fills at the stop level 95, got ' + t.exit;
              if (t.points !== -5) return 'points should be -5, got ' + t.points;
              if (t.entryIndex !== 0 || t.exitIndex !== 1) return 'entryIndex/exitIndex are wrong';
              return st.position === null ? true : 'the position should be flat after a stop';
            } },
          { name: 'a target hit on a short is logged correctly', expose: ['Strategy'],
            run: function (s) {
              var n = 0;
              var st = new s.Strategy(function () { return n++ === 0 ? 'short' : null; }, { stopPoints: 5, targetPoints: 10 });
              st.onBar({ open: 100, high: 100, low: 100, close: 100 }, 0);
              st.onBar({ open: 99, high: 101, low: 88, close: 90 }, 1);
              if (st.trades.length !== 1) return 'expected 1 closed trade, got ' + st.trades.length;
              var t = st.trades[0];
              if (t.reason !== 'target') return 'reason should be "target", got ' + t.reason;
              if (t.exit !== 90) return 'a short target exit fills at 90, got ' + t.exit;
              return t.points === 10 ? true : 'points should be +10, got ' + t.points;
            } },
          { name: 'never holds two positions at once', expose: ['Strategy'],
            run: function (s) {
              var st = new s.Strategy(function () { return 'long'; }, { stopPoints: 5, targetPoints: 10 });
              st.onBar({ open: 100, high: 100, low: 100, close: 100 }, 0);
              var first = st.position.entry;
              st.onBar({ open: 101, high: 101, low: 99, close: 101 }, 1);
              return st.position.entry === first ? true : 'the open position was replaced instead of held';
            } },
          { name: 'no signal means no trades', expose: ['Strategy'],
            run: function (s) {
              var st = new s.Strategy(function () { return null; }, { stopPoints: 5, targetPoints: 10 });
              st.onBar({ open: 100, high: 110, low: 90, close: 100 }, 0);
              return (st.position === null && st.trades.length === 0) ? true : 'a null signal should do nothing';
            } }
        ] } },
      { id: 'e3', title: 'runBacktest()', difficulty: 'Boss · final',
        prompt: 'Write <code>runBacktest(bars, signalFn, config)</code> that feeds every bar to a <code>Strategy</code> and returns:<br>' +
          '<code>{ trades, netPoints, wins, losses, winRate }</code><ul>' +
          '<li><code>trades</code> — the closed trade log</li>' +
          '<li><code>netPoints</code> — the sum of every trade\'s points</li>' +
          '<li><code>wins</code>/<code>losses</code> — trades with points above / below 0</li>' +
          '<li><code>winRate</code> — wins ÷ trades, or <code>0</code> when there were none</li></ul>' +
          '<span class="muted">The <code>Strategy</code> class and <code>exitReason</code> are supplied in the starter.</span>',
        starter: 'function exitReason(bar, position) {\n  if (position.side === "long") {\n    if (bar.low <= position.stop) return "stop";\n    if (bar.high >= position.target) return "target";\n  } else {\n    if (bar.high >= position.stop) return "stop";\n    if (bar.low <= position.target) return "target";\n  }\n  return null;\n}\n\nclass Strategy {\n  constructor(signalFn, { stopPoints, targetPoints }) {\n    this.signalFn = signalFn;\n    this.stopPoints = stopPoints;\n    this.targetPoints = targetPoints;\n    this.position = null;\n    this.trades = [];\n  }\n  onBar(bar, index) {\n    if (this.position) {\n      const reason = exitReason(bar, this.position);\n      if (reason) {\n        const p = this.position;\n        const exit = reason === "stop" ? p.stop : p.target;\n        const points = p.side === "long" ? exit - p.entry : p.entry - exit;\n        this.trades.push({ side: p.side, entry: p.entry, exit, points, reason,\n          entryIndex: p.entryIndex, exitIndex: index });\n        this.position = null;\n      }\n    }\n    if (!this.position) {\n      const signal = this.signalFn(bar, index);\n      if (signal === "long" || signal === "short") {\n        const entry = bar.close;\n        const dir = signal === "long" ? 1 : -1;\n        this.position = { side: signal, entry, entryIndex: index,\n          stop: entry - dir * this.stopPoints, target: entry + dir * this.targetPoints };\n      }\n    }\n  }\n}\n\nfunction runBacktest(bars, signalFn, config) {\n  // drive the strategy and summarise\n}\n',
        solution: 'function exitReason(bar, position) {\n  if (position.side === "long") {\n    if (bar.low <= position.stop) return "stop";\n    if (bar.high >= position.target) return "target";\n  } else {\n    if (bar.high >= position.stop) return "stop";\n    if (bar.low <= position.target) return "target";\n  }\n  return null;\n}\n\nclass Strategy {\n  constructor(signalFn, { stopPoints, targetPoints }) {\n    this.signalFn = signalFn;\n    this.stopPoints = stopPoints;\n    this.targetPoints = targetPoints;\n    this.position = null;\n    this.trades = [];\n  }\n  onBar(bar, index) {\n    if (this.position) {\n      const reason = exitReason(bar, this.position);\n      if (reason) {\n        const p = this.position;\n        const exit = reason === "stop" ? p.stop : p.target;\n        const points = p.side === "long" ? exit - p.entry : p.entry - exit;\n        this.trades.push({ side: p.side, entry: p.entry, exit, points, reason,\n          entryIndex: p.entryIndex, exitIndex: index });\n        this.position = null;\n      }\n    }\n    if (!this.position) {\n      const signal = this.signalFn(bar, index);\n      if (signal === "long" || signal === "short") {\n        const entry = bar.close;\n        const dir = signal === "long" ? 1 : -1;\n        this.position = { side: signal, entry, entryIndex: index,\n          stop: entry - dir * this.stopPoints, target: entry + dir * this.targetPoints };\n      }\n    }\n  }\n}\n\nfunction runBacktest(bars, signalFn, config) {\n  const strat = new Strategy(signalFn, config);\n  bars.forEach((bar, i) => strat.onBar(bar, i));\n  const trades = strat.trades;\n  const netPoints = trades.reduce((a, t) => a + t.points, 0);\n  const wins = trades.filter(t => t.points > 0).length;\n  const losses = trades.filter(t => t.points < 0).length;\n  return { trades, netPoints, wins, losses, winRate: trades.length ? wins / trades.length : 0 };\n}',
        hints: ['Create one <code>Strategy</code>, then <code>forEach</code> over the bars passing the index.',
                'Every summary number comes from <code>strat.trades</code> using the array methods from module 2.',
                'Guard the empty case so <code>winRate</code> is 0 rather than NaN.'],
        tests: { fn: 'runBacktest', approx: 1e-9, cases: [
          { args: [[{ open: 100, high: 100, low: 100, close: 100 },
                    { open: 100, high: 115, low: 100, close: 112 }],
                   function (bar, i) { return i === 0 ? 'long' : null; },
                   { stopPoints: 5, targetPoints: 10 }],
            check: function (r) {
              if (r.trades.length !== 1) return 'expected 1 trade, got ' + r.trades.length;
              if (r.trades[0].reason !== 'target') return 'the trade should have hit its target';
              if (r.netPoints !== 10) return 'netPoints should be 10, got ' + r.netPoints;
              if (r.wins !== 1 || r.losses !== 0) return 'expected 1 win and 0 losses';
              return r.winRate === 1 ? true : 'winRate should be 1, got ' + r.winRate;
            }, name: 'a single winning trade is summarised correctly' },
          { args: [[{ open: 100, high: 100, low: 100, close: 100 },
                    { open: 100, high: 100, low: 90, close: 92 }],
                   function (bar, i) { return i === 0 ? 'long' : null; },
                   { stopPoints: 5, targetPoints: 10 }],
            check: function (r) {
              if (r.netPoints !== -5) return 'netPoints should be -5, got ' + r.netPoints;
              if (r.losses !== 1) return 'expected 1 loss';
              return r.winRate === 0 ? true : 'winRate should be 0, got ' + r.winRate;
            }, name: 'a single losing trade is summarised correctly' },
          { args: [[{ open: 100, high: 101, low: 99, close: 100 }],
                   function () { return null; }, { stopPoints: 5, targetPoints: 10 }],
            expect: { trades: [], netPoints: 0, wins: 0, losses: 0, winRate: 0 },
            name: 'no signals produces an empty, NaN-free summary' },
          { args: [[], function () { return 'long'; }, { stopPoints: 5, targetPoints: 10 }],
            expect: { trades: [], netPoints: 0, wins: 0, losses: 0, winRate: 0 },
            name: 'an empty series is handled' }
        ] } }
    ],
    quiz: [
      { q: 'Why check exits before entries on each bar?',
        options: ['Performance', 'Otherwise a strategy can hold two positions, or re-enter without the exit being recorded', 'It is arbitrary', 'To avoid NaN'],
        answer: 1,
        explain: 'Order of operations inside the bar loop is a real part of the model, not an implementation detail.' },
      { q: 'A bar\'s range covers both the stop and the target. What should a backtest assume?',
        options: ['The target hit first', 'The stop hit first', 'Split the difference', 'Skip the bar'],
        answer: 1,
        explain: 'Bar data cannot tell you the order. Assuming the stop keeps the backtest honest — the optimistic assumption inflates every result.' },
      { q: 'Why compute win rate from the trade log rather than tracking it as the engine runs?',
        options: ['It is faster', 'One source of truth — a separate counter can drift out of sync with the log', 'Counters are not allowed', 'It uses less memory'],
        answer: 1,
        explain: 'Derive everything from the log and the numbers can never contradict each other.' }
    ],
    recap: [
      'An engine is signal, execution and accounting, kept separate.',
      'Exit checks run before entry checks on every bar.',
      'Stops and targets are checked against the bar\'s high and low.',
      'Derive statistics from the trade log, never in parallel with it.'
    ],
    vocab: [
      { term: 'Backtest', def: 'Replaying a strategy over historical data to estimate how it would have performed. Easy to run, hard to run honestly.' },
      { term: 'Fill assumption', def: 'The rule a backtest uses to decide what price a trade got. Optimistic fill assumptions are the most common way results are inflated.' }
    ]
  });

  C.push({
    id: 'd041', day: 41, module: 3, minutes: 25,
    title: 'Modules and Code Organisation',
    subtitle: 'Splitting a growing system into files that stay understandable.',
    goal: '<b>Goal:</b> structure a trading codebase so each piece can be found, tested and replaced on its own.',
    objectives: [
      'Use <code>export</code> and <code>import</code>',
      'Contrast named and default exports',
      'Recognise the module pattern in older code',
      'Split a system along the right seams'
    ],
    sections: [
      { h: 'ES modules',
        body: '<p>Each file is its own scope. Nothing is visible to another file unless it is exported, and nothing is available in a file unless it is imported.</p>',
        code: '// --- indicators.js ---\n// export function sma(series, n) { ... }\n// export function ema(series, n) { ... }\n// export const DEFAULT_PERIOD = 20;\n\n// --- strategy.js ---\n// import { sma, ema, DEFAULT_PERIOD } from "./indicators.js";\n// import { sma as simpleMovingAverage } from "./indicators.js";  // rename\n\nconsole.log("Modules are loaded with <script type=\\"module\\"> in a browser.");' },
      { h: 'Named vs default',
        body: '<p>Named exports document themselves at the import site and survive renaming tools. A default export is one anonymous thing per file, which every importer is free to call something different.</p>' +
              '<div class="note note-tip"><b>Prefer named exports</b>With named exports, searching the codebase for <code>calculateRsi</code> finds every use. With defaults, the same function may be <code>rsi</code>, <code>RSI</code> and <code>calcRsi</code> in three different files.</div>',
        code: '// export default class Engine { }        -> import Engine from "./engine.js"\n// export class Engine { }                -> import { Engine } from "./engine.js"\n\nconsole.log("Named exports keep one canonical name per thing.");' },
      { h: 'The module pattern, before modules existed',
        body: '<p>This whole site is built the older way: an IIFE that keeps its internals private and attaches one object to <code>window</code>. You will meet it constantly in existing code, and it does the same job.</p>',
        code: 'const Indicators = (function () {\n  const cache = new Map();          // private\n\n  function sma(series, n) {\n    return series.slice(-n).reduce((a, v) => a + v, 0) / n;\n  }\n\n  return { sma };                    // the public surface\n})();\n\nconsole.log(Indicators.sma([1, 2, 3, 4], 2));\nconsole.log(Indicators.cache);       // undefined — private' },
      { h: 'Splitting along the right seams',
        body: '<p>Group by what a file is <em>about</em>, not by what kind of thing it contains. A trading system splits naturally into layers that each depend only on the ones above:</p>' +
              '<table><tr><th>File</th><th>Owns</th><th>Depends on</th></tr>' +
              '<tr><td><code>data.js</code></td><td>loading and cleaning bars</td><td>nothing</td></tr>' +
              '<tr><td><code>indicators.js</code></td><td>pure series transforms</td><td>nothing</td></tr>' +
              '<tr><td><code>signals.js</code></td><td>rules over indicators</td><td>indicators</td></tr>' +
              '<tr><td><code>risk.js</code></td><td>sizing and limits</td><td>nothing</td></tr>' +
              '<tr><td><code>engine.js</code></td><td>the bar loop</td><td>signals, risk</td></tr>' +
              '<tr><td><code>report.js</code></td><td>statistics and output</td><td>nothing</td></tr></table>' +
              '<p>If <code>indicators.js</code> ever needs to import <code>engine.js</code>, the seam is in the wrong place.</p>' }
    ],
    parsons: {
      prompt: 'Build a module with a private cache and a public function.',
      lines: [
        'const Indicators = (function () {',
        '  const cache = new Map();',
        '  function sma(series, n) {',
        '    return series.slice(-n).reduce((a, v) => a + v, 0) / n;',
        '  }',
        '  return { sma };',
        '})();',
        'console.log(Indicators.sma([1, 2, 3, 4], 2));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'A module with a private counter', difficulty: 'Core',
        prompt: 'Build <code>OrderIds</code> using the module pattern (an IIFE assigned to a const).<br>' +
          'It exposes exactly two functions and keeps its counter private:<ul>' +
          '<li><code>next()</code> — returns 1, then 2, then 3…</li>' +
          '<li><code>reset()</code> — restarts at 1</li></ul>' +
          'The counter itself must not be reachable from outside.',
        expose: ['OrderIds'],
        starter: 'const OrderIds = (function () {\n  // private state and the public surface\n})();\n',
        solution: 'const OrderIds = (function () {\n  let n = 0;\n  function next() { return ++n; }\n  function reset() { n = 0; }\n  return { next, reset };\n})();',
        hints: ['Declare the counter inside the IIFE, before the returned object.',
                'Return only <code>{ next, reset }</code> so the counter stays private.'],
        tests: { checks: [
          { name: 'next() counts from 1', expose: ['OrderIds'],
            run: function (s) {
              s.OrderIds.reset();
              var a = s.OrderIds.next(), b = s.OrderIds.next();
              return (a === 1 && b === 2) ? true : 'got ' + a + ' then ' + b;
            } },
          { name: 'reset() restarts the sequence', expose: ['OrderIds'],
            run: function (s) {
              s.OrderIds.next(); s.OrderIds.next();
              s.OrderIds.reset();
              return s.OrderIds.next() === 1 ? true : 'reset() did not restart the counter';
            } },
          { name: 'only next and reset are exposed', expose: ['OrderIds'],
            run: function (s) {
              var keys = Object.keys(s.OrderIds).sort();
              return (keys.length === 2 && keys[0] === 'next' && keys[1] === 'reset')
                ? true : 'the public surface is ' + JSON.stringify(keys) + ' — keep the counter private';
            } }
        ] } },
      { id: 'e2', title: 'A namespaced indicators module', difficulty: 'Core',
        prompt: 'Build <code>Indicators</code> the same way, exposing three pure functions:<ul>' +
          '<li><code>sma(series, n)</code> — mean of the last <code>n</code>, or <code>null</code> if the series is shorter than <code>n</code></li>' +
          '<li><code>change(series)</code> — last value minus first, or <code>0</code> for fewer than 2 values</li>' +
          '<li><code>range(series)</code> — max minus min, or <code>0</code> when empty</li></ul>' +
          'Nothing else may be visible on the returned object.',
        expose: ['Indicators'],
        starter: 'const Indicators = (function () {\n  // three pure functions, exposed as a namespace\n})();\n',
        solution: 'const Indicators = (function () {\n  function sma(series, n) {\n    if (series.length < n) return null;\n    return series.slice(-n).reduce((a, v) => a + v, 0) / n;\n  }\n  function change(series) {\n    return series.length < 2 ? 0 : series[series.length - 1] - series[0];\n  }\n  function range(series) {\n    return series.length ? Math.max(...series) - Math.min(...series) : 0;\n  }\n  return { sma, change, range };\n})();',
        hints: ['Define all three inside the IIFE and return them in one object literal.',
                'Each has an edge case to guard — check it first and return early.'],
        tests: { checks: [
          { name: 'sma works and guards a short series', expose: ['Indicators'],
            run: function (s) {
              if (s.Indicators.sma([1, 2, 3, 4], 2) !== 3.5) return 'sma([1,2,3,4],2) should be 3.5';
              return s.Indicators.sma([1], 5) === null ? true : 'too few values should give null';
            } },
          { name: 'change works and guards short input', expose: ['Indicators'],
            run: function (s) {
              if (s.Indicators.change([10, 12, 15]) !== 5) return 'change([10,12,15]) should be 5';
              if (s.Indicators.change([7]) !== 0) return 'a single value should give 0';
              return s.Indicators.change([]) === 0 ? true : 'an empty series should give 0';
            } },
          { name: 'range works and guards empty input', expose: ['Indicators'],
            run: function (s) {
              if (s.Indicators.range([10, 14, 9]) !== 5) return 'range([10,14,9]) should be 5';
              return s.Indicators.range([]) === 0 ? true : 'an empty series should give 0';
            } },
          { name: 'exposes exactly the three functions', expose: ['Indicators'],
            run: function (s) {
              var keys = Object.keys(s.Indicators).sort();
              return (keys.join(',') === 'change,range,sma')
                ? true : 'the public surface is ' + JSON.stringify(keys);
            } }
        ] } },
      { id: 'e3', title: 'Wire the layers together', difficulty: 'Stretch',
        prompt: 'You are given <code>Indicators</code> and <code>Risk</code> modules in the starter.<br>' +
          'Build a third, <code>Engine</code>, exposing one function <code>plan(series, equity)</code> that returns:<br>' +
          '<code>{ signal, contracts }</code><ul>' +
          '<li><code>signal</code> — <code>"long"</code> when the last value is above the 3-period SMA, <code>"short"</code> when below, <code>"flat"</code> when equal or the SMA is unavailable</li>' +
          '<li><code>contracts</code> — <code>Risk.size(equity, 8)</code> when there is a signal, <code>0</code> when flat</li></ul>' +
          'Engine may use the other two modules, but must not reimplement what they do.',
        expose: ['Engine'],
        starter: 'const Indicators = (function () {\n  function sma(series, n) {\n    if (series.length < n) return null;\n    return series.slice(-n).reduce((a, v) => a + v, 0) / n;\n  }\n  return { sma };\n})();\n\nconst Risk = (function () {\n  function size(equity, stopPoints) {\n    if (stopPoints <= 0) return 0;\n    return Math.max(0, Math.floor(equity * 0.01 / (stopPoints * 50)));\n  }\n  return { size };\n})();\n\nconst Engine = (function () {\n  // expose plan(series, equity)\n})();\n',
        solution: 'const Indicators = (function () {\n  function sma(series, n) {\n    if (series.length < n) return null;\n    return series.slice(-n).reduce((a, v) => a + v, 0) / n;\n  }\n  return { sma };\n})();\n\nconst Risk = (function () {\n  function size(equity, stopPoints) {\n    if (stopPoints <= 0) return 0;\n    return Math.max(0, Math.floor(equity * 0.01 / (stopPoints * 50)));\n  }\n  return { size };\n})();\n\nconst Engine = (function () {\n  function plan(series, equity) {\n    const avg = Indicators.sma(series, 3);\n    const last = series[series.length - 1];\n    let signal = "flat";\n    if (avg !== null) {\n      if (last > avg) signal = "long";\n      else if (last < avg) signal = "short";\n    }\n    return { signal, contracts: signal === "flat" ? 0 : Risk.size(equity, 8) };\n  }\n  return { plan };\n})();',
        hints: ['Call <code>Indicators.sma(series, 3)</code> and handle the <code>null</code> warm-up case as flat.',
                'Only ask <code>Risk.size</code> for a number when there is actually a signal.'],
        tests: { checks: [
          { name: 'a price above the SMA is a long', expose: ['Engine'],
            run: function (s) {
              var r = s.Engine.plan([10, 10, 16], 100000);
              return r.signal === 'long' ? true : 'expected "long", got ' + r.signal;
            } },
          { name: 'a price below the SMA is a short', expose: ['Engine'],
            run: function (s) {
              var r = s.Engine.plan([20, 20, 10], 100000);
              return r.signal === 'short' ? true : 'expected "short", got ' + r.signal;
            } },
          { name: 'too little data is flat with no contracts', expose: ['Engine'],
            run: function (s) {
              var r = s.Engine.plan([10, 12], 100000);
              if (r.signal !== 'flat') return 'expected "flat" during the warm-up, got ' + r.signal;
              return r.contracts === 0 ? true : 'a flat plan should size 0 contracts';
            } },
          { name: 'contracts come from the Risk module', expose: ['Engine'],
            run: function (s) {
              var r = s.Engine.plan([10, 10, 16], 400000);
              // 400000 * 0.01 / (8 * 50) = 10
              return r.contracts === 10 ? true : 'expected 10 contracts from Risk.size, got ' + r.contracts;
            } },
          { name: 'a price exactly at the SMA is flat', expose: ['Engine'],
            run: function (s) {
              var r = s.Engine.plan([10, 10, 10], 100000);
              return r.signal === 'flat' ? true : 'equal to the SMA should be flat, got ' + r.signal;
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is visible to other files by default in an ES module?',
        options: ['Everything', 'Nothing until it is exported', 'Only functions', 'Only <code>const</code>'],
        answer: 1,
        explain: 'Module scope is private by default, which is what makes files safe to reason about in isolation.' },
      { q: 'Why prefer named exports over a default export?',
        options: ['They are faster', 'One canonical name per thing, so searching and refactoring work', 'Defaults are deprecated', 'Named exports allow more per file'],
        answer: 1,
        explain: 'A default export can be imported under any name, so the same function ends up with several names across a codebase.' },
      { q: 'Your <code>indicators.js</code> needs to import <code>engine.js</code>. What does that tell you?',
        options: ['Nothing unusual', 'The seam is in the wrong place — indicators should not depend on the engine', 'You need a default export', 'You should merge the files'],
        answer: 1,
        explain: 'Dependencies should flow one way. A cycle means responsibilities are split along the wrong line.' }
    ],
    recap: [
      'Module scope is private until exported.',
      'Named exports keep one canonical name per thing.',
      'The IIFE module pattern does the same job in pre-module code.',
      'Split by responsibility, and keep dependencies flowing one way.'
    ],
    vocab: [
      { term: 'Separation of concerns', def: 'Each part of a system owns one job. In trading code it is what lets you change the signal without re-testing the risk logic.' }
    ]
  });

  C.push({
    id: 'd042', day: 42, module: 3, minutes: 30,
    title: 'Defensive Programming and Debugging',
    subtitle: 'Assertions, guards, and finding the bug you cannot see.',
    goal: '<b>Goal:</b> make wrong states impossible to reach quietly, and develop a method for locating a bug rather than guessing.',
    objectives: [
      'Validate inputs at the boundary of a module',
      'Write assertions that fail loudly and early',
      'Debug by bisection instead of by guesswork',
      'Detect silent <code>NaN</code> propagation'
    ],
    sections: [
      { h: 'Guard the boundary, trust the interior',
        body: '<p>Validate once, where data enters your system — the feed parser, the public function of a module. Internal helpers can then assume valid input, and stay readable.</p>',
        code: 'function loadBars(raw) {\n  if (!Array.isArray(raw)) throw new TypeError("bars must be an array");\n  return raw.map((b, i) => {\n    if (!Number.isFinite(b.close)) throw new TypeError(`bar ${i}: close is not a number`);\n    if (b.high < b.low) throw new RangeError(`bar ${i}: high is below low`);\n    return b;\n  });\n}\n\nconsole.log(loadBars([{ high: 2, low: 1, close: 1.5 }]).length);\ntry { loadBars([{ high: 1, low: 2, close: 1.5 }]); } catch (e) { console.log(e.name + ":", e.message); }' },
      { h: 'Assertions state what must be true',
        body: '<p>An assertion documents an invariant <em>and</em> checks it. It should never fire in correct code, which is exactly what makes it useful when it does.</p>',
        code: 'function assert(condition, message) {\n  if (!condition) throw new Error("Assertion failed: " + message);\n}\n\nfunction closePosition(position, price) {\n  assert(position !== null, "cannot close a flat position");\n  assert(Number.isFinite(price), "exit price must be a number");\n  return (price - position.entry) * position.qty;\n}\n\nconsole.log(closePosition({ entry: 100, qty: 1 }, 110));\ntry { closePosition(null, 110); } catch (e) { console.log(e.message); }' },
      { h: 'NaN is the silent killer',
        body: '<p><code>NaN</code> propagates through every arithmetic operation and is never equal to anything, including itself. One bad tick can turn an entire equity curve into <code>NaN</code> with no error thrown anywhere.</p>',
        code: 'const prices = [100, 102, NaN, 105];\nconst total = prices.reduce((a, p) => a + p, 0);\nconsole.log("total:", total);\nconsole.log("NaN === NaN:", NaN === NaN);\nconsole.log("detect it:", Number.isNaN(total));\n\nconst clean = prices.filter(Number.isFinite);\nconsole.log("cleaned total:", clean.reduce((a, p) => a + p, 0));' },
      { h: 'Debug by bisection, not by staring',
        body: '<p>When a number is wrong, do not read the code hoping to spot it. Halve the search space instead:</p>' +
              '<ol><li>Find the smallest input that reproduces it.</li>' +
              '<li>Print the value at the midpoint of the pipeline. Is it already wrong?</li>' +
              '<li>If yes, the bug is upstream; if no, downstream. Repeat.</li></ol>' +
              '<p>Each check halves the remaining code. Ten checks isolate a bug in a thousand lines.</p>' +
              '<div class="note note-tip"><b>Cheap tools that beat a debugger</b><code>console.table(rows)</code> for arrays of objects. <code>console.log({a, b, c})</code> prints names with values. <code>console.time/timeEnd</code> for the "why is this slow" question.</div>' }
    ],
    parsons: {
      prompt: 'Write a tiny assert helper and use it.',
      lines: [
        'function assert(condition, message) {',
        '  if (!condition) throw new Error("Assertion failed: " + message);',
        '}',
        'assert(typeof 5 === "number", "must be a number");',
        'console.log("passed");'
      ]
    },
    exercises: [
      { id: 'e1', title: 'assert()', difficulty: 'Core',
        prompt: 'Write <code>assert(condition, message)</code> which does nothing when <code>condition</code> is truthy and throws an <code>Error</code> whose message is <code>"Assertion failed: "</code> followed by <code>message</code> otherwise.<br>' +
          'When no message is given, use <code>"Assertion failed"</code> exactly, with no trailing colon.',
        starter: 'function assert(condition, message) {\n  // throw when the condition is falsy\n}\n',
        solution: 'function assert(condition, message) {\n  if (!condition) {\n    throw new Error(message ? "Assertion failed: " + message : "Assertion failed");\n  }\n}',
        hints: ['One <code>if (!condition)</code> and a <code>throw</code>.',
                'Use a ternary to pick between the two message forms.'],
        tests: { checks: [
          { name: 'a true condition returns quietly', expose: ['assert'],
            run: function (s) {
              try { s.assert(true, 'fine'); return true; } catch (e) { return 'should not have thrown'; }
            } },
          { name: 'a false condition throws with the message', expose: ['assert'],
            run: function (s) {
              try { s.assert(false, 'qty must be positive'); } catch (e) {
                return e.message === 'Assertion failed: qty must be positive'
                  ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'should have thrown';
            } },
          { name: 'with no message the text is exactly "Assertion failed"', expose: ['assert'],
            run: function (s) {
              try { s.assert(false); } catch (e) {
                return e.message === 'Assertion failed' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'should have thrown';
            } },
          { name: 'falsy values other than false also throw', expose: ['assert'],
            run: function (s) {
              try { s.assert(0, 'zero'); } catch (e) { return true; }
              return '0 is falsy and should have thrown';
            } }
        ] } },
      { id: 'e2', title: 'validateBars()', difficulty: 'Core',
        prompt: 'Write <code>validateBars(bars)</code> returning an array of problem descriptions — empty when everything is fine.<br>' +
          'For each bar, in index order, report:<ul>' +
          '<li><code>"bar N: close is not a finite number"</code> when <code>close</code> is not finite</li>' +
          '<li><code>"bar N: high below low"</code> when <code>high &lt; low</code></li>' +
          '<li><code>"bar N: negative volume"</code> when <code>volume &lt; 0</code></li></ul>' +
          'A single bar may produce several problems; report them in the order listed above. <code>N</code> is the index.',
        starter: 'function validateBars(bars) {\n  // collect problem strings\n}\n',
        solution: 'function validateBars(bars) {\n  const problems = [];\n  bars.forEach((b, i) => {\n    if (!Number.isFinite(b.close)) problems.push(`bar ${i}: close is not a finite number`);\n    if (b.high < b.low) problems.push(`bar ${i}: high below low`);\n    if (b.volume < 0) problems.push(`bar ${i}: negative volume`);\n  });\n  return problems;\n}',
        hints: ['Collect into an array rather than throwing — a report of every problem is more useful than the first one.',
                '<code>forEach</code> gives you the index for the message.'],
        tests: { fn: 'validateBars', cases: [
          { args: [[{ close: 5, high: 6, low: 4, volume: 10 }]], expect: [] },
          { args: [[{ close: NaN, high: 6, low: 4, volume: 10 }]], expect: ['bar 0: close is not a finite number'] },
          { args: [[{ close: 5, high: 3, low: 4, volume: 10 }]], expect: ['bar 0: high below low'] },
          { args: [[{ close: 5, high: 6, low: 4, volume: -1 }]], expect: ['bar 0: negative volume'] },
          { args: [[{ close: 5, high: 6, low: 4, volume: 1 }, { close: Infinity, high: 3, low: 4, volume: -2 }]],
            expect: ['bar 1: close is not a finite number', 'bar 1: high below low', 'bar 1: negative volume'],
            name: 'one bad bar can report several problems, in order' },
          { args: [[]], expect: [] }
        ] } },
      { id: 'e3', title: 'findFirstNaN()', difficulty: 'Stretch',
        prompt: 'A pipeline of transforms turned a good series into <code>NaN</code>. Write <code>findFirstNaN(series, steps)</code> where <code>steps</code> is an array of functions, each taking an array and returning an array.<br>' +
          'Apply them in order and return the <strong>index of the first step</strong> whose output contains a non-finite number. Return <code>-1</code> if the pipeline stays clean.<br>' +
          'Do not run any step after the offending one.',
        starter: 'function findFirstNaN(series, steps) {\n  // index of the first step that produces a bad value, or -1\n}\n',
        solution: 'function findFirstNaN(series, steps) {\n  let current = series;\n  for (let i = 0; i < steps.length; i++) {\n    current = steps[i](current);\n    if (current.some(v => !Number.isFinite(v))) return i;\n  }\n  return -1;\n}',
        hints: ['Run the steps in a loop, checking the output after each one.',
                '<code>arr.some(v =&gt; !Number.isFinite(v))</code> detects NaN and both infinities.',
                'Return as soon as you find it so later steps never run.'],
        tests: { fn: 'findFirstNaN', cases: [
          { args: [[1, 2, 3], [function (a) { return a.map(function (x) { return x * 2; }); },
                              function (a) { return a.map(function (x) { return x + 1; }); }]],
            expect: -1, name: 'a clean pipeline returns -1' },
          { args: [[1, 2, 3], [function (a) { return a.map(function (x) { return x * 2; }); },
                              function (a) { return a.map(function (x) { return x / 0 - x / 0; }); },
                              function (a) { return a; }]],
            expect: 1, name: 'reports the index of the step that introduced NaN' },
          { args: [[1, 2], [function (a) { return a.map(function () { return Infinity; }); }]],
            expect: 0, name: 'Infinity counts as bad' },
          { args: [[1, 2], []], expect: -1, name: 'no steps means nothing to blame' }
        ], checks: [{
          name: 'stops before running later steps', expose: ['findFirstNaN'],
          run: function (s) {
            var ran = false;
            var idx = s.findFirstNaN([1, 2], [
              function (a) { return a.map(function () { return NaN; }); },
              function (a) { ran = true; return a; }
            ]);
            if (idx !== 0) return 'expected index 0, got ' + idx;
            return ran === false ? true : 'the step after the failure should not have run';
          }
        }] } }
    ],
    quiz: [
      { q: 'What is <code>NaN === NaN</code>?',
        options: ['<code>true</code>', '<code>false</code>', '<code>NaN</code>', 'A TypeError'],
        answer: 1,
        explain: 'NaN is not equal to anything, itself included. Detect it with <code>Number.isNaN</code> or <code>Number.isFinite</code>.' },
      { q: 'Where should input validation live?',
        options: ['In every function', 'At the boundary where data enters the system', 'Only in tests', 'Nowhere — trust the caller'],
        answer: 1,
        explain: 'Validate once at the edge; the interior then assumes valid data and stays readable.' },
      { q: 'What is bisection debugging?',
        options: ['Splitting the file in two', 'Checking the value at the midpoint of the pipeline to halve the search space each time', 'Running the code twice', 'Using two debuggers'],
        answer: 1,
        explain: 'Each check tells you which half the bug is in. Ten checks isolate a bug in a thousand lines — far faster than reading.' }
    ],
    recap: [
      'Validate at the boundary; assert invariants inside.',
      'Assertions should never fire in correct code.',
      '<code>NaN</code> spreads silently — detect it with <code>Number.isFinite</code>.',
      'Debug by halving the search space, not by rereading the code.'
    ],
    vocab: [
      { term: 'Bad tick', def: 'A corrupt or erroneous price in a data feed. Real history contains them, and one is enough to poison an entire backtest.' },
      { term: 'Fail fast', def: 'Stopping at the first sign of an invalid state rather than continuing and producing plausible-looking nonsense.' }
    ]
  });

})();
