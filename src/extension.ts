import * as vscode from 'vscode';
import { PoeFilterDocumentFormatter, PoeFilterSelectionFormatter } from './formatter';
import { PoeFilterCompletionProvider } from './completion';
import { PoeFilterHoverProvider } from './hover';
import { PoeFilterDiagnosticsProvider } from './diagnostics';
import { PoeFilterFoldingProvider } from './folding';
import { PoeFilterSymbolProvider } from './symbols';
import { PoeFilterColorProvider } from './colors';
import { PoeFilterDefinitionProvider, PoeFilterReferenceProvider } from './definition';
import { PoeFilterDecorationProvider } from './decorations';
import { PoeFilterBlockToggle } from './blockToggle';
import { PoeFilterCodeLensProvider } from './codelens';
import { PoeFilterDocumentLinkProvider } from './documentLinks';
import { PoeFilterPickerProvider } from './pickers';
import { PoeFilterStatusBar } from './statusBar';

const LANG_SELECTOR: vscode.DocumentFilter = { scheme: 'file', language: 'poe-filter' };

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
      LANG_SELECTOR,
      docFormatter
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      LANG_SELECTOR,
      selFormatter
    )
  );

  // Completion (auto-completion / IntelliSense)
  const triggerChars = [' ', '"', '>', '<', '=', '!'];
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      LANG_SELECTOR,
      completionProvider,
      ...triggerChars
    )
  );

  // Hover documentation
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      LANG_SELECTOR,
      hoverProvider
    )
  );

  // Diagnostics (syntax validation)
  const diagnosticsProvider = new PoeFilterDiagnosticsProvider(context);
  context.subscriptions.push(diagnosticsProvider);

  // Folding (block + comment group folding)
  context.subscriptions.push(
    vscode.languages.registerFoldingRangeProvider(
      LANG_SELECTOR,
      new PoeFilterFoldingProvider()
    )
  );

  // Outline / Document Symbols
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(
      LANG_SELECTOR,
      new PoeFilterSymbolProvider()
    )
  );

  // Color preview & picker
  context.subscriptions.push(
    vscode.languages.registerColorProvider(
      LANG_SELECTOR,
      new PoeFilterColorProvider()
    )
  );

  // Go to Definition
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      LANG_SELECTOR,
      new PoeFilterDefinitionProvider()
    )
  );

  // Find All References
  context.subscriptions.push(
    vscode.languages.registerReferenceProvider(
      LANG_SELECTOR,
      new PoeFilterReferenceProvider()
    )
  );

  // Scrollbar decorations (green=Show, red=Hide)
  new PoeFilterDecorationProvider(context);

  // Status bar: POE version + block count
  new PoeFilterStatusBar(context);

  // Block toggle (enable/disable blocks)
  new PoeFilterBlockToggle(context);

  // Document links: BaseType items → poe2db.tw
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      LANG_SELECTOR,
      new PoeFilterDocumentLinkProvider()
    )
  );

  // QuickPick pickers: MinimapIcon / PlayEffect parameter selection
  const pickerProvider = new PoeFilterPickerProvider(context);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(LANG_SELECTOR, pickerProvider)
  );

  // CodeLens: state buttons above each block
  const codeLensProvider = new PoeFilterCodeLensProvider(context);
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(LANG_SELECTOR, codeLensProvider)
  );

  // Internal command: CodeLens click → move cursor + trigger block command
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'poe-filter-best._codeLensAction',
      (editor, _edit, command: string, line: number) => {
        // Move cursor to the block header line
        const pos = new vscode.Position(line, 0);
        editor.selection = new vscode.Selection(pos, pos);
        editor.revealRange(new vscode.Range(pos, pos));
        // Execute the target block command
        vscode.commands.executeCommand(`poe-filter-best.${command}`);
      }
    )
  );
}

export function deactivate(): void {
  // Nothing to clean up
}
