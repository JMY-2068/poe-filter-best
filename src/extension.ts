import * as vscode from 'vscode';
import { PoeFilterDocumentFormatter, PoeFilterSelectionFormatter } from './formatter';
import { PoeFilterCompletionProvider } from './completion';
import { PoeFilterHoverProvider } from './hover';
import { PoeFilterDiagnosticsProvider } from './diagnostics';

export function activate(context: vscode.ExtensionContext): void {
  const docFormatter = new PoeFilterDocumentFormatter();
  const selFormatter = new PoeFilterSelectionFormatter();
  const completionProvider = new PoeFilterCompletionProvider();
  const hoverProvider = new PoeFilterHoverProvider();

  // Commands
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'poe-filter-best.formatDocument',
      () => {
        vscode.commands.executeCommand('editor.action.formatDocument');
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'poe-filter-best.formatSelection',
      () => {
        vscode.commands.executeCommand('editor.action.formatSelection');
      }
    )
  );

  // Formatters
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      { scheme: 'file', language: 'poe-filter' },
      docFormatter
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      { scheme: 'file', language: 'poe-filter' },
      selFormatter
    )
  );

  // Completion (auto-completion / IntelliSense)
  const triggerChars = [' ', '"', '>', '<', '=', '!'];
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: 'file', language: 'poe-filter' },
      completionProvider,
      ...triggerChars
    )
  );

  // Hover documentation
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      { scheme: 'file', language: 'poe-filter' },
      hoverProvider
    )
  );

  // Diagnostics (syntax validation)
  const diagnosticsProvider = new PoeFilterDiagnosticsProvider(context);
  context.subscriptions.push(diagnosticsProvider);
}

export function deactivate(): void {
  // Nothing to clean up
}
