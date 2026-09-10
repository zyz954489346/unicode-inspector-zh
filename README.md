<p align="center">
  <img src="extension/media/icon.png" alt="Unicode Inspector icon" width="112" height="112">
</p>

<h1 align="center">Unicode Inspector</h1>

<p align="center">
  Find suspicious Unicode characters. Keep ordinary Chinese text readable.
</p>

<p align="center">
  <strong>English</strong> ·
  <a href="README.zh-CN.md">简体中文</a> ·
  <a href="extension/CHANGELOG.md">Changelog</a> ·
  <a href="extension/DEVELOPMENT.md">Development</a>
</p>

Unicode Inspector is a VS Code extension for reviewing confusable letters, invisible characters, unusual spaces, and fullwidth letters or digits. It highlights findings in the editor, explains them on hover, and lists their locations in the Problems panel.

The default rules are designed for **Chinese and ASCII text**: ordinary Simplified and Traditional Chinese, rare Han characters, and common Chinese punctuation are allowed. It is useful when checking copied text, order IDs, OCR output, and mixed Chinese/code documents.

**Chinese is Unicode too.** This extension identifies characters worth reviewing; it does not treat all non-ASCII text as invalid.

## See the difference

Paste this into a text document:

```text
中文正常 MO-2609080008
中文正常 МO-2609080008
中文正常 ＭＯ-2609080008
生僻字正常：𠮷，温度：25℃，面积：100㎡
```

| Line | What to expect with default settings |
| --- | --- |
| 1 | No findings: Chinese text and ASCII `MO` are allowed. |
| 2 | `М` is flagged: Cyrillic **U+041C**, which can resemble Latin `M` (**U+004D**). |
| 3 | `ＭＯ` are flagged: fullwidth letters have different code points from ASCII `MO`. |
| 4 | No findings: rare Han, Chinese punctuation, and these common units are allowed. |

Invisible characters such as zero-width spaces can also be located with **Next Issue**, even when they are difficult to point at with a mouse.

## Features

- **Actionable explanations:** editor highlights, hover details, Problems diagnostics, and a navigable issue list with code points, names where available, scripts, and reasons.
- **Chinese-aware defaults:** bundled Unicode **17.0.0** data covers all **103,428 assigned Han and Bopomofo characters**, including CJK extensions A–J, plus **6,565 confusable mappings**. Chinese allowlists take priority over confusable mappings.
- **English and Simplified Chinese UI:** commands, settings, diagnostics, and explanations follow the VS Code display language. Other display languages fall back to English; the inspection rules stay the same.
- **Configurable allowances:** control Chinese punctuation, common symbols, pinyin, individual characters, and hexadecimal code point ranges.
- **Offline and read-only:** no runtime third-party dependencies, network requests, telemetry, automatic text replacement, or changes to other editor settings.

## Install

Requires **VS Code desktop 1.85+**. The extension is designed for desktop and remote extension hosts; browser-only VS Code and virtual workspaces are not supported. See the [validation record](VALIDATION.md) for the environments actually tested.

**Current status:** the extension has not been published to Marketplace. You can build and install a local VSIX from source.

To build your own VSIX, clone or download this repository, then run from the repository root using **Node.js 22+ and npm**:

```sh
cd extension
npm ci --ignore-scripts
npm run package
```

Packaging runs the checks and creates `unicode-inspector-zh-1.0.1.vsix` inside `extension/`.

In VS Code, open **Extensions → … → Install from VSIX…**, select the generated file without extracting it, and open a text document. The generated VSIX is ignored by Git and is not included in a source checkout.

## Use

Open **View → Problems**, hover over a highlighted character, or click the **Unicode** status bar item to review the active document. Search for **Unicode Inspector** in the Command Palette:

| Command | Action |
| --- | --- |
| List Issues | Show findings and jump to a selected location. |
| Next Issue | Move to the next finding, wrapping to the first. |
| Explain Character at Cursor | Explain any character, including an allowed one; place the cursor before it or select it. |
| Rescan Document | Scan the active document immediately. |
| Open Settings | Open the extension's configuration. |

