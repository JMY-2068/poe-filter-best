import * as vscode from 'vscode';

/**
 * CodeLensProvider: shows clickable state buttons above each Show/Hide block.
 *
 * Each block header gets a CodeLens bar:
 *   Active Show block:  [👁 Show] [🚫 Hide] [⊘ Disable]
 *   Active Hide block:  [👁 Show] [🚫 Hide] [⊘ Disable]
 *   Disabled block:     [👁 Show] [🚫 Hide] [⊘ Disable]
 *
 * Clicking triggers the corresponding command with cursor moved to that block.
 */

export class PoeFilterCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(context: vscode.ExtensionContext) {
    // Debounced: don't recompute all CodeLenses on every keystroke.
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(() => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this._onDidChangeCodeLenses.fire(), 300);
      }),
    );
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const trimmed = document.lineAt(i).text.trim();

      const activeMatch = trimmed.match(/^(Show|Hide)\b/i);
      const disabledMatch = trimmed.match(/^#\s*(Show|Hide)\b/i);

      const headerLine = i;
      const lineLen = document.lineAt(i).text.length;
      const range = new vscode.Range(headerLine, lineLen, headerLine, lineLen);

      if (activeMatch || disabledMatch) {
        // Scan block for sound keywords
        const blockEnd = this.findBlockEnd(document, i);
        let hasCustom = false;
        let hasSystem = false;
        for (let j = i + 1; j <= blockEnd; j++) {
          const body = document.lineAt(j).text.trim().replace(/^#\s+/, '');
          if (/^CustomAlertSound\b/i.test(body)) hasCustom = true;
          if (/^PlayAlertSound\b/i.test(body)) hasSystem = true;
        }

        // Show buttons based on which sound types exist in block
        if (hasCustom && hasSystem) {
          // Both sounds: show both sub-buttons
          lenses.push(this.makeLens(range, '👁 显示(自定义)', 'showBlockCustom', headerLine));
          lenses.push(this.makeLens(range, '👁 显示(系统)', 'showBlockSystem', headerLine));
        } else if (hasCustom) {
          lenses.push(this.makeLens(range, '👁 显示(自定义)', 'showBlockCustom', headerLine));
        } else if (hasSystem) {
          lenses.push(this.makeLens(range, '👁 显示(系统)', 'showBlockSystem', headerLine));
        } else {
          // No sound lines: simple show
          lenses.push(this.makeLens(range, '👁 显示', 'showBlockCustom', headerLine));
        }
        lenses.push(this.makeLens(range, '⊘ 隐藏', 'hideBlock', headerLine));
        lenses.push(this.makeLens(range, '🚫 禁用', 'disableBlock', headerLine));
      }
    }

    return lenses;
  }

  private makeLens(
    range: vscode.Range,
    title: string,
    command: string,
    line: number
  ): vscode.CodeLens {
    return new vscode.CodeLens(range, {
      title,
      command: 'poe-filter-best._codeLensAction',
      arguments: [command, line],
    });
  }

  /**
   * Find end line of a block starting at headerLine.
   */
  private findBlockEnd(document: vscode.TextDocument, headerLine: number): number {
    let end = headerLine;
    for (let i = headerLine + 1; i < document.lineCount; i++) {
      const t = document.lineAt(i).text.trim();
      if (t === '') continue;
      if (/^(Show|Hide)\b/i.test(t) || /^#\s*(Show|Hide)\b/i.test(t)) break;
      end = i;
    }
    return end;
  }
}
