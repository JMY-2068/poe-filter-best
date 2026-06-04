"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterDocumentLinkProvider = void 0;
const vscode = require("vscode");
/**
 * DocumentLinkProvider for BaseType quoted strings.
 * Each quoted item in a BaseType line gets an underline decoration
 * and Ctrl+Click opens the poe2db.tw wiki page for that item.
 *
 * URL pattern: https://poe2db.tw/cn/{Item_Name_With_Underscores}
 */
class PoeFilterDocumentLinkProvider {
    provideDocumentLinks(document, _token) {
        const links = [];
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
                const url = `https://poe2db.tw/cn/${encodeURIComponent(urlName)}`;
                const startCol = btIdx + m.index;
                const endCol = startCol + m[0].length;
                const range = new vscode.Range(i, startCol, i, endCol);
                const link = new vscode.DocumentLink(range, vscode.Uri.parse(url));
                link.tooltip = `查看 ${itemName} — poe2db.tw`;
                links.push(link);
            }
        }
        return links;
    }
}
exports.PoeFilterDocumentLinkProvider = PoeFilterDocumentLinkProvider;
//# sourceMappingURL=documentLinks.js.map