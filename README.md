# 一乐过滤本地编辑增强

**Path of Exile 过滤器文件编辑增强插件** — 专为 `.filter` 文件设计的 VSCode 扩展。

一款适用于一乐过滤本地编辑的增强扩展插件,提供语法高亮,格式化,智能补全,语法校验,悬停提示,效果预览,批量改色等功能,大幅提升本地过滤编辑体验。

## 📋 过滤强化显示支持条件

左侧面板的强化显示（分类折叠、效果预览、快速定位）依赖 `Show` / `Hide` 行的 inline 注释格式。只需在行尾加 `#` 注释即可：

```
Show # 分类名 - 子分类 - 具体名称
    Class "Currency"
    SetTextColor 255 255 0
```

**格式规则：**

- `Show` 或 `Hide` 后加 `#`，空格分隔
- 用分隔符（默认 ` - `）划分层级，支持多级
- 层级分隔符可在扩展设置中自定义

**示例：**

```
Show # 通货 - 基础通货 - 神圣石
    Class "Currency"
    BaseType "Divine Orb"
    SetTextColor 255 255 0
    PlayEffect Yellow
    MinimapIcon 0 Yellow Star

Show # 通货 - 基础通货 - 混沌石
    Class "Currency"
    BaseType "Chaos Orb"
    SetTextColor 255 255 0

Show # 地图 - T16
    Class "Maps"
    MapTier >= 16
    SetTextColor 100 100 100

Hide # 低价值 - 白装
    Rarity Normal
    SetTextColor 150 150 150
```

左侧面板会自动按层级生成折叠树：`通货 → 基础通货 → 神圣石/混沌石`，`地图 → T16` 等，点击即可定位到对应过滤块。

> 没有 inline 注释的过滤块也能正常编辑，只是左侧面板不会显示分层结构。

## ✨ 使用截图

![我的过滤](https://filtereditor-1306253742.cos.ap-shanghai.myqcloud.com/assets/tool/我的过滤.webp)

![过滤编辑](https://filtereditor-1306253742.cos.ap-shanghai.myqcloud.com/assets/tool/过滤编辑.webp)

![批量改色](https://filtereditor-1306253742.cos.ap-shanghai.myqcloud.com/assets/tool/批量改色.webp)

![全局操作](https://filtereditor-1306253742.cos.ap-shanghai.myqcloud.com/assets/tool/全局操作.webp)

## ✨ 功能亮点

### 1. 🎨 编辑基础增强

- **格式化** — `Shift+Alt+F` 一键统一缩进、规范空格、整理注释
- **语法高亮** — 7 种颜色区分不同语法类型
- **语法提示** — 输入即触发智能补全，关键字、运算符、颜色、形状自动提示
- **悬停解释** — 鼠标悬停任意关键字，显示中文说明、语法格式、参数和可选值
- **语法校验** — 实时检查错误，红色波浪线提示未知关键字、参数错误、缩进问题

### 2. 📂 自动加载过滤文件

自动扫描检测 POE1 / POE2 游戏目录下的 `.filter` 文件：
- 按游戏分组展示：流放之路 / 流放之路 降临
- 显示文件名、大小、修改日期
- 点击文件名直接在编辑器中打开编辑

### 3. 🖥️ 编辑区效果预览

- **效果预览** — 每个 block 行尾显示实际配色渲染标签，包含图标形状
- **状态切换** — CodeLens 按钮快速切换：显示(自定义) / 显示(系统) / 隐藏 / 禁用
- **颜色编辑** — 行内颜色方块，点击打开颜色选择器直接修改
- **音效试听** — 自定义音效文件试听按钮

### 4. 📋 左侧面板强化显示

Block Explorer 面板提供可视化过滤管理：
- 1 级分类图片 + 2 级目录折叠展开
- 预览块带实际配色物品名标签 + 掉落图标 + 光柱图片
- 顶部搜索框实时过滤 block
- 点击预览块跳转到编辑器对应行定位

### 5. ⚡ 全局批量操作

- **音效版本切换** — 自定义/系统音效一键切换
- **全局字体** — 全文件 SetFontSize 统一 +1/-1（范围 12-45）
- **全局光柱** — 活跃 Show 块的 PlayEffect 一键开启/关闭

### 6. 🎨 批量改色

按配色组合批量修改过滤块颜色：
- 自动按文字色 + 背景色 + 边框色组合分组
- 色块展示实际配色效果
- 颜色选择器（RGB + 透明度）一键批量更新同组所有块
- 只改活跃过滤块，不改已禁用块

## 📦 安装

1. 在 VSCode 扩展市场搜索 **一乐过滤本地编辑增强**，或手动安装 `.vsix`
2. 打开任意 `.filter` 文件即可自动激活

## 🎮 使用

| 操作 | 说明 |
|------|------|
| 输入关键字 | 触发智能补全 |
| 鼠标悬停 | 显示关键字文档 |
| `Shift+Alt+F` | 格式化文档 |
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
