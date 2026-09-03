/* ============================================================
   MODULE 6 — Backtesting & Risk (levels 71–84)
   ============================================================ */
(function () {
  'use strict';
  var C = window.CURRICULUM, CX = window.CX;

  C.push({
    id: 'd071', day: 71, module: 6, minutes: 30,
    title: 'The Bar Loop and Event Ordering',
    subtitle: 'The order things happen inside one bar decides whether a backtest is honest.',
    goal: '<b>Goal:</b> write a bar loop whose event ordering cannot accidentally read the future.',
    objectives: [
      'Sequence the events inside a single bar',
      'Distinguish signal time from fill time',
      'Explain look-ahead bias with a concrete example',
      'Enforce a one-bar delay between signal and entry'
    ],
    sections: [
      { h: 'What happens inside one bar',
        body: '<p>A backtest processes each bar in a fixed order, and the order is the model:</p>' +
              '<ol><li><strong>Mark to market</strong> — update the open position\'s value at this bar\'s prices.</li>' +
              '<li><strong>Exits</strong> — check stops and targets against this bar\'s high and low.</li>' +
              '<li><strong>Signals</strong> — evaluate the rule using data up to and including this bar\'s close.</li>' +
              '<li><strong>Entries</strong> — act on the signal.</li></ol>' +
              '<p>Step 3 before step 4 is the honest ordering, and step 2 before both is what stops a strategy holding two positions.</p>' },
      { h: 'Signal time is not fill time',
        body: '<p>A signal computed from bar <em>i</em>\'s close cannot be filled at bar <em>i</em>\'s open — that price is already in the past. There are two defensible conventions:</p>' +
              '<table><tr><th>Convention</th><th>Fill</th><th>Realistic when</th></tr>' +
              '<tr><td>Close of the signal bar</td><td><code>bars[i].close</code></td><td>you can trade the closing print</td></tr>' +
              '<tr><td>Open of the next bar</td><td><code>bars[i+1].open</code></td><td>almost always — this is the conservative choice</td></tr></table>',
        code: 'const signalIndex = 10;\nconsole.log("signal computed on bar", signalIndex, "close:", MARKET.bars[signalIndex].close);\nconsole.log("optimistic fill:", MARKET.bars[signalIndex].close);\nconsole.log("conservative fill:", MARKET.bars[signalIndex + 1].open);\nconsole.log("difference:", (MARKET.bars[signalIndex + 1].open - MARKET.bars[signalIndex].close).toFixed(2), "points");' },
      { h: 'Look-ahead bias, concretely',
        body: '<div class="note note-warn"><b>The bug that makes everything profitable</b>Using <code>bars[i].close</code> in a signal but filling at <code>bars[i].open</code> means you decided using information from the end of the bar and traded at its beginning. Every strategy is profitable that way, and none of them are real.</div>' +
              '<p>The defence is structural: pass the loop only the data it is allowed to see.</p>',
        code: 'function signalAt(bars, i) {\n  const visible = bars.slice(0, i + 1);   // nothing after bar i exists\n  const last = visible[visible.length - 1];\n  const prev = visible[visible.length - 2];\n  if (!prev) return null;\n  return last.close > prev.close ? "long" : "short";\n}\n\nconsole.log(signalAt(MARKET.bars, 5));' },
      { h: 'A one-bar delay makes it structural',
        body: '<p>Compute the signal on bar <em>i</em>, store it, and act at bar <em>i+1</em>. The delay is enforced by the loop rather than by remembering, and the whole class of bug disappears.</p>',
        code: 'let pending = null, fills = [];\nfor (let i = 0; i < 6; i++) {\n  if (pending) {\n    fills.push({ bar: i, side: pending, price: MARKET.bars[i].open });\n    pending = null;\n  }\n  pending = i % 3 === 0 ? "long" : null;   // a toy signal\n}\nconsole.log(fills);' }
    ],
    parsons: {
      prompt: 'Order the events inside one bar correctly.',
      lines: [
        'markToMarket(bar);',
        'checkExits(bar);',
        'const signal = evaluateSignal(bars, i);',
        'if (signal) enterNextBar(signal);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'visibleData()', difficulty: 'Core',
        prompt: 'Write <code>visibleData(bars, i)</code> returning only the bars a signal evaluated at bar <code>i</code> is allowed to see — bar 0 through bar <code>i</code> inclusive, as a new array.<br>' +
          'An index beyond the end returns everything; a negative index returns an empty array.',
        starter: 'function visibleData(bars, i) {\n  // everything up to and including bar i\n}\n',
        solution: 'function visibleData(bars, i) {\n  if (i < 0) return [];\n  return bars.slice(0, i + 1);\n}',
        hints: ['<code>slice(0, i + 1)</code> is inclusive of bar <code>i</code>.',
                'Guard the negative index — <code>slice(0, 0)</code> would work but <code>slice(0, -1)</code> would not.'],
        tests: { fn: 'visibleData', cases: [
          { args: [[1, 2, 3, 4], 1], expect: [1, 2] },
          { args: [[1, 2, 3, 4], 0], expect: [1] },
          { args: [[1, 2, 3, 4], 99], expect: [1, 2, 3, 4], name: 'an index past the end returns everything' },
          { args: [[1, 2, 3, 4], -1], expect: [], name: 'a negative index returns nothing' },
          { args: [[], 0], expect: [] }
        ], checks: [{
          name: 'returns a copy, not the original array', expose: ['visibleData'],
          run: function (s) {
            var a = [1, 2, 3];
            var out = s.visibleData(a, 2);
            return out !== a ? true : 'return a copy so the caller cannot mutate history';
          }
        }] } },
      { id: 'e2', title: 'fillPrice()', difficulty: 'Core',
        prompt: 'Write <code>fillPrice(bars, signalIndex, convention)</code> returning the price a trade signalled on <code>signalIndex</code> would fill at.<ul>' +
          '<li><code>"close"</code> — <code>bars[signalIndex].close</code></li>' +
          '<li><code>"nextOpen"</code> — <code>bars[signalIndex + 1].open</code>, or <code>null</code> if there is no next bar</li></ul>' +
          'An unknown convention throws a <code>RangeError</code>.',
        starter: 'function fillPrice(bars, signalIndex, convention) {\n  // the price this signal actually fills at\n}\n',
        solution: 'function fillPrice(bars, signalIndex, convention) {\n  if (convention === "close") return bars[signalIndex].close;\n  if (convention === "nextOpen") {\n    const next = bars[signalIndex + 1];\n    return next ? next.open : null;\n  }\n  throw new RangeError(`unknown fill convention: ${convention}`);\n}',
        hints: ['Handle both known conventions, then throw for anything else.',
                'The last bar has no next bar, so <code>nextOpen</code> must return <code>null</code> there.'],
        tests: { fn: 'fillPrice', cases: [
          { args: [[{ close: 10, open: 9 }, { close: 12, open: 11 }], 0, 'close'], expect: 10 },
          { args: [[{ close: 10, open: 9 }, { close: 12, open: 11 }], 0, 'nextOpen'], expect: 11 },
          { args: [[{ close: 10, open: 9 }], 0, 'nextOpen'], expect: null, name: 'no next bar gives null' }
        ], checks: [{
          name: 'an unknown convention throws RangeError', expose: ['fillPrice'],
          run: function (s) {
            try { s.fillPrice([{ close: 1, open: 1 }], 0, 'magic'); }
            catch (e) { return e instanceof RangeError ? true : 'threw ' + e.name; }
            return 'an unknown convention should throw';
          }
        }] } },
      { id: 'e3', title: 'delayedEntryLoop()', difficulty: 'Stretch',
        prompt: 'Write <code>delayedEntryLoop(bars, signalFn)</code> where <code>signalFn(visibleBars, i)</code> returns <code>"long"</code>, <code>"short"</code> or <code>null</code>.<br>' +
          'Run the bar loop with a structural one-bar delay:<ol>' +
          '<li>at each bar, if a signal is pending from the previous bar, record a fill at <strong>this bar\'s open</strong> and clear it;</li>' +
          '<li>then evaluate <code>signalFn</code> with only the bars up to and including this one, and store the result as pending.</li></ol>' +
          'Return the array of fills as <code>{ signalIndex, fillIndex, side, price }</code>. A signal on the last bar never fills.',
        starter: 'function delayedEntryLoop(bars, signalFn) {\n  // signal on bar i, fill at the open of bar i+1\n}\n',
        solution: 'function delayedEntryLoop(bars, signalFn) {\n  const fills = [];\n  let pending = null;\n  for (let i = 0; i < bars.length; i++) {\n    if (pending) {\n      fills.push({ signalIndex: pending.index, fillIndex: i, side: pending.side, price: bars[i].open });\n      pending = null;\n    }\n    const side = signalFn(bars.slice(0, i + 1), i);\n    if (side === "long" || side === "short") pending = { side, index: i };\n  }\n  return fills;\n}',
        hints: ['Fill the pending signal <em>before</em> evaluating a new one, or a signal would fill on its own bar.',
                'Pass <code>bars.slice(0, i + 1)</code> so the signal function structurally cannot see ahead.',
                'A signal generated on the final bar simply never gets a fill bar.'],
        tests: { fn: 'delayedEntryLoop', cases: [
          { args: [[{ open: 10, close: 10 }, { open: 11, close: 11 }, { open: 12, close: 12 }],
                   function (visible, i) { return i === 0 ? 'long' : null; }],
            expect: [{ signalIndex: 0, fillIndex: 1, side: 'long', price: 11 }] },
          { args: [[{ open: 10, close: 10 }, { open: 11, close: 11 }],
                   function (visible, i) { return i === 1 ? 'long' : null; }],
            expect: [], name: 'a signal on the last bar never fills' },
          { args: [[{ open: 10, close: 10 }, { open: 11, close: 11 }, { open: 12, close: 12 }],
                   function () { return null; }],
            expect: [] },
          { args: [[], function () { return 'long'; }], expect: [] }
        ], checks: [
          { name: 'the signal function never sees future bars', expose: ['delayedEntryLoop'],
            run: function (s) {
              var maxSeen = -1, ok = true;
              s.delayedEntryLoop(MARKET.bars, function (visible, i) {
                if (visible.length !== i + 1) ok = false;
                maxSeen = Math.max(maxSeen, visible.length - 1);
                return null;
              });
              if (!ok) return 'the visible slice did not match the current index';
              return maxSeen === MARKET.bars.length - 1 ? true : 'the loop did not reach the last bar';
            } },
          { name: 'every fill happens one bar after its signal', expose: ['delayedEntryLoop'],
            run: function (s) {
              var fills = s.delayedEntryLoop(MARKET.bars, function (visible, i) { return i % 5 === 0 ? 'long' : null; });
              if (!fills.length) return 'no fills were produced';
              for (var i = 0; i < fills.length; i++) {
                if (fills[i].fillIndex !== fills[i].signalIndex + 1) return 'fill ' + i + ' is not one bar after its signal';
                if (fills[i].price !== MARKET.bars[fills[i].fillIndex].open) return 'fill ' + i + ' did not use the open';
              }
              return true;
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why check exits before entries within a bar?',
        options: ['Performance', 'Otherwise a strategy can hold two positions, or enter before recording the exit', 'It is arbitrary', 'To avoid NaN'],
        answer: 1,
        explain: 'The order of operations inside the bar is part of the model, not an implementation detail.' },
      { q: 'A signal uses bar <em>i</em>\'s close and fills at bar <em>i</em>\'s open. What is that?',
        options: ['Conservative', 'Look-ahead bias — deciding with information from after the fill', 'Slippage', 'Normal practice'],
        answer: 1,
        explain: 'The open already happened when the close was known. Every strategy is profitable this way and none are real.' },
      { q: 'What is the point of passing <code>bars.slice(0, i+1)</code> to the signal function?',
        options: ['Speed', 'Future bars structurally do not exist, so look-ahead becomes impossible rather than merely discouraged', 'Memory', 'To copy the data'],
        answer: 1,
        explain: 'Making the bug impossible beats remembering not to write it.' }
    ],
    recap: [
      'Mark to market, then exits, then signals, then entries.',
      'Signal time and fill time are different; next-bar open is the conservative choice.',
      'Look-ahead bias makes everything profitable and nothing real.',
      'Hand the signal function only the bars it may see.'
    ],
    vocab: [
      { term: 'Look-ahead bias', def: 'Using information in a backtest that was not available at the time. The most common reason a backtest cannot be reproduced live.' },
      { term: 'Fill convention', def: 'The rule deciding what price a signalled trade gets. Optimistic conventions inflate every result that follows.' }
    ]
  });

  C.push({
    id: 'd072', day: 72, module: 6, minutes: 30,
    title: 'Position Sizing',
    subtitle: 'The decision that matters more than the entry.',
    goal: '<b>Goal:</b> size every trade so a loss costs a fixed, survivable fraction of the account.',
    objectives: [
      'Size from risk per trade and stop distance',
      'Convert between points, dollars and contracts',
      'Apply a maximum-position cap',
      'Explain why fixed-fractional sizing beats fixed size'
    ],
    sections: [
      { h: 'The formula',
        body: '<p class="mono" style="color:var(--fg)">contracts = floor( equity × riskFraction ÷ (stopPoints × pointValue) )</p>' +
              '<p>The numerator is what you are willing to lose. The denominator is what one contract loses if the stop is hit. The ratio is how many you can hold.</p>',
        code: 'function size(equity, riskPercent, stopPoints, pointValue) {\n  const riskDollars = equity * riskPercent / 100;\n  const perContract = stopPoints * pointValue;\n  return Math.floor(riskDollars / perContract);\n}\n\n[[50000, 1, 8], [100000, 1, 8], [100000, 1, 20], [100000, 2, 8]].forEach(([e, r, sp]) =>\n  console.log(`$${e} at ${r}% with a ${sp}pt stop -> ${size(e, r, sp, 50)} contracts`));' },
      { h: 'Fixed fractional versus fixed size',
        body: '<p>Trading a constant two contracts means a 20-point stop risks 2.5× what an 8-point stop risks. Your worst losses cluster in exactly the conditions where stops must be widest — which is when you can least afford them.</p>' +
              '<p>Fixed-fractional sizing makes every loss cost the same. It also compounds: as equity grows, size grows; after a drawdown, size shrinks automatically.</p>',
        code: 'let fixedEquity = 100000, fracEquity = 100000;\nconst losses = [8, 20, 12, 30];   // stop distances in points\n\nlosses.forEach(stop => {\n  fixedEquity -= 2 * stop * 50;\n  const n = Math.floor(fracEquity * 0.01 / (stop * 50));\n  fracEquity -= n * stop * 50;\n});\nconsole.log("fixed 2 contracts:", fixedEquity.toFixed(0));\nconsole.log("fixed fractional:", fracEquity.toFixed(0));' },
      { h: 'Caps and floors',
        body: '<p>Two guards belong on every sizing function. A <strong>maximum</strong> stops a tiny stop from producing an absurd position when volatility collapses. A <strong>minimum of zero</strong> means an account too small for even one contract simply does not trade.</p>' +
              '<div class="note note-warn"><b>Rounding down is not optional</b>You cannot trade 2.7 contracts. Rounding up is a silent 11% increase in risk on that trade, every time.</div>' },
      { h: 'Why 1–2%',
        body: '<p>At 2% per trade, ten consecutive losses cost about 18% of the account. At 10% per trade, the same streak costs 65% — and recovering from that needs a 186% gain. The asymmetry of losses is the entire argument for small risk fractions.</p>',
        code: 'function afterStreak(risk, n) {\n  let eq = 100;\n  for (let i = 0; i < n; i++) eq *= (1 - risk);\n  return eq;\n}\n[0.01, 0.02, 0.05, 0.10].forEach(r => {\n  const left = afterStreak(r, 10);\n  console.log(`${(r * 100).toFixed(0)}% risk: ${left.toFixed(1)}% left, needs +${((100 / left - 1) * 100).toFixed(0)}% to recover`);\n});' }
    ],
    parsons: {
      prompt: 'Size a position from risk and stop distance.',
      lines: [
        'const riskDollars = equity * riskPercent / 100;',
        'const riskPerContract = stopPoints * pointValue;',
        'const raw = riskDollars / riskPerContract;',
        'const contracts = Math.max(0, Math.floor(raw));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'positionSize()', difficulty: 'Core',
        prompt: 'Write <code>positionSize({ equity, riskPercent, stopPoints, pointValue, maxContracts })</code> returning the number of contracts.<ul>' +
          '<li>Round down; never return a negative number.</li>' +
          '<li>Cap at <code>maxContracts</code> when it is given.</li>' +
          '<li>Return <code>0</code> if <code>stopPoints</code> or <code>pointValue</code> is 0 or less.</li></ul>',
        starter: 'function positionSize({ equity, riskPercent, stopPoints, pointValue, maxContracts }) {\n  // whole contracts, capped and floored\n}\n',
        solution: 'function positionSize({ equity, riskPercent, stopPoints, pointValue, maxContracts }) {\n  if (stopPoints <= 0 || pointValue <= 0) return 0;\n  const riskDollars = equity * riskPercent / 100;\n  const perContract = stopPoints * pointValue;\n  let n = Math.max(0, Math.floor(riskDollars / perContract));\n  if (maxContracts !== undefined && maxContracts !== null) n = Math.min(n, maxContracts);\n  return n;\n}',
        hints: ['Guard the degenerate denominators before dividing.',
                'Apply the floor and the zero clamp first, then the cap.',
                '<code>maxContracts</code> may be undefined — check before using it.'],
        tests: { fn: 'positionSize', cases: [
          { args: [{ equity: 100000, riskPercent: 1, stopPoints: 8, pointValue: 50 }], expect: 2 },
          { args: [{ equity: 50000, riskPercent: 1, stopPoints: 8, pointValue: 50 }], expect: 1 },
          { args: [{ equity: 25000, riskPercent: 1, stopPoints: 8, pointValue: 50 }], expect: 0,
            name: 'too small to risk one contract returns 0' },
          { args: [{ equity: 100000, riskPercent: 1, stopPoints: 8, pointValue: 50, maxContracts: 1 }], expect: 1,
            name: 'the cap applies' },
          { args: [{ equity: 100000, riskPercent: 1, stopPoints: 0, pointValue: 50 }], expect: 0,
            name: 'a zero stop returns 0, not Infinity' },
          { args: [{ equity: -5000, riskPercent: 1, stopPoints: 8, pointValue: 50 }], expect: 0,
            name: 'negative equity never returns a negative size' },
          { args: [{ equity: 100000, riskPercent: 1, stopPoints: 3, pointValue: 50 }], expect: 6,
            name: 'a fractional result rounds down' }
        ] } },
      { id: 'e2', title: 'riskOfTrade()', difficulty: 'Core',
        prompt: 'Write <code>riskOfTrade({ side, entry, stop, contracts, pointValue })</code> returning the dollars lost if the stop is hit.<br>' +
          'Always a positive number. If the stop is on the wrong side of the entry — above it for a long, below for a short — return <code>null</code>, because that is not a stop.',
        starter: 'function riskOfTrade({ side, entry, stop, contracts, pointValue }) {\n  // dollars at risk, or null for an invalid stop\n}\n',
        solution: 'function riskOfTrade({ side, entry, stop, contracts, pointValue }) {\n  const distance = side === "long" ? entry - stop : stop - entry;\n  if (distance <= 0) return null;\n  return distance * contracts * pointValue;\n}',
        hints: ['A long\'s stop is below the entry, so the distance is <code>entry - stop</code>.',
                'A non-positive distance means the stop is on the wrong side — return <code>null</code>.'],
        tests: { fn: 'riskOfTrade', approx: 1e-9, cases: [
          { args: [{ side: 'long', entry: 5240, stop: 5232, contracts: 2, pointValue: 50 }], expect: 800 },
          { args: [{ side: 'short', entry: 5240, stop: 5248, contracts: 1, pointValue: 50 }], expect: 400 },
          { args: [{ side: 'long', entry: 5240, stop: 5248, contracts: 1, pointValue: 50 }], expect: null,
            name: 'a long stop above the entry is invalid' },
          { args: [{ side: 'short', entry: 5240, stop: 5232, contracts: 1, pointValue: 50 }], expect: null,
            name: 'a short stop below the entry is invalid' },
          { args: [{ side: 'long', entry: 5240, stop: 5240, contracts: 1, pointValue: 50 }], expect: null,
            name: 'a stop at the entry is invalid' }
        ] } },
      { id: 'e3', title: 'Compare sizing regimes', difficulty: 'Stretch',
        prompt: 'Write <code>compareSizing(startEquity, trades, riskPercent, fixedContracts, pointValue)</code> where each trade is <code>{ stopPoints, outcome }</code> and <code>outcome</code> is <code>"win"</code> (gains 2 × stopPoints) or <code>"loss"</code> (loses stopPoints).<br>' +
          'Return <code>{ fixed, fractional }</code> — the final equity under each regime.<ul>' +
          '<li><strong>fixed</strong> always trades <code>fixedContracts</code>.</li>' +
          '<li><strong>fractional</strong> sizes each trade from its <em>current</em> equity at <code>riskPercent</code>, rounded down, never below 0.</li></ul>' +
          'Round both results to 2 decimals.',
        starter: 'function compareSizing(startEquity, trades, riskPercent, fixedContracts, pointValue) {\n  // { fixed, fractional }\n}\n',
        solution: 'function compareSizing(startEquity, trades, riskPercent, fixedContracts, pointValue) {\n  let fixed = startEquity, fractional = startEquity;\n  for (const t of trades) {\n    const points = t.outcome === "win" ? 2 * t.stopPoints : -t.stopPoints;\n    fixed += points * fixedContracts * pointValue;\n\n    const perContract = t.stopPoints * pointValue;\n    const n = perContract <= 0 ? 0\n      : Math.max(0, Math.floor(fractional * riskPercent / 100 / perContract));\n    fractional += points * n * pointValue;\n  }\n  const r = x => Math.round(x * 100) / 100;\n  return { fixed: r(fixed), fractional: r(fractional) };\n}',
        hints: ['Track two running equity values through the same loop.',
                'The fractional size must be recomputed from the <em>current</em> fractional equity on every trade.',
                'A win pays twice the stop distance, so the points are <code>+2 × stopPoints</code>.'],
        tests: { fn: 'compareSizing', approx: 1e-6, cases: [
          { args: [100000, [{ stopPoints: 8, outcome: 'loss' }], 1, 2, 50],
            expect: { fixed: 99200, fractional: 99200 },
            name: 'with equal sizing the two regimes agree' },
          { args: [100000, [{ stopPoints: 20, outcome: 'loss' }], 1, 2, 50],
            expect: { fixed: 98000, fractional: 99000 },
            name: 'a wide stop costs the fixed-size trader twice as much' },
          { args: [100000, [], 1, 2, 50], expect: { fixed: 100000, fractional: 100000 } },
          { args: [10000, [{ stopPoints: 8, outcome: 'win' }], 1, 1, 50],
            expect: { fixed: 10800, fractional: 10000 },
            name: 'an account too small to size sits the trade out' }
        ], checks: [{
          name: 'fractional sizing loses less over a losing streak', expose: ['compareSizing'],
          run: function (s) {
            var trades = [];
            for (var i = 0; i < 10; i++) trades.push({ stopPoints: 20, outcome: 'loss' });
            var r = s.compareSizing(200000, trades, 1, 2, 50);
            return r.fractional > r.fixed
              ? true : 'fractional (' + r.fractional + ') should survive a streak better than fixed (' + r.fixed + ')';
          }
        }] } }
    ],
    quiz: [
      { q: 'A $100k account risking 1% with a 10-point stop on ES ($50/point). How many contracts?',
        options: ['1', '2', '5', '10'],
        answer: 1,
        explain: '$1,000 risk ÷ (10 × $50) = 2 contracts exactly.' },
      { q: 'Why round position size down rather than up?',
        options: ['Convention', 'Rounding up silently exceeds the risk limit on every trade', 'It is faster', 'To avoid fractions'],
        answer: 1,
        explain: 'A 2.7 rounded to 3 is an 11% overshoot of your stated risk, every single time.' },
      { q: 'Ten consecutive losses at 10% risk each leave you with roughly…',
        options: ['90%', '65%', '35%', '0%'],
        answer: 2,
        explain: '0.9^10 ≈ 0.35. Recovering needs a 186% gain — which is the entire argument for 1–2%.' }
    ],
    recap: [
      'contracts = floor(equity × risk ÷ (stopPoints × pointValue)).',
      'Fixed-fractional sizing makes every loss cost the same and compounds automatically.',
      'Always round down, floor at zero, and cap the maximum.',
      'Losses are asymmetric — recovery costs more than the loss did.'
    ],
    vocab: [
      { term: 'Fixed fractional', def: 'Risking a constant percentage of current equity per trade. The default position-sizing method for systematic traders.' },
      { term: 'Risk of ruin', def: 'The probability of losing enough capital to be unable to continue. Rises sharply with risk per trade.' }
    ]
  });


  C.push({
    id: 'd073', day: 73, module: 6, minutes: 30,
    title: 'Equity Curves and Drawdown',
    subtitle: 'The number that decides whether a strategy is survivable.',
    goal: '<b>Goal:</b> build an equity curve and measure its worst peak-to-trough decline, in both dollars and time.',
    objectives: [
      'Build an equity curve from a trade log',
      'Compute the running peak and current drawdown',
      'Find maximum drawdown and its duration',
      'Explain why drawdown matters more than total return'
    ],
    sections: [
      { h: 'The curve',
        body: '<p>The equity curve is the running account balance after each trade. Everything in this level derives from it.</p>',
        code: 'function equityCurve(start, pnls) {\n  let eq = start;\n  return pnls.map(p => (eq += p));\n}\n\nconsole.log(equityCurve(10000, [500, -200, 800, -1500, 300]));' },
      { h: 'Drawdown is measured from the running peak',
        body: '<p>Drawdown at any point is how far below the highest equity ever reached you are. It is never positive: at a new high it is exactly 0.</p>' +
              '<p class="mono" style="color:var(--fg)">drawdown<sub>i</sub> = equity<sub>i</sub> − max(equity<sub>0..i</sub>)</p>',
        code: 'const curve = [10000, 10500, 10300, 11100, 9600, 9900];\nlet peak = -Infinity;\nconst dd = curve.map(e => {\n  peak = Math.max(peak, e);\n  return e - peak;\n});\nconsole.log("equity:  ", curve);\nconsole.log("drawdown:", dd);\nconsole.log("max drawdown:", Math.min(...dd));' },
      { h: 'Percentage drawdown compounds differently',
        body: '<p>A $1,500 drawdown on $10,000 is 15%; the same dollars on $100,000 is 1.5%. Percentage is the comparable measure, and it is what determines whether the account survives.</p>' +
              '<div class="note note-warn"><b>Recovery is not symmetric</b>A 20% drawdown needs a 25% gain to recover. A 50% drawdown needs 100%. This is why maximum drawdown, not total return, is the first number an allocator looks at.</div>',
        code: '[10, 20, 33, 50, 80].forEach(dd => {\n  const needed = (1 / (1 - dd / 100) - 1) * 100;\n  console.log(`${dd}% drawdown needs +${needed.toFixed(1)}% to recover`);\n});' },
      { h: 'Duration matters as much as depth',
        body: '<p>A 15% drawdown recovered in a week is an inconvenience. The same 15% lasting eight months is what makes people abandon a working strategy at the worst possible moment. Report both.</p>',
        code: 'const curve = [100, 110, 105, 95, 90, 96, 108, 115];\nlet peak = curve[0], start = 0, worst = { depth: 0, from: 0, to: 0 };\ncurve.forEach((e, i) => {\n  if (e >= peak) { peak = e; start = i; }\n  else if (peak - e > worst.depth) worst = { depth: peak - e, from: start, to: i };\n});\nconsole.log("deepest drawdown:", worst, "lasting", worst.to - worst.from, "trades");' }
    ],
    parsons: {
      prompt: 'Track drawdown against the running peak.',
      lines: [
        'let peak = -Infinity;',
        'const drawdowns = curve.map(equity => {',
        '  peak = Math.max(peak, equity);',
        '  return equity - peak;',
        '});',
        'console.log(Math.min(...drawdowns));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'equityCurve() and drawdownSeries()', difficulty: 'Core',
        prompt: 'Write two functions:<ul>' +
          '<li><code>equityCurve(start, pnls)</code> — the balance after each trade (the starting equity is not included)</li>' +
          '<li><code>drawdownSeries(curve)</code> — <code>equity − runningPeak</code> at each point, so always ≤ 0</li></ul>',
        expose: ['equityCurve', 'drawdownSeries'],
        starter: 'function equityCurve(start, pnls) {\n  // running balance after each trade\n}\n\nfunction drawdownSeries(curve) {\n  // distance below the running peak\n}\n',
        solution: 'function equityCurve(start, pnls) {\n  let eq = start;\n  return pnls.map(p => (eq += p));\n}\n\nfunction drawdownSeries(curve) {\n  let peak = -Infinity;\n  return curve.map(e => {\n    peak = Math.max(peak, e);\n    return e - peak;\n  });\n}',
        hints: ['Keep the running value outside the map in both functions.',
                'The peak only ever rises, so <code>Math.max</code> against itself is enough.'],
        tests: { checks: [
          { name: 'equityCurve accumulates the P&Ls', expose: ['equityCurve'],
            run: function (s, h) {
              return h.eq(s.equityCurve(10000, [500, -200, 800]), [10500, 10300, 11100])
                ? true : 'got ' + JSON.stringify(s.equityCurve(10000, [500, -200, 800]));
            } },
          { name: 'an empty trade list gives an empty curve', expose: ['equityCurve'],
            run: function (s, h) { return h.eq(s.equityCurve(10000, []), []) ? true : 'expected []'; } },
          { name: 'drawdownSeries is zero at each new high', expose: ['drawdownSeries'],
            run: function (s, h) {
              return h.eq(s.drawdownSeries([100, 110, 120]), [0, 0, 0]) ? true : 'a rising curve has no drawdown';
            } },
          { name: 'drawdownSeries measures below the peak', expose: ['drawdownSeries'],
            run: function (s, h) {
              return h.eq(s.drawdownSeries([100, 110, 105, 95, 130]), [0, 0, -5, -15, 0])
                ? true : 'got ' + JSON.stringify(s.drawdownSeries([100, 110, 105, 95, 130]));
            } },
          { name: 'drawdown is never positive', expose: ['drawdownSeries'],
            run: function (s) {
              var dd = s.drawdownSeries([5, 3, 9, 1, 12, 11]);
              return dd.every(function (v) { return v <= 0; }) ? true : 'a positive drawdown appeared: ' + JSON.stringify(dd);
            } }
        ] } },
      { id: 'e2', title: 'maxDrawdown()', difficulty: 'Core',
        prompt: 'Write <code>maxDrawdown(curve)</code> returning <code>{ depth, percent, peakIndex, troughIndex }</code>:<ul>' +
          '<li><code>depth</code> — the largest peak-to-trough fall, as a <strong>positive</strong> number</li>' +
          '<li><code>percent</code> — that as a percentage of the peak it fell from</li>' +
          '<li><code>peakIndex</code> / <code>troughIndex</code> — where it started and bottomed</li></ul>' +
          'An empty or never-declining curve returns all zeros with both indexes at 0.',
        starter: 'function maxDrawdown(curve) {\n  // { depth, percent, peakIndex, troughIndex }\n}\n',
        solution: 'function maxDrawdown(curve) {\n  let peak = -Infinity, peakIdx = 0;\n  let best = { depth: 0, percent: 0, peakIndex: 0, troughIndex: 0 };\n  for (let i = 0; i < curve.length; i++) {\n    if (curve[i] > peak) { peak = curve[i]; peakIdx = i; }\n    const depth = peak - curve[i];\n    if (depth > best.depth) {\n      best = {\n        depth,\n        percent: peak === 0 ? 0 : depth / peak * 100,\n        peakIndex: peakIdx,\n        troughIndex: i\n      };\n    }\n  }\n  return best;\n}',
        hints: ['Track the running peak <em>and the index it occurred at</em>.',
                'Update the best drawdown only when this one is deeper.',
                'Guard a peak of 0 before computing the percentage.'],
        tests: { fn: 'maxDrawdown', approx: 1e-9, cases: [
          { args: [[100, 110, 105, 95, 130]],
            expect: { depth: 15, percent: 15 / 110 * 100, peakIndex: 1, troughIndex: 3 } },
          { args: [[100, 110, 120]], expect: { depth: 0, percent: 0, peakIndex: 0, troughIndex: 0 },
            name: 'a curve that only rises has no drawdown' },
          { args: [[]], expect: { depth: 0, percent: 0, peakIndex: 0, troughIndex: 0 } },
          { args: [[100, 50]], expect: { depth: 50, percent: 50, peakIndex: 0, troughIndex: 1 } },
          { args: [[100, 90, 130, 100]],
            expect: { depth: 30, percent: 30 / 130 * 100, peakIndex: 2, troughIndex: 3 },
            name: 'a later, deeper drawdown replaces an earlier one' }
        ] } },
      { id: 'e3', title: 'drawdownReport()', difficulty: 'Stretch',
        prompt: 'Write <code>drawdownReport(curve)</code> returning <code>{ maxDepth, maxPercent, longestDuration, currentDrawdown, inDrawdown, recovered }</code>:<ul>' +
          '<li><code>maxDepth</code>/<code>maxPercent</code> — as in the previous exercise</li>' +
          '<li><code>longestDuration</code> — the most points spent below a peak before making a new high (the count of points strictly below the peak)</li>' +
          '<li><code>currentDrawdown</code> — how far below the all-time peak the final point is, as a positive number</li>' +
          '<li><code>inDrawdown</code> — whether the curve ends below its peak</li>' +
          '<li><code>recovered</code> — whether the <em>deepest</em> drawdown was later fully recovered</li></ul>',
        starter: 'function drawdownReport(curve) {\n  // depth, duration and recovery\n}\n',
        solution: 'function drawdownReport(curve) {\n  if (!curve.length) {\n    return { maxDepth: 0, maxPercent: 0, longestDuration: 0, currentDrawdown: 0, inDrawdown: false, recovered: true };\n  }\n  let peak = -Infinity, peakIdx = 0;\n  let maxDepth = 0, maxPercent = 0, troughIdx = 0;\n  let run = 0, longest = 0;\n  for (let i = 0; i < curve.length; i++) {\n    if (curve[i] >= peak) {\n      peak = curve[i]; peakIdx = i; run = 0;\n    } else {\n      run++;\n      longest = Math.max(longest, run);\n      const depth = peak - curve[i];\n      if (depth > maxDepth) {\n        maxDepth = depth;\n        maxPercent = peak === 0 ? 0 : depth / peak * 100;\n        troughIdx = i;\n      }\n    }\n  }\n  const allTimePeak = Math.max(...curve);\n  const last = curve[curve.length - 1];\n  const currentDrawdown = allTimePeak - last;\n  const peakAtTrough = maxDepth + curve[troughIdx];\n  const recovered = maxDepth === 0 ||\n    curve.slice(troughIdx + 1).some(v => v >= peakAtTrough);\n  return {\n    maxDepth,\n    maxPercent,\n    longestDuration: longest,\n    currentDrawdown,\n    inDrawdown: currentDrawdown > 0,\n    recovered\n  };\n}',
        hints: ['One pass can track the peak, the deepest drawdown and the current below-peak run.',
                'Reset the run counter every time a new high is made.',
                'For <code>recovered</code>, reconstruct the peak the deepest drawdown fell from and look for a later point that reaches it.'],
        tests: { fn: 'drawdownReport', approx: 1e-9, cases: [
          { args: [[100, 110, 105, 95, 130]],
            expect: { maxDepth: 15, maxPercent: 15 / 110 * 100, longestDuration: 2,
              currentDrawdown: 0, inDrawdown: false, recovered: true } },
          { args: [[100, 110, 105, 95]],
            expect: { maxDepth: 15, maxPercent: 15 / 110 * 100, longestDuration: 2,
              currentDrawdown: 15, inDrawdown: true, recovered: false },
            name: 'a curve ending in drawdown reports it as unrecovered' },
          { args: [[100, 110, 120]],
            expect: { maxDepth: 0, maxPercent: 0, longestDuration: 0,
              currentDrawdown: 0, inDrawdown: false, recovered: true },
            name: 'a rising curve has nothing to report' },
          { args: [[]],
            expect: { maxDepth: 0, maxPercent: 0, longestDuration: 0,
              currentDrawdown: 0, inDrawdown: false, recovered: true } }
        ], checks: [{
          name: 'longestDuration counts the points below the peak', expose: ['drawdownReport'],
            run: function (s) {
              // peak at index 1, below it for indexes 2, 3, 4 and 5, then a new high at 6
              var r = s.drawdownReport([100, 110, 108, 106, 104, 102, 120]);
              return r.longestDuration === 4 ? true : 'expected 4, got ' + r.longestDuration;
            } }] } }
    ],
    quiz: [
      { q: 'What is the drawdown at a new equity high?',
        options: ['Undefined', 'Exactly 0', 'The previous drawdown', 'Negative'],
        answer: 1,
        explain: 'Drawdown is measured from the running peak, and at a new high the equity is the peak.' },
      { q: 'What gain recovers a 50% drawdown?',
        options: ['50%', '75%', '100%', '150%'],
        answer: 2,
        explain: 'Halving then doubling returns you to the start. The asymmetry is why drawdown is the number that matters.' },
      { q: 'Why report drawdown duration alongside depth?',
        options: ['Convention', 'A shallow drawdown lasting months is what makes people abandon a working system', 'It is easier to compute', 'It is not useful'],
        answer: 1,
        explain: 'Depth tests the account; duration tests the trader. Both end strategies.' }
    ],
    recap: [
      'The equity curve is the running balance after each trade.',
      'Drawdown is equity minus the running peak — never positive.',
      'Percentage drawdown is the comparable measure, and recovery is asymmetric.',
      'Report duration as well as depth.'
    ],
    vocab: [
      { term: 'Maximum drawdown', def: 'The largest peak-to-trough decline in equity. The first number a serious allocator asks for.' },
      { term: 'Underwater period', def: 'The stretch of time spent below a previous equity high.' }
    ]
  });

  C.push({
    id: 'd074', day: 74, module: 6, minutes: 30,
    title: 'Risk-Adjusted Return',
    subtitle: 'Sharpe, Sortino, and why raw return is not a score.',
    goal: '<b>Goal:</b> compare two strategies by how much return they earn per unit of risk, not by return alone.',
    objectives: [
      'Compute periodic returns from an equity curve',
      'Calculate the Sharpe ratio and annualise it',
      'Calculate Sortino using downside deviation only',
      'Explain what these ratios miss'
    ],
    sections: [
      { h: 'Returns, not balances',
        body: '<p>Every ratio here works on <em>returns</em> — the percentage change between consecutive equity points — not on the balances themselves. A curve of <em>n</em> points yields <em>n−1</em> returns.</p>',
        code: 'function returns(curve) {\n  const out = [];\n  for (let i = 1; i < curve.length; i++) {\n    out.push((curve[i] - curve[i - 1]) / curve[i - 1]);\n  }\n  return out;\n}\n\nconsole.log(returns([10000, 10500, 10300, 11100]).map(r => (r * 100).toFixed(2) + "%"));' },
      { h: 'Sharpe: excess return per unit of volatility',
        body: '<p class="mono" style="color:var(--fg)">Sharpe = (mean(returns) − riskFree) / stdev(returns)</p>' +
              '<p>It answers: for each unit of variability you endured, how much return did you get? Higher is better; below 1 is generally considered weak for an intraday system.</p>' +
              '<p>To annualise, multiply by the square root of the number of periods per year — √252 for daily returns, because variance scales linearly with time and deviation with its square root.</p>',
        code: 'function mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; }\nfunction stdev(a) {\n  const m = mean(a);\n  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length);\n}\nfunction sharpe(rets, riskFree = 0) {\n  const sd = stdev(rets);\n  return sd === 0 ? 0 : (mean(rets) - riskFree) / sd;\n}\n\nconst daily = [0.004, -0.002, 0.006, -0.001, 0.003];\nconsole.log("daily sharpe:", sharpe(daily).toFixed(3));\nconsole.log("annualised:", (sharpe(daily) * Math.sqrt(252)).toFixed(2));' },
      { h: 'Sortino: only downside counts as risk',
        body: '<p>Sharpe penalises upside volatility exactly as much as downside — a strategy with occasional huge <em>gains</em> is marked down for them. Sortino replaces the denominator with <strong>downside deviation</strong>: the same calculation over only the returns below the target.</p>' +
              '<div class="note note-warn"><b>Divide by the full count</b>Downside deviation squares only the below-target returns but still divides by the <em>total</em> number of periods. Dividing by the count of negative periods alone inflates the ratio, sometimes dramatically.</div>',
        code: 'function downsideDeviation(rets, target = 0) {\n  const sum = rets.reduce((s, r) => s + (r < target ? (r - target) ** 2 : 0), 0);\n  return Math.sqrt(sum / rets.length);\n}\n\nconst rets = [0.004, -0.002, 0.02, -0.001, 0.003];\nconsole.log("stdev:", Math.sqrt(rets.reduce((s, v) => s + (v - rets.reduce((a, b) => a + b, 0) / rets.length) ** 2, 0) / rets.length).toFixed(5));\nconsole.log("downside deviation:", downsideDeviation(rets).toFixed(5));' },
      { h: 'What these ratios miss',
        body: '<p>Both assume returns are roughly symmetric and independent. Neither is true of trading returns, which are skewed and serially correlated. A strategy selling options shows a beautiful Sharpe right up until the day it does not.</p>' +
              '<div class="note note-trade"><b>Read them alongside the curve</b>Sharpe and Sortino compress a whole distribution into one number. Always look at the equity curve and the drawdown profile too — the ratio cannot show you a cliff.</div>' }
    ],
    parsons: {
      prompt: 'Turn an equity curve into periodic returns.',
      lines: [
        'const rets = [];',
        'for (let i = 1; i < curve.length; i++) {',
        '  rets.push((curve[i] - curve[i - 1]) / curve[i - 1]);',
        '}',
        'console.log(rets.length);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'periodReturns()', difficulty: 'Core',
        prompt: 'Write <code>periodReturns(curve)</code> returning the fractional change between consecutive points — <code>n-1</code> values for <code>n</code> points.<br>' +
          'Skip any period whose starting value is 0 rather than producing <code>Infinity</code>.',
        starter: 'function periodReturns(curve) {\n  // fractional change per period\n}\n',
        solution: 'function periodReturns(curve) {\n  const out = [];\n  for (let i = 1; i < curve.length; i++) {\n    const prev = curve[i - 1];\n    if (prev === 0) continue;\n    out.push((curve[i] - prev) / prev);\n  }\n  return out;\n}',
        hints: ['Start the loop at index 1 — the first point has no previous value.',
                'A zero denominator would give <code>Infinity</code>; skip that period.'],
        tests: { fn: 'periodReturns', approx: 1e-12, cases: [
          { args: [[100, 110, 99]], expect: [0.1, -0.1] },
          { args: [[100]], expect: [] },
          { args: [[]], expect: [] },
          { args: [[0, 100, 110]], expect: [0.1], name: 'a zero starting value is skipped' },
          { args: [[100, 100]], expect: [0] }
        ] } },
      { id: 'e2', title: 'sharpe()', difficulty: 'Core',
        prompt: 'Write <code>sharpe(returns, riskFreePerPeriod, periodsPerYear)</code>:<ul>' +
          '<li>the per-period Sharpe is <code>(mean - riskFree) / populationStdev</code></li>' +
          '<li>multiply by <code>Math.sqrt(periodsPerYear)</code> to annualise; a <code>periodsPerYear</code> of 1 leaves it unannualised</li>' +
          '<li>return <code>0</code> when the deviation is 0 or there are fewer than two returns</li></ul>',
        starter: 'function sharpe(returns, riskFreePerPeriod, periodsPerYear) {\n  // annualised Sharpe ratio\n}\n',
        solution: 'function sharpe(returns, riskFreePerPeriod, periodsPerYear) {\n  if (returns.length < 2) return 0;\n  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;\n  const sd = Math.sqrt(returns.reduce((s, v) => s + (v - mean) * (v - mean), 0) / returns.length);\n  if (sd === 0) return 0;\n  return (mean - riskFreePerPeriod) / sd * Math.sqrt(periodsPerYear);\n}',
        hints: ['Guard both degenerate cases before dividing.',
                'Use the population deviation — divide the squared distances by <code>n</code>.',
                'Annualising is a single multiply by the square root of the period count.'],
        tests: { fn: 'sharpe', approx: 1e-9, cases: [
          { args: [[0.01, 0.01, 0.01], 0, 1], expect: 0, name: 'zero variance gives 0, not Infinity' },
          { args: [[0.02, -0.01], 0, 1], expect: (0.005 - 0) / 0.015 },
          { args: [[0.05], 0, 252], expect: 0, name: 'a single return is not enough' },
          { args: [[], 0, 252], expect: 0 }
        ], checks: [
          { name: 'annualising scales by the square root of the period count', expose: ['sharpe'],
            run: function (s) {
              var r = [0.004, -0.002, 0.006, -0.001, 0.003];
              var raw = s.sharpe(r, 0, 1);
              var ann = s.sharpe(r, 0, 252);
              return Math.abs(ann - raw * Math.sqrt(252)) < 1e-9
                ? true : 'expected ' + (raw * Math.sqrt(252)) + ', got ' + ann;
            } },
          { name: 'a higher risk-free rate lowers the ratio', expose: ['sharpe'],
            run: function (s) {
              var r = [0.004, -0.002, 0.006, -0.001, 0.003];
              return s.sharpe(r, 0.002, 1) < s.sharpe(r, 0, 1) ? true : 'subtracting more should reduce the Sharpe';
            } }
        ] } },
      { id: 'e3', title: 'sortino() and compare', difficulty: 'Stretch',
        prompt: 'Write two functions:<ul>' +
          '<li><code>downsideDeviation(returns, target)</code> — the root mean square of the shortfalls below <code>target</code>, dividing by the <strong>total</strong> number of returns</li>' +
          '<li><code>sortino(returns, target, periodsPerYear)</code> — <code>(mean - target) / downsideDeviation</code>, annualised by <code>Math.sqrt(periodsPerYear)</code>; <code>0</code> when the deviation is 0 or there are fewer than two returns</li></ul>',
        expose: ['downsideDeviation', 'sortino'],
        starter: 'function downsideDeviation(returns, target) {\n  // RMS of the below-target shortfalls\n}\n\nfunction sortino(returns, target, periodsPerYear) {\n  // downside-only risk-adjusted return\n}\n',
        solution: 'function downsideDeviation(returns, target) {\n  if (!returns.length) return 0;\n  const sum = returns.reduce((s, r) => s + (r < target ? (r - target) * (r - target) : 0), 0);\n  return Math.sqrt(sum / returns.length);\n}\n\nfunction sortino(returns, target, periodsPerYear) {\n  if (returns.length < 2) return 0;\n  const dd = downsideDeviation(returns, target);\n  if (dd === 0) return 0;\n  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;\n  return (mean - target) / dd * Math.sqrt(periodsPerYear);\n}',
        hints: ['Above-target returns contribute exactly 0 to the sum, but still count in the divisor.',
                '<code>sortino</code> can call <code>downsideDeviation</code>.',
                'Guard the zero-deviation case — a strategy that never fell below target has no downside risk to divide by.'],
        tests: { checks: [
          { name: 'downside deviation ignores upside', expose: ['downsideDeviation'],
            run: function (s) {
              var a = s.downsideDeviation([0.01, 0.02, 0.03], 0);
              return a === 0 ? true : 'all-positive returns should have zero downside deviation, got ' + a;
            } },
          { name: 'downside deviation divides by the total count', expose: ['downsideDeviation'],
            run: function (s) {
              // one shortfall of -0.02 across 4 periods: sqrt(0.0004 / 4) = 0.01
              var v = s.downsideDeviation([0.01, 0.01, 0.01, -0.02], 0);
              return Math.abs(v - 0.01) < 1e-12
                ? true : 'expected 0.01 (dividing by 4, not 1), got ' + v;
            } },
          { name: 'an empty series has zero downside deviation', expose: ['downsideDeviation'],
            run: function (s) { return s.downsideDeviation([], 0) === 0 ? true : 'expected 0'; } },
          { name: 'sortino returns 0 when there is no downside', expose: ['sortino'],
            run: function (s) {
              return s.sortino([0.01, 0.02, 0.03], 0, 252) === 0 ? true : 'no downside means no ratio to report';
            } },
          { name: 'sortino exceeds sharpe when upside is volatile', expose: ['sortino', 'downsideDeviation'],
            run: function (s) {
              var r = [0.004, -0.002, 0.05, -0.001, 0.003];
              var mean = r.reduce(function (a, b) { return a + b; }, 0) / r.length;
              var sd = Math.sqrt(r.reduce(function (x, v) { return x + (v - mean) * (v - mean); }, 0) / r.length);
              var sharpe = mean / sd;
              var so = s.sortino(r, 0, 1);
              return so > sharpe ? true : 'sortino (' + so + ') should exceed sharpe (' + sharpe + ') here';
            } },
          { name: 'sortino annualises by the square root of the period count', expose: ['sortino'],
            run: function (s) {
              var r = [0.004, -0.002, 0.006, -0.001, 0.003];
              var raw = s.sortino(r, 0, 1), ann = s.sortino(r, 0, 252);
              return Math.abs(ann - raw * Math.sqrt(252)) < 1e-9 ? true : 'annualisation is wrong';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does the Sharpe ratio divide by?',
        options: ['Maximum drawdown', 'The standard deviation of returns', 'The number of trades', 'Total return'],
        answer: 1,
        explain: 'It measures excess return per unit of return volatility — upside and downside alike.' },
      { q: 'Why does Sortino often exceed Sharpe?',
        options: ['It uses more data', 'It only counts downside deviation as risk, so large gains are not penalised', 'It is annualised differently', 'It ignores the mean'],
        answer: 1,
        explain: 'Sharpe treats a huge winning day as risk. Sortino does not.' },
      { q: 'What do both ratios fail to capture?',
        options: ['The mean return', 'Skew, fat tails and serial correlation — a strategy with a hidden cliff', 'The number of periods', 'Volatility'],
        answer: 1,
        explain: 'Both compress a distribution into one number, and neither can show you a rare catastrophic outcome.' }
    ],
    recap: [
      'Ratios work on returns, not balances.',
      'Sharpe = excess mean return ÷ standard deviation, annualised by √periods.',
      'Sortino swaps the denominator for downside deviation — divided by the total count.',
      'Read both alongside the equity curve; a ratio cannot show a cliff.'
    ],
    vocab: [
      { term: 'Sharpe ratio', def: 'Excess return per unit of volatility. Above 1 is respectable, above 2 is very good, above 3 usually means a bug.' },
      { term: 'Downside deviation', def: 'Standard deviation computed only from returns below a target. The denominator of the Sortino ratio.' }
    ]
  });

  C.push({
    id: 'd075', day: 75, module: 6, minutes: 30,
    title: 'Costs: Slippage, Commission and Spread',
    subtitle: 'The three deductions that turn a profitable backtest into a losing system.',
    goal: '<b>Goal:</b> apply realistic execution costs and see how many strategies do not survive them.',
    objectives: [
      'Model commission per contract per side',
      'Apply slippage in the direction that always hurts',
      'Include the bid-ask spread',
      'Compute the break-even move a strategy must clear'
    ],
    sections: [
      { h: 'The three costs',
        body: '<table><tr><th>Cost</th><th>What it is</th><th>Typical ES</th></tr>' +
              '<tr><td>Commission</td><td>broker and exchange fees</td><td>$2–4 per contract per side</td></tr>' +
              '<tr><td>Spread</td><td>bid-ask gap you cross to trade now</td><td>0.25 points = $12.50</td></tr>' +
              '<tr><td>Slippage</td><td>the difference between the price you wanted and the one you got</td><td>0–1 ticks, worse when fast</td></tr></table>' +
              '<p>All three apply on entry <em>and</em> exit. A round trip on one ES contract easily costs $20–30 before the market has moved at all.</p>' },
      { h: 'Slippage always goes against you',
        body: '<p>This is the rule people get wrong. A buy fills at or above the intended price; a sell fills at or below it. Modelling slippage as a random symmetric number makes it average out to zero, which is precisely the opposite of what happens.</p>' +
              '<div class="note note-warn"><b>Signed slippage</b>Add slippage to a buy price, subtract it from a sell price. Always. A symmetric random model quietly deletes the cost from your results.</div>',
        code: 'function applySlippage(price, side, ticks, tickSize) {\n  const amount = ticks * tickSize;\n  return side === "buy" ? price + amount : price - amount;\n}\n\nconsole.log("buy 5240.00 with 1 tick slip ->", applySlippage(5240, "buy", 1, 0.25));\nconsole.log("sell 5240.00 with 1 tick slip ->", applySlippage(5240, "sell", 1, 0.25));' },
      { h: 'Net P&L',
        body: '<p>Gross P&L in points, converted to dollars, minus commission on both sides — with the entry and exit prices already adjusted for slippage.</p>',
        code: 'function netPnl({ side, entry, exit, qty, pointValue, commissionPerSide, slipTicks, tickSize }) {\n  const slip = slipTicks * tickSize;\n  const fillEntry = side === "long" ? entry + slip : entry - slip;\n  const fillExit = side === "long" ? exit - slip : exit + slip;\n  const points = side === "long" ? fillExit - fillEntry : fillEntry - fillExit;\n  const gross = points * qty * pointValue;\n  return gross - commissionPerSide * qty * 2;\n}\n\nconsole.log(netPnl({ side: "long", entry: 5240, exit: 5242, qty: 1,\n  pointValue: 50, commissionPerSide: 2.5, slipTicks: 1, tickSize: 0.25 }));' },
      { h: 'Break-even: the move you must clear',
        body: '<p>Before a strategy makes anything, every trade must cover round-trip costs. Divide the total cost per contract by the point value to get the points needed.</p>',
        code: 'function breakEvenPoints({ pointValue, commissionPerSide, slipTicks, tickSize }) {\n  const commission = commissionPerSide * 2 / pointValue;\n  const slippage = slipTicks * tickSize * 2;\n  return commission + slippage;\n}\n\nconsole.log("ES break-even:", breakEvenPoints({ pointValue: 50, commissionPerSide: 2.5, slipTicks: 1, tickSize: 0.25 }).toFixed(3), "points");\nconsole.log("A scalper targeting 1 point keeps about half of it.");' }
    ],
    parsons: {
      prompt: 'Apply slippage in the direction that hurts.',
      lines: [
        'const slip = slipTicks * tickSize;',
        'const fillEntry = side === "long" ? entry + slip : entry - slip;',
        'const fillExit = side === "long" ? exit - slip : exit + slip;',
        'const points = side === "long" ? fillExit - fillEntry : fillEntry - fillExit;'
      ]
    },
    exercises: [
      { id: 'e1', title: 'applySlippage()', difficulty: 'Core',
        prompt: 'Write <code>applySlippage(price, action, ticks, tickSize)</code> where <code>action</code> is <code>"buy"</code> or <code>"sell"</code>.<br>' +
          'A buy fills higher, a sell fills lower. An unknown action throws a <code>RangeError</code>.',
        starter: 'function applySlippage(price, action, ticks, tickSize) {\n  // slippage always works against you\n}\n',
        solution: 'function applySlippage(price, action, ticks, tickSize) {\n  const amount = ticks * tickSize;\n  if (action === "buy") return price + amount;\n  if (action === "sell") return price - amount;\n  throw new RangeError(`unknown action: ${action}`);\n}',
        hints: ['Buying costs more than you wanted; selling gets less.',
                'Throw for anything that is not "buy" or "sell".'],
        tests: { fn: 'applySlippage', approx: 1e-9, cases: [
          { args: [5240, 'buy', 1, 0.25], expect: 5240.25 },
          { args: [5240, 'sell', 1, 0.25], expect: 5239.75 },
          { args: [5240, 'buy', 0, 0.25], expect: 5240, name: 'zero slippage changes nothing' },
          { args: [5240, 'sell', 2, 0.25], expect: 5239.5 }
        ], checks: [{
          name: 'an unknown action throws RangeError', expose: ['applySlippage'],
          run: function (s) {
            try { s.applySlippage(100, 'hold', 1, 0.25); }
            catch (e) { return e instanceof RangeError ? true : 'threw ' + e.name; }
            return 'an unknown action should throw';
          }
        }] } },
      { id: 'e2', title: 'netPnl()', difficulty: 'Core',
        prompt: 'Write <code>netPnl({ side, entry, exit, qty, pointValue, commissionPerSide, slipTicks, tickSize })</code> returning the dollar profit after all costs.<ul>' +
          '<li>Slippage worsens both the entry and the exit.</li>' +
          '<li>Commission is charged per contract on each side — twice per round trip.</li></ul>',
        starter: 'function netPnl({ side, entry, exit, qty, pointValue, commissionPerSide, slipTicks, tickSize }) {\n  // gross points, converted, minus costs\n}\n',
        solution: 'function netPnl({ side, entry, exit, qty, pointValue, commissionPerSide, slipTicks, tickSize }) {\n  const slip = slipTicks * tickSize;\n  const fillEntry = side === "long" ? entry + slip : entry - slip;\n  const fillExit = side === "long" ? exit - slip : exit + slip;\n  const points = side === "long" ? fillExit - fillEntry : fillEntry - fillExit;\n  return points * qty * pointValue - commissionPerSide * qty * 2;\n}',
        hints: ['A long buys at entry and sells at exit — both fills move against it.',
                'The commission term is <code>commissionPerSide × qty × 2</code>.'],
        tests: { fn: 'netPnl', approx: 1e-9, cases: [
          { args: [{ side: 'long', entry: 5240, exit: 5250, qty: 1, pointValue: 50,
                     commissionPerSide: 2.5, slipTicks: 0, tickSize: 0.25 }],
            expect: 10 * 50 - 5 },
          { args: [{ side: 'long', entry: 5240, exit: 5250, qty: 1, pointValue: 50,
                     commissionPerSide: 2.5, slipTicks: 1, tickSize: 0.25 }],
            expect: 9.5 * 50 - 5, name: 'slippage costs half a point on the round trip' },
          { args: [{ side: 'short', entry: 5250, exit: 5240, qty: 2, pointValue: 50,
                     commissionPerSide: 2.5, slipTicks: 1, tickSize: 0.25 }],
            expect: 9.5 * 2 * 50 - 10, name: 'a short is charged the same way' },
          { args: [{ side: 'long', entry: 5240, exit: 5240, qty: 1, pointValue: 50,
                     commissionPerSide: 2.5, slipTicks: 0, tickSize: 0.25 }],
            expect: -5, name: 'a flat trade still costs commission' }
        ] } },
      { id: 'e3', title: 'costImpact()', difficulty: 'Stretch',
        prompt: 'Write <code>costImpact(trades, costs)</code> where each trade is <code>{ side, entry, exit, qty }</code> and <code>costs</code> is <code>{ pointValue, commissionPerSide, slipTicks, tickSize }</code>.<br>' +
          'Return <code>{ grossTotal, netTotal, totalCosts, breakEvenPoints, grossWinners, netWinners }</code>:<ul>' +
          '<li><code>grossTotal</code> — total dollars ignoring all costs</li>' +
          '<li><code>netTotal</code> — total after slippage and commission</li>' +
          '<li><code>totalCosts</code> — the difference, as a positive number</li>' +
          '<li><code>breakEvenPoints</code> — points a single contract must clear to break even</li>' +
          '<li><code>grossWinners</code>/<code>netWinners</code> — how many trades were profitable before and after costs</li></ul>',
        starter: 'function costImpact(trades, costs) {\n  // what costs do to a strategy\n}\n',
        solution: 'function costImpact(trades, costs) {\n  const { pointValue, commissionPerSide, slipTicks, tickSize } = costs;\n  const slip = slipTicks * tickSize;\n  let grossTotal = 0, netTotal = 0, grossWinners = 0, netWinners = 0;\n  for (const t of trades) {\n    const grossPoints = t.side === "long" ? t.exit - t.entry : t.entry - t.exit;\n    const gross = grossPoints * t.qty * pointValue;\n    const fillEntry = t.side === "long" ? t.entry + slip : t.entry - slip;\n    const fillExit = t.side === "long" ? t.exit - slip : t.exit + slip;\n    const netPoints = t.side === "long" ? fillExit - fillEntry : fillEntry - fillExit;\n    const net = netPoints * t.qty * pointValue - commissionPerSide * t.qty * 2;\n    grossTotal += gross;\n    netTotal += net;\n    if (gross > 0) grossWinners++;\n    if (net > 0) netWinners++;\n  }\n  return {\n    grossTotal,\n    netTotal,\n    totalCosts: grossTotal - netTotal,\n    breakEvenPoints: commissionPerSide * 2 / pointValue + slip * 2,\n    grossWinners,\n    netWinners\n  };\n}',
        hints: ['Compute the gross and net figures for each trade in the same loop.',
                'Break-even is per contract, so quantity does not enter it.',
                '<code>totalCosts</code> is just gross minus net.'],
        tests: { fn: 'costImpact', approx: 1e-9, cases: [
          { args: [[{ side: 'long', entry: 5240, exit: 5250, qty: 1 }],
                   { pointValue: 50, commissionPerSide: 2.5, slipTicks: 1, tickSize: 0.25 }],
            expect: { grossTotal: 500, netTotal: 470, totalCosts: 30,
              breakEvenPoints: 0.6, grossWinners: 1, netWinners: 1 } },
          { args: [[{ side: 'long', entry: 5240, exit: 5240.5, qty: 1 }],
                   { pointValue: 50, commissionPerSide: 2.5, slipTicks: 1, tickSize: 0.25 }],
            expect: { grossTotal: 25, netTotal: -5, totalCosts: 30,
              breakEvenPoints: 0.6, grossWinners: 1, netWinners: 0 },
            name: 'a small winner becomes a loser after costs' },
          { args: [[], { pointValue: 50, commissionPerSide: 2.5, slipTicks: 1, tickSize: 0.25 }],
            expect: { grossTotal: 0, netTotal: 0, totalCosts: 0,
              breakEvenPoints: 0.6, grossWinners: 0, netWinners: 0 } }
        ], checks: [{
          name: 'costs are never negative on a real trade list', expose: ['costImpact'],
          run: function (s) {
            var trades = MARKET.trades.map(function (t) {
              return { side: t.side, entry: t.entry, exit: t.exit, qty: t.qty };
            });
            var r = s.costImpact(trades, { pointValue: 50, commissionPerSide: 2.5, slipTicks: 1, tickSize: 0.25 });
            if (r.totalCosts <= 0) return 'total costs should be positive, got ' + r.totalCosts;
            return r.netWinners <= r.grossWinners ? true : 'costs cannot create winners';
          }
        }] } }
    ],
    quiz: [
      { q: 'Which way does slippage move a buy fill?',
        options: ['Lower', 'Higher', 'Randomly either way', 'It does not move it'],
        answer: 1,
        explain: 'You pay more than you wanted. Modelling it symmetrically averages the cost to zero and deletes it from your results.' },
      { q: 'How many times is commission charged on one round trip?',
        options: ['Once', 'Twice — once per side', 'Once per point', 'Never on futures'],
        answer: 1,
        explain: 'Entry and exit are separate transactions, each charged per contract.' },
      { q: 'ES costs $2.50 per side and one tick of slippage each way. What must a trade clear to break even?',
        options: ['0.1 points', '0.6 points', '1 point', '2 points'],
        answer: 1,
        explain: '$5 commission ÷ $50 per point = 0.1, plus 0.5 points of slippage = 0.6 points. A one-point scalp keeps 40%.' }
    ],
    recap: [
      'Commission, spread and slippage all apply on entry and exit.',
      'Slippage is signed against you — never model it symmetrically.',
      'Break-even points = round-trip commission ÷ point value + total slippage.',
      'Costs turn marginal winners into losers; apply them before judging a strategy.'
    ],
    vocab: [
      { term: 'Slippage', def: 'The gap between the price a strategy assumed and the one it received. Worst in fast markets, which is exactly when signals fire.' },
      { term: 'Round trip', def: 'An entry and its matching exit, and therefore two sets of costs.' }
    ]
  });

  C.push({
    id: 'd076', day: 76, module: 6, minutes: 30,
    title: 'R-Multiples and Trade Statistics',
    subtitle: 'Normalising every trade to the risk it took.',
    goal: '<b>Goal:</b> express results in units of risk, so trades of different sizes and stops become comparable.',
    objectives: [
      'Convert a P&L into an R-multiple',
      'Build the R distribution of a strategy',
      'Compute expectancy in R',
      'Find the longest losing streak'
    ],
    sections: [
      { h: 'One R is one unit of planned risk',
        body: '<p>If a trade risked $400 and made $1,200, that is +3R. If it lost the full stop, that is −1R. Expressing everything in R makes a $50 scalp and a $5,000 swing directly comparable, and removes position size from the analysis entirely.</p>',
        code: 'function rMultiple(pnl, riskDollars) {\n  return riskDollars <= 0 ? null : pnl / riskDollars;\n}\n\n[[1200, 400], [-400, 400], [-180, 400], [0, 400]].forEach(([p, r]) =>\n  console.log(`$${p} on $${r} risk = ${rMultiple(p, r).toFixed(2)}R`));' },
      { h: 'The R distribution says more than the average',
        body: '<p>Two strategies can share an expectancy of +0.2R and behave completely differently. One might win 60% of the time at +0.7R and lose −0.5R; the other might win 25% of the time at +3R and lose −0.7R. The second is far harder to trade despite identical maths.</p>',
        code: 'const rs = [1.8, -1, -1, 2.4, -0.6, -1, 3.1, -1, 0.9, -1];\nconst wins = rs.filter(r => r > 0), losses = rs.filter(r => r <= 0);\nconst mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;\n\nconsole.log("expectancy:", mean(rs).toFixed(3) + "R");\nconsole.log("win rate:", (wins.length / rs.length * 100).toFixed(0) + "%");\nconsole.log("avg win:", mean(wins).toFixed(2) + "R", "avg loss:", mean(losses).toFixed(2) + "R");' },
      { h: 'Expectancy in R',
        body: '<p class="mono" style="color:var(--fg)">expectancy = winRate × avgWinR − lossRate × |avgLossR|</p>' +
              '<p>Positive expectancy means each additional trade is worth taking. Multiply by the number of trades you expect per month to see what the strategy is actually worth.</p>' +
              '<div class="note note-warn"><b>Losses can exceed 1R</b>A gap through the stop, or a fast market, produces −1.4R or worse. A backtest where every loss is exactly −1R is assuming perfect stop execution, which is optimistic on the days it matters most.</div>' },
      { h: 'Streaks are the psychological test',
        body: '<p>A strategy winning 40% of the time will produce a run of eight losses reasonably often. Knowing the longest streak in your sample tells you what you must be prepared to sit through — and eight −1R losses at 2% risk is a 15% drawdown.</p>',
        code: 'function longestLossStreak(rs) {\n  let run = 0, worst = 0;\n  for (const r of rs) {\n    if (r <= 0) { run++; worst = Math.max(worst, run); }\n    else run = 0;\n  }\n  return worst;\n}\nconsole.log(longestLossStreak([1, -1, -1, -1, 2, -1, -1, 3]));' }
    ],
    parsons: {
      prompt: 'Convert a dollar result into R.',
      lines: [
        'function rMultiple(pnl, riskDollars) {',
        '  if (riskDollars <= 0) return null;',
        '  return pnl / riskDollars;',
        '}',
        'console.log(rMultiple(1200, 400));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'rMultiples()', difficulty: 'Core',
        prompt: 'Write <code>rMultiples(trades)</code> where each trade is <code>{ pnl, risk }</code>, returning an array of R-multiples.<br>' +
          'A trade whose <code>risk</code> is 0 or less contributes <code>null</code>.',
        starter: 'function rMultiples(trades) {\n  // pnl / risk per trade\n}\n',
        solution: 'function rMultiples(trades) {\n  return trades.map(t => t.risk <= 0 ? null : t.pnl / t.risk);\n}',
        hints: ['One <code>map</code> with a guard on the denominator.',
                'A risk of 0 has no meaningful R — return <code>null</code> rather than <code>Infinity</code>.'],
        tests: { fn: 'rMultiples', approx: 1e-9, cases: [
          { args: [[{ pnl: 1200, risk: 400 }, { pnl: -400, risk: 400 }]], expect: [3, -1] },
          { args: [[{ pnl: 100, risk: 0 }]], expect: [null], name: 'zero risk gives null' },
          { args: [[{ pnl: -560, risk: 400 }]], expect: [-1.4], name: 'a loss can exceed 1R' },
          { args: [[]], expect: [] }
        ] } },
      { id: 'e2', title: 'rStats()', difficulty: 'Core',
        prompt: 'Write <code>rStats(rs)</code> over an array of R-multiples (which may contain <code>null</code>s, to be ignored), returning:<br>' +
          '<code>{ count, winRate, avgWin, avgLoss, expectancy, best, worst }</code><ul>' +
          '<li>A trade is a win when R is strictly above 0.</li>' +
          '<li><code>avgLoss</code> is negative; both averages are <code>0</code> when there are none of that kind.</li>' +
          '<li><code>expectancy</code> is the mean of all valid R values.</li>' +
          '<li><code>best</code>/<code>worst</code> are the extremes, or <code>0</code> when there is nothing.</li></ul>',
        starter: 'function rStats(rs) {\n  // summarise an R distribution\n}\n',
        solution: 'function rStats(rs) {\n  const valid = rs.filter(r => r !== null && Number.isFinite(r));\n  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;\n  const wins = valid.filter(r => r > 0);\n  const losses = valid.filter(r => r <= 0);\n  return {\n    count: valid.length,\n    winRate: valid.length ? wins.length / valid.length : 0,\n    avgWin: mean(wins),\n    avgLoss: mean(losses),\n    expectancy: mean(valid),\n    best: valid.length ? Math.max(...valid) : 0,\n    worst: valid.length ? Math.min(...valid) : 0\n  };\n}',
        hints: ['Filter out the nulls first, then everything else works on the clean array.',
                'A small local <code>mean</code> helper avoids repeating the empty guard.',
                'Break-even trades count as losses under the "strictly above 0" rule.'],
        tests: { fn: 'rStats', approx: 1e-9, cases: [
          { args: [[2, -1, 1, -1]],
            expect: { count: 4, winRate: 0.5, avgWin: 1.5, avgLoss: -1, expectancy: 0.25, best: 2, worst: -1 } },
          { args: [[]],
            expect: { count: 0, winRate: 0, avgWin: 0, avgLoss: 0, expectancy: 0, best: 0, worst: 0 } },
          { args: [[null, 2, null]],
            expect: { count: 1, winRate: 1, avgWin: 2, avgLoss: 0, expectancy: 2, best: 2, worst: 2 },
            name: 'nulls are ignored' },
          { args: [[0, 1]],
            expect: { count: 2, winRate: 0.5, avgWin: 1, avgLoss: 0, expectancy: 0.5, best: 1, worst: 0 },
            name: 'a break-even trade counts as a loss' }
        ] } },
      { id: 'e3', title: 'streaks()', difficulty: 'Stretch',
        prompt: 'Write <code>streaks(rs)</code> returning <code>{ longestWin, longestLoss, currentRun, currentType }</code>:<ul>' +
          '<li>a win is R above 0; anything else is a loss</li>' +
          '<li><code>currentRun</code> — the length of the run the series ends on</li>' +
          '<li><code>currentType</code> — <code>"win"</code>, <code>"loss"</code>, or <code>null</code> when there is nothing</li>' +
          '<li><code>null</code> entries break any run and count as neither</li></ul>',
        starter: 'function streaks(rs) {\n  // { longestWin, longestLoss, currentRun, currentType }\n}\n',
        solution: 'function streaks(rs) {\n  let longestWin = 0, longestLoss = 0, run = 0, type = null;\n  for (const r of rs) {\n    if (r === null || !Number.isFinite(r)) { run = 0; type = null; continue; }\n    const kind = r > 0 ? "win" : "loss";\n    run = kind === type ? run + 1 : 1;\n    type = kind;\n    if (kind === "win") longestWin = Math.max(longestWin, run);\n    else longestLoss = Math.max(longestLoss, run);\n  }\n  return { longestWin, longestLoss, currentRun: type === null ? 0 : run, currentType: type };\n}',
        hints: ['Track the current run length and its type together.',
                'A change of type restarts the run at 1; a <code>null</code> resets it to 0 with no type.',
                'Update the appropriate record after each trade.'],
        tests: { fn: 'streaks', cases: [
          { args: [[1, -1, -1, -1, 2, -1, -1, 3]],
            expect: { longestWin: 1, longestLoss: 3, currentRun: 1, currentType: 'win' } },
          { args: [[1, 2, 3]],
            expect: { longestWin: 3, longestLoss: 0, currentRun: 3, currentType: 'win' } },
          { args: [[-1, -1]],
            expect: { longestWin: 0, longestLoss: 2, currentRun: 2, currentType: 'loss' } },
          { args: [[]],
            expect: { longestWin: 0, longestLoss: 0, currentRun: 0, currentType: null } },
          { args: [[1, 1, null, 1]],
            expect: { longestWin: 2, longestLoss: 0, currentRun: 1, currentType: 'win' },
            name: 'a null breaks the run' },
          { args: [[0, 0]],
            expect: { longestWin: 0, longestLoss: 2, currentRun: 2, currentType: 'loss' },
            name: 'break-even trades count as losses' }
        ] } }
    ],
    quiz: [
      { q: 'A trade risked $400 and made $1,000. What is that in R?',
        options: ['+0.4R', '+2.5R', '+400R', '+1,000R'],
        answer: 1,
        explain: '1000 ÷ 400 = 2.5R. R normalises away both size and stop distance.' },
      { q: 'Why can a loss exceed −1R?',
        options: ['A calculation error', 'A gap or a fast market fills the stop worse than intended', 'It cannot', 'Only with leverage'],
        answer: 1,
        explain: 'A stop is an instruction, not a guarantee. A backtest where every loss is exactly −1R assumes perfect execution.' },
      { q: 'Two strategies both have +0.2R expectancy. What still distinguishes them?',
        options: ['Nothing', 'The shape of the distribution — win rate, streak length, how the R is earned', 'Their commission', 'Their symbol'],
        answer: 1,
        explain: '25% wins at +3R and 60% wins at +0.7R feel entirely different to trade, and produce very different drawdowns.' }
    ],
    recap: [
      'One R is one unit of planned risk; R makes trades comparable.',
      'Expectancy is the mean R per trade.',
      'Losses larger than 1R are normal and must be modelled.',
      'Streak length is the psychological cost of the strategy.'
    ],
    vocab: [
      { term: 'R-multiple', def: 'Profit or loss expressed in units of initial risk. Popularised by Van Tharp and standard in trade journals.' },
      { term: 'Expectancy', def: 'The average R per trade. Multiply by trade frequency to get expected return per period.' }
    ]
  });


  C.push({
    id: 'd077', day: 77, module: 6, minutes: 30,
    title: 'Out-of-Sample and Walk-Forward',
    subtitle: 'Testing on data the strategy has never seen.',
    goal: '<b>Goal:</b> split data honestly and run a walk-forward analysis that reflects how a strategy is actually deployed.',
    objectives: [
      'Split a series into in-sample and out-of-sample segments',
      'Explain why tuning on all the data proves nothing',
      'Build rolling and anchored walk-forward windows',
      'Compute walk-forward efficiency'
    ],
    sections: [
      { h: 'A backtest on data you tuned against is not evidence',
        body: '<p>Given enough parameter combinations, something will look excellent on any dataset — including pure noise. The only figure that means anything is performance on data the parameters never saw.</p>' +
              '<p>The minimum discipline: split the history, tune on the first part, report the second. Once you look at the out-of-sample result and go back to adjust, it has become in-sample too.</p>',
        code: 'function split(series, inSampleFraction) {\n  const cut = Math.floor(series.length * inSampleFraction);\n  return { inSample: series.slice(0, cut), outOfSample: series.slice(cut) };\n}\n\nconst s = split(MARKET.closes, 0.7);\nconsole.log("in-sample:", s.inSample.length, "bars");\nconsole.log("out-of-sample:", s.outOfSample.length, "bars");' },
      { h: 'Walk-forward: repeat the split, rolling forward',
        body: '<p>One split gives one out-of-sample number, which could be luck. Walk-forward repeats the exercise across the history: optimise on a window, test on the period immediately after, roll forward, repeat. The concatenated test periods form a track record built entirely from unseen data.</p>',
        code: 'function windows(total, trainSize, testSize) {\n  const out = [];\n  let start = 0;\n  while (start + trainSize + testSize <= total) {\n    out.push({\n      trainFrom: start, trainTo: start + trainSize,\n      testFrom: start + trainSize, testTo: start + trainSize + testSize\n    });\n    start += testSize;\n  }\n  return out;\n}\n\nconsole.log(windows(100, 40, 20));' },
      { h: 'Rolling versus anchored',
        body: '<table><tr><th>Style</th><th>Training window</th><th>Assumes</th></tr>' +
              '<tr><td>Rolling</td><td>fixed length, slides forward</td><td>only recent behaviour is relevant</td></tr>' +
              '<tr><td>Anchored</td><td>always starts at bar 0 and grows</td><td>all history is relevant</td></tr></table>' +
              '<p>Rolling adapts to regime change and uses less data. Anchored is more stable and uses everything. Neither is universally right — but choosing one <em>after</em> seeing which performs better is another way of overfitting.</p>' },
      { h: 'Walk-forward efficiency',
        body: '<p class="mono" style="color:var(--fg)">WFE = out-of-sample performance ÷ in-sample performance</p>' +
              '<p>Around 1.0 means the strategy performed out of sample as it did in sample. Below about 0.5 means most of the in-sample result was fitted to noise.</p>' +
              '<div class="note note-warn"><b>A WFE above 1 is not a bonus</b>It usually means the out-of-sample period happened to be easier, not that the strategy improves on unseen data. Treat it as a signal to check the split, not to celebrate.</div>' }
    ],
    parsons: {
      prompt: 'Split a series into in-sample and out-of-sample parts.',
      lines: [
        'const cut = Math.floor(series.length * fraction);',
        'const inSample = series.slice(0, cut);',
        'const outOfSample = series.slice(cut);',
        'console.log(inSample.length, outOfSample.length);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'splitSample()', difficulty: 'Core',
        prompt: 'Write <code>splitSample(series, inSampleFraction)</code> returning <code>{ inSample, outOfSample }</code>.<br>' +
          'The cut point is <code>Math.floor(length × fraction)</code>. A fraction of 0 puts everything out of sample; 1 puts everything in sample. Both parts are new arrays.',
        starter: 'function splitSample(series, inSampleFraction) {\n  // { inSample, outOfSample }\n}\n',
        solution: 'function splitSample(series, inSampleFraction) {\n  const cut = Math.floor(series.length * inSampleFraction);\n  return { inSample: series.slice(0, cut), outOfSample: series.slice(cut) };\n}',
        hints: ['<code>slice</code> already returns new arrays.',
                'The two slices meet at the cut point, so nothing is lost or duplicated.'],
        tests: { fn: 'splitSample', cases: [
          { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.7],
            expect: { inSample: [1, 2, 3, 4, 5, 6, 7], outOfSample: [8, 9, 10] } },
          { args: [[1, 2, 3], 0], expect: { inSample: [], outOfSample: [1, 2, 3] } },
          { args: [[1, 2, 3], 1], expect: { inSample: [1, 2, 3], outOfSample: [] } },
          { args: [[], 0.5], expect: { inSample: [], outOfSample: [] } }
        ], checks: [{
          name: 'the two parts reconstruct the original', expose: ['splitSample'],
          run: function (s, h) {
            var r = s.splitSample(MARKET.closes, 0.6);
            var joined = r.inSample.concat(r.outOfSample);
            return h.eq(joined, MARKET.closes) ? true : 'the split lost or duplicated data';
          }
        }] } },
      { id: 'e2', title: 'walkForwardWindows()', difficulty: 'Core',
        prompt: 'Write <code>walkForwardWindows(total, trainSize, testSize, anchored)</code> returning an array of <code>{ trainFrom, trainTo, testFrom, testTo }</code> index ranges (end-exclusive).<ul>' +
          '<li>Each test period follows its training period immediately, and windows step forward by <code>testSize</code>.</li>' +
          '<li>When <code>anchored</code> is true, <code>trainFrom</code> is always 0 and the training window grows.</li>' +
          '<li>Stop once a full train+test pair no longer fits.</li></ul>',
        starter: 'function walkForwardWindows(total, trainSize, testSize, anchored) {\n  // [{ trainFrom, trainTo, testFrom, testTo }]\n}\n',
        solution: 'function walkForwardWindows(total, trainSize, testSize, anchored) {\n  const out = [];\n  let start = 0;\n  while (start + trainSize + testSize <= total) {\n    const trainTo = start + trainSize;\n    out.push({\n      trainFrom: anchored ? 0 : start,\n      trainTo,\n      testFrom: trainTo,\n      testTo: trainTo + testSize\n    });\n    start += testSize;\n  }\n  return out;\n}',
        hints: ['The loop condition is what stops a partial final window being emitted.',
                'Only <code>trainFrom</code> differs between the two styles.',
                'Advance <code>start</code> by <code>testSize</code>, not by the whole window.'],
        tests: { fn: 'walkForwardWindows', cases: [
          { args: [100, 40, 20, false],
            expect: [
              { trainFrom: 0, trainTo: 40, testFrom: 40, testTo: 60 },
              { trainFrom: 20, trainTo: 60, testFrom: 60, testTo: 80 },
              { trainFrom: 40, trainTo: 80, testFrom: 80, testTo: 100 }
            ] },
          { args: [100, 40, 20, true],
            expect: [
              { trainFrom: 0, trainTo: 40, testFrom: 40, testTo: 60 },
              { trainFrom: 0, trainTo: 60, testFrom: 60, testTo: 80 },
              { trainFrom: 0, trainTo: 80, testFrom: 80, testTo: 100 }
            ], name: 'anchored windows always start at 0' },
          { args: [50, 40, 20, false], expect: [], name: 'too little data yields no windows' },
          { args: [60, 40, 20, false],
            expect: [{ trainFrom: 0, trainTo: 40, testFrom: 40, testTo: 60 }],
            name: 'exactly one window fits' }
        ], checks: [{
          name: 'test periods tile the data without gaps or overlap', expose: ['walkForwardWindows'],
          run: function (s) {
            var w = s.walkForwardWindows(200, 60, 20, false);
            for (var i = 1; i < w.length; i++) {
              if (w[i].testFrom !== w[i - 1].testTo) return 'test periods do not join at window ' + i;
            }
            return true;
          }
        }] } },
      { id: 'e3', title: 'walkForward()', difficulty: 'Stretch',
        prompt: 'Write <code>walkForward(series, { trainSize, testSize, anchored, optimise, evaluate })</code> where:<ul>' +
          '<li><code>optimise(trainSlice)</code> returns the best parameters for that training data</li>' +
          '<li><code>evaluate(slice, params)</code> returns a performance number</li></ul>' +
          'For each window, optimise on the training slice, evaluate on <em>both</em> slices with those parameters, and collect <code>{ params, inSample, outOfSample }</code>.<br>' +
          'Return <code>{ windows, totalIn, totalOut, efficiency }</code>, where <code>efficiency</code> is <code>totalOut / totalIn</code> — or <code>0</code> when <code>totalIn</code> is 0.',
        starter: 'function walkForward(series, { trainSize, testSize, anchored, optimise, evaluate }) {\n  // roll the optimise-then-test cycle across the history\n}\n',
        solution: 'function walkForward(series, { trainSize, testSize, anchored, optimise, evaluate }) {\n  const windows = [];\n  let start = 0;\n  while (start + trainSize + testSize <= series.length) {\n    const trainFrom = anchored ? 0 : start;\n    const trainTo = start + trainSize;\n    const train = series.slice(trainFrom, trainTo);\n    const test = series.slice(trainTo, trainTo + testSize);\n    const params = optimise(train);\n    windows.push({\n      params,\n      inSample: evaluate(train, params),\n      outOfSample: evaluate(test, params)\n    });\n    start += testSize;\n  }\n  const totalIn = windows.reduce((a, w) => a + w.inSample, 0);\n  const totalOut = windows.reduce((a, w) => a + w.outOfSample, 0);\n  return { windows, totalIn, totalOut, efficiency: totalIn === 0 ? 0 : totalOut / totalIn };\n}',
        hints: ['Reuse the window logic from the previous exercise, slicing the data as you go.',
                '<code>optimise</code> only ever sees the training slice — that is the whole point.',
                'Evaluate the same parameters on both slices so the efficiency ratio is meaningful.'],
        tests: { checks: [
          { name: 'optimise only ever sees training data', expose: ['walkForward'],
            run: function (s) {
              var series = [];
              for (var i = 0; i < 100; i++) series.push(i);
              var maxSeen = -1;
              s.walkForward(series, {
                trainSize: 40, testSize: 20, anchored: false,
                optimise: function (train) { maxSeen = Math.max(maxSeen, train[train.length - 1]); return 1; },
                evaluate: function () { return 1; }
              });
              // the last training window ends at index 79
              return maxSeen === 79 ? true : 'optimise saw up to ' + maxSeen + ', expected 79';
            } },
          { name: 'produces one entry per window', expose: ['walkForward'],
            run: function (s) {
              var series = new Array(100).fill(1);
              var r = s.walkForward(series, {
                trainSize: 40, testSize: 20, anchored: false,
                optimise: function () { return { n: 1 }; },
                evaluate: function () { return 2; }
              });
              if (r.windows.length !== 3) return 'expected 3 windows, got ' + r.windows.length;
              return (r.totalIn === 6 && r.totalOut === 6) ? true : 'totals were ' + r.totalIn + '/' + r.totalOut;
            } },
          { name: 'efficiency is out over in', expose: ['walkForward'],
            run: function (s) {
              var series = new Array(100).fill(1);
              var r = s.walkForward(series, {
                trainSize: 40, testSize: 20, anchored: false,
                optimise: function () { return 1; },
                evaluate: function (slice) { return slice.length === 40 ? 10 : 4; }
              });
              return Math.abs(r.efficiency - 0.4) < 1e-9 ? true : 'expected 0.4, got ' + r.efficiency;
            } },
          { name: 'a zero in-sample total gives an efficiency of 0', expose: ['walkForward'],
            run: function (s) {
              var series = new Array(100).fill(1);
              var r = s.walkForward(series, {
                trainSize: 40, testSize: 20, anchored: false,
                optimise: function () { return 1; },
                evaluate: function () { return 0; }
              });
              return r.efficiency === 0 ? true : 'expected 0, got ' + r.efficiency;
            } },
          { name: 'too little data produces no windows', expose: ['walkForward'],
            run: function (s) {
              var r = s.walkForward([1, 2, 3], {
                trainSize: 40, testSize: 20, anchored: false,
                optimise: function () { return 1; }, evaluate: function () { return 1; }
              });
              return (r.windows.length === 0 && r.efficiency === 0) ? true : 'expected an empty result';
            } }
        ] } }
    ],
    quiz: [
      { q: 'You tune parameters on all your data and the backtest looks excellent. What have you shown?',
        options: ['The strategy works', 'That some parameter combination fits this dataset — which is true of noise too', 'That the data is clean', 'Nothing can be concluded either way'],
        answer: 1,
        explain: 'With enough combinations something always fits. Only unseen data distinguishes edge from curve-fitting.' },
      { q: 'What does walk-forward efficiency near 0.3 suggest?',
        options: ['A strong strategy', 'Most of the in-sample performance was fitted to noise', 'A data error', 'The test window is too long'],
        answer: 1,
        explain: 'Out-of-sample delivering a third of in-sample means two thirds of the result did not survive contact with new data.' },
      { q: 'What happens once you adjust parameters after seeing an out-of-sample result?',
        options: ['Nothing', 'That data becomes in-sample, and the honest estimate is gone', 'The efficiency improves', 'It becomes a walk-forward test'],
        answer: 1,
        explain: 'Out-of-sample data can only be spent once. After that you need genuinely new data.' }
    ],
    recap: [
      'Only performance on unseen data is evidence.',
      'Walk-forward repeats the split across history and concatenates the test periods.',
      'Rolling adapts to regime; anchored uses everything — choose before you look.',
      'Efficiency near 1 is good; far below it means noise fitting.'
    ],
    vocab: [
      { term: 'Out-of-sample', def: 'Data the parameters were not chosen on. The only honest test, and it can be used only once.' },
      { term: 'Walk-forward analysis', def: 'Repeated optimise-then-test cycles rolled through history, mimicking periodic re-tuning in live trading.' }
    ]
  });

  C.push({
    id: 'd078', day: 78, module: 6, minutes: 30,
    title: 'Overfitting and Parameter Sensitivity',
    subtitle: 'Why the best parameter set on your data is usually the wrong one.',
    goal: '<b>Goal:</b> judge a parameter choice by the neighbourhood around it, not by its peak value.',
    objectives: [
      'Explain why a sharp performance peak is a warning',
      'Build and read a parameter surface',
      'Pick a robust parameter rather than the best one',
      'Count how many combinations you actually tested'
    ],
    sections: [
      { h: 'The peak is where the noise is',
        body: '<p>Sweep a parameter and plot the result. A genuine edge produces a broad plateau — nearby values all work, because the effect is real. Curve-fitting produces a needle: one value is spectacular and its neighbours are mediocre.</p>' +
              '<p>The needle is spectacular <em>because</em> it happens to line up with the noise in this particular sample. Live, the noise is different and the needle is gone.</p>',
        code: 'const plateau = [8, 11, 13, 14, 13, 12, 10];\nconst needle  = [2, 3, 4, 40, 5, 3, 2];\n\nfunction neighbourhood(scores, i) {\n  const w = scores.slice(Math.max(0, i - 1), i + 2);\n  return w.reduce((a, b) => a + b, 0) / w.length;\n}\n\nconsole.log("plateau best:", Math.max(...plateau), "neighbourhood:", neighbourhood(plateau, 3).toFixed(1));\nconsole.log("needle  best:", Math.max(...needle), "neighbourhood:", neighbourhood(needle, 3).toFixed(1));' },
      { h: 'Score the neighbourhood, not the point',
        body: '<p>The practical fix is to rank parameters by the average of themselves and their neighbours. A value only wins if the values around it also work, which is exactly the property you want to survive out of sample.</p>',
        code: 'function robustPick(scores) {\n  let bestIdx = 0, bestScore = -Infinity;\n  scores.forEach((_, i) => {\n    const w = scores.slice(Math.max(0, i - 1), i + 2);\n    const avg = w.reduce((a, b) => a + b, 0) / w.length;\n    if (avg > bestScore) { bestScore = avg; bestIdx = i; }\n  });\n  return { index: bestIdx, score: bestScore };\n}\n\nconsole.log("needle:", robustPick([2, 3, 4, 40, 5, 3, 2]));\nconsole.log("plateau:", robustPick([8, 11, 13, 14, 13, 12, 10]));' },
      { h: 'Count your degrees of freedom',
        body: '<p>Four parameters with ten values each is ten thousand combinations. Testing all of them and reporting the best is close to guaranteed to find something impressive in random data.</p>' +
              '<div class="note note-warn"><b>The rule of thumb</b>You need roughly 10–30 independent trades per parameter to say anything. A strategy with five parameters and 60 backtest trades has told you nothing about the future.</div>',
        code: 'function combinations(grid) {\n  return Object.values(grid).reduce((a, values) => a * values.length, 1);\n}\n\nconsole.log(combinations({ fast: [5, 9, 13], slow: [21, 34, 55] }));\nconsole.log(combinations({\n  fast: [5, 9, 13, 21], slow: [21, 34, 55, 89],\n  stop: [1, 1.5, 2, 2.5], target: [2, 3, 4, 5]\n}));' },
      { h: 'The honest reporting standard',
        body: '<p>Report how many combinations you tried, the out-of-sample result rather than the in-sample one, and the shape of the surface around your choice. A single impressive number with none of that context is a marketing claim, not a result.</p>' }
    ],
    parsons: {
      prompt: 'Score a parameter by its neighbourhood.',
      lines: [
        'const window = scores.slice(Math.max(0, i - 1), i + 2);',
        'const avg = window.reduce((a, b) => a + b, 0) / window.length;',
        'console.log(avg);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'neighbourhoodScores()', difficulty: 'Core',
        prompt: 'Write <code>neighbourhoodScores(scores, radius)</code> returning, for each index, the average of the scores within <code>radius</code> positions either side (clipped at the array edges).',
        starter: 'function neighbourhoodScores(scores, radius) {\n  // local average around each index\n}\n',
        solution: 'function neighbourhoodScores(scores, radius) {\n  return scores.map((_, i) => {\n    const w = scores.slice(Math.max(0, i - radius), i + radius + 1);\n    return w.reduce((a, b) => a + b, 0) / w.length;\n  });\n}',
        hints: ['<code>Math.max(0, i - radius)</code> clips the left edge; <code>slice</code> handles the right by itself.',
                'Divide by the window\'s actual length, which is shorter at the edges.'],
        tests: { fn: 'neighbourhoodScores', approx: 1e-9, cases: [
          { args: [[1, 2, 3], 1], expect: [1.5, 2, 2.5] },
          { args: [[10, 10, 10], 1], expect: [10, 10, 10] },
          { args: [[2, 3, 4, 40, 5, 3, 2], 1], expect: [2.5, 3, 47 / 3, 49 / 3, 48 / 3, 10 / 3, 2.5] },
          { args: [[5], 2], expect: [5] },
          { args: [[], 1], expect: [] }
        ] } },
      { id: 'e2', title: 'robustParameter()', difficulty: 'Core',
        prompt: 'Write <code>robustParameter(values, scores, radius)</code> where <code>values</code> and <code>scores</code> are parallel arrays.<br>' +
          'Return <code>{ bestValue, bestScore, robustValue, robustScore, isNeedle }</code>:<ul>' +
          '<li><code>bestValue</code>/<code>bestScore</code> — the highest raw score</li>' +
          '<li><code>robustValue</code>/<code>robustScore</code> — the highest neighbourhood average, and its value</li>' +
          '<li><code>isNeedle</code> — whether the best raw score is more than twice its own neighbourhood average</li></ul>' +
          'Empty inputs return all nulls with <code>isNeedle: false</code>.',
        starter: 'function robustParameter(values, scores, radius) {\n  // best vs robust choice\n}\n',
        solution: 'function robustParameter(values, scores, radius) {\n  if (!scores.length) {\n    return { bestValue: null, bestScore: null, robustValue: null, robustScore: null, isNeedle: false };\n  }\n  const neighbourhood = scores.map((_, i) => {\n    const w = scores.slice(Math.max(0, i - radius), i + radius + 1);\n    return w.reduce((a, b) => a + b, 0) / w.length;\n  });\n  let bi = 0, ri = 0;\n  scores.forEach((v, i) => { if (v > scores[bi]) bi = i; });\n  neighbourhood.forEach((v, i) => { if (v > neighbourhood[ri]) ri = i; });\n  return {\n    bestValue: values[bi],\n    bestScore: scores[bi],\n    robustValue: values[ri],\n    robustScore: neighbourhood[ri],\n    isNeedle: scores[bi] > 2 * neighbourhood[bi]\n  };\n}',
        hints: ['Compute the neighbourhood averages first, then find the argmax of each array.',
                'The needle test compares the peak with its <em>own</em> neighbourhood average.',
                'Guard the empty case before indexing anything.'],
        tests: { fn: 'robustParameter', approx: 1e-9, cases: [
          { args: [[5, 9, 13, 21, 34, 55, 89], [2, 3, 4, 40, 5, 3, 2], 1],
            expect: { bestValue: 21, bestScore: 40, robustValue: 21, robustScore: 49 / 3, isNeedle: true },
            name: 'a sharp peak is flagged as a needle' },
          { args: [[5, 9, 13, 21, 34, 55, 89], [8, 11, 13, 14, 13, 12, 10], 1],
            expect: { bestValue: 21, bestScore: 14, robustValue: 21, robustScore: 40 / 3, isNeedle: false },
            name: 'a broad plateau is not a needle' },
          { args: [[], [], 1],
            expect: { bestValue: null, bestScore: null, robustValue: null, robustScore: null, isNeedle: false } }
        ] } },
      { id: 'e3', title: 'sweepReport()', difficulty: 'Stretch',
        prompt: 'Write <code>sweepReport(grid, evaluate, radius)</code> where <code>grid</code> is <code>{ paramName: [values] }</code> for exactly <strong>two</strong> parameters and <code>evaluate(combo)</code> scores one combination.<br>' +
          'Return <code>{ combinations, results, best, robust }</code>:<ul>' +
          '<li><code>combinations</code> — how many were tested</li>' +
          '<li><code>results</code> — <code>{ params, score }</code> for every combination, in nested order (first parameter outer)</li>' +
          '<li><code>best</code> — the entry with the highest raw score</li>' +
          '<li><code>robust</code> — the entry whose score averaged with every neighbour differing by one index step in <em>either</em> parameter is highest</li></ul>',
        starter: 'function sweepReport(grid, evaluate, radius) {\n  // exhaustive two-parameter sweep with a robustness pass\n}\n',
        solution: 'function sweepReport(grid, evaluate, radius) {\n  const names = Object.keys(grid);\n  const [aName, bName] = names;\n  const as = grid[aName], bs = grid[bName];\n  const results = [];\n  const scoreAt = [];\n  for (let i = 0; i < as.length; i++) {\n    scoreAt.push([]);\n    for (let j = 0; j < bs.length; j++) {\n      const params = { [aName]: as[i], [bName]: bs[j] };\n      const score = evaluate(params);\n      scoreAt[i].push(score);\n      results.push({ params, score });\n    }\n  }\n  let best = null, robust = null, bestRobustScore = -Infinity;\n  results.forEach(r => { if (!best || r.score > best.score) best = r; });\n  for (let i = 0; i < as.length; i++) {\n    for (let j = 0; j < bs.length; j++) {\n      let sum = 0, n = 0;\n      for (let di = -radius; di <= radius; di++) {\n        for (let dj = -radius; dj <= radius; dj++) {\n          const x = i + di, y = j + dj;\n          if (x < 0 || y < 0 || x >= as.length || y >= bs.length) continue;\n          sum += scoreAt[x][y]; n++;\n        }\n      }\n      const avg = sum / n;\n      if (avg > bestRobustScore) {\n        bestRobustScore = avg;\n        robust = { params: { [aName]: as[i], [bName]: bs[j] }, score: avg };\n      }\n    }\n  }\n  return { combinations: results.length, results, best, robust };\n}',
        hints: ['Build a two-dimensional score grid as well as the flat results list — the robustness pass needs the grid shape.',
                'The neighbourhood is a square window clipped at both edges, so count how many cells actually contributed.',
                'Computed property names — <code>{ [aName]: value }</code> — build the params object from the grid keys.'],
        tests: { checks: [
          { name: 'tests every combination once', expose: ['sweepReport'],
            run: function (s) {
              var seen = [];
              var r = s.sweepReport({ fast: [5, 9, 13], slow: [21, 34] },
                function (c) { seen.push(c.fast + ':' + c.slow); return 1; }, 1);
              if (r.combinations !== 6) return 'expected 6 combinations, got ' + r.combinations;
              return seen.length === 6 ? true : 'evaluate ran ' + seen.length + ' times';
            } },
          { name: 'results are in nested order', expose: ['sweepReport'],
            run: function (s) {
              var r = s.sweepReport({ a: [1, 2], b: [10, 20] }, function () { return 0; }, 1);
              var order = r.results.map(function (x) { return x.params.a + '-' + x.params.b; }).join(',');
              return order === '1-10,1-20,2-10,2-20' ? true : 'order was ' + order;
            } },
          { name: 'best picks the highest raw score', expose: ['sweepReport'],
            run: function (s) {
              var r = s.sweepReport({ a: [1, 2, 3], b: [1, 2, 3] },
                function (c) { return (c.a === 2 && c.b === 2) ? 100 : 1; }, 1);
              return (r.best.score === 100 && r.best.params.a === 2 && r.best.params.b === 2)
                ? true : 'best was ' + JSON.stringify(r.best);
            } },
          { name: 'robust prefers a plateau over a spike', expose: ['sweepReport'],
            run: function (s) {
              // a lone spike at (1,1) versus a solid block in the far corner
              var r = s.sweepReport({ a: [0, 1, 2, 3, 4], b: [0, 1, 2, 3, 4] }, function (c) {
                if (c.a === 1 && c.b === 1) return 50;
                if (c.a >= 3 && c.b >= 3) return 20;
                return 0;
              }, 1);
              if (r.best.score !== 50) return 'best should still be the spike';
              return (r.robust.params.a >= 3 && r.robust.params.b >= 3)
                ? true : 'robust chose ' + JSON.stringify(r.robust.params) + ', expected the plateau';
            } }
        ] } }
    ],
    quiz: [
      { q: 'A parameter sweep shows one spectacular value with mediocre neighbours. What is that?',
        options: ['The optimum', 'A warning sign — the peak is probably fitted to noise', 'A data error', 'Proof of an edge'],
        answer: 1,
        explain: 'A real effect degrades gradually. A needle exists because it aligned with this sample\'s noise, which will not repeat.' },
      { q: 'Why rank parameters by their neighbourhood average?',
        options: ['It is faster', 'A value only wins if the values around it also work — which is what survives out of sample', 'It smooths the data', 'To avoid nulls'],
        answer: 1,
        explain: 'Robustness to small parameter changes is a proxy for robustness to new data.' },
      { q: 'Five parameters, ten values each, tested on 60 trades. What can you conclude?',
        options: ['The best combination is the right one', 'Essentially nothing — 100,000 combinations on 60 trades will fit noise', 'The strategy is broken', 'You need more parameters'],
        answer: 1,
        explain: 'Degrees of freedom vastly exceed the evidence. Roughly 10–30 independent trades per parameter is the usual minimum.' }
    ],
    recap: [
      'A broad plateau suggests a real effect; a sharp needle suggests noise.',
      'Rank by neighbourhood average, not by peak.',
      'Count your combinations — they are degrees of freedom.',
      'Report the sweep size and the out-of-sample number, not just the best result.'
    ],
    vocab: [
      { term: 'Overfitting', def: 'Tuning a model to the noise in a particular sample. Looks excellent in the backtest, disappears live.' },
      { term: 'Parameter surface', def: 'Performance plotted across the parameter grid. Its shape matters more than its maximum.' }
    ]
  });

  C.push({
    id: 'd079', day: 79, module: 6, minutes: 30,
    title: 'Monte Carlo Analysis',
    subtitle: 'Your equity curve is one sample from a distribution.',
    goal: '<b>Goal:</b> resample a trade sequence to see the range of outcomes the same strategy could plausibly have produced.',
    objectives: [
      'Explain why the observed order of trades is arbitrary',
      'Shuffle a trade sequence deterministically',
      'Build a distribution of outcomes and read its percentiles',
      'Estimate a realistic worst-case drawdown'
    ],
    sections: [
      { h: 'The order you got was luck',
        body: '<p>Your backtest produced a specific sequence of wins and losses. Reorder the same trades and the total P&L is identical — but the equity path, and therefore the maximum drawdown, changes completely.</p>' +
              '<p>If all your losses had arrived consecutively, would the account have survived? That question has an answer, and shuffling is how you get it.</p>',
        code: 'function maxDD(pnls) {\n  let eq = 0, peak = 0, worst = 0;\n  for (const p of pnls) {\n    eq += p;\n    peak = Math.max(peak, eq);\n    worst = Math.min(worst, eq - peak);\n  }\n  return -worst;\n}\n\nconst trades = [500, -200, 800, -300, -250, 600, -400];\nconsole.log("as traded:", maxDD(trades));\nconsole.log("losses first:", maxDD([...trades].sort((a, b) => a - b)));\nconsole.log("same total P&L either way:", trades.reduce((a, b) => a + b, 0));' },
      { h: 'Deterministic shuffling',
        body: '<p>Analysis has to be reproducible, so use a seeded generator rather than <code>Math.random</code>. The Fisher–Yates shuffle with a seeded source gives an unbiased permutation you can regenerate exactly.</p>',
        code: 'function makeRng(seed) {\n  let s = seed >>> 0;\n  return () => {\n    s = (s * 1664525 + 1013904223) >>> 0;\n    return s / 4294967296;\n  };\n}\n\nfunction shuffle(arr, rng) {\n  const a = [...arr];\n  for (let i = a.length - 1; i > 0; i--) {\n    const j = Math.floor(rng() * (i + 1));\n    [a[i], a[j]] = [a[j], a[i]];\n  }\n  return a;\n}\n\nconst rng = makeRng(42);\nconsole.log(shuffle([1, 2, 3, 4, 5], rng));\nconsole.log(shuffle([1, 2, 3, 4, 5], makeRng(42)));   // same seed, same result' },
      { h: 'Percentiles are the output',
        body: '<p>Run a thousand shuffles, record the maximum drawdown of each, and sort. The 95th percentile is the drawdown you should plan for; the median is what to expect; the observed one is just a sample.</p>' +
              '<div class="note note-trade"><b>The practical use</b>If the 95th-percentile drawdown exceeds what you can tolerate, the strategy is too large for your account — reduce size until it does not. This is a sizing decision made with evidence rather than hope.</div>',
        code: 'function percentile(sorted, p) {\n  if (!sorted.length) return 0;\n  const idx = Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length));\n  return sorted[idx];\n}\n\nconst sample = [3, 5, 5, 6, 8, 9, 12, 15, 20, 30];\nconsole.log("median:", percentile(sample, 50));\nconsole.log("95th:", percentile(sample, 95));' },
      { h: 'What shuffling assumes',
        body: '<p>Reordering assumes trades are independent. If your strategy has genuine serial correlation — trending markets producing clusters of wins — shuffling destroys that structure and understates the real clustering risk. It is a useful lower bound on the danger, not a complete model.</p>' }
    ],
    parsons: {
      prompt: 'Shuffle deterministically with Fisher-Yates.',
      lines: [
        'const a = [...arr];',
        'for (let i = a.length - 1; i > 0; i--) {',
        '  const j = Math.floor(rng() * (i + 1));',
        '  [a[i], a[j]] = [a[j], a[i]];',
        '}',
        'return a;'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeRng() and shuffle()', difficulty: 'Core',
        prompt: 'Write two functions:<ul>' +
          '<li><code>makeRng(seed)</code> — a deterministic generator returning values in <code>[0, 1)</code>, using <code>s = (s × 1664525 + 1013904223) >>> 0</code> and dividing by <code>4294967296</code></li>' +
          '<li><code>shuffle(arr, rng)</code> — a Fisher–Yates shuffle returning a <strong>new</strong> array</li></ul>',
        expose: ['makeRng', 'shuffle'],
        starter: 'function makeRng(seed) {\n  // deterministic [0, 1) generator\n}\n\nfunction shuffle(arr, rng) {\n  // new array, Fisher-Yates\n}\n',
        solution: 'function makeRng(seed) {\n  let s = seed >>> 0;\n  return () => {\n    s = (s * 1664525 + 1013904223) >>> 0;\n    return s / 4294967296;\n  };\n}\n\nfunction shuffle(arr, rng) {\n  const a = [...arr];\n  for (let i = a.length - 1; i > 0; i--) {\n    const j = Math.floor(rng() * (i + 1));\n    [a[i], a[j]] = [a[j], a[i]];\n  }\n  return a;\n}',
        hints: ['Keep the state in the closure so each call advances it.',
                '<code>&gt;&gt;&gt; 0</code> keeps the value an unsigned 32-bit integer.',
                'Walk backwards and swap with a random earlier index, inclusive of the current one.'],
        tests: { checks: [
          { name: 'the generator stays within [0, 1)', expose: ['makeRng'],
            run: function (s) {
              var r = s.makeRng(1);
              for (var i = 0; i < 200; i++) {
                var v = r();
                if (!(v >= 0 && v < 1)) return 'produced ' + v;
              }
              return true;
            } },
          { name: 'the same seed gives the same sequence', expose: ['makeRng'],
            run: function (s) {
              var a = s.makeRng(42), b = s.makeRng(42);
              for (var i = 0; i < 20; i++) if (a() !== b()) return 'the sequences diverged';
              return true;
            } },
          { name: 'different seeds give different sequences', expose: ['makeRng'],
            run: function (s) {
              var a = s.makeRng(1), b = s.makeRng(2);
              var same = true;
              for (var i = 0; i < 10; i++) if (a() !== b()) same = false;
              return same ? 'different seeds produced identical output' : true;
            } },
          { name: 'shuffle preserves every element', expose: ['makeRng', 'shuffle'],
            run: function (s, h) {
              var input = [1, 2, 3, 4, 5, 6, 7, 8];
              var out = s.shuffle(input, s.makeRng(7));
              return h.eq([...out].sort(function (a, b) { return a - b; }), input)
                ? true : 'the shuffle lost or duplicated elements: ' + JSON.stringify(out);
            } },
          { name: 'shuffle does not modify the input', expose: ['makeRng', 'shuffle'],
            run: function (s) {
              var input = [1, 2, 3, 4, 5];
              s.shuffle(input, s.makeRng(7));
              return input.join(',') === '1,2,3,4,5' ? true : 'the input array was reordered';
            } },
          { name: 'shuffle actually reorders', expose: ['makeRng', 'shuffle'],
            run: function (s) {
              var input = [];
              for (var i = 0; i < 30; i++) input.push(i);
              var out = s.shuffle(input, s.makeRng(3));
              return out.join(',') !== input.join(',') ? true : 'the array came back in its original order';
            } }
        ] } },
      { id: 'e2', title: 'maxDrawdownOf() and percentile()', difficulty: 'Core',
        prompt: 'Write two helpers:<ul>' +
          '<li><code>maxDrawdownOf(pnls)</code> — the largest peak-to-trough decline of the cumulative P&L, as a positive number, starting from 0</li>' +
          '<li><code>percentile(values, p)</code> — sort a copy ascending and return the value at <code>Math.min(length - 1, Math.floor(p / 100 × length))</code>; <code>0</code> for an empty array</li></ul>',
        expose: ['maxDrawdownOf', 'percentile'],
        starter: 'function maxDrawdownOf(pnls) {\n  // largest peak-to-trough decline, positive\n}\n\nfunction percentile(values, p) {\n  // pth percentile of a copy\n}\n',
        solution: 'function maxDrawdownOf(pnls) {\n  let eq = 0, peak = 0, worst = 0;\n  for (const v of pnls) {\n    eq += v;\n    peak = Math.max(peak, eq);\n    worst = Math.min(worst, eq - peak);\n  }\n  return -worst;\n}\n\nfunction percentile(values, p) {\n  if (!values.length) return 0;\n  const sorted = [...values].sort((a, b) => a - b);\n  const idx = Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length));\n  return sorted[idx];\n}',
        hints: ['Start the equity and peak at 0 so a losing first trade is already a drawdown.',
                'Return the negated worst value so the result is positive.',
                'Sort a copy — never reorder the caller\'s array.'],
        tests: { checks: [
          { name: 'maxDrawdownOf measures the worst decline', expose: ['maxDrawdownOf'],
            run: function (s) {
              var v = s.maxDrawdownOf([500, -200, 800, -300, -250, 600, -400]);
              return Math.abs(v - 550) < 1e-9 ? true : 'expected 550, got ' + v;
            } },
          { name: 'a losing first trade counts', expose: ['maxDrawdownOf'],
            run: function (s) {
              return s.maxDrawdownOf([-100, 50]) === 100 ? true : 'expected 100, got ' + s.maxDrawdownOf([-100, 50]);
            } },
          { name: 'an all-winning sequence has no drawdown', expose: ['maxDrawdownOf'],
            run: function (s) {
              return s.maxDrawdownOf([100, 200]) === 0 ? true : 'expected 0';
            } },
          { name: 'percentile reads the sorted position', expose: ['percentile'],
            run: function (s) {
              var v = [3, 5, 5, 6, 8, 9, 12, 15, 20, 30];
              if (s.percentile(v, 50) !== 9) return '50th should be 9, got ' + s.percentile(v, 50);
              if (s.percentile(v, 95) !== 30) return '95th should be 30, got ' + s.percentile(v, 95);
              return s.percentile(v, 0) === 3 ? true : '0th should be 3';
            } },
          { name: 'percentile does not modify its input', expose: ['percentile'],
            run: function (s) {
              var v = [3, 1, 2];
              s.percentile(v, 50);
              return v.join(',') === '3,1,2' ? true : 'the input array was sorted in place';
            } },
          { name: 'an empty array gives 0', expose: ['percentile'],
            run: function (s) { return s.percentile([], 95) === 0 ? true : 'expected 0'; } }
        ] } },
      { id: 'e3', title: 'monteCarlo()', difficulty: 'Stretch',
        prompt: 'Write <code>monteCarlo(pnls, runs, seed)</code> which shuffles the trade sequence <code>runs</code> times from a seeded generator and returns:<br>' +
          '<code>{ observedDrawdown, medianDrawdown, worstDrawdown, p95Drawdown, totalPnl }</code><ul>' +
          '<li><code>observedDrawdown</code> — the drawdown of the original order</li>' +
          '<li>the other three come from the distribution of shuffled drawdowns</li>' +
          '<li><code>totalPnl</code> — unchanged by shuffling, so computed once</li></ul>' +
          'With no trades or no runs, every field is 0. The helpers from the previous exercises are in the starter.',
        starter: 'function makeRng(seed) {\n  let s = seed >>> 0;\n  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };\n}\nfunction shuffle(arr, rng) {\n  const a = [...arr];\n  for (let i = a.length - 1; i > 0; i--) {\n    const j = Math.floor(rng() * (i + 1));\n    [a[i], a[j]] = [a[j], a[i]];\n  }\n  return a;\n}\nfunction maxDrawdownOf(pnls) {\n  let eq = 0, peak = 0, worst = 0;\n  for (const v of pnls) { eq += v; peak = Math.max(peak, eq); worst = Math.min(worst, eq - peak); }\n  return -worst;\n}\nfunction percentile(values, p) {\n  if (!values.length) return 0;\n  const sorted = [...values].sort((a, b) => a - b);\n  return sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length))];\n}\n\nfunction monteCarlo(pnls, runs, seed) {\n  // resample the trade order and describe the distribution\n}\n',
        solution: 'function makeRng(seed) {\n  let s = seed >>> 0;\n  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };\n}\nfunction shuffle(arr, rng) {\n  const a = [...arr];\n  for (let i = a.length - 1; i > 0; i--) {\n    const j = Math.floor(rng() * (i + 1));\n    [a[i], a[j]] = [a[j], a[i]];\n  }\n  return a;\n}\nfunction maxDrawdownOf(pnls) {\n  let eq = 0, peak = 0, worst = 0;\n  for (const v of pnls) { eq += v; peak = Math.max(peak, eq); worst = Math.min(worst, eq - peak); }\n  return -worst;\n}\nfunction percentile(values, p) {\n  if (!values.length) return 0;\n  const sorted = [...values].sort((a, b) => a - b);\n  return sorted[Math.min(sorted.length - 1, Math.floor(p / 100 * sorted.length))];\n}\n\nfunction monteCarlo(pnls, runs, seed) {\n  if (!pnls.length || runs <= 0) {\n    return { observedDrawdown: 0, medianDrawdown: 0, worstDrawdown: 0, p95Drawdown: 0, totalPnl: 0 };\n  }\n  const rng = makeRng(seed);\n  const draws = [];\n  for (let i = 0; i < runs; i++) draws.push(maxDrawdownOf(shuffle(pnls, rng)));\n  return {\n    observedDrawdown: maxDrawdownOf(pnls),\n    medianDrawdown: percentile(draws, 50),\n    worstDrawdown: Math.max(...draws),\n    p95Drawdown: percentile(draws, 95),\n    totalPnl: pnls.reduce((a, b) => a + b, 0)\n  };\n}',
        hints: ['Create the generator once, outside the loop, so each shuffle continues the sequence.',
                'Collect every shuffled drawdown into an array, then read percentiles off it.',
                'Guard both degenerate cases up front.'],
        tests: { checks: [
          { name: 'is reproducible for a given seed', expose: ['monteCarlo'],
            run: function (s, h) {
              var pnls = [500, -200, 800, -300, -250, 600, -400];
              var a = s.monteCarlo(pnls, 200, 42);
              var b = s.monteCarlo(pnls, 200, 42);
              return h.eq(a, b) ? true : 'the same seed produced different results';
            } },
          { name: 'total P&L is unchanged by shuffling', expose: ['monteCarlo'],
            run: function (s) {
              var pnls = [500, -200, 800, -300, -250, 600, -400];
              var r = s.monteCarlo(pnls, 100, 1);
              var want = pnls.reduce(function (a, b) { return a + b; }, 0);
              return r.totalPnl === want ? true : 'expected ' + want + ', got ' + r.totalPnl;
            } },
          { name: 'the worst shuffle is at least as bad as the observed order', expose: ['monteCarlo'],
            run: function (s) {
              var pnls = [500, -200, 800, -300, -250, 600, -400];
              var r = s.monteCarlo(pnls, 500, 9);
              if (r.worstDrawdown < r.observedDrawdown - 1e-9) return 'worst was below the observed drawdown';
              return r.p95Drawdown <= r.worstDrawdown + 1e-9 ? true : 'the 95th percentile exceeded the worst case';
            } },
          { name: 'the median sits between the best and worst', expose: ['monteCarlo'],
            run: function (s) {
              var pnls = [500, -200, 800, -300, -250, 600, -400];
              var r = s.monteCarlo(pnls, 300, 5);
              return (r.medianDrawdown <= r.p95Drawdown && r.p95Drawdown <= r.worstDrawdown)
                ? true : 'the percentiles are out of order: ' + JSON.stringify(r);
            } },
          { name: 'no trades gives an all-zero result', expose: ['monteCarlo'],
            run: function (s, h) {
              return h.eq(s.monteCarlo([], 100, 1),
                { observedDrawdown: 0, medianDrawdown: 0, worstDrawdown: 0, p95Drawdown: 0, totalPnl: 0 })
                ? true : 'expected all zeros';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does reordering a trade sequence change?',
        options: ['The total P&L', 'The equity path and the maximum drawdown', 'The win rate', 'Nothing'],
        answer: 1,
        explain: 'The sum is identical; the path is not. Drawdown depends entirely on the order the results arrived in.' },
      { q: 'Why use a seeded generator instead of <code>Math.random</code>?',
        options: ['It is faster', 'So the analysis can be reproduced exactly', 'It is more random', 'Math.random is deprecated'],
        answer: 1,
        explain: 'A risk figure you cannot regenerate is a risk figure you cannot check.' },
      { q: 'What does shuffling assume about your trades?',
        options: ['That they are profitable', 'That they are independent — so it understates genuine clustering', 'That they are the same size', 'Nothing'],
        answer: 1,
        explain: 'Real strategies often cluster wins and losses by regime. Shuffling destroys that, making it a lower bound on the danger.' }
    ],
    recap: [
      'The observed trade order is one sample; shuffling shows the others.',
      'Total P&L is invariant; drawdown is not.',
      'Use a seeded generator so results are reproducible.',
      'Size the strategy against the 95th-percentile drawdown, not the observed one.'
    ],
    vocab: [
      { term: 'Monte Carlo analysis', def: 'Resampling to estimate a distribution of outcomes rather than relying on the single path you happened to observe.' },
      { term: 'Fisher-Yates shuffle', def: 'The standard unbiased shuffle: walk backwards, swapping each element with a random earlier one.' }
    ]
  });


  C.push({
    id: 'd080', day: 80, module: 6, minutes: 35, boss: true,
    title: 'Boss: The Backtester',
    subtitle: 'Bar loop, sizing, costs, equity and statistics in one engine.',
    goal: '<b>Goal:</b> build the complete backtester — the thing every previous level in this module was a piece of.',
    objectives: [
      'Drive a strategy through a bar loop with correct event ordering',
      'Size each position from current equity',
      'Apply costs on entry and exit',
      'Produce an equity curve and a full statistics block'
    ],
    sections: [
      { h: 'The whole engine in one paragraph',
        body: '<p>For each bar: mark the open position, check its stop and target against the bar\'s range, then evaluate the signal on data up to this bar, size it from current equity, and open a position at the next bar\'s open. Record every closed trade. At the end, derive everything else from that record.</p>' +
              '<p>You have written all of it. This level is the assembly, and the assembly is where the bugs live.</p>' },
      { h: 'Equity updates only on closed trades',
        body: '<p>Keeping realised equity separate from open P&L avoids a whole family of double-counting bugs. Size the next position from realised equity, and let the open position float until it closes.</p>',
        code: 'let equity = 100000;\nconst trades = [];\n\nfunction closeTrade(t, exit, reason, costs) {\n  const points = t.side === "long" ? exit - t.entry : t.entry - exit;\n  const gross = points * t.qty * costs.pointValue;\n  const commission = costs.commissionPerSide * t.qty * 2;\n  const net = gross - commission;\n  equity += net;\n  trades.push({ ...t, exit, reason, points, net });\n  return net;\n}\n\ncloseTrade({ side: "long", entry: 5240, qty: 2 }, 5250, "target",\n  { pointValue: 50, commissionPerSide: 2.5 });\nconsole.log("equity:", equity, "trades:", trades.length);' },
      { h: 'Where engines go wrong',
        body: '<div class="note note-warn"><b>Five bugs worth naming</b>' +
              '<br>1. Sizing from equity that already includes the open trade\'s unrealised profit.' +
              '<br>2. Checking the target before the stop, so ambiguous bars resolve optimistically.' +
              '<br>3. Allowing an entry on the same bar an exit occurred without recording the exit first.' +
              '<br>4. Applying commission once instead of on both sides.' +
              '<br>5. Computing statistics from a running counter rather than from the trade log, so the two drift apart.</div>' },
      { h: 'The output is a record, not a number',
        body: '<p>A backtester returns the trade log, the equity curve and the statistics derived from them. Anyone should be able to recompute every statistic from the log — if they cannot, the engine is hiding something.</p>' }
    ],
    parsons: {
      prompt: 'Close a trade and update realised equity.',
      lines: [
        'const points = t.side === "long" ? exit - t.entry : t.entry - exit;',
        'const gross = points * t.qty * pointValue;',
        'const net = gross - commissionPerSide * t.qty * 2;',
        'equity += net;',
        'trades.push({ ...t, exit, net });'
      ]
    },
    exercises: [
      { id: 'e1', title: 'closeTrade()', difficulty: 'Boss · part 1',
        prompt: 'Write <code>closeTrade(position, exitPrice, reason, costs)</code> returning the closed-trade record:<br>' +
          '<code>{ side, entry, exit, qty, reason, points, gross, commission, net }</code><ul>' +
          '<li><code>points</code> is signed for the side</li>' +
          '<li><code>gross</code> = points × qty × pointValue</li>' +
          '<li><code>commission</code> = commissionPerSide × qty × 2</li>' +
          '<li><code>net</code> = gross − commission</li></ul>' +
          '<code>position</code> is <code>{ side, entry, qty }</code>; <code>costs</code> is <code>{ pointValue, commissionPerSide }</code>.',
        starter: 'function closeTrade(position, exitPrice, reason, costs) {\n  // the closed-trade record\n}\n',
        solution: 'function closeTrade(position, exitPrice, reason, costs) {\n  const points = position.side === "long"\n    ? exitPrice - position.entry\n    : position.entry - exitPrice;\n  const gross = points * position.qty * costs.pointValue;\n  const commission = costs.commissionPerSide * position.qty * 2;\n  return {\n    side: position.side, entry: position.entry, exit: exitPrice,\n    qty: position.qty, reason, points, gross, commission, net: gross - commission\n  };\n}',
        hints: ['The sign of <code>points</code> depends on the side; everything else follows from it.',
                'Commission is charged twice — once per side of the round trip.'],
        tests: { fn: 'closeTrade', approx: 1e-9, cases: [
          { args: [{ side: 'long', entry: 5240, qty: 2 }, 5250, 'target', { pointValue: 50, commissionPerSide: 2.5 }],
            expect: { side: 'long', entry: 5240, exit: 5250, qty: 2, reason: 'target',
              points: 10, gross: 1000, commission: 10, net: 990 } },
          { args: [{ side: 'short', entry: 5250, qty: 1 }, 5240, 'target', { pointValue: 50, commissionPerSide: 2.5 }],
            expect: { side: 'short', entry: 5250, exit: 5240, qty: 1, reason: 'target',
              points: 10, gross: 500, commission: 5, net: 495 } },
          { args: [{ side: 'long', entry: 5240, qty: 1 }, 5232, 'stop', { pointValue: 50, commissionPerSide: 2.5 }],
            expect: { side: 'long', entry: 5240, exit: 5232, qty: 1, reason: 'stop',
              points: -8, gross: -400, commission: 5, net: -405 } },
          { args: [{ side: 'long', entry: 5240, qty: 1 }, 5240, 'flat', { pointValue: 50, commissionPerSide: 2.5 }],
            expect: { side: 'long', entry: 5240, exit: 5240, qty: 1, reason: 'flat',
              points: 0, gross: 0, commission: 5, net: -5 },
            name: 'a flat trade still pays commission' }
        ] } },
      { id: 'e2', title: 'exitCheck()', difficulty: 'Boss · part 2',
        prompt: 'Write <code>exitCheck(bar, position)</code> returning <code>{ reason, price }</code> or <code>null</code>.<ul>' +
          '<li>A long stops out when <code>bar.low &lt;= stop</code>, and takes profit when <code>bar.high &gt;= target</code>.</li>' +
          '<li>A short stops out when <code>bar.high &gt;= stop</code>, and takes profit when <code>bar.low &lt;= target</code>.</li>' +
          '<li>Check the stop first, so an ambiguous bar resolves pessimistically.</li>' +
          '<li>The exit price is the level itself, not the bar close.</li>' +
          '<li>A position with a <code>null</code> stop or target simply cannot exit that way.</li></ul>',
        starter: 'function exitCheck(bar, position) {\n  // { reason, price } or null\n}\n',
        solution: 'function exitCheck(bar, position) {\n  const { side, stop, target } = position;\n  if (side === "long") {\n    if (stop !== null && stop !== undefined && bar.low <= stop) return { reason: "stop", price: stop };\n    if (target !== null && target !== undefined && bar.high >= target) return { reason: "target", price: target };\n  } else {\n    if (stop !== null && stop !== undefined && bar.high >= stop) return { reason: "stop", price: stop };\n    if (target !== null && target !== undefined && bar.low <= target) return { reason: "target", price: target };\n  }\n  return null;\n}',
        hints: ['Test the stop before the target in both branches.',
                'A missing level means that exit is simply unavailable.',
                'Fill at the level, not at the close — that is what a resting order does.'],
        tests: { fn: 'exitCheck', cases: [
          { args: [{ high: 5250, low: 5230 }, { side: 'long', stop: 5232, target: 5260 }],
            expect: { reason: 'stop', price: 5232 } },
          { args: [{ high: 5262, low: 5240 }, { side: 'long', stop: 5232, target: 5260 }],
            expect: { reason: 'target', price: 5260 } },
          { args: [{ high: 5262, low: 5230 }, { side: 'long', stop: 5232, target: 5260 }],
            expect: { reason: 'stop', price: 5232 }, name: 'an ambiguous bar resolves to the stop' },
          { args: [{ high: 5250, low: 5245 }, { side: 'long', stop: 5232, target: 5260 }],
            expect: null },
          { args: [{ high: 5262, low: 5240 }, { side: 'short', stop: 5260, target: 5230 }],
            expect: { reason: 'stop', price: 5260 } },
          { args: [{ high: 5250, low: 5225 }, { side: 'short', stop: 5260, target: 5230 }],
            expect: { reason: 'target', price: 5230 } },
          { args: [{ high: 5250, low: 5230 }, { side: 'long', stop: null, target: null }],
            expect: null, name: 'a position with no levels cannot exit' }
        ] } },
      { id: 'e3', title: 'backtest()', difficulty: 'Boss · final',
        prompt: 'Write <code>backtest(bars, signalFn, config)</code> where <code>signalFn(visibleBars, index)</code> returns <code>{ side, stopPoints, targetPoints }</code> or <code>null</code>, and <code>config</code> is <code>{ startEquity, riskPercent, pointValue, commissionPerSide }</code>.<br>' +
          'Run the loop with correct ordering:<ol>' +
          '<li>If a position is open, run <code>exitCheck</code>; on an exit, close it, add the net to equity, and push the record.</li>' +
          '<li>If a fill is pending from the previous bar and no position is open, open it at <strong>this bar\'s open</strong>, sizing from <em>current realised equity</em>. A size of 0 means the trade is skipped.</li>' +
          '<li>Evaluate <code>signalFn(bars.slice(0, i + 1), i)</code> and store the result as pending, only when flat.</li></ol>' +
          'Return <code>{ trades, equityCurve, finalEquity, stats }</code> with <code>stats</code> = <code>{ count, wins, losses, netPnl, winRate, maxDrawdown }</code>.<br>' +
          '<span class="muted"><code>closeTrade</code> and <code>exitCheck</code> are in the starter. Size with <code>floor(equity × riskPercent / 100 / (stopPoints × pointValue))</code>, never below 0. The equity curve records equity after each closed trade.</span>',
        starter: 'function closeTrade(position, exitPrice, reason, costs) {\n  const points = position.side === "long" ? exitPrice - position.entry : position.entry - exitPrice;\n  const gross = points * position.qty * costs.pointValue;\n  const commission = costs.commissionPerSide * position.qty * 2;\n  return { side: position.side, entry: position.entry, exit: exitPrice, qty: position.qty,\n    reason, points, gross, commission, net: gross - commission };\n}\n\nfunction exitCheck(bar, position) {\n  const { side, stop, target } = position;\n  if (side === "long") {\n    if (stop != null && bar.low <= stop) return { reason: "stop", price: stop };\n    if (target != null && bar.high >= target) return { reason: "target", price: target };\n  } else {\n    if (stop != null && bar.high >= stop) return { reason: "stop", price: stop };\n    if (target != null && bar.low <= target) return { reason: "target", price: target };\n  }\n  return null;\n}\n\nfunction backtest(bars, signalFn, config) {\n  // { trades, equityCurve, finalEquity, stats }\n}\n',
        solution: 'function closeTrade(position, exitPrice, reason, costs) {\n  const points = position.side === "long" ? exitPrice - position.entry : position.entry - exitPrice;\n  const gross = points * position.qty * costs.pointValue;\n  const commission = costs.commissionPerSide * position.qty * 2;\n  return { side: position.side, entry: position.entry, exit: exitPrice, qty: position.qty,\n    reason, points, gross, commission, net: gross - commission };\n}\n\nfunction exitCheck(bar, position) {\n  const { side, stop, target } = position;\n  if (side === "long") {\n    if (stop != null && bar.low <= stop) return { reason: "stop", price: stop };\n    if (target != null && bar.high >= target) return { reason: "target", price: target };\n  } else {\n    if (stop != null && bar.high >= stop) return { reason: "stop", price: stop };\n    if (target != null && bar.low <= target) return { reason: "target", price: target };\n  }\n  return null;\n}\n\nfunction backtest(bars, signalFn, config) {\n  const { startEquity, riskPercent, pointValue, commissionPerSide } = config;\n  const costs = { pointValue, commissionPerSide };\n  let equity = startEquity;\n  let position = null, pending = null;\n  const trades = [], equityCurve = [];\n\n  for (let i = 0; i < bars.length; i++) {\n    const bar = bars[i];\n\n    if (position) {\n      const exit = exitCheck(bar, position);\n      if (exit) {\n        const rec = closeTrade(position, exit.price, exit.reason, costs);\n        equity += rec.net;\n        trades.push(rec);\n        equityCurve.push(equity);\n        position = null;\n      }\n    }\n\n    if (pending && !position) {\n      const entry = bar.open;\n      const perContract = pending.stopPoints * pointValue;\n      const qty = perContract <= 0 ? 0\n        : Math.max(0, Math.floor(equity * riskPercent / 100 / perContract));\n      if (qty > 0) {\n        const dir = pending.side === "long" ? 1 : -1;\n        position = {\n          side: pending.side, entry, qty,\n          stop: entry - dir * pending.stopPoints,\n          target: entry + dir * pending.targetPoints\n        };\n      }\n      pending = null;\n    }\n\n    if (!position) {\n      const sig = signalFn(bars.slice(0, i + 1), i);\n      if (sig && (sig.side === "long" || sig.side === "short")) pending = sig;\n    }\n  }\n\n  const wins = trades.filter(t => t.net > 0).length;\n  const losses = trades.filter(t => t.net < 0).length;\n  const netPnl = trades.reduce((a, t) => a + t.net, 0);\n  let peak = startEquity, maxDrawdown = 0;\n  for (const e of equityCurve) {\n    peak = Math.max(peak, e);\n    maxDrawdown = Math.max(maxDrawdown, peak - e);\n  }\n  return {\n    trades, equityCurve, finalEquity: equity,\n    stats: {\n      count: trades.length, wins, losses, netPnl,\n      winRate: trades.length ? wins / trades.length : 0,\n      maxDrawdown\n    }\n  };\n}',
        hints: ['Keep three pieces of state: equity, the open position, and the pending signal.',
                'Exit, then fill the pending entry, then evaluate a new signal — in that order, every bar.',
                'Derive every statistic from <code>trades</code> at the end, never from counters kept during the loop.'],
        tests: { checks: [
          { name: 'a target hit produces one winning trade', expose: ['backtest'],
            run: function (s) {
              var bars = [
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 120, low: 100, close: 118 }
              ];
              var r = s.backtest(bars, function (v, i) {
                return i === 0 ? { side: 'long', stopPoints: 5, targetPoints: 10 } : null;
              }, { startEquity: 100000, riskPercent: 1, pointValue: 50, commissionPerSide: 2.5 });
              if (r.trades.length !== 1) return 'expected 1 trade, got ' + r.trades.length;
              var t = r.trades[0];
              if (t.reason !== 'target') return 'expected a target exit, got ' + t.reason;
              if (t.entry !== 100) return 'entry should be the next bar open (100), got ' + t.entry;
              if (t.exit !== 110) return 'exit should be the target level (110), got ' + t.exit;
              return r.stats.wins === 1 ? true : 'expected 1 win';
            } },
          { name: 'sizes from equity and the stop distance', expose: ['backtest'],
            run: function (s) {
              var bars = [
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 120, low: 100, close: 118 }
              ];
              var r = s.backtest(bars, function (v, i) {
                return i === 0 ? { side: 'long', stopPoints: 5, targetPoints: 10 } : null;
              }, { startEquity: 100000, riskPercent: 1, pointValue: 50, commissionPerSide: 0 });
              // 1000 / (5 * 50) = 4 contracts
              return r.trades[0].qty === 4 ? true : 'expected 4 contracts, got ' + r.trades[0].qty;
            } },
          { name: 'never holds two positions at once', expose: ['backtest'],
            run: function (s) {
              var bars = [];
              for (var i = 0; i < 20; i++) bars.push({ open: 100, high: 101, low: 99, close: 100 });
              var r = s.backtest(bars, function () {
                return { side: 'long', stopPoints: 50, targetPoints: 100 };
              }, { startEquity: 100000, riskPercent: 1, pointValue: 50, commissionPerSide: 0 });
              return r.trades.length <= 1 ? true : 'opened ' + r.trades.length + ' overlapping positions';
            } },
          { name: 'the signal function never sees future bars', expose: ['backtest'],
            run: function (s) {
              var ok = true;
              s.backtest(MARKET.bars, function (visible, i) {
                if (visible.length !== i + 1) ok = false;
                return null;
              }, { startEquity: 100000, riskPercent: 1, pointValue: 50, commissionPerSide: 2.5 });
              return ok ? true : 'the visible slice did not match the current index';
            } },
          { name: 'a size of zero skips the trade', expose: ['backtest'],
            run: function (s) {
              var bars = [
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 100, low: 100, close: 100 },
                { open: 100, high: 120, low: 100, close: 118 }
              ];
              var r = s.backtest(bars, function (v, i) {
                return i === 0 ? { side: 'long', stopPoints: 500, targetPoints: 1000 } : null;
              }, { startEquity: 1000, riskPercent: 1, pointValue: 50, commissionPerSide: 0 });
              return r.trades.length === 0 ? true : 'an unaffordable trade should be skipped';
            } },
          { name: 'stats are consistent with the trade log', expose: ['backtest'],
            run: function (s) {
              var r = s.backtest(MARKET.bars, function (visible, i) {
                return i % 7 === 0 ? { side: i % 14 === 0 ? 'long' : 'short', stopPoints: 3, targetPoints: 6 } : null;
              }, { startEquity: 100000, riskPercent: 1, pointValue: 50, commissionPerSide: 2.5 });
              var net = r.trades.reduce(function (a, t) { return a + t.net; }, 0);
              if (Math.abs(r.stats.netPnl - net) > 1e-6) return 'netPnl does not match the trade log';
              if (r.stats.count !== r.trades.length) return 'count does not match the trade log';
              if (Math.abs(r.finalEquity - (100000 + net)) > 1e-6) return 'finalEquity does not match the trade log';
              if (r.equityCurve.length !== r.trades.length) return 'the equity curve should have one point per closed trade';
              return r.stats.maxDrawdown >= 0 ? true : 'maxDrawdown should be a positive number';
            } },
          { name: 'no signals means no trades and unchanged equity', expose: ['backtest'],
            run: function (s) {
              var r = s.backtest(MARKET.bars, function () { return null; },
                { startEquity: 100000, riskPercent: 1, pointValue: 50, commissionPerSide: 2.5 });
              return (r.trades.length === 0 && r.finalEquity === 100000 && r.stats.winRate === 0)
                ? true : 'an inactive strategy should change nothing';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why size from realised equity rather than equity including the open trade?',
        options: ['It is simpler', 'Unrealised profit is not yet yours, and counting it compounds risk on a position that can still reverse', 'It is faster', 'No difference'],
        answer: 1,
        explain: 'Sizing off floating profit means a losing reversal hits a position that was sized as if the profit were already banked.' },
      { q: 'Why derive statistics from the trade log rather than running counters?',
        options: ['Performance', 'One source of truth — counters drift out of sync with the log', 'Counters are not allowed', 'To save memory'],
        answer: 1,
        explain: 'If a reader can recompute every number from the log, the engine cannot be hiding anything.' },
      { q: 'A bar\'s range covers both the stop and the target. Which does an honest backtest take?',
        options: ['The target', 'The stop', 'Whichever is closer', 'Neither'],
        answer: 1,
        explain: 'Bar data cannot say which came first. Assuming the stop keeps results conservative; assuming the target inflates every one.' }
    ],
    recap: [
      'Exit, then fill pending entries, then evaluate a new signal.',
      'Size from realised equity, and skip the trade when the size is 0.',
      'Apply commission on both sides of every round trip.',
      'Return the log and the curve; derive every statistic from them.'
    ],
    vocab: [
      { term: 'Backtester', def: 'The engine that replays a strategy over history. Its assumptions matter more than its speed.' },
      { term: 'Realised vs unrealised', def: 'Banked profit versus the floating value of an open position. Sizing decisions should use the former.' }
    ]
  });

  C.push({
    id: 'd081', day: 81, module: 6, minutes: 30,
    title: 'Portfolio Risk and Correlation',
    subtitle: 'Three uncorrelated strategies are safer than one; three correlated ones are not.',
    goal: '<b>Goal:</b> measure correlation between return streams and see how it changes portfolio risk.',
    objectives: [
      'Compute the correlation coefficient between two return series',
      'Explain what correlation does to combined volatility',
      'Detect a portfolio that is one bet wearing three names',
      'Compute portfolio heat'
    ],
    sections: [
      { h: 'Correlation in one formula',
        body: '<p>Pearson correlation is the covariance of two series divided by the product of their standard deviations. It runs from −1 to +1, and being a ratio it is unaffected by scale.</p>',
        code: 'function correlation(a, b) {\n  const n = Math.min(a.length, b.length);\n  if (n < 2) return 0;\n  const ma = a.slice(0, n).reduce((x, y) => x + y, 0) / n;\n  const mb = b.slice(0, n).reduce((x, y) => x + y, 0) / n;\n  let cov = 0, va = 0, vb = 0;\n  for (let i = 0; i < n; i++) {\n    const da = a[i] - ma, db = b[i] - mb;\n    cov += da * db; va += da * da; vb += db * db;\n  }\n  return (va === 0 || vb === 0) ? 0 : cov / Math.sqrt(va * vb);\n}\n\nconsole.log(correlation([1, 2, 3, 4], [2, 4, 6, 8]).toFixed(3));\nconsole.log(correlation([1, 2, 3, 4], [4, 3, 2, 1]).toFixed(3));' },
      { h: 'What correlation does to combined risk',
        body: '<p>For two equally weighted streams the combined variance is:</p>' +
              '<p class="mono" style="color:var(--fg)">σ²<sub>p</sub> = ¼(σ₁² + σ₂² + 2ρσ₁σ₂)</p>' +
              '<p>At ρ = 1 the volatility is the average of the two — no benefit at all. At ρ = 0 it falls by about 30%. At ρ = −1 the two cancel entirely.</p>',
        code: 'function combinedVol(s1, s2, rho) {\n  return Math.sqrt(0.25 * (s1 * s1 + s2 * s2 + 2 * rho * s1 * s2));\n}\n\n[1, 0.5, 0, -0.5, -1].forEach(rho =>\n  console.log(`rho ${rho.toFixed(1)}: combined vol ${combinedVol(0.1, 0.1, rho).toFixed(4)}`));' },
      { h: 'The correlation trap',
        body: '<div class="note note-warn"><b>Correlations converge in a crisis</b>Instruments that look independent in calm markets move together when everything is being sold at once. A portfolio diversified on quiet-period correlations is not diversified on the day it matters. Stress-test at ρ = 1 as well as at the measured value.</div>' },
      { h: 'Portfolio heat',
        body: '<p><strong>Heat</strong> is the total percentage of equity at risk across all open positions — the sum of every position\'s risk if every stop were hit at once. Most systematic traders cap it at 4–8%, whatever the individual position sizes suggest.</p>',
        code: 'function heat(positions, equity) {\n  const total = positions.reduce((a, p) => a + p.riskDollars, 0);\n  return equity <= 0 ? 0 : total / equity * 100;\n}\n\nconst book = [{ riskDollars: 1000 }, { riskDollars: 1000 }, { riskDollars: 1500 }];\nconsole.log("heat:", heat(book, 100000).toFixed(2) + "%");\nconsole.log("if all correlated, that is one 3.5% bet, not three 1% bets");' }
    ],
    parsons: {
      prompt: 'Compute total portfolio heat.',
      lines: [
        'const totalRisk = positions.reduce((a, p) => a + p.riskDollars, 0);',
        'const heat = equity <= 0 ? 0 : totalRisk / equity * 100;',
        'console.log(heat.toFixed(2) + "%");'
      ]
    },
    exercises: [
      { id: 'e1', title: 'correlation()', difficulty: 'Core',
        prompt: 'Write <code>correlation(a, b)</code> returning the Pearson correlation of two equal-length series.<br>' +
          'Return <code>0</code> when either series has zero variance, or when there are fewer than two points. If the lengths differ, use the shorter one.',
        starter: 'function correlation(a, b) {\n  // Pearson correlation, -1 to 1\n}\n',
        solution: 'function correlation(a, b) {\n  const n = Math.min(a.length, b.length);\n  if (n < 2) return 0;\n  let ma = 0, mb = 0;\n  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }\n  ma /= n; mb /= n;\n  let cov = 0, va = 0, vb = 0;\n  for (let i = 0; i < n; i++) {\n    const da = a[i] - ma, db = b[i] - mb;\n    cov += da * db; va += da * da; vb += db * db;\n  }\n  return (va === 0 || vb === 0) ? 0 : cov / Math.sqrt(va * vb);\n}',
        hints: ['Compute both means first, then accumulate the covariance and the two variances in one pass.',
                'Zero variance means the denominator is 0 — return 0 rather than <code>NaN</code>.'],
        tests: { fn: 'correlation', approx: 1e-9, cases: [
          { args: [[1, 2, 3, 4], [2, 4, 6, 8]], expect: 1, name: 'a perfect positive relationship is 1' },
          { args: [[1, 2, 3, 4], [4, 3, 2, 1]], expect: -1, name: 'a perfect inverse relationship is -1' },
          { args: [[1, 2, 3], [5, 5, 5]], expect: 0, name: 'zero variance gives 0' },
          { args: [[1], [2]], expect: 0, name: 'one point is not enough' },
          { args: [[], []], expect: 0 },
          { args: [[1, 2, 3, 4], [10, 20, 30, 40, 50]], expect: 1, name: 'the shorter length is used' }
        ], checks: [{
          name: 'stays within -1 and 1 on noisy data', expose: ['correlation'],
          run: function (s) {
            var a = [], b = [];
            for (var i = 0; i < 50; i++) {
              a.push(Math.sin(i / 3));
              b.push(Math.cos(i / 5) + Math.sin(i / 3) * 0.4);
            }
            var r = s.correlation(a, b);
            return (r >= -1.0000001 && r <= 1.0000001) ? true : 'produced ' + r;
          }
        }] } },
      { id: 'e2', title: 'portfolioHeat()', difficulty: 'Core',
        prompt: 'Write <code>portfolioHeat(positions, equity, maxHeatPercent)</code> where each position is <code>{ symbol, riskDollars }</code>.<br>' +
          'Return <code>{ totalRisk, heatPercent, withinLimit, roomLeft }</code>:<ul>' +
          '<li><code>heatPercent</code> — total risk as a percentage of equity; <code>0</code> when equity is 0 or less</li>' +
          '<li><code>withinLimit</code> — whether heat is at or below <code>maxHeatPercent</code></li>' +
          '<li><code>roomLeft</code> — the dollars of additional risk still allowed, never negative</li></ul>',
        starter: 'function portfolioHeat(positions, equity, maxHeatPercent) {\n  // { totalRisk, heatPercent, withinLimit, roomLeft }\n}\n',
        solution: 'function portfolioHeat(positions, equity, maxHeatPercent) {\n  const totalRisk = positions.reduce((a, p) => a + p.riskDollars, 0);\n  const heatPercent = equity <= 0 ? 0 : totalRisk / equity * 100;\n  const allowed = equity <= 0 ? 0 : equity * maxHeatPercent / 100;\n  return {\n    totalRisk,\n    heatPercent,\n    withinLimit: heatPercent <= maxHeatPercent,\n    roomLeft: Math.max(0, allowed - totalRisk)\n  };\n}',
        hints: ['Sum the risk first; everything else is derived from it.',
                'Guard a non-positive equity before dividing.',
                '<code>roomLeft</code> clamps at 0 — you cannot have negative room.'],
        tests: { fn: 'portfolioHeat', approx: 1e-9, cases: [
          { args: [[{ symbol: 'ES', riskDollars: 1000 }, { symbol: 'NQ', riskDollars: 1000 }], 100000, 6],
            expect: { totalRisk: 2000, heatPercent: 2, withinLimit: true, roomLeft: 4000 } },
          { args: [[{ symbol: 'ES', riskDollars: 7000 }], 100000, 6],
            expect: { totalRisk: 7000, heatPercent: 7, withinLimit: false, roomLeft: 0 },
            name: 'over the limit leaves no room' },
          { args: [[], 100000, 6],
            expect: { totalRisk: 0, heatPercent: 0, withinLimit: true, roomLeft: 6000 } },
          { args: [[{ symbol: 'ES', riskDollars: 1000 }], 0, 6],
            expect: { totalRisk: 1000, heatPercent: 0, withinLimit: true, roomLeft: 0 },
            name: 'a zero equity does not divide by zero' },
          { args: [[{ symbol: 'ES', riskDollars: 6000 }], 100000, 6],
            expect: { totalRisk: 6000, heatPercent: 6, withinLimit: true, roomLeft: 0 },
            name: 'exactly at the limit is still within it' }
        ] } },
      { id: 'e3', title: 'correlationMatrix() and diversification', difficulty: 'Stretch',
        prompt: 'Write <code>diversificationReport(streams, threshold)</code> where <code>streams</code> is <code>{ name: [returns] }</code>.<br>' +
          'Return <code>{ names, matrix, highPairs, averageCorrelation, effectiveBets }</code>:<ul>' +
          '<li><code>names</code> — the stream names in <code>Object.keys</code> order</li>' +
          '<li><code>matrix</code> — a square array of correlations, 1 on the diagonal</li>' +
          '<li><code>highPairs</code> — <code>{ a, b, correlation }</code> for every distinct pair whose correlation is at or above <code>threshold</code>, in row-major order</li>' +
          '<li><code>averageCorrelation</code> — the mean of the distinct off-diagonal pairs, or <code>0</code> when there are fewer than two streams</li>' +
          '<li><code>effectiveBets</code> — <code>n / (1 + (n - 1) × averageCorrelation)</code>, clamped to at least 1</li></ul>',
        starter: 'function correlation(a, b) {\n  const n = Math.min(a.length, b.length);\n  if (n < 2) return 0;\n  let ma = 0, mb = 0;\n  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }\n  ma /= n; mb /= n;\n  let cov = 0, va = 0, vb = 0;\n  for (let i = 0; i < n; i++) {\n    const da = a[i] - ma, db = b[i] - mb;\n    cov += da * db; va += da * da; vb += db * db;\n  }\n  return (va === 0 || vb === 0) ? 0 : cov / Math.sqrt(va * vb);\n}\n\nfunction diversificationReport(streams, threshold) {\n  // { names, matrix, highPairs, averageCorrelation, effectiveBets }\n}\n',
        solution: 'function correlation(a, b) {\n  const n = Math.min(a.length, b.length);\n  if (n < 2) return 0;\n  let ma = 0, mb = 0;\n  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }\n  ma /= n; mb /= n;\n  let cov = 0, va = 0, vb = 0;\n  for (let i = 0; i < n; i++) {\n    const da = a[i] - ma, db = b[i] - mb;\n    cov += da * db; va += da * da; vb += db * db;\n  }\n  return (va === 0 || vb === 0) ? 0 : cov / Math.sqrt(va * vb);\n}\n\nfunction diversificationReport(streams, threshold) {\n  const names = Object.keys(streams);\n  const n = names.length;\n  const matrix = names.map((a, i) =>\n    names.map((b, j) => i === j ? 1 : correlation(streams[a], streams[b])));\n  const highPairs = [];\n  let sum = 0, pairs = 0;\n  for (let i = 0; i < n; i++) {\n    for (let j = i + 1; j < n; j++) {\n      sum += matrix[i][j];\n      pairs++;\n      if (matrix[i][j] >= threshold) {\n        highPairs.push({ a: names[i], b: names[j], correlation: matrix[i][j] });\n      }\n    }\n  }\n  const averageCorrelation = pairs ? sum / pairs : 0;\n  const effectiveBets = n === 0 ? 0\n    : Math.max(1, n / (1 + (n - 1) * averageCorrelation));\n  return { names, matrix, highPairs, averageCorrelation, effectiveBets };\n}',
        hints: ['Build the full matrix first, then read the upper triangle for the pairs and the average.',
                'Only distinct pairs count — iterate <code>j</code> from <code>i + 1</code>.',
                'The effective-bets formula collapses toward 1 as the average correlation approaches 1.'],
        tests: { checks: [
          { name: 'the diagonal is 1 and the matrix is symmetric', expose: ['diversificationReport'],
            run: function (s) {
              var r = s.diversificationReport({
                a: [1, 2, 3, 4], b: [2, 4, 6, 8], c: [4, 3, 2, 1]
              }, 0.8);
              for (var i = 0; i < 3; i++) {
                if (Math.abs(r.matrix[i][i] - 1) > 1e-9) return 'the diagonal should be 1';
                for (var j = 0; j < 3; j++) {
                  if (Math.abs(r.matrix[i][j] - r.matrix[j][i]) > 1e-9) return 'the matrix is not symmetric';
                }
              }
              return true;
            } },
          { name: 'finds the highly correlated pair', expose: ['diversificationReport'],
            run: function (s) {
              var r = s.diversificationReport({
                a: [1, 2, 3, 4], b: [2, 4, 6, 8], c: [4, 3, 2, 1]
              }, 0.8);
              if (r.highPairs.length !== 1) return 'expected 1 high pair, got ' + r.highPairs.length;
              var p = r.highPairs[0];
              return (p.a === 'a' && p.b === 'b') ? true : 'expected the a/b pair, got ' + JSON.stringify(p);
            } },
          { name: 'three identical streams are one effective bet', expose: ['diversificationReport'],
            run: function (s) {
              var r = s.diversificationReport({
                a: [1, 2, 3, 4], b: [1, 2, 3, 4], c: [1, 2, 3, 4]
              }, 0.9);
              if (Math.abs(r.averageCorrelation - 1) > 1e-9) return 'the average correlation should be 1';
              return Math.abs(r.effectiveBets - 1) < 1e-6
                ? true : 'expected 1 effective bet, got ' + r.effectiveBets;
            } },
          { name: 'uncorrelated streams give more effective bets', expose: ['diversificationReport'],
            run: function (s) {
              var r = s.diversificationReport({
                a: [1, -1, 1, -1, 1, -1], b: [1, 1, -1, -1, 1, 1], c: [1, 1, 1, -1, -1, -1]
              }, 0.9);
              return r.effectiveBets > 1.5 ? true : 'expected more than 1.5 effective bets, got ' + r.effectiveBets;
            } },
          { name: 'a single stream reports one bet and zero average', expose: ['diversificationReport'],
            run: function (s) {
              var r = s.diversificationReport({ a: [1, 2, 3] }, 0.8);
              if (r.averageCorrelation !== 0) return 'a single stream has no pairs to average';
              return Math.abs(r.effectiveBets - 1) < 1e-9 ? true : 'expected 1 effective bet';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Two strategies have a correlation of 0.95. What have you got?',
        options: ['Good diversification', 'Essentially one bet in two accounts', 'A hedge', 'Nothing measurable'],
        answer: 1,
        explain: 'At 0.95 they lose together. The combined volatility is barely below either one alone.' },
      { q: 'What is portfolio heat?',
        options: ['Total position value', 'The total percentage of equity at risk if every open stop were hit', 'The number of trades', 'Average holding time'],
        answer: 1,
        explain: 'Six positions at 1% each is 6% heat, and correlated positions make that a single 6% bet.' },
      { q: 'Why stress-test at a correlation of 1 as well as the measured value?',
        options: ['It is easier', 'Correlations converge toward 1 in a crisis, exactly when diversification is needed', 'Measured values are always wrong', 'To speed up the backtest'],
        answer: 1,
        explain: 'Quiet-period independence disappears when everything is being liquidated at once.' }
    ],
    recap: [
      'Correlation runs −1 to +1 and is scale-free.',
      'Combined volatility falls only when correlation is below 1.',
      'Heat is total equity at risk across the whole book.',
      'Correlations converge in a crisis — stress-test at 1.'
    ],
    vocab: [
      { term: 'Portfolio heat', def: 'Total open risk as a percentage of equity. Usually capped at 4-8% regardless of individual position sizes.' },
      { term: 'Effective bets', def: 'How many genuinely independent positions a correlated portfolio amounts to. Often far fewer than the position count.' }
    ]
  });


  C.push({
    id: 'd082', day: 82, module: 6, minutes: 30,
    title: 'Kelly and Optimal Bet Size',
    subtitle: 'The mathematically optimal fraction, and why nobody trades it.',
    goal: '<b>Goal:</b> compute the Kelly fraction from a strategy\'s edge and understand exactly why practitioners divide it by four.',
    objectives: [
      'Compute the Kelly fraction from win rate and payoff',
      'Explain what Kelly optimises and what it ignores',
      'Show what happens beyond the optimal fraction',
      'Apply fractional Kelly'
    ],
    sections: [
      { h: 'The formula',
        body: '<p>For a bet that wins <em>b</em> times the stake with probability <em>p</em>:</p>' +
              '<p class="mono" style="color:var(--fg)">f* = (b × p − q) / b,&nbsp;&nbsp;where q = 1 − p</p>' +
              '<p>Kelly maximises the long-run <em>growth rate</em> of capital — not the expected value, which is maximised by betting everything. A negative <em>f*</em> means no edge exists and the correct bet is zero.</p>',
        code: 'function kelly(winRate, payoffRatio) {\n  const q = 1 - winRate;\n  const f = (payoffRatio * winRate - q) / payoffRatio;\n  return Math.max(0, f);\n}\n\n[[0.5, 2], [0.4, 3], [0.6, 1], [0.3, 2]].forEach(([p, b]) =>\n  console.log(`win ${(p * 100).toFixed(0)}% at ${b}:1 -> bet ${(kelly(p, b) * 100).toFixed(1)}%`));' },
      { h: 'The growth curve has a peak, and a cliff after it',
        body: '<p>Growth rises with bet size up to <em>f*</em>, then falls. At <em>2f*</em> the long-run growth rate is exactly zero — you make nothing however good the edge. Beyond that it is negative, and the account trends to ruin despite a positive expectancy.</p>',
        code: 'function growthRate(f, winRate, payoffRatio) {\n  if (f <= 0 || f >= 1) return -Infinity;\n  return winRate * Math.log(1 + payoffRatio * f) + (1 - winRate) * Math.log(1 - f);\n}\n\nconst p = 0.5, b = 2;\nconst star = (b * p - (1 - p)) / b;\nconsole.log("f* =", star.toFixed(3));\n[0.5, 1, 1.5, 2, 2.5].forEach(m =>\n  console.log(`${m}x Kelly: growth ${growthRate(star * m, p, b).toFixed(5)}`));' },
      { h: 'Why nobody trades full Kelly',
        body: '<div class="note note-warn"><b>Three reasons, all decisive</b>' +
              '<br>1. <strong>Your inputs are estimates.</strong> Win rate and payoff come from a finite backtest. Overestimating the edge slightly puts you past the peak and onto the falling side.' +
              '<br>2. <strong>The drawdowns are brutal.</strong> Full Kelly routinely produces 50% declines. Mathematically survivable, humanly not.' +
              '<br>3. <strong>Edges decay.</strong> Kelly assumes a fixed, known edge forever. Real edges erode as others find them.</div>' +
              '<p>Half Kelly gives about 75% of the growth with roughly half the volatility. Quarter Kelly is the common practical choice, and even that is usually more than a 1–2% fixed fraction.</p>',
        code: 'function kelly(p, b) { return Math.max(0, (b * p - (1 - p)) / b); }\nconst f = kelly(0.55, 2);\nconsole.log("full:", (f * 100).toFixed(1) + "%");\nconsole.log("half:", (f * 50).toFixed(1) + "%");\nconsole.log("quarter:", (f * 25).toFixed(1) + "%");\nconsole.log("typical fixed fractional: 1-2%");' },
      { h: 'Kelly from a trade log',
        body: '<p>You do not need a coin-flip model. Estimate <em>p</em> as the observed win rate and <em>b</em> as average win divided by average loss, both from the R distribution.</p>',
        code: 'const rs = [1.8, -1, -1, 2.4, -0.6, -1, 3.1, -1, 0.9, -1];\nconst wins = rs.filter(r => r > 0), losses = rs.filter(r => r <= 0);\nconst mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;\n\nconst p = wins.length / rs.length;\nconst b = Math.abs(mean(losses)) === 0 ? 0 : mean(wins) / Math.abs(mean(losses));\nconsole.log(`p = ${p.toFixed(2)}, b = ${b.toFixed(2)}`);\nconsole.log("kelly:", (Math.max(0, (b * p - (1 - p)) / b) * 100).toFixed(1) + "%");' }
    ],
    parsons: {
      prompt: 'Compute the Kelly fraction.',
      lines: [
        'function kelly(winRate, payoffRatio) {',
        '  const q = 1 - winRate;',
        '  const f = (payoffRatio * winRate - q) / payoffRatio;',
        '  return Math.max(0, f);',
        '}',
        'console.log(kelly(0.5, 2));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'kellyFraction()', difficulty: 'Core',
        prompt: 'Write <code>kellyFraction(winRate, payoffRatio)</code> returning <code>(b × p − q) / b</code>, clamped at 0.<br>' +
          'A <code>payoffRatio</code> of 0 or less returns <code>0</code>, as does a win rate outside <code>[0, 1]</code>.',
        starter: 'function kellyFraction(winRate, payoffRatio) {\n  // the optimal fraction, never negative\n}\n',
        solution: 'function kellyFraction(winRate, payoffRatio) {\n  if (payoffRatio <= 0) return 0;\n  if (winRate < 0 || winRate > 1) return 0;\n  const q = 1 - winRate;\n  return Math.max(0, (payoffRatio * winRate - q) / payoffRatio);\n}',
        hints: ['Guard the invalid inputs first.',
                'A negative result means no edge — clamp it to 0 rather than returning a negative bet.'],
        tests: { fn: 'kellyFraction', approx: 1e-9, cases: [
          { args: [0.5, 2], expect: 0.25, name: '50% at 2:1 is a quarter of capital' },
          { args: [0.4, 3], expect: (3 * 0.4 - 0.6) / 3 },
          { args: [0.3, 2], expect: 0, name: 'no edge means no bet' },
          { args: [0.5, 1], expect: 0, name: 'a coin flip at even money has no edge' },
          { args: [0.5, 0], expect: 0, name: 'a zero payoff returns 0, not Infinity' },
          { args: [1.5, 2], expect: 0, name: 'an impossible win rate returns 0' }
        ] } },
      { id: 'e2', title: 'kellyFromTrades()', difficulty: 'Core',
        prompt: 'Write <code>kellyFromTrades(rMultiples, fraction)</code> estimating Kelly from a trade log.<ul>' +
          '<li><code>p</code> is the share of R values strictly above 0.</li>' +
          '<li><code>b</code> is the average win divided by the absolute average loss.</li>' +
          '<li>Return <code>{ winRate, payoffRatio, fullKelly, sized }</code>, where <code>sized</code> is <code>fullKelly × fraction</code>.</li>' +
          '<li>With no wins or no losses, <code>payoffRatio</code> and both Kelly figures are <code>0</code>.</li></ul>',
        starter: 'function kellyFromTrades(rMultiples, fraction) {\n  // { winRate, payoffRatio, fullKelly, sized }\n}\n',
        solution: 'function kellyFromTrades(rMultiples, fraction) {\n  const valid = rMultiples.filter(r => r !== null && Number.isFinite(r));\n  const wins = valid.filter(r => r > 0);\n  const losses = valid.filter(r => r <= 0);\n  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;\n  const winRate = valid.length ? wins.length / valid.length : 0;\n  const avgLoss = Math.abs(mean(losses));\n  if (!wins.length || !losses.length || avgLoss === 0) {\n    return { winRate, payoffRatio: 0, fullKelly: 0, sized: 0 };\n  }\n  const payoffRatio = mean(wins) / avgLoss;\n  const fullKelly = Math.max(0, (payoffRatio * winRate - (1 - winRate)) / payoffRatio);\n  return { winRate, payoffRatio, fullKelly, sized: fullKelly * fraction };\n}',
        hints: ['Filter out nulls, then split into wins and losses.',
                'Guard the degenerate cases before dividing by the average loss.',
                'A break-even trade counts as a loss under the "strictly above 0" rule.'],
        tests: { fn: 'kellyFromTrades', approx: 1e-9, cases: [
          { args: [[2, -1, 2, -1], 0.25],
            expect: { winRate: 0.5, payoffRatio: 2, fullKelly: 0.25, sized: 0.0625 } },
          { args: [[1, 1, 1], 0.5],
            expect: { winRate: 1, payoffRatio: 0, fullKelly: 0, sized: 0 },
            name: 'no losses means no usable payoff ratio' },
          { args: [[-1, -1], 0.5],
            expect: { winRate: 0, payoffRatio: 0, fullKelly: 0, sized: 0 } },
          { args: [[], 0.5],
            expect: { winRate: 0, payoffRatio: 0, fullKelly: 0, sized: 0 } },
          { args: [[1, -2, 1, -2], 1],
            expect: { winRate: 0.5, payoffRatio: 0.5, fullKelly: 0, sized: 0 },
            name: 'a losing edge sizes to zero' }
        ] } },
      { id: 'e3', title: 'growthCurve()', difficulty: 'Stretch',
        prompt: 'Write <code>growthCurve(winRate, payoffRatio, multiples)</code> where <code>multiples</code> are fractions of Kelly to evaluate (e.g. <code>[0.25, 0.5, 1, 1.5, 2]</code>).<br>' +
          'For each, return <code>{ multiple, fraction, growth }</code> where growth is:<br>' +
          '<code>p × ln(1 + b × f) + (1 − p) × ln(1 − f)</code><br>' +
          'Also return <code>{ kelly, points, best }</code>, with <code>best</code> being the entry with the highest growth. A fraction outside <code>(0, 1)</code> has a growth of <code>-Infinity</code>.',
        starter: 'function growthCurve(winRate, payoffRatio, multiples) {\n  // { kelly, points, best }\n}\n',
        solution: 'function growthCurve(winRate, payoffRatio, multiples) {\n  const kelly = payoffRatio <= 0 ? 0\n    : Math.max(0, (payoffRatio * winRate - (1 - winRate)) / payoffRatio);\n  const points = multiples.map(m => {\n    const fraction = kelly * m;\n    const growth = (fraction <= 0 || fraction >= 1)\n      ? -Infinity\n      : winRate * Math.log(1 + payoffRatio * fraction) + (1 - winRate) * Math.log(1 - fraction);\n    return { multiple: m, fraction, growth };\n  });\n  let best = null;\n  points.forEach(p => { if (!best || p.growth > best.growth) best = p; });\n  return { kelly, points, best };\n}',
        hints: ['Compute the Kelly fraction once, then scale it by each multiple.',
                'A fraction of 0 or 1 or more makes the logarithm undefined — return <code>-Infinity</code>.',
                'The best entry is a simple argmax over the points.'],
        tests: { checks: [
          { name: 'growth peaks at full Kelly', expose: ['growthCurve'],
            run: function (s) {
              var r = s.growthCurve(0.5, 2, [0.25, 0.5, 1, 1.5, 2]);
              return r.best.multiple === 1 ? true : 'the peak should be at 1x Kelly, got ' + r.best.multiple;
            } },
          { name: 'growth at 2x Kelly is about zero', expose: ['growthCurve'],
            run: function (s) {
              var r = s.growthCurve(0.5, 2, [2]);
              return Math.abs(r.points[0].growth) < 1e-9
                ? true : 'expected roughly 0 growth at 2x Kelly, got ' + r.points[0].growth;
            } },
          { name: 'beyond 2x Kelly growth is negative', expose: ['growthCurve'],
            run: function (s) {
              var r = s.growthCurve(0.5, 2, [2.5, 3]);
              return r.points.every(function (p) { return p.growth < 0; })
                ? true : 'growth past 2x Kelly should be negative';
            } },
          { name: 'the reported fractions scale with the multiples', expose: ['growthCurve'],
            run: function (s) {
              var r = s.growthCurve(0.5, 2, [0.5, 1]);
              if (Math.abs(r.kelly - 0.25) > 1e-9) return 'kelly should be 0.25, got ' + r.kelly;
              return Math.abs(r.points[0].fraction - 0.125) < 1e-9
                ? true : 'half Kelly should be 0.125, got ' + r.points[0].fraction;
            } },
          { name: 'a strategy with no edge has a kelly of 0', expose: ['growthCurve'],
            run: function (s) {
              var r = s.growthCurve(0.3, 2, [1]);
              if (r.kelly !== 0) return 'expected a kelly of 0, got ' + r.kelly;
              return r.points[0].growth === -Infinity ? true : 'a zero fraction has no defined growth';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does the Kelly criterion maximise?',
        options: ['Expected value', 'The long-run growth rate of capital', 'Win rate', 'Sharpe ratio'],
        answer: 1,
        explain: 'Expected value is maximised by betting everything. Kelly maximises the geometric growth rate, which is what compounding actually follows.' },
      { q: 'What happens to long-run growth at twice the Kelly fraction?',
        options: ['It doubles', 'It is exactly zero', 'It is 1.5x', 'It is undefined'],
        answer: 1,
        explain: 'The growth curve returns to zero at 2f*. Beyond that it is negative — ruin despite a genuine edge.' },
      { q: 'Why do practitioners use a quarter or half Kelly?',
        options: ['Tradition', 'The inputs are estimates, the drawdowns are brutal, and edges decay', 'It is easier to compute', 'Regulation'],
        answer: 1,
        explain: 'Overestimating the edge pushes you past the peak. Half Kelly keeps about 75% of the growth at roughly half the volatility.' }
    ],
    recap: [
      'f* = (b·p − q)/b, clamped at 0 when there is no edge.',
      'Kelly maximises growth rate, not expected value.',
      'Growth is zero at 2f* and negative beyond it.',
      'Fractional Kelly is what people actually trade — and often still more than 1–2%.'
    ],
    vocab: [
      { term: 'Kelly criterion', def: 'The bet size maximising long-run capital growth, given a known edge. Derived by John Kelly at Bell Labs in 1956.' },
      { term: 'Fractional Kelly', def: 'Trading a fixed fraction of the Kelly bet — typically a quarter or a half — to buy robustness against estimation error.' }
    ]
  });

  C.push({
    id: 'd083', day: 83, module: 6, minutes: 30,
    title: 'Circuit Breakers',
    subtitle: 'The rules that stop a bad day becoming a bad month.',
    goal: '<b>Goal:</b> build the risk gate that sits between a signal and an order, and can veto anything.',
    objectives: [
      'Enforce a daily loss limit',
      'Cap consecutive losses and open positions',
      'Halt on abnormal conditions',
      'Order the checks so the cheapest and most decisive run first'
    ],
    sections: [
      { h: 'The gate sits between signal and order',
        body: '<p>A strategy generates signals; a separate risk layer decides whether any of them may become orders. Keeping the two apart means the risk rules cannot be quietly bypassed by a change to the strategy, and they can be tested on their own.</p>',
        code: 'function riskGate(state, limits) {\n  if (state.dailyPnl <= -limits.maxDailyLoss) return { allow: false, reason: "daily loss limit" };\n  if (state.consecutiveLosses >= limits.maxConsecutiveLosses) return { allow: false, reason: "loss streak" };\n  if (state.openPositions >= limits.maxOpenPositions) return { allow: false, reason: "position limit" };\n  return { allow: true, reason: null };\n}\n\nconsole.log(riskGate({ dailyPnl: -1200, consecutiveLosses: 1, openPositions: 0 },\n  { maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 }));' },
      { h: 'The daily loss limit is the important one',
        body: '<p>Almost every account that blows up does so on a single day, revenge-trading a loss. A hard daily limit converts an unbounded disaster into a bounded bad day — but only if it is enforced by code rather than by intention.</p>' +
              '<div class="note note-trade"><b>Enforce it, do not intend it</b>The trader who says "I stop at −$1,000" and the system that refuses orders after −$1,000 are not the same thing. Only one of them works at 15:45 after three losses.</div>' },
      { h: 'Order the checks deliberately',
        body: '<p>Check the cheapest and most decisive conditions first, and return on the first failure. A halted market or a breached daily limit should short-circuit before you compute anything expensive.</p>' +
              '<p>Return the <em>reason</em>, not just a boolean. A rejected signal with no explanation is impossible to debug and impossible to review.</p>' },
      { h: 'Reset boundaries matter',
        body: '<p>Daily counters reset at the session boundary, not at midnight local time and not at "whenever the process restarted". A gate that silently resets when the app reloads is not a limit.</p>',
        code: 'function shouldReset(lastResetDay, currentDay) {\n  return lastResetDay !== currentDay;\n}\n\nconsole.log(shouldReset("2024-05-14", "2024-05-14"));\nconsole.log(shouldReset("2024-05-14", "2024-05-15"));' }
    ],
    parsons: {
      prompt: 'Reject on the first breached limit, with a reason.',
      lines: [
        'if (state.dailyPnl <= -limits.maxDailyLoss) return { allow: false, reason: "daily loss limit" };',
        'if (state.consecutiveLosses >= limits.maxConsecutiveLosses) return { allow: false, reason: "loss streak" };',
        'if (state.openPositions >= limits.maxOpenPositions) return { allow: false, reason: "position limit" };',
        'return { allow: true, reason: null };'
      ]
    },
    exercises: [
      { id: 'e1', title: 'riskGate()', difficulty: 'Core',
        prompt: 'Write <code>riskGate(state, limits)</code> returning <code>{ allow, reason }</code>.<br>' +
          '<code>state</code> is <code>{ dailyPnl, consecutiveLosses, openPositions, halted }</code>; <code>limits</code> is <code>{ maxDailyLoss, maxConsecutiveLosses, maxOpenPositions }</code>.<br>' +
          'Check in this order, returning the first failure:<ol>' +
          '<li><code>halted</code> → <code>"market halted"</code></li>' +
          '<li><code>dailyPnl &lt;= -maxDailyLoss</code> → <code>"daily loss limit"</code></li>' +
          '<li><code>consecutiveLosses &gt;= maxConsecutiveLosses</code> → <code>"loss streak"</code></li>' +
          '<li><code>openPositions &gt;= maxOpenPositions</code> → <code>"position limit"</code></li></ol>' +
          'Otherwise <code>{ allow: true, reason: null }</code>.',
        starter: 'function riskGate(state, limits) {\n  // { allow, reason }\n}\n',
        solution: 'function riskGate(state, limits) {\n  if (state.halted) return { allow: false, reason: "market halted" };\n  if (state.dailyPnl <= -limits.maxDailyLoss) return { allow: false, reason: "daily loss limit" };\n  if (state.consecutiveLosses >= limits.maxConsecutiveLosses) return { allow: false, reason: "loss streak" };\n  if (state.openPositions >= limits.maxOpenPositions) return { allow: false, reason: "position limit" };\n  return { allow: true, reason: null };\n}',
        hints: ['Four guard clauses, each returning immediately.',
                'The daily limit is a positive number compared against a negative P&L, so negate it.',
                'The order matters — the first breach found is the one reported.'],
        tests: { fn: 'riskGate', cases: [
          { args: [{ dailyPnl: -200, consecutiveLosses: 1, openPositions: 0, halted: false },
                   { maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 }],
            expect: { allow: true, reason: null } },
          { args: [{ dailyPnl: -1200, consecutiveLosses: 1, openPositions: 0, halted: false },
                   { maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 }],
            expect: { allow: false, reason: 'daily loss limit' } },
          { args: [{ dailyPnl: -1000, consecutiveLosses: 0, openPositions: 0, halted: false },
                   { maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 }],
            expect: { allow: false, reason: 'daily loss limit' },
            name: 'exactly at the limit is a breach' },
          { args: [{ dailyPnl: 0, consecutiveLosses: 3, openPositions: 0, halted: false },
                   { maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 }],
            expect: { allow: false, reason: 'loss streak' } },
          { args: [{ dailyPnl: 0, consecutiveLosses: 0, openPositions: 2, halted: false },
                   { maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 }],
            expect: { allow: false, reason: 'position limit' } },
          { args: [{ dailyPnl: -5000, consecutiveLosses: 9, openPositions: 9, halted: true },
                   { maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 }],
            expect: { allow: false, reason: 'market halted' },
            name: 'the halt check wins over everything else' }
        ] } },
      { id: 'e2', title: 'makeRiskManager()', difficulty: 'Core',
        prompt: 'Write <code>makeRiskManager(limits)</code> returning an object that tracks state across trades:<ul>' +
          '<li><code>check()</code> — the gate result for the current state</li>' +
          '<li><code>recordTrade(net)</code> — adds to the daily P&L; a net below 0 increments the loss streak, anything else resets it to 0</li>' +
          '<li><code>openPosition()</code> / <code>closePosition()</code> — adjust the open count, never below 0</li>' +
          '<li><code>startNewDay()</code> — resets the daily P&L and the loss streak, leaving open positions alone</li>' +
          '<li><code>state</code> — the current <code>{ dailyPnl, consecutiveLosses, openPositions, halted }</code></li>' +
          '<li><code>halt()</code> / <code>resume()</code> — set and clear the halted flag</li></ul>',
        expose: ['makeRiskManager'],
        starter: 'function makeRiskManager(limits) {\n  // a stateful risk manager\n}\n',
        solution: 'function makeRiskManager(limits) {\n  const state = { dailyPnl: 0, consecutiveLosses: 0, openPositions: 0, halted: false };\n  return {\n    state,\n    check() {\n      if (state.halted) return { allow: false, reason: "market halted" };\n      if (state.dailyPnl <= -limits.maxDailyLoss) return { allow: false, reason: "daily loss limit" };\n      if (state.consecutiveLosses >= limits.maxConsecutiveLosses) return { allow: false, reason: "loss streak" };\n      if (state.openPositions >= limits.maxOpenPositions) return { allow: false, reason: "position limit" };\n      return { allow: true, reason: null };\n    },\n    recordTrade(net) {\n      state.dailyPnl += net;\n      if (net < 0) state.consecutiveLosses++;\n      else state.consecutiveLosses = 0;\n    },\n    openPosition() { state.openPositions++; },\n    closePosition() { state.openPositions = Math.max(0, state.openPositions - 1); },\n    startNewDay() { state.dailyPnl = 0; state.consecutiveLosses = 0; },\n    halt() { state.halted = true; },\n    resume() { state.halted = false; }\n  };\n}',
        hints: ['Keep one <code>state</code> object and expose it directly so tests and dashboards can read it.',
                'A break-even trade is not a loss — it resets the streak.',
                '<code>startNewDay</code> deliberately leaves open positions alone; they survive the boundary.'],
        tests: { checks: [
          { name: 'starts clean and allows trading', expose: ['makeRiskManager'],
            run: function (s) {
              var rm = s.makeRiskManager({ maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 });
              if (rm.state.dailyPnl !== 0 || rm.state.consecutiveLosses !== 0) return 'the initial state is wrong';
              return rm.check().allow === true ? true : 'a fresh manager should allow trading';
            } },
          { name: 'the daily loss limit blocks further trades', expose: ['makeRiskManager'],
            run: function (s) {
              var rm = s.makeRiskManager({ maxDailyLoss: 1000, maxConsecutiveLosses: 5, maxOpenPositions: 5 });
              rm.recordTrade(-600);
              if (rm.check().allow !== true) return 'one loss should not breach the limit';
              rm.recordTrade(-500);
              var c = rm.check();
              return (c.allow === false && c.reason === 'daily loss limit') ? true : 'got ' + JSON.stringify(c);
            } },
          { name: 'a win resets the loss streak', expose: ['makeRiskManager'],
            run: function (s) {
              var rm = s.makeRiskManager({ maxDailyLoss: 100000, maxConsecutiveLosses: 3, maxOpenPositions: 5 });
              rm.recordTrade(-100); rm.recordTrade(-100);
              if (rm.state.consecutiveLosses !== 2) return 'expected a streak of 2';
              rm.recordTrade(50);
              return rm.state.consecutiveLosses === 0 ? true : 'a win should reset the streak';
            } },
          { name: 'a break-even trade resets the streak', expose: ['makeRiskManager'],
            run: function (s) {
              var rm = s.makeRiskManager({ maxDailyLoss: 100000, maxConsecutiveLosses: 3, maxOpenPositions: 5 });
              rm.recordTrade(-100);
              rm.recordTrade(0);
              return rm.state.consecutiveLosses === 0 ? true : 'break-even is not a loss';
            } },
          { name: 'position count never goes negative', expose: ['makeRiskManager'],
            run: function (s) {
              var rm = s.makeRiskManager({ maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 });
              rm.closePosition(); rm.closePosition();
              return rm.state.openPositions === 0 ? true : 'got ' + rm.state.openPositions;
            } },
          { name: 'startNewDay resets the day but keeps positions', expose: ['makeRiskManager'],
            run: function (s) {
              var rm = s.makeRiskManager({ maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 5 });
              rm.recordTrade(-2000);
              rm.openPosition();
              rm.startNewDay();
              if (rm.state.dailyPnl !== 0 || rm.state.consecutiveLosses !== 0) return 'the day did not reset';
              if (rm.state.openPositions !== 1) return 'open positions should survive the boundary';
              return rm.check().allow === true ? true : 'a new day should allow trading again';
            } },
          { name: 'halt and resume work', expose: ['makeRiskManager'],
            run: function (s) {
              var rm = s.makeRiskManager({ maxDailyLoss: 1000, maxConsecutiveLosses: 3, maxOpenPositions: 2 });
              rm.halt();
              if (rm.check().reason !== 'market halted') return 'halt() should block trading';
              rm.resume();
              return rm.check().allow === true ? true : 'resume() should restore trading';
            } }
        ] } },
      { id: 'e3', title: 'applyRiskLayer()', difficulty: 'Stretch',
        prompt: 'Write <code>applyRiskLayer(signals, limits)</code> where each signal is <code>{ index, side, net }</code> — <code>net</code> being what the trade would make if taken.<br>' +
          'Walk the signals in order, applying the gate before each one:<ul>' +
          '<li>An allowed signal is taken: record its net, and push <code>{ index, side, taken: true, net }</code>.</li>' +
          '<li>A blocked signal is skipped: push <code>{ index, side, taken: false, reason }</code> and do <em>not</em> record any P&L.</li></ul>' +
          'Return <code>{ decisions, takenPnl, wouldBePnl, blocked }</code> — where <code>wouldBePnl</code> is the total if every signal had been taken, and <code>blocked</code> counts the vetoes.<br>' +
          '<span class="muted">Only the daily loss and loss-streak limits apply; positions open and close instantly.</span>',
        starter: 'function applyRiskLayer(signals, limits) {\n  // { decisions, takenPnl, wouldBePnl, blocked }\n}\n',
        solution: 'function applyRiskLayer(signals, limits) {\n  let dailyPnl = 0, consecutiveLosses = 0, blocked = 0, takenPnl = 0, wouldBePnl = 0;\n  const decisions = [];\n  for (const sig of signals) {\n    wouldBePnl += sig.net;\n    let reason = null;\n    if (dailyPnl <= -limits.maxDailyLoss) reason = "daily loss limit";\n    else if (consecutiveLosses >= limits.maxConsecutiveLosses) reason = "loss streak";\n    if (reason) {\n      blocked++;\n      decisions.push({ index: sig.index, side: sig.side, taken: false, reason });\n      continue;\n    }\n    dailyPnl += sig.net;\n    takenPnl += sig.net;\n    if (sig.net < 0) consecutiveLosses++;\n    else consecutiveLosses = 0;\n    decisions.push({ index: sig.index, side: sig.side, taken: true, net: sig.net });\n  }\n  return { decisions, takenPnl, wouldBePnl, blocked };\n}',
        hints: ['Accumulate <code>wouldBePnl</code> for every signal, whether or not it is taken.',
                'The gate is checked <em>before</em> the trade, using the state so far.',
                'A blocked signal changes no state at all — that is the whole point of the veto.'],
        tests: { fn: 'applyRiskLayer', approx: 1e-9, cases: [
          { args: [[{ index: 0, side: 'long', net: 100 }, { index: 1, side: 'long', net: 200 }],
                   { maxDailyLoss: 1000, maxConsecutiveLosses: 3 }],
            expect: { decisions: [
                { index: 0, side: 'long', taken: true, net: 100 },
                { index: 1, side: 'long', taken: true, net: 200 }
              ], takenPnl: 300, wouldBePnl: 300, blocked: 0 } },
          { args: [[{ index: 0, side: 'long', net: -600 }, { index: 1, side: 'long', net: -600 },
                    { index: 2, side: 'long', net: 900 }],
                   { maxDailyLoss: 1000, maxConsecutiveLosses: 99 }],
            check: function (r) {
              if (r.decisions[0].taken !== true || r.decisions[1].taken !== true) return 'the first two should be taken';
              if (r.decisions[2].taken !== false) return 'the third should be blocked by the daily limit';
              if (r.decisions[2].reason !== 'daily loss limit') return 'wrong reason: ' + r.decisions[2].reason;
              if (r.takenPnl !== -1200) return 'takenPnl should be -1200, got ' + r.takenPnl;
              if (r.wouldBePnl !== -300) return 'wouldBePnl should be -300, got ' + r.wouldBePnl;
              return r.blocked === 1 ? true : 'expected 1 block';
            }, name: 'the daily limit vetoes the recovery trade too' },
          { args: [[{ index: 0, side: 'long', net: -10 }, { index: 1, side: 'long', net: -10 },
                    { index: 2, side: 'long', net: -10 }, { index: 3, side: 'long', net: 500 }],
                   { maxDailyLoss: 100000, maxConsecutiveLosses: 3 }],
            check: function (r) {
              if (r.blocked !== 1) return 'expected exactly 1 block, got ' + r.blocked;
              return r.decisions[3].reason === 'loss streak' ? true : 'wrong reason: ' + r.decisions[3].reason;
            }, name: 'a loss streak blocks the next signal' },
          { args: [[], { maxDailyLoss: 1000, maxConsecutiveLosses: 3 }],
            expect: { decisions: [], takenPnl: 0, wouldBePnl: 0, blocked: 0 } }
        ] } }
    ],
    quiz: [
      { q: 'Why keep the risk layer separate from the strategy?',
        options: ['Performance', 'It can be tested alone and cannot be bypassed by a change to the signal logic', 'It uses less memory', 'It is not necessary'],
        answer: 1,
        explain: 'A risk rule embedded in strategy code is one refactor away from disappearing.' },
      { q: 'Why return a reason rather than just <code>false</code>?',
        options: ['Style', 'A rejected signal with no explanation is impossible to debug or review', 'Strings are faster', 'To use less memory'],
        answer: 1,
        explain: 'You will need to explain, months later, why a particular signal was not taken.' },
      { q: 'A trader intends to stop at −$1,000. What is missing?',
        options: ['Nothing', 'Enforcement — code that refuses orders past the limit', 'A larger limit', 'A bigger account'],
        answer: 1,
        explain: 'The intention and the enforced rule behave identically until the moment it matters, which is the only moment that counts.' }
    ],
    recap: [
      'The risk layer sits between signal and order, and can veto anything.',
      'Check the most decisive conditions first and return the first failure.',
      'Always return a reason.',
      'Daily counters reset at the session boundary, not on process restart.'
    ],
    vocab: [
      { term: 'Circuit breaker', def: 'A rule that halts trading when a threshold is crossed — daily loss, loss streak, abnormal volatility.' },
      { term: 'Revenge trading', def: 'Increasing size after a loss to recover it. The single most common way a funded account is destroyed.' }
    ]
  });

  C.push({
    id: 'd084', day: 84, module: 6, minutes: 35,
    title: 'The Tearsheet',
    subtitle: 'Everything a strategy has to disclose, on one page.',
    goal: '<b>Goal:</b> assemble the full performance report and format it so someone else can judge the strategy honestly.',
    objectives: [
      'Collect return, risk and trade statistics into one structure',
      'Format numbers for reading rather than for computing',
      'Include the figures that make a strategy look worse',
      'Render an aligned text report'
    ],
    sections: [
      { h: 'What belongs on a tearsheet',
        body: '<table><tr><th>Section</th><th>Contents</th></tr>' +
              '<tr><td>Returns</td><td>net P&amp;L, return %, CAGR</td></tr>' +
              '<tr><td>Risk</td><td>max drawdown, duration, Sharpe, Sortino</td></tr>' +
              '<tr><td>Trades</td><td>count, win rate, profit factor, expectancy, average win/loss</td></tr>' +
              '<tr><td>Costs</td><td>commission and slippage paid, and net-of-cost figures</td></tr>' +
              '<tr><td>Context</td><td>period covered, parameters, whether it is in or out of sample</td></tr></table>' +
              '<div class="note note-warn"><b>The last row is the one people omit</b>A tearsheet without the period, the parameter count and the sample status is unreadable — the numbers cannot be interpreted without knowing how they were produced.</div>' },
      { h: 'Format for reading',
        body: '<p>Analysis and presentation are different jobs. Keep full precision in the numbers and format only at the edge — percentages to one decimal, currency to two, ratios to two.</p>',
        code: 'const fmt = {\n  money: v => (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2),\n  pct: v => v.toFixed(1) + "%",\n  ratio: v => Number.isFinite(v) ? v.toFixed(2) : "n/a"\n};\n\nconsole.log(fmt.money(-1234.5), fmt.pct(12.345), fmt.ratio(Infinity));' },
      { h: 'An aligned text report',
        body: '<p><code>padEnd</code> for labels and <code>padStart</code> for values gives a report that is readable in a terminal, a log file or an email — no rendering required.</p>',
        code: 'function line(label, value, width = 24) {\n  return label.padEnd(width) + String(value).padStart(14);\n}\n\nconsole.log(line("Net P&L", "$12,480.00"));\nconsole.log(line("Max drawdown", "-$3,150.00"));\nconsole.log(line("Sharpe (annualised)", "1.42"));' },
      { h: 'Report the uncomfortable numbers',
        body: '<p>The figures that make a strategy look worse are the ones a reader most needs: the worst losing streak, the largest single loss, how much of the profit came from the best three trades, and what costs took.</p>' +
              '<p>A strategy whose entire edge is two outsized winners is a different proposition from one with a smooth distribution — and only the tearsheet can show that.</p>',
        code: 'const nets = [120, -80, 4200, -110, 90, -75, 3800, -95, 60, -90];\nconst total = nets.reduce((a, b) => a + b, 0);\nconst top3 = [...nets].sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);\nconsole.log("total:", total, " top 3 trades:", top3);\nconsole.log("share from the best 3:", (top3 / total * 100).toFixed(1) + "%");' }
    ],
    parsons: {
      prompt: 'Format an aligned report line.',
      lines: [
        'function line(label, value, width = 24) {',
        '  return label.padEnd(width) + String(value).padStart(14);',
        '}',
        'console.log(line("Net P&L", "$12,480.00"));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'formatters', difficulty: 'Core',
        prompt: 'Write three formatting helpers:<ul>' +
          '<li><code>money(v)</code> — <code>"$1234.50"</code>, with negatives as <code>"-$1234.50"</code> and two decimals</li>' +
          '<li><code>pct(v)</code> — one decimal and a percent sign, so <code>12.345</code> becomes <code>"12.3%"</code></li>' +
          '<li><code>ratio(v)</code> — two decimals, or <code>"n/a"</code> for anything non-finite</li></ul>',
        expose: ['money', 'pct', 'ratio'],
        starter: 'function money(v) {\n}\n\nfunction pct(v) {\n}\n\nfunction ratio(v) {\n}\n',
        solution: 'function money(v) {\n  return (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2);\n}\n\nfunction pct(v) {\n  return v.toFixed(1) + "%";\n}\n\nfunction ratio(v) {\n  return Number.isFinite(v) ? v.toFixed(2) : "n/a";\n}',
        hints: ['For money, decide the sign first and format the absolute value.',
                '<code>Number.isFinite</code> catches <code>Infinity</code> and <code>NaN</code> together.'],
        tests: { checks: [
          { name: 'money formats positives and negatives', expose: ['money'],
            run: function (s) {
              if (s.money(1234.5) !== '$1234.50') return 'got ' + s.money(1234.5);
              if (s.money(-1234.5) !== '-$1234.50') return 'got ' + s.money(-1234.5);
              return s.money(0) === '$0.00' ? true : 'got ' + s.money(0);
            } },
          { name: 'pct uses one decimal', expose: ['pct'],
            run: function (s) {
              if (s.pct(12.345) !== '12.3%') return 'got ' + s.pct(12.345);
              return s.pct(-3) === '-3.0%' ? true : 'got ' + s.pct(-3);
            } },
          { name: 'ratio handles non-finite values', expose: ['ratio'],
            run: function (s) {
              if (s.ratio(1.4159) !== '1.42') return 'got ' + s.ratio(1.4159);
              if (s.ratio(Infinity) !== 'n/a') return 'Infinity should be n/a';
              return s.ratio(NaN) === 'n/a' ? true : 'NaN should be n/a';
            } }
        ] } },
      { id: 'e2', title: 'buildTearsheet()', difficulty: 'Core',
        prompt: 'Write <code>buildTearsheet(trades, startEquity)</code> where each trade is <code>{ net }</code>, returning:<br>' +
          '<code>{ count, netPnl, returnPercent, wins, losses, winRate, profitFactor, expectancy, largestWin, largestLoss, topThreeShare }</code><ul>' +
          '<li><code>profitFactor</code> — gross profit ÷ gross loss; <code>Infinity</code> when there is profit and no loss, <code>0</code> when there is neither</li>' +
          '<li><code>topThreeShare</code> — the three largest wins as a share of <code>netPnl</code>, as a percentage; <code>0</code> when <code>netPnl</code> is 0</li>' +
          '<li><code>largestWin</code>/<code>largestLoss</code> — <code>0</code> when there are none of that kind</li></ul>',
        starter: 'function buildTearsheet(trades, startEquity) {\n  // the full statistics block\n}\n',
        solution: 'function buildTearsheet(trades, startEquity) {\n  const nets = trades.map(t => t.net);\n  const wins = nets.filter(n => n > 0);\n  const losses = nets.filter(n => n < 0);\n  const sum = a => a.reduce((x, y) => x + y, 0);\n  const netPnl = sum(nets);\n  const grossProfit = sum(wins);\n  const grossLoss = Math.abs(sum(losses));\n  const topThree = [...wins].sort((a, b) => b - a).slice(0, 3);\n  return {\n    count: nets.length,\n    netPnl,\n    returnPercent: startEquity === 0 ? 0 : netPnl / startEquity * 100,\n    wins: wins.length,\n    losses: losses.length,\n    winRate: nets.length ? wins.length / nets.length : 0,\n    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss,\n    expectancy: nets.length ? netPnl / nets.length : 0,\n    largestWin: wins.length ? Math.max(...wins) : 0,\n    largestLoss: losses.length ? Math.min(...losses) : 0,\n    topThreeShare: netPnl === 0 ? 0 : sum(topThree) / netPnl * 100\n  };\n}',
        hints: ['Split into wins and losses once, then every figure falls out of those arrays.',
                'Guard every division: no trades, no losses, zero net P&L, zero starting equity.',
                '<code>largestLoss</code> is the most negative net, so use <code>Math.min</code>.'],
        tests: { fn: 'buildTearsheet', approx: 1e-9, cases: [
          { args: [[{ net: 100 }, { net: -50 }, { net: 200 }], 10000],
            expect: { count: 3, netPnl: 250, returnPercent: 2.5, wins: 2, losses: 1,
              winRate: 2 / 3, profitFactor: 6, expectancy: 250 / 3,
              largestWin: 200, largestLoss: -50, topThreeShare: 120 } },
          { args: [[], 10000],
            expect: { count: 0, netPnl: 0, returnPercent: 0, wins: 0, losses: 0,
              winRate: 0, profitFactor: 0, expectancy: 0,
              largestWin: 0, largestLoss: 0, topThreeShare: 0 } },
          { args: [[{ net: 100 }], 10000],
            expect: { count: 1, netPnl: 100, returnPercent: 1, wins: 1, losses: 0,
              winRate: 1, profitFactor: Infinity, expectancy: 100,
              largestWin: 100, largestLoss: 0, topThreeShare: 100 },
            name: 'no losses gives an infinite profit factor' }
        ], checks: [{
          name: 'reveals when the edge is concentrated', expose: ['buildTearsheet'],
          run: function (s) {
            var trades = [120, -80, 4200, -110, 90, -75, 3800, -95, 60, -90]
              .map(function (n) { return { net: n }; });
            var r = s.buildTearsheet(trades, 100000);
            return r.topThreeShare > 90
              ? true : 'the best three trades dominate here, expected over 90%, got ' + r.topThreeShare;
          }
        }] } },
      { id: 'e3', title: 'renderTearsheet()', difficulty: 'Stretch',
        prompt: 'Write <code>renderTearsheet(stats, meta)</code> returning a multi-line string.<br>' +
          '<code>meta</code> is <code>{ name, period, sample }</code>. The layout is exactly:' +
          '<pre style="background:var(--bg-3);padding:10px;border-radius:8px;font-size:.78rem;margin:8px 0">=== NAME ===\nPeriod                        PERIOD\nSample                        SAMPLE\n\nNet P&amp;L                    $250.00\nReturn                          2.5%\nTrades                             3\nWin rate                       66.7%\nProfit factor                   6.00\nExpectancy                   $83.33\nLargest win                  $200.00\nLargest loss                 -$50.00\nTop 3 share                   120.0%</pre>' +
          'Each data line is the label padded to 24 characters with <code>padEnd</code>, then the value padded to 10 with <code>padStart</code>. There is one blank line after <code>Sample</code>.<br>' +
          '<span class="muted">The formatters from exercise 1 are in the starter. Win rate is a fraction, so render it as <code>pct(winRate × 100)</code>.</span>',
        starter: 'const money = v => (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2);\nconst pct = v => v.toFixed(1) + "%";\nconst ratio = v => Number.isFinite(v) ? v.toFixed(2) : "n/a";\n\nfunction renderTearsheet(stats, meta) {\n  // the aligned report\n}\n',
        solution: 'const money = v => (v < 0 ? "-$" : "$") + Math.abs(v).toFixed(2);\nconst pct = v => v.toFixed(1) + "%";\nconst ratio = v => Number.isFinite(v) ? v.toFixed(2) : "n/a";\n\nfunction renderTearsheet(stats, meta) {\n  const line = (label, value) => label.padEnd(24) + String(value).padStart(10);\n  return [\n    `=== ${meta.name} ===`,\n    line("Period", meta.period),\n    line("Sample", meta.sample),\n    "",\n    line("Net P&L", money(stats.netPnl)),\n    line("Return", pct(stats.returnPercent)),\n    line("Trades", stats.count),\n    line("Win rate", pct(stats.winRate * 100)),\n    line("Profit factor", ratio(stats.profitFactor)),\n    line("Expectancy", money(stats.expectancy)),\n    line("Largest win", money(stats.largestWin)),\n    line("Largest loss", money(stats.largestLoss)),\n    line("Top 3 share", pct(stats.topThreeShare))\n  ].join("\\n");\n}',
        hints: ['A local <code>line</code> helper keeps the padding in one place.',
                'Build an array of lines and <code>join("\\n")</code> at the end — the blank line is just an empty string.',
                'Every value passes through a formatter except the trade count.'],
        tests: { checks: [
          { name: 'renders the expected layout', expose: ['renderTearsheet'],
            run: function (s) {
              var stats = { count: 3, netPnl: 250, returnPercent: 2.5, wins: 2, losses: 1,
                winRate: 2 / 3, profitFactor: 6, expectancy: 250 / 3,
                largestWin: 200, largestLoss: -50, topThreeShare: 120 };
              var out = s.renderTearsheet(stats, { name: 'MOMENTUM ES', period: '2024-05-14', sample: 'out-of-sample' });
              var lines = out.split('\n');
              if (lines.length !== 13) return 'expected 13 lines, got ' + lines.length;
              if (lines[0] !== '=== MOMENTUM ES ===') return 'header was ' + JSON.stringify(lines[0]);
              if (lines[3] !== '') return 'line 4 should be blank';
              if (lines[4] !== 'Net P&L'.padEnd(24) + '$250.00'.padStart(10)) {
                return 'the Net P&L line was ' + JSON.stringify(lines[4]);
              }
              return true;
            } },
          { name: 'every data line is 34 characters wide', expose: ['renderTearsheet'],
            run: function (s) {
              var stats = { count: 3, netPnl: 250, returnPercent: 2.5, wins: 2, losses: 1,
                winRate: 2 / 3, profitFactor: 6, expectancy: 83.33,
                largestWin: 200, largestLoss: -50, topThreeShare: 120 };
              var lines = s.renderTearsheet(stats, { name: 'X', period: 'P', sample: 'S' }).split('\n');
              for (var i = 1; i < lines.length; i++) {
                if (lines[i] === '') continue;
                if (lines[i].length !== 34) return 'line ' + i + ' is ' + lines[i].length + ' characters';
              }
              return true;
            } },
          { name: 'an infinite profit factor renders as n/a', expose: ['renderTearsheet'],
            run: function (s) {
              var stats = { count: 1, netPnl: 100, returnPercent: 1, wins: 1, losses: 0,
                winRate: 1, profitFactor: Infinity, expectancy: 100,
                largestWin: 100, largestLoss: 0, topThreeShare: 100 };
              var out = s.renderTearsheet(stats, { name: 'X', period: 'P', sample: 'S' });
              return out.indexOf('n/a') >= 0 ? true : 'an infinite profit factor should render as n/a';
            } },
          { name: 'includes the metadata', expose: ['renderTearsheet'],
            run: function (s) {
              var stats = { count: 0, netPnl: 0, returnPercent: 0, wins: 0, losses: 0,
                winRate: 0, profitFactor: 0, expectancy: 0,
                largestWin: 0, largestLoss: 0, topThreeShare: 0 };
              var out = s.renderTearsheet(stats, { name: 'ALPHA', period: '2020-2024', sample: 'in-sample' });
              return (out.indexOf('ALPHA') >= 0 && out.indexOf('2020-2024') >= 0 && out.indexOf('in-sample') >= 0)
                ? true : 'the metadata is missing from the report';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Which context does a tearsheet most often omit and most need?',
        options: ['Net P&L', 'The period, parameter count and whether it is in or out of sample', 'The win rate', 'The symbol'],
        answer: 1,
        explain: 'Without those, the numbers cannot be interpreted at all — a great in-sample result and a great out-of-sample one look identical on the page.' },
      { q: 'Why report the share of profit from the best three trades?',
        options: ['It looks impressive', 'A strategy whose edge is two outliers is a very different proposition from one with a smooth distribution', 'It is required', 'To pad the report'],
        answer: 1,
        explain: 'Concentration is a risk the headline numbers hide completely.' },
      { q: 'Where should number formatting happen?',
        options: ['Throughout the calculation', 'Only at the presentation edge', 'In the data source', 'It does not matter'],
        answer: 1,
        explain: 'Rounding during analysis compounds error. Keep full precision and format once, at the end.' }
    ],
    recap: [
      'A tearsheet covers returns, risk, trades, costs and context.',
      'Format at the edge; compute in full precision.',
      'Report the numbers that make the strategy look worse.',
      '<code>padEnd</code> and <code>padStart</code> give a report readable anywhere.'
    ],
    vocab: [
      { term: 'Tearsheet', def: 'A one-page performance summary. The standard artefact for presenting or reviewing a strategy.' },
      { term: 'Concentration risk', def: 'When most of a strategy\'s profit comes from very few trades, so the result may not repeat.' }
    ]
  });

})();
