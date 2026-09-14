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
    // Keep the optional sensor adapter out of the desktop download. The
    // runtime imports it only after the coarse-pointer/mobile capability
    // check, so desktop never fetches or parses motion APIs.
    external: ["./tilt-controls.js"],
    minify: true,
    format: "esm",
    target: ["es2022"],
    legalComments: "linked",
  });
  await bundle({
    entryPoints: [path.join(projectRoot, "src/runner/tilt-controls.js")],
    outfile: path.join(distDirectory, "runner/tilt-controls.js"),
    bundle: true,
    minify: true,
    format: "esm",
    target: ["es2022"],
    // This module is first-party and intentionally has no third-party legal
    // notices; avoid emitting a second sidecar for the tiny opt-in bundle.
    legalComments: "none",
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
  const assets=[];
  // Cache the illustrated puppies with the shell so a first offline run does
  // not fall back to a missing texture after the game has been installed.
  for(const file of [
    'index.html',
    'game.js',
    'tilt-controls.js',
    'style.css',
    '../favicon.svg',
    'puppies/biscuit.webp',
    'puppies/biscuit-run-front.webp',
    'puppies/biscuit-run-alt.webp',
    'puppies/biscuit-jump.webp',
    'puppies/biscuit-jump-alt.webp',
    'puppies/biscuit-slide.webp',
    'puppies/biscuit-slide-alt.webp',
    'puppies/biscuit-turn.webp',
    'puppies/biscuit-turn-alt.webp',
    'puppies/biscuit-hang.webp',
    'puppies/biscuit-hang-alt.webp',
    'puppies/biscuit-raft.webp',
    'puppies/mochi.webp',
    'puppies/mochi-run-side.webp',
    'puppies/mochi-run-side-alt.webp',
    'puppies/mochi-jump.webp',
    'puppies/mochi-jump-alt.webp',
    'puppies/mochi-slide.webp',
    'puppies/mochi-slide-alt.webp',
    'puppies/mochi-turn.webp',
    'puppies/mochi-turn-alt.webp',
    'puppies/mochi-hang.webp',
    'puppies/mochi-hang-alt.webp',
    'puppies/mochi-away.webp',
    'puppies/mochi-raft.webp',
    'puppies/pepper.webp',
    'puppies/pepper-run-front.webp',
    'puppies/pepper-run-alt.webp',
    'puppies/pepper-jump.webp',
    'puppies/pepper-jump-alt.webp',
    'puppies/pepper-slide.webp',
    'puppies/pepper-slide-alt.webp',
    'puppies/pepper-turn.webp',
    'puppies/pepper-turn-alt.webp',
    'puppies/pepper-hang.webp',
    'puppies/pepper-hang-alt.webp',
    'puppies/pepper-raft.webp',
    'puppies/luna.webp',
    'puppies/luna-run-front.webp',
    'puppies/luna-run-alt.webp',
    'puppies/luna-jump.webp',
    'puppies/luna-jump-alt.webp',
    'puppies/luna-slide.webp',
    'puppies/luna-slide-alt.webp',
    'puppies/luna-turn.webp',
    'puppies/luna-turn-alt.webp',
    'puppies/luna-hang.webp',
    'puppies/luna-hang-alt.webp',
    'puppies/luna-raft.webp',
  ]) {
    const sha256=createHash('sha256').update(await readFile(path.join(distDirectory,'runner',file))).digest('hex');
    const url=['game.js','style.css'].includes(file)?`${file}?v=${sha256.slice(0,16)}`:file;
    assets.push({url,sha256});
  }
  const template=await readFile(path.join(projectRoot,'src/runner/offline-worker.js'),'utf8');
  const version=createHash('sha256').update(JSON.stringify(assets)+template).digest('hex').slice(0,20);
  await writeFile(path.join(distDirectory,'runner/offline-worker.js'),template.replace('/* build:assets */ []',JSON.stringify(assets)).replace('build:version',version));
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await build();
}
