/* ============================================================
   runner.js — sandboxed execution + test harness
   Runs student code with console capture, an infinite-loop
   guard, async support and deep-equality assertions.
   ============================================================ */
(function (global) {
  'use strict';

  var MAX_MS = 3000;        // hard wall-clock budget for one run
  var MAX_LOGS = 300;       // console lines kept per run

  /* ---------- infinite-loop guard -------------------------------------
     Walks the source with a tiny scanner that understands strings,
     template literals and comments, then injects a tick counter as the
     first statement of every braced loop body. */
  function injectLoopGuard(src) {
    var out = '';
    var i = 0, n = src.length;
    var prevSignificant = '';

    function isIdentChar(c) { return /[A-Za-z0-9_$]/.test(c); }

    while (i < n) {
      var c = src[i];
      var two = src.substr(i, 2);

      // line comment
      if (two === '//') {
        var e = src.indexOf('\n', i); if (e === -1) e = n;
        out += src.slice(i, e); i = e; continue;
      }
      // block comment
      if (two === '/*') {
        var e2 = src.indexOf('*/', i + 2); e2 = e2 === -1 ? n : e2 + 2;
        out += src.slice(i, e2); i = e2; continue;
      }
      // strings and template literals
      if (c === '"' || c === "'" || c === '`') {
        var q = c, j = i + 1;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === q) { j++; break; }
          j++;
        }
        out += src.slice(i, j); i = j; continue;
      }
      // loop keywords at an identifier boundary
      if ((c === 'f' || c === 'w' || c === 'd') && !isIdentChar(prevSignificant)) {
        var kw = null;
        if (src.startsWith('for', i)) kw = 'for';
        else if (src.startsWith('while', i)) kw = 'while';
        else if (src.startsWith('do', i)) kw = 'do';
        if (kw && !isIdentChar(src[i + kw.length] || ' ')) {
          out += kw;
          var k = i + kw.length;
          if (kw === 'do') {
            // skip whitespace to the body
            while (k < n && /\s/.test(src[k])) { out += src[k]; k++; }
          } else {
            // copy whitespace then the balanced ( ... ) header
            while (k < n && /\s/.test(src[k])) { out += src[k]; k++; }
            if (src[k] === '(') {
              var depth = 0;
              while (k < n) {
                if (src[k] === '(') depth++;
                else if (src[k] === ')') { depth--; out += src[k]; k++; if (!depth) break; continue; }
                out += src[k]; k++;
              }
            }
            while (k < n && /\s/.test(src[k])) { out += src[k]; k++; }
          }
          if (src[k] === '{') { out += '{__tick();'; k++; }
          i = k; prevSignificant = '}'; continue;
        }
      }
      out += c;
      if (!/\s/.test(c)) prevSignificant = c;
      i++;
    }
    return out;
  }

  /* ---------- console capture ---------- */
  function fmt(v, depth) {
    depth = depth || 0;
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    var t = typeof v;
    if (t === 'string') return depth ? JSON.stringify(v) : v;
    if (t === 'number' || t === 'boolean') return String(v);
    if (t === 'function') return 'ƒ ' + (v.name || 'anonymous') + '()';
    if (t === 'symbol' || t === 'bigint') return String(v);
    if (depth > 3) return '…';
    if (Array.isArray(v)) {
      if (v.length > 60) {
        return '[' + v.slice(0, 60).map(function (x) { return fmt(x, depth + 1); }).join(', ')
          + ', … ' + (v.length - 60) + ' more]';
      }
      return '[' + v.map(function (x) { return fmt(x, depth + 1); }).join(', ') + ']';
    }
    if (v instanceof Error) return v.name + ': ' + v.message;
    if (v instanceof Map) return 'Map(' + v.size + ') {' + Array.from(v).map(function (e) {
      return fmt(e[0], depth + 1) + ' => ' + fmt(e[1], depth + 1);
    }).join(', ') + '}';
    if (v instanceof Set) return 'Set(' + v.size + ') {' + Array.from(v).map(function (e) {
      return fmt(e, depth + 1);
    }).join(', ') + '}';
    if (v instanceof Date) return v.toISOString();
    if (v instanceof Promise) return 'Promise { … }';
    var keys = Object.keys(v);
    var name = (v.constructor && v.constructor.name && v.constructor.name !== 'Object')
      ? v.constructor.name + ' ' : '';
    if (!keys.length) return name + '{}';
    return name + '{ ' + keys.slice(0, 40).map(function (k) {
      return k + ': ' + fmt(v[k], depth + 1);
    }).join(', ') + (keys.length > 40 ? ', …' : '') + ' }';
  }

  /* ---------- deep equality ---------- */
  function eq(a, b, tol) {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') {
      if (Number.isNaN(a) && Number.isNaN(b)) return true;
      if (tol && Number.isFinite(a) && Number.isFinite(b)) return Math.abs(a - b) <= tol;
      return false;
    }
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!eq(a[i], b[i], tol)) return false;
      return true;
    }
    if (a instanceof Map && b instanceof Map) {
      if (a.size !== b.size) return false;
      var ok = true;
      a.forEach(function (v, k) { if (!b.has(k) || !eq(v, b.get(k), tol)) ok = false; });
      return ok;
    }
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      var ok2 = true;
      a.forEach(function (v) { if (!b.has(v)) ok2 = false; });
      return ok2;
    }
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var j = 0; j < ka.length; j++) {
      if (!Object.prototype.hasOwnProperty.call(b, ka[j])) return false;
      if (!eq(a[ka[j]], b[ka[j]], tol)) return false;
    }
    return true;
  }

  /* ---------- fresh sandbox data ---------- */
  function sandboxData() {
    var M = global.MARKET;
    var c = M.clone();
    return {
      bars: c.bars,
      closes: c.closes,
      highs: c.bars.map(function (b) { return b.high; }),
      lows: c.bars.map(function (b) { return b.low; }),
      volumes: c.bars.map(function (b) { return b.volume; }),
      positions: c.positions,
      trades: c.trades,
      specs: c.specs
    };
  }

  var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

  /**
   * Execute student source.
   * @param {string} code
   * @param {string[]} expose  names to pull out of the student's scope
   * @returns {Promise<{logs, error, scope, ms}>}
   */
  async function execute(code, expose) {
    expose = expose || [];
    var logs = [];
    var truncated = false;

    function push(kind, args) {
      if (logs.length >= MAX_LOGS) { truncated = true; return; }
      logs.push({ kind: kind, text: args.map(function (a) { return fmt(a); }).join(' ') });
    }
    var sandboxConsole = {
      log: function () { push('log', [].slice.call(arguments)); },
      info: function () { push('log', [].slice.call(arguments)); },
      debug: function () { push('log', [].slice.call(arguments)); },
      warn: function () { push('warn', [].slice.call(arguments)); },
      error: function () { push('err', [].slice.call(arguments)); },
      table: function () { push('log', [].slice.call(arguments)); }
    };

    var deadline = Date.now() + MAX_MS;
    var ticks = 0;
    function __tick() {
      if ((++ticks & 2047) === 0 && Date.now() > deadline) {
        throw new Error('Execution stopped after ' + MAX_MS + 'ms — this looks like an infinite loop.');
      }
    }

    var data = sandboxData();
    var guarded;
    try {
      guarded = injectLoopGuard(code);
    } catch (e) {
      guarded = code; // scanner hiccup: run the original
    }

    var tail = '\nreturn (function(){var __o={};' + expose.map(function (nm) {
      return 'try{__o[' + JSON.stringify(nm) + ']=' + nm + ';}catch(e){}';
    }).join('') + 'return __o;})();';

    var argNames = ['console', '__tick', 'MARKET', 'bars', 'closes', 'highs', 'lows',
      'volumes', 'positions', 'trades', 'specs'];
    var argVals = [sandboxConsole, __tick, global.MARKET, data.bars, data.closes, data.highs,
      data.lows, data.volumes, data.positions, data.trades, data.specs];

    var t0 = performance.now();
    var fn;
    try {
      fn = new AsyncFunction(argNames.join(','), '"use strict";\n' + guarded + tail);
    } catch (e) {
      return { logs: logs, error: 'SyntaxError: ' + e.message, scope: {}, ms: 0 };
    }

    var scope = {}, error = null;
    try {
      scope = await Promise.race([
        fn.apply(null, argVals),
        new Promise(function (_, rej) {
          setTimeout(function () {
            rej(new Error('Timed out after ' + MAX_MS + 'ms — a promise never settled, or a loop never ended.'));
          }, MAX_MS);
        })
      ]) || {};
    } catch (e) {
      error = (e && e.stack ? String(e.name + ': ' + e.message) : String(e));
    }
    if (truncated) logs.push({ kind: 'mute', text: '… output truncated at ' + MAX_LOGS + ' lines' });

    return { logs: logs, error: error, scope: scope, ms: Math.round(performance.now() - t0) };
  }

  /* ---------- test harness ---------- */
  function describeCall(fnName, args) {
    return fnName + '(' + args.map(function (a) {
      var s = fmt(a, 1);
      return s.length > 46 ? s.slice(0, 43) + '…]' : s;
    }).join(', ') + ')';
  }

  /**
   * Run an exercise's test suite against student code.
   * @returns {Promise<{ran, error, logs, results:[{name,pass,why}], passed, total, ms}>}
   */
  async function runTests(code, exercise) {
    var spec = exercise.tests || {};
    var expose = exercise.expose || (spec.fn ? [spec.fn] : []);
    if (spec.checks) {
      spec.checks.forEach(function (c) {
        (c.expose || []).forEach(function (n) { if (expose.indexOf(n) < 0) expose.push(n); });
      });
    }

    var run = await execute(code, expose);
    var results = [];

    if (run.error) {
      return {
        ran: false, error: run.error, logs: run.logs, results: [], passed: 0,
        total: countTests(exercise), ms: run.ms
      };
    }

    var helpers = { eq: eq, fmt: fmt, approx: function (a, b, t) { return eq(a, b, t || 1e-6); } };

    // 1. console-output assertions
    if (spec.logs) {
      var actual = run.logs.filter(function (l) { return l.kind === 'log'; })
        .map(function (l) { return l.text.trim(); });
      spec.logs.forEach(function (want, i) {
        var got = actual[i];
        var pass = typeof want === 'string'
          ? got === want
          : (want instanceof RegExp ? want.test(got || '') : false);
        results.push({
          name: 'console line ' + (i + 1) + ' is ' + (want instanceof RegExp ? String(want) : JSON.stringify(want)),
          pass: pass,
          why: pass ? '' : 'got ' + (got === undefined ? '(nothing logged)' : JSON.stringify(got))
        });
      });
    }

    // 2. function call cases
    if (spec.fn) {
      var f = run.scope[spec.fn];
      if (typeof f !== 'function') {
        results.push({
          name: 'defines a function called ' + spec.fn + '()',
          pass: false,
          why: f === undefined
            ? 'no variable named ' + spec.fn + ' was found — check the spelling'
            : spec.fn + ' exists but is a ' + typeof f + ', not a function'
        });
      } else {
        for (var i = 0; i < (spec.cases || []).length; i++) {
          var cs = spec.cases[i];
          var args = typeof cs.args === 'function' ? cs.args() : (cs.args || []);
          var name = cs.name || describeCall(spec.fn, args);
          var got, threw = null;
          try { got = await f.apply(null, args.map(clone)); }
          catch (e) { threw = e; }
          if (threw) {
            results.push({ name: name, pass: false, why: 'threw ' + (threw && threw.message ? threw.name + ': ' + threw.message : String(threw)) });
            continue;
          }
          var tol = cs.approx !== undefined ? cs.approx : spec.approx;
          var pass, why = '';
          if (cs.check) {
            var v = cs.check(got, args, helpers);
            pass = v === true;
            why = pass ? '' : (typeof v === 'string' ? v : 'returned ' + fmt(got, 1));
          } else {
            pass = eq(got, cs.expect, tol);
            why = pass ? '' : 'expected ' + fmt(cs.expect, 1) + '  ·  got ' + fmt(got, 1);
          }
          results.push({ name: name, pass: pass, why: why });
        }
      }
    }

    // 3. free-form checks over the whole scope
    if (spec.checks) {
      for (var j = 0; j < spec.checks.length; j++) {
        var chk = spec.checks[j];
        var res;
        try { res = await chk.run(run.scope, helpers, run); }
        catch (e) { res = 'threw ' + (e && e.message ? e.message : String(e)); }
        results.push({
          name: chk.name,
          pass: res === true,
          why: res === true ? '' : (typeof res === 'string' ? res : 'check failed')
        });
      }
    }

    // 4. source-level checks (e.g. "solve this with .reduce()")
    if (spec.source) {
      spec.source.forEach(function (s) {
        var pass;
        if (typeof s.fn === 'function') {
          try { pass = s.fn(code) === true; } catch (e) { pass = false; }
        } else if (s.pattern instanceof RegExp) {
          // strip /g so .test() is not stateful across runs
          var re = new RegExp(s.pattern.source, s.pattern.flags.replace('g', ''));
          pass = re.test(stripComments(code));
          if (s.forbid) pass = !pass;
        } else {
          pass = true;
        }
        results.push({ name: s.name, pass: pass, why: pass ? '' : (s.why || 'source requirement not met') });
      });
    }

    var passed = results.filter(function (r) { return r.pass; }).length;
    return {
      ran: true, error: null, logs: run.logs, results: results,
      passed: passed, total: results.length, ms: run.ms
    };
  }

  /** Comments should never satisfy or violate a source requirement. */
  function stripComments(src) {
    return String(src)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  }

  function clone(v) {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(clone);
    if (v instanceof Date) return new Date(v.getTime());
    if (v instanceof Map || v instanceof Set || typeof v === 'function') return v;
    var o = {};
    for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = clone(v[k]);
    return o;
  }

  function countTests(ex) {
    var s = ex.tests || {}, n = 0;
    if (s.logs) n += s.logs.length;
    if (s.cases) n += s.cases.length;
    if (s.checks) n += s.checks.length;
    if (s.source) n += s.source.length;
    return n || 1;
  }

  global.Runner = {
    execute: execute,
    runTests: runTests,
    countTests: countTests,
    format: fmt,
    deepEqual: eq,
    injectLoopGuard: injectLoopGuard,
    stripComments: stripComments
  };
})(typeof window !== 'undefined' ? window : this);
