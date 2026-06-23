import { type DragEvent, type ReactElement, useId, useState } from 'react';
import { Icon, IconButton } from '../../primitives/index.js';
import './file-dropzone.css';

/** Per-file upload lifecycle for the metadata list. */
export type FileDropzoneItemStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface FileDropzoneItem {
  readonly id: string;
  readonly name: string;
  readonly sizeLabel?: string;
  readonly fingerprint?: string;

  readonly status?: FileDropzoneItemStatus;
  /** Determinate progress 0–100, shown while status is 'uploading'. */
  readonly progress?: number;
  readonly previewUrl?: string;
  readonly errorMessage?: string;
}

export interface FileDropzoneProps {
  readonly files?: readonly FileDropzoneItem[];
  readonly onFilesAccepted: (files: File[]) => void;

  readonly title?: string;
  readonly description?: string;
  readonly accept?: string;
  readonly multiple?: boolean;
  /** Pick a whole directory; selected files keep their folder-relative path. */
  readonly directory?: boolean;
  readonly disabled?: boolean;

  readonly onRemove?: (id: string) => void;
  readonly onRetry?: (id: string) => void;

  readonly 'aria-label': string;
  readonly 'data-testid'?: string;
}

function clampProgress(value: number | undefined): number {
  if (value === undefined) return 0;
  return Math.min(100, Math.max(0, value));
}

function filesFromList(list: FileList | null | undefined): File[] {
  return list ? Array.from(list) : [];
}

export function FileDropzone({
  files = [],
  onFilesAccepted,
  title = 'Drop files here',
  description = 'Choose files or drag them into this area.',
  accept,
  multiple = false,
  directory = false,
  disabled = false,
  onRemove,
  onRetry,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: FileDropzoneProps): ReactElement {
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const directoryAttributes: Record<string, string> = directory ? { webkitdirectory: '' } : {};

  const acceptFiles = (accepted: File[]): void => {
    if (disabled || accepted.length === 0) return;
    onFilesAccepted(accepted);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>): void => {
    event.preventDefault();
    setIsDragging(false);
    acceptFiles(filesFromList(event.dataTransfer.files));
  };

  return (
    <div className="ui-file-dropzone" data-testid={dataTestId}>
      <label
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        className="ui-file-dropzone__target"
        data-dragging={isDragging || undefined}
        htmlFor={inputId}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          className="ui-file-dropzone__input"
          disabled={disabled}
          id={inputId}
          multiple={multiple || directory}
          onChange={(event) => acceptFiles(filesFromList(event.target.files))}
          type="file"
          {...directoryAttributes}
        />
        <span className="ui-file-dropzone__icon">
          <Icon name="file" />
        </span>
        <span className="ui-file-dropzone__copy">
          <strong>{title}</strong>
          <span>{description}</span>
        </span>
      </label>

      {files.length > 0 ? (
        <ul className="ui-file-dropzone__files">
          {files.map((file) => (
            <FileDropzoneFileItem file={file} key={file.id} onRemove={onRemove} onRetry={onRetry} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FileDropzoneFileItem({
  file,
  onRemove,
  onRetry,
}: {
  readonly file: FileDropzoneItem;
  readonly onRemove?: (id: string) => void;
  readonly onRetry?: (id: string) => void;
}): ReactElement {
  const status = file.status ?? 'done';
  return (
    <li className="ui-file-dropzone__file" data-status={status}>
      <span className="ui-file-dropzone__thumb">
        {file.previewUrl ? (
          <img alt="" className="ui-file-dropzone__thumb-img" src={file.previewUrl} />
        ) : (
          <Icon name="file-text" />
        )}
      </span>

      <div className="ui-file-dropzone__file-main">
        <div className="ui-file-dropzone__file-head">
          <span className="ui-file-dropzone__file-name">{file.name}</span>
          {file.sizeLabel ? (
            <span className="ui-file-dropzone__file-meta">{file.sizeLabel}</span>
          ) : null}
        </div>

        <FileDropzoneProgress file={file} status={status} />

        {status === 'error' && file.errorMessage ? (
          <span className="ui-file-dropzone__file-error">{file.errorMessage}</span>
        ) : null}

        {file.fingerprint ? (
          <code className="ui-file-dropzone__fingerprint">{file.fingerprint}</code>
        ) : null}
      </div>

      <FileDropzoneFileActions file={file} onRemove={onRemove} onRetry={onRetry} status={status} />
    </li>
  );
}

function FileDropzoneProgress({
  file,
  status,
}: {
  readonly file: FileDropzoneItem;
  readonly status: FileDropzoneItemStatus;
}): ReactElement | null {
  if (status !== 'uploading') return null;
  const progress = clampProgress(file.progress);
  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={progress}
      className="ui-file-dropzone__progress"
      role="progressbar"
    >
      <span className="ui-file-dropzone__progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}

function FileDropzoneFileActions({
  file,
  onRemove,
  onRetry,
  status,
}: {
  readonly file: FileDropzoneItem;
  readonly onRemove?: (id: string) => void;
  readonly onRetry?: (id: string) => void;
  readonly status: FileDropzoneItemStatus;
}): ReactElement {
  return (
    <div className="ui-file-dropzone__file-actions">
      {status === 'done' ? (
        <Icon className="ui-file-dropzone__file-done" name="check" size={16} />
      ) : null}
      {status === 'error' && onRetry ? (
        <IconButton
          aria-label={`Retry ${file.name}`}
          onClick={() => onRetry(file.id)}
          variant="ghost"
        >
          <Icon name="refresh" size={14} />
        </IconButton>
      ) : null}
      {onRemove ? (
        <IconButton
          aria-label={`Remove ${file.name}`}
          onClick={() => onRemove(file.id)}
          variant="ghost"
        >
          <Icon name="x" size={14} />
        </IconButton>
      ) : null}
    </div>
  );
}
