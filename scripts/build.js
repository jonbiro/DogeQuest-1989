import { copyFile, lstat, mkdir, readdir, rm, readFile, writeFile } from "node:fs/promises";
import {createHash} from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as bundle } from "esbuild";

export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const distDirectory = path.join(projectRoot, "dist");
export const allowedEntries = [
  "index.html",
  "css.css",
  "favicon.svg",
  "site.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "src",
  "runner",
];

function assertSafeDistDirectory() {
  if (
    path.basename(distDirectory) !== "dist" ||
    path.dirname(distDirectory) !== projectRoot
  ) {
    throw new Error("Refusing to clean an unexpected build directory.");
  }
}

async function copyEntry(source, destination) {
  const entry = await lstat(source);

  if (entry.isSymbolicLink()) {
    throw new Error(
      `Refusing to copy symbolic link: ${path.relative(projectRoot, source)}`,
    );
  }

  if (entry.isDirectory()) {
    await mkdir(destination, { recursive: true });
    for (const child of await readdir(source)) {
      await copyEntry(path.join(source, child), path.join(destination, child));
    }
    return;
  }

  if (!entry.isFile()) {
    throw new Error(
      `Refusing to copy unsupported file: ${path.relative(projectRoot, source)}`,
    );
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
  await bundle({
    entryPoints: [path.join(projectRoot, "src/runner/app.js")],
    outfile: path.join(distDirectory, "runner/game.js"),
    bundle: true,
    minify: true,
    format: "esm",
    target: ["es2022"],
    legalComments: "linked",
  });
  await copyFile(
    path.join(projectRoot, "node_modules/three/LICENSE"),
    path.join(distDirectory, "runner/THREE-LICENSE.txt"),
  );
  await bundle({entryPoints:[path.join(projectRoot,"src/runner/ui.css")],outfile:path.join(distDirectory,"runner/style.css"),bundle:true,minify:true});
  const htmlPath=path.join(distDirectory,"runner/index.html");
  let html=await readFile(htmlPath,"utf8");
  for(const asset of ["game.js","style.css"]) {
    const hash=createHash("sha256").update(await readFile(path.join(distDirectory,"runner",asset))).digest("hex").slice(0,16);
    html=html.replace(`"${asset}"`,`"${asset}?v=${hash}"`);
  }
  await writeFile(htmlPath,html);
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await build();
}
