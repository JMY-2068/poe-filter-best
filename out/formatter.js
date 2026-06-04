"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterSelectionFormatter = exports.PoeFilterDocumentFormatter = void 0;
exports.formatFilterText = formatFilterText;
const vscode = require("vscode");
const INDENT = '    ';
// Split a trimmed line into content before # and inline comment
// Respects quoted strings — # inside quotes is not a comment
function splitInlineComment(line) {
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuote = !inQuote;
        }
        else if (line[i] === '#' && !inQuote) {
            return {
                content: line.substring(0, i).trimEnd(),
                inlineComment: line.substring(i + 1).trim(),
            };
        }
    }
    return { content: line, inlineComment: '' };
}
function parseFilter(text) {
    const lines = text.split(/\r?\n/);
    const blocks = [];
    const leadingComments = [];
    let current = null;
    let inLeading = true;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') {
            continue;
        }
        // Standalone comment line (# at start)
        if (trimmed.startsWith('#')) {
            if (inLeading) {
                leadingComments.push(trimmed);
            }
            else if (current) {
                const afterHash = trimmed.replace(/^#\s*/, '');
                // Detect commented-out syntax lines (# followed by a keyword)
                const isCommentedSyntax = /^\s*(Show|Hide)\b/i.test(afterHash) ||
                    /^(ItemLevel|DropLevel|Quality|Rarity|Class|BaseType|Prophecy|LinkedSockets|SocketGroup|Sockets|Height|Width|HasExplicitMod|HasEnchantment|AnyEnchantment|Stack|StackSize|GemLevel|GemQualityType|AlternateQuality|Identified|Corrupted|Mirrored|ElderItem|ShaperItem|HasInfluence|FracturedItem|SynthesisedItem|ShapedMap|ElderMap|BlightedMap|UberBlightedMap|MapTier|WaystoneTier|SetTextColor|SetBackgroundColor|SetBorderColor|SetFontSize|MinimapIcon|PlayEffect|PlayAlertSound|PlayAlertSoundPositional|CustomAlertSound|DisableDropSound|EnableDropSound|DisableDropSoundIfAlertSound|Continue|AreaLevel|Scourged|EnchantmentPassiveNode|EnchantmentPassiveNum|BaseDefencePercentile|BaseArmour|BaseEnergyShield|BaseEvasion|BaseWard|BaseCritChance|BaseAttackSpeed|ArchnemesisMod|TransfiguredGem|HasMod|HasSearingExarchImplicit|HasEaterOfWorldsImplicit|HasCruciblePassiveTree)\b/i.test(afterHash);
                current.lines.push({
                    type: isCommentedSyntax ? 'commented-syntax' : 'pure-comment',
                    content: '',
                    inlineComment: '',
                    rawComment: trimmed,
                });
            }
            continue;
        }
        inLeading = false;
        // Block header: Show/Hide [optional # comment]
        const headerMatch = trimmed.match(/^(Show|Hide)\b\s*(.*)/i);
        if (headerMatch) {
            if (current) {
                blocks.push(current);
            }
            const afterKeyword = headerMatch[2];
            const { content, inlineComment } = splitInlineComment(afterKeyword);
            current = {
                header: headerMatch[1],
                headerComment: inlineComment || content.trim(),
                lines: [],
            };
            continue;
        }
        // Body line inside block
        if (current) {
            const { content, inlineComment } = splitInlineComment(trimmed);
            current.lines.push({ type: 'syntax', content, inlineComment, rawComment: '' });
        }
    }
    if (current) {
        blocks.push(current);
    }
    return { blocks, leadingComments };
}
// Normalize a syntax line: keyword [operator] [value] with proper spacing
function normalizeSyntaxLine(line) {
    // Split into tokens respecting quoted strings
    let remaining = line.trim();
    let inQuote = false;
    // Extract the keyword first
    const keywordMatch = remaining.match(/^(\S+)/);
    if (!keywordMatch) {
        return remaining;
    }
    const keyword = keywordMatch[1];
    remaining = remaining.substring(keyword.length).trim();
    // Normalize spaced operators: "= =" -> "==", "> =" -> ">="
    remaining = remaining.replace(/^(=|>|<|!)\s+(=)/, '$1$2');
    // Check if next token is an operator (== must come before = in regex)
    const operatorMatch = remaining.match(/^(>=|<=|!=|==|[><=])/);
    let operator = '';
    if (operatorMatch) {
        operator = operatorMatch[1];
        remaining = remaining.substring(operator.length).trim();
    }
    // Normalize the rest (values with quoted strings)
    const valueParts = [];
    while (remaining.length > 0) {
        if (!inQuote) {
            const quoteIdx = remaining.indexOf('"');
            if (quoteIdx === -1) {
                valueParts.push(remaining.replace(/\s+/g, ' ').trim());
                break;
            }
            const before = remaining.substring(0, quoteIdx).replace(/\s+/g, ' ').trim();
            if (before) {
                valueParts.push(before);
            }
            valueParts.push('"');
            remaining = remaining.substring(quoteIdx + 1);
            inQuote = true;
        }
        else {
            const quoteIdx = remaining.indexOf('"');
            if (quoteIdx === -1) {
                valueParts.push(remaining);
                break;
            }
            valueParts.push(remaining.substring(0, quoteIdx));
            valueParts.push('"');
            remaining = remaining.substring(quoteIdx + 1);
            inQuote = false;
            // After closing quote, ensure space before next token
            if (remaining.length > 0) {
                valueParts.push(' ');
            }
        }
    }
    // Join parts with empty string — spaces are already handled
    const value = valueParts.join('').trim();
    // Reconstruct: keyword [operator] [value]
    let result = keyword;
    if (operator) {
        result += ` ${operator}`;
    }
    if (value) {
        result += ` ${value}`;
    }
    return result;
}
function formatBlock(block) {
    const lines = [];
    // Header: Show # comment
    let header = block.header;
    if (block.headerComment) {
        const comment = block.headerComment.replace(/\s+/g, ' ').trim();
        header += ` # ${comment}`;
    }
    lines.push(header);
    for (const bl of block.lines) {
        if (bl.type === 'pure-comment') {
            lines.push('');
            lines.push(bl.rawComment);
        }
        else if (bl.type === 'commented-syntax') {
            lines.push(bl.rawComment);
        }
        else {
            let formatted = normalizeSyntaxLine(bl.content);
            if (bl.inlineComment) {
                formatted += ` # ${bl.inlineComment}`;
            }
            lines.push(INDENT + formatted);
        }
    }
    return lines.join('\n');
}
function formatFilterText(text) {
    const { blocks, leadingComments } = parseFilter(text);
    const formatted = [];
    for (const cmt of leadingComments) {
        formatted.push(cmt);
    }
    for (let i = 0; i < blocks.length; i++) {
        if (formatted.length > 0) {
            formatted.push('');
        }
        formatted.push(formatBlock(blocks[i]));
    }
    return formatted.join('\n') + '\n';
}
class PoeFilterDocumentFormatter {
    provideDocumentFormattingEdits(document, _options, _token) {
        const fullText = document.getText();
        const formatted = formatFilterText(fullText);
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(fullText.length));
        return [vscode.TextEdit.replace(fullRange, formatted)];
    }
}
exports.PoeFilterDocumentFormatter = PoeFilterDocumentFormatter;
class PoeFilterSelectionFormatter {
    provideDocumentRangeFormattingEdits(document, range, _options, _token) {
        const selectedText = document.getText(range);
        const formatted = formatFilterText(selectedText);
        return [vscode.TextEdit.replace(range, formatted)];
    }
}
exports.PoeFilterSelectionFormatter = PoeFilterSelectionFormatter;
//# sourceMappingURL=formatter.js.map