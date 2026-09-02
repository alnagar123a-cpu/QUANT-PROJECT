# Quant Academy

A browser-based platform for learning JavaScript from beginner to expert, taught
entirely through day-trading problems — candles, P&L, indicators, backtests and risk.

**100 levels. One 20–30 minute class per day. Every level graded and replayable.**

---

## What it is

Each day is a **level** with four parts:

1. **Learn** — short worked examples you can run in place, on real sample market data.
2. **Warm-up (Parsons problem)** — drag scrambled lines into the right order. A
   research-backed scaffold: you practise structure before fighting syntax.
3. **Practice** — 2–3 test-driven exercises. Write code, run the visible test
   suite, see exactly which case failed and why.
4. **Recall** — a short quiz. Only your *first* answer scores, because retrieval
   is what moves an idea into long-term memory.

## The game layer

Every level is scored out of **1000** and given a letter rank:

| Component | Points | Earned by |
|---|---|---|
| Correctness | 600 | Test suites passed |
| Recall | 200 | First-answer quiz accuracy |
| Efficiency | 100 | Your code size vs. the reference solution's "par" |
| Clean run | 100 | No hints, no peeked solutions, ≤2 failed runs |

**S** ≥ 950 · **A** ≥ 850 · **B** ≥ 720 · **C** ≥ 580 · **D** ≥ 400

- **Replay any level to improve it.** Hint and peek penalties reset, your saved
  code stays, and only your best attempt counts toward XP.
- **Every attempt is archived** — score, rank and full source, browsable per level.
- XP accumulates into player ranks (Intern → … → Market Wizard), with badges,
  a daily streak (including streak freezes), a daily-quest panel, an activity
  heatmap, boss levels every 10 days, and a spaced-repetition review queue that
  brings cleared levels back after 1, 3, 7, 16 and 35 days.

## Friends

- **Copy invite link** — send the site to a friend.
- **Copy my progress card** — a link that encodes your stats; whoever opens it can
  add you and see a head-to-head comparison.
- Where the page is served with a shared backing store, everyone who opens the
  same link appears in a live league table that updates by itself. Everywhere
  else (GitHub Pages, a local file, offline) friends' stats travel as snapshot
  codes, and the UI labels them as snapshots with their age.

Progress lives in `localStorage` and never leaves the browser unless you share a
card. Export/import from the ⚙ menu.

## Curriculum

| Module | Levels | Topic |
|---|---|---|
| 1 | 1–14 | Foundations — values, branching, loops, functions, arrays, objects |
| 2 | 15–28 | Data & collections — map/filter/reduce, sorting, destructuring, JSON, dates |
| 3 | 29–42 | Functions in depth — closures, higher-order functions, classes, errors |
| 4 | 43–56 | Async & live data — promises, async/await, fetch, streams, retries |
| 5 | 57–70 | Technical indicators — SMA, EMA, RSI, MACD, ATR, Bollinger, VWAP |
| 6 | 71–84 | Backtesting & risk — event loops, sizing, drawdown, Sharpe, slippage |
| 7 | 85–100 | Expert systems — order books, engines, optimisation, testing, a full system |

Every 10th level is a **boss challenge**: no new theory, just build the thing.

## Running it

It is a static site with no build step and no dependencies.

```bash
npx http-server -p 8080 .
# then open http://localhost:8080
```

Opening `index.html` directly from disk also works.

## Repository layout

```
index.html                      page shell
assets/css/styles.css           all styling
assets/js/market.js             deterministic sample ES session (78 five-minute bars)
assets/js/runner.js             sandboxed execution + test harness (loop guard, console capture)
assets/js/editor.js             syntax-highlighted editor, code blocks, Parsons widget
assets/js/game.js               scoring, ranks, XP, streaks, achievements, archive
assets/js/social.js             profiles, friends, share codes, league
assets/js/app.js                router and all views
assets/js/curriculum/_helpers.js  shared test builders
assets/js/curriculum/m1..m7.js    the 100 levels
scripts/verify.js               curriculum QA
```

## Verifying the curriculum

Every exercise ships with a model solution. The verifier loads the site's own
runner and checks that each model solution passes its own test suite, that each
starter does *not* already pass, and that every level is structurally complete:

```bash
node scripts/verify.js
```

This is the check to run after editing any lesson.

## Adding a level

Push an object onto `window.CURRICULUM` from one of the module files:

```js
C.push({
  id: 'd101', day: 101, module: 8, minutes: 25, boss: false,
  title: '...', subtitle: '...',
  goal: '<b>Goal:</b> ...',
  objectives: ['...'],
  sections: [{ h: 'Heading', body: '<p>HTML</p>', code: 'runnable example' }],
  parsons: { prompt: '...', lines: ['line 1', 'line 2'] },
  exercises: [{
    id: 'e1', title: '...', prompt: 'HTML',
    starter: '...', solution: '...', hints: ['...'],
    tests: { fn: 'myFunction', cases: [{ args: [1, 2], expect: 3 }] }
  }],
  quiz: [{ q: '...', options: ['a', 'b'], answer: 1, explain: '...' }],
  recap: ['...'],
  vocab: [{ term: '...', def: '...' }]
});
```

Test suites support four styles, which can be combined:

- `fn` + `cases` — call a named function with arguments and compare the result
  (`expect`, or a `check(got)` predicate; `approx` sets a float tolerance)
- `checks` — free-form assertions over any exposed variable
- `logs` — assert on console output, line by line
- `source` — require or forbid a pattern in the source, or a custom `fn(code)`

Then run `node scripts/verify.js`.
