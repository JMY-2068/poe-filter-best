import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * Webview View — POE Filter Block Explorer
 *
 * Left-side panel showing filter blocks with:
 * - Section grouping (by inline comment path)
 * - Color preview bars (text/bg/border)
 * - Click-to-navigate
 * - Search filter
 */

// ── Block data ────────────────────────────────────────────────────────

interface ColorRGB { r: number; g: number; b: number; }

interface PanelBlock {
  startLine: number;
  endLine: number;
  blockType: string;
  disabled: boolean;
  state: 'show-custom' | 'show-system' | 'hide' | 'disabled';
  comment: string;
  summary: string[];
  textColor: ColorRGB | null;
  bgColor: ColorRGB | null;
  borderColor: ColorRGB | null;
  fontSize: number | null;
  minimapIcon: string;
  playEffect: string;
}

// ── File info for "My Filters" tab ────────────────────────────────────

interface FileInfo {
  name: string;
  filePath: string;
  size: number;
  modified: Date;
  game: 'POE1' | 'POE2';
}

// ── Provider ──────────────────────────────────────────────────────────

export class PoeFilterPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'poe-filter-best.blockPanel';

  private view: vscode.WebviewView | undefined;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private currentFilterFiles: FileInfo[] = [];

  constructor(private readonly extContext: vscode.ExtensionContext) {
    // Refresh on editor switch
    this.extContext.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(() => this.refresh())
    );
    // Refresh on text change (debounced)
    this.extContext.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(() => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.refresh(), 500);
      })
    );
  }

  resolveWebviewView(
    view: vscode.WebviewView,
    _resolveContext: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = view;

    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(
          path.join(this.extContext.extensionPath, 'resources', 'cats')
        ),
        vscode.Uri.file(
          path.join(this.extContext.extensionPath, 'resources', 'drop')
        ),
        vscode.Uri.file(
          path.join(this.extContext.extensionPath, 'resources', 'cross')
        ),
      ],
    };

    view.webview.onDidReceiveMessage(async msg => {
      if (msg.type === 'goToBlock' && typeof msg.line === 'number') {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const pos = new vscode.Position(msg.line, 0);
          editor.selection = new vscode.Selection(pos, pos);
          editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.AtTop);
        }
      } else if (msg.type === 'toggleSound') {
        vscode.commands.executeCommand('poe-filter-best.toggleSoundMode');
      } else if (msg.type === 'runCmd' && msg.cmd) {
        vscode.commands.executeCommand(msg.cmd);
      } else if (msg.type === 'toggleBlock' && typeof msg.line === 'number' && msg.state) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const pos = new vscode.Position(msg.line, 0);
          editor.selection = new vscode.Selection(pos, pos);
          editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.AtTop);
          const cmdMap: Record<string, string> = {
            'show-custom': 'poe-filter-best.showBlockCustom',
            'show-system': 'poe-filter-best.showBlockSystem',
            'hide': 'poe-filter-best.hideBlock',
            'disabled': 'poe-filter-best.disableBlock',
          };
          vscode.commands.executeCommand(cmdMap[msg.state]);
        }
      } else if (msg.type === 'openFile' && msg.path) {
        const doc = await vscode.workspace.openTextDocument(msg.path);
        await vscode.window.showTextDocument(doc);
      } else if (msg.type === 'refreshFiles') {
        this.refreshMyFilter();
      } else if (msg.type === 'deleteFile' && msg.path) {
        const name = path.basename(msg.path);
        const confirm = await vscode.window.showWarningMessage(
          `确定删除 "${name}"？此操作不可撤销。`, { modal: true }, '删除'
        );
        if (confirm === '删除') {
          try {
            fs.unlinkSync(msg.path);
            this.refreshMyFilter();
          } catch (e) {
            vscode.window.showErrorMessage(`删除失败: ${(e as Error).message}`);
          }
        }
      }
    });

    this.refresh();
  }

  private refresh(): void {
    if (!this.view) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'poe-filter') {
      this.view.webview.html = this.renderEmpty();
      return;
    }

    const separator = vscode.workspace
      .getConfiguration('poe-filter-best')
      .get<string>('sectionSeparator', ' - ');

    const blocks = this.parseBlocks(editor.document);
    this.currentFilterFiles = this.scanFilterFiles();
    this.view.webview.html = this.renderHtml(blocks, separator, this.view.webview);
  }

  private scanFilterFiles(): FileInfo[] {
    const home = os.homedir();
    const dirs: { dir: string; game: 'POE1' | 'POE2' }[] = [
      { dir: path.join(home, 'Documents', 'My Games', 'Path of Exile'), game: 'POE1' },
      { dir: path.join(home, 'Documents', 'My Games', 'Path of Exile 2'), game: 'POE2' },
    ];
    const files: FileInfo[] = [];
    for (const { dir, game } of dirs) {
      if (!fs.existsSync(dir)) continue;
      try {
        const entries = fs.readdirSync(dir);
        for (const name of entries) {
          if (!name.endsWith('.filter')) continue;
          const fp = path.join(dir, name);
          try {
            const stat = fs.statSync(fp);
            if (!stat.isFile()) continue;
            files.push({ name, filePath: fp, size: stat.size, modified: stat.mtime, game });
          } catch { /* skip unreadable */ }
        }
      } catch { /* skip unreadable dir */ }
    }
    return files;
  }

  private refreshMyFilter(): void {
    this.currentFilterFiles = this.scanFilterFiles();
    if (!this.view) return;
    // Re-render current state by refreshing
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'poe-filter') {
      this.view.webview.html = this.renderEmpty();
      return;
    }
    const separator = vscode.workspace
      .getConfiguration('poe-filter-best')
      .get<string>('sectionSeparator', ' - ');
    const blocks = this.parseBlocks(editor.document);
    this.view.webview.html = this.renderHtml(blocks, separator, this.view.webview);
  }

  // ── Block parsing ────────────────────────────────────────────────

  private parseBlocks(document: vscode.TextDocument): PanelBlock[] {
    const blocks: PanelBlock[] = [];
    let blockStart = -1;
    let blockType = '';
    let blockDisabled = false;
    let blockComment = '';
    let blockSummary: string[] = [];
    let textColor: ColorRGB | null = null;
    let bgColor: ColorRGB | null = null;
    let borderColor: ColorRGB | null = null;
    let fontSize: number | null = null;
    let minimapIcon = '';
    let playEffect = '';
    let hasCustomActive = false;
    let hasSystemActive = false;

    const SUMMARY_KW = ['Class', 'BaseType', 'Rarity', 'ItemLevel', 'MapTier', 'WaystoneTier'];

    const flush = (endLine: number) => {
      if (blockStart < 0) return;
      let end = endLine;
      while (end > blockStart && document.lineAt(end).text.trim() === '') end--;
      let state: PanelBlock['state'];
      if (blockDisabled) {
        state = 'disabled';
      } else if (blockType === 'Hide') {
        state = 'hide';
      } else if (hasSystemActive && !hasCustomActive) {
        state = 'show-system';
      } else {
        state = 'show-custom';
      }
      blocks.push({
        startLine: blockStart, endLine: end, blockType, disabled: blockDisabled, state,
        comment: blockComment, summary: [...blockSummary],
        textColor, bgColor, borderColor, fontSize, minimapIcon, playEffect,
      });
      blockStart = -1;
      textColor = bgColor = borderColor = null;
      fontSize = null;
      minimapIcon = '';
      playEffect = '';
      hasCustomActive = false;
      hasSystemActive = false;
    };

    for (let i = 0; i < document.lineCount; i++) {
      const text = document.lineAt(i).text;
      const trimmed = text.trim();

      // Disabled header
      const disM = trimmed.match(/^#\s*(Show|Hide)\b/i);
      if (disM) {
        flush(i - 1);
        blockStart = i;
        blockType = cap(disM[1]);
        blockDisabled = true;
        blockComment = extractComment(trimmed, disM[0].length);
        blockSummary = [];
        continue;
      }

      // Comment line outside block
      if (trimmed.startsWith('#') && blockStart < 0) continue;

      if (trimmed === '') continue;

      // Active header
      const hdrM = trimmed.match(/^(Show|Hide)\b/i);
      if (hdrM) {
        flush(i - 1);
        blockStart = i;
        blockType = cap(hdrM[1]);
        blockDisabled = false;
        blockComment = extractComment(trimmed, hdrM[0].length);
        blockSummary = [];
        continue;
      }

      // Inside block
      if (blockStart >= 0) {
        let content = stripComment(trimmed);
        // For disabled blocks, strip the "# " prefix to parse inner content
        if (!content && blockDisabled && trimmed.startsWith('#')) {
          content = trimmed.replace(/^#\s+/, '');
        }
        if (!content) continue;
        const kwM = content.match(/^(\w+)/);
        if (!kwM) continue;
        const kw = kwM[1];

        if (SUMMARY_KW.includes(kw)) {
          const after = content.substring(kw.length).trim();
          if (after) blockSummary.push(`${kw} ${after}`);
        }

        const cm = content.match(/^SetTextColor\s+(\d+)\s+(\d+)\s+(\d+)/i);
        if (cm) { textColor = { r: +cm[1], g: +cm[2], b: +cm[3] }; continue; }
        const bm = content.match(/^SetBackgroundColor\s+(\d+)\s+(\d+)\s+(\d+)/i);
        if (bm) { bgColor = { r: +bm[1], g: +bm[2], b: +bm[3] }; continue; }
        const brm = content.match(/^SetBorderColor\s+(\d+)\s+(\d+)\s+(\d+)/i);
        if (brm) { borderColor = { r: +brm[1], g: +brm[2], b: +brm[3] }; continue; }
        const fm = content.match(/^SetFontSize\s+(\d+)/i);
        if (fm) { fontSize = +fm[1]; continue; }
        const im = content.match(/^MinimapIcon\s+(.+)/i);
        if (im) { minimapIcon = im[1].trim(); continue; }
        const em = content.match(/^PlayEffect\s+(.+)/i);
        if (em) { playEffect = em[1].trim(); continue; }
        // Track sound state (only active, non-commented lines)
        if (!blockDisabled && !trimmed.startsWith('#')) {
          if (/^CustomAlertSound\b/i.test(content)) hasCustomActive = true;
          if (/^PlayAlertSound\b/i.test(content)) hasSystemActive = true;
        }
      }
    }

    flush(document.lineCount - 1);
    return blocks;
  }

  // ── HTML rendering ───────────────────────────────────────────────

  private renderEmpty(): string {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>${baseCss('normal')}</style></head>
      <body><div class="empty">打开 .filter 文件查看 Block 列表</div></body></html>`;
  }

  private renderHtml(blocks: PanelBlock[], separator: string, webview: vscode.Webview): string {
    const hasSections = blocks.some(b => b.comment.length > 0);
    const density = vscode.workspace
      .getConfiguration('poe-filter-best')
      .get<string>('panelDensity', 'comfortable');
    let body = '';

    if (hasSections) {
      body = renderSectionTree(blocks, separator, webview, this.extContext.extensionPath);
    } else {
      body = '<div class="tree">' + blocks.map(b => renderBlock(b, separator, 0, webview, this.extContext.extensionPath)).join('') + '</div>';
    }

    // Detect current sound mode
    const editor = vscode.window.activeTextEditor;
    const soundMode = editor ? this.detectSoundMode(editor.document) : 'custom';

    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>${baseCss(density)}</style></head>
      <body>
        <div class="tab-bar">
          <div class="tab active" data-tab="editor" onclick="switchTab('editor')">过滤编辑</div>
          <div class="tab" data-tab="global" onclick="switchTab('global')">全局操作</div>
          <div class="tab" data-tab="myfilter" onclick="switchTab('myfilter')">我的过滤</div>
        </div>
        <div class="tab-content" id="tab-editor">
          <div class="search-wrap">
            <input class="search" id="search" placeholder="搜索 Block..." />
          </div>
          <div id="content">${body}</div>
        </div>
        <div class="tab-content" id="tab-global" style="display:none">
          <div class="section-title">音效模式</div>
          <div class="sound-mode-current">当前：${soundMode === 'custom' ? '自定义音效' : '系统音效'}</div>
          <div class="sound-actions">
            <div class="sound-btn" onclick="toggleSound()">切换自定义音效/系统音效</div>
          </div>
          <div class="section-title">字体大小</div>
          <div class="sound-actions" style="flex-direction: row;">
            <div class="sound-btn" style="flex:1" onclick="runCmd('poe-filter-best.fontSizeUp')">字体 +1</div>
            <div class="sound-btn" style="flex:1" onclick="runCmd('poe-filter-best.fontSizeDown')">字体 -1</div>
          </div>
          <div class="section-title">光柱效果</div>
          <div class="sound-actions">
            <div class="sound-btn" onclick="runCmd('poe-filter-best.togglePlayEffect')">开启/关闭光柱</div>
          </div>
        </div>
        <div class="tab-content" id="tab-myfilter" style="display:none">
          ${this.renderMyFilterHtml()}
        </div>
        <script>${panelScript()}</script>
      </body></html>`;
  }

  private renderMyFilterHtml(): string {
    const files = this.currentFilterFiles;
    if (files.length === 0) {
      return `<div class="empty">未找到 .filter 文件<br/><span style="font-size:11px">POE 目录：~/Documents/My Games/Path of Exile/</span></div>
        <div style="padding:0 12px"><div class="sound-btn" onclick="refreshFiles()">刷新</div></div>`;
    }

    // Group by game
    const poe1 = files.filter(f => f.game === 'POE1');
    const poe2 = files.filter(f => f.game === 'POE2');

    let html = `<div style="padding:6px 8px"><div class="sound-btn" onclick="refreshFiles()">⟳ 刷新</div></div>`;

    if (poe1.length > 0) {
      html += `<div class="game-header">流放之路 <span class="game-sub">Path of Exile</span></div>`;
      html += poe1.map(f => this.renderFileItem(f)).join('');
    }
    if (poe2.length > 0) {
      html += `<div class="game-header">流放之路 降临 <span class="game-sub">Path of Exile 2</span></div>`;
      html += poe2.map(f => this.renderFileItem(f)).join('');
    }

    return html;
  }

  private renderFileItem(f: FileInfo): string {
    const sizeStr = f.size < 1024 ? `${f.size} B` : `${(f.size / 1024).toFixed(1)} KB`;
    const dateStr = f.modified.toLocaleDateString();
    const ep = esc(f.filePath);
    return `<div class="file-item" data-path="${ep}">
      <div class="file-info" onclick="openFile(this.parentElement.dataset.path)">
        <div class="file-name">${esc(f.name)}</div>
        <div class="file-meta">${sizeStr} · ${dateStr}</div>
      </div>
      <div class="file-actions">
        <span class="file-btn file-btn-danger" onclick="deleteFile(this.closest('.file-item').dataset.path)" title="删除">🗑</span>
      </div>
    </div>`;
  }

  private detectSoundMode(doc: vscode.TextDocument): 'custom' | 'system' {
    for (let i = 0; i < doc.lineCount; i++) {
      const trimmed = doc.lineAt(i).text.trim();
      if (/^CustomAlertSound\b/i.test(trimmed)) return 'custom';
      if (/^PlayAlertSound\b/i.test(trimmed)) return 'system';
    }
    return 'custom';
  }
}

// ── HTML helpers ──────────────────────────────────────────────────────

// Tree node for building section hierarchy
interface SectionNode {
  name: string;
  children: Map<string, SectionNode>;
  blocks: PanelBlock[];
}

function catImgUrl(catName: string, webview: vscode.Webview, extPath: string): string | null {
  const imgPath = path.join(extPath, 'resources', 'cats', `${catName}.webp`);
  // Check if file exists is tricky in webview context; just build URI
  const uri = vscode.Uri.file(imgPath);
  return webview.asWebviewUri(uri).toString();
}

function renderSectionTree(blocks: PanelBlock[], sep: string, webview: vscode.Webview, extPath: string): string {
  // Build tree: sections are parts[0..n-2], block name is parts[n-1]
  const root: SectionNode = { name: '', children: new Map(), blocks: [] };

  for (const b of blocks) {
    if (b.comment.length === 0) {
      root.blocks.push(b);
      continue;
    }
    const parts = b.comment.split(sep).map(s => s.trim()).filter(s => s);
    if (parts.length === 0) {
      root.blocks.push(b);
      continue;
    }

    let node = root;
    const sectionParts = parts.slice(0, -1);
    for (const part of sectionParts) {
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, children: new Map(), blocks: [] });
      }
      node = node.children.get(part)!;
    }
    node.blocks.push(b);
  }

  // No categories — flat list
  if (root.children.size === 0) {
    let html = '<div class="flat-list">';
    for (const b of root.blocks) {
      html += renderBlock(b, sep, 0, webview, extPath);
    }
    html += '</div>';
    return html;
  }

  // Two-column layout: left = category tabs, right = content
  let html = '<div class="split-layout">';

  // Left column: category tabs with images
  html += '<div class="cat-tabs">';
  let first = true;
  for (const [, child] of root.children) {
    const id = cssId(child.name);
    const imgUrl = catImgUrl(child.name, webview, extPath);
    html += `<div class="cat-tab${first ? ' active' : ''}" data-cat="${id}" onclick="selectCat('${id}')">`;
    if (imgUrl) {
      html += `<img class="cat-img" src="${imgUrl}" alt="${esc(child.name)}" />`;
    }
    html += `<span class="cat-label">${esc(child.name)}</span>`;
    html += '</div>';
    first = false;
  }
  html += '</div>';

  // Right column: category content panels
  html += '<div class="cat-content">';
  first = true;
  for (const [, child] of root.children) {
    const id = cssId(child.name);
    html += `<div class="cat-panel" id="panel-${id}" style="display:${first ? 'block' : 'none'}">`;
    html += renderNodeContent(child, sep, 0, webview, extPath);
    html += '</div>';
    first = false;
  }

  // Ungrouped blocks in a panel
  if (root.blocks.length > 0) {
    html += `<div class="cat-panel" id="panel-__ungrouped__" style="display:none">`;
    for (const b of root.blocks) {
      html += renderBlock(b, sep, 0, webview, extPath);
    }
    html += '</div>';
  }

  html += '</div></div>';

  return html;
}

