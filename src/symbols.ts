import * as vscode from 'vscode';

/**
 * DocumentSymbolProvider for PoE filter files.
 *
 * Grouping modes (auto-detected per file):
 * - Inline mode:  block headers like "Show # 通货 - 赛季通货 - 三耀之火"
 *                 → nested tree by separator-split path
 * - Flat mode:    no inline comments on headers
 *                 → each block is a top-level symbol
 *
 * Separator is configurable via poe-filter-best.sectionSeparator (default " - ").
 */

const SUMMARY_KEYWORDS = ['Class', 'BaseType', 'Rarity', 'ItemLevel', 'MapTier', 'WaystoneTier'];

interface BlockInfo {
  startLine: number;
  endLine: number;
  blockType: string;     // 'Show' | 'Hide'
  disabled: boolean;
  comment: string;       // inline comment after # (empty string if none)
  summary: string[];
  comments: string[];    // preceding standalone comments
  detail: string[];
}

export class PoeFilterSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.DocumentSymbol[] {
    const separator = vscode.workspace
      .getConfiguration('poe-filter-best')
      .get<string>('sectionSeparator', ' - ');

    // ── Parse all blocks ──────────────────────────────────────────
    const blocks = this.parseBlocks(document);

    // ── Detect mode ───────────────────────────────────────────────
    const hasInlineComments = blocks.some(b => b.comment.length > 0);

