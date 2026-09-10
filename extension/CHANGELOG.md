# Changelog

## 1.0.1

- Add English and Simplified Chinese localization for commands, settings, diagnostics, hover explanations, pickers, and status messages.
- Preserve Chinese-aware Unicode 17.0.0 coverage across both interface languages.
- Decouple diagnostic severity from translated text and resolve the settings page using the installed extension ID.
- Report disabled inspection accurately and identify unpaired UTF-16 surrogates.
- Tighten decomposed pinyin checks and bound processing of long combining-mark sequences.
- Add regression tests, packaging configuration, a Marketplace icon, and bilingual documentation.

## 1.0.0

- Initial local VSIX with Chinese-aware inspection, Unicode 17.0.0 data, hover explanations, and document diagnostics.
