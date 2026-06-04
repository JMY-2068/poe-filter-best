# POE Filter Best

Path of Exile 过滤器文件（`.filter`）的 VSCode 扩展，提供语法高亮和格式化功能。

## 功能

### 语法高亮

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

### 格式化

- `Shift+Alt+F` 格式化整个文档
- 选区格式化
- 统一 4 空格缩进
- 关键词与参数间空格规范化
- 运算符（`>=` `<=` `==` `>` `<` `=` `!=`）前后空格
- 行内注释格式：`keyword value # 注释`
- 单行注释：`#` 顶格
- 注释掉的语法行原样保留
- 过滤块间空行分隔

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
├── language-configuration.json     # 语言配置（注释、折叠）
├── src/
│   ├── extension.ts                # 扩展入口
│   └── formatter.ts                # 格式化引擎
└── out/                            # 编译产物
```
