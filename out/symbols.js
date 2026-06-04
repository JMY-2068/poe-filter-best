"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterSymbolProvider = void 0;
const vscode = require("vscode");
/**
 * DocumentSymbolProvider for PoE filter files.
 * Shows each Show/Hide block in the outline view with summary info.
 */
const SUMMARY_KEYWORDS = ['Class', 'BaseType', 'Rarity', 'ItemLevel', 'MapTier', 'WaystoneTier'];
class PoeFilterSymbolProvider {
    provideDocumentSymbols(document, _token) {
        const symbols = [];
        let blockStart = -1;
        let blockType = '';
        let blockSummary = [];
        let blockComments = [];
        let collectingComments = true;
        let currentComments = [];
        for (let i = 0; i < document.lineCount; i++) {
            const text = document.lineAt(i).text;
            const trimmed = text.trim();
            // Collect top-level comments for block description
            if (collectingComments && trimmed.startsWith('#')) {
                const commentText = trimmed.replace(/^#\s?/, '').trim();
                if (commentText) {
                    currentComments.push(commentText);
                }
                continue;
            }
            if (trimmed === '') {
                continue;
            }
            // Block header detection
            const headerMatch = trimmed.match(/^(Show|Hide)\b/i);
            if (headerMatch) {
                // Flush previous block
                if (blockStart >= 0) {
                    symbols.push(this.createBlockSymbol(document, blockStart, i - 1, blockType, blockSummary, blockComments));
                }
                blockStart = i;
                blockType = headerMatch[1].charAt(0).toUpperCase() + headerMatch[1].slice(1).toLowerCase();
                blockSummary = [];
                blockComments = currentComments.length > 0 ? [...currentComments] : [];
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
                if (SUMMARY_KEYWORDS.includes(kw)) {
                    const after = content.substring(kw.length).trim();
                    if (after) {
                        blockSummary.push(`${kw} ${after}`);
                    }
                }
            }
        }
        // Flush last block
        if (blockStart >= 0) {
            symbols.push(this.createBlockSymbol(document, blockStart, document.lineCount - 1, blockType, blockSummary, blockComments));
        }
        return symbols;
    }
    createBlockSymbol(document, startLine, endLine, blockType, summary, comments) {
        // Build symbol name
        let name = blockType;
        if (summary.length > 0) {
            name += ` — ${summary.slice(0, 2).join(', ')}`;
        }
        else if (comments.length > 0) {
            // Use first comment line as name hint
            name += ` — ${comments[0]}`;
        }
        // Trim trailing empty lines for the range
        let end = endLine;
        while (end > startLine && document.lineAt(end).text.trim() === '') {
            end--;
        }
        const range = new vscode.Range(startLine, 0, end, document.lineAt(end).text.length);
        const selectionRange = new vscode.Range(startLine, 0, startLine, blockType.length);
        return new vscode.DocumentSymbol(name, blockType, blockType === 'Show'
            ? vscode.SymbolKind.Class
            : vscode.SymbolKind.Key, range, selectionRange);
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