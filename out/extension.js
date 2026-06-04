"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const formatter_1 = require("./formatter");
function activate(context) {
    const docFormatter = new formatter_1.PoeFilterDocumentFormatter();
    const selFormatter = new formatter_1.PoeFilterSelectionFormatter();
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('poe-filter-best.formatDocument', () => {
        vscode.commands.executeCommand('editor.action.formatDocument');
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('poe-filter-best.formatSelection', () => {
        vscode.commands.executeCommand('editor.action.formatSelection');
    }));
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ scheme: 'file', language: 'poe-filter' }, docFormatter));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider({ scheme: 'file', language: 'poe-filter' }, selFormatter));
}
function deactivate() {
    // Nothing to clean up
}
//# sourceMappingURL=extension.js.map