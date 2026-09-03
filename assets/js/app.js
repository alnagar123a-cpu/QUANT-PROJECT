/* ============================================================
   app.js — router, views and level runtime
   ============================================================ */
(function () {
  'use strict';

  var CUR = window.CURRICULUM || [];
  CUR.sort(function (a, b) { return a.day - b.day; });

  var MODULES = [
    { n: 1, name: 'Foundations',            tag: 'Beginner',     color: '#4ea1ff',
      blurb: 'Values, variables, branching and loops — taught on price ticks instead of toy numbers.' },
    { n: 2, name: 'Data & Collections',     tag: 'Beginner+',    color: '#26d07c',
      blurb: 'Arrays, objects and the transform methods that turn raw candles into numbers you can trade.' },
    { n: 3, name: 'Functions in Depth',     tag: 'Intermediate', color: '#7c5cff',
      blurb: 'Scope, closures, higher-order functions, classes and errors — building reusable strategy parts.' },
    { n: 4, name: 'Async & Live Data',      tag: 'Intermediate+',color: '#ffb454',
      blurb: 'Promises, async/await, fetch, streaming quotes, retries and rate limits.' },
    { n: 5, name: 'Technical Indicators',   tag: 'Advanced',     color: '#ff5c72',
      blurb: 'SMA, EMA, RSI, MACD, ATR, Bollinger, VWAP — implemented from the formula up.' },
    { n: 6, name: 'Backtesting & Risk',     tag: 'Advanced+',    color: '#ffd166',
      blurb: 'Event loops, position sizing, drawdown, Sharpe, slippage and honest performance stats.' },
    { n: 7, name: 'Expert Systems',         tag: 'Expert',       color: '#b6a4ff',
      blurb: 'Order books, engines, workers, optimisation, testing and a full trading system.' }
  ];
  function moduleOf(n) { return MODULES.filter(function (m) { return m.n === n; })[0] || MODULES[0]; }
  function levelByDay(d) { return CUR.filter(function (l) { return l.day === +d; })[0]; }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = window.Editor.esc;
  var main = $('#main');

  /* ---------------- toasts ---------------- */
  function toast(msg, kind, ms) {
    var el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = msg;
    $('#toastWrap').appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0'; el.style.transform = 'translateY(6px)';
      setTimeout(function () { el.remove(); }, 320);
    }, ms || 3200);
  }

  function rankBadge(r, cls) {
    if (!r) return '<span class="rank rank-none ' + (cls || '') + '">–</span>';
    return '<span class="rank rank-' + r + ' ' + (cls || '') + '">' + r + '</span>';
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  /* ============================================================
     SIDEBAR
     ============================================================ */
  function renderSidebar(activeDay) {
    var nav = $('#lessonNav');
    var q = ($('#lessonSearch').value || '').toLowerCase().trim();
    var html = '';
    var upNext = Game.nextLevel();

    MODULES.forEach(function (m) {
      var levels = CUR.filter(function (l) { return l.module === m.n; });
      var shown = levels.filter(function (l) {
        return !q || (l.day + ' ' + l.title + ' ' + (l.subtitle || '')).toLowerCase().indexOf(q) >= 0;
      });
      if (!shown.length) return;
      var done = levels.filter(function (l) {
        var L = Game.state.levels[l.id]; return L && L.cleared;
      }).length;
      var open = !!q || levels.some(function (l) { return l.day === activeDay; }) ||
        (!activeDay && upNext && upNext.module === m.n);
      html += '<details class="nav-module"' + (open ? ' open' : '') + '>' +
        '<summary><span class="m-num">M' + m.n + '</span>' + esc(m.name) +
        '<span class="m-count">' + done + '/' + levels.length + '</span></summary>';
      shown.forEach(function (l) {
        var L = Game.state.levels[l.id];
        var unlocked = Game.isUnlocked(l);
        var cls = 'nav-item' + (L && L.cleared ? ' done' : '') +
          (l.day === activeDay ? ' active' : '') + (unlocked ? '' : ' locked');
        html += '<a class="' + cls + '" href="#/level/' + l.day + '" data-link>' +
          '<span class="d">' + String(l.day).padStart(3, '0') + '</span>' +
          '<span class="t">' + esc(l.title) + '</span>' +
          (unlocked
            ? (L && L.rank ? rankBadge(L.rank) : '<span class="s">' + (l.boss ? '👑' : '') + '</span>')
            : '<span class="s">🔒</span>') +
          '</a>';
      });
      html += '</details>';
    });

    nav.innerHTML = html || '<p class="muted" style="padding:16px;font-size:.85rem">No classes match that search.</p>';
    var s = Game.summary();
    $('#sideBar').style.width = s.pct + '%';
    $('#sideBarLabel').textContent = s.cleared + ' of ' + s.total + ' levels cleared · ' + s.pct + '%';
    $('#statStreak').textContent = s.streak;
    $('#statXp').textContent = s.xp >= 1000 ? (s.xp / 1000).toFixed(1) + 'k' : s.xp;
    $('#statDone').textContent = s.cleared;
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function viewHome() {
    var s = Game.summary();
    var next = Game.nextLevel();
    var nextL = Game.state.levels[next.id];
    var due = Game.dueForReview();
    var m = moduleOf(next.module);

    var quests = [
      { ico: '📚', label: 'Complete today\'s class', now: Math.min(s.todayCount, s.goal), max: s.goal },
      { ico: '🔥', label: 'Keep the streak alive',   now: s.streak > 0 && s.todayCount > 0 ? 1 : 0, max: 1 },
      { ico: '🔁', label: 'Clear the review queue',  now: Math.max(0, 3 - due.length), max: 3 }
    ];

    main.innerHTML =
      '<section class="hero">' +
        '<div class="eyebrow">Day ' + next.day + ' of ' + s.total + ' · Module ' + m.n + ' · ' + esc(m.name) + '</div>' +
        '<h1>' + (s.cleared === 0 ? 'Start your first class' : 'Today\'s class: ' + esc(next.title)) + '</h1>' +
        '<p>' + esc(next.subtitle || m.blurb) + '</p>' +
        '<div class="hero-actions">' +
          '<a class="btn" href="#/level/' + next.day + '" data-link>' +
            (nextL && nextL.plays ? '▶ Resume level ' + next.day : '▶ Start level ' + next.day) +
          '</a>' +
          (due.length ? '<a class="btn btn-ghost" href="#/review" data-link>🔁 Review ' + due.length + ' level' + (due.length > 1 ? 's' : '') + '</a>' : '') +
          '<a class="btn btn-ghost" href="#/map" data-link>View the path</a>' +
        '</div>' +
      '</section>' +

      '<div class="grid grid-2" style="margin-bottom:16px">' +
        '<div class="player">' +
          '<div class="player-badge">' + s.title.lvl + '</div>' +
          '<div class="player-info">' +
            '<div class="player-title">' + esc(s.title.name) + '</div>' +
            '<div class="player-sub">' + s.xp.toLocaleString() + ' XP' +
              (s.next ? ' · ' + s.toNext.toLocaleString() + ' to ' + esc(s.next.name) : ' · max rank reached') +
            '</div>' +
            '<div class="player-xpbar"><i style="width:' + s.titlePct + '%"></i></div>' +
          '</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="k muted" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:650;margin-bottom:10px">Daily quests</div>' +
          quests.map(function (q) {
            var pct = q.max ? Math.round(q.now / q.max * 100) : 0;
            return '<div class="quest' + (q.now >= q.max ? ' done' : '') + '">' +
              '<span class="q-ico">' + q.ico + '</span><span>' + q.label + '</span>' +
              '<span class="q-bar"><i style="width:' + pct + '%"></i></span>' +
              '<span class="q-n">' + q.now + '/' + q.max + '</span></div>';
          }).join('') +
        '</div>' +
      '</div>' +

      '<div class="grid grid-3" style="margin-bottom:24px">' +
        statCard('Levels cleared', s.cleared + '<small class="muted" style="font-size:.9rem"> / ' + s.total + '</small>', s.pct + '% of the curriculum', 'v-accent') +
        statCard('Current streak', s.streak + '<small class="muted" style="font-size:.9rem">d</small>', 'Best ' + s.bestStreak + ' · ' + s.freezes + ' freeze' + (s.freezes === 1 ? '' : 's') + ' left', 'v-long') +
        statCard('Average score', s.avg || '—', s.avg ? 'Rank ' + Game.rankFor(s.avg).id + ' average' : 'Clear a level to rank', 'v-gold') +
        statCard('Achievements', s.achievements + '<small class="muted" style="font-size:.9rem"> / ' + s.achievementsTotal + '</small>', 'Badges earned') +
      '</div>' +

      '<div class="grid grid-2">' +
        '<div class="card">' +
          '<h2 style="font-size:1rem">Rank distribution</h2>' +
          rankBars(s.ranks, s.cleared) +
          '<p class="muted" style="font-size:.78rem;margin:12px 0 0">' +
            'Replay any cleared level to push a low rank up — your best attempt is the one that counts.' +
          '</p>' +
        '</div>' +
        '<div class="card">' +
          '<h2 style="font-size:1rem">Activity</h2>' +
          heatmap() +
        '</div>' +
      '</div>' +

      '<div class="card mt24">' +
        '<h2 style="font-size:1rem">Badges</h2>' +
        achievementGrid(6) +
        '<div class="mt16"><a class="btn btn-ghost btn-sm" href="#/achievements" data-link>See all ' + s.achievementsTotal + ' badges</a></div>' +
      '</div>';
  }

  function statCard(k, v, sub, cls) {
    return '<div class="stat-card"><div class="k">' + k + '</div>' +
      '<div class="v ' + (cls || '') + '">' + v + '</div>' +
      '<div class="sub">' + (sub || '') + '</div></div>';
  }

  function rankBars(ranks, total) {
    var order = ['S', 'A', 'B', 'C', 'D'];
    if (!total) return '<p class="muted" style="font-size:.85rem">No levels cleared yet.</p>';
    return order.map(function (r) {
      var n = ranks[r] || 0;
      var pct = total ? Math.round(n / total * 100) : 0;
      return '<div class="sc-row" style="padding:7px 0">' +
        '<span class="k">' + rankBadge(r) + '</span>' +
        '<span class="track"><i style="width:' + pct + '%;background:' +
          Game.RANKS.filter(function (x) { return x.id === r; })[0].color + '"></i></span>' +
        '<span class="v">' + n + '</span></div>';
    }).join('');
  }

  function heatmap() {
    var cells = '', d = new Date();
    d.setDate(d.getDate() - 118);
    for (var i = 0; i < 119; i++) {
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
      var n = Game.state.history[key] || 0;
      var cls = n >= 3 ? 'h3' : n === 2 ? 'h2' : n === 1 ? 'h1' : '';
      cells += '<i class="' + cls + '" title="' + key + ': ' + n + ' level' + (n === 1 ? '' : 's') + '"></i>';
      d.setDate(d.getDate() + 1);
    }
    return '<div class="heat">' + cells + '</div>' +
      '<div class="heat-legend">Less <i class="heat" style="display:inline-block"></i>' +
      '<i style="width:11px;height:11px;border-radius:3px;background:var(--bg-3);border:1px solid var(--line);display:inline-block"></i>' +
      '<i style="width:11px;height:11px;border-radius:3px;background:rgba(38,208,124,.32);display:inline-block"></i>' +
      '<i style="width:11px;height:11px;border-radius:3px;background:rgba(38,208,124,.58);display:inline-block"></i>' +
      '<i style="width:11px;height:11px;border-radius:3px;background:var(--long);display:inline-block"></i> More</div>';
  }

  function achievementGrid(limit) {
    var list = Game.ACHIEVEMENTS.slice();
    if (limit) {
      list.sort(function (a, b) {
        return (Game.state.achievements[b.id] ? 1 : 0) - (Game.state.achievements[a.id] ? 1 : 0);
      });
      list = list.slice(0, limit);
    }
    return '<div class="ach-grid">' + list.map(function (a) {
      var got = Game.state.achievements[a.id];
      return '<div class="ach ' + (got ? 'earned' : 'locked') + '">' +
        '<span class="ico">' + a.icon + '</span><div><div class="n">' + esc(a.name) + '</div>' +
        '<div class="d">' + esc(a.desc) + '</div></div></div>';
    }).join('') + '</div>';
  }

  function viewAchievements() {
    var s = Game.summary();
    main.innerHTML = '<div class="page-head"><div class="eyebrow">Trophy case</div>' +
      '<h1>Badges</h1><p class="muted">' + s.achievements + ' of ' + s.achievementsTotal + ' earned.</p></div>' +
      '<div class="card">' + achievementGrid(0) + '</div>';
  }

  /* ============================================================
     CURRICULUM MAP
     ============================================================ */
  function viewMap() {
    var next = Game.nextLevel();
    var html = '<div class="page-head"><div class="eyebrow">The path</div>' +
      '<h1>100 levels, beginner to expert</h1>' +
      '<p class="muted">One class per day, 20–30 minutes each. Every level is graded and replayable.</p></div>';

    MODULES.forEach(function (m) {
      var levels = CUR.filter(function (l) { return l.module === m.n; });
      if (!levels.length) return;
      var done = levels.filter(function (l) {
        var L = Game.state.levels[l.id]; return L && L.cleared;
      }).length;
      var avg = 0, cnt = 0;
      levels.forEach(function (l) {
        var L = Game.state.levels[l.id];
        if (L && L.cleared) { avg += L.best; cnt++; }
      });
      avg = cnt ? Math.round(avg / cnt) : 0;

      html += '<div class="mod-card">' +
        '<div class="mod-card-head">' +
          '<div class="mod-badge" style="background:' + m.color + '">M' + m.n + '</div>' +
          '<div style="flex:1">' +
            '<h3>' + esc(m.name) + ' <span class="chip">' + m.tag + '</span>' +
            (done === levels.length ? ' <span class="chip chip-gold">🎓 Certified</span>' : '') + '</h3>' +
            '<p>' + esc(m.blurb) + '</p>' +
          '</div>' +
          '<div style="text-align:right;font-family:var(--mono);font-size:.8rem;color:var(--fg-mute)">' +
            done + '/' + levels.length + (avg ? '<br>avg ' + avg : '') +
          '</div>' +
        '</div><div class="mod-days">' +
        levels.map(function (l) {
          var L = Game.state.levels[l.id];
          var unlocked = Game.isUnlocked(l);
          var cls = 'day-dot' + (L && L.cleared ? ' done' : '') + (unlocked ? '' : ' locked') +
            (l.day === next.day ? ' next' : '');
          var inner = L && L.rank ? rankBadge(L.rank) : (unlocked ? l.day : '🔒');
          return unlocked
            ? '<a class="' + cls + '" href="#/level/' + l.day + '" data-link title="Day ' + l.day + ' · ' + esc(l.title) + '">' + inner + '</a>'
            : '<span class="' + cls + '" title="Clear day ' + (l.day - 1) + ' first">🔒</span>';
        }).join('') +
        '</div></div>';
    });
    main.innerHTML = html;
  }

  /* ============================================================
     ARCHIVE
     ============================================================ */
  function viewArchive() {
    var played = CUR.filter(function (l) {
      var L = Game.state.levels[l.id]; return L && L.attempts && L.attempts.length;
    });
    var html = '<div class="page-head"><div class="eyebrow">Archive</div>' +
      '<h1>Your saved work</h1>' +
      '<p class="muted">Every attempt on every level is kept here — code, score and rank. ' +
      'Open one to compare an old attempt with your best.</p></div>';

    if (!played.length) {
      html += '<div class="locked-note"><span class="big">🗄</span>' +
        'Nothing archived yet. Finish a level and every attempt you make will be saved here.</div>';
    } else {
      var totalAttempts = played.reduce(function (a, l) {
        return a + Game.state.levels[l.id].attempts.length;
      }, 0);
      html += '<div class="grid grid-3" style="margin-bottom:20px">' +
        statCard('Levels attempted', played.length, 'with saved code') +
        statCard('Attempts stored', totalAttempts, 'across all levels') +
        statCard('Best score', Math.max.apply(null, played.map(function (l) {
          return Game.state.levels[l.id].best;
        })), 'single level', 'v-gold') +
        '</div>';
      played.forEach(function (l) {
        var L = Game.state.levels[l.id];
        html += '<a class="archive-row" href="#/archive/' + l.day + '" data-link>' +
          rankBadge(L.rank) +
          '<div class="meta"><div class="t">Day ' + l.day + ' · ' + esc(l.title) + '</div>' +
          '<div class="s">' + L.attempts.length + ' attempt' + (L.attempts.length === 1 ? '' : 's') +
          ' · last played ' + fmtDate(L.lastPlayed) + '</div></div>' +
          '<div class="num">' + L.best + '<br><span class="muted">/1000</span></div></a>';
      });
    }
    main.innerHTML = html;
  }

  function viewArchiveLevel(day) {
    var l = levelByDay(day);
    if (!l) return notFound();
    var L = Game.state.levels[l.id];
    if (!L || !L.attempts.length) { location.hash = '#/archive'; return; }

    var html = '<div class="page-head"><div class="eyebrow"><a href="#/archive" data-link>Archive</a> · Day ' + l.day + '</div>' +
      '<h1>' + esc(l.title) + '</h1></div>' +
      '<div class="wrap-row" style="margin-bottom:20px">' +
        '<div class="scorecard" style="flex:1;min-width:280px">' +
          '<div class="sc-top">' + rankBadge(L.rank, 'rank-lg') +
          '<div><div class="sc-score">' + L.best + '<small> / 1000</small></div>' +
          '<div class="sc-rankname">Best score · ' + (L.parts ? 'set ' + fmtDate(L.bestAt) : '') + '</div></div></div>' +
          (L.parts ? scoreRows(L.parts) : '') +
        '</div>' +
      '</div>' +
      '<div class="wrap-row" style="margin-bottom:18px">' +
        '<a class="btn" href="#/level/' + l.day + '" data-link>▶ Replay to improve</a>' +
        '<span class="muted" style="font-size:.85rem">Replaying resets hint and peek penalties, so a clean run can still earn S.</span>' +
      '</div>' +
      '<h2>Attempt history</h2><div class="attempt-list" id="attemptList">' +
      L.attempts.slice().reverse().map(function (a, i) {
        var isBest = a.score === L.best;
        return '<div class="attempt' + (isBest ? ' best' : '') + '" data-idx="' + (L.attempts.length - 1 - i) + '">' +
          rankBadge(a.rank) +
          '<span class="when">' + fmtDate(a.at) + '</span>' +
          '<span class="muted" style="font-size:.75rem">quiz ' + a.quiz + ' · ' + a.hints + ' hints · ' + a.fails + ' failed runs</span>' +
          '<span class="sc">' + a.score + '</span>' +
          (isBest ? '<span class="chip chip-gold">best</span>' : '') +
          '</div>';
      }).join('') + '</div>' +
      '<div id="attemptCode" class="mt24"></div>';

    main.innerHTML = html;

    $('#attemptList').addEventListener('click', function (e) {
      var row = e.target.closest('.attempt'); if (!row) return;
      var a = L.attempts[+row.dataset.idx];
      var box = $('#attemptCode');
      box.innerHTML = '<h2>Saved code · ' + fmtDate(a.at) + ' · ' + a.score + ' pts (' + a.rank + ')</h2>';
      (l.exercises || []).forEach(function (ex) {
        var code = a.code[ex.id];
        if (!code) return;
        var wrap = document.createElement('div');
        wrap.innerHTML = '<h3 style="font-size:.9rem;color:var(--fg-dim);margin-top:16px">' + esc(ex.title) + '</h3>';
        wrap.appendChild(window.Editor.block(code, { filename: ex.id + '.js' }));
        box.appendChild(wrap);
      });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function scoreRows(parts) {
    var W = Game.WEIGHTS;
    var rows = [
      ['Correctness', parts.correct, W.correct, '#26d07c', 'Test suites passed'],
      ['Recall quiz', parts.quiz, W.quiz, '#4ea1ff', 'First answer to each question'],
      ['Efficiency', parts.efficiency, W.efficiency, '#ffd166', 'Your code size vs. the reference solution'],
      ['Clean run', parts.clean, W.clean, '#7c5cff', 'No hints, no peeked solutions, few failed runs']
    ];
    return '<div class="sc-rows">' + rows.map(function (r) {
      var pct = Math.round(r[1] / r[2] * 100);
      return '<div class="sc-row"><span class="k">' + r[0] + '</span>' +
        '<span class="track"><i style="width:' + pct + '%;background:' + r[3] + '"></i></span>' +
        '<span class="v">' + r[1] + ' / ' + r[2] + '</span></div>';
    }).join('') + '</div>';
  }

  function notFound() {
    main.innerHTML = '<div class="locked-note"><span class="big">🧭</span>That page does not exist. ' +
      '<a href="#/" data-link>Back to the dashboard</a>.</div>';
  }

  /* ============================================================
     LEVEL VIEW
     ============================================================ */
  var active = null; // { level, sess, editors, tab }

  function blankSession() {
    return { solved: {}, hints: {}, peeked: {}, fails: {}, chars: {}, quiz: {}, parsons: false };
  }

  function getSession(level) {
    var L = Game.level(level.id);
    if (!L.session) L.session = blankSession();
    ['solved', 'hints', 'peeked', 'fails', 'chars', 'quiz'].forEach(function (k) {
      if (!L.session[k]) L.session[k] = {};
    });
    return L.session;
  }

  function liveScore() {
    var L = Game.level(active.level.id);
    var sess = active.sess;
    sess.chars = {};
    (active.level.exercises || []).forEach(function (ex) {
      sess.chars[ex.id] = Game.codeSize(L.code[ex.id] || '');
    });
    return Game.scoreLevel(active.level, sess);
  }

  function viewLevel(day) {
    var level = levelByDay(day);
    if (!level) return notFound();
    if (!Game.isUnlocked(level)) {
      main.innerHTML = '<div class="locked-note"><span class="big">🔒</span>' +
        '<strong>Level ' + level.day + ' is locked.</strong><br>' +
        'Clear day ' + (level.day - 1) + ' first, or switch on <em>Unlock all classes</em> in settings ⚙.' +
        '<div class="mt16"><a class="btn btn-ghost" href="#/level/' + (level.day - 1) + '" data-link>Go to day ' + (level.day - 1) + '</a></div></div>';
      return;
    }

    var L = Game.level(level.id);
    active = { level: level, sess: getSession(level), editors: {}, tab: 'learn' };
    L.lastPlayed = new Date().toISOString();
    Game.save();

    var m = moduleOf(level.module);
    var exs = level.exercises || [];
    var qs = level.quiz || [];

    main.innerHTML =
      '<div class="lesson-head">' +
        '<div style="flex:1;min-width:260px">' +
          '<div class="eyebrow">Module ' + m.n + ' · ' + esc(m.name) + ' · Level ' + level.day + '</div>' +
          '<h1>' + esc(level.title) + '</h1>' +
          '<div class="chips">' +
            '<span class="chip">⏱ ' + (level.minutes || 25) + ' min</span>' +
            '<span class="chip chip-accent">' + m.tag + '</span>' +
            (level.boss ? '<span class="chip chip-boss">👑 Boss challenge</span>' : '') +
            (L.cleared ? '<span class="chip chip-long">✓ Cleared</span>' : '') +
            (L.plays ? '<span class="chip">Attempt ' + (L.plays + 1) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div style="text-align:right">' +
          '<div class="wrap-row" style="justify-content:flex-end">' + rankBadge(L.rank, 'rank-lg') + '</div>' +
          '<div class="muted" style="font-size:.75rem;margin-top:6px">' +
            (L.best ? 'Best ' + L.best + ' / 1000' : 'Not yet graded') + '</div>' +
          (L.attempts.length ? '<a href="#/archive/' + level.day + '" data-link style="font-size:.75rem">' + L.attempts.length + ' saved attempts</a>' : '') +
        '</div>' +
      '</div>' +

      (level.boss ? '<div class="boss-banner"><span class="big">👑</span><div>' +
        '<strong>Boss challenge.</strong> This level pulls together everything before it — ' +
        'no new theory, just build the thing. Budget a little longer than a normal class.' +
        '</div></div>' : '') +

      '<div class="goal">' + level.goal + '</div>' +

      '<div class="tabs" id="tabs">' +
        '<button class="tab active" data-tab="learn">📖 Learn</button>' +
        '<button class="tab" data-tab="practice">⌨️ Practice <span class="badge" id="bPractice">0/' + exs.length + '</span></button>' +
        '<button class="tab" data-tab="quiz">🧠 Recall <span class="badge" id="bQuiz">0/' + qs.length + '</span></button>' +
      '</div>' +
      '<div id="tabBody"></div>' +

      '<div class="complete-bar" id="completeBar"></div>' +

      '<div class="lesson-foot-nav">' +
        (level.day > 1 ? '<a class="btn btn-ghost" href="#/level/' + (level.day - 1) + '" data-link>← Day ' + (level.day - 1) + '</a>' : '<span></span>') +
        (levelByDay(level.day + 1) ? '<a class="btn btn-ghost" href="#/level/' + (level.day + 1) + '" data-link>Day ' + (level.day + 1) + ' →</a>' : '<span></span>') +
      '</div>';

    $('#tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.tab'); if (!b) return;
      setTab(b.dataset.tab);
    });

    setTab('learn');
    refreshBar();
  }

  function setTab(name) {
    active.tab = name;
    $$('#tabs .tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); });
    var body = $('#tabBody');
    body.innerHTML = '';
    if (name === 'learn') renderLearn(body);
    else if (name === 'practice') renderPractice(body);
    else renderQuiz(body);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- Learn tab ---------------- */
  function renderLearn(root) {
    var level = active.level;

    if (level.objectives && level.objectives.length) {
      var o = document.createElement('div');
      o.className = 'card';
      o.style.marginBottom = '26px';
      o.innerHTML = '<h2 style="font-size:.95rem;margin-bottom:10px">By the end of this class you can</h2>' +
        '<ul class="prose" style="margin:0">' +
        level.objectives.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      root.appendChild(o);
    }

    (level.sections || []).forEach(function (sec, i) {
      var s = document.createElement('section');
      s.className = 'section';
      s.innerHTML = '<h2><span class="n">' + String(i + 1).padStart(2, '0') + '</span>' + esc(sec.h) + '</h2>' +
        '<div class="prose">' + sec.body + '</div>';
      if (sec.code) {
        s.appendChild(window.Editor.block(sec.code, {
          filename: sec.file || 'example.js',
          runnable: sec.run !== false
        }));
      }
      if (sec.after) {
        var a = document.createElement('div');
        a.className = 'prose';
        a.innerHTML = sec.after;
        s.appendChild(a);
      }
      root.appendChild(s);
    });

    if (level.recap && level.recap.length) {
      var r = document.createElement('div');
      r.className = 'card';
      r.innerHTML = '<h2 style="font-size:.95rem">Recap</h2><ul class="prose" style="margin:0">' +
        level.recap.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
      root.appendChild(r);
    }

    var cta = document.createElement('div');
    cta.className = 'mt24';
    cta.innerHTML = '<button class="btn" id="toPractice">Start the practice problems →</button>';
    root.appendChild(cta);
    $('#toPractice').addEventListener('click', function () { setTab('practice'); });
  }

  /* ---------------- Practice tab ---------------- */
  function renderPractice(root) {
    var level = active.level;
    var L = Game.level(level.id);
    var sess = active.sess;

    if (level.parsons) {
      var pz = window.Editor.parsons(level.parsons, function () {
        if (!sess.parsons) { sess.parsons = true; Game.save(); toast('🧩 Warm-up solved — now write it yourself.', 'good'); }
      });
      root.appendChild(pz);
    }

    (level.exercises || []).forEach(function (ex, i) {
      root.appendChild(buildExercise(ex, i, L, sess));
    });

    if (!level.exercises || !level.exercises.length) {
      root.innerHTML += '<p class="muted">This level has no coding exercises.</p>';
    }
    updateBadges();
  }

  function buildExercise(ex, i, L, sess) {
    var wrap = document.createElement('div');
    wrap.className = 'exercise' + (sess.solved[ex.id] ? ' solved' : '');
    wrap.id = 'ex-' + ex.id;

    wrap.innerHTML =
      '<div class="ex-head">' +
        '<span class="ex-num">' + (sess.solved[ex.id] ? '✓' : String(i + 1).padStart(2, '0')) + '</span>' +
        '<h3>' + esc(ex.title) + '</h3>' +
        (ex.difficulty ? '<span class="chip">' + ex.difficulty + '</span>' : '') +
      '</div>' +
      '<div class="ex-prompt">' + ex.prompt + '</div>' +
      '<div class="ed-slot"></div>' +
      '<div class="run-row">' +
        '<button class="btn btn-long btn-sm run">▶ Run tests</button>' +
        '<button class="btn btn-ghost btn-sm reset">↺ Reset code</button>' +
        (ex.hints && ex.hints.length ? '<button class="btn btn-ghost btn-sm hint">💡 Hint</button>' : '') +
        '<button class="btn btn-ghost btn-sm sol">🔓 Model solution</button>' +
        '<span class="spacer"></span>' +
        '<span class="muted eff" style="font-size:.76rem;font-family:var(--mono)"></span>' +
      '</div>' +
      '<div class="tests-slot"></div>' +
      '<div class="console-slot"></div>' +
      '<div class="hints"></div>' +
      '<div class="sol-slot"></div>';

    var slot = $('.ed-slot', wrap);
    var initial = L.code[ex.id] !== undefined ? L.code[ex.id] : (ex.starter || '');
    var editor = window.Editor.create({
      value: initial,
      filename: ex.file || (ex.id + '.js'),
      label: ex.title,
      onChange: function (v) {
        L.code[ex.id] = v;
        Game.save();
        updateEff(wrap, ex, v);
        refreshBar();
      },
      onRun: function () { runExercise(wrap, ex); }
    });
    slot.appendChild(editor.el);
    active.editors[ex.id] = editor;
    updateEff(wrap, ex, initial);

    $('.run', wrap).addEventListener('click', function () { runExercise(wrap, ex); });
    $('.reset', wrap).addEventListener('click', function () {
      editor.value = ex.starter || '';
      L.code[ex.id] = editor.value;
      Game.save(); updateEff(wrap, ex, editor.value); refreshBar();
    });

    var hintBtn = $('.hint', wrap);
    if (hintBtn) {
      hintBtn.addEventListener('click', function () {
        var used = sess.hints[ex.id] || 0;
        if (used >= ex.hints.length) { toast('No more hints for this one.', ''); return; }
        sess.hints[ex.id] = used + 1;
        Game.save();
        renderHints(wrap, ex, sess);
        refreshBar();
        toast('Hint ' + (used + 1) + ' revealed · −' + Math.round(600 / (active.level.exercises.length) * 0.10) + ' correctness points', '');
      });
    }
    renderHints(wrap, ex, sess);

    $('.sol', wrap).addEventListener('click', function () {
      if (!sess.solved[ex.id] && !sess.peeked[ex.id]) {
        if (!confirm('Reveal the model solution before solving it?\n\nThis caps this exercise at 65% credit and forfeits the clean-run bonus for the level.\n\n(You can always replay the level later for full marks.)')) return;
        sess.peeked[ex.id] = true;
        Game.save();
        refreshBar();
      }
      renderSolution(wrap, ex, sess);
    });
    if (sess.solved[ex.id] || sess.peeked[ex.id]) renderSolution(wrap, ex, sess, true);

    return wrap;
  }

  function updateEff(wrap, ex, code) {
    var par = Game.codeSize(ex.solution || '');
    var mine = Game.codeSize(code || '');
    var el = $('.eff', wrap);
    if (!par || !mine) { el.textContent = ''; return; }
    var ratio = mine / par;
    var verdict = ratio <= 1.15 ? 'efficient ✓' : ratio < 1.6 ? 'a little long' : ratio < 3 ? 'verbose' : 'very verbose';
    el.textContent = mine + ' chars · par ' + par + ' · ' + verdict;
    el.style.color = ratio <= 1.15 ? 'var(--long)' : ratio < 1.6 ? 'var(--fg-mute)' : 'var(--warn)';
  }

  function renderHints(wrap, ex, sess) {
    var box = $('.hints', wrap);
    var n = sess.hints[ex.id] || 0;
    box.innerHTML = (ex.hints || []).slice(0, n).map(function (h, i) {
      return '<details class="hint" open><summary>Hint ' + (i + 1) + '</summary>' +
        '<div class="hint-body">' + h + '</div></details>';
    }).join('');
    var btn = $('.hint', wrap);
    if (btn) {
      var left = (ex.hints || []).length - n;
      btn.textContent = left ? '💡 Hint (' + left + ' left)' : '💡 No hints left';
      btn.disabled = !left;
    }
  }

  function renderSolution(wrap, ex, sess, quiet) {
    var slot = $('.sol-slot', wrap);
    if (slot.dataset.open) return;
    slot.dataset.open = '1';
    var head = document.createElement('div');
    head.className = 'mt16';
    head.innerHTML = '<h4 style="font-size:.85rem;color:var(--fg-dim);margin-bottom:8px">' +
      'Model solution' + (sess.solved[ex.id] ? ' — compare it with yours' : ' (peeked)') + '</h4>';
    slot.appendChild(head);
    slot.appendChild(window.Editor.block(ex.solution || '// (no reference solution)', {
      filename: 'model.js', runnable: false
    }));
    if (ex.discussion) {
      var d = document.createElement('div');
      d.className = 'note note-tip';
      d.innerHTML = '<b>Why this shape</b>' + ex.discussion;
      slot.appendChild(d);
    }
    if (!quiet) toast('Model solution revealed.', '');
  }

  async function runExercise(wrap, ex) {
    var sess = active.sess;
    var editor = active.editors[ex.id];
    var code = editor.value;
    var btn = $('.run', wrap);
    btn.disabled = true; btn.textContent = '⏳ Running…';

    var res = await window.Runner.runTests(code, ex);
    Game.state.stats.runs++;

    // console output
    var cslot = $('.console-slot', wrap);
    var logHtml = res.logs.map(function (l) {
      var cls = l.kind === 'err' ? 'log-err' : l.kind === 'warn' ? 'log-warn' : l.kind === 'mute' ? 'log-mute' : '';
      return '<span class="' + cls + '">' + esc(l.text) + '</span>';
    }).join('\n');
    if (res.error) logHtml += (logHtml ? '\n' : '') + '<span class="log-err">' + esc(res.error) + '</span>';
    cslot.innerHTML = logHtml
      ? '<div class="console"><div class="console-head">Console · ' + res.ms + 'ms</div>' +
        '<div class="console-body">' + logHtml + '</div></div>'
      : '';

    // test results
    var tslot = $('.tests-slot', wrap);
    var allPass = res.ran && res.total > 0 && res.passed === res.total;
    if (!res.ran) {
      tslot.innerHTML = '<div class="tests"><div class="tests-head">' +
        '<span class="pill bad">error</span> Your code threw before the tests could run</div>' +
        '<div class="test-row fail"><span class="mark">✕</span><span class="body">' +
        '<span class="name">' + esc(res.error || 'Unknown error') + '</span></span></div></div>';
    } else {
      tslot.innerHTML = '<div class="tests"><div class="tests-head">' +
        '<span class="pill ' + (allPass ? 'ok' : 'bad') + '">' + res.passed + '/' + res.total + '</span>' +
        (allPass ? 'All tests passed' : 'Tests failing') +
        '<span class="right muted" style="font-weight:400">' + res.ms + 'ms</span></div>' +
        res.results.map(function (r) {
          return '<div class="test-row ' + (r.pass ? 'pass' : 'fail') + '">' +
            '<span class="mark">' + (r.pass ? '✓' : '✕') + '</span>' +
            '<span class="body"><span class="name">' + esc(r.name) + '</span>' +
            (r.why ? '<div class="why">' + esc(r.why) + '</div>' : '') + '</span></div>';
        }).join('') + '</div>';
    }

    var wasSolved = sess.solved[ex.id];
    if (allPass) {
      sess.solved[ex.id] = true;
      wrap.classList.add('solved');
      $('.ex-num', wrap).textContent = '✓';
      if (!wasSolved) {
        toast('✓ <b>' + esc(ex.title) + '</b> solved.', 'good');
        renderSolution(wrap, ex, sess, true);
      }
    } else {
      sess.fails[ex.id] = (sess.fails[ex.id] || 0) + 1;
      if (sess.solved[ex.id]) {
        // a previously-passing exercise now fails: reflect that honestly
        sess.solved[ex.id] = false;
        wrap.classList.remove('solved');
      }
    }
    Game.save();
    updateBadges();
    refreshBar();
    btn.disabled = false; btn.textContent = '▶ Run tests';
  }

  /* ---------------- Quiz tab ---------------- */
  function renderQuiz(root) {
    var level = active.level, sess = active.sess;
    var qs = level.quiz || [];
    if (!qs.length) { root.innerHTML = '<p class="muted">This level has no recall quiz.</p>'; return; }

    root.innerHTML = '<p class="prose" style="margin-bottom:18px">' +
      'Answer from memory — <strong>only your first answer scores</strong>. ' +
      'Retrieving an idea is what moves it into long-term memory, so guess before you scroll back.</p>' +
      qs.map(function (q, i) {
        return '<div class="quiz-q" data-q="' + i + '">' +
          '<div class="q"><span class="mono muted">Q' + (i + 1) + '.</span> ' + q.q + '</div>' +
          q.options.map(function (o, j) {
            return '<label class="opt" data-opt="' + j + '">' +
              '<input type="radio" name="q' + i + '" value="' + j + '"><span>' + o + '</span></label>';
          }).join('') +
          '<div class="explain" hidden></div></div>';
      }).join('');

    // restore any answers already given
    qs.forEach(function (q, i) {
      var rec = sess.quiz[i];
      if (rec && rec.answered) paintQuiz(root, i, rec.choice, q);
    });

    root.addEventListener('change', function (e) {
      var input = e.target.closest('input[type=radio]'); if (!input) return;
      var qi = +input.closest('.quiz-q').dataset.q;
      var choice = +input.value;
      var q = qs[qi];
      var rec = sess.quiz[qi];
      if (rec && rec.answered) return;               // first answer is final
      sess.quiz[qi] = {
        answered: true, choice: choice, firstCorrect: choice === q.answer
      };
      Game.save();
      paintQuiz(root, qi, choice, q);
      updateBadges();
      refreshBar();
    });
    updateBadges();
  }

  function paintQuiz(root, qi, choice, q) {
    var box = root.querySelector('.quiz-q[data-q="' + qi + '"]');
    if (!box) return;
    $$('.opt', box).forEach(function (o) {
      var j = +o.dataset.opt;
      var inp = $('input', o);
      inp.checked = j === choice;
      inp.disabled = true;
      if (j === q.answer) o.classList.add('correct');
      else if (j === choice) o.classList.add('wrong');
    });
    var ex = $('.explain', box);
    ex.hidden = false;
    ex.innerHTML = (choice === q.answer ? '<strong style="color:var(--long)">Correct.</strong> ' :
      '<strong style="color:var(--short)">Not quite.</strong> ') + q.explain;
  }

  function updateBadges() {
    var level = active.level, sess = active.sess;
    var exs = level.exercises || [], qs = level.quiz || [];
    var solved = exs.filter(function (e) { return sess.solved[e.id]; }).length;
    var answered = qs.filter(function (q, i) { return sess.quiz[i] && sess.quiz[i].answered; }).length;
    var bp = $('#bPractice'), bq = $('#bQuiz');
    if (bp) { bp.textContent = solved + '/' + exs.length; bp.classList.toggle('ok', solved === exs.length && exs.length > 0); }
    if (bq) { bq.textContent = answered + '/' + qs.length; bq.classList.toggle('ok', answered === qs.length && qs.length > 0); }
  }

  /* ---------------- live score bar ---------------- */
  function refreshBar() {
    var bar = $('#completeBar');
    if (!bar || !active) return;
    var sc = liveScore();
    var L = Game.level(active.level.id);
    var pct = Math.round(sc.total / 1000 * 100);

    bar.innerHTML =
      rankBadge(sc.rank.id) +
      '<div class="prog">' +
        '<div class="wrap-row"><strong>' + sc.total + '</strong><span class="lbl">/ 1000 · projected rank ' +
        sc.rank.id + ' (' + sc.rank.name + ')</span>' +
        (L.best ? '<span class="lbl right">best ' + L.best + '</span>' : '') + '</div>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
      '</div>' +
      '<button class="btn" id="finishBtn"' + (sc.cleared ? '' : ' disabled') + '>' +
        (sc.cleared ? '🏁 Submit level' : 'Finish the practice + quiz to submit') + '</button>';

    var fb = $('#finishBtn');
    if (fb && sc.cleared) fb.addEventListener('click', function () { finishLevel(sc); });
  }

  /* ---------------- submit + debrief ---------------- */
  function finishLevel(sc) {
    var level = active.level;
    var L = Game.level(level.id);
    active.sess.code = L.code;
    var result = Game.commit(level, active.sess, sc);
    Social.publish();
    renderSidebar(level.day);
    renderDebrief(level, sc, result);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (result.firstClear) toast('🏁 Level ' + level.day + ' cleared — rank <b>' + sc.rank.id + '</b>!', 'good', 4200);
    else if (result.improved) toast('📈 New best: ' + sc.total + ' (+' + result.delta + ')', 'good', 4200);
    else toast('Score ' + sc.total + ' — your best of ' + result.prevBest + ' still stands.', '');
    result.achievements.forEach(function (a, i) {
      setTimeout(function () { toast(a.icon + ' Badge unlocked: <b>' + esc(a.name) + '</b>', 'good', 5000); }, 700 + i * 900);
    });
  }

  function renderDebrief(level, sc, result) {
    var L = Game.level(level.id);
    var nextL = levelByDay(level.day + 1);
    var advice = improvementAdvice(level, sc);

    main.innerHTML =
      '<div class="page-head"><div class="eyebrow">Level ' + level.day + ' debrief</div>' +
      '<h1>' + esc(level.title) + '</h1></div>' +

      '<div class="scorecard" style="margin-bottom:20px">' +
        '<div class="sc-top">' + rankBadge(sc.rank.id, 'rank-lg') +
          '<div><div class="sc-score">' + sc.total + '<small> / 1000</small></div>' +
          '<div class="sc-rankname">Rank ' + sc.rank.id + ' · ' + sc.rank.name + '</div></div>' +
          '<div class="sc-delta">' +
            (result.improved
              ? '<span class="up">▲ ' + (result.prevBest ? '+' + result.delta : 'new personal best') + '</span>'
              : '<span class="same">best still ' + result.prevBest + '</span>') +
            '<br><span class="muted">attempt ' + L.plays + '</span>' +
          '</div>' +
        '</div>' +
        scoreRows(sc.parts) +
        (advice ? '<div class="sc-hint">' + advice + '</div>' : '') +
      '</div>' +

      (sc.rank.id !== 'S'
        ? '<div class="next-rank">🎯 <b>Want a better rank?</b> Replay this level — hint and peek penalties reset, ' +
          'your saved code stays, and only your best attempt counts. Tighten the code and the Efficiency bar fills up.</div>'
        : '<div class="next-rank">⭐ <b>Perfect print.</b> Nothing left to squeeze out of this one.</div>') +

      '<div class="wrap-row mt24">' +
        (nextL ? '<a class="btn" href="#/level/' + nextL.day + '" data-link>Next level: ' + esc(nextL.title) + ' →</a>' : '') +
        '<button class="btn btn-ghost" id="replayBtn">↺ Replay to improve</button>' +
        '<a class="btn btn-ghost" href="#/archive/' + level.day + '" data-link>🗄 Saved attempts (' + L.attempts.length + ')</a>' +
        '<a class="btn btn-ghost" href="#/" data-link>Dashboard</a>' +
      '</div>' +

      '<div class="card mt24">' +
        '<h2 style="font-size:1rem">Per-exercise breakdown</h2>' +
        '<div class="tests" style="margin-top:0">' +
        sc.detail.exercises.map(function (e) {
          return '<div class="test-row ' + (e.solved ? 'pass' : 'fail') + '">' +
            '<span class="mark">' + (e.solved ? '✓' : '✕') + '</span>' +
            '<span class="body"><span class="name">' + esc(e.title) + '</span>' +
            '<div class="why" style="color:var(--fg-mute)">' +
              e.points + ' correctness · ' + e.effPoints + ' efficiency · ' +
              e.chars + ' chars vs par ' + e.par +
              (e.hints ? ' · ' + e.hints + ' hint' + (e.hints > 1 ? 's' : '') : '') +
              (e.peeked ? ' · peeked' : '') +
              (e.fails ? ' · ' + e.fails + ' failed run' + (e.fails > 1 ? 's' : '') : '') +
            '</div></span></div>';
        }).join('') + '</div>' +
      '</div>';

    $('#replayBtn').addEventListener('click', function () {
      var Lv = Game.level(level.id);
      Lv.session = blankSession();   // reset penalties, keep the code
      Game.save();
      viewLevel(level.day);
      toast('Fresh attempt started. Your code was kept — hints and peeks are reset.', '');
    });
  }

  function improvementAdvice(level, sc) {
    var tips = [];
    var d = sc.detail;
    if (d.quizRight < d.quizTotal) {
      tips.push('You lost ' + (Game.WEIGHTS.quiz - sc.parts.quiz) + ' points on recall (' +
        d.quizRight + '/' + d.quizTotal + '). Re-read the Learn tab, then replay — first answers count.');
    }
    if (sc.parts.efficiency < Game.WEIGHTS.efficiency * 0.8) {
      var verbose = d.exercises.filter(function (e) { return e.par && e.chars > e.par * 1.15; })
        .map(function (e) { return e.title; });
      tips.push('Efficiency is at ' + sc.parts.efficiency + '/' + Game.WEIGHTS.efficiency +
        (verbose.length ? ' — <b>' + esc(verbose[0]) + '</b> is the longest vs. par' : '') +
        '. Compare against the model solution and cut the scaffolding.');
    }
    if (sc.parts.clean < Game.WEIGHTS.clean) {
      tips.push('No clean-run bonus this time (' + d.hintsUsed + ' hints, ' + d.peeks +
        ' peeks, ' + d.fails + ' failed runs). A hint-free replay is worth ' + Game.WEIGHTS.clean + ' points.');
    }
    if (!tips.length) return '<b>Nothing to fix.</b> Full marks across every category.';
    return '<b>To score higher:</b><ul style="margin:8px 0 0;padding-left:20px">' +
      tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
  }

  /* ============================================================
     REVIEW DRILL (spaced repetition)
     ============================================================ */
  function viewReview() {
    var due = Game.dueForReview();
    if (!due.length) {
      main.innerHTML = '<div class="page-head"><div class="eyebrow">Review</div><h1>Nothing due</h1></div>' +
        '<div class="locked-note"><span class="big">✅</span>' +
        'Your review queue is empty. Cleared levels come back after 1, 3, 7, 16 and 35 days — ' +
        'spacing the repetitions is what makes them stick.' +
        '<div class="mt16"><a class="btn btn-ghost" href="#/" data-link>Back to dashboard</a></div></div>';
      return;
    }

    // pull up to two recall questions from each due level
    var deck = [];
    due.forEach(function (l) {
      (l.quiz || []).slice(0, 2).forEach(function (q, i) {
        deck.push({ level: l, q: q, key: l.id + ':' + i });
      });
    });

    var answers = {};
    main.innerHTML = '<div class="page-head"><div class="eyebrow">Spaced review · ' + due.length + ' level' +
      (due.length > 1 ? 's' : '') + ' due</div><h1>Daily drill</h1>' +
      '<p class="muted">Questions pulled from levels you cleared a while ago. Answer from memory — ' +
      'getting it right pushes the next review further out.</p></div>' +
      '<div id="deck">' + deck.map(function (d, i) {
        return '<div class="quiz-q" data-q="' + i + '">' +
          '<div class="muted mono" style="font-size:.72rem;margin-bottom:6px">Day ' + d.level.day + ' · ' + esc(d.level.title) + '</div>' +
          '<div class="q">' + d.q.q + '</div>' +
          d.q.options.map(function (o, j) {
            return '<label class="opt" data-opt="' + j + '"><input type="radio" name="r' + i + '" value="' + j + '"><span>' + o + '</span></label>';
          }).join('') +
          '<div class="explain" hidden></div></div>';
      }).join('') + '</div>' +
      '<div class="complete-bar"><div class="prog"><div class="wrap-row"><strong id="rScore">0</strong>' +
      '<span class="lbl">/ ' + deck.length + ' correct</span></div>' +
      '<div class="bar"><i id="rBar" style="width:0%"></i></div></div>' +
      '<button class="btn" id="rFinish" disabled>Finish drill</button></div>';

    var root = $('#deck');
    root.addEventListener('change', function (e) {
      var input = e.target.closest('input[type=radio]'); if (!input) return;
      var qi = +input.closest('.quiz-q').dataset.q;
      if (answers[qi] !== undefined) return;
      var choice = +input.value;
      answers[qi] = choice;
      paintQuiz(root, qi, choice, deck[qi].q);
      var right = Object.keys(answers).filter(function (k) {
        return answers[k] === deck[k].q.answer;
      }).length;
      $('#rScore').textContent = right;
      $('#rBar').style.width = Math.round(Object.keys(answers).length / deck.length * 100) + '%';
      $('#rFinish').disabled = Object.keys(answers).length < deck.length;
    });

    $('#rFinish').addEventListener('click', function () {
      var byLevel = {};
      deck.forEach(function (d, i) {
        if (!byLevel[d.level.id]) byLevel[d.level.id] = { right: 0, total: 0 };
        byLevel[d.level.id].total++;
        if (answers[i] === d.q.answer) byLevel[d.level.id].right++;
      });
      Object.keys(byLevel).forEach(function (id) {
        var b = byLevel[id];
        Game.markReviewed(id, b.right / b.total >= 0.5);
      });
      var right = Object.keys(answers).filter(function (k) { return answers[k] === deck[k].q.answer; }).length;
      Game.checkAchievements(); Game.save();
      renderSidebar();
      main.innerHTML = '<div class="page-head"><div class="eyebrow">Drill complete</div>' +
        '<h1>' + right + ' of ' + deck.length + ' recalled</h1></div>' +
        '<div class="card"><p class="prose">' +
        (right === deck.length
          ? 'Perfect recall. Those levels are scheduled further out now.'
          : 'The ones you missed are queued to come back sooner. That is the system working, not a failure.') +
        '</p><div class="wrap-row"><a class="btn" href="#/" data-link>Back to dashboard</a>' +
        '<a class="btn btn-ghost" href="#/map" data-link>The path</a></div></div>';
    });
  }

  /* ============================================================
     PLAYGROUND
     ============================================================ */
  var PLAY_KEY = 'quantacademy.playground';
  function viewPlayground() {
    main.innerHTML = '<div class="page-head"><div class="eyebrow">Sandbox</div>' +
      '<h1>Playground</h1>' +
      '<p class="muted">A blank file with the sample market data already in scope. ' +
      'Nothing is graded here — break things.</p></div>' +
      '<div class="card" style="margin-bottom:16px">' +
        '<h3 style="font-size:.9rem">Variables available in every run</h3>' +
        '<div class="prose" style="margin:0"><ul style="margin:0">' +
        '<li><code>bars</code> — 78 five-minute ES candles: <code>{time, open, high, low, close, volume}</code></li>' +
        '<li><code>closes</code>, <code>highs</code>, <code>lows</code>, <code>volumes</code> — those fields as plain arrays</li>' +
        '<li><code>trades</code> — a sample trade log; <code>positions</code> — an open book; <code>specs</code> — contract specs</li>' +
        '</ul></div></div>' +
      '<div id="playSlot"></div>' +
      '<div class="run-row"><button class="btn btn-long" id="playRun">▶ Run (Ctrl+Enter)</button>' +
      '<button class="btn btn-ghost" id="playClear">Clear output</button></div>' +
      '<div id="playOut"></div>';

    var saved = '';
    try { saved = localStorage.getItem(PLAY_KEY) || ''; } catch (e) {}
    var ed = window.Editor.create({
      value: saved || [
        '// Scratch pad. Everything below runs in a sandbox.',
        'const last = closes.at(-1);',
        'const first = closes[0];',
        'const change = last - first;',
        '',
        'console.log("Session range:", Math.min(...lows), "→", Math.max(...highs));',
        'console.log("Net change:", change.toFixed(2), "points");',
        'console.log("Dollar P&L on 1 ES contract:", (change * specs.ES.pointValue).toFixed(2));'
      ].join('\n'),
      filename: 'playground.js',
      onChange: function (v) { try { localStorage.setItem(PLAY_KEY, v); } catch (e) {} },
      onRun: run
    });
    $('#playSlot').appendChild(ed.el);

    async function run() {
      var btn = $('#playRun');
      btn.disabled = true; btn.textContent = '⏳ Running…';
      var r = await window.Runner.execute(ed.value, []);
      var html = r.logs.map(function (l) {
        var cls = l.kind === 'err' ? 'log-err' : l.kind === 'warn' ? 'log-warn' : l.kind === 'mute' ? 'log-mute' : '';
        return '<span class="' + cls + '">' + esc(l.text) + '</span>';
      }).join('\n');
      if (r.error) html += (html ? '\n' : '') + '<span class="log-err">' + esc(r.error) + '</span>';
      $('#playOut').innerHTML = '<div class="console"><div class="console-head">Output · ' + r.ms + 'ms</div>' +
        '<div class="console-body">' + (html || '<span class="log-mute">(no output)</span>') + '</div></div>';
      btn.disabled = false; btn.textContent = '▶ Run (Ctrl+Enter)';
    }
    $('#playRun').addEventListener('click', run);
    $('#playClear').addEventListener('click', function () { $('#playOut').innerHTML = ''; });
  }

  /* ============================================================
     REFERENCE
     ============================================================ */
  function viewReference() {
    var cleared = CUR.filter(function (l) {
      var L = Game.state.levels[l.id]; return L && L.cleared;
    });
    var vocab = [];
    cleared.forEach(function (l) { (l.vocab || []).forEach(function (v) { vocab.push(v); }); });

    main.innerHTML = '<div class="page-head"><div class="eyebrow">Reference</div>' +
      '<h1>Cheat sheet</h1><p class="muted">Syntax you have met so far, plus the trading terms behind the exercises.</p></div>' +
      '<div class="ref-grid">' + REFERENCE.map(function (c) {
        return '<div class="card ref-card"><h3>' + esc(c.h) + '</h3><ul>' +
          c.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul></div>';
      }).join('') + '</div>' +
      '<h2 class="mt24">Trading glossary</h2>' +
      (vocab.length
        ? '<div class="ref-grid">' + vocab.map(function (v) {
            return '<div class="card ref-card"><h3>' + esc(v.term) + '</h3>' +
              '<p class="muted" style="font-size:.85rem;margin:0">' + v.def + '</p></div>';
          }).join('') + '</div>'
        : '<p class="muted">Terms unlock as you clear levels — the glossary fills itself in.</p>');
  }

  var REFERENCE = [
    { h: 'Declaring values', items: [
      '<code>const price = 5240.25</code> — cannot be reassigned. Default choice.',
      '<code>let qty = 2</code> — reassignable. Use when the value really changes.',
      '<code>var</code> — legacy, function-scoped. Avoid.'
    ]},
    { h: 'Numbers', items: [
      '<code>(x).toFixed(2)</code> → string with 2 decimals',
      '<code>Math.round / floor / ceil / abs / max / min</code>',
      '<code>Number.isFinite(x)</code> — safer than <code>isFinite</code>',
      'Floating point: <code>0.1 + 0.2 !== 0.3</code>. Compare with a tolerance.'
    ]},
    { h: 'Arrays', items: [
      '<code>arr.map(fn)</code> — same length, transformed',
      '<code>arr.filter(fn)</code> — subset',
      '<code>arr.reduce(fn, seed)</code> — fold to one value',
      '<code>arr.slice(a, b)</code> — copy a window (non-destructive)',
      '<code>arr.at(-1)</code> — last element'
    ]},
    { h: 'Objects', items: [
      '<code>const {close, volume} = bar</code> — destructure',
      '<code>{...bar, close: 5250}</code> — copy with an override',
      '<code>Object.entries(o)</code> / <code>Object.values(o)</code>',
      '<code>o?.deep?.value ?? fallback</code> — safe access'
    ]},
    { h: 'Functions', items: [
      '<code>const f = (a, b) => a + b</code> — arrow, implicit return',
      '<code>function f(a = 1) {}</code> — default parameter',
      '<code>(...args) => {}</code> — rest parameters',
      'A closure is a function that remembers the scope it was created in.'
    ]},
    { h: 'Async', items: [
      '<code>await fetch(url)</code> inside an <code>async</code> function',
      '<code>Promise.all([...])</code> — run in parallel, fail fast',
      '<code>Promise.allSettled([...])</code> — never rejects',
      '<code>try { await x } catch (e) {}</code> — handle rejection'
    ]},
    { h: 'Indicator formulas', items: [
      'SMA<sub>n</sub> = mean of the last n closes',
      'EMA<sub>t</sub> = α·price + (1−α)·EMA<sub>t−1</sub>, α = 2/(n+1)',
      'RSI = 100 − 100/(1 + avgGain/avgLoss)',
      'ATR = mean of True Range, TR = max(H−L, |H−C<sub>prev</sub>|, |L−C<sub>prev</sub>|)',
      'VWAP = Σ(typical price × volume) / Σ volume'
    ]},
    { h: 'Risk maths', items: [
      'P&L (long) = (exit − entry) × qty × pointValue',
      'P&L (short) = (entry − exit) × qty × pointValue',
      'R multiple = profit ÷ initial risk',
      'Expectancy = winRate × avgWin − lossRate × avgLoss',
      'Max drawdown = largest peak-to-trough drop in equity'
    ]},
    { h: 'Contract specs', items: [
      'ES — E-mini S&P 500, tick 0.25, $50 per point',
      'NQ — E-mini Nasdaq, tick 0.25, $20 per point',
      'RTY — E-mini Russell, tick 0.10, $50 per point',
      'CL — Crude Oil, tick 0.01, $1000 per point',
      'GC — Gold, tick 0.10, $100 per point'
    ]}
  ];

  /* ============================================================
     SETTINGS MODAL
     ============================================================ */
  function wireModal() {
    var back = $('#modalBackdrop');
    function open() {
      $('#unlockAll').checked = !!Game.state.settings.unlockAll;
      back.hidden = false;
    }
    function close() { back.hidden = true; }
    $('#menuBtn').addEventListener('click', open);
    $('#modalClose').addEventListener('click', close);
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    $('#unlockAll').addEventListener('change', function (e) {
      Game.state.settings.unlockAll = e.target.checked;
      Game.save(); renderSidebar(active && active.level.day); route();
    });
    $('#exportBtn').addEventListener('click', function () {
      var blob = new Blob([Game.exportJSON()], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'quant-academy-progress.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('#importInput').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try { Game.importJSON(r.result); toast('Progress restored.', 'good'); renderSidebar(); route(); close(); }
        catch (err) { toast('Could not read that file: ' + esc(err.message), 'bad'); }
      };
      r.readAsText(f);
      e.target.value = '';
    });
    $('#resetBtn').addEventListener('click', function () {
      if (!confirm('Delete all progress, scores and saved code? This cannot be undone.')) return;
      Game.reset(); renderSidebar(); location.hash = '#/'; route(); close();
      toast('Progress reset.', '');
    });
  }


  /* ============================================================
     FRIENDS · LEAGUE · SHARING
     ============================================================ */
  function medal(i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.'; }

  function playerRow(p, i, isMe) {
    var ranks = p.ranks || {};
    return '<div class="lb-row' + (isMe ? ' me' : '') + '">' +
      '<span class="lb-pos">' + medal(i) + '</span>' +
      '<span class="lb-av">' + (p.avatar || '🙂') + '</span>' +
      '<div class="lb-name"><div class="n">' + esc(p.name || 'Anonymous Trader') +
        (isMe ? ' <span class="chip">you</span>' : '') + '</div>' +
        '<div class="s">' + esc(p.title || ('Level ' + (p.titleLvl || 1))) +
        ' · on day ' + (p.day || 1) +
        (p.snapshot ? ' · snapshot ' + agoText(p.updatedAt) : '') + '</div></div>' +
      '<span class="lb-stat"><b>' + (p.cleared || 0) + '</b><i>levels</i></span>' +
      '<span class="lb-stat"><b>' + (p.avg || 0) + '</b><i>avg</i></span>' +
      '<span class="lb-stat"><b>' + (ranks.S || 0) + '</b><i>S ranks</i></span>' +
      '<span class="lb-stat"><b>' + (p.streak || 0) + '</b><i>streak</i></span>' +
      '<span class="lb-xp">' + (p.xp || 0).toLocaleString() + '<i>XP</i></span>' +
      '</div>';
  }

  function agoText(iso) {
    if (!iso) return 'unknown';
    var mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
    if (!isFinite(mins)) return 'unknown';
    if (mins < 2) return 'just now';
    if (mins < 60) return mins + ' min ago';
    var h = Math.round(mins / 60);
    if (h < 24) return h + 'h ago';
    return Math.round(h / 24) + 'd ago';
  }

  function compareBlock(me, them) {
    var rows = [
      ['XP', me.xp || 0, them.xp || 0],
      ['Levels cleared', me.cleared || 0, them.cleared || 0],
      ['Average score', me.avg || 0, them.avg || 0],
      ['S ranks', (me.ranks || {}).S || 0, (them.ranks || {}).S || 0],
      ['Current streak', me.streak || 0, them.streak || 0],
      ['Badges', me.badges || 0, them.badges || 0]
    ];
    return '<div class="vs">' +
      '<div class="vs-head"><span>' + (me.avatar || '🙂') + ' You</span>' +
      '<span class="muted">vs</span><span>' + esc(them.name || 'Friend') + ' ' + (them.avatar || '🙂') + '</span></div>' +
      rows.map(function (r) {
        var a = r[1], b = r[2], max = Math.max(a, b, 1);
        return '<div class="vs-row">' +
          '<span class="vs-n' + (a >= b ? ' win' : '') + '">' + a.toLocaleString() + '</span>' +
          '<span class="vs-bars">' +
            '<span class="half l"><i class="' + (a >= b ? 'win' : '') + '" style="width:' + Math.round(a / max * 100) + '%"></i></span>' +
            '<em>' + r[0] + '</em>' +
            '<span class="half r"><i class="' + (b >= a ? 'win' : '') + '" style="width:' + Math.round(b / max * 100) + '%"></i></span>' +
          '</span>' +
          '<span class="vs-n' + (b >= a ? ' win' : '') + '">' + b.toLocaleString() + '</span>' +
          '</div>';
      }).join('') + '</div>';
  }

  function viewFriends() {
    var me = Social.profile();
    var live = Social.backend === 'live';
    var fr = Social.friends();
    var league = Social.league || [];

    main.innerHTML =
      '<div class="page-head"><div class="eyebrow">Trading floor</div>' +
      '<h1>Friends &amp; league</h1>' +
      '<p class="muted">Share your link, add each other, and see who is actually putting the reps in.</p></div>' +

      '<div class="card" style="margin-bottom:18px">' +
        '<div class="me-card">' +
          '<button class="me-avatar" id="avBtn" title="Change avatar">' + me.avatar + '</button>' +
          '<div style="flex:1;min-width:200px">' +
            '<label class="muted" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;font-weight:650">Display name</label>' +
            '<input id="nameInput" class="name-input" maxlength="24" placeholder="Anonymous Trader" value="' +
              esc(Social.me.name || '') + '">' +
            '<div class="muted" style="font-size:.78rem;margin-top:6px">' +
              me.title + ' · ' + me.xp.toLocaleString() + ' XP · ' + me.cleared + ' levels · ' +
              'friend code <code class="mono" id="myCode">' + esc(Social.me.id) + '</code></div>' +
          '</div>' +
        '</div>' +
        '<div class="avatar-picker" id="avPicker" hidden>' +
          Social.AVATARS.map(function (a) {
            return '<button class="av-opt' + (a === me.avatar ? ' on' : '') + '" data-av="' + a + '">' + a + '</button>';
          }).join('') +
        '</div>' +
        '<div class="wrap-row mt16">' +
          '<button class="btn" id="copyInvite">🔗 Copy invite link</button>' +
          '<button class="btn btn-ghost" id="copyCard">📇 Copy my progress card</button>' +
          (live ? '<button class="btn btn-ghost" id="refreshBtn">↻ Refresh</button>' : '') +
        '</div>' +
        '<div class="mode-note ' + (live ? 'live' : '') + '">' +
          (live
            ? '<b>● Live league.</b> Everyone who opens this link shares one scoreboard that updates by itself. ' +
              'Send the invite link to a friend and they appear below once they clear a level.'
            : '<b>○ Offline mode.</b> This copy has no shared server, so progress travels as a code. ' +
              'Send a friend your <em>progress card</em> link and paste theirs below — each card is a snapshot ' +
              'from the moment it was made, and re-sending updates it.') +
        '</div>' +
      '</div>' +

      (live && league.length
        ? '<h2>League <span class="chip">' + league.length + ' player' + (league.length === 1 ? '' : 's') + '</span></h2>' +
          '<div class="leaderboard">' + league.map(function (p, i) {
            return playerRow(p, i, p.id === Social.me.id);
          }).join('') + '</div>'
        : '') +

      '<h2 class="mt24">Your friends</h2>' +
      (fr.length
        ? '<div class="leaderboard" id="friendList">' +
            [me].concat(fr).sort(function (a, b) { return (b.xp || 0) - (a.xp || 0); })
              .map(function (p, i) {
                return '<div class="friend-wrap" data-fid="' + esc(p.id) + '">' +
                  playerRow(p, i, p.id === Social.me.id) +
                  (p.id === Social.me.id ? '' :
                    '<div class="friend-actions">' +
                      '<button class="btn btn-ghost btn-sm cmp">⚔ Compare</button>' +
                      '<button class="btn btn-ghost btn-sm rm">Remove</button></div>' +
                    '<div class="cmp-slot"></div>') +
                  '</div>';
              }).join('') +
          '</div>'
        : '<div class="locked-note"><span class="big">👥</span>No friends added yet. ' +
          'Send someone your invite link, then paste the code they send back.</div>') +

      '<div class="card mt24">' +
        '<h3 style="font-size:.95rem">Add a friend</h3>' +
        '<p class="muted" style="font-size:.85rem">' +
          (live
            ? 'Paste their friend code (the short word-like id) or the whole progress-card link they sent you.'
            : 'Paste the progress-card link or code they sent you.') + '</p>' +
        '<div class="wrap-row">' +
          '<input id="addInput" class="name-input" style="flex:1;min-width:220px" placeholder="friend code or pasted link">' +
          '<button class="btn" id="addBtn">Add</button>' +
        '</div>' +
        '<div id="addMsg" class="muted" style="font-size:.82rem;margin-top:8px"></div>' +
      '</div>';

    /* --- wiring --- */
    $('#nameInput').addEventListener('change', function (e) {
      Social.setName(e.target.value);
      toast('Name saved.', 'good');
    });
    $('#avBtn').addEventListener('click', function () {
      var p = $('#avPicker'); p.hidden = !p.hidden;
    });
    $('#avPicker').addEventListener('click', function (e) {
      var b = e.target.closest('.av-opt'); if (!b) return;
      Social.setAvatar(b.dataset.av);
      viewFriends();
    });
    $('#copyInvite').addEventListener('click', function () {
      copyText(Social.inviteUrl(), 'Invite link copied — send it to a friend.');
    });
    $('#copyCard').addEventListener('click', function () {
      copyText(Social.cardUrl(), 'Progress card copied. Anyone who opens it can add you.');
    });
    var rb = $('#refreshBtn');
    if (rb) rb.addEventListener('click', async function () {
      rb.disabled = true; rb.textContent = '↻ Refreshing…';
      await Social.publish();
      await Social.refreshLeague();
      await Social.refreshFriends();
      viewFriends();
      toast('Scores refreshed.', '');
    });

    var fl = $('#friendList');
    if (fl) fl.addEventListener('click', function (e) {
      var wrap = e.target.closest('.friend-wrap'); if (!wrap) return;
      var id = wrap.dataset.fid;
      if (e.target.closest('.rm')) {
        if (confirm('Remove this friend from your list?')) { Social.removeFriend(id); viewFriends(); }
        return;
      }
      if (e.target.closest('.cmp')) {
        var slot = $('.cmp-slot', wrap);
        if (slot.innerHTML) { slot.innerHTML = ''; return; }
        var them = Social.friends().filter(function (f) { return f.id === id; })[0];
        if (them) slot.innerHTML = compareBlock(Social.profile(), them);
      }
    });

    $('#addBtn').addEventListener('click', addFriendFromInput);
    $('#addInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addFriendFromInput();
    });
  }

  async function addFriendFromInput() {
    var raw = ($('#addInput').value || '').trim();
    var msg = $('#addMsg');
    if (!raw) { msg.textContent = 'Paste a code or link first.'; return; }
    var code = raw;
    var m = raw.match(/#\/add\/([A-Za-z0-9_-]+)/);
    if (m) code = m[1];

    try {
      var p;
      if (code.length > 24) p = Social.addFriendCard(code);
      else p = await Social.addFriendById(code);
      msg.innerHTML = '<span style="color:var(--long)">Added ' + esc(p.name || 'friend') + '.</span>';
      toast('👥 ' + esc(p.name || 'Friend') + ' added.', 'good');
      setTimeout(viewFriends, 400);
    } catch (err) {
      msg.innerHTML = '<span style="color:var(--short)">' + esc(err.message) + '</span>';
    }
  }

  function copyText(text, okMsg) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(okMsg, 'good'); }
      catch (e) { window.prompt('Copy this link:', text); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast(okMsg, 'good'); }, fallback);
    } else fallback();
  }

  /** Someone opened a shared progress-card link. */
  function viewAddCard(code) {
    var p;
    try { p = Social.decodeCard(code); }
    catch (e) {
      main.innerHTML = '<div class="locked-note"><span class="big">🔗</span>' +
        'That share link is not readable. Ask your friend to copy it again.' +
        '<div class="mt16"><a class="btn btn-ghost" href="#/friends" data-link>Friends</a></div></div>';
      return;
    }
    var mine = p.id === Social.me.id;
    main.innerHTML = '<div class="page-head"><div class="eyebrow">Invitation</div>' +
      '<h1>' + (p.avatar || '🙂') + ' ' + esc(p.name || 'A trader') + '</h1>' +
      '<p class="muted">Shared their Quant Academy progress with you' +
      (p.snapshot ? ' — snapshot from ' + agoText(p.updatedAt) : '') + '.</p></div>' +
      '<div class="leaderboard">' + playerRow(p, 0, mine) + '</div>' +
      (mine
        ? '<div class="mode-note mt16">That is your own card.</div>'
        : '<div class="mt24">' + compareBlock(Social.profile(), p) + '</div>' +
          '<div class="wrap-row mt24"><button class="btn" id="acceptBtn">👥 Add as friend</button>' +
          '<a class="btn btn-ghost" href="#/friends" data-link>Friends page</a>' +
          '<a class="btn btn-ghost" href="#/" data-link>Dashboard</a></div>');

    var ab = $('#acceptBtn');
    if (ab) ab.addEventListener('click', function () {
      try {
        Social.addFriendCard(code);
        toast('👥 ' + esc(p.name || 'Friend') + ' added.', 'good');
        location.hash = '#/friends';
      } catch (e) { toast(esc(e.message), 'bad'); }
    });
  }

  /* ============================================================
     ROUTER
     ============================================================ */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    var head = parts[0] || '';
    active = null;

    $$('.top-nav a').forEach(function (a) {
      a.classList.toggle('active',
        (head === '' && a.dataset.route === 'home') ||
        (head === 'map' && a.dataset.route === 'curriculum') ||
        (head === 'level' && a.dataset.route === 'curriculum') ||
        (head === 'add' && a.dataset.route === 'friends') ||
        (head === a.dataset.route));
    });

    if (head === 'level') viewLevel(parts[1]);
    else if (head === 'friends') viewFriends();
    else if (head === 'add') viewAddCard(parts.slice(1).join('/'));
    else if (head === 'map') viewMap();
    else if (head === 'archive') parts[1] ? viewArchiveLevel(parts[1]) : viewArchive();
    else if (head === 'review') viewReview();
    else if (head === 'playground') viewPlayground();
    else if (head === 'reference') viewReference();
    else if (head === 'achievements') viewAchievements();
    else if (head === '' || head === 'home') viewHome();
    else notFound();

    renderSidebar(head === 'level' ? +parts[1] : null);
    if (window.innerWidth <= 1000) $('#sidebar').classList.remove('open');
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    if (!CUR.length) {
      main.innerHTML = '<div class="locked-note"><span class="big">⚠️</span>' +
        'No curriculum loaded. Check that the <code>assets/js/curriculum/*.js</code> files are present.</div>';
      return;
    }
    Game.checkAchievements();
    wireModal();
    Social.onChange(function () {
      if (location.hash.indexOf('#/friends') === 0) viewFriends();
    });
    Social.init();

    $('#navToggle').addEventListener('click', function () {
      $('#sidebar').classList.toggle('open');
    });
    $('#lessonSearch').addEventListener('input', function () {
      renderSidebar(active && active.level.day);
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-link]');
      if (a && a.getAttribute('href').charAt(0) === '#') {
        // let the hash change drive the router
        if (location.hash === a.getAttribute('href')) { e.preventDefault(); route(); }
      }
    });
    window.addEventListener('hashchange', route);

    if (!location.hash) location.hash = '#/';
    route();

    // keyboard: n/p to move between levels
    document.addEventListener('keydown', function (e) {
      if (e.target.matches('input, textarea')) return;
      if (!active) return;
      if (e.key === 'n' && levelByDay(active.level.day + 1)) location.hash = '#/level/' + (active.level.day + 1);
      if (e.key === 'p' && active.level.day > 1) location.hash = '#/level/' + (active.level.day - 1);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