function cssId(name: string): string {
  return name.replace(/[^a-zA-Z0-9一-鿿]/g, '_');
}

function renderNodeContent(node: SectionNode, sep: string, depth: number, webview: vscode.Webview, extPath: string): string {
  let html = '';

  // Render blocks in this section
  for (const b of node.blocks) {
    html += renderBlock(b, sep, depth, webview, extPath);
  }

  // Render child sections
  for (const [, child] of node.children) {
    const hasChildren = child.children.size > 0 || child.blocks.length > 0;
    if (!hasChildren) continue;

    html += `<div class="section">`;
    html += `<div class="section-header" onclick="toggleSection(this)" style="padding-left:${depth * 16 + 8}px">`;
    html += `<span class="arrow">▸</span> ${esc(child.name)}`;
    html += `</div>`;
    html += `<div class="section-body">`;
    html += renderNodeContent(child, sep, depth + 1, webview, extPath);
    html += `</div></div>`;
  }

  return html;
}

function renderBlock(b: PanelBlock, sep: string, depth = 0, webview?: vscode.Webview, extPath?: string): string {
  const typeClass = b.disabled ? 'disabled' : (b.blockType === 'Show' ? 'show' : 'hide');
  const typeIcon = b.disabled ? '⊘' : (b.blockType === 'Show' ? '👁' : '🚫');

  // Display name: last segment of comment, or summary
  let name = '';
  if (b.comment.length > 0) {
    const parts = b.comment.split(sep).map(s => s.trim()).filter(s => s);
    name = parts.length > 0 ? parts[parts.length - 1] : '';
  }
  if (!name && b.summary.length > 0) {
    name = b.summary.slice(0, 2).join(', ');
  }
  if (!name) {
    name = b.blockType;
  }

  // Preview label with actual colors
  let preview = '';
  if (true) {
    const fg = b.textColor ? `rgb(${b.textColor.r},${b.textColor.g},${b.textColor.b})` : 'rgb(200,200,200)';
    const bg = b.bgColor ? `rgb(${b.bgColor.r},${b.bgColor.g},${b.bgColor.b})` : 'rgb(30,30,30)';
    const border = b.borderColor ? `2px solid rgb(${b.borderColor.r},${b.borderColor.g},${b.borderColor.b})` : '2px solid rgb(80,80,80)';
    preview = `<span class="preview" style="color:${fg};background:${bg};border:${border}">${esc(name)}</span>`;
  }

  // MinimapIcon: "0 Red Circle" → icon_CircleRed.png
  let iconImg = '';
  if (b.minimapIcon && webview && extPath) {
    const iconParts = b.minimapIcon.trim().split(/\s+/);
    if (iconParts.length >= 3) {
      const color = iconParts[1];
      const shape = iconParts[2];
      const iconFile = path.join(extPath, 'resources', 'drop', `icon_${shape}${color}.png`);
      const iconUri = webview.asWebviewUri(vscode.Uri.file(iconFile)).toString();
      iconImg = `<img class="block-icon" src="${iconUri}" />`;
    }
  }

  // PlayEffect: "Red" or "Red Temp" → cross-Red.svg
  let crossImg = '';
  if (b.playEffect && webview && extPath) {
    const effectColor = b.playEffect.trim().split(/\s+/)[0];
    const crossFile = path.join(extPath, 'resources', 'cross', `cross-${effectColor}.svg`);
    const crossUri = webview.asWebviewUri(vscode.Uri.file(crossFile)).toString();
    crossImg = `<img class="block-cross" src="${crossUri}" />`;
  }

  // Right-side icons
  const icons = (iconImg || crossImg)
    ? `<span class="block-icons">${iconImg}${crossImg}</span>`
    : '';

  // State toggle buttons
  const states: { key: PanelBlock['state']; icon: string; title: string }[] = [
    { key: 'show-custom', icon: '🎵', title: '自定义音效' },
    { key: 'show-system', icon: '🔊', title: '系统音效' },
    { key: 'hide', icon: '⊘', title: '隐藏' },
    { key: 'disabled', icon: '🚫', title: '禁用' },
  ];
  const stateBtns = states.map(s =>
    `<span class="state-btn${b.state === s.key ? ' active' : ''}" onclick="event.stopPropagation();toggleBlock(${b.startLine},'${s.key}')" title="${s.title}">${s.icon}</span>`
  ).join('');

  return `<div class="block ${typeClass}" data-line="${b.startLine}" data-name="${esc(b.comment || name).toLowerCase()}" onclick="goTo(${b.startLine})" style="padding-left:${depth * 16 + 8}px">
    <span class="type-icon">${typeIcon}</span>
    ${preview}
    ${icons}
    <span class="state-btns">${stateBtns}</span>
  </div>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── CSS ───────────────────────────────────────────────────────────────

function baseCss(density: string): string {
  // Density-specific values
  const blockPad = density === 'compact' ? '2px 8px' : density === 'comfortable' ? '6px 8px' : '4px 8px';
  const blockMinH = density === 'compact' ? '20px' : density === 'comfortable' ? '32px' : '26px';
  const blockFont = density === 'compact' ? '11px' : density === 'comfortable' ? '13px' : '12px';
  const iconSize = density === 'compact' ? '12px' : density === 'comfortable' ? '20px' : '16px';
  const sectionPad = density === 'compact' ? '3px 8px' : density === 'comfortable' ? '7px 8px' : '5px 8px';
  const previewFont = density === 'compact' ? '10px' : density === 'comfortable' ? '13px' : '11px';
  const typeIconSize = density === 'compact' ? '10px' : density === 'comfortable' ? '13px' : '11px';

  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 0;
      margin: 0;
      overflow: hidden;
      height: 100vh;
    }
    .tab-bar {
      display: flex;
      gap: 4px;
      padding: 6px 8px 0;
      background: var(--vscode-sideBar-background);
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .tab {
      flex: 1;
      text-align: center;
      padding: 6px 4px;
      font-size: 11px;
      cursor: pointer;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-list-hoverBackground);
      border-radius: 6px 6px 0 0;
      border: 1px solid transparent;
      border-bottom: none;
      user-select: none;
      transition: background 0.15s, color 0.15s;
    }
    .tab:hover {
      color: var(--vscode-foreground);
      background: var(--vscode-list-inactiveSelectionBackground);
    }
    .tab.active {
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      border-color: var(--vscode-panel-border);
      font-weight: 600;
    }
    .tab-content { height: calc(100vh - 32px); overflow: hidden; }
    #content { height: calc(100vh - 62px); overflow-y: auto; }
    .search-wrap {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--vscode-sideBar-background);
      padding: 0;
    }
    .empty {
      padding: 16px;
      color: var(--vscode-descriptionForeground);
      text-align: center;
      font-size: 12px;
    }
    .section-title {
      font-weight: 600;
      font-size: 12px;
      padding: 10px 12px 4px;
      color: var(--vscode-foreground);
    }
    .sound-mode-current {
      font-size: 12px;
      padding: 4px 12px 8px;
      color: var(--vscode-descriptionForeground);
    }
    .sound-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 0 12px;
    }
    .sound-btn {
      padding: 8px 12px;
      border: 1px solid var(--vscode-button-border);
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      text-align: center;
      cursor: pointer;
      font-size: 12px;
      border-radius: 3px;
    }
    .sound-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .game-header {
      font-weight: 700;
      font-size: 13px;
      padding: 10px 12px 6px;
      color: var(--vscode-foreground);
      border-top: 1px solid var(--vscode-panel-border);
      margin-top: 4px;
    }
    .game-sub {
      font-weight: 400;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }
    .file-item {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      border-bottom: 1px solid var(--vscode-list-hoverBackground);
      gap: 8px;
    }
    .file-item:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .file-info {
      flex: 1;
      cursor: pointer;
      min-width: 0;
    }
    .file-name {
      font-size: 12px;
      color: var(--vscode-textLink-foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .file-name:hover {
      text-decoration: underline;
    }
    .file-meta {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      margin-top: 1px;
    }
    .file-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
    .file-btn {
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      border-radius: 3px;
      opacity: 0.6;
    }
    .file-btn:hover {
      opacity: 1;
      background: var(--vscode-toolbar-hoverBackground);
    }
    .file-btn-danger:hover {
      background: rgba(255,0,0,0.15);
    }
    .search {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 12px;
      outline: none;
      box-sizing: border-box;
    }
    .search:focus {
      border-color: var(--vscode-focusBorder);
    }
    .search::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }
    .tree, .flat-list { }
    .split-layout {
      display: flex;
      height: 100%;
      overflow: hidden;
    }
    .cat-tabs {
      width: 80px;
      min-width: 80px;
      border-right: 1px solid var(--vscode-panel-border);
      flex-shrink: 0;
      overflow-y: auto;
      height: 100%;
    }
    .cat-tab {
      padding: 6px 4px;
      font-size: 11px;
      cursor: pointer;
      text-align: center;
      border-bottom: 1px solid var(--vscode-list-hoverBackground);
      color: var(--vscode-descriptionForeground);
      user-select: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .cat-img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }
    .cat-label {
      word-break: break-all;
      line-height: 1.2;
      font-size: 13px;
      font-weight: 600;
    }
    .cat-tab:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .cat-tab.active {
      background: var(--vscode-list-activeSelectionBackground);
      color: var(--vscode-list-activeSelectionForeground);
      font-weight: 600;
      border-left: 2px solid var(--vscode-focusBorder);
      padding-left: 4px;
    }
    .cat-content {
      flex: 1;
      overflow-y: auto;
      height: 100%;
    }
    .cat-panel { }
    .section { }
    .section-header {
      display: flex;
      align-items: center;
      padding: ${sectionPad};
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      color: var(--vscode-foreground);
      opacity: 0.9;
      user-select: none;
    }
    .section-header:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .section-header .arrow {
      display: inline-block;
      width: 14px;
      font-size: 10px;
      transition: transform 0.15s;
    }
    .section-header.open .arrow {
      transform: rotate(90deg);
    }
    .section-body {
      display: none;
    }
    .section-body.open {
      display: block;
    }
    .block {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: ${blockPad};
      cursor: pointer;
      border-bottom: 1px solid var(--vscode-list-hoverBackground);
      font-size: ${blockFont};
      min-height: ${blockMinH};
    }
    .block:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .block.hidden {
      display: none;
    }
    .type-icon {
      font-size: ${typeIconSize};
      flex-shrink: 0;
    }
    .block-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .block.show .block-name { color: #73c991; }
    .block.hide .block-name { color: #e06c75; }
    .block.disabled .block-name { color: var(--vscode-disabledForeground); opacity: 0.6; }
    .preview {
      font-size: ${previewFont};
      padding: 1px 4px;
      border-radius: 2px;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .block-icons {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-left: auto;
      flex-shrink: 0;
    }
    .block-icon {
      width: ${iconSize};
      height: ${iconSize};
      object-fit: contain;
    }
    .block-cross {
      width: ${iconSize};
      height: ${iconSize};
      object-fit: contain;
    }
    .state-btns {
      display: none;
      align-items: center;
      gap: 2px;
      margin-left: auto;
      flex-shrink: 0;
    }
    .block:hover .state-btns {
      display: flex;
    }
    .block:hover .block-icons {
      display: none;
    }
    .state-btn {
      font-size: 12px;
      padding: 1px 3px;
      border-radius: 3px;
      cursor: pointer;
      opacity: 0.4;
      user-select: none;
    }
    .state-btn:hover {
      opacity: 0.8;
      background: var(--vscode-toolbar-hoverBackground);
    }
    .state-btn.active {
      opacity: 1;
      background: var(--vscode-button-background);
    }
  `;
}

