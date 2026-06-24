import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';

const packageRoot = new URL('..', import.meta.url);
const srcRoot = new URL('src/', packageRoot);
const distRoot = new URL('dist/', packageRoot);

async function collectCssFiles(directoryUrl) {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const childUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
    if (entry.isDirectory()) {
      files.push(...(await collectCssFiles(childUrl)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.css')) files.push(childUrl);
  }

  return files;
}

const cssFiles = await collectCssFiles(srcRoot);

await Promise.all(
  cssFiles.map(async (sourceUrl) => {
    const relativePath = relative(srcRoot.pathname, sourceUrl.pathname);
    const targetPath = join(distRoot.pathname, relativePath);

    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourceUrl, targetPath);
  }),
);

console.log(`Copied ${cssFiles.length} CSS files to dist.`);
