"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const formatter_1 = require("./formatter");
const completion_1 = require("./completion");
const hover_1 = require("./hover");
const diagnostics_1 = require("./diagnostics");
function activate(context) {
    const docFormatter = new formatter_1.PoeFilterDocumentFormatter();
    const selFormatter = new formatter_1.PoeFilterSelectionFormatter();
    const completionProvider = new completion_1.PoeFilterCompletionProvider();
    const hoverProvider = new hover_1.PoeFilterHoverProvider();
    // Commands
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('poe-filter-best.formatDocument', () => {
        vscode.commands.executeCommand('editor.action.formatDocument');
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('poe-filter-best.formatSelection', () => {
        vscode.commands.executeCommand('editor.action.formatSelection');
    }));
    // Formatters
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'poe-filter' }, docFormatter));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider({ scheme: 'file', language: 'poe-filter' }, selFormatter));
    // Completion (auto-completion / IntelliSense)
    const triggerChars = [' ', '"', '>', '<', '=', '!'];
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider({ scheme: 'file', language: 'poe-filter' }, completionProvider, ...triggerChars));
    // Hover documentation
    context.subscriptions.push(vscode.languages.registerHoverProvider({ scheme: 'file', language: 'poe-filter' }, hoverProvider));
    // Diagnostics (syntax validation)
    const diagnosticsProvider = new diagnostics_1.PoeFilterDiagnosticsProvider(context);
    context.subscriptions.push(diagnosticsProvider);
}
function deactivate() {
    // Nothing to clean up
}
//# sourceMappingURL=extension.js.map