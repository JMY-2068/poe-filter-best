# POE Filter Best

**Path of Exile 过滤器文件编辑器** — 专为 `.filter` 文件设计的 VSCode 扩展。

提供语法高亮、智能补全、格式化、语法校验、代码片段、悬停提示、代码折叠、大纲导航、颜色预览、定义跳转、效果预览、Block 状态切换、BaseType 链接、参数选择器和音效试听，让编写 POE 过滤器就像写代码一样高效。

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

### 📑 大纲导航（v4 增强）

左侧大纲面板显示所有 block 结构：
- 图标前缀：👁 Show / 🚫 Hide / ⊘ 已禁用
- Section 分组：`# === 节名 ===` 自动创建文件夹分组
- 子符号展开：显示 Class、BaseType、颜色等条件详情
- 中文颜色名、光柱、音效等丰富摘要
- 点击即可跳转

### 🎨 颜色预览

`SetTextColor`/`SetBackgroundColor`/`SetBorderColor` 行显示内联颜色方块，点击可打开颜色选择器直接编辑。

### 🔍 定义跳转与引用

- **F12**：block 内任意行跳转到 Show/Hide 头行
- **Shift+F12**：查找所有同关键字行、同字符串值引用

### 👁 效果预览

每个 block 行尾显示「效果预览」标签，用该 block 的实际配色渲染，包含 MinimapIcon 形状符号。

### 🔄 Block 状态切换（v4 新增）

每个 block 上方显示可点击的 CodeLens 按钮，快速切换 4 种状态：

| 状态 | 效果 |
|------|------|
| 👁 显示(自定义) | Show + CustomAlertSound 生效 |
| 👁 显示(系统) | Show + PlayAlertSound 生效 |
| ⊘ 隐藏 | Hide + 视觉效果注释 |
| 🚫 禁用 | 整块注释 |

快捷键：`Ctrl+B Ctrl+T` 循环切换，`Ctrl+B Ctrl+S/Y/H/D` 直接切换。右键菜单也可操作。

### 📊 滚动条标记

滚动条显示绿色（Show）和红色（Hide）标记，一眼看清 block 分布。

### 🔗 BaseType 链接（v5 新增）

BaseType 行每个引号字符串自动下划线显示，Ctrl+Click 跳转编年史查看物品详情。
- POE1 过滤器 → poedb.tw（检测到 `Divination Cards`）
- POE2 过滤器 → poe2db.tw

### 🎛️ 参数选择器（v5 新增）

MinimapIcon 和 PlayEffect 行上方显示可点击按钮，打开候选列表直接选择参数值，无需手动输入。

### 🔊 音效试听（v5 新增）

CustomAlertSound 行上方显示试听按钮（音效文件存在时），点击用系统播放器播放。

### 📊 状态栏信息（v6 新增）

底部状态栏显示：
- POE 版本（POE1/POE2）— 自动检测
- Block 总数 — hover 显示 Show/Hide/Disabled 明细

### 🗂️ 大纲视图 inline 注释分组（v6 增强）

`Show # 一级 - 二级 - 三级` 格式的 inline 注释自动创建分层结构，分隔符可在设置中自定义。

### 🖥️ Block Explorer 面板（v6 新增）

左侧活动栏新增 Block Explorer 面板（Webview）：
- **左侧分类 tab** — 1 级分类图片 + 标题，点击切换
- **右侧内容区** — 2 级目录折叠 + block 预览
- **预览块** — 带实际配色的物品名标签 + 掉落图标 + 光柱图片
- **搜索框** — 固定顶部，实时过滤 block
- **点击跳转** — 点击预览块跳转到编辑器对应行
- **三档密度** — 紧凑/标准/宽松，可在设置中切换

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
| `Ctrl+B Ctrl+T` | 循环切换 block 状态 |
| `Ctrl+B Ctrl+S` | 显示(自定义音效) |
| `Ctrl+B Ctrl+Y` | 显示(系统音效) |
| `Ctrl+B Ctrl+H` | 隐藏 block |
| `Ctrl+B Ctrl+D` | 禁用 block |
| 编辑时 | 自动语法校验 |

## 📝 支持的语法

支持 Path of Exile 1 & 2 全部过滤器语法，包括：

- **条件**：ItemLevel、Rarity、Class、BaseType、HasExplicitMod、Sockets 等
- **动作**：SetTextColor、MinimapIcon、PlayEffect、PlayAlertSound 等
- **PoE2 专有**：IsVaalUnique、WaystoneTier、Uncut Skill Gems 等

## ⚙️ 配置

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `poe-filter-best.sectionSeparator` | ` - ` | 大纲/面板中 inline 注释的层级分隔符 |
| `poe-filter-best.panelDensity` | `comfortable` | Block Explorer 面板行间距：`compact` / `normal` / `comfortable` |

## 📄 许可

MIT License
