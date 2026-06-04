# POE Filter Best

**Path of Exile 过滤器文件编辑器** — 专为 `.filter` 文件设计的 VSCode 扩展。

提供语法高亮、智能补全、格式化、语法校验、代码片段、悬停提示、代码折叠、大纲导航、颜色预览、定义跳转和效果预览，让编写 POE 过滤器就像写代码一样高效。

## ✨ 功能亮点

### 🎨 语法高亮

7 种颜色区分不同语法类型：过滤块、是否类、多选类、数值类、数组类、词缀类、外观类。

### 🧠 智能补全

输入即提示，上下文感知：

- `Show`/`Hide` 块头自动补全
- 所有条件关键字按分类排序提示
- 布尔值 `True`/`False`、运算符、颜色、形状自动补全
- `Class` 支持 88 个物品类别（PoE1 + PoE2）

### ✅ 实时语法校验

编辑时自动检查错误，红色波浪线提示：

- 未知关键字、关键字不在 block 内、重复定义
- 参数类型错误、缺少必要参数
- Show/Hide 缩进错误

### 📋 代码片段

15 个常用模板，输入前缀快速插入：通货高亮、传奇物品、地图过滤、6连检测、配色预设等。

### 📖 悬停文档

鼠标悬停任意关键字，显示中文说明、语法格式、参数和可选值。

### 📐 格式化

`Shift+Alt+F` 一键格式化：统一缩进、规范空格、整理注释、合并空行。

### 📁 代码折叠

每个 `Show`/`Hide` block 可折叠收起，连续注释块也可折叠，轻松管理大型 filter 文件。

### 📑 大纲导航

左侧大纲面板显示所有 block 结构，包含类型和关键条件摘要，点击即可跳转。

### 🎨 颜色预览

`SetTextColor`/`SetBackgroundColor`/`SetBorderColor` 行显示内联颜色方块，点击可打开颜色选择器直接编辑。

### 🔍 定义跳转与引用

- **F12**：block 内任意行跳转到 Show/Hide 头行
- **Shift+F12**：查找所有同关键字行、同字符串值引用

### 👁 效果预览

每个 block 行尾显示「效果预览」标签，用该 block 的实际配色渲染，包含 MinimapIcon 形状符号。

### 📊 滚动条标记

滚动条显示绿色（Show）和红色（Hide）标记，一眼看清 block 分布。

## 📦 安装

1. 在 VSCode 扩展市场搜索 **POE Filter Best**，或手动安装 `.vsix`
2. 打开任意 `.filter` 文件即可自动激活

## 🎮 使用

| 操作 | 说明 |
|------|------|
| 输入关键字 | 触发智能补全 |
| 鼠标悬停 | 显示关键字文档 |
| `Shift+Alt+F` | 格式化文档 |
| 输入片段前缀 | 插入代码片段 |
| `F12` | 跳转到 block 头行 |
| `Shift+F12` | 查找所有引用 |
| 编辑时 | 自动语法校验 |

## 📝 支持的语法

支持 Path of Exile 1 & 2 全部过滤器语法，包括：

- **条件**：ItemLevel、Rarity、Class、BaseType、HasExplicitMod、Sockets 等
- **动作**：SetTextColor、MinimapIcon、PlayEffect、PlayAlertSound 等
- **PoE2 专有**：IsVaalUnique、WaystoneTier、Uncut Skill Gems 等

## ⚙️ 配置

无需额外配置，安装即用。

## 📄 许可

MIT License

---

# POE Filter Best

**Path of Exile Loot Filter Editor** — A VSCode extension built for `.filter` files.

Provides syntax highlighting, intelligent completion, formatting, diagnostics, snippets, hover docs, folding, outline navigation, color preview, go-to-definition, and filter preview — making POE loot filter editing as efficient as writing code.

## ✨ Features

### 🎨 Syntax Highlighting

7 color-coded syntax categories: Block headers, Boolean conditions, Multi-select conditions, Numeric conditions, Array conditions, Mod conditions, and Visual actions.

### 🧠 Intelligent Completion

Context-aware autocomplete:

- `Show`/`Hide` block header completion
- All condition/action keywords, sorted by category
- Boolean `True`/`False`, operators, colors, and shapes
- `Class` supports 88 item classes (PoE1 + PoE2)

### ✅ Real-time Diagnostics

Automatic error checking with squiggly lines:

- Unknown keywords, keywords outside block, duplicate definitions
- Parameter type errors, missing required parameters
- Show/Hide indentation errors

### 📋 Snippets

15 commonly used templates: currency highlighting, unique items, map filtering, 6-link detection, color presets, and more.

### 📖 Hover Documentation

Hover over any keyword to see description, syntax, parameters, and valid values.

### 📐 Formatting

`Shift+Alt+F` to format: normalize indentation, spacing, comments, and blank lines.

### 📁 Code Folding

Fold any `Show`/`Hide` block or consecutive comment groups — manage large filter files with ease.

### 📑 Outline Navigation

The outline panel shows all blocks with type and key condition summaries. Click to navigate.

### 🎨 Color Preview

Inline color boxes for `SetTextColor`/`SetBackgroundColor`/`SetBorderColor`. Click to open a color picker.

### 🔍 Go to Definition & References

- **F12**: Jump from any line inside a block to its Show/Hide header
- **Shift+F12**: Find all lines with the same keyword or quoted string value

### 👁 Filter Preview

A preview tag at the end of each block header, rendered with the block's actual colors and MinimapIcon shape symbol.

### 📊 Scrollbar Markers

Green markers for Show blocks, red for Hide blocks — see the block layout at a glance.

## 📦 Installation

1. Search for **POE Filter Best** in the VSCode Extensions Marketplace, or install `.vsix` manually
2. Open any `.filter` file to activate

## 🎮 Usage

| Action | Description |
|--------|-------------|
| Type a keyword | Triggers autocomplete |
| Hover over keyword | Shows documentation |
| `Shift+Alt+F` | Format document |
| Type snippet prefix | Insert snippet |
| `F12` | Go to block header |
| `Shift+F12` | Find all references |
| While editing | Auto diagnostics |

## 📝 Supported Syntax

Full support for Path of Exile 1 & 2 loot filter syntax:

- **Conditions**: ItemLevel, Rarity, Class, BaseType, HasExplicitMod, Sockets, etc.
- **Actions**: SetTextColor, MinimapIcon, PlayEffect, PlayAlertSound, etc.
- **PoE2 exclusive**: IsVaalUnique, WaystoneTier, Uncut Skill Gems, etc.

## ⚙️ Configuration

Zero configuration required — install and start editing.

## 📄 License

MIT License
