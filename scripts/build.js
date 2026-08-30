import { copyFile, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const distDirectory = path.join(projectRoot, 'dist');
export const allowedEntries = [
  'index.html',
  'css.css',
  'favicon.svg',
  'site.webmanifest',
  'robots.txt',
  'sitemap.xml',
  'src'
];

function assertSafeDistDirectory() {
  if (path.basename(distDirectory) !== 'dist' || path.dirname(distDirectory) !== projectRoot) {
    throw new Error('Refusing to clean an unexpected build directory.');
  }
}

async function copyEntry(source, destination) {
  const entry = await lstat(source);

  if (entry.isSymbolicLink()) {
    throw new Error(`Refusing to copy symbolic link: ${path.relative(projectRoot, source)}`);
  }

  if (entry.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const child of await readdir(source)) {
      await copyEntry(path.join(source, child), path.join(destination, child));
    }
    return;
  }

  if (!entry.isFile()) {
    throw new Error(`Refusing to copy unsupported file: ${path.relative(projectRoot, source)}`);
  }

  await copyFile(source, destination);
}

export async function build() {
  assertSafeDistDirectory();
  await rm(distDirectory, { recursive: true, force: true });
  await mkdir(distDirectory, { recursive: true });

  for (const relativeEntry of allowedEntries) {
    const source = path.join(projectRoot, relativeEntry);
    const destination = path.join(distDirectory, relativeEntry);
    await copyEntry(source, destination);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
}
