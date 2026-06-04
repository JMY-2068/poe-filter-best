import * as vscode from 'vscode';

/**
 * DefinitionProvider & ReferenceProvider for PoE filter files.
 *
 * Definition: any position inside a block → block header (Show/Hide line)
 * References:
 *   - On a block header → all other block headers
 *   - On a keyword → all lines with the same keyword
 *   - Inside a quoted string → all lines containing the same string value
 */

export class PoeFilterDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Definition> {
    const blockHeader = this.findBlockHeader(document, position.line);
    if (blockHeader < 0) return null;

    const text = document.lineAt(blockHeader).text;
    const trimmed = text.trim();
    const headerMatch = trimmed.match(/^(Show|Hide)/i);
    if (!headerMatch) return null;

    const start = text.length - text.trimStart().length;
    return new vscode.Location(
      document.uri,
      new vscode.Range(blockHeader, start, blockHeader, start + headerMatch[1].length)
    );
  }

  private findBlockHeader(document: vscode.TextDocument, lineNum: number): number {
    for (let i = lineNum; i >= 0; i--) {
      const trimmed = document.lineAt(i).text.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;
      if (/^(Show|Hide)\b/i.test(trimmed)) {
        return i;
      }
    }
    return -1;
  }
}

export class PoeFilterReferenceProvider implements vscode.ReferenceProvider {
  provideReferences(
    document: vscode.TextDocument,
    position: vscode.Position,
    _context: vscode.ReferenceContext,
    _token: vscode.CancellationToken
  ): vscode.Location[] {
    const line = document.lineAt(position.line);
    const text = line.text;
    const trimmed = text.trim();

    // Check if on a block header
    if (/^(Show|Hide)\b/i.test(trimmed)) {
      return this.findBlockHeaderReferences(document);
    }

    // Check if inside a quoted string
    const quoteInfo = this.getQuotedStringAt(text, position.character);
    if (quoteInfo) {
      return this.findStringReferences(document, quoteInfo.value);
    }

    // Otherwise, find keyword references
    const content = this.stripComment(trimmed);
    const kwMatch = content.match(/^(\w+)/);
    if (kwMatch) {
      return this.findKeywordReferences(document, kwMatch[1]);
    }

    return [];
  }

  private findBlockHeaderReferences(document: vscode.TextDocument): vscode.Location[] {
    const locations: vscode.Location[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const text = document.lineAt(i).text;
      const trimmed = text.trim();
      const headerMatch = trimmed.match(/^(Show|Hide)/i);
      if (headerMatch && text.trimStart() === trimmed) {
        const start = text.length - text.trimStart().length;
        locations.push(new vscode.Location(
          document.uri,
          new vscode.Range(i, start, i, start + headerMatch[1].length)
        ));
      }
    }

    return locations;
  }

  private findKeywordReferences(document: vscode.TextDocument, keyword: string): vscode.Location[] {
    const locations: vscode.Location[] = [];
    const kwLower = keyword.toLowerCase();

    for (let i = 0; i < document.lineCount; i++) {
      const text = document.lineAt(i).text;
      const trimmed = text.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;

      const content = this.stripComment(trimmed);
      const kwMatch = content.match(/^(\w+)/);
      if (kwMatch && kwMatch[1].toLowerCase() === kwLower) {
        const start = text.length - text.trimStart().length;
        locations.push(new vscode.Location(
          document.uri,
          new vscode.Range(i, start, i, start + kwMatch[1].length)
        ));
      }
    }

    return locations;
  }

  private findStringReferences(document: vscode.TextDocument, value: string): vscode.Location[] {
    const locations: vscode.Location[] = [];
    const searchValue = `"${value}"`;

    for (let i = 0; i < document.lineCount; i++) {
      const text = document.lineAt(i).text;
      let searchFrom = 0;

      while (true) {
        const idx = text.indexOf(searchValue, searchFrom);
        if (idx < 0) break;

        locations.push(new vscode.Location(
          document.uri,
          new vscode.Range(i, idx, i, idx + searchValue.length)
        ));

        searchFrom = idx + searchValue.length;
      }
    }

    return locations;
  }

  private getQuotedStringAt(text: string, char: number): { value: string } | null {
    let inQuote = false;
    let quoteStart = -1;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === '"') {
        if (!inQuote) {
          quoteStart = i;
          inQuote = true;
        } else {
          // Closing quote
          if (char > quoteStart && char <= i) {
            return { value: text.substring(quoteStart + 1, i) };
          }
          inQuote = false;
        }
      }
    }

    return null;
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
