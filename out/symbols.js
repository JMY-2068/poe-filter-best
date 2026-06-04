"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterSymbolProvider = void 0;
const vscode = require("vscode");
/**
 * DocumentSymbolProvider for PoE filter files (v4 enhanced).
 *
 * Features:
 * 1. Block grouping by section comments (# === Section ===)
 * 2. Disabled block identification (# Show / # Hide)
 * 3. Rich summary: Class, BaseType, Rarity, ItemLevel, MapTier, WaystoneTier,
 *    colors (SetTextColor/BgColor/BorderColor), PlayEffect, MinimapIcon
 * 4. Comment-based fallback descriptions
 * 5. Child symbols for key conditions within each block
 */
const SUMMARY_KEYWORDS = ['Class', 'BaseType', 'Rarity', 'ItemLevel', 'MapTier', 'WaystoneTier'];
class PoeFilterSymbolProvider {
    provideDocumentSymbols(document, _token) {
        const symbols = [];
        let blockStart = -1;
        let blockType = '';
        let blockSummary = [];
        let blockComments = [];
        let blockDetail = [];
        let blockDisabled = false;
        let collectingComments = true;
        let currentComments = [];
        // Section grouping state
        let currentSection = null;
        let sectionStart = -1;
        let sectionName = '';
        const flushSection = (endLine) => {
            if (currentSection && sectionStart >= 0) {
                let end = endLine;
                while (end > sectionStart && document.lineAt(end).text.trim() === '') {
                    end--;
                }
                currentSection.range = new vscode.Range(sectionStart, 0, end, document.lineAt(end).text.length);
                symbols.push(currentSection);
            }
            currentSection = null;
            sectionStart = -1;
            sectionName = '';
        };
        const flushBlock = (endLine) => {
            if (blockStart < 0)
                return;
            const sym = this.createBlockSymbol(document, blockStart, endLine, blockType, blockSummary, blockComments, blockDetail, blockDisabled);
            if (currentSection) {
                currentSection.children.push(sym);
            }
            else {
                symbols.push(sym);
            }
        };
        for (let i = 0; i < document.lineCount; i++) {
            const text = document.lineAt(i).text;
            const trimmed = text.trim();
            // Collect top-level comments for block/section description
            if (collectingComments && trimmed.startsWith('#')) {
                const commentText = trimmed.replace(/^#\s?/, '').trim();
                if (commentText) {
                    // Check for section header pattern: # === Section Name ===
                    const sectionMatch = commentText.match(/^[=─]{3,}\s*(.+?)\s*[=─]{3,}$/)
                        || commentText.match(/^[-─]{3,}\s*(.+?)\s*[-─]{3,}$/)
                        || commentText.match(/^={3,}\s*(.+?)\s*={3,}$/)
                        || commentText.match(/^(.+?)\s*#{3,}$/);
                    if (sectionMatch) {
                        flushBlock(i - 1);
                        blockStart = -1;
                        flushSection(i - 1);
                        sectionName = sectionMatch[1].trim();
                        sectionStart = i;
                        currentSection = new vscode.DocumentSymbol(`📁 ${sectionName}`, '', vscode.SymbolKind.Module, new vscode.Range(i, 0, i, text.length), new vscode.Range(i, 0, i, text.length));
                        currentComments = [];
                        continue;
                    }
                    currentComments.push(commentText);
                }
                continue;
            }
            if (trimmed === '') {
                continue;
            }
            // Block header detection (active)
            const headerMatch = trimmed.match(/^(Show|Hide)\b/i);
            // Disabled block header detection
            const disabledMatch = trimmed.match(/^#\s*(Show|Hide)\b/i);
            if (headerMatch || disabledMatch) {
                // Flush previous block
                flushBlock(i - 1);
                blockStart = i;
                if (disabledMatch) {
                    blockType = disabledMatch[1].charAt(0).toUpperCase() + disabledMatch[1].slice(1).toLowerCase();
                    blockDisabled = true;
                }
                else {
                    blockType = headerMatch[1].charAt(0).toUpperCase() + headerMatch[1].slice(1).toLowerCase();
                    blockDisabled = false;
                }
                blockSummary = [];
                blockComments = currentComments.length > 0 ? [...currentComments] : [];
                blockDetail = [];
                currentComments = [];
                collectingComments = false;
                continue;
            }
            // Non-header, non-empty, non-comment line — stop collecting top-level comments
            collectingComments = false;
            currentComments = [];
            if (blockStart >= 0) {
                const content = this.stripComment(trimmed);
                if (!content)
                    continue;
                const kwMatch = content.match(/^(\w+)/);
                if (!kwMatch)
                    continue;
                const kw = kwMatch[1];
                // Core summary keywords
                if (SUMMARY_KEYWORDS.includes(kw)) {
                    const after = content.substring(kw.length).trim();
                    if (after) {
                        blockSummary.push(`${kw} ${after}`);
                    }
                }
                // Visual effects in detail
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
                }
                else if (kw === 'PlayEffect') {
                    blockDetail.push(`光柱: ${content.substring(kw.length).trim()}`);
                }
                else if (kw === 'MinimapIcon') {
                    blockDetail.push(`图标: ${content.substring(kw.length).trim()}`);
                }
                else if (kw === 'PlayAlertSound' || kw === 'CustomAlertSound') {
                    blockDetail.push(`音效: ${content.substring(kw.length).trim()}`);
                }
                else if (kw === 'SetFontSize') {
                    blockDetail.push(`字号: ${content.substring(kw.length).trim()}`);
                }
            }
        }
        // Flush last block and section
        flushBlock(document.lineCount - 1);
        flushSection(document.lineCount - 1);
        return symbols;
    }
    createBlockSymbol(document, startLine, endLine, blockType, summary, comments, detail, disabled) {
        // Build symbol name with icon prefix
        const prefix = disabled ? '⊘ ' : (blockType === 'Show' ? '👁 ' : '🚫 ');
        let name = prefix + blockType;
        if (summary.length > 0) {
            name += ` — ${summary.slice(0, 2).join(', ')}`;
        }
        else if (comments.length > 0) {
            name += ` — ${comments[0]}`;
        }
        // Trim trailing empty lines for the range
        let end = endLine;
        while (end > startLine && document.lineAt(end).text.trim() === '') {
            end--;
        }
        const range = new vscode.Range(startLine, 0, end, document.lineAt(end).text.length);
        const selectionRange = new vscode.Range(startLine, 0, startLine, blockType.length);
        // Build detail string
        const detailParts = [];
        if (disabled)
            detailParts.push('⨯ 已禁用');
        if (summary.length > 2) {
            detailParts.push(...summary.slice(2));
        }
        if (detail.length > 0) {
            detailParts.push(...detail);
        }
        if (comments.length > 0 && summary.length === 0) {
            detailParts.push(...comments.slice(0, 2));
        }
        // SymbolKind: Show=Class (blue), Hide=Key (purple), Disabled=Variable (grey)
        let kind;
        if (disabled) {
            kind = vscode.SymbolKind.Variable;
        }
        else if (blockType === 'Show') {
            kind = vscode.SymbolKind.Class;
        }
        else {
            kind = vscode.SymbolKind.Key;
        }
        const sym = new vscode.DocumentSymbol(name, detailParts.join(' | '), kind, range, selectionRange);
        // Add child symbols for notable conditions
        const children = this.createConditionSymbols(document, startLine, end);
        if (children.length > 0) {
            sym.children = children;
        }
        return sym;
    }
    /**
     * Create child DocumentSymbols for key conditions within a block.
     */
    createConditionSymbols(document, startLine, endLine) {
        const children = [];
        const conditionKinds = {
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
            if (trimmed === '' || trimmed.startsWith('#'))
                continue;
            const content = this.stripComment(trimmed);
            if (!content)
                continue;
            const kwMatch = content.match(/^(\w+)/);
            if (!kwMatch)
                continue;
            const kw = kwMatch[1];
            const kind = conditionKinds[kw];
            if (!kind)
                continue;
            const after = content.substring(kw.length).trim();
            if (!after)
                continue;
            const lineStart = text.length - text.trimStart().length;
            children.push(new vscode.DocumentSymbol(`${kw}: ${after}`, '', kind, new vscode.Range(i, lineStart, i, text.length), new vscode.Range(i, lineStart, i, lineStart + kw.length)));
        }
        return children;
    }
    /**
     * Approximate color name from RGB values.
     */
    describeColor(r, g, b) {
        if (r < 30 && g < 30 && b < 30)
            return '黑';
        if (r > 225 && g > 225 && b > 225)
            return '白';
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        if (diff < 30) {
            return max < 128 ? '深灰' : '浅灰';
        }
        if (r === max && r > g + 40 && r > b + 40)
            return '红';
        if (g === max && g > r + 40 && g > b + 40)
            return '绿';
        if (b === max && b > r + 40 && b > g + 40)
            return '蓝';
        if (r > 200 && g > 200 && b < 80)
            return '黄';
        if (r > 200 && g < 80 && b > 200)
            return '紫';
        if (r > 200 && g > 100 && g < 160 && b < 80)
            return '橙';
        if (r < 80 && g > 200 && b > 200)
            return '青';
        if (r > 200 && g < 100 && b < 100)
            return '深红';
        if (g > 200 && r < 100 && b < 100)
            return '深绿';
        return `RGB(${r},${g},${b})`;
    }
    stripComment(line) {
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                inQuote = !inQuote;
            }
            else if (line[i] === '#' && !inQuote) {
                return line.substring(0, i).trimEnd();
            }
        }
        return line;
    }
}
exports.PoeFilterSymbolProvider = PoeFilterSymbolProvider;
//# sourceMappingURL=symbols.js.map