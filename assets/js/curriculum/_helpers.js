/* ============================================================
   _helpers.js — small builders shared by every curriculum file.
   Keeps lesson data declarative instead of repetitive.
   ============================================================ */
(function (g) {
  'use strict';
  g.CURRICULUM = g.CURRICULUM || [];

  function show(v) {
    try { return g.Runner ? g.Runner.format(v, 1) : JSON.stringify(v); }
    catch (e) { return String(v); }
  }

  var CX = {
    /** Assert a top-level variable holds an exact value. */
    val: function (name, expect, tol) {
      return {
        name: name + ' is ' + show(expect),
        expose: [name],
        run: function (scope, h) {
          var got = scope[name];
          if (got === undefined) return 'no variable called `' + name + '` was found';
          return h.eq(got, expect, tol) ? true : 'expected ' + show(expect) + ' but got ' + show(got);
        }
      };
    },
    /** Assert a variable is close to a number (floating point friendly). */
    near: function (name, expect, tol) {
      return {
        name: name + ' ≈ ' + expect,
        expose: [name],
        run: function (scope) {
          var got = scope[name];
          if (typeof got !== 'number') return '`' + name + '` should be a number, got ' + show(got);
          return Math.abs(got - expect) <= (tol || 0.005)
            ? true
            : 'expected about ' + expect + ' but got ' + got;
        }
      };
    },
    /** Assert a variable has a given typeof. */
    type: function (name, t) {
      return {
        name: name + ' is a ' + t,
        expose: [name],
        run: function (scope) {
          var got = scope[name];
          if (got === undefined) return 'no variable called `' + name + '` was found';
          return typeof got === t ? true : 'expected a ' + t + ', got a ' + typeof got;
        }
      };
    },
    /** Custom assertion over one or more exposed variables. */
    check: function (name, names, fn) {
      return { name: name, expose: names, run: fn };
    },
    show: show
  };

  g.CX = CX;
})(typeof window !== 'undefined' ? window : this);
