# POE Filter Best — 开发文档

Path of Exile 过滤器文件（`.filter`）的 VSCode 扩展，提供语法高亮、格式化、智能补全、语法校验、代码片段、悬停提示、代码折叠、大纲视图、颜色预览、定义跳转和效果预览。

## 功能

### 1. 语法高亮

根据语法分类提供 7 种不同颜色高亮：

| 分类 | 示例 | 说明 |
|------|------|------|
| 过滤块 | `Show` `Hide` | 块开头关键字 |
| 是否类 | `Corrupted` `Identified` `Mirrored` | True/False 条件 |
| 多选类 | `Rarity` `HasInfluence` | 多值匹配条件 |
| 数值类 | `ItemLevel` `GemLevel` `MapTier` | 数值范围条件，带运算符 |
| 数组类 | `Class` `BaseType` `Sockets` | 字符串匹配条件 |
| 词缀类 | `HasExplicitMod` `HasMod` | 词缀匹配条件 |
| 外观类 | `SetTextColor` `MinimapIcon` `PlayEffect` | 显示样式和音效设置 |

### 2. 格式化

- `Shift+Alt+F` 格式化整个文档
- 选区格式化
- 统一 4 空格缩进
- 关键词与参数间空格规范化
- 运算符（`>=` `<=` `==` `>` `<` `=` `!=`）前后空格
- 行内注释格式：`keyword value # 注释`
- 单行注释：`#` 顶格
- 注释掉的语法行原样保留
- 过滤块间空行分隔

### 3. 自动补全 / IntelliSense

- **Block 头**：行首输入补全 `Show`/`Hide`
- **关键字补全**：block 内输入补全所有条件/动作关键字，按分类排序
- **值补全**：
  - 布尔类 → `True`/`False`
  - 数值类 → 运算符 + 数字
  - 多选类 → 可选值列表
  - `Class` → 88 个物品类别（PoE1 + PoE2）
  - `MinimapIcon` → 11 色 × 12 形状
  - `PlayEffect` → 11 色
- 所有补全自动触发后续建议

### 4. 语法校验 / Diagnostics

实时检查：

- 未知关键字
- `Show`/`Hide` 必须在行首（不能缩进）
- 关键字不在 Show/Hide block 内
- block 内重复关键字
- 布尔类参数值错误
- 数值类缺少运算符或数字
- `plain-numeric`（如 `SetFontSize`）缺少数字
- 颜色参数数量或范围错误
- `MinimapIcon` 参数不足或 size 超出 0-2

### 5. 代码片段 / Snippets

15 个常用模板：

| 前缀 | 说明 |
|------|------|
| `show` / `hide` | 基本 Show/Hide block |
| `currency` | 通货高亮 block |
| `unique` | 传奇物品 block |
| `map` | 地图过滤 block |
| `divcard` | 命运卡 block |
| `gem` | 品质宝石 block |
| `rare` | 稀有物品 block |
| `6link` | 6连物品 block |
| `socketgroup` | 孔色组合 block |
| `color-gold` / `red` / `green` / `blue` | 配色预设 |
| `visual` | 完整视觉效果设置 |

### 6. 悬停提示 / Hover

鼠标悬停关键字显示中文描述、完整语法、参数说明、可选值和运算符列表。

### 7. 代码折叠 / Folding

- 每个 `Show`/`Hide` block 可折叠
- 连续注释块（2行以上）可折叠
- 折叠时自动去除尾部空行

### 8. 大纲视图 / Outline（v4 增强）

左侧大纲面板显示文档结构：

- 每个 block 显示图标 + 类型 + 关键条件摘要
  - 👁 Show（蓝色）/ 🚫 Hide（紫色）/ ⊘ 已禁用（灰色）
- **Section 分组**：`# === 节名 ===` 格式的注释自动创建 `📁` 文件夹分组
- **已禁用 block 识别**：`# Show` / `# Hide` 用 ⊘ 图标标识
- **丰富详情**：颜色中文色名、光柱、图标、音效信息
- **子符号**：每个 block 内关键条件作为可展开子节点
- 点击条目跳转到对应 block

打开方式：`查看` → `外观` → `大纲视图`

### 9. 颜色预览 / Color Preview

- `SetTextColor` / `SetBackgroundColor` / `SetBorderColor` 行显示内联颜色方块
- 点击颜色方块可打开颜色选择器直接编辑 RGB 值

### 10. 定义跳转 / Go to Definition