// ── JS ─────────────────────────────────────────────────────────────────

function panelScript(): string {
  return `
    const vscode = acquireVsCodeApi();

    function goTo(line) {
      vscode.postMessage({ type: 'goToBlock', line });
    }

    function saveState() {
      const openSections = [];
      document.querySelectorAll('.section-header.open').forEach(h => {
        const idx = Array.from(document.querySelectorAll('.section-header')).indexOf(h);
        if (idx >= 0) openSections.push(idx);
      });
      const content = document.getElementById('tab-editor');
      const scrollTop = content ? content.scrollTop : 0;
      vscode.setState({ ...(vscode.getState() || {}), openSections, scrollTop });
    }

    function toggleSection(el) {
      const body = el.nextElementSibling;
      if (body) {
        body.classList.toggle('open');
        el.classList.toggle('open');
        saveState();
      }
    }

    function selectCat(id) {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      document.querySelector('.cat-tab[data-cat="' + id + '"]').classList.add('active');
      document.querySelectorAll('.cat-panel').forEach(p => p.style.display = 'none');
      const panel = document.getElementById('panel-' + id);
      if (panel) panel.style.display = 'block';
    }

    function switchTab(id) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelector('.tab[data-tab="' + id + '"]').classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.getElementById('tab-' + id).style.display = 'block';
      vscode.setState({ ...(vscode.getState() || {}), activeTab: id });
    }

    function toggleSound() {
      vscode.postMessage({ type: 'toggleSound' });
    }

    function runCmd(cmd) {
      vscode.postMessage({ type: 'runCmd', cmd });
    }

    function refreshFiles() {
      vscode.postMessage({ type: 'refreshFiles' });
    }

    function openFile(p) {
      vscode.postMessage({ type: 'openFile', path: p });
    }

    function deleteFile(p) {
      vscode.postMessage({ type: 'deleteFile', path: p });
    }

    function toggleBlock(line, state) {
      vscode.postMessage({ type: 'toggleBlock', line: line, state: state });
    }

    // Restore state
    const saved = vscode.getState();
    if (saved && saved.activeTab) {
      switchTab(saved.activeTab);
    }
    if (saved && saved.openSections) {
      const headers = document.querySelectorAll('.section-header');
      saved.openSections.forEach(idx => {
        const h = headers[idx];
        if (h) {
          h.classList.add('open');
          const body = h.nextElementSibling;
          if (body) body.classList.add('open');
        }
      });
    }
    if (saved && saved.scrollTop) {
      const content = document.getElementById('tab-editor');
      if (content) content.scrollTop = saved.scrollTop;
    }

    const searchEl = document.getElementById('search');
    if (searchEl) {
      searchEl.addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        if (q.length > 0) {
          document.querySelectorAll('.cat-panel').forEach(p => p.style.display = 'block');
        } else {
          document.querySelectorAll('.cat-panel').forEach(p => p.style.display = 'none');
          const active = document.querySelector('.cat-tab.active');
          if (active) {
            const panel = document.getElementById('panel-' + active.getAttribute('data-cat'));
            if (panel) panel.style.display = 'block';
          }
        }
        document.querySelectorAll('.block').forEach(b => {
          const name = (b.getAttribute('data-name') || '').toLowerCase();
          const text = b.textContent.toLowerCase();
          b.classList.toggle('hidden', q.length > 0 && !name.includes(q) && !text.includes(q));
        });
        document.querySelectorAll('.section-body').forEach(body => {
          const hasVisible = body.querySelector('.block:not(.hidden)');
          if (q.length > 0 && hasVisible) {
            body.classList.add('open');
            body.previousElementSibling.classList.add('open');
          }
        });
      });
    }
  `;
}

// ── Util ───────────────────────────────────────────────────────────────

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function extractComment(trimmed: string, headerLen: number): string {
  const rest = trimmed.substring(headerLen).trim();
  const m = rest.match(/^#\s*(.*)/);
  return m ? m[1].trim() : '';
}

function stripComment(line: string): string {
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQ = !inQ;
    else if (line[i] === '#' && !inQ) return line.substring(0, i).trimEnd();
  }
  return line;
}
