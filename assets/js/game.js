/* ============================================================
   game.js — progression, scoring and persistence
   ------------------------------------------------------------
   Every level is graded out of 1000 points:
     600  Correctness  — test suites passed
     200  Recall       — end-of-level quiz, first answer counts
     100  Efficiency   — your code length vs. the reference "par"
     100  Clean Run    — no hints, no peeked solutions, few failed runs
   Rank thresholds map that score onto D / C / B / A / S.
   A level can be replayed forever; the BEST attempt is what counts,
   and every attempt's source is archived.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'quantacademy.v1';

  /* ---------------- rank ladder ---------------- */
  var RANKS = [
    { id: 'S', min: 950, label: 'S', name: 'Flawless',   color: '#ffd166' },
    { id: 'A', min: 850, label: 'A', name: 'Excellent',  color: '#26d07c' },
    { id: 'B', min: 720, label: 'B', name: 'Solid',      color: '#4ea1ff' },
    { id: 'C', min: 580, label: 'C', name: 'Passing',    color: '#a3aec4' },
    { id: 'D', min: 400, label: 'D', name: 'Scraped by', color: '#ffb454' },
    { id: 'F', min: 0,   label: 'F', name: 'Incomplete', color: '#ff5c72' }
  ];
  function rankFor(score) {
    for (var i = 0; i < RANKS.length; i++) if (score >= RANKS[i].min) return RANKS[i];
    return RANKS[RANKS.length - 1];
  }

  /* ---------------- player titles (XP ladder) ---------------- */
  var TITLES = [
    { lvl: 1,  xp: 0,      name: 'Intern' },
    { lvl: 2,  xp: 2000,   name: 'Junior Analyst' },
    { lvl: 3,  xp: 5000,   name: 'Desk Assistant' },
    { lvl: 4,  xp: 9000,   name: 'Quant Developer' },
    { lvl: 5,  xp: 15000,  name: 'Systematic Trader' },
    { lvl: 6,  xp: 23000,  name: 'Strategy Engineer' },
    { lvl: 7,  xp: 33000,  name: 'Risk Manager' },
    { lvl: 8,  xp: 45000,  name: 'Portfolio Engineer' },
    { lvl: 9,  xp: 60000,  name: 'Head of Research' },
    { lvl: 10, xp: 78000,  name: 'Market Wizard' }
  ];
  function titleFor(xp) {
    var t = TITLES[0];
    for (var i = 0; i < TITLES.length; i++) if (xp >= TITLES[i].xp) t = TITLES[i];
    return t;
  }
  function nextTitle(xp) {
    for (var i = 0; i < TITLES.length; i++) if (xp < TITLES[i].xp) return TITLES[i];
    return null;
  }

  /* ---------------- achievements ---------------- */
  var ACHIEVEMENTS = [
    { id: 'first_blood',  icon: '🎯', name: 'First Fill',        desc: 'Clear your first level.',
      test: function (s) { return clearedCount(s) >= 1; } },
    { id: 'streak3',      icon: '🔥', name: 'Three-Day Streak',  desc: 'Study three days in a row.',
      test: function (s) { return s.streak.best >= 3; } },
    { id: 'streak7',      icon: '🔥', name: 'Week on the Desk',  desc: 'Study seven days in a row.',
      test: function (s) { return s.streak.best >= 7; } },
    { id: 'streak30',     icon: '🏆', name: 'Full Month',        desc: 'Study thirty days in a row.',
      test: function (s) { return s.streak.best >= 30; } },
    { id: 'first_s',      icon: '⭐', name: 'Perfect Print',      desc: 'Earn an S rank on any level.',
      test: function (s) { return anyRank(s, 'S') >= 1; } },
    { id: 'ten_s',        icon: '🌟', name: 'Ten Perfect Prints', desc: 'Earn S rank on ten levels.',
      test: function (s) { return anyRank(s, 'S') >= 10; } },
    { id: 'no_hints_10',  icon: '🧠', name: 'Unassisted',        desc: 'Clear ten levels without using a hint.',
      test: function (s) { return cleanCount(s) >= 10; } },
    { id: 'optimizer',    icon: '⚡', name: 'Optimizer',          desc: 'Improve your rank on a level you had already cleared.',
      test: function (s) { return s.stats.rankUps >= 1; } },
    { id: 'refactorer',   icon: '♻️', name: 'Refactorer',         desc: 'Improve a level score five separate times.',
      test: function (s) { return s.stats.rankUps >= 5; } },
    { id: 'module1',      icon: '📗', name: 'Foundations Cleared', desc: 'Finish Module 1.',
      test: function (s) { return moduleDone(s, 1); } },
    { id: 'module4',      icon: '📘', name: 'Async Cleared',      desc: 'Finish Module 4.',
      test: function (s) { return moduleDone(s, 4); } },
    { id: 'module7',      icon: '📕', name: 'Expert Cleared',     desc: 'Finish Module 7.',
      test: function (s) { return moduleDone(s, 7); } },
    { id: 'boss1',        icon: '👑', name: 'Boss Slayer',        desc: 'Clear your first boss challenge.',
      test: function (s) { return bossCount(s) >= 1; } },
    { id: 'boss_all',     icon: '💎', name: 'Boss Rush',          desc: 'Clear every boss challenge.',
      test: function (s) { return bossCount(s) >= totalBosses(); } },
    { id: 'half',         icon: '🚀', name: 'Halfway',           desc: 'Clear fifty levels.',
      test: function (s) { return clearedCount(s) >= 50; } },
    { id: 'graduate',     icon: '🎓', name: 'Graduate',          desc: 'Clear all one hundred levels.',
      test: function (s) { return clearedCount(s) >= totalLevels(); } },
    { id: 'reviewer',     icon: '🔁', name: 'Spaced Repeater',   desc: 'Complete twenty scheduled reviews.',
      test: function (s) { return s.stats.reviews >= 20; } },
    { id: 'marathon',     icon: '🏃', name: 'Double Session',    desc: 'Clear two levels in a single day.',
      test: function (s) { return s.stats.bestDay >= 2; } }
  ];

  /* ---------------- state ---------------- */
  function blankState() {
    return {
      v: 1,
      levels: {},            // id -> { best, rank, cleared, attempts[], parts, code{}, quiz{}, firstClear, lastPlayed, reviews, due }
      xp: 0,
      streak: { current: 0, best: 0, last: null, freezes: 2 },
      dailyGoal: 1,
      history: {},           // 'YYYY-MM-DD' -> levels completed that day
      achievements: {},      // id -> ISO date earned
      stats: { rankUps: 0, runs: 0, reviews: 0, bestDay: 0, totalMs: 0 },
      settings: { unlockAll: false },
      createdAt: new Date().toISOString()
    };
  }

  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blankState();
      var s = JSON.parse(raw);
      var b = blankState();
      // shallow-merge forward so older saves keep working
      for (var k in b) if (!(k in s)) s[k] = b[k];
      for (var k2 in b.stats) if (!(k2 in s.stats)) s.stats[k2] = b.stats[k2];
      for (var k3 in b.streak) if (!(k3 in s.streak)) s.streak[k3] = b.streak[k3];
      return s;
    } catch (e) { return blankState(); }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* quota or private mode — progress just won't persist */ }
  }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dayDiff(a, b) {
    if (!a || !b) return Infinity;
    return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  }

  function lvl(id) {
    if (!state.levels[id]) {
      state.levels[id] = {
        best: 0, rank: null, cleared: false, attempts: [], parts: null,
        code: {}, quiz: {}, hints: {}, peeked: {}, fails: {},
        firstClear: null, lastPlayed: null, reviews: 0, due: null, plays: 0
      };
    }
    var L = state.levels[id];
    ['code', 'quiz', 'hints', 'peeked', 'fails'].forEach(function (k) { if (!L[k]) L[k] = {}; });
    if (!L.attempts) L.attempts = [];
    return L;
  }

  /* ---------------- counters used by achievements ---------------- */
  function allLevels() { return global.CURRICULUM || []; }
  function totalLevels() { return allLevels().length || 100; }
  function totalBosses() { return allLevels().filter(function (l) { return l.boss; }).length || 10; }
  function clearedCount(s) {
    return Object.keys(s.levels).filter(function (k) { return s.levels[k].cleared; }).length;
  }
  function anyRank(s, r) {
    return Object.keys(s.levels).filter(function (k) { return s.levels[k].rank === r; }).length;
  }
  function cleanCount(s) {
    return Object.keys(s.levels).filter(function (k) {
      var L = s.levels[k];
      return L.cleared && L.parts && L.parts.clean === 100;
    }).length;
  }
  function moduleDone(s, m) {
    var ls = allLevels().filter(function (l) { return l.module === m; });
    return ls.length > 0 && ls.every(function (l) { return s.levels[l.id] && s.levels[l.id].cleared; });
  }
  function bossCount(s) {
    return allLevels().filter(function (l) {
      return l.boss && s.levels[l.id] && s.levels[l.id].cleared;
    }).length;
  }

  /* ---------------- scoring ---------------- */
  var W = { correct: 600, quiz: 200, efficiency: 100, clean: 100 };

  /**
   * Score a level from its current session record.
   * @param {object} level     curriculum level
   * @param {object} session   { solved:{exId:bool}, hints:{exId:n}, peeked:{exId:bool},
   *                             fails:{exId:n}, chars:{exId:n}, quiz:{qi:{first,correct}} }
   */
  function scoreLevel(level, session) {
    var exs = level.exercises || [];
    var qs = level.quiz || [];
    var parts = { correct: 0, quiz: 0, efficiency: 0, clean: 0 };
    var detail = { exercises: [], quizRight: 0, quizTotal: qs.length, hintsUsed: 0, peeks: 0, fails: 0 };

    // --- correctness + efficiency, split evenly across exercises ---
    var perEx = exs.length ? W.correct / exs.length : 0;
    var perEff = exs.length ? W.efficiency / exs.length : 0;

    exs.forEach(function (ex) {
      var solved = !!(session.solved && session.solved[ex.id]);
      var hints = (session.hints && session.hints[ex.id]) || 0;
      var peek = !!(session.peeked && session.peeked[ex.id]);
      var fails = (session.fails && session.fails[ex.id]) || 0;
      var chars = (session.chars && session.chars[ex.id]) || 0;

      detail.hintsUsed += hints;
      if (peek) detail.peeks++;
      detail.fails += fails;

      var got = 0, eff = 0, par = codeSize(ex.solution || '');
      if (solved) {
        // hints and peeking reduce the credit, but never below 40%
        var factor = 1 - 0.10 * hints - (peek ? 0.35 : 0);
        factor = Math.max(0.40, factor);
        got = perEx * factor;

        // efficiency: full marks at or under 115% of par, fading to 0 at 300%
        if (par > 0 && chars > 0) {
          var ratio = chars / par;
          if (ratio <= 1.15) eff = perEff;
          else if (ratio >= 3) eff = 0;
          else eff = perEff * (1 - (ratio - 1.15) / 1.85);
        } else if (chars > 0) {
          eff = perEff;
        }
      }
      parts.correct += got;
      parts.efficiency += eff;
      detail.exercises.push({
        id: ex.id, title: ex.title, solved: solved, hints: hints, peeked: peek,
        fails: fails, chars: chars, par: par,
        points: Math.round(got), effPoints: Math.round(eff)
      });
    });

    // --- recall quiz: only the FIRST answer to each question counts ---
    if (qs.length) {
      var right = 0;
      qs.forEach(function (q, i) {
        var rec = session.quiz && session.quiz[i];
        if (rec && rec.firstCorrect) right++;
      });
      detail.quizRight = right;
      parts.quiz = W.quiz * (right / qs.length);
    } else {
      parts.quiz = W.quiz;
    }

    // --- clean run bonus ---
    var allSolved = exs.length > 0 && exs.every(function (ex) {
      return session.solved && session.solved[ex.id];
    });
    if (allSolved && detail.hintsUsed === 0 && detail.peeks === 0 && detail.fails <= 2) {
      parts.clean = W.clean;
    } else if (allSolved && detail.hintsUsed <= 1 && detail.peeks === 0 && detail.fails <= 5) {
      parts.clean = W.clean * 0.5;
    } else {
      parts.clean = 0;
    }

    var total = Math.round(parts.correct + parts.quiz + parts.efficiency + parts.clean);
    var quizDone = qs.length === 0 || qs.every(function (q, i) {
      return session.quiz && session.quiz[i] && session.quiz[i].answered;
    });

    return {
      total: total,
      parts: {
        correct: Math.round(parts.correct),
        quiz: Math.round(parts.quiz),
        efficiency: Math.round(parts.efficiency),
        clean: Math.round(parts.clean)
      },
      max: W,
      detail: detail,
      cleared: allSolved && quizDone,
      allSolved: allSolved,
      quizDone: quizDone,
      rank: rankFor(total)
    };
  }

  /** Significant characters — whitespace and comments don't count against you. */
  function codeSize(src) {
    if (!src) return 0;
    return src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
      .replace(/\s+/g, '')
      .length;
  }

  /* ---------------- recording a completed attempt ---------------- */
  /**
   * Commit an attempt. Returns a summary describing what changed so the UI
   * can celebrate appropriately.
   */
  function commit(level, session, scored) {
    var L = lvl(level.id);
    var prevBest = L.best;
    var prevRank = L.rank;
    var wasCleared = L.cleared;
    var t = today();

    L.plays = (L.plays || 0) + 1;
    L.lastPlayed = new Date().toISOString();

    var attempt = {
      at: new Date().toISOString(),
      score: scored.total,
      rank: scored.rank.id,
      parts: scored.parts,
      hints: scored.detail.hintsUsed,
      peeks: scored.detail.peeks,
      fails: scored.detail.fails,
      quiz: scored.detail.quizRight + '/' + scored.detail.quizTotal,
      code: {}
    };
    (level.exercises || []).forEach(function (ex) {
      if (session.code && session.code[ex.id]) attempt.code[ex.id] = session.code[ex.id];
    });
    L.attempts.push(attempt);
    if (L.attempts.length > 40) L.attempts = L.attempts.slice(-40); // keep the archive bounded

    var improved = scored.total > prevBest;
    if (improved) {
      L.best = scored.total;
      L.rank = scored.rank.id;
      L.parts = scored.parts;
      L.bestCode = attempt.code;
      L.bestAt = attempt.at;
    }

    var firstClear = false;
    if (scored.cleared && !wasCleared) {
      L.cleared = true;
      L.firstClear = new Date().toISOString();
      firstClear = true;
      state.history[t] = (state.history[t] || 0) + 1;
      state.stats.bestDay = Math.max(state.stats.bestDay || 0, state.history[t]);
      bumpStreak(t);
      scheduleReview(L, 1);
    } else if (scored.cleared && improved) {
      state.stats.rankUps++;
    }

    // XP always reflects the best-ever score on every level
    state.xp = Object.keys(state.levels).reduce(function (a, k) {
      return a + (state.levels[k].best || 0);
    }, 0);

    var newAchievements = checkAchievements();
    save();

    return {
      firstClear: firstClear,
      improved: improved,
      prevBest: prevBest,
      prevRank: prevRank,
      rankUp: improved && wasCleared && prevRank && scored.rank.id !== prevRank,
      delta: scored.total - prevBest,
      achievements: newAchievements
    };
  }

  function bumpStreak(t) {
    var s = state.streak;
    if (s.last === t) return;
    var gap = dayDiff(s.last, t);
    if (s.last === null) s.current = 1;
    else if (gap === 1) s.current += 1;
    else if (gap > 1) {
      // spend a freeze to cover a single missed day, Duolingo-style
      if (gap === 2 && s.freezes > 0) { s.freezes--; s.current += 1; }
      else s.current = 1;
    }
    s.last = t;
    s.best = Math.max(s.best, s.current);
    // earn a freeze back every 7 days, capped at 3
    if (s.current % 7 === 0 && s.freezes < 3) s.freezes++;
  }

  /** Current streak, decayed if the player has been away. */
  function liveStreak() {
    var s = state.streak;
    var gap = dayDiff(s.last, today());
    if (!s.last) return 0;
    if (gap === 0 || gap === 1) return s.current;
    if (gap === 2 && s.freezes > 0) return s.current;
    return 0;
  }

  /* ---------------- spaced repetition ---------------- */
  var INTERVALS = [1, 3, 7, 16, 35];
  function scheduleReview(L, n) {
    var idx = Math.min((n || 1) - 1, INTERVALS.length - 1);
    var d = new Date();
    d.setDate(d.getDate() + INTERVALS[idx]);
    L.due = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function dueForReview() {
    var t = today();
    return allLevels().filter(function (l) {
      var L = state.levels[l.id];
      return L && L.cleared && L.due && dayDiff(L.due, t) >= 0;
    });
  }
  function markReviewed(id, good) {
    var L = lvl(id);
    L.reviews = (L.reviews || 0) + 1;
    state.stats.reviews++;
    scheduleReview(L, good ? L.reviews + 1 : 1);
    save();
  }

  /* ---------------- unlocking ---------------- */
  function isUnlocked(level) {
    if (state.settings.unlockAll) return true;
    if (level.day <= 1) return true;
    var prev = allLevels().filter(function (l) { return l.day === level.day - 1; })[0];
    if (!prev) return true;
    return !!(state.levels[prev.id] && state.levels[prev.id].cleared);
  }
  function nextLevel() {
    var ls = allLevels();
    for (var i = 0; i < ls.length; i++) {
      if (!state.levels[ls[i].id] || !state.levels[ls[i].id].cleared) return ls[i];
    }
    return ls[ls.length - 1];
  }

  /* ---------------- achievements ---------------- */
  function checkAchievements() {
    var earned = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (state.achievements[a.id]) return;
      var ok = false;
      try { ok = a.test(state); } catch (e) { ok = false; }
      if (ok) {
        state.achievements[a.id] = new Date().toISOString();
        earned.push(a);
      }
    });
    return earned;
  }

  /* ---------------- summary for the dashboard ---------------- */
  function summary() {
    var ls = allLevels();
    var cleared = 0, sum = 0, best = 0, ranks = { S: 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    ls.forEach(function (l) {
      var L = state.levels[l.id];
      if (L && L.cleared) { cleared++; sum += L.best; if (L.rank) ranks[L.rank]++; }
      if (L) best += L.best;
    });
    var xp = best;
    var title = titleFor(xp), nxt = nextTitle(xp);
    return {
      total: ls.length, cleared: cleared,
      pct: ls.length ? Math.round(cleared / ls.length * 100) : 0,
      xp: xp, avg: cleared ? Math.round(sum / cleared) : 0,
      ranks: ranks, title: title, next: nxt,
      toNext: nxt ? nxt.xp - xp : 0,
      titlePct: nxt ? Math.round((xp - title.xp) / (nxt.xp - title.xp) * 100) : 100,
      streak: liveStreak(), bestStreak: state.streak.best, freezes: state.streak.freezes,
      todayCount: state.history[today()] || 0, goal: state.dailyGoal,
      due: dueForReview().length,
      achievements: Object.keys(state.achievements).length,
      achievementsTotal: ACHIEVEMENTS.length
    };
  }

  /* ---------------- import / export / reset ---------------- */
  function exportJSON() { return JSON.stringify(state, null, 2); }
  function importJSON(text) {
    var s = JSON.parse(text);
    if (!s || typeof s !== 'object' || !s.levels) throw new Error('Not a Quant Academy backup file.');
    state = s;
    var b = blankState();
    for (var k in b) if (!(k in state)) state[k] = b[k];
    save();
  }
  function reset() { state = blankState(); save(); }

  global.Game = {
    RANKS: RANKS, TITLES: TITLES, ACHIEVEMENTS: ACHIEVEMENTS, WEIGHTS: W,
    get state() { return state; },
    level: lvl, save: save, today: today, dayDiff: dayDiff,
    scoreLevel: scoreLevel, codeSize: codeSize, commit: commit,
    rankFor: rankFor, titleFor: titleFor,
    isUnlocked: isUnlocked, nextLevel: nextLevel,
    dueForReview: dueForReview, markReviewed: markReviewed,
    liveStreak: liveStreak, summary: summary, checkAchievements: checkAchievements,
    exportJSON: exportJSON, importJSON: importJSON, reset: reset
  };
})(typeof window !== 'undefined' ? window : this);
