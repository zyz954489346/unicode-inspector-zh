'use strict';
// Runs inside a real VS Code extension host via --extensionTestsPath.
const assert = require('node:assert/strict');
const vscode = require('vscode');
const manifest = require('../package.json');

async function run() {
  const id = `${manifest.publisher}.${manifest.name}`;
  const extension = vscode.extensions.getExtension(id);
  assert.ok(extension, `Missing extension ${id}`);
  const api = await extension.activate();
  const doc = await vscode.workspace.openTextDocument({language: 'plaintext', content: '中文𠮷\r\nМＯ😀\u200b'});
  await vscode.window.showTextDocument(doc);
  const state = await api.ready(doc);
  assert.equal(state.issues.length, 4);
  const diagnostics = vscode.languages.getDiagnostics(doc.uri).filter(d => d.source === 'Unicode Inspector');
  assert.equal(diagnostics.length, 4);
  assert.deepEqual(diagnostics.map(d => [d.range.start.line,d.range.start.character,d.range.end.character]), [[1,0,1],[1,1,2],[1,2,4],[1,4,5]]);
  assert.equal(diagnostics[2].severity, vscode.DiagnosticSeverity.Information);
  const chinese = vscode.env.language.toLowerCase() === 'zh-cn';
  assert.match(diagnostics[0].message, chinese ? /易混淆字符/ : /Confusable character/);
  const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider',doc.uri,new vscode.Position(1,0));
  assert.ok(hovers.some(h => h.contents.some(c => c.value?.replace(/\\/g, '').includes('U+041C'))));
  await vscode.commands.executeCommand('unicodeInspector.nextIssue');
  assert.equal(vscode.window.activeTextEditor.selection.start.line, 1);
  const edit = new vscode.WorkspaceEdit();
  edit.replace(doc.uri,new vscode.Range(doc.positionAt(0),doc.positionAt(doc.getText().length)),'简体、繁體、𠮷、nǐ hǎo、25℃');
  assert.equal(await vscode.workspace.applyEdit(edit), true);
  assert.equal((await api.ready(doc)).issues.length, 0);
  assert.deepEqual(vscode.languages.getDiagnostics(doc.uri).filter(d => d.source === 'Unicode Inspector'), []);
  console.log(`INTEGRATION PASSED: VS Code ${vscode.version}, locale=${vscode.env.language}, extension=${id}`);
}
module.exports = {run};
