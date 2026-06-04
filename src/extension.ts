import * as vscode from 'vscode';
import { PoeFilterDocumentFormatter, PoeFilterSelectionFormatter } from './formatter';

export function activate(context: vscode.ExtensionContext): void {
  const docFormatter = new PoeFilterDocumentFormatter();
  const selFormatter = new PoeFilterSelectionFormatter();

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
}

export function deactivate(): void {
  // Nothing to clean up
}
