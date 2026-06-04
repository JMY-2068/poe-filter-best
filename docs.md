# POE Filter Best — 开发文档

Path of Exile 过滤器文件（`.filter`）的 VSCode 扩展，提供语法高亮、格式化、智能补全、语法校验、代码片段和悬停提示。

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
│   └── hover.ts                    # 悬停提示 Provider
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
