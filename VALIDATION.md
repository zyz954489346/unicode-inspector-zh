# 发布准备验证记录

日期：2026-09-10。版本：1.0.1。当前完整 ID：`local-tools.unicode-inspector-zh`（本地占位发布者，未上架）。

## 已完成

- `npm run check`：JavaScript 语法检查与 **24 项 Node 自动测试全部通过**。
- 扫描打包数据中所有 **103,428 个 Han／Bopomofo 字符**，验证放行和已分配元数据；验证区间排序及 6,565 条混淆映射数量。
- 中英文翻译键、插值占位符、稳定诊断类型、配置错误、扫描取消、陈旧结果失效、UTF-16 范围、拼音及连续组合标记均有回归覆盖。
- **macOS / VS Code 1.136.1 / 英文**真实扩展宿主测试通过：激活、诊断数量／级别／位置、悬停、跳转及编辑后清除诊断。
- **macOS / VS Code 1.136.1 / 简体中文**真实扩展宿主测试通过：同上，并检查实际 locale 为 `zh-cn`、中文运行时说明和本地化命令标题。测试使用独立临时配置与本机已有的官方中文语言包。
- `npm run package`：官方 `@vscode/vsce` 3.9.2 打包成功，打包前自动运行检查。
- VSIX ZIP 校验通过，19 个归档条目；打包内容逐项与当前源码核对一致，英文市场显示名称正确展开；测试、脚本、开发依赖和旧归档元数据均未混入。
- `node scripts/check-release.js` 在占位发布者下按预期返回退出码 1，提醒先填写真实 publisher。

## 交付包

`extension/unicode-inspector-zh-1.0.1.vsix`

大小：398,541 字节（约 389 KiB）。

SHA-256：

```text
2bec47b9713b73d8cf576a5a34a584e793823e6a0a707ef4f48691fae55a3d1a
```

这是可本地安装的预览包。更改 publisher 或其他文件后需重新打包，哈希也会改变。

## 尚未执行的外部验证

- 未注册 Marketplace publisher，未上传或发布扩展。
- 真实宿主测试使用源码开发加载；VSIX 已检查结构与内容，未在用户日常配置中安装。
- 未在 Windows、Linux、Remote SSH、笔记本或最低兼容版本 1.85.x 的真实宿主中验证。本地已补跨平台 Node CI 配置，但尚未在远程 CI 运行。
- 原始 VSIX 未包含 Unicode 数据生成脚本；现有检查验证打包数据及检测行为，没有独立重建完整上游数据。

下一步见 [发布指南](extension/PUBLISHING.md)。
