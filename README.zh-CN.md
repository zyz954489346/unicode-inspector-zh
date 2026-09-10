<p align="center">
  <img src="extension/media/icon.png" alt="Unicode Inspector 图标" width="112" height="112">
</p>

<h1 align="center">Unicode Inspector 中文字符检查</h1>

<p align="center">
  识别可疑 Unicode 字符，让正常中文保持清晰。
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <strong>简体中文</strong> ·
  <a href="extension/CHANGELOG.md">更新记录</a> ·
  <a href="extension/DEVELOPMENT.md">开发指南</a>
</p>

**Unicode Inspector 中文字符检查** 是一个 VS Code 扩展，用于发现易混淆字母、不可见字符、特殊空白和全角字母／数字。它提供编辑器高亮、悬停解释、问题面板和按位置跳转，适合检查复制粘贴的文本、工单编号、OCR 结果以及中英文混排的代码文档。

默认规则兼顾中文与 ASCII，放行普通简繁体中文、生僻汉字和常用中文标点。**中文本身也是 Unicode**；扩展提示的是值得确认的字符，并非将所有非 ASCII 字符视为错误。

## 快速体验

将下面的示例粘贴到文本文件中：

```text
中文正常 MO-2609080008
中文正常 МO-2609080008
中文正常 ＭＯ-2609080008
生僻字正常：𠮷，温度：25℃，面积：100㎡
```

默认设置下的检测结果：

- 第一行正常放行，`MO` 是普通 ASCII 字母。
- 第二行的 `М` 会被提示：它是西里尔字母 **U+041C**，看起来可能很像拉丁字母 `M`（**U+004D**）。
- 第三行的 `ＭＯ` 会被提示：全角字母与 ASCII `MO` 的编码不同。
- 第四行正常放行，包含生僻字 `𠮷`、中文标点和常用单位。

零宽空格等不易看见的字符，可以通过「下一处异常」定位。

## 主要功能

- **解释具体原因**：高亮、悬停、问题面板和问题列表展示字符位置、编码、可用名称、文字系统及原因。
- **中文兼容**：内置 Unicode **17.0.0** 数据，覆盖当版全部 **103,428 个已分配 Han／Bopomofo 字符**，包括汉字扩展 A～J；同时包含 **6,565 条混淆映射**。中文允许规则优先，避免误报普通中文。
- **中英文界面**：跟随 VS Code 显示语言，支持英文和简体中文，其他界面语言回退为英文。两种界面均使用相同检测规则，支持简繁体和生僻汉字。
- **按需配置**：可调整中文标点、常用符号、拼音、指定字符和编码范围的允许规则。
- **离线只读**：不联网、不上传文件、不收集遥测、没有运行时第三方依赖，不自动修改原文或编辑器设置。

## 安装

需要 **VS Code 桌面版 1.85 及以上**。扩展面向桌面与远程扩展宿主，不支持纯浏览器版和虚拟工作区；实际完成的环境验证见[验证记录](VALIDATION.md)。

**目前尚未上架 Marketplace**，可从源码生成并安装本地 VSIX。

准备 **Node.js 22 及以上和 npm**，克隆或下载本仓库后，在仓库根目录执行：

```sh
cd extension
npm ci --ignore-scripts
npm run package
```

打包会先运行检查，随后生成 `extension/unicode-inspector-zh-1.0.1.vsix`。打开 VS Code「扩展 → … → 从 VSIX 安装…」，选择生成的文件，无需解压。VSIX 是构建产物，已被 Git 忽略，下载源码不会自动包含安装包。

## 使用与设置

打开文档后会自动检测。悬停高亮字符可查看解释，也可以打开「查看 → 问题」，或点击状态栏的 **Unicode** 查看当前文档的问题列表。

在命令面板搜索 `Unicode Inspector`：

| 命令 | 用途 |
| --- | --- |
| 问题列表 | 查看待确认字符，选择后跳转。 |
| 下一处异常 | 循环定位下一处待确认字符。 |
| 解释光标处字符 | 查看任意字符，包括已允许的字符；将光标置于字符前或选中字符。 |
| 重新检测 | 立即扫描当前文档。 |
| 设置 | 打开扩展配置。 |

右键菜单也提供字符解释和问题列表。若编辑器关闭了悬停功能，仍可使用命令或问题面板查看说明。

执行「Unicode Inspector：设置」，或将以下默认配置添加到 `settings.json`：

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

常见调整方式：

- 检查代码中的 `，` 等全角标点：关闭 `allowChinesePunctuation`。
- 放行指定字符：在 `allowedCharacters` 中直接输入，例如 `😀✅`，不是正则。组合 emoji 的连接符／变体选择符可能仍会提示。
- 放行编码范围：设置 `allowedCodepointRanges`，例如 `["0400-04FF"]`。该范围内**所有字符都会放行**，也包括西里尔字母 `М`，排查编号时应按需设置。
- 默认单文件上限为 **5,000,000 个 UTF-16 单元**，超限明确显示「未检测」。`maxFileCharacters: 0` 可取消上限；超大文档和大量问题会增加内存与处理时间。

全部设置说明见[扩展使用指南](extension/readme.md#设置)。

## 如何理解提示

「警告」表示有明确的混淆、不可见控制、特殊空白或全角字母等依据；「信息」表示字符不在允许列表。**提示不代表字符本身一定有错**，需要结合文本用途判断。

默认策略适合中文与 ASCII。emoji、其他语言、私用区字符和合法排版符号可能需要自定义放行。拼音支持内置字母和受支持的组合标记上下文；紧跟汉字的变体选择符会放行，但不代表验证了该组合是已注册变体序列。

仅检测已打开的文件、未保存文档、远程文件及笔记本代码单元，也会检查注释和字符串。扩展不扫描整个项目，不解析编程语言语法，不校验文件编码，也不提供完整的 Unicode 安全审计。VS Code 内置 Unicode 功能或其他扩展可能同时产生自己的高亮。

## 开发与反馈

源码根目录为 `extension/`。安装依赖后，在该目录运行 `npm run check` 检查代码和测试，运行 `npm run package` 生成本地包。可通过仓库自带的 VS Code 启动配置调试中英文界面；真实扩展宿主测试及中文语言包准备方法见[开发指南](extension/DEVELOPMENT.md)。

反馈问题时，请提供最小文本示例、预期与实际提示、VS Code 版本、显示语言和相关配置。不可见字符可用编码形式说明，示例请去除私人内容。欢迎补充翻译，新增语言时需要同时维护 `package.nls*.json` 和 `l10n/` 下的翻译，并保留 `{0}` 等占位符。

版本变化见[更新记录](extension/CHANGELOG.md)，已完成验证及其范围见[验证记录](VALIDATION.md)。

## 许可

代码采用 [MIT 许可](extension/LICENSE.txt)，Unicode 数据适用[单独的数据许可](extension/UNICODE-LICENSE.txt)，来源与输入哈希见 [DATA-SOURCES.txt](extension/DATA-SOURCES.txt)。
