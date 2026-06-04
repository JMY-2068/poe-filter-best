"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterDocumentLinkProvider = void 0;
const vscode = require("vscode");
/**
 * DocumentLinkProvider for BaseType quoted strings.
 * Each quoted item in a BaseType line gets an underline decoration
 * and Ctrl+Click opens the wiki page for that item.
 *
 * POE1 filter (contains "Divination Cards") → https://poedb.tw/cn/{Item_Name}
 * POE2 filter (default)                     → https://poe2db.tw/cn/{Item_Name}
 */
class PoeFilterDocumentLinkProvider {
    provideDocumentLinks(document, _token) {
        const links = [];
        // Detect POE version: POE1 filters contain "Divination Cards"
        const fullText = document.getText();
        const isPoe1 = fullText.includes('Divination Cards');
        const domain = isPoe1 ? 'poedb.tw' : 'poe2db.tw';
        const label = isPoe1 ? 'poedb' : 'poe2db';
        for (let i = 0; i < document.lineCount; i++) {
            const lineText = document.lineAt(i).text;
            const trimmed = lineText.trim();
            // Skip comment-only lines (disabled blocks etc.)
            if (trimmed.startsWith('#'))
                continue;
            // Find BaseType keyword
            const btIdx = lineText.search(/\bBaseType\b/i);
            if (btIdx === -1)
                continue;
            // Search quoted strings after the BaseType keyword
            const afterBt = lineText.substring(btIdx);
            const regex = /"([^"]+)"/g;
            let m;
            while ((m = regex.exec(afterBt)) !== null) {
                const itemName = m[1];
                const urlName = itemName.replace(/ /g, '_');
                const url = `https://${domain}/cn/${encodeURIComponent(urlName)}`;
                const startCol = btIdx + m.index;
                const endCol = startCol + m[0].length;
                const range = new vscode.Range(i, startCol, i, endCol);
                const link = new vscode.DocumentLink(range, vscode.Uri.parse(url));
                link.tooltip = `查看 ${itemName} — ${label}.tw`;
                links.push(link);
            }
        }
        return links;
    }
}
exports.PoeFilterDocumentLinkProvider = PoeFilterDocumentLinkProvider;
//# sourceMappingURL=documentLinks.js.map