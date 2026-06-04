"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterFoldingProvider = void 0;
const vscode = require("vscode");
/**
 * FoldingRangeProvider for PoE filter files.
 * Folds each Show/Hide block and consecutive comment groups.
 */
class PoeFilterFoldingProvider {
    provideFoldingRanges(document, _context, _token) {
        const ranges = [];
        const blockStarts = [];
        // Collect block header lines
        for (let i = 0; i < document.lineCount; i++) {
            const trimmed = document.lineAt(i).text.trim();
            if (trimmed === '' || trimmed.startsWith('#'))
                continue;
            if (/^(Show|Hide)\b/i.test(trimmed)) {
                blockStarts.push(i);
            }
        }
        // Block folding ranges
        for (let b = 0; b < blockStarts.length; b++) {
            const start = blockStarts[b];
            const nextStart = b + 1 < blockStarts.length ? blockStarts[b + 1] : document.lineCount;
            // Trim trailing empty lines
            let end = nextStart - 1;
            while (end > start && document.lineAt(end).text.trim() === '') {
                end--;
            }
            if (end > start) {
                ranges.push(new vscode.FoldingRange(start, end));
            }
        }
        // Comment group folding ranges (2+ consecutive comment lines)
        let commentStart = -1;
        for (let i = 0; i <= document.lineCount; i++) {
            const atEnd = i === document.lineCount;
            const trimmed = atEnd ? '' : document.lineAt(i).text.trim();
            if (!atEnd && trimmed.startsWith('#')) {
                if (commentStart < 0)
                    commentStart = i;
            }
            else if (!atEnd && trimmed === '') {
                // Empty lines don't break comment groups
            }
            else {
                // Non-comment, non-empty, or end of document
                if (commentStart >= 0) {
                    // Find last actual comment line (skip trailing empties)
                    let lastComment = i - 1;
                    while (lastComment >= commentStart && document.lineAt(lastComment).text.trim() === '') {
                        lastComment--;
                    }
                    if (lastComment > commentStart) {
                        ranges.push(new vscode.FoldingRange(commentStart, lastComment));
                    }
                }
                commentStart = -1;
            }
        }
        return ranges;
    }
}
exports.PoeFilterFoldingProvider = PoeFilterFoldingProvider;
//# sourceMappingURL=folding.js.map