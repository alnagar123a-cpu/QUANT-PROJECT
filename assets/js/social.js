/* ============================================================
   social.js — profiles, friends and progress comparison
   ------------------------------------------------------------
   Two interchangeable backends, chosen at runtime:

   "live"  When the page is served as a claude.ai Artifact that
           declares the `db` capability, every viewer of the same
           link shares one realtime document store. Each player
           writes their own profile document; the league table is
           a query over all of them. Send the link, play together.

   "link"  Everywhere else (GitHub Pages, a local file, offline).
           Your profile is packed into a short share code that
           lives in a URL. Friends paste each other's codes and
           the app stores the snapshot. No server, no account —
           but each friend's numbers are frozen at the moment they
           generated their code, and the UI says so plainly.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY = 'quantacademy.social.v1';
  var PLAYERS = 'players';

  /* ---------- local identity ---------- */
  function newId() {
    var s = 'abcdefghjkmnpqrstuvwxyz23456789';
    var out = '';
    for (var i = 0; i < 10; i++) out += s[Math.floor(Math.random() * s.length)];
    return out;
  }

  var AVATARS = ['🐂', '🐻', '🦅', '🦈', '🐺', '🦊', '🦁', '🐙', '🦉', '🐍', '🦌', '🐲'];

  function blank() {
    return {
      me: { id: newId(), name: '', avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] },
      friends: {},          // id -> last known profile snapshot
      lastPublish: null
    };
  }

  var store = read();
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var s = JSON.parse(raw);
      if (!s.me || !s.me.id) return blank();
      if (!s.friends) s.friends = {};
      return s;
    } catch (e) { return blank(); }
  }
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {}
  }

  /* ---------- the profile we publish ---------- */
  function profile() {
    var s = global.Game.summary();
    var st = global.Game.state;
    var perModule = {};
    (global.CURRICULUM || []).forEach(function (l) {
      var L = st.levels[l.id];
      if (L && L.cleared) perModule[l.module] = (perModule[l.module] || 0) + 1;
    });
    return {
      id: store.me.id,
      name: store.me.name || 'Anonymous Trader',
      avatar: store.me.avatar,
      xp: s.xp,
      cleared: s.cleared,
      total: s.total,
      avg: s.avg,
      streak: s.streak,
      bestStreak: s.bestStreak,
      title: s.title.name,
      titleLvl: s.title.lvl,
      ranks: s.ranks,
      badges: s.achievements,
      day: global.Game.nextLevel() ? global.Game.nextLevel().day : s.total,
      modules: perModule,
      updatedAt: new Date().toISOString()
    };
  }

  /* ---------- share codes (the "link" backend) ---------- */
  function b64urlEncode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    bytes.forEach(function (b) { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /** Compact array form keeps the code short enough to paste in a chat. */
  function encodeCard(p) {
    var arr = [1, p.id, p.name, p.avatar, p.xp, p.cleared, p.avg, p.streak, p.bestStreak,
      p.titleLvl, p.ranks.S || 0, p.ranks.A || 0, p.ranks.B || 0, p.ranks.C || 0, p.ranks.D || 0,
      p.badges, p.day, Math.floor(Date.parse(p.updatedAt) / 60000)];
    return b64urlEncode(JSON.stringify(arr));
  }
  function decodeCard(code) {
    var a = JSON.parse(b64urlDecode(String(code).trim()));
    if (!Array.isArray(a) || a[0] !== 1) throw new Error('Unrecognised share code.');
    return {
      id: a[1], name: a[2], avatar: a[3], xp: a[4], cleared: a[5], avg: a[6],
      streak: a[7], bestStreak: a[8], titleLvl: a[9],
      ranks: { S: a[10], A: a[11], B: a[12], C: a[13], D: a[14], F: 0 },
      badges: a[15], day: a[16],
      updatedAt: new Date(a[17] * 60000).toISOString(),
      total: (global.CURRICULUM || []).length,
      snapshot: true
    };
  }

  function baseUrl() {
    return location.origin + location.pathname;
  }
  function inviteUrl() {
    return baseUrl() + '#/friends';
  }
  function cardUrl() {
    return baseUrl() + '#/add/' + encodeCard(profile());
  }

  /* ---------- backend detection ---------- */
  var backend = 'link';
  var db = null;
  var unsubscribe = null;
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }

  async function init() {
    if (!global.claude || typeof global.claude.use !== 'function') return;
    var got = null;
    try { got = await global.claude.use('db'); } catch (e) { got = null; }
    if (!got) return;
    db = got;
    backend = 'live';
    await publish();
    subscribeLeague();
    emit();
  }

  /** Write our own profile document. Safe to call often; it is one small doc. */
  async function publish() {
    var p = profile();
    store.lastPublish = p.updatedAt;
    write();
    if (backend !== 'live' || !db) return false;
    try {
      await db.doc(PLAYERS + '/' + p.id).set(p);
      return true;
    } catch (e) { return false; }
  }

  var league = [];
  function subscribeLeague() {
    if (backend !== 'live' || !db) return;
    if (unsubscribe) { try { unsubscribe(); } catch (e) {} }
    try {
      unsubscribe = db.collection(PLAYERS).orderBy('xp', 'desc').limit(50)
        .onSnapshot(function (snap) {
          league = snap.docs.map(function (d) {
            var v = d.data ? d.data() : d;
            return v;
          }).filter(Boolean);
          emit();
        }, function () { /* transient: the store retries internally */ });
    } catch (e) { /* query unsupported: fall back to nothing */ }
  }

  async function refreshLeague() {
    if (backend !== 'live' || !db) return league;
    try {
      var snap = await db.collection(PLAYERS).orderBy('xp', 'desc').limit(50).get();
      league = snap.docs.map(function (d) { return d.data ? d.data() : d; }).filter(Boolean);
    } catch (e) {}
    return league;
  }

  /** In live mode a friend id is enough — we can read their live document. */
  async function addFriendById(id) {
    id = String(id || '').trim();
    if (!id) throw new Error('Enter a friend code.');
    if (id === store.me.id) throw new Error('That is your own code.');
    if (backend === 'live' && db) {
      var snap = await db.doc(PLAYERS + '/' + id).get();
      if (!snap || !snap.exists) throw new Error('No player with that code has opened this link yet.');
      store.friends[id] = snap.data ? snap.data() : snap;
    } else {
      throw new Error('Offline mode needs a full share card, not just a code.');
    }
    write(); emit();
    return store.friends[id];
  }

  /** Works in both modes: a pasted card is a complete snapshot. */
  function addFriendCard(code) {
    var p = decodeCard(code);
    if (p.id === store.me.id) throw new Error('That is your own share card.');
    var existing = store.friends[p.id];
    if (existing && !existing.snapshot && backend === 'live') {
      // keep the live document; a stale card should not overwrite it
      return existing;
    }
    store.friends[p.id] = p;
    write(); emit();
    return p;
  }

  function removeFriend(id) { delete store.friends[id]; write(); emit(); }

  /** Refresh every friend we can read live. */
  async function refreshFriends() {
    if (backend !== 'live' || !db) return;
    var ids = Object.keys(store.friends);
    for (var i = 0; i < ids.length; i++) {
      try {
        var snap = await db.doc(PLAYERS + '/' + ids[i]).get();
        if (snap && snap.exists) store.friends[ids[i]] = snap.data ? snap.data() : snap;
      } catch (e) {}
    }
    write(); emit();
  }

  function friends() {
    return Object.keys(store.friends).map(function (k) { return store.friends[k]; })
      .sort(function (a, b) { return (b.xp || 0) - (a.xp || 0); });
  }

  function setName(n) {
    store.me.name = String(n || '').slice(0, 24);
    write(); publish();
  }
  function setAvatar(a) { store.me.avatar = a; write(); publish(); }

  global.Social = {
    AVATARS: AVATARS,
    get backend() { return backend; },
    get me() { return store.me; },
    get league() { return league; },
    profile: profile,
    friends: friends,
    init: init,
    publish: publish,
    onChange: onChange,
    setName: setName,
    setAvatar: setAvatar,
    addFriendById: addFriendById,
    addFriendCard: addFriendCard,
    removeFriend: removeFriend,
    refreshFriends: refreshFriends,
    refreshLeague: refreshLeague,
    encodeCard: encodeCard,
    decodeCard: decodeCard,
    cardUrl: cardUrl,
    inviteUrl: inviteUrl,
    reset: function () { store = blank(); write(); }
  };
})(typeof window !== 'undefined' ? window : this);
