'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const {format} = require('../src/i18n');
const chinese = require('../l10n/bundle.l10n.zh-cn.json');

function harness(locale = 'en', initial = '𠮷М😀') {
  const events = {}, commands = {}, diagnostics = new Map(), messages = [], executions = [];
  const settings = {enabled: true, debounceMs: 10000};
  const disposable = () => ({dispose() {}});
  const event = name => listener => { events[name] = listener; return disposable(); };
  class Position { constructor(line, character) { this.line = line; this.character = character; } }
  class Range {
    constructor(a,b,c,d) {
      this.start = typeof a === 'number' ? new Position(a,b) : a;
      this.end = typeof a === 'number' ? new Position(c,d) : b;
    }
  }
  const doc = {
    text: initial, version: 1, isClosed: false,
    uri: {scheme: 'untitled', toString: () => 'untitled:test'},
    getText() { return this.text; },
    positionAt(offset) {
      const lines = this.text.slice(0,offset).split('\n');
      return new Position(lines.length - 1, lines.at(-1).length);
    },
    offsetAt(pos) {
      return this.text.split('\n').slice(0,pos.line).reduce((n,line) => n + line.length + 1, 0) + pos.character;
    }
  };
  const status = {...disposable(), show() { this.visible = true; }, hide() { this.visible = false; }};
  const editor = {document: doc, selection: new Range(0,0,0,0), setDecorations(_,ranges) { this.ranges = ranges; }, revealRange(range) { this.revealed = range; }};
  const api = {
    l10n: {t: (message,...args) => format(locale === 'zh-cn' ? chinese[message] || message : message,...args)},
    Range, Position, Selection: Range,
    Diagnostic: class { constructor(range,message,severity) { Object.assign(this,{range,message,severity}); } },
    DiagnosticSeverity: {Error: 0, Warning: 1, Information: 2},
    MarkdownString: class { constructor() { this.value = ''; } appendText(value) { this.value += value; } },
    Hover: class { constructor(contents,range) { Object.assign(this,{contents,range}); } },
    ThemeColor: class {}, OverviewRulerLane: {Right: 4}, DecorationRangeBehavior: {ClosedClosed: 1}, StatusBarAlignment: {Right: 2}, TextEditorRevealType: {InCenterIfOutsideViewport: 2},
    languages: {
      createDiagnosticCollection: () => ({...disposable(), set: (uri,items) => diagnostics.set(uri.toString(),items), delete: uri => diagnostics.delete(uri.toString())}),
      registerHoverProvider: (_,provider) => { api.hover = provider; return disposable(); }
    },
    workspace: {
      textDocuments: [doc], getConfiguration: () => ({get: (key,fallback) => settings[key] ?? fallback}),
      onDidOpenTextDocument: event('open'), onDidChangeTextDocument: event('change'), onDidCloseTextDocument: event('close'), onDidChangeConfiguration: event('config')
    },
    window: {
      activeTextEditor: editor, visibleTextEditors: [editor], createTextEditorDecorationType: disposable, createStatusBarItem: () => status,
      onDidChangeActiveTextEditor: event('active'), onDidChangeVisibleTextEditors: event('visible'),
      showInformationMessage: message => messages.push(message), showWarningMessage: message => messages.push(message), showErrorMessage: message => messages.push(message),
      showQuickPick: async (items,options) => { api.picker = {items,options}; return api.choose ? api.choose(items) : undefined; },
      showTextDocument: async () => editor
    },
    commands: {
      registerCommand: (name,callback) => { commands[name] = callback; return disposable(); },
      executeCommand: async (...args) => executions.push(args)
    }
  };
  const filename = require.resolve('../src/extension');
  const oldLoad = Module._load;
  delete require.cache[filename];
  let extension;
  try { Module._load = function(name,...args) { return name === 'vscode' ? api : oldLoad.call(this,name,...args); }; extension = require(filename); }
  finally { Module._load = oldLoad; }
  const context = {subscriptions: [], extension: {id: 'real-publisher.unicode-inspector-zh'}};
  const activated = extension.activate(context);
  return {api, doc, editor, settings, events, commands, messages, executions, status, diagnostics, ...activated,
    dispose() { for (const item of context.subscriptions.reverse()) item.dispose(); },
    change(text) { doc.text = text; doc.version++; events.change({document: doc, contentChanges: [{}]}); }
  };
}

