import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { MINIMAP_COLORS, MINIMAP_SHAPES, PLAY_EFFECT_COLORS } from './data';

/**
 * QuickPick-based parameter picker for MinimapIcon and PlayEffect lines.
 *
 * Shows CodeLens buttons above each line:
 *   MinimapIcon → [📐 大小] [🎨 颜色] [⬡ 形状]
 *   PlayEffect  → [🎨 颜色]
 *
 * Click → QuickPick list → selection replaces/inserts value.
 */

const COLOR_ICONS: Record<string, string> = {
  Red: '🔴', Green: '🟢', Blue: '🔵',
  Brown: '🟤', White: '⚪', Yellow: '🟡',
  Cyan: '🔵', Grey: '⚫', Orange: '🟠',
  Pink: '💗', Purple: '🟣',
};

const COLOR_LABELS: Record<string, string> = {
  Red: '红色', Green: '绿色', Blue: '蓝色',
  Brown: '棕色', White: '白色', Yellow: '黄色',
  Cyan: '青色', Grey: '灰色', Orange: '橙色',
  Pink: '粉色', Purple: '紫色',
};

const SHAPE_LABELS: Record<string, string> = {
  Circle: '圆形', Diamond: '钻石', Hexagon: '六边形',
  Square: '四边形', Star: '五角星', Triangle: '三角形',
  Cross: '十字架', Moon: '月亮', Raindrop: '雨滴',
  Kite: '风筝', Pentagon: '五边形', UpsideDownHouse: '盾牌',
};

export class PoeFilterPickerProvider implements vscode.CodeLensProvider {
  private _onDidChange = new vscode.EventEmitter<void>();
  onDidChangeCodeLenses = this._onDidChange.event;

  constructor(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument(() => this._onDidChange.fire()),
    );

