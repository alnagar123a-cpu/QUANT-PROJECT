#!/usr/bin/env node
/* ============================================================
   build.js — inline the whole site into one standalone HTML file
   No bundler, no dependencies: read index.html, replace every
   local <link rel="stylesheet"> and <script src> with the file's
   contents, and write dist/quant-academy.html.
   ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, 'quant-academy.html');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// Inline local stylesheets (leave remote ones, e.g. the font CDN, alone).
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, (whole, href) => {
  if (/^https?:\/\//.test(href)) return whole;
  return '<style>\n' + read(href) + '\n</style>';
});

// Inline local scripts, in document order.
html = html.replace(/<script src="([^"]+)"><\/script>/g, (whole, src) => {
  if (/^https?:\/\//.test(src)) return whole;
  // </script> inside a string literal would end the tag early.
  const code = read(src).replace(/<\/script>/gi, '<\\/script>');
  return '<script>\n' + code + '\n</script>';
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html);

// A second variant for hosts that supply their own document skeleton
// (the Artifact runtime wraps the file in <!doctype html><head></head><body>).
// Strip the outer document tags and keep <title>, <link>, <style> and the body.
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
if (headMatch && bodyMatch) {
  const head = headMatch[1]
    .replace(/<meta[^>]*charset[^>]*>/gi, '')
    .replace(/<meta[^>]*viewport[^>]*>/gi, '')
    .trim();
  const fragment = head + '\n' + bodyMatch[1].trim() + '\n';
  fs.writeFileSync(path.join(OUT_DIR, 'artifact.html'), fragment);
}

function report(file) {
  const full = path.join(OUT_DIR, file);
  if (!fs.existsSync(full)) return;
  const kb = (fs.statSync(full).size / 1024).toFixed(0);
  console.log(`Wrote dist/${file} (${kb} KB)`);
}
report('quant-academy.html');
report('artifact.html');

const remaining = (html.match(/(?:src|href)="(?!https?:|data:|#)[^"]+"/g) || [])
  .filter(m => !m.includes('data:image'));
if (remaining.length) {
  console.log('⚠ still referencing local files:', remaining.join(', '));
} else {
  console.log('No local file references remain — both files are standalone.');
}
