import type { ChangeEvent, ReactElement, ReactNode } from 'react';
import { useRef } from 'react';
import { Badge } from '../../primitives/badge/badge.js';
import { Button } from '../../primitives/button/button.js';
import { Icon } from '../../primitives/icon/icon.js';
import { IconButton } from '../../primitives/icon-button/icon-button.js';
import { Textarea } from '../../primitives/textarea/textarea.js';
import './file-bundle-editor.css';

export type FileBundleEditorEncoding = 'text' | 'base64';

export interface FileBundleEditorFile {
  readonly path: string;
  readonly encoding: FileBundleEditorEncoding;
  readonly content: string;
  readonly sizeLabel?: string;
}

export interface FileBundleEditorTextEditorProps {
  readonly file: FileBundleEditorFile;
  readonly value: string;
  readonly disabled: boolean;
  readonly onChange: (value: string) => void;

  readonly 'aria-label': string;
}

export interface FileBundleEditorProps {
  readonly files: readonly FileBundleEditorFile[];
  readonly activePath: string | null;
  readonly onActivePathChange: (path: string) => void;
  readonly onTextChange: (path: string, content: string) => void;
  readonly onRemove: (path: string) => void;
  readonly onUploadFiles: (files: File[]) => void;
  readonly onUploadFolder: (files: File[]) => void;

  readonly disabled?: boolean;
  readonly fileUploadLabel?: string;
  readonly folderUploadLabel?: string;
  readonly fileListLabel?: string;
  readonly emptyLabel?: string;
  readonly renderTextEditor?: (props: FileBundleEditorTextEditorProps) => ReactNode;

  readonly 'aria-label': string;
  readonly 'data-testid'?: string;
}

function filesFromList(list: FileList | null | undefined): File[] {
  return list ? Array.from(list) : [];
}

function activeFileFor(
  files: readonly FileBundleEditorFile[],
  activePath: string | null,
): FileBundleEditorFile | null {
  return files.find((file) => file.path === activePath) ?? files[0] ?? null;
}

export function FileBundleEditor({
  files,
  activePath,
  onActivePathChange,
  onTextChange,
  onRemove,
  onUploadFiles,
  onUploadFolder,
  disabled = false,
  fileUploadLabel = 'Upload file',
  folderUploadLabel = 'Upload folder',
  fileListLabel = 'Files',
  emptyLabel = 'No files loaded.',
  renderTextEditor,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: FileBundleEditorProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const activeFile = activeFileFor(files, activePath);
  const folderAttributes: Record<string, string> = { webkitdirectory: '' };

  const acceptInputFiles = (
    event: ChangeEvent<HTMLInputElement>,
    onAccepted: (accepted: File[]) => void,
  ): void => {
    const accepted = filesFromList(event.currentTarget.files);
    event.currentTarget.value = '';
    if (disabled || accepted.length === 0) return;
    onAccepted(accepted);
  };

  const editor = fileBundleTextEditor({ activeFile, disabled, onTextChange, renderTextEditor });

  return (
    <section aria-label={ariaLabel} className="ui-file-bundle-editor" data-testid={dataTestId}>
      <div className="ui-file-bundle-editor__toolbar">
        <input
          className="ui-file-bundle-editor__input"
          disabled={disabled}
          onChange={(event) => acceptInputFiles(event, onUploadFiles)}
          ref={fileInputRef}
          type="file"
        />
        <input
          className="ui-file-bundle-editor__input"
          disabled={disabled}
          multiple
          onChange={(event) => acceptInputFiles(event, onUploadFolder)}
          ref={folderInputRef}
          type="file"
          {...folderAttributes}
        />
        <Button
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
        >
          <Icon name="file" />
          {fileUploadLabel}
        </Button>
        <Button
          disabled={disabled}
          onClick={() => folderInputRef.current?.click()}
          variant="secondary"
        >
          <Icon name="folder" />
          {folderUploadLabel}
        </Button>
      </div>

      <div className="ui-file-bundle-editor__workspace">
        <nav aria-label={fileListLabel} className="ui-file-bundle-editor__files">
          <div className="ui-file-bundle-editor__files-header">{fileListLabel}</div>
          {files.length > 0 ? (
            <ul className="ui-file-bundle-editor__file-list">
              {files.map((file) => {
                const active = activeFile?.path === file.path;
                return (
                  <li className="ui-file-bundle-editor__file-row" key={file.path}>
                    <button
                      aria-current={active ? 'true' : undefined}
                      className="ui-file-bundle-editor__file-select"
                      data-active={active ? 'true' : undefined}
                      onClick={() => onActivePathChange(file.path)}
                      type="button"
                    >
                      <Icon name={file.encoding === 'text' ? 'file-text' : 'file'} size={14} />
                      <span className="ui-file-bundle-editor__file-name">{file.path}</span>
                      {file.sizeLabel ? (
                        <span className="ui-file-bundle-editor__file-size">{file.sizeLabel}</span>
                      ) : null}
                    </button>
                    <IconButton
                      aria-label={`Remove ${file.path}`}
                      disabled={disabled}
                      onClick={() => onRemove(file.path)}
                      variant="ghost"
                    >
                      <Icon name="x" size={14} />
                    </IconButton>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ui-file-bundle-editor__empty">{emptyLabel}</p>
          )}
        </nav>

        <div className="ui-file-bundle-editor__editor">
          {activeFile ? (
            <>
              <div className="ui-file-bundle-editor__editor-header">
                <div className="ui-file-bundle-editor__editor-title">
                  <Icon name={activeFile.encoding === 'text' ? 'file-text' : 'file'} size={16} />
                  <span>{activeFile.path}</span>
                </div>
                <Badge tone={activeFile.encoding === 'text' ? 'accent' : 'dim'} variant="soft">
                  {activeFile.encoding === 'text' ? 'text' : 'read-only'}
                </Badge>
              </div>
              {activeFile.encoding === 'text' ? (
                editor
              ) : (
                <div className="ui-file-bundle-editor__binary">
                  <Icon name="lock" size={20} />
                  <strong>Binary file</strong>
                  <span>This file is included in the bundle but cannot be edited here.</span>
                  {activeFile.sizeLabel ? <code>{activeFile.sizeLabel}</code> : null}
                </div>
              )}
            </>
          ) : (
            <div className="ui-file-bundle-editor__placeholder">
              <Icon name="file-text" size={20} />
              <span>No active file.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function fileBundleTextEditor(input: {
  readonly activeFile: FileBundleEditorFile | null;
  readonly disabled: boolean;
  readonly onTextChange: (path: string, content: string) => void;
  readonly renderTextEditor?: (props: FileBundleEditorTextEditorProps) => ReactNode;
}): ReactNode {
  const { activeFile, disabled, onTextChange, renderTextEditor } = input;
  if (activeFile?.encoding !== 'text') return null;
  if (renderTextEditor) {
    return renderTextEditor({
      file: activeFile,
      value: activeFile.content,
      disabled,
      onChange: (content) => onTextChange(activeFile.path, content),
      'aria-label': `Edit ${activeFile.path}`,
    });
  }
  return (
    <Textarea
      aria-label={`Edit ${activeFile.path}`}
      className="ui-file-bundle-editor__textarea"
      disabled={disabled}
      onChange={(event) => onTextChange(activeFile.path, event.target.value)}
      rows={16}
      value={activeFile.content}
    />
  );
}