    const cmds: [string, (e: vscode.TextEditor, line: number) => Promise<void>][] = [
      ['_pickMinimapSize', this.pickMinimapSize],
      ['_pickMinimapColor', this.pickMinimapColor],
      ['_pickMinimapShape', this.pickMinimapShape],
      ['_pickEffectColor', this.pickEffectColor],
      ['_playSound', this.playSound],
    ];
    for (const [suffix, handler] of cmds) {
      const cmdId = `poe-filter-best.${suffix}`;
      context.subscriptions.push(
        vscode.commands.registerTextEditorCommand(cmdId, async (editor, _edit, line: number) => {
          await handler.call(this, editor, line);
        })
      );
    }
  }

  // ── CodeLens ────────────────────────────────────────────────────────

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const trimmed = document.lineAt(i).text.trim();

      // Only active lines (not commented-out)
      if (trimmed.startsWith('#')) continue;

      const eol = new vscode.Range(i, document.lineAt(i).text.length, i, document.lineAt(i).text.length);

      if (/^MinimapIcon\b/i.test(trimmed)) {
        lenses.push(this.lens(eol, '📐 大小', '_pickMinimapSize', i));
        lenses.push(this.lens(eol, '🎨 颜色', '_pickMinimapColor', i));
        lenses.push(this.lens(eol, '⬡ 形状', '_pickMinimapShape', i));
      }

      if (/^PlayEffect\b/i.test(trimmed)) {
        lenses.push(this.lens(eol, '🎨 颜色', '_pickEffectColor', i));
      }

      // CustomAlertSound: show 试听 button only if sound file exists
      if (/^CustomAlertSound\s+"/i.test(trimmed)) {
        const soundRelPath = trimmed.match(/^CustomAlertSound\s+"([^"]+)"/i)?.[1];
        if (soundRelPath) {
          const filterDir = path.dirname(document.uri.fsPath);
          const fullPath = path.resolve(filterDir, soundRelPath);
          if (fs.existsSync(fullPath)) {
            lenses.push(this.lens(eol, '🔊 试听', '_playSound', i));
          }
        }
      }
    }

    return lenses;
  }

  private lens(range: vscode.Range, title: string, cmd: string, line: number): vscode.CodeLens {
    return new vscode.CodeLens(range, {
      title,
      command: `poe-filter-best.${cmd}`,
      arguments: [line],
    });
  }

  // ── QuickPick handlers ──────────────────────────────────────────────

  private async pickMinimapSize(editor: vscode.TextEditor, line: number) {
    const items = [
      { label: '0', description: '小', detail: '小图标' },
      { label: '1', description: '中', detail: '中等图标' },
      { label: '2', description: '大', detail: '大图标' },
    ];
    const picked = await vscode.window.showQuickPick(items, { placeHolder: '选择图标大小' });
    if (picked) this.replaceParam(editor, line, 1, picked.label);
  }

  private async pickMinimapColor(editor: vscode.TextEditor, line: number) {
    const items = MINIMAP_COLORS.map(c => ({
      label: `${COLOR_ICONS[c] || ''} ${c}(${COLOR_LABELS[c] || c})`,
      value: c,
    }));
    const picked = await vscode.window.showQuickPick(items, { placeHolder: '选择图标颜色' });
    if (picked) this.replaceParam(editor, line, 2, picked.value);
  }

  private async pickMinimapShape(editor: vscode.TextEditor, line: number) {
    const items = MINIMAP_SHAPES.map(s => ({
      label: `${s}(${SHAPE_LABELS[s] || s})`,
      value: s,
    }));
    const picked = await vscode.window.showQuickPick(items, { placeHolder: '选择图标形状' });
    if (picked) this.replaceParam(editor, line, 3, picked.value);
  }

  private async pickEffectColor(editor: vscode.TextEditor, line: number) {
    const items = PLAY_EFFECT_COLORS.map(c => ({
      label: `${COLOR_ICONS[c] || ''} ${c}(${COLOR_LABELS[c] || c})`,
      value: c,
    }));
    const picked = await vscode.window.showQuickPick(items, { placeHolder: '选择光柱颜色' });
    if (picked) this.replaceParam(editor, line, 1, picked.value);
  }

  // ── Sound preview ────────────────────────────────────────────────────

  private async playSound(editor: vscode.TextEditor, line: number) {
    const trimmed = editor.document.lineAt(line).text.trim();
    const soundRelPath = trimmed.match(/^CustomAlertSound\s+"([^"]+)"/i)?.[1];
    if (!soundRelPath) return;

    const filterDir = path.dirname(editor.document.uri.fsPath);
    const fullPath = path.resolve(filterDir, soundRelPath);
    if (!fs.existsSync(fullPath)) {
      vscode.window.showWarningMessage(`音效文件不存在: ${soundRelPath}`);
      return;
    }

    // Use system command to play audio
    const cmd = process.platform === 'win32'
      ? `start "" "${fullPath}"`
      : process.platform === 'darwin'
        ? `afplay "${fullPath}"`
        : `xdg-open "${fullPath}"`;

    exec(cmd, (err) => {
      if (err) {
        vscode.window.showErrorMessage(`播放失败: ${err.message}`);
      }
    });
  }

  // ── Line editing ────────────────────────────────────────────────────

  /**
   * Replace (or append) parameter at 1-based index after the keyword.
   * MinimapIcon: 1=size  2=color  3=shape
   * PlayEffect:  1=color
   */
  private replaceParam(editor: vscode.TextEditor, line: number, paramIndex: number, value: string) {
    const lineText = editor.document.lineAt(line).text;

    const kwMatch = lineText.match(/\b(MinimapIcon|PlayEffect)\b/i);
    if (!kwMatch) return;

    const kwEnd = (kwMatch.index ?? 0) + kwMatch[0].length;
    const rest = lineText.substring(kwEnd);

    // Parse space-separated params, stop at inline comment
    const paramParts: { start: number; end: number }[] = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(rest)) !== null) {
      if (m[0].startsWith('#')) break;
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
    } else {
      // Append new param after last one (or right after keyword)
      const insertPos = paramParts.length > 0
        ? paramParts[paramParts.length - 1].end
        : kwEnd;
      edit.insert(editor.document.uri, new vscode.Position(line, insertPos), ` ${value}`);
    }

    vscode.workspace.applyEdit(edit);
  }
}
