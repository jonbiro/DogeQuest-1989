# Optional tilt steering

The sensor adapter in `src/runner/tilt.js` is now connected to optional controls
in Help and Pause. It requests orientation permission only when its
enable method is called, calibrates relative to the first valid held angle,
smooths readings over 80 ms and uses 14-degree activation / 5-degree rearm
thresholds. One lean changes one lane; holding a lean cannot repeatedly steer.
Portrait rotation is supported; landscape readings suspend steering and require
a fresh reference on return. Sensor data is neither stored nor transmitted.

Five tests cover jitter, neutral rearming, permission denial, cancellation during
a pending permission request, missing readings, invalid data and rotation.
All 410 tests plus build, lint and distribution checks passed.

Enable/off/recalibrate controls are wired. Direct pointer/keyboard input and state
changes recalibrate the neutral hold. Steering is suppressed outside active play,
in hidden documents and during corner prompts; corners still require a swipe or
button. Settings are session-only, with no automatic permission requests on load.
Portrait 390 × 844 browser inspection confirmed the controls and denied-access
fallback, without interrupting ordinary touch controls. Two UI-controller tests
cover toggling, recalibration, suppressed input and denial retry.

Remaining acceptance work: physical sensor validation, orientation edge cases,
sensitivity tuning, and real-time movement arbitration. These tests use
synthetic sensor readings and do not establish physical gyroscope behavior.

Sensor gaps longer than 500 ms, reversed timestamps and portrait-angle changes
now reset the neutral reference before accepting a new lean. This prevents stale
movement after background throttling and supports portrait inversion even if the
legacy orientation-change event is absent. Explicit recalibration also starts a
fresh four-second availability timeout, so missing readings cannot leave the
interface indefinitely asking the player to hold steady. Three added regressions
cover resumed streams, inversion and recalibration timeout. All 415 tests plus
build, lint and distribution checks passed; real-device behavior remains unproven.

Browser requirement reference:
[MDN orientation permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
Where implemented, permission requests require a secure context and direct user
activation. API availability alone does not prove that a device emits readings.
