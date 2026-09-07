import { lstat, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allowedEntries, distDirectory, projectRoot } from "./build.js";

async function assertNoSymlinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    const stats = await lstat(entryPath);
    if (stats.isSymbolicLink()) {
      throw new Error(
        `Refusing to upload symbolic link: ${path.relative(projectRoot, entryPath)}`,
      );
    }
    if (stats.isDirectory()) await assertNoSymlinks(entryPath);
  }
}

export async function verifyDist() {
  const distStats = await lstat(distDirectory);
  if (!distStats.isDirectory())
    throw new Error("The Pages artifact must be a directory.");

  const actualEntries = (await readdir(distDirectory)).sort();
  const expectedEntries = [...allowedEntries].sort();
  if (JSON.stringify(actualEntries) !== JSON.stringify(expectedEntries)) {
    throw new Error(
      `Unexpected Pages artifact entries: ${actualEntries.join(", ")}`,
    );
  }

  await assertNoSymlinks(distDirectory);
  for (const file of [
    "runner/index.html",
    "runner/game.js",
    "runner/THREE-LICENSE.txt",
  ]) {
    const stats = await lstat(path.join(distDirectory, file));
    if (!stats.isFile() || stats.size === 0)
      throw new Error(`Missing runner artifact: ${file}`);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await verifyDist();
}
