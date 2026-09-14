// Every route into the recovery screen used to print the same "this device
// needs a clean 3D start" copy, because the frame loop's catch discarded the
// error and called one no-argument graphicsError(). That made a script bug
// indistinguishable from a real GPU eviction, and told a player to close other
// 3D tabs for a failure that had nothing to do with their phone.
//
// A failure now carries its cause. Browser-reported context loss keeps the
// context-specific advice; a thrown exception says so plainly and shows what
// threw, so a player can report it instead of relaunching their browser for no
// reason.

export const GRAPHICS_FAILURES = Object.freeze({
  // The renderer could not be created at all: no WebGL2, or the driver refused.
  'no-context': 'startup',
  // The canvas reported webglcontextlost and never came back in time.
  'context-lost': 'context',
  // Shader/program preparation failed after startup or a restored context.
  'prepare-error': 'renderer',
  'restore-error': 'renderer',
  // view.draw() threw while the context was still healthy.
  'render-error': 'runtime',
  // Something outside the draw call threw inside the animation frame.
  'frame-error': 'runtime',
  // A direct touch, keyboard, or tilt action threw before the next frame.
  'input-error': 'input',
  // A non-frame path (the illustrated how-to-play images) threw.
  'asset-error': 'asset',
  // A browser-level error escaped a local handler. Keep this neutral because
  // an ErrorEvent does not prove whether the source was the game or browser.
  'unhandled-error': 'unknown',
  'unhandled-rejection': 'unknown',
});

export function graphicsFailureKind(reason) {
  return GRAPHICS_FAILURES[reason] || 'unknown';
}

// A one-line, screenshot-friendly summary. Kept short and free of stack frames
// so it reads as a reference code rather than a crash dump, and truncated so a
// pathological message cannot push the recovery buttons off a phone screen.
export function graphicsDiagnostic(reason, error, limit = 160) {
  const label = typeof reason === 'string' && reason ? reason : 'unknown';
  const message = errorMessage(error);
  const action = typeof error?.lastInput?.action === 'string' ? error.lastInput.action : '';
  const input = action ? ` after ${action}` : '';
  const line = message ? `${label}${input} · ${message}` : `${label}${input}`;
  return line.length > limit ? `${line.slice(0, limit - 1)}…` : line;
}

function errorMessage(error) {
  if (!error) return '';
  if (typeof error === 'string') return collapse(error);
  // Context-loss records keep the browser event metadata alongside the
  // original exception. Prefer that exception for the name/message/location,
  // while retaining the event's status text when it is the only clue.
  const nested = error.error && typeof error.error === 'object' && error.error !== error
    ? error.error : null;
  const source = nested || error;
  const name = typeof source.name === 'string' ? source.name : '';
  const message = typeof source.message === 'string' ? source.message : '';
  const status = typeof error.statusMessage === 'string' ? error.statusMessage
    : typeof source.statusMessage === 'string' ? source.statusMessage : '';
  const eventMessage = typeof error.reason === 'string' ? error.reason
    : typeof source.reason === 'string' ? source.reason : '';
  const where = locationOf(source);
  const head = [name, message, status, eventMessage].filter(Boolean).join(': ')
    || collapse(String(source));
  return collapse(where ? `${head} (${where})` : head);
}

function locationOf(error) {
  // Only the innermost frame is useful here, and only its file and line.
  const stack = typeof error.stack === 'string' ? error.stack : '';
  const match = stack.match(/([\w.-]+\.(?:js|mjs|html)):(\d+)(?::(\d+))?/);
  if (match) return `${match[1]}:${match[2]}`;
  const fileName = typeof error.fileName === 'string' ? error.fileName
    : typeof error.filename === 'string' ? error.filename : '';
  const file = fileName ? fileName.split('/').pop() : '';
  const rawLine = Number.isFinite(error.lineNumber) ? error.lineNumber : error.lineno;
  const line = Number.isFinite(rawLine) ? rawLine : null;
  return file && line !== null ? `${file}:${line}` : '';
}

function collapse(value) {
  return String(value).replace(/\s+/g, ' ').trim();
}

// The copy for a failure. Keep the category explicit: a reported context loss
// is not the same thing as a missing WebGL2 context, and neither is evidence
// that the phone ran out of RAM. The app adds the saved-reward details.
export function graphicsFailureCopy(reason, {mobile = false} = {}) {
  const kind = graphicsFailureKind(reason);
  if (kind === 'context') {
    return {
      title: 'The browser reported a lost 3D context.',
      lead: 'The canvas reported webglcontextlost while the trail was running. That identifies a graphics-session interruption; it does not prove the phone ran out of RAM.',
      help: 'context',
    };
  }
  if (kind === 'startup') {
    return {
      title: mobile ? '3D could not start on this device.' : '3D could not start in this browser.',
      lead: 'The renderer could not create the WebGL2 context required by the full trail.',
      help: mobile ? 'mobile' : 'desktop',
    };
  }
  if (kind === 'renderer') {
    return {
      title: 'The 3D renderer could not finish preparing.',
      lead: 'The renderer failed during shader preparation or recovery. This screen does not infer a RAM or device problem from that error.',
      help: 'restart',
    };
  }
  if (kind === 'runtime' || kind === 'input' || kind === 'asset') {
    return {
      title: 'The trail hit an unexpected snag.',
      lead: 'The diagnostic below identifies a game/runtime failure. It is not evidence that your phone ran out of RAM.',
      help: 'restart',
    };
  }
  return {
    title: 'The trail stopped unexpectedly.',
    lead: 'The browser did not provide enough detail to classify the failure. The diagnostic below is the evidence available from this run.',
    help: 'restart',
  };
}
