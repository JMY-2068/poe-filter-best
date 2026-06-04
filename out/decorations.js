"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterDecorationProvider = void 0;
const vscode = require("vscode");
/**
 * Decorations for PoE filter files:
 * 1. Scrollbar markers: green=Show, red=Hide
 * 2. Inline preview: shows how filtered items would appear in-game
 */
const showMarkerType = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: '#4EC9B0',
    overviewRulerLane: vscode.OverviewRulerLane.Left,
});
const hideMarkerType = vscode.window.createTextEditorDecorationType({
    overviewRulerColor: '#F44747',
    overviewRulerLane: vscode.OverviewRulerLane.Left,
});
const previewType = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
});
class PoeFilterDecorationProvider {
    constructor(context) {
        for (const editor of vscode.window.visibleTextEditors) {
            this.updateDecorations(editor);
        }
        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
            for (const editor of vscode.window.visibleTextEditors) {
                if (editor.document === e.document) {
                    this.updateDecorations(editor);
                }
            }
        }), vscode.window.onDidChangeVisibleTextEditors(editors => {
            for (const editor of editors) {
                this.updateDecorations(editor);
            }
        }), showMarkerType, hideMarkerType, previewType);
    }
    updateDecorations(editor) {
        if (editor.document.languageId !== 'poe-filter')
            return;
        const doc = editor.document;
        const blocks = this.parseBlocks(doc);
        const showRanges = [];
        const hideRanges = [];
        const previewOpts = [];
        for (const block of blocks) {
            // Scrollbar ranges
            const range = new vscode.Range(block.start, 0, block.end, doc.lineAt(block.end).text.length);
            if (block.type === 'show')
                showRanges.push(range);
            else
                hideRanges.push(range);
            // Preview label at end of Show/Hide line
            const lineLen = doc.lineAt(block.start).text.length;
            previewOpts.push({
                range: new vscode.Range(block.start, lineLen, block.start, lineLen),
                renderOptions: {
                    after: {
                        contentText: block.iconShape ? ` ${block.iconShape} 效果预览 ` : ' 效果预览 ',
                        color: `rgb(${block.textR}, ${block.textG}, ${block.textB})`,
                        backgroundColor: `rgb(${block.bgR}, ${block.bgG}, ${block.bgB})`,
                        border: `1px solid rgb(${block.borderR}, ${block.borderG}, ${block.borderB})`,
                        margin: '0 0 0 8px',
                    }
                }
            });
        }
        editor.setDecorations(showMarkerType, showRanges);
        editor.setDecorations(hideMarkerType, hideRanges);
        editor.setDecorations(previewType, previewOpts);
    }
    parseBlocks(doc) {
        const blocks = [];
        let current = null;
        const finishBlock = (endLine) => {
            if (!current)
                return;
            current.end = endLine;
            blocks.push(current);
            current = null;
        };
        for (let i = 0; i < doc.lineCount; i++) {
            const trimmed = doc.lineAt(i).text.trim();
            if (trimmed === '' || trimmed.startsWith('#'))
                continue;
            const headerMatch = trimmed.match(/^(Show|Hide)\b/i);
            if (headerMatch) {
                finishBlock(i - 1);
                current = {
                    start: i,
                    end: i,
                    type: headerMatch[1].toLowerCase(),
                    textR: 200, textG: 200, textB: 200,
                    bgR: 30, bgG: 30, bgB: 30,
                    borderR: 80, borderG: 80, borderB: 80,
                    iconShape: '',
                };
                continue;
            }
            if (current) {
                const content = this.stripComment(trimmed);
                if (!content)
                    continue;
                this.parseColor(content, 'SetTextColor', (r, g, b) => {
                    current.textR = r;
                    current.textG = g;
                    current.textB = b;
                });
                this.parseColor(content, 'SetBackgroundColor', (r, g, b) => {
                    current.bgR = r;
                    current.bgG = g;
                    current.bgB = b;
                });
                this.parseColor(content, 'SetBorderColor', (r, g, b) => {
                    current.borderR = r;
                    current.borderG = g;
                    current.borderB = b;
                });
                // MinimapIcon shape
                const iconMatch = content.match(/^MinimapIcon\s+\d+\s+\w+\s+(\w+)/i);
                if (iconMatch && !current.iconShape) {
                    current.iconShape = this.shapeToSymbol(iconMatch[1]);
                }
            }
        }
        finishBlock(doc.lineCount - 1);
        return blocks;
    }
    parseColor(content, keyword, setter) {
        const match = content.match(new RegExp(`^${keyword}\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)`, 'i'));
        if (match) {
            setter(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));
        }
    }
    shapeToSymbol(shape) {
        const map = {
            'Circle': '●', 'Diamond': '◆', 'Hexagon': '⬡', 'Square': '■',
            'Star': '★', 'Triangle': '▲', 'Cross': '✚', 'Moon': '☽',
            'Raindrop': '💧', 'Kite': '◆', 'Pentagon': '⬠', 'UpsideDownHouse': '⌂',
        };
        return map[shape] || shape;
    }
    stripComment(line) {
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"')
                inQuote = !inQuote;
            else if (line[i] === '#' && !inQuote)
                return line.substring(0, i).trimEnd();
        }
        return line;
    }
}
exports.PoeFilterDecorationProvider = PoeFilterDecorationProvider;
//# sourceMappingURL=decorations.js.map