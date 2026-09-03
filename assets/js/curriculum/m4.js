/* ============================================================
   MODULE 4 — Async & Live Data (levels 43–56)
   ============================================================ */
(function () {
  'use strict';
  var C = window.CURRICULUM, CX = window.CX;

  C.push({
    id: 'd043', day: 43, module: 4, minutes: 30,
    title: 'The Event Loop',
    subtitle: 'Why a market feed cannot block your program.',
    goal: '<b>Goal:</b> understand what "asynchronous" actually means, and why a blocking loop freezes everything.',
    objectives: [
      'Explain the call stack, the task queue and the event loop',
      'Predict the order of synchronous and asynchronous output',
      'Use <code>setTimeout</code> to defer work',
      'Recognise why a long synchronous loop is dangerous in a live system'
    ],
    sections: [
      { h: 'One thread, one thing at a time',
        body: '<p>JavaScript runs your code on a single thread. While a function is running, nothing else can happen — no tick is processed, no click handled, no screen repainted.</p>' +
              '<p>The way out is not more threads. It is to <em>not wait</em>: hand slow work (a network request, a timer) to the environment, return immediately, and be called back when it finishes.</p>',
        code: 'console.log("1 — runs now");\n\nsetTimeout(() => console.log("3 — runs later"), 0);\n\nconsole.log("2 — also runs now");\n\n// Output order is 1, 2, 3 — even with a 0ms delay.' },
      { h: 'The loop itself',
        body: '<p>The call stack holds what is running. When an async operation completes, its callback is placed in a queue. The event loop does one thing: <strong>when the stack is empty, move the next queued callback onto it.</strong></p>' +
              '<p>That is why <code>setTimeout(fn, 0)</code> does not run <code>fn</code> immediately — it runs it after all the currently running code has finished.</p>',
        code: 'function slowSum(n) {\n  let t = 0;\n  for (let i = 0; i < n; i++) t += i;\n  return t;\n}\n\nsetTimeout(() => console.log("queued callback finally runs"), 0);\nconsole.log("blocking for a moment...");\nconsole.log("sum:", slowSum(5000000));\nconsole.log("...done — only now can the queue be drained");' },
      { h: 'Blocking is a real risk in a live system',
        body: '<div class="note note-warn"><b>What blocking costs</b>A strategy that spends 400ms synchronously recomputing indicators processes no ticks during those 400ms. Quotes queue up, your view of the book goes stale, and the fill you model is not the fill you would have got. In a browser, the same block freezes the interface completely.</div>' +
              '<p>The fix is to break long work into chunks that yield between them, or move it off the main thread entirely (day 95).</p>',
        code: 'function chunkedProcess(items, chunkSize, onDone) {\n  let i = 0;\n  const results = [];\n  function step() {\n    const end = Math.min(i + chunkSize, items.length);\n    for (; i < end; i++) results.push(items[i] * 2);\n    if (i < items.length) setTimeout(step, 0);   // yield, then continue\n    else onDone(results);\n  }\n  step();\n}\n\nchunkedProcess([1, 2, 3, 4, 5], 2, r => console.log("done:", r));\nconsole.log("this line runs before the work finishes");' },
      { h: 'Callbacks were the first answer',
        body: '<p>Before promises, every async API took a function to call on completion. It works, but nesting several in sequence produces the shape everyone remembers unfondly.</p>',
        code: 'function fetchQuote(symbol, callback) {\n  setTimeout(() => callback(null, { symbol, price: 5240.25 }), 10);\n}\n\nfetchQuote("ES", (err, quote) => {\n  if (err) return console.log("failed");\n  console.log("got", quote.symbol, quote.price);\n  fetchQuote("NQ", (err2, q2) => {\n    console.log("then", q2.symbol, q2.price);\n  });\n});' }
    ],
    parsons: {
      prompt: 'Order these so the output is 1, 2, 3.',
      lines: [
        'console.log(1);',
        'setTimeout(() => console.log(3), 0);',
        'console.log(2);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'Predict the order', difficulty: 'Warm-up',
        prompt: 'Using the four statements below in any order, produce exactly this console output:' +
          '<pre style="background:var(--bg-3);padding:10px;border-radius:8px;font-size:.8rem;margin:8px 0">start\nmiddle\nend\ndeferred</pre>' +
          'You must use <code>setTimeout</code> for the <code>deferred</code> line, and you may not use any delay other than <code>0</code>.',
        starter: '// print: start, middle, end, deferred\n',
        solution: 'console.log("start");\nsetTimeout(() => console.log("deferred"), 0);\nconsole.log("middle");\nconsole.log("end");',
        hints: ['A <code>setTimeout</code> callback always runs after the currently executing code finishes.',
                'So the <code>setTimeout</code> call can appear anywhere before the end — its output still comes last.'],
        tests: { logs: ['start', 'middle', 'end', 'deferred'],
          source: [{ name: 'uses setTimeout for the deferred line', pattern: /setTimeout/,
            why: 'the last line must be genuinely deferred, not just printed last' }] } },
      { id: 'e2', title: 'delay()', difficulty: 'Core',
        prompt: 'Write <code>delay(ms, value)</code> returning a <code>Promise</code> that resolves with <code>value</code> after <code>ms</code> milliseconds.<br>' +
          'This is the building block for everything in the next few levels.',
        starter: 'function delay(ms, value) {\n  // return a promise that resolves after ms\n}\n',
        solution: 'function delay(ms, value) {\n  return new Promise(resolve => setTimeout(() => resolve(value), ms));\n}',
        hints: ['<code>new Promise(resolve =&gt; { ... })</code> — call <code>resolve</code> when the work is done.',
                'Put the <code>resolve</code> call inside the <code>setTimeout</code> callback.'],
        tests: { checks: [
          { name: 'returns a Promise', expose: ['delay'],
            run: function (s) {
              var p = s.delay(1, 'x');
              return (p && typeof p.then === 'function') ? true : 'expected a Promise';
            } },
          { name: 'resolves with the given value', expose: ['delay'],
            run: async function (s) {
              var v = await s.delay(5, 'ES');
              return v === 'ES' ? true : 'resolved with ' + JSON.stringify(v);
            } },
          { name: 'actually waits', expose: ['delay'],
            run: async function (s) {
              var t0 = Date.now();
              await s.delay(30, 1);
              var elapsed = Date.now() - t0;
              return elapsed >= 25 ? true : 'resolved after only ' + elapsed + 'ms — is the timeout being used?';
            } },
          { name: 'resolves with undefined when no value is given', expose: ['delay'],
            run: async function (s) {
              var v = await s.delay(1);
              return v === undefined ? true : 'expected undefined, got ' + JSON.stringify(v);
            } }
        ] } },
      { id: 'e3', title: 'chunked()', difficulty: 'Stretch',
        prompt: 'Write <code>chunked(items, size, transform)</code> returning a Promise of the transformed array, processing <code>size</code> items at a time and yielding to the event loop between chunks with <code>setTimeout(..., 0)</code>.<br>' +
          'An empty input resolves with an empty array.',
        starter: 'function chunked(items, size, transform) {\n  // process in chunks, yielding between them\n}\n',
        solution: 'function chunked(items, size, transform) {\n  return new Promise(resolve => {\n    const out = [];\n    let i = 0;\n    function step() {\n      const end = Math.min(i + size, items.length);\n      for (; i < end; i++) out.push(transform(items[i]));\n      if (i < items.length) setTimeout(step, 0);\n      else resolve(out);\n    }\n    step();\n  });\n}',
        hints: ['Wrap the whole thing in a <code>new Promise</code> and call <code>resolve(out)</code> when the last chunk is done.',
                'A named inner <code>step</code> function can schedule itself with <code>setTimeout(step, 0)</code>.',
                'Guard the empty case — <code>step()</code> should resolve immediately when there is nothing to do.'],
        tests: { checks: [
          { name: 'transforms every item', expose: ['chunked'],
            run: async function (s, h) {
              var out = await s.chunked([1, 2, 3, 4, 5], 2, function (x) { return x * 2; });
              return h.eq(out, [2, 4, 6, 8, 10]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'handles a chunk size larger than the input', expose: ['chunked'],
            run: async function (s, h) {
              var out = await s.chunked([1, 2], 100, function (x) { return x + 1; });
              return h.eq(out, [2, 3]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'resolves with [] for an empty input', expose: ['chunked'],
            run: async function (s, h) {
              var out = await s.chunked([], 2, function (x) { return x; });
              return h.eq(out, []) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'yields between chunks', expose: ['chunked'],
            run: async function (s) {
              var interleaved = false;
              var p = s.chunked([1, 2, 3, 4], 1, function (x) { return x; });
              setTimeout(function () { interleaved = true; }, 0);
              await p;
              return interleaved ? true : 'the whole job ran without ever yielding to the event loop';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>setTimeout(fn, 0)</code> guarantee?',
        options: ['<code>fn</code> runs immediately', '<code>fn</code> runs after the currently executing code finishes', '<code>fn</code> runs on another thread', 'Nothing'],
        answer: 1,
        explain: 'It queues the callback. The event loop only moves it onto the stack once the stack is empty.' },
      { q: 'What happens to incoming events during a 400ms synchronous loop?',
        options: ['They are processed in parallel', 'They wait in the queue until the loop finishes', 'They are dropped', 'They interrupt the loop'],
        answer: 1,
        explain: 'One thread means nothing else runs. Everything queues, and your view of the market goes stale.' },
      { q: 'How many threads run your JavaScript by default?',
        options: ['One per CPU core', 'One', 'One per promise', 'Unlimited'],
        answer: 1,
        explain: 'One. Concurrency comes from not waiting, not from parallelism — until you reach Web Workers.' }
    ],
    recap: [
      'JavaScript runs on one thread; the event loop moves queued callbacks onto an empty stack.',
      '<code>setTimeout(fn, 0)</code> defers until the current code finishes.',
      'Long synchronous work blocks ticks, clicks and rendering alike.',
      'Chunking with a yield keeps a long job from freezing everything.'
    ],
    vocab: [
      { term: 'Tick', def: 'A single update from a market feed — a trade or a quote change. A busy instrument produces thousands per second.' },
      { term: 'Latency', def: 'The delay between an event happening and your code reacting. Blocking work adds to it directly.' }
    ]
  });

  C.push({
    id: 'd044', day: 44, module: 4, minutes: 30,
    title: 'Promises',
    subtitle: 'A value that has not arrived yet.',
    goal: '<b>Goal:</b> replace nested callbacks with promise chains that read in order and handle failure in one place.',
    objectives: [
      'Create a promise with <code>new Promise</code>',
      'Chain with <code>then</code> and handle failure with <code>catch</code>',
      'Understand the three states of a promise',
      'Return values through a chain'
    ],
    sections: [
      { h: 'Three states, one transition',
        body: '<p>A promise is <strong>pending</strong>, then either <strong>fulfilled</strong> with a value or <strong>rejected</strong> with a reason. It settles exactly once — later calls to <code>resolve</code> or <code>reject</code> are ignored.</p>',
        code: 'const quote = new Promise((resolve, reject) => {\n  setTimeout(() => resolve({ symbol: "ES", price: 5240.25 }), 20);\n});\n\nconsole.log("pending right now:", quote);\nquote.then(q => console.log("settled with", q.symbol, q.price));' },
      { h: 'Chaining: each then returns a new promise',
        body: '<p>Whatever a <code>then</code> callback returns becomes the value of the next one. Return a promise and the chain waits for it — this is what flattens the callback nesting.</p>',
        code: 'function fetchQuote(symbol) {\n  return new Promise(resolve =>\n    setTimeout(() => resolve({ symbol, price: symbol === "ES" ? 5240.25 : 18420 }), 10));\n}\n\nfetchQuote("ES")\n  .then(q => { console.log("first:", q.symbol, q.price); return fetchQuote("NQ"); })\n  .then(q => { console.log("second:", q.symbol, q.price); return q.price * 20; })\n  .then(notional => console.log("notional:", notional));' },
      { h: 'One catch handles the whole chain',
        body: '<p>A rejection skips every remaining <code>then</code> until it finds a <code>catch</code>. That is the big win over callbacks, where every level needed its own error branch.</p>',
        code: 'function fetchQuote(symbol) {\n  return new Promise((resolve, reject) => {\n    if (symbol === "ZZ") reject(new Error("unknown symbol ZZ"));\n    else resolve({ symbol, price: 100 });\n  });\n}\n\nfetchQuote("ES")\n  .then(q => fetchQuote("ZZ"))\n  .then(q => console.log("never reached"))\n  .catch(e => console.log("caught:", e.message))\n  .finally(() => console.log("cleanup runs either way"));' },
      { h: 'Ready-made promises',
        body: '<p><code>Promise.resolve(v)</code> and <code>Promise.reject(e)</code> create already-settled promises. They are how you give a synchronous function an async interface, and how you write tests for async code.</p>' +
              '<div class="note note-warn"><b>Always return inside a then</b>Forgetting to <code>return</code> the inner promise breaks the chain: the next <code>then</code> receives <code>undefined</code> and runs before the inner work has finished.</div>',
        code: 'Promise.resolve(5240.25).then(p => console.log("immediate:", p));\nPromise.reject(new Error("no data")).catch(e => console.log("rejected:", e.message));' }
    ],
    parsons: {
      prompt: 'Chain two fetches and handle any failure once.',
      lines: [
        'fetchQuote("ES")',
        '  .then(q => { console.log(q.price); return fetchQuote("NQ"); })',
        '  .then(q => console.log(q.price))',
        '  .catch(e => console.log("failed:", e.message));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeQuoteFetcher()', difficulty: 'Core',
        prompt: 'Write <code>makeQuoteFetcher(prices)</code> where <code>prices</code> maps symbol to price.<br>' +
          'It returns a function <code>fetchQuote(symbol)</code> that returns a Promise:<ul>' +
          '<li>resolving with <code>{ symbol, price }</code> when the symbol is known</li>' +
          '<li>rejecting with <code>new Error("unknown symbol " + symbol)</code> when it is not</li></ul>',
        starter: 'function makeQuoteFetcher(prices) {\n  // return fetchQuote(symbol) -> Promise\n}\n',
        solution: 'function makeQuoteFetcher(prices) {\n  return symbol => new Promise((resolve, reject) => {\n    if (symbol in prices) resolve({ symbol, price: prices[symbol] });\n    else reject(new Error("unknown symbol " + symbol));\n  });\n}',
        hints: ['<code>new Promise((resolve, reject) =&gt; { ... })</code> — call one or the other.',
                '<code>symbol in prices</code> tests for the key without tripping over a price of 0.'],
        tests: { checks: [
          { name: 'resolves a known symbol', expose: ['makeQuoteFetcher'],
            run: async function (s, h) {
              var f = s.makeQuoteFetcher({ ES: 5240.25 });
              var q = await f('ES');
              return h.eq(q, { symbol: 'ES', price: 5240.25 }) ? true : 'resolved with ' + JSON.stringify(q);
            } },
          { name: 'rejects an unknown symbol with an Error', expose: ['makeQuoteFetcher'],
            run: async function (s) {
              var f = s.makeQuoteFetcher({ ES: 1 });
              try { await f('ZZ'); } catch (e) {
                if (!(e instanceof Error)) return 'rejected with a non-Error';
                return e.message === 'unknown symbol ZZ' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'should have rejected';
            } },
          { name: 'returns a promise, not a value', expose: ['makeQuoteFetcher'],
            run: function (s) {
              var f = s.makeQuoteFetcher({ ES: 1 });
              var r = f('ES');
              return (r && typeof r.then === 'function') ? true : 'expected a Promise';
            } },
          { name: 'a price of 0 is still a known symbol', expose: ['makeQuoteFetcher'],
            run: async function (s) {
              var f = s.makeQuoteFetcher({ FREE: 0 });
              var q = await f('FREE');
              return q.price === 0 ? true : 'a price of 0 should resolve, not reject';
            } }
        ] } },
      { id: 'e2', title: 'Chain two fetches', difficulty: 'Core',
        prompt: 'Write <code>spread(fetchQuote, a, b)</code> which fetches quote <code>a</code>, then quote <code>b</code>, and returns a Promise of <code>{ a: priceA, b: priceB, spread: priceA - priceB }</code>.<br>' +
          'Use <code>then</code> chaining — this level is about promises, not <code>await</code>.',
        starter: 'function spread(fetchQuote, a, b) {\n  // chain the two fetches\n}\n',
        solution: 'function spread(fetchQuote, a, b) {\n  let priceA;\n  return fetchQuote(a)\n    .then(qa => { priceA = qa.price; return fetchQuote(b); })\n    .then(qb => ({ a: priceA, b: qb.price, spread: priceA - qb.price }));\n}',
        hints: ['Capture the first price in a variable outside the chain so the second <code>then</code> can see it.',
                'Remember to <code>return</code> the second fetch so the chain waits for it.'],
        tests: { checks: [
          { name: 'returns both prices and their difference', expose: ['spread'],
            run: async function (s, h) {
              var f = function (sym) { return Promise.resolve({ symbol: sym, price: sym === 'ES' ? 100 : 40 }); };
              var r = await s.spread(f, 'ES', 'NQ');
              return h.eq(r, { a: 100, b: 40, spread: 60 }) ? true : 'got ' + JSON.stringify(r);
            } },
          { name: 'fetches in order', expose: ['spread'],
            run: async function (s) {
              var order = [];
              var f = function (sym) { order.push(sym); return Promise.resolve({ price: 1 }); };
              await s.spread(f, 'X', 'Y');
              return (order[0] === 'X' && order[1] === 'Y') ? true : 'fetch order was ' + JSON.stringify(order);
            } },
          { name: 'a rejection propagates', expose: ['spread'],
            run: async function (s) {
              var f = function (sym) {
                return sym === 'BAD' ? Promise.reject(new Error('nope')) : Promise.resolve({ price: 1 });
              };
              try { await s.spread(f, 'OK', 'BAD'); } catch (e) { return true; }
              return 'a failing second fetch should reject the whole thing';
            } },
          { name: 'waits for the second fetch to settle', expose: ['spread'],
            run: async function (s) {
              var f = function (sym) {
                return new Promise(function (res) { setTimeout(function () { res({ price: sym === 'A' ? 10 : 4 }); }, 10); });
              };
              var r = await s.spread(f, 'A', 'B');
              return r.spread === 6 ? true : 'got ' + JSON.stringify(r) + ' — did you return the inner promise?';
            } }
        ] } },
      { id: 'e3', title: 'withTimeout()', difficulty: 'Stretch',
        prompt: 'Write <code>withTimeout(promise, ms)</code> returning a Promise that:<ul>' +
          '<li>resolves or rejects exactly as <code>promise</code> does, if it settles within <code>ms</code></li>' +
          '<li>otherwise rejects with <code>new Error("timeout after " + ms + "ms")</code></li></ul>' +
          '<span class="muted">A feed that never answers is worse than one that fails — every network call needs a deadline.</span>',
        starter: 'function withTimeout(promise, ms) {\n  // race the promise against a timer\n}\n',
        solution: 'function withTimeout(promise, ms) {\n  return Promise.race([\n    promise,\n    new Promise((_, reject) =>\n      setTimeout(() => reject(new Error("timeout after " + ms + "ms")), ms))\n  ]);\n}',
        hints: ['<code>Promise.race</code> settles with whichever of its inputs settles first.',
                'The timer promise only ever rejects, so its <code>resolve</code> can be ignored with <code>_</code>.'],
        tests: { checks: [
          { name: 'passes through a fast resolution', expose: ['withTimeout'],
            run: async function (s) {
              var v = await s.withTimeout(Promise.resolve('quick'), 100);
              return v === 'quick' ? true : 'got ' + JSON.stringify(v);
            } },
          { name: 'rejects when the promise is too slow', expose: ['withTimeout'],
            run: async function (s) {
              var slow = new Promise(function (res) { setTimeout(function () { res('late'); }, 200); });
              try { await s.withTimeout(slow, 20); } catch (e) {
                return e.message === 'timeout after 20ms' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'should have timed out';
            } },
          { name: 'passes through an early rejection unchanged', expose: ['withTimeout'],
            run: async function (s) {
              var rejected = Promise.reject(new Error('feed down'));
              rejected.catch(function () {});   // keep it handled even if withTimeout ignores it
              try { await s.withTimeout(rejected, 100); } catch (e) {
                return e.message === 'feed down' ? true : 'the original rejection should survive, got ' + e.message;
              }
              return 'should have rejected';
            } }
        ] } }
    ],
    quiz: [
      { q: 'How many times can a promise settle?',
        options: ['Once', 'Twice', 'As often as resolve is called', 'Until it is caught'],
        answer: 0,
        explain: 'Exactly once. Later calls to <code>resolve</code> or <code>reject</code> are silently ignored.' },
      { q: 'What happens if a <code>then</code> callback forgets to return its inner promise?',
        options: ['Nothing', 'The next <code>then</code> gets <code>undefined</code> and runs before the inner work finishes', 'A TypeError', 'The chain retries'],
        answer: 1,
        explain: 'This is the single most common promise bug: the chain stops waiting and later steps see nothing.' },
      { q: 'A rejection happens in the second of five chained <code>then</code>s. What runs next?',
        options: ['The third then', 'The nearest catch', 'Nothing', 'All remaining thens'],
        answer: 1,
        explain: 'Rejections skip <code>then</code> handlers until a <code>catch</code> is found — one place to handle failure for the whole chain.' }
    ],
    recap: [
      'A promise is pending, then fulfilled or rejected — once.',
      'Each <code>then</code> returns a new promise; return the inner one to keep the chain waiting.',
      'One <code>catch</code> handles failures from anywhere earlier in the chain.',
      '<code>Promise.race</code> against a timer gives any call a deadline.'
    ],
    vocab: [
      { term: 'Stale quote', def: 'A price your system still believes is current but which the market has moved past. Timeouts exist to turn silence into a detectable failure.' }
    ]
  });

  C.push({
    id: 'd045', day: 45, module: 4, minutes: 30,
    title: 'async / await',
    subtitle: 'Asynchronous code that reads like synchronous code.',
    goal: '<b>Goal:</b> rewrite promise chains as straight-line code, and know exactly where the pauses are.',
    objectives: [
      'Mark a function <code>async</code> and <code>await</code> inside it',
      'Handle rejection with <code>try/catch</code>',
      'Remember that an async function always returns a promise',
      'Spot accidental sequencing'
    ],
    sections: [
      { h: 'await unwraps a promise',
        body: '<p>Inside an <code>async</code> function, <code>await</code> pauses until the promise settles and gives you the value. The pause is local: the rest of the program keeps running.</p>',
        code: 'function fetchQuote(symbol) {\n  return new Promise(r => setTimeout(() => r({ symbol, price: 5240.25 }), 10));\n}\n\nasync function show() {\n  const q = await fetchQuote("ES");\n  console.log("got", q.symbol, q.price);\n  return q.price;\n}\n\nshow().then(p => console.log("returned:", p));\nconsole.log("this prints first");' },
      { h: 'try/catch replaces .catch',
        body: '<p>An awaited rejection throws, so ordinary <code>try/catch</code> works — the same tool you already use for synchronous errors.</p>',
        code: 'async function safeFetch(fetchQuote, symbol) {\n  try {\n    const q = await fetchQuote(symbol);\n    return q.price;\n  } catch (e) {\n    console.log("failed:", e.message);\n    return null;\n  }\n}\n\nconst f = s => s === "ZZ" ? Promise.reject(new Error("unknown")) : Promise.resolve({ price: 100 });\nsafeFetch(f, "ES").then(p => console.log("ES ->", p));\nsafeFetch(f, "ZZ").then(p => console.log("ZZ ->", p));' },
      { h: 'An async function always returns a promise',
        body: '<p>Even a plain value gets wrapped. This trips people up at the top level: calling an async function does not give you the result, it gives you a promise for the result.</p>',
        code: 'async function two() { return 2; }\nconsole.log(two());              // Promise, not 2\ntwo().then(v => console.log(v)); // 2\n\n(async () => {\n  console.log("awaited:", await two());\n})();' },
      { h: 'The accidental-sequencing trap',
        body: '<p>Two independent awaits in a row run one after the other. If neither depends on the other, that doubles the wait for nothing.</p>' +
              '<div class="note note-warn"><b>Start first, await later</b>Call both functions to start the work, then await both. Or use <code>Promise.all</code> — tomorrow\'s level.</div>',
        code: 'const slow = (name, ms) => new Promise(r => setTimeout(() => r(name), ms));\n\n(async () => {\n  console.time("sequential");\n  await slow("a", 40); await slow("b", 40);\n  console.timeEnd("sequential");\n\n  console.time("parallel");\n  const pa = slow("a", 40), pb = slow("b", 40);   // both started\n  await pa; await pb;\n  console.timeEnd("parallel");\n})();' }
    ],
    parsons: {
      prompt: 'Fetch a quote and handle failure with try/catch.',
      lines: [
        'async function getPrice(fetchQuote, symbol) {',
        '  try {',
        '    const quote = await fetchQuote(symbol);',
        '    return quote.price;',
        '  } catch (e) {',
        '    return null;',
        '  }',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'getPrice()', difficulty: 'Core',
        prompt: 'Write an <code>async</code> function <code>getPrice(fetchQuote, symbol)</code> that awaits <code>fetchQuote(symbol)</code> and returns its <code>price</code>, or <code>null</code> if the fetch rejects.',
        starter: 'async function getPrice(fetchQuote, symbol) {\n  // await, return the price, null on failure\n}\n',
        solution: 'async function getPrice(fetchQuote, symbol) {\n  try {\n    const quote = await fetchQuote(symbol);\n    return quote.price;\n  } catch (e) {\n    return null;\n  }\n}',
        hints: ['Mark the function <code>async</code> so you may use <code>await</code> inside it.',
                'Wrap the await in <code>try/catch</code> and return <code>null</code> from the catch.'],
        tests: { checks: [
          { name: 'returns the price on success', expose: ['getPrice'],
            run: async function (s) {
              var v = await s.getPrice(function () { return Promise.resolve({ price: 5240.25 }); }, 'ES');
              return v === 5240.25 ? true : 'got ' + JSON.stringify(v);
            } },
          { name: 'returns null when the fetch rejects', expose: ['getPrice'],
            run: async function (s) {
              var v = await s.getPrice(function () { return Promise.reject(new Error('down')); }, 'ES');
              return v === null ? true : 'got ' + JSON.stringify(v);
            } },
          { name: 'waits for a slow fetch', expose: ['getPrice'],
            run: async function (s) {
              var f = function () { return new Promise(function (r) { setTimeout(function () { r({ price: 42 }); }, 20); }); };
              var v = await s.getPrice(f, 'ES');
              return v === 42 ? true : 'got ' + JSON.stringify(v) + ' — did you await?';
            } },
          { name: 'returns a promise (it is async)', expose: ['getPrice'],
            run: function (s) {
              var r = s.getPrice(function () { return Promise.resolve({ price: 1 }); }, 'ES');
              return (r && typeof r.then === 'function') ? true : 'an async function must return a promise';
            } }
        ] } },
      { id: 'e2', title: 'fetchInOrder()', difficulty: 'Core',
        prompt: 'Write <code>fetchInOrder(fetchQuote, symbols)</code> returning a Promise of an array of prices, in the same order as <code>symbols</code>.<br>' +
          'Fetch them <strong>one at a time</strong> — a rate-limited API sometimes requires exactly this. If any fetch rejects, use <code>null</code> for that symbol and carry on.',
        starter: 'async function fetchInOrder(fetchQuote, symbols) {\n  // sequential, null for failures\n}\n',
        solution: 'async function fetchInOrder(fetchQuote, symbols) {\n  const out = [];\n  for (const symbol of symbols) {\n    try {\n      const q = await fetchQuote(symbol);\n      out.push(q.price);\n    } catch (e) {\n      out.push(null);\n    }\n  }\n  return out;\n}',
        hints: ['A <code>for...of</code> loop with an <code>await</code> inside runs strictly one at a time.',
                'Put the try/catch inside the loop so one failure does not end the whole run.'],
        tests: { checks: [
          { name: 'returns prices in order', expose: ['fetchInOrder'],
            run: async function (s, h) {
              var prices = { ES: 5240, NQ: 18420, CL: 78 };
              var f = function (sym) { return Promise.resolve({ price: prices[sym] }); };
              var out = await s.fetchInOrder(f, ['ES', 'NQ', 'CL']);
              return h.eq(out, [5240, 18420, 78]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'a failure becomes null without stopping the rest', expose: ['fetchInOrder'],
            run: async function (s, h) {
              var f = function (sym) {
                return sym === 'BAD' ? Promise.reject(new Error('x')) : Promise.resolve({ price: 1 });
              };
              var out = await s.fetchInOrder(f, ['A', 'BAD', 'C']);
              return h.eq(out, [1, null, 1]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'runs strictly one at a time', expose: ['fetchInOrder'],
            run: async function (s) {
              var live = 0, maxLive = 0;
              var f = function () {
                live++; maxLive = Math.max(maxLive, live);
                return new Promise(function (r) { setTimeout(function () { live--; r({ price: 1 }); }, 10); });
              };
              await s.fetchInOrder(f, ['A', 'B', 'C']);
              return maxLive === 1 ? true : maxLive + ' fetches were in flight at once — this one must be sequential';
            } },
          { name: 'an empty list resolves with []', expose: ['fetchInOrder'],
            run: async function (s, h) {
              var out = await s.fetchInOrder(function () { return Promise.resolve({ price: 1 }); }, []);
              return h.eq(out, []) ? true : 'got ' + JSON.stringify(out);
            } }
        ] } },
      { id: 'e3', title: 'Fix the accidental sequencing', difficulty: 'Stretch',
        prompt: 'The function below fetches two independent quotes but waits for the first before starting the second, doubling the latency.<br>' +
          'Rewrite <code>fetchBoth(fetchQuote, a, b)</code> so both requests are <strong>in flight at the same time</strong>, still returning <code>{ a: priceA, b: priceB }</code>.<br>' +
          '<span class="muted">Do not use <code>Promise.all</code> yet — start both calls, then await them.</span>',
        starter: 'async function fetchBoth(fetchQuote, a, b) {\n  const qa = await fetchQuote(a);   // starts, then waits\n  const qb = await fetchQuote(b);   // only starts now\n  return { a: qa.price, b: qb.price };\n}\n',
        solution: 'async function fetchBoth(fetchQuote, a, b) {\n  const pa = fetchQuote(a);\n  const pb = fetchQuote(b);\n  return { a: (await pa).price, b: (await pb).price };\n}',
        hints: ['Calling the function starts the work; <code>await</code> only waits for it.',
                'Store both promises first, then await each one.'],
        tests: { checks: [
          { name: 'still returns both prices', expose: ['fetchBoth'],
            run: async function (s, h) {
              var f = function (sym) { return Promise.resolve({ price: sym === 'ES' ? 100 : 40 }); };
              var r = await s.fetchBoth(f, 'ES', 'NQ');
              return h.eq(r, { a: 100, b: 40 }) ? true : 'got ' + JSON.stringify(r);
            } },
          { name: 'both fetches are in flight at once', expose: ['fetchBoth'],
            run: async function (s) {
              var live = 0, maxLive = 0;
              var f = function () {
                live++; maxLive = Math.max(maxLive, live);
                return new Promise(function (r) { setTimeout(function () { live--; r({ price: 1 }); }, 20); });
              };
              await s.fetchBoth(f, 'A', 'B');
              return maxLive === 2 ? true : 'only ' + maxLive + ' request was in flight — start both before awaiting';
            } },
          { name: 'takes roughly one delay, not two', expose: ['fetchBoth'],
            run: async function (s) {
              var f = function () { return new Promise(function (r) { setTimeout(function () { r({ price: 1 }); }, 40); }); };
              var t0 = Date.now();
              await s.fetchBoth(f, 'A', 'B');
              var ms = Date.now() - t0;
              return ms < 70 ? true : 'took ' + ms + 'ms — the two 40ms fetches are still running back to back';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does an <code>async</code> function return?',
        options: ['The value you return', 'A promise for that value', 'undefined', 'It depends on await'],
        answer: 1,
        explain: 'Always a promise, even for a plain value. Calling one gives you a promise, not the result.' },
      { q: 'How do you handle a rejection inside an async function?',
        options: ['<code>.catch()</code> only', '<code>try/catch</code> around the await', 'It cannot be handled', '<code>finally</code>'],
        answer: 1,
        explain: 'An awaited rejection throws, so ordinary <code>try/catch</code> works — one less mechanism to remember.' },
      { q: 'Why is <code>await a(); await b();</code> often slower than it needs to be?',
        options: ['await is slow', 'b does not start until a has finished, even if they are independent', 'It creates extra promises', 'It blocks the thread'],
        answer: 1,
        explain: 'Start both calls first, then await. Independent work should overlap.' }
    ],
    recap: [
      '<code>await</code> unwraps a promise inside an <code>async</code> function.',
      'An async function always returns a promise.',
      '<code>try/catch</code> handles awaited rejections.',
      'Start independent work before awaiting it, or you serialise it by accident.'
    ],
    vocab: [
      { term: 'Round trip', def: 'One request out and its response back. Two sequential round trips cost twice the latency of two overlapping ones.' }
    ]
  });


  C.push({
    id: 'd046', day: 46, module: 4, minutes: 30,
    title: 'fetch and HTTP',
    subtitle: 'Talking to a market-data API, and checking what came back.',
    goal: '<b>Goal:</b> call an HTTP endpoint, verify the response, and turn it into usable data.',
    objectives: [
      'Make a request with <code>fetch</code> and read JSON',
      'Check <code>response.ok</code> — fetch does not reject on 404',
      'Send headers and query parameters',
      'Inject the fetch function so the code stays testable'
    ],
    sections: [
      { h: 'The shape of a fetch call',
        body: '<p><code>fetch</code> returns a promise for a <code>Response</code>. Reading the body is a <em>second</em> async step, because the headers arrive before the payload does.</p>',
        code: '// Sketch — this page has no network access, so the calls below are illustrative.\n// const res = await fetch("https://api.example.com/quotes/ES");\n// const data = await res.json();\n\nconsole.log("Two awaits: one for the response, one for the body.");' },
      { h: 'fetch does not reject on 4xx or 5xx',
        body: '<p>This surprises everyone once. A 404 or a 500 is a <em>successful</em> HTTP exchange as far as <code>fetch</code> is concerned — the promise resolves. Only a network-level failure rejects.</p>' +
              '<div class="note note-warn"><b>Always check <code>res.ok</code></b>Skip it and your parser receives an HTML error page, <code>JSON.parse</code> throws something unrelated, and the real cause — an expired API key — is nowhere in the message.</div>',
        code: 'async function getJson(fetchFn, url) {\n  const res = await fetchFn(url);\n  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);\n  return res.json();\n}\n\nconst fake = url => Promise.resolve({\n  ok: false, status: 404,\n  json: () => Promise.resolve({})\n});\n\ngetJson(fake, "/quotes/ZZ").catch(e => console.log("caught:", e.message));' },
      { h: 'Headers, methods and query strings',
        body: '<p>The second argument configures the request. <code>URLSearchParams</code> builds a query string with the escaping done correctly, which hand-concatenation gets wrong the first time a symbol contains a slash.</p>',
        code: 'const params = new URLSearchParams({ symbol: "ES", interval: "5m", limit: 78 });\nconsole.log("/bars?" + params.toString());\n\nconst options = {\n  method: "POST",\n  headers: { "Content-Type": "application/json", "X-API-Key": "…" },\n  body: JSON.stringify({ symbol: "ES", qty: 2, side: "buy" })\n};\nconsole.log(options.body);' },
      { h: 'Inject fetch, do not reach for it',
        body: '<p>A function that calls the global <code>fetch</code> can only be tested by starting a server or monkey-patching a global. A function that <em>receives</em> its fetch can be tested with three lines and no network — which is why every exercise here takes one.</p>',
        code: 'async function loadBars(fetchFn, symbol) {\n  const res = await fetchFn(`/bars?symbol=${symbol}`);\n  if (!res.ok) throw new Error(`HTTP ${res.status}`);\n  const data = await res.json();\n  return data.bars;\n}\n\nconst stub = () => Promise.resolve({\n  ok: true, status: 200,\n  json: () => Promise.resolve({ bars: [{ close: 5240.25 }] })\n});\n\nloadBars(stub, "ES").then(b => console.log("loaded", b.length, "bars"));' }
    ],
    parsons: {
      prompt: 'Fetch JSON and fail loudly on a bad status.',
      lines: [
        'async function getJson(fetchFn, url) {',
        '  const res = await fetchFn(url);',
        '  if (!res.ok) throw new Error(`HTTP ${res.status}`);',
        '  return res.json();',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'getJson()', difficulty: 'Core',
        prompt: 'Write <code>getJson(fetchFn, url)</code>:<ul>' +
          '<li>await <code>fetchFn(url)</code></li>' +
          '<li>if <code>res.ok</code> is false, throw <code>new Error("HTTP " + res.status)</code></li>' +
          '<li>otherwise return the parsed body from <code>res.json()</code></li></ul>',
        starter: 'async function getJson(fetchFn, url) {\n  // fetch, check status, parse\n}\n',
        solution: 'async function getJson(fetchFn, url) {\n  const res = await fetchFn(url);\n  if (!res.ok) throw new Error("HTTP " + res.status);\n  return res.json();\n}',
        hints: ['Two awaits: one for the response, one for the body — or return <code>res.json()</code> directly.',
                'Check <code>res.ok</code> before touching the body.'],
        tests: { checks: [
          { name: 'returns the parsed body on success', expose: ['getJson'],
            run: async function (s, h) {
              var f = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ price: 5240 }); } }); };
              var d = await s.getJson(f, '/x');
              return h.eq(d, { price: 5240 }) ? true : 'got ' + JSON.stringify(d);
            } },
          { name: 'throws on a 404', expose: ['getJson'],
            run: async function (s) {
              var f = function () { return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } }); };
              try { await s.getJson(f, '/x'); } catch (e) {
                return e.message === 'HTTP 404' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'a non-ok response should throw';
            } },
          { name: 'throws on a 500', expose: ['getJson'],
            run: async function (s) {
              var f = function () { return Promise.resolve({ ok: false, status: 500, json: function () { return Promise.resolve({}); } }); };
              try { await s.getJson(f, '/x'); } catch (e) { return e.message === 'HTTP 500' ? true : 'message was ' + e.message; }
              return 'a 500 should throw';
            } },
          { name: 'passes the url through to fetchFn', expose: ['getJson'],
            run: async function (s) {
              var seen = null;
              var f = function (u) { seen = u; return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(1); } }); };
              await s.getJson(f, '/bars?symbol=ES');
              return seen === '/bars?symbol=ES' ? true : 'fetchFn was called with ' + JSON.stringify(seen);
            } },
          { name: 'does not read the body of a failed response', expose: ['getJson'],
            run: async function (s) {
              var read = false;
              var f = function () {
                return Promise.resolve({ ok: false, status: 403, json: function () { read = true; return Promise.resolve({}); } });
              };
              try { await s.getJson(f, '/x'); } catch (e) {}
              return read === false ? true : 'check res.ok before parsing the body';
            } }
        ] } },
      { id: 'e2', title: 'buildUrl()', difficulty: 'Core',
        prompt: 'Write <code>buildUrl(base, params)</code> returning <code>base</code> with a query string appended.<ul>' +
          '<li>Keys whose value is <code>undefined</code> or <code>null</code> are omitted entirely.</li>' +
          '<li>Values must be URL-encoded.</li>' +
          '<li>With no usable parameters, return <code>base</code> unchanged — no trailing <code>?</code>.</li></ul>' +
          '<code>buildUrl("/bars", {symbol:"ES", limit:78, cursor:null})</code> → <code>"/bars?symbol=ES&amp;limit=78"</code>',
        starter: 'function buildUrl(base, params) {\n  // append an encoded query string\n}\n',
        solution: 'function buildUrl(base, params) {\n  const q = new URLSearchParams();\n  for (const [k, v] of Object.entries(params)) {\n    if (v !== undefined && v !== null) q.append(k, v);\n  }\n  const s = q.toString();\n  return s ? base + "?" + s : base;\n}',
        hints: ['<code>URLSearchParams</code> does the encoding for you.',
                'Filter out null and undefined before appending, then check whether anything was added.'],
        tests: { fn: 'buildUrl', cases: [
          { args: ['/bars', { symbol: 'ES', limit: 78 }], expect: '/bars?symbol=ES&limit=78' },
          { args: ['/bars', { symbol: 'ES', cursor: null, page: undefined }], expect: '/bars?symbol=ES',
            name: 'null and undefined values are dropped' },
          { args: ['/bars', {}], expect: '/bars', name: 'no parameters means no question mark' },
          { args: ['/q', { s: 'a b' }], expect: '/q?s=a+b', name: 'values are encoded' },
          { args: ['/q', { n: 0 }], expect: '/q?n=0', name: 'a value of 0 is kept' }
        ] } },
      { id: 'e3', title: 'loadBars()', difficulty: 'Stretch',
        prompt: 'Write <code>loadBars(fetchFn, symbol, limit)</code> that:<ol>' +
          '<li>requests <code>"/bars?symbol=…&amp;limit=…"</code> (in that key order)</li>' +
          '<li>throws <code>new Error("HTTP " + status)</code> on a non-ok response</li>' +
          '<li>throws <code>new Error("malformed response")</code> if the body has no <code>bars</code> array</li>' +
          '<li>otherwise returns only the bars whose <code>close</code> is a finite number</li></ol>',
        starter: 'async function loadBars(fetchFn, symbol, limit) {\n  // request, validate, clean\n}\n',
        solution: 'async function loadBars(fetchFn, symbol, limit) {\n  const res = await fetchFn(`/bars?symbol=${symbol}&limit=${limit}`);\n  if (!res.ok) throw new Error("HTTP " + res.status);\n  const data = await res.json();\n  if (!data || !Array.isArray(data.bars)) throw new Error("malformed response");\n  return data.bars.filter(b => Number.isFinite(b.close));\n}',
        hints: ['Build the URL with a template literal in the exact key order given.',
                'Validate the shape before filtering — <code>data.bars</code> may not be an array at all.',
                '<code>Number.isFinite(b.close)</code> rejects null, undefined, NaN and strings.'],
        tests: { checks: [
          { name: 'requests the right url', expose: ['loadBars'],
            run: async function (s) {
              var seen = null;
              var f = function (u) { seen = u; return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ bars: [] }); } }); };
              await s.loadBars(f, 'ES', 78);
              return seen === '/bars?symbol=ES&limit=78' ? true : 'requested ' + JSON.stringify(seen);
            } },
          { name: 'drops bars with an unusable close', expose: ['loadBars'],
            run: async function (s, h) {
              var body = { bars: [{ close: 1 }, { close: null }, { close: NaN }, { close: 2 }, {}] };
              var f = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(body); } }); };
              var out = await s.loadBars(f, 'ES', 5);
              return h.eq(out, [{ close: 1 }, { close: 2 }]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'throws on a bad status', expose: ['loadBars'],
            run: async function (s) {
              var f = function () { return Promise.resolve({ ok: false, status: 429, json: function () { return Promise.resolve({}); } }); };
              try { await s.loadBars(f, 'ES', 1); } catch (e) { return e.message === 'HTTP 429' ? true : 'message was ' + e.message; }
              return 'should have thrown';
            } },
          { name: 'throws when bars is missing', expose: ['loadBars'],
            run: async function (s) {
              var f = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ error: 'oops' }); } }); };
              try { await s.loadBars(f, 'ES', 1); } catch (e) {
                return e.message === 'malformed response' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'a body without a bars array should throw';
            } },
          { name: 'throws when bars is not an array', expose: ['loadBars'],
            run: async function (s) {
              var f = function () { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ bars: 'nope' }); } }); };
              try { await s.loadBars(f, 'ES', 1); } catch (e) { return true; }
              return 'a non-array bars field should throw';
            } }
        ] } }
    ],
    quiz: [
      { q: 'A server returns 500. What does the <code>fetch</code> promise do?',
        options: ['Rejects', 'Resolves with a Response whose <code>ok</code> is false', 'Throws synchronously', 'Retries'],
        answer: 1,
        explain: 'Only network-level failures reject. A 500 is a completed exchange, so you must check <code>res.ok</code> yourself.' },
      { q: 'Why does reading the body need a second await?',
        options: ['A design mistake', 'Headers arrive before the payload, so the body is streamed separately', 'To allow retries', 'It does not'],
        answer: 1,
        explain: '<code>fetch</code> resolves once headers are in. <code>res.json()</code> waits for the rest of the body.' },
      { q: 'Why pass <code>fetchFn</code> in rather than calling the global <code>fetch</code>?',
        options: ['It is faster', 'The function becomes testable without a network or a patched global', 'The global is deprecated', 'To support POST'],
        answer: 1,
        explain: 'Injecting the dependency is what lets every test in this level run in milliseconds with no server.' }
    ],
    recap: [
      '<code>fetch</code> resolves on 4xx and 5xx — always check <code>res.ok</code>.',
      'Reading the body is a second async step.',
      '<code>URLSearchParams</code> builds and encodes query strings correctly.',
      'Inject the fetch function so the logic can be tested in isolation.'
    ],
    vocab: [
      { term: 'REST endpoint', def: 'A URL that returns data for a resource — historical bars, a quote, an account balance.' },
      { term: 'API key', def: 'A credential identifying your application to a data provider. Never commit one to a repository.' }
    ]
  });

  C.push({
    id: 'd047', day: 47, module: 4, minutes: 30,
    title: 'Promise.all, allSettled and race',
    subtitle: 'Fanning out across a watchlist.',
    goal: '<b>Goal:</b> fetch a whole watchlist at once and decide what should happen when one symbol fails.',
    objectives: [
      'Run promises in parallel with <code>Promise.all</code>',
      'Survive partial failure with <code>Promise.allSettled</code>',
      'Take the first result with <code>race</code> or the first success with <code>any</code>',
      'Choose the right combinator for the situation'
    ],
    sections: [
      { h: 'Promise.all: everything, or nothing',
        body: '<p>Takes an array of promises, resolves with an array of values <em>in the same order</em>, and rejects the moment any one of them rejects.</p>',
        code: 'const quote = (s, ms, price) => new Promise(r => setTimeout(() => r({ s, price }), ms));\n\n(async () => {\n  console.time("all");\n  const results = await Promise.all([\n    quote("ES", 30, 5240), quote("NQ", 30, 18420), quote("CL", 30, 78)\n  ]);\n  console.timeEnd("all");   // about 30ms, not 90\n  console.log(results.map(r => r.s + " " + r.price));\n})();' },
      { h: 'Order is preserved, timing is not',
        body: '<p>The results array matches the input order regardless of which finished first. That is what makes <code>all</code> safe for a watchlist — you can zip the results back against your symbols.</p>',
        code: 'const later = (v, ms) => new Promise(r => setTimeout(() => r(v), ms));\n\nPromise.all([later("slow", 40), later("fast", 5)])\n  .then(v => console.log(v));   // ["slow", "fast"] — input order' },
      { h: 'allSettled: report everything',
        body: '<p>Never rejects. Each entry is <code>{status:"fulfilled", value}</code> or <code>{status:"rejected", reason}</code>. This is what you want for a watchlist: one dead symbol should not blank the whole screen.</p>' +
              '<div class="note note-trade"><b>Choosing between them</b>Use <code>all</code> when the results are useless individually — you need all four legs of a spread or you trade nothing. Use <code>allSettled</code> when partial data still has value.</div>',
        code: 'const q = s => s === "ZZ" ? Promise.reject(new Error("unknown " + s)) : Promise.resolve({ s, price: 100 });\n\nPromise.allSettled([q("ES"), q("ZZ"), q("NQ")]).then(results => {\n  results.forEach((r, i) => {\n    if (r.status === "fulfilled") console.log("ok:", r.value.s);\n    else console.log("failed:", r.reason.message);\n  });\n});' },
      { h: 'race and any',
        body: '<p><code>race</code> settles with the first promise to settle, success or failure — the basis of the timeout you wrote on day 44. <code>any</code> settles with the first <em>success</em>, ignoring earlier failures — useful for querying several redundant data providers.</p>',
        code: 'const slow = (v, ms) => new Promise(r => setTimeout(() => r(v), ms));\nconst failFast = ms => new Promise((_, rej) => setTimeout(() => rej(new Error("primary down")), ms));\n\nPromise.race([failFast(5), slow("backup", 30)])\n  .catch(e => console.log("race saw:", e.message));\n\nPromise.any([failFast(5), slow("backup", 30)])\n  .then(v => console.log("any got:", v));' }
    ],
    parsons: {
      prompt: 'Fetch a whole watchlist in parallel.',
      lines: [
        'const symbols = ["ES", "NQ", "CL"];',
        'const promises = symbols.map(s => fetchQuote(s));',
        'const quotes = await Promise.all(promises);',
        'console.log(quotes.length);'
      ]
    },
    exercises: [
      { id: 'e1', title: 'fetchAll()', difficulty: 'Core',
        prompt: 'Write <code>fetchAll(fetchQuote, symbols)</code> returning a Promise of the prices, in the same order as <code>symbols</code>, with every request in flight at once.<br>' +
          'If any request rejects, the whole thing should reject.',
        starter: 'async function fetchAll(fetchQuote, symbols) {\n  // parallel, order preserved\n}\n',
        solution: 'async function fetchAll(fetchQuote, symbols) {\n  const quotes = await Promise.all(symbols.map(s => fetchQuote(s)));\n  return quotes.map(q => q.price);\n}',
        hints: ['<code>symbols.map(fetchQuote)</code> starts them all; <code>Promise.all</code> waits for the set.',
                'The resolved array is in input order, so a final <code>map</code> to prices is safe.'],
        tests: { checks: [
          { name: 'returns prices in symbol order', expose: ['fetchAll'],
            run: async function (s, h) {
              var p = { ES: 5240, NQ: 18420, CL: 78 };
              var f = function (sym) { return new Promise(function (r) { setTimeout(function () { r({ price: p[sym] }); }, sym === 'ES' ? 30 : 1); }); };
              var out = await s.fetchAll(f, ['ES', 'NQ', 'CL']);
              return h.eq(out, [5240, 18420, 78]) ? true : 'got ' + JSON.stringify(out) + ' — order must match the input';
            } },
          { name: 'runs them in parallel', expose: ['fetchAll'],
            run: async function (s) {
              var live = 0, maxLive = 0;
              var f = function () {
                live++; maxLive = Math.max(maxLive, live);
                return new Promise(function (r) { setTimeout(function () { live--; r({ price: 1 }); }, 20); });
              };
              await s.fetchAll(f, ['A', 'B', 'C']);
              return maxLive === 3 ? true : 'only ' + maxLive + ' request(s) were in flight at once';
            } },
          { name: 'rejects if any symbol fails', expose: ['fetchAll'],
            run: async function (s) {
              var f = function (sym) { return sym === 'BAD' ? Promise.reject(new Error('x')) : Promise.resolve({ price: 1 }); };
              try { await s.fetchAll(f, ['A', 'BAD']); } catch (e) { return true; }
              return 'a failing symbol should reject the whole call';
            } },
          { name: 'an empty list resolves with []', expose: ['fetchAll'],
            run: async function (s, h) {
              var out = await s.fetchAll(function () { return Promise.resolve({ price: 1 }); }, []);
              return h.eq(out, []) ? true : 'got ' + JSON.stringify(out);
            } }
        ] } },
      { id: 'e2', title: 'fetchWatchlist()', difficulty: 'Core',
        prompt: 'Write <code>fetchWatchlist(fetchQuote, symbols)</code> returning a Promise of <code>{ quotes, failures }</code>:<ul>' +
          '<li><code>quotes</code> — an object mapping symbol to price, for the ones that succeeded</li>' +
          '<li><code>failures</code> — an array of <code>{ symbol, reason }</code> where <code>reason</code> is the error message</li></ul>' +
          'It must never reject, even if every symbol fails.',
        starter: 'async function fetchWatchlist(fetchQuote, symbols) {\n  // survive partial failure\n}\n',
        solution: 'async function fetchWatchlist(fetchQuote, symbols) {\n  const settled = await Promise.allSettled(symbols.map(s => fetchQuote(s)));\n  const quotes = {}, failures = [];\n  settled.forEach((r, i) => {\n    if (r.status === "fulfilled") quotes[symbols[i]] = r.value.price;\n    else failures.push({ symbol: symbols[i], reason: r.reason.message });\n  });\n  return { quotes, failures };\n}',
        hints: ['<code>Promise.allSettled</code> never rejects — every entry reports its own outcome.',
                'The results are in input order, so the index maps straight back to <code>symbols[i]</code>.'],
        tests: { checks: [
          { name: 'collects successes and failures separately', expose: ['fetchWatchlist'],
            run: async function (s, h) {
              var f = function (sym) {
                return sym === 'ZZ' ? Promise.reject(new Error('unknown ZZ')) : Promise.resolve({ price: 100 });
              };
              var r = await s.fetchWatchlist(f, ['ES', 'ZZ', 'NQ']);
              if (!h.eq(r.quotes, { ES: 100, NQ: 100 })) return 'quotes were ' + JSON.stringify(r.quotes);
              return h.eq(r.failures, [{ symbol: 'ZZ', reason: 'unknown ZZ' }])
                ? true : 'failures were ' + JSON.stringify(r.failures);
            } },
          { name: 'never rejects even when everything fails', expose: ['fetchWatchlist'],
            run: async function (s) {
              var f = function () { return Promise.reject(new Error('down')); };
              var r;
              try { r = await s.fetchWatchlist(f, ['A', 'B']); } catch (e) { return 'it rejected — use allSettled'; }
              return r.failures.length === 2 ? true : 'expected 2 failures, got ' + r.failures.length;
            } },
          { name: 'all-success gives an empty failures array', expose: ['fetchWatchlist'],
            run: async function (s, h) {
              var r = await s.fetchWatchlist(function () { return Promise.resolve({ price: 5 }); }, ['A']);
              return (h.eq(r.quotes, { A: 5 }) && h.eq(r.failures, [])) ? true : 'got ' + JSON.stringify(r);
            } },
          { name: 'an empty watchlist is handled', expose: ['fetchWatchlist'],
            run: async function (s, h) {
              var r = await s.fetchWatchlist(function () { return Promise.resolve({ price: 1 }); }, []);
              return (h.eq(r.quotes, {}) && h.eq(r.failures, [])) ? true : 'got ' + JSON.stringify(r);
            } }
        ] } },
      { id: 'e3', title: 'firstAvailable()', difficulty: 'Stretch',
        prompt: 'You have several redundant data providers. Write <code>firstAvailable(providers, symbol)</code> where <code>providers</code> is an array of functions each returning a Promise of a quote.<br>' +
          'Return a Promise of the <strong>first successful</strong> quote, ignoring providers that fail. If they all fail, reject with <code>new Error("all providers failed")</code>.<br>' +
          'All providers should be tried at once, not one after another.',
        starter: 'function firstAvailable(providers, symbol) {\n  // first success wins; all failing is an error\n}\n',
        solution: 'function firstAvailable(providers, symbol) {\n  if (!providers.length) return Promise.reject(new Error("all providers failed"));\n  return Promise.any(providers.map(p => p(symbol)))\n    .catch(() => { throw new Error("all providers failed"); });\n}',
        hints: ['<code>Promise.any</code> resolves with the first success and only rejects when every input rejects.',
                'Catch its <code>AggregateError</code> and rethrow your own message.',
                'Guard the empty-providers case, which <code>Promise.any</code> also rejects.'],
        tests: { checks: [
          { name: 'returns the first successful quote', expose: ['firstAvailable'],
            run: async function (s) {
              var fast = function () { return new Promise(function (r) { setTimeout(function () { r({ price: 42 }); }, 5); }); };
              var slow = function () { return new Promise(function (r) { setTimeout(function () { r({ price: 99 }); }, 50); }); };
              var q = await s.firstAvailable([slow, fast], 'ES');
              return q.price === 42 ? true : 'expected the faster provider to win, got ' + JSON.stringify(q);
            } },
          { name: 'ignores providers that reject', expose: ['firstAvailable'],
            run: async function (s) {
              var bad = function () { return Promise.reject(new Error('down')); };
              var good = function () { return new Promise(function (r) { setTimeout(function () { r({ price: 7 }); }, 10); }); };
              var q = await s.firstAvailable([bad, good], 'ES');
              return q.price === 7 ? true : 'got ' + JSON.stringify(q);
            } },
          { name: 'rejects with a clear message when all fail', expose: ['firstAvailable'],
            run: async function (s) {
              var bad = function () { return Promise.reject(new Error('down')); };
              try { await s.firstAvailable([bad, bad], 'ES'); } catch (e) {
                return e.message === 'all providers failed' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'should have rejected';
            } },
          { name: 'rejects when given no providers', expose: ['firstAvailable'],
            run: async function (s) {
              try { await s.firstAvailable([], 'ES'); } catch (e) {
                return e.message === 'all providers failed' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'an empty provider list should reject';
            } },
          { name: 'tries providers concurrently', expose: ['firstAvailable'],
            run: async function (s) {
              var live = 0, maxLive = 0;
              var mk = function (ms) {
                return function () {
                  live++; maxLive = Math.max(maxLive, live);
                  return new Promise(function (r) { setTimeout(function () { live--; r({ price: 1 }); }, ms); });
                };
              };
              await s.firstAvailable([mk(30), mk(5)], 'ES');
              return maxLive === 2 ? true : 'providers were tried one at a time';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Three promises are passed to <code>Promise.all</code> and the second rejects. What happens?',
        options: ['You get two results', 'The whole thing rejects immediately', 'It waits for all three then rejects', 'The rejection is ignored'],
        answer: 1,
        explain: 'It rejects as soon as any input does. Results from the others are discarded.' },
      { q: 'Which combinator never rejects?',
        options: ['<code>all</code>', '<code>race</code>', '<code>allSettled</code>', '<code>any</code>'],
        answer: 2,
        explain: 'Every entry reports its own outcome, so partial data survives — the right choice for a watchlist.' },
      { q: 'What is the difference between <code>race</code> and <code>any</code>?',
        options: ['None', '<code>race</code> takes the first to settle; <code>any</code> takes the first to <em>succeed</em>', '<code>any</code> is faster', '<code>race</code> only works on two'],
        answer: 1,
        explain: 'An early rejection settles a <code>race</code> but is ignored by <code>any</code>, which keeps waiting for a success.' }
    ],
    recap: [
      '<code>Promise.all</code> is parallel, order-preserving, and all-or-nothing.',
      '<code>allSettled</code> reports every outcome and never rejects.',
      '<code>race</code> takes the first to settle; <code>any</code> the first to succeed.',
      'Pick by asking whether partial results are still useful.'
    ],
    vocab: [
      { term: 'Watchlist', def: 'The set of instruments a trader monitors at once. Fetching one quote per symbol is the classic fan-out.' },
      { term: 'Redundant feed', def: 'A second data provider used when the primary fails. Whoever answers first wins.' }
    ]
  });

  C.push({
    id: 'd048', day: 48, module: 4, minutes: 30,
    title: 'Retries and Exponential Backoff',
    subtitle: 'Surviving a flaky connection without making it worse.',
    goal: '<b>Goal:</b> retry a failed request intelligently — backing off, adding jitter, and giving up on errors that will never succeed.',
    objectives: [
      'Retry an async operation a bounded number of times',
      'Grow the delay exponentially between attempts',
      'Add jitter to avoid synchronised retry storms',
      'Distinguish retryable from permanent failures'
    ],
    sections: [
      { h: 'A naive retry loop',
        body: '<p>Try, and on failure try again — but always with a cap, and always rethrowing the last error so a persistent failure is not hidden as a success.</p>',
        code: 'const delay = ms => new Promise(r => setTimeout(r, ms));\n\nasync function retry(fn, attempts) {\n  let lastError;\n  for (let i = 0; i < attempts; i++) {\n    try { return await fn(i); }\n    catch (e) { lastError = e; console.log(`attempt ${i + 1} failed: ${e.message}`); }\n  }\n  throw lastError;\n}\n\nlet n = 0;\nretry(() => (++n < 3 ? Promise.reject(new Error("timeout")) : Promise.resolve("ok")), 5)\n  .then(v => console.log("succeeded with", v, "after", n, "attempts"));' },
      { h: 'Backoff: wait longer each time',
        body: '<p>Retrying immediately hammers a service that is already struggling. Doubling the delay each time — 100ms, 200ms, 400ms — gives it room to recover.</p>',
        code: 'for (let attempt = 0; attempt < 5; attempt++) {\n  console.log(`attempt ${attempt}: wait ${100 * Math.pow(2, attempt)}ms`);\n}' },
      { h: 'Jitter stops the thundering herd',
        body: '<p>If a thousand clients all lose the connection at once and all back off by exactly the same schedule, they all return at exactly the same moment and knock the service over again. Randomising the delay spreads them out.</p>' +
              '<div class="note note-warn"><b>Full jitter</b>The usual recipe is <code>random() × min(cap, base × 2^attempt)</code>. Deterministic backoff synchronises clients; jitter is what actually protects the service.</div>',
        code: 'const base = 100, cap = 2000;\nfor (let a = 0; a < 5; a++) {\n  const window = Math.min(cap, base * Math.pow(2, a));\n  console.log(`attempt ${a}: up to ${window}ms (jittered)`);\n}' },
      { h: 'Not everything should be retried',
        body: '<p>A 500 or a timeout may well succeed on the next try. A 401 (bad credentials) or a 400 (malformed request) will fail identically forever — retrying just wastes time and rate-limit budget.</p>',
        code: 'function isRetryable(status) {\n  if (status === 429) return true;          // rate limited — back off and retry\n  if (status >= 500) return true;           // server-side, probably transient\n  return false;                             // 4xx: our fault, retrying will not help\n}\n\n[400, 401, 404, 429, 500, 503].forEach(s =>\n  console.log(s, isRetryable(s) ? "retry" : "give up"));' }
    ],
    parsons: {
      prompt: 'Compute an exponentially growing, capped delay.',
      lines: [
        'function backoff(attempt, base, cap) {',
        '  const raw = base * Math.pow(2, attempt);',
        '  return Math.min(cap, raw);',
        '}',
        'console.log(backoff(0, 100, 2000), backoff(5, 100, 2000));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'backoffDelay()', difficulty: 'Core',
        prompt: 'Write <code>backoffDelay(attempt, base, cap)</code> returning <code>base × 2^attempt</code>, capped at <code>cap</code>.<br>' +
          '<code>attempt</code> starts at 0. A negative attempt should return <code>base</code>.',
        starter: 'function backoffDelay(attempt, base, cap) {\n  // exponential growth, capped\n}\n',
        solution: 'function backoffDelay(attempt, base, cap) {\n  if (attempt < 0) return base;\n  return Math.min(cap, base * Math.pow(2, attempt));\n}',
        hints: ['<code>Math.pow(2, attempt)</code> doubles each time; <code>Math.min</code> applies the cap.',
                'Guard the negative case before the exponent.'],
        tests: { fn: 'backoffDelay', cases: [
          { args: [0, 100, 2000], expect: 100 },
          { args: [1, 100, 2000], expect: 200 },
          { args: [4, 100, 2000], expect: 1600 },
          { args: [5, 100, 2000], expect: 2000, name: 'the cap applies' },
          { args: [20, 100, 2000], expect: 2000 },
          { args: [-1, 100, 2000], expect: 100, name: 'a negative attempt returns the base' }
        ] } },
      { id: 'e2', title: 'retry()', difficulty: 'Core',
        prompt: 'Write <code>retry(fn, attempts)</code>:<ul>' +
          '<li>calls <code>await fn(i)</code> with the zero-based attempt number</li>' +
          '<li>returns the first successful result</li>' +
          '<li>after <code>attempts</code> failures, throws the <strong>last</strong> error</li>' +
          '<li>never calls <code>fn</code> more than <code>attempts</code> times</li></ul>',
        starter: 'async function retry(fn, attempts) {\n  // retry up to `attempts` times, rethrow the last error\n}\n',
        solution: 'async function retry(fn, attempts) {\n  let lastError;\n  for (let i = 0; i < attempts; i++) {\n    try { return await fn(i); }\n    catch (e) { lastError = e; }\n  }\n  throw lastError;\n}',
        hints: ['A <code>for</code> loop with try/catch inside; <code>return</code> on the first success.',
                'Keep the most recent error in a variable so it can be thrown after the loop.'],
        tests: { checks: [
          { name: 'returns the first success', expose: ['retry'],
            run: async function (s) {
              var n = 0;
              var v = await s.retry(function () { return ++n < 3 ? Promise.reject(new Error('x')) : Promise.resolve('ok'); }, 5);
              if (v !== 'ok') return 'got ' + JSON.stringify(v);
              return n === 3 ? true : 'fn was called ' + n + ' times, expected 3';
            } },
          { name: 'throws the last error after exhausting attempts', expose: ['retry'],
            run: async function (s) {
              var n = 0;
              try {
                await s.retry(function (i) { n++; return Promise.reject(new Error('fail ' + i)); }, 3);
              } catch (e) {
                if (n !== 3) return 'fn was called ' + n + ' times, expected exactly 3';
                return e.message === 'fail 2' ? true : 'expected the last error, got ' + JSON.stringify(e.message);
              }
              return 'should have thrown';
            } },
          { name: 'passes the attempt number to fn', expose: ['retry'],
            run: async function (s) {
              var seen = [];
              try { await s.retry(function (i) { seen.push(i); return Promise.reject(new Error('x')); }, 3); } catch (e) {}
              return (seen.join(',') === '0,1,2') ? true : 'fn saw attempts ' + JSON.stringify(seen);
            } },
          { name: 'a first-try success calls fn once', expose: ['retry'],
            run: async function (s) {
              var n = 0;
              await s.retry(function () { n++; return Promise.resolve(1); }, 5);
              return n === 1 ? true : 'fn was called ' + n + ' times';
            } }
        ] } },
      { id: 'e3', title: 'retryWithBackoff()', difficulty: 'Stretch',
        prompt: 'Write <code>retryWithBackoff(fn, options)</code> where options are <code>{ attempts, base, cap, sleep, shouldRetry }</code>:<ul>' +
          '<li><code>sleep(ms)</code> — an injected async delay, so tests need not really wait</li>' +
          '<li><code>shouldRetry(error)</code> — when it returns false, throw immediately without retrying</li>' +
          '<li>between attempts, <code>await sleep(base × 2^attempt)</code>, capped at <code>cap</code></li>' +
          '<li>no sleep after the final failed attempt</li></ul>',
        starter: 'async function retryWithBackoff(fn, options) {\n  const { attempts, base, cap, sleep, shouldRetry } = options;\n  // retry with capped exponential backoff\n}\n',
        solution: 'async function retryWithBackoff(fn, options) {\n  const { attempts, base, cap, sleep, shouldRetry } = options;\n  let lastError;\n  for (let i = 0; i < attempts; i++) {\n    try { return await fn(i); }\n    catch (e) {\n      lastError = e;\n      if (!shouldRetry(e)) throw e;\n      if (i < attempts - 1) await sleep(Math.min(cap, base * Math.pow(2, i)));\n    }\n  }\n  throw lastError;\n}',
        hints: ['Check <code>shouldRetry</code> before sleeping — a permanent error should not cost a delay.',
                'Only sleep when another attempt will follow: <code>if (i &lt; attempts - 1)</code>.',
                'Reuse the capped exponential formula from the first exercise.'],
        tests: { checks: [
          { name: 'sleeps with capped exponential delays', expose: ['retryWithBackoff'],
            run: async function (s, h) {
              var slept = [];
              try {
                await s.retryWithBackoff(function () { return Promise.reject(new Error('x')); }, {
                  attempts: 4, base: 100, cap: 300,
                  sleep: function (ms) { slept.push(ms); return Promise.resolve(); },
                  shouldRetry: function () { return true; }
                });
              } catch (e) {}
              return h.eq(slept, [100, 200, 300]) ? true : 'sleep was called with ' + JSON.stringify(slept);
            } },
          { name: 'does not sleep after the final attempt', expose: ['retryWithBackoff'],
            run: async function (s) {
              var n = 0;
              try {
                await s.retryWithBackoff(function () { return Promise.reject(new Error('x')); }, {
                  attempts: 2, base: 10, cap: 100,
                  sleep: function () { n++; return Promise.resolve(); },
                  shouldRetry: function () { return true; }
                });
              } catch (e) {}
              return n === 1 ? true : 'sleep was called ' + n + ' times for 2 attempts, expected 1';
            } },
          { name: 'a non-retryable error throws at once', expose: ['retryWithBackoff'],
            run: async function (s) {
              var calls = 0, slept = 0;
              try {
                await s.retryWithBackoff(function () { calls++; return Promise.reject(new Error('401')); }, {
                  attempts: 5, base: 10, cap: 100,
                  sleep: function () { slept++; return Promise.resolve(); },
                  shouldRetry: function (e) { return e.message !== '401'; }
                });
              } catch (e) {
                if (calls !== 1) return 'fn was called ' + calls + ' times for a permanent error';
                return slept === 0 ? true : 'it slept before giving up on a permanent error';
              }
              return 'should have thrown';
            } },
          { name: 'returns the first success without sleeping', expose: ['retryWithBackoff'],
            run: async function (s) {
              var slept = 0;
              var v = await s.retryWithBackoff(function () { return Promise.resolve('ok'); }, {
                attempts: 3, base: 10, cap: 100,
                sleep: function () { slept++; return Promise.resolve(); },
                shouldRetry: function () { return true; }
              });
              return (v === 'ok' && slept === 0) ? true : 'got ' + v + ' after ' + slept + ' sleeps';
            } },
          { name: 'recovers on a later attempt', expose: ['retryWithBackoff'],
            run: async function (s) {
              var n = 0;
              var v = await s.retryWithBackoff(function () {
                return ++n < 3 ? Promise.reject(new Error('503')) : Promise.resolve('recovered');
              }, {
                attempts: 5, base: 1, cap: 10,
                sleep: function () { return Promise.resolve(); },
                shouldRetry: function () { return true; }
              });
              return v === 'recovered' ? true : 'got ' + JSON.stringify(v);
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why grow the delay between retries?',
        options: ['To look busy', 'Immediate retries hammer a service that is already struggling', 'To avoid rate limits only', 'It is arbitrary'],
        answer: 1,
        explain: 'Backoff gives the far side room to recover instead of adding load at exactly the wrong moment.' },
      { q: 'What problem does jitter solve?',
        options: ['Clock drift', 'Many clients retrying in lockstep and re-overloading the service', 'Floating-point error', 'Nothing'],
        answer: 1,
        explain: 'Identical backoff schedules synchronise every client. Randomising spreads the returning load out.' },
      { q: 'Which failure is worth retrying?',
        options: ['401 unauthorized', '400 bad request', '503 service unavailable', '404 not found'],
        answer: 2,
        explain: '5xx and 429 are usually transient. 4xx means the request itself is wrong and will fail identically forever.' }
    ],
    recap: [
      'Bound every retry loop and rethrow the last error.',
      'Grow the delay exponentially, capped at a maximum.',
      'Add jitter so clients do not return in lockstep.',
      'Do not retry errors that cannot succeed.'
    ],
    vocab: [
      { term: 'Thundering herd', def: 'Many clients hitting a recovering service simultaneously and knocking it back down. Jittered backoff is the standard defence.' },
      { term: '429 Too Many Requests', def: 'The rate-limit response. Retryable, but only after waiting — often for the duration the response itself specifies.' }
    ]
  });

  C.push({
    id: 'd049', day: 49, module: 4, minutes: 30,
    title: 'Rate Limits and Concurrency Control',
    subtitle: 'Staying inside the quota while still going fast.',
    goal: '<b>Goal:</b> fetch hundreds of symbols without exceeding an API\'s concurrency or request-rate limits.',
    objectives: [
      'Explain why unbounded parallelism fails',
      'Run a task list with a fixed worker pool',
      'Preserve result order under concurrency',
      'Space requests to respect a per-second quota'
    ],
    sections: [
      { h: 'Promise.all over 500 symbols is a denial-of-service attack',
        body: '<p>Mapping <code>fetch</code> over a large list starts every request at once. Browsers cap connections per host, servers cap concurrent requests, and providers cap requests per second. Exceeding any of them turns fast into failed.</p>',
        code: 'const symbols = Array.from({ length: 12 }, (_, i) => "SYM" + i);\nconsole.log("naive:", symbols.length, "requests started simultaneously");\nconsole.log("a real provider would answer most of them with 429");' },
      { h: 'A worker pool',
        body: '<p>Start <em>n</em> workers. Each takes the next unclaimed task, does it, and comes back for another until the queue is empty. Concurrency stays at exactly <em>n</em>, whatever the list length.</p>',
        code: 'async function pool(tasks, limit) {\n  const results = new Array(tasks.length);\n  let next = 0;\n  async function worker() {\n    while (next < tasks.length) {\n      const i = next++;               // claim an index\n      results[i] = await tasks[i]();\n    }\n  }\n  await Promise.all(Array.from({ length: limit }, worker));\n  return results;\n}\n\nconst mk = (n) => () => new Promise(r => setTimeout(() => r(n * 2), 10));\npool([mk(1), mk(2), mk(3), mk(4), mk(5)], 2).then(r => console.log(r));' },
      { h: 'Keep the index, keep the order',
        body: '<p>Workers finish out of order. Writing into <code>results[i]</code> using the claimed index keeps the output aligned with the input — pushing as they complete would scramble it.</p>' +
              '<div class="note note-warn"><b>Tasks, not promises</b>The pool takes an array of <em>functions</em>. An array of promises would already be running — the work starts the moment the promise is created, so there would be nothing left to limit.</div>' },
      { h: 'Rate limiting is a different constraint',
        body: '<p>Concurrency caps how many run at once; a rate limit caps how many <em>start</em> per unit time. Ten fast requests can satisfy a concurrency limit of 2 and still breach "5 requests per second".</p>',
        code: 'function schedule(count, perSecond) {\n  const gap = 1000 / perSecond;\n  for (let i = 0; i < count; i++) {\n    console.log(`request ${i} at t+${Math.round(i * gap)}ms`);\n  }\n}\nschedule(6, 5);' }
    ],
    parsons: {
      prompt: 'Claim an index, run the task, keep the order.',
      lines: [
        'async function worker() {',
        '  while (next < tasks.length) {',
        '    const i = next++;',
        '    results[i] = await tasks[i]();',
        '  }',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'pool()', difficulty: 'Core',
        prompt: 'Write <code>pool(tasks, limit)</code> where <code>tasks</code> is an array of functions returning promises.<br>' +
          'Run them with at most <code>limit</code> in flight at any moment, and resolve with the results <strong>in task order</strong>.',
        starter: 'async function pool(tasks, limit) {\n  // bounded-concurrency runner\n}\n',
        solution: 'async function pool(tasks, limit) {\n  const results = new Array(tasks.length);\n  let next = 0;\n  async function worker() {\n    while (next < tasks.length) {\n      const i = next++;\n      results[i] = await tasks[i]();\n    }\n  }\n  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));\n  return results;\n}',
        hints: ['Share a <code>next</code> counter between workers; each claims an index before awaiting.',
                'Write into <code>results[i]</code> rather than pushing, so order survives.',
                'Start <code>Math.min(limit, tasks.length)</code> workers so a short list does not spawn idle ones.'],
        tests: { checks: [
          { name: 'returns results in task order', expose: ['pool'],
            run: async function (s, h) {
              var mk = function (n, ms) { return function () { return new Promise(function (r) { setTimeout(function () { r(n); }, ms); }); }; };
              var out = await s.pool([mk(1, 30), mk(2, 5), mk(3, 15)], 3);
              return h.eq(out, [1, 2, 3]) ? true : 'got ' + JSON.stringify(out) + ' — order must match the input';
            } },
          { name: 'never exceeds the concurrency limit', expose: ['pool'],
            run: async function (s) {
              var live = 0, maxLive = 0;
              var mk = function () {
                return function () {
                  live++; maxLive = Math.max(maxLive, live);
                  return new Promise(function (r) { setTimeout(function () { live--; r(1); }, 10); });
                };
              };
              var tasks = [];
              for (var i = 0; i < 8; i++) tasks.push(mk());
              await s.pool(tasks, 3);
              return maxLive <= 3 ? true : maxLive + ' tasks ran at once, limit was 3';
            } },
          { name: 'actually uses the available concurrency', expose: ['pool'],
            run: async function (s) {
              var live = 0, maxLive = 0;
              var mk = function () {
                return function () {
                  live++; maxLive = Math.max(maxLive, live);
                  return new Promise(function (r) { setTimeout(function () { live--; r(1); }, 20); });
                };
              };
              var tasks = [];
              for (var i = 0; i < 6; i++) tasks.push(mk());
              await s.pool(tasks, 3);
              return maxLive === 3 ? true : 'only ' + maxLive + ' ran at once — the pool is not filling up';
            } },
          { name: 'runs every task exactly once', expose: ['pool'],
            run: async function (s) {
              var counts = {};
              var tasks = [];
              for (var i = 0; i < 7; i++) {
                (function (n) {
                  tasks.push(function () { counts[n] = (counts[n] || 0) + 1; return Promise.resolve(n); });
                })(i);
              }
              await s.pool(tasks, 2);
              for (var k = 0; k < 7; k++) if (counts[k] !== 1) return 'task ' + k + ' ran ' + counts[k] + ' times';
              return true;
            } },
          { name: 'an empty task list resolves with []', expose: ['pool'],
            run: async function (s, h) {
              var out = await s.pool([], 3);
              return h.eq(out, []) ? true : 'got ' + JSON.stringify(out);
            } }
        ] } },
      { id: 'e2', title: 'requestSchedule()', difficulty: 'Core',
        prompt: 'Write <code>requestSchedule(count, perSecond)</code> returning an array of start times in milliseconds, evenly spaced so no more than <code>perSecond</code> requests start in any one second.<br>' +
          'The first request starts at <code>0</code>. Round each time to the nearest whole millisecond.<br>' +
          '<code>requestSchedule(4, 5)</code> → <code>[0, 200, 400, 600]</code>',
        starter: 'function requestSchedule(count, perSecond) {\n  // evenly spaced start times\n}\n',
        solution: 'function requestSchedule(count, perSecond) {\n  const gap = 1000 / perSecond;\n  return Array.from({ length: count }, (_, i) => Math.round(i * gap));\n}',
        hints: ['The gap between starts is <code>1000 / perSecond</code> milliseconds.',
                '<code>Array.from({length: count}, (_, i) =&gt; ...)</code> builds the list from the index.'],
        tests: { fn: 'requestSchedule', cases: [
          { args: [4, 5], expect: [0, 200, 400, 600] },
          { args: [3, 2], expect: [0, 500, 1000] },
          { args: [1, 10], expect: [0] },
          { args: [0, 5], expect: [] },
          { args: [4, 3], expect: [0, 333, 667, 1000], name: 'times are rounded to whole milliseconds' }
        ] } },
      { id: 'e3', title: 'fetchThrottled()', difficulty: 'Stretch',
        prompt: 'Combine both constraints. Write <code>fetchThrottled(symbols, fetchQuote, options)</code> with <code>options = { concurrency, sleep, minGapMs }</code>:<ul>' +
          '<li>at most <code>concurrency</code> fetches in flight</li>' +
          '<li><code>await sleep(minGapMs)</code> before <em>every</em> fetch after the first one started, so starts are spaced out</li>' +
          '<li>resolve with prices in symbol order</li>' +
          '<li>a symbol whose fetch rejects contributes <code>null</code></li></ul>',
        starter: 'async function fetchThrottled(symbols, fetchQuote, options) {\n  const { concurrency, sleep, minGapMs } = options;\n  // bounded concurrency + spaced starts\n}\n',
        solution: 'async function fetchThrottled(symbols, fetchQuote, options) {\n  const { concurrency, sleep, minGapMs } = options;\n  const results = new Array(symbols.length);\n  let next = 0, started = 0;\n  async function worker() {\n    while (next < symbols.length) {\n      const i = next++;\n      if (started++ > 0) await sleep(minGapMs);\n      try { results[i] = (await fetchQuote(symbols[i])).price; }\n      catch (e) { results[i] = null; }\n    }\n  }\n  await Promise.all(Array.from({ length: Math.min(concurrency, symbols.length) }, worker));\n  return results;\n}',
        hints: ['Start from the worker-pool shape and add the spacing inside the loop.',
                'Track how many have started; skip the sleep only for the very first.',
                'Wrap each fetch in try/catch so one bad symbol becomes <code>null</code> rather than killing the run.'],
        tests: { checks: [
          { name: 'returns prices in symbol order', expose: ['fetchThrottled'],
            run: async function (s, h) {
              var p = { A: 1, B: 2, C: 3 };
              var f = function (sym) { return new Promise(function (r) { setTimeout(function () { r({ price: p[sym] }); }, sym === 'A' ? 20 : 1); }); };
              var out = await s.fetchThrottled(['A', 'B', 'C'], f, { concurrency: 3, sleep: function () { return Promise.resolve(); }, minGapMs: 0 });
              return h.eq(out, [1, 2, 3]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'respects the concurrency limit', expose: ['fetchThrottled'],
            run: async function (s) {
              var live = 0, maxLive = 0;
              var f = function () {
                live++; maxLive = Math.max(maxLive, live);
                return new Promise(function (r) { setTimeout(function () { live--; r({ price: 1 }); }, 10); });
              };
              await s.fetchThrottled(['A', 'B', 'C', 'D', 'E'], f, { concurrency: 2, sleep: function () { return Promise.resolve(); }, minGapMs: 0 });
              return maxLive <= 2 ? true : maxLive + ' fetches ran at once, limit was 2';
            } },
          { name: 'spaces the starts', expose: ['fetchThrottled'],
            run: async function (s) {
              var sleeps = 0;
              var f = function () { return Promise.resolve({ price: 1 }); };
              await s.fetchThrottled(['A', 'B', 'C', 'D'], f, {
                concurrency: 2, sleep: function () { sleeps++; return Promise.resolve(); }, minGapMs: 50
              });
              return sleeps === 3 ? true : 'sleep was called ' + sleeps + ' times for 4 symbols, expected 3';
            } },
          { name: 'a failing symbol becomes null', expose: ['fetchThrottled'],
            run: async function (s, h) {
              var f = function (sym) { return sym === 'BAD' ? Promise.reject(new Error('x')) : Promise.resolve({ price: 9 }); };
              var out = await s.fetchThrottled(['A', 'BAD', 'C'], f, { concurrency: 2, sleep: function () { return Promise.resolve(); }, minGapMs: 0 });
              return h.eq(out, [9, null, 9]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'an empty symbol list resolves with []', expose: ['fetchThrottled'],
            run: async function (s, h) {
              var out = await s.fetchThrottled([], function () { return Promise.resolve({ price: 1 }); },
                { concurrency: 3, sleep: function () { return Promise.resolve(); }, minGapMs: 10 });
              return h.eq(out, []) ? true : 'got ' + JSON.stringify(out);
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why does a worker pool take functions rather than promises?',
        options: ['Functions are faster', 'A promise has already started, so there would be nothing left to limit', 'Promises cannot be stored', 'To allow retries'],
        answer: 1,
        explain: 'Work begins when the promise is created. Deferring creation into a function is what makes throttling possible.' },
      { q: 'Why write into <code>results[i]</code> instead of pushing?',
        options: ['Push is slower', 'Workers finish out of order, so pushing scrambles the alignment with the input', 'Push does not work on arrays', 'No reason'],
        answer: 1,
        explain: 'The claimed index is the only reliable link between a result and the symbol that produced it.' },
      { q: 'How does a rate limit differ from a concurrency limit?',
        options: ['They are the same', 'Concurrency caps how many run at once; a rate limit caps how many start per unit time', 'Rate limits only apply to POST', 'Concurrency is per user'],
        answer: 1,
        explain: 'Two fast requests repeated ten times a second satisfy a concurrency limit of 2 and still breach "5 per second".' }
    ],
    recap: [
      'Unbounded parallelism triggers connection caps and 429s.',
      'A worker pool holds concurrency at a fixed number.',
      'Claim an index before awaiting so results stay ordered.',
      'Concurrency and request rate are separate limits and need separate handling.'
    ],
    vocab: [
      { term: 'Rate limit', def: 'A cap on requests per interval, enforced by the provider. Exceeding it returns 429 and often costs a cooldown.' },
      { term: 'Backpressure', def: 'Slowing producers when consumers cannot keep up — the general form of the problem a worker pool solves.' }
    ]
  });


  C.push({
    id: 'd050', day: 50, module: 4, minutes: 35, boss: true,
    title: 'Boss: The Market Data Client',
    subtitle: 'Validation, retries, caching and concurrency in one component.',
    goal: '<b>Goal:</b> build the client every trading application needs — one that keeps working when the network does not.',
    objectives: [
      'Layer validation, retry and caching into one class',
      'Deduplicate requests that are already in flight',
      'Serve stale data rather than nothing when the feed is down',
      'Expose a small, honest interface'
    ],
    sections: [
      { h: 'What a real client does beyond calling fetch',
        body: '<ol><li><strong>Validates</strong> the response before anyone downstream sees it.</li>' +
              '<li><strong>Retries</strong> transient failures with backoff.</li>' +
              '<li><strong>Caches</strong> so the same bar is not requested twice a second.</li>' +
              '<li><strong>Deduplicates</strong> concurrent requests for the same key.</li>' +
              '<li><strong>Degrades</strong> — returns stale data with a warning rather than throwing.</li></ol>' +
              '<p>Every one of these is a technique you already have. This level is about assembling them.</p>' },
      { h: 'In-flight deduplication',
        body: '<p>Three components ask for ES bars in the same tick. Without deduplication that is three identical requests. Store the <em>promise</em> in a map keyed by request, and hand the same promise to every caller.</p>',
        code: 'function makeDeduper(load) {\n  const inFlight = new Map();\n  return key => {\n    if (inFlight.has(key)) return inFlight.get(key);\n    const p = load(key).finally(() => inFlight.delete(key));\n    inFlight.set(key, p);\n    return p;\n  };\n}\n\nlet calls = 0;\nconst load = k => { calls++; return new Promise(r => setTimeout(() => r(k + "!"), 20)); };\nconst get = makeDeduper(load);\n\nPromise.all([get("ES"), get("ES"), get("ES")])\n  .then(v => console.log(v, "underlying calls:", calls));' },
      { h: 'Cache entries need an age',
        body: '<p>A cache without expiry serves yesterday\'s close forever. Store the timestamp alongside the value and decide, on read, whether it is still fresh enough.</p>',
        code: 'const cache = new Map();\nfunction put(key, value) { cache.set(key, { value, at: Date.now() }); }\nfunction get(key, maxAgeMs) {\n  const e = cache.get(key);\n  if (!e) return { hit: false };\n  const age = Date.now() - e.at;\n  return { hit: true, value: e.value, age, fresh: age <= maxAgeMs };\n}\n\nput("ES", 5240.25);\nconsole.log(get("ES", 1000));\nconsole.log(get("NQ", 1000));' },
      { h: 'Degrade, do not disappear',
        body: '<div class="note note-trade"><b>Stale beats nothing — if it is labelled</b>A trading screen showing a price from 4 seconds ago marked "stale" is useful. The same screen showing it as live is dangerous, and showing nothing at all is useless. Always return the age with the value and let the caller decide.</div>' }
    ],
    parsons: {
      prompt: 'Deduplicate concurrent requests for the same key.',
      lines: [
        'const inFlight = new Map();',
        'function get(key) {',
        '  if (inFlight.has(key)) return inFlight.get(key);',
        '  const p = load(key).finally(() => inFlight.delete(key));',
        '  inFlight.set(key, p);',
        '  return p;',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeCache()', difficulty: 'Boss · part 1',
        prompt: 'Write <code>makeCache(now)</code> where <code>now</code> is an injected function returning the current time in milliseconds.<br>' +
          'It returns an object with:<ul>' +
          '<li><code>set(key, value)</code> — stores the value with the current time</li>' +
          '<li><code>get(key, maxAgeMs)</code> — returns <code>null</code> when the key is absent, otherwise <code>{ value, age, fresh }</code> where <code>fresh</code> is <code>age &lt;= maxAgeMs</code></li>' +
          '<li><code>size()</code> — how many entries are stored</li></ul>',
        expose: ['makeCache'],
        starter: 'function makeCache(now) {\n  // return { set, get, size }\n}\n',
        solution: 'function makeCache(now) {\n  const store = new Map();\n  return {\n    set(key, value) { store.set(key, { value, at: now() }); },\n    get(key, maxAgeMs) {\n      const e = store.get(key);\n      if (!e) return null;\n      const age = now() - e.at;\n      return { value: e.value, age, fresh: age <= maxAgeMs };\n    },\n    size() { return store.size; }\n  };\n}',
        hints: ['Keep a <code>Map</code> in the closure holding <code>{ value, at }</code> entries.',
                'Injecting <code>now</code> means a test can move time forward without waiting.'],
        tests: { checks: [
          { name: 'stores and reads back a fresh value', expose: ['makeCache'],
            run: function (s) {
              var t = 1000;
              var c = s.makeCache(function () { return t; });
              c.set('ES', 5240);
              var r = c.get('ES', 500);
              if (!r) return 'get returned null for a stored key';
              if (r.value !== 5240) return 'value was ' + r.value;
              if (r.age !== 0) return 'age should be 0, got ' + r.age;
              return r.fresh === true ? true : 'a just-written entry should be fresh';
            } },
          { name: 'ages out', expose: ['makeCache'],
            run: function (s) {
              var t = 1000;
              var c = s.makeCache(function () { return t; });
              c.set('ES', 1);
              t = 1600;
              var r = c.get('ES', 500);
              if (r.age !== 600) return 'age should be 600, got ' + r.age;
              return r.fresh === false ? true : 'a 600ms-old entry is not fresh under a 500ms limit';
            } },
          { name: 'a missing key returns null', expose: ['makeCache'],
            run: function (s) {
              var c = s.makeCache(function () { return 0; });
              return c.get('NOPE', 1000) === null ? true : 'expected null for an unknown key';
            } },
          { name: 'size reflects the entries', expose: ['makeCache'],
            run: function (s) {
              var c = s.makeCache(function () { return 0; });
              if (c.size() !== 0) return 'a new cache should have size 0';
              c.set('a', 1); c.set('b', 2); c.set('a', 3);
              return c.size() === 2 ? true : 'expected size 2, got ' + c.size();
            } },
          { name: 'exactly at the age limit still counts as fresh', expose: ['makeCache'],
            run: function (s) {
              var t = 0;
              var c = s.makeCache(function () { return t; });
              c.set('x', 1);
              t = 500;
              return c.get('x', 500).fresh === true ? true : 'age === maxAgeMs should be fresh';
            } }
        ] } },
      { id: 'e2', title: 'dedupe()', difficulty: 'Boss · part 2',
        prompt: 'Write <code>dedupe(load)</code> returning a function <code>get(key)</code> such that concurrent calls for the same key share one underlying <code>load(key)</code> call.<br>' +
          'Once the promise settles — resolved <em>or</em> rejected — the entry is dropped so a later call starts fresh.',
        starter: 'function dedupe(load) {\n  // share one in-flight promise per key\n}\n',
        solution: 'function dedupe(load) {\n  const inFlight = new Map();\n  return key => {\n    if (inFlight.has(key)) return inFlight.get(key);\n    const p = load(key).finally(() => inFlight.delete(key));\n    inFlight.set(key, p);\n    return p;\n  };\n}',
        hints: ['Store the promise itself in the map, not the resolved value.',
                '<code>.finally()</code> removes the entry on both success and failure.',
                'Attach the <code>finally</code> before storing so the stored promise is the one that cleans up.'],
        tests: { checks: [
          { name: 'concurrent calls share one load', expose: ['dedupe'],
            run: async function (s, h) {
              var calls = 0;
              var get = s.dedupe(function (k) {
                calls++;
                return new Promise(function (r) { setTimeout(function () { r(k + '!'); }, 20); });
              });
              var out = await Promise.all([get('ES'), get('ES'), get('ES')]);
              if (calls !== 1) return 'load ran ' + calls + ' times, expected 1';
              return h.eq(out, ['ES!', 'ES!', 'ES!']) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'different keys load separately', expose: ['dedupe'],
            run: async function (s) {
              var calls = 0;
              var get = s.dedupe(function (k) { calls++; return Promise.resolve(k); });
              await Promise.all([get('A'), get('B')]);
              return calls === 2 ? true : 'expected 2 loads for 2 keys, got ' + calls;
            } },
          { name: 'a later call after settling loads again', expose: ['dedupe'],
            run: async function (s) {
              var calls = 0;
              var get = s.dedupe(function (k) { calls++; return Promise.resolve(k); });
              await get('ES');
              await get('ES');
              return calls === 2 ? true : 'expected a fresh load after the first settled, got ' + calls + ' calls';
            } },
          { name: 'a rejection clears the entry too', expose: ['dedupe'],
            run: async function (s) {
              var calls = 0;
              var get = s.dedupe(function () { calls++; return Promise.reject(new Error('down')); });
              try { await get('ES'); } catch (e) {}
              try { await get('ES'); } catch (e) {}
              return calls === 2 ? true : 'a failed load should not be cached forever (got ' + calls + ' calls)';
            } },
          { name: 'the rejection reaches every caller', expose: ['dedupe'],
            run: async function (s) {
              var get = s.dedupe(function () {
                return new Promise(function (_, rej) { setTimeout(function () { rej(new Error('down')); }, 10); });
              });
              var a = get('ES'), b = get('ES');
              var caught = 0;
              await Promise.all([a.catch(function () { caught++; }), b.catch(function () { caught++; })]);
              return caught === 2 ? true : 'both callers should see the rejection';
            } }
        ] } },
      { id: 'e3', title: 'class MarketDataClient', difficulty: 'Boss · final',
        prompt: 'Assemble the client. <code>new MarketDataClient({ fetchQuote, cache, maxAgeMs, attempts })</code> with one method:<br>' +
          '<code>async getQuote(symbol)</code> returning <code>{ price, age, stale }</code>.<ol>' +
          '<li>If the cache holds a <strong>fresh</strong> entry, return it with <code>stale: false</code> and no fetch.</li>' +
          '<li>Otherwise call <code>fetchQuote(symbol)</code>, retrying up to <code>attempts</code> times in total.</li>' +
          '<li>On success, cache the price and return it with <code>age: 0, stale: false</code>.</li>' +
          '<li>If every attempt fails but the cache holds a stale entry, return that with <code>stale: true</code>.</li>' +
          '<li>If every attempt fails and there is nothing cached at all, rethrow the last error.</li></ol>' +
          '<span class="muted">The cache is the object from part 1: <code>set(key, value)</code> and <code>get(key, maxAgeMs)</code>.</span>',
        expose: ['MarketDataClient'],
        starter: 'class MarketDataClient {\n  constructor({ fetchQuote, cache, maxAgeMs, attempts }) {\n    this.fetchQuote = fetchQuote;\n    this.cache = cache;\n    this.maxAgeMs = maxAgeMs;\n    this.attempts = attempts;\n  }\n\n  async getQuote(symbol) {\n    // cache -> retry -> degrade\n  }\n}\n',
        solution: 'class MarketDataClient {\n  constructor({ fetchQuote, cache, maxAgeMs, attempts }) {\n    this.fetchQuote = fetchQuote;\n    this.cache = cache;\n    this.maxAgeMs = maxAgeMs;\n    this.attempts = attempts;\n  }\n\n  async getQuote(symbol) {\n    const cached = this.cache.get(symbol, this.maxAgeMs);\n    if (cached && cached.fresh) {\n      return { price: cached.value, age: cached.age, stale: false };\n    }\n    let lastError;\n    for (let i = 0; i < this.attempts; i++) {\n      try {\n        const q = await this.fetchQuote(symbol);\n        this.cache.set(symbol, q.price);\n        return { price: q.price, age: 0, stale: false };\n      } catch (e) {\n        lastError = e;\n      }\n    }\n    if (cached) return { price: cached.value, age: cached.age, stale: true };\n    throw lastError;\n  }\n}',
        hints: ['Read the cache once at the top — you need that entry again at the end for the stale fallback.',
                'The retry loop is the one from day 48, without the backoff.',
                'Only rethrow when there is no cached value at all to fall back on.'],
        tests: { checks: [
          { name: 'a fresh cache hit avoids the network', expose: ['MarketDataClient'],
            run: async function (s) {
              var fetches = 0;
              var cache = { get: function () { return { value: 5240, age: 10, fresh: true }; }, set: function () {} };
              var c = new s.MarketDataClient({
                fetchQuote: function () { fetches++; return Promise.resolve({ price: 1 }); },
                cache: cache, maxAgeMs: 1000, attempts: 3
              });
              var r = await c.getQuote('ES');
              if (fetches !== 0) return 'a fresh cache hit should not fetch';
              if (r.price !== 5240) return 'price was ' + r.price;
              if (r.age !== 10) return 'age should come from the cache, got ' + r.age;
              return r.stale === false ? true : 'a fresh hit is not stale';
            } },
          { name: 'a miss fetches and caches', expose: ['MarketDataClient'],
            run: async function (s) {
              var stored = null;
              var cache = { get: function () { return null; }, set: function (k, v) { stored = [k, v]; } };
              var c = new s.MarketDataClient({
                fetchQuote: function () { return Promise.resolve({ price: 5250 }); },
                cache: cache, maxAgeMs: 1000, attempts: 3
              });
              var r = await c.getQuote('ES');
              if (r.price !== 5250 || r.age !== 0 || r.stale !== false) return 'got ' + JSON.stringify(r);
              return (stored && stored[0] === 'ES' && stored[1] === 5250) ? true : 'the price was not cached';
            } },
          { name: 'retries a failing fetch', expose: ['MarketDataClient'],
            run: async function (s) {
              var n = 0;
              var cache = { get: function () { return null; }, set: function () {} };
              var c = new s.MarketDataClient({
                fetchQuote: function () { return ++n < 3 ? Promise.reject(new Error('down')) : Promise.resolve({ price: 7 }); },
                cache: cache, maxAgeMs: 1000, attempts: 5
              });
              var r = await c.getQuote('ES');
              if (n !== 3) return 'fetch ran ' + n + ' times, expected 3';
              return r.price === 7 ? true : 'got ' + JSON.stringify(r);
            } },
          { name: 'falls back to stale data when the feed is down', expose: ['MarketDataClient'],
            run: async function (s) {
              var cache = { get: function () { return { value: 5200, age: 9000, fresh: false }; }, set: function () {} };
              var c = new s.MarketDataClient({
                fetchQuote: function () { return Promise.reject(new Error('down')); },
                cache: cache, maxAgeMs: 1000, attempts: 2
              });
              var r = await c.getQuote('ES');
              if (r.price !== 5200) return 'price was ' + r.price;
              if (r.age !== 9000) return 'age should be the cached age, got ' + r.age;
              return r.stale === true ? true : 'a fallback must be labelled stale';
            } },
          { name: 'throws when there is nothing to fall back on', expose: ['MarketDataClient'],
            run: async function (s) {
              var cache = { get: function () { return null; }, set: function () {} };
              var c = new s.MarketDataClient({
                fetchQuote: function () { return Promise.reject(new Error('feed down')); },
                cache: cache, maxAgeMs: 1000, attempts: 2
              });
              try { await c.getQuote('ES'); } catch (e) {
                return e.message === 'feed down' ? true : 'expected the last error, got ' + e.message;
              }
              return 'with no cache and no data it must throw';
            } },
          { name: 'respects the attempt limit', expose: ['MarketDataClient'],
            run: async function (s) {
              var n = 0;
              var cache = { get: function () { return null; }, set: function () {} };
              var c = new s.MarketDataClient({
                fetchQuote: function () { n++; return Promise.reject(new Error('x')); },
                cache: cache, maxAgeMs: 1000, attempts: 3
              });
              try { await c.getQuote('ES'); } catch (e) {}
              return n === 3 ? true : 'fetch ran ' + n + ' times, expected exactly 3';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why store the promise, rather than the value, for in-flight deduplication?',
        options: ['Promises are smaller', 'The value does not exist yet — the promise is what later callers can share', 'To allow retries', 'Maps require promises'],
        answer: 1,
        explain: 'The whole point is to join a request that has not finished. Only the promise exists at that moment.' },
      { q: 'Why does the cache store a timestamp with each entry?',
        options: ['For sorting', 'So freshness can be judged on read instead of guessed', 'To save memory', 'It is optional'],
        answer: 1,
        explain: 'Without an age, a cache serves yesterday\'s close indefinitely and nothing downstream can tell.' },
      { q: 'The feed is down and you hold a 9-second-old price. What should the client do?',
        options: ['Throw', 'Return it silently as if it were live', 'Return it clearly labelled as stale', 'Return zero'],
        answer: 2,
        explain: 'Stale-but-labelled lets the caller decide. Stale-but-unlabelled is how a system trades on a price that no longer exists.' }
    ],
    recap: [
      'A real client is validation, retry, caching, deduplication and degradation.',
      'Deduplicate by storing the in-flight promise per key.',
      'Cache entries carry a timestamp so freshness is measured, not assumed.',
      'Prefer labelled stale data over an exception, and an exception over silent staleness.'
    ],
    vocab: [
      { term: 'Stale-while-revalidate', def: 'Serve the cached value immediately, refresh in the background. Keeps a screen responsive without showing nothing.' },
      { term: 'Graceful degradation', def: 'Continuing to work with reduced quality when a dependency fails, rather than stopping entirely.' }
    ]
  });

  C.push({
    id: 'd051', day: 51, module: 4, minutes: 30,
    title: 'Debounce and Throttle',
    subtitle: 'Taming an event stream that fires faster than you can act.',
    goal: '<b>Goal:</b> stop a fast tick stream from triggering an expensive recalculation on every single update.',
    objectives: [
      'Implement <code>debounce</code> — act after the noise stops',
      'Implement <code>throttle</code> — act at most once per interval',
      'Choose the right one for a given event',
      'Support cancellation'
    ],
    sections: [
      { h: 'Debounce waits for quiet',
        body: '<p>Each call restarts the timer; the function runs only once the calls stop for <code>wait</code> milliseconds. Right for "the user has finished typing" or "the resize has settled".</p>',
        code: 'function debounce(fn, wait) {\n  let timer = null;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), wait);\n  };\n}\n\nconst search = debounce(q => console.log("searching for", q), 30);\nsearch("E"); search("ES"); search("ESZ");   // only the last one runs' },
      { h: 'Throttle caps the rate',
        body: '<p>The first call runs immediately, then further calls are ignored until the interval elapses. Right for "redraw the chart" or "recompute indicators" — you want regular updates, just not four hundred a second.</p>',
        code: 'function throttle(fn, interval) {\n  let last = 0;\n  return (...args) => {\n    const now = Date.now();\n    if (now - last >= interval) { last = now; fn(...args); }\n  };\n}\n\nconst redraw = throttle(p => console.log("redraw at", p), 50);\nredraw(5240); redraw(5241); redraw(5242);   // only the first runs now' },
      { h: 'Which one, when',
        body: '<table><tr><th>Situation</th><th>Use</th><th>Why</th></tr>' +
              '<tr><td>Symbol search box</td><td>debounce</td><td>only the final query matters</td></tr>' +
              '<tr><td>Chart redraw on tick</td><td>throttle</td><td>you want steady updates, capped</td></tr>' +
              '<tr><td>Saving a layout change</td><td>debounce</td><td>save once the dragging stops</td></tr>' +
              '<tr><td>Recomputing indicators</td><td>throttle</td><td>regular, bounded work</td></tr>' +
              '<tr><td>Risk check before an order</td><td>neither</td><td>never delay a safety check</td></tr></table>' +
              '<div class="note note-warn"><b>Never debounce a risk check</b>Debouncing means "maybe later, maybe never". A stop-loss evaluation or a position-limit check must run on the event that triggered it.</div>' },
      { h: 'Cancellation',
        body: '<p>A debounced call that is still pending when the component goes away will fire into a dead world. Expose a <code>cancel</code> so callers can clean up.</p>',
        code: 'function debounce(fn, wait) {\n  let timer = null;\n  const wrapped = (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), wait);\n  };\n  wrapped.cancel = () => clearTimeout(timer);\n  return wrapped;\n}\n\nconst save = debounce(() => console.log("saved"), 50);\nsave();\nsave.cancel();\nconsole.log("cancelled before it could fire");' }
    ],
    parsons: {
      prompt: 'Build a debounce that restarts its timer on every call.',
      lines: [
        'function debounce(fn, wait) {',
        '  let timer = null;',
        '  return (...args) => {',
        '    clearTimeout(timer);',
        '    timer = setTimeout(() => fn(...args), wait);',
        '  };',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'debounce()', difficulty: 'Core',
        prompt: 'Write <code>debounce(fn, wait)</code> returning a wrapped function that calls <code>fn</code> only after <code>wait</code> milliseconds have passed with no further calls.<br>' +
          '<code>fn</code> receives the arguments of the <strong>last</strong> call. Attach a <code>cancel()</code> method that stops any pending call.',
        starter: 'function debounce(fn, wait) {\n  // trailing-edge debounce with cancel()\n}\n',
        solution: 'function debounce(fn, wait) {\n  let timer = null;\n  const wrapped = (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), wait);\n  };\n  wrapped.cancel = () => clearTimeout(timer);\n  return wrapped;\n}',
        hints: ['<code>clearTimeout</code> then <code>setTimeout</code> on every call restarts the clock.',
                'Assign <code>wrapped.cancel</code> before returning — functions are objects.'],
        tests: { checks: [
          { name: 'runs once after the calls stop', expose: ['debounce'],
            run: async function (s) {
              var n = 0;
              var d = s.debounce(function () { n++; }, 20);
              d(); d(); d();
              if (n !== 0) return 'it fired immediately — this is a trailing-edge debounce';
              await new Promise(function (r) { setTimeout(r, 60); });
              return n === 1 ? true : 'expected 1 call, got ' + n;
            } },
          { name: 'passes the last arguments through', expose: ['debounce'],
            run: async function (s) {
              var seen = null;
              var d = s.debounce(function (q) { seen = q; }, 15);
              d('E'); d('ES'); d('ESZ');
              await new Promise(function (r) { setTimeout(r, 50); });
              return seen === 'ESZ' ? true : 'fn saw ' + JSON.stringify(seen);
            } },
          { name: 'cancel() prevents a pending call', expose: ['debounce'],
            run: async function (s) {
              var n = 0;
              var d = s.debounce(function () { n++; }, 15);
              d();
              d.cancel();
              await new Promise(function (r) { setTimeout(r, 50); });
              return n === 0 ? true : 'the cancelled call still fired';
            } },
          { name: 'separate bursts each fire once', expose: ['debounce'],
            run: async function (s) {
              var n = 0;
              var d = s.debounce(function () { n++; }, 15);
              d(); d();
              await new Promise(function (r) { setTimeout(r, 45); });
              d(); d();
              await new Promise(function (r) { setTimeout(r, 45); });
              return n === 2 ? true : 'expected 2 calls for 2 bursts, got ' + n;
            } }
        ] } },
      { id: 'e2', title: 'throttle()', difficulty: 'Core',
        prompt: 'Write <code>throttle(fn, interval, now)</code> where <code>now</code> is an injected clock function returning milliseconds (default <code>Date.now</code>).<br>' +
          'The first call runs immediately. Later calls run only once <code>interval</code> milliseconds have passed since the last accepted call; the rest are dropped.',
        starter: 'function throttle(fn, interval, now = Date.now) {\n  // leading-edge throttle\n}\n',
        solution: 'function throttle(fn, interval, now = Date.now) {\n  let last = -Infinity;\n  return (...args) => {\n    const t = now();\n    if (t - last >= interval) {\n      last = t;\n      return fn(...args);\n    }\n  };\n}',
        hints: ['Track the timestamp of the last accepted call, seeded so the first call always passes.',
                'Injecting the clock means a test can move time without waiting.'],
        tests: { checks: [
          { name: 'the first call runs immediately', expose: ['throttle'],
            run: function (s) {
              var n = 0, t = 0;
              var f = s.throttle(function () { n++; }, 50, function () { return t; });
              f();
              return n === 1 ? true : 'expected the leading call to run, got ' + n;
            } },
          { name: 'calls inside the interval are dropped', expose: ['throttle'],
            run: function (s) {
              var n = 0, t = 0;
              var f = s.throttle(function () { n++; }, 50, function () { return t; });
              f(); t = 10; f(); t = 40; f();
              return n === 1 ? true : 'expected 1 call within the interval, got ' + n;
            } },
          { name: 'a call after the interval runs', expose: ['throttle'],
            run: function (s) {
              var n = 0, t = 0;
              var f = s.throttle(function () { n++; }, 50, function () { return t; });
              f(); t = 60; f(); t = 130; f();
              return n === 3 ? true : 'expected 3 calls at t=0, 60 and 130, got ' + n;
            } },
          { name: 'arguments are passed through', expose: ['throttle'],
            run: function (s) {
              var seen = null, t = 0;
              var f = s.throttle(function (p) { seen = p; }, 50, function () { return t; });
              f(5240);
              return seen === 5240 ? true : 'fn saw ' + JSON.stringify(seen);
            } },
          { name: 'exactly at the interval boundary is allowed', expose: ['throttle'],
            run: function (s) {
              var n = 0, t = 0;
              var f = s.throttle(function () { n++; }, 50, function () { return t; });
              f(); t = 50; f();
              return n === 2 ? true : 'a call exactly one interval later should run';
            } }
        ] } },
      { id: 'e3', title: 'makeTickHandler()', difficulty: 'Stretch',
        prompt: 'A tick stream must drive two things at different rates. Write <code>makeTickHandler({ onRedraw, onSettle, throttleMs, debounceMs, now, schedule })</code> returning a function <code>handle(tick)</code> that:<ul>' +
          '<li>calls <code>onRedraw(tick)</code> at most once per <code>throttleMs</code> (leading edge, using <code>now()</code>)</li>' +
          '<li>calls <code>onSettle(tick)</code> once the ticks stop for <code>debounceMs</code>, using <code>schedule(fn, ms)</code> — an injected <code>setTimeout</code> that returns a handle — and <code>schedule.cancel(handle)</code> to clear it</li></ul>' +
          'Also expose <code>handle.cancel()</code> which drops any pending settle call.',
        expose: ['makeTickHandler'],
        starter: 'function makeTickHandler({ onRedraw, onSettle, throttleMs, debounceMs, now, schedule }) {\n  // throttle the redraw, debounce the settle\n}\n',
        solution: 'function makeTickHandler({ onRedraw, onSettle, throttleMs, debounceMs, now, schedule }) {\n  let last = -Infinity;\n  let timer = null;\n  const handle = tick => {\n    const t = now();\n    if (t - last >= throttleMs) { last = t; onRedraw(tick); }\n    if (timer !== null) schedule.cancel(timer);\n    timer = schedule(() => { timer = null; onSettle(tick); }, debounceMs);\n  };\n  handle.cancel = () => {\n    if (timer !== null) schedule.cancel(timer);\n    timer = null;\n  };\n  return handle;\n}',
        hints: ['The two behaviours are independent — do the throttle check, then always restart the debounce timer.',
                'Keep the timer handle so the next tick and <code>cancel()</code> can clear it.',
                'Clear the stored handle when the settle actually fires, or <code>cancel()</code> will clear a dead timer.'],
        tests: { checks: [
          { name: 'redraws are throttled', expose: ['makeTickHandler'],
            run: function (s) {
              var draws = 0, t = 0;
              var h = s.makeTickHandler({
                onRedraw: function () { draws++; }, onSettle: function () {},
                throttleMs: 50, debounceMs: 100,
                now: function () { return t; },
                schedule: Object.assign(function () { return 1; }, { cancel: function () {} })
              });
              h(1); t = 10; h(2); t = 60; h(3);
              return draws === 2 ? true : 'expected 2 redraws at t=0 and t=60, got ' + draws;
            } },
          { name: 'the settle call is debounced', expose: ['makeTickHandler'],
            run: function (s) {
              var settles = 0, t = 0, id = 0, timers = {};
              var schedule = Object.assign(function (fn, ms) { id++; timers[id] = fn; return id; },
                { cancel: function (h) { delete timers[h]; } });
              var h = s.makeTickHandler({
                onRedraw: function () {}, onSettle: function () { settles++; },
                throttleMs: 50, debounceMs: 100, now: function () { return t; }, schedule: schedule
              });
              h(1); h(2); h(3);
              var pending = Object.keys(timers);
              if (pending.length !== 1) return 'expected exactly 1 pending settle timer, got ' + pending.length;
              timers[pending[0]]();
              return settles === 1 ? true : 'expected 1 settle call, got ' + settles;
            } },
          { name: 'settle receives the last tick', expose: ['makeTickHandler'],
            run: function (s) {
              var seen = null, t = 0, id = 0, timers = {};
              var schedule = Object.assign(function (fn) { id++; timers[id] = fn; return id; },
                { cancel: function (h) { delete timers[h]; } });
              var h = s.makeTickHandler({
                onRedraw: function () {}, onSettle: function (tick) { seen = tick; },
                throttleMs: 50, debounceMs: 100, now: function () { return t; }, schedule: schedule
              });
              h('a'); h('b'); h('c');
              var k = Object.keys(timers)[0];
              timers[k]();
              return seen === 'c' ? true : 'settle saw ' + JSON.stringify(seen);
            } },
          { name: 'cancel() drops the pending settle', expose: ['makeTickHandler'],
            run: function (s) {
              var t = 0, id = 0, timers = {};
              var schedule = Object.assign(function (fn) { id++; timers[id] = fn; return id; },
                { cancel: function (h) { delete timers[h]; } });
              var h = s.makeTickHandler({
                onRedraw: function () {}, onSettle: function () {},
                throttleMs: 50, debounceMs: 100, now: function () { return t; }, schedule: schedule
              });
              h(1);
              h.cancel();
              return Object.keys(timers).length === 0 ? true : 'a pending settle timer survived cancel()';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What is the difference between debounce and throttle?',
        options: ['None', 'Debounce waits for the calls to stop; throttle caps how often they run', 'Throttle is asynchronous', 'Debounce is faster'],
        answer: 1,
        explain: 'Debounce collapses a burst into one trailing call. Throttle lets a call through at a fixed maximum rate.' },
      { q: 'Which is right for redrawing a chart on every tick?',
        options: ['Debounce', 'Throttle', 'Neither', 'Both'],
        answer: 1,
        explain: 'You want steady updates at a bounded rate. Debouncing would leave the chart frozen for as long as ticks keep arriving.' },
      { q: 'Why should a stop-loss check never be debounced?',
        options: ['It is too fast', 'Debouncing means the check may be delayed or skipped entirely', 'Debounce breaks timers', 'It is fine to debounce it'],
        answer: 1,
        explain: 'A safety check has to run on the event that triggered it. Deferring it is the difference between a stop and a hope.' }
    ],
    recap: [
      'Debounce runs once after the calls stop; throttle runs at a capped rate.',
      'Debounce for "finished typing"; throttle for "keep redrawing".',
      'Always offer a way to cancel a pending call.',
      'Never rate-limit a risk or safety check.'
    ],
    vocab: [
      { term: 'Tick stream', def: 'The continuous flow of price updates from an exchange. A liquid instrument can produce thousands per second.' }
    ]
  });

  C.push({
    id: 'd052', day: 52, module: 4, minutes: 30,
    title: 'Async Iteration',
    subtitle: 'for await, async generators, and consuming a feed page by page.',
    goal: '<b>Goal:</b> consume an endless or paginated stream of data one item at a time, without loading it all into memory.',
    objectives: [
      'Use <code>for await...of</code> over an async iterable',
      'Write an async generator with <code>async function*</code>',
      'Page through an API until it runs out',
      'Understand backpressure for free'
    ],
    sections: [
      { h: 'for await...of',
        body: '<p>The async cousin of <code>for...of</code>. It awaits each value before running the body, so the loop naturally paces itself to the source.</p>',
        code: 'const delay = (ms, v) => new Promise(r => setTimeout(() => r(v), ms));\n\n(async () => {\n  const pending = [delay(10, 5240), delay(5, 5241), delay(1, 5242)];\n  for await (const price of pending) {\n    console.log("price:", price);   // still in array order\n  }\n})();' },
      { h: 'Async generators produce values over time',
        body: '<p><code>async function*</code> can <code>await</code> between <code>yield</code>s. The consumer pulls one value at a time, so the producer only does work when someone is ready for it — backpressure, for free.</p>',
        code: 'async function* barStream(bars, delayMs) {\n  for (const bar of bars) {\n    await new Promise(r => setTimeout(r, delayMs));\n    yield bar;\n  }\n}\n\n(async () => {\n  let n = 0;\n  for await (const bar of barStream(bars.slice(0, 4), 5)) {\n    n++;\n    console.log(`bar ${n}: close ${bar.close}`);\n  }\n  console.log("stream ended after", n, "bars");\n})();' },
      { h: 'Pagination is the natural use',
        body: '<p>An API returns 500 rows and a cursor. An async generator hides the paging entirely: the consumer just loops over rows and never learns that pages exist.</p>',
        code: 'async function* allBars(fetchPage, symbol) {\n  let cursor = null;\n  do {\n    const page = await fetchPage(symbol, cursor);\n    for (const bar of page.bars) yield bar;\n    cursor = page.nextCursor;\n  } while (cursor);\n}\n\nconst fake = (sym, cursor) => Promise.resolve(\n  cursor === null ? { bars: [{ close: 1 }, { close: 2 }], nextCursor: "p2" }\n                  : { bars: [{ close: 3 }], nextCursor: null });\n\n(async () => {\n  const out = [];\n  for await (const b of allBars(fake, "ES")) out.push(b.close);\n  console.log(out);\n})();' },
      { h: 'Breaking out cleans up',
        body: '<p><code>break</code> inside a <code>for await</code> tells the generator to stop. Anything after the <code>yield</code> in a <code>finally</code> block still runs, which is where you close the connection.</p>',
        code: 'async function* counter() {\n  let i = 0;\n  try {\n    while (true) { yield i++; }\n  } finally {\n    console.log("generator cleaned up");\n  }\n}\n\n(async () => {\n  for await (const n of counter()) {\n    if (n >= 3) break;\n    console.log("n =", n);\n  }\n})();' }
    ],
    parsons: {
      prompt: 'Page through an API with an async generator.',
      lines: [
        'async function* allBars(fetchPage, symbol) {',
        '  let cursor = null;',
        '  do {',
        '    const page = await fetchPage(symbol, cursor);',
        '    for (const bar of page.bars) yield bar;',
        '    cursor = page.nextCursor;',
        '  } while (cursor);',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'collect()', difficulty: 'Core',
        prompt: 'Write <code>collect(asyncIterable, limit)</code> returning a Promise of an array holding at most <code>limit</code> values from the iterable.<br>' +
          'Stop as soon as the limit is reached — the source may be infinite. A <code>limit</code> of 0 or less returns an empty array without touching the source.',
        starter: 'async function collect(asyncIterable, limit) {\n  // take at most `limit` values\n}\n',
        solution: 'async function collect(asyncIterable, limit) {\n  const out = [];\n  if (limit <= 0) return out;\n  for await (const v of asyncIterable) {\n    out.push(v);\n    if (out.length >= limit) break;\n  }\n  return out;\n}',
        hints: ['<code>for await (const v of asyncIterable)</code> pulls values one at a time.',
                '<code>break</code> once you have enough — that also stops the producer.',
                'Guard the zero case before entering the loop at all.'],
        tests: { checks: [
          { name: 'collects up to the limit', expose: ['collect'],
            run: async function (s, h) {
              async function* gen() { yield 1; yield 2; yield 3; yield 4; }
              var out = await s.collect(gen(), 3);
              return h.eq(out, [1, 2, 3]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'stops early on an infinite source', expose: ['collect'],
            run: async function (s, h) {
              async function* forever() { var i = 0; while (true) yield i++; }
              var out = await s.collect(forever(), 4);
              return h.eq(out, [0, 1, 2, 3]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'a short source returns everything it has', expose: ['collect'],
            run: async function (s, h) {
              async function* gen() { yield 'a'; }
              var out = await s.collect(gen(), 10);
              return h.eq(out, ['a']) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'a limit of 0 never pulls from the source', expose: ['collect'],
            run: async function (s, h) {
              var pulled = 0;
              async function* gen() { pulled++; yield 1; }
              var out = await s.collect(gen(), 0);
              if (pulled !== 0) return 'the source was started despite a limit of 0';
              return h.eq(out, []) ? true : 'got ' + JSON.stringify(out);
            } }
        ] } },
      { id: 'e2', title: 'pageAll()', difficulty: 'Core',
        prompt: 'Write an async generator <code>pageAll(fetchPage, symbol)</code>.<br>' +
          '<code>fetchPage(symbol, cursor)</code> resolves with <code>{ bars, nextCursor }</code>; the first call takes <code>null</code> as the cursor, and a <code>nextCursor</code> of <code>null</code> means there are no more pages.<br>' +
          'Yield each bar individually, in order.',
        starter: 'async function* pageAll(fetchPage, symbol) {\n  // yield every bar across every page\n}\n',
        solution: 'async function* pageAll(fetchPage, symbol) {\n  let cursor = null;\n  do {\n    const page = await fetchPage(symbol, cursor);\n    for (const bar of page.bars) yield bar;\n    cursor = page.nextCursor;\n  } while (cursor);\n}',
        hints: ['A <code>do...while</code> runs the first fetch before checking the cursor.',
                'Yield each bar of the page separately so the consumer never sees pages at all.'],
        tests: { checks: [
          { name: 'yields bars across pages in order', expose: ['pageAll'],
            run: async function (s, h) {
              var pages = {
                'null': { bars: [1, 2], nextCursor: 'p2' },
                'p2': { bars: [3], nextCursor: 'p3' },
                'p3': { bars: [4, 5], nextCursor: null }
              };
              var f = function (sym, cursor) { return Promise.resolve(pages[String(cursor)]); };
              var out = [];
              for await (var b of s.pageAll(f, 'ES')) out.push(b);
              return h.eq(out, [1, 2, 3, 4, 5]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'a single page ends cleanly', expose: ['pageAll'],
            run: async function (s, h) {
              var f = function () { return Promise.resolve({ bars: [7], nextCursor: null }); };
              var out = [];
              for await (var b of s.pageAll(f, 'ES')) out.push(b);
              return h.eq(out, [7]) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'an empty first page yields nothing', expose: ['pageAll'],
            run: async function (s, h) {
              var f = function () { return Promise.resolve({ bars: [], nextCursor: null }); };
              var out = [];
              for await (var b of s.pageAll(f, 'ES')) out.push(b);
              return h.eq(out, []) ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'the first fetch uses a null cursor', expose: ['pageAll'],
            run: async function (s) {
              var seen;
              var f = function (sym, cursor) { seen = cursor; return Promise.resolve({ bars: [], nextCursor: null }); };
              for await (var b of s.pageAll(f, 'ES')) {}
              return seen === null ? true : 'the first cursor was ' + JSON.stringify(seen);
            } },
          { name: 'stops requesting once the consumer breaks', expose: ['pageAll'],
            run: async function (s) {
              var fetches = 0;
              var f = function (sym, cursor) {
                fetches++;
                return Promise.resolve({ bars: [1, 2], nextCursor: 'more' });
              };
              for await (var b of s.pageAll(f, 'ES')) break;
              return fetches === 1 ? true : 'expected 1 fetch before the break, got ' + fetches;
            } }
        ] } },
      { id: 'e3', title: 'aggregateBars()', difficulty: 'Stretch',
        prompt: 'Write an async generator <code>aggregateBars(source, n)</code> that consumes 1-minute bars from <code>source</code> and yields <code>n</code>-minute bars.<br>' +
          'Each aggregated bar is <code>{ open, high, low, close, volume }</code> where:<ul>' +
          '<li><code>open</code> is the first bar\'s open, <code>close</code> the last bar\'s close</li>' +
          '<li><code>high</code>/<code>low</code> are the extremes across the group</li>' +
          '<li><code>volume</code> is the sum</li></ul>' +
          'A trailing partial group is still yielded.',
        starter: 'async function* aggregateBars(source, n) {\n  // roll n input bars into one output bar\n}\n',
        solution: 'async function* aggregateBars(source, n) {\n  let group = [];\n  const emit = g => ({\n    open: g[0].open,\n    high: Math.max(...g.map(b => b.high)),\n    low: Math.min(...g.map(b => b.low)),\n    close: g[g.length - 1].close,\n    volume: g.reduce((a, b) => a + b.volume, 0)\n  });\n  for await (const bar of source) {\n    group.push(bar);\n    if (group.length === n) { yield emit(group); group = []; }\n  }\n  if (group.length) yield emit(group);\n}',
        hints: ['Buffer bars in an array and emit whenever it reaches <code>n</code>.',
                'Reset the buffer after each emit, and flush whatever is left after the loop ends.',
                'Open comes from the first bar of the group, close from the last.'],
        tests: { checks: [
          { name: 'aggregates full groups', expose: ['aggregateBars'],
            run: async function (s, h) {
              async function* src() {
                yield { open: 1, high: 3, low: 0.5, close: 2, volume: 10 };
                yield { open: 2, high: 4, low: 1.5, close: 3, volume: 20 };
              }
              var out = [];
              for await (var b of s.aggregateBars(src(), 2)) out.push(b);
              return h.eq(out, [{ open: 1, high: 4, low: 0.5, close: 3, volume: 30 }])
                ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'yields a trailing partial group', expose: ['aggregateBars'],
            run: async function (s, h) {
              async function* src() {
                yield { open: 1, high: 2, low: 1, close: 2, volume: 5 };
                yield { open: 2, high: 3, low: 2, close: 3, volume: 5 };
                yield { open: 3, high: 5, low: 3, close: 4, volume: 7 };
              }
              var out = [];
              for await (var b of s.aggregateBars(src(), 2)) out.push(b);
              if (out.length !== 2) return 'expected 2 output bars, got ' + out.length;
              return h.eq(out[1], { open: 3, high: 5, low: 3, close: 4, volume: 7 })
                ? true : 'the trailing bar was ' + JSON.stringify(out[1]);
            } },
          { name: 'n of 1 passes bars through', expose: ['aggregateBars'],
            run: async function (s, h) {
              async function* src() { yield { open: 1, high: 2, low: 0, close: 1.5, volume: 3 }; }
              var out = [];
              for await (var b of s.aggregateBars(src(), 1)) out.push(b);
              return h.eq(out, [{ open: 1, high: 2, low: 0, close: 1.5, volume: 3 }])
                ? true : 'got ' + JSON.stringify(out);
            } },
          { name: 'an empty source yields nothing', expose: ['aggregateBars'],
            run: async function (s) {
              async function* src() {}
              var n = 0;
              for await (var b of s.aggregateBars(src(), 5)) n++;
              return n === 0 ? true : 'expected no output, got ' + n + ' bars';
            } }
        ] } }
    ],
    quiz: [
      { q: 'What does <code>async function*</code> declare?',
        options: ['An async function', 'A generator that can await between yields', 'A promise factory', 'A class method'],
        answer: 1,
        explain: 'It produces an async iterable: the consumer pulls values, and the producer may await before each one.' },
      { q: 'Why does pull-based iteration give you backpressure for free?',
        options: ['It is faster', 'The producer only does work when the consumer asks for the next value', 'It buffers everything', 'It uses threads'],
        answer: 1,
        explain: 'A slow consumer simply asks less often. Nothing queues up unread.' },
      { q: 'What happens when you <code>break</code> out of a <code>for await</code> loop?',
        options: ['Nothing — the generator keeps running', 'The generator is told to stop, and its <code>finally</code> block runs', 'It throws', 'The remaining values are buffered'],
        answer: 1,
        explain: 'That is where cleanup belongs — closing a socket or releasing a subscription.' }
    ],
    recap: [
      '<code>for await...of</code> iterates an async source one value at a time.',
      '<code>async function*</code> can await between yields.',
      'Pagination hides neatly behind an async generator.',
      'Pull-based iteration gives backpressure without extra machinery.'
    ],
    vocab: [
      { term: 'Cursor', def: 'An opaque token an API returns so the next request can continue where the last one stopped.' },
      { term: 'Bar aggregation', def: 'Rolling finer bars into coarser ones — 1-minute into 5-minute. Open from the first, close from the last, extremes across all.' }
    ]
  });

  C.push({
    id: 'd053', day: 53, module: 4, minutes: 30,
    title: 'Event Emitters',
    subtitle: 'Publish and subscribe — the shape of every live feed API.',
    goal: '<b>Goal:</b> build the subscription mechanism a WebSocket feed exposes, and use it without leaking listeners.',
    objectives: [
      'Implement <code>on</code>, <code>off</code> and <code>emit</code>',
      'Return an unsubscribe function from <code>on</code>',
      'Isolate a throwing listener so it cannot break the others',
      'Explain why listener leaks matter in a long-running system'
    ],
    sections: [
      { h: 'The pattern',
        body: '<p>A producer emits named events. Consumers subscribe to the names they care about and know nothing about each other. Every WebSocket client, chart library and broker SDK you will meet exposes exactly this.</p>',
        code: 'class Emitter {\n  constructor() { this.listeners = new Map(); }\n\n  on(event, fn) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event).add(fn);\n    return () => this.off(event, fn);        // unsubscribe handle\n  }\n\n  off(event, fn) {\n    const set = this.listeners.get(event);\n    if (set) set.delete(fn);\n  }\n\n  emit(event, payload) {\n    const set = this.listeners.get(event);\n    if (!set) return 0;\n    [...set].forEach(fn => fn(payload));\n    return set.size;\n  }\n}\n\nconst feed = new Emitter();\nconst stop = feed.on("tick", t => console.log("tick", t.price));\nfeed.emit("tick", { price: 5240.25 });\nstop();\nfeed.emit("tick", { price: 5241 });   // nobody listening now' },
      { h: 'Return an unsubscribe function',
        body: '<p>Calling <code>off</code> requires holding onto the exact same function reference, which callers routinely get wrong — especially with arrow functions. Returning a closure that removes the right listener eliminates the problem.</p>',
        code: 'const feed = { handlers: [], on(fn) { this.handlers.push(fn); }, };\n\n// The classic bug: this can never be removed\nfeed.on(t => console.log(t));\nconsole.log("no reference kept — that listener is now permanent");' },
      { h: 'One bad listener must not stop the rest',
        body: '<p>If a listener throws inside <code>emit</code>, every listener registered after it is skipped. On a tick feed that means a bug in a logging widget silently disables your stop-loss monitor.</p>' +
              '<div class="note note-warn"><b>Isolate every callback</b>Wrap each call in try/catch, report the failure, and carry on. Subscribers are independent by design — one failing must not take the others with it.</div>',
        code: 'function emitSafely(listeners, payload) {\n  const errors = [];\n  for (const fn of listeners) {\n    try { fn(payload); }\n    catch (e) { errors.push(e.message); }\n  }\n  return errors;\n}\n\nconst errs = emitSafely([\n  () => console.log("listener A ok"),\n  () => { throw new Error("listener B is broken"); },\n  () => console.log("listener C still ran")\n], null);\nconsole.log("errors:", errs);' },
      { h: 'Leaks are a real problem here',
        body: '<p>A trading screen that subscribes on open and never unsubscribes on close accumulates listeners for every chart the user has ever viewed. Each still runs on every tick, still holds its component alive, and the application gets slower all session.</p>' +
              '<p>The discipline: every <code>on</code> has a matching cleanup, and the unsubscribe handle makes that a one-liner.</p>' }
    ],
    parsons: {
      prompt: 'Subscribe and return a working unsubscribe handle.',
      lines: [
        'on(event, fn) {',
        '  if (!this.listeners.has(event)) this.listeners.set(event, new Set());',
        '  this.listeners.get(event).add(fn);',
        '  return () => this.off(event, fn);',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'class Emitter', difficulty: 'Core',
        prompt: 'Define <code>Emitter</code> with:<ul>' +
          '<li><code>on(event, fn)</code> — subscribe, returning a function that unsubscribes</li>' +
          '<li><code>off(event, fn)</code> — unsubscribe explicitly</li>' +
          '<li><code>emit(event, payload)</code> — call every listener with the payload, returning how many were called</li>' +
          '<li><code>count(event)</code> — how many listeners the event has</li></ul>' +
          'Emitting an event with no listeners returns 0 and must not throw.',
        expose: ['Emitter'],
        starter: 'class Emitter {\n  constructor() {\n    // listener storage\n  }\n  on(event, fn) {}\n  off(event, fn) {}\n  emit(event, payload) {}\n  count(event) {}\n}\n',
        solution: 'class Emitter {\n  constructor() { this.listeners = new Map(); }\n\n  on(event, fn) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event).add(fn);\n    return () => this.off(event, fn);\n  }\n\n  off(event, fn) {\n    const set = this.listeners.get(event);\n    if (set) set.delete(fn);\n  }\n\n  emit(event, payload) {\n    const set = this.listeners.get(event);\n    if (!set) return 0;\n    const fns = [...set];\n    fns.forEach(fn => fn(payload));\n    return fns.length;\n  }\n\n  count(event) {\n    const set = this.listeners.get(event);\n    return set ? set.size : 0;\n  }\n}',
        hints: ['A <code>Map</code> of event name to a <code>Set</code> of functions handles duplicates for free.',
                'Copy the set with <code>[...set]</code> before iterating, so a listener that unsubscribes mid-emit cannot disturb the loop.',
                '<code>on</code> returns <code>() =&gt; this.off(event, fn)</code>.'],
        tests: { checks: [
          { name: 'listeners receive emitted payloads', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter(), seen = null;
              e.on('tick', function (p) { seen = p; });
              var n = e.emit('tick', { price: 5240 });
              if (!seen || seen.price !== 5240) return 'the listener did not receive the payload';
              return n === 1 ? true : 'emit should return the listener count, got ' + n;
            } },
          { name: 'the returned handle unsubscribes', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter(), n = 0;
              var stop = e.on('tick', function () { n++; });
              e.emit('tick', 1);
              if (typeof stop !== 'function') return 'on() should return an unsubscribe function';
              stop();
              e.emit('tick', 1);
              return n === 1 ? true : 'the listener ran ' + n + ' times, expected 1';
            } },
          { name: 'off() removes a listener', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter(), n = 0;
              var fn = function () { n++; };
              e.on('tick', fn);
              e.off('tick', fn);
              e.emit('tick', 1);
              return n === 0 ? true : 'off() did not remove the listener';
            } },
          { name: 'emitting an unknown event is safe', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter();
              var n;
              try { n = e.emit('nobody-listening', 1); } catch (err) { return 'it threw: ' + err.message; }
              return n === 0 ? true : 'expected 0, got ' + n;
            } },
          { name: 'events are independent', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter(), a = 0, b = 0;
              e.on('tick', function () { a++; });
              e.on('bar', function () { b++; });
              e.emit('tick', 1);
              return (a === 1 && b === 0) ? true : 'emitting one event triggered another';
            } },
          { name: 'count() reports listeners per event', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter();
              if (e.count('tick') !== 0) return 'a new emitter should count 0';
              e.on('tick', function () {});
              e.on('tick', function () {});
              return e.count('tick') === 2 ? true : 'expected 2, got ' + e.count('tick');
            } }
        ] } },
      { id: 'e2', title: 'Isolate throwing listeners', difficulty: 'Core',
        prompt: 'Write <code>emitSafely(listeners, payload)</code> which calls every listener in order with the payload and returns an array of the error <strong>messages</strong> from any that threw.<br>' +
          'A listener that throws must not prevent the ones after it from running.',
        starter: 'function emitSafely(listeners, payload) {\n  // call all of them, collect failures\n}\n',
        solution: 'function emitSafely(listeners, payload) {\n  const errors = [];\n  for (const fn of listeners) {\n    try { fn(payload); }\n    catch (e) { errors.push(e.message); }\n  }\n  return errors;\n}',
        hints: ['Put the try/catch <em>inside</em> the loop, not around it.',
                'Collect <code>e.message</code> rather than the error object.'],
        tests: { fn: 'emitSafely', cases: [
          { args: [[function () {}, function () {}], 1], expect: [] },
          { args: [[function () { throw new Error('a'); }], 1], expect: ['a'] },
          { args: [[], 1], expect: [] }
        ], checks: [
          { name: 'later listeners still run after one throws', expose: ['emitSafely'],
            run: function (s) {
              var ran = [];
              var errs = s.emitSafely([
                function () { ran.push('A'); },
                function () { throw new Error('B broke'); },
                function () { ran.push('C'); }
              ], null);
              if (ran.join(',') !== 'A,C') return 'listeners that ran were ' + JSON.stringify(ran);
              return (errs.length === 1 && errs[0] === 'B broke') ? true : 'errors were ' + JSON.stringify(errs);
            } },
          { name: 'the payload reaches every listener', expose: ['emitSafely'],
            run: function (s) {
              var seen = [];
              s.emitSafely([function (p) { seen.push(p); }, function (p) { seen.push(p); }], 42);
              return (seen.length === 2 && seen[0] === 42 && seen[1] === 42) ? true : 'got ' + JSON.stringify(seen);
            } }
        ] } },
      { id: 'e3', title: 'once() and a resilient emit', difficulty: 'Stretch',
        prompt: 'Extend <code>Emitter</code> (the base class is in the starter) with:<ul>' +
          '<li><code>once(event, fn)</code> — subscribes a listener that removes itself after its first call, and returns an unsubscribe handle that works before it fires</li>' +
          '<li>an <code>emit</code> override that isolates throwing listeners: every listener still runs, and the errors are collected onto <code>this.lastErrors</code> as an array of messages</li></ul>',
        expose: ['Emitter'],
        starter: 'class Emitter {\n  constructor() { this.listeners = new Map(); this.lastErrors = []; }\n  on(event, fn) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event).add(fn);\n    return () => this.off(event, fn);\n  }\n  off(event, fn) {\n    const set = this.listeners.get(event);\n    if (set) set.delete(fn);\n  }\n  count(event) {\n    const set = this.listeners.get(event);\n    return set ? set.size : 0;\n  }\n\n  once(event, fn) {\n    // subscribe, self-remove after the first call\n  }\n\n  emit(event, payload) {\n    // call every listener, isolate failures into this.lastErrors\n  }\n}\n',
        solution: 'class Emitter {\n  constructor() { this.listeners = new Map(); this.lastErrors = []; }\n  on(event, fn) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event).add(fn);\n    return () => this.off(event, fn);\n  }\n  off(event, fn) {\n    const set = this.listeners.get(event);\n    if (set) set.delete(fn);\n  }\n  count(event) {\n    const set = this.listeners.get(event);\n    return set ? set.size : 0;\n  }\n\n  once(event, fn) {\n    const wrapper = payload => {\n      this.off(event, wrapper);\n      fn(payload);\n    };\n    return this.on(event, wrapper);\n  }\n\n  emit(event, payload) {\n    const set = this.listeners.get(event);\n    this.lastErrors = [];\n    if (!set) return 0;\n    const fns = [...set];\n    for (const fn of fns) {\n      try { fn(payload); }\n      catch (e) { this.lastErrors.push(e.message); }\n    }\n    return fns.length;\n  }\n}',
        hints: ['<code>once</code> registers a wrapper that unsubscribes itself before calling the real listener.',
                'Return <code>this.on(event, wrapper)</code> so the handle removes the wrapper, not the original function.',
                'Reset <code>lastErrors</code> at the start of every emit.'],
        tests: { checks: [
          { name: 'once() fires exactly one time', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter(), n = 0;
              e.once('tick', function () { n++; });
              e.emit('tick', 1); e.emit('tick', 1); e.emit('tick', 1);
              return n === 1 ? true : 'the once listener ran ' + n + ' times';
            } },
          { name: 'once() cleans itself out of the listener set', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter();
              e.once('tick', function () {});
              e.emit('tick', 1);
              return e.count('tick') === 0 ? true : 'the listener is still registered after firing';
            } },
          { name: 'the once handle unsubscribes before it fires', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter(), n = 0;
              var stop = e.once('tick', function () { n++; });
              stop();
              e.emit('tick', 1);
              return n === 0 ? true : 'the cancelled once listener still fired';
            } },
          { name: 'a throwing listener does not stop the others', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter(), ran = [];
              e.on('tick', function () { ran.push('A'); });
              e.on('tick', function () { throw new Error('B broke'); });
              e.on('tick', function () { ran.push('C'); });
              var n = e.emit('tick', 1);
              if (ran.join(',') !== 'A,C') return 'listeners that ran were ' + JSON.stringify(ran);
              return n === 3 ? true : 'emit should report 3 listeners, got ' + n;
            } },
          { name: 'errors are collected onto lastErrors', expose: ['Emitter'],
            run: function (s, h) {
              var e = new s.Emitter();
              e.on('tick', function () { throw new Error('one'); });
              e.on('tick', function () { throw new Error('two'); });
              e.emit('tick', 1);
              return h.eq(e.lastErrors, ['one', 'two']) ? true : 'lastErrors was ' + JSON.stringify(e.lastErrors);
            } },
          { name: 'lastErrors resets on a clean emit', expose: ['Emitter'],
            run: function (s) {
              var e = new s.Emitter();
              e.on('tick', function () { throw new Error('one'); });
              e.emit('tick', 1);
              var e2 = new s.Emitter();
              e2.on('tick', function () {});
              e2.emit('tick', 1);
              return e2.lastErrors.length === 0 ? true : 'a clean emit should leave lastErrors empty';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why should <code>on</code> return an unsubscribe function?',
        options: ['Convention', 'Because <code>off</code> needs the exact same function reference, which callers often no longer have', 'It is faster', 'To allow chaining'],
        answer: 1,
        explain: 'An inline arrow passed to <code>on</code> can never be removed by reference. The returned closure captures it for you.' },
      { q: 'A listener throws during <code>emit</code>. What happens without isolation?',
        options: ['Nothing', 'Every listener registered after it is skipped', 'The emitter is destroyed', 'The event is retried'],
        answer: 1,
        explain: 'The exception propagates out of the loop, so a bug in one subscriber silently disables the rest.' },
      { q: 'Why do listener leaks matter more in a trading screen than a static page?',
        options: ['They do not', 'It is long-running: stale listeners keep firing on every tick and hold their components alive', 'Listeners are expensive to create', 'Browsers forbid them'],
        answer: 1,
        explain: 'A page that lives for hours accumulates every subscription ever made, and each one still runs on every update.' }
    ],
    recap: [
      '<code>on</code>/<code>off</code>/<code>emit</code> is the shape of every feed API.',
      'Return an unsubscribe handle from <code>on</code>.',
      'Wrap each listener call so one failure cannot stop the rest.',
      'Every subscription needs a matching cleanup in a long-running application.'
    ],
    vocab: [
      { term: 'Pub/sub', def: 'Publish–subscribe: producers emit named events, consumers subscribe, and neither knows about the other.' },
      { term: 'Listener leak', def: 'Subscriptions that are never removed. They keep running and keep their objects in memory for the life of the page.' }
    ]
  });


  C.push({
    id: 'd054', day: 54, module: 4, minutes: 30,
    title: 'Cancellation',
    subtitle: 'AbortController, and stopping work nobody wants any more.',
    goal: '<b>Goal:</b> cancel an in-flight request when the user switches symbols, so a late response cannot overwrite a newer one.',
    objectives: [
      'Create and use an <code>AbortController</code>',
      'Make your own async function respect a signal',
      'Prevent an out-of-order response from clobbering fresh data',
      'Clean up listeners attached to a signal'
    ],
    sections: [
      { h: 'The race you did not know you had',
        body: '<p>The user clicks ES, then NQ a moment later. Two requests are in flight. If the ES response happens to arrive second, the chart ends up showing ES data under an NQ heading — and nothing has technically failed.</p>' +
              '<div class="note note-warn"><b>Last request wins, not last response</b>Either cancel the previous request or tag responses and discard the ones that are no longer current. Doing neither is how a screen shows the wrong instrument.</div>',
        code: 'const slow = (v, ms) => new Promise(r => setTimeout(() => r(v), ms));\n\n(async () => {\n  let shown = null;\n  slow("ES-data", 40).then(d => { shown = d; console.log("applied", d); });\n  slow("NQ-data", 10).then(d => { shown = d; console.log("applied", d); });\n  await slow(null, 60);\n  console.log("chart is showing:", shown, "— the older request won");\n})();' },
      { h: 'AbortController',
        body: '<p>A controller exposes a <code>signal</code>. Pass the signal to whatever is doing the work; call <code>controller.abort()</code> and the signal fires. <code>fetch</code> accepts one natively and rejects with an <code>AbortError</code>.</p>',
        code: 'const controller = new AbortController();\nconst { signal } = controller;\n\nsignal.addEventListener("abort", () => console.log("abort fired"));\nconsole.log("aborted before:", signal.aborted);\ncontroller.abort();\nconsole.log("aborted after:", signal.aborted);\n\n// With fetch:\n// fetch(url, { signal }).catch(e => { if (e.name === "AbortError") ... });' },
      { h: 'Making your own function cancellable',
        body: '<p>Three rules: reject immediately if the signal is already aborted; listen for <code>abort</code> while the work is pending; remove the listener when you settle so it cannot leak.</p>',
        code: 'function delay(ms, signal) {\n  return new Promise((resolve, reject) => {\n    if (signal && signal.aborted) return reject(new Error("aborted"));\n    const id = setTimeout(() => { cleanup(); resolve("done"); }, ms);\n    function onAbort() { clearTimeout(id); cleanup(); reject(new Error("aborted")); }\n    function cleanup() { if (signal) signal.removeEventListener("abort", onAbort); }\n    if (signal) signal.addEventListener("abort", onAbort);\n  });\n}\n\nconst c = new AbortController();\ndelay(500, c.signal).catch(e => console.log("caught:", e.message));\nc.abort();' },
      { h: 'The generation counter: cancellation without a controller',
        body: '<p>When you cannot actually cancel the work — a third-party SDK, a computation already running — you can still make it harmless. Tag each request with an increasing number and ignore any response that is not the newest.</p>',
        code: 'function makeLatestOnly() {\n  let generation = 0;\n  return async function run(work) {\n    const mine = ++generation;\n    const result = await work();\n    if (mine !== generation) return null;   // superseded\n    return result;\n  };\n}\n\nconst run = makeLatestOnly();\nconst slow = (v, ms) => () => new Promise(r => setTimeout(() => r(v), ms));\nPromise.all([run(slow("ES", 40)), run(slow("NQ", 5))])\n  .then(([a, b]) => console.log("ES ->", a, "| NQ ->", b));' }
    ],
    parsons: {
      prompt: 'Reject early when the signal is already aborted.',
      lines: [
        'function delay(ms, signal) {',
        '  return new Promise((resolve, reject) => {',
        '    if (signal && signal.aborted) return reject(new Error("aborted"));',
        '    const id = setTimeout(resolve, ms);',
        '    signal.addEventListener("abort", () => { clearTimeout(id); reject(new Error("aborted")); });',
        '  });',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'cancellableDelay()', difficulty: 'Core',
        prompt: 'Write <code>cancellableDelay(ms, signal)</code> returning a Promise that:<ul>' +
          '<li>resolves with <code>"done"</code> after <code>ms</code> milliseconds</li>' +
          '<li>rejects immediately with <code>new Error("aborted")</code> if <code>signal.aborted</code> is already true</li>' +
          '<li>rejects with the same error, and clears its timer, if the signal aborts while waiting</li>' +
          '<li>works when <code>signal</code> is omitted</li></ul>',
        starter: 'function cancellableDelay(ms, signal) {\n  // resolve after ms, or reject on abort\n}\n',
        solution: 'function cancellableDelay(ms, signal) {\n  return new Promise((resolve, reject) => {\n    if (signal && signal.aborted) return reject(new Error("aborted"));\n    const id = setTimeout(() => { cleanup(); resolve("done"); }, ms);\n    function onAbort() { clearTimeout(id); cleanup(); reject(new Error("aborted")); }\n    function cleanup() { if (signal) signal.removeEventListener("abort", onAbort); }\n    if (signal) signal.addEventListener("abort", onAbort);\n  });\n}',
        hints: ['Check <code>signal.aborted</code> before doing anything else — the signal may already have fired.',
                'Keep the timer id so the abort handler can <code>clearTimeout</code> it.',
                'Remove the abort listener on both paths so it cannot leak.'],
        tests: { checks: [
          { name: 'resolves after the delay with no signal', expose: ['cancellableDelay'],
            run: async function (s) {
              var v = await s.cancellableDelay(10);
              return v === 'done' ? true : 'resolved with ' + JSON.stringify(v);
            } },
          { name: 'rejects immediately if already aborted', expose: ['cancellableDelay'],
            run: async function (s) {
              var c = new AbortController();
              c.abort();
              var t0 = Date.now();
              try { await s.cancellableDelay(500, c.signal); } catch (e) {
                if (Date.now() - t0 > 100) return 'it waited instead of rejecting at once';
                return e.message === 'aborted' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'an already-aborted signal should reject';
            } },
          { name: 'rejects when aborted mid-wait', expose: ['cancellableDelay'],
            run: async function (s) {
              var c = new AbortController();
              var p = s.cancellableDelay(500, c.signal);
              setTimeout(function () { c.abort(); }, 10);
              var t0 = Date.now();
              try { await p; } catch (e) {
                if (Date.now() - t0 > 200) return 'it waited for the full delay';
                return e.message === 'aborted' ? true : 'message was ' + JSON.stringify(e.message);
              }
              return 'aborting mid-wait should reject';
            } },
          { name: 'removes its abort listener once settled', expose: ['cancellableDelay'],
            run: async function (s) {
              var c = new AbortController();
              await s.cancellableDelay(5, c.signal);
              var before = 0;
              // aborting after settling must not throw an unhandled rejection
              try { c.abort(); } catch (e) { return 'abort after settling threw: ' + e.message; }
              return true;
            } }
        ] } },
      { id: 'e2', title: 'latestOnly()', difficulty: 'Core',
        prompt: 'Write <code>latestOnly()</code> returning an async function <code>run(work)</code> where <code>work</code> is a function returning a Promise.<br>' +
          'Each call gets a generation number. When the work resolves, return its result only if no newer call has been made since — otherwise return <code>null</code>.',
        starter: 'function latestOnly() {\n  // discard superseded results\n}\n',
        solution: 'function latestOnly() {\n  let generation = 0;\n  return async function run(work) {\n    const mine = ++generation;\n    const result = await work();\n    return mine === generation ? result : null;\n  };\n}',
        hints: ['Increment a counter at the start of each call and capture the value locally.',
                'After awaiting, compare your captured number with the current one.'],
        tests: { checks: [
          { name: 'a lone call returns its result', expose: ['latestOnly'],
            run: async function (s) {
              var run = s.latestOnly();
              var v = await run(function () { return Promise.resolve('ES'); });
              return v === 'ES' ? true : 'got ' + JSON.stringify(v);
            } },
          { name: 'a superseded slow call returns null', expose: ['latestOnly'],
            run: async function (s) {
              var run = s.latestOnly();
              var slow = function (v, ms) { return function () { return new Promise(function (r) { setTimeout(function () { r(v); }, ms); }); }; };
              var results = await Promise.all([run(slow('ES', 40)), run(slow('NQ', 5))]);
              if (results[1] !== 'NQ') return 'the newest call should return its result, got ' + JSON.stringify(results[1]);
              return results[0] === null ? true : 'the superseded call returned ' + JSON.stringify(results[0]);
            } },
          { name: 'sequential calls each return their own result', expose: ['latestOnly'],
            run: async function (s) {
              var run = s.latestOnly();
              var a = await run(function () { return Promise.resolve(1); });
              var b = await run(function () { return Promise.resolve(2); });
              return (a === 1 && b === 2) ? true : 'got ' + a + ' and ' + b;
            } },
          { name: 'each runner has its own generation counter', expose: ['latestOnly'],
            run: async function (s) {
              var r1 = s.latestOnly(), r2 = s.latestOnly();
              var slow = function (v, ms) { return function () { return new Promise(function (r) { setTimeout(function () { r(v); }, ms); }); }; };
              var out = await Promise.all([r1(slow('a', 30)), r2(slow('b', 5))]);
              return out[0] === 'a' ? true : 'one runner cancelled the other';
            } }
        ] } },
      { id: 'e3', title: 'SymbolLoader', difficulty: 'Stretch',
        prompt: 'Build <code>makeSymbolLoader(load)</code> where <code>load(symbol, signal)</code> returns a Promise and honours an abort signal.<br>' +
          'The returned object has:<ul>' +
          '<li><code>select(symbol)</code> — aborts any previous in-flight load, starts a new one, and resolves with its data; if it was superseded it resolves with <code>null</code> rather than rejecting</li>' +
          '<li><code>cancel()</code> — aborts whatever is in flight</li>' +
          '<li><code>current</code> — the symbol most recently selected</li></ul>' +
          '<span class="muted">An abort should never surface as an error to the caller of <code>select</code>.</span>',
        expose: ['makeSymbolLoader'],
        starter: 'function makeSymbolLoader(load) {\n  // return { select, cancel, current }\n}\n',
        solution: 'function makeSymbolLoader(load) {\n  let controller = null;\n  const api = {\n    current: null,\n    async select(symbol) {\n      if (controller) controller.abort();\n      controller = new AbortController();\n      const mine = controller;\n      api.current = symbol;\n      try {\n        return await load(symbol, mine.signal);\n      } catch (e) {\n        if (mine.signal.aborted) return null;\n        throw e;\n      }\n    },\n    cancel() {\n      if (controller) controller.abort();\n      controller = null;\n    }\n  };\n  return api;\n}',
        hints: ['Keep the current controller in the closure and abort it at the start of each <code>select</code>.',
                'Capture your own controller in a local so you can tell whether <em>you</em> were the one aborted.',
                'Swallow the error only when your own signal aborted; a genuine failure should still propagate.'],
        tests: { checks: [
          { name: 'select resolves with the loaded data', expose: ['makeSymbolLoader'],
            run: async function (s) {
              var l = s.makeSymbolLoader(function (sym) { return Promise.resolve(sym + '-data'); });
              var d = await l.select('ES');
              return d === 'ES-data' ? true : 'got ' + JSON.stringify(d);
            } },
          { name: 'tracks the current symbol', expose: ['makeSymbolLoader'],
            run: async function (s) {
              var l = s.makeSymbolLoader(function (sym) { return Promise.resolve(sym); });
              await l.select('NQ');
              return l.current === 'NQ' ? true : 'current was ' + JSON.stringify(l.current);
            } },
          { name: 'aborts the previous load when a new one starts', expose: ['makeSymbolLoader'],
            run: async function (s) {
              var aborted = [];
              var load = function (sym, signal) {
                return new Promise(function (res, rej) {
                  var id = setTimeout(function () { res(sym + '-data'); }, sym === 'ES' ? 60 : 5);
                  signal.addEventListener('abort', function () {
                    clearTimeout(id); aborted.push(sym); rej(new Error('aborted'));
                  });
                });
              };
              var l = s.makeSymbolLoader(load);
              var p1 = l.select('ES');
              var p2 = l.select('NQ');
              var out = await Promise.all([p1, p2]);
              if (aborted.indexOf('ES') < 0) return 'the ES load was never aborted';
              if (out[0] !== null) return 'the superseded select should resolve with null, got ' + JSON.stringify(out[0]);
              return out[1] === 'NQ-data' ? true : 'the newest select returned ' + JSON.stringify(out[1]);
            } },
          { name: 'a real failure still propagates', expose: ['makeSymbolLoader'],
            run: async function (s) {
              var l = s.makeSymbolLoader(function () { return Promise.reject(new Error('feed down')); });
              try { await l.select('ES'); } catch (e) {
                return e.message === 'feed down' ? true : 'got ' + e.message;
              }
              return 'a genuine error should not be swallowed';
            } },
          { name: 'cancel() aborts the in-flight load', expose: ['makeSymbolLoader'],
            run: async function (s) {
              var wasAborted = false;
              var load = function (sym, signal) {
                return new Promise(function (res, rej) {
                  var id = setTimeout(function () { res('late'); }, 100);
                  signal.addEventListener('abort', function () {
                    clearTimeout(id); wasAborted = true; rej(new Error('aborted'));
                  });
                });
              };
              var l = s.makeSymbolLoader(load);
              var p = l.select('ES');
              l.cancel();
              var v = await p;
              if (!wasAborted) return 'cancel() did not abort the load';
              return v === null ? true : 'a cancelled select should resolve with null, got ' + JSON.stringify(v);
            } }
        ] } }
    ],
    quiz: [
      { q: 'The user switches ES → NQ and the ES response arrives last. What goes wrong?',
        options: ['Nothing', 'The chart shows ES data under an NQ heading', 'Both requests fail', 'The browser blocks it'],
        answer: 1,
        explain: 'Last response wins unless you make last <em>request</em> win — by cancelling, or by discarding superseded results.' },
      { q: 'What must a cancellable function do before starting work?',
        options: ['Nothing', 'Check whether the signal is already aborted', 'Create its own controller', 'Add a timeout'],
        answer: 1,
        explain: 'A signal can already be aborted when you receive it. Starting work anyway means it can never be stopped.' },
      { q: 'When is a generation counter better than an AbortController?',
        options: ['Always', 'When the work genuinely cannot be cancelled, so you make it harmless instead', 'Never', 'For fetch only'],
        answer: 1,
        explain: 'Third-party SDKs and running computations often cannot be aborted. Discarding their results is the next best thing.' }
    ],
    recap: [
      'Out-of-order responses are a real race, not a theoretical one.',
      '<code>AbortController</code> gives you a signal to pass into async work.',
      'Check <code>signal.aborted</code> first, listen while pending, remove the listener when settled.',
      'When work cannot be cancelled, ignore its result with a generation counter.'
    ],
    vocab: [
      { term: 'Race condition', def: 'A bug whose outcome depends on the order two operations happen to finish in — the hardest kind to reproduce.' },
      { term: 'AbortError', def: 'The error name <code>fetch</code> rejects with when its signal is aborted. Distinguish it from a real failure before reporting anything.' }
    ]
  });

  C.push({
    id: 'd055', day: 55, module: 4, minutes: 30,
    title: 'Timers, Drift and Scheduling',
    subtitle: 'Running something at every bar close, accurately.',
    goal: '<b>Goal:</b> schedule recurring work that stays aligned to the clock instead of slowly sliding away from it.',
    objectives: [
      'Explain why <code>setInterval</code> drifts and can overlap',
      'Build a self-scheduling loop that corrects for drift',
      'Compute the time until the next bar close',
      'Stop a scheduled loop cleanly'
    ],
    sections: [
      { h: 'setInterval is not a metronome',
        body: '<p>The interval is a <em>minimum</em>. If the callback takes 30ms and the interval is 100ms, the next one is not 100ms after the last <em>start</em> — the delays accumulate. Over a session the error grows without bound.</p>' +
              '<div class="note note-warn"><b>Worse: overlap</b>If an async callback takes longer than the interval, <code>setInterval</code> fires the next one anyway. Two copies of your indicator update now run at once against the same state.</div>',
        code: 'let ticks = 0;\nconst start = Date.now();\nconst id = setInterval(() => {\n  ticks++;\n  const expected = ticks * 20;\n  const actual = Date.now() - start;\n  console.log(`tick ${ticks}: expected ${expected}ms, actual ${actual}ms, drift ${actual - expected}ms`);\n  if (ticks >= 4) clearInterval(id);\n}, 20);' },
      { h: 'Self-scheduling with drift correction',
        body: '<p>Instead of a fixed interval, compute when the <em>next</em> run is due from a fixed start time, and set a timeout for exactly that long. Errors stop accumulating because every delay is measured against the original schedule, not the previous run.</p>',
        code: 'function everyAligned(intervalMs, fn, runs) {\n  const start = Date.now();\n  let n = 0;\n  function schedule() {\n    n++;\n    const due = start + n * intervalMs;\n    const wait = Math.max(0, due - Date.now());\n    setTimeout(() => {\n      fn(n, Date.now() - start);\n      if (n < runs) schedule();\n    }, wait);\n  }\n  schedule();\n}\n\neveryAligned(20, (n, elapsed) => console.log(`run ${n} at ${elapsed}ms`), 4);' },
      { h: 'Aligning to a bar close',
        body: '<p>A 5-minute strategy should act at 09:35:00, not 5 minutes after whenever it happened to start. The time until the next boundary is a modulo away.</p>',
        code: 'function msUntilNextBoundary(nowMs, intervalMs) {\n  const past = nowMs % intervalMs;\n  return past === 0 ? 0 : intervalMs - past;\n}\n\nconst fiveMin = 5 * 60 * 1000;\nconst t = Date.UTC(2024, 4, 14, 13, 32, 30);\nconsole.log(msUntilNextBoundary(t, fiveMin) / 1000, "seconds until the next 5-minute close");' },
      { h: 'Never let two runs overlap',
        body: '<p>With a self-scheduling loop the next timer is only set <em>after</em> the current run finishes, so overlap is impossible by construction — an advantage <code>setInterval</code> cannot offer.</p>',
        code: 'async function loop(fn, intervalMs, shouldStop) {\n  while (!shouldStop()) {\n    await fn();                                       // finishes first\n    await new Promise(r => setTimeout(r, intervalMs)); // then we wait\n  }\n}\n\nlet n = 0;\nloop(async () => { n++; console.log("run", n); },\n     5, () => n >= 3);' }
    ],
    parsons: {
      prompt: 'Work out how long until the next interval boundary.',
      lines: [
        'function msUntilNextBoundary(nowMs, intervalMs) {',
        '  const past = nowMs % intervalMs;',
        '  return past === 0 ? 0 : intervalMs - past;',
        '}',
        'console.log(msUntilNextBoundary(1000, 300));'
      ]
    },
    exercises: [
      { id: 'e1', title: 'msUntilNextBoundary()', difficulty: 'Core',
        prompt: 'Write <code>msUntilNextBoundary(nowMs, intervalMs)</code> returning the milliseconds until the next multiple of <code>intervalMs</code>.<br>' +
          'When <code>nowMs</code> is already exactly on a boundary, return <code>0</code>. An <code>intervalMs</code> of 0 or less returns <code>0</code>.',
        starter: 'function msUntilNextBoundary(nowMs, intervalMs) {\n  // time until the next aligned instant\n}\n',
        solution: 'function msUntilNextBoundary(nowMs, intervalMs) {\n  if (intervalMs <= 0) return 0;\n  const past = nowMs % intervalMs;\n  return past === 0 ? 0 : intervalMs - past;\n}',
        hints: ['<code>nowMs % intervalMs</code> is how far past the last boundary you are.',
                'Subtract that from the interval — unless it is already 0.'],
        tests: { fn: 'msUntilNextBoundary', cases: [
          { args: [1000, 300], expect: 200 },
          { args: [900, 300], expect: 0, name: 'exactly on a boundary returns 0' },
          { args: [0, 300], expect: 0 },
          { args: [Date.UTC(2024, 4, 14, 13, 32, 30), 300000], expect: 150000,
            name: '13:32:30 is 2.5 minutes before the next 5-minute close' },
          { args: [1000, 0], expect: 0, name: 'a non-positive interval returns 0' }
        ] } },
      { id: 'e2', title: 'driftCorrectedSchedule()', difficulty: 'Core',
        prompt: 'Write <code>driftCorrectedSchedule(startMs, intervalMs, runs)</code> returning an array of the <strong>wait times</strong> that a drift-corrected loop would use, given a <code>runs</code> array of how long each callback actually took.<br>' +
          'Run <em>n</em> (1-based) is due at <code>startMs + n × intervalMs</code>. After each run the clock has advanced by that run\'s duration. A wait is never negative.<br>' +
          '<code>driftCorrectedSchedule(0, 100, [30, 30, 30])</code> → <code>[100, 70, 70]</code>',
        starter: 'function driftCorrectedSchedule(startMs, intervalMs, runs) {\n  // the wait before each run\n}\n',
        solution: 'function driftCorrectedSchedule(startMs, intervalMs, runs) {\n  const waits = [];\n  let clock = startMs;\n  for (let i = 0; i < runs.length; i++) {\n    const due = startMs + (i + 1) * intervalMs;\n    const wait = Math.max(0, due - clock);\n    waits.push(wait);\n    clock = clock + wait + runs[i];\n  }\n  return waits;\n}',
        hints: ['Track a simulated clock: it advances by the wait plus the run duration each time.',
                'The due time is always measured from <code>startMs</code>, never from the previous run.',
                'Clamp with <code>Math.max(0, ...)</code> so an overrunning callback fires immediately rather than in the past.'],
        tests: { fn: 'driftCorrectedSchedule', cases: [
          { args: [0, 100, [30, 30, 30]], expect: [100, 70, 70] },
          { args: [0, 100, [0, 0, 0]], expect: [100, 100, 100], name: 'instant callbacks keep the full interval' },
          { args: [0, 100, [150, 10]], expect: [100, 0],
            name: 'a callback that overruns its slot fires the next run immediately' },
          { args: [1000, 50, [10]], expect: [50], name: 'a non-zero start time still works' },
          { args: [0, 100, []], expect: [] }
        ] } },
      { id: 'e3', title: 'makeAlignedLoop()', difficulty: 'Stretch',
        prompt: 'Write <code>makeAlignedLoop({ intervalMs, onTick, now, schedule })</code> where <code>schedule(fn, ms)</code> returns a handle and <code>schedule.cancel(handle)</code> clears it.<br>' +
          'It returns <code>{ start, stop, runs }</code>:<ul>' +
          '<li><code>start()</code> — schedules the first tick at the next boundary (<code>now()</code> rounded up to a multiple of <code>intervalMs</code>), then one every <code>intervalMs</code> thereafter</li>' +
          '<li>each tick calls <code>onTick(runNumber)</code> starting at 1 and increments <code>runs</code></li>' +
          '<li><code>stop()</code> — cancels any pending tick and prevents further scheduling</li></ul>' +
          '<span class="muted">The next tick is scheduled only after the current one has run, so ticks can never overlap.</span>',
        expose: ['makeAlignedLoop'],
        starter: 'function makeAlignedLoop({ intervalMs, onTick, now, schedule }) {\n  // return { start, stop, runs }\n}\n',
        solution: 'function makeAlignedLoop({ intervalMs, onTick, now, schedule }) {\n  let handle = null, stopped = false;\n  const api = {\n    runs: 0,\n    start() {\n      stopped = false;\n      const past = now() % intervalMs;\n      const wait = past === 0 ? 0 : intervalMs - past;\n      plan(wait);\n    },\n    stop() {\n      stopped = true;\n      if (handle !== null) schedule.cancel(handle);\n      handle = null;\n    }\n  };\n  function plan(wait) {\n    handle = schedule(() => {\n      handle = null;\n      if (stopped) return;\n      api.runs++;\n      onTick(api.runs);\n      if (!stopped) plan(intervalMs);\n    }, wait);\n  }\n  return api;\n}',
        hints: ['The first wait aligns to the boundary; every wait after that is a full interval.',
                'Schedule the next tick from inside the current one, after <code>onTick</code> returns.',
                'A <code>stopped</code> flag guards against a tick that was already queued when <code>stop()</code> was called.'],
        tests: { checks: [
          { name: 'the first tick is aligned to the next boundary', expose: ['makeAlignedLoop'],
            run: function (s) {
              var t = 1050, waits = [], id = 0, timers = {};
              var schedule = Object.assign(function (fn, ms) { id++; waits.push(ms); timers[id] = fn; return id; },
                { cancel: function (h) { delete timers[h]; } });
              var loop = s.makeAlignedLoop({ intervalMs: 300, onTick: function () {}, now: function () { return t; }, schedule: schedule });
              loop.start();
              return waits[0] === 150 ? true : 'the first wait was ' + waits[0] + ', expected 150';
            } },
          { name: 'later ticks use the full interval', expose: ['makeAlignedLoop'],
            run: function (s) {
              var t = 1050, waits = [], id = 0, timers = {};
              var schedule = Object.assign(function (fn, ms) { id++; waits.push(ms); timers[id] = fn; return id; },
                { cancel: function (h) { delete timers[h]; } });
              var loop = s.makeAlignedLoop({ intervalMs: 300, onTick: function () {}, now: function () { return t; }, schedule: schedule });
              loop.start();
              timers[Object.keys(timers)[0]]();
              return waits[1] === 300 ? true : 'the second wait was ' + waits[1] + ', expected 300';
            } },
          { name: 'onTick receives an increasing run number', expose: ['makeAlignedLoop'],
            run: function (s) {
              var t = 0, seen = [], id = 0, timers = {};
              var schedule = Object.assign(function (fn) { id++; timers[id] = fn; return id; },
                { cancel: function (h) { delete timers[h]; } });
              var loop = s.makeAlignedLoop({ intervalMs: 100, onTick: function (n) { seen.push(n); }, now: function () { return t; }, schedule: schedule });
              loop.start();
              for (var i = 0; i < 3; i++) {
                var k = Object.keys(timers)[0];
                var fn = timers[k]; delete timers[k]; fn();
              }
              return (seen.join(',') === '1,2,3') ? true : 'onTick saw ' + JSON.stringify(seen);
            } },
          { name: 'runs counts the ticks', expose: ['makeAlignedLoop'],
            run: function (s) {
              var t = 0, id = 0, timers = {};
              var schedule = Object.assign(function (fn) { id++; timers[id] = fn; return id; },
                { cancel: function (h) { delete timers[h]; } });
              var loop = s.makeAlignedLoop({ intervalMs: 100, onTick: function () {}, now: function () { return t; }, schedule: schedule });
              loop.start();
              var k = Object.keys(timers)[0];
              var fn = timers[k]; delete timers[k]; fn();
              return loop.runs === 1 ? true : 'runs was ' + loop.runs;
            } },
          { name: 'stop() cancels the pending tick and halts scheduling', expose: ['makeAlignedLoop'],
            run: function (s) {
              var t = 0, id = 0, timers = {}, ticks = 0;
              var schedule = Object.assign(function (fn) { id++; timers[id] = fn; return id; },
                { cancel: function (h) { delete timers[h]; } });
              var loop = s.makeAlignedLoop({ intervalMs: 100, onTick: function () { ticks++; }, now: function () { return t; }, schedule: schedule });
              loop.start();
              loop.stop();
              if (Object.keys(timers).length !== 0) return 'a pending timer survived stop()';
              return ticks === 0 ? true : 'a tick fired after stop()';
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why does <code>setInterval</code> drift?',
        options: ['The clock is inaccurate', 'The interval is a minimum, and each callback\'s own duration accumulates', 'Browsers throttle it', 'It does not drift'],
        answer: 1,
        explain: 'Delays add up because each interval is measured from the previous callback, not from a fixed origin.' },
      { q: 'An async <code>setInterval</code> callback takes longer than the interval. What happens?',
        options: ['The next one is skipped', 'A second copy starts while the first is still running', 'The interval is doubled', 'It throws'],
        answer: 1,
        explain: 'Overlapping runs share and corrupt state. A self-scheduling loop makes this impossible.' },
      { q: 'How do you align a 5-minute loop to real bar closes?',
        options: ['Start it at 09:30 exactly', 'Compute <code>interval - (now % interval)</code> for the first wait', 'Use setInterval', 'Round the callback duration'],
        answer: 1,
        explain: 'The modulo tells you how far past the last boundary you are; the remainder is the wait to the next one.' }
    ],
    recap: [
      '<code>setInterval</code> drifts and can overlap its own callbacks.',
      'Schedule the next run from a fixed origin to stop drift accumulating.',
      '<code>interval - (now % interval)</code> aligns to the next boundary.',
      'Scheduling after the run finishes makes overlap impossible.'
    ],
    vocab: [
      { term: 'Bar close', def: 'The instant a bar\'s period ends and it becomes final. Most systematic strategies act only on closed bars.' },
      { term: 'Clock drift', def: 'The growing gap between when work was supposed to happen and when it actually did.' }
    ]
  });

  C.push({
    id: 'd056', day: 56, module: 4, minutes: 35,
    title: 'A Resilient Feed Adapter',
    subtitle: 'Everything in this module, wired into one component.',
    goal: '<b>Goal:</b> wrap a flaky live feed in an adapter that reconnects, deduplicates, and tells its consumers the truth about its state.',
    objectives: [
      'Combine an emitter, retries and a state machine',
      'Reconnect with backoff after a disconnection',
      'Drop duplicate and out-of-order ticks',
      'Report connection state honestly to consumers'
    ],
    sections: [
      { h: 'The adapter\'s job',
        body: '<p>A raw WebSocket gives you bytes and a socket that sometimes closes. Between it and your strategy sits an adapter that owns the messy parts:</p>' +
              '<ul><li><strong>Connection state</strong> — <code>disconnected → connecting → connected</code>, emitted so the UI can show it</li>' +
              '<li><strong>Reconnection</strong> — with backoff, and a cap so a dead endpoint does not spin forever</li>' +
              '<li><strong>Deduplication</strong> — feeds replay on reconnect; the same tick can arrive twice</li>' +
              '<li><strong>Ordering</strong> — a tick older than the last one you processed must be discarded, not applied</li></ul>' },
      { h: 'A tiny state machine',
        body: '<p>Three states and explicit transitions. Modelling it this way makes an illegal sequence — reconnecting while already connected — impossible rather than merely unlikely.</p>',
        code: 'const TRANSITIONS = {\n  disconnected: ["connecting"],\n  connecting: ["connected", "disconnected"],\n  connected: ["disconnected"]\n};\n\nfunction canMove(from, to) {\n  return (TRANSITIONS[from] || []).includes(to);\n}\n\nconsole.log(canMove("disconnected", "connecting"));  // true\nconsole.log(canMove("connected", "connecting"));     // false' },
      { h: 'Sequence numbers beat timestamps',
        body: '<p>Feeds usually stamp each message with a monotonically increasing sequence number. Track the highest seen; anything at or below it is a duplicate or a straggler, and applying it would move your book backwards.</p>' +
              '<div class="note note-warn"><b>Do not deduplicate on price</b>Two genuine trades can happen at the same price and the same millisecond. The sequence number is the only field that is actually unique.</div>',
        code: 'let lastSeq = 0;\nfunction accept(tick) {\n  if (tick.seq <= lastSeq) return false;   // duplicate or out of order\n  lastSeq = tick.seq;\n  return true;\n}\n\n[1, 2, 2, 5, 3, 6].forEach(seq =>\n  console.log("seq", seq, accept({ seq }) ? "accepted" : "dropped"));' },
      { h: 'Say what state you are in',
        body: '<p>A consumer that cannot tell "no ticks because the market is quiet" from "no ticks because we are disconnected" will eventually act on the wrong one. Emit the state change, every time, and let the strategy decide whether to stand down.</p>' }
    ],
    parsons: {
      prompt: 'Accept only ticks newer than the last one seen.',
      lines: [
        'let lastSeq = 0;',
        'function accept(tick) {',
        '  if (tick.seq <= lastSeq) return false;',
        '  lastSeq = tick.seq;',
        '  return true;',
        '}'
      ]
    },
    exercises: [
      { id: 'e1', title: 'makeSequenceFilter()', difficulty: 'Core',
        prompt: 'Write <code>makeSequenceFilter()</code> returning an object:<ul>' +
          '<li><code>accept(tick)</code> — <code>true</code> if <code>tick.seq</code> is strictly greater than every sequence accepted so far, otherwise <code>false</code></li>' +
          '<li><code>dropped</code> — how many ticks have been rejected</li>' +
          '<li><code>reset()</code> — forget the history and zero the counter</li></ul>',
        expose: ['makeSequenceFilter'],
        starter: 'function makeSequenceFilter() {\n  // return { accept, dropped, reset }\n}\n',
        solution: 'function makeSequenceFilter() {\n  let last = -Infinity;\n  const api = {\n    dropped: 0,\n    accept(tick) {\n      if (tick.seq <= last) { api.dropped++; return false; }\n      last = tick.seq;\n      return true;\n    },\n    reset() { last = -Infinity; api.dropped = 0; }\n  };\n  return api;\n}',
        hints: ['Seed the highest-seen value with <code>-Infinity</code> so the very first tick is always accepted.',
                'Build the object first so <code>accept</code> can increment <code>api.dropped</code>.'],
        tests: { checks: [
          { name: 'accepts increasing sequences', expose: ['makeSequenceFilter'],
            run: function (s) {
              var f = s.makeSequenceFilter();
              if (!f.accept({ seq: 1 })) return 'the first tick should be accepted';
              return f.accept({ seq: 2 }) ? true : 'an increasing sequence should be accepted';
            } },
          { name: 'drops duplicates and stragglers', expose: ['makeSequenceFilter'],
            run: function (s) {
              var f = s.makeSequenceFilter();
              f.accept({ seq: 5 });
              if (f.accept({ seq: 5 }) !== false) return 'a duplicate should be dropped';
              if (f.accept({ seq: 3 }) !== false) return 'an older sequence should be dropped';
              return f.accept({ seq: 6 }) === true ? true : 'a newer sequence should still be accepted';
            } },
          { name: 'counts what it dropped', expose: ['makeSequenceFilter'],
            run: function (s) {
              var f = s.makeSequenceFilter();
              [1, 2, 2, 5, 3, 6].forEach(function (seq) { f.accept({ seq: seq }); });
              return f.dropped === 2 ? true : 'expected 2 drops, got ' + f.dropped;
            } },
          { name: 'accepts sequence 0 as a first tick', expose: ['makeSequenceFilter'],
            run: function (s) {
              var f = s.makeSequenceFilter();
              return f.accept({ seq: 0 }) === true ? true : 'seq 0 should be accepted when nothing has been seen';
            } },
          { name: 'reset() clears the history and the counter', expose: ['makeSequenceFilter'],
            run: function (s) {
              var f = s.makeSequenceFilter();
              f.accept({ seq: 10 });
              f.accept({ seq: 5 });
              f.reset();
              if (f.dropped !== 0) return 'reset() should zero the drop count';
              return f.accept({ seq: 1 }) === true ? true : 'after reset() any sequence should be accepted';
            } }
        ] } },
      { id: 'e2', title: 'connectionState()', difficulty: 'Core',
        prompt: 'Write <code>connectionState(onChange)</code> returning an object with a <code>state</code> property (starting at <code>"disconnected"</code>) and a method <code>to(next)</code>.<br>' +
          '<code>to</code> returns <code>true</code> and calls <code>onChange(from, to)</code> when the move is legal, and returns <code>false</code> without changing anything when it is not.<br>' +
          'Legal moves: <code>disconnected → connecting</code>; <code>connecting → connected</code> or <code>disconnected</code>; <code>connected → disconnected</code>.',
        expose: ['connectionState'],
        starter: 'function connectionState(onChange) {\n  // return { state, to }\n}\n',
        solution: 'function connectionState(onChange) {\n  const TRANSITIONS = {\n    disconnected: ["connecting"],\n    connecting: ["connected", "disconnected"],\n    connected: ["disconnected"]\n  };\n  const api = {\n    state: "disconnected",\n    to(next) {\n      if (!TRANSITIONS[api.state].includes(next)) return false;\n      const from = api.state;\n      api.state = next;\n      onChange(from, next);\n      return true;\n    }\n  };\n  return api;\n}',
        hints: ['A lookup object of allowed destinations per state keeps the rules in one readable place.',
                'Capture the previous state before overwriting it, so <code>onChange</code> gets both.'],
        tests: { checks: [
          { name: 'starts disconnected', expose: ['connectionState'],
            run: function (s) {
              var c = s.connectionState(function () {});
              return c.state === 'disconnected' ? true : 'started at ' + c.state;
            } },
          { name: 'follows the legal path', expose: ['connectionState'],
            run: function (s) {
              var c = s.connectionState(function () {});
              if (c.to('connecting') !== true) return 'disconnected -> connecting should be allowed';
              if (c.to('connected') !== true) return 'connecting -> connected should be allowed';
              if (c.to('disconnected') !== true) return 'connected -> disconnected should be allowed';
              return c.state === 'disconnected' ? true : 'ended at ' + c.state;
            } },
          { name: 'rejects an illegal move without changing state', expose: ['connectionState'],
            run: function (s) {
              var c = s.connectionState(function () {});
              c.to('connecting'); c.to('connected');
              if (c.to('connecting') !== false) return 'connected -> connecting should be rejected';
              return c.state === 'connected' ? true : 'a rejected move changed the state to ' + c.state;
            } },
          { name: 'reports both states to onChange', expose: ['connectionState'],
            run: function (s) {
              var seen = [];
              var c = s.connectionState(function (from, to) { seen.push(from + '->' + to); });
              c.to('connecting');
              c.to('connected');
              return (seen.join(',') === 'disconnected->connecting,connecting->connected')
                ? true : 'onChange saw ' + JSON.stringify(seen);
            } },
          { name: 'a rejected move does not call onChange', expose: ['connectionState'],
            run: function (s) {
              var n = 0;
              var c = s.connectionState(function () { n++; });
              c.to('connected');
              return n === 0 ? true : 'onChange fired for an illegal transition';
            } }
        ] } },
      { id: 'e3', title: 'class FeedAdapter', difficulty: 'Stretch',
        prompt: 'Assemble the adapter. <code>new FeedAdapter({ connect, maxRetries, sleep })</code> where <code>connect()</code> returns a Promise that resolves with a socket-like object or rejects.<ul>' +
          '<li><code>on(event, fn)</code> / <code>emit(event, payload)</code> — the emitter from day 53 (a base is supplied)</li>' +
          '<li><code>async start()</code> — emits <code>"state"</code> with <code>"connecting"</code>, then calls <code>connect()</code>; on success emits <code>"state"</code> with <code>"connected"</code> and resolves <code>true</code></li>' +
          '<li>on failure, <code>await sleep(attempt)</code> and retry, up to <code>maxRetries</code> total attempts; if all fail, emit <code>"state"</code> with <code>"disconnected"</code> and resolve <code>false</code></li>' +
          '<li><code>handleTick(tick)</code> — emits <code>"tick"</code> only for sequences strictly newer than any seen before, and returns whether it emitted</li></ul>',
        expose: ['FeedAdapter'],
        starter: 'class FeedAdapter {\n  constructor({ connect, maxRetries, sleep }) {\n    this.connect = connect;\n    this.maxRetries = maxRetries;\n    this.sleep = sleep;\n    this.listeners = new Map();\n    this.lastSeq = -Infinity;\n    this.state = "disconnected";\n  }\n\n  on(event, fn) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event).add(fn);\n    return () => this.listeners.get(event).delete(fn);\n  }\n\n  emit(event, payload) {\n    const set = this.listeners.get(event);\n    if (set) [...set].forEach(fn => fn(payload));\n  }\n\n  async start() {\n    // connecting -> connected, or retry, or disconnected\n  }\n\n  handleTick(tick) {\n    // emit only genuinely new ticks\n  }\n}\n',
        solution: 'class FeedAdapter {\n  constructor({ connect, maxRetries, sleep }) {\n    this.connect = connect;\n    this.maxRetries = maxRetries;\n    this.sleep = sleep;\n    this.listeners = new Map();\n    this.lastSeq = -Infinity;\n    this.state = "disconnected";\n  }\n\n  on(event, fn) {\n    if (!this.listeners.has(event)) this.listeners.set(event, new Set());\n    this.listeners.get(event).add(fn);\n    return () => this.listeners.get(event).delete(fn);\n  }\n\n  emit(event, payload) {\n    const set = this.listeners.get(event);\n    if (set) [...set].forEach(fn => fn(payload));\n  }\n\n  setState(next) {\n    this.state = next;\n    this.emit("state", next);\n  }\n\n  async start() {\n    this.setState("connecting");\n    for (let attempt = 0; attempt < this.maxRetries; attempt++) {\n      try {\n        this.socket = await this.connect();\n        this.setState("connected");\n        return true;\n      } catch (e) {\n        if (attempt < this.maxRetries - 1) await this.sleep(attempt);\n      }\n    }\n    this.setState("disconnected");\n    return false;\n  }\n\n  handleTick(tick) {\n    if (tick.seq <= this.lastSeq) return false;\n    this.lastSeq = tick.seq;\n    this.emit("tick", tick);\n    return true;\n  }\n}',
        hints: ['A small <code>setState</code> helper keeps the state field and the emitted event from drifting apart.',
                'The retry loop is day 48\'s, with the state emissions around it.',
                'Do not sleep after the final failed attempt.'],
        tests: { checks: [
          { name: 'a successful connect emits connecting then connected', expose: ['FeedAdapter'],
            run: async function (s) {
              var states = [];
              var a = new s.FeedAdapter({ connect: function () { return Promise.resolve({}); }, maxRetries: 3, sleep: function () { return Promise.resolve(); } });
              a.on('state', function (st) { states.push(st); });
              var ok = await a.start();
              if (ok !== true) return 'start() should resolve true on success';
              return (states.join(',') === 'connecting,connected') ? true : 'states were ' + JSON.stringify(states);
            } },
          { name: 'retries then succeeds', expose: ['FeedAdapter'],
            run: async function (s) {
              var n = 0, sleeps = 0;
              var a = new s.FeedAdapter({
                connect: function () { return ++n < 3 ? Promise.reject(new Error('down')) : Promise.resolve({}); },
                maxRetries: 5, sleep: function () { sleeps++; return Promise.resolve(); }
              });
              var ok = await a.start();
              if (!ok) return 'it should have connected on the third attempt';
              if (n !== 3) return 'connect ran ' + n + ' times, expected 3';
              return sleeps === 2 ? true : 'expected 2 sleeps between 3 attempts, got ' + sleeps;
            } },
          { name: 'gives up after maxRetries and reports disconnected', expose: ['FeedAdapter'],
            run: async function (s) {
              var n = 0, states = [];
              var a = new s.FeedAdapter({
                connect: function () { n++; return Promise.reject(new Error('down')); },
                maxRetries: 3, sleep: function () { return Promise.resolve(); }
              });
              a.on('state', function (st) { states.push(st); });
              var ok = await a.start();
              if (ok !== false) return 'start() should resolve false when it never connects';
              if (n !== 3) return 'connect ran ' + n + ' times, expected exactly 3';
              return (states.join(',') === 'connecting,disconnected') ? true : 'states were ' + JSON.stringify(states);
            } },
          { name: 'does not sleep after the final failed attempt', expose: ['FeedAdapter'],
            run: async function (s) {
              var sleeps = 0;
              var a = new s.FeedAdapter({
                connect: function () { return Promise.reject(new Error('down')); },
                maxRetries: 3, sleep: function () { sleeps++; return Promise.resolve(); }
              });
              await a.start();
              return sleeps === 2 ? true : 'expected 2 sleeps for 3 attempts, got ' + sleeps;
            } },
          { name: 'emits only genuinely new ticks', expose: ['FeedAdapter'],
            run: function (s) {
              var got = [];
              var a = new s.FeedAdapter({ connect: function () { return Promise.resolve({}); }, maxRetries: 1, sleep: function () { return Promise.resolve(); } });
              a.on('tick', function (t) { got.push(t.seq); });
              var accepted = [1, 2, 2, 5, 3, 6].map(function (seq) { return a.handleTick({ seq: seq }); });
              if (got.join(',') !== '1,2,5,6') return 'emitted sequences were ' + JSON.stringify(got);
              return (accepted.join(',') === 'true,true,false,true,false,true')
                ? true : 'handleTick returned ' + JSON.stringify(accepted);
            } },
          { name: 'the state field tracks the emitted state', expose: ['FeedAdapter'],
            run: async function (s) {
              var a = new s.FeedAdapter({ connect: function () { return Promise.resolve({}); }, maxRetries: 1, sleep: function () { return Promise.resolve(); } });
              await a.start();
              return a.state === 'connected' ? true : 'state field was ' + a.state;
            } }
        ] } }
    ],
    quiz: [
      { q: 'Why deduplicate on a sequence number rather than price and time?',
        options: ['It is faster', 'Two genuine trades can share a price and a millisecond; only the sequence is unique', 'Prices are strings', 'Timestamps are not available'],
        answer: 1,
        explain: 'Deduplicating on price silently discards real trades. The sequence number is the feed\'s own identity for each message.' },
      { q: 'Why model connection state explicitly instead of using a boolean?',
        options: ['Booleans are slow', '"connecting" is neither connected nor disconnected, and illegal transitions become impossible', 'It uses less memory', 'No good reason'],
        answer: 1,
        explain: 'A boolean cannot express the in-between state, and nothing prevents contradictory transitions.' },
      { q: 'Why must consumers be told the adapter is disconnected?',
        options: ['For logging', 'Otherwise "no ticks" is indistinguishable from "a quiet market"', 'To trigger a reload', 'They do not need to know'],
        answer: 1,
        explain: 'A strategy that cannot tell silence from failure will eventually treat a dead feed as a calm market.' }
    ],
    recap: [
      'An adapter owns reconnection, deduplication, ordering and state.',
      'Sequence numbers are the only reliable identity for a tick.',
      'An explicit state machine makes illegal transitions impossible.',
      'Always tell consumers when the feed is down.'
    ],
    vocab: [
      { term: 'Sequence number', def: 'A monotonically increasing id on each feed message, used to detect gaps, duplicates and reordering.' },
      { term: 'Heartbeat', def: 'A periodic message proving the connection is alive. Missing several is how you detect a socket that is open but dead.' }
    ]
  });

})();
