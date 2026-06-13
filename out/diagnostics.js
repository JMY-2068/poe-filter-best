"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterDiagnosticsProvider = void 0;
const vscode = require("vscode");
const data_1 = require("./data");
// Known keyword set for validation
const KNOWN_KEYWORDS = new Set();
const BLOCK_HEADERS = new Set(['show', 'hide']);
let initialized = false;
function ensureInit() {
    if (initialized)
        return;
    for (const k of (0, data_1.getAllKeywords)()) {
        KNOWN_KEYWORDS.add(k.keyword.toLowerCase());
    }
    initialized = true;
}
class PoeFilterDiagnosticsProvider {
    constructor(context) {
        this.collection = vscode.languages.createDiagnosticCollection('poe-filter');
        context.subscriptions.push(this.collection);
        context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(doc => this.validate(doc)));
        // Debounced: typing in a large filter shouldn't reparse on every keystroke.
        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => this.scheduleValidate(e.document)));
        // Immediate revalidate on save so the saved state is always correct.
        context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => this.validate(doc)));
        context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
            if (doc.languageId === 'poe-filter') {
                this.collection.delete(doc.uri);
            }
        }));
        for (const doc of vscode.workspace.textDocuments) {
            this.validate(doc);
        }
    }
    scheduleValidate(document) {
        if (document.languageId !== 'poe-filter')
            return;
        this.pendingDoc = document;
        if (this.debounceTimer)
            clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = undefined;
            const doc = this.pendingDoc;
            this.pendingDoc = undefined;
            if (doc)
                this.validate(doc);
        }, 300);
    }
    dispose() {
        if (this.debounceTimer)
            clearTimeout(this.debounceTimer);
        this.collection.dispose();
    }
    validate(document) {
        if (document.languageId !== 'poe-filter') {
            return;
        }
        ensureInit();
        const diagnostics = [];
        let inBlock = false;
        const blockKeywords = new Map();
        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text;
            const trimmed = text.trim();
            if (trimmed === '') {
                // Empty lines inside a block are allowed — don't end the block
                continue;
            }
            if (trimmed.startsWith('#')) {
                continue;
            }
            const headerMatch = trimmed.match(/^(Show|Hide)\b/i);
            if (headerMatch) {
                if (text !== text.trimStart()) {
                    const start = text.length - text.trimStart().length;
                    const range = new vscode.Range(i, start, i, start + headerMatch[1].length);
                    diagnostics.push(new vscode.Diagnostic(range, 'Show/Hide 必须在行首，不能有缩进', vscode.DiagnosticSeverity.Error));
                }
                inBlock = true;
                blockKeywords.clear();
                const afterHeader = trimmed.substring(headerMatch[1].length).trim();
                if (afterHeader && !afterHeader.startsWith('#')) {
                    const start = trimmed.indexOf(afterHeader);
                    const range = new vscode.Range(i, start, i, trimmed.length);
                    diagnostics.push(new vscode.Diagnostic(range, 'Show/Hide 后面只能有注释（以 # 开头）', vscode.DiagnosticSeverity.Warning));
                }
                continue;
            }
            if (inBlock) {
                const content = this.stripInlineComment(trimmed);
                if (!content)
                    continue;
                const kwMatch = content.match(/^(\w+)/);
                if (!kwMatch)
                    continue;
                const kw = kwMatch[1];
                if (!KNOWN_KEYWORDS.has(kw.toLowerCase()) && !BLOCK_HEADERS.has(kw.toLowerCase())) {
                    const start = text.length - text.trimStart().length;
                    const range = new vscode.Range(i, start, i, start + kw.length);
                    diagnostics.push(new vscode.Diagnostic(range, `未知关键字: "${kw}"`, vscode.DiagnosticSeverity.Error));
                    continue;
                }
                if (BLOCK_HEADERS.has(kw.toLowerCase())) {
                    continue;
                }
                const kwLower = kw.toLowerCase();
                const def = (0, data_1.getKeywordDef)(kw);
                const allowDup = def && (def.valueType === 'string-array' || def.valueType === 'numeric');
                if (blockKeywords.has(kwLower) && !allowDup) {
                    const firstLine = blockKeywords.get(kwLower);
                    const start = text.length - text.trimStart().length;
                    const range = new vscode.Range(i, start, i, start + kw.length);
                    diagnostics.push(new vscode.Diagnostic(range, `"${kw}" 在此 block 中重复定义（首次出现在第 ${firstLine + 1} 行）`, vscode.DiagnosticSeverity.Warning));
                }
                else {
                    blockKeywords.set(kwLower, i);
                }
                if (def) {
                    this.validateValue(diagnostics, i, text, content, kw, def);
                }
            }
            else {
                const kwMatch = trimmed.match(/^(\w+)/);
                if (kwMatch && !trimmed.startsWith('#')) {
                    if (KNOWN_KEYWORDS.has(kwMatch[1].toLowerCase()) && !BLOCK_HEADERS.has(kwMatch[1].toLowerCase())) {
                        const start = text.length - text.trimStart().length;
                        const range = new vscode.Range(i, start, i, start + kwMatch[1].length);
                        diagnostics.push(new vscode.Diagnostic(range, `"${kwMatch[1]}" 必须在 Show/Hide block 内部使用`, vscode.DiagnosticSeverity.Error));
                    }
                }
            }
        }
        this.collection.set(document.uri, diagnostics);
    }
    stripInlineComment(line) {
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
    validateValue(diagnostics, lineNum, rawLine, content, keyword, def) {
        const afterKeyword = content.substring(keyword.length).trim();
        const indentStart = rawLine.length - rawLine.trimStart().length;
        switch (def.valueType) {
            case 'none': {
                if (afterKeyword.length > 0) {
                    const range = new vscode.Range(lineNum, indentStart + keyword.length, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 不接受参数`, vscode.DiagnosticSeverity.Warning));
                }
                break;
            }
            case 'boolean': {
                if (!afterKeyword) {
                    const range = new vscode.Range(lineNum, indentStart, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 需要 True 或 False`, vscode.DiagnosticSeverity.Error));
                }
                else if (def.validValues && !def.validValues.some(v => v.toLowerCase() === afterKeyword.toLowerCase())) {
                    const start = content.indexOf(afterKeyword);
                    const range = new vscode.Range(lineNum, indentStart + start, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `"${afterKeyword}" 不是有效的值。应为: ${def.validValues.join(', ')}`, vscode.DiagnosticSeverity.Error));
                }
                break;
            }
            case 'numeric': {
                if (!afterKeyword) {
                    const range = new vscode.Range(lineNum, indentStart, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 需要运算符和数值`, vscode.DiagnosticSeverity.Error));
                    break;
                }
                const opMatch = afterKeyword.match(/^(>=|<=|!=|==|[><=])/);
                if (!opMatch) {
                    const range = new vscode.Range(lineNum, indentStart + keyword.length, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 需要有效的运算符 (>=, <=, >, <, =, ==, !=)`, vscode.DiagnosticSeverity.Error));
                    break;
                }
                const afterOp = afterKeyword.substring(opMatch[1].length).trim();
                if (!afterOp || !/^\d+$/.test(afterOp)) {
                    const opEnd = keyword.length + 1 + opMatch[1].length;
                    const range = new vscode.Range(lineNum, indentStart + opEnd, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 需要一个数字值`, vscode.DiagnosticSeverity.Error));
                }
                break;
            }
            case 'plain-numeric': {
                if (!afterKeyword) {
                    const range = new vscode.Range(lineNum, indentStart, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 需要一个数字值`, vscode.DiagnosticSeverity.Error));
                }
                else if (!/^\d+$/.test(afterKeyword)) {
                    const start = content.indexOf(afterKeyword);
                    const range = new vscode.Range(lineNum, indentStart + start, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `"${afterKeyword}" 不是有效的数字`, vscode.DiagnosticSeverity.Error));
                }
                break;
            }
            case 'multi-select': {
                if (!afterKeyword) {
                    const range = new vscode.Range(lineNum, indentStart, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 需要一个值`, vscode.DiagnosticSeverity.Error));
                }
                break;
            }
            case 'color': {
                const parts = afterKeyword.split(/\s+/).filter(Boolean);
                if (parts.length < 3) {
                    const range = new vscode.Range(lineNum, indentStart + keyword.length, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 至少需要 R G B 三个值 (0-255)`, vscode.DiagnosticSeverity.Error));
                }
                else {
                    for (let pi = 0; pi < Math.min(parts.length, 4); pi++) {
                        const val = parseInt(parts[pi], 10);
                        if (isNaN(val) || val < 0 || val > 255) {
                            const range = new vscode.Range(lineNum, indentStart + keyword.length, lineNum, indentStart + content.length);
                            diagnostics.push(new vscode.Diagnostic(range, `颜色值必须在 0-255 范围内`, vscode.DiagnosticSeverity.Warning));
                            break;
                        }
                    }
                }
                break;
            }
            case 'icon': {
                const parts = afterKeyword.split(/\s+/).filter(Boolean);
                if (parts.length < 3) {
                    const range = new vscode.Range(lineNum, indentStart + keyword.length, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, 'MinimapIcon 需要: <size 0-2> <color> <shape>', vscode.DiagnosticSeverity.Error));
                }
                else {
                    const size = parseInt(parts[0], 10);
                    if (isNaN(size) || size < 0 || size > 2) {
                        const range = new vscode.Range(lineNum, indentStart + keyword.length, lineNum, indentStart + content.length);
                        diagnostics.push(new vscode.Diagnostic(range, '图标大小必须为 0、1 或 2', vscode.DiagnosticSeverity.Error));
                    }
                }
                break;
            }
            case 'string-array': {
                if (!afterKeyword) {
                    const range = new vscode.Range(lineNum, indentStart, lineNum, indentStart + content.length);
                    diagnostics.push(new vscode.Diagnostic(range, `${keyword} 需要至少一个值`, vscode.DiagnosticSeverity.Error));
                }
                break;
            }
        }
    }
}
exports.PoeFilterDiagnosticsProvider = PoeFilterDiagnosticsProvider;
//# sourceMappingURL=diagnostics.js.map