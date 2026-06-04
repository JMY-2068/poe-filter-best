import * as vscode from 'vscode';

/**
 * DocumentColorProvider for PoE filter files.
 * Provides inline color previews for SetTextColor / SetBackgroundColor / SetBorderColor.
 */

const COLOR_KW_REGEX = /\b(SetTextColor|SetBackgroundColor|SetBorderColor)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+(\d+))?/gi;

export class PoeFilterColorProvider implements vscode.DocumentColorProvider {
  provideDocumentColors(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ColorInformation[] {
    const colors: vscode.ColorInformation[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const text = document.lineAt(i).text;
      const cleanText = this.stripComment(text);

      COLOR_KW_REGEX.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = COLOR_KW_REGEX.exec(cleanText)) !== null) {
        const r = parseInt(match[2], 10);
        const g = parseInt(match[3], 10);
        const b = parseInt(match[4], 10);
        const a = match[5] ? parseInt(match[5], 10) : 255;

        if (isNaN(r) || isNaN(g) || isNaN(b)) continue;

        // Find keyword in original text to compute correct range
        const kwLower = match[1].toLowerCase();
        const kwIdx = text.toLowerCase().indexOf(kwLower);
        if (kwIdx < 0) continue;

        // Value start: after keyword + whitespace
        const afterKw = text.substring(kwIdx + match[1].length);
        const wsMatch = afterKw.match(/^(\s*)/)!;
        const valStart = kwIdx + match[1].length + wsMatch[1].length;

        // Value end: parse through the numbers
        let valEnd = valStart;
        const numRegex = /\d+/g;
        numRegex.lastIndex = valStart;
        let lastNumMatch: RegExpExecArray | null;
        let numCount = 0;
        while ((lastNumMatch = numRegex.exec(text)) !== null && numCount < 4) {
          valEnd = lastNumMatch.index + lastNumMatch[0].length;
          numCount++;
          if (numCount >= 3 && !match[5]) break;
        }

        const range = new vscode.Range(i, valStart, i, valEnd);
        const color = new vscode.Color(r / 255, g / 255, b / 255, a / 255);
        colors.push(new vscode.ColorInformation(range, color));
      }
    }

    return colors;
  }

  provideColorPresentations(
    color: vscode.Color,
    context: { document: vscode.TextDocument; range: vscode.Range },
    _token: vscode.CancellationToken
  ): vscode.ColorPresentation[] {
    const r = Math.round(color.red * 255);
    const g = Math.round(color.green * 255);
    const b = Math.round(color.blue * 255);
    const a = Math.round(color.alpha * 255);

    // Preserve original format (3 or 4 values)
    const original = context.document.getText(context.range).trim();
    const parts = original.split(/\s+/);

    const label = parts.length >= 4 || a < 255
      ? `${r} ${g} ${b} ${a}`
      : `${r} ${g} ${b}`;

    return [new vscode.ColorPresentation(label)];
  }

  private stripComment(line: string): string {
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        inQuote = !inQuote;
      } else if (line[i] === '#' && !inQuote) {
        return line.substring(0, i).trimEnd();
      }
    }
    return line;
  }
}
