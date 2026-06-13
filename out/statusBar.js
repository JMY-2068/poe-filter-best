"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterStatusBar = void 0;
const vscode = require("vscode");
/**
 * Status bar items for POE filter files.
 * Shows: POE version (POE1/POE2) and block count.
 */
class PoeFilterStatusBar {
    constructor(context) {
        // POE version — left side
        this.versionItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
        // Block count — left side, after version
        this.blockItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 9);
        context.subscriptions.push(this.versionItem);
        context.subscriptions.push(this.blockItem);
        // Update on active editor change
        context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => this.update(editor)));
        // Debounced: avoid getText() + full line scan on every keystroke.
        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document === e.document) {
                this.scheduleUpdate(editor);
            }
        }));
        // Initial
        this.update(vscode.window.activeTextEditor);
    }
    scheduleUpdate(editor) {
        this.pendingEditor = editor;
        if (this.debounceTimer)
            clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = undefined;
            const ed = this.pendingEditor;
            this.pendingEditor = undefined;
            if (ed)
                this.update(ed);
        }, 300);
    }
    dispose() {
        if (this.debounceTimer)
            clearTimeout(this.debounceTimer);
    }
    update(editor) {
        if (!editor || editor.document.languageId !== 'poe-filter') {
            this.versionItem.hide();
            this.blockItem.hide();
            return;
        }
        const doc = editor.document;
        const text = doc.getText();
        // Detect POE version
        const isPoe1 = text.includes('Divination Cards');
        this.versionItem.text = isPoe1 ? '$(game) POE1' : '$(game) POE2';
        this.versionItem.tooltip = isPoe1
            ? 'Path of Exile 1 过滤器（检测到 Divination Cards）'
            : 'Path of Exile 2 过滤器';
        this.versionItem.show();
        // Count blocks: Show / Hide / # Show / # Hide
        let total = 0;
        let showCount = 0;
        let hideCount = 0;
        let disabledCount = 0;
        for (let i = 0; i < doc.lineCount; i++) {
            const trimmed = doc.lineAt(i).text.trim();
            if (/^Show\b/i.test(trimmed)) {
                total++;
                showCount++;
            }
            else if (/^Hide\b/i.test(trimmed)) {
                total++;
                hideCount++;
            }
            else if (/^#\s*Show\b/i.test(trimmed)) {
                total++;
                disabledCount++;
            }
            else if (/^#\s*Hide\b/i.test(trimmed)) {
                total++;
                disabledCount++;
            }
        }
        this.blockItem.text = `$(list-unordered) ${total} Blocks`;
        this.blockItem.tooltip = [
            `Show: ${showCount}`,
            `Hide: ${hideCount}`,
            `Disabled: ${disabledCount}`,
        ].join('  |  ');
        this.blockItem.show();
    }
}
exports.PoeFilterStatusBar = PoeFilterStatusBar;
//# sourceMappingURL=statusBar.js.map