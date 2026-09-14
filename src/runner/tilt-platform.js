// Tilt is a phone/tablet affordance, not a desktop control.  Keep the check
// deliberately conservative: a coarse pointer alone also matches touch-screen
// laptops, while those devices should keep the desktop keyboard/swipe layout.
export function supportsMobileTilt(host = globalThis) {
  const coarse = host.matchMedia?.('(pointer: coarse)')?.matches === true;
  if (!coarse) return false;
  const navigator = host.navigator ?? {};
  const userAgent = `${navigator.userAgent ?? ''} ${navigator.userAgentData?.platform ?? ''}`;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(userAgent);
  // iPadOS can present a desktop-style Macintosh user agent while still being
  // a touch tablet. A Mac with no touch points remains a desktop and is off.
  const touchMac = /Macintosh|MacIntel/i.test(userAgent) && Number(navigator.maxTouchPoints) > 1;
  return mobileUserAgent || touchMac;
}

// Touch guidance is useful even when motion sensors are unavailable, denied,
// or intentionally disabled. Keep this broader than supportsMobileTilt so a
// touch laptop, an iPad in desktop-UA mode, and a phone with sensor permission
// turned off still get the tap-first lesson and touch feedback.
export function supportsTouchControls(host = globalThis) {
  const coarse = host.matchMedia?.('(pointer: coarse)')?.matches === true;
  const navigator = host.navigator ?? {};
  return coarse || Number(navigator.maxTouchPoints) > 0 || 'ontouchstart' in host;
}

export function noTiltController() {
  return {
    enable: async () => false,
    stop() {},
    recalibrate() {},
    setSensitivity: () => false,
    yieldToTouch() {},
    isRequesting: () => false,
    enableDefault() {},
  };
}
