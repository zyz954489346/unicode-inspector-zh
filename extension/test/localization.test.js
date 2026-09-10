'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const placeholders = text => [...text.matchAll(/\{\d+\}/g)].map(m => m[0]).sort();

test('all manifest translations exist in English and Chinese', () => {
  const manifest = read('package.json');
  const en = read('package.nls.json');
  const zh = read('package.nls.zh-cn.json');
  const keys = [...JSON.stringify(manifest).matchAll(/%([^%]+)%/g)].map(m => m[1]);
  assert.equal(keys.length, Object.keys(en).length);
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
  for (const key of keys) {
    assert.ok(en[key], key);
    assert.ok(zh[key], key);
  }
});

test('runtime translation bundles match source messages and preserve placeholders', () => {
  const en = read('l10n/bundle.l10n.json');
  const zh = read('l10n/bundle.l10n.zh-cn.json');
  const messages = new Set();
  for (const name of ['src/core.js', 'src/extension.js']) {
    const source = fs.readFileSync(path.join(root, name), 'utf8');
    // Runtime messages intentionally use plain single/double-quoted literals.
    for (const match of source.matchAll(/\bt\((['"])(.*?)\1/g)) messages.add(match[2]);
    assert.doesNotMatch(source, /\p{Script=Han}/u, name);
  }
  assert.deepEqual([...messages].sort(), Object.keys(en).sort());
  assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
  for (const key of messages) {
    assert.equal(en[key], key);
    assert.ok(zh[key]);
    assert.deepEqual(placeholders(zh[key]), placeholders(key), key);
  }
});