- **F12**（Go to Definition）：block 内任意行 → 跳转到所在 block 的 Show/Hide 头行
- **Shift+F12**（Find All References）：
  - 在 Show/Hide 上 → 列出所有 block header
  - 在关键字上 → 列出所有使用该关键字的行
  - 在引号字符串内 → 列出所有包含该字符串的位置

### 12. Block 状态切换 / Block Toggle（v4 新增）

每个 block 上方显示可点击的 CodeLens 按钮，快速切换 block 状态：

| 状态 | 效果 | 快捷键 |
|------|------|--------|
| 👁 显示(自定义) | Show + CustomAlertSound 生效, PlayAlertSound 注释 | `Ctrl+B Ctrl+S` |
| 👁 显示(系统) | Show + PlayAlertSound 生效, CustomAlertSound 注释 | `Ctrl+B Ctrl+Y` |
| ⊘ 隐藏 | Hide + 全部视觉效果注释 | `Ctrl+B Ctrl+H` |
| 🚫 禁用 | 整块 `# ` 注释 | `Ctrl+B Ctrl+D` |

Toggle 循环：`Ctrl+B Ctrl+T`（自定义 → 系统 → 隐藏 → 禁用 → 自定义）

注释格式：
- **Block 禁用**：`# ` + 原文（`# Show ...`, `#     Class ...`）
- **Visual 内联注释**：`#` + 6空格 + 内容（`#      PlayAlertSound 3 300`）

右键菜单也可操作：在 `.filter` 文件中右键选择对应命令。

### 13. 效果预览 / Filter Preview

每个 Show/Hide block 行尾显示「效果预览」标签：

- 文字颜色 = `SetTextColor`
- 背景颜色 = `SetBackgroundColor`
- 边框颜色 = `SetBorderColor`
- 如有 `MinimapIcon`，显示对应形状符号（●◆★▲ 等）

### 14. 滚动条标记 / Scrollbar Markers

滚动条左侧显示彩色标记：

- 🟢 绿色 = Show block
- 🔴 红色 = Hide block

### 15. BaseType 链接 / BaseType Links（v5 新增，v6 增强）

BaseType 行的每个引号字符串自动显示下划线：

- Ctrl+Click → 在浏览器打开编年史对应物品页面
- **POE1**（检测到 `Divination Cards`）→ `https://poedb.tw/cn/{物品英文名}`
- **POE2**（默认）→ `https://poe2db.tw/cn/{物品英文名}`
- Tooltip 显示物品名和站点

### 16. 参数选择器 / Parameter Pickers（v5 新增）

MinimapIcon 和 PlayEffect 行上方显示可点击按钮：

- MinimapIcon → `[📐 大小] [🎨 颜色] [⬡ 形状]`
- PlayEffect → `[🎨 颜色]`

点击打开 QuickPick 候选列表，选中自动填入/替换参数值。颜色带 emoji 预览 + 中文名，形状带中文名。

### 17. 音效试听 / Sound Preview（v5 新增）

CustomAlertSound 行上方显示 `🔊 试听` 按钮（仅当音效文件存在时）：

- 文件路径相对于 filter 文件目录解析
- 点击用系统默认播放器播放音效

### 18. 格式化增强（v5 改进）

- 禁用块（`# Show`/`# Hide`）识别为独立 block，块间自动加空行
- 连续单行注释保持紧凑排列，不加额外空行

### 19. 状态栏信息 / Status Bar（v6 新增）

底部状态栏显示当前 `.filter` 文件信息：

- **POE 版本**：自动检测（含 `Divination Cards` 为 POE1，否则 POE2）
- **Block 总数**：hover 显示 Show / Hide / Disabled 明细
- 非 `.filter` 文件时自动隐藏

### 20. 大纲视图 inline 注释分组（v6 增强）

`Show # 一级 - 二级 - 三级` 格式的 inline 注释自动创建分层结构：

- 按分隔符（默认 ` - `）拆分注释路径
- 每级路径创建 `📁` 文件夹节点，最后一个路径段作为 block 名称
- 无 inline 注释的 block 平铺显示
- 分隔符可通过 `poe-filter-best.sectionSeparator` 设置自定义

### 21. Block Explorer 面板 / Block Panel（v6 新增）

左侧活动栏新增 Webview 面板，提供丰富的 block 管理界面：

**左右分栏布局：**
- **左侧分类 tab**：1 级分类图片 + 标题，竖排排列
- **右侧内容区**：选中分类的 2 级目录折叠 + block 预览列表

