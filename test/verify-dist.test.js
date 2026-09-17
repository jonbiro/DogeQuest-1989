import test from 'node:test';
import assert from 'node:assert/strict';
import {puppyAssetParityError} from '../scripts/verify-dist.js';
import {PUPPY_ASSET_FILES} from '../scripts/build.js';

const exact = ['biscuit.webp', 'mochi.webp', 'mochi-away-v3.webp'];

test('the release allowlist keeps superseded puppy paintings out of dist', () => {
  assert.ok(PUPPY_ASSET_FILES.includes('puppies/mochi-away-v3.webp'));
  for (const orphan of ['puppies/mochi-away.webp', 'puppies/mochi-away-alt.webp', 'puppies/mochi-run-front.webp']) {
    assert.ok(!PUPPY_ASSET_FILES.includes(orphan), `${orphan} should stay source-only`);
  }
});

test('puppy parity accepts a source, dist and offline manifest with the same files', () => {
  assert.equal(puppyAssetParityError({
    sourceAssets: new Set(exact),
    distAssets: new Set(exact),
    manifestAssets: new Set(exact),
  }), null);
});

test('puppy parity rejects an orphan copied into dist or omitted from the manifest', () => {
  const error = puppyAssetParityError({
    sourceAssets: new Set(exact),
    distAssets: new Set([...exact, 'mochi-away.webp']),
    manifestAssets: new Set(exact),
  });
  assert.match(error, /Puppy asset parity mismatch/);
  assert.match(error, /dist .*unexpected \[mochi-away\.webp\]/);
});

test('puppy parity rejects a source painting missing from the generated release', () => {
  const error = puppyAssetParityError({
    sourceAssets: new Set([...exact, 'mochi-away-v3-alt.webp']),
    distAssets: new Set(exact),
    manifestAssets: new Set(exact),
  });
  assert.match(error, /dist .*missing \[mochi-away-v3-alt\.webp\]/);
  assert.match(error, /offline manifest .*missing \[mochi-away-v3-alt\.webp\]/);
});
