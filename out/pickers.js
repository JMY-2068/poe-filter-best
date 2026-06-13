"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoeFilterPickerProvider = void 0;
const vscode = require("vscode");
const data_1 = require("./data");
/**
 * QuickPick-based parameter picker for MinimapIcon and PlayEffect lines.
 *
 * Shows CodeLens buttons above each line:
 *   MinimapIcon → [📐 大小] [🎨 颜色] [⬡ 形状]
 *   PlayEffect  → [🎨 颜色]
 *
 * Click → QuickPick list → selection replaces/inserts value.
 */
const COLOR_ICONS = {
    Red: '🔴', Green: '🟢', Blue: '🔵',
    Brown: '🟤', White: '⚪', Yellow: '🟡',
    Cyan: '🔵', Grey: '⚫', Orange: '🟠',
    Pink: '💗', Purple: '🟣',
};
const COLOR_LABELS = {
    Red: '红色', Green: '绿色', Blue: '蓝色',
    Brown: '棕色', White: '白色', Yellow: '黄色',
    Cyan: '青色', Grey: '灰色', Orange: '橙色',
    Pink: '粉色', Purple: '紫色',
};
const SHAPE_LABELS = {
    Circle: '圆形', Diamond: '钻石', Hexagon: '六边形',
    Square: '四边形', Star: '五角星', Triangle: '三角形',
    Cross: '十字架', Moon: '月亮', Raindrop: '雨滴',
    Kite: '风筝', Pentagon: '五边形', UpsideDownHouse: '盾牌',
};
class PoeFilterPickerProvider {
    constructor(context) {
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChange.event;
        // Debounced: don't recompute all CodeLenses on every keystroke.
        context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => {
            if (this.debounceTimer)
                clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this._onDidChange.fire(), 300);
        }));
        // Refresh lenses when the gate setting is toggled.
        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('poe-filter-best.parameterPickerCodeLens')) {
                this._onDidChange.fire();
            }
        }));
        const cmds = [
            ['_pickMinimapSize', this.pickMinimapSize],
            ['_pickMinimapColor', this.pickMinimapColor],
            ['_pickMinimapShape', this.pickMinimapShape],
            ['_pickEffectColor', this.pickEffectColor],
        ];
        for (const [suffix, handler] of cmds) {
            const cmdId = `poe-filter-best.${suffix}`;
            context.subscriptions.push(vscode.commands.registerTextEditorCommand(cmdId, async (editor, _edit, line) => {
                await handler.call(this, editor, line);
            }));
        }
    }
    dispose() {
        if (this.debounceTimer)
            clearTimeout(this.debounceTimer);
    }
    // ── CodeLens ────────────────────────────────────────────────────────
    provideCodeLenses(document) {
        // Setting-gated, default off: MinimapIcon/PlayEffect picker lenses.
        const enabled = vscode.workspace
            .getConfiguration('poe-filter-best')
            .get('parameterPickerCodeLens', false);
        if (!enabled)
            return [];
        const lenses = [];
        for (let i = 0; i < document.lineCount; i++) {
            const trimmed = document.lineAt(i).text.trim();
            // Only active lines (not commented-out)
            if (trimmed.startsWith('#'))
                continue;
            const eol = new vscode.Range(i, document.lineAt(i).text.length, i, document.lineAt(i).text.length);
            if (/^MinimapIcon\b/i.test(trimmed)) {
                lenses.push(this.lens(eol, '📐 大小', '_pickMinimapSize', i));
                lenses.push(this.lens(eol, '🎨 颜色', '_pickMinimapColor', i));
                lenses.push(this.lens(eol, '⬡ 形状', '_pickMinimapShape', i));
            }
            if (/^PlayEffect\b/i.test(trimmed)) {
                lenses.push(this.lens(eol, '🎨 颜色', '_pickEffectColor', i));
            }
        }
        return lenses;
    }
    lens(range, title, cmd, line) {
        return new vscode.CodeLens(range, {
            title,
            command: `poe-filter-best.${cmd}`,
            arguments: [line],
        });
    }
    // ── QuickPick handlers ──────────────────────────────────────────────
    async pickMinimapSize(editor, line) {
        const items = [
            { label: '0', description: '小', detail: '小图标' },
            { label: '1', description: '中', detail: '中等图标' },
            { label: '2', description: '大', detail: '大图标' },
        ];
        const picked = await vscode.window.showQuickPick(items, { placeHolder: '选择图标大小' });
        if (picked)
            this.replaceParam(editor, line, 1, picked.label);
    }
    async pickMinimapColor(editor, line) {
        const items = data_1.MINIMAP_COLORS.map(c => ({
            label: `${COLOR_ICONS[c] || ''} ${c}(${COLOR_LABELS[c] || c})`,
            value: c,
        }));
        const picked = await vscode.window.showQuickPick(items, { placeHolder: '选择图标颜色' });
        if (picked)
            this.replaceParam(editor, line, 2, picked.value);
    }
    async pickMinimapShape(editor, line) {
        const items = data_1.MINIMAP_SHAPES.map(s => ({
            label: `${s}(${SHAPE_LABELS[s] || s})`,
            value: s,
        }));
        const picked = await vscode.window.showQuickPick(items, { placeHolder: '选择图标形状' });
        if (picked)
            this.replaceParam(editor, line, 3, picked.value);
    }
    async pickEffectColor(editor, line) {
        const items = data_1.PLAY_EFFECT_COLORS.map(c => ({
            label: `${COLOR_ICONS[c] || ''} ${c}(${COLOR_LABELS[c] || c})`,
            value: c,
        }));
        const picked = await vscode.window.showQuickPick(items, { placeHolder: '选择光柱颜色' });
        if (picked)
            this.replaceParam(editor, line, 1, picked.value);
    }
    // ── Line editing ────────────────────────────────────────────────────
    /**
     * Replace (or append) parameter at 1-based index after the keyword.
     * MinimapIcon: 1=size  2=color  3=shape
     * PlayEffect:  1=color
     */
    replaceParam(editor, line, paramIndex, value) {
        const lineText = editor.document.lineAt(line).text;
        const kwMatch = lineText.match(/\b(MinimapIcon|PlayEffect)\b/i);
        if (!kwMatch)
            return;
        const kwEnd = (kwMatch.index ?? 0) + kwMatch[0].length;
        const rest = lineText.substring(kwEnd);
        // Parse space-separated params, stop at inline comment
        const paramParts = [];
        const re = /\S+/g;
        let m;
        while ((m = re.exec(rest)) !== null) {
            if (m[0].startsWith('#'))
                break;
            paramParts.push({
                start: kwEnd + m.index,
                end: kwEnd + m.index + m[0].length,
            });
        }
        const edit = new vscode.WorkspaceEdit();
        if (paramIndex <= paramParts.length) {
            // Replace existing param
            const p = paramParts[paramIndex - 1];
            edit.replace(editor.document.uri, new vscode.Range(line, p.start, line, p.end), value);
        }
        else {
            // Append new param after last one (or right after keyword)
            const insertPos = paramParts.length > 0
                ? paramParts[paramParts.length - 1].end
                : kwEnd;
            edit.insert(editor.document.uri, new vscode.Position(line, insertPos), ` ${value}`);
        }
        vscode.workspace.applyEdit(edit);
    }
}
exports.PoeFilterPickerProvider = PoeFilterPickerProvider;
//# sourceMappingURL=pickers.js.map