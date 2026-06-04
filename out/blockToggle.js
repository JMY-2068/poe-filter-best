"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterBlockToggle = void 0;
const vscode = require("vscode");
/** All visual effect keywords. */
const ALL_VISUAL = ['MinimapIcon', 'CustomAlertSound', 'PlayEffect', 'PlayAlertSound'];
/** Body inline comment format: # + 6 spaces */
const INLINE_COMMENT_PREFIX = '#      ';
class PoeFilterBlockToggle {
    constructor(context) {
        context.subscriptions.push(vscode.commands.registerTextEditorCommand('poe-filter-best.toggleBlock', (editor) => this.execute(editor, 'toggle')), vscode.commands.registerTextEditorCommand('poe-filter-best.showBlockCustom', (editor) => this.execute(editor, 'show-custom')), vscode.commands.registerTextEditorCommand('poe-filter-best.showBlockSystem', (editor) => this.execute(editor, 'show-system')), vscode.commands.registerTextEditorCommand('poe-filter-best.hideBlock', (editor) => this.execute(editor, 'hide')), vscode.commands.registerTextEditorCommand('poe-filter-best.disableBlock', (editor) => this.execute(editor, 'disabled')));
    }
    execute(editor, mode) {
        const doc = editor.document;
        if (doc.languageId !== 'poe-filter')
            return;
        const block = this.findBlockRange(doc, editor.selection.active.line);
        if (!block) {
            vscode.window.setStatusBarMessage('未找到 Show/Hide block', 2000);
            return;
        }
        const currentState = this.detectState(doc, block);
        let targetState;
        if (mode === 'toggle') {
            const next = {
                'show-custom': 'show-system',
                'show-system': 'hide',
                'hide': 'disabled',
                'disabled': 'show-custom',
            };
            targetState = next[currentState];
        }
        else {
            targetState = mode;
        }
        if (targetState === currentState)
            return;
        this.applyState(editor, block, currentState, targetState);
    }
    // ── State detection ──
    detectState(doc, block) {
        if (block.isDisabled)
            return 'disabled';
        const headerText = doc.lineAt(block.start).text.trim();
        if (/^Hide\b/i.test(headerText))
            return 'hide';
        let hasCustomActive = false;
        let hasSystemActive = false;
        for (let i = block.start + 1; i <= block.end; i++) {
            const trimmed = doc.lineAt(i).text.trim();
            if (trimmed.startsWith('#'))
                continue;
            if (/^CustomAlertSound\b/i.test(trimmed))
                hasCustomActive = true;
            if (/^PlayAlertSound\b/i.test(trimmed))
                hasSystemActive = true;
        }
        if (hasSystemActive && !hasCustomActive)
            return 'show-system';
        return 'show-custom';
    }
    /**
     * Get the set of visual keywords that should be ACTIVE (uncommented) for a state.
     */
    getActiveVisualKws(state) {
        switch (state) {
            case 'show-custom':
                return new Set(['MinimapIcon', 'CustomAlertSound', 'PlayEffect']);
            case 'show-system':
                return new Set(['MinimapIcon', 'PlayAlertSound', 'PlayEffect']);
            case 'hide':
                return new Set();
            default:
                return new Set();
        }
    }
    // ── State application ──
    applyState(editor, block, _current, target) {
        const doc = editor.document;
        const edit = new vscode.WorkspaceEdit();
        const bodyIndent = this.detectBodyIndent(doc, block.start, block.end);
        const activeKws = this.getActiveVisualKws(target);
        const headerKeyword = target === 'hide' ? 'Hide' : 'Show';
        for (let i = block.start; i <= block.end; i++) {
            const text = doc.lineAt(i).text;
            const trimmed = text.trim();
            if (trimmed === '')
                continue;
            if (i === block.start) {
                // ── Header line ──
                if (target === 'disabled') {
                    // Disable: prepend "# " to original (strip any existing inline comment first)
                    const clean = this.stripAnyComment(text, bodyIndent);
                    edit.replace(doc.uri, doc.lineAt(i).range, `# ${clean}`);
                }
                else {
                    edit.replace(doc.uri, doc.lineAt(i).range, this.buildHeader(text, headerKeyword));
                }
                continue;
            }
            // ── Body line ──
            if (target === 'disabled') {
                // Disable entire block: "# " + original text (strip inline comments first)
                const clean = this.stripAnyComment(text, bodyIndent);
                edit.replace(doc.uri, doc.lineAt(i).range, `# ${clean}`);
                continue;
            }
            // Active state: handle visual vs non-visual lines
            const visualKw = this.getVisualKeyword(text);
            if (visualKw && !activeKws.has(visualKw)) {
                // This visual line should be commented out
                if (this.isInlineCommented(text)) {
                    continue; // already in correct inline comment format
                }
                edit.replace(doc.uri, doc.lineAt(i).range, `${INLINE_COMMENT_PREFIX}${trimmed.replace(/^#\s+/, '')}`);
            }
            else {
                // This line should be active (uncommented)
                if (this.isDisabledComment(text)) {
                    edit.replace(doc.uri, doc.lineAt(i).range, this.stripBlockComment(text, bodyIndent));
                }
                else if (this.isInlineCommented(text)) {
                    const content = trimmed.replace(/^#\s+/, '');
                    edit.replace(doc.uri, doc.lineAt(i).range, `${bodyIndent}${content}`);
                }
            }
        }
        vscode.workspace.applyEdit(edit);
        const labels = {
            'show-custom': '👁 显示(自定义音效)',
            'show-system': '👁 显示(系统音效)',
            'hide': '⊘ 隐藏',
            'disabled': '🚫 已禁用',
        };
        vscode.window.setStatusBarMessage(`Block → ${labels[target]}`, 2000);
    }
    // ── Header helpers ──
    /**
     * Build header line for target state.
     * Handles both active and disabled source headers.
     */
    buildHeader(currentText, keyword) {
        // Strip any existing # prefix
        let clean = currentText;
        if (clean.startsWith('# ')) {
            clean = clean.substring(2);
        }
        else if (clean.startsWith('#')) {
            clean = clean.substring(1);
        }
        // Replace Show/Hide keyword
        return clean.replace(/\b(Show|Hide)\b/i, keyword);
    }
    // ── Visual keyword detection ──
    /**
     * Get the visual keyword from a line, or null if not a visual line.
     * Works on both active and commented lines.
     */
    getVisualKeyword(text) {
        const trimmed = text.trim();
        let content = trimmed;
        if (content.startsWith('#')) {
            content = content.replace(/^#\s+/, '');
        }
        const kwMatch = content.match(/^(\w+)/);
        if (kwMatch && ALL_VISUAL.includes(kwMatch[1])) {
            return kwMatch[1];
        }
        return null;
    }
    // ── Comment format detection ──
    /**
     * Is this line in block-disable format? ("# Show ..." or "#     ItemLevel ...")
     */
    isDisabledComment(text) {
        return /^# /.test(text);
    }
    /**
     * Is this line in inline-comment format? ("#      PlayAlertSound ...")
     * Matches # followed by 2+ spaces at line start (after optional indent).
     */
    isInlineCommented(text) {
        const trimmed = text.trim();
        if (!trimmed.startsWith('#'))
            return false;
        // Inline format: # + 2+ spaces + keyword
        return /^#\s{2,}\S/.test(trimmed);
    }
    /**
     * Strip block-disable comment prefix, restoring body indent.
     * "# Show ..." → "Show ..."
     * "#     Class ..." → "    Class ..." (using bodyIndent)
     */
    stripBlockComment(text, bodyIndent) {
        if (text.startsWith('# ')) {
            const content = text.substring(2);
            if (/^(Show|Hide)\b/i.test(content.trim())) {
                return content;
            }
            return `${bodyIndent}${content.trimStart()}`;
        }
        return text;
    }
    /**
     * Strip any comment format for block disable prepending.
     * Handles: "# text" (block disable), "#      text" (inline), or no comment.
     */
    stripAnyComment(text, bodyIndent) {
        const trimmed = text.trim();
        if (trimmed.startsWith('#')) {
            const content = trimmed.replace(/^#\s+/, '');
            // If content starts with Show/Hide, return without indent
            if (/^(Show|Hide)\b/i.test(content)) {
                return content;
            }
            return `${bodyIndent}${content}`;
        }
        return text;
    }
    // ── Body indent detection ──
    detectBodyIndent(doc, start, end) {
        for (let i = start + 1; i <= end; i++) {
            const text = doc.lineAt(i).text;
            const trimmed = text.trim();
            if (trimmed === '' || trimmed.startsWith('#'))
                continue;
            const indentLen = text.length - text.trimStart().length;
            return text.substring(0, indentLen);
        }
        return '    ';
    }
    // ── Block range detection ──
    findBlockRange(doc, lineNum) {
        const trimmed = doc.lineAt(lineNum).text.trim();
        if (/^#\s*(Show|Hide)\b/i.test(trimmed)) {
            return this.findDisabledBlockRange(doc, lineNum);
        }
        if (trimmed.startsWith('#')) {
            for (let i = lineNum; i >= 0; i--) {
                const t = doc.lineAt(i).text.trim();
                if (/^#\s*(Show|Hide)\b/i.test(t)) {
                    return this.findDisabledBlockRange(doc, i);
                }
                if (t === '' || (!t.startsWith('#') && /^(Show|Hide)\b/i.test(t))) {
                    break;
                }
            }
            return null;
        }
        let headerLine = -1;
        for (let i = lineNum; i >= 0; i--) {
            const t = doc.lineAt(i).text.trim();
            if (t === '' || t.startsWith('#'))
                continue;
            if (/^(Show|Hide)\b/i.test(t)) {
                headerLine = i;
                break;
            }
        }
        if (headerLine < 0)
            return null;
        let endLine = headerLine;
        for (let i = headerLine + 1; i < doc.lineCount; i++) {
            const t = doc.lineAt(i).text.trim();
            if (t === '')
                continue;
            if (t.startsWith('#'))
                continue;
            if (/^(Show|Hide)\b/i.test(t))
                break;
            endLine = i;
        }
        while (endLine > headerLine && doc.lineAt(endLine).text.trim() === '') {
            endLine--;
        }
        return { start: headerLine, end: endLine, isDisabled: false };
    }
    findDisabledBlockRange(doc, headerLine) {
        let endLine = headerLine;
        for (let i = headerLine + 1; i < doc.lineCount; i++) {
            const t = doc.lineAt(i).text.trim();
            if (t === '')
                continue;
            if (t.startsWith('#') && !/^#\s*(Show|Hide)\b/i.test(t)) {
                endLine = i;
                continue;
            }
            break;
        }
        while (endLine > headerLine && doc.lineAt(endLine).text.trim() === '') {
            endLine--;
        }
        return { start: headerLine, end: endLine, isDisabled: true };
    }
}
exports.PoeFilterBlockToggle = PoeFilterBlockToggle;
//# sourceMappingURL=blockToggle.js.map