    if (hasInlineComments) {
      return this.buildInlineTree(document, blocks, separator);
    } else {
      return this.buildFlatTree(document, blocks);
    }
  }

  // ── Block parsing ────────────────────────────────────────────────

  private parseBlocks(document: vscode.TextDocument): BlockInfo[] {
    const blocks: BlockInfo[] = [];
    let blockStart = -1;
    let blockType = '';
    let blockDisabled = false;
    let blockComment = '';
    let blockSummary: string[] = [];
    let blockComments: string[] = [];
    let blockDetail: string[] = [];
    let currentComments: string[] = [];

    const flushBlock = (endLine: number) => {
      if (blockStart < 0) return;
      let end = endLine;
      while (end > blockStart && document.lineAt(end).text.trim() === '') {
        end--;
      }
      blocks.push({
        startLine: blockStart,
        endLine: end,
        blockType,
        disabled: blockDisabled,
        comment: blockComment,
        summary: [...blockSummary],
        comments: [...blockComments],
        detail: [...blockDetail],
      });
      blockStart = -1;
    };

    for (let i = 0; i < document.lineCount; i++) {
      const text = document.lineAt(i).text;
      const trimmed = text.trim();

      // Collect preceding comments (only when not inside a block)
      if (trimmed.startsWith('#') && blockStart < 0) {
        // Check if this is a disabled block header
        const disabledMatch = trimmed.match(/^#\s*(Show|Hide)\b/i);
        if (disabledMatch) {
          flushBlock(i - 1);
          blockStart = i;
          blockType = this.capitalize(disabledMatch[1]);
          blockDisabled = true;
          blockComment = this.extractInlineComment(trimmed, disabledMatch[0]);
          blockSummary = [];
          blockComments = currentComments.length > 0 ? [...currentComments] : [];
          blockDetail = [];
          currentComments = [];
          continue;
        }
        // Regular comment line
        const commentText = trimmed.replace(/^#\s?/, '').trim();
        if (commentText) {
          currentComments.push(commentText);
        }
        continue;
      }

      if (trimmed === '') {
        currentComments = [];
        continue;
      }

      // Active block header
      const headerMatch = trimmed.match(/^(Show|Hide)\b/i);
      if (headerMatch) {
        flushBlock(i - 1);
        blockStart = i;
        blockType = this.capitalize(headerMatch[1]);
        blockDisabled = false;
        blockComment = this.extractInlineComment(trimmed, headerMatch[0]);
        blockSummary = [];
        blockComments = currentComments.length > 0 ? [...currentComments] : [];
        blockDetail = [];
        currentComments = [];
        continue;
      }

      currentComments = [];

      // Inside a block — collect summary and detail
      if (blockStart >= 0) {
        const content = this.stripComment(trimmed);
        if (!content) continue;

        const kwMatch = content.match(/^(\w+)/);
        if (!kwMatch) continue;
        const kw = kwMatch[1];

        if (SUMMARY_KEYWORDS.includes(kw)) {
          const after = content.substring(kw.length).trim();
          if (after) blockSummary.push(`${kw} ${after}`);
        }

        if (kw === 'SetTextColor' || kw === 'SetBackgroundColor' || kw === 'SetBorderColor') {
          const colorMatch = content.match(/^(\w+)\s+(\d+)\s+(\d+)\s+(\d+)/);
          if (colorMatch) {
            const r = parseInt(colorMatch[2]);
            const g = parseInt(colorMatch[3]);
            const b = parseInt(colorMatch[4]);
            const colorName = this.describeColor(r, g, b);
            const label = kw === 'SetTextColor' ? '文字色'
              : kw === 'SetBackgroundColor' ? '背景色' : '边框色';
            blockDetail.push(`${label}: ${colorName}`);
          }
        } else if (kw === 'PlayEffect') {
          blockDetail.push(`光柱: ${content.substring(kw.length).trim()}`);
        } else if (kw === 'MinimapIcon') {
          blockDetail.push(`图标: ${content.substring(kw.length).trim()}`);
        } else if (kw === 'PlayAlertSound' || kw === 'CustomAlertSound') {
          blockDetail.push(`音效: ${content.substring(kw.length).trim()}`);
        } else if (kw === 'SetFontSize') {
          blockDetail.push(`字号: ${content.substring(kw.length).trim()}`);
        }
      }
    }

    flushBlock(document.lineCount - 1);
    return blocks;
  }

  /** Extract inline comment after # from a block header line. */
  private extractInlineComment(trimmed: string, headerPart: string): string {
    const afterHeader = trimmed.substring(headerPart.length).trim();
    // Disabled headers like "# Show # comment" — headerPart is "# Show"
    // Active headers like "Show # comment" — headerPart is "Show"
    const commentMatch = afterHeader.match(/^#\s*(.*)/);
    return commentMatch ? commentMatch[1].trim() : '';
  }

  // ── Inline mode tree ─────────────────────────────────────────────

  private buildInlineTree(
    document: vscode.TextDocument,
    blocks: BlockInfo[],
    separator: string
  ): vscode.DocumentSymbol[] {
    const rootSymbols: vscode.DocumentSymbol[] = [];
    const sectionMap = new Map<string, vscode.DocumentSymbol>();

    for (const block of blocks) {
      let parent: vscode.DocumentSymbol | null = null;

      if (block.comment.length > 0) {
        const parts = block.comment.split(separator).map(s => s.trim()).filter(s => s.length > 0);

        // Build section hierarchy
        let currentPath = '';
        for (const part of parts) {
          currentPath = currentPath ? `${currentPath}${separator}${part}` : part;

          if (!sectionMap.has(currentPath)) {
            const sectionSym = new vscode.DocumentSymbol(
              `📁 ${part}`,
              '',
              vscode.SymbolKind.Module,
              new vscode.Range(block.startLine, 0, block.startLine, 0),
              new vscode.Range(block.startLine, 0, block.startLine, 0)
            );

            if (parent) {
              parent.children.push(sectionSym);
            } else {
              rootSymbols.push(sectionSym);
            }
            sectionMap.set(currentPath, sectionSym);
          }

          parent = sectionMap.get(currentPath)!;
        }
      }

      // Create block symbol
      const blockSym = this.createBlockSymbol(document, block, separator);

      if (parent) {
        parent.children.push(blockSym);
      } else {
        rootSymbols.push(blockSym);
      }
    }

    // Final pass: fix section ranges to cover all children
    this.fixSectionRanges(rootSymbols, document);

    return rootSymbols;
  }

  /** Recursively fix section ranges to cover all descendant children. */
  private fixSectionRanges(symbols: vscode.DocumentSymbol[], document: vscode.TextDocument): void {
    for (const sym of symbols) {
      if (sym.children.length > 0) {
        this.fixSectionRanges(sym.children, document);
        let minLine = sym.range.start.line;
        let maxLine = sym.range.end.line;
        for (const child of sym.children) {
          minLine = Math.min(minLine, child.range.start.line);
          maxLine = Math.max(maxLine, child.range.end.line);
        }
        const endLine = Math.min(maxLine, document.lineCount - 1);
        sym.range = new vscode.Range(
          minLine, 0,
          endLine, document.lineAt(endLine).text.length
        );
      }
    }
  }

  // ── Flat mode tree ───────────────────────────────────────────────

  private buildFlatTree(
    document: vscode.TextDocument,
    blocks: BlockInfo[]
  ): vscode.DocumentSymbol[] {
    const sep = vscode.workspace.getConfiguration('poe-filter-best').get<string>('sectionSeparator', ' - ');
    return blocks.map(block => this.createBlockSymbol(document, block, sep));
  }

  // ── Symbol creation ──────────────────────────────────────────────

  private createBlockSymbol(
    document: vscode.TextDocument,
    block: BlockInfo,
    separator: string
  ): vscode.DocumentSymbol {
    const prefix = block.disabled ? '⊘ ' : (block.blockType === 'Show' ? '👁 ' : '🚫 ');

    // Use last segment of inline comment as display name
    let displayPart = '';
    if (block.comment.length > 0) {
      const parts = block.comment.split(separator).map(s => s.trim()).filter(s => s.length > 0);
      displayPart = parts.length > 0 ? parts[parts.length - 1] : '';
    }

    let name: string;
    if (displayPart) {
      name = `${prefix}${block.blockType} — ${displayPart}`;
    } else if (block.summary.length > 0) {
      name = `${prefix}${block.blockType} — ${block.summary.slice(0, 2).join(', ')}`;
    } else if (block.comments.length > 0) {
      name = `${prefix}${block.blockType} — ${block.comments[0]}`;
    } else {
      name = `${prefix}${block.blockType}`;
    }

    const range = new vscode.Range(
      block.startLine, 0,
      block.endLine, document.lineAt(block.endLine).text.length
    );
    const selectionRange = new vscode.Range(
      block.startLine, 0,
      block.startLine, block.blockType.length
    );

    // Build detail string
    const detailParts: string[] = [];
    if (block.disabled) detailParts.push('⨯ 已禁用');
    if (block.summary.length > 2) {
      detailParts.push(...block.summary.slice(2));
    }
    if (block.detail.length > 0) {
      detailParts.push(...block.detail);
    }
    if (block.comments.length > 0 && block.summary.length === 0) {
      detailParts.push(...block.comments.slice(0, 2));
    }

    let kind: vscode.SymbolKind;
    if (block.disabled) {
      kind = vscode.SymbolKind.Variable;
    } else if (block.blockType === 'Show') {
      kind = vscode.SymbolKind.Class;
    } else {
      kind = vscode.SymbolKind.Key;
    }

    const sym = new vscode.DocumentSymbol(
      name,
      detailParts.join(' | '),
      kind,
      range,
      selectionRange
    );

    // Add child symbols for key conditions
    const children = this.createConditionSymbols(document, block.startLine, block.endLine);
    if (children.length > 0) {
      sym.children = children;
    }

    return sym;
  }

  /**
   * Create child DocumentSymbols for key conditions within a block.
   */
  private createConditionSymbols(
    document: vscode.TextDocument,
    startLine: number,
    endLine: number
  ): vscode.DocumentSymbol[] {
    const children: vscode.DocumentSymbol[] = [];
    const conditionKinds: Record<string, vscode.SymbolKind> = {
      'Class': vscode.SymbolKind.Enum,
      'BaseType': vscode.SymbolKind.String,
      'Rarity': vscode.SymbolKind.EnumMember,
      'ItemLevel': vscode.SymbolKind.Number,
      'MapTier': vscode.SymbolKind.Number,
      'WaystoneTier': vscode.SymbolKind.Number,
      'SetTextColor': vscode.SymbolKind.Constant,
      'SetBackgroundColor': vscode.SymbolKind.Constant,
      'SetBorderColor': vscode.SymbolKind.Constant,
      'PlayEffect': vscode.SymbolKind.Event,
      'MinimapIcon': vscode.SymbolKind.Property,
    };

    for (let i = startLine + 1; i <= endLine; i++) {
      const text = document.lineAt(i).text;
      const trimmed = text.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;

      const content = this.stripComment(trimmed);
      if (!content) continue;

      const kwMatch = content.match(/^(\w+)/);
      if (!kwMatch) continue;

      const kw = kwMatch[1];
      const kind = conditionKinds[kw];
      if (!kind) continue;

      const after = content.substring(kw.length).trim();
      if (!after) continue;

      const lineStart = text.length - text.trimStart().length;
      children.push(new vscode.DocumentSymbol(
        `${kw}: ${after}`,
        '',
        kind,
        new vscode.Range(i, lineStart, i, text.length),
        new vscode.Range(i, lineStart, i, lineStart + kw.length)
      ));
    }

    return children;
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }

  private describeColor(r: number, g: number, b: number): string {
    if (r < 30 && g < 30 && b < 30) return '黑';
    if (r > 225 && g > 225 && b > 225) return '白';

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    if (diff < 30) {
      return max < 128 ? '深灰' : '浅灰';
    }

    if (r === max && r > g + 40 && r > b + 40) return '红';
    if (g === max && g > r + 40 && g > b + 40) return '绿';
    if (b === max && b > r + 40 && b > g + 40) return '蓝';
    if (r > 200 && g > 200 && b < 80) return '黄';
    if (r > 200 && g < 80 && b > 200) return '紫';
    if (r > 200 && g > 100 && g < 160 && b < 80) return '橙';
    if (r < 80 && g > 200 && b > 200) return '青';
    if (r > 200 && g < 100 && b < 100) return '深红';
    if (g > 200 && r < 100 && b < 100) return '深绿';

    return `RGB(${r},${g},${b})`;
  }

  private stripComment(line: string): string {
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuote = !inQuote;
      } else if (line[i] === '#' && !inQuote) {
        return line.substring(0, i).trimEnd();
      }
    }
    return line;
  }
}
