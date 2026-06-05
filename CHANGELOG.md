# Change Log

## [0.6.0] - 2026-06-05

### Added
- **BaseType 链接 POE1/POE2 自动判断** — 含 `Divination Cards` 跳 poedb.tw，否则跳 poe2db.tw
- **状态栏信息** — 底部显示 POE 版本（POE1/POE2）+ Block 总数（Show/Hide/Disabled 明细）
- **大纲视图 inline 注释分组** — `Show # 一级 - 二级 - 三级` 格式自动分层，分隔符可配置
- **Webview 左侧面板 Block Explorer** — 活动栏图标，左右分栏布局
  - 左侧：1 级分类图片 + 标题 tab
  - 右侧：2 级目录折叠 + block 预览（颜色/图标/光柱）
  - 掉落图标（MinimapIcon）+ 光柱（PlayEffect）图片预览
  - 搜索框过滤 + 点击跳转编辑器
  - 三档密度设置（紧凑/标准/宽松）
- **扩展设置** — `sectionSeparator`（层级分隔符）、`panelDensity`（面板密度）

## [0.5.0] - 2026-06-04

### Added
- **BaseType 链接** — BaseType 行引号字符串自动下划线，Ctrl+Click 跳转 poe2db.tw 编年史
- **参数选择器** — MinimapIcon/PlayEffect 行上方 CodeLens 按钮，QuickPick 选择大小/颜色/形状
- **音效试听** — CustomAlertSound 行文件存在时显示 🔊 试听按钮，点击播放

### Fixed
- **格式化** — 禁用块（`# Show`/`# Hide`）识别为独立 block，块间自动加空行
- **格式化** — 连续单行注释保持紧凑排列，不再插入额外空行

## [0.4.0] - 2026-06-04

### Added
- **Block 状态切换** — 4 态循环（自定义音效 → 系统音效 → 隐藏 → 禁用），CodeLens 按钮 + 快捷键 + 右键菜单
- **大纲导航增强** — Section 分组、已禁用 block ⊘ 图标、子符号展开、中文颜色/光柱/音效详情

## [0.3.0] - 2026-06-04

### Added
- 代码折叠（block + 注释组）
- 大纲视图 / Document Symbols
- 颜色预览 + 颜色选择器
- 定义跳转（F12）+ 查找引用（Shift+F12）
- 效果预览（行尾配色标签）
- 滚动条标记（绿色 Show / 红色 Hide）

## [0.2.0] - 2026-06-04

### Added
- 语法高亮（7 种颜色分类）
- 文档格式化 + 选区格式化
- 自动补全 / IntelliSense
- 实时语法校验 / Diagnostics
- 代码片段（15 个常用模板）
- 悬停提示（中文文档）

## [0.1.0] - 2023-11-20

### Added
- 初始版本：语法高亮 + 格式化
