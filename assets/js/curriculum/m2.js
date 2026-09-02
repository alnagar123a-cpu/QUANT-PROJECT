/* ============================================================
   MODULE 2 — Data & Collections (levels 15–28)
   ============================================================ */
(function () {
  'use strict';
  var C = window.CURRICULUM, CX = window.CX;

  C.push({
    id: 'd015', day: 15, module: 2, minutes: 30,
    title: 'map: Transforming a Series',
    subtitle: 'One in, one out — the workhorse of indicator code.',
    goal: '<b>Goal:</b> turn an array of bars into an array of derived values without writing a single loop.',
    objectives: [
      'Use <code>map</code> to produce a new array of the same length',
      'Read the <code>(item, index)</code> callback signature',
      'Replace an accumulate-and-push loop with one expression',
      'Understand that <code>map</code> never mutates the input'
    ],
    sections: [
      { h: 'map applies a function to every element',
        body: '<p>Every <code>for</code> loop that builds a second array of the same length is a <code>map</code> in disguise. The callback receives each element and returns its replacement.</p>',
        code: 'const bars2 = bars.slice(0, 4);\n\n// The loop you would have written yesterday\nconst closesLoop = [];\nfor (const b of bars2) closesLoop.push(b.close);\n\n// The same thing\nconst closesMap = bars2.map(b => b.close);\n\nconsole.log(closesLoop);\nconsole.log(closesMap);' },
      { h: 'The callback gets the index too',
        body: '<p>The full signature is <code>(item, index, array)</code>. You will almost always use the first, sometimes the second, and rarely the third.</p>',
        code: 'const closes4 = closes.slice(0, 4);\n\nconst labelled = closes4.map((c, i) => `bar ${i}: ${c.toFixed(2)}`);\nconsole.log(labelled);\n\n// bar-to-bar change needs the index and the array\nconst changes = closes4.map((c, i, arr) => i === 0 ? 0 : c - arr[i - 1]);\nconsole.log(changes.map(x => x.toFixed(2)));' },
      { h: 'map is pure: the original is untouched',
        body: '<p><code>map</code> always returns a <em>new</em> array of the same length. That is the guarantee that makes indicator pipelines safe to chain.</p>' +
              '<div class="note note-warn"><b>If you are not returning a value, you want forEach</b><code>map</code> without a <code>return</code> gives an array of <code>undefined</code>. When you only want a side effect (logging, drawing), use <code>forEach</code>.</div>',
        code: 'const prices = [100, 200, 300];\nconst doubled = prices.map(p => p * 2);\n\nconsole.log(prices);   // unchanged\nconsole.log(doubled);\n\nconst oops = prices.map(p => { p * 2; });  // no return\nconsole.log(oops);     // [undefined, undefined, undefined]' }
    ],
    parsons: {
      prompt: 'Convert a series of point moves into dollar moves for one ES contract.',
      lines: [
        'const moves = [1.25, -0.5, 2.0];',
        'const pointValue = 50;',
        'const dollars = moves.map(m => m * pointValue);',
        'console.log(dollars);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'toDollars()', difficulty: 'Core',
        prompt: 'Write <code>toDollars(points, pointValue)</code> which takes an array of point moves and returns a new array of dollar values.<br>' +
          'Use <code>map</code>, not a loop.',
        starter: 'function toDollars(points, pointValue) {\n  // map each point move to dollars\n}\n',
        solution: 'function toDollars(points, pointValue) {\n  return points.map(p => p * pointValue);\n}',
        hints: ['<code>arr.map(callback)</code> returns the new array — just return it.',
                'The callback is <code>p =&gt; p * pointValue</code>.'],
        tests: { fn: 'toDollars', approx: 1e-9, cases: [
          { args: [[1.25, -0.5, 2], 50], expect: [62.5, -25, 100] },
          { args: [[10], 20], expect: [200] },
          { args: [[], 50], expect: [] }
        ], source: [{ name: 'uses map', pattern: /\.map\s*\(/, why: 'this level is about map' },
                    { name: 'no for loop', pattern: /\bfor\s*[\(\s]/, forbid: true, why: 'replace the loop with map' }] } },
      { id: 'e2', title: 'barRanges()', difficulty: 'Core',
        prompt: 'Write <code>barRanges(bars)</code> returning an array of each bar\'s <code>high - low</code>, rounded to 2 decimals as a <strong>number</strong>.',
        starter: 'function barRanges(bars) {\n  // map each bar to its rounded range\n}\n',
        solution: 'function barRanges(bars) {\n  return bars.map(b => Math.round((b.high - b.low) * 100) / 100);\n}',
        hints: ['Round with <code>Math.round(x * 100) / 100</code> so the result stays a number.',
                'The callback receives the whole bar object, so you can read <code>b.high</code> and <code>b.low</code>.'],
        tests: { fn: 'barRanges', cases: [
          { args: [[{ high: 10.5, low: 8.25 }, { high: 3, low: 3 }]], expect: [2.25, 0] },
          { args: [[{ high: 5243.16, low: 5238.54 }]], expect: [4.62] },
          { args: [[]], expect: [] }
        ] } },
      { id: 'e3', title: 'percentChanges()', difficulty: 'Stretch',
        prompt: 'Write <code>percentChanges(closes)</code> returning the bar-to-bar percentage change of each close against the one before it.<br>' +
          'The first element has nothing before it — use <code>null</code> for it.<br>' +
          '<code>percentChanges([100, 110, 99])</code> → <code>[null, 10, -10]</code>',
        starter: 'function percentChanges(closes) {\n  // null for the first, percent change after that\n}\n',
        solution: 'function percentChanges(closes) {\n  return closes.map((c, i, a) => i === 0 ? null : (c - a[i - 1]) / a[i - 1] * 100);\n}',
        hints: ['The third callback argument is the whole array, so <code>a[i - 1]</code> is the previous close.',
                'Guard <code>i === 0</code> with a ternary that returns <code>null</code>.'],
        tests: { fn: 'percentChanges', approx: 1e-9, cases: [
          { args: [[100, 110, 99]], expect: [null, 10, -10] },
          { args: [[50]], expect: [null] },
          { args: [[200, 200]], expect: [null, 0] }
        ] } }
    ],
    quiz: [
      { q: 'An array of 78 bars is passed to <code>map</code>. How long is the result?',
        options: ['Depends on the callback', '78', '77', 'It varies'],
        answer: 1,
        explain: '<code>map</code> always returns exactly one element per input element. Changing the length is <code>filter</code>\'s job.' },
      { q: 'What does <code>[1,2,3].map(x => { x * 2; })</code> return?',
        options: ['<code>[2,4,6]</code>', '<code>[undefined, undefined, undefined]</code>', '<code>[1,2,3]</code>', 'A SyntaxError'],
        answer: 1,
        explain: 'Braces make a function body, which needs an explicit <code>return</code>. Drop the braces for an implicit return.' },
      { q: 'Which callback argument gives you the previous element?',
        options: ['There is one built in', 'The index, used against the third argument (the array)', '<code>this</code>', '<code>map</code> cannot see neighbours'],
        answer: 1,
        explain: '<code>(c, i, arr) =&gt; arr[i - 1]</code> is the standard way to reach the previous bar.' }
    ],
    recap: [
      '<code>map</code> returns a new array of the same length.',
      'The callback signature is <code>(item, index, array)</code>.',
      'Braces in an arrow body require an explicit <code>return</code>.',
      'For side effects with no result, use <code>forEach</code>.'
    ],
    vocab: [
      { term: 'Series transform', def: 'Any function that turns one price series into another — the mathematical core of every indicator.' }
    ]
  });

  C.push({
    id: 'd016', day: 16, module: 2, minutes: 30,
    title: 'filter: Selecting Trades',
    subtitle: 'Keeping only what matters, and the pitfalls of a truthy test.',
    goal: '<b>Goal:</b> pull the winners, the losers and the qualifying setups out of a larger dataset.',
    objectives: [
      'Use <code>filter</code> with a predicate that returns true or false',
      'Chain <code>filter</code> before <code>map</code>',
      'Count matches without a counter variable',
      'Avoid the truthy-predicate trap'
    ],
    sections: [
      { h: 'filter keeps the elements whose predicate is true',
        body: '<p>A <strong>predicate</strong> is any function returning true or false. <code>filter</code> keeps the items where it returns true, and the result may be shorter than the input — including empty.</p>',
        code: 'const wins = trades.filter(t => {\n  return t.side === "long" ? t.exit > t.entry : t.exit < t.entry;\n});\n\nconsole.log(`${wins.length} winners of ${trades.length} trades`);\nconsole.log(wins.map(t => t.symbol + " #" + t.id));' },
      { h: 'Counting is filter plus length',
        body: '<p>You no longer need a counter variable and a loop. <code>arr.filter(pred).length</code> is the count.</p>',
        code: 'const green = bars.filter(b => b.close > b.open).length;\nconst red = bars.filter(b => b.close < b.open).length;\n\nconsole.log(`${green} green, ${red} red, ${bars.length - green - red} flat`);' },
      { h: 'Chaining: filter narrows, map reshapes',
        body: '<p>Read a chain left to right as a pipeline. Filter first when you can — the map then has less work to do, and the intent reads in the right order.</p>' +
              '<div class="note note-warn"><b>The truthy trap</b><code>arr.filter(x =&gt; x.pnl)</code> silently drops break-even trades, because <code>0</code> is falsy. Write the comparison you actually mean: <code>x =&gt; x.pnl !== 0</code>.</div>',
        code: 'const bigEsTrades = trades\n  .filter(t => t.symbol === "ES")\n  .filter(t => t.qty >= 2)\n  .map(t => `#${t.id} ${t.side} ${t.qty}`);\n\nconsole.log(bigEsTrades);' }
    ],
    parsons: {
      prompt: 'Count how many bars traded above a level.',
      lines: [
        'const level = 5220;',
        'const above = bars.filter(b => b.close > level);',
        'console.log(above.length, "bars closed above", level);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'winners()', difficulty: 'Core',
        prompt: 'Write <code>winners(trades)</code> returning only the profitable trades.<br>' +
          'A trade has <code>side</code> (<code>"long"</code> or <code>"short"</code>), <code>entry</code> and <code>exit</code>. Break-even trades are not winners.',
        starter: 'function winners(trades) {\n  // filter to profitable trades only\n}\n',
        solution: 'function winners(trades) {\n  return trades.filter(t => t.side === "long" ? t.exit > t.entry : t.exit < t.entry);\n}',
        hints: ['The predicate depends on the side — a ternary inside the callback handles both.',
                'Use strict <code>&gt;</code> and <code>&lt;</code> so break-even trades are excluded.'],
        tests: { fn: 'winners', cases: [
          { args: [[{ id: 1, side: 'long', entry: 100, exit: 110 }, { id: 2, side: 'long', entry: 100, exit: 90 }]],
            expect: [{ id: 1, side: 'long', entry: 100, exit: 110 }] },
          { args: [[{ id: 3, side: 'short', entry: 100, exit: 90 }]],
            expect: [{ id: 3, side: 'short', entry: 100, exit: 90 }] },
          { args: [[{ id: 4, side: 'long', entry: 100, exit: 100 }]], expect: [], name: 'break-even is not a winner' }
        ], source: [{ name: 'uses filter', pattern: /\.filter\s*\(/, why: 'this level is about filter' }] } },
      { id: 'e2', title: 'countGreen()', difficulty: 'Core',
        prompt: 'Write <code>countGreen(bars)</code> returning how many bars closed above their open — using <code>filter</code> and <code>length</code>, with no counter variable.',
        starter: 'function countGreen(bars) {\n  // filter then length\n}\n',
        solution: 'function countGreen(bars) {\n  return bars.filter(b => b.close > b.open).length;\n}',
        hints: ['<code>filter</code> returns an array; ask it for its <code>.length</code>.',
                'One line: <code>return bars.filter(...).length;</code>'],
        tests: { fn: 'countGreen', cases: [
          { args: [[{ open: 1, close: 2 }, { open: 2, close: 1 }, { open: 3, close: 3 }]], expect: 1 },
          { args: [[]], expect: 0 },
          { args: [{ length: 0, filter: function () { return { length: 0 }; } }], expect: 0, name: 'works on any array-like with filter' }
        ], source: [{ name: 'no let/var counter', pattern: /\b(let|var)\s+\w+\s*=\s*0/, forbid: true,
          why: 'filter().length replaces the counter entirely' }] } },
      { id: 'e3', title: 'qualifyingSetups()', difficulty: 'Stretch',
        prompt: 'Write <code>qualifyingSetups(bars, minRange, minVolume)</code> returning the <strong>indexes</strong> of every bar whose range (<code>high - low</code>) is at least <code>minRange</code> <em>and</em> whose volume is at least <code>minVolume</code>.<br>' +
          'Return indexes, not the bars themselves.',
        starter: 'function qualifyingSetups(bars, minRange, minVolume) {\n  // return an array of matching indexes\n}\n',
        solution: 'function qualifyingSetups(bars, minRange, minVolume) {\n  return bars\n    .map((b, i) => i)\n    .filter(i => bars[i].high - bars[i].low >= minRange && bars[i].volume >= minVolume);\n}',
        hints: ['<code>filter</code> alone cannot give you indexes — map to indexes first, then filter them.',
                '<code>bars.map((b, i) =&gt; i)</code> produces <code>[0, 1, 2, ...]</code>.'],
        tests: { fn: 'qualifyingSetups', cases: [
          { args: [[{ high: 10, low: 8, volume: 100 }, { high: 10, low: 9.5, volume: 5000 }, { high: 12, low: 9, volume: 4000 }], 2, 1000],
            expect: [2] },
          { args: [[{ high: 10, low: 8, volume: 5000 }], 2, 1000], expect: [0], name: 'boundary values count as qualifying' },
          { args: [[], 1, 1], expect: [] }
        ] } }
    ],
    quiz: [
      { q: 'What length is the array returned by <code>filter</code>?',
        options: ['Always the same as the input', 'Between 0 and the input length', 'Always shorter', 'One'],
        answer: 1,
        explain: '<code>filter</code> keeps a subset — possibly all of them, possibly none.' },
      { q: 'Why is <code>trades.filter(t => t.pnl)</code> risky?',
        options: ['It is too slow', 'A <code>pnl</code> of exactly 0 is falsy and gets dropped', 'It mutates trades', '<code>filter</code> needs two arguments'],
        answer: 1,
        explain: 'Break-even trades vanish from the result. Write the comparison explicitly: <code>t.pnl !== 0</code>.' },
      { q: 'In <code>arr.filter(f).map(m)</code>, which runs first?',
        options: ['<code>map</code>', '<code>filter</code>', 'They interleave', 'Undefined order'],
        answer: 1,
        explain: 'Chains run left to right: filter builds an intermediate array, then map transforms it.' }
    ],
    recap: [
      '<code>filter</code> keeps elements whose predicate returns true.',
      '<code>filter(...).length</code> replaces counter loops.',
      'Chains read left to right; filter before map when you can.',
      'Never rely on truthiness when <code>0</code> is a real value.'
    ],
    vocab: [
      { term: 'Setup', def: 'A bar or pattern that meets a strategy\'s entry conditions. Filtering setups out of raw data is most of what a strategy does.' }
    ]
  });

  C.push({
    id: 'd017', day: 17, module: 2, minutes: 30,
    title: 'reduce: Folding to One Number',
    subtitle: 'Sums, averages, equity curves — the most general array method.',
    goal: '<b>Goal:</b> collapse an array into a single value, and understand why every other array method is a special case of this one.',
    objectives: [
      'Use <code>reduce</code> with an accumulator and a seed',
      'Explain why the seed matters',
      'Build a sum, a maximum and an object index with reduce',
      'Recognise when reduce is the wrong tool'
    ],
    sections: [
      { h: 'The shape of a reduce',
        body: '<p><code>reduce(callback, seed)</code>. The callback gets <code>(accumulator, item)</code> and returns the <em>next</em> accumulator. Whatever it returns on the last pass is the result.</p>',
        code: 'const closes4 = [10, 12, 11, 15];\n\nconst sum = closes4.reduce((acc, c) => acc + c, 0);\nconsole.log("sum:", sum);\n\n// Watch it work\ncloses4.reduce((acc, c) => {\n  console.log(`acc ${acc} + ${c} = ${acc + c}`);\n  return acc + c;\n}, 0);' },
      { h: 'Always pass the seed',
        body: '<p>Without a seed, reduce uses the first element as the starting accumulator and begins at the second. That breaks on an empty array (a TypeError) and silently changes the type when the accumulator is not the same shape as the items.</p>',
        code: 'console.log([1, 2, 3].reduce((a, b) => a + b, 0));  // 6\nconsole.log([].reduce((a, b) => a + b, 0));       // 0, safe\n\ntry {\n  console.log([].reduce((a, b) => a + b));       // TypeError\n} catch (e) {\n  console.log("Without a seed:", e.message);\n}' },
      { h: 'The accumulator can be any shape',
        body: '<p>It does not have to be a number. An object accumulator turns a list into an index; an array accumulator turns a list into a running series — which is exactly how an equity curve is built.</p>',
        code: '// Total P&L per symbol\nconst bySymbol = trades.reduce((acc, t) => {\n  const pts = t.side === "long" ? t.exit - t.entry : t.entry - t.exit;\n  acc[t.symbol] = (acc[t.symbol] || 0) + pts * t.qty;\n  return acc;\n}, {});\nconsole.log(bySymbol);\n\n// A running equity curve\nconst pnls = [100, -40, 220, -60];\nconst curve = pnls.reduce((acc, p) => {\n  acc.push((acc.at(-1) ?? 0) + p);\n  return acc;\n}, []);\nconsole.log(curve);' },
      { h: 'When not to reach for reduce',
        body: '<div class="note note-tip"><b>Rule of thumb</b>If <code>map</code>, <code>filter</code>, <code>some</code> or <code>Math.max(...arr)</code> expresses it directly, use those. Reduce earns its keep when you are folding to a value of a <em>different shape</em> than the input, or when you need the running state.</div>' }
    ],
    parsons: {
      prompt: 'Sum an array of trade P&Ls with reduce.',
      lines: [
        'const pnls = [100, -40, 220];',
        'const total = pnls.reduce((acc, p) => acc + p, 0);',
        'console.log(total);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'sum() and mean()', difficulty: 'Core',
        prompt: 'Write two functions:<ul>' +
          '<li><code>sum(values)</code> — the total, <code>0</code> for an empty array</li>' +
          '<li><code>mean(values)</code> — the average, <code>0</code> for an empty array (not <code>NaN</code>)</li></ul>' +
          'Use <code>reduce</code> for the sum.',
        expose: ['sum', 'mean'],
        starter: 'function sum(values) {\n  // reduce to a total\n}\n\nfunction mean(values) {\n  // average, 0 when empty\n}\n',
        solution: 'function sum(values) {\n  return values.reduce((a, v) => a + v, 0);\n}\n\nfunction mean(values) {\n  return values.length ? sum(values) / values.length : 0;\n}',
        hints: ['The seed <code>0</code> makes the empty case work automatically.',
                '<code>mean</code> can call <code>sum</code> — small functions composing is the point.'],
        tests: { checks: [
          { name: 'sum([10,12,11,15]) is 48', expose: ['sum'],
            run: function (s) { return s.sum([10, 12, 11, 15]) === 48 ? true : 'got ' + s.sum([10, 12, 11, 15]); } },
          { name: 'sum([]) is 0', expose: ['sum'],
            run: function (s) { return s.sum([]) === 0 ? true : 'got ' + s.sum([]); } },
          { name: 'mean([10,12,11,15]) is 12', expose: ['mean'],
            run: function (s) { return s.mean([10, 12, 11, 15]) === 12 ? true : 'got ' + s.mean([10, 12, 11, 15]); } },
          { name: 'mean([]) is 0, not NaN', expose: ['mean'],
            run: function (s) { return s.mean([]) === 0 ? true : 'got ' + s.mean([]); } }
        ], source: [{ name: 'uses reduce', pattern: /\.reduce\s*\(/, why: 'build the sum with reduce' }] } },
      { id: 'e2', title: 'totalPnl()', difficulty: 'Core',
        prompt: 'Write <code>totalPnl(trades, pointValue)</code> returning the total dollar P&L across every trade.<br>' +
          'Points for a long are <code>exit - entry</code>; for a short, <code>entry - exit</code>. Multiply by <code>qty</code> and <code>pointValue</code>.',
        starter: 'function totalPnl(trades, pointValue) {\n  // reduce to a dollar total\n}\n',
        solution: 'function totalPnl(trades, pointValue) {\n  return trades.reduce((acc, t) => {\n    const pts = t.side === "long" ? t.exit - t.entry : t.entry - t.exit;\n    return acc + pts * t.qty * pointValue;\n  }, 0);\n}',
        hints: ['Compute the points inside the callback, then add to the accumulator.',
                'Braces in the callback body mean you must <code>return</code> the accumulator explicitly.'],
        tests: { fn: 'totalPnl', approx: 1e-6, cases: [
          { args: [[{ side: 'long', entry: 100, exit: 110, qty: 1 }], 50], expect: 500 },
          { args: [[{ side: 'short', entry: 100, exit: 90, qty: 2 }], 50], expect: 1000 },
          { args: [[{ side: 'long', entry: 100, exit: 110, qty: 1 }, { side: 'long', entry: 100, exit: 95, qty: 1 }], 50], expect: 250 },
          { args: [[], 50], expect: 0 }
        ] } },
      { id: 'e3', title: 'equityCurve()', difficulty: 'Stretch',
        prompt: 'Write <code>equityCurve(startingEquity, pnls)</code> returning an array of the account balance <strong>after</strong> each trade.<br>' +
          '<code>equityCurve(10000, [100, -40, 220])</code> → <code>[10100, 10060, 10280]</code><br>' +
          'The starting equity itself is not in the output.',
        starter: 'function equityCurve(startingEquity, pnls) {\n  // running balance after each trade\n}\n',
        solution: 'function equityCurve(startingEquity, pnls) {\n  return pnls.reduce((acc, p) => {\n    acc.push((acc.length ? acc[acc.length - 1] : startingEquity) + p);\n    return acc;\n  }, []);\n}',
        hints: ['Seed with an empty array <code>[]</code> and push each new balance onto it.',
                'The previous balance is the last element so far, or <code>startingEquity</code> on the first pass.'],
        tests: { fn: 'equityCurve', approx: 1e-9, cases: [
          { args: [10000, [100, -40, 220]], expect: [10100, 10060, 10280] },
          { args: [5000, []], expect: [] },
          { args: [1000, [-1000]], expect: [0] }
        ] } }
    ],
    quiz: [
      { q: 'What does the second argument to <code>reduce</code> do?',
        options: ['Sets the array length', 'Provides the starting accumulator', 'Filters the input', 'Names the callback'],
        answer: 1,
        explain: 'It is the seed. Without it, reduce starts from the first element — and throws on an empty array.' },
      { q: 'What does <code>[].reduce((a, b) => a + b)</code> do?',
        options: ['Returns 0', 'Returns undefined', 'Throws a TypeError', 'Returns an empty array'],
        answer: 2,
        explain: '"Reduce of empty array with no initial value". Always pass a seed.' },
      { q: 'Which is the better tool for "the largest close"?',
        options: ['<code>reduce</code>', '<code>Math.max(...closes)</code>', 'A while loop', '<code>filter</code>'],
        answer: 1,
        explain: 'Reduce can do it, but spread into <code>Math.max</code> says it more directly. Reduce is for folds that change shape or carry state.' }
    ],
    recap: [
      '<code>reduce(callback, seed)</code> folds an array into one value.',
      'Always pass the seed — it fixes both the type and the empty case.',
      'The accumulator can be a number, object or array.',
      'Prefer a more specific method when one exists.'
    ],
    vocab: [
      { term: 'Equity curve', def: 'Account balance plotted over time. Its shape — smoothness, depth of drawdowns — matters more than its endpoint.' }
    ]
  });

  C.push({
    id: 'd018', day: 18, module: 2, minutes: 25,
    title: 'sort: Ranking Results',
    subtitle: 'Comparators, stability, and why sort bites beginners.',
    goal: '<b>Goal:</b> rank trades by size, symbols by P&L and bars by volume — correctly.',
    objectives: [
      'Write a numeric comparator',
      'Understand why the default sort is alphabetical',
      'Sort without destroying the original array',
      'Sort by a secondary key'
    ],
    sections: [
      { h: 'The default sort is alphabetical — including for numbers',
        body: '<p><code>sort()</code> with no argument converts every element to a string. For prices this produces nonsense, and it produces it silently.</p>',
        code: 'const prices = [5240, 900, 18420, 78];\n\nconsole.log([...prices].sort());              // string order!\nconsole.log([...prices].sort((a, b) => a - b)); // numeric ascending\nconsole.log([...prices].sort((a, b) => b - a)); // numeric descending' },
      { h: 'How a comparator works',
        body: '<p>The comparator gets two elements and returns a number: <strong>negative</strong> if <code>a</code> comes first, <strong>positive</strong> if <code>b</code> does, <strong>0</strong> if their order does not matter. <code>a - b</code> naturally satisfies all three.</p>',
        code: 'const byPoints = [...trades].sort((a, b) => {\n  const pa = a.side === "long" ? a.exit - a.entry : a.entry - a.exit;\n  const pb = b.side === "long" ? b.exit - b.entry : b.entry - b.exit;\n  return pb - pa;   // biggest winner first\n});\n\nconsole.log(byPoints.map(t => `#${t.id} ${t.symbol}`));' },
      { h: 'sort mutates — copy first',
        body: '<p><code>sort</code> rearranges the array in place and returns the same array. If the original order matters — and for a price series it always does — copy before sorting.</p>' +
              '<div class="note note-warn"><b>The bug that ruins a backtest</b>Sorting your bars array to find the median silently reorders time itself. Every subsequent indicator is then computed on shuffled history. Always <code>[...bars].sort(...)</code>.</div>',
        code: 'const original = [3, 1, 2];\nconst sorted = [...original].sort((a, b) => a - b);\nconsole.log("original:", original, "sorted:", sorted);\n\nconst mutated = [3, 1, 2];\nmutated.sort((a, b) => a - b);\nconsole.log("mutated:", mutated);   // the original is gone' },
      { h: 'Secondary keys',
        body: '<p>Return the primary comparison, and fall back to a secondary one when it is 0.</p>',
        code: 'const rows = [\n  { sym: "ES", pnl: 100 }, { sym: "NQ", pnl: 100 }, { sym: "CL", pnl: 250 }\n];\n\nconst ranked = [...rows].sort((a, b) =>\n  (b.pnl - a.pnl) || a.sym.localeCompare(b.sym)\n);\nconsole.log(ranked);' }
    ],
    parsons: {
      prompt: 'Rank closes from high to low without touching the original array.',
      lines: [
        'const closes = [10, 14, 11];',
        'const ranked = [...closes].sort((a, b) => b - a);',
        'console.log(ranked);',
        'console.log(closes);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'sortDescending()', difficulty: 'Core',
        prompt: 'Write <code>sortDescending(values)</code> returning a <strong>new</strong> array sorted largest to smallest, leaving the input unchanged.',
        starter: 'function sortDescending(values) {\n  // new array, largest first\n}\n',
        solution: 'function sortDescending(values) {\n  return [...values].sort((a, b) => b - a);\n}',
        hints: ['Copy first with <code>[...values]</code>, then sort the copy.',
                'Descending numeric order is <code>(a, b) =&gt; b - a</code>.'],
        tests: { fn: 'sortDescending', cases: [
          { args: [[5240, 900, 18420, 78]], expect: [18420, 5240, 900, 78] },
          { args: [[1.5, 1.25, 1.75]], expect: [1.75, 1.5, 1.25] },
          { args: [[]], expect: [] }
        ], checks: [{
          name: 'leaves the input array untouched', expose: ['sortDescending'],
          run: function (s) {
            var a = [3, 1, 2];
            s.sortDescending(a);
            return (a[0] === 3 && a[1] === 1 && a[2] === 2) ? true : 'the input was reordered — copy before sorting';
          }
        }] } },
      { id: 'e2', title: 'biggestMovers()', difficulty: 'Core',
        prompt: 'Write <code>biggestMovers(bars, n)</code> returning the <code>n</code> bars with the largest range (<code>high - low</code>), largest first.<br>' +
          'Return the bar objects themselves, and never modify the input array.',
        starter: 'function biggestMovers(bars, n) {\n  // top n bars by range\n}\n',
        solution: 'function biggestMovers(bars, n) {\n  return [...bars]\n    .sort((a, b) => (b.high - b.low) - (a.high - a.low))\n    .slice(0, n);\n}',
        hints: ['Sort a copy by range descending, then <code>slice(0, n)</code>.',
                'The comparator computes both ranges: <code>(b.high - b.low) - (a.high - a.low)</code>.'],
        tests: { fn: 'biggestMovers', cases: [
          { args: [[{ high: 10, low: 9 }, { high: 20, low: 10 }, { high: 5, low: 2 }], 2],
            expect: [{ high: 20, low: 10 }, { high: 5, low: 2 }] },
          { args: [[{ high: 10, low: 9 }], 5], expect: [{ high: 10, low: 9 }], name: 'n larger than the array is fine' },
          { args: [[], 3], expect: [] }
        ] } },
      { id: 'e3', title: 'rankSymbols()', difficulty: 'Stretch',
        prompt: 'Write <code>rankSymbols(rows)</code> where each row is <code>{symbol, pnl}</code>.<br>' +
          'Return a new array sorted by <code>pnl</code> descending; when two P&Ls are equal, order those alphabetically by symbol.',
        starter: 'function rankSymbols(rows) {\n  // pnl desc, then symbol asc\n}\n',
        solution: 'function rankSymbols(rows) {\n  return [...rows].sort((a, b) => (b.pnl - a.pnl) || a.symbol.localeCompare(b.symbol));\n}',
        hints: ['<code>||</code> falls through to the second comparison when the first returns 0.',
                '<code>a.symbol.localeCompare(b.symbol)</code> gives the alphabetical comparison.'],
        tests: { fn: 'rankSymbols', cases: [
          { args: [[{ symbol: 'NQ', pnl: 100 }, { symbol: 'ES', pnl: 100 }, { symbol: 'CL', pnl: 250 }]],
            expect: [{ symbol: 'CL', pnl: 250 }, { symbol: 'ES', pnl: 100 }, { symbol: 'NQ', pnl: 100 }] },
          { args: [[{ symbol: 'A', pnl: -5 }, { symbol: 'B', pnl: 5 }]],
            expect: [{ symbol: 'B', pnl: 5 }, { symbol: 'A', pnl: -5 }] }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>[10, 9, 100].sort()</code> return?',
        options: ['<code>[9, 10, 100]</code>', '<code>[10, 100, 9]</code>', '<code>[100, 10, 9]</code>', 'A TypeError'],
        answer: 1,
        explain: 'The default sort compares string forms: "10" &lt; "100" &lt; "9". Always pass a numeric comparator.' },
      { q: 'A comparator returns a negative number. What does that mean?',
        options: ['<code>a</code> comes before <code>b</code>', '<code>b</code> comes before <code>a</code>', 'They are equal', 'Sorting stops'],
        answer: 0,
        explain: 'Negative keeps <code>a</code> first, positive moves <code>b</code> first, zero leaves them as they were.' },
      { q: 'Why write <code>[...bars].sort(...)</code> instead of <code>bars.sort(...)</code>?',
        options: ['It is faster', '<code>sort</code> mutates, and reordering a price series destroys its time order', 'Spread is required by sort', 'No reason'],
        answer: 1,
        explain: 'Sorting bars in place silently shuffles history, and every indicator downstream is then wrong.' }
    ],
    recap: [
      'The default sort is alphabetical — always pass a comparator for numbers.',
      '<code>(a, b) => a - b</code> ascending, <code>b - a</code> descending.',
      '<code>sort</code> mutates: copy with <code>[...arr]</code> first.',
      '<code>||</code> chains a secondary comparison.'
    ],
    vocab: [
      { term: 'Ranking', def: 'Ordering instruments or trades by a metric — the first step of nearly every screener and rotation strategy.' }
    ]
  });

  C.push({
    id: 'd019', day: 19, module: 2, minutes: 25,
    title: 'find, some, every: Asking Questions',
    subtitle: 'Searching a series without writing a search loop.',
    goal: '<b>Goal:</b> answer "is there one?", "are they all?" and "where is it?" in one line each.',
    objectives: [
      'Use <code>find</code> and <code>findIndex</code> to locate an element',
      'Use <code>some</code> and <code>every</code> for existence and universality',
      'Know what each returns when nothing matches',
      'Choose the right one instead of reaching for filter'
    ],
    sections: [
      { h: 'find returns the element; findIndex returns the position',
        body: '<p>Both stop at the first match — they do not scan the rest. <code>find</code> gives <code>undefined</code> when nothing matches; <code>findIndex</code> gives <code>-1</code>.</p>',
        code: 'const firstBigBar = bars.find(b => b.high - b.low > 3);\nconsole.log("first wide bar:", firstBigBar);\n\nconst idx = bars.findIndex(b => b.high - b.low > 3);\nconsole.log("at index", idx);\n\nconsole.log(bars.find(b => b.volume > 999999));  // undefined\nconsole.log(bars.findIndex(b => b.volume > 999999)); // -1' },
      { h: 'some and every return booleans',
        body: '<p><code>some</code> is "at least one"; <code>every</code> is "all of them". Both short-circuit as soon as the answer is settled.</p>' +
              '<div class="note note-warn"><b>The empty-array surprise</b><code>[].every(anything)</code> is <code>true</code> and <code>[].some(anything)</code> is <code>false</code>. Mathematically correct, occasionally the source of a strategy trading on no data at all.</div>',
        code: 'console.log(trades.some(t => t.symbol === "GC"));   // any gold trades?\nconsole.log(trades.every(t => t.qty > 0));         // all sized?\n\nconsole.log([].every(x => x > 100));  // true  (vacuously)\nconsole.log([].some(x => x > 100));   // false' },
      { h: 'Choosing the right one',
        body: '<table><tr><th>Question</th><th>Method</th><th>Returns</th></tr>' +
              '<tr><td>Which one?</td><td><code>find</code></td><td>element or <code>undefined</code></td></tr>' +
              '<tr><td>Where?</td><td><code>findIndex</code></td><td>index or <code>-1</code></td></tr>' +
              '<tr><td>Any at all?</td><td><code>some</code></td><td>boolean</td></tr>' +
              '<tr><td>All of them?</td><td><code>every</code></td><td>boolean</td></tr>' +
              '<tr><td>Which ones?</td><td><code>filter</code></td><td>array</td></tr></table>' +
              '<p>Using <code>filter(...).length > 0</code> where <code>some</code> would do scans the whole array to answer a question that was settled at the first match.</p>',
        code: 'const level = 5230;\n\n// scans everything\nconsole.log(bars.filter(b => b.low < level).length > 0);\n\n// stops at the first match\nconsole.log(bars.some(b => b.low < level));' }
    ],
    parsons: {
      prompt: 'Detect whether price ever traded below a stop level.',
      lines: [
        'const stop = 5210;',
        'const wasHit = bars.some(b => b.low <= stop);',
        'const hitIndex = bars.findIndex(b => b.low <= stop);',
        'console.log(wasHit, hitIndex);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'stopHitIndex()', difficulty: 'Core',
        prompt: 'Write <code>stopHitIndex(bars, stop)</code> returning the index of the first bar whose <code>low</code> is at or below <code>stop</code>, or <code>-1</code> if the stop was never touched.',
        starter: 'function stopHitIndex(bars, stop) {\n  // index of the first bar that traded down to the stop\n}\n',
        solution: 'function stopHitIndex(bars, stop) {\n  return bars.findIndex(b => b.low <= stop);\n}',
        hints: ['<code>findIndex</code> already returns <code>-1</code> when nothing matches.',
                '"At or below" is <code>&lt;=</code>.'],
        tests: { fn: 'stopHitIndex', cases: [
          { args: [[{ low: 10 }, { low: 8 }, { low: 6 }], 8], expect: 1 },
          { args: [[{ low: 10 }, { low: 11 }], 5], expect: -1, name: 'never touched returns -1' },
          { args: [[], 100], expect: -1 }
        ], source: [{ name: 'uses findIndex', pattern: /\.findIndex\s*\(/, why: 'findIndex is the direct tool here' }] } },
      { id: 'e2', title: 'allValidBars()', difficulty: 'Core',
        prompt: 'Write <code>allValidBars(bars)</code> returning <code>true</code> only when every bar is internally consistent:<ul>' +
          '<li><code>high</code> is at least <code>low</code></li>' +
          '<li>both <code>open</code> and <code>close</code> sit between <code>low</code> and <code>high</code> inclusive</li>' +
          '<li><code>volume</code> is not negative</li></ul>' +
          'An empty array counts as valid.',
        starter: 'function allValidBars(bars) {\n  // true only if every bar is consistent\n}\n',
        solution: 'function allValidBars(bars) {\n  return bars.every(b =>\n    b.high >= b.low &&\n    b.open >= b.low && b.open <= b.high &&\n    b.close >= b.low && b.close <= b.high &&\n    b.volume >= 0);\n}',
        hints: ['<code>every</code> with a predicate that ANDs all the conditions together.',
                'Remember the bounds are inclusive, so use <code>&gt;=</code> and <code>&lt;=</code>.'],
        tests: { fn: 'allValidBars', cases: [
          { args: [[{ open: 5, high: 6, low: 4, close: 5, volume: 10 }]], expect: true },
          { args: [[{ open: 5, high: 4, low: 6, close: 5, volume: 10 }]], expect: false, name: 'high below low is invalid' },
          { args: [[{ open: 9, high: 6, low: 4, close: 5, volume: 10 }]], expect: false, name: 'open above high is invalid' },
          { args: [[{ open: 5, high: 6, low: 4, close: 5, volume: -1 }]], expect: false, name: 'negative volume is invalid' },
          { args: [[]], expect: true, name: 'an empty array is vacuously valid' }
        ] } },
      { id: 'e3', title: 'firstBreakout()', difficulty: 'Stretch',
        prompt: 'Write <code>firstBreakout(bars, level)</code> returning an object <code>{index, bar}</code> for the first bar whose <code>high</code> exceeds <code>level</code>.<br>' +
          'If no bar breaks out, return <code>null</code>.',
        starter: 'function firstBreakout(bars, level) {\n  // { index, bar } or null\n}\n',
        solution: 'function firstBreakout(bars, level) {\n  const index = bars.findIndex(b => b.high > level);\n  return index === -1 ? null : { index, bar: bars[index] };\n}',
        hints: ['Find the index first, then build the object from it.',
                'Return <code>null</code> when the index is <code>-1</code>.'],
        tests: { fn: 'firstBreakout', cases: [
          { args: [[{ high: 10 }, { high: 15 }, { high: 20 }], 12], expect: { index: 1, bar: { high: 15 } } },
          { args: [[{ high: 10 }], 50], expect: null, name: 'no breakout returns null' },
          { args: [[], 50], expect: null }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>find</code> return when nothing matches?',
        options: ['<code>null</code>', '<code>-1</code>', '<code>undefined</code>', 'An empty array'],
        answer: 2,
        explain: '<code>find</code> gives <code>undefined</code>; <code>findIndex</code> is the one that gives <code>-1</code>.' },
      { q: 'What is <code>[].every(b => b.close > 0)</code>?',
        options: ['<code>true</code>', '<code>false</code>', '<code>undefined</code>', 'A TypeError'],
        answer: 0,
        explain: 'Vacuously true — there is no element that fails. Guard the empty case when "all bars pass" is meant to authorise a trade.' },
      { q: 'Why is <code>some</code> better than <code>filter(...).length > 0</code>?',
        options: ['It reads better only', '<code>some</code> stops at the first match instead of scanning everything', '<code>filter</code> mutates', 'They differ on empty arrays'],
        answer: 1,
        explain: 'Short-circuiting matters on long series, and the intent is clearer.' }
    ],
    recap: [
      '<code>find</code> → element or <code>undefined</code>; <code>findIndex</code> → index or <code>-1</code>.',
      '<code>some</code> = at least one; <code>every</code> = all.',
      'Empty arrays: <code>every</code> is true, <code>some</code> is false.',
      'Pick the method that matches the question you are asking.'
    ],
    vocab: [
      { term: 'Breakout', def: 'Price moving beyond a defined level — a prior high, a range edge — often used as an entry trigger.' }
    ]
  });

  C.push({
    id: 'd020', day: 20, module: 2, minutes: 35, boss: true,
    title: 'Boss: Trade Log Analytics',
    subtitle: 'Turn a raw trade log into the stats sheet every trader reviews.',
    goal: '<b>Goal:</b> build the performance summary — win rate, average win, average loss, profit factor and expectancy — from a list of trades.',
    objectives: [
      'Combine map, filter and reduce into one analysis',
      'Compute win rate, profit factor and expectancy correctly',
      'Handle the degenerate cases (no trades, no losers)',
      'Return a structured result object'
    ],
    sections: [
      { h: 'The five numbers that matter',
        body: '<table><tr><th>Metric</th><th>Formula</th><th>Reads as</th></tr>' +
              '<tr><td>Win rate</td><td>wins ÷ total</td><td>how often you are right</td></tr>' +
              '<tr><td>Average win</td><td>mean of winning P&amp;Ls</td><td>how much being right pays</td></tr>' +
              '<tr><td>Average loss</td><td>mean of losing P&amp;Ls (a negative)</td><td>how much being wrong costs</td></tr>' +
              '<tr><td>Profit factor</td><td>gross profit ÷ |gross loss|</td><td>dollars made per dollar lost</td></tr>' +
              '<tr><td>Expectancy</td><td>mean P&amp;L per trade</td><td>what one more trade is worth</td></tr></table>' +
              '<p>A 40% win rate is fine if the average win is three times the average loss. A 70% win rate is a disaster if the losses are five times the wins. This is why win rate alone tells you almost nothing.</p>' },
      { h: 'The degenerate cases will bite you',
        body: '<div class="note note-warn"><b>Divide-by-zero everywhere</b>No trades → win rate is <code>0/0 = NaN</code>. No losing trades → profit factor divides by zero and gives <code>Infinity</code>. Both are real situations in a short backtest, and both propagate silently into every number downstream.</div>' +
              '<p>Decide the answer for each edge case deliberately and write it down in the code.</p>',
        code: 'const gross = { profit: 500, loss: 0 };\n\nconsole.log(gross.profit / gross.loss);          // Infinity\nconsole.log(0 / 0);                              // NaN\n\n// Deliberate handling\nconst pf = gross.loss === 0\n  ? (gross.profit > 0 ? Infinity : 0)\n  : gross.profit / gross.loss;\nconsole.log("profit factor:", pf);' },
      { h: 'Structure the output',
        body: '<p>Return one object rather than five loose variables. It documents itself, survives being passed around, and can be printed as a table in one line.</p>',
        code: 'const summary = { trades: 8, winRate: 0.625, avgWin: 420, avgLoss: -180 };\nconsole.log(summary);\nconsole.log(`Win rate: ${(summary.winRate * 100).toFixed(1)}%`);' }
    ],
    parsons: {
      prompt: 'Compute a win rate from a list of P&L numbers.',
      lines: [
        'const pnls = [100, -40, 220, -60];',
        'const wins = pnls.filter(p => p > 0);',
        'const winRate = wins.length / pnls.length;',
        'console.log((winRate * 100).toFixed(1) + "%");'
      ]
    },
    exercises: [
      { id: 'e1', title: 'tradePnls()', difficulty: 'Boss · part 1',
        prompt: 'Write <code>tradePnls(trades, pointValue)</code> returning an array of dollar P&Ls, one per trade, in the same order.<br>' +
          'Long points are <code>exit - entry</code>, short points are <code>entry - exit</code>; multiply by <code>qty</code> and <code>pointValue</code>.',
        starter: 'function tradePnls(trades, pointValue) {\n  // one dollar P&L per trade\n}\n',
        solution: 'function tradePnls(trades, pointValue) {\n  return trades.map(t => {\n    const pts = t.side === "long" ? t.exit - t.entry : t.entry - t.exit;\n    return pts * t.qty * pointValue;\n  });\n}',
        hints: ['This is a <code>map</code> — one output per input.',
                'Compute the points first, then multiply by qty and pointValue.'],
        tests: { fn: 'tradePnls', approx: 1e-6, cases: [
          { args: [[{ side: 'long', entry: 100, exit: 110, qty: 1 }], 50], expect: [500] },
          { args: [[{ side: 'short', entry: 100, exit: 90, qty: 2 }], 50], expect: [1000] },
          { args: [[{ side: 'long', entry: 100, exit: 95, qty: 1 }, { side: 'short', entry: 50, exit: 60, qty: 1 }], 10],
            expect: [-50, -100] },
          { args: [[], 50], expect: [] }
        ] } },
      { id: 'e2', title: 'winStats()', difficulty: 'Boss · part 2',
        prompt: 'Write <code>winStats(pnls)</code> taking an array of dollar P&Ls and returning:<br>' +
          '<code>{ count, wins, losses, winRate, avgWin, avgLoss }</code><ul>' +
          '<li><code>wins</code> counts P&Ls above 0, <code>losses</code> counts those below 0 (zeros are neither)</li>' +
          '<li><code>winRate</code> is <code>wins / count</code>, or <code>0</code> when there are no trades</li>' +
          '<li><code>avgWin</code> is the mean of the winning P&Ls, <code>0</code> if there are none</li>' +
          '<li><code>avgLoss</code> is the mean of the losing P&Ls — a negative number — or <code>0</code> if there are none</li></ul>',
        starter: 'function winStats(pnls) {\n  // return { count, wins, losses, winRate, avgWin, avgLoss }\n}\n',
        solution: 'function winStats(pnls) {\n  const w = pnls.filter(p => p > 0);\n  const l = pnls.filter(p => p < 0);\n  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;\n  return {\n    count: pnls.length,\n    wins: w.length,\n    losses: l.length,\n    winRate: pnls.length ? w.length / pnls.length : 0,\n    avgWin: mean(w),\n    avgLoss: mean(l)\n  };\n}',
        hints: ['Filter into two arrays first, then every number falls out of them.',
                'A little local <code>mean</code> helper avoids writing the empty-guard three times.'],
        tests: { fn: 'winStats', approx: 1e-9, cases: [
          { args: [[100, -40, 220, -60]],
            expect: { count: 4, wins: 2, losses: 2, winRate: 0.5, avgWin: 160, avgLoss: -50 } },
          { args: [[]],
            expect: { count: 0, wins: 0, losses: 0, winRate: 0, avgWin: 0, avgLoss: 0 },
            name: 'no trades returns zeros, not NaN' },
          { args: [[100, 200]],
            expect: { count: 2, wins: 2, losses: 0, winRate: 1, avgWin: 150, avgLoss: 0 },
            name: 'no losers gives avgLoss 0' },
          { args: [[0, 100]],
            expect: { count: 2, wins: 1, losses: 0, winRate: 0.5, avgWin: 100, avgLoss: 0 },
            name: 'a break-even trade counts in neither bucket' }
        ] } },
      { id: 'e3', title: 'performanceReport()', difficulty: 'Boss · final',
        prompt: 'Write <code>performanceReport(trades, pointValue)</code> returning the full sheet:<br>' +
          '<code>{ count, wins, losses, winRate, avgWin, avgLoss, grossProfit, grossLoss, netPnl, profitFactor, expectancy }</code><ul>' +
          '<li><code>grossProfit</code> — sum of winning P&Ls; <code>grossLoss</code> — sum of losing P&Ls as a <strong>positive</strong> number</li>' +
          '<li><code>netPnl</code> — the sum of everything</li>' +
          '<li><code>profitFactor</code> — <code>grossProfit / grossLoss</code>; when <code>grossLoss</code> is 0 return <code>Infinity</code> if there was any profit, otherwise <code>0</code></li>' +
          '<li><code>expectancy</code> — <code>netPnl / count</code>, or <code>0</code> with no trades</li></ul>' +
          '<span class="muted">You may call the functions you wrote above — they are in scope.</span>',
        starter: 'function tradePnls(trades, pointValue) {\n  return trades.map(t => {\n    const pts = t.side === "long" ? t.exit - t.entry : t.entry - t.exit;\n    return pts * t.qty * pointValue;\n  });\n}\n\nfunction performanceReport(trades, pointValue) {\n  // build the full report\n}\n',
        solution: 'function tradePnls(trades, pointValue) {\n  return trades.map(t => {\n    const pts = t.side === "long" ? t.exit - t.entry : t.entry - t.exit;\n    return pts * t.qty * pointValue;\n  });\n}\n\nfunction performanceReport(trades, pointValue) {\n  const pnls = tradePnls(trades, pointValue);\n  const w = pnls.filter(p => p > 0), l = pnls.filter(p => p < 0);\n  const sum = a => a.reduce((x, y) => x + y, 0);\n  const mean = a => a.length ? sum(a) / a.length : 0;\n  const grossProfit = sum(w);\n  const grossLoss = Math.abs(sum(l));\n  const netPnl = sum(pnls);\n  return {\n    count: pnls.length, wins: w.length, losses: l.length,\n    winRate: pnls.length ? w.length / pnls.length : 0,\n    avgWin: mean(w), avgLoss: mean(l),\n    grossProfit, grossLoss, netPnl,\n    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss,\n    expectancy: pnls.length ? netPnl / pnls.length : 0\n  };\n}',
        hints: ['Start by turning the trades into P&Ls, then everything else is arithmetic on that array.',
                '<code>grossLoss</code> is positive: wrap the sum of losses in <code>Math.abs</code>.',
                'Handle <code>grossLoss === 0</code> explicitly before dividing.'],
        tests: { fn: 'performanceReport', approx: 1e-6, cases: [
          { args: [[{ side: 'long', entry: 100, exit: 110, qty: 1 }, { side: 'long', entry: 100, exit: 95, qty: 1 }], 10],
            expect: { count: 2, wins: 1, losses: 1, winRate: 0.5, avgWin: 100, avgLoss: -50,
              grossProfit: 100, grossLoss: 50, netPnl: 50, profitFactor: 2, expectancy: 25 } },
          { args: [[{ side: 'long', entry: 100, exit: 110, qty: 1 }], 10],
            expect: { count: 1, wins: 1, losses: 0, winRate: 1, avgWin: 100, avgLoss: 0,
              grossProfit: 100, grossLoss: 0, netPnl: 100, profitFactor: Infinity, expectancy: 100 },
            name: 'no losing trades gives a profit factor of Infinity' },
          { args: [[], 50],
            expect: { count: 0, wins: 0, losses: 0, winRate: 0, avgWin: 0, avgLoss: 0,
              grossProfit: 0, grossLoss: 0, netPnl: 0, profitFactor: 0, expectancy: 0 },
            name: 'an empty log produces zeros throughout' }
        ] } }
    ],
    quiz: [
      { q: 'A system wins 40% of the time. Can it be profitable?',
        options: ['No', 'Yes, if the average win is large enough relative to the average loss', 'Only with leverage', 'Only intraday'],
        answer: 1,
        explain: 'Expectancy is winRate × avgWin − lossRate × |avgLoss|. At 40/60, an average win of 2× the average loss is already positive.' },
      { q: 'Profit factor comes out as <code>Infinity</code>. What does that mean?',
        options: ['A bug in the maths', 'There were no losing trades in the sample', 'The account is empty', 'Division by NaN'],
        answer: 1,
        explain: 'Gross loss was zero. Real, but usually a sign the sample is too small to conclude anything from.' },
      { q: 'Why is <code>0/0</code> a real risk in this report?',
        options: ['It never happens', 'With no trades, wins ÷ count is 0 ÷ 0 = NaN, which spreads to everything downstream', 'JavaScript throws on it', 'Only in strict mode'],
        answer: 1,
        explain: 'NaN propagates silently through every subsequent calculation. Guard the empty case explicitly.' }
    ],
    recap: [
      'Win rate alone says nothing — pair it with the win/loss size ratio.',
      'Profit factor = gross profit ÷ gross loss (positive).',
      'Expectancy is the average P&L of one more trade.',
      'Handle no-trades and no-losers deliberately, or NaN and Infinity leak everywhere.'
    ],
    vocab: [
      { term: 'Profit factor', def: 'Gross profit divided by gross loss. Above 1.0 is profitable; most durable systems sit between 1.2 and 2.0.' },
      { term: 'Expectancy', def: 'Average dollars per trade. Multiply by trade frequency to get expected return over a period.' }
    ]
  });

  C.push({
    id: 'd021', day: 21, module: 2, minutes: 25,
    title: 'Destructuring',
    subtitle: 'Unpacking objects and arrays into named variables.',
    goal: '<b>Goal:</b> pull the fields you need out of bars, trades and config objects in one line.',
    objectives: [
      'Destructure objects and arrays',
      'Rename and default while destructuring',
      'Destructure function parameters',
      'Swap variables and unpack nested shapes'
    ],
    sections: [
      { h: 'Object destructuring',
        body: '<p>The names on the left are matched against keys on the right. Order does not matter; the names do.</p>',
        code: 'const bar = { time: "09:30", open: 5240, high: 5243, low: 5238, close: 5241, volume: 1716 };\n\nconst { high, low, close } = bar;\nconsole.log(high - low, close);\n\n// rename while unpacking\nconst { close: lastPrice } = bar;\nconsole.log("last:", lastPrice);\n\n// default for a missing key\nconst { spread = 0.25 } = bar;\nconsole.log("spread:", spread);' },
      { h: 'Array destructuring is positional',
        body: '<p>Here position <em>is</em> the name. Skip elements with a bare comma.</p>',
        code: 'const ohlc = [5240, 5243, 5238, 5241];\nconst [o, h, l, c] = ohlc;\nconsole.log(o, h, l, c);\n\nconst [first, , third] = [1, 2, 3];\nconsole.log(first, third);\n\n// the classic swap\nlet a = 1, b = 2;\n[a, b] = [b, a];\nconsole.log(a, b);' },
      { h: 'Destructuring parameters',
        body: '<p>This is where it earns its place: a function that takes an options object can name what it needs right in the signature, defaults included.</p>',
        code: 'function describeBar({ open, close, volume = 0 }) {\n  const dir = close > open ? "up" : close < open ? "down" : "flat";\n  return `${dir} on ${volume} lots`;\n}\n\nconsole.log(describeBar({ open: 5240, close: 5245, volume: 1200 }));\nconsole.log(describeBar({ open: 5240, close: 5235 }));' },
      { h: 'Nested destructuring',
        body: '<p>It follows the shape of the data. Do not go more than two levels deep — past that a plain <code>const spec = specs.ES</code> reads better.</p>',
        code: 'const config = {\n  risk: { perTrade: 0.01, maxDaily: 0.03 },\n  session: { start: "09:30", end: "16:00" }\n};\n\nconst { risk: { perTrade, maxDaily }, session: { start } } = config;\nconsole.log(perTrade, maxDaily, start);' }
    ],
    parsons: {
      prompt: 'Unpack a bar and report its range.',
      lines: [
        'const bar = { open: 5240, high: 5243, low: 5238, close: 5241 };',
        'const { high, low } = bar;',
        'const range = high - low;',
        'console.log(range);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'barBody()', difficulty: 'Core',
        prompt: 'Write <code>barBody(bar)</code> returning the absolute distance between the open and the close.<br>' +
          'Destructure <code>open</code> and <code>close</code> out of the parameter — do not write <code>bar.open</code>.',
        starter: 'function barBody(bar) {\n  // destructure, then return |close - open|\n}\n',
        solution: 'function barBody({ open, close }) {\n  return Math.abs(close - open);\n}',
        hints: ['You can destructure directly in the parameter list: <code>function barBody({ open, close })</code>.',
                '<code>Math.abs</code> makes the direction irrelevant.'],
        tests: { fn: 'barBody', approx: 1e-9, cases: [
          { args: [{ open: 5240, close: 5245 }], expect: 5 },
          { args: [{ open: 5245, close: 5240 }], expect: 5 },
          { args: [{ open: 10, close: 10 }], expect: 0 }
        ], source: [{ name: 'uses destructuring, not dot access', pattern: /bar\s*\.\s*(open|close)/, forbid: true,
          why: 'destructure { open, close } instead of reading bar.open' }] } },
      { id: 'e2', title: 'splitOhlc()', difficulty: 'Core',
        prompt: 'Write <code>splitOhlc(row)</code> where <code>row</code> is the array <code>[open, high, low, close, volume]</code>.<br>' +
          'Return an object <code>{open, high, low, close, volume}</code>. If the volume is missing from the array, default it to <code>0</code>.',
        starter: 'function splitOhlc(row) {\n  // array in, object out\n}\n',
        solution: 'function splitOhlc(row) {\n  const [open, high, low, close, volume = 0] = row;\n  return { open, high, low, close, volume };\n}',
        hints: ['Array destructuring accepts defaults too: <code>[a, b, c, d, e = 0]</code>.',
                'Build the object with shorthand properties: <code>{ open, high, low, close, volume }</code>.'],
        tests: { fn: 'splitOhlc', cases: [
          { args: [[5240, 5243, 5238, 5241, 1716]], expect: { open: 5240, high: 5243, low: 5238, close: 5241, volume: 1716 } },
          { args: [[1, 2, 0.5, 1.5]], expect: { open: 1, high: 2, low: 0.5, close: 1.5, volume: 0 },
            name: 'a missing volume defaults to 0' }
        ] } },
      { id: 'e3', title: 'riskBudget()', difficulty: 'Stretch',
        prompt: 'Write <code>riskBudget(config)</code> where config looks like <code>{ equity, risk: { perTrade, maxDaily } }</code>.<br>' +
          'Return <code>{ perTradeDollars, maxDailyDollars }</code> — the equity multiplied by each fraction.<br>' +
          'Default <code>perTrade</code> to <code>0.01</code> and <code>maxDaily</code> to <code>0.03</code> if absent, and handle a completely missing <code>risk</code> object.',
        starter: 'function riskBudget(config) {\n  // nested destructuring with defaults\n}\n',
        solution: 'function riskBudget({ equity, risk: { perTrade = 0.01, maxDaily = 0.03 } = {} }) {\n  return { perTradeDollars: equity * perTrade, maxDailyDollars: equity * maxDaily };\n}',
        hints: ['A default on the nested object itself handles a missing <code>risk</code>: <code>risk: { ... } = {}</code>.',
                'Then each inner key can carry its own default.'],
        tests: { fn: 'riskBudget', approx: 1e-9, cases: [
          { args: [{ equity: 50000, risk: { perTrade: 0.02, maxDaily: 0.05 } }],
            expect: { perTradeDollars: 1000, maxDailyDollars: 2500 } },
          { args: [{ equity: 100000, risk: {} }],
            expect: { perTradeDollars: 1000, maxDailyDollars: 3000 }, name: 'empty risk object uses both defaults' },
          { args: [{ equity: 100000 }],
            expect: { perTradeDollars: 1000, maxDailyDollars: 3000 }, name: 'a missing risk object does not throw' }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>const { close: last } = bar;</code> create?',
        options: ['A variable <code>close</code>', 'A variable <code>last</code> holding <code>bar.close</code>', 'Two variables', 'A SyntaxError'],
        answer: 1,
        explain: 'The colon renames on the way out. The key is on the left of it, the new variable name on the right.' },
      { q: 'Object destructuring matches by…',
        options: ['Position', 'Key name', 'Type', 'Insertion order'],
        answer: 1,
        explain: 'Objects match by name and arrays match by position. Mixing that up is the usual first mistake.' },
      { q: 'Why write <code>function f({ open, close })</code> instead of <code>function f(bar)</code>?',
        options: ['It is faster', 'The signature documents exactly which fields the function uses', 'It copies the object', 'It prevents mutation'],
        answer: 1,
        explain: 'The parameter list becomes a contract: a reader sees the required fields without reading the body.' }
    ],
    recap: [
      'Objects destructure by key name, arrays by position.',
      'Rename with <code>{ key: newName }</code>, default with <code>{ key = value }</code>.',
      'Destructure in the parameter list to document what a function needs.',
      'Give a nested object its own <code>= {}</code> default so a missing branch does not throw.'
    ],
    vocab: [
      { term: 'Risk budget', def: 'The dollars a trader allows themselves to lose per trade and per day. Hitting the daily budget means stopping — the rule that keeps accounts alive.' }
    ]
  });


  C.push({
    id: 'd022', day: 22, module: 2, minutes: 25,
    title: 'Spread and Rest',
    subtitle: 'Three dots that copy, merge, and collect.',
    goal: '<b>Goal:</b> copy and merge arrays and objects without mutating anything, and write functions that accept any number of arguments.',
    objectives: [
      'Spread arrays and objects to make copies',
      'Merge with later values winning',
      'Collect extra arguments with rest parameters',
      'Know that spread is a shallow copy'
    ],
    sections: [
      { h: 'Spread copies and merges',
        body: '<p><code>...</code> in a literal <strong>spreads</strong> the contents in. It is the shortest safe copy you can write.</p>',
        code: 'const a = [1, 2], b = [3, 4];\nconsole.log([...a, ...b]);        // [1,2,3,4]\nconsole.log([...a]);              // a copy, not the same array\n\nconst base = { qty: 1, tif: "day" };\nconst order = { ...base, qty: 3 };  // later keys win\nconsole.log(order);' },
      { h: 'Spread into function arguments',
        body: '<p>An array becomes separate arguments — the standard way to use <code>Math.max</code> on a series.</p>' +
              '<div class="note note-warn"><b>Not for huge arrays</b>Each element becomes an argument, and engines cap argument counts around 100k. On a long series use <code>reduce</code> instead of <code>Math.max(...arr)</code>.</div>',
        code: 'console.log(Math.max(...closes).toFixed(2));\nconsole.log(Math.min(...closes).toFixed(2));\n\n// safe for any length\nconst high = closes.reduce((m, c) => c > m ? c : m, -Infinity);\nconsole.log(high.toFixed(2));' },
      { h: 'Rest collects the leftovers',
        body: '<p>In a parameter list, <code>...</code> means the opposite: gather every remaining argument into an array. It must be last.</p>',
        code: 'function average(...values) {\n  if (!values.length) return 0;\n  return values.reduce((a, v) => a + v, 0) / values.length;\n}\nconsole.log(average(10, 12, 11));\nconsole.log(average(...closes.slice(0, 5)).toFixed(2));\n\nfunction logTrade(symbol, ...tags) {\n  console.log(symbol, "tags:", tags);\n}\nlogTrade("ES", "breakout", "morning");' },
      { h: 'Spread is shallow',
        body: '<p>A spread copies the top level only. Nested objects are still shared, so mutating one reaches through into the "copy".</p>',
        code: 'const original = { symbol: "ES", risk: { stop: 8 } };\nconst copy = { ...original };\n\ncopy.symbol = "NQ";       // independent\ncopy.risk.stop = 99;      // SHARED\n\nconsole.log(original.symbol, original.risk.stop);' }
    ],
    parsons: {
      prompt: 'Build an order from defaults, overriding the quantity.',
      lines: [
        'const defaults = { tif: "day", type: "limit", qty: 1 };',
        'const order = { ...defaults, qty: 3 };',
        'console.log(order.qty, order.tif);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'mergeConfig()', difficulty: 'Core',
        prompt: 'Write <code>mergeConfig(defaults, overrides)</code> returning a new object where the override keys win, without modifying either argument.',
        starter: 'function mergeConfig(defaults, overrides) {\n  // merged copy, later wins\n}\n',
        solution: 'function mergeConfig(defaults, overrides) {\n  return { ...defaults, ...overrides };\n}',
        hints: ['Spread both into one new object literal.',
                'Whichever is spread last takes precedence.'],
        tests: { fn: 'mergeConfig', cases: [
          { args: [{ qty: 1, tif: 'day' }, { qty: 3 }], expect: { qty: 3, tif: 'day' } },
          { args: [{ a: 1 }, { b: 2 }], expect: { a: 1, b: 2 } },
          { args: [{}, {}], expect: {} }
        ], checks: [{
          name: 'does not modify either input', expose: ['mergeConfig'],
          run: function (s) {
            var d = { qty: 1 }, o = { qty: 3 };
            s.mergeConfig(d, o);
            return (d.qty === 1 && o.qty === 3) ? true : 'one of the inputs was mutated';
          }
        }] } },
      { id: 'e2', title: 'appendBar()', difficulty: 'Core',
        prompt: 'Write <code>appendBar(series, bar)</code> returning a <strong>new</strong> array with <code>bar</code> added at the end. The original must be untouched — this is the immutable counterpart to yesterday\'s <code>push</code>.',
        starter: 'function appendBar(series, bar) {\n  // new array, original untouched\n}\n',
        solution: 'function appendBar(series, bar) {\n  return [...series, bar];\n}',
        hints: ['Spread the old array into a new literal and add the item after it.',
                '<code>[...series, bar]</code> is the whole function.'],
        tests: { fn: 'appendBar', cases: [
          { args: [[1, 2], 3], expect: [1, 2, 3] },
          { args: [[], 1], expect: [1] }
        ], checks: [{
          name: 'the original array keeps its length', expose: ['appendBar'],
          run: function (s) {
            var a = [1, 2];
            s.appendBar(a, 3);
            return a.length === 2 ? true : 'the input array was mutated — use spread, not push';
          }
        }] } },
      { id: 'e3', title: 'summarise()', difficulty: 'Stretch',
        prompt: 'Write <code>summarise(label, ...values)</code> returning <code>{ label, count, min, max, mean }</code> over however many numbers are passed after the label.<br>' +
          'With no values, return <code>{ label, count: 0, min: null, max: null, mean: 0 }</code>.',
        starter: 'function summarise(label, ...values) {\n  // stats over the rest parameters\n}\n',
        solution: 'function summarise(label, ...values) {\n  if (!values.length) return { label, count: 0, min: null, max: null, mean: 0 };\n  return {\n    label,\n    count: values.length,\n    min: Math.min(...values),\n    max: Math.max(...values),\n    mean: values.reduce((a, v) => a + v, 0) / values.length\n  };\n}',
        hints: ['<code>...values</code> in the parameter list collects everything after <code>label</code>.',
                'Guard the empty case before calling <code>Math.min</code>, which returns <code>Infinity</code> with no arguments.'],
        tests: { fn: 'summarise', approx: 1e-9, cases: [
          { args: ['ES', 10, 12, 11], expect: { label: 'ES', count: 3, min: 10, max: 12, mean: 11 } },
          { args: ['NQ', 5], expect: { label: 'NQ', count: 1, min: 5, max: 5, mean: 5 } },
          { args: ['empty'], expect: { label: 'empty', count: 0, min: null, max: null, mean: 0 } }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>{ ...a, ...b }</code> produce when both have a <code>qty</code> key?',
        options: ['An error', 'The value from <code>a</code>', 'The value from <code>b</code>', 'An array of both'],
        answer: 2,
        explain: 'Later spreads overwrite earlier ones, which is exactly what makes the defaults-then-overrides pattern work.' },
      { q: 'Where must a rest parameter appear?',
        options: ['First', 'Anywhere', 'Last', 'Only alone'],
        answer: 2,
        explain: 'It collects everything remaining, so nothing can follow it.' },
      { q: 'After <code>const copy = {...original}</code>, changing <code>copy.risk.stop</code>…',
        options: ['only affects copy', 'also changes original.risk.stop', 'throws', 'creates a new risk object'],
        answer: 1,
        explain: 'Spread is shallow. Nested objects are shared by reference — the source of a whole family of subtle bugs.' }
    ],
    recap: [
      'Spread copies and merges; later values win.',
      '<code>Math.max(...arr)</code> works, but not on very long arrays.',
      'Rest parameters collect extra arguments and must come last.',
      'Spread copies one level deep only.'
    ],
    vocab: [
      { term: 'TIF (time in force)', def: 'How long an order stays live: day, GTC (good till cancelled), IOC (immediate or cancel).' }
    ]
  });

  C.push({
    id: 'd023', day: 23, module: 2, minutes: 30,
    title: 'Immutability: Not Breaking Your Data',
    subtitle: 'Reference vs value, and why backtests corrupt themselves.',
    goal: '<b>Goal:</b> update state by producing new values instead of mutating shared ones — the habit that keeps a backtest honest.',
    objectives: [
      'Explain the difference between value and reference assignment',
      'Update an object or array without mutating it',
      'Deep-copy when a shallow copy is not enough',
      'Recognise the aliasing bug in real code'
    ],
    sections: [
      { h: 'Primitives copy; objects alias',
        body: '<p>Assigning a number copies it. Assigning an object copies the <em>reference</em> — both names now point at the same thing.</p>',
        code: 'let a = 5;\nlet b = a;\nb = 10;\nconsole.log(a, b);            // 5 10 — independent\n\nconst p1 = { qty: 2 };\nconst p2 = p1;                // same object!\np2.qty = 99;\nconsole.log(p1.qty, p2.qty);  // 99 99' },
      { h: 'Immutable updates',
        body: '<p>Instead of changing an object, build a new one with the change applied. Arrays get the same treatment: <code>map</code> and <code>filter</code> already return new arrays, and <code>[...arr, x]</code> replaces <code>push</code>.</p>',
        code: 'const position = { symbol: "ES", qty: 2, stop: 5232 };\n\nconst tightened = { ...position, stop: 5236 };\nconsole.log(position.stop, tightened.stop);\n\nconst book = [{ id: 1, qty: 1 }, { id: 2, qty: 2 }];\nconst updated = book.map(p => p.id === 2 ? { ...p, qty: 5 } : p);\nconsole.log(book[1].qty, updated[1].qty);' },
      { h: 'Deep copies',
        body: '<p>Spread only protects the top level. For nested data use <code>structuredClone(x)</code>, or <code>JSON.parse(JSON.stringify(x))</code> when the data is plain and has no dates or functions.</p>',
        code: 'const config = { risk: { stop: 8, target: 24 } };\n\nconst shallow = { ...config };\nconst deep = structuredClone(config);\n\nshallow.risk.stop = 1;\nconsole.log("after shallow edit:", config.risk.stop);   // 1 — leaked\nconsole.log("deep copy still:", deep.risk.stop);        // 8' },
      { h: 'Why this matters for a backtest',
        body: '<div class="note note-trade"><b>The bug that fakes a profit</b>Suppose your backtester hands each strategy the same <code>bar</code> objects and one strategy writes a computed field onto them. Now every other strategy — and every later run — sees that field. Results become irreproducible, and the version that "worked" cannot be recovered. Treating market data as read-only removes the entire class of problem.</div>',
        code: 'const bar = { close: 5240 };\n\nfunction badIndicator(b) { b.sma = 5238; return b.close - b.sma; }\nfunction goodIndicator(b, sma) { return b.close - sma; }\n\nbadIndicator(bar);\nconsole.log("bar was modified:", bar);' }
    ],
    parsons: {
      prompt: 'Tighten a stop without mutating the original position.',
      lines: [
        'const position = { symbol: "ES", qty: 2, stop: 5232 };',
        'const tightened = { ...position, stop: 5236 };',
        'console.log(position.stop);',
        'console.log(tightened.stop);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'withStop()', difficulty: 'Core',
        prompt: 'Write <code>withStop(position, stop)</code> returning a new position object with the new stop, leaving the original untouched.',
        starter: 'function withStop(position, stop) {\n  // new object with the stop replaced\n}\n',
        solution: 'function withStop(position, stop) {\n  return { ...position, stop };\n}',
        hints: ['Spread the position, then override the one key.',
                '<code>{ ...position, stop }</code> uses shorthand for <code>stop: stop</code>.'],
        tests: { fn: 'withStop', cases: [
          { args: [{ symbol: 'ES', qty: 2, stop: 5232 }, 5236], expect: { symbol: 'ES', qty: 2, stop: 5236 } },
          { args: [{ symbol: 'NQ' }, 100], expect: { symbol: 'NQ', stop: 100 }, name: 'adds the key when absent' }
        ], checks: [{
          name: 'the original position is unchanged', expose: ['withStop'],
          run: function (s) {
            var p = { symbol: 'ES', stop: 1 };
            s.withStop(p, 2);
            return p.stop === 1 ? true : 'the input position was mutated';
          }
        }] } },
      { id: 'e2', title: 'updateQty()', difficulty: 'Core',
        prompt: 'Write <code>updateQty(book, id, qty)</code> returning a new array of positions where only the position with the matching <code>id</code> has its <code>qty</code> changed.<br>' +
          'Every other position object should be the <em>same object</em> as before — only the changed one is new.',
        starter: 'function updateQty(book, id, qty) {\n  // new array; only the matching position is a new object\n}\n',
        solution: 'function updateQty(book, id, qty) {\n  return book.map(p => p.id === id ? { ...p, qty } : p);\n}',
        hints: ['<code>map</code> already builds a new array.',
                'Return a spread copy for the match and the original object for everything else.'],
        tests: { fn: 'updateQty', cases: [
          { args: [[{ id: 1, qty: 1 }, { id: 2, qty: 2 }], 2, 5], expect: [{ id: 1, qty: 1 }, { id: 2, qty: 5 }] },
          { args: [[{ id: 1, qty: 1 }], 9, 5], expect: [{ id: 1, qty: 1 }], name: 'no match leaves everything alone' }
        ], checks: [{
          name: 'unchanged positions keep their identity', expose: ['updateQty'],
          run: function (s) {
            var p1 = { id: 1, qty: 1 }, p2 = { id: 2, qty: 2 };
            var out = s.updateQty([p1, p2], 2, 5);
            if (out[0] !== p1) return 'position 1 was copied unnecessarily — return it as-is';
            if (out[1] === p2) return 'position 2 was mutated instead of replaced with a copy';
            return true;
          }
        }, {
          name: 'the input array is not modified', expose: ['updateQty'],
          run: function (s) {
            var book = [{ id: 1, qty: 1 }];
            s.updateQty(book, 1, 9);
            return book[0].qty === 1 ? true : 'the original book was mutated';
          }
        }] } },
      { id: 'e3', title: 'deepCopyConfig()', difficulty: 'Stretch',
        prompt: 'Write <code>deepCopyConfig(config)</code> returning a copy so thorough that changing any nested value in the copy cannot affect the original.<br>' +
          'The config holds only plain objects, arrays, numbers, strings and booleans.',
        starter: 'function deepCopyConfig(config) {\n  // a genuinely independent copy\n}\n',
        solution: 'function deepCopyConfig(config) {\n  return JSON.parse(JSON.stringify(config));\n}',
        hints: ['<code>structuredClone</code> does this in one call, as does a JSON round-trip for plain data.',
                'A single spread is not enough — the nested objects would still be shared.'],
        tests: { fn: 'deepCopyConfig', cases: [
          { args: [{ risk: { stop: 8 }, symbols: ['ES', 'NQ'] }], expect: { risk: { stop: 8 }, symbols: ['ES', 'NQ'] } }
        ], checks: [{
          name: 'nested objects are independent', expose: ['deepCopyConfig'],
          run: function (s) {
            var c = { risk: { stop: 8 }, list: [1, 2] };
            var copy = s.deepCopyConfig(c);
            copy.risk.stop = 99;
            copy.list.push(3);
            if (c.risk.stop !== 8) return 'the nested risk object is still shared';
            if (c.list.length !== 2) return 'the nested array is still shared';
            return true;
          }
        }] } }
    ],
    quiz: [
      { q: 'After <code>const b = a;</code> where <code>a</code> is an object, how many objects exist?',
        options: ['Two', 'One, with two names pointing at it', 'One, frozen', 'Depends on const'],
        answer: 1,
        explain: 'Assignment copies the reference. Mutating through either name changes the same object.' },
      { q: 'Which produces a new array without touching the original?',
        options: ['<code>arr.push(x)</code>', '<code>arr.sort()</code>', '<code>[...arr, x]</code>', '<code>arr.splice(0,1)</code>'],
        answer: 2,
        explain: 'push, sort and splice all mutate. Spread builds a new array.' },
      { q: 'Why is treating market data as read-only worth the effort?',
        options: ['Performance', 'A field written onto a shared bar leaks into every other strategy and every later run', 'It is required by JavaScript', 'It reduces memory'],
        answer: 1,
        explain: 'Shared mutable data makes results depend on execution order — and irreproducible results cannot be trusted or debugged.' }
    ],
    recap: [
      'Primitives copy by value; objects and arrays copy by reference.',
      'Update by building a new value: <code>{...obj, key: v}</code> and <code>map</code>.',
      'Spread is shallow — use <code>structuredClone</code> for nested data.',
      'Read-only market data removes a whole class of backtest bugs.'
    ],
    vocab: [
      { term: 'Look-ahead bias', def: 'A backtest using information that was not available at the time. Mutating shared bars is one quiet way to introduce it.' }
    ]
  });

  C.push({
    id: 'd024', day: 24, module: 2, minutes: 25,
    title: 'Optional Chaining and Nullish Values',
    subtitle: '?. and ?? — surviving incomplete market data.',
    goal: '<b>Goal:</b> read from data that might be missing without crashing, and supply defaults that respect a legitimate zero.',
    objectives: [
      'Use <code>?.</code> to read through possibly-missing objects',
      'Use <code>??</code> for defaults that do not swallow 0',
      'Explain how <code>??</code> differs from <code>||</code>',
      'Combine both to parse a messy quote'
    ],
    sections: [
      { h: 'The crash you are avoiding',
        body: '<p>Reading a key off <code>undefined</code> throws. Real feeds drop fields all the time — a quote with no bid, a symbol with no spec — and one missing field should not take down the strategy.</p>',
        code: 'const quote = { symbol: "ES", bid: { price: 5240.25 } };\n\nconsole.log(quote.bid.price);\n\ntry {\n  console.log(quote.ask.price);      // ask is undefined\n} catch (e) {\n  console.log("Crash:", e.message);\n}\n\nconsole.log(quote.ask?.price);       // undefined, no crash' },
      { h: 'Optional chaining forms',
        body: '<p><code>?.</code> stops and yields <code>undefined</code> the moment the thing on its left is <code>null</code> or <code>undefined</code>. It works for properties, array indexes and calls.</p>',
        code: 'const feed = { quotes: null, onTick: null };\n\nconsole.log(feed.quotes?.[0]);        // undefined, not a crash\nconsole.log(feed.onTick?.());         // undefined, not a crash\nconsole.log(feed.missing?.deep?.value);' },
      { h: '?? respects zero; || does not',
        body: '<p><code>||</code> falls back on any falsy value — including <code>0</code> and <code>""</code>. <code>??</code> falls back only on <code>null</code> and <code>undefined</code>.</p>' +
              '<div class="note note-warn"><b>This one costs money</b><code>const size = order.qty || 1</code> turns a deliberate quantity of 0 into 1. <code>??</code> is almost always what you meant.</div>',
        code: 'const order = { qty: 0, tif: "" };\n\nconsole.log(order.qty || 1);   // 1  — wrong\nconsole.log(order.qty ?? 1);   // 0  — right\nconsole.log(order.tif || "day"); // "day"\nconsole.log(order.tif ?? "day"); // ""' },
      { h: 'Putting them together',
        body: '<p>Chain to reach in safely, then supply the default.</p>',
        code: 'const quotes = [\n  { symbol: "ES", bid: { price: 5240.25, size: 0 } },\n  { symbol: "NQ" }\n];\n\nfor (const q of quotes) {\n  const price = q.bid?.price ?? null;\n  const size  = q.bid?.size ?? null;\n  console.log(q.symbol, "price:", price, "size:", size);\n}' }
    ],
    parsons: {
      prompt: 'Read a possibly-missing bid price with a safe default.',
      lines: [
        'const quote = { symbol: "NQ" };',
        'const price = quote.bid?.price ?? 0;',
        'console.log(price);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'bidPrice()', difficulty: 'Core',
        prompt: 'Write <code>bidPrice(quote)</code> returning <code>quote.bid.price</code>, or <code>null</code> when either the quote or its bid is missing.<br>' +
          'A bid price of exactly <code>0</code> must be returned as <code>0</code>, not converted to null.',
        starter: 'function bidPrice(quote) {\n  // safe read with a null fallback\n}\n',
        solution: 'function bidPrice(quote) {\n  return quote?.bid?.price ?? null;\n}',
        hints: ['Chain <code>?.</code> through each possibly-missing level.',
                'Use <code>??</code> for the fallback so a price of 0 survives.'],
        tests: { fn: 'bidPrice', cases: [
          { args: [{ bid: { price: 5240.25 } }], expect: 5240.25 },
          { args: [{ bid: { price: 0 } }], expect: 0, name: 'a price of 0 is returned as 0, not null' },
          { args: [{ symbol: 'NQ' }], expect: null, name: 'a missing bid returns null' },
          { args: [undefined], expect: null, name: 'a missing quote returns null' },
          { args: [{ bid: {} }], expect: null }
        ] } },
      { id: 'e2', title: 'orderSize()', difficulty: 'Core',
        prompt: 'Write <code>orderSize(order, fallback)</code> returning <code>order.qty</code> when it is present and <code>fallback</code> only when <code>qty</code> is <code>null</code> or <code>undefined</code>.<br>' +
          'A deliberate <code>qty</code> of 0 must come back as 0.',
        starter: 'function orderSize(order, fallback) {\n  // ?? not ||\n}\n',
        solution: 'function orderSize(order, fallback) {\n  return order?.qty ?? fallback;\n}',
        hints: ['<code>||</code> would replace 0 with the fallback — use <code>??</code>.',
                'Guard the order itself with <code>?.</code> in case it is missing entirely.'],
        tests: { fn: 'orderSize', cases: [
          { args: [{ qty: 3 }, 1], expect: 3 },
          { args: [{ qty: 0 }, 1], expect: 0, name: 'a quantity of 0 is respected' },
          { args: [{}, 1], expect: 1 },
          { args: [null, 2], expect: 2 }
        ], source: [{ name: 'uses ?? rather than ||', pattern: /\|\|/, forbid: true,
          why: '|| would turn a deliberate qty of 0 into the fallback' }] } },
      { id: 'e3', title: 'normaliseQuote()', difficulty: 'Stretch',
        prompt: 'Write <code>normaliseQuote(raw)</code> turning a messy quote into a predictable shape:<br>' +
          '<code>{ symbol, bid, ask, bidSize, askSize, spread }</code><ul>' +
          '<li><code>symbol</code> — <code>raw.symbol</code> uppercased and trimmed, or <code>"UNKNOWN"</code> if absent</li>' +
          '<li><code>bid</code>/<code>ask</code> — <code>raw.bid?.price</code> and <code>raw.ask?.price</code>, or <code>null</code></li>' +
          '<li><code>bidSize</code>/<code>askSize</code> — the sizes, defaulting to <code>0</code></li>' +
          '<li><code>spread</code> — <code>ask - bid</code>, or <code>null</code> when either side is missing</li></ul>',
        starter: 'function normaliseQuote(raw) {\n  // return the normalised shape\n}\n',
        solution: 'function normaliseQuote(raw) {\n  const symbol = raw?.symbol?.trim().toUpperCase() ?? "UNKNOWN";\n  const bid = raw?.bid?.price ?? null;\n  const ask = raw?.ask?.price ?? null;\n  return {\n    symbol,\n    bid,\n    ask,\n    bidSize: raw?.bid?.size ?? 0,\n    askSize: raw?.ask?.size ?? 0,\n    spread: (bid === null || ask === null) ? null : ask - bid\n  };\n}',
        hints: ['Compute <code>bid</code> and <code>ask</code> into local variables first — the spread needs both.',
                'String methods can be chained after <code>?.</code>: <code>raw?.symbol?.trim()</code>.'],
        tests: { fn: 'normaliseQuote', approx: 1e-9, cases: [
          { args: [{ symbol: ' es ', bid: { price: 5240, size: 12 }, ask: { price: 5240.25, size: 8 } }],
            expect: { symbol: 'ES', bid: 5240, ask: 5240.25, bidSize: 12, askSize: 8, spread: 0.25 } },
          { args: [{ symbol: 'NQ', bid: { price: 18400 } }],
            expect: { symbol: 'NQ', bid: 18400, ask: null, bidSize: 0, askSize: 0, spread: null },
            name: 'a one-sided quote has a null spread' },
          { args: [{}],
            expect: { symbol: 'UNKNOWN', bid: null, ask: null, bidSize: 0, askSize: 0, spread: null } }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>quote.ask?.price</code> return when <code>ask</code> is undefined?',
        options: ['A TypeError', '<code>null</code>', '<code>undefined</code>', '<code>0</code>'],
        answer: 2,
        explain: 'Optional chaining short-circuits to <code>undefined</code> rather than throwing.' },
      { q: 'What is <code>0 ?? 5</code>?',
        options: ['<code>5</code>', '<code>0</code>', '<code>null</code>', '<code>NaN</code>'],
        answer: 1,
        explain: '<code>??</code> only falls back on null and undefined. <code>0 || 5</code> would give 5.' },
      { q: 'Why prefer <code>??</code> over <code>||</code> for a default position size?',
        options: ['It is newer', 'Because <code>||</code> replaces a deliberate size of 0', 'It is faster', 'They are identical'],
        answer: 1,
        explain: 'A flat position is a real decision. <code>||</code> would quietly turn it into a trade.' }
    ],
    recap: [
      '<code>?.</code> yields <code>undefined</code> instead of throwing on missing links.',
      '<code>??</code> falls back only on <code>null</code> and <code>undefined</code>.',
      '<code>||</code> also falls back on <code>0</code> and <code>""</code> — usually a bug.',
      'Normalise messy feed data into one predictable shape at the boundary.'
    ],
    vocab: [
      { term: 'Bid / ask', def: 'The best price buyers will pay and sellers will accept. Their difference is the spread — your first cost on every trade.' },
      { term: 'Spread', def: 'Ask minus bid. On ES it is usually one tick; in thin markets it widens and quietly eats the edge.' }
    ]
  });

  C.push({
    id: 'd025', day: 25, module: 2, minutes: 30,
    title: 'Map and Set',
    subtitle: 'Keyed lookups and uniqueness done properly.',
    goal: '<b>Goal:</b> keep a live book of positions keyed by symbol, and deduplicate a list of symbols.',
    objectives: [
      'Use <code>Map</code> for keyed collections with any key type',
      'Use <code>Set</code> for uniqueness and fast membership tests',
      'Convert between Maps, Sets, arrays and objects',
      'Know when a plain object is still the right choice'
    ],
    sections: [
      { h: 'Map: an object that admits it is a lookup table',
        body: '<p>A <code>Map</code> keeps insertion order, has a real <code>size</code>, accepts any key type, and never collides with inherited property names.</p>',
        code: 'const book = new Map();\nbook.set("ES", { qty: 2, entry: 5240.25 });\nbook.set("NQ", { qty: -1, entry: 18420 });\n\nconsole.log(book.get("ES"));\nconsole.log(book.has("CL"));\nconsole.log(book.size);\n\nfor (const [symbol, pos] of book) {\n  console.log(symbol, pos.qty);\n}\n\nbook.delete("NQ");\nconsole.log([...book.keys()]);' },
      { h: 'Set: each value once',
        body: '<p>A <code>Set</code> stores unique values and answers <code>has</code> in constant time — much better than <code>array.includes</code> inside a loop.</p>',
        code: 'const traded = new Set(["ES", "NQ", "ES", "CL", "ES"]);\nconsole.log(traded.size);        // 3\nconsole.log(traded.has("NQ"));\nconsole.log([...traded]);\n\n// deduplicate in one expression\nconst symbols = trades.map(t => t.symbol);\nconsole.log([...new Set(symbols)]);' },
      { h: 'Converting back and forth',
        body: '<p>Spread turns either into an array. <code>Object.fromEntries</code> turns a Map into a plain object, and <code>Object.entries</code> goes the other way.</p>',
        code: 'const m = new Map([["ES", 1250], ["NQ", -430]]);\n\nconsole.log([...m]);                    // [["ES",1250],["NQ",-430]]\nconsole.log([...m.keys()]);\nconsole.log(Object.fromEntries(m));     // {ES:1250, NQ:-430}\n\nconst back = new Map(Object.entries({ CL: 620 }));\nconsole.log(back.get("CL"));' },
      { h: 'Map or plain object?',
        body: '<table><tr><th>Use</th><th>When</th></tr>' +
              '<tr><td><code>Map</code></td><td>keys are dynamic, you need <code>size</code>, or you iterate often</td></tr>' +
              '<tr><td>Object</td><td>a fixed set of known fields, or you need JSON</td></tr>' +
              '<tr><td><code>Set</code></td><td>membership and uniqueness</td></tr></table>' +
              '<div class="note note-warn"><b>Maps do not JSON.stringify</b><code>JSON.stringify(new Map(...))</code> gives <code>{}</code>. Convert with <code>Object.fromEntries</code> before serialising.</div>' }
    ],
    parsons: {
      prompt: 'Deduplicate the symbols traded today.',
      lines: [
        'const symbols = trades.map(t => t.symbol);',
        'const unique = new Set(symbols);',
        'const list = [...unique];',
        'console.log(list.length, list);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'uniqueSymbols()', difficulty: 'Core',
        prompt: 'Write <code>uniqueSymbols(trades)</code> returning an array of each distinct symbol, in the order it first appears.',
        starter: 'function uniqueSymbols(trades) {\n  // distinct symbols, first-seen order\n}\n',
        solution: 'function uniqueSymbols(trades) {\n  return [...new Set(trades.map(t => t.symbol))];\n}',
        hints: ['Map to symbols first, then build a <code>Set</code> from them.',
                'Sets keep insertion order, so spreading one back out preserves first-seen order.'],
        tests: { fn: 'uniqueSymbols', cases: [
          { args: [[{ symbol: 'ES' }, { symbol: 'NQ' }, { symbol: 'ES' }]], expect: ['ES', 'NQ'] },
          { args: [[]], expect: [] },
          { args: [[{ symbol: 'CL' }]], expect: ['CL'] }
        ], source: [{ name: 'uses a Set', pattern: /new\s+Set/, why: 'this level is about Set' }] } },
      { id: 'e2', title: 'buildBook()', difficulty: 'Core',
        prompt: 'Write <code>buildBook(positions)</code> returning a <code>Map</code> from symbol to position object.<br>' +
          'If the same symbol appears twice, the later one wins.',
        starter: 'function buildBook(positions) {\n  // Map from symbol -> position\n}\n',
        solution: 'function buildBook(positions) {\n  const book = new Map();\n  for (const p of positions) book.set(p.symbol, p);\n  return book;\n}',
        hints: ['Create the Map, loop, and <code>set</code> each one.',
                '<code>set</code> on an existing key overwrites, which gives "later wins" for free.'],
        tests: { fn: 'buildBook', checks: [], cases: [
          { args: [[{ symbol: 'ES', qty: 2 }, { symbol: 'NQ', qty: 1 }]],
            check: function (got) {
              if (!(got instanceof Map)) return 'expected a Map, got ' + (got && got.constructor && got.constructor.name);
              if (got.size !== 2) return 'expected size 2, got ' + got.size;
              if (got.get('ES').qty !== 2) return 'ES lookup is wrong';
              return true;
            }, name: 'returns a Map keyed by symbol' },
          { args: [[{ symbol: 'ES', qty: 2 }, { symbol: 'ES', qty: 9 }]],
            check: function (got) {
              if (!(got instanceof Map)) return 'expected a Map';
              if (got.size !== 1) return 'duplicate symbols should collapse to one entry';
              return got.get('ES').qty === 9 ? true : 'the later position should win';
            }, name: 'a repeated symbol keeps the later position' },
          { args: [[]],
            check: function (got) { return (got instanceof Map && got.size === 0) ? true : 'expected an empty Map'; },
            name: 'no positions gives an empty Map' }
        ] } },
      { id: 'e3', title: 'pnlBySymbol()', difficulty: 'Stretch',
        prompt: 'Write <code>pnlBySymbol(trades)</code> returning a plain <strong>object</strong> mapping each symbol to its total P&L in <em>points</em>.<br>' +
          'Long points are <code>exit - entry</code>, short points are <code>entry - exit</code>, multiplied by <code>qty</code>.<br>' +
          'Build it with a <code>Map</code> internally, then convert to an object before returning.',
        starter: 'function pnlBySymbol(trades) {\n  // Map internally, plain object out\n}\n',
        solution: 'function pnlBySymbol(trades) {\n  const m = new Map();\n  for (const t of trades) {\n    const pts = (t.side === "long" ? t.exit - t.entry : t.entry - t.exit) * t.qty;\n    m.set(t.symbol, (m.get(t.symbol) ?? 0) + pts);\n  }\n  return Object.fromEntries(m);\n}',
        hints: ['<code>m.get(key) ?? 0</code> gives you the running total or a zero seed.',
                '<code>Object.fromEntries(map)</code> converts at the end.'],
        tests: { fn: 'pnlBySymbol', approx: 1e-9, cases: [
          { args: [[{ symbol: 'ES', side: 'long', entry: 100, exit: 110, qty: 1 },
                    { symbol: 'ES', side: 'long', entry: 100, exit: 95, qty: 1 },
                    { symbol: 'NQ', side: 'short', entry: 200, exit: 190, qty: 2 }]],
            expect: { ES: 5, NQ: 20 } },
          { args: [[]], expect: {} }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>new Set([1, 2, 2, 3]).size</code> return?',
        options: ['4', '3', '2', '1'],
        answer: 1,
        explain: 'Duplicates collapse. This is the idiomatic deduplication tool.' },
      { q: 'What does <code>JSON.stringify(new Map([["a", 1]]))</code> produce?',
        options: ['<code>{"a":1}</code>', '<code>{}</code>', '<code>[["a",1]]</code>', 'A TypeError'],
        answer: 1,
        explain: 'Maps have no JSON representation. Convert with <code>Object.fromEntries</code> first.' },
      { q: 'When is a Map clearly better than a plain object?',
        options: ['Always', 'When keys are dynamic and you need size and ordered iteration', 'When storing numbers', 'When using JSON'],
        answer: 1,
        explain: 'Objects are fine for fixed known fields. Maps win for dynamic keyed collections you iterate and count.' }
    ],
    recap: [
      '<code>Map</code>: any key type, real <code>size</code>, insertion order preserved.',
      '<code>Set</code>: unique values and constant-time membership.',
      '<code>[...new Set(arr)]</code> deduplicates in one expression.',
      'Convert a Map with <code>Object.fromEntries</code> before serialising.'
    ],
    vocab: [
      { term: 'Book', def: 'The current set of open positions across instruments. Keyed by symbol, it is the state a live strategy manages.' }
    ]
  });

  C.push({
    id: 'd026', day: 26, module: 2, minutes: 25,
    title: 'JSON: Talking to the Outside World',
    subtitle: 'parse, stringify, and the data that arrives broken.',
    goal: '<b>Goal:</b> read a JSON payload from a data feed safely and write your results back out.',
    objectives: [
      'Convert between JSON text and JavaScript values',
      'Handle malformed JSON without crashing',
      'Know what JSON silently drops',
      'Pretty-print for humans and compact for the wire'
    ],
    sections: [
      { h: 'stringify out, parse in',
        body: '<p>JSON is text. <code>JSON.stringify</code> turns a value into text; <code>JSON.parse</code> turns text back into a value. Every HTTP API you will meet in module 4 speaks it.</p>',
        code: 'const position = { symbol: "ES", qty: 2, entry: 5240.25 };\n\nconst text = JSON.stringify(position);\nconsole.log(text, typeof text);\n\nconst back = JSON.parse(text);\nconsole.log(back.entry + 1, typeof back);' },
      { h: 'Parsing can throw — always guard it',
        body: '<p>A truncated response, an HTML error page, an empty body: all of them throw on parse. Wrap it.</p>',
        code: 'function safeParse(text, fallback = null) {\n  try {\n    return JSON.parse(text);\n  } catch (e) {\n    console.log("Bad JSON:", e.message);\n    return fallback;\n  }\n}\n\nconsole.log(safeParse(\'{"a":1}\'));\nconsole.log(safeParse("{oops", { error: true }));' },
      { h: 'What JSON quietly loses',
        body: '<p>Only objects, arrays, strings, numbers, booleans and null survive. Functions and <code>undefined</code> vanish; Dates become strings; <code>NaN</code> and <code>Infinity</code> become <code>null</code>; Maps and Sets become <code>{}</code>.</p>' +
              '<div class="note note-warn"><b>Infinity becomes null</b>A profit factor of <code>Infinity</code> serialises to <code>null</code> and comes back as a missing number. Normalise such values before you write them out.</div>',
        code: 'const messy = {\n  when: new Date("2024-05-14T13:30:00Z"),\n  pf: Infinity,\n  missing: undefined,\n  calc: () => 1,\n  tags: new Set(["a"])\n};\nconsole.log(JSON.stringify(messy));' },
      { h: 'Formatting',
        body: '<p>The third argument to <code>stringify</code> is an indent. Use it for files and logs, omit it for the wire. The second argument can pick fields.</p>',
        code: 'const report = { symbol: "ES", net: 1250, trades: 8, secret: "hide me" };\n\nconsole.log(JSON.stringify(report, null, 2));\nconsole.log(JSON.stringify(report, ["symbol", "net"]));' }
    ],
    parsons: {
      prompt: 'Parse a payload defensively and read a field.',
      lines: [
        'const payload = \'{"symbol":"ES","last":5240.25}\';',
        'let quote;',
        'try {',
        '  quote = JSON.parse(payload);',
        '} catch (e) {',
        '  quote = null;',
        '}',
        'console.log(quote?.last ?? "unavailable");'
      ]
    },
    exercises: [
      { id: 'e1', title: 'safeParse()', difficulty: 'Core',
        prompt: 'Write <code>safeParse(text, fallback)</code> returning the parsed value, or <code>fallback</code> when the text is not valid JSON.<br>' +
          '<code>fallback</code> should default to <code>null</code>.',
        starter: 'function safeParse(text, fallback) {\n  // parse or fall back\n}\n',
        solution: 'function safeParse(text, fallback = null) {\n  try {\n    return JSON.parse(text);\n  } catch (e) {\n    return fallback;\n  }\n}',
        hints: ['Wrap <code>JSON.parse</code> in <code>try { } catch (e) { }</code>.',
                'Give the parameter a default: <code>fallback = null</code>.'],
        tests: { fn: 'safeParse', cases: [
          { args: ['{"a":1}'], expect: { a: 1 } },
          { args: ['[1,2,3]'], expect: [1, 2, 3] },
          { args: ['{broken'], expect: null, name: 'malformed JSON returns the default null' },
          { args: ['{broken', { error: true }], expect: { error: true }, name: 'malformed JSON returns the given fallback' },
          { args: [''], expect: null, name: 'an empty body does not crash' }
        ] } },
      { id: 'e2', title: 'toWire()', difficulty: 'Core',
        prompt: 'Write <code>toWire(report)</code> returning a compact JSON string, with any non-finite number (<code>Infinity</code>, <code>-Infinity</code>, <code>NaN</code>) replaced by the string <code>"n/a"</code> first.<br>' +
          'Only top-level numeric fields need handling.',
        starter: 'function toWire(report) {\n  // clean non-finite numbers, then stringify\n}\n',
        solution: 'function toWire(report) {\n  const clean = {};\n  for (const [k, v] of Object.entries(report)) {\n    clean[k] = (typeof v === "number" && !Number.isFinite(v)) ? "n/a" : v;\n  }\n  return JSON.stringify(clean);\n}',
        hints: ['<code>Number.isFinite(v)</code> is false for NaN and both infinities.',
                'Build a cleaned object with <code>Object.entries</code>, then stringify it.'],
        tests: { fn: 'toWire', cases: [
          { args: [{ net: 1250, pf: Infinity }], expect: '{"net":1250,"pf":"n/a"}' },
          { args: [{ x: NaN }], expect: '{"x":"n/a"}' },
          { args: [{ a: 1, b: 'ok' }], expect: '{"a":1,"b":"ok"}' }
        ] } },
      { id: 'e3', title: 'parseFeed()', difficulty: 'Stretch',
        prompt: 'A feed sends one JSON object per line. Write <code>parseFeed(text)</code> returning <code>{ quotes, errors }</code>:<ul>' +
          '<li><code>quotes</code> — every line that parsed successfully, in order</li>' +
          '<li><code>errors</code> — the <strong>line numbers</strong> (starting at 1) that failed</li></ul>' +
          'Blank lines should be skipped entirely — neither a quote nor an error.',
        starter: 'function parseFeed(text) {\n  // return { quotes, errors }\n}\n',
        solution: 'function parseFeed(text) {\n  const quotes = [], errors = [];\n  text.split("\\n").forEach((line, i) => {\n    const trimmed = line.trim();\n    if (!trimmed) return;\n    try {\n      quotes.push(JSON.parse(trimmed));\n    } catch (e) {\n      errors.push(i + 1);\n    }\n  });\n  return { quotes, errors };\n}',
        hints: ['Split on <code>"\\n"</code> and use the callback index for the line number.',
                'Skip blank lines with an early <code>return</code> inside <code>forEach</code>.'],
        tests: { fn: 'parseFeed', cases: [
          { args: ['{"s":"ES"}\n{"s":"NQ"}'], expect: { quotes: [{ s: 'ES' }, { s: 'NQ' }], errors: [] } },
          { args: ['{"s":"ES"}\nbroken\n{"s":"CL"}'], expect: { quotes: [{ s: 'ES' }, { s: 'CL' }], errors: [2] } },
          { args: ['{"s":"ES"}\n\n{"s":"NQ"}'], expect: { quotes: [{ s: 'ES' }, { s: 'NQ' }], errors: [] },
            name: 'blank lines are skipped, not counted as errors' },
          { args: [''], expect: { quotes: [], errors: [] } }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>JSON.parse("{broken")</code> do?',
        options: ['Returns null', 'Returns undefined', 'Throws a SyntaxError', 'Returns an empty object'],
        answer: 2,
        explain: 'It throws. Any parse of data you did not create yourself belongs inside a try/catch.' },
      { q: 'What happens to a <code>Date</code> passed through <code>JSON.stringify</code> then <code>JSON.parse</code>?',
        options: ['It stays a Date', 'It becomes an ISO string', 'It becomes null', 'It throws'],
        answer: 1,
        explain: 'Dates serialise to ISO strings and come back as strings. Re-create the Date yourself after parsing.' },
      { q: 'What does <code>JSON.stringify({pf: Infinity})</code> produce?',
        options: ['<code>{"pf":Infinity}</code>', '<code>{"pf":null}</code>', '<code>{}</code>', 'A TypeError'],
        answer: 1,
        explain: 'JSON has no representation for Infinity or NaN, so both become <code>null</code>.' }
    ],
    recap: [
      '<code>stringify</code> out, <code>parse</code> in — JSON is always text.',
      'Always guard <code>JSON.parse</code> with try/catch.',
      'Dates become strings; <code>undefined</code>, functions, Maps and Sets are lost.',
      '<code>Infinity</code> and <code>NaN</code> become <code>null</code> — normalise first.'
    ],
    vocab: [
      { term: 'Payload', def: 'The body of a message from an API or feed — for market data, almost always JSON.' }
    ]
  });

  C.push({
    id: 'd027', day: 27, module: 2, minutes: 30,
    title: 'Dates and Session Windows',
    subtitle: 'Timestamps, time zones, and only trading the right hours.',
    goal: '<b>Goal:</b> filter bars down to the regular trading session, and measure how long a trade was held.',
    objectives: [
      'Create and read <code>Date</code> objects and epoch milliseconds',
      'Convert between timestamps and readable time',
      'Compute durations correctly',
      'Filter a series by a time-of-day window'
    ],
    sections: [
      { h: 'A timestamp is just a number',
        body: '<p>JavaScript dates are milliseconds since 1 January 1970 UTC. Every bar in <code>bars</code> carries one in its <code>time</code> field. Subtracting two timestamps gives a duration in milliseconds — arithmetic, not date logic.</p>',
        code: 'const t = bars[0].time;\nconsole.log(t);\nconsole.log(new Date(t).toISOString());\n\nconst held = bars[12].time - bars[0].time;\nconsole.log(held / 60000, "minutes of data");' },
      { h: 'Reading the parts',
        body: '<p>The <code>getUTC*</code> family reads in UTC; the plain <code>get*</code> family reads in whatever zone the browser is in. For market work, pick one and be explicit — mixing them is where the bugs live.</p>',
        code: 'const d = new Date(bars[0].time);\n\nconsole.log("UTC hour:", d.getUTCHours(), "minute:", d.getUTCMinutes());\nconsole.log("Local hour:", d.getHours());\nconsole.log(d.toISOString());' },
      { h: 'Durations',
        body: '<p>Subtract, then divide by the unit. Never build durations by comparing formatted strings.</p>',
        code: 'const open = Date.UTC(2024, 4, 14, 13, 30);   // 09:30 ET\nconst close = Date.UTC(2024, 4, 14, 20, 0);   // 16:00 ET\n\nconst ms = close - open;\nconsole.log(ms / 60000, "minutes");\nconsole.log((ms / 3600000).toFixed(2), "hours");' },
      { h: 'Session filtering',
        body: '<p>The US index futures session that matters runs 09:30–16:00 New York — 13:30–20:00 UTC when the US is on daylight time. Overnight bars are thinner, wider-spread and behave differently, so most intraday strategies exclude them.</p>' +
              '<div class="note note-warn"><b>Daylight saving is real</b>New York is UTC−4 in summer and UTC−5 in winter, so a hard-coded UTC window drifts by an hour twice a year. Production code uses a timezone library or the exchange\'s own session data. The sample dataset here is a single summer session, so a fixed window is safe.</div>',
        code: 'const inSession = bars.filter(b => {\n  const h = new Date(b.time).getUTCHours();\n  const m = new Date(b.time).getUTCMinutes();\n  const mins = h * 60 + m;\n  return mins >= 13 * 60 + 30 && mins < 20 * 60;\n});\nconsole.log(`${inSession.length} of ${bars.length} bars are in the RTH session`);' }
    ],
    parsons: {
      prompt: 'Measure how many minutes a trade was held.',
      lines: [
        'const entryTime = bars[0].time;',
        'const exitTime = bars[6].time;',
        'const heldMs = exitTime - entryTime;',
        'const heldMinutes = heldMs / 60000;',
        'console.log(heldMinutes);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'minutesHeld()', difficulty: 'Core',
        prompt: 'Write <code>minutesHeld(entryTime, exitTime)</code> returning the whole minutes between two epoch-millisecond timestamps, rounded down.<br>' +
          'If the exit is before the entry, return <code>0</code>.',
        starter: 'function minutesHeld(entryTime, exitTime) {\n  // whole minutes, never negative\n}\n',
        solution: 'function minutesHeld(entryTime, exitTime) {\n  return Math.max(0, Math.floor((exitTime - entryTime) / 60000));\n}',
        hints: ['One minute is 60000 milliseconds.',
                '<code>Math.floor</code> rounds down; <code>Math.max(0, ...)</code> clamps a negative result.'],
        tests: { fn: 'minutesHeld', cases: [
          { args: [0, 600000], expect: 10 },
          { args: [0, 90000], expect: 1, name: '90 seconds is one whole minute' },
          { args: [600000, 0], expect: 0, name: 'an exit before the entry gives 0' },
          { args: [1000, 1000], expect: 0 }
        ] } },
      { id: 'e2', title: 'utcMinuteOfDay()', difficulty: 'Core',
        prompt: 'Write <code>utcMinuteOfDay(timestamp)</code> returning how many minutes past UTC midnight the timestamp falls.<br>' +
          '13:30 UTC → <code>810</code>.',
        starter: 'function utcMinuteOfDay(timestamp) {\n  // minutes since UTC midnight\n}\n',
        solution: 'function utcMinuteOfDay(timestamp) {\n  const d = new Date(timestamp);\n  return d.getUTCHours() * 60 + d.getUTCMinutes();\n}',
        hints: ['Build a <code>Date</code>, then read <code>getUTCHours()</code> and <code>getUTCMinutes()</code>.',
                'Multiply the hours by 60 and add the minutes.'],
        tests: { fn: 'utcMinuteOfDay', cases: [
          { args: [Date.UTC(2024, 4, 14, 13, 30)], expect: 810 },
          { args: [Date.UTC(2024, 4, 14, 0, 0)], expect: 0 },
          { args: [Date.UTC(2024, 4, 14, 23, 59)], expect: 1439 }
        ] } },
      { id: 'e3', title: 'regularHours()', difficulty: 'Stretch',
        prompt: 'Write <code>regularHours(bars, startMinute, endMinute)</code> returning only the bars whose UTC minute-of-day is <code>&gt;= startMinute</code> and <code>&lt; endMinute</code>.<br>' +
          'Called with <code>810</code> and <code>1200</code> that is the 13:30–20:00 UTC window — the US cash session in summer.',
        starter: 'function regularHours(bars, startMinute, endMinute) {\n  // filter by UTC minute-of-day\n}\n',
        solution: 'function regularHours(bars, startMinute, endMinute) {\n  return bars.filter(b => {\n    const d = new Date(b.time);\n    const m = d.getUTCHours() * 60 + d.getUTCMinutes();\n    return m >= startMinute && m < endMinute;\n  });\n}',
        hints: ['Reuse the minute-of-day idea inside a <code>filter</code> predicate.',
                'The start is inclusive and the end is exclusive: <code>&gt;=</code> and <code>&lt;</code>.'],
        tests: { fn: 'regularHours', cases: [
          { args: [[{ time: Date.UTC(2024, 4, 14, 12, 0) }, { time: Date.UTC(2024, 4, 14, 14, 0) },
                    { time: Date.UTC(2024, 4, 14, 21, 0) }], 810, 1200],
            expect: [{ time: Date.UTC(2024, 4, 14, 14, 0) }] },
          { args: [[{ time: Date.UTC(2024, 4, 14, 13, 30) }], 810, 1200],
            expect: [{ time: Date.UTC(2024, 4, 14, 13, 30) }], name: 'the start minute is included' },
          { args: [[{ time: Date.UTC(2024, 4, 14, 20, 0) }], 810, 1200],
            expect: [], name: 'the end minute is excluded' }
        ] } }
    ],
    quiz: [
      { q: 'What does subtracting two <code>Date</code> objects give you?',
        options: ['A Date', 'Milliseconds between them', 'Days between them', 'A string'],
        answer: 1,
        explain: 'Dates coerce to their epoch-millisecond number, so subtraction gives a duration in milliseconds.' },
      { q: 'Why prefer <code>getUTCHours()</code> over <code>getHours()</code> in market code?',
        options: ['It is faster', '<code>getHours()</code> depends on the machine\'s local time zone', 'It handles leap years', 'They are identical'],
        answer: 1,
        explain: 'The same code would produce different sessions on a London laptop and a New York server. Pin the zone explicitly.' },
      { q: 'What happens to a fixed 13:30–20:00 UTC session window in November?',
        options: ['Nothing', 'It drifts an hour off because New York moves to UTC−5', 'It throws', 'It becomes 12:30–19:00 automatically'],
        answer: 1,
        explain: 'Daylight saving shifts the offset. Production code uses the exchange calendar or a timezone-aware library.' }
    ],
    recap: [
      'Timestamps are milliseconds since the Unix epoch.',
      'Subtract timestamps and divide by the unit to get durations.',
      'Use the <code>getUTC*</code> family so results do not depend on the machine.',
      'Fixed UTC session windows drift with daylight saving.'
    ],
    vocab: [
      { term: 'RTH / ETH', def: 'Regular Trading Hours (09:30–16:00 ET for US equities) versus Extended Trading Hours — the thinner overnight Globex session.' },
      { term: 'Epoch', def: 'The zero point of computer time: 1 January 1970, 00:00 UTC.' }
    ]
  });

  C.push({
    id: 'd028', day: 28, module: 2, minutes: 30,
    title: 'Pipelines: Composing Transforms',
    subtitle: 'Chaining small steps into a readable data flow.',
    goal: '<b>Goal:</b> take raw feed rows all the way to a ranked summary in a single readable chain.',
    objectives: [
      'Chain array methods into a pipeline',
      'Break a long chain into named steps when it stops reading well',
      'Use <code>flatMap</code> to expand and flatten in one pass',
      'Understand the cost of intermediate arrays'
    ],
    sections: [
      { h: 'A pipeline is a sentence',
        body: '<p>Each step does one thing, and the chain reads top to bottom as a description of the transformation.</p>',
        code: 'const topSymbols = trades\n  .map(t => ({\n    symbol: t.symbol,\n    points: (t.side === "long" ? t.exit - t.entry : t.entry - t.exit) * t.qty\n  }))\n  .filter(r => r.points > 0)\n  .sort((a, b) => b.points - a.points)\n  .slice(0, 3);\n\nconsole.log(topSymbols);' },
      { h: 'Name the steps when the chain gets long',
        body: '<p>Past four or five links, a chain stops being a sentence and starts being a puzzle. Break it into named intermediates — the names document the pipeline better than a comment would.</p>',
        code: 'const scored = trades.map(t => ({\n  ...t,\n  points: (t.side === "long" ? t.exit - t.entry : t.entry - t.exit) * t.qty\n}));\nconst winners = scored.filter(t => t.points > 0);\nconst ranked = [...winners].sort((a, b) => b.points - a.points);\n\nconsole.log(ranked.map(t => `${t.symbol} +${t.points.toFixed(2)}`));' },
      { h: 'flatMap expands then flattens',
        body: '<p>When one input produces several outputs — one bar generating multiple signals, one order filling in several parts — <code>flatMap</code> is <code>map</code> followed by one level of flattening.</p>',
        code: 'const orders = [\n  { id: 1, fills: [{ qty: 1 }, { qty: 1 }] },\n  { id: 2, fills: [{ qty: 3 }] }\n];\n\nconsole.log(orders.map(o => o.fills));      // nested\nconsole.log(orders.flatMap(o => o.fills));  // flat\n\n// flatMap can also filter: return [] to drop an item\nconst evens = [1, 2, 3, 4].flatMap(n => n % 2 === 0 ? [n] : []);\nconsole.log(evens);' },
      { h: 'Each link builds an array',
        body: '<p>A five-step chain over 100,000 bars builds five arrays. For lesson-sized data this is irrelevant; for a large optimisation sweep it is not. Measure before you contort readable code into a single loop.</p>' +
              '<div class="note note-tip"><b>Order matters for cost</b>Filter early. Narrowing 100,000 rows to 500 before mapping means the expensive step runs 500 times instead of 100,000.</div>' }
    ],
    parsons: {
      prompt: 'Rank the three biggest winning trades by points.',
      lines: [
        'const ranked = trades',
        '  .map(t => ({ symbol: t.symbol, pts: t.exit - t.entry }))',
        '  .filter(r => r.pts > 0)',
        '  .sort((a, b) => b.pts - a.pts)',
        '  .slice(0, 3);',
        'console.log(ranked);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'topWinners()', difficulty: 'Core',
        prompt: 'Write <code>topWinners(trades, n)</code> returning the <code>n</code> most profitable trades as objects <code>{ id, symbol, points }</code>, largest first.<br>' +
          'Points are <code>(exit - entry) × qty</code> for a long and <code>(entry - exit) × qty</code> for a short. Exclude anything not profitable.',
        starter: 'function topWinners(trades, n) {\n  // map -> filter -> sort -> slice\n}\n',
        solution: 'function topWinners(trades, n) {\n  return trades\n    .map(t => ({ id: t.id, symbol: t.symbol,\n      points: (t.side === "long" ? t.exit - t.entry : t.entry - t.exit) * t.qty }))\n    .filter(r => r.points > 0)\n    .sort((a, b) => b.points - a.points)\n    .slice(0, n);\n}',
        hints: ['Build the shape you want in the <code>map</code>, then the rest of the chain works on plain numbers.',
                'Sorting a freshly-mapped array is safe — it is already a new array.'],
        tests: { fn: 'topWinners', approx: 1e-9, cases: [
          { args: [[{ id: 1, symbol: 'ES', side: 'long', entry: 100, exit: 110, qty: 1 },
                    { id: 2, symbol: 'NQ', side: 'long', entry: 100, exit: 90, qty: 1 },
                    { id: 3, symbol: 'CL', side: 'short', entry: 100, exit: 80, qty: 2 }], 2],
            expect: [{ id: 3, symbol: 'CL', points: 40 }, { id: 1, symbol: 'ES', points: 10 }] },
          { args: [[{ id: 1, symbol: 'ES', side: 'long', entry: 100, exit: 90, qty: 1 }], 3],
            expect: [], name: 'no winners returns an empty array' }
        ] } },
      { id: 'e2', title: 'allFills()', difficulty: 'Core',
        prompt: 'Write <code>allFills(orders)</code> returning one flat array of every fill across every order, each fill tagged with its order id: <code>{ orderId, qty, price }</code>.<br>' +
          'Orders with no <code>fills</code> array contribute nothing.',
        starter: 'function allFills(orders) {\n  // flatMap to one flat list\n}\n',
        solution: 'function allFills(orders) {\n  return orders.flatMap(o =>\n    (o.fills ?? []).map(f => ({ orderId: o.id, qty: f.qty, price: f.price })));\n}',
        hints: ['<code>flatMap</code> flattens one level, so return an array from each callback.',
                '<code>(o.fills ?? [])</code> makes a missing fills list contribute an empty array.'],
        tests: { fn: 'allFills', cases: [
          { args: [[{ id: 1, fills: [{ qty: 1, price: 100 }, { qty: 2, price: 101 }] }, { id: 2, fills: [{ qty: 3, price: 99 }] }]],
            expect: [{ orderId: 1, qty: 1, price: 100 }, { orderId: 1, qty: 2, price: 101 }, { orderId: 2, qty: 3, price: 99 }] },
          { args: [[{ id: 1 }]], expect: [], name: 'an order with no fills contributes nothing' },
          { args: [[]], expect: [] }
        ], source: [{ name: 'uses flatMap', pattern: /\.flatMap\s*\(/, why: 'flatMap is the tool for expand-and-flatten' }] } },
      { id: 'e3', title: 'sessionSummary()', difficulty: 'Stretch',
        prompt: 'Write <code>sessionSummary(bars)</code> returning <code>{ bars, greenRate, avgRange, widest }</code>:<ul>' +
          '<li><code>bars</code> — how many bars</li>' +
          '<li><code>greenRate</code> — fraction closing above their open</li>' +
          '<li><code>avgRange</code> — mean of <code>high - low</code></li>' +
          '<li><code>widest</code> — the largest single range</li></ul>' +
          'An empty input returns all zeros.',
        starter: 'function sessionSummary(bars) {\n  // one object summarising the session\n}\n',
        solution: 'function sessionSummary(bars) {\n  if (!bars.length) return { bars: 0, greenRate: 0, avgRange: 0, widest: 0 };\n  const ranges = bars.map(b => b.high - b.low);\n  const green = bars.filter(b => b.close > b.open).length;\n  return {\n    bars: bars.length,\n    greenRate: green / bars.length,\n    avgRange: ranges.reduce((a, r) => a + r, 0) / ranges.length,\n    widest: Math.max(...ranges)\n  };\n}',
        hints: ['Compute the ranges array once and reuse it for both the average and the maximum.',
                'Guard the empty case first so no division by zero can happen.'],
        tests: { fn: 'sessionSummary', approx: 1e-9, cases: [
          { args: [[{ open: 1, close: 2, high: 3, low: 0 }, { open: 2, close: 1, high: 2.5, low: 1.5 }]],
            expect: { bars: 2, greenRate: 0.5, avgRange: 2, widest: 3 } },
          { args: [[]], expect: { bars: 0, greenRate: 0, avgRange: 0, widest: 0 } },
          { args: [[{ open: 1, close: 2, high: 2, low: 1 }]],
            expect: { bars: 1, greenRate: 1, avgRange: 1, widest: 1 } }
        ] } }
    ],
    quiz: [
      { q: 'How does <code>flatMap</code> differ from <code>map</code>?',
        options: ['It is faster', 'It flattens the result by one level', 'It filters out nulls', 'It sorts the result'],
        answer: 1,
        explain: 'Return an array from each callback and flatMap merges them. Returning <code>[]</code> drops that item entirely.' },
      { q: 'In a pipeline over a large dataset, why filter before mapping?',
        options: ['Style only', 'The map then runs on far fewer elements', 'filter cannot follow map', 'It avoids mutation'],
        answer: 1,
        explain: 'Narrow first, then do the expensive per-element work on what survives.' },
      { q: 'When should you break a chain into named variables?',
        options: ['Never', 'When the chain stops reading as a description of the transformation', 'Only for performance', 'Whenever it exceeds two links'],
        answer: 1,
        explain: 'Names are documentation. Once a reader has to trace what each link produces, the chain has become a puzzle.' }
    ],
    recap: [
      'Chains of small transforms read as a description of the data flow.',
      'Name intermediate steps once a chain stops being readable.',
      '<code>flatMap</code> expands and flattens in one pass.',
      'Filter early to keep the expensive steps cheap.'
    ],
    vocab: [
      { term: 'Fill', def: 'An execution against an order. One order can produce many fills at different prices — the average of them is your real entry.' },
      { term: 'Screener', def: 'A pipeline that filters and ranks a universe of instruments down to a shortlist worth trading.' }
    ]
  });

})();
