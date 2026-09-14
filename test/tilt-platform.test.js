import test from 'node:test';
import assert from 'node:assert/strict';
import { noTiltController, supportsMobileTilt, supportsTouchControls } from '../src/runner/tilt-platform.js';

function host({coarse, userAgent = 'Mozilla/5.0', platform = '', maxTouchPoints = 0}) {
  return {
    matchMedia: () => ({ matches: coarse }),
    navigator: { userAgent, userAgentData: { platform }, maxTouchPoints },
  };
}

test('tilt is available only to coarse-pointer mobile browsers', () => {
  assert.equal(supportsMobileTilt(host({coarse: false, userAgent: 'Mozilla/5.0 (iPhone)'})), false);
  assert.equal(supportsMobileTilt(host({coarse: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})), false);
  assert.equal(supportsMobileTilt(host({coarse: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'})), true);
  assert.equal(supportsMobileTilt(host({coarse: true, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', platform: 'MacIntel', maxTouchPoints: 5})), true);
});

test('touch guidance stays available without motion-sensor eligibility', () => {
  assert.equal(supportsTouchControls(host({coarse: true, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})), true);
  assert.equal(supportsTouchControls(host({coarse: false, maxTouchPoints: 5})), true);
  assert.equal(supportsTouchControls(host({coarse: false})), false);
});

test('desktop no-tilt controller cannot request sensors or report activity', async () => {
  const tilt = noTiltController();
  assert.equal(await tilt.enable(), false);
  assert.equal(tilt.isRequesting(), false);
  assert.equal(tilt.setSensitivity('balanced'), false);
  tilt.enableDefault();
  tilt.recalibrate();
  tilt.yieldToTouch();
  tilt.stop();
});
