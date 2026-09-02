/* ============================================================
   editor.js — lightweight JS code editor + syntax highlighter
   A transparent <textarea> layered over a highlighted <pre>,
   with a line-number gutter, tab handling and auto-indent.
   ============================================================ */
(function (global) {
  'use strict';

  var KEYWORDS = ('await break case catch class const continue debugger default delete do else ' +
    'export extends finally for from function get if implements import in instanceof interface ' +
    'let new of return set static super switch this throw try typeof var void while with yield async')
    .split(' ');
  var LITERALS = ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'];

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Tokenise JavaScript well enough to colour it. Not a parser — a scanner. */
  function highlight(src) {
    var out = '';
    var i = 0, n = src.length;
    var prev = '';           // last significant char, to tell division from regex

    function emit(cls, text) { out += '<span class="' + cls + '">' + esc(text) + '</span>'; }

    while (i < n) {
      var c = src[i], two = src.substr(i, 2);

      if (two === '//') {
        var e = src.indexOf('\n', i); if (e < 0) e = n;
        emit('tok-com', src.slice(i, e)); i = e; continue;
      }
      if (two === '/*') {
        var e2 = src.indexOf('*/', i + 2); e2 = e2 < 0 ? n : e2 + 2;
        emit('tok-com', src.slice(i, e2)); i = e2; continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        var q = c, j = i + 1;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === q) { j++; break; }
          j++;
        }
        emit('tok-str', src.slice(i, j)); i = j; prev = '"'; continue;
      }
      if (/[0-9]/.test(c) && !/[A-Za-z0-9_$.]/.test(prev)) {
        var k = i;
        while (k < n && /[0-9a-fA-FxXoObBeE._+-]/.test(src[k])) {
          if (/[+-]/.test(src[k]) && !/[eE]/.test(src[k - 1])) break;
          k++;
        }
        emit('tok-num', src.slice(i, k)); i = k; prev = '0'; continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        var m = i;
        while (m < n && /[A-Za-z0-9_$]/.test(src[m])) m++;
        var word = src.slice(i, m);
        var after = src.slice(m).match(/^\s*\(/);
        if (KEYWORDS.indexOf(word) >= 0) emit('tok-key', word);
        else if (LITERALS.indexOf(word) >= 0) emit('tok-bool', word);
        else if (after) emit('tok-fn', word);
        else out += esc(word);
        i = m; prev = word.slice(-1); continue;
      }
      if (/[+\-*/%=<>!&|?:^~]/.test(c)) { emit('tok-op', c); i++; prev = c; continue; }
      out += esc(c);
      if (!/\s/.test(c)) prev = c;
      i++;
    }
    return out;
  }

  /* ---------- editor instance ---------- */
  function create(opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'editor-wrap';

    var bar = document.createElement('div');
    bar.className = 'editor-bar';
    bar.innerHTML = '<span class="fname">' + esc(opts.filename || 'strategy.js') + '</span>';
    if (opts.toolbar) bar.appendChild(opts.toolbar);
    wrap.appendChild(bar);

    var scroll = document.createElement('div');
    scroll.className = 'editor-scroll';
    var inner = document.createElement('div');
    inner.className = 'editor-inner';
    var gutter = document.createElement('div');
    gutter.className = 'editor-gutter';
    var pre = document.createElement('pre');
    var ta = document.createElement('textarea');
    ta.spellcheck = false;
    ta.autocapitalize = 'off';
    ta.autocomplete = 'off';
    ta.setAttribute('aria-label', opts.label || 'Code editor');

    inner.appendChild(gutter);
    inner.appendChild(pre);
    inner.appendChild(ta);
    scroll.appendChild(inner);
    wrap.appendChild(scroll);

    var onChange = opts.onChange || function () {};
    var onRun = opts.onRun || null;

    function render() {
      var v = ta.value;
      pre.innerHTML = highlight(v) + '\n';
      var lines = v.split('\n').length;
      var g = '';
      for (var i = 1; i <= lines; i++) g += '<span>' + i + '</span>';
      gutter.innerHTML = g;
      // grow the textarea to fit so the outer scroller handles overflow
      var h = Math.max(110, pre.scrollHeight);
      inner.style.height = h + 'px';
    }

    ta.addEventListener('input', function () { render(); onChange(ta.value); });
    ta.addEventListener('focus', function () { wrap.classList.add('focused'); });
    ta.addEventListener('blur', function () { wrap.classList.remove('focused'); });

    ta.addEventListener('keydown', function (e) {
      // Ctrl/Cmd+Enter runs
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault(); if (onRun) onRun(); return;
      }
      var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (s !== en) {
          // indent / outdent the selected lines
          var ls = v.lastIndexOf('\n', s - 1) + 1;
          var block = v.slice(ls, en);
          var replaced = e.shiftKey
            ? block.replace(/^ {1,2}/gm, '')
            : block.replace(/^/gm, '  ');
          ta.value = v.slice(0, ls) + replaced + v.slice(en);
          ta.selectionStart = ls; ta.selectionEnd = ls + replaced.length;
        } else {
          ta.value = v.slice(0, s) + '  ' + v.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 2;
        }
        render(); onChange(ta.value); return;
      }

      if (e.key === 'Enter') {
        var lineStart = v.lastIndexOf('\n', s - 1) + 1;
        var line = v.slice(lineStart, s);
        var indent = (line.match(/^[ \t]*/) || [''])[0];
        var opensBlock = /[{([]\s*$/.test(line);
        var closesNext = /^\s*[}\])]/.test(v.slice(s));
        e.preventDefault();
        var add = indent + (opensBlock ? '  ' : '');
        var insert = '\n' + add;
        var caret = s + insert.length;
        if (opensBlock && closesNext) insert += '\n' + indent;
        ta.value = v.slice(0, s) + insert + v.slice(en);
        ta.selectionStart = ta.selectionEnd = caret;
        render(); onChange(ta.value); return;
      }

      // auto-close brackets and quotes
      var pairs = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`' };
      if (pairs[e.key] && s === en) {
        var nextCh = v[s] || '';
        if (/[)\]},;\s]/.test(nextCh) || nextCh === '') {
          e.preventDefault();
          ta.value = v.slice(0, s) + e.key + pairs[e.key] + v.slice(en);
          ta.selectionStart = ta.selectionEnd = s + 1;
          render(); onChange(ta.value); return;
        }
      }
      // typing over an auto-inserted closer
      if ([')', ']', '}', '"', "'", '`'].indexOf(e.key) >= 0 && s === en && v[s] === e.key) {
        e.preventDefault();
        ta.selectionStart = ta.selectionEnd = s + 1;
        return;
      }
    });

    var api = {
      el: wrap,
      textarea: ta,
      get value() { return ta.value; },
      set value(v) { ta.value = v; render(); },
      focus: function () { ta.focus(); },
      refresh: render
    };

    ta.value = opts.value || '';
    // Render once attached so scrollHeight is measurable.
    requestAnimationFrame(render);
    render();
    return api;
  }

  /* ---------- read-only highlighted block ---------- */
  function block(code, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'codeblock';
    var head = '';
    if (opts.filename || opts.runnable) {
      head = '<div class="codeblock-head"><span class="fname">' +
        esc(opts.filename || 'example.js') + '</span></div>';
    }
    el.innerHTML = head + '<pre>' + highlight(code) + '</pre><div class="out"></div>';
    if (opts.runnable) {
      var btn = document.createElement('button');
      btn.className = 'btn btn-ghost btn-sm';
      btn.textContent = '▶ Run';
      el.querySelector('.codeblock-head').appendChild(btn);
      var out = el.querySelector('.out');
      btn.addEventListener('click', async function () {
        btn.disabled = true; btn.textContent = '…';
        var r = await global.Runner.execute(code, []);
        var html = r.logs.map(function (l) {
          var cls = l.kind === 'err' ? 'log-err' : l.kind === 'warn' ? 'log-warn' : '';
          return '<span class="' + cls + '">' + esc(l.text) + '</span>';
        }).join('\n');
        if (r.error) html += (html ? '\n' : '') + '<span class="log-err">' + esc(r.error) + '</span>';
        out.innerHTML = html || '<span class="lbl">(no output)</span>';
        btn.disabled = false; btn.textContent = '▶ Run';
      });
    }
    return el;
  }

  /* ---------- Parsons problem (drag the lines into order) ----------
     Research-backed scaffold: rearranging correct lines teaches
     structure without the syntax load of writing from scratch. */
  function parsons(spec, onSolved) {
    var el = document.createElement('div');
    el.className = 'parsons';
    var lines = spec.lines.slice();
    var order = lines.map(function (_, i) { return i; });

    // deterministic-ish shuffle that never starts already-solved
    var shuffled = order.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t;
    }
    if (shuffled.every(function (v, k) { return v === k; })) shuffled.reverse();

    el.innerHTML =
      '<div class="parsons-head">' +
        '<span class="pz-title">🧩 Warm-up · put the lines in order</span>' +
        '<span class="pz-state"></span>' +
      '</div>' +
      '<p class="pz-prompt">' + (spec.prompt || '') + '</p>' +
      '<ul class="pz-list"></ul>' +
      '<div class="pz-actions">' +
        '<button class="btn btn-ghost btn-sm pz-check">Check order</button>' +
        '<button class="btn btn-ghost btn-sm pz-shuffle">Shuffle</button>' +
      '</div>';

    var list = el.querySelector('.pz-list');
    var stateEl = el.querySelector('.pz-state');

    function paint(seq) {
      list.innerHTML = '';
      seq.forEach(function (idx) {
        var li = document.createElement('li');
        li.className = 'pz-item';
        li.draggable = true;
        li.dataset.idx = idx;
        li.innerHTML = '<span class="pz-grip">⠿</span><code>' + highlight(lines[idx]) + '</code>' +
          '<span class="pz-move"><button aria-label="Move up">▲</button>' +
          '<button aria-label="Move down">▼</button></span>';
        list.appendChild(li);
      });
    }
    paint(shuffled);

    function current() {
      return [].slice.call(list.children).map(function (li) { return +li.dataset.idx; });
    }

    var dragEl = null;
    list.addEventListener('dragstart', function (e) {
      var li = e.target.closest('.pz-item'); if (!li) return;
      dragEl = li; li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', li.dataset.idx); } catch (err) {}
    });
    list.addEventListener('dragend', function () {
      if (dragEl) dragEl.classList.remove('dragging');
      dragEl = null;
    });
    list.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (!dragEl) return;
      var over = e.target.closest('.pz-item');
      if (!over || over === dragEl) return;
      var r = over.getBoundingClientRect();
      var after = (e.clientY - r.top) / r.height > 0.5;
      list.insertBefore(dragEl, after ? over.nextSibling : over);
    });
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.pz-move button'); if (!btn) return;
      var li = btn.closest('.pz-item');
      var up = btn.textContent === '▲';
      if (up && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
      if (!up && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
    });

    el.querySelector('.pz-shuffle').addEventListener('click', function () {
      var s = current();
      for (var i = s.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = s[i]; s[i] = s[j]; s[j] = t;
      }
      paint(s); stateEl.textContent = ''; stateEl.className = 'pz-state';
    });

    el.querySelector('.pz-check').addEventListener('click', function () {
      var seq = current();
      var ok = seq.every(function (v, i) { return v === i; });
      [].slice.call(list.children).forEach(function (li, i) {
        li.classList.toggle('pz-ok', +li.dataset.idx === i);
        li.classList.toggle('pz-bad', +li.dataset.idx !== i);
      });
      if (ok) {
        stateEl.textContent = '✓ Correct order';
        stateEl.className = 'pz-state ok';
        el.classList.add('pz-solved');
        if (onSolved) onSolved();
      } else {
        var right = seq.filter(function (v, i) { return v === i; }).length;
        stateEl.textContent = right + ' of ' + seq.length + ' in place';
        stateEl.className = 'pz-state bad';
      }
    });

    return el;
  }

  global.Editor = { create: create, block: block, highlight: highlight, parsons: parsons, esc: esc };
})(typeof window !== 'undefined' ? window : this);