**Block 预览块：**
- 带实际配色的物品名标签（文字色 + 背景色 + 边框色）
- 掉落图标（MinimapIcon）显示对应 PNG 图片
- 光柱（PlayEffect）显示对应 SVG 图标
- Show 绿色 / Hide 红色 / Disabled 灰色区分

**交互功能：**
- 搜索框固定顶部，实时过滤 block（自动展开匹配的目录）
- 点击预览块跳转到编辑器对应行
- 目录折叠/展开
- 文件切换自动刷新，编辑防抖刷新

**三档密度设置：**

| 密度 | 行高 | 字体 | 图标尺寸 |
|------|------|------|----------|
| compact | 20px | 11px | 12px |
| normal | 26px | 12px | 16px |
| comfortable（默认）| 32px | 13px | 20px |

可通过 `poe-filter-best.panelDensity` 设置切换。

**资源文件：**
- `resources/cats/*.webp` — 1 级分类图片（通货、装备、地图等）
- `resources/drop/icon_{Shape}{Color}.png` — MinimapIcon 掉落图标
- `resources/cross/cross-{Color}.svg` — PlayEffect 光柱图标

## 安装

1. 将 `poe-filter-best` 文件夹复制到 VSCode 扩展目录，或以开发模式加载
2. 打开任意 `.filter` 文件即可生效

## 开发

```bash
cd poe-filter-best
npm install
npm run compile    # 编译
npm run watch      # 监听编译
```

按 `F5` 启动扩展开发宿主进行调试。

## 项目结构

```
poe-filter-best/
├── package.json                    # 扩展配置
├── syntaxes/
│   └── poe-filter.tmLanguage.json  # 语法高亮规则
├── snippets/
│   └── poe-filter.json             # 代码片段
├── language-configuration.json     # 语言配置（注释、折叠）
├── src/
│   ├── extension.ts                # 扩展入口，注册所有 Provider
│   ├── data.ts                     # 关键字数据定义
│   ├── formatter.ts                # 格式化引擎
│   ├── completion.ts               # 自动补全 Provider
│   ├── diagnostics.ts              # 语法校验 Provider
│   ├── hover.ts                    # 悬停提示 Provider
│   ├── folding.ts                  # 代码折叠 Provider
│   ├── symbols.ts                  # 大纲视图 Provider
│   ├── colors.ts                   # 颜色预览 Provider
│   ├── definition.ts               # 定义跳转 + 引用 Provider
│   ├── decorations.ts              # 效果预览 + 滚动条标记
│   ├── blockToggle.ts              # Block 状态切换 (v4)
│   ├── codelens.ts                 # CodeLens 状态按钮 (v4)
│   ├── documentLinks.ts            # BaseType 链接 (v5)
│   ├── pickers.ts                  # 参数选择器 + 音效试听 (v5)
│   ├── statusBar.ts                # 状态栏信息 (v6)
│   ├── symbols.ts                  # 大纲视图 inline 分组 (v6)
│   └── panel.ts                    # Block Explorer Webview 面板 (v6)
├── resources/
│   ├── cats/*.webp                 # 1 级分类图片
│   ├── drop/*.png                  # 掉落图标
│   └── cross/*.svg                 # 光柱图标
└── out/                            # 编译产物
```

## 数据来源

关键字定义集中在 `src/data.ts`：

- `BLOCK_HEADERS` — Show/Hide 定义
- `KEYWORDS` — 所有条件/动作关键字定义
- `COMMON_CLASSES` — 88 个 Class 类别名（PoE1 + PoE2）
- `MINIMAP_COLORS` — 11 种小地图图标颜色
- `MINIMAP_SHAPES` — 12 种小地图图标形状
- `PLAY_EFFECT_COLORS` — 11 种光柱效果颜色

## 版本

- **0.1.0** — 初始版本：语法高亮 + 格式化
- **0.2.0** — 新增：自动补全、语法校验、代码片段、悬停提示
- **0.3.0** — 新增：代码折叠、大纲视图、颜色预览、定义跳转、效果预览、滚动条标记
- **0.4.0** — 新增：Block 状态切换（4态循环 + CodeLens 按钮）、大纲导航增强（分组/子符号/中文详情）
- **0.5.0** — 新增：BaseType 链接（Ctrl+Click 跳转编年史）、MinimapIcon/PlayEffect 参数选择器、CustomAlertSound 试听、格式化增强（禁用块空行、连续注释紧凑）
- **0.6.0** — 新增：BaseType 链接 POE1/POE2 自动判断、状态栏信息、大纲 inline 注释分组、Block Explorer Webview 面板（分类图片 + 图标/光柱预览 + 搜索 + 三档密度）
