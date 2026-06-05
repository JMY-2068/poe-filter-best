# Change Log

## 0.8.0

### 新增

- **我的过滤 Tab** — 左侧面板第三个 tab，自动管理过滤文件
  - 自动扫描 POE1 / POE2 游戏目录（`Documents/My Games/Path of Exile/`、`Path of Exile 2/`）下的 `.filter` 文件
  - 按游戏分组展示：流放之路 (Path of Exile) / 流放之路 降临 (Path of Exile 2)
  - 显示文件名、文件大小、修改日期
  - 点击文件名在编辑器中打开
  - 删除文件（带确认弹窗）
  - 刷新按钮重新扫描目录
  - 未找到文件时显示友好提示

## 0.7.0

### 新增

- Title bar 音效切换图标（editor/title + SVG 图标）
- 音效切换逻辑 — CustomAlertSound ↔ PlayAlertSound 全局切换
- 左侧面板三 tab 重构：过滤编辑 / 全局操作 / 我的过滤
- 全局操作 tab — 音效切换、全局字体 +1/-1（范围 12-45）、全局光柱开关
- 分栏独立滚动 — 左侧一级分类固定，右侧二级内容独立滚动
- 禁用块预览修复 — decorations 和 panel 均正确解析禁用块内颜色
- Block 定位改为 AtTop

## 0.6.0

### 新增

- BaseType 链接 POE1/POE2 自动判断
- 状态栏信息（POE 版本 + Block 数量）
- 大纲视图 inline 注释分组
- Webview 左侧面板（Block Explorer）
- 扩展设置：`sectionSeparator`、`panelDensity`

## 0.5.0

### 新增

- BaseType 链接 — Ctrl+Click 跳转 poe2db/poedb
- 状态栏信息
- 参数选择器 — MinimapIcon / PlayEffect 候选列表
- 音效试听按钮

## 0.4.0

### 新增

- Block 状态切换 — Show/Hide/Disable + CodeLens 按钮
- 滚动条标记 — 绿色 Show / 红色 Hide
- 效果预览标签
- 快捷键绑定

## 0.1.0

### 初始版本

- 语法高亮
- 智能补全
- 悬停文档
- 语法校验
- 代码片段
- 格式化
- 代码折叠
- 颜色预览与选取
- 定义跳转与引用
