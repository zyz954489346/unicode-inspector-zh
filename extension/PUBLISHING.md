# 发布指南 / Publishing

当前已准备 **1.0.1 本地预览包**。`publisher: "local-tools"` 继承自原始本地包，仅为占位标识，不能据此认为已有 Marketplace 账号。尚未上传或发布。

## 1. 注册发布者

访问 [Visual Studio Marketplace 发布者管理](https://marketplace.visualstudio.com/manage)，登录 Microsoft 账号，创建自己的 publisher。记录 **ID**，它与展示名称不同。

请自行在平台完成账号注册及认证，不需要将密码或令牌写入源码。

## 2. 填入真实元数据

在本目录的 `package.json` 中把 `publisher` 从 `local-tools` 改成自己的发布者 ID。显示名称已国际化，位于 `package.nls.json` 和 `package.nls.zh-cn.json`。

- `name` 当前为 `unicode-inspector-zh`，保留了原有名称部分；完整 ID 是 `<publisher>.unicode-inspector-zh`。英文界面显示 Unicode Inspector。
- 如需采用不带 `-zh` 的新 ID，应在首次发布前确定并调整 `name`。上架后保持 ID 稳定，便于用户获取更新。
- 有真实公开仓库时再添加 `repository`、`homepage`、`bugs`；当前没有填写虚构链接。若仓库保留本工程目录结构，可在 `repository` 中注明 `directory: "extension"`，并确认市场页面上的 README 链接正确。
- 当前版本 1.0.1 用于区分原始本地 1.0.0；后续更新使用递增版本号，并同步更新 CHANGELOG。
- 更改名称或版本后运行 `npm install --package-lock-only --ignore-scripts` 同步锁文件。

更换 publisher 后，完整扩展 ID 会改变。安装市场版本前卸载旧的 `local-tools.unicode-inspector-zh`，避免两个扩展同时产生诊断。现有 `unicodeInspector.*` 配置项名称不变。

## 3. 验证并生成最终包

在终端运行：

```sh
cd extension
npm ci --ignore-scripts
npm run package:release
```

`package:release` 先检查发布者，再运行测试和官方 vsce 打包。若仍是 `local-tools`，检查会失败。缺少仓库只会提示建议，不伪装成平台硬性要求。

尚未注册账号时，可用 `npm run package` 生成本地安装包；它显式允许暂缺 repository，不会联网发布。测试与开发文件不包含在 VSIX 内，源码、Unicode 数据和许可会包含。

最后在 VS Code 中通过「扩展 → … → 从 VSIX 安装…」安装**重新打出的最终包**。按 `DEVELOPMENT.md` 检查英文和中文界面、示例高亮、悬停、问题面板、下一处异常、禁用与超限提示；同时留意与内置高亮是否重复。不要上传仍带占位发布者的预览包。

## 4. 上传市场

在发布者管理页面选择新建 VS Code 扩展，上传最终 `.vsix`。核对发布者、名称、版本、图标和中英文说明后完成平台流程。

官方同时支持 `vsce publish` 和自动化认证；如选择命令行或 CI 发布，遵循当时有效的官方认证说明。本项目 CI 只验证并生成包，不配置凭据，也不自动发布。

资料：[官方发布说明](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)、[官方本地化机制](https://github.com/microsoft/vscode-l10n)。

## English release notes for maintainers

1. Create your own Marketplace publisher and set its actual ID in `package.json`.
2. Add real repository/support URLs when available; none are fabricated here.
3. Run `npm ci --ignore-scripts` and `npm run package:release` from `extension/`.
4. Install the final VSIX, verify both UI languages, and upload it through your publisher management page.

The checked-in `local-tools` publisher is only a local placeholder. Changing it changes the full extension ID; uninstall the local extension before using the Marketplace edition. No publishing credentials are included and no publish command has been executed.
