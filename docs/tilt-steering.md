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

Enable/off/recalibrate controls are wired. State changes recalibrate the neutral
hold. Direct pointer/keyboard input instead suppresses tilt for 350 ms and requires
returning to the original neutral hold before rearming. This avoids shifting the
center when a player taps Jump while leaning. Steering is suppressed outside active play,
in hidden documents and during corner prompts; corners still require a swipe or
button. Tilt enablement remains session-only, with no automatic permission
requests on load. Sensitivity now persists in local preferences and portable
backups; restoring it configures the adapter without enabling sensors. Invalid
or older preferences default to Balanced. Full checks passed 453 tests, followed
by focused backup tests with a non-default Steady preference.
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

Tilt response now offers Gentle (9 degrees), Balanced (14) and Steady (20).
Each preset retains proportional neutral hysteresis and changing it recalibrates
without generating a lane change. These are starting presets, not physically
validated ergonomic recommendations. The setting lasts for the current visit.
The 320 × 568 browser check verified selection and a 44 px touch target after
correcting the bundled stylesheet. All 416 tests passed before the CSS-only fix;
the final stylesheet rebuild and distribution/lint checks were rerun.

Two further sensor regressions verify that touch cannot shift neutral or allow an
immediate competing tilt action. All 418 tests and full checks passed after this
input-arbitration correction. Physical combined tilt/touch feel remains unverified.

## Native Safari permission check

On the dedicated iOS 27 simulator `A684C311-2581-42FF-8F83-9E38506B11B5`,
Safari rendered the current Help panel and sensitivity controls. Enable tilt
opened the native localhost motion/orientation permission prompt. After Allow,
no usable readings arrived and the four-second timeout correctly displayed
“Motion sensors are unavailable. Use swipes or buttons.” Enable remained usable
and Recalibrate disabled. This proves the permission/availability fallback, not
physical gyroscope steering or sustained rendering performance.

Local screenshot: `test-results/tilt-native-safari-fallback.png`. The scoped
simulator mirror was disconnected after capture; the other project's simulator
was not controlled. The existing 200-point simulator profile was not changed.

[MDN orientation permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
Where implemented, permission requests require a secure context and direct user
activation. API availability alone does not prove that a device emits readings.
