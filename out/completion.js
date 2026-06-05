"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterCompletionProvider = void 0;
const vscode = require("vscode");
const data_1 = require("./data");
class PoeFilterCompletionProvider {
    provideCompletionItems(document, position, _token, _context) {
        const line = document.lineAt(position).text;
        const prefix = line.substring(0, position.character);
        const trimmed = line.trimStart();
        const indentLen = line.length - trimmed.length;
        // ── Block header position (line start, no indent, has content) ──
        if (position.character <= indentLen && trimmed !== '') {
            const headerMatch = trimmed.match(/^(Show|Hide)\b/i);
            if (headerMatch && headerMatch[1].length < position.character - indentLen) {
                return undefined;
            }
            return data_1.BLOCK_HEADERS.map(h => {
                const item = new vscode.CompletionItem(h.keyword, vscode.CompletionItemKind.Keyword);
                item.detail = h.description;
                item.documentation = new vscode.MarkdownString(h.detail);
                item.sortText = '0';
                return item;
            });
        }
        // ── Inside a block body (indented) ──
        const blockStart = this.findBlockStart(document, position);
        if (blockStart === undefined) {
            return undefined;
        }
        // Parse current line to determine context
        const beforeCursor = prefix.trimStart();
        // Check if we're typing a keyword
        const keywordMatch = beforeCursor.match(/^(\w*)$/);
        if (keywordMatch) {
            return this.getKeywordCompletions(beforeCursor);
        }
        // Check if keyword is already complete and we need value completion
        const keywordWithValue = beforeCursor.match(/^(\w+)\s+(.*)/);
        if (keywordWithValue) {
            const keyword = keywordWithValue[1];
            const valuePart = keywordWithValue[2];
            return this.getValueCompletions(keyword, valuePart);
        }
        return undefined;
    }
    findBlockStart(document, position) {
        for (let i = position.line; i >= 0; i--) {
            const line = document.lineAt(i).text.trimStart();
            if (/^(Show|Hide)\b/i.test(line)) {
                return new vscode.Position(i, 0);
            }
            if (document.lineAt(i).text.trim() === '' && i < position.line) {
                continue;
            }
        }
        return undefined;
    }
    getKeywordCompletions(prefix) {
        const lower = prefix.toLowerCase();
        return (0, data_1.getBlockBodyKeywords)()
            .filter(k => k.keyword.toLowerCase().startsWith(lower))
            .map(k => {
            const item = new vscode.CompletionItem(k.keyword, vscode.CompletionItemKind.Property);
            item.detail = k.description;
            item.documentation = new vscode.MarkdownString(k.detail);
            item.sortText = this.getCategorySort(k.category);
            switch (k.valueType) {
                case 'boolean':
                    item.insertText = new vscode.SnippetString(`${k.keyword} \${1|True,False|}`);
                    break;
                case 'numeric':
                    if (k.operators && k.operators.length > 0) {
                        item.insertText = new vscode.SnippetString(`${k.keyword} \${1|${k.operators.join(',')}|} \${2:0}`);
                    }
                    else {
                        item.insertText = new vscode.SnippetString(`${k.keyword} \${1:0}`);
                    }
                    break;
                case 'multi-select':
                    if (k.validValues && k.validValues.length > 0) {
                        item.insertText = new vscode.SnippetString(`${k.keyword} \${1|${k.validValues.join(',')}|}`);
                    }
                    break;
                case 'color':
                    item.insertText = new vscode.SnippetString(`${k.keyword} \${1:255} \${2:255} \${3:255}`);
                    break;
                case 'icon':
                    item.insertText = new vscode.SnippetString(`MinimapIcon \${1|0,1,2|} \${2|${data_1.MINIMAP_COLORS.join(',')}|} \${3|${data_1.MINIMAP_SHAPES.join(',')}|}`);
                    break;
                case 'effect':
                    item.insertText = new vscode.SnippetString(`PlayEffect \${1|${data_1.PLAY_EFFECT_COLORS.join(',')}|}`);
                    break;
                case 'string-array':
                    if (k.keyword === 'Class') {
                        item.insertText = new vscode.SnippetString(`Class "\${1|${data_1.COMMON_CLASSES.join(',')}|}"`);
                    }
                    else {
                        item.insertText = new vscode.SnippetString(`${k.keyword} "\${1:value}"`);
                    }
                    break;
                case 'sound':
                    item.insertText = new vscode.SnippetString(`${k.keyword} \${1:1} \${2:300}`);
                    break;
                case 'none':
                    item.insertText = k.keyword;
                    break;
            }
            item.command = {
                command: 'editor.action.triggerSuggest',
                title: 'Suggest',
            };
            return item;
        });
    }
    getValueCompletions(keyword, valuePart) {
        const def = (0, data_1.getKeywordDef)(keyword);
        if (!def) {
            return undefined;
        }
        if (def.valueType === 'boolean' && def.validValues) {
            return def.validValues
                .filter(v => v.toLowerCase().startsWith(valuePart.toLowerCase()))
                .map(v => {
                const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Value);
                item.sortText = '0';
                return item;
            });
        }
        if (def.valueType === 'multi-select' && def.validValues) {
            return def.validValues
                .filter(v => v.toLowerCase().startsWith(valuePart.toLowerCase()))
                .map(v => {
                const item = new vscode.CompletionItem(v, vscode.CompletionItemKind.Value);
                item.sortText = '0';
                return item;
            });
        }
        if (def.valueType === 'numeric' && def.operators) {
            const operatorMatch = valuePart.match(/^([><=!]*$)/);
            if (operatorMatch) {
                return def.operators
                    .filter(op => op.startsWith(valuePart))
                    .map(op => {
                    const item = new vscode.CompletionItem(op, vscode.CompletionItemKind.Operator);
                    item.insertText = new vscode.SnippetString(`${op} \${1:0}`);
                    item.sortText = '0';
                    return item;
                });
            }
        }
        if (keyword.toLowerCase() === 'class') {
            const match = valuePart.match(/^"([^"]*)$/);
            const partial = match ? match[1] : valuePart.replace(/"/g, '');
            return data_1.COMMON_CLASSES
                .filter(c => c.toLowerCase().includes(partial.toLowerCase()))
                .map(c => {
                const item = new vscode.CompletionItem(`"${c}"`, vscode.CompletionItemKind.Value);
                item.detail = '物品类别';
                item.sortText = '0';
                return item;
            });
        }
        if (keyword.toLowerCase() === 'minimapicon') {
            const parts = valuePart.trim().split(/\s+/);
            if (parts.length === 2 && !parts[1]) {
                return data_1.MINIMAP_COLORS.map(c => {
                    const item = new vscode.CompletionItem(c, vscode.CompletionItemKind.Value);
                    item.sortText = '0';
                    return item;
                });
            }
            if (parts.length >= 2) {
                const colorTyped = parts.length >= 2 && parts[1];
                if (colorTyped) {
                    return data_1.MINIMAP_SHAPES.map(s => {
                        const item = new vscode.CompletionItem(s, vscode.CompletionItemKind.Value);
                        item.sortText = '0';
                        return item;
                    });
                }
            }
        }
        if (keyword.toLowerCase() === 'playeffect') {
            const partial = valuePart.trim();
            return data_1.PLAY_EFFECT_COLORS
                .filter(c => c.toLowerCase().startsWith(partial.toLowerCase()))
                .map(c => {
                const item = new vscode.CompletionItem(c, vscode.CompletionItemKind.Value);
                item.sortText = '0';
                return item;
            });
        }
        return undefined;
    }
    getCategorySort(category) {
        const order = {
            'boolean-condition': '0',
            'multi-select-condition': '1',
            'numeric-condition': '2',
            'array-condition': '3',
            'mod-condition': '4',
            'visual-action': '5',
        };
        return order[category] ?? '9';
    }
}
exports.PoeFilterCompletionProvider = PoeFilterCompletionProvider;
//# sourceMappingURL=completion.js.map