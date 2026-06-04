"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterHoverProvider = void 0;
const vscode = require("vscode");
const data_1 = require("./data");
class PoeFilterHoverProvider {
    provideHover(document, position, _token) {
        const range = document.getWordRangeAtPosition(position, /\b[A-Za-z]+\b/);
        if (!range) {
            return undefined;
        }
        const word = document.getText(range);
        const def = (0, data_1.getKeywordDef)(word);
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
exports.PoeFilterHoverProvider = PoeFilterHoverProvider;
//# sourceMappingURL=hover.js.map