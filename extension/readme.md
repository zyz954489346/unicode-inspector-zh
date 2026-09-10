# Unicode Inspector

Spot suspicious Unicode characters without flagging ordinary Chinese text.

**English** · [简体中文](#简体中文)

Unicode Inspector highlights confusable letters, invisible controls, unusual spaces, and fullwidth letters or digits. Hover for an explanation, review locations in the Problems panel, or jump between findings. It runs offline and never rewrites your text.

> Chinese characters are Unicode too. This extension checks potentially surprising characters using Chinese-aware allowlists; it does not treat all non-ASCII text as invalid.

## Try it

```text
中文正常 MO-2609080008
中文正常 МO-2609080008
中文正常 ＭＯ-2609080008
生僻字正常：𠮷，温度：25℃，面积：100㎡
```

- Line 1: ordinary ASCII letters and Chinese text are allowed.
- Line 2: `М` is Cyrillic **U+041C**, which can resemble Latin `M`.
- Line 3: `ＭＯ` are fullwidth letters, distinct from ASCII `MO`.
- Line 4: rare Han characters, Chinese punctuation, and common units are allowed.

## Features

- Editor highlights, hover explanations, and Problems panel diagnostics.
- Code point, Unicode name where available, script, and reason for each finding.
- **English and Simplified Chinese interfaces**, following the VS Code display language. Other display languages fall back to English. Detection rules are identical in both languages.
- Bundled **Unicode 17.0.0** data: all 103,428 assigned Han and Bopomofo characters, including CJK extensions A–J, and 6,565 confusable mappings.
- Configurable punctuation, symbols, pinyin, individual characters, and code point ranges.
- No runtime dependencies, telemetry, or network requests. No automatic changes to text or editor settings.

## Install and use

Requires **VS Code desktop 1.85 or later** on macOS, Windows, or Linux. Remote extension hosts are supported. Browser-only VS Code and virtual workspaces are not supported.

To install a downloaded package, open **Extensions → … → Install from VSIX…** and select the `.vsix` file without extracting it. Once available on Marketplace, search for **Unicode Inspector** and confirm the publisher before installing.

Open a document to start inspection. Click the **Unicode** status bar item to review findings, or open **View → Problems**.

Search for **Unicode Inspector** in the Command Palette:

| Command | Action |
| --- | --- |
| List Issues | Review findings in the active document and jump to a location. |
| Next Issue | Move to the next finding, wrapping to the first. |
| Explain Character at Cursor | Inspect any character, including allowed characters. Place the cursor before it or select it. |
| Rescan Document | Scan the active document immediately. |
| Open Settings | Open this extension's settings. |

**Explain Character at Cursor** and **List Issues** are also available in the editor context menu. If hover is disabled in your editor settings, use the commands or Problems panel.

## Detection policy

The defaults are intended for **Chinese and ASCII text**, including mixed Chinese/code documents. Simplified and Traditional Chinese, rare Han, Bopomofo, assigned CJK strokes and ideographic description characters are allowed. Common Chinese punctuation, selected units/math/currency symbols, pinyin letters, and supported decomposed pinyin marks are allowed by default. A variation selector immediately after Han is allowed; this is a contextual allowance, not validation of registered variation sequences.

Fullwidth letters/digits, ideographic spaces, unusual whitespace, zero-width format characters, bidirectional controls, and confusable characters are flagged unless explicitly allowed. Ordinary tabs, carriage returns, line feeds, and printable ASCII are allowed. Chinese allowlists take priority over confusable mappings to avoid flagging ordinary Chinese.

**Warning** indicates a specific property such as a confusable mapping or invisible control. **Information** indicates a character outside the allowlists. Neither means the character must be wrong. Emoji, other languages, private-use characters, and valid typography may need custom allowances. This is a character-level review tool, not a parser, encoding validator, OCR correction tool, or complete Unicode security audit. Comments and strings are inspected too.

## Settings

Use **Unicode Inspector: Open Settings**, or edit `settings.json`:

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

| Setting | Notes |
| --- | --- |
| `enabled` | Enable or disable automatic inspection. |
| `allowChinesePunctuation` | Disable to flag punctuation such as `，` and `！` in code. |
| `allowCommonSymbols` | Allow the bundled selection of units, math, and currency symbols. |
| `allowPinyin` | Allow pinyin letters and supported combining marks. |
| `allowedCharacters` | Literal characters, for example `😀✅`. Compound emoji may include additional joiners or variation selectors. |
| `allowedCodepointRanges` | Hex ranges, for example `["0400-04FF"]` or `["U+0400-U+04FF"]`. A range allows **every character** within it, including confusables and controls; this example also allows Cyrillic `М`. |
| `debounceMs` | Wait after typing before rescanning; default 350 ms. |
| `maxFileCharacters` | Limit in UTF-16 code units; default 5,000,000. `0` removes the limit. Larger documents are explicitly marked **not scanned**. |

Settings can be scoped to a workspace or folder. Only opened files, untitled documents, remote files, and notebook code cells are scanned. The extension does not scan your entire project or disk. Large documents and many findings can increase memory and processing time.

VS Code's built-in Unicode highlighting and other extensions may produce separate highlights. Their settings remain under your control; this extension does not change them.

## Development and localization

The extension source root is `extension/` in the source checkout. Use Node.js 22 or later for packaging:

```sh
cd extension
npm ci
npm run check
npm run package
```

`npm run check` runs syntax checks plus core, VS Code API mock, and translation consistency tests. Real extension-host tests are provided separately in `test/integration.js`; see `DEVELOPMENT.md` in the source checkout.

Manifest strings live in `package.nls.json` and `package.nls.zh-cn.json`. Runtime messages use `vscode.l10n.t` with bundles under `l10n/`. To add a language, add both translations and retain interpolation placeholders. Canonical Unicode names remain in English.

## License and data

Code: **MIT**. Unicode data has its own license, included in `UNICODE-LICENSE.txt`. Versioned sources and input hashes are recorded in `DATA-SOURCES.txt`. Data is bundled locally and requires an extension update when Unicode coverage changes.

---

# 简体中文

**Unicode Inspector 中文字符检查**：检测易混淆、不可见和异常 Unicode 字符，同时放行普通中文。支持编辑器高亮、悬停原因、问题面板，以及按位置跳转；离线运行，不自动修改原文。

中文本身也是 Unicode。本扩展检查的是“需要确认的 Unicode 字符”，并非把所有非 ASCII 字符视为错误。

## 快速体验

将上方示例粘贴进文本文件：第二行的 `М` 是西里尔字母 U+041C；第三行的 `ＭＯ` 是全角字母，这些字符应被标记。第一行和第四行应正常放行。

在命令面板搜索 `Unicode Inspector`，可使用「问题列表」「下一处异常」「解释光标处字符」「重新检测」「设置」。状态栏显示当前文档的待确认数量，点击可查看问题列表；编辑器右键菜单也提供字符解释和问题列表。零宽字符可通过「下一处异常」定位。

界面跟随 VS Code 的显示语言，支持**英文和简体中文**，其他界面语言回退为英文。两种语言的检测规则完全相同，均支持简体和繁体中文。Unicode 正式字符名称保留英文。

## 安装与支持范围

需要 VS Code 桌面版 **1.85 及以上**，支持 macOS、Windows、Linux 及远程扩展宿主，不支持纯浏览器版或虚拟工作区。下载 `.vsix` 后无需解压，打开「扩展 → … → 从 VSIX 安装…」选择文件即可。上架后可搜索名称安装，并核对发布者。

仅检测已打开的文件、未保存文档、远程文件及笔记本代码单元，不扫描整个磁盘或项目。扩展不联网、不上传文件、不收集遥测、没有运行时第三方依赖，也不修改其他 Unicode 高亮工具的设置。

## 中文兼容与判断边界

内置 **Unicode 17.0.0** 数据，覆盖当版全部 **103,428 个已分配 Han／Bopomofo 字符**，包括简繁体、生僻字、汉字扩展 A～J、兼容汉字、部首和注音，以及已分配 CJK 笔画和表意文字描述字符。默认允许常用中文标点、部分单位／数学／货币符号、带调拼音及受支持的分解形式。

紧跟汉字的变体选择符会放行，但这不等于验证该组合是已注册变体序列。内置全部 **6,565 条 Unicode 混淆映射**；中文允许规则优先，避免误报正常汉字。

全角字母／数字、全角空格、特殊空白、零宽及方向控制字符默认提示。「警告」表示有明确的混淆或特殊字符依据；「信息」表示不在允许列表，**不代表字符本身有错**。emoji、其他语言和部分排版符号可能需要自定义放行。本扩展按字符检测，也会检查注释与字符串；它不是语法解析器、文件编码校验器、OCR 自动纠错或完整安全审计工具。

## 设置

执行「Unicode Inspector：设置」或使用上方 JSON 示例：

- `enabled`：启用自动检测。
- `allowChinesePunctuation`：默认允许中文标点；关闭后可检查代码中的 `，！` 等。
- `allowCommonSymbols`：允许内置常用单位、数学和货币符号。
- `allowPinyin`：允许拼音字母和受支持的组合标记。
- `allowedCharacters`：直接输入额外允许的字符，如 `😀✅`，不是正则。组合 emoji 的连接符／变体选择符可能需另行确认。
- `allowedCodepointRanges`：十六进制范围，如 `["0400-04FF"]`。范围内全部字符都会放行，包括易混淆字母和控制符；此例也会放行西里尔字母 `М`。
- `debounceMs`：停止输入后的检测延迟，默认 350 毫秒。
- `maxFileCharacters`：默认 5,000,000 个 UTF-16 单元，超限会明确显示「未检测」；`0` 表示不限。超大文件及大量问题会增加内存和处理时间。

设置支持工作区／文件夹级别。其他扩展或 VS Code 内置 Unicode 功能的高亮可能同时存在，需要在对应设置中调整。

代码使用 MIT 许可，Unicode 数据许可和来源随扩展附带。源码目录中的 `DEVELOPMENT.md` 与 `PUBLISHING.md` 提供开发、验证和发布步骤。
