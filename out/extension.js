"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const formatter_1 = require("./formatter");
const completion_1 = require("./completion");
const hover_1 = require("./hover");
const diagnostics_1 = require("./diagnostics");
const folding_1 = require("./folding");
const symbols_1 = require("./symbols");
const colors_1 = require("./colors");
const definition_1 = require("./definition");
const decorations_1 = require("./decorations");
const LANG_SELECTOR = { scheme: 'file', language: 'poe-filter' };
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
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(LANG_SELECTOR, docFormatter));
    context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider(LANG_SELECTOR, selFormatter));
    // Completion (auto-completion / IntelliSense)
    const triggerChars = [' ', '"', '>', '<', '=', '!'];
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(LANG_SELECTOR, completionProvider, ...triggerChars));
    // Hover documentation
    context.subscriptions.push(vscode.languages.registerHoverProvider(LANG_SELECTOR, hoverProvider));
    // Diagnostics (syntax validation)
    const diagnosticsProvider = new diagnostics_1.PoeFilterDiagnosticsProvider(context);
    context.subscriptions.push(diagnosticsProvider);
    // Folding (block + comment group folding)
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(LANG_SELECTOR, new folding_1.PoeFilterFoldingProvider()));
    // Outline / Document Symbols
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(LANG_SELECTOR, new symbols_1.PoeFilterSymbolProvider()));
    // Color preview & picker
    context.subscriptions.push(vscode.languages.registerColorProvider(LANG_SELECTOR, new colors_1.PoeFilterColorProvider()));
    // Go to Definition
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(LANG_SELECTOR, new definition_1.PoeFilterDefinitionProvider()));
    // Find All References
    context.subscriptions.push(vscode.languages.registerReferenceProvider(LANG_SELECTOR, new definition_1.PoeFilterReferenceProvider()));
    // Scrollbar decorations (green=Show, red=Hide)
    new decorations_1.PoeFilterDecorationProvider(context);
}
function deactivate() {
    // Nothing to clean up
}
//# sourceMappingURL=extension.js.map