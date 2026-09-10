'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {Inspector, data, metadata, script, previous, display, codeLabel} = require('../src/core');
const {format} = require('../src/i18n');
const zh = require('../l10n/bundle.l10n.zh-cn.json');
const translate = (message, ...args) => format(zh[message] || message, ...args);

test('ASCII, simplified/traditional Chinese, rare Han, Bopomofo, units and punctuation', () => {
  assert.deepEqual(new Inspector().scan('中文正常 MO-2609080008\r\n繁體中文：𠮷，25℃，100㎡；ㄅㄆㄇ\t⿰㇀〆'), []);
});

test('every assigned Han and Bopomofo character in bundled Unicode data is allowed', () => {
  const engine = new Inspector();
  let count = 0;
  for (const [start, end, name] of data.scripts) {
    if (!['Han', 'Bopomofo'].includes(name)) continue;
    for (let cp = start; cp <= end; cp++) {
      assert.equal(engine.classify(String.fromCodePoint(cp), 0), undefined, codeLabel(cp));
      assert.notEqual(metadata(cp)[1], 'Cn', codeLabel(cp));
      count++;
    }
  }
  assert.equal(count, 103428);
  assert.equal(data.version, '17.0.0');
});

test('Unicode range tables are ordered and non-overlapping', () => {
  for (const ranges of [data.scripts, data.name_ranges]) {
    let end = -1;
    for (const range of ranges) {
      assert.ok(range[0] > end);
      assert.ok(range[0] <= range[1]);
      end = range[1];
    }
  }
  assert.equal(Object.keys(data.confusables).length, 6565);
});

test('confusable order IDs and fullwidth letters/digits retain distinct code points', () => {
  const issues = new Inspector().scan('中文正常 МO-2609080008\n中文正常 ＭＯ１２');
  assert.deepEqual(issues.map(i => i.code), [0x41c, 0xff2d, 0xff2f, 0xff11, 0xff12]);
  assert.deepEqual(issues.map(i => i.target), ['M', 'M', 'O', '1', '2']);
  assert.equal(issues[0].kindId, 'confusable');
});

test('UTF-16 offsets preserve supplementary characters and CRLF', () => {
  const text = '𠮷😀\r\nМ';
  assert.deepEqual(new Inspector().scan(text).map(i => [i.offset, i.length]), [[2, 2], [6, 1]]);
  assert.equal(previous(text, 2).char, '𠮷');
  assert.equal(previous(text, 4).start, 2);
});

test('controls, bidi, zero-width and unusual spaces are flagged', () => {
  const issues = new Inspector().scan('\u0000\u007f\u200b\u200d\u202e\u2066\u00a0\u3000');
  assert.deepEqual(issues.map(i => i.kindId), ['control', 'control', 'format', 'format', 'bidi', 'bidi', 'whitespace', 'whitespace']);
  assert.equal(display('\u202e'), '(whitespace or invisible character)');
});

test('unpaired surrogates are reported explicitly', () => {
  const issues = new Inspector().scan('\ud800X\udfff');
  assert.deepEqual(issues.map(i => [i.kindId, i.length]), [['surrogate', 1], ['surrogate', 1]]);
});

test('pinyin accepts precomposed and decomposed vowels and syllabic consonants', () => {
  const engine = new Inspector();
  assert.deepEqual(engine.scan('nǐ hǎo lǜ ń ḿ ê\u0304 a\u0301 u\u0308\u030c'), []);
  assert.equal(engine.scan('b\u0301')[0].kindId, 'combining');
  assert.equal(engine.scan('a\u0301\u0301').length, 1);
  assert.equal(engine.scan('a\u0308').length, 1);
  assert.equal(engine.scan('a' + '\u0301'.repeat(20000)).length, 19999);
  assert.ok(new Inspector({allowPinyin: false}).scan('ǐ a\u0301').length >= 2);
});

test('variation selectors are allowed only immediately after Han', () => {
  assert.deepEqual(new Inspector().scan('漢\ufe00𠮷\u{e0100}'), []);
  assert.deepEqual(new Inspector().scan('A\ufe0f😀\ufe0f').map(i => i.kindId), ['variation', 'unlisted', 'variation']);
});

test('punctuation, symbol and custom allowlists remain configurable', () => {
  assert.equal(new Inspector({allowChinesePunctuation: false}).scan('，！').length, 2);
  assert.equal(new Inspector({allowCommonSymbols: false}).scan('℃').length, 1);
  assert.deepEqual(new Inspector({allowedCharacters: '😀\u200b', allowedCodepointRanges: ['U+0400-U+04FF']}).scan('😀\u200bМ'), []);
  for (const value of ['foo', 'FFFF-FF', '0000-110000', '400', 123]) {
    assert.throws(() => new Inspector({allowedCodepointRanges: [value]}));
  }
});

test('English and Chinese translations preserve classification and targets', () => {
  const en = new Inspector().scan('М\u200bＡ😀');
  const cn = new Inspector({}, translate).scan('М\u200bＡ😀');
  assert.deepEqual(cn.map(({kindId, target}) => [kindId, target]), en.map(({kindId, target}) => [kindId, target]));
  assert.equal(en[0].kind, 'Confusable character');
  assert.equal(cn[0].kind, '易混淆字符');
  assert.match(cn[0].reason, /「M」/);
  assert.throws(() => new Inspector({allowedCodepointRanges: ['bad']}, translate), /范围格式/);
});

test('async scanning matches sync scanning and yields to cancellation', async () => {
  const engine = new Inspector();
  const text = '漢М😀\n'.repeat(5000);
  assert.deepEqual(await engine.scanAsync(text), engine.scan(text));
  let cancelled = false;
  const pending = engine.scanAsync(text, () => cancelled);
  setImmediate(() => { cancelled = true; });
  assert.equal(await pending, undefined);
  assert.equal(await engine.scanAsync('ASCII', () => true), undefined);
});

test('unknown characters are advisory and Unicode names stay canonical', () => {
  const issue = new Inspector().scan('\u0378')[0];
  assert.equal(issue.kindId, 'unlisted');
  assert.equal(issue.name, 'UNASSIGNED');
  assert.equal(script(0x41c), 'Cyrillic');
  assert.equal(codeLabel(0x20000), 'U+20000');
});
