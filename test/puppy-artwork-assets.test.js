import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import path from 'node:path';
import {
  PUPPY_ARTWORK_ALTERNATES,
  PUPPY_ARTWORK_BOUNDS,
  PUPPY_ARTWORK_VARIANTS,
} from '../src/runner/puppy-artwork.js';

const artworkDirectory = fileURLToPath(new URL('../runner/puppies/', import.meta.url));

function webpInfo(buffer, filename) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF', `${filename} is not a RIFF WebP`);
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP', `${filename} is not a WebP`);

  let offset = 12;
  let width = 0;
  let height = 0;
  let hasAlpha = false;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + size;
    assert.ok(end <= buffer.length, `${filename} has a truncated ${type} chunk`);
    if (type === 'VP8X') {
      assert.ok(size >= 10, `${filename} has an incomplete VP8X chunk`);
      const flags = buffer[start];
      hasAlpha = Boolean(flags & 0x10);
      width = 1 + buffer[start + 4] + (buffer[start + 5] << 8) + (buffer[start + 6] << 16);
      height = 1 + buffer[start + 7] + (buffer[start + 8] << 8) + (buffer[start + 9] << 16);
    }
    offset = end + (size & 1);
  }
  assert.ok(width > 0 && height > 0, `${filename} is missing an extended WebP canvas`);
  return { width, height, hasAlpha };
}

function manifestEntries() {
  const entries = [];
  for (const [puppy, poses] of Object.entries(PUPPY_ARTWORK_VARIANTS)) {
    for (const [pose, url] of Object.entries(poses)) entries.push({ puppy, pose, url });
  }
  for (const [puppy, poses] of Object.entries(PUPPY_ARTWORK_ALTERNATES)) {
    for (const [pose, url] of Object.entries(poses)) entries.push({ puppy, pose: `${pose}Alt`, url });
  }
  return entries;
}

test('every authored puppy pose is a transparent, dimensioned WebP in the source manifest', async () => {
  const entries = manifestEntries();
  const actualFiles = new Set((await readdir(artworkDirectory)).filter(file => file.endsWith('.webp')));
  assert.ok(actualFiles.size > 0, 'puppy artwork directory is empty');

  for (const entry of entries) {
    const filename = path.basename(entry.url);
    assert.ok(actualFiles.has(filename), `${filename} is missing from the puppy artwork directory`);
    const buffer = await readFile(path.join(artworkDirectory, filename));
    const info = webpInfo(buffer, filename);
    assert.equal(info.hasAlpha, true, `${filename} must retain transparency around the puppy`);
    const bounds = PUPPY_ARTWORK_BOUNDS[entry.puppy]?.[entry.pose];
    assert.ok(bounds, `${entry.puppy} ${entry.pose} is missing measured alpha bounds`);
    assert.equal(info.width, bounds.width, `${filename} width no longer matches measured bounds`);
    assert.equal(info.height, bounds.height, `${filename} height no longer matches measured bounds`);
    assert.ok(bounds.boxWidth > 0 && bounds.boxHeight > 0, `${filename} has an empty visible bounds contract`);
    assert.ok(bounds.x >= 0 && bounds.y >= 0, `${filename} bounds start outside the canvas`);
    assert.ok(bounds.x + bounds.boxWidth <= bounds.width, `${filename} bounds exceed canvas width`);
    assert.ok(bounds.y + bounds.boxHeight <= bounds.height, `${filename} bounds exceed canvas height`);
  }
});