**Explain Character at Cursor** and **List Issues** are also in the editor context menu. If editor hover is disabled, the commands and Problems panel still provide explanations.

## Configure

Use **Unicode Inspector: Open Settings**, or add these defaults to `settings.json`:

```json
{
  "unicodeInspector.enabled": true,
  "unicodeInspector.allowChinesePunctuation": true,
  "unicodeInspector.allowCommonSymbols": true,
  "unicodeInspector.allowPinyin": true,
  "unicodeInspector.allowedCharacters": "",
  "unicodeInspector.allowedCodepointRanges": [],
  "unicodeInspector.debounceMs": 350,
  "unicodeInspector.maxFileCharacters": 5000000
}
```

- To inspect fullwidth punctuation such as `，` in code, set `allowChinesePunctuation` to `false`.
- To allow specific characters, enter them literally in `allowedCharacters`, for example `"😀✅"`. Compound emoji can include additional joiners or variation selectors.
- To allow a script range, use a value such as `["0400-04FF"]` in `allowedCodepointRanges`. This permits **every character** in the range, including Cyrillic `М`; use allowances deliberately when reviewing identifiers.
- Documents over the default limit of 5,000,000 UTF-16 code units are explicitly marked **not scanned**. Set `maxFileCharacters` to `0` to remove the limit; large documents and many findings can consume more memory and time.

See the [full extension guide](extension/readme.md#settings) for setting details.

## What a finding means

**Warning** indicates a specific property such as a confusable mapping, invisible control, unusual space, or fullwidth letter. **Information** indicates a character outside the allowlists. A finding is a request to review the context, not a claim that the character is wrong.

The defaults suit Chinese and ASCII content. Emoji, other languages, private-use characters, and legitimate typography may require custom allowances. Pinyin support covers the bundled letters and supported combining-mark contexts. A variation selector immediately following Han is allowed, but this does not validate whether the combination is a registered variation sequence.

Only opened files, untitled documents, remote files, and notebook code cells are inspected. Comments and strings are included. The extension does not scan your entire project, parse programming-language syntax, validate a file's encoding, or provide a complete Unicode security audit. VS Code's built-in Unicode highlighting and other extensions may produce their own, separate findings.

## Develop and contribute

The extension project lives in **`extension/`**. From that directory:

```sh
npm run check          # Syntax, core, API mock, and localization checks
npm run package        # Validate and build a local VSIX
```

Use the repository's [VS Code launch configurations](.vscode/launch.json) to debug English or Chinese UI. Real extension-host tests, language-pack setup, and data maintenance notes are in the [development guide](extension/DEVELOPMENT.md). The [CI workflow](.github/workflows/ci.yml) runs Node checks on Linux, macOS, and Windows and builds a VSIX.

For a bug report, include a minimal text sample, expected and actual findings, your VS Code version, display language, and relevant `unicodeInspector.*` settings. Use escaped code points for invisible characters when helpful, and remove private content from examples.

Translations are welcome. Manifest strings live in `package.nls*.json`; runtime translations live in `l10n/`. Add both catalogs for a new locale, preserve numbered placeholders such as `{0}`, and keep detection logic independent of translated labels.

| Resource | Contents |
| --- | --- |
| [Extension guide](extension/readme.md) | Full usage and settings reference in English and Chinese. |
| [Development guide](extension/DEVELOPMENT.md) | Setup, tests, localization, Unicode data, and icon generation. |
| [Changelog](extension/CHANGELOG.md) | Changes by version. |
| [Validation record](VALIDATION.md) | Completed checks and remaining platform verification. |

## License

The code is licensed under the [MIT License](extension/LICENSE.txt). Bundled Unicode data is covered by the [Unicode data license](extension/UNICODE-LICENSE.txt); input sources, versions, and hashes are recorded in [DATA-SOURCES.txt](extension/DATA-SOURCES.txt).
