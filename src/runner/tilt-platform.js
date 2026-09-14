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
