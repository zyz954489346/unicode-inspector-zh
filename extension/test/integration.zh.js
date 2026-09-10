'use strict';
const assert = require('node:assert/strict');
const vscode = require('vscode');
module.exports.run = async () => {
  assert.equal(vscode.env.language.toLowerCase(), 'zh-cn', 'Install the official Simplified Chinese language pack in the isolated test profile first.');
  await require('./integration').run();
  const manifest = require('../package.json');
  const extension = vscode.extensions.getExtension(`${manifest.publisher}.${manifest.name}`);
  const title = extension.packageJSON.contributes.commands.find(c => c.command === 'unicodeInspector.listIssues').title;
  // VS Code may expose localized contributions as {value, original}.
  assert.equal(typeof title === 'string' ? title : title.value, '问题列表');
  console.log('CHINESE MANIFEST AND RUNTIME LOCALIZATION PASSED');
};
