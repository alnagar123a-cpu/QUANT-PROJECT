/* ============================================================
   market.js — deterministic sample market data
   Every lesson and exercise runs against the same synthetic
   ES (E-mini S&P 500) 5-minute session so results are
   reproducible and testable.
   ============================================================ */
(function (global) {
  'use strict';

  // ---- seeded PRNG (mulberry32) so the dataset never changes ----
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function round(x, p) { var m = Math.pow(10, p); return Math.round(x * m) / m; }

  // Build 390 bars = one full 09:30–16:00 regular session at 1-minute
  // resolution, then fold into 78 five-minute bars.
  function buildBars(count, seed, start) {
    var r = rng(seed);
    var bars = [];
    var price = start;
    var drift = 0;
    var t = Date.UTC(2024, 4, 14, 13, 30, 0); // 09:30 America/New_York
    for (var i = 0; i < count; i++) {
      // regime: slow mean-reverting drift plus shocks
      drift = drift * 0.95 + (r() - 0.5) * 1.7;
      var open = price;
      var move = drift + (r() - 0.5) * 3.0;
      var close = open + move;
      var wick = 0.6 + r() * 2.2;
      var high = Math.max(open, close) + r() * wick;
      var low = Math.min(open, close) - r() * wick;
      var vol = Math.round(900 + r() * 2600 + Math.abs(move) * 420);
      bars.push({
        time: t + i * 300000,
        open: round(open, 2),
        high: round(high, 2),
        low: round(low, 2),
        close: round(close, 2),
        volume: vol
      });
      price = close;
    }
    return bars;
  }

  var bars = buildBars(78, 420, 5240.00);
  var closes = bars.map(function (b) { return b.close; });

  // A short, hand-checkable series used by early lessons.
  var tinyCloses = [100, 102, 101, 105, 107, 106, 110, 109, 112, 115];

  // A small watchlist of positions for object/array lessons.
  var positions = [
    { symbol: 'ES',   side: 'long',  qty: 2, entry: 5240.25, last: 5262.50 },
    { symbol: 'NQ',   side: 'short', qty: 1, entry: 18420.0, last: 18395.5 },
    { symbol: 'CL',   side: 'long',  qty: 3, entry: 78.40,   last: 77.15  },
    { symbol: 'GC',   side: 'long',  qty: 1, entry: 2318.6,  last: 2340.9 },
    { symbol: 'RTY',  side: 'short', qty: 2, entry: 2071.4,  last: 2065.8 }
  ];

  // A trade log used from module 2 onward.
  var trades = [
    { id: 1, symbol: 'ES', side: 'long',  entry: 5240.25, exit: 5252.75, qty: 2, minutes: 18 },
    { id: 2, symbol: 'ES', side: 'short', entry: 5261.00, exit: 5268.25, qty: 2, minutes: 25 },
    { id: 3, symbol: 'NQ', side: 'long',  entry: 18380.5, exit: 18442.0, qty: 1, minutes: 41 },
    { id: 4, symbol: 'ES', side: 'long',  entry: 5233.50, exit: 5229.25, qty: 3, minutes: 12 },
    { id: 5, symbol: 'NQ', side: 'short', entry: 18470.0, exit: 18401.5, qty: 1, minutes: 33 },
    { id: 6, symbol: 'CL', side: 'long',  entry: 78.40,   exit: 79.02,   qty: 3, minutes: 55 },
    { id: 7, symbol: 'ES', side: 'short', entry: 5275.25, exit: 5281.00, qty: 1, minutes: 9  },
    { id: 8, symbol: 'GC', side: 'long',  entry: 2318.6,  exit: 2340.9,  qty: 1, minutes: 70 }
  ];

  // Contract specs: dollars per 1.00 of price movement, per contract.
  var specs = {
    ES:  { name: 'E-mini S&P 500',  tick: 0.25, pointValue: 50   },
    NQ:  { name: 'E-mini Nasdaq',   tick: 0.25, pointValue: 20   },
    RTY: { name: 'E-mini Russell',  tick: 0.10, pointValue: 50   },
    CL:  { name: 'Crude Oil',       tick: 0.01, pointValue: 1000 },
    GC:  { name: 'Gold',            tick: 0.10, pointValue: 100  }
  };

  global.MARKET = {
    bars: bars,
    closes: closes,
    highs: bars.map(function (b) { return b.high; }),
    lows: bars.map(function (b) { return b.low; }),
    volumes: bars.map(function (b) { return b.volume; }),
    tinyCloses: tinyCloses,
    positions: positions,
    trades: trades,
    specs: specs,
    round: round,
    /** Fresh deep copy so exercises can mutate without leaking state. */
    clone: function () {
      return JSON.parse(JSON.stringify({
        bars: bars, closes: closes, positions: positions, trades: trades, specs: specs
      }));
    }
  };
})(typeof window !== 'undefined' ? window : this);
