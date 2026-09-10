# Development

The extension root is this `extension/` directory. The repository root contains launch configurations and CI. `original-vsix-metadata/` only preserves the unpacked 1.0.0 archive metadata; it is not used to build releases.

## Requirements and checks

- Node.js 22+ and npm for development/packaging.
- VS Code desktop 1.85+ for the extension. Packaging uses `@vscode/vsce`; the extension itself has no runtime dependencies.

```sh
cd extension
npm ci --ignore-scripts
npm run check
npm run package
```

`npm run check` validates JavaScript syntax and runs the 24 Node tests. These cover bundled Han/Bopomofo coverage, range tables, confusables, UTF-16 offsets, control characters, pinyin, cancellation, API integration through mocks, stale results, disable/limit/error behavior, and translation consistency.

`npm run package` also runs checks through `vscode:prepublish`. It creates `unicode-inspector-zh-1.0.1.vsix` in this directory. Tests, development scripts, dependencies, and legacy metadata are excluded. The Unicode data and its license remain bundled.

CI runs the Node checks on Linux, macOS, and Windows, then produces a VSIX artifact. It does not publish. A configured workflow is not evidence that the remote CI has run.

## Real extension-host tests

Open the repository root in VS Code and press F5 using an English or Simplified Chinese launch configuration for manual inspection. To run automated real-host tests, launch the VS Code desktop executable with:

```text
--extensionDevelopmentPath=<absolute-path>/extension
--extensionTestsPath=<absolute-path>/extension/test/integration.js
--user-data-dir=<temporary-directory-for-this-locale>
--extensions-dir=<temporary-empty-extensions-directory>
--disable-extensions
--skip-welcome
--skip-release-notes
--locale=en
```

For Chinese, install the official Simplified Chinese language pack into the isolated test profile, then repeat with `--locale=zh-cn`, `--extensionTestsPath=<absolute-path>/extension/test/integration.zh.js`, and a separate temporary user data directory. The Chinese test rejects an English fallback and also checks translated manifest commands. A locale flag alone is not sufficient when the profile has no language pack. On macOS, use the executable inside `Visual Studio Code.app/Contents/MacOS/` (the name varies by VS Code version). If inherited from an Electron-based terminal, remove `ELECTRON_RUN_AS_NODE` from the test process environment. Use isolated profiles so tests do not modify your usual settings.

The test activates the extension, opens an untitled document, verifies Chinese-aware detection, diagnostic severity and UTF-16 locations, translated diagnostics, hover content, navigation, and clearing diagnostics after edits. It prints `INTEGRATION PASSED` and exits through VS Code's test runner. Node tests additionally exercise error/disabled/limit behavior and simulated races.

For the minimum supported VS Code version, run the same host test against 1.85.x before changing the compatibility promise. Cross-platform and older-host compatibility require their own test runs.

## Localization

- `package.nls.json`: English manifest strings.
- `package.nls.zh-cn.json`: Simplified Chinese manifest strings.
- `l10n/bundle.l10n.json`: English runtime catalog.
- `l10n/bundle.l10n.zh-cn.json`: Simplified Chinese runtime translations.
- `src/core.js`: locale-independent `kindId` plus translated human-facing `kind`/`reason`; accepts an injected translation function.
- `src/extension.js`: delegates runtime translation to `vscode.l10n.t`.

Use English message literals and numbered placeholders such as `{0}`. Update both runtime catalogs when adding a message. Preserve placeholders in translations. Keep detection logic independent of human-readable labels. Canonical Unicode names and unrecognized script names are left in English. The interface locale never changes the inspection policy.

## Data and icon

Unicode 17.0.0 input URLs and hashes are in `DATA-SOURCES.txt`. The original data-generation script was not present in the supplied VSIX; the current project preserves its bundled data and validates its structural invariants and Han/Bopomofo coverage. Do not claim an independently reproduced upstream dataset until its regeneration has been implemented and verified.

`media/icon.svg` is the editable geometric icon source. `python3 scripts/generate-icon.py` regenerates both its SVG and Marketplace-compatible PNG without external dependencies.
