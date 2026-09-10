'use strict';

// The core also runs without VS Code (tests and downstream tools).
// The extension injects vscode.l10n.t, so VS Code owns locale selection/fallback.
function format(message, ...args) {
  return message.replace(/\{(\d+)\}/g, (match, index) =>
    index < args.length ? String(args[index]) : match);
}

module.exports = { format };
