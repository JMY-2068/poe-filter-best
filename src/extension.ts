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
import { PoeFilterPanel } from './panel';

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
  const triggerChars = [' ', '"', '>', '<', '=', '!',
    'a','b','c','d','e','f','g','h','i','j','k','l','m',
    'n','o','p','q','r','s','t','u','v','w','x','y','z',
    'A','B','C','D','E','F','G','H','I','J','K','L','M',
    'N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
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

  // Webview panel: block explorer with color preview
  const panel = new PoeFilterPanel(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(PoeFilterPanel.viewType, panel)
  );

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

  // Toggle sound mode: CustomAlertSound ↔ PlayAlertSound (whole file)
  const INLINE_COMMENT_PREFIX = '#      ';
  const BODY_INDENT = '    ';
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'poe-filter-best.toggleSoundMode',
      async (editor) => {
        const pick = await vscode.window.showQuickPick([
          { label: '切换为自定义音效', description: 'CustomAlertSound', mode: 'custom' },
          { label: '切换为系统音效', description: 'PlayAlertSound', mode: 'system' },
        ], { placeHolder: '选择音效模式' });
        if (!pick) { return; }

        const toCustom = pick.mode === 'custom';
        const edit = new vscode.WorkspaceEdit();
        const doc = editor.document;
        const lineCount = doc.lineCount;

        for (let i = 0; i < lineCount; i++) {
          const text = doc.lineAt(i).text;
          const trimmed = text.trim();

          if (toCustom) {
            // System → Custom: comment PlayAlertSound, uncomment CustomAlertSound
            if (/^PlayAlertSound\b/i.test(trimmed)) {
              edit.replace(doc.uri, doc.lineAt(i).range, `${INLINE_COMMENT_PREFIX}${trimmed}`);
            } else if (/^#\s{2,}CustomAlertSound\b/i.test(trimmed)) {
              const content = trimmed.replace(/^#\s+/, '');
              edit.replace(doc.uri, doc.lineAt(i).range, `${BODY_INDENT}${content}`);
            }
          } else {
            // Custom → System: comment CustomAlertSound, uncomment PlayAlertSound
            if (/^CustomAlertSound\b/i.test(trimmed)) {
              edit.replace(doc.uri, doc.lineAt(i).range, `${INLINE_COMMENT_PREFIX}${trimmed}`);
            } else if (/^#\s{2,}PlayAlertSound\b/i.test(trimmed)) {
              const content = trimmed.replace(/^#\s+/, '');
              edit.replace(doc.uri, doc.lineAt(i).range, `${BODY_INDENT}${content}`);
            }
          }
        }

        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
          vscode.window.showInformationMessage(`已切换为${toCustom ? '自定义' : '系统'}音效模式`);
        }
      }
    )
  );

  // Global font size adjust: +1 / -1
  for (const [cmd, delta] of [['fontSizeUp', 1], ['fontSizeDown', -1]] as const) {
    context.subscriptions.push(
      vscode.commands.registerTextEditorCommand(
        `poe-filter-best.${cmd}`,
        (editor) => {
          const doc = editor.document;
          const edit = new vscode.WorkspaceEdit();
          let changed = 0;
          for (let i = 0; i < doc.lineCount; i++) {
            const text = doc.lineAt(i).text;
            const trimmed = text.trim();
            // Active: SetFontSize XX
            let m = trimmed.match(/^SetFontSize\s+(\d+)/i);
            // Disabled: # SetFontSize XX or #      SetFontSize XX
            if (!m) { m = trimmed.match(/^#\s+SetFontSize\s+(\d+)/i); }
            if (m) {
              const newSize = Math.max(12, Math.min(45, +m[1] + delta));
              // Preserve comment prefix for disabled blocks
              if (trimmed.startsWith('#')) {
                const content = trimmed.replace(/(\d+)\s*$/, `${newSize}`);
                const indent = text.substring(0, text.length - text.trimStart().length);
                edit.replace(doc.uri, doc.lineAt(i).range, `${indent}${content}`);
              } else {
                const indent = text.substring(0, text.length - text.trimStart().length);
                edit.replace(doc.uri, doc.lineAt(i).range, `${indent}SetFontSize ${newSize}`);
              }
              changed++;
            }
          }
          if (changed > 0) {
            vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage(`字体大小已${delta > 0 ? '增大' : '减小'} ${changed} 处`);
          }
        }
      )
    );
  }

  // Global PlayEffect toggle: enable/disable
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'poe-filter-best.togglePlayEffect',
      async (editor) => {
        const doc = editor.document;
        // Detect current state
        let hasActive = false;
        for (let i = 0; i < doc.lineCount; i++) {
          const trimmed = doc.lineAt(i).text.trim();
          if (/^PlayEffect\b/i.test(trimmed)) hasActive = true;
        }

        const toEnable = !hasActive;
        const edit = new vscode.WorkspaceEdit();
        let inShowBlock = false;
        for (let i = 0; i < doc.lineCount; i++) {
          const text = doc.lineAt(i).text;
          const trimmed = text.trim();

          // Track Show/Hide block headers (skip disabled blocks)
          if (/^(Show|Hide)\b/i.test(trimmed)) {
            inShowBlock = /^Show\b/i.test(trimmed);
            continue;
          }
          if (/^#\s*(Show|Hide)\b/i.test(trimmed)) {
            inShowBlock = false; // disabled block, skip
            continue;
          }

          if (!inShowBlock) continue;

          if (toEnable) {
            if (/^#\s{2,}PlayEffect\b/i.test(trimmed)) {
              const content = trimmed.replace(/^#\s+/, '');
              edit.replace(doc.uri, doc.lineAt(i).range, `${BODY_INDENT}${content}`);
            }
          } else {
            if (/^PlayEffect\b/i.test(trimmed)) {
              edit.replace(doc.uri, doc.lineAt(i).range, `${INLINE_COMMENT_PREFIX}${trimmed}`);
            }
          }
        }
        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
          vscode.window.showInformationMessage(`已${toEnable ? '开启' : '关闭'}全局光柱`);
        }
      }
    )
  );
}

export function deactivate(): void {
  // Nothing to clean up
}
