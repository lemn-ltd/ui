import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@appranks/showcase-kit';
import { FileBundleEditor, type FileBundleEditorFile, MarkdownEditor } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const initialFiles: readonly FileBundleEditorFile[] = [
  {
    path: 'SKILL.md',
    encoding: 'text',
    content: '# Runtime debugging\n\nInspect logs, reproduce the behavior, and capture evidence.',
    sizeLabel: '86 B',
  },
  {
    path: 'references/checklist.md',
    encoding: 'text',
    content: '- Reproduce\n- Inspect logs\n- Add coverage',
    sizeLabel: '42 B',
  },
  {
    path: 'assets/diagram.png',
    encoding: 'base64',
    content: 'iVBORw0KGgo=',
    sizeLabel: '18 KB',
  },
];

const textExtensions = new Set(['css', 'csv', 'html', 'js', 'json', 'md', 'ts', 'txt', 'yaml']);

function isTextFile(file: File): boolean {
  const extension = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1) : '';
  return file.type.startsWith('text/') || textExtensions.has(extension.toLowerCase());
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function relativePath(file: File): string {
  const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? '';
  if (!relative) return file.name;
  const firstSlash = relative.indexOf('/');
  return firstSlash === -1 ? relative : relative.slice(firstSlash + 1);
}

async function readEditorFile(file: File): Promise<FileBundleEditorFile> {
  const path = relativePath(file);
  if (isTextFile(file)) {
    return {
      path,
      encoding: 'text',
      content: await file.text(),
      sizeLabel: formatBytes(file.size),
    };
  }
  return {
    path,
    encoding: 'base64',
    content: arrayBufferToBase64(await file.arrayBuffer()),
    sizeLabel: formatBytes(file.size),
  };
}

function BundleExample({ disabled = false }: { readonly disabled?: boolean }): ReactElement {
  const [files, setFiles] = useState<readonly FileBundleEditorFile[]>(initialFiles);
  const [activePath, setActivePath] = useState<string | null>('SKILL.md');

  const addFiles = async (accepted: File[]): Promise<void> => {
    const incoming = await Promise.all(accepted.map(readEditorFile));
    setFiles((current) => [
      ...current.filter((file) => !incoming.some((next) => next.path === file.path)),
      ...incoming,
    ]);
    setActivePath(incoming[0]?.path ?? null);
  };

  return (
    <FileBundleEditor
      activePath={activePath}
      aria-label="Skill bundle editor"
      disabled={disabled}
      files={files}
      onActivePathChange={setActivePath}
      onRemove={(path) => {
        const next = files.filter((file) => file.path !== path);
        setFiles(next);
        if (activePath === path) setActivePath(next[0]?.path ?? null);
      }}
      onTextChange={(path, content) =>
        setFiles((current) =>
          current.map((file) => (file.path === path ? { ...file, content } : file)),
        )
      }
      onUploadFiles={(accepted) => void addFiles(accepted)}
      onUploadFolder={(accepted) => void addFiles(accepted)}
      renderTextEditor={({ disabled: editorDisabled, onChange, value, 'aria-label': label }) => (
        <MarkdownEditor
          aria-label={label}
          disabled={editorDisabled}
          minRows={14}
          onChange={onChange}
          value={value}
        />
      )}
    />
  );
}

function FileBundleEditorPage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A controlled workspace for a local file bundle: host applications read files and validate paths, while the component renders upload actions, file switching, one active editor, and read-only binary placeholders."
      title="File bundle editor"
    >
      <ExampleBlock
        code={`const [files, setFiles] = useState(initialFiles);
const [activePath, setActivePath] = useState('SKILL.md');

<FileBundleEditor
  aria-label="Skill bundle editor"
  files={files}
  activePath={activePath}
  onActivePathChange={setActivePath}
  onTextChange={(path, content) => updateFile(path, content)}
  onRemove={(path) => removeFile(path)}
  onUploadFiles={(files) => readFiles(files)}
  onUploadFolder={(files) => readFolder(files)}
/>`}
        render={() => <BundleExample />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'disabled',
            render: () => <BundleExample disabled />,
          },
          {
            label: 'empty',
            render: () => (
              <FileBundleEditor
                activePath={null}
                aria-label="Empty bundle editor"
                files={[]}
                onActivePathChange={() => {}}
                onRemove={() => {}}
                onTextChange={() => {}}
                onUploadFiles={() => {}}
                onUploadFolder={() => {}}
              />
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'files',
            type: 'FileBundleEditorFile[]',
            description:
              'Controlled bundle files. Each file has a path, encoding, content, and optional size label.',
          },
          {
            name: 'activePath',
            type: 'string | null',
            description: 'Path of the file shown in the editor pane.',
          },
          {
            name: 'onTextChange',
            type: '(path: string, content: string) => void',
            description: 'Receives edits for the active text file.',
          },
          {
            name: 'onUploadFiles / onUploadFolder',
            type: '(files: File[]) => void',
            description:
              'Emits native File objects. The host reads content and updates the controlled files array.',
          },
          {
            name: 'renderTextEditor',
            type: '(props: FileBundleEditorTextEditorProps) => ReactNode',
            description:
              'Optional host editor override; omit it to use the default plain textarea.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default FileBundleEditorPage;
