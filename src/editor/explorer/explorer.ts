// The Explorer's files (ARCHITECTURE.md, Command owners; the manifest's explorer-file-system and code-panel-view):
// the rows the Files section lists — what the document generates (one .html per page, the stylesheet
// css/styles.css, and js/interactions.js once the project has interactions) and the files the project holds
// (document.files) — and the door that opens one in the code pane. One owner: the row list, the row's kind, and
// files.open. Folders, renaming, moving and deleting are explorer-file-system's own work (not built yet).
import { message, registerHandler } from '../../core/commands/registry.ts';
import type { DocumentJson, Page, ProjectFile } from '../../core/document/model.ts';
import { filesOf, folderOf, folderPaths } from '../../core/files/files.ts';
import { isGenerated } from '../code-panel/code-panel.ts';
import { STYLESHEET } from '../../core/export/export.ts';
import type { ModelRules } from '../../core/document/validate.ts';
import type { EditorUi } from '../state.ts';
import { editorView } from '../view/editor-view.ts';
import { isFileOpen, openedFile } from './file-tabs.ts';

// what a row is, by its path: the badge a row shows and the syntax the pane colours it with
export type FileKind = 'html' | 'css' | 'js' | 'image' | 'font' | 'other';

export interface FileRow {
  readonly path: string;
  readonly kind: FileKind;
  // generated from the document (a page's html, the stylesheet, the interactions): its text is never stored, and its
  // path is fixed — the export writes it there
  readonly generated: boolean;
  // the file's size in bytes, or null for a generated one (its size is what it renders to now)
  readonly size: number | null;
}

const EXTENSIONS: Readonly<Record<string, FileKind>> = {
  html: 'html', htm: 'html', css: 'css', js: 'js', mjs: 'js',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', avif: 'image', svg: 'image', ico: 'image',
  woff: 'font', woff2: 'font', ttf: 'font', otf: 'font', eot: 'font',
};

export function kindOf(path: string, type = ''): FileKind {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('font/') || /font/.test(type)) return 'font';
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  return EXTENSIONS[ext] ?? 'other';
}

// Whether the project has anything for js/interactions.js to hold: the interactions group is not built yet, so there
// is never one — the file appears with that feature (export-events-js is what writes it). One place to change.
function hasInteractions(document: DocumentJson): boolean {
  void document;
  return false;
}

// The Files section's rows, in the order it lists them: what the document generates (each page's file in the pages'
// order, the stylesheet, the interactions script) and then the project's own files, each as it was uploaded.
export function fileRows(document: DocumentJson, rules: ModelRules): readonly FileRow[] {
  void rules;
  const generated: FileRow[] = [
    ...document.pages.map((page) => ({ path: page.file, kind: 'html' as const, generated: true, size: null })),
    { path: STYLESHEET, kind: 'css' as const, generated: true, size: null },
    ...(hasInteractions(document) ? [{ path: 'js/interactions.js', kind: 'js' as const, generated: true, size: null }] : []),
  ];
  const owned: FileRow[] = filesOf(document).map((file: ProjectFile) => ({ path: file.path, kind: kindOf(file.path, file.type), generated: false, size: Math.floor((file.bytes.length * 3) / 4) }));
  return [...generated, ...owned];
}

// The Explorer's tree, in the order it lists it: every folder at its path (a stored empty one too), and under it the
// files and the pages' files that stand in it, one level deeper. A page's file is a row like any other (clicking it
// opens the page's markup in the code pane), and it says which page it is.
export interface TreeRow {
  readonly path: string;
  // the folder's own row, or a file's
  readonly folder: boolean;
  readonly depth: number;
  readonly kind: FileKind;
  readonly generated: boolean;
  readonly page: string | null;
  readonly size: number | null;
}

export function treeRows(document: DocumentJson, rules: ModelRules): readonly TreeRow[] {
  void rules;
  const rows: TreeRow[] = [];
  const folders = folderPaths(document);
  const under = (folder: string): readonly string[] => folders.filter((one) => folderOf(one) === folder).sort();
  const filesIn = (folder: string): readonly { readonly path: string; readonly file: ProjectFile | null; readonly page: Page | null }[] =>
    [...filesOf(document).map((file) => ({ path: file.path, file, page: null as Page | null })), ...document.pages.map((page) => ({ path: page.file, file: null as ProjectFile | null, page }))]
      .filter((one) => folderOf(one.path) === folder)
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const walk = (folder: string, depth: number): void => {
    for (const child of under(folder)) {
      rows.push({ path: child, folder: true, depth, kind: 'other', generated: false, page: null, size: null });
      walk(child, depth + 1);
    }
    for (const one of filesIn(folder)) {
      rows.push({
        path: one.path,
        folder: false,
        depth,
        kind: kindOf(one.path, one.file?.type ?? ''),
        generated: one.page !== null || isGenerated(one.path, document),
        page: one.page?.id ?? null,
        size: one.file === null ? null : Math.floor((one.file.bytes.length * 3) / 4),
      });
    }
  };
  walk('', 0);
  return rows;
}

// files.open (the Explorer's file rows and the code files' tabs): the file shows in the code pane, and the centre
// column shows it — the canvas when the column shows both (split), the code pane otherwise (DESIGN.md: a code file
// tab shows the file in the Code view).
export const openFile = registerHandler<'files.open', EditorUi>(
  'files.open',
  ({ state, rules }, { path }) => {
    if (typeof path !== 'string' || path === '') throw new Error('files.open: a door hands the path of the file it opens');
    if (fileRows(state.document, rules).every((row) => row.path !== path)) return { kind: 'refused', message: message('status.files.missing', { path }) };
    const ui = openedFile(state.ui, path);
    return { kind: 'change', ui: editorView(state.ui) === 'split' ? ui : { ...ui, editorView: 'code' }, message: message('status.files.opened', { path }) };
  },
  (state, { path }) => typeof path === 'string' && isFileOpen(state.ui, path),
);

// files.startRename (the Explorer's row, a double-click on its name — the Layers row's own pattern): which row is
// renamed, in the editor's state, never in the document. The field that takes the name is files.rename's
// (shell/sidebar.tsx draws it in the name's place while this names the row).
export const startRenameFile = registerHandler<'files.startRename', EditorUi>(
  'files.startRename',
  ({ state }, { path }) => {
    if (typeof path !== 'string') throw new Error('files.startRename: a door hands the path of the row it renames');
    // an empty path is the end of a rename (the field kept its name): no row is renamed any more
    return { kind: 'change', ui: { ...state.ui, renamingFile: path === '' ? undefined : path } };
  },
  (state, { path }) => state.ui.renamingFile === path,
);
