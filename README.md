# Unicode Inspector — 发布准备工程

VS Code 扩展，用于检查易混淆、不可见和异常 Unicode 字符，保留中文场景下的允许规则。英文默认界面，支持简体中文本地化；两种界面均支持简繁体和生僻汉字。

- [市场展示说明（中英文）](extension/readme.md)
- [发布指南](extension/PUBLISHING.md)
- [开发与测试](extension/DEVELOPMENT.md)
- [更新记录](extension/CHANGELOG.md)
- [本次验证记录](VALIDATION.md)

扩展源码根目录为 `extension/`。本工程基于解压后的 1.0.0 VSIX 整理；原始归档元数据保存在 `original-vsix-metadata/`，新包由官方 vsce 重新生成。

```sh
cd extension
npm ci --ignore-scripts
npm run check
npm run package
```

输出：`extension/unicode-inspector-zh-1.0.1.vsix`。可在 VS Code 中选择「从 VSIX 安装…」直接安装，无需解压。

**发布前还需注册自己的 Marketplace publisher，并替换 `extension/package.json` 中的 `local-tools`。** 随后运行 `npm run package:release` 生成最终包。当前尚未发布。
