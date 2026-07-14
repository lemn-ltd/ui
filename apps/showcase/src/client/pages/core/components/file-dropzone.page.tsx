import { ComponentPage, ExampleBlock, PropsTable, VariantsGallery } from '@lemn-ltd/showcase-kit';
import { FileDropzone, type FileDropzoneItem } from '@lemn-ltd/ui';
import { type ReactElement, useState } from 'react';

const uploadedSkill: FileDropzoneItem = {
  id: 'skill',
  name: 'SKILL.md',
  sizeLabel: '4 KB',
  fingerprint: 'sha256:7f9c...b12',
};

function UploadExample(): ReactElement {
  const [files, setFiles] = useState<readonly FileDropzoneItem[]>([]);
  return (
    <div style={{ width: '32rem', maxWidth: '100%' }}>
      <FileDropzone
        accept=".md,text/markdown"
        aria-label="Upload skill files"
        files={files}
        multiple
        onFilesAccepted={(accepted) =>
          setFiles(
            accepted.map((file, index) => ({
              id: `${file.name}-${index}`,
              name: file.name,
              sizeLabel: `${Math.max(1, Math.ceil(file.size / 1024))} KB`,
            })),
          )
        }
      />
    </div>
  );
}

function FileDropzonePage(): ReactElement {
  return (
    <ComponentPage
      status="stable"
      summary="A drag-and-select file input with a metadata list for accepted files. It emits File objects to the host and leaves upload, fingerprinting, and storage ownership outside the component."
      title="File dropzone"
    >
      <ExampleBlock
        code={`const [files, setFiles] = useState([]);

<FileDropzone
  aria-label="Upload skill files"
  accept=".md,text/markdown"
  multiple
  files={files}
  onFilesAccepted={(accepted) => setFiles(toItems(accepted))}
/>`}
        render={() => <UploadExample />}
      />

      <VariantsGallery
        columns={1}
        items={[
          {
            label: 'with metadata',
            render: () => (
              <div style={{ width: '32rem', maxWidth: '100%' }}>
                <FileDropzone
                  aria-label="Uploaded skills"
                  files={[uploadedSkill]}
                  onFilesAccepted={() => {}}
                />
              </div>
            ),
          },
          {
            label: 'uploading · progress',
            render: () => (
              <div style={{ width: '32rem', maxWidth: '100%' }}>
                <FileDropzone
                  aria-label="Uploading files"
                  files={[
                    { id: 'done', name: 'report.pdf', sizeLabel: '2.1 MB', status: 'done' },
                    {
                      id: 'up',
                      name: 'diagram.png',
                      progress: 60,
                      sizeLabel: '840 KB',
                      status: 'uploading',
                    },
                    {
                      errorMessage: 'Exceeds the 10 MB limit',
                      id: 'err',
                      name: 'archive.zip',
                      sizeLabel: '48 MB',
                      status: 'error',
                    },
                  ]}
                  onFilesAccepted={() => {}}
                  onRemove={() => {}}
                  onRetry={() => {}}
                />
              </div>
            ),
          },
          {
            label: 'directory (folder upload)',
            render: () => (
              <div style={{ width: '32rem', maxWidth: '100%' }}>
                <FileDropzone
                  aria-label="Upload a folder"
                  description="Pick a folder; files keep their folder-relative path."
                  directory
                  files={[]}
                  onFilesAccepted={() => {}}
                  title="Upload folder"
                />
              </div>
            ),
          },
          {
            label: 'disabled',
            render: () => (
              <div style={{ width: '32rem', maxWidth: '100%' }}>
                <FileDropzone
                  aria-label="Upload disabled"
                  disabled
                  files={[uploadedSkill]}
                  onFilesAccepted={() => {}}
                />
              </div>
            ),
          },
        ]}
      />

      <PropsTable
        rows={[
          {
            name: 'files',
            type: 'FileDropzoneItem[]',
            description: 'Optional metadata list rendered under the drop target.',
          },
          {
            name: 'onFilesAccepted',
            type: '(files: File[]) => void',
            description: 'Receives selected or dropped File objects.',
          },
          {
            name: 'accept / multiple / disabled',
            type: 'native input props',
            description: 'Forwarded to the hidden file input and mirrored in drop handling.',
          },
          {
            name: 'directory',
            type: 'boolean',
            description:
              'Pick a whole directory (webkitdirectory). Accepted files keep their folder-relative path via webkitRelativePath.',
          },
          {
            name: 'FileDropzoneItem.status / progress',
            type: "'pending' | 'uploading' | 'done' | 'error' · number",
            description:
              'Per-file lifecycle. uploading renders a determinate bar from progress (0–100); done shows a check; error shows errorMessage and a retry control.',
          },
          {
            name: 'FileDropzoneItem.previewUrl',
            type: 'string',
            description: 'Optional thumbnail rendered in place of the file icon.',
          },
          {
            name: 'onRemove / onRetry',
            type: '(id: string) => void',
            description:
              'Per-file remove control, and a retry control shown for items in the error status.',
          },
        ]}
      />
    </ComponentPage>
  );
}

export default FileDropzonePage;
