import { lstat, readdir, readFile } from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allowedEntries, distDirectory, projectRoot } from "./build.js";

const puppyReferencePattern = /(?:\.\/)?puppies\/([a-z0-9-]+\.webp)\b/gi;

export function puppyAssetParityError({ sourceAssets, distAssets, manifestAssets }) {
  const expected = [...sourceAssets].sort();
  const mismatches = [];
  for (const [label, actualSet] of [
    ["dist", distAssets],
    ["offline manifest", manifestAssets],
  ]) {
    const actual = [...actualSet].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      const missing = expected.filter(asset => !actualSet.has(asset));
      const unexpected = actual.filter(asset => !sourceAssets.has(asset));
      mismatches.push(`${label} missing [${missing.join(", ")}] unexpected [${unexpected.join(", ")}]`);
    }
  }
  return mismatches.length
    ? `Puppy asset parity mismatch: ${mismatches.join("; ")}`
    : null;
}

async function sourcePuppyAssets() {
  const assets = new Set();
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (/\.(?:css|html|js|json)$/.test(entry.name)) {
        const contents = await readFile(entryPath, "utf8");
        for (const match of contents.matchAll(puppyReferencePattern)) assets.add(match[1]);
      }
    }
  }
  await walk(path.join(projectRoot, "src"));
  return assets;
}

async function verifyPuppyAssetParity() {
  const puppyDirectory = path.join(distDirectory, "runner", "puppies");
  const distAssets = new Set((await readdir(puppyDirectory)).filter(file => file.endsWith(".webp")));
  const worker = await readFile(path.join(distDirectory, "runner", "offline-worker.js"), "utf8");
  const match = worker.match(/const ASSETS = (\[[\s\S]*?\]);/);
  if (!match) throw new Error("Offline worker is missing its generated asset manifest.");
  const manifestAssets = new Set(
    JSON.parse(match[1])
      .map(asset => asset.url.split("?")[0])
      .filter(url => url.startsWith("puppies/"))
      .map(url => path.basename(url)),
  );
  const error = puppyAssetParityError({
    sourceAssets: await sourcePuppyAssets(),
    distAssets,
    manifestAssets,
  });
  if (error) throw new Error(error);
}

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
  const runnerEntries=await readdir(path.join(distDirectory,"runner"));
  for(const file of ["qa.js","recovery.html","recovery-init.js"])
    if(runnerEntries.includes(file))throw new Error(`Local QA artifact must not ship: ${file}`);
  await verifyPuppyAssetParity();
  const runnerHtml=await readFile(path.join(distDirectory,"runner/index.html"),"utf8");
  for(const asset of ["game.js","style.css"]) {
    const contents=await readFile(path.join(distDirectory,"runner",asset));
    const hash=createHash("sha256").update(contents).digest("hex").slice(0,16);
    if(!runnerHtml.includes(`"${asset}?v=${hash}"`))throw new Error(`Stale runner asset reference: ${asset}`);
    if(asset==="style.css" && contents.toString().includes("@import"))throw new Error("Runner styles must be bundled for cache versioning");
  }
  for (const file of [
    "runner/index.html",
    "runner/game.js",
    "runner/tilt-controls.js",
    "runner/THREE-LICENSE.txt",
    "runner/offline-worker.js",
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
