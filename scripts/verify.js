#!/usr/bin/env node
/* ============================================================
   verify.js — curriculum QA
   Loads the site's own runner and every curriculum file, then:
     1. validates each level's shape,
     2. runs each exercise's MODEL SOLUTION against its own tests,
     3. runs each STARTER to confirm it does not already pass,
     4. sanity-checks quizzes, Parsons blocks and day numbering.
   Run: node scripts/verify.js
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const files = [
  'assets/js/market.js',
  'assets/js/runner.js',
  'assets/js/curriculum/_helpers.js',
  ...['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7']
    .map(m => `assets/js/curriculum/${m}.js`)
    .filter(f => fs.existsSync(path.join(ROOT, f)))
];

const sandbox = {
  console, performance, setTimeout, clearTimeout, Promise, Math, JSON, Date,
  Number, String, Array, Object, Map, Set, Error, RegExp, Boolean, Symbol,
  parseInt, parseFloat, isNaN, isFinite, TextEncoder, TextDecoder, structuredClone
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

for (const f of files) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  try { vm.runInContext(src, sandbox, { filename: f }); }
  catch (e) { console.error(`\n✕ ${f} failed to load:\n  ${e.message}\n`); process.exit(1); }
}

const CUR = sandbox.CURRICULUM || [];
const Runner = sandbox.Runner;

let errors = [];
let warnings = [];
let checked = 0;

function err(where, msg) { errors.push(`${where}: ${msg}`); }
function warn(where, msg) { warnings.push(`${where}: ${msg}`); }

/* ---------- 1. structural validation ---------- */
const seenDays = new Set();
const seenIds = new Set();

for (const l of CUR) {
  const where = `day ${l.day} (${l.id})`;
  if (!l.id) err(where, 'missing id');
  if (seenIds.has(l.id)) err(where, `duplicate id ${l.id}`);
  seenIds.add(l.id);
  if (typeof l.day !== 'number') err(where, 'missing numeric day');
  if (seenDays.has(l.day)) err(where, `duplicate day number ${l.day}`);
  seenDays.add(l.day);
  if (!l.module) err(where, 'missing module');
  if (!l.title) err(where, 'missing title');
  if (!l.goal) err(where, 'missing goal');
  if (!l.minutes || l.minutes < 15 || l.minutes > 45) warn(where, `minutes = ${l.minutes}`);
  if (!Array.isArray(l.sections) || l.sections.length < 2) err(where, 'needs at least 2 sections');
  (l.sections || []).forEach((s, i) => {
    if (!s.h) err(where, `section ${i} missing heading`);
    if (!s.body) err(where, `section ${i} missing body`);
  });
  if (!Array.isArray(l.exercises) || !l.exercises.length) err(where, 'needs at least 1 exercise');
  (l.exercises || []).forEach(ex => {
    if (!ex.id) err(where, 'exercise missing id');
    if (!ex.title) err(where, `exercise ${ex.id} missing title`);
    if (!ex.prompt) err(where, `exercise ${ex.id} missing prompt`);
    if (ex.starter === undefined) err(where, `exercise ${ex.id} missing starter`);
    if (!ex.solution) err(where, `exercise ${ex.id} missing solution`);
    if (!ex.tests) err(where, `exercise ${ex.id} missing tests`);
    if (!ex.hints || !ex.hints.length) warn(where, `exercise ${ex.id} has no hints`);
  });
  if (!Array.isArray(l.quiz) || l.quiz.length < 2) err(where, 'needs at least 2 quiz questions');
  (l.quiz || []).forEach((q, i) => {
    if (!q.q) err(where, `quiz ${i} missing question`);
    if (!Array.isArray(q.options) || q.options.length < 2) err(where, `quiz ${i} needs options`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= (q.options || []).length) {
      err(where, `quiz ${i} answer index ${q.answer} out of range`);
    }
    if (!q.explain) err(where, `quiz ${i} missing explanation`);
    const uniq = new Set(q.options || []);
    if (uniq.size !== (q.options || []).length) err(where, `quiz ${i} has duplicate options`);
  });
  if (l.parsons) {
    if (!Array.isArray(l.parsons.lines) || l.parsons.lines.length < 3) {
      err(where, 'parsons needs at least 3 lines');
    }
  }
}

/* ---------- 2 & 3. behavioural validation ---------- */
(async function run() {
  for (const l of CUR) {
    for (const ex of l.exercises || []) {
      checked++;
      const where = `day ${l.day} · ${ex.id} (${ex.title})`;

      // model solution must pass every test
      let res;
      try { res = await Runner.runTests(ex.solution, ex); }
      catch (e) { err(where, `harness threw: ${e.message}`); continue; }

      if (!res.ran) {
        err(where, `SOLUTION ERRORED → ${res.error}`);
      } else if (res.passed !== res.total) {
        const failing = res.results.filter(r => !r.pass)
          .map(r => `      ✕ ${r.name}${r.why ? ' — ' + r.why : ''}`).join('\n');
        err(where, `SOLUTION FAILS ${res.total - res.passed}/${res.total} of its own tests:\n${failing}`);
      }

      // starter must NOT already pass (otherwise the exercise is free)
      try {
        const s = await Runner.runTests(ex.starter, ex);
        if (s.ran && s.total > 0 && s.passed === s.total) {
          err(where, 'STARTER ALREADY PASSES every test — the exercise is a no-op');
        }
      } catch (e) { /* a starter that throws is fine */ }

      // par length sanity
      const par = ex.solution.replace(/\s+/g, '').length;
      if (par > 900) warn(where, `model solution is very long (${par} significant chars)`);
    }
  }

  /* ---------- report ---------- */
  const days = [...seenDays].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i <= (days[days.length - 1] || 0); i++) if (!seenDays.has(i)) gaps.push(i);

  console.log('\n─────────────────────────────────────────────');
  console.log(`Levels loaded      : ${CUR.length}`);
  console.log(`Exercises verified : ${checked}`);
  console.log(`Quiz questions     : ${CUR.reduce((a, l) => a + (l.quiz || []).length, 0)}`);
  console.log(`Parsons problems   : ${CUR.filter(l => l.parsons).length}`);
  console.log(`Boss levels        : ${CUR.filter(l => l.boss).length}`);
  if (gaps.length) console.log(`Missing day numbers: ${gaps.join(', ')}`);
  console.log('─────────────────────────────────────────────');

  if (warnings.length) {
    console.log(`\n⚠ ${warnings.length} warning(s):`);
    warnings.slice(0, 40).forEach(w => console.log('  ' + w));
    if (warnings.length > 40) console.log(`  … and ${warnings.length - 40} more`);
  }
  if (errors.length) {
    console.log(`\n✕ ${errors.length} error(s):\n`);
    errors.forEach(e => console.log('  ' + e));
    console.log('');
    process.exit(1);
  }
  console.log('\n✓ All model solutions pass their own tests.\n');
})();