for (const locale of ['en', 'zh-cn']) {
  test(`diagnostics, hover, quick picks and settings work in ${locale}`, async t => {
    const h = harness(locale); t.after(() => h.dispose());
    const state = await h.ready(h.doc);
    assert.equal(state.issues.length, 2);
    const diagnostics = h.diagnostics.get(h.doc.uri.toString());
    assert.deepEqual(diagnostics.map(d => d.severity), [1,2]);
    assert.deepEqual(diagnostics.map(d => [d.range.start.character,d.range.end.character]), [[2,3],[3,5]]);
    const hover = h.api.hover.provideHover(h.doc, new h.api.Position(0,2));
    assert.equal(hover.contents.isTrusted, false);
    assert.equal(hover.contents.supportHtml, false);
    assert.match(hover.contents.value, /U\+041C/);
    assert.match(hover.contents.value, locale === 'en' ? /Confusable character/ : /易混淆字符/);
    await h.commands['unicodeInspector.listIssues']();
    assert.equal(h.api.picker.items.length, 2);
    await h.commands['unicodeInspector.openSettings']();
    assert.deepEqual(h.executions.at(-1), ['workbench.action.openSettings','@ext:real-publisher.unicode-inspector-zh']);
  });
}

test('text edits invalidate hover and diagnostics before rescan finishes', async t => {
  const h = harness(); t.after(() => h.dispose());
  await h.ready(h.doc);
  h.change('中文正常');
  assert.equal(h.diagnostics.has(h.doc.uri.toString()), false);
  assert.equal(h.editor.ranges.length, 0);
  assert.equal(h.api.hover.provideHover(h.doc,new h.api.Position(0,2)), undefined);
  assert.equal((await h.ready(h.doc)).issues.length, 0);
});

test('an obsolete asynchronous scan cannot replace current results', async t => {
  const h = harness('en','М'.repeat(20000)); t.after(() => h.dispose());
  const old = h.ready(h.doc);
  h.change('正常');
  await h.ready(h.doc);
  assert.equal(await old, undefined);
  assert.deepEqual(h.diagnostics.get(h.doc.uri.toString()), []);
});

test('disabled inspection clears diagnostics and does not report a clean scan', async t => {
  const h = harness(); t.after(() => h.dispose()); await h.ready(h.doc);
  h.settings.enabled = false; h.events.config({affectsConfiguration: () => true});
  await h.commands['unicodeInspector.listIssues']();
  assert.equal(h.diagnostics.has(h.doc.uri.toString()), false);
  assert.equal(h.status.visible, false);
  assert.match(h.messages.at(-1), /disabled/);
});

test('size limits and invalid configuration are visible and recoverable', async t => {
  const h = harness(); t.after(() => h.dispose());
  h.settings.maxFileCharacters = 1;
  assert.equal(await h.ready(h.doc), undefined);
  assert.match(h.status.text, /not scanned/);
  h.settings.maxFileCharacters = 0;
  h.settings.allowedCodepointRanges = ['FFFF-0000'];
  h.events.config({affectsConfiguration: () => true});
  assert.equal(await h.ready(h.doc), undefined);
  assert.match(h.status.text, /scan failed/);
  h.settings.allowedCodepointRanges = [];
  h.events.config({affectsConfiguration: () => true});
  assert.equal((await h.ready(h.doc)).issues.length, 2);
});

test('next issue wraps and explaining inside a surrogate pair reads the whole character', async t => {
  const h = harness(); t.after(() => h.dispose());
  await h.commands['unicodeInspector.nextIssue'](); assert.equal(h.editor.selection.start.character, 2);
  await h.commands['unicodeInspector.nextIssue'](); assert.equal(h.editor.selection.start.character, 3);
  await h.commands['unicodeInspector.nextIssue'](); assert.equal(h.editor.selection.start.character, 2);
  h.editor.selection = new h.api.Range(0,4,0,4);
  await h.commands['unicodeInspector.explainCharacter']();
  assert.match(h.api.picker.items[0].label, /U\+1F600/);
});

test('changing the document while an issue picker is open prevents stale navigation', async t => {
  const h = harness(); t.after(() => h.dispose());
  h.api.choose = items => { h.change('different'); return items[0]; };
  await h.commands['unicodeInspector.listIssues']();
  assert.equal(h.editor.revealed, undefined);
  assert.match(h.messages.at(-1), /document changed/);
});

test('closed and unsupported documents cannot retain stale scan results', async t => {
  const h = harness(); t.after(() => h.dispose());
  const pending = h.ready(h.doc);
  h.doc.isClosed = true; h.events.close(h.doc);
  assert.equal(await pending, undefined);
  assert.equal(h.diagnostics.size, 0);
  h.doc.isClosed = false; h.doc.uri.scheme = 'output';
  assert.equal(await h.ready(h.doc), undefined);
});
