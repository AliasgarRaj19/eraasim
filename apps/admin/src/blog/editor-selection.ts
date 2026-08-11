import type { Editor } from "@tiptap/core";
import { Selection } from "@tiptap/pm/state";

export type EditorSelectionSnapshot = Record<string, unknown>;

export function captureEditorSelection(editor: Editor): EditorSelectionSnapshot {
  return editor.state.selection.toJSON();
}

export function restoreEditorSelection(editor: Editor, snapshot: EditorSelectionSnapshot) {
  try {
    const selection = Selection.fromJSON(editor.state.doc, snapshot);
    editor.view.dispatch(editor.state.tr.setSelection(selection));
    return true;
  } catch {
    return false;
  }
}
