import test from 'node:test';
import assert from 'node:assert/strict';
import {puppyAssetParityError} from '../scripts/verify-dist.js';

const exact = ['biscuit.webp', 'mochi.webp', 'mochi-away-v2.webp'];

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
    sourceAssets: new Set([...exact, 'mochi-away-v2-alt.webp']),
    distAssets: new Set(exact),
    manifestAssets: new Set(exact),
  });
  assert.match(error, /dist .*missing \[mochi-away-v2-alt\.webp\]/);
  assert.match(error, /offline manifest .*missing \[mochi-away-v2-alt\.webp\]/);
});
