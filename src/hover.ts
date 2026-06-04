import * as vscode from 'vscode';
import { getKeywordDef } from './data';

export class PoeFilterHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | undefined {
    const range = document.getWordRangeAtPosition(position, /\b[A-Za-z]+\b/);
    if (!range) {
      return undefined;
    }

    const word = document.getText(range);
    const def = getKeywordDef(word);
    if (!def) {
      return undefined;
    }

    const md = new vscode.MarkdownString();
    md.appendMarkdown(`## \`${def.keyword}\`\n\n`);
    md.appendMarkdown(`**${def.description}**\n\n`);
    md.appendMarkdown(def.detail.replace(/\n/g, '  \n'));

    if (def.params && def.params.length > 0) {
      md.appendMarkdown('\n\n**参数：**\n');
      for (const p of def.params) {
        md.appendMarkdown(`- \`${p}\`\n`);
      }
    }

    if (def.validValues && def.validValues.length > 0) {
      md.appendMarkdown('\n\n**可选值：**\n');
      md.appendCodeblock(def.validValues.join(' | '), 'poe-filter');
    }

    if (def.operators && def.operators.length > 0) {
      md.appendMarkdown('\n\n**运算符：**\n');
      md.appendCodeblock(def.operators.join('  '), 'poe-filter');
    }

    return new vscode.Hover(md, range);
  }
}
