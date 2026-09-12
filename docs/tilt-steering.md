# Optional tilt steering

The sensor adapter in `src/runner/tilt.js` is implemented but is not yet wired
into the published controls. It requests orientation permission only when its
enable method is called, calibrates relative to the first valid held angle,
smooths readings over 80 ms and uses 14-degree activation / 5-degree rearm
thresholds. One lean changes one lane; holding a lean cannot repeatedly steer.
Portrait rotation is supported; landscape readings suspend steering and require
a fresh reference on return. Sensor data is neither stored nor transmitted.

Five tests cover jitter, neutral rearming, permission denial, cancellation during
a pending permission request, missing readings, invalid data and rotation.
All 410 tests plus build, lint and distribution checks passed.

Next acceptance work: accessible enable/disable/recalibrate controls, explicit
gesture precedence, no accidental corner turns, pause/background lifecycle,
permission-flow browser checks and real sensor validation. These tests use
synthetic sensor readings and do not establish physical gyroscope behavior.

Browser requirement reference:
[MDN orientation permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
Where implemented, permission requests require a secure context and direct user
activation. API availability alone does not prove that a device emits readings.